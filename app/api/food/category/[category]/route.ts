import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Food from '@/models/Food';

export async function GET(
  request: NextRequest,
  { params }: { params: { category: string } }
) {
  try {
    await connectDB();

    const foods = await Food.find({ category: params.category, available: true }).sort({ rating: -1 });

    return NextResponse.json({
      success: true,
      count: foods.length,
      data: foods,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to fetch food items by category',
      },
      { status: 500 }
    );
  }
}
