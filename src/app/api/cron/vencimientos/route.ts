import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY || 're_dummy_key_for_build');

export async function GET(request: Request) {
  // 1. Validar el secreto para evitar que cualquiera ejecute el cron
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // 2. Buscar extintores próximos a vencer (carga o PH) que pertenezcan a clientes con email
    const { data: extintores, error } = await supabase
      .from('extintores_view')
      .select('*, clientes(nombre, email), skus(nombre)')
      .or('estado.eq.por_vencer,estado_ph.eq.por_vencer')
      .not('clientes.email', 'is', null);

    if (error) throw error;
    if (!extintores || extintores.length === 0) {
      return NextResponse.json({ message: 'No hay extintores por vencer hoy.' });
    }

    // 3. Agrupar por cliente para no mandar 50 emails al mismo si tiene 50 extintores
    const envios: Record<string, any> = {};
    for (const ext of extintores) {
      const email = ext.clientes?.email;
      if (!email) continue;

      if (!envios[email]) {
        envios[email] = {
          cliente_nombre: ext.clientes.nombre,
          extintores: []
        };
      }
      envios[email].extintores.push(ext);
    }

    // 4. Enviar emails
    const promesas = Object.entries(envios).map(async ([email, datos]) => {
      const listaHtml = datos.extintores.map((e: any) => 
        `<li>${e.skus.nombre} (Serie: ${e.nro_serie || 'S/N'}) - Vence: ${e.estado === 'por_vencer' ? 'Carga' : 'Prueba Hidráulica'}</li>`
      ).join('');

      return resend.emails.send({
        from: 'Avisos Extintores <onboarding@resend.dev>', // Cambiar por dominio real verificado
        to: email,
        subject: '⚠️ Aviso de Vencimiento Próximo de Extintores',
        html: `
          <h3>Hola ${datos.cliente_nombre},</h3>
          <p>Le escribimos para recordarle que los siguientes extintores de su propiedad están próximos a vencer (en los próximos 30-60 días):</p>
          <ul>${listaHtml}</ul>
          <p>Por favor, comuníquese con nosotros para programar la recarga o prueba hidráulica.</p>
          <p>Saludos,</p>
        `
      });
    });

    await Promise.all(promesas);

    return NextResponse.json({ message: `Se enviaron ${Object.keys(envios).length} correos.` });
  } catch (err: any) {
    console.error("Cron Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
