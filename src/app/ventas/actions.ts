'use server';

import { supabase } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';
import { notificarCambioGerente } from '@/lib/email';

export async function marcarComoPagado(ventaId: string, metodoPago?: string, comprobante?: string) {
  const { error } = await supabase
    .from('ventas')
    .update({ 
      estado_pago: 'Pagado',
      metodo_pago: metodoPago || 'Efectivo',
      comprobante: comprobante || null
    })
    .eq('id', ventaId);

  revalidatePath('/ventas');
  revalidatePath('/finanzas');
  revalidatePath('/clientes', 'layout');
}

export async function anularVenta(ventaId: string) {
  const { error } = await supabase.rpc('anular_venta', {
    p_venta_id: ventaId
  });

  if (error) {
    return { success: false, error: error.message };
  }

  await notificarCambioGerente('Anulación de Venta', `Se anuló y borró la venta con ID: ${ventaId}. El stock de los productos ha sido devuelto al sistema.`);

  revalidatePath('/ventas');
  revalidatePath('/finanzas');
  revalidatePath('/clientes', 'layout');
  revalidatePath('/stock/terminado');
  return { success: true };
}

export async function updateVentaInfo(ventaId: string, formData: FormData) {
  const nro_factura = formData.get('nro_factura') as string;
  const estado_pago = formData.get('estado_pago') as string;
  const observaciones = formData.get('observaciones') as string;
  const metodo_pago = formData.get('metodo_pago') as string;
  const comprobante = formData.get('comprobante') as string;

  const { error } = await supabase.from('ventas').update({
    nro_factura: nro_factura || null,
    estado_pago,
    observaciones: observaciones || null,
    metodo_pago: metodo_pago || null,
    comprobante: comprobante || null
  }).eq('id', ventaId);

  if (error) {
    return { success: false, error: error.message };
  }

  await notificarCambioGerente('Edición de Venta', `Se modificó la venta con ID: ${ventaId}. Factura: ${nro_factura}, Estado: ${estado_pago}, Observaciones: ${observaciones}.`);

  revalidatePath('/ventas');
  revalidatePath('/finanzas');
  revalidatePath('/clientes', 'layout');
  return { success: true };
}
