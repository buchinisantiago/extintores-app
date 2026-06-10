import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import VendedorDashboardClient from './VendedorDashboardClient';
import Link from 'next/link';
import { ArrowLeft, UserCircle } from 'lucide-react';

export const revalidate = 0;

export default async function VendedorDashboardPage({ params }: { params: { id: string } }) {
  const supabaseServer = await createClient();
  const { data: { user } } = await supabaseServer.auth.getUser();

  if (user?.email !== 'gerencia@tuempresa.com') {
    redirect('/');
  }

  const supabaseAdmin = getSupabaseAdmin();

  // Fetch the seller
  const { data: vendedor, error: vendError } = await supabaseAdmin
    .from('vendedores')
    .select('*')
    .eq('id', params.id)
    .single();

  if (vendError || !vendedor) {
    redirect('/vendedores');
  }

  // Fetch their sales
  const { data: ventas, error: ventasError } = await supabaseAdmin
    .from('ventas')
    .select('*, venta_items(cantidad, costo_unitario)')
    .eq('vendedor_id', params.id);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-4">
        <Link href="/vendedores" className="inline-flex items-center gap-2 text-sm text-red-400 hover:text-blue-300 transition-colors w-fit">
          <ArrowLeft size={16} /> Volver a Vendedores
        </Link>
        <div className="flex items-center gap-4">
          <div className="p-4 bg-slate-900 rounded-2xl border border-slate-700 text-gray-400">
            <UserCircle size={40} />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-1">{vendedor.nombre}</h1>
            <p className="text-gray-400">Dashboard de Rendimiento y Comisiones</p>
          </div>
        </div>
      </div>
      
      <VendedorDashboardClient 
        vendedor={vendedor} 
        ventas={ventas || []} 
      />
    </div>
  );
}
