import { createClient } from '@/lib/supabase/server';
import ReposicionesClient from './ReposicionesClient';

export const revalidate = 0;

export default async function ReposicionesPage() {
  const supabase = await createClient();

  // Fetch past replenishments
  const { data: reposiciones } = await supabase
    .from('reposiciones')
    .select(`
      id,
      fecha,
      observaciones,
      reposicion_items (
        id,
        tipo_entidad,
        entidad_id,
        cantidad
      )
    `)
    .order('fecha', { ascending: false });

  // Fetch dictionary of MP to display names
  const { data: materiasPrimas } = await supabase.from('stock_mp').select('id, material, unidad');
  
  // Fetch dictionary of SKUs (Products) to display names (only non-services ideally, but we fetch all)
  const { data: skus } = await supabase.from('skus').select('id, nombre').eq('es_servicio', false);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Ingresos y Reposición</h1>
        <p className="text-gray-400">Registra entradas de mercadería y mantén un historial de todo lo que ingresa al stock.</p>
      </div>
      
      <ReposicionesClient 
        initialData={reposiciones || []} 
        materiasPrimas={materiasPrimas || []}
        skus={skus || []}
      />
    </div>
  );
}
