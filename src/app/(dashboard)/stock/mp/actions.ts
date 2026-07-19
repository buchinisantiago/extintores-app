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
  // Obtener cantidad anterior
  const { data: oldData } = await supabase.from('stock_mp').select('cantidad').eq('id', id).single();
  const oldCantidad = oldData?.cantidad || 0;
  
  await supabase.from('stock_mp').update({ cantidad }).eq('id', id);
  
  if (oldCantidad !== cantidad) {
    const diff = cantidad - oldCantidad;
    await supabase.from('movimientos_stock').insert({
      tipo_entidad: 'MP',
      entidad_id: id,
      tipo_movimiento: 'Ajuste Manual',
      cantidad: diff,
      observaciones: 'Modificado con el lápiz en la tabla'
    });
  }

  revalidatePath('/stock/mp');
  revalidatePath('/');
}

export async function getHistorialKardex(entidad_id: string, tipo_entidad: 'MP' | 'SKU') {
  const { data } = await supabase
    .from('movimientos_stock')
    .select('*')
    .eq('entidad_id', entidad_id)
    .eq('tipo_entidad', tipo_entidad)
    .order('fecha', { ascending: false })
    .limit(50);
  
  return { success: true, data: data || [] };
}

export async function editMateriaPrima(id: string, formData: FormData) {
  const material = formData.get('material') as string;
  const unidad = formData.get('unidad') as string;
  const alerta_minimo = Number(formData.get('alerta_minimo'));

  await supabase.from('stock_mp').update({
    material,
    unidad,
    alerta_minimo
  }).eq('id', id);

  revalidatePath('/stock/mp');
  revalidatePath('/');
}

export async function deleteMateriaPrima(id: string) {
  // Eliminar referencias manuales por modo pruebas (ej. recetas y movimientos)
  await supabase.from('sku_recetas').delete().eq('mp_id', id);
  await supabase.from('movimientos_stock').delete().eq('entidad_id', id).eq('tipo_entidad', 'MP');
  await supabase.from('reposicion_items').delete().eq('entidad_id', id).eq('tipo_entidad', 'MP');

  const { error } = await supabase.from('stock_mp').delete().eq('id', id);
  
  if (error) {
    return { success: false, error: error.message };
  }
  
  revalidatePath('/stock/mp');
  revalidatePath('/');
  return { success: true };
}
