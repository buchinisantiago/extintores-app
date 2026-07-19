import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import VendedoresClient from './VendedoresClient';

export const revalidate = 0;

export default async function VendedoresPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user?.email !== 'gerencia@tuempresa.com') {
    redirect('/');
  }
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { data: vendedores, error } = await supabaseAdmin
      .from('vendedores')
      .select('*')
      .order('nombre');

    if (error) {
      return <div>Error loading database: {error.message}</div>;
    }

    const { data: usersData } = await supabaseAdmin.auth.admin.listUsers();
    const usersMap = new Map((usersData?.users || []).map(u => [u.id, u.email]));

    const vendedoresConEmail = (vendedores || []).map(v => ({
      ...v,
      email: usersMap.get(v.auth_user_id) || 'Sin correo'
    }));

    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Vendedores</h1>
          <p className="text-gray-400">Gestiona los vendedores para el cálculo de comisiones.</p>
        </div>
        
        <VendedoresClient initialData={vendedoresConEmail} />
      </div>
    );
  } catch (e: any) {
    return (
      <div className="p-6 bg-red-500/20 text-red-300 font-mono rounded-lg border border-red-500">
        Error renderizando VendedoresPage: {e.message || String(e)}
      </div>
    );
  }
}
