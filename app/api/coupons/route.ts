import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Coupon from '@/models/Coupon';

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();

    const body = await request.json();
    const { code, discountType, value, expiryDate, description, usageLimit, minimumOrderAmount } = body;

    // Validation
    if (!code || !discountType || !value || !expiryDate) {
      return NextResponse.json(
        { error: 'Missing required fields: code, discountType, value, expiryDate' },
        { status: 400 }
      );
    }

    if (!['percentage', 'fixed'].includes(discountType)) {
      return NextResponse.json(
        { error: 'Invalid discountType. Must be "percentage" or "fixed"' },
        { status: 400 }
      );
    }

    if (discountType === 'percentage' && (value < 0 || value > 100)) {
      return NextResponse.json(
        { error: 'Percentage discount must be between 0 and 100' },
        { status: 400 }
      );
    }

    if (value <= 0) {
      return NextResponse.json(
        { error: 'Value must be greater than 0' },
        { status: 400 }
      );
    }

    let minimumOrderAmountValue: number | undefined;
    if (minimumOrderAmount !== undefined && minimumOrderAmount !== null && minimumOrderAmount !== '') {
      const parsedMinimum = typeof minimumOrderAmount === 'number' ? minimumOrderAmount : Number(minimumOrderAmount);
      if (Number.isNaN(parsedMinimum) || parsedMinimum < 0) {
        return NextResponse.json(
          { error: 'Minimum order amount must be a valid non-negative number' },
          { status: 400 }
        );
      }
      minimumOrderAmountValue = parsedMinimum;
    }

    const expiry = new Date(expiryDate);
    if (isNaN(expiry.getTime()) || expiry <= new Date()) {
      return NextResponse.json(
        { error: 'Expiry date must be a valid future date' },
        { status: 400 }
      );
    }

    // Check if coupon code already exists
    const existingCoupon = await Coupon.findOne({ code: code.toUpperCase() });
    if (existingCoupon) {
      return NextResponse.json(
        { error: 'Coupon code already exists' },
        { status: 400 }
      );
    }

    // Create coupon
    const coupon = new Coupon({
      code: code.toUpperCase(),
      discountType,
      value,
      expiryDate: expiry,
      description,
      usageLimit,
      minimumOrderAmount: minimumOrderAmountValue,
      usedCount: 0,
      isActive: true,
    });

    await coupon.save();

    return NextResponse.json(
      {
        message: 'Coupon created successfully',
        coupon: {
          id: coupon._id,
          code: coupon.code,
          discountType: coupon.discountType,
          value: coupon.value,
          expiryDate: coupon.expiryDate,
          description: coupon.description,
          usageLimit: coupon.usageLimit,
          minimumOrderAmount: coupon.minimumOrderAmount,
          isActive: coupon.isActive,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating coupon:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const activeOnly = searchParams.get('activeOnly') === 'true';

    const filter: Record<string, unknown> = {};
    if (code) {
      filter.code = code.toUpperCase();
    }

    if (activeOnly) {
      filter.isActive = true;
    }

    let query = Coupon.find(filter).sort({ createdAt: -1 });
    const coupons = await query;

    const now = new Date();
    const filtered = coupons.filter((coupon) => {
      if (activeOnly) {
        if (!coupon.isActive) {
          return false;
        }
        if (coupon.expiryDate <= now) {
          return false;
        }
        if (typeof coupon.usageLimit === 'number' && coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit) {
          return false;
        }
      }
      return true;
    });

    return NextResponse.json({ coupons: filtered });
  } catch (error: any) {
    console.error('Error fetching coupons:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
