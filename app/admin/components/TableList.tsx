'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2, Users, User } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const TABLE_OCCUPIED_COUNT_STORAGE_KEY = 'adminTableOccupiedCount';
const TABLE_ASSIGNED_COUNT_STORAGE_KEY = 'adminTableAssignedCount';
const TABLE_ASSIGNED_COUNT_EVENT = 'admin-table-assigned-count';

interface AssignedUser {
  _id: string;
  name: string;
  phone: string;
  email?: string;
}

interface Table {
  _id: string;
  tableNumber: number;
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

interface TableListProps {
  refreshTrigger?: number;
  refreshIntervalMs?: number;
}

export function TableList({ refreshTrigger, refreshIntervalMs }: TableListProps) {
  const [tables, setTables] = useState<TableWithOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const assignedCount = useMemo(
    () => tables.filter((table) => table.assignedUser).length,
    [tables]
  );

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    const isOnManageTablePage = window.location.pathname === '/admin/manage-table';
    const nextCount = isOnManageTablePage ? 0 : assignedCount;
    window.localStorage.setItem(TABLE_ASSIGNED_COUNT_STORAGE_KEY, nextCount.toString());
    window.dispatchEvent(new CustomEvent(TABLE_ASSIGNED_COUNT_EVENT, { detail: nextCount }));
  }, [assignedCount]);

  const updateOccupiedCount = useCallback((count: number) => {
    if (typeof window === 'undefined') {
      return;
    }
    const isOnManageTablePage = window.location.pathname === '/admin/manage-table';
    const nextCount = isOnManageTablePage ? 0 : count;
    window.localStorage.setItem(TABLE_OCCUPIED_COUNT_STORAGE_KEY, nextCount.toString());
    window.dispatchEvent(new CustomEvent('admin-table-occupied-count', { detail: nextCount }));
  }, []);

  const autoRefreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fetchTablesRef = useRef<() => Promise<void>>(async () => {});
  const isInitialLoadRef = useRef(true);
  const persistentOrdersRef = useRef<Record<string, Order | undefined>>({});
  const lastSnapshotRef = useRef<string>('');

  const computeSnapshot = useCallback((tablesWithOrders: TableWithOrder[]) => {
    return JSON.stringify(
      tablesWithOrders.map((table) => ({
        id: table._id,
        status: table.status,
        orderId: table.currentOrder?._id || null,
        orderStatus: table.currentOrder?.status || null,
        orderUpdatedAt: table.currentOrder?.updatedAt || table.currentOrder?.createdAt || null,
      }))
    );
  }, []);

  const fetchTables = useCallback(async () => {
    try {
      const shouldShowLoading = isInitialLoadRef.current;
      if (shouldShowLoading) {
        setLoading(true);
      }

      const tablesResponse = await fetch('/api/tables', { cache: 'no-store' });
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

      const occupiedCount = tablesWithOrders.filter((table) => table.status === 'occupied').length;
      updateOccupiedCount(occupiedCount);

      const snapshot = computeSnapshot(tablesWithOrders);
      if (snapshot !== lastSnapshotRef.current) {
        setTables(tablesWithOrders);
        lastSnapshotRef.current = snapshot;
      }
    } catch (error: any) {
      console.error('Error fetching tables:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to fetch tables',
        variant: 'destructive',
      });
    } finally {
      isInitialLoadRef.current = false;
      setLoading(false);
    }
  }, [computeSnapshot, updateOccupiedCount]);

  useEffect(() => {
    fetchTables();
  }, [fetchTables, refreshTrigger]);

  useEffect(() => {
    fetchTablesRef.current = fetchTables;
  }, [fetchTables]);

  useEffect(() => {
    if (!refreshIntervalMs) {
      return;
    }

    const scheduleRefresh = (delay: number) => {
      if (autoRefreshTimeoutRef.current) {
        clearTimeout(autoRefreshTimeoutRef.current);
      }
      autoRefreshTimeoutRef.current = setTimeout(() => {
        fetchTablesRef.current();
        scheduleRefresh(Math.max(refreshIntervalMs, 1000));
      }, delay);
    };

    scheduleRefresh(Math.max(refreshIntervalMs, 1000));

    return () => {
      if (autoRefreshTimeoutRef.current) {
        clearTimeout(autoRefreshTimeoutRef.current);
        autoRefreshTimeoutRef.current = null;
      }
    };
  }, [refreshIntervalMs, fetchTables]);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this table?')) {
      return;
    }

    setDeleting(id);
    try {
      const response = await fetch(`/api/tables?id=${id}`, {
        method: 'DELETE',
        cache: 'no-store',
      });
      const data = await response.json();

      if (data.success) {
        setTables((prevTables) => {
          const nextTables = prevTables.filter((table) => table._id !== id);
          const occupiedCount = nextTables.filter((table) => table.status === 'occupied').length;
          updateOccupiedCount(occupiedCount);
          return nextTables;
        });
        toast({
          title: 'Success',
          description: 'Table deleted successfully',
        });
      } else {
        throw new Error(data.message);
      }
    } catch (error: any) {
      console.error('Error deleting table:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete table',
        variant: 'destructive',
      });
    } finally {
      setDeleting(null);
    }
  };

  const handleMarkAvailable = async (tableInfo: TableWithOrder) => {
    try {
      setUpdatingId(tableInfo._id);

      const response = await fetch('/api/tables', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
        body: JSON.stringify({ tableId: tableInfo._id, status: 'available' }),
      });
      const data = await response.json();

      if (data.success) {
        setTables((prevTables) => {
          const nextTables = prevTables.map((table) => {
            if (table._id !== tableInfo._id) {
              return table;
            }

            delete persistentOrdersRef.current[tableInfo._id];

            const updatedTable: TableWithOrder = {
              ...table,
              ...data.data,
              currentOrder: undefined,
              assignedUser: undefined,
            };

            return updatedTable;
          });
          const occupiedCount = nextTables.filter((table) => table.status === 'occupied').length;
          updateOccupiedCount(occupiedCount);
          return nextTables;
        });

        toast({
          title: 'Success',
          description: 'Table marked as available',
        });
        await fetchTables();
      } else {
        throw new Error(data.message);
      }
    } catch (error: any) {
      console.error('Error updating table status:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update table status',
        variant: 'destructive',
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-800 border border-emerald-200 shadow-sm';
      case 'occupied':
        return 'bg-gradient-to-r from-red-100 to-rose-100 text-red-800 border border-red-200 shadow-sm';
      default:
        return 'bg-gradient-to-r from-gray-100 to-slate-100 text-gray-700 border border-gray-200 shadow-sm';
    }
  };

  const getStatusLabel = (status: string) => {
    if (status === 'occupied') {
      return '🔴 Occupied';
    }
    return '✓ Available';
  };

  return (
    <Card className="p-4 sm:p-6 shadow-xl bg-gradient-to-br from-white via-orange-50/30 to-amber-50/20 border-2 border-orange-200/50 backdrop-blur-sm rounded-2xl">
      <div className="mb-4 sm:mb-6 flex items-center gap-3 pb-4 border-b-2 border-orange-100">
        <h2 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
          Restaurant Tables ({tables.length})
        </h2>
        {assignedCount > 0 && (
          <span className="inline-flex h-7 min-w-[1.75rem] items-center justify-center rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 px-3 text-xs font-bold text-white shadow-lg border border-orange-300 animate-pulse">
            {assignedCount}
            <span className="sr-only">Assigned tables</span>
          </span>
        )}
      </div>

      {loading ? (
        <div className="text-center py-12 sm:py-16">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-orange-200 border-t-orange-600 mb-4"></div>
          <p className="text-gray-600 text-base sm:text-lg font-medium">Loading tables...</p>
        </div>
      ) : tables.length > 0 ? (
        <div className="grid gap-4 sm:gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {tables.map((table) => {
            const currentOrder = table.currentOrder;

            return (
              <Card
                key={table._id}
                className="border-2 border-orange-200/50 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 bg-gradient-to-br from-white to-orange-50/20 backdrop-blur-sm rounded-xl overflow-hidden"
              >
                <div className="flex flex-col h-full p-4 sm:p-5">
                  {/* Header */}
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-4 pb-3 border-b-2 border-orange-100">
                    <h3 className="font-bold text-gray-900 text-base sm:text-lg flex items-center gap-2">
                      <span className="text-2xl">🍽️</span>
                      <span className="bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
                        Table {table.tableNumber}
                      </span>
                    </h3>
                    <span className={`text-xs font-bold px-3 py-1.5 rounded-lg ${getStatusColor(table.status)}`}>
                      {getStatusLabel(table.status)}
                    </span>
                  </div>

                  {/* Assigned User Section */}
                  {table.assignedUser && (
                    <div className="mt-2 mb-3 p-4 bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl border-2 border-emerald-200 shadow-md transform transition-all duration-200 hover:scale-[1.02]">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-green-500 rounded-lg flex items-center justify-center shadow-md">
                          <User size={16} className="text-white" />
                        </div>
                        <span className="text-sm font-bold text-emerald-800">Assigned User</span>
                      </div>
                      <div className="text-xs text-gray-700 space-y-1.5 ml-1">
                        <p className="flex items-center gap-2">
                          <span className="font-semibold text-emerald-700">Name:</span>
                          <span className="font-medium">{table.assignedUser.name}</span>
                        </p>
                        {table.assignedUser.phone && (
                          <p className="flex items-center gap-2">
                            <span className="font-semibold text-emerald-700">Phone:</span>
                            <span className="font-medium">{table.assignedUser.phone}</span>
                          </p>
                        )}
                        {table.assignedUser.email && (
                          <p className="flex items-center gap-2">
                            <span className="font-semibold text-emerald-700">Email:</span>
                            <span className="font-medium text-xs">{table.assignedUser.email}</span>
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Current Order Section */}
                  {currentOrder && (
                    <div className="mt-2 mb-3 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200 shadow-md transform transition-all duration-200 hover:scale-[1.02]">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center shadow-md">
                          <Users size={16} className="text-white" />
                        </div>
                        <span className="text-sm font-bold text-blue-800">Current Customer</span>
                      </div>
                      <div className="text-xs text-gray-700 space-y-1.5 ml-1">
                        <p className="flex items-center gap-2">
                          <span className="font-semibold text-blue-700">Name:</span>
                          <span className="font-medium">{currentOrder.customerName}</span>
                        </p>
                        <p className="flex items-center gap-2">
                          <span className="font-semibold text-blue-700">Phone:</span>
                          <span className="font-medium">{currentOrder.customerPhone}</span>
                        </p>
                        {currentOrder.customerEmail && (
                          <p className="flex items-center gap-2">
                            <span className="font-semibold text-blue-700">Email:</span>
                            <span className="font-medium text-xs">{currentOrder.customerEmail}</span>
                          </p>
                        )}
                        <div className="pt-2 mt-2 border-t border-blue-200 space-y-1.5">
                          <p className="flex items-center justify-between">
                            <span className="font-semibold text-blue-700">Order Total:</span>
                            <span className="font-bold text-base bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                              ₹{currentOrder.total}
                            </span>
                          </p>
                          <p className="flex items-center justify-between">
                            <span className="font-semibold text-blue-700">Status:</span>
                            <span className="font-medium capitalize bg-blue-100 px-2 py-0.5 rounded-md">
                              {currentOrder.status}
                            </span>
                          </p>
                          <p className="flex items-center justify-between">
                            <span className="font-semibold text-blue-700">Items:</span>
                            <span className="font-medium bg-blue-100 px-2 py-0.5 rounded-md">
                              {currentOrder.items.length}
                            </span>
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Empty State */}
                  {!currentOrder && table.status === 'available' && (
                    <div className="mt-2 mb-3 p-4 text-center bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                      <p className="text-sm text-gray-500 font-medium">No active order</p>
                    </div>
                  )}

                  {/* Mark Available Button */}
                  {table.status === 'occupied' && (
                    <div className="mt-4 mb-3">
                      <Button
                        size="sm"
                        onClick={() => handleMarkAvailable(table)}
                        disabled={updatingId === table._id}
                        className="w-full h-9 text-sm font-semibold bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg rounded-lg transition-all duration-200"
                      >
                        {updatingId === table._id ? 'Marking...' : '✓ Mark Available'}
                      </Button>
                    </div>
                  )}

                  {/* Delete Button */}
                  <div className="mt-auto pt-3 border-t-2 border-orange-100">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(table._id)}
                      disabled={deleting === table._id}
                      className="w-full h-9 text-sm font-semibold text-red-600 hover:text-white hover:bg-gradient-to-r hover:from-red-600 hover:to-rose-600 border-2 border-red-300 hover:border-red-600 rounded-lg transition-all duration-200 shadow-md"
                    >
                      <Trash2 size={16} className="mr-2" />
                      {deleting === table._id ? 'Deleting...' : 'Delete Table'}
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16 sm:py-20">
          <div className="mb-6 text-7xl">🍽️</div>
          <p className="text-gray-600 text-base sm:text-lg font-semibold mb-2">No tables found</p>
          <p className="text-gray-500 text-sm">Add your first table to get started!</p>
        </div>
      )}
    </Card>
  );
}
