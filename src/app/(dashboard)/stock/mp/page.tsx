import { supabase } from '@/lib/supabase';
import MateriaPrimaClient from './MateriaPrimaClient';

export const revalidate = 0;

export default async function StockMateriaPrimaPage() {
  const { data: stockMP, error } = await supabase
    .from('stock_mp')
    .select('*')
    .order('material');

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Materia Prima</h1>
        <p className="text-gray-400">Gestiona el inventario a granel (Polvo ABC, CO2, etc).</p>
      </div>
      
      <MateriaPrimaClient initialData={stockMP || []} />
    </div>
  );
}
