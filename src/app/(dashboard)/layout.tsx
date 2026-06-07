import Sidebar from '@/components/Sidebar';
import { createClient } from '@/lib/supabase/server';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  const role = user?.email === 'gerencia@tuempresa.com' ? 'Gerente' : 'Administrativo';

  return (
    <div className="flex">
      <Sidebar initialRole={role} email={user?.email || ''} />
      <main className="flex-1 ml-64 p-8">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
