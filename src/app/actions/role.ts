'use server'

import { cookies } from 'next/headers';

export async function setRole(role: 'Gerente' | 'Administrativo') {
  const cookieStore = await cookies();
  cookieStore.set('user_role', role, { path: '/' });
}
