import Sidebar from '@/components/Sidebar';
import { createClient } from '@/lib/supabase/server';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  let role = 'Administrativo';
  
  if (user?.email === 'gerencia@tuempresa.com') {
    role = 'Gerente';
  } else if (user?.id) {
    // Check if the user is a seller
    const { data: vendedor } = await supabase.from('vendedores').select('id').eq('auth_user_id', user.id).single();
    if (vendedor) {
      role = 'Vendedor';
    }
  }

  return (
    <div className="flex min-h-screen bg-black text-white">
      <Sidebar initialRole={role} email={user?.email || ''} />
      <main className="flex-1 w-full md:ml-64 p-4 pt-20 md:p-8 md:pt-8 overflow-x-hidden">
        <div className="max-w-6xl mx-auto w-full">
          {children}
        </div>
      </main>
    </div>
  );
}
