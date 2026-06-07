import { supabase } from '@/lib/supabase';
import VendedoresClient from './VendedoresClient';

export const revalidate = 0;

export default async function VendedoresPage() {
  const { data: vendedores } = await supabase
    .from('vendedores')
    .select('*')
    .order('nombre');

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Vendedores</h1>
        <p className="text-gray-400">Gestiona los vendedores para el cálculo de comisiones.</p>
      </div>
      
      <VendedoresClient initialData={vendedores || []} />
    </div>
  );
}
