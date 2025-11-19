'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Download, MessageCircle, CheckCircle, Copy, Smartphone, Wallet, ShoppingCart } from 'lucide-react';
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
  orderType: 'dine-in' | 'takeaway' | 'delivery';
  tableNumber?: string;
  deliveryAddress?: string;
  deliveryNotes?: string;
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

    // Different UPI apps have different URL schemes
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

      // Validate items array
      if (!orderData.items || orderData.items.length === 0) {
        throw new Error('Cart is empty. Please add items before checkout.');
      }

      // Validate and transform items
      const validatedItems = orderData.items.map((item: OrderItem) => {
        if (!item.id || !item.name || typeof item.price !== 'number' || typeof item.quantity !== 'number') {
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

      // Validate numeric fields
      const subtotal = Number(orderData.subtotal);
      const gst = Number(orderData.gst);
      const discountAmount = Number(orderData.discountAmount);
      const total = Number(orderData.total);

      if (isNaN(subtotal) || isNaN(gst) || isNaN(total)) {
        throw new Error('Invalid price values. Please refresh and try again.');
      }

      // Step 1: Create the order
      const orderPayload = {
        userId: orderData.userId,
        customerName: orderData.name?.trim(),
        customerPhone: orderData.phone?.trim(),
        customerEmail: orderData.email?.trim() || undefined,
        items: validatedItems,
        orderType: orderData.orderType,
        tableNumber: orderData.orderType === 'dine-in' ? orderData.tableNumber?.trim() : undefined,
        deliveryAddress: orderData.orderType === 'delivery' ? orderData.deliveryAddress?.trim() : undefined,
        deliveryNotes: orderData.orderType === 'delivery' ? orderData.deliveryNotes?.trim() : undefined,
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
        const errorMessage = orderResult.errors?.length > 0
          ? `Validation error: ${orderResult.errors.join(', ')}`
          : orderResult.message || 'Failed to create order';
        throw new Error(errorMessage);
      }

      console.log('Order created successfully:', orderResult.data);
      const orderId = orderResult.data._id;

      // Step 2: Add payment to the order
      const paymentPayload = {
        createPayment: true,
        payment: {
          method: paymentMethod === 'upi' ? 'UPI' : 'Cash',
          status: paymentMethod === 'upi' ? 'UPI-completed' : 'Pending',
          amount: total,
          transactionId: paymentMethod === 'upi' ? selectedUPIApp : undefined,
        },
      };

      console.log('Adding payment to order:', orderId, JSON.stringify(paymentPayload, null, 2));

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

      // Step 3: Update table status to occupied for dine-in orders
      if (orderData.orderType === 'dine-in' && orderData.tableNumber) {
        try {
          // Fetch all tables to find the one with matching tableNumber
          const tablesResponse = await fetch('/api/tables');
          const tablesData = await tablesResponse.json();

          if (tablesData.success && tablesData.data) {
            const table = tablesData.data.find(
              (t: any) => t.tableNumber.toString() === orderData.tableNumber?.toString()
            );

            if (table && table._id) {
              // Update table status to occupied
              const tableUpdateResponse = await fetch('/api/tables', {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  tableId: table._id,
                  status: 'occupied',
                }),
              });

              const tableUpdateResult = await tableUpdateResponse.json();
              if (tableUpdateResult.success) {
                console.log('Table marked as occupied:', tableUpdateResult.data);
              } else {
                console.warn('Failed to mark table as occupied:', tableUpdateResult.message);
              }
            }
          }
        } catch (tableError: any) {
          console.warn('Error updating table status:', tableError.message);
          // Don't fail the order if table update fails
        }
      }

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

  const handleDownloadBill = () => {
    handlePrintBill();
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
        printWindow.document.write('body { font-family: Arial, sans-serif; margin: 20px; }');
        printWindow.document.write('.bill-header { text-align: center; margin-bottom: 20px; }');
        printWindow.document.write('.bill-header h2 { margin: 0; font-size: 20px; }');
        printWindow.document.write('.section { margin-bottom: 20px; }');
        printWindow.document.write('.section h3 { margin: 10px 0; font-size: 14px; border-bottom: 1px solid #ccc; padding-bottom: 5px; }');
        printWindow.document.write('.details-row { display: flex; justify-content: space-between; padding: 5px 0; font-size: 13px; }');
        printWindow.document.write('.label { font-weight: bold; }');
        printWindow.document.write('.total-row { display: flex; justify-content: space-between; padding: 8px 0; font-weight: bold; border-top: 2px solid #000; margin-top: 10px; }');
        printWindow.document.write('</style>');
        printWindow.document.write('</head><body>');
        printWindow.document.write('<div class="bill-header"><h2>Order Bill</h2></div>');
        printWindow.document.write('<div class="section"><h3>Customer Details</h3>');
        printWindow.document.write(`<div class="details-row"><span class="label">Name:</span><span>${orderData.name}</span></div>`);
        printWindow.document.write(`<div class="details-row"><span class="label">Phone:</span><span>${orderData.phone}</span></div>`);
        if (orderData.email) {
          printWindow.document.write(`<div class="details-row"><span class="label">Email:</span><span>${orderData.email}</span></div>`);
        }
        printWindow.document.write(`<div class="details-row"><span class="label">Date:</span><span>${new Date().toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })}</span></div>`);
        printWindow.document.write(`<div class="details-row"><span class="label">Type:</span><span>${orderData.orderType.charAt(0).toUpperCase() + orderData.orderType.slice(1)}</span></div>`);
        printWindow.document.write(`<div class="details-row"><span class="label">Payment:</span><span>${paymentMethod.toUpperCase()}${paymentMethod === 'upi' ? ` (${selectedUPIApp.toUpperCase()})` : ''}</span></div>`);
        if (orderData.orderType === 'dine-in') {
          printWindow.document.write(`<div class="details-row"><span class="label">Table:</span><span>${orderData.tableNumber}</span></div>`);
        }
        if (orderData.orderType === 'delivery') {
          printWindow.document.write(`<div class="details-row"><span class="label">Address:</span><span>${orderData.deliveryAddress}</span></div>`);
        }
        printWindow.document.write('</div>');
        
        printWindow.document.write('<div class="section"><h3>Items</h3>');
        orderData.items.forEach((item) => {
          printWindow.document.write(`<div class="details-row"><span>${item.name} (₹${item.price} x ${item.quantity})</span><span>₹${(item.price * item.quantity).toFixed(0)}</span></div>`);
        });
        printWindow.document.write('</div>');
        
        printWindow.document.write('<div class="section"><h3>Bill Summary</h3>');
        printWindow.document.write(`<div class="details-row"><span>Subtotal</span><span>₹${orderData.subtotal.toFixed(0)}</span></div>`);
        printWindow.document.write(`<div class="details-row"><span>GST (5%)</span><span>₹${orderData.gst.toFixed(0)}</span></div>`);
        if (orderData.discountAmount > 0) {
          printWindow.document.write(`<div class="details-row"><span style="color: green;">Discount</span><span style="color: green;">-₹${orderData.discountAmount.toFixed(0)}</span></div>`);
        }
        printWindow.document.write(`<div class="total-row"><span>Total</span><span>₹${orderData.total.toFixed(0)}</span></div>`);
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

    const itemsList = orderData.items.map((item) => `• ${item.name} (₹${item.price} x ${item.quantity})`).join('\n');
    const orderType = orderData.orderType.charAt(0).toUpperCase() + orderData.orderType.slice(1);
    const adminPhone = process.env.NEXT_PUBLIC_ADMIN_PHONE_NUMBER || '6306438696';

    const message = `📋 New Order Received\n\n👤 Customer Details:\nName: ${orderData.name}\nPhone: ${orderData.phone}\n${orderData.email ? `Email: ${orderData.email}\n` : ''}Order Type: ${orderType}\nPayment Method: ${paymentMethod.toUpperCase()}${paymentMethod === 'upi' ? ` (${selectedUPIApp.toUpperCase()})` : ''}\n${orderData.orderType === 'dine-in' ? `Table: ${orderData.tableNumber}\n` : ''}${orderData.orderType === 'delivery' ? `Address: ${orderData.deliveryAddress}\n` : ''}\n📦 Items:\n${itemsList}\n\n💰 Payment Details:\nSubtotal: ₹${orderData.subtotal.toFixed(0)}\nGST (5%): ₹${orderData.gst.toFixed(0)}\n${orderData.discountAmount > 0 ? `Discount: -₹${orderData.discountAmount.toFixed(0)}\n` : ''}Total: ₹${orderData.total.toFixed(0)}`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappURL = `https://wa.me/91${adminPhone}?text=${encodedMessage}`;
    window.open(whatsappURL, '_blank');
  };

  if (!orderData) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-500">Loading order details...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />

      <div className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        <button
          onClick={() => router.push('/cart')}
          className="flex items-center text-orange-600 hover:text-orange-700 mb-6 font-semibold"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to Cart
        </button>

        {paymentConfirmed ? (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-lg shadow p-6 sm:p-8 text-center">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Payment Confirmed!</h2>
              <p className="text-gray-600 mb-4">Your order has been placed successfully.</p>
              <p className="text-sm text-gray-500">Redirecting to orders page...</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            <div id="bill-content" className="bg-white rounded-lg shadow p-4 sm:p-6">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Order Summary</h2>

              <div className="mb-6 pb-6 border-b">
                <h3 className="font-semibold text-gray-900 mb-3">Customer Details</h3>
                <div className="space-y-2 text-sm text-gray-600">
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
                    <span className="font-medium">Date:</span> {new Date().toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                  <p>
                    <span className="font-medium">Type:</span>{' '}
                    {orderData.orderType.charAt(0).toUpperCase() + orderData.orderType.slice(1)}
                  </p>
                  <p>
                    <span className="font-medium">Payment:</span> {paymentMethod.toUpperCase()}{paymentMethod === 'upi' ? ` (${selectedUPIApp.toUpperCase()})` : ''}
                  </p>
                  {orderData.orderType === 'dine-in' && (
                    <p>
                      <span className="font-medium">Table:</span> {orderData.tableNumber}
                    </p>
                  )}
                  {orderData.orderType === 'delivery' && (
                    <p>
                      <span className="font-medium">Address:</span> {orderData.deliveryAddress}
                    </p>
                  )}
                </div>
              </div>

              <div className="mb-6 pb-6 border-b">
                <h3 className="font-semibold text-gray-900 mb-3">Items</h3>
                <div className="space-y-3">
                  {orderData.items.map((item) => (
                    <div key={item.id} className="flex justify-between items-start gap-4 text-sm">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{item.name}</p>
                        <p className="text-gray-600">₹{item.price} x {item.quantity}</p>
                      </div>
                      <p className="font-medium text-gray-900 whitespace-nowrap">₹{(item.price * item.quantity).toFixed(0)}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3 mb-6 pb-6 border-b">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-semibold">₹{orderData.subtotal.toFixed(0)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">GST (5%)</span>
                  <span className="font-semibold">₹{orderData.gst.toFixed(0)}</span>
                </div>
                {orderData.discountAmount > 0 && (
                  <div className="flex justify-between items-center text-sm text-green-600">
                    <span>Discount</span>
                    <span className="font-semibold">-₹{orderData.discountAmount.toFixed(0)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center text-lg font-bold pt-2">
                  <span>Total</span>
                  <span className="text-orange-600">₹{orderData.total.toFixed(0)}</span>
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 text-sm text-gray-600">
                <p className="text-xs text-gray-500 mb-1">Order ID</p>
                <p className="font-mono font-semibold text-gray-900">{orderData.phone}-{Date.now()}</p>
              </div>

              <div className="mt-4">
                <button
                  onClick={handleShareWhatsApp}
                  className="w-full inline-flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200"
                >
                  <MessageCircle className="h-4 w-4" />
                  Share Order on WhatsApp
                </button>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow p-4 sm:p-6">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 sm:mb-6">Payment</h2>

                {/* Payment Method Selection */}
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-900 mb-3 text-sm">Select Payment Method</h3>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setPaymentMethod('upi')}
                      className={`flex-1 py-3 px-4 rounded-lg border-2 font-semibold transition-all duration-200 ${
                        paymentMethod === 'upi'
                          ? 'border-orange-500 bg-orange-50 text-orange-700'
                          : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      UPI Payment
                    </button>
                    <button
                      onClick={() => setPaymentMethod('cash')}
                      className={`flex-1 py-3 px-4 rounded-lg border-2 font-semibold transition-all duration-200 ${
                        paymentMethod === 'cash'
                          ? 'border-orange-500 bg-orange-50 text-orange-700'
                          : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      Cash Payment
                    </button>
                  </div>
                </div>

                {paymentMethod === 'upi' && (
                  <div className="mb-6">
                    <h3 className="font-semibold text-gray-900 mb-3 text-sm">UPI Payment</h3>
                  <div className="bg-orange-50 p-4 rounded-lg border border-orange-200 mb-4">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">UPI ID</p>
                        <p className="font-mono font-semibold text-gray-900">{UPI_ID}</p>
                      </div>
                      <button
                        onClick={handleCopyUPI}
                        className="p-2 hover:bg-orange-100 rounded-lg transition"
                        title="Copy UPI ID"
                      >
                        <Copy className="h-4 w-4 text-orange-600" />
                      </button>
                    </div>
                    {copiedUPI && <p className="text-xs text-green-600">Copied to clipboard!</p>}
                  </div>

                  {/* UPI App Selection */}
                  <div className="mb-6">
                    <h4 className="font-semibold text-gray-900 mb-3 text-sm">Choose your UPI App</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => setSelectedUPIApp('gpay')}
                        className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all duration-200 ${
                          selectedUPIApp === 'gpay'
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                      >
                        <div className="w-8 h-8 bg-white border border-gray-300 rounded-lg flex items-center justify-center">
                          <img src="https://upload.wikimedia.org/wikipedia/commons/f/f2/Google_Pay_Logo.svg" alt="Google Pay" className="w-6 h-6" />
                        </div>
                        <span className="text-sm font-medium">Google Pay</span>
                      </button>

                      <button
                        onClick={() => setSelectedUPIApp('phonepe')}
                        className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all duration-200 ${
                          selectedUPIApp === 'phonepe'
                            ? 'border-purple-500 bg-purple-50'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                      >
                        <div className="w-8 h-8 bg-white border border-gray-300 rounded-lg flex items-center justify-center">
                          <img src="https://upload.wikimedia.org/wikipedia/commons/7/71/PhonePe_Logo.svg" alt="PhonePe" className="w-6 h-6" />
                        </div>
                        <span className="text-sm font-medium">PhonePe</span>
                      </button>

                      <button
                        onClick={() => setSelectedUPIApp('paytm')}
                        className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all duration-200 ${
                          selectedUPIApp === 'paytm'
                            ? 'border-blue-600 bg-blue-50'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                      >
                        <div className="w-8 h-8 bg-white border border-gray-300 rounded-lg flex items-center justify-center">
                          <img src="https://upload.wikimedia.org/wikipedia/commons/2/24/Paytm_Logo_%28standalone%29.svg" alt="Paytm" className="w-6 h-6" />
                        </div>
                        <span className="text-sm font-medium">Paytm</span>
                      </button>

                      <button
                        onClick={() => setSelectedUPIApp('amazonpay')}
                        className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all duration-200 ${
                          selectedUPIApp === 'amazonpay'
                            ? 'border-orange-500 bg-orange-50'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                      >
                        <div className="w-8 h-8 bg-white border border-gray-300 rounded-lg flex items-center justify-center">
                          <img src="https://upload.wikimedia.org/wikipedia/commons/2/29/Amazon_Pay_logo.svg" alt="Amazon Pay" className="w-6 h-6" />
                        </div>
                        <span className="text-sm font-medium">Amazon Pay</span>
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-2 text-center">
                      Selected: <span className="font-medium capitalize">{selectedUPIApp}</span>
                    </p>
                  </div>

                  <div className="bg-white p-4 rounded-lg border border-gray-200 flex items-center justify-center">
                    <QRCode value={getUPIQRValue()} size={150} />
                  </div>
                  <p className="text-xs text-gray-500 text-center mt-3">
                    Scan QR code with <span className="font-medium capitalize">{selectedUPIApp}</span> to pay
                  </p>
                  </div>
                )}

                {paymentMethod === 'cash' && (
                  <div className="mb-6">
                    <h3 className="font-semibold text-gray-900 mb-3 text-sm">Cash Payment</h3>
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                      <div className="text-center">
                        <div className="text-4xl mb-2">💵</div>
                        <p className="text-sm text-green-800 font-semibold">Cash Payment Selected</p>
                        <p className="text-xs text-green-600 mt-1">Please pay in cash at the counter when you arrive</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="mb-4">
                  <p className="text-sm font-semibold text-gray-900 mb-2">Amount to Pay</p>
                  <p className="text-2xl sm:text-3xl font-bold text-orange-600">₹{orderData.total.toFixed(0)}</p>
                </div>

                <button
                  onClick={handleConfirmPayment}
                  disabled={isSubmitting}
                  className={`w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold py-3 rounded-lg transition-all duration-200 mb-3 ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  {isSubmitting ? 'Processing...' : `Confirm ${paymentMethod.toUpperCase()} Payment`}
                </button>

                {orderError && <div className="text-red-500 text-sm mb-3">{orderError}</div>}
              </div>


            </div>
          </div>
        )}


      </div>
    </div>
  );
}



 