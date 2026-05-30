import { supabase } from '@/lib/supabase';
import ClienteDetalleClient from './ClienteDetalleClient';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { notFound } from 'next/navigation';

export const revalidate = 0;

export default async function ClienteDetallePage({ params }: { params: { id: string } }) {
  const { data: cliente, error } = await supabase
    .from('clientes')
    .select('*')
    .eq('id', params.id)
    .single();

  if (error || !cliente) {
    notFound();
  }

  // Obtenemos los extintores usando la vista para traer los estados
  const { data: extintores } = await supabase
    .from('extintores_view')
    .select('*, skus(nombre, tipo_agente)')
    .eq('cliente_id', params.id)
    .order('fecha_vence', { ascending: true });

  // Obtenemos las ventas del cliente
  const { data: ventas } = await supabase
    .from('ventas')
    .select('*, venta_items(count)')
    .eq('cliente_id', params.id)
    .order('fecha', { ascending: false });

  const { data: skus } = await supabase.from('skus').select('*').order('nombre');

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <Link href="/clientes" className="inline-flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 mb-4 transition-colors">
          <ArrowLeft size={16} /> Volver a Clientes
        </Link>
        <h1 className="text-3xl font-bold tracking-tight mb-2">{cliente.nombre}</h1>
        <p className="text-gray-400">Detalle del cliente y parque de extintores.</p>
      </div>
      
      <ClienteDetalleClient 
        cliente={cliente} 
        initialExtintores={(extintores as any) || []} 
        skus={skus || []}
        ventas={ventas || []} 
      />
    </div>
  );
}
