'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';

export default function Settings() {
  const [settings, setSettings] = useState({
    gstPercentage: '5',
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setSettings((prev) => ({
      ...prev,
      [name]: value,
    }));
  };



  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      toast({
        title: 'Success',
        description: 'Settings saved successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to save settings',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50/40 via-white to-lime-50/30 p-4 sm:p-6 lg:p-8 space-y-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="relative rounded-2xl border border-emerald-200/60 bg-gradient-to-br from-white via-emerald-50/50 to-lime-50/40 backdrop-blur-sm shadow-xl p-6 sm:p-8">
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-700 via-lime-500 to-lime-500 bg-clip-text text-transparent">
            Settings
          </h1>
          <p className="text-emerald-900/80 mt-2">Manage restaurant settings and preferences</p>
          <div className="mt-6 h-1 w-full bg-gradient-to-r from-transparent via-emerald-400 to-transparent rounded-full opacity-60"></div>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          {/* Order Settings */}
          <Card className="p-5 sm:p-6 rounded-2xl border border-emerald-200/60 bg-white/80 backdrop-blur-md shadow-lg">
            <h2 className="text-lg font-extrabold bg-gradient-to-r from-emerald-700 to-lime-500 bg-clip-text text-transparent mb-4">
              Order Settings
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-emerald-900 mb-1">GST Percentage (%)</label>
                <input
                  type="number"
                  name="gstPercentage"
                  value={settings.gstPercentage}
                  onChange={handleChange}
                  step="0.1"
                  min="0"
                  max="100"
                  className="w-full px-3 py-2 text-sm border border-emerald-300 rounded-lg bg-white/80 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-emerald-400"
                  placeholder="Enter GST percentage"
                />
                <p className="text-xs text-emerald-600 mt-1">GST will be calculated on the subtotal</p>
              </div>
            </div>
          </Card>

          <Button
            type="submit"
            className="w-full md:w-auto bg-gradient-to-r from-emerald-700 to-lime-500 hover:from-emerald-800 hover:to-lime-600 text-white shadow-lg"
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Save Settings'}
          </Button>
        </form>
      </div>
    </div>
  );
}
