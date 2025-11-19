import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import connectDB from '@/lib/mongodb';
import Food from '@/models/Food';

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const extractPublicId = (url: string): string | null => {
  if (!url) return null;
  
  const cloudinaryUrlPattern = /(?:https?:\/\/)?(?:res\.)?cloudinary\.com\/[^/]+\/(?:image|video)\/upload\/(?:v\d+\/)?(.+?)(?:\.[^.]+)?$/;
  const match = url.match(cloudinaryUrlPattern);
  
  if (match && match[1]) {
    return match[1];
  }
  
  const pathMatch = url.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.[^.]+)?$/);
  if (pathMatch && pathMatch[1]) {
    return pathMatch[1];
  }
  
  return null;
};

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    const food = await Food.findById(params.id);

    if (!food) {
      return NextResponse.json(
        {
          success: false,
          message: 'Food item not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: food,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to fetch food item',
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    const body = await request.json();
    const { name, category, description, price, image, available, preparationTime, spicy, vegetarian } =
      body;

    const food = await Food.findByIdAndUpdate(
      params.id,
      {
        name,
        category,
        description,
        price,
        image,
        available,
        preparationTime,
        spicy,
        vegetarian,
      },
      { new: true, runValidators: true }
    );

    if (!food) {
      return NextResponse.json(
        {
          success: false,
          message: 'Food item not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Food item updated successfully',
      data: food,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to update food item',
      },
      { status: 400 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    const food = await Food.findById(params.id);

    if (!food) {
      return NextResponse.json(
        {
          success: false,
          message: 'Food item not found',
        },
        { status: 404 }
      );
    }

    if (food.image) {
      const publicId = extractPublicId(food.image);
      if (publicId) {
        try {
          await cloudinary.uploader.destroy(publicId);
          console.log(`Deleted image from Cloudinary: ${publicId}`);
        } catch (cloudinaryError: any) {
          console.error('Error deleting image from Cloudinary:', cloudinaryError);
        }
      }
    }

    const deletedFood = await Food.findByIdAndDelete(params.id);

    return NextResponse.json({
      success: true,
      message: 'Food item and image deleted successfully',
      data: deletedFood,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to delete food item',
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    const food = await Food.findById(params.id);

    if (!food) {
      return NextResponse.json(
        {
          success: false,
          message: 'Food item not found',
        },
        { status: 404 }
      );
    }

    food.available = !food.available;
    await food.save();

    return NextResponse.json({
      success: true,
      message: `Food item marked as ${food.available ? 'available' : 'unavailable'}`,
      data: food,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to toggle availability',
      },
      { status: 500 }
    );
  }
}
