'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface OrderFiltersProps {
  statusFilter: string;
  onStatusChange: (value: string) => void;
  dateFilter: string;
  onDateChange: (value: string) => void;
  onClearFilters: () => void;
}

export function OrderFilters({
  statusFilter,
  onStatusChange,
  dateFilter,
  onDateChange,
  onClearFilters,
}: OrderFiltersProps) {
  const getStatusLabel = (value: string) => {
    switch (value) {
      case 'all':
        return 'All Orders';
      case 'pending':
        return 'Pending';
      case 'confirmed':
        return 'Confirmed';
      case 'preparing':
        return 'Preparing';
      case 'ready':
        return 'Ready';
      case 'completed':
        return 'Completed';
      default:
        return 'Filter by Status';
    }
  };

  const getDateLabel = (value: string) => {
    switch (value) {
      case 'all':
        return 'All Dates';
      case 'today':
        return 'Today';
      case 'week':
        return 'This Week';
      case 'month':
        return 'This Month';
      default:
        return 'Date Range';
    }
  };

  return (
    <Card className="p-4 sm:p-6 bg-gradient-to-br from-emerald-50 via-white to-emerald-50 border border-emerald-100 shadow-sm rounded-2xl">
      <div className="flex gap-4 sm:gap-6 flex-wrap items-center">
        <Select value={statusFilter} onValueChange={onStatusChange}>
          <SelectTrigger className="w-full sm:w-40 border-emerald-200 focus:ring-emerald-500 focus:border-emerald-500 bg-white/80">
            <SelectValue placeholder={getStatusLabel(statusFilter)} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Orders</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="confirmed">Confirmed</SelectItem>
            <SelectItem value="preparing">Preparing</SelectItem>
            <SelectItem value="ready">Ready</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>

        <Select value={dateFilter} onValueChange={onDateChange}>
          <SelectTrigger className="w-full sm:w-40 border-emerald-200 focus:ring-emerald-500 focus:border-emerald-500 bg-white/80">
            <SelectValue placeholder={getDateLabel(dateFilter)} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Dates</SelectItem>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="week">This Week</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          onClick={onClearFilters}
          className="w-full sm:w-auto border-emerald-300 text-emerald-800 hover:bg-emerald-50"
        >
          Clear Filters
        </Button>
      </div>
    </Card>
  );
}
