'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function registrarReposicion(observaciones: string, items: any[]) {
  const supabase = await createClient();
  
  // Usar RPC para registrar el ingreso y sumar al stock automáticamente
  const { data: reposicion_id, error } = await supabase.rpc('registrar_reposicion', {
    p_observaciones: observaciones || null,
    p_items: items
  });

  if (error) {
    console.error("Error registrando reposición:", error);
    return { success: false, error: error.message };
  }

  revalidatePath('/reposiciones');
  revalidatePath('/stock/mp');
  revalidatePath('/stock/terminado');
  return { success: true, reposicion_id };
}
