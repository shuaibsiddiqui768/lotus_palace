import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Category from '@/models/Category';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const categories = await Category.find().sort({ createdAt: 1 });

    return NextResponse.json({
      success: true,
      count: categories.length,
      data: categories,
    });
  } catch (error: any) {
    console.error('GET /api/categories - Error:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to fetch categories',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { name, description, image } = body;

    if (!name || name.trim() === '') {
      return NextResponse.json(
        {
          success: false,
          message: 'Please provide a category name',
        },
        { status: 400 }
      );
    }

    const slug = name.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w-]/g, '');

    const existingCategory = await Category.findOne({
      $or: [{ name: new RegExp(`^${name}$`, 'i') }, { slug }],
    });

    if (existingCategory) {
      return NextResponse.json(
        {
          success: false,
          message: 'Category with this name already exists',
        },
        { status: 400 }
      );
    }

    const category = await Category.create({
      name: name.trim(),
      slug,
      description: description ? description.trim() : '',
      image: image ? image.trim() : '',
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Category created successfully',
        data: category,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('POST /api/categories - Error:', error);

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
        message: error.message || 'Failed to create category',
      },
      { status: 400 }
    );
  }
}
