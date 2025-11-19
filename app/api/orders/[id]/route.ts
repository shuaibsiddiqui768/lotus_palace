import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Order from '@/models/Order';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB();
    const order = await Order.findById(params.id);

    if (!order) {
      return NextResponse.json(
        {
          success: false,
          message: 'Order not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: order,
    });
  } catch (error: any) {
    console.error('GET /api/orders/[id] - Error:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to fetch order',
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB();
    const body = await request.json();
    const { status, createPayment, payment, updatePaymentStatus, paymentStatus, estimatedTime } = body;

    // Handle payment creation
    if (createPayment && payment) {
      console.log(`PATCH /api/orders/[id] - Creating payment for order ${params.id}`, payment);
      
      const validPaymentStatuses = ['Pending', 'Success', 'Failed', 'UPI-completed'];
      if (!validPaymentStatuses.includes(payment.status)) {
        return NextResponse.json(
          {
            success: false,
            message: `Invalid payment status. Must be one of: ${validPaymentStatuses.join(', ')}`,
          },
          { status: 400 }
        );
      }

      const order = await Order.findByIdAndUpdate(
        params.id,
        { payment },
        { new: true }
      );

      if (!order) {
        return NextResponse.json(
          {
            success: false,
            message: 'Order not found',
          },
          { status: 404 }
        );
      }

      console.log(`PATCH /api/orders/[id] - Payment created for order ${params.id}`);
      return NextResponse.json({
        success: true,
        message: 'Payment created successfully',
        data: order,
      });
    }

    // Handle payment status update
    if (updatePaymentStatus && paymentStatus) {
      console.log(`PATCH /api/orders/[id] - Updating payment status for order ${params.id} to ${paymentStatus}`);
      
      const validPaymentStatuses = ['Pending', 'Success', 'Failed', 'UPI-completed'];
      if (!validPaymentStatuses.includes(paymentStatus)) {
        return NextResponse.json(
          {
            success: false,
            message: `Invalid payment status. Must be one of: ${validPaymentStatuses.join(', ')}`,
          },
          { status: 400 }
        );
      }

      const order = await Order.findById(params.id);
      if (!order) {
        return NextResponse.json(
          {
            success: false,
            message: 'Order not found',
          },
          { status: 404 }
        );
      }

      if (!order.payment) {
        return NextResponse.json(
          {
            success: false,
            message: 'No payment found for this order',
          },
          { status: 404 }
        );
      }

      // Update the nested payment status
      order.payment.status = paymentStatus;
      await order.save();

      console.log(`PATCH /api/orders/[id] - Payment status updated to ${paymentStatus} for order ${params.id}`);
      return NextResponse.json({
        success: true,
        message: 'Payment status updated successfully',
        data: order,
      });
    }

    // Handle estimated time update
    if (typeof estimatedTime === 'number') {
      console.log(`PATCH /api/orders/[id] - Updating estimated time for order ${params.id} to ${estimatedTime} minutes`);

      const order = await Order.findByIdAndUpdate(
        params.id,
        { estimatedTime },
        { new: true }
      );

      if (!order) {
        return NextResponse.json(
          {
            success: false,
            message: 'Order not found',
          },
          { status: 404 }
        );
      }

      console.log(`PATCH /api/orders/[id] - Estimated time updated to ${estimatedTime} minutes for order ${params.id}`);
      return NextResponse.json({
        success: true,
        message: 'Estimated time updated successfully',
        data: order,
      });
    }

    // Handle order status update (existing functionality)
    if (!status) {
      return NextResponse.json(
        {
          success: false,
          message: 'Status is required',
        },
        { status: 400 }
      );
    }

    const validStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled'];
    const normalizedStatus = status.toLowerCase();
    if (!validStatuses.includes(normalizedStatus)) {
      return NextResponse.json(
        {
          success: false,
          message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
        },
        { status: 400 }
      );
    }

    const orderBeforeUpdate = await Order.findById(params.id);
    if (!orderBeforeUpdate) {
      return NextResponse.json(
        {
          success: false,
          message: 'Order not found',
        },
        { status: 404 }
      );
    }

    if (normalizedStatus === 'cancelled' && orderBeforeUpdate.payment && orderBeforeUpdate.payment.status === 'Pending') {
      orderBeforeUpdate.payment.status = 'Failed';
      await orderBeforeUpdate.save();
    }

    const order = await Order.findByIdAndUpdate(
      params.id,
      { status: normalizedStatus },
      { new: true }
    );

    if (!order) {
      return NextResponse.json(
        {
          success: false,
          message: 'Order not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Order status updated successfully',
      data: order,
    });
  } catch (error: any) {
    console.error('PATCH /api/orders/[id] - Error:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to update order',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB();
    const order = await Order.findByIdAndDelete(params.id);

    if (!order) {
      return NextResponse.json(
        {
          success: false,
          message: 'Order not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Order deleted successfully',
    });
  } catch (error: any) {
    console.error('DELETE /api/orders/[id] - Error:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to delete order',
      },
      { status: 500 }
    );
  }
}
