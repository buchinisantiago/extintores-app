'use server';

import { supabase } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';

export async function marcarComoPagado(ventaId: string) {
  await supabase
    .from('ventas')
    .update({ estado_pago: 'Pagado' })
    .eq('id', ventaId);

  revalidatePath('/ventas');
  revalidatePath('/finanzas');
}
