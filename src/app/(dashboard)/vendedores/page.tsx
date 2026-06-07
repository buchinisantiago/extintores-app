import { supabase } from '@/lib/supabase';
import VendedoresClient from './VendedoresClient';

export const revalidate = 0;

export default async function VendedoresPage() {
  try {
    const { data: vendedores, error } = await supabase
      .from('vendedores')
      .select('*')
      .order('nombre');

    if (error) {
      return <div>Error loading database: {error.message}</div>;
    }

    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Vendedores</h1>
          <p className="text-gray-400">Gestiona los vendedores para el cálculo de comisiones.</p>
        </div>
        
        <VendedoresClient initialData={vendedores || []} />
      </div>
    );
  } catch (e: any) {
    return (
      <div className="p-6 bg-red-500/20 text-red-300 font-mono rounded-lg border border-red-500">
        Error renderizando VendedoresPage: {e.message || String(e)}
      </div>
    );
  }
}
