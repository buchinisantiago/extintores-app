'use server';

import { supabase } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';

export async function crearVenta(cliente_id: string, total: number, items: any[]) {
  // Call the Postgres function (RPC) we will define for the transaction
  const { data, error } = await supabase.rpc('crear_venta', {
    p_cliente_id: cliente_id,
    p_total: total,
    p_items: items
  });

  if (error) {
    console.error("Error creating venta:", error);
    return { success: false, error: error.message };
  }

  revalidatePath('/ventas');
  revalidatePath('/stock/terminado');
  revalidatePath('/');
  return { success: true, venta_id: data };
}
