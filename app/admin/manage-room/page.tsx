'use client';

import { RoomList } from '../components/RoomList';

export default function ManageRoom() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-emerald-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="relative">
          {/* Decorative Background Elements */}
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-100/60 to-emerald-200/40 rounded-3xl blur-3xl -z-10 opacity-70"></div>

          {/* Header Content */}
          <div className="relative bg-gradient-to-br from-white via-emerald-50/40 to-emerald-100/30 backdrop-blur-sm rounded-2xl border border-emerald-100 shadow-xl p-6 sm:p-8">
            <div className="flex items-center gap-4 mb-3">
              {/* <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-emerald-600 to-lime-400 rounded-2xl flex items-center justify-center shadow-lg transform hover:scale-105 transition-transform duration-200">
                <span className="text-3xl sm:text-4xl">🍽️</span>
              </div> */}
              <div className="flex-1">
                <h1 className="text-2xl sm:text-4xl font-extrabold bg-gradient-to-r from-emerald-700 via-emerald-600 to-lime-500 bg-clip-text text-transparent tracking-tight">
                  Manage Rooms
                </h1>
              </div>
            </div>
            <p className="text-emerald-900/75 text-base sm:text-lg font-medium ml-0 text-left">
              Configure and manage hotel rooms with real-time updates
            </p>

            {/* Decorative Bottom Border */}
            <div className="mt-6 h-1 w-full bg-gradient-to-r from-transparent via-emerald-400 to-transparent rounded-full opacity-60"></div>
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
