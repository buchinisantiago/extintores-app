import { supabase } from '@/lib/supabase';
import StockTerminadoClient from './StockTerminadoClient';

export const revalidate = 0;

export default async function StockTerminadoPage() {
  // Obtenemos todos los SKUs y cruzamos con el stock actual
  const { data: skus, error: skusError } = await supabase.from('skus').select('*').order('nombre');
  const { data: stock, error: stockError } = await supabase.from('stock_terminado').select('*');

  // Mapeamos para que cada SKU tenga su cantidad (0 si no existe en stock_terminado aún)
  const stockMap = new Map(stock?.map(s => [s.sku_id, s]) || []);

  const data = skus?.map(sku => ({
    sku,
    stock: stockMap.get(sku.id) || { cantidad: 0, ultima_actualizacion: null }
  })) || [];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Producto Terminado</h1>
        <p className="text-gray-400">Control de stock de extintores recargados listos para entregar.</p>
      </div>
      
      <StockTerminadoClient initialData={data} />
    </div>
  );
}
