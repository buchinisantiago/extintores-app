'use server';

import { supabase } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';

export async function addMateriaPrima(formData: FormData) {
  const material = formData.get('material') as string;
  const cantidad = Number(formData.get('cantidad'));
  const unidad = formData.get('unidad') as string;
  const alerta_minimo = Number(formData.get('alerta_minimo'));

  await supabase.from('stock_mp').insert({
    material,
    cantidad,
    unidad,
    alerta_minimo
  });

  revalidatePath('/stock/mp');
  revalidatePath('/');
}

export async function updateMateriaPrima(id: string, cantidad: number) {
  await supabase.from('stock_mp').update({ cantidad }).eq('id', id);
  revalidatePath('/stock/mp');
  revalidatePath('/');
}

export async function deleteMateriaPrima(id: string) {
  await supabase.from('stock_mp').delete().eq('id', id);
  revalidatePath('/stock/mp');
  revalidatePath('/');
}
