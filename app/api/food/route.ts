import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Food from '@/models/Food';

export async function GET(request: NextRequest) {
  try {
    console.log('GET /api/food - Connecting to database');
    await connectDB();
    console.log('GET /api/food - Connected to database');

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const available = searchParams.get('available');
    const search = searchParams.get('search');

    const filter: any = {};
    if (category) {
      filter.category = category;
    }
    if (available !== null) {
      filter.available = available === 'true';
    }
    const trimmedSearch = search?.trim();
    if (trimmedSearch) {
      const escapeRegExp = (value: string) => value.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      const regex = new RegExp(escapeRegExp(trimmedSearch), 'i');
      filter.$or = [
        { name: regex },
        { description: regex },
        { category: regex },
      ];
    }

    console.log('GET /api/food - Fetching food items with filter:', filter);
    const foods = await Food.find(filter).sort({ createdAt: -1 });
    console.log(`GET /api/food - Found ${foods.length} food items`);

    return NextResponse.json({
      success: true,
      count: foods.length,
      data: foods,
    });
  } catch (error: any) {
    console.error('GET /api/food - Error:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to fetch food items',
        error: error.toString(),
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('POST /api/food - Connecting to database');
    await connectDB();
    console.log('POST /api/food - Connected to database');

    const body = await request.json();
    console.log('POST /api/food - Received body:', body);
    
    const { name, category, description, price, image, preparationTime, spicy, vegetarian } = body;

    // Validate required fields
    if (!name || !category || price === undefined) {
      console.log('POST /api/food - Validation failed: Missing required fields');
      return NextResponse.json(
        {
          success: false,
          message: 'Please provide all required fields: name, category, price',
        },
        { status: 400 }
      );
    }

    // Validate category is one of the allowed values
    const validCategories = ['pizza', 'burgers', 'pasta', 'salads', 'drinks', 'desserts'];
    if (!validCategories.includes(category)) {
      console.log(`POST /api/food - Validation failed: Invalid category "${category}"`);
      return NextResponse.json(
        {
          success: false,
          message: `Invalid category. Must be one of: ${validCategories.join(', ')}`,
        },
        { status: 400 }
      );
    }

    // Validate price is a number
    if (isNaN(parseFloat(price))) {
      console.log('POST /api/food - Validation failed: Price is not a number');
      return NextResponse.json(
        {
          success: false,
          message: 'Price must be a valid number',
        },
        { status: 400 }
      );
    }

    // Create food item with default values for optional fields
    const foodData = {
      name,
      category,
      description: description || '',
      price: parseFloat(price),
      image: image || '',
      preparationTime: preparationTime ? parseInt(preparationTime) : 30,
      spicy: spicy || false,
      vegetarian: vegetarian || false,
      available: true, // Default to available
    };

    console.log('POST /api/food - Creating food item with data:', foodData);
    const food = await Food.create(foodData);
    console.log('POST /api/food - Food item created:', food._id);

    return NextResponse.json(
      {
        success: true,
        message: 'Food item created successfully',
        data: food,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('POST /api/food - Error:', error);
    
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
        message: error.message || 'Failed to create food item',
        error: error.toString(),
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 400 }
    );
  }
}
