import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import connectDB from '@/lib/mongodb';
import Admin from '@/models/Admin';

const SALT_LENGTH = 16;
const PBKDF2_ITERATIONS = 100000;
const PBKDF2_KEY_LENGTH = 64;
const PBKDF2_DIGEST = 'sha512';

const JWT_EXPIRATION_SECONDS = 60 * 60 * 4;

type JwtPayload = {
  sub: string;
  email?: string;
  role?: string;
  name?: string;
  iat: number;
  exp: number;
};

function toBase64Url(input: Buffer) {
  return input.toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function fromBase64Url(value: string) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padding = normalized.length % 4;
  const padded = padding === 0 ? normalized : normalized + '='.repeat(4 - padding);
  return Buffer.from(padded, 'base64');
}

function getJwtSecret() {
  // Removed dependency on environment JWT secret.
  // Tokens will be unsigned (alg: "none"), so no secret is required.
  return '';
}

function createJwtSignature(unsignedToken: string, secret: string) {
  // No signature when JWT secret is removed.
  // Keep function as a no-op to avoid changing other call sites.
  return '';
}

function createJwtToken(admin: any) {
  const header = { alg: 'none', typ: 'JWT' };
  const issuedAt = Math.floor(Date.now() / 1000);
  const payload: JwtPayload = {
    sub: admin._id?.toString() || '',
    email: admin.email,
    role: admin.role,
    name: admin.name,
    iat: issuedAt,
    exp: issuedAt + JWT_EXPIRATION_SECONDS,
  };
  const headerPart = toBase64Url(Buffer.from(JSON.stringify(header)));
  const payloadPart = toBase64Url(Buffer.from(JSON.stringify(payload)));
  const unsigned = `${headerPart}.${payloadPart}`;
  // Return unsigned token (two segments)
  return {
    token: unsigned,
    payload,
  };
}

function verifyJwtToken(token: string): JwtPayload | null {
  try {
    const segments = token.split('.');
    // Accept tokens with at least header.payload
    if (segments.length < 2) {
      return null;
    }
    const [, payloadPart] = segments;
    const payload = JSON.parse(fromBase64Url(payloadPart).toString('utf8')) as JwtPayload;
    if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

function sanitizeAdmin(admin: any) {
  if (!admin) {
    return null;
  }
  const plain = typeof admin.toObject === 'function' ? admin.toObject() : { ...admin };
  delete plain.passwordHash;
  return plain;
}

function deriveKey(password: string, salt: string) {
  return new Promise<Buffer>((resolve, reject) => {
    crypto.pbkdf2(password, salt, PBKDF2_ITERATIONS, PBKDF2_KEY_LENGTH, PBKDF2_DIGEST, (error, derivedKey) => {
      if (error) {
        reject(error);
      } else {
        resolve(derivedKey);
      }
    });
  });
}

async function hashPassword(password: string) {
  const salt = crypto.randomBytes(SALT_LENGTH).toString('hex');
  const derivedKey = await deriveKey(password, salt);
  return `${salt}:${derivedKey.toString('hex')}`;
}

async function verifyPassword(password: string, storedHash: string) {
  const [salt, storedKey] = storedHash.split(':');
  if (!salt || !storedKey) {
    return false;
  }
  const derivedKey = await deriveKey(password, salt);
  const storedBuffer = Buffer.from(storedKey, 'hex');
  if (storedBuffer.length !== derivedKey.length) {
    return false;
  }
  return crypto.timingSafeEqual(storedBuffer, derivedKey);
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const mode = body.mode?.toString().toLowerCase() || 'login';

    if (mode === 'register') {
      // Check if any admin already exists - only allow registration if no admins exist
      const adminCount = await Admin.countDocuments();
      if (adminCount > 0) {
        return NextResponse.json(
          {
            success: false,
            message: 'Admin registration not allowed. Contact existing admin.',
          },
          { status: 403 }
        );
      }

      // Admin registration (initial setup only)
      const username = body.username?.toString().trim().toLowerCase();
      const password = body.password?.toString();
      const name = body.name?.toString().trim();
      const email = body.email?.toString().trim().toLowerCase();
      const role = 'superadmin'; // First admin is always superadmin

      if (!username || !password || !name || !email) {
        return NextResponse.json(
          {
            success: false,
            message: 'Missing required fields',
          },
          { status: 400 }
        );
      }

      // Check if admin already exists
      const existingAdmin = await Admin.findOne({
        $or: [{ username }, { email }],
      });

      if (existingAdmin) {
        return NextResponse.json(
          {
            success: false,
            message: 'Admin already exists',
          },
          { status: 409 }
        );
      }

      const passwordHash = await hashPassword(password);
      const createdAdmin = await Admin.create({
        username,
        email,
        name,
        passwordHash,
        role,
        isActive: true,
      });

      return NextResponse.json(
        {
          success: true,
          message: 'Admin created successfully',
          data: sanitizeAdmin(createdAdmin),
        },
        { status: 201 }
      );
    }

    if (mode === 'verify') {
      const token = body.token?.toString();
      if (!token) {
        return NextResponse.json(
          {
            success: false,
            message: 'Missing token',
          },
          { status: 400 }
        );
      }

      const payload = verifyJwtToken(token);

      if (!payload?.sub) {
        return NextResponse.json(
          {
            success: false,
            message: 'Invalid token',
          },
          { status: 401 }
        );
      }

      const admin = await Admin.findOne({ _id: payload.sub, isActive: true });

      if (!admin) {
        return NextResponse.json(
          {
            success: false,
            message: 'Invalid token',
          },
          { status: 401 }
        );
      }

      return NextResponse.json(
        {
          success: true,
          message: 'Token valid',
          data: {
            admin: sanitizeAdmin(admin),
            expiresAt: payload.exp,
          },
        },
        { status: 200 }
      );
    }

    if (mode === 'login') {
      const email = body.email?.toString().trim().toLowerCase();
      const password = body.password?.toString();

      if (!email || !password) {
        return NextResponse.json(
          {
            success: false,
            message: 'Missing credentials',
          },
          { status: 400 }
        );
      }

      const admin = await Admin.findOne({ email, isActive: true }).select('+passwordHash');

      if (!admin || !admin.passwordHash) {
        return NextResponse.json(
          {
            success: false,
            message: 'Invalid credentials',
          },
          { status: 401 }
        );
      }

      const isValid = await verifyPassword(password, admin.passwordHash);

      if (!isValid) {
        return NextResponse.json(
          {
            success: false,
            message: 'Invalid credentials',
          },
          { status: 401 }
        );
      }

      await Admin.findByIdAndUpdate(admin._id, { lastLogin: new Date() });

      const { token, payload } = createJwtToken(admin);

      return NextResponse.json(
        {
          success: true,
          message: 'Login successful',
          data: {
            admin: sanitizeAdmin(admin),
            token,
            expiresAt: payload.exp,
          },
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: 'Unsupported operation',
      },
      { status: 400 }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to process request',
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const id = searchParams.get('id');

    const filter: any = { isActive: true };
    if (email) {
      filter.email = email.toLowerCase();
    }
    if (id) {
      filter._id = id;
    }

    const admins = await Admin.find(filter).sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      count: admins.length,
      data: admins.map(sanitizeAdmin),
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to fetch admins',
      },
      { status: 500 }
    );
  }
}