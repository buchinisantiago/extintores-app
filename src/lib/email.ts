import { Resend } from 'resend';
import { cookies } from 'next/headers';
import { supabase } from './supabase';

const resend = new Resend(process.env.RESEND_API_KEY || 're_dummy_key_for_build');

export async function notificarCambioGerente(accion: string, detalle: string) {
  try {
    const cookieStore = await cookies();
    const role = cookieStore.get('user_role')?.value;

    if (role === 'Administrativo') {
      const { data: config } = await supabase.from('configuracion').select('email_notificaciones').eq('id', 1).single();
      const emailGerente = config?.email_notificaciones || process.env.GERENTE_EMAIL || 'gerencia@tuempresa.com';
      
      await resend.emails.send({
        from: 'Alertas Sistema <onboarding@resend.dev>',
        to: emailGerente,
        subject: `⚠️ Alerta de Seguridad: ${accion}`,
        html: `
          <h3>Un Administrativo realizó una modificación sensible en el sistema:</h3>
          <p><strong>Acción:</strong> ${accion}</p>
          <p><strong>Detalle:</strong> ${detalle}</p>
          <p><small>Fecha y Hora: ${new Date().toLocaleString('es-AR')}</small></p>
          <hr />
          <p>Este es un mensaje automático del Sistema Menendez.</p>
        `
      });
    }
  } catch (error) {
    console.error("Error enviando email de notificación al gerente:", error);
  }
}
