'use server';

import { supabase } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function createGasto(formData: FormData) {
  const fecha = formData.get('fecha') as string;
  const nro_comprobante = formData.get('nro_comprobante') as string;
  const estado_pago = formData.get('estado_pago') as string;
  const observaciones = formData.get('observaciones') as string;
  const monto = parseFloat(formData.get('monto') as string);

  const { error } = await supabase.from('gastos').insert({
    fecha: new Date(fecha).toISOString(),
    nro_comprobante,
    estado_pago,
    observaciones,
    monto
  });

  if (error) {
    console.error('Error creating gasto:', error);
    throw new Error('No se pudo guardar el gasto.');
  }

  revalidatePath('/gastos');
  revalidatePath('/finanzas');
  redirect('/gastos');
}
