'use client';

import { useEffect, useState } from 'react';
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
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface Room {
  _id: string | any;
  roomNumber: string;
  qrCodeUrl: string;
  qrCodeData: string;
  status: string;
  restaurantId?: string | any;
  createdAt?: string;
  updatedAt?: string;
}

export default function QRManagement() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newRoomNumber, setNewRoomNumber] = useState('');

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      const response = await fetch('/api/rooms');
      const data = await response.json();
      if (data.success) {
        setRooms(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch rooms:', error);
    } finally {
      setLoading(false);
    }
  };

  const createRoom = async () => {
    if (!newRoomNumber.trim()) return;

    setCreating(true);
    try {
      const response = await fetch('/api/rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roomNumber: newRoomNumber.trim(),
        }),
      });

      const data = await response.json();
      if (data.success) {
        setRooms([...rooms, data.data]);
        setNewRoomNumber('');
        setIsDialogOpen(false);
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error('Failed to create room:', error);
      alert('Failed to create room');
    } finally {
      setCreating(false);
    }
  };

  const downloadQR = (roomNumber: string, qrData: string) => {
    const link = document.createElement('a');
    link.href = qrData;
    link.download = `room-${roomNumber}-qr.png`;
    link.click();
  };

  const regenerateQR = async (roomId: string) => {
    try {
      const response = await fetch('/api/rooms', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ roomId: roomId, regenerateQR: true }),
      });

      const data = await response.json();
      if (data.success) {
        setRooms(rooms.map(room => (room._id === roomId ? data.data : room)));
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error('Failed to regenerate QR:', error);
      alert('Failed to regenerate QR code');
    }
  };

  const deleteRoom = async (roomId: string) => {
    try {
      const response = await fetch(`/api/rooms?id=${roomId}`, { method: 'DELETE' });
      const data = await response.json();
      if (data.success) {
        setRooms(rooms.filter(room => room._id !== roomId));
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error('Failed to delete room:', error);
      alert('Failed to delete room');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50/40 via-white to-lime-50/30 p-4 sm:p-6 lg:p-8 space-y-6">
        <div className="max-w-7xl mx-auto">
          <div className="relative rounded-2xl border border-emerald-200/60 bg-gradient-to-br from-white via-emerald-50/50 to-lime-50/40 backdrop-blur-sm shadow-xl p-6 sm:p-8">
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-700 via-lime-500 to-lime-500 bg-clip-text text-transparent">
              QR Code Management
            </h1>
            <p className="text-emerald-900/80 mt-2">Generate and manage QR codes for rooms and menus</p>
            <div className="mt-6 h-1 w-full bg-gradient-to-r from-transparent via-emerald-400 to-transparent rounded-full opacity-60"></div>
          </div>
          <div className="mt-6 rounded-2xl border border-emerald-200/60 bg-white/70 backdrop-blur-md shadow-lg p-6">
            <div className="text-center py-12 sm:py-16">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-emerald-200 border-t-emerald-600 mb-4"></div>
              <p className="text-emerald-900/75 text-base sm:text-lg font-medium">Loading rooms...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50/40 via-white to-lime-50/30 p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header + Add Button */}
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="relative w-full">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-100/60 to-lime-100/50 rounded-3xl blur-3xl -z-10 opacity-70"></div>
            <div className="relative rounded-2xl border border-emerald-200/60 bg-gradient-to-br from-white via-emerald-50/60 to-lime-50/50 backdrop-blur-sm shadow-xl p-6">
              <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-700 via-lime-500 to-lime-500 bg-clip-text text-transparent">
                QR Code Management
              </h1>
              <p className="text-emerald-900/75 mt-2">Generate and manage QR codes for rooms and menus</p>
            </div>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 w-full sm:w-auto lg:w-auto bg-gradient-to-r from-emerald-700 to-lime-500 hover:from-emerald-800 hover:to-lime-600 text-white shadow-lg">
                <Plus size={20} />
                Add Room
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-sm sm:max-w-md rounded-2xl border border-emerald-300/60 bg-white/80 backdrop-blur-xl shadow-2xl">
              <DialogHeader>
                <DialogTitle className="font-extrabold bg-gradient-to-r from-emerald-700 to-lime-500 bg-clip-text text-transparent">
                  Add New Room
                </DialogTitle>
                <DialogDescription className="text-emerald-900/75">
                  Enter a room number to create a new room with an automatically generated QR code.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="roomNumber" className="text-emerald-900">Room Number</Label>
                  <Input
                    id="roomNumber"
                    type="text"
                    value={newRoomNumber}
                    onChange={(e) => setNewRoomNumber(e.target.value)}
                    placeholder="Enter room number"
                    className="border-emerald-200 bg-white/70 backdrop-blur-sm focus-visible:ring-emerald-500"
                  />
                </div>
                <Button onClick={createRoom} disabled={creating} className="w-full bg-gradient-to-r from-emerald-700 to-lime-500 hover:from-emerald-800 hover:to-lime-600 text-white shadow-lg">
                  {creating ? 'Creating...' : 'Create Room'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Room Cards */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 w-full">
          {rooms.map((room) => (
            <div
              key={room._id}
              className="rounded-2xl border border-emerald-300/50 bg-gradient-to-br from-white to-emerald-50/40 backdrop-blur-sm shadow-lg p-4 sm:p-6 flex flex-col justify-between hover:shadow-2xl transition-all gap-4"
            >
              <div className="flex flex-wrap justify-between items-center mb-4 gap-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700 border border-emerald-200">
                    <QrCode size={20} />
                  </div>
                  <h3 className="text-lg font-extrabold bg-gradient-to-r from-emerald-700 to-lime-500 bg-clip-text text-transparent">
                    Room {room.roomNumber}
                  </h3>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                    room.status === 'available'
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                      : 'bg-rose-100 text-rose-800 border-rose-200'
                  }`}
                >
                  {room.status}
                </span>
              </div>

              <div className="flex justify-center mb-4">
                <img
                  src={room.qrCodeData}
                  alt={`QR Code for Room ${room.roomNumber}`}
                  className="w-28 h-28 sm:w-32 sm:h-32 object-contain rounded-lg border border-emerald-100 bg-white/60"
                />
              </div>

              <div className="text-center space-y-3">
                <p className="text-sm text-emerald-800 break-all px-2">{room.qrCodeUrl}</p>

                <div className="flex flex-wrap gap-2 justify-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => regenerateQR(room._id)}
                    className="flex-1 min-w-[100px] sm:min-w-[120px] gap-2 border-emerald-300 text-emerald-700 hover:text-white hover:bg-gradient-to-r hover:from-emerald-700 hover:to-lime-500"
                  >
                    <RefreshCw size={16} />
                    Regenerate
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => downloadQR(room.roomNumber, room.qrCodeData)}
                    className="flex-1 min-w-[100px] sm:min-w-[120px] gap-2 border-emerald-300 text-emerald-700 hover:text-white hover:bg-gradient-to-r hover:from-emerald-700 hover:to-lime-500"
                  >
                    <Download size={16} />
                    Download
                  </Button>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="flex-1 min-w-[100px] sm:min-w-[120px] gap-2 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white"
                      >
                        <Trash2 size={16} />
                        Delete
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="rounded-2xl border-2 border-red-200 bg-white/80 backdrop-blur-md">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="font-bold text-gray-900">Delete Room</AlertDialogTitle>
                        <AlertDialogDescription className="text-gray-700">
                          Are you sure you want to delete Room {room.roomNumber}? This action cannot be undone and will permanently remove the room and its QR code.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="border-gray-300">Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deleteRoom(room._id)}
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

          {rooms.length === 0 && (
            <div className="mt-6 rounded-2xl border border-emerald-200/50 bg-white/70 backdrop-blur-md p-6 text-center shadow-lg">
              <p className="text-emerald-900/75">No rooms found. Add your first room to generate QR codes.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
