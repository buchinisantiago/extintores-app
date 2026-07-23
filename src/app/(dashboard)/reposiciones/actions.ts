'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function registrarReposicion(observaciones: string, items: any[]) {
  const supabase = await createClient();
  
  // Usar RPC para registrar el ingreso y sumar al stock automáticamente
  const { data: reposicion_id, error } = await supabase.rpc('registrar_reposicion', {
    p_observaciones: observaciones || null,
    p_items: items
  });

  if (error) {
    console.error("Error registrando reposición:", error);
    return { success: false, error: error.message };
  }

  // Sincronizar artículos de reventa (1:1)
  const { data: recetas } = await supabase.from('sku_recetas').select('*').eq('cantidad_necesaria', 1);
  if (recetas && recetas.length > 0) {
    for (const item of items) {
      if (item.tipo_entidad === 'MP') {
        // Find if this MP is part of a 1:1 recipe
        const matchingRecetas = recetas.filter(r => r.mp_id === item.entidad_id);
        for (const rec of matchingRecetas) {
          // Increase stock_terminado
          const { data: st } = await supabase.from('stock_terminado').select('cantidad').eq('sku_id', rec.sku_id).single();
          if (st) {
            await supabase.from('stock_terminado').update({ 
              cantidad: st.cantidad + item.cantidad,
              ultima_actualizacion: new Date().toISOString()
            }).eq('sku_id', rec.sku_id);
          } else {
            await supabase.from('stock_terminado').insert({
              sku_id: rec.sku_id,
              cantidad: item.cantidad
            });
          }
        }
      } else if (item.tipo_entidad === 'SKU') {
        // Find if this SKU has a 1:1 recipe
        const matchingRecetas = recetas.filter(r => r.sku_id === item.entidad_id);
        for (const rec of matchingRecetas) {
          // Increase stock_mp
          const { data: mp } = await supabase.from('stock_mp').select('cantidad').eq('id', rec.mp_id).single();
          if (mp) {
            await supabase.from('stock_mp').update({ 
              cantidad: mp.cantidad + item.cantidad,
              ultima_actualizacion: new Date().toISOString()
            }).eq('id', rec.mp_id);
          }
        }
      }
    }
  }

  revalidatePath('/reposiciones');
  revalidatePath('/stock/mp');
  revalidatePath('/stock/terminado');
  return { success: true, reposicion_id };
}
