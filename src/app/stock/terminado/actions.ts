'use server';

import { supabase } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';

export async function addStockTerminado(sku_id: string, currentCantidad: number, amountToAdd: number) {
  // Primero verificamos si ya existe el registro para este sku en stock_terminado
  const { data: existing } = await supabase.from('stock_terminado').select('id').eq('sku_id', sku_id).single();

  if (existing) {
    await supabase.from('stock_terminado').update({ 
      cantidad: currentCantidad + amountToAdd,
      ultima_actualizacion: new Date().toISOString()
    }).eq('sku_id', sku_id);
  } else {
    await supabase.from('stock_terminado').insert({
      sku_id,
      cantidad: amountToAdd
    });
  }

  revalidatePath('/stock/terminado');
  revalidatePath('/');
}
