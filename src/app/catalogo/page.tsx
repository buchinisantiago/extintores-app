import { supabase } from '@/lib/supabase';
import CatalogoClient from './CatalogoClient';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export const revalidate = 0;

export default async function CatalogoPage() {
  const cookieStore = await cookies();
  const role = cookieStore.get('user_role')?.value;

  if (role !== 'Gerente') {
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
