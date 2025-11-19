import { NextRequest, NextResponse } from 'next/server';
import QRCode from 'qrcode';
import connectDB from '@/lib/mongodb';
import Room from '@/models/Room';
import User from '@/models/User';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { roomNumber, restaurantId } = body;

    if (!roomNumber) {
      return NextResponse.json(
        {
          success: false,
          message: 'Missing required fields: roomNumber is required',
        },
        { status: 400 }
      );
    }

    // Check if room already exists
    const existingRoom = await Room.findOne({ roomNumber });
    if (existingRoom) {
      return NextResponse.json(
        {
          success: false,
          message: 'Room with this number already exists',
        },
        { status: 409 }
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://lotus-palace.vercel.app';
    const qrUrl = `${baseUrl}/order?room=${roomNumber}`;

    // Create room first without QR code
    const room = await Room.create({
      roomNumber,
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

      // Update room with QR code data
      room.qrCodeData = qrCodeData;
      await room.save();
    } catch (qrError: any) {
      console.error('Failed to generate QR code:', qrError);
      // Don't fail the request, just continue without QR code
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Room created successfully with QR code',
        data: room,
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

    const rooms = await Room.find(filter)
      .sort({ roomNumber: 1 })
      .populate('assignedUser', 'name phone email')
      .populate('currentOrder')
      .populate('orderHistory');

    return NextResponse.json({
      success: true,
      count: rooms.length,
      data: rooms,
    });
  } catch (error: any) {
    console.error('GET /api/rooms - Error:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to fetch rooms',
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { roomId, status, regenerateQR = false } = body;

    if (!roomId) {
      return NextResponse.json(
        {
          success: false,
          message: 'Room ID is required',
        },
        { status: 400 }
      );
    }

    const room = await Room.findById(roomId);
    if (!room) {
      return NextResponse.json(
        {
          success: false,
          message: 'Room not found',
        },
        { status: 404 }
      );
    }

    // Update status if provided
    if (status) {
      room.status = status;
    }

    if (status === 'available') {
      room.assignedUser = null;
      room.currentOrder = null;

      // Clear roomNumber from all users who were assigned to this room
      if (room.roomNumber) {
        await User.updateMany(
          { roomNumber: room.roomNumber },
          { $unset: { roomNumber: 1 } }
        );
      }
    }

    // Regenerate QR code if requested
    if (regenerateQR) {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://lotus-palace.vercel.app';
      const qrUrl = `${baseUrl}/order?room=${room.roomNumber}`;

      try {
        const qrCodeData = await QRCode.toDataURL(qrUrl, {
          width: 256,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        });

        // Update room with new QR code
        room.qrCodeUrl = qrUrl;
        room.qrCodeData = qrCodeData;
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

    await room.save();

    return NextResponse.json(
      {
        success: true,
        message: regenerateQR ? 'QR code regenerated successfully' : 'Room updated successfully',
        data: room,
      },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to update room',
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

    const room = await Room.findById(tableId);
    if (!room) {
      return NextResponse.json(
        {
          success: false,
          message: 'Room not found',
        },
        { status: 404 }
      );
    }

    await Room.findByIdAndDelete(tableId);

    return NextResponse.json(
      {
        success: true,
        message: 'Room deleted successfully',
      },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to delete room',
      },
      { status: 500 }
    );
  }
}