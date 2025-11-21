import { DashboardStats } from '../components/DashboardStats';
import { RecentOrders } from '../components/RecentOrders';
import { SalesChart } from '../components/SalesChart';

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6 pl-6 md:pl-8 lg:pl-10 py-6 md:py-8 bg-gradient-to-b from-emerald-50 via-white to-emerald-50 min-h-[calc(100vh-4rem)]">
      <div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-600 via-emerald-700 to-lime-500 bg-clip-text text-transparent">
          Dashboard
        </h1>
        <p className="text-sm sm:text-base text-emerald-900/70 mt-2">
          Welcome to your admin panel
        </p>
      </div>

      <div className="bg-white/95 border border-emerald-100 rounded-3xl shadow-md p-4 sm:p-5">
        <DashboardStats />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white/95 border border-emerald-100 rounded-3xl shadow-md p-4 sm:p-5">
          <SalesChart />
        </div>
        <div className="bg-white/95 border border-emerald-100 rounded-3xl shadow-md p-4 sm:p-5">
          <RecentOrders />
        </div>
      </div>
    </div>
  );
}
