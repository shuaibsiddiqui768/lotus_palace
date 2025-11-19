import { DashboardStats } from './components/DashboardStats';
import { RecentOrders } from './components/RecentOrders';
import { SalesChart } from './components/SalesChart';

export default function AdminPage() {
  return (
    <div className="space-y-6 pl-6 md:pl-8 lg:pl-10">
      <div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-orange-500 via-orange-600 to-red-500 bg-clip-text text-transparent">
          Dashboard
        </h1>
        <p className="text-gray-600 mt-2">Welcome to your admin panel</p>
      </div>

      <DashboardStats />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <SalesChart />
        </div>
        <div>
          <RecentOrders />
        </div>
      </div>
    </div>
  );
}
