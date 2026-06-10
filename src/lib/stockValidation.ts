import { supabase } from '@/lib/supabase';

export async function validateStockForSale(items: {sku_id: string, cantidad: number}[]) {
  const { data: mps } = await supabase.from('stock_mp').select('id, material, cantidad, unidad');
  const { data: recetas } = await supabase.from('sku_recetas').select('*');
  const { data: stock_term } = await supabase.from('stock_terminado').select('sku_id, cantidad');
  const { data: skus } = await supabase.from('skus').select('id, es_servicio, nombre');
  
  if (!mps || !recetas || !stock_term || !skus) return null; // If DB fails, don't block aggressively

  const mpConsumption: Record<string, number> = {};
  
  for (const item of items) {
    const sku = skus.find(s => s.id === item.sku_id);
    if (sku && !sku.es_servicio) {
      const st = stock_term.find(s => s.sku_id === item.sku_id);
      if (st && st.cantidad - item.cantidad < 0) {
        return `Stock insuficiente de "${sku.nombre}". Intentas vender ${item.cantidad} pero solo hay ${st.cantidad} unidades.`;
      }
    }

    const skuRecetas = recetas.filter(r => r.sku_id === item.sku_id);
    for (const rec of skuRecetas) {
      if (!mpConsumption[rec.mp_id]) mpConsumption[rec.mp_id] = 0;
      mpConsumption[rec.mp_id] += rec.cantidad_necesaria * item.cantidad;
    }
  }
  
  for (const mp_id of Object.keys(mpConsumption)) {
    const mp = mps.find(m => m.id === mp_id);
    if (mp) {
      if (mp.cantidad - mpConsumption[mp_id] < 0) {
        return `Stock insuficiente de ${mp.material}. La venta consume ${mpConsumption[mp_id]} ${mp.unidad} pero el stock actual es de solo ${mp.cantidad} ${mp.unidad}.`;
      }
    }
  }

  return null; // Validation passed
}
