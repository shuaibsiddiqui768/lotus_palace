import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Order from '@/models/Order';
import Table from '@/models/Table';

const SALT_LENGTH = 16;
const PBKDF2_ITERATIONS = 100000;
const PBKDF2_KEY_LENGTH = 64;
const PBKDF2_DIGEST = 'sha512';

function sanitizeUser(user: any) {
  if (!user) {
    return null;
  }
  const plain = typeof user.toObject === 'function' ? user.toObject() : { ...user };
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

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const phone = searchParams.get('phone');
    const email = searchParams.get('email');
    const id = searchParams.get('id');
    const includeOrders = searchParams.get('includeOrders') === 'true';

    const filter: any = {};
    if (phone) {
      filter.phone = phone;
    }
    if (email) {
      filter.email = email;
    }
    if (id) {
      filter._id = id;
    }

    let query = User.find(filter).sort({ createdAt: -1 });

    if (includeOrders) {
      query = query.populate({
        path: 'orderHistory',
        model: Order,
        options: { sort: { createdAt: -1 } },
      });
    }

    const users = await query;

    return NextResponse.json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to fetch users',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const rawMode = body.mode ?? body.variant ?? body.action;
    const mode = rawMode ? rawMode.toString().toLowerCase() : body.name ? 'signup' : 'login';

    if (mode === 'signup') {
      const name = body.name?.toString().trim();
      const phone = body.phone?.toString().trim();
      const password = body.password?.toString();
      const email = body.email ? body.email.toString().trim().toLowerCase() : null;
      const address = body.address ? body.address.toString().trim() : undefined;
      const tableNumber = body.tableNumber ? parseInt(body.tableNumber.toString()) : null;

      if (!name || !phone || !password || !email) {
        return NextResponse.json(
          {
            success: false,
            message: 'Missing required fields',
          },
          { status: 400 }
        );
      }

      const existingUser = await User.findOne({
        $or: [{ phone }, { email }],
      });

      if (existingUser) {
        return NextResponse.json(
          {
            success: false,
            message: 'User already exists',
          },
          { status: 409 }
        );
      }

      const passwordHash = await hashPassword(password);

      // Validate table number if provided
      let validTableNumber = null;
      if (tableNumber && tableNumber > 0) {
        const existingTable = await Table.findOne({ tableNumber });
        if (existingTable) {
          validTableNumber = tableNumber;
        }
        // If table doesn't exist, don't assign it
      }

      const createdUser = await User.create({
        name,
        phone,
        email,
        address,
        passwordHash,
        orderHistory: [],
        ...(validTableNumber && { tableNumber: validTableNumber }),
      });

      return NextResponse.json(
        {
          success: true,
          message: 'User created successfully',
          data: sanitizeUser(createdUser),
        },
        { status: 201 }
      );
    }

    if (mode === 'login') {
      const password = body.password?.toString();
      const email = body.email ? body.email.toString().trim().toLowerCase() : null;
      const phone = body.phone ? body.phone.toString().trim() : null;
      const tableNumber = body.tableNumber ? parseInt(body.tableNumber.toString()) : null;

      if ((!email && !phone) || !password) {
        return NextResponse.json(
          {
            success: false,
            message: 'Missing credentials',
          },
          { status: 400 }
        );
      }

      const filter = email ? { email } : { phone };
      const user = await User.findOne(filter).select('+passwordHash');

      if (!user || !user.passwordHash) {
        return NextResponse.json(
          {
            success: false,
            message: 'Invalid credentials',
          },
          { status: 401 }
        );
      }

      const isValid = await verifyPassword(password, user.passwordHash);

      if (!isValid) {
        return NextResponse.json(
          {
            success: false,
            message: 'Invalid credentials',
          },
          { status: 401 }
        );
      }

      // Update table number if provided (from QR scan) and table exists
      if (tableNumber && tableNumber > 0) {
        const existingTable = await Table.findOne({ tableNumber });
        if (existingTable) {
          user.tableNumber = tableNumber;
          await user.save();
        }
        // If table doesn't exist, don't assign it (prevents invalid table assignments)
      }

      return NextResponse.json(
        {
          success: true,
          message: 'Login successful',
          data: sanitizeUser(user),
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

export async function PATCH(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const rawUserId = body.userId ?? body.id;
    const rawPhone = body.phone ?? body.userPhone;
    const rawEmail = body.email;
    const items = Array.isArray(body.items) ? body.items : [];
    const tableNumber = body.tableNumber ? parseInt(body.tableNumber.toString()) : null;

    const userId = rawUserId ? rawUserId.toString().trim() : '';
    const phone = rawPhone ? rawPhone.toString().trim() : '';
    const email = rawEmail ? rawEmail.toString().trim().toLowerCase() : '';

    const filter: any = {};
    if (userId) {
      filter._id = userId;
    }
    if (phone) {
      filter.phone = phone;
    }
    if (email) {
      filter.email = email;
    }

    if (Object.keys(filter).length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'Missing user identifier',
        },
        { status: 400 }
      );
    }

    const updateData: any = {
      'cart.updatedAt': new Date(),
    };

    // Handle cart items update
    updateData['cart.items'] = items;

    // Handle table number update
    if (tableNumber !== null && tableNumber > 0) {
      // Validate table exists
      const existingTable = await Table.findOne({ tableNumber });
      if (existingTable) {
        updateData.tableNumber = tableNumber;
      } else {
        return NextResponse.json(
          {
            success: false,
            message: 'Invalid table number',
          },
          { status: 400 }
        );
      }
    } else if (tableNumber === 0) {
      // Clear table number
      updateData.$unset = { tableNumber: 1 };
    }

    const user = await User.findOneAndUpdate(
      filter,
      updateData,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: 'User not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'User updated successfully',
      data: sanitizeUser(user),
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to update user',
      },
      { status: 500 }
    );
  }
}
