'use server';

import { supabase } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';

export async function addSku(formData: FormData) {
  const nombre = formData.get('nombre') as string;
  const descripcion = formData.get('descripcion') as string;
  const precio_recarga = parseFloat(formData.get('precio_recarga') as string) || 0;
  const tipo_agente = formData.get('tipo_agente') as string;
  const capacidad = parseFloat(formData.get('capacidad') as string) || null;
  const unidad_medida = formData.get('unidad_medida') as string;
  const es_servicio = formData.get('es_servicio') === 'on';
  const proveedor = formData.get('proveedor') as string;
  const costo = parseFloat(formData.get('costo') as string) || 0;

  const { error } = await supabase.from('skus').insert([{
    nombre, descripcion, precio_recarga, tipo_agente, capacidad, unidad_medida, es_servicio, proveedor, costo
  }]);

  if (error) return { success: false, error: error.message };
  
  revalidatePath('/catalogo');
  return { success: true };
}

export async function updateSku(id: string, formData: FormData) {
  const nombre = formData.get('nombre') as string;
  const precio_recarga = parseFloat(formData.get('precio_recarga') as string) || 0;
  const proveedor = formData.get('proveedor') as string;
  const costo = parseFloat(formData.get('costo') as string) || 0;

  const { error } = await supabase.from('skus').update({
    nombre, precio_recarga, proveedor, costo
  }).eq('id', id);

  if (error) return { success: false, error: error.message };
  
  revalidatePath('/catalogo');
  return { success: true };
}

export async function deleteSku(id: string) {
  // If we try to delete a SKU used in sales or stock it will fail due to FK
  const { error } = await supabase.from('skus').delete().eq('id', id);
  if (error) return { success: false, error: 'No se puede eliminar porque está en uso en stock o ventas.' };
  
  revalidatePath('/catalogo');
  return { success: true };
}

export async function aumentoMasivo(porcentaje: number, afectarCosto: boolean, afectarPrecio: boolean) {
  const multiplier = 1 + (porcentaje / 100.0);
  
  let updates = [];
  if (afectarPrecio) updates.push(`precio_recarga = precio_recarga * ${multiplier}`);
  if (afectarCosto) updates.push(`costo = costo * ${multiplier}`);

  if (updates.length === 0) return { success: false, error: 'Debes elegir qué afectar.' };

  // Ejecutamos una query directa, pero RPC es mejor.
  // Como no tenemos el RPC creado para esto, podemos usar el cliente JS para obtener todos y actualizarlos.
  const { data: skus } = await supabase.from('skus').select('id, precio_recarga, costo');
  
  for (const sku of (skus || [])) {
    const newValues: any = {};
    if (afectarPrecio) newValues.precio_recarga = Math.round((sku.precio_recarga * multiplier) * 100) / 100;
    if (afectarCosto) newValues.costo = Math.round((sku.costo * multiplier) * 100) / 100;

    await supabase.from('skus').update(newValues).eq('id', sku.id);
  }

  revalidatePath('/catalogo');
  return { success: true };
}

export async function addRecetaItem(sku_id: string, mp_id: string, cantidad: number) {
  const { error } = await supabase.from('sku_recetas').insert([{
    sku_id, mp_id, cantidad_necesaria: cantidad
  }]);
  
  if (error) return { success: false, error: error.message };
  
  revalidatePath('/catalogo');
  return { success: true };
}

export async function removeRecetaItem(id: string) {
  const { error } = await supabase.from('sku_recetas').delete().eq('id', id);
  
  if (error) return { success: false, error: error.message };
  
  revalidatePath('/catalogo');
  return { success: true };
}
