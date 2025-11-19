import { MenuTable } from '../components/MenuTable';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export default function MenuManagement() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Menu Management</h1>
          <p className="text-gray-600 mt-2">Manage your food items and categories</p>
        </div>
        <Button className="gap-2 w-full sm:w-auto">
          <Plus size={20} />
          Add New Item
        </Button>
      </div>

      <MenuTable />
    </div>
  );
}
