'use server';

import { supabase } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';

export async function addCliente(formData: FormData) {
  const nombre = formData.get('nombre') as string;
  const telefono = formData.get('telefono') as string;
  const email = formData.get('email') as string;
  const direccion = formData.get('direccion') as string;

  const { data, error } = await supabase.from('clientes').insert({
    nombre,
    telefono,
    email,
    direccion
  }).select('id').single();

  if (error) {
    console.error(error);
    return null;
  }

  revalidatePath('/clientes');
  return data.id; // Returns new client ID for redirecting if needed
}
