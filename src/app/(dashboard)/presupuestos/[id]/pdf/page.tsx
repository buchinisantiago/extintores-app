import { supabase } from '@/lib/supabase';
import { notFound } from 'next/navigation';
import PdfClient from './PdfClient';

export default async function PdfPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  const { data: presupuesto } = await supabase
    .from('presupuestos')
    .select('*, clientes(*)')
    .eq('id', id)
    .single();

  if (!presupuesto) return notFound();

  const { data: items } = await supabase
    .from('presupuesto_items')
    .select('*, skus(nombre)')
    .eq('presupuesto_id', id);

  return <PdfClient presupuesto={presupuesto} items={items || []} />;
}
