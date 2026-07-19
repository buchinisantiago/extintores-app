'use server';

import { supabase } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';
import { notificarCambioGerente } from '@/lib/email';

export async function addCliente(formData: FormData) {
  const nombre = formData.get('nombre') as string;
  const documento = formData.get('documento') as string;
  const telefono = formData.get('telefono') as string;
  const email = formData.get('email') as string;
  const direccion = formData.get('direccion') as string;
  const ciudad = formData.get('ciudad') as string;
  const provincia = formData.get('provincia') as string;

  // Check for duplicates
  const { data: existing } = await supabase.from('clientes').select('id').ilike('nombre', `%${nombre}%`).limit(1);
  if (existing && existing.length > 0) {
    return { success: false, error: 'Ya existe un cliente con este mismo nombre.' };
  }

  const { data, error } = await supabase.from('clientes').insert({
    nombre,
    documento: documento || null,
    telefono,
    email,
    direccion,
    ciudad,
    provincia
  }).select('id').single();

  if (error) {
    console.error(error);
    return null;
  }

  revalidatePath('/clientes');
  return data.id; // Returns new client ID for redirecting if needed
}

export async function updateCliente(id: string, formData: FormData) {
  const nombre = formData.get('nombre') as string;
  const documento = formData.get('documento') as string;
  const telefono = formData.get('telefono') as string;
  const email = formData.get('email') as string;
  const direccion = formData.get('direccion') as string;
  const ciudad = formData.get('ciudad') as string;
  const provincia = formData.get('provincia') as string;

  const { error } = await supabase.from('clientes').update({
    nombre,
    documento: documento || null,
    telefono,
    email,
    direccion,
    ciudad,
    provincia
  }).eq('id', id);

  if (error) {
    return { success: false, error: error.message };
  }

  await notificarCambioGerente('Edición de Cliente', `Se modificaron los datos del cliente ${nombre} (ID: ${id}).`);

  revalidatePath('/clientes');
  revalidatePath(`/clientes/${id}`);
  return { success: true };
}

export async function deleteCliente(id: string) {
  // Primero verificamos si tiene ventas o extintores
  const { count: ventasCount } = await supabase.from('ventas').select('*', { count: 'exact', head: true }).eq('cliente_id', id);
  const { count: extintoresCount } = await supabase.from('extintores').select('*', { count: 'exact', head: true }).eq('cliente_id', id);

  if ((ventasCount && ventasCount > 0) || (extintoresCount && extintoresCount > 0)) {
    return { success: false, error: 'No se puede eliminar el cliente porque tiene ventas o extintores asociados. Debes eliminarlos primero.' };
  }

  const { error: deleteError } = await supabase.from('clientes').delete().eq('id', id);

  if (deleteError) {
    return { success: false, error: deleteError.message };
  }

  await notificarCambioGerente('Borrado de Cliente', `Se eliminó por completo de la base de datos al cliente con ID: ${id}.`);

  revalidatePath('/clientes');
  return { success: true };
}
