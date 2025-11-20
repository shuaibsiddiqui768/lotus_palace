'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  MessageCircle,
  CheckCircle,
  Copy,
  Smartphone,
  Wallet,
  ShoppingCart,
} from 'lucide-react';
import { QRCodeSVG as QRCode } from 'qrcode.react';
import { Button } from '@/components/ui/button';
import Navbar from '@/components/Navbar';
import { useCart } from '@/contexts/CartContext';

interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image_url?: string;
}

interface OrderData {
  userId?: string;
  name: string;
  phone: string;
  email?: string;
  orderType: 'Rooms';
  roomNumber: string;
  items: OrderItem[];
  subtotal: number;
  gst: number;
  discountAmount: number;
  total: number;
  couponCode?: string;
  couponId?: string;
  couponDiscountType?: 'percentage' | 'fixed';
  couponDiscountValue?: number;
}

const UPI_ID = process.env.NEXT_PUBLIC_UPI_ID || 'merchant@upi';

export default function CheckoutPage() {
  const router = useRouter();
  const { clearCart } = useCart();
  const [orderData, setOrderData] = useState<OrderData | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [orderError, setOrderError] = useState('');
  const [copiedUPI, setCopiedUPI] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'cash'>('upi');
  const [selectedUPIApp, setSelectedUPIApp] = useState<string>('gpay');

  useEffect(() => {
    const storedOrder = localStorage.getItem('pendingOrder');
    if (storedOrder) {
      try {
        setOrderData(JSON.parse(storedOrder));
      } catch (error) {
        console.error('Failed to parse order data:', error);
        router.push('/cart');
      }
    } else {
      router.push('/cart');
    }
  }, [router]);

  const handleCopyUPI = () => {
    navigator.clipboard.writeText(UPI_ID);
    setCopiedUPI(true);
    setTimeout(() => setCopiedUPI(false), 2000);
  };

  const getUPIQRValue = () => {
    const baseUPI = `upi://pay?pa=${UPI_ID}&pn=Restaurant&am=${orderData?.total}&tr=${orderData?.phone}`;

    switch (selectedUPIApp) {
      case 'gpay':
        return `tez://upi/pay?pa=${UPI_ID}&pn=Restaurant&am=${orderData?.total}&tr=${orderData?.phone}`;
      case 'phonepe':
        return `phonepe://pay?pa=${UPI_ID}&pn=Restaurant&am=${orderData?.total}&tr=${orderData?.phone}`;
      case 'paytm':
        return `paytmmp://pay?pa=${UPI_ID}&pn=Restaurant&am=${orderData?.total}&tr=${orderData?.phone}`;
      case 'amazonpay':
        return `amazonpay://pay?pa=${UPI_ID}&pn=Restaurant&am=${orderData?.total}&tr=${orderData?.phone}`;
      default:
        return baseUPI;
    }
  };

  const handleConfirmPayment = async () => {
    if (!orderData || isSubmitting) return;

    try {
      setIsSubmitting(true);
      setOrderError('');

      if (!orderData.items || orderData.items.length === 0) {
        throw new Error('Cart is empty. Please add items before checkout.');
      }

      const validatedItems = orderData.items.map((item: OrderItem) => {
        if (
          !item.id ||
          !item.name ||
          typeof item.price !== 'number' ||
          typeof item.quantity !== 'number'
        ) {
          throw new Error(`Invalid item data: ${item.name || 'Unknown item'}`);
        }
        return {
          id: item.id,
          name: item.name,
          price: Number(item.price),
          quantity: Number(item.quantity),
          image_url: item.image_url || undefined,
        };
      });

      const subtotal = Number(orderData.subtotal);
      const gst = Number(orderData.gst);
      const discountAmount = Number(orderData.discountAmount);
      const total = Number(orderData.total);

      if (isNaN(subtotal) || isNaN(gst) || isNaN(total)) {
        throw new Error('Invalid price values. Please refresh and try again.');
      }

      const orderPayload = {
        userId: orderData.userId,
        customerName: orderData.name?.trim(),
        customerPhone: orderData.phone?.trim(),
        customerEmail: orderData.email?.trim() || undefined,
        items: validatedItems,
        orderType: orderData.orderType,
        roomNumber: orderData.roomNumber?.trim(),
        subtotal,
        gst,
        discountAmount: isNaN(discountAmount) ? 0 : discountAmount,
        total,
        couponCode: orderData.couponCode,
        couponId: orderData.couponId,
        couponDiscountType: orderData.couponDiscountType,
        couponDiscountValue: orderData.couponDiscountValue,
      };

      console.log('Creating order with data:', JSON.stringify(orderPayload, null, 2));

      const orderResponse = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderPayload),
      });

      const orderResult = await orderResponse.json();

      if (!orderResponse.ok) {
        const errorMessage =
          orderResult.errors?.length > 0
            ? `Validation error: ${orderResult.errors.join(', ')}`
            : orderResult.message || 'Failed to create order';
        throw new Error(errorMessage);
      }

      console.log('Order created successfully:', orderResult.data);
      const orderId = orderResult.data._id;

      const paymentPayload = {
        createPayment: true,
        payment: {
          method: paymentMethod === 'upi' ? 'UPI' : 'Cash',
          status: paymentMethod === 'upi' ? 'UPI-completed' : 'Pending',
          amount: total,
          transactionId: paymentMethod === 'upi' ? selectedUPIApp : undefined,
        },
      };

      console.log(
        'Adding payment to order:',
        orderId,
        JSON.stringify(paymentPayload, null, 2)
      );

      const paymentResponse = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentPayload),
      });

      const paymentResult = await paymentResponse.json();

      if (!paymentResponse.ok) {
        const errorMessage = paymentResult.message || 'Failed to add payment';
        throw new Error(errorMessage);
      }

      console.log('Payment added successfully:', paymentResult.data);

      setPaymentConfirmed(true);
      clearCart();
      localStorage.removeItem('pendingOrder');
      localStorage.removeItem('cart');
      localStorage.removeItem('cartId');

      setTimeout(() => {
        router.push('/orders');
      }, 2000);
    } catch (error: any) {
      console.error('Error placing order:', error);
      setOrderError(error.message || 'Failed to place order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrintBill = () => {
    if (!orderData) return;

    try {
      const element = document.getElementById('bill-content');
      if (!element) return;

      const printWindow = window.open('', '', 'width=800,height=600');
      if (printWindow) {
        printWindow.document.write('<html><head><title>Order Bill</title>');
        printWindow.document.write('<style>');
        printWindow.document.write(
          'body { font-family: Arial, sans-serif; margin: 20px; }'
        );
        printWindow.document.write(
          '.bill-header { text-align: center; margin-bottom: 20px; }'
        );
        printWindow.document.write(
          '.bill-header h2 { margin: 0; font-size: 20px; }'
        );
        printWindow.document.write('.section { margin-bottom: 20px; }');
        printWindow.document.write(
          '.section h3 { margin: 10px 0; font-size: 14px; border-bottom: 1px solid #ccc; padding-bottom: 5px; }'
        );
        printWindow.document.write(
          '.details-row { display: flex; justify-content: space-between; padding: 5px 0; font-size: 13px; }'
        );
        printWindow.document.write('.label { font-weight: bold; }');
        printWindow.document.write(
          '.total-row { display: flex; justify-content: space-between; padding: 8px 0; font-weight: bold; border-top: 2px solid #000; margin-top: 10px; }'
        );
        printWindow.document.write('</style>');
        printWindow.document.write('</head><body>');
        printWindow.document.write(
          '<div class="bill-header"><h2>Order Bill</h2></div>'
        );
        printWindow.document.write(
          '<div class="section"><h3>Customer Details</h3>'
        );
        printWindow.document.write(
          `<div class="details-row"><span class="label">Name:</span><span>${orderData.name}</span></div>`
        );
        printWindow.document.write(
          `<div class="details-row"><span class="label">Phone:</span><span>${orderData.phone}</span></div>`
        );
        if (orderData.email) {
          printWindow.document.write(
            `<div class="details-row"><span class="label">Email:</span><span>${orderData.email}</span></div>`
          );
        }
        printWindow.document.write(
          `<div class="details-row"><span class="label">Date:</span><span>${new Date().toLocaleDateString(
            'en-US',
            {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            }
          )}</span></div>`
        );
        printWindow.document.write(
          `<div class="details-row"><span class="label">Type:</span><span>Room Service</span></div>`
        );
        printWindow.document.write(
          `<div class="details-row"><span class="label">Room:</span><span>${orderData.roomNumber}</span></div>`
        );
        printWindow.document.write(
          `<div class="details-row"><span class="label">Payment:</span><span>${paymentMethod.toUpperCase()}${
            paymentMethod === 'upi'
              ? ` (${selectedUPIApp.toUpperCase()})`
              : ''
          }</span></div>`
        );
        printWindow.document.write('</div>');

        printWindow.document.write(
          '<div class="section"><h3>Items</h3>'
        );
        orderData.items.forEach((item) => {
          printWindow.document.write(
            `<div class="details-row"><span>${item.name} (₹${item.price} x ${
              item.quantity
            })</span><span>₹${(item.price * item.quantity).toFixed(
              0
            )}</span></div>`
          );
        });
        printWindow.document.write('</div>');

        printWindow.document.write(
          '<div class="section"><h3>Bill Summary</h3>'
        );
        printWindow.document.write(
          `<div class="details-row"><span>Subtotal</span><span>₹${orderData.subtotal.toFixed(
            0
          )}</span></div>`
        );
        printWindow.document.write(
          `<div class="details-row"><span>GST (5%)</span><span>₹${orderData.gst.toFixed(
            0
          )}</span></div>`
        );
        if (orderData.discountAmount > 0) {
          printWindow.document.write(
            `<div class="details-row"><span style="color: green;">Discount</span><span style="color: green;">-₹${orderData.discountAmount.toFixed(
              0
            )}</span></div>`
          );
        }
        printWindow.document.write(
          `<div class="total-row"><span>Total</span><span>₹${orderData.total.toFixed(
            0
          )}</span></div>`
        );
        printWindow.document.write('</div>');

        printWindow.document.write('</body></html>');
        printWindow.document.close();
        printWindow.print();
      }
    } catch (error) {
      console.error('Error printing bill:', error);
    }
  };

  const handleShareWhatsApp = () => {
    if (!orderData) return;

    const itemsList = orderData.items
      .map(
        (item) =>
          `• ${item.name} (₹${item.price} x ${item.quantity})`
      )
      .join('\n');
    const adminPhone =
      process.env.NEXT_PUBLIC_ADMIN_PHONE_NUMBER || '6306438696';

    const message = `📋 New Order Received\n\n👤 Customer Details:\nName: ${
      orderData.name
    }\nPhone: ${orderData.phone}\n${
      orderData.email ? `Email: ${orderData.email}\n` : ''
    }Order Type: Room Service\nRoom: ${
      orderData.roomNumber
    }\nPayment Method: ${paymentMethod.toUpperCase()}${
      paymentMethod === 'upi'
        ? ` (${selectedUPIApp.toUpperCase()})`
        : ''
    }\n\n📦 Items:\n${itemsList}\n\n💰 Payment Details:\nSubtotal: ₹${orderData.subtotal.toFixed(
      0
    )}\nGST (5%): ₹${orderData.gst.toFixed(0)}\n${
      orderData.discountAmount > 0
        ? `Discount: -₹${orderData.discountAmount.toFixed(0)}\n`
        : ''
    }Total: ₹${orderData.total.toFixed(0)}`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappURL = `https://wa.me/91${adminPhone}?text=${encodedMessage}`;
    window.open(whatsappURL, '_blank');
  };

  if (!orderData) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-b from-emerald-50 via-white to-lime-50">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <ShoppingCart className="h-10 w-10 text-emerald-300 mx-auto mb-3" />
            <p className="text-emerald-800 text-sm">
              Loading order details...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-emerald-50 via-white to-lime-50">
      <Navbar />

      <div className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        <button
          onClick={() => router.push('/cart')}
          className="inline-flex items-center text-emerald-700 hover:text-emerald-900 mb-6 font-semibold text-sm sm:text-base"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Cart
        </button>

        {paymentConfirmed ? (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white/95 rounded-3xl shadow-xl border border-emerald-100 p-6 sm:p-8 text-center">
              <div className="flex items-center justify-center mb-4">
                <CheckCircle className="h-14 w-14 text-emerald-500" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-emerald-900 mb-2">
                Payment Confirmed!
              </h2>
              <p className="text-emerald-900/75 mb-4">
                Your room order has been placed successfully at Lotus Palace.
              </p>
              <p className="text-xs text-emerald-900/60">
                Redirecting to your orders page...
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1.2fr)] gap-6 md:gap-8 items-start">
            {/* Left: Order summary */}
            <div
              id="bill-content"
              className="bg-white/95 rounded-3xl border border-emerald-100 shadow-lg p-5 sm:p-6 md:p-7"
            >
              <div className="flex items-center justify-between mb-4 sm:mb-5">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-emerald-900">
                    Order Summary
                  </h2>
                  <p className="text-xs sm:text-sm text-emerald-900/70 mt-1">
                    Review your room service order details before payment.
                  </p>
                </div>
              </div>

              <div className="mb-5 pb-5 border-b border-emerald-100">
                <h3 className="font-semibold text-emerald-900 mb-3 text-sm sm:text-base">
                  Guest & Room
                </h3>
                <div className="space-y-1.5 text-xs sm:text-sm text-emerald-900/80">
                  <p>
                    <span className="font-medium">Name:</span> {orderData.name}
                  </p>
                  <p>
                    <span className="font-medium">Phone:</span> {orderData.phone}
                  </p>
                  {orderData.email && (
                    <p>
                      <span className="font-medium">Email:</span> {orderData.email}
                    </p>
                  )}
                  <p>
                    <span className="font-medium">Room:</span>{' '}
                    {orderData.roomNumber}
                  </p>
                  <p>
                    <span className="font-medium">Date:</span>{' '}
                    {new Date().toLocaleDateString('en-IN', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                  <p>
                    <span className="font-medium">Service Type:</span> Room
                    Service
                  </p>
                  <p>
                    <span className="font-medium">Payment:</span>{' '}
                    {paymentMethod.toUpperCase()}
                    {paymentMethod === 'upi'
                      ? ` (${selectedUPIApp.toUpperCase()})`
                      : ''}
                  </p>
                </div>
              </div>

              <div className="mb-5 pb-5 border-b border-emerald-100">
                <h3 className="font-semibold text-emerald-900 mb-3 text-sm sm:text-base">
                  Items
                </h3>
                <div className="space-y-3">
                  {orderData.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex justify-between items-start gap-4 text-xs sm:text-sm"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-emerald-900">
                          {item.name}
                        </p>
                        <p className="text-emerald-900/70">
                          ₹{item.price} × {item.quantity}
                        </p>
                      </div>
                      <p className="font-semibold text-emerald-900 whitespace-nowrap">
                        ₹{(item.price * item.quantity).toFixed(0)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3 mb-5 pb-5 border-b border-emerald-100">
                <div className="flex justify-between items-center text-xs sm:text-sm">
                  <span className="text-emerald-900/70">Subtotal</span>
                  <span className="font-semibold text-emerald-900">
                    ₹{orderData.subtotal.toFixed(0)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs sm:text-sm">
                  <span className="text-emerald-900/70">GST (5%)</span>
                  <span className="font-semibold text-emerald-900">
                    ₹{orderData.gst.toFixed(0)}
                  </span>
                </div>
                {orderData.discountAmount > 0 && (
                  <div className="flex justify-between items-center text-xs sm:text-sm text-emerald-700">
                    <span>Discount</span>
                    <span className="font-semibold">
                      -₹{orderData.discountAmount.toFixed(0)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center text-base sm:text-lg font-bold pt-1">
                  <span className="text-emerald-900">Total</span>
                  <span className="text-emerald-700 text-lg sm:text-xl">
                    ₹{orderData.total.toFixed(0)}
                  </span>
                </div>
              </div>

              <div className="bg-emerald-50/80 p-4 rounded-2xl border border-emerald-100 text-xs sm:text-sm text-emerald-900/80">
                <p className="text-[11px] text-emerald-900/60 mb-1">
                  Temp Order Reference
                </p>
                <p className="font-mono font-semibold text-emerald-900 break-all">
                  {orderData.phone}-{Date.now()}
                </p>
              </div>

              <div className="mt-4 flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={handleShareWhatsApp}
                  className="flex-1 inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 px-4 rounded-xl text-xs sm:text-sm shadow-md hover:shadow-lg transition-all"
                >
                  <MessageCircle className="h-4 w-4" />
                  Share order on WhatsApp
                </button>
                {/* <button
                  type="button"
                  onClick={handlePrintBill}
                  className="inline-flex items-center justify-center gap-2 border border-emerald-200 text-emerald-800 hover:bg-emerald-50 rounded-xl px-3 py-2 text-xs sm:text-sm"
                >
                  Print bill
                </button> */}
              </div>
            </div>

            {/* Right: Payment section */}
            <div className="space-y-6">
              <div className="bg-white/95 rounded-3xl shadow-xl border border-emerald-100 p-5 sm:p-6 md:p-7">
                <div className="flex items-center gap-2 mb-5">
                  <div className="h-9 w-9 rounded-full bg-emerald-50 flex items-center justify-center border border-emerald-100">
                    <Wallet className="h-4 w-4 text-emerald-700" />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold text-emerald-900">
                      Payment
                    </h2>
                    <p className="text-xs sm:text-sm text-emerald-900/70">
                      Choose how you would like to pay for your room service.
                    </p>
                  </div>
                </div>

                {/* Payment Method Selection */}
                <div className="mb-6">
                  <h3 className="font-semibold text-emerald-900 mb-3 text-xs sm:text-sm">
                    Select Payment Method
                  </h3>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('upi')}
                      className={`flex-1 py-3 px-4 rounded-xl border-2 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
                        paymentMethod === 'upi'
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-800 shadow-sm'
                          : 'border-emerald-100 bg-white text-emerald-700 hover:border-emerald-200'
                      }`}
                    >
                      <Smartphone className="h-4 w-4" />
                      UPI
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('cash')}
                      className={`flex-1 py-3 px-4 rounded-xl border-2 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
                        paymentMethod === 'cash'
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-800 shadow-sm'
                          : 'border-emerald-100 bg-white text-emerald-700 hover:border-emerald-200'
                      }`}
                    >
                      <Wallet className="h-4 w-4" />
                      Cash
                    </button>
                  </div>
                </div>

                {paymentMethod === 'upi' && (
                  <div className="mb-6">
                    <h3 className="font-semibold text-emerald-900 mb-3 text-xs sm:text-sm">
                      UPI Payment
                    </h3>

                    <div className="bg-emerald-50/80 p-4 rounded-2xl border border-emerald-200 mb-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="text-[11px] text-emerald-900/60 mb-0.5">
                            UPI ID
                          </p>
                          <p className="font-mono font-semibold text-emerald-900 text-xs sm:text-sm">
                            {UPI_ID}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={handleCopyUPI}
                          className="p-2 hover:bg-emerald-100 rounded-xl transition"
                          title="Copy UPI ID"
                        >
                          <Copy className="h-4 w-4 text-emerald-700" />
                        </button>
                      </div>
                      {copiedUPI && (
                        <p className="text-[11px] text-emerald-700">
                          Copied to clipboard
                        </p>
                      )}
                    </div>

                    {/* UPI App Selection */}
                    <div className="mb-6">
                      <h4 className="font-semibold text-emerald-900 mb-3 text-xs sm:text-sm">
                        Choose your UPI app
                      </h4>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setSelectedUPIApp('gpay')}
                          className={`flex items-center gap-2 p-2.5 rounded-xl border-2 text-xs sm:text-sm transition-all ${
                            selectedUPIApp === 'gpay'
                              ? 'border-emerald-500 bg-emerald-50'
                              : 'border-emerald-100 bg-white hover:border-emerald-200'
                          }`}
                        >
                          <div className="w-7 h-7 bg-white border border-emerald-100 rounded-lg flex items-center justify-center">
                            <img
                              src="https://upload.wikimedia.org/wikipedia/commons/f/f2/Google_Pay_Logo.svg"
                              alt="Google Pay"
                              className="w-5 h-5"
                            />
                          </div>
                          <span>Google Pay</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setSelectedUPIApp('phonepe')}
                          className={`flex items-center gap-2 p-2.5 rounded-xl border-2 text-xs sm:text-sm transition-all ${
                            selectedUPIApp === 'phonepe'
                              ? 'border-emerald-500 bg-emerald-50'
                              : 'border-emerald-100 bg-white hover:border-emerald-200'
                          }`}
                        >
                          <div className="w-7 h-7 bg-white border border-emerald-100 rounded-lg flex items-center justify-center">
                            <img
                              src="https://upload.wikimedia.org/wikipedia/commons/7/71/PhonePe_Logo.svg"
                              alt="PhonePe"
                              className="w-5 h-5"
                            />
                          </div>
                          <span>PhonePe</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setSelectedUPIApp('paytm')}
                          className={`flex items-center gap-2 p-2.5 rounded-xl border-2 text-xs sm:text-sm transition-all ${
                            selectedUPIApp === 'paytm'
                              ? 'border-emerald-500 bg-emerald-50'
                              : 'border-emerald-100 bg-white hover:border-emerald-200'
                          }`}
                        >
                          <div className="w-7 h-7 bg-white border border-emerald-100 rounded-lg flex items-center justify-center">
                            <img
                              src="https://upload.wikimedia.org/wikipedia/commons/2/24/Paytm_Logo_%28standalone%29.svg"
                              alt="Paytm"
                              className="w-5 h-5"
                            />
                          </div>
                          <span>Paytm</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setSelectedUPIApp('amazonpay')}
                          className={`flex items-center gap-2 p-2.5 rounded-xl border-2 text-xs sm:text-sm transition-all ${
                            selectedUPIApp === 'amazonpay'
                              ? 'border-emerald-500 bg-emerald-50'
                              : 'border-emerald-100 bg-white hover:border-emerald-200'
                          }`}
                        >
                          <div className="w-7 h-7 bg-white border border-emerald-100 rounded-lg flex items-center justify-center">
                            <img
                              src="https://upload.wikimedia.org/wikipedia/commons/2/29/Amazon_Pay_logo.svg"
                              alt="Amazon Pay"
                              className="w-5 h-5"
                            />
                          </div>
                          <span>Amazon Pay</span>
                        </button>
                      </div>
                      <p className="text-[11px] text-emerald-900/70 mt-2 text-center">
                        Selected:{' '}
                        <span className="font-medium capitalize">
                          {selectedUPIApp}
                        </span>
                      </p>
                    </div>

                    <div className="bg-white p-4 rounded-2xl border border-emerald-100 flex items-center justify-center">
                      <QRCode value={getUPIQRValue()} size={150} />
                    </div>
                    <p className="text-[11px] text-emerald-900/70 text-center mt-3">
                      Scan with{' '}
                      <span className="font-medium capitalize">
                        {selectedUPIApp}
                      </span>{' '}
                      to complete the payment.
                    </p>
                  </div>
                )}

                {paymentMethod === 'cash' && (
                  <div className="mb-6">
                    <h3 className="font-semibold text-emerald-900 mb-3 text-xs sm:text-sm">
                      Cash Payment
                    </h3>
                    <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-200 text-center">
                      <div className="text-3xl mb-1">💵</div>
                      <p className="text-sm text-emerald-800 font-semibold">
                        Cash on Delivery Selected
                      </p>
                      <p className="text-[11px] text-emerald-700 mt-1">
                        Please keep the exact amount handy to pay our staff.
                      </p>
                    </div>
                  </div>
                )}

                <div className="mb-4">
                  <p className="text-xs sm:text-sm font-semibold text-emerald-900 mb-1.5">
                    Amount payable
                  </p>
                  <p className="text-2xl sm:text-3xl font-extrabold text-emerald-700">
                    ₹{orderData.total.toFixed(0)}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleConfirmPayment}
                  disabled={isSubmitting}
                  className={`w-full bg-gradient-to-r from-emerald-600 to-lime-600 hover:from-emerald-700 hover:to-lime-700 text-white font-semibold py-2.5 sm:py-3 rounded-xl shadow-md hover:shadow-lg transition-all text-sm sm:text-base mb-3 ${
                    isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
                  }`}
                >
                  {isSubmitting
                    ? 'Processing...'
                    : `Confirm ${paymentMethod.toUpperCase()} Payment`}
                </button>

                {orderError && (
                  <div className="text-red-500 text-xs sm:text-sm mb-3">
                    {orderError}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
