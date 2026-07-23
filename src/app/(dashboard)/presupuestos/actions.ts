'use server';

import { supabase } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';
import { validateStockForSale } from '@/lib/stockValidation';

export async function crearPresupuesto(
  clienteId: string, 
  total: number, 
  items: any[], 
  observaciones: string,
  vendedorId?: string
) {
  // 1. Insert presupuesto
  const { data: presupuesto, error: pError } = await supabase
    .from('presupuestos')
    .insert({
      cliente_id: clienteId,
      vendedor_id: vendedorId || null,
      total,
      validez_dias: 30,
      observaciones: observaciones || null
    })
    .select('id')
    .single();

  if (pError) return { success: false, error: pError.message };

  // 2. Insert items
  const itemsToInsert = items.map(item => ({
    presupuesto_id: presupuesto.id,
    sku_id: item.sku_id,
    cantidad: item.cantidad,
    precio_unitario: item.precio_unitario,
    nro_serie: item.nro_serie || null
  }));

  const { error: iError } = await supabase
    .from('presupuesto_items')
    .insert(itemsToInsert);

  if (iError) {
    await supabase.from('presupuestos').delete().eq('id', presupuesto.id);
    return { success: false, error: iError.message };
  }

  revalidatePath('/presupuestos');
  
  // 3. Register any "otro" extinguishers for the client
  for (const item of items) {
    if (item.nro_serie && item.nro_serie.trim() !== '') {
      const nroSerie = item.nro_serie.trim();
      // Check if it already exists (checking both nro_serie and nro_cilindro just in case)
      const { data: existing } = await supabase
        .from('extintores')
        .select('id')
        .eq('cliente_id', clienteId)
        .or(`nro_serie.eq.${nroSerie},nro_cilindro.eq.${nroSerie}`)
        .maybeSingle();

      if (!existing) {
        // Doesn't exist, insert it!
        const cargaAnios = item.renovacion_carga_anios || 1;
        const phAnios = item.renovacion_ph_anios || 0;
        
        const now = new Date();
        const nextCarga = new Date(now);
        nextCarga.setFullYear(now.getFullYear() + cargaAnios);
        
        let nextPh = null;
        if (phAnios > 0) {
          nextPh = new Date(now);
          nextPh.setFullYear(now.getFullYear() + phAnios);
        }

        await supabase.from('extintores').insert({
          cliente_id: clienteId,
          sku_id: item.sku_id,
          nro_serie: nroSerie,
          fecha_carga: now.toISOString(),
          fecha_vence: nextCarga.toISOString(),
          estado: 'vigente',
          fecha_ph: phAnios > 0 ? now.toISOString() : null,
          vence_ph: nextPh ? nextPh.toISOString() : null,
          estado_ph: phAnios > 0 ? 'vigente' : 'sin_datos'
        });
      }
    }
  }

  return { success: true, id: presupuesto.id };
}

export async function rechazarPresupuesto(id: string) {
  const { error } = await supabase
    .from('presupuestos')
    .update({ estado: 'Rechazado' })
    .eq('id', id);

  if (error) return { success: false, error: error.message };
  
  revalidatePath('/presupuestos');
  return { success: true };
}

export async function borrarPresupuesto(id: string) {
  const { error } = await supabase.from('presupuestos').delete().eq('id', id);
  if (error) return { success: false, error: error.message };
  revalidatePath('/presupuestos');
  return { success: true };
}

export async function convertirPresupuesto(
  id: string,
  estado_pago: string,
  metodo_pago: string,
  comprobante: string
) {
  const { data: pItems, error: itemsErr } = await supabase.from('presupuesto_items').select('sku_id, cantidad').eq('presupuesto_id', id);
  if (!itemsErr && pItems) {
    const stockError = await validateStockForSale(pItems);
    if (stockError) return { success: false, error: stockError };
  }

  const { data, error } = await supabase.rpc('convertir_presupuesto_a_venta', {
    p_presupuesto_id: id,
    p_estado_pago: estado_pago,
    p_metodo_pago: metodo_pago,
    p_comprobante: comprobante
  });

  if (error) return { success: false, error: error.message };

  revalidatePath('/presupuestos');
  revalidatePath('/ventas');
  revalidatePath('/stock/terminado');
  return { success: true, venta_id: data };
}
