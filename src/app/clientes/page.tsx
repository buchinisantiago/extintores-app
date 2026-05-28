import { supabase } from '@/lib/supabase';
import ClientesClient from './ClientesClient';

export const revalidate = 0;

export default async function ClientesPage() {
  const { data: clientes } = await supabase
    .from('clientes')
    .select('*, extintores(count)')
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Directorio de Clientes</h1>
        <p className="text-gray-400">Gestiona los clientes y sus extintores asignados.</p>
      </div>
      
      <ClientesClient initialData={clientes || []} />
    </div>
  );
}
