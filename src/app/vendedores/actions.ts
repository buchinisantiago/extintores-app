'use server';

import { supabase } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';

export async function addVendedor(formData: FormData) {
  const nombre = formData.get('nombre') as string;
  
  if (!nombre) return;

  await supabase.from('vendedores').insert([{ nombre }]);
  revalidatePath('/vendedores');
  revalidatePath('/ventas/nueva');
}

export async function deleteVendedor(id: string) {
  // Solo se puede borrar si no tiene ventas asignadas, o setear ventas a null (lo cual viola la FK si no es SET NULL, pero el default es NO ACTION).
  // Si falla, es porque tiene ventas.
  const { error } = await supabase.from('vendedores').delete().eq('id', id);
  if (error) {
    return { success: false, error: 'No se puede borrar el vendedor porque tiene ventas asociadas.' };
  }
  revalidatePath('/vendedores');
  revalidatePath('/ventas/nueva');
  return { success: true };
}
