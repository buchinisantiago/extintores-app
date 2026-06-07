'use server';

import { supabase } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';

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
  // Call the Postgres function (RPC) we will define for the transaction
  const { data: venta_id, error } = await supabase.rpc('crear_venta', {
    p_cliente_id: cliente_id,
    p_total: total,
    p_items: items
  });

  if (error) {
    console.error("Error creating venta:", error);
    return { success: false, error: error.message };
  }

  // Update accounting fields
  if (venta_id) {
    await supabase.from('ventas').update({
      nro_factura: nro_factura || null,
      estado_pago: estado_pago || 'Pagado',
      observaciones: observaciones || null,
      metodo_pago: metodo_pago || null,
      comprobante: comprobante || null,
      vendedor_id: vendedor_id || null
    }).eq('id', venta_id);
  }

  revalidatePath('/ventas');
  revalidatePath('/stock/terminado');
  revalidatePath('/finanzas');
  revalidatePath('/');
  return { success: true, venta_id: venta_id };
}
