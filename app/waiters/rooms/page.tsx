'use client';

import { useState, useEffect, useRef, useCallback, MouseEvent } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, RefreshCw, CheckCircle, User } from 'lucide-react';

interface AssignedUser {
  _id: string;
  name: string;
  phone: string;
  email?: string;
}

interface Room {
  _id: string;
  roomNumber: string;
  status: string;
  qrCodeUrl: string;
  qrCodeData: string;
  restaurantId?: string;
  createdAt?: string;
  updatedAt?: string;
  assignedUser?: AssignedUser | null;
  currentOrder?: Order | null;
}

interface Order {
  _id: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  orderType: string;
  roomNumber: string;
  items: any[];
  total: number;
  status: string;
  createdAt: string;
  updatedAt?: string;
}

interface RoomWithOrder extends Room {
  currentOrder?: Order | null;
}

const REFRESH_INTERVAL_MS = 3000;
const MIN_REFRESH_INTERVAL_MS = 1000;
const TABLE_REFRESH_EVENT = 'waiter-table-refresh';

type FetchTablesOptions = {
  showLoading?: boolean;
};

const broadcastWaiterTableRefresh = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(TABLE_REFRESH_EVENT));
  }
};

export default function RoomsPage() {
  const [rooms, setRooms] = useState<RoomWithOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [refreshing, setRefreshing] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const lastSnapshotRef = useRef<string>('');
  const autoRefreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fetchTablesRef = useRef<(() => Promise<void>) | null>(null);
  const persistentOrdersRef = useRef<Record<string, Order | undefined>>({});

  const computeSnapshot = useCallback((roomList: RoomWithOrder[]) => {
    return JSON.stringify(
      roomList.map(room => ({
        id: room._id,
        status: room.status,
        orderId: room.currentOrder?._id || null,
      }))
    );
  }, []);

  const fetchRooms = useCallback(async ({ showLoading = true }: FetchTablesOptions = {}) => {
    if (showLoading) {
      setLoading(true);
    }

    try {
      const roomsResponse = await fetch('/api/rooms');
      const roomsData = await roomsResponse.json();

      if (!roomsData.success) {
        throw new Error('Failed to fetch rooms');
      }

      const ordersResponse = await fetch('/api/orders', { cache: 'no-store' });
      const ordersData = await ordersResponse.json();

      const roomOrders: Order[] = (ordersData.success ? ordersData.data : [])
        .filter((order: Order) => order.orderType === 'Rooms')
        .sort((a: Order, b: Order) => {
          const aTime = new Date(a.updatedAt ?? a.createdAt).getTime();
          const bTime = new Date(b.updatedAt ?? b.createdAt).getTime();
          return bTime - aTime;
        });

      const latestOrderByRoomNumber: Partial<Record<string, Order>> = {};
      roomOrders.forEach((order) => {
        const roomKey = order.roomNumber;
        const existing = latestOrderByRoomNumber[roomKey];
        const orderTime = new Date(order.updatedAt ?? order.createdAt).getTime();
        const existingTime = existing ? new Date(existing.updatedAt ?? existing.createdAt).getTime() : -Infinity;

        if (!existing || orderTime >= existingTime) {
          latestOrderByRoomNumber[roomKey] = order;
        }
      });

      const roomsWithOrders: RoomWithOrder[] = roomsData.data.map((room: Room) => {
        const roomKey = room.roomNumber;
        const persistedOrder = persistentOrdersRef.current[room._id];
        const shouldAttachOrders = room.status !== 'available';

        let currentOrder = shouldAttachOrders
          ? latestOrderByRoomNumber[roomKey] ?? room.currentOrder ?? persistedOrder
          : undefined;

        if (shouldAttachOrders && currentOrder) {
          currentOrder = {
            ...persistedOrder,
            ...room.currentOrder,
            ...currentOrder,
          };
          persistentOrdersRef.current[room._id] = currentOrder;
        } else {
          delete persistentOrdersRef.current[room._id];
        }

        if (currentOrder && currentOrder.status === 'closed') {
          delete persistentOrdersRef.current[room._id];
          currentOrder = undefined;
        }

        const derivedStatus = currentOrder || room.assignedUser ? 'occupied' : room.status;

        return { ...room, status: derivedStatus, currentOrder };
      });

      const snapshot = computeSnapshot(roomsWithOrders);
      let shouldBroadcast = false;
      if (snapshot !== lastSnapshotRef.current) {
        setRooms(roomsWithOrders);
        lastSnapshotRef.current = snapshot;
        shouldBroadcast = true;
      }
      setLastRefresh(new Date());
      if (shouldBroadcast) {
        broadcastWaiterTableRefresh();
      }
    } catch (error) {
      console.error('Failed to fetch rooms:', error);
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  }, [computeSnapshot]);

  useEffect(() => {
    fetchRooms({ showLoading: true });
  }, [fetchRooms]);

  useEffect(() => {
    fetchTablesRef.current = () => fetchRooms({ showLoading: false });

    return () => {
      fetchTablesRef.current = null;
    };
  }, [fetchRooms]);

  useEffect(() => {
    if (!fetchTablesRef.current) {
      return undefined;
    }

    const scheduleNextRefresh = (delay: number) => {
      if (autoRefreshTimeoutRef.current) {
        clearTimeout(autoRefreshTimeoutRef.current);
      }

      autoRefreshTimeoutRef.current = setTimeout(async () => {
        try {
          await fetchTablesRef.current?.();
        } catch (error) {
          console.error('Failed to refresh tables automatically:', error);
        } finally {
          scheduleNextRefresh(Math.max(REFRESH_INTERVAL_MS, MIN_REFRESH_INTERVAL_MS));
        }
      }, Math.max(delay, MIN_REFRESH_INTERVAL_MS));
    };

    scheduleNextRefresh(REFRESH_INTERVAL_MS);

    return () => {
      if (autoRefreshTimeoutRef.current) {
        clearTimeout(autoRefreshTimeoutRef.current);
        autoRefreshTimeoutRef.current = null;
      }
    };
  }, [fetchRooms]);

  const handleManualRefresh = async (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    setRefreshing(true);
    await fetchRooms();
    setRefreshing(false);
  };

  const updateRoomStatus = async (roomInfo: RoomWithOrder, status: string) => {
    try {
      setErrorMessage('');
      setSuccessMessage('');

      const response = await fetch('/api/rooms', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ roomId: roomInfo._id, status }),
      });

      const data = await response.json();
      if (data.success) {
        setRooms(prevRooms => prevRooms.map(room => {
          if (room._id !== roomInfo._id) {
            return room;
          }

          const nextCurrentOrder = status === 'available' ? undefined : (data.data.currentOrder ?? room.currentOrder);
          const nextAssignedUser = status === 'available' ? undefined : (data.data.assignedUser ?? room.assignedUser);

          if (status === 'available') {
            delete persistentOrdersRef.current[roomInfo._id];
          }

          return {
            ...room,
            ...data.data,
            currentOrder: nextCurrentOrder,
            assignedUser: nextAssignedUser,
          };
        }));

        const statusText = status === 'available' ? 'marked as available' : 'updated';
        setSuccessMessage(`Room ${roomInfo.roomNumber} ${statusText}`);

        if (status === 'available' && roomInfo.currentOrder) {
          try {
            await fetch(`/api/orders/${roomInfo.currentOrder._id}`, {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ status: 'completed' }),
            });
          } catch (orderError) {
            console.error('Failed to update order status:', orderError);
          }
        }

        await fetchRooms();

        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setErrorMessage(data.message || 'Failed to update room');
        setTimeout(() => setErrorMessage(''), 3000);
      }
    } catch (error) {
      console.error('Failed to update room status:', error);
      setErrorMessage('Failed to update room status');
      setTimeout(() => setErrorMessage(''), 3000);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-orange-500 via-orange-600 to-red-500 bg-clip-text text-transparent">
            Rooms Management
          </h1>
          <p className="text-gray-600 mt-2">Monitor and manage hotel rooms</p>
        </div>
        <div className="bg-white/90 backdrop-blur-sm rounded-lg border border-orange-100 p-6">
          <p className="text-gray-600">Loading rooms...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-orange-500 via-orange-600 to-red-500 bg-clip-text text-transparent">
            Rooms Management
          </h1>
          <p className="text-gray-600 mt-2">Monitor and manage hotel rooms</p>
          <p className="text-xs text-gray-500 mt-1">
            Last updated: {lastRefresh.toLocaleTimeString()}
          </p>
        </div>
        <Button
          onClick={handleManualRefresh}
          variant="outline"
          size="sm"
          disabled={refreshing}
          className="gap-2 hover:border-orange-300 hover:text-orange-700"
          title="Refresh rooms"
        >
          <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>

      {/* Toasts */}
      {successMessage && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 flex items-center gap-2">
          <CheckCircle size={20} className="text-emerald-600" />
          <p className="text-emerald-800">{successMessage}</p>
        </div>
      )}

      {errorMessage && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{errorMessage}</p>
        </div>
      )}

      {/* Rooms grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {rooms.map((room) => (
          <Card key={room._id} className="border border-orange-100/70 hover:shadow-lg transition-shadow bg-white/90 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-gray-900">
                Room {room.roomNumber}
                <Badge
                  variant={
                    room.status === 'occupied'
                      ? 'destructive'
                      : room.status === 'reserved'
                      ? 'secondary'
                      : 'default'
                  }
                  className={
                    room.status === 'available'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : room.status === 'reserved'
                      ? 'bg-amber-50 text-amber-700 border border-amber-200'
                      : 'bg-red-50 text-red-700 border border-red-200'
                  }
                >
                  {room.status}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {room.assignedUser && (
                  <div className="p-3 bg-emerald-50 rounded-md border border-emerald-200">
                    <div className="flex items-center gap-2 mb-2">
                      <User size={16} className="text-emerald-600" />
                      <span className="text-sm font-medium text-emerald-800">Assigned Guest</span>
                    </div>
                    <div className="text-sm text-gray-700 space-y-1">
                      <p><strong>Name:</strong> {room.assignedUser.name}</p>
                      {room.assignedUser.phone && (
                        <p><strong>Phone:</strong> {room.assignedUser.phone}</p>
                      )}
                      {room.assignedUser.email && (
                        <p><strong>Email:</strong> {room.assignedUser.email}</p>
                      )}
                    </div>
                  </div>
                )}

                {room.currentOrder && (
                  <div className="p-3 bg-orange-50 rounded-md border border-orange-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Users size={16} className="text-orange-600" />
                      <span className="text-sm font-medium text-orange-800">Current Customer</span>
                    </div>
                    <div className="text-sm text-gray-700 space-y-1">
                      <p><strong>Name:</strong> {room.currentOrder.customerName}</p>
                      <p><strong>Phone:</strong> {room.currentOrder.customerPhone}</p>
                      {room.currentOrder.customerEmail && (
                        <p><strong>Email:</strong> {room.currentOrder.customerEmail}</p>
                      )}
                      <p><strong>Order Total:</strong> ₹{room.currentOrder.total}</p>
                      <p><strong>Order Status:</strong> {room.currentOrder.status}</p>
                      <p><strong>Items:</strong> {room.currentOrder.items.length}</p>
                    </div>
                  </div>
                )}

                {!room.currentOrder && room.status === 'available' && (
                  <div className="text-sm text-gray-500">
                    No active order
                  </div>
                )}

                <div className="flex gap-2 mt-4 flex-wrap">
                  {room.status === 'occupied' && (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => updateRoomStatus(room, 'available')}
                      title="Mark room as available when customer leaves"
                      className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 border-0"
                    >
                      Room Free ✓
                    </Button>
                  )}
                  {room.status === 'reserved' && (
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => updateRoomStatus(room, 'available')}
                      className="hover:border-orange-300 hover:text-orange-700"
                    >
                      Cancel Reservation
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
