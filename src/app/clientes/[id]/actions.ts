'use server';

import { supabase } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';

export async function addExtintor(formData: FormData) {
  const cliente_id = formData.get('cliente_id') as string;
  const sku_id = formData.get('sku_id') as string;
  const nro_serie = formData.get('nro_serie') as string;
  const fecha_carga = formData.get('fecha_carga') as string;
  const fecha_ph = formData.get('fecha_ph') as string;

  await supabase.from('extintores').insert({
    cliente_id,
    sku_id,
    nro_serie,
    fecha_carga,
    fecha_ph: fecha_ph ? fecha_ph : null
  });

  revalidatePath(`/clientes/${cliente_id}`);
}

export async function deleteExtintor(id: string, cliente_id: string) {
  await supabase.from('extintores').delete().eq('id', id);
  revalidatePath(`/clientes/${cliente_id}`);
}
