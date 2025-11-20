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
  const {
    cart,
    getTotalItems,
    getTotalPrice,
    updateQuantity,
    removeFromCart,
    clearCart,
    isLoading,
  } = useCart();
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

  const applyCouponSelection = useCallback(
    (coupon: CouponOption) => {
      setAppliedCoupon(coupon);
      clearStoredCoupon();
      setCouponCode('');
      setCouponError('');
    },
    [clearStoredCoupon]
  );

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
        const discountValue =
          typeof coupon.value === 'number' ? coupon.value : Number(coupon.value) || 0;
        return {
          id: coupon._id?.toString?.() ?? coupon.id ?? coupon.code,
          code: coupon.code,
          name:
            coupon.description ||
            (coupon.discountType === 'percentage'
              ? `${discountValue}% Off`
              : `₹${discountValue} Off`),
          description: coupon.description || undefined,
          discount: discountValue,
          type: coupon.discountType,
          minOrder: coupon.minimumOrderAmount,
          expiryDate:
            typeof coupon.expiryDate === 'string'
              ? coupon.expiryDate
              : new Date(coupon.expiryDate).toISOString(),
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
        const next =
          mappedCoupons.find((coupon) => coupon.code === current.code) || null;
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
  }, [
    isHydrated,
    user?.name,
    user?.phone,
    user?.email,
    user?.roomNumber,
    user,
    getStoredRoomNumber,
  ]);

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
      return (
        availableCoupons.find(
          (coupon) => normalizeCode(coupon.code) === normalized
        ) || null
      );
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
      if (
        expiryDate &&
        !Number.isNaN(expiryDate.getTime()) &&
        expiryDate <= new Date()
      ) {
        setCouponError('This coupon has expired');
        return false;
      }

      if (coupon.isActive === false) {
        setCouponError('This coupon is not active');
        return false;
      }

      if (
        coupon.usageLimit &&
        coupon.usedCount &&
        coupon.usedCount >= coupon.usageLimit
      ) {
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
        const response = await fetch(
          `/api/coupons?code=${encodeURIComponent(normalized)}&activeOnly=true`
        );
        const data = await response.json();
        if (response.ok && Array.isArray(data.coupons) && data.coupons.length > 0) {
          const mapped = data.coupons.map((serverCoupon: any) => {
            const serverDiscount =
              typeof serverCoupon.value === 'number'
                ? serverCoupon.value
                : Number(serverCoupon.value) || 0;
            return {
              id: serverCoupon._id?.toString?.() ?? serverCoupon.id ?? serverCoupon.code,
              code: serverCoupon.code,
              name:
                serverCoupon.description ||
                (serverCoupon.discountType === 'percentage'
                  ? `${serverDiscount}% Off`
                  : `₹${serverDiscount} Off`),
              discount: serverDiscount,
              type: serverCoupon.discountType,
              description: serverCoupon.description,
              minOrder: serverCoupon.minimumOrderAmount,
              expiryDate:
                typeof serverCoupon.expiryDate === 'string'
                  ? serverCoupon.expiryDate
                  : new Date(serverCoupon.expiryDate).toISOString(),
              isActive: serverCoupon.isActive,
              usageLimit: serverCoupon.usageLimit,
              usedCount: serverCoupon.usedCount,
            } as CouponOption;
          });
          setAvailableCoupons((prev) => {
            const merged = [...prev];
            mapped.forEach((item: CouponOption) => {
              if (
                !merged.some(
                  (existing) =>
                    normalizeCode(existing.code) === normalizeCode(item.code)
                )
              ) {
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
  }, [
    couponCode,
    normalizeCode,
    findCouponByCode,
    isCouponValidForOrder,
    applyCouponSelection,
  ]);

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
      setCouponError(
        `Coupon removed: Minimum order amount ₹${appliedCoupon.minOrder} required`
      );
    } else if (
      couponError &&
      appliedCoupon &&
      subtotalWithGST >= (appliedCoupon.minOrder || 0)
    ) {
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
      alert(
        `Error: ${error.message || 'Failed to prepare order. Please try again.'}`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-emerald-50 via-white to-lime-50">
      <Navbar />

      <div className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        <Link
          href="/"
          className="inline-flex items-center text-emerald-700 hover:text-emerald-900 mb-6 font-semibold text-sm sm:text-base"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Home
        </Link>

        <div className="flex items-center justify-between gap-3 mb-6 md:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-emerald-900 tracking-tight">
              Your Booking Cart
            </h1>
            <p className="text-sm sm:text-base text-emerald-900/70 mt-1">
              Review your selected items and confirm your room order at Lotus Palace.
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-emerald-800 bg-white/80 border border-emerald-100 rounded-full px-4 py-1.5 shadow-sm">
            <ShoppingCart className="h-4 w-4" />
            <span className="text-sm font-medium">
              {getTotalItems()} item{getTotalItems() !== 1 ? 's' : ''} in cart
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1.6fr)_minmax(0,1.1fr)] gap-6 md:gap-8 items-start">
          {/* Left: Cart items */}
          <div className="space-y-4">
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="bg-white/80 rounded-2xl border border-emerald-100 shadow-sm p-4 sm:p-5 animate-pulse"
                  >
                    <div className="flex gap-4">
                      <div className="h-20 w-20 sm:h-24 sm:w-24 bg-emerald-100 rounded-xl flex-shrink-0" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-emerald-100 rounded w-3/4" />
                        <div className="h-4 bg-emerald-100 rounded w-1/2" />
                        <div className="h-4 bg-emerald-100 rounded w-1/4" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : cart.length === 0 ? (
              <div className="bg-white/90 rounded-3xl border border-emerald-100 shadow-lg p-8 sm:p-10 flex flex-col items-center justify-center text-center">
                <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center mb-4">
                  <ShoppingCart className="h-8 w-8 text-emerald-400" />
                </div>
                <p className="text-emerald-900 text-lg sm:text-xl font-semibold mb-2">
                  Your cart is empty
                </p>
                <p className="text-emerald-900/70 text-sm sm:text-base mb-5 max-w-md">
                  Add dishes or services from the menu to create your room order at Lotus Palace.
                </p>
                <Link href="/">
                  <Button className="bg-gradient-to-r from-emerald-600 to-lime-600 hover:from-emerald-700 hover:to-lime-700 text-white font-semibold px-6 sm:px-8">
                    Explore Menu
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {cart.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white/90 rounded-2xl border border-emerald-100 shadow-sm hover:shadow-md transition-shadow p-4 sm:p-5"
                  >
                    <div className="flex gap-4">
                      <img
                        src={
                          item.image_url ||
                          'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=800'
                        }
                        alt={item.name}
                        className="h-20 w-20 sm:h-24 sm:w-24 object-cover rounded-xl flex-shrink-0 border border-emerald-100"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between gap-2 mb-1">
                          <h3 className="font-semibold text-base sm:text-lg text-emerald-900 truncate">
                            {item.name}
                          </h3>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFromCart(item.id)}
                            className="text-red-500 hover:text-red-700 h-8 w-8 p-0 flex-shrink-0"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        <p className="text-emerald-900/70 text-xs sm:text-sm line-clamp-2">
                          {item.description || 'Selected item for your room order.'}
                        </p>
                        <p className="text-emerald-700 font-bold text-base sm:text-lg mt-2">
                          ₹{item.price.toFixed(0)}
                        </p>
                        <div className="flex items-center gap-2 mt-3">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="h-8 w-8 p-0 border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                          >
                            -
                          </Button>
                          <span className="text-sm font-semibold w-8 text-center text-emerald-900">
                            {item.quantity}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="h-8 w-8 p-0 border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                          >
                            +
                          </Button>
                          <span className="ml-4 text-xs sm:text-sm text-emerald-900/80">
                            Line total:{' '}
                            <span className="font-semibold">
                              ₹{(item.price * item.quantity).toFixed(0)}
                            </span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right: Summary & details */}
          {cart.length > 0 && (
            <div className="md:pl-1">
              <div className="bg-white/95 rounded-3xl border border-emerald-100 shadow-xl p-5 sm:p-6 md:p-7 sticky top-20 md:top-24">
                <h2 className="text-lg sm:text-xl font-bold text-emerald-900 mb-4 sm:mb-5">
                  Booking Summary
                </h2>

                {/* Price breakdown */}
                <div className="space-y-3 mb-6 pb-5 border-b border-emerald-100">
                  <div className="flex justify-between items-center text-sm sm:text-base">
                    <span className="text-emerald-900/70">
                      Items ({getTotalItems()})
                    </span>
                    <span className="font-semibold text-emerald-900">
                      ₹{subtotal.toFixed(0)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm sm:text-base">
                    <span className="text-emerald-900/70">GST (5%)</span>
                    <span className="font-semibold text-emerald-900">
                      ₹{gst.toFixed(0)}
                    </span>
                  </div>
                  {appliedCoupon && (
                    <div className="flex justify-between items-center text-sm sm:text-base">
                      <span className="text-emerald-700 flex items-center gap-1">
                        <Gift className="h-4 w-4" />
                        {appliedCoupon.name}
                      </span>
                      <span className="font-semibold text-emerald-700">
                        -₹{discountAmount.toFixed(0)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-center text-base sm:text-lg font-bold pt-2">
                    <span className="text-emerald-900">Total</span>
                    <span className="text-emerald-700 text-lg sm:text-xl">
                      ₹{total.toFixed(0)}
                    </span>
                  </div>
                </div>

                {/* Coupons */}
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

                {/* Guest details */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handlePlaceOrder();
                  }}
                  className="space-y-4 mt-6"
                >
                  <div>
                    <label className="block text-sm font-medium text-emerald-900 mb-2">
                      Room Number
                      {user?.roomNumber && (
                        <span className="text-xs text-emerald-600 ml-2">
                          (Auto-filled)
                        </span>
                      )}
                    </label>
                    <input
                      type="text"
                      placeholder="Enter room number"
                      value={roomNumber}
                      onChange={(e) => setRoomNumber(e.target.value)}
                      readOnly={!!user?.roomNumber}
                      className={`w-full px-3 py-2 rounded-xl border text-sm sm:text-base ${
                        user?.roomNumber
                          ? 'bg-emerald-50 border-emerald-100 text-emerald-900 cursor-not-allowed'
                          : 'border-emerald-200 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 bg-white'
                      }`}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-emerald-900 mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      placeholder="Enter your name"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-emerald-200 bg-white text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-emerald-900 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      placeholder="Enter your phone number"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-emerald-200 bg-white text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-emerald-900 mb-2">
                      Email (Optional)
                    </label>
                    <input
                      type="email"
                      placeholder="Enter your email"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-emerald-200 bg-white text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className={`w-full bg-gradient-to-r from-emerald-600 to-lime-600 hover:from-emerald-700 hover:to-lime-700 text-white font-semibold py-3 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 ${
                      isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
                    }`}
                  >
                    {isSubmitting ? 'Processing...' : 'Place Room Order'}
                  </Button>

                  {orderError && (
                    <div className="mt-2 text-red-500 text-sm">{orderError}</div>
                  )}
                </form>

                <Button
                  variant="outline"
                  onClick={clearCart}
                  className="w-full mt-4 border-emerald-200 text-emerald-800 hover:bg-emerald-50 rounded-xl"
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
