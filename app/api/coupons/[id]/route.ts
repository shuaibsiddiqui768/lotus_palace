import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Coupon from '@/models/Coupon';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase();

    const { id } = params;
    const body = await request.json();
    const {
      code,
      discountType,
      value,
      expiryDate,
      description,
      usageLimit,
      minimumOrderAmount,
      isActive,
    } = body;

    if (!code || !discountType || value === undefined || value === null || !expiryDate) {
      return NextResponse.json(
        { error: 'Missing required fields: code, discountType, value, expiryDate' },
        { status: 400 }
      );
    }

    const normalizedCode = String(code).trim().toUpperCase();
    if (!normalizedCode) {
      return NextResponse.json(
        { error: 'Coupon code must not be empty' },
        { status: 400 }
      );
    }

    if (!['percentage', 'fixed'].includes(discountType)) {
      return NextResponse.json(
        { error: 'Invalid discountType. Must be "percentage" or "fixed"' },
        { status: 400 }
      );
    }

    const numericValue = typeof value === 'number' ? value : Number(value);
    if (Number.isNaN(numericValue) || numericValue <= 0) {
      return NextResponse.json(
        { error: 'Value must be a valid positive number' },
        { status: 400 }
      );
    }

    if (discountType === 'percentage' && (numericValue < 0 || numericValue > 100)) {
      return NextResponse.json(
        { error: 'Percentage discount must be between 0 and 100' },
        { status: 400 }
      );
    }

    const expiry = new Date(expiryDate);
    if (Number.isNaN(expiry.getTime()) || expiry <= new Date()) {
      return NextResponse.json(
        { error: 'Expiry date must be a valid future date' },
        { status: 400 }
      );
    }

    const existingCoupon = await Coupon.findOne({ code: normalizedCode, _id: { $ne: id } });
    if (existingCoupon) {
      return NextResponse.json(
        { error: 'Coupon code already exists' },
        { status: 400 }
      );
    }

    const coupon = await Coupon.findById(id);
    if (!coupon) {
      return NextResponse.json(
        { error: 'Coupon not found' },
        { status: 404 }
      );
    }

    let usageLimitValue: number | undefined;
    let shouldUnsetUsageLimit = false;
    if (usageLimit !== undefined) {
      if (usageLimit === null || usageLimit === '') {
        shouldUnsetUsageLimit = true;
      } else {
        const parsedUsage = typeof usageLimit === 'number' ? usageLimit : Number(usageLimit);
        if (Number.isNaN(parsedUsage) || parsedUsage <= 0) {
          return NextResponse.json(
            { error: 'Usage limit must be a valid positive number' },
            { status: 400 }
          );
        }
        usageLimitValue = parsedUsage;
      }
    }

    let minimumOrderAmountValue: number | undefined;
    let shouldUnsetMinimumOrderAmount = false;
    if (minimumOrderAmount !== undefined) {
      if (minimumOrderAmount === null || minimumOrderAmount === '') {
        shouldUnsetMinimumOrderAmount = true;
      } else {
        const parsedMinimum =
          typeof minimumOrderAmount === 'number' ? minimumOrderAmount : Number(minimumOrderAmount);
        if (Number.isNaN(parsedMinimum) || parsedMinimum < 0) {
          return NextResponse.json(
            { error: 'Minimum order amount must be a valid non-negative number' },
            { status: 400 }
          );
        }
        minimumOrderAmountValue = parsedMinimum;
      }
    }

    coupon.code = normalizedCode;
    coupon.discountType = discountType;
    coupon.value = numericValue;
    coupon.expiryDate = expiry;
    coupon.description = typeof description === 'string' ? description.trim() : '';
    if (typeof isActive === 'boolean') {
      coupon.isActive = isActive;
    }

    if (usageLimitValue !== undefined) {
      coupon.usageLimit = usageLimitValue;
    } else if (shouldUnsetUsageLimit) {
      coupon.set('usageLimit', undefined);
    }

    if (minimumOrderAmountValue !== undefined) {
      coupon.minimumOrderAmount = minimumOrderAmountValue;
    } else if (shouldUnsetMinimumOrderAmount) {
      coupon.set('minimumOrderAmount', undefined);
    }

    await coupon.save();

    const updatedCoupon = {
      _id: coupon._id.toString(),
      code: coupon.code,
      discountType: coupon.discountType,
      value: coupon.value,
      expiryDate: coupon.expiryDate,
      description: coupon.description || '',
      isActive: coupon.isActive,
      usageLimit: coupon.usageLimit,
      minimumOrderAmount: coupon.minimumOrderAmount,
      usedCount: coupon.usedCount,
      createdAt: coupon.createdAt,
    };

    return NextResponse.json({ message: 'Coupon updated successfully', coupon: updatedCoupon });
  } catch (error: any) {
    console.error('Error updating coupon:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update coupon' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase();

    const { id } = params;

    // Find and delete the coupon
    const deletedCoupon = await Coupon.findByIdAndDelete(id);

    if (!deletedCoupon) {
      return NextResponse.json(
        { error: 'Coupon not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        message: 'Coupon deleted successfully',
        coupon: {
          id: deletedCoupon._id,
          code: deletedCoupon.code,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error deleting coupon:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
