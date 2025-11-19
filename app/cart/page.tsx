'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShoppingCart, ArrowLeft, X, Gift } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import Navbar from '@/components/Navbar';
import CouponInput, { CouponOption } from '@/components/CouponInput';

// Price is already in INR, no need for conversion

export default function CartPage() {
  const { cart, getTotalItems, getTotalPrice, updateQuantity, removeFromCart, clearCart, isLoading } = useCart();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const orderType = 'Rooms';
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [roomNumber, setRoomNumber] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<CouponOption | null>(null);
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [couponError, setCouponError] = useState('');
  const [availableCoupons, setAvailableCoupons] = useState<CouponOption[]>([]);
  const [isCouponLoading, setIsCouponLoading] = useState(false);
  const [couponFetchError, setCouponFetchError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderError, setOrderError] = useState('');
  const previousUserHadAccount = useRef(false);
  const APPLIED_COUPON_STORAGE_KEY = 'cartAppliedCoupon';
  const SELECTED_ROOM_STORAGE_KEY = 'selectedRoomNumber';

  const syncUser = useCallback(() => {
    if (typeof window === 'undefined') {
      return;
    }
    const stored = window.localStorage.getItem('foodhubUser');
    if (!stored) {
      setUser(null);
      return;
    }
    try {
      const parsed = JSON.parse(stored);
      setUser(parsed);
    } catch {
      setUser(null);
    }
  }, []);

  const getStoredRoomNumber = useCallback(() => {
    if (typeof window === 'undefined') {
      return null;
    }
    const stored = window.localStorage.getItem(SELECTED_ROOM_STORAGE_KEY);
    if (!stored) {
      return null;
    }
    return stored;
  }, []);

  const clearStoredCoupon = useCallback(() => {
    if (typeof window === 'undefined') {
      return;
    }
    window.localStorage.removeItem(APPLIED_COUPON_STORAGE_KEY);
  }, [APPLIED_COUPON_STORAGE_KEY]);

  const applyCouponSelection = useCallback((coupon: CouponOption) => {
    setAppliedCoupon(coupon);
    clearStoredCoupon();
    setCouponCode('');
    setCouponError('');
  }, [clearStoredCoupon]);

  const clearAppliedCoupon = useCallback(() => {
    setAppliedCoupon(null);
    clearStoredCoupon();
    setCouponCode('');
    setCouponError('');
  }, [clearStoredCoupon]);

  const syncRoomFromStorage = useCallback(() => {
    if (!isHydrated) {
      return;
    }
    const storedRoom = getStoredRoomNumber();
    const userRoom = user?.roomNumber ? user.roomNumber.toString() : null;
    const nextRoom = storedRoom || userRoom;
    if (nextRoom) {
      setRoomNumber((current) => (current === nextRoom ? current : nextRoom));
    } else {
      setRoomNumber((current) => (current === '' ? current : ''));
    }
  }, [getStoredRoomNumber, isHydrated, user?.roomNumber]);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    syncUser();
    syncRoomFromStorage();

    const handleStorage = (event: StorageEvent) => {
      if (event.key === 'foodhubUser') {
        syncUser();
      }
      if (!event.key || event.key === SELECTED_ROOM_STORAGE_KEY) {
        syncRoomFromStorage();
      }
    };

    const handleAuthChange = () => {
      syncUser();
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener('foodhub-auth-change', handleAuthChange);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('foodhub-auth-change', handleAuthChange);
    };
  }, [isHydrated, syncRoomFromStorage, syncUser]);

  const fetchAvailableCoupons = useCallback(async () => {
    if (!isHydrated) {
      return;
    }

    setIsCouponLoading(true);
    setCouponFetchError('');

    try {
      const response = await fetch('/api/coupons?activeOnly=true');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load coupons');
      }

      const couponsFromServer = Array.isArray(data.coupons) ? data.coupons : [];
      const mappedCoupons: CouponOption[] = couponsFromServer.map((coupon: any) => {
        const discountValue = typeof coupon.value === 'number' ? coupon.value : Number(coupon.value) || 0;
        return {
          id: coupon._id?.toString?.() ?? coupon.id ?? coupon.code,
          code: coupon.code,
          name: coupon.description || (coupon.discountType === 'percentage' ? `${discountValue}% Off` : `₹${discountValue} Off`),
          description: coupon.description || undefined,
          discount: discountValue,
          type: coupon.discountType,
          minOrder: coupon.minimumOrderAmount,
          expiryDate: typeof coupon.expiryDate === 'string' ? coupon.expiryDate : new Date(coupon.expiryDate).toISOString(),
          isActive: coupon.isActive,
          usageLimit: coupon.usageLimit,
          usedCount: coupon.usedCount,
        } as CouponOption;
      });

      setAvailableCoupons(mappedCoupons);
      setAppliedCoupon((current) => {
        if (!current) {
          clearStoredCoupon();
          return null;
        }
        const next = mappedCoupons.find((coupon) => coupon.code === current.code) || null;
        if (!next) {
          setCouponError('Previously applied coupon is no longer available.');
          clearStoredCoupon();
        }
        return next;
      });
    } catch (error: any) {
      console.error('Failed to load coupons:', error);
      setCouponFetchError(error.message || 'Failed to load coupons');
    } finally {
      setIsCouponLoading(false);
    }
  }, [isHydrated, clearStoredCoupon]);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }
    fetchAvailableCoupons();
  }, [isHydrated, fetchAvailableCoupons]);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    if (!user) {
      setCustomerName('');
      setCustomerPhone('');
      setCustomerEmail('');
      if (!getStoredRoomNumber()) {
        setRoomNumber('');
      }
      return;
    }

    setCustomerName(user.name ?? '');
    setCustomerPhone(user.phone ?? '');
    setCustomerEmail(user.email ?? '');
    if (user.roomNumber) {
      setRoomNumber(user.roomNumber.toString());
    }
  }, [isHydrated, user?.name, user?.phone, user?.email, user?.roomNumber, user, getStoredRoomNumber]);

  useEffect(() => {
    if (isHydrated) {
      syncRoomFromStorage();
    }
  }, [isHydrated, syncRoomFromStorage]);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    if (!user) {
      if (previousUserHadAccount.current) {
        clearCart();
      }
      previousUserHadAccount.current = false;
      return;
    }

    previousUserHadAccount.current = true;
  }, [isHydrated, user, clearCart]);

  const subtotal = getTotalPrice();
  const gst = subtotal * 0.05;
  const subtotalWithGST = subtotal + gst;

  const discountAmount = appliedCoupon
    ? appliedCoupon.type === 'percentage'
      ? (subtotalWithGST * appliedCoupon.discount) / 100
      : appliedCoupon.discount
    : 0;

  const total = Math.max(0, subtotalWithGST - discountAmount);

  const normalizeCode = useCallback((value: string) => value.trim().toUpperCase(), []);

  const findCouponByCode = useCallback(
    (code: string) => {
      const normalized = normalizeCode(code);
      return availableCoupons.find((coupon) => normalizeCode(coupon.code) === normalized) || null;
    },
    [availableCoupons, normalizeCode]
  );

  const isCouponValidForOrder = useCallback(
    (coupon: CouponOption | null) => {
      if (!coupon) {
        setCouponError('Invalid coupon code');
        return false;
      }

      if (coupon.minOrder && subtotalWithGST < coupon.minOrder) {
        setCouponError(`Minimum order amount ₹${coupon.minOrder} required`);
        return false;
      }

      const expiryDate = coupon.expiryDate ? new Date(coupon.expiryDate) : null;
      if (expiryDate && !Number.isNaN(expiryDate.getTime()) && expiryDate <= new Date()) {
        setCouponError('This coupon has expired');
        return false;
      }

      if (coupon.isActive === false) {
        setCouponError('This coupon is not active');
        return false;
      }

      if (coupon.usageLimit && coupon.usedCount && coupon.usedCount >= coupon.usageLimit) {
        setCouponError('This coupon usage limit has been reached');
        return false;
      }

      return true;
    },
    [subtotalWithGST]
  );

  useEffect(() => {
    if (!isHydrated) {
      return;
    }
    clearStoredCoupon();
  }, [isHydrated, clearStoredCoupon]);

  const handleApplyCoupon = useCallback(async () => {
    setCouponError('');
    const normalized = normalizeCode(couponCode);
    if (!normalized) {
      setCouponError('Please enter a coupon code');
      return;
    }

    let coupon = findCouponByCode(normalized);

    if (!coupon) {
      try {
        const response = await fetch(`/api/coupons?code=${encodeURIComponent(normalized)}&activeOnly=true`);
        const data = await response.json();
        if (response.ok && Array.isArray(data.coupons) && data.coupons.length > 0) {
          const mapped = data.coupons.map((serverCoupon: any) => {
            const serverDiscount = typeof serverCoupon.value === 'number' ? serverCoupon.value : Number(serverCoupon.value) || 0;
            return {
              id: serverCoupon._id?.toString?.() ?? serverCoupon.id ?? serverCoupon.code,
              code: serverCoupon.code,
              name: serverCoupon.description || (serverCoupon.discountType === 'percentage' ? `${serverDiscount}% Off` : `₹${serverDiscount} Off`),
              discount: serverDiscount,
              type: serverCoupon.discountType,
              description: serverCoupon.description,
              minOrder: serverCoupon.minimumOrderAmount,
              expiryDate: typeof serverCoupon.expiryDate === 'string' ? serverCoupon.expiryDate : new Date(serverCoupon.expiryDate).toISOString(),
              isActive: serverCoupon.isActive,
              usageLimit: serverCoupon.usageLimit,
              usedCount: serverCoupon.usedCount,
            } as CouponOption;
          });
          setAvailableCoupons((prev) => {
            const merged = [...prev];
            mapped.forEach((item: CouponOption) => {
              if (!merged.some((existing) => normalizeCode(existing.code) === normalizeCode(item.code))) {
                merged.push(item);
              }
            });
            return merged;
          });
          coupon = mapped[0];
        }
      } catch (error: any) {
        console.error('Failed to verify coupon:', error);
        setCouponError(error.message || 'Failed to verify coupon');
      }
    }

    if (!isCouponValidForOrder(coupon)) {
      return;
    }

    applyCouponSelection(coupon as CouponOption);
  }, [couponCode, normalizeCode, findCouponByCode, isCouponValidForOrder, applyCouponSelection]);

  const handleSelectCoupon = useCallback(
    (coupon: CouponOption) => {
      if (!isCouponValidForOrder(coupon)) {
        return;
      }
      applyCouponSelection(coupon);
      setShowCouponModal(false);
    },
    [isCouponValidForOrder, applyCouponSelection]
  );

  const handleRefreshCoupons = useCallback(() => {
    fetchAvailableCoupons();
  }, [fetchAvailableCoupons]);

  useEffect(() => {
    if (appliedCoupon && appliedCoupon.minOrder && subtotalWithGST < appliedCoupon.minOrder) {
      setAppliedCoupon(null);
      clearStoredCoupon();
      setCouponCode('');
      setCouponError(`Coupon removed: Minimum order amount ₹${appliedCoupon.minOrder} required`);
    } else if (couponError && appliedCoupon && subtotalWithGST >= (appliedCoupon.minOrder || 0)) {
      setCouponError('');
    }
  }, [appliedCoupon, couponError, subtotalWithGST, clearStoredCoupon]);

  if (!isHydrated) {
    return null;
  }

  const handleRemoveCoupon = () => {
    clearAppliedCoupon();
  };

  const handlePlaceOrder = async () => {
    if (isSubmitting) return;
    
    setOrderError('');
    
    if (!customerName.trim() || !customerPhone.trim() || !roomNumber.trim()) {
      alert('Please fill in all fields');
      return;
    }

    try {
      setIsSubmitting(true);
      
      const userId = user?._id ?? user?.id;
      const completeOrderData = {
        userId,
        name: customerName,
        phone: customerPhone,
        email: customerEmail || undefined,
        orderType: 'Rooms',
        roomNumber,
        items: cart,
        subtotal,
        gst,
        discountAmount,
        total,
        couponCode: appliedCoupon?.code,
        couponId: appliedCoupon?.id,
        couponDiscountType: appliedCoupon?.type,
        couponDiscountValue: appliedCoupon?.discount,
      };
      
      localStorage.setItem('pendingOrder', JSON.stringify(completeOrderData));
      localStorage.setItem('userPhone', customerPhone);
      if (userId) {
        localStorage.setItem('userId', userId);
      } else {
        localStorage.removeItem('userId');
      }
      clearAppliedCoupon();
      router.push('/checkout');
    } catch (error: any) {
      console.error('Error preparing order:', error);
      setOrderError(error.message || 'Failed to prepare order. Please try again.');
      alert(`Error: ${error.message || 'Failed to prepare order. Please try again.'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />

      <div className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        <Link href="/" className="flex items-center text-orange-600 hover:text-orange-700 mb-6 font-semibold">
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to Menu
        </Link>

        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-6 md:mb-8">Your Cart</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          <div>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-white rounded-lg shadow p-4 sm:p-6 animate-pulse">
                    <div className="flex gap-4">
                      <div className="h-20 w-20 sm:h-24 sm:w-24 bg-gray-200 rounded-md flex-shrink-0" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-3/4" />
                        <div className="h-4 bg-gray-200 rounded w-1/2" />
                        <div className="h-4 bg-gray-200 rounded w-1/4" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : cart.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-8 flex flex-col items-center justify-center text-center">
                <ShoppingCart className="h-16 w-16 text-gray-300 mb-4" />
                <p className="text-gray-500 text-lg mb-4">Your cart is empty</p>
                <Link href="/">
                  <Button className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white">
                    Continue Shopping
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {cart.map((item) => (
                  <div key={item.id} className="bg-white rounded-lg shadow p-4 sm:p-6">
                    <div className="flex gap-4">
                      <img
                        src={item.image_url || '/placeholder.jpg'}
                        alt={item.name}
                        className="h-20 w-20 sm:h-24 sm:w-24 object-cover rounded-md flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-lg text-gray-900 truncate">{item.name}</h3>
                        <p className="text-orange-600 font-bold text-lg mt-2">₹{item.price.toFixed(0)}</p>
                        <div className="flex items-center gap-2 mt-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="h-8 w-8 p-0"
                          >
                            -
                          </Button>
                          <span className="text-sm font-medium w-8 text-center">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="h-8 w-8 p-0"
                          >
                            +
                          </Button>
                          <span className="text-sm text-gray-600 ml-4">
                            Subtotal: ₹{(item.price * item.quantity).toFixed(0)}
                          </span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFromCart(item.id)}
                        className="text-red-500 hover:text-red-700 h-10 w-10 p-0 flex-shrink-0"
                      >
                        <X className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {cart.length > 0 && (
            <div>
              <div className="bg-white rounded-lg shadow p-4 sm:p-6 sticky top-20 md:top-24 z-10">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 sm:mb-6">Order Summary</h2>

 <div className="space-y-3 mb-6 pb-6 border-b">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Items ({getTotalItems()})</span>
                    <span className="font-semibold text-gray-900">₹{subtotal.toFixed(0)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-m text-gray-600">GST (5%)</span>
                    <span className="font-semibold text-gray-900">₹{gst.toFixed(0)}</span>
                  </div>
                  {appliedCoupon && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-green-600 flex items-center gap-1">
                        <Gift className="h-4 w-4" />
                        {appliedCoupon.name}
                      </span>
                      <span className="font-semibold text-green-600">-₹{discountAmount.toFixed(0)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center text-base font-bold pt-2">
                    <span>Total:</span>
                    <span className="text-orange-600 text-lg">₹{total.toFixed(0)}</span>
                  </div>
                </div>

                <CouponInput
                  couponCode={couponCode}
                  setCouponCode={(value) => {
                    setCouponCode(value);
                    setCouponError('');
                  }}
                  appliedCoupon={appliedCoupon}
                  showCouponModal={showCouponModal}
                  setShowCouponModal={setShowCouponModal}
                  couponError={couponError}
                  handleApplyCoupon={handleApplyCoupon}
                  handleSelectCoupon={handleSelectCoupon}
                  handleRemoveCoupon={handleRemoveCoupon}
                  subtotalWithGST={subtotalWithGST}
                  availableCoupons={availableCoupons}
                  isCouponLoading={isCouponLoading}
                  couponFetchError={couponFetchError}
                  onRefreshCoupons={handleRefreshCoupons}
                />

                <form onSubmit={(e) => { e.preventDefault(); handlePlaceOrder(); }} className="space-y-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Room Number
                      {user?.roomNumber && <span className="text-xs text-green-600 ml-2">(Auto-filled)</span>}
                    </label>
                    <input
                      type="text"
                      placeholder="Enter room number"
                      value={roomNumber}
                      onChange={(e) => setRoomNumber(e.target.value)}
                      readOnly={!!user?.roomNumber}
                      className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                        user?.roomNumber ? 'bg-gray-100 cursor-not-allowed' : ''
                      }`}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                    <input
                      type="text"
                      placeholder="Enter your name"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                    <input
                      type="tel"
                      placeholder="Enter your phone number"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email (Optional)</label>
                    <input
                      type="email"
                      placeholder="Enter your email"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>



                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className={`w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold py-3 rounded-lg transition-all duration-200 ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
                  >
                    {isSubmitting ? 'Processing...' : 'Place Order'}
                  </Button>
                  
                  {orderError && (
                    <div className="mt-2 text-red-500 text-sm">
                      {orderError}
                    </div>
                  )}
                </form>

                <Button
                  variant="outline"
                  onClick={clearCart}
                  className="w-full"
                >
                  Clear Cart
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

    
    </div>
  );
}
