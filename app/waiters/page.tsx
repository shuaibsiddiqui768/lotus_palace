import { redirect } from 'next/navigation';

export default function WaitersPage() {
 
  return (
    <div className="min-h-screen grid place-items-center bg-gradient-to-b from-orange-50 via-white to-orange-50">
      <div className="flex items-center gap-3 text-sm text-gray-600">
        <span className="inline-block h-2 w-2 rounded-full bg-gradient-to-r from-orange-500 to-red-500 animate-pulse" />
        Redirecting to dashboard...
      </div>
      {redirect('/waiters/dashboard')}
    </div>
  );
}
