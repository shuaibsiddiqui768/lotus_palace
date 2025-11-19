'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Download, QrCode, RefreshCw, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog';

interface Table {
  _id: string | any;
  tableNumber: number;
  qrCodeUrl: string;
  qrCodeData: string;
  status: string;
  restaurantId?: string | any;
  createdAt?: string;
  updatedAt?: string;
}

export default function QRManagement() {
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newTableNumber, setNewTableNumber] = useState('');

  useEffect(() => {
    fetchTables();
  }, []);

  const fetchTables = async () => {
    try {
      const response = await fetch('/api/tables');
      const data = await response.json();
      if (data.success) {
        setTables(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch tables:', error);
    } finally {
      setLoading(false);
    }
  };

  const createTable = async () => {
    if (!newTableNumber.trim()) return;

    setCreating(true);
    try {
      const response = await fetch('/api/tables', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tableNumber: parseInt(newTableNumber),
        }),
      });

      const data = await response.json();
      if (data.success) {
        setTables([...tables, data.data]);
        setNewTableNumber('');
        setIsDialogOpen(false);
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error('Failed to create table:', error);
      alert('Failed to create table');
    } finally {
      setCreating(false);
    }
  };

  const downloadQR = (tableNumber: number, qrData: string) => {
    const link = document.createElement('a');
    link.href = qrData;
    link.download = `table-${tableNumber}-qr.png`;
    link.click();
  };

  const regenerateQR = async (tableId: string) => {
    try {
      const response = await fetch('/api/tables', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tableId, regenerateQR: true }),
      });

      const data = await response.json();
      if (data.success) {
        setTables(tables.map(table => table._id === tableId ? data.data : table));
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error('Failed to regenerate QR:', error);
      alert('Failed to regenerate QR code');
    }
  };

  const deleteTable = async (tableId: string) => {
    try {
      const response = await fetch(`/api/tables?id=${tableId}`, { method: 'DELETE' });
      const data = await response.json();
      if (data.success) {
        setTables(tables.filter(table => table._id !== tableId));
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error('Failed to delete table:', error);
      alert('Failed to delete table');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50/30 via-white to-amber-50/20 p-4 sm:p-6 lg:p-8 space-y-6">
        <div className="max-w-7xl mx-auto">
          <div className="relative rounded-2xl border-2 border-orange-200/50 bg-gradient-to-br from-white via-orange-50/40 to-amber-50/30 backdrop-blur-sm shadow-xl p-6 sm:p-8">
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-orange-600 via-amber-600 to-orange-500 bg-clip-text text-transparent">
              QR Code Management
            </h1>
            <p className="text-gray-600 mt-2">Generate and manage QR codes for tables and menus</p>
            <div className="mt-6 h-1 w-full bg-gradient-to-r from-transparent via-orange-400 to-transparent rounded-full opacity-50"></div>
          </div>
          <div className="mt-6 rounded-2xl border-2 border-orange-200/50 bg-white/70 backdrop-blur-md shadow-lg p-6">
            <div className="text-center py-12 sm:py-16">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-orange-200 border-t-orange-600 mb-4"></div>
              <p className="text-gray-600 text-base sm:text-lg font-medium">Loading tables...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50/30 via-white to-amber-50/20 p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header + Add Button */}
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="relative w-full">
            <div className="absolute inset-0 bg-gradient-to-r from-orange-100/50 to-amber-100/50 rounded-3xl blur-3xl -z-10 opacity-50"></div>
            <div className="relative rounded-2xl border-2 border-orange-200/50 bg-gradient-to-br from-white via-orange-50/40 to-amber-50/30 backdrop-blur-sm shadow-xl p-6">
              <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-orange-600 via-amber-600 to-orange-500 bg-clip-text text-transparent">
                QR Code Management
              </h1>
              <p className="text-gray-600 mt-2">Generate and manage QR codes for tables and menus</p>
            </div>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 w-full sm:w-auto lg:w-auto bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white shadow-lg">
                <Plus size={20} />
                Add Table
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-sm sm:max-w-md rounded-2xl border-2 border-orange-200/60 bg-white/80 backdrop-blur-xl shadow-2xl">
              <DialogHeader>
                <DialogTitle className="font-extrabold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
                  Add New Table
                </DialogTitle>
                <DialogDescription className="text-gray-600">
                  Enter a table number to create a new table with an automatically generated QR code.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="tableNumber" className="text-gray-800">Table Number</Label>
                  <Input
                    id="tableNumber"
                    type="number"
                    value={newTableNumber}
                    onChange={(e) => setNewTableNumber(e.target.value)}
                    placeholder="Enter table number"
                    className="border-orange-200 bg-white/70 backdrop-blur-sm focus-visible:ring-orange-500"
                  />
                </div>
                <Button onClick={createTable} disabled={creating} className="w-full bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white shadow-lg">
                  {creating ? 'Creating...' : 'Create Table'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Table Cards */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 w-full">
          {tables.map((table) => (
            <div
              key={table._id}
              className="rounded-2xl border-2 border-orange-200/50 bg-gradient-to-br from-white to-orange-50/20 backdrop-blur-sm shadow-lg p-4 sm:p-6 flex flex-col justify-between hover:shadow-2xl transition-all"
            >
              <div className="flex flex-wrap justify-between items-center mb-4 gap-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-orange-100 text-orange-700 border border-orange-200">
                    <QrCode size={20} />
                  </div>
                  <h3 className="text-lg font-extrabold bg-gradient-to-r from-orange-700 to-amber-700 bg-clip-text text-transparent">
                    Table {table.tableNumber}
                  </h3>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                    table.status === 'available'
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                      : 'bg-rose-100 text-rose-800 border-rose-200'
                  }`}
                >
                  {table.status}
                </span>
              </div>

              <div className="flex justify-center mb-4">
                <img
                  src={table.qrCodeData}
                  alt={`QR Code for Table ${table.tableNumber}`}
                  className="w-28 h-28 sm:w-32 sm:h-32 object-contain rounded-lg border border-orange-100 bg-white/60"
                />
              </div>

              <div className="text-center space-y-3">
                <p className="text-sm text-gray-700 break-all px-2">{table.qrCodeUrl}</p>

                {/* Responsive Button Group */}
                <div className="flex flex-wrap gap-2 justify-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => regenerateQR(table._id)}
                    className="flex-1 min-w-[100px] sm:min-w-[120px] gap-2 border-orange-300 text-orange-700 hover:text-white hover:bg-gradient-to-r hover:from-orange-600 hover:to-amber-600"
                  >
                    <RefreshCw size={16} />
                    Regenerate
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => downloadQR(table.tableNumber, table.qrCodeData)}
                    className="flex-1 min-w-[100px] sm:min-w-[120px] gap-2 border-orange-300 text-orange-700 hover:text-white hover:bg-gradient-to-r hover:from-orange-600 hover:to-amber-600"
                  >
                    <Download size={16} />
                    Download
                  </Button>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 min-w-[100px] sm:min-w-[120px] gap-2 border-red-300 text-red-700 hover:text-white hover:bg-gradient-to-r hover:from-red-600 hover:to-rose-600"
                      >
                        <Trash2 size={16} />
                        Delete
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="rounded-2xl border-2 border-red-200 bg-white/80 backdrop-blur-md">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="font-bold text-gray-900">Delete Table</AlertDialogTitle>
                        <AlertDialogDescription className="text-gray-700">
                          Are you sure you want to delete Table {table.tableNumber}? This action cannot be undone and will permanently remove the table and its QR code.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="border-gray-300">Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deleteTable(table._id)}
                          className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </div>
          ))}
        </div>

        {tables.length === 0 && (
          <div className="mt-6 rounded-2xl border-2 border-orange-200/50 bg-white/70 backdrop-blur-md p-6 text-center shadow-lg">
            <p className="text-gray-600">No tables found. Add your first table to generate QR codes.</p>
          </div>
        )}
      </div>
    </div>
  );
}
