import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function PaymentSettings() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50/30 via-white to-amber-50/20 p-4 sm:p-6 lg:p-8 space-y-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="relative rounded-2xl border-2 border-orange-200/50 bg-gradient-to-br from-white via-orange-50/40 to-amber-50/30 backdrop-blur-sm shadow-xl p-6 sm:p-8">
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-orange-600 via-amber-600 to-orange-500 bg-clip-text text-transparent">
            Payment Settings
          </h1>
          <p className="text-gray-600 mt-2">Configure payment gateways and methods</p>
          <div className="mt-6 h-1 w-full bg-gradient-to-r from-transparent via-orange-400 to-transparent rounded-full opacity-50"></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          {/* Stripe Settings */}
          <Card className="p-5 sm:p-6 rounded-2xl border-2 border-orange-200/50 bg-white/70 backdrop-blur-md shadow-lg">
            <h2 className="text-lg font-extrabold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent mb-4">
              Stripe Settings
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Publishable Key</label>
                <input
                  type="password"
                  placeholder="pk_live_..."
                  className="w-full px-3 py-2 text-sm border border-orange-200 rounded-lg bg-white/70 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-orange-500 placeholder:text-gray-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Secret Key</label>
                <input
                  type="password"
                  placeholder="sk_live_..."
                  className="w-full px-3 py-2 text-sm border border-orange-200 rounded-lg bg-white/70 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-orange-500 placeholder:text-gray-400"
                />
              </div>
              <Button className="w-full bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white shadow-lg">
                Save Stripe Settings
              </Button>
            </div>
          </Card>

          {/* Payment Methods */}
          <Card className="p-5 sm:p-6 rounded-2xl border-2 border-orange-200/50 bg-white/70 backdrop-blur-md shadow-lg">
            <h2 className="text-lg font-extrabold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent mb-4">
              Payment Methods
            </h2>
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" defaultChecked className="w-4 h-4 rounded border-orange-300 text-orange-600 focus:ring-orange-500" />
                <span className="text-gray-700">Credit Card</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" defaultChecked className="w-4 h-4 rounded border-orange-300 text-orange-600 focus:ring-orange-500" />
                <span className="text-gray-700">Debit Card</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded border-orange-300 text-orange-600 focus:ring-orange-500" />
                <span className="text-gray-700">Digital Wallet</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded border-orange-300 text-orange-600 focus:ring-orange-500" />
                <span className="text-gray-700">Bank Transfer</span>
              </label>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
