'use server';

import { supabase } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';
import { validateStockForSale } from '@/lib/stockValidation';

export async function crearVenta(
  cliente_id: string, 
  total: number, 
  items: any[],
  nro_factura?: string,
  estado_pago?: string,
  observaciones?: string,
  metodo_pago?: string,
  comprobante?: string,
  vendedor_id?: string
) {
  const stockError = await validateStockForSale(items);
  if (stockError) return { success: false, error: stockError };

  // Call the Postgres function (RPC) we will define for the transaction
  const { data: venta_id, error } = await supabase.rpc('crear_venta', {
    p_cliente_id: cliente_id,
    p_total: total,
    p_items: items,
    p_metodo_pago: metodo_pago || null,
    p_observaciones: observaciones || null,
    p_nro_factura: nro_factura || null,
    p_estado_pago: estado_pago || 'Pagado',
    p_vendedor_id: vendedor_id || null
  });

  if (error) {
    console.error("Error creating venta:", error);
    return { success: false, error: error.message };
  }

  // Register any "otro" extinguishers for the client
  for (const item of items) {
    if (item.nro_serie && item.nro_serie.trim() !== '') {
      const nroSerie = item.nro_serie.trim();
      const { data: existing } = await supabase
        .from('extintores')
        .select('id')
        .eq('cliente_id', cliente_id)
        .or(`nro_serie.eq.${nroSerie},nro_cilindro.eq.${nroSerie}`)
        .maybeSingle();

      if (!existing) {
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
          cliente_id: cliente_id,
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

  revalidatePath('/ventas');
  revalidatePath('/stock/terminado');
  revalidatePath('/finanzas');
  revalidatePath('/');
  return { success: true, venta_id: venta_id };
}

export async function getClientExtinguishers(cliente_id: string) {
  if (!cliente_id) return [];
  const { data, error } = await supabase
    .from('extintores')
    .select('id, nro_cilindro, skus(nombre)')
    .eq('cliente_id', cliente_id);
    
  if (error) {
    console.error("Error fetching client extinguishers:", error);
    return [];
  }
  return data || [];
}
