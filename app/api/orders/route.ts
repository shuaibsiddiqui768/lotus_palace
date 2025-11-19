import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Order from '@/models/Order';
import User from '@/models/User';
import Coupon from '@/models/Coupon';

export async function GET(request: NextRequest) {
  try {
    console.log('GET /api/orders - Connecting to database');
    await connectDB();
    console.log('GET /api/orders - Connected to database');

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const phone = searchParams.get('phone');
    const statusParams = searchParams.getAll('status');

    const filter: any = {};
    if (userId) {
      filter.userId = userId;
    }
    if (!userId && phone) {
      filter.customerPhone = phone;
    }
    const normalizedStatusFilters = statusParams
      .flatMap((value) => value.split(','))
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean);

    if (normalizedStatusFilters.length === 1) {
      filter.status = normalizedStatusFilters[0];
    } else if (normalizedStatusFilters.length > 1) {
      filter.status = { $in: normalizedStatusFilters };
    }

    console.log('GET /api/orders - Fetching orders with filter:', filter);
    const orders = await Order.find(filter).sort({ createdAt: -1 });
    console.log(`GET /api/orders - Found ${orders.length} orders`);

    return NextResponse.json({
      success: true,
      count: orders.length,
      data: orders,
    });
  } catch (error: any) {
    console.error('GET /api/orders - Error:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to fetch orders',
        error: error.toString(),
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('POST /api/orders - Connecting to database');
    await connectDB();
    console.log('POST /api/orders - Connected to database');

    const body = await request.json();
    console.log('POST /api/orders - Received body:', JSON.stringify(body, null, 2));
    
    const {
      userId: providedUserId,
      customerName,
      customerPhone,
      customerEmail,
      orderType,
      roomNumber,
      items,
      subtotal,
      gst,
      discountAmount,
      total,
      couponCode,
      couponId,
      couponDiscountType,
      couponDiscountValue
    } = body;

    // Validate required fields with detailed messages
    const errors: string[] = [];
    
    if (!customerName || typeof customerName !== 'string' || customerName.trim() === '') {
      errors.push('Customer name is required and must be a valid string');
    }
    if (!customerPhone || typeof customerPhone !== 'string' || customerPhone.trim() === '') {
      errors.push('Customer phone is required and must be a valid string');
    }
    if (!orderType || orderType !== 'Rooms') {
      errors.push('Order type must be Rooms');
    }
    if (!roomNumber || typeof roomNumber !== 'string' || roomNumber.trim() === '') {
      errors.push('Room number is required and must be a valid string');
    }
    if (!items || !Array.isArray(items) || items.length === 0) {
      errors.push('At least one item is required in the order');
    }
    if (typeof subtotal !== 'number' || subtotal < 0) {
      errors.push('Valid subtotal is required');
    }
    if (typeof gst !== 'number' || gst < 0) {
      errors.push('Valid GST is required');
    }
    if (typeof total !== 'number' || total < 0) {
      errors.push('Valid total is required');
    }

    if (couponCode && typeof couponCode !== 'string') {
      errors.push('Coupon code must be a string');
    }

    if (couponDiscountType && !['percentage', 'fixed'].includes(couponDiscountType)) {
      errors.push('Coupon discount type is invalid');
    }

    if (couponDiscountValue !== undefined && couponDiscountValue !== null && typeof couponDiscountValue !== 'number') {
      errors.push('Coupon discount value must be a number');
    }

    if (providedUserId && typeof providedUserId !== 'string') {
      errors.push('User ID must be a string');
    }

    // Validate items structure if items exist
    if (Array.isArray(items)) {
      items.forEach((item: any, index: number) => {
        if (!item.id || typeof item.id !== 'string') {
          errors.push(`Item ${index + 1}: Missing or invalid item ID`);
        }
        if (!item.name || typeof item.name !== 'string') {
          errors.push(`Item ${index + 1}: Missing or invalid item name`);
        }
        if (typeof item.price !== 'number' || item.price < 0) {
          errors.push(`Item ${index + 1}: Invalid item price`);
        }
        if (typeof item.quantity !== 'number' || item.quantity < 1) {
          errors.push(`Item ${index + 1}: Invalid item quantity`);
        }
      });
    }

    if (errors.length > 0) {
      console.log('POST /api/orders - Validation failed:', errors);
      return NextResponse.json(
        {
          success: false,
          message: 'Validation failed',
          errors,
        },
        { status: 400 }
      );
    }

    // Find or create user
    let user = null;

    if (providedUserId) {
      user = await User.findById(providedUserId);
      if (!user) {
        console.warn(`POST /api/orders - Provided userId ${providedUserId} not found, falling back to phone lookup`);
      }
    }

    if (!user) {
      user = await User.findOne({ phone: customerPhone });
    }
    
    if (!user) {
      console.log(`POST /api/orders - User with phone ${customerPhone} not found, creating new user`);
      user = await User.create({
        name: customerName,
        phone: customerPhone,
        email: customerEmail || undefined,
        orderHistory: [],
      });
      console.log('POST /api/orders - User created:', user._id);
    } else {
      console.log(`POST /api/orders - Found existing user: ${user._id}`);
      // Update user information if needed
      if (user.name !== customerName ||
          (customerEmail && user.email !== customerEmail)) {

        user.name = customerName;
        if (customerEmail) user.email = customerEmail;
        await user.save();
        console.log('POST /api/orders - User information updated');
      }
    }

    let appliedCoupon = null;
    if (couponCode || couponId) {
      const couponFilter: any = {};
      if (couponId) {
        couponFilter._id = couponId;
      }
      if (couponCode) {
        couponFilter.code = couponCode.toUpperCase();
      }

      appliedCoupon = await Coupon.findOne(couponFilter);

      if (!appliedCoupon) {
        console.log('POST /api/orders - Coupon not found');
        return NextResponse.json(
          {
            success: false,
            message: 'Invalid coupon. Please try another code.',
          },
          { status: 400 }
        );
      }

      const now = new Date();
      if (!appliedCoupon.isActive || appliedCoupon.expiryDate <= now) {
        appliedCoupon.isActive = false;
        await appliedCoupon.save();
        console.log('POST /api/orders - Coupon is inactive or expired');
        return NextResponse.json(
          {
            success: false,
            message: 'This coupon is no longer valid.',
          },
          { status: 400 }
        );
      }

      if (typeof appliedCoupon.usageLimit === 'number' && appliedCoupon.usageLimit > 0 && appliedCoupon.usedCount >= appliedCoupon.usageLimit) {
        appliedCoupon.isActive = false;
        await appliedCoupon.save();
        console.log('POST /api/orders - Coupon usage limit reached');
        return NextResponse.json(
          {
            success: false,
            message: 'Coupon usage limit has been reached.',
          },
          { status: 400 }
        );
      }
    }

    const safeDiscountAmount = typeof discountAmount === 'number' && !Number.isNaN(discountAmount) ? discountAmount : 0;
    let finalDiscountAmount = safeDiscountAmount;
    finalDiscountAmount = Math.max(0, Math.min(finalDiscountAmount, subtotal + gst));

    if (appliedCoupon) {
      const subtotalWithGst = subtotal + gst;
      const expectedDiscount = appliedCoupon.discountType === 'percentage'
        ? (subtotalWithGst * appliedCoupon.value) / 100
        : appliedCoupon.value;
      finalDiscountAmount = Math.min(expectedDiscount, subtotalWithGst);
    }

    const computedTotal = Math.max(0, subtotal + gst - finalDiscountAmount);

    // Create order
    const orderData = {
      userId: user._id,
      customerName,
      customerPhone,
      customerEmail: customerEmail || undefined,
      orderType,
      roomNumber,
      items: items.map((item: any) => ({
        foodId: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        image_url: item.image_url || undefined,
      })),
      subtotal,
      gst,
      discountAmount: finalDiscountAmount,
      total: computedTotal,
      status: 'confirmed',
      couponCode: appliedCoupon ? appliedCoupon.code : undefined,
      couponId: appliedCoupon ? appliedCoupon._id.toString() : undefined,
      couponDiscountType: appliedCoupon ? appliedCoupon.discountType : undefined,
      couponDiscountValue: appliedCoupon ? appliedCoupon.value : undefined,
      estimatedTime: 30,
    };

    console.log('POST /api/orders - Creating order with data:', orderData);
    const order = await Order.create(orderData);
    console.log('POST /api/orders - Order created:', order._id);

    // Update user's order history
    if (!Array.isArray(user.orderHistory)) {
      user.orderHistory = [];
    }
    user.orderHistory.push(order._id);
    await user.save();
    console.log('POST /api/orders - User order history updated');

    if (appliedCoupon) {
      appliedCoupon.usedCount = (appliedCoupon.usedCount || 0) + 1;
      if (!Array.isArray(appliedCoupon.usageHistory)) {
        appliedCoupon.usageHistory = [];
      }
      appliedCoupon.usageHistory.push({
        userId: user._id,
        orderId: order._id,
        usedAt: new Date(),
      });

      if (typeof appliedCoupon.usageLimit === 'number' && appliedCoupon.usageLimit > 0 && appliedCoupon.usedCount >= appliedCoupon.usageLimit) {
        appliedCoupon.isActive = false;
      }

      await appliedCoupon.save();
      console.log('POST /api/orders - Coupon usage updated');
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Order created successfully',
        data: order,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('POST /api/orders - Error:', error);
    
    // Check for validation errors from Mongoose
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map((err: any) => err.message);
      return NextResponse.json(
        {
          success: false,
          message: 'Validation failed',
          errors: validationErrors,
        },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to create order',
        error: error.toString(),
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 400 }
    );
  }
}