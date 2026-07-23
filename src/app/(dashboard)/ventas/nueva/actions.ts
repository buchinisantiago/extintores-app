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
