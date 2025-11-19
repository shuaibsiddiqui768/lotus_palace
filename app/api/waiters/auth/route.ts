import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import connectDB from '@/lib/mongodb';
import Waiter from '@/models/Waiter';

const SALT_LENGTH = 16;
const PBKDF2_ITERATIONS = 100000;
const PBKDF2_KEY_LENGTH = 64;
const PBKDF2_DIGEST = 'sha512';

function sanitizeWaiter(waiter: any) {
  if (!waiter) {
    return null;
  }
  const plain = typeof waiter.toObject === 'function' ? waiter.toObject() : { ...waiter };
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
  const storedView = new Uint8Array(storedBuffer);
  const derivedView = new Uint8Array(derivedKey);
  return crypto.timingSafeEqual(storedView, derivedView);
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const mode = body.mode?.toString().toLowerCase() || 'login';

    if (mode === 'register') {
      // Waiter registration
      const name = body.name?.toString().trim();
      const email = body.email?.toString().trim().toLowerCase();
      const password = body.password?.toString();
      const employeeId = body.employeeId?.toString().trim();
      const phone = body.phone?.toString().trim();

      if (!name || !email || !password) {
        return NextResponse.json(
          {
            success: false,
            message: 'Missing required fields: name, email, and password are required',
          },
          { status: 400 }
        );
      }

      // Check if waiter already exists
      const orConditions: any[] = [{ email }];
      if (employeeId) {
        orConditions.push({ employeeId });
      }
      const existingWaiter = await Waiter.findOne({
        $or: orConditions,
      });

      if (existingWaiter) {
        return NextResponse.json(
          {
            success: false,
            message: 'Waiter already exists with this email or employee ID',
          },
          { status: 409 }
        );
      }

      const passwordHash = await hashPassword(password);
      const createdWaiter = await Waiter.create({
        name,
        email,
        passwordHash,
        employeeId,
        phone,
        isActive: true,
      });

      return NextResponse.json(
        {
          success: true,
          message: 'Waiter created successfully',
          data: sanitizeWaiter(createdWaiter),
        },
        { status: 201 }
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

      let waiter = await Waiter.findOne({ email, isActive: true }).select('+passwordHash');

      // If no waiter exists and this is the default credentials, create the default waiter
      if (!waiter && email === 'waiter@example.com' && password === 'password123') {
        const passwordHash = await hashPassword(password);
        waiter = await Waiter.create({
          name: 'Default Waiter',
          email: 'waiter@example.com',
          passwordHash,
          employeeId: 'W001',
          phone: '+1234567890',
          isActive: true,
        });
      }

      if (!waiter || !waiter.passwordHash) {
        return NextResponse.json(
          {
            success: false,
            message: 'Invalid credentials',
          },
          { status: 401 }
        );
      }

      const isValid = await verifyPassword(password, waiter.passwordHash);

      if (!isValid) {
        return NextResponse.json(
          {
            success: false,
            message: 'Invalid credentials',
          },
          { status: 401 }
        );
      }

      // Update last login
      await Waiter.findByIdAndUpdate(waiter._id, { lastLogin: new Date() });

      return NextResponse.json(
        {
          success: true,
          message: 'Login successful',
          data: sanitizeWaiter(waiter),
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

    const waiters = await Waiter.find(filter).sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      count: waiters.length,
      data: waiters.map(sanitizeWaiter),
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to fetch waiters',
      },
      { status: 500 }
    );
  }
}