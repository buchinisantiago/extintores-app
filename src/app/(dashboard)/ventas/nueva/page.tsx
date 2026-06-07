import { supabase } from '@/lib/supabase';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import NuevaVentaClient from './NuevaVentaClient';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const revalidate = 0;

export default async function NuevaVentaPage() {
  const supabaseAdmin = getSupabaseAdmin();
  
  const { data: clientes } = await supabase.from('clientes').select('id, nombre').order('nombre');
  const { data: stock_terminado } = await supabase
    .from('stock_terminado')
    .select('cantidad, skus(id, nombre, precio_recarga)')
    .gt('cantidad', 0); // Solo traer lo que tiene stock

  // Fetch servicios que no requieren stock
  const { data: servicios } = await supabase
    .from('skus')
    .select('id, nombre, precio_recarga')
    .eq('es_servicio', true);

  const sellableItems = [
    ...(stock_terminado as any || []),
    ...(servicios as any || []).map((s: any) => ({
      cantidad: 9999, // Stock "infinito" para los servicios
      skus: s
    }))
  ];

  const { data: vendedores } = await supabaseAdmin.from('vendedores').select('*').order('nombre');

  const { createClient } = await import('@/lib/supabase/server');
  const supabaseServer = await createClient();
  const { data: { user } } = await supabaseServer.auth.getUser();
  
  let currentUserVendedorId: string | undefined = undefined;
  if (user && user.email !== 'gerencia@tuempresa.com') {
    const { data: vendedorLogueado } = await supabaseAdmin.from('vendedores').select('id').eq('auth_user_id', user.id).single();
    if (vendedorLogueado) {
      currentUserVendedorId = vendedorLogueado.id;
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto">
      <div>
        <Link href="/ventas" className="inline-flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 mb-4 transition-colors">
          <ArrowLeft size={16} /> Volver a Ventas
        </Link>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Registrar Venta</h1>
        <p className="text-gray-400">Selecciona el cliente y los productos o servicios a facturar.</p>
      </div>
      
      <NuevaVentaClient 
        clientes={clientes || []} 
        stock={sellableItems} 
        vendedores={vendedores || []}
        currentUserVendedorId={currentUserVendedorId}
      />
    </div>
  );
}
