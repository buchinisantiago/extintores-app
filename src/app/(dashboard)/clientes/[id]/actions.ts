'use server';

import { supabase } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';

export async function addExtintor(formData: FormData) {
  const cliente_id = formData.get('cliente_id') as string;
  const sku_id = formData.get('sku_id') as string;
  const nro_serie = formData.get('nro_serie') as string;
  const fecha_carga = formData.get('fecha_carga') as string;
  const vencimiento_ph_str = formData.get('vencimiento_ph') as string;
  let fecha_ph = null;
  if (vencimiento_ph_str) {
    const d = new Date(vencimiento_ph_str);
    d.setFullYear(d.getFullYear() - 5);
    fecha_ph = d.toISOString().split('T')[0];
  }

  await supabase.from('extintores').insert({
    cliente_id,
    sku_id,
    nro_serie,
    fecha_carga,
    fecha_ph: fecha_ph

  });

  revalidatePath(`/clientes/${cliente_id}`);
}

export async function deleteExtintor(id: string, cliente_id: string) {
  await supabase.from('extintores').delete().eq('id', id);
  revalidatePath(`/clientes/${cliente_id}`);
}
