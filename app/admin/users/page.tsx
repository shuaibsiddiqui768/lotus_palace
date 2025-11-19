import { UsersTable } from '../components/UsersTable';

export default function UsersManagement() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Users</h1>
        <p className="text-gray-600 mt-2">Manage customer accounts and permissions</p>
      </div>

      <UsersTable />
    </div>
  );
}
