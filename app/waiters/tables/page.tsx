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

interface Table {
  _id: string;
  tableNumber: number;
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
  tableNumber: string;
  items: any[];
  total: number;
  status: string;
  createdAt: string;
  updatedAt?: string;
}

interface TableWithOrder extends Table {
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

export default function TablesPage() {
  const [tables, setTables] = useState<TableWithOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [refreshing, setRefreshing] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const lastSnapshotRef = useRef<string>('');
  const autoRefreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fetchTablesRef = useRef<(() => Promise<void>) | null>(null);
  const persistentOrdersRef = useRef<Record<string, Order | undefined>>({});

  const computeSnapshot = useCallback((tableList: TableWithOrder[]) => {
    return JSON.stringify(
      tableList.map(table => ({
        id: table._id,
        status: table.status,
        orderId: table.currentOrder?._id || null,
      }))
    );
  }, []);

  const fetchTables = useCallback(async ({ showLoading = true }: FetchTablesOptions = {}) => {
    if (showLoading) {
      setLoading(true);
    }

    try {
      const tablesResponse = await fetch('/api/tables');
      const tablesData = await tablesResponse.json();

      if (!tablesData.success) {
        throw new Error('Failed to fetch tables');
      }

      const ordersResponse = await fetch('/api/orders', { cache: 'no-store' });
      const ordersData = await ordersResponse.json();

      const dineInOrders: Order[] = (ordersData.success ? ordersData.data : [])
        .filter((order: Order) => order.orderType === 'dine-in')
        .sort((a: Order, b: Order) => {
          const aTime = new Date(a.updatedAt ?? a.createdAt).getTime();
          const bTime = new Date(b.updatedAt ?? b.createdAt).getTime();
          return bTime - aTime;
        });

      const latestOrderByTableNumber: Partial<Record<string, Order>> = {};
      dineInOrders.forEach((order) => {
        const tableKey = order.tableNumber.toString();
        const existing = latestOrderByTableNumber[tableKey];
        const orderTime = new Date(order.updatedAt ?? order.createdAt).getTime();
        const existingTime = existing ? new Date(existing.updatedAt ?? existing.createdAt).getTime() : -Infinity;

        if (!existing || orderTime >= existingTime) {
          latestOrderByTableNumber[tableKey] = order;
        }
      });

      const tablesWithOrders: TableWithOrder[] = tablesData.data.map((table: Table) => {
        const tableKey = table.tableNumber.toString();
        const persistedOrder = persistentOrdersRef.current[table._id];
        const shouldAttachOrders = table.status !== 'available';

        let currentOrder = shouldAttachOrders
          ? latestOrderByTableNumber[tableKey] ?? table.currentOrder ?? persistedOrder
          : undefined;

        if (shouldAttachOrders && currentOrder) {
          currentOrder = {
            ...persistedOrder,
            ...table.currentOrder,
            ...currentOrder,
          };
          persistentOrdersRef.current[table._id] = currentOrder;
        } else {
          delete persistentOrdersRef.current[table._id];
        }

        if (currentOrder && currentOrder.status === 'closed') {
          delete persistentOrdersRef.current[table._id];
          currentOrder = undefined;
        }

        const derivedStatus = currentOrder || table.assignedUser ? 'occupied' : table.status;

        return { ...table, status: derivedStatus, currentOrder };
      });

      const snapshot = computeSnapshot(tablesWithOrders);
      let shouldBroadcast = false;
      if (snapshot !== lastSnapshotRef.current) {
        setTables(tablesWithOrders);
        lastSnapshotRef.current = snapshot;
        shouldBroadcast = true;
      }
      setLastRefresh(new Date());
      if (shouldBroadcast) {
        broadcastWaiterTableRefresh();
      }
    } catch (error) {
      console.error('Failed to fetch tables:', error);
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  }, [computeSnapshot]);

  useEffect(() => {
    fetchTables({ showLoading: true });
  }, [fetchTables]);

  useEffect(() => {
    fetchTablesRef.current = () => fetchTables({ showLoading: false });

    return () => {
      fetchTablesRef.current = null;
    };
  }, [fetchTables]);

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
  }, [fetchTables]);

  const handleManualRefresh = async (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    setRefreshing(true);
    await fetchTables();
    setRefreshing(false);
  };

  const updateTableStatus = async (tableInfo: TableWithOrder, status: string) => {
    try {
      setErrorMessage('');
      setSuccessMessage('');

      const response = await fetch('/api/tables', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tableId: tableInfo._id, status }),
      });

      const data = await response.json();
      if (data.success) {
        setTables(prevTables => prevTables.map(table => {
          if (table._id !== tableInfo._id) {
            return table;
          }

          const nextCurrentOrder = status === 'available' ? undefined : (data.data.currentOrder ?? table.currentOrder);
          const nextAssignedUser = status === 'available' ? undefined : (data.data.assignedUser ?? table.assignedUser);

          if (status === 'available') {
            delete persistentOrdersRef.current[tableInfo._id];
          }

          return {
            ...table,
            ...data.data,
            currentOrder: nextCurrentOrder,
            assignedUser: nextAssignedUser,
          };
        }));
        
        const statusText = status === 'available' ? 'marked as available' : 'updated';
        setSuccessMessage(`Table ${tableInfo.tableNumber} ${statusText}`);

        if (status === 'available' && tableInfo.currentOrder) {
          try {
            await fetch(`/api/orders/${tableInfo.currentOrder._id}`, {
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
        
        await fetchTables();

        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setErrorMessage(data.message || 'Failed to update table');
        setTimeout(() => setErrorMessage(''), 3000);
      }
    } catch (error) {
      console.error('Failed to update table status:', error);
      setErrorMessage('Failed to update table status');
      setTimeout(() => setErrorMessage(''), 3000);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-orange-500 via-orange-600 to-red-500 bg-clip-text text-transparent">
            Tables Management
          </h1>
          <p className="text-gray-600 mt-2">Monitor and manage restaurant tables</p>
        </div>
        <div className="bg-white/90 backdrop-blur-sm rounded-lg border border-orange-100 p-6">
          <p className="text-gray-600">Loading tables...</p>
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
            Tables Management
          </h1>
          <p className="text-gray-600 mt-2">Monitor and manage restaurant tables</p>
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
          title="Refresh tables"
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

      {/* Tables grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tables.map((table) => (
          <Card key={table._id} className="border border-orange-100/70 hover:shadow-lg transition-shadow bg-white/90 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-gray-900">
                Table {table.tableNumber}
                <Badge
                  variant={
                    table.status === 'occupied'
                      ? 'destructive'
                      : table.status === 'reserved'
                      ? 'secondary'
                      : 'default'
                  }
                  className={
                    table.status === 'available'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : table.status === 'reserved'
                      ? 'bg-amber-50 text-amber-700 border border-amber-200'
                      : 'bg-red-50 text-red-700 border border-red-200'
                  }
                >
                  {table.status}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {table.assignedUser && (
                  <div className="p-3 bg-emerald-50 rounded-md border border-emerald-200">
                    <div className="flex items-center gap-2 mb-2">
                      <User size={16} className="text-emerald-600" />
                      <span className="text-sm font-medium text-emerald-800">Assigned Guest</span>
                    </div>
                    <div className="text-sm text-gray-700 space-y-1">
                      <p><strong>Name:</strong> {table.assignedUser.name}</p>
                      {table.assignedUser.phone && (
                        <p><strong>Phone:</strong> {table.assignedUser.phone}</p>
                      )}
                      {table.assignedUser.email && (
                        <p><strong>Email:</strong> {table.assignedUser.email}</p>
                      )}
                    </div>
                  </div>
                )}

                {table.currentOrder && (
                  <div className="p-3 bg-orange-50 rounded-md border border-orange-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Users size={16} className="text-orange-600" />
                      <span className="text-sm font-medium text-orange-800">Current Customer</span>
                    </div>
                    <div className="text-sm text-gray-700 space-y-1">
                      <p><strong>Name:</strong> {table.currentOrder.customerName}</p>
                      <p><strong>Phone:</strong> {table.currentOrder.customerPhone}</p>
                      {table.currentOrder.customerEmail && (
                        <p><strong>Email:</strong> {table.currentOrder.customerEmail}</p>
                      )}
                      <p><strong>Order Total:</strong> ₹{table.currentOrder.total}</p>
                      <p><strong>Order Status:</strong> {table.currentOrder.status}</p>
                      <p><strong>Items:</strong> {table.currentOrder.items.length}</p>
                    </div>
                  </div>
                )}

                {!table.currentOrder && table.status === 'available' && (
                  <div className="text-sm text-gray-500">
                    No active order
                  </div>
                )}

                <div className="flex gap-2 mt-4 flex-wrap">
                  {table.status === 'occupied' && (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => updateTableStatus(table, 'available')}
                      title="Mark table as available when customer leaves"
                      className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 border-0"
                    >
                      Table Free ✓
                    </Button>
                  )}
                  {table.status === 'reserved' && (
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => updateTableStatus(table, 'available')}
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
