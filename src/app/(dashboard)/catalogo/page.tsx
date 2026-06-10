import { createClient } from '@/lib/supabase/server';
import CatalogoClient from './CatalogoClient';
import { redirect } from 'next/navigation';

export const revalidate = 0;

export default async function CatalogoPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user?.email !== 'gerencia@tuempresa.com') {
    redirect('/');
  }

  const { data: skus } = await supabase.from('skus').select('*').order('nombre');

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Catálogo y Precios</h1>
        <p className="text-gray-400">Administra los productos, costos, proveedores y aplica aumentos por inflación.</p>
      </div>
      
      <CatalogoClient initialData={skus || []} />
    </div>
  );
}
