'use server';

import { supabase } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';

export async function updateConfig(formData: FormData) {
  const empresa_nombre = formData.get('empresa_nombre') as string;
  const email_notificaciones = formData.get('email_notificaciones') as string;

  const { error } = await supabase.from('configuracion').upsert({
    id: 1,
    empresa_nombre,
    email_notificaciones
  });

  if (error) return { success: false, error: error.message };
  
  revalidatePath('/ajustes');
  return { success: true };
}
