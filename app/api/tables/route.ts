import { NextRequest, NextResponse } from 'next/server';
import QRCode from 'qrcode';
import connectDB from '@/lib/mongodb';
import Table from '@/models/Table';
import User from '@/models/User';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { tableNumber, restaurantId } = body;

    if (!tableNumber) {
      return NextResponse.json(
        {
          success: false,
          message: 'Missing required fields: tableNumber is required',
        },
        { status: 400 }
      );
    }

    // Check if table already exists
    const existingTable = await Table.findOne({ tableNumber });
    if (existingTable) {
      return NextResponse.json(
        {
          success: false,
          message: 'Table with this number already exists',
        },
        { status: 409 }
      );
    }

    const qrUrl = `https://food-menu-beige.vercel.app/order?table=${tableNumber}`;

    // Create table first without QR code
    const table = await Table.create({
      tableNumber,
      qrCodeUrl: qrUrl,
      qrCodeData: '', // Will be updated after QR generation
      ...(restaurantId && { restaurantId }),
      status: 'available',
    });

    // Generate QR code as base64 data URL
    try {
      const qrCodeData = await QRCode.toDataURL(qrUrl, {
        width: 256,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });

      // Update table with QR code data
      table.qrCodeData = qrCodeData;
      await table.save();
    } catch (qrError: any) {
      console.error('Failed to generate QR code:', qrError);
      // Don't fail the request, just continue without QR code
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Table created successfully with QR code',
        data: table,
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to create table',
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const restaurantId = searchParams.get('restaurantId');

    const filter: any = {};
    if (restaurantId) {
      filter.restaurantId = restaurantId;
    }

    const tables = await Table.find(filter)
      .sort({ tableNumber: 1 })
      .populate('assignedUser', 'name phone email')
      .populate('currentOrder')
      .populate('orderHistory');

    return NextResponse.json({
      success: true,
      count: tables.length,
      data: tables,
    });
  } catch (error: any) {
    console.error('GET /api/tables - Error:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to fetch tables',
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { tableId, status, regenerateQR = false } = body;

    if (!tableId) {
      return NextResponse.json(
        {
          success: false,
          message: 'Table ID is required',
        },
        { status: 400 }
      );
    }

    const table = await Table.findById(tableId);
    if (!table) {
      return NextResponse.json(
        {
          success: false,
          message: 'Table not found',
        },
        { status: 404 }
      );
    }

    // Update status if provided
    if (status) {
      table.status = status;
    }

    if (status === 'available') {
      table.assignedUser = null;
      table.currentOrder = null;

      // Clear tableNumber from all users who were assigned to this table
      if (table.tableNumber) {
        await User.updateMany(
          { tableNumber: table.tableNumber },
          { $unset: { tableNumber: 1 } }
        );
      }
    }

    // Regenerate QR code if requested
    if (regenerateQR) {
      const qrUrl = `https://food-menu-beige.vercel.app/order?table=${table.tableNumber}`;

      try {
        const qrCodeData = await QRCode.toDataURL(qrUrl, {
          width: 256,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        });

        // Update table with new QR code
        table.qrCodeUrl = qrUrl;
        table.qrCodeData = qrCodeData;
      } catch (qrError: any) {
        console.error('Failed to regenerate QR code:', qrError);
        return NextResponse.json(
          {
            success: false,
            message: 'Failed to regenerate QR code',
          },
          { status: 500 }
        );
      }
    }

    await table.save();

    return NextResponse.json(
      {
        success: true,
        message: regenerateQR ? 'QR code regenerated successfully' : 'Table updated successfully',
        data: table,
      },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to update table',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const tableId = searchParams.get('id');

    if (!tableId) {
      return NextResponse.json(
        {
          success: false,
          message: 'Table ID is required',
        },
        { status: 400 }
      );
    }

    const table = await Table.findById(tableId);
    if (!table) {
      return NextResponse.json(
        {
          success: false,
          message: 'Table not found',
        },
        { status: 404 }
      );
    }

    await Table.findByIdAndDelete(tableId);

    return NextResponse.json(
      {
        success: true,
        message: 'Table deleted successfully',
      },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to delete table',
      },
      { status: 500 }
    );
  }
}