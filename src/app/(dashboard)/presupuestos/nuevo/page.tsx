import { supabase } from '@/lib/supabase';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import NuevaOperacionClient from '@/components/NuevaOperacionClient';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { crearPresupuesto } from '../actions';
import { crearVenta } from '../../ventas/nueva/actions';

export const revalidate = 0;

export default async function NuevoPresupuestoPage() {
  const supabaseAdmin = getSupabaseAdmin();
  
  const { data: clientes } = await supabase.from('clientes').select('id, nombre').order('nombre');
  
  // Para presupuestos, traemos TODOS los SKUs, tengan stock o no.
  const { data: allSkus } = await supabase.from('skus').select('*').order('nombre');
  const sellableItems = allSkus?.map((s: any) => ({
    cantidad: 9999, // Sin límite de stock para presupuestar
    skus: { id: s.id, nombre: s.nombre, precio_recarga: s.precio_recarga }
  })) || [];

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
        <Link href="/presupuestos" className="inline-flex items-center gap-2 text-sm text-red-400 hover:text-red-300 mb-4 transition-colors">
          <ArrowLeft size={16} /> Volver a Presupuestos
        </Link>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Crear Presupuesto o Venta</h1>
        <p className="text-gray-400">Arma una cotización formal para tu cliente o carga una venta directa.</p>
      </div>
      
      <NuevaOperacionClient 
        clientes={clientes || []} 
        stock={sellableItems} 
        vendedores={vendedores || []}
        currentUserVendedorId={currentUserVendedorId}
        crearPresupuestoAction={crearPresupuesto}
        crearVentaAction={crearVenta}
        defaultMode="presupuesto"
      />
    </div>
  );
}
