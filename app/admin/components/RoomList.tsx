'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2, Users, User } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const ROOM_OCCUPIED_COUNT_STORAGE_KEY = 'adminRoomOccupiedCount';
const ROOM_ASSIGNED_COUNT_STORAGE_KEY = 'adminRoomAssignedCount';
const ROOM_ASSIGNED_COUNT_EVENT = 'admin-room-assigned-count';

interface AssignedUser {
  _id: string;
  name: string;
  phone: string;
  email?: string;
}

interface Room {
  _id: string;
  roomNumber: string;
  qrCodeUrl: string;
  qrCodeData: string;
  status: string;
  restaurantId?: string;
  createdAt?: string;
  updatedAt?: string;
  assignedUser?: AssignedUser | null;
  currentOrder?: Order | null;
  orderHistory?: Order[];
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

interface RoomListProps {
  refreshTrigger?: number;
  refreshIntervalMs?: number;
}

export function RoomList({ refreshTrigger, refreshIntervalMs }: RoomListProps) {
  const [rooms, setRooms] = useState<RoomWithOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const assignedCount = useMemo(
    () => rooms.filter((room) => room.assignedUser).length,
    [rooms]
  );

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    const isOnManageRoomPage = window.location.pathname === '/admin/manage-room';
    const nextCount = isOnManageRoomPage ? 0 : assignedCount;
    window.localStorage.setItem(ROOM_ASSIGNED_COUNT_STORAGE_KEY, nextCount.toString());
    window.dispatchEvent(new CustomEvent(ROOM_ASSIGNED_COUNT_EVENT, { detail: nextCount }));
  }, [assignedCount]);

  const updateOccupiedCount = useCallback((count: number) => {
    if (typeof window === 'undefined') {
      return;
    }
    const isOnManageRoomPage = window.location.pathname === '/admin/manage-room';
    const nextCount = isOnManageRoomPage ? 0 : count;
    window.localStorage.setItem(ROOM_OCCUPIED_COUNT_STORAGE_KEY, nextCount.toString());
    window.dispatchEvent(new CustomEvent('admin-room-occupied-count', { detail: nextCount }));
  }, []);

  const autoRefreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fetchRoomsRef = useRef<() => Promise<void>>(async () => {});
  const isInitialLoadRef = useRef(true);
  const persistentOrdersRef = useRef<Record<string, Order | undefined>>({});
  const lastSnapshotRef = useRef<string>('');

  const computeSnapshot = useCallback((roomsWithOrders: RoomWithOrder[]) => {
    return JSON.stringify(
      roomsWithOrders.map((room) => ({
        id: room._id,
        status: room.status,
        orderId: room.currentOrder?._id || null,
        orderStatus: room.currentOrder?.status || null,
        orderUpdatedAt: room.currentOrder?.updatedAt || room.currentOrder?.createdAt || null,
      }))
    );
  }, []);

  const fetchRooms = useCallback(async () => {
    try {
      const shouldShowLoading = isInitialLoadRef.current;
      if (shouldShowLoading) {
        setLoading(true);
      }

      const roomsResponse = await fetch('/api/rooms', { cache: 'no-store' });
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
        const roomKey = order.roomNumber.toString();
        const existing = latestOrderByRoomNumber[roomKey];
        const orderTime = new Date(order.updatedAt ?? order.createdAt).getTime();
        const existingTime = existing ? new Date(existing.updatedAt ?? existing.createdAt).getTime() : -Infinity;

        if (!existing || orderTime >= existingTime) {
          latestOrderByRoomNumber[roomKey] = order;
        }
      });

      const roomsWithOrders: RoomWithOrder[] = roomsData.data.map((room: Room) => {
        const roomKey = room.roomNumber.toString();
        const persistedOrder = persistentOrdersRef.current[room._id];
        const shouldAttachOrders = room.status !== 'available';

        let currentOrder = shouldAttachOrders
          ? latestOrderByRoomNumber[roomKey] ?? room.currentOrder ?? persistedOrder
          : undefined;

        if (currentOrder) {
          persistentOrdersRef.current[room._id] = currentOrder;
        }

        return {
          ...room,
          currentOrder,
        };
      });

      const occupiedCount = roomsWithOrders.filter((room) => room.status === 'occupied').length;
      updateOccupiedCount(occupiedCount);

      const newSnapshot = computeSnapshot(roomsWithOrders);
      if (newSnapshot !== lastSnapshotRef.current) {
        setRooms(roomsWithOrders);
        lastSnapshotRef.current = newSnapshot;
      }

      isInitialLoadRef.current = false;
    } catch (error) {
      console.error('Error fetching rooms:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch rooms data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [computeSnapshot, updateOccupiedCount]);

  fetchRoomsRef.current = fetchRooms;

  useEffect(() => {
    fetchRoomsRef.current();
  }, [refreshTrigger]);

  useEffect(() => {
    if (refreshIntervalMs && refreshIntervalMs > 0) {
      const startAutoRefresh = () => {
        autoRefreshTimeoutRef.current = setTimeout(async () => {
          await fetchRoomsRef.current();
          startAutoRefresh();
        }, refreshIntervalMs);
      };
      startAutoRefresh();
    }

    return () => {
      if (autoRefreshTimeoutRef.current) {
        clearTimeout(autoRefreshTimeoutRef.current);
      }
    };
  }, [refreshIntervalMs]);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this room?')) {
      return;
    }

    setDeleting(id);
    try {
      const response = await fetch(`/api/rooms?id=${id}`, {
        method: 'DELETE',
        cache: 'no-store',
      });
      const data = await response.json();

      if (data.success) {
        setRooms((prevRooms) => {
          const nextRooms = prevRooms.filter((room) => room._id !== id);
          const occupiedCount = nextRooms.filter((room) => room.status === 'occupied').length;
          updateOccupiedCount(occupiedCount);
          return nextRooms;
        });
        toast({
          title: 'Success',
          description: 'Room deleted successfully',
        });
      } else {
        throw new Error(data.message || 'Failed to delete room');
      }
    } catch (error) {
      console.error('Error deleting room:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete room',
        variant: 'destructive',
      });
    } finally {
      setDeleting(null);
    }
  };

  const handleStatusUpdate = async (roomInfo: RoomWithOrder) => {
    setUpdatingId(roomInfo._id);
    try {
      const response = await fetch('/api/rooms', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
        body: JSON.stringify({ roomId: roomInfo._id, status: 'available' }),
      });
      const data = await response.json();

      if (data.success) {
        setRooms((prevRooms) => {
          const nextRooms = prevRooms.map((room) => {
            if (room._id !== roomInfo._id) {
              return room;
            }

            delete persistentOrdersRef.current[roomInfo._id];

            const updatedRoom: RoomWithOrder = {
              ...room,
              status: 'available',
              assignedUser: null,
              currentOrder: undefined,
            };

            return updatedRoom;
          });
          const occupiedCount = nextRooms.filter((room) => room.status === 'occupied').length;
          updateOccupiedCount(occupiedCount);
          return nextRooms;
        });
        toast({
          title: 'Success',
          description: 'Room status updated successfully',
        });
      } else {
        throw new Error(data.message || 'Failed to update room status');
      }
    } catch (error) {
      console.error('Error updating room status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update room status',
        variant: 'destructive',
      });
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-orange-200 border-t-orange-600 mb-4"></div>
          <p className="text-gray-600">Loading rooms...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {rooms.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600">No rooms found. Create rooms from the QR Code Management page.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rooms.map((room) => (
            <Card key={room._id} className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                    <span className="text-lg font-bold text-orange-700">R{room.roomNumber}</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Room {room.roomNumber}</h3>
                    <p className="text-sm text-gray-600 capitalize">{room.status}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {room.status === 'occupied' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleStatusUpdate(room)}
                      disabled={updatingId === room._id}
                      className="text-green-700 border-green-300 hover:bg-green-50"
                    >
                      {updatingId === room._id ? 'Updating...' : 'Mark Available'}
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(room._id)}
                    disabled={deleting === room._id}
                    className="text-red-700 border-red-300 hover:bg-red-50"
                  >
                    {deleting === room._id ? 'Deleting...' : 'Delete'}
                  </Button>
                </div>
              </div>

              {room.assignedUser && (
                <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <User size={16} className="text-blue-600" />
                    <span className="font-medium text-blue-900">Assigned User</span>
                  </div>
                  <p className="text-sm text-blue-800">{room.assignedUser.name}</p>
                  <p className="text-sm text-blue-700">{room.assignedUser.phone}</p>
                </div>
              )}

              {room.currentOrder && (
                <div className="p-3 bg-orange-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Users size={16} className="text-orange-600" />
                    <span className="font-medium text-orange-900">Current Order</span>
                  </div>
                  <p className="text-sm text-orange-800">Customer: {room.currentOrder.customerName}</p>
                  <p className="text-sm text-orange-800">Status: {room.currentOrder.status}</p>
                  <p className="text-sm text-orange-800">Total: ₹{room.currentOrder.total}</p>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}