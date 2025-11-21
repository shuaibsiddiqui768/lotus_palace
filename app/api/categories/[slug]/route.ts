import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Category from '@/models/Category';
import Food from '@/models/Food';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    await connectDB();

    const category = await Category.findOne({ slug: params.slug });

    if (!category) {
      return NextResponse.json(
        {
          success: false,
          message: 'Category not found',
        },
        { status: 404 }
      );
    }

    await Food.deleteMany({ category: new RegExp(`^${category.name}$`, 'i') });

    const deletedCategory = await Category.findByIdAndDelete(category._id);

    return NextResponse.json({
      success: true,
      message: 'Category and associated food items deleted successfully',
      data: deletedCategory,
    });
  } catch (error: any) {
    console.error('DELETE /api/categories/[slug] - Error:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to delete category',
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    await connectDB();

    const body = await request.json();
    const { name, description } = body;

    const category = await Category.findOne({ slug: params.slug });

    if (!category) {
      return NextResponse.json(
        {
          success: false,
          message: 'Category not found',
        },
        { status: 404 }
      );
    }

    if (name && name !== category.name) {
      const existingCategory = await Category.findOne({
        name: new RegExp(`^${name}$`, 'i'),
        _id: { $ne: category._id },
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

      category.name = name.trim();
      category.slug = name.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
    }

    if (description !== undefined) {
      category.description = description.trim();
    }

    await category.save();

    return NextResponse.json({
      success: true,
      message: 'Category updated successfully',
      data: category,
    });
  } catch (error: any) {
    console.error('PUT /api/categories/[slug] - Error:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to update category',
      },
      { status: 500 }
    );
  }
}
