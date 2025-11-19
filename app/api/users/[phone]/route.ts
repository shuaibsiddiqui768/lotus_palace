import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Order from '@/models/Order';

export async function GET(request: NextRequest, { params }: { params: { phone: string } }) {
  try {
    console.log('GET /api/users/[phone] - Connecting to database');
    await connectDB();
    console.log('GET /api/users/[phone] - Connected to database');

    const phone = params.phone;
    console.log('GET /api/users/[phone] - Fetching user with phone:', phone);

    const user = await User.findOne({ phone }).populate({
      path: 'orderHistory',
      model: Order,
      options: { sort: { createdAt: -1 } },
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: 'User not found',
        },
        { status: 404 }
      );
    }

    console.log('GET /api/users/[phone] - Found user:', user.phone, 'with', user.orderHistory.length, 'orders');

    return NextResponse.json({
      success: true,
      data: user,
    });
  } catch (error: any) {
    console.error('GET /api/users/[phone] - Error:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to fetch user',
        error: error.toString(),
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
