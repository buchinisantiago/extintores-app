import { supabase } from '@/lib/supabase';
import VencimientosClient from './VencimientosClient';

export const revalidate = 0;

export default async function VencimientosPage() {
  const { data: extintores } = await supabase
    .from('extintores_view')
    .select('*, skus(nombre, tipo_agente), clientes(id, nombre, telefono)')
    .or('estado.in.(por_vencer,vencido),estado_ph.in.(por_vencer,vencido)')
    .order('fecha_vence', { ascending: true });

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Vencimientos</h1>
        <p className="text-gray-400">Control de extintores y pruebas hidráulicas a punto de vencer.</p>
      </div>
      
      <VencimientosClient initialData={extintores || []} />
    </div>
  );
}
