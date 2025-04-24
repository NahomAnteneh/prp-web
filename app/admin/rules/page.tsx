import { getCurrentUser, hasRole } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function AdminRulesPage() {
  const user = await getCurrentUser();
  const isAdmin = await hasRole('ADMINISTRATOR');
  
  if (!user || !isAdmin) {
    redirect('/login');
  }

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">System Rules Management</h1>
      <p className="text-muted-foreground mb-8">
        Configure and update the system-wide rules and deadlines. These settings affect all users and groups.
      </p>
      
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Rules Management</h2>
        <p>The rules management UI will be implemented here. For now, you can use the API endpoints:</p>
        <ul className="list-disc ml-5 mt-3 space-y-1">
          <li><code>GET /api/rules</code> - Fetch current rules</li>
          <li><code>POST /api/rules/admin</code> - Create rules (admin only)</li>
          <li><code>PUT /api/rules/admin</code> - Update rules (admin only)</li>
        </ul>
        <p className="mt-4">The system has the following rules:</p>
        <ul className="list-disc ml-5 mt-2 space-y-1">
          <li>Maximum group size</li>
          <li>Advisor request deadline</li>
          <li>Project submission deadline</li>
        </ul>
      </div>
    </div>
  );
} 