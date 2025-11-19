'use client';

import { RoomList } from '../components/RoomList';

export default function ManageRoom() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50/30 via-white to-amber-50/20 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="relative">
          {/* Decorative Background Elements */}
          <div className="absolute inset-0 bg-gradient-to-r from-orange-100/50 to-amber-100/50 rounded-3xl blur-3xl -z-10 opacity-50"></div>

          {/* Header Content */}
          <div className="relative bg-gradient-to-br from-white via-orange-50/40 to-amber-50/30 backdrop-blur-sm rounded-2xl border-2 border-orange-200/50 shadow-xl p-6 sm:p-8">
            <div className="flex items-center gap-4 mb-3">
              {/* <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-orange-500 to-amber-500 rounded-2xl flex items-center justify-center shadow-lg transform hover:scale-105 transition-transform duration-200">
                <span className="text-3xl sm:text-4xl">🍽️</span>
              </div> */}
              <div className="flex-1">
                <h1 className="text-2xl sm:text-4xl font-extrabold bg-gradient-to-r from-orange-600 via-amber-600 to-orange-500 bg-clip-text text-transparent tracking-tight">
                  Manage Rooms
                </h1>
              </div>
            </div>
            <p className="text-gray-600 text-base sm:text-lg font-medium ml-0 text-left">
  Configure and manage hotel rooms with real-time updates
</p>


            {/* Decorative Bottom Border */}
            <div className="mt-6 h-1 w-full bg-gradient-to-r from-transparent via-orange-400 to-transparent rounded-full opacity-50"></div>
          </div>
        </div>

        {/* Room List Section */}
        <div className="transform transition-all duration-300 hover:scale-[1.01]">
          <RoomList refreshIntervalMs={3000} />
        </div>
      </div>
    </div>
  );
}
