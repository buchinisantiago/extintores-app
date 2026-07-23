'use server';

import { supabase } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';

export async function addMateriaPrima(formData: FormData) {
  const material = formData.get('material') as string;
  const cantidad = Number(formData.get('cantidad'));
  const unidad = formData.get('unidad') as string;
  const alerta_minimo = Number(formData.get('alerta_minimo'));

  const es_reventa = formData.get('es_reventa') === 'on';
  const precio_venta_str = formData.get('precio_venta') as string;
  const precio_venta = precio_venta_str ? parseFloat(precio_venta_str) : 0;
  const costo_str = formData.get('costo') as string;
  const costo = costo_str ? parseFloat(costo_str) : null;

  const { data: newMp, error } = await supabase.from('stock_mp').insert({
    material,
    cantidad,
    unidad,
    alerta_minimo
  }).select('id').single();

  if (newMp && es_reventa) {
    // Crear el producto en SKUs
    const { data: newSku } = await supabase.from('skus').insert({
      nombre: material,
      tipo_agente: 'Reventa',
      precio_recarga: precio_venta,
      costo: costo
    }).select('id').single();

    if (newSku) {
      // Crear la receta 1:1
      await supabase.from('sku_recetas').insert({
        sku_id: newSku.id,
        mp_id: newMp.id,
        cantidad_necesaria: 1
      });

      // Crear el registro inicial en stock_terminado
      await supabase.from('stock_terminado').insert({
        sku_id: newSku.id,
        cantidad: cantidad
      });
    }
  }

  revalidatePath('/stock/mp');
  revalidatePath('/stock/terminado');
  revalidatePath('/ventas/nueva');
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
