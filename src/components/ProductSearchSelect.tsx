'use client';

import { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown } from 'lucide-react';

export default function ProductSearchSelect({ 
  stock, 
  onSelect, 
  placeholder = "+ Buscar producto a cotizar/vender..."
}: { 
  stock: any[], 
  onSelect: (sku_id: string) => void,
  placeholder?: string
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered = stock.filter(s => s.skus.nombre.toLowerCase().includes(search.toLowerCase()));

  return (
    <div ref={wrapperRef} className="relative mb-6">
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 flex items-center justify-between cursor-pointer hover:border-red-600 transition-colors"
      >
        <span className="text-gray-300">{placeholder}</span>
        <ChevronDown size={18} className="text-gray-500" />
      </div>

      {isOpen && (
        <div className="absolute z-50 top-full left-0 right-0 mt-2 bg-slate-900 border border-slate-700 rounded-lg shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2">
          <div className="p-2 border-b border-slate-700 relative">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
            <input 
              autoFocus
              type="text" 
              placeholder="Escribe para filtrar..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-800 rounded px-4 pl-9 py-2 text-sm outline-none focus:border-red-600 border border-transparent"
            />
          </div>
          <div className="max-h-60 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="p-4 text-center text-sm text-gray-500">No se encontraron productos.</div>
            ) : (
              filtered.map(s => (
                <div 
                  key={s.skus.id}
                  onClick={() => {
                    onSelect(s.skus.id);
                    setIsOpen(false);
                    setSearch('');
                  }}
                  className="px-4 py-3 hover:bg-red-600/20 cursor-pointer border-b border-slate-800 last:border-0 transition-colors flex justify-between items-center"
                >
                  <span className="font-medium text-sm">{s.skus.nombre}</span>
                  <div className="text-right text-xs">
                    {s.cantidad !== 9999 && <span className="text-gray-400 mr-3">Disp: {s.cantidad}</span>}
                    <span className="font-bold text-red-400">${s.skus.precio_recarga}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
