import { supabase } from '@/lib/supabase';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import NuevaOperacionClient from '@/components/NuevaOperacionClient';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { crearVenta } from './actions';
import { crearPresupuesto } from '../../presupuestos/actions';

export const revalidate = 0;

export default async function NuevaVentaPage() {
  const supabaseAdmin = getSupabaseAdmin();
  
  const { data: clientes } = await supabase.from('clientes').select('id, nombre').order('nombre');
  const { data: stockItems } = await supabase.from('stock_terminado').select('cantidad, skus(id, nombre, precio_recarga, es_servicio)').gt('cantidad', 0);
  
  // Incluir servicios que no tienen control de stock
  const { data: servicios } = await supabase.from('skus').select('id, nombre, precio_recarga, es_servicio').eq('es_servicio', true);
  
  let combinedStock: any[] = [...(stockItems || [])];
  if (servicios) {
    const serviciosAdaptados = servicios.map(s => ({
      cantidad: 9999, // Stock ilimitado para servicios
      skus: s
    }));
    combinedStock = [...combinedStock, ...serviciosAdaptados];
  }

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
        <Link href="/ventas" className="inline-flex items-center gap-2 text-sm text-green-500 hover:text-green-400 mb-4 transition-colors">
          <ArrowLeft size={16} /> Volver a Ventas
        </Link>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Crear Venta o Presupuesto</h1>
        <p className="text-gray-400">Carga una venta directa o genera un presupuesto formal.</p>
      </div>
      
      <NuevaOperacionClient 
        clientes={clientes || []} 
        stock={combinedStock} 
        vendedores={vendedores || []}
        currentUserVendedorId={currentUserVendedorId}
        crearPresupuestoAction={crearPresupuesto}
        crearVentaAction={crearVenta}
        defaultMode="venta"
      />
    </div>
  );
}
