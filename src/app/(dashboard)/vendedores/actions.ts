'use server';

import { supabase } from '@/lib/supabase';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';

export async function addVendedor(formData: FormData) {
  try {
    const nombre = formData.get('nombre') as string;
    const email = formData.get('email') as string;
    
    if (!nombre || !email) return { success: false, error: 'Nombre y correo requeridos' };

    // 1. Crear usuario en Auth
    const supabaseAdmin = getSupabaseAdmin();
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: '1234',
      email_confirm: true,
    });

    if (authError) {
      return { success: false, error: 'Error al crear login: ' + authError.message };
    }

    if (!authData?.user?.id) {
      return { success: false, error: 'Error: No se recibió ID de usuario' };
    }

    // 2. Insertar vendedor
    const { error } = await supabase.from('vendedores').insert([{ 
      nombre,
      auth_user_id: authData.user.id
    }]);

    if (error) {
      return { success: false, error: error.message };
    }
    revalidatePath('/vendedores');
    revalidatePath('/ventas/nueva');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: 'Error de servidor: ' + (error.message || String(error)) };
  }
}

export async function deleteVendedor(id: string) {
  // Solo se puede borrar si no tiene ventas asignadas, o setear ventas a null (lo cual viola la FK si no es SET NULL, pero el default es NO ACTION).
  // Si falla, es porque tiene ventas.
  const { error } = await supabase.from('vendedores').delete().eq('id', id);
  if (error) {
    return { success: false, error: 'No se puede borrar el vendedor porque tiene ventas asociadas.' };
  }
  revalidatePath('/vendedores');
  revalidatePath('/ventas/nueva');
  return { success: true };
}
