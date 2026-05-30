'use server';

import { supabase } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';

export async function importarVentasExcel(data: any[]) {
  try {
    let importedCount = 0;
    
    // Buscar o crear un cliente genérico para importaciones si el Excel no dice el nombre exacto,
    // o podríamos buscar por nombre de cliente.
    // Para simplificar, buscaremos el nombre en la base o crearemos uno "Consumidor Final" si falla.
    
    for (const row of data) {
      // Las claves dependen de los nombres de columnas en el Excel
      const fechaRaw = row['Fecha'] || row['fecha'] || row['FECHA'];
      let fecha = new Date().toISOString();
      if (fechaRaw) {
        // Manejar fechas de Excel (número de serie) o strings
        if (typeof fechaRaw === 'number') {
          fecha = new Date(Math.round((fechaRaw - 25569) * 86400 * 1000)).toISOString();
        } else {
          fecha = new Date(fechaRaw).toISOString();
        }
      }

      const totalRaw = row['Total'] || row['total'] || row['TOTAL'] || row['Monto'] || 0;
      const total = parseFloat(totalRaw);

      const nroFactura = row['N° Factura'] || row['nro_factura'] || row['Nro Factura'] || null;
      const estado = row['Estado'] || row['Estado (Pagado/Pend.)'] || 'Pagado';
      const obs = row['Observaciones'] || row['observaciones'] || null;
      
      const clienteNombre = row['Cliente'] || 'Cliente Importado';
      
      // Buscar cliente
      let { data: clientes } = await supabase.from('clientes').select('id').ilike('nombre', `%${clienteNombre}%`).limit(1);
      let cliente_id;
      
      if (!clientes || clientes.length === 0) {
        // Crear cliente
        const { data: newCliente } = await supabase.from('clientes').insert({ nombre: clienteNombre }).select('id').single();
        if (newCliente) cliente_id = newCliente.id;
      } else {
        cliente_id = clientes[0].id;
      }

      if (cliente_id) {
        await supabase.from('ventas').insert({
          fecha,
          cliente_id,
          total,
          nro_factura: nroFactura,
          estado_pago: estado,
          observaciones: obs
        });
        importedCount++;
      }
    }

    revalidatePath('/ventas');
    revalidatePath('/finanzas');
    return { success: true, count: importedCount };
  } catch (err: any) {
    console.error("Import error:", err);
    return { success: false, error: err.message };
  }
}
