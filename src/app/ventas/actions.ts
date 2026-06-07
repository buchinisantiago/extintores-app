'use server';

import { supabase } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';

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
