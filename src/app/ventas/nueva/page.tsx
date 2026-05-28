import { supabase } from '@/lib/supabase';
import NuevaVentaClient from './NuevaVentaClient';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const revalidate = 0;

export default async function NuevaVentaPage() {
  const { data: clientes } = await supabase.from('clientes').select('id, nombre').order('nombre');
  const { data: stock_terminado } = await supabase
    .from('stock_terminado')
    .select('cantidad, skus(id, nombre, precio_recarga)')
    .gt('cantidad', 0); // Solo traer lo que tiene stock

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto">
      <div>
        <Link href="/ventas" className="inline-flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 mb-4 transition-colors">
          <ArrowLeft size={16} /> Volver a Ventas
        </Link>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Registrar Venta</h1>
        <p className="text-gray-400">Selecciona el cliente y los extintores recargados a facturar/entregar.</p>
      </div>
      
      <NuevaVentaClient clientes={clientes || []} stock={(stock_terminado as any) || []} />
    </div>
  );
}
