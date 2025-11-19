'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Table2, ShoppingCart, DollarSign, Clock, CheckCircle } from 'lucide-react';
import { useState } from 'react';

// Dummy data
const stats = [
  { title: 'Active Tables', value: '12', change: '+2 from yesterday', icon: Table2, color: 'bg-orange-50 text-orange-600 ring-1 ring-orange-100' },
  { title: 'Pending Orders', value: '8', change: '3 ready to serve', icon: Clock, color: 'bg-amber-50 text-amber-600 ring-1 ring-amber-100' },
  { title: 'Completed Orders', value: '45', change: 'Today', icon: CheckCircle, color: 'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100' },
  { title: 'Total Revenue', value: '$1,250', change: '+15% from yesterday', icon: DollarSign, color: 'bg-violet-50 text-violet-600 ring-1 ring-violet-100' },
];

const chartData = [
  { name: 'Mon', orders: 12, revenue: 320 },
  { name: 'Tue', orders: 19, revenue: 450 },
  { name: 'Wed', orders: 15, revenue: 380 },
  { name: 'Thu', orders: 25, revenue: 620 },
  { name: 'Fri', orders: 22, revenue: 580 },
  { name: 'Sat', orders: 30, revenue: 750 },
  { name: 'Sun', orders: 18, revenue: 420 },
];

const tableData = [
  { table: 'Table 1', status: 'Occupied', lastOrder: '5 min ago', waiter: 'John' },
  { table: 'Table 2', status: 'Available', lastOrder: '1 hour ago', waiter: '-' },
  { table: 'Table 3', status: 'Occupied', lastOrder: '2 min ago', waiter: 'Sarah' },
  { table: 'Table 4', status: 'Reserved', lastOrder: '-', waiter: '-' },
  { table: 'Table 5', status: 'Occupied', lastOrder: '8 min ago', waiter: 'Mike' },
];

const recentOrders = [
  { id: '001', table: 'Table 5', status: 'Pending', items: 'Pizza, Salad', time: '2 min ago', priority: 'High' },
  { id: '002', table: 'Table 3', status: 'Ready', items: 'Burger, Fries', time: '5 min ago', priority: 'Medium' },
  { id: '003', table: 'Table 7', status: 'Served', items: 'Pasta, Wine', time: '10 min ago', priority: 'Low' },
  { id: '004', table: 'Table 2', status: 'Pending', items: 'Steak, Soup', time: '1 min ago', priority: 'High' },
];

export default function WaitersDashboard() {
  const [selectedPeriod, setSelectedPeriod] = useState('week');

  return (
    <div className="space-y-6">
      {/* Heading */}
      <div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-orange-500 via-orange-600 to-red-500 bg-clip-text text-transparent">
          Waiters Dashboard
        </h1>
        <p className="text-gray-600 mt-2">Manage tables, orders, and service</p>
      </div>

      {/* Interactive Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card
              key={index}
              className="hover:shadow-lg transition-all duration-200 cursor-pointer border border-orange-100/60 bg-white/90 backdrop-blur-sm"
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-semibold text-gray-900">{stat.title}</CardTitle>
                <div className={`p-2 rounded-lg ${stat.color}`}>
                  <Icon size={20} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                <p className="text-xs text-gray-500">{stat.change}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Orders Chart */}
        <Card className="border border-orange-100/60 bg-white/90 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-gray-900">Weekly Orders</CardTitle>
              <div className="flex gap-2">
                <Button
                  variant={selectedPeriod === 'week' ? 'default' : 'outline'}
                  size="sm"
                  className={
                    selectedPeriod === 'week'
                      ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-600 hover:to-red-600'
                      : 'hover:border-orange-300 hover:text-orange-700'
                  }
                  onClick={() => setSelectedPeriod('week')}
                >
                  Week
                </Button>
                <Button
                  variant={selectedPeriod === 'month' ? 'default' : 'outline'}
                  size="sm"
                  className={
                    selectedPeriod === 'month'
                      ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-600 hover:to-red-600'
                      : 'hover:border-orange-300 hover:text-orange-700'
                  }
                  onClick={() => setSelectedPeriod('month')}
                >
                  Month
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="name" tick={{ fill: '#6b7280' }} axisLine={{ stroke: '#e5e7eb' }} />
                <YAxis tick={{ fill: '#6b7280' }} axisLine={{ stroke: '#e5e7eb' }} />
                <Tooltip
                  contentStyle={{ borderRadius: 8, borderColor: '#fed7aa' }}
                  labelStyle={{ color: '#374151' }}
                />
                <Bar dataKey="orders" fill="#fb923c" />{/* orange-400 */}
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Revenue Chart */}
        <Card className="border border-orange-100/60 bg-white/90 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-gray-900">Revenue Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="name" tick={{ fill: '#6b7280' }} axisLine={{ stroke: '#e5e7eb' }} />
                <YAxis tick={{ fill: '#6b7280' }} axisLine={{ stroke: '#e5e7eb' }} />
                <Tooltip
                  formatter={(value: any) => [`$${value}`, 'Revenue']}
                  contentStyle={{ borderRadius: 8, borderColor: '#c7d2fe' }}
                  labelStyle={{ color: '#374151' }}
                />
                <Line type="monotone" dataKey="revenue" stroke="#ef4444" strokeWidth={2} />{/* red-500 */}
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Tables Status */}
      <Card className="border border-orange-100/60 bg-white/90 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-gray-900">Table Status Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tableData.map((table, index) => (
              <div
                key={index}
                className="p-4 border rounded-lg hover:bg-orange-50 transition-colors border-orange-100/70"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-gray-900">{table.table}</h3>
                  <Badge
                    variant={
                      table.status === 'Occupied'
                        ? 'destructive'
                        : table.status === 'Reserved'
                        ? 'secondary'
                        : 'default'
                    }
                    className={
                      table.status === 'Available'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : table.status === 'Reserved'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-red-50 text-red-700 border border-red-200'
                    }
                  >
                    {table.status}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600">Last order: {table.lastOrder}</p>
                <p className="text-sm text-gray-600">Waiter: {table.waiter}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Orders with Actions */}
      <Card className="border border-orange-100/60 bg-white/90 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-gray-900">Recent Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentOrders.map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-orange-50 transition-colors border-orange-100/70"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium text-gray-900">
                      Order #{order.id} - {order.table}
                    </p>
                    <Badge
                      variant={
                        order.priority === 'High' ? 'destructive' : order.priority === 'Medium' ? 'default' : 'secondary'
                      }
                      className={
                        order.priority === 'High'
                          ? 'bg-red-50 text-red-700 border border-red-200'
                          : order.priority === 'Medium'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-sky-50 text-sky-700 border border-sky-200'
                      }
                    >
                      {order.priority}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600">{order.items}</p>
                  <p className="text-xs text-gray-500">{order.time}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={order.status === 'Pending' ? 'destructive' : order.status === 'Ready' ? 'default' : 'secondary'}
                    className={
                      order.status === 'Pending'
                        ? 'bg-red-50 text-red-700 border border-red-200'
                        : order.status === 'Ready'
                        ? 'bg-orange-50 text-orange-700 border border-orange-200'
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    }
                  >
                    {order.status}
                  </Badge>
                  {order.status === 'Pending' && (
                    <Button size="sm" variant="outline" className="hover:border-orange-300 hover:text-orange-700">
                      Mark Ready
                    </Button>
                  )}
                  {order.status === 'Ready' && (
                    <Button size="sm" className="bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-600 hover:to-red-600">
                      Serve
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
