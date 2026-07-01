'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Package, 
  Users, 
  ShoppingCart, 
  Settings,
  Flame,
  Banknote,
  LineChart,
  Clock,
  LogOut,
  FileText,
  Menu,
  X
} from 'lucide-react';
import { logout } from '@/app/login/actions';
import { useState } from 'react';

export default function Sidebar({ initialRole, email }: { initialRole: string, email: string }) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Vencimientos', href: '/vencimientos', icon: Clock },
    { name: 'Stock M.P.', href: '/stock/mp', icon: Package },
    { name: 'Stock Terminado', href: '/stock/terminado', icon: Flame },
    { name: 'Ingresos / Reposición', href: '/reposiciones', icon: Package },
    { name: 'Clientes', href: '/clientes', icon: Users },
    { name: 'Ventas', href: '/ventas', icon: ShoppingCart },
    { name: 'Presupuestos', href: '/presupuestos', icon: FileText },
    { name: 'Catálogo / Precios', href: '/catalogo', icon: Flame, restricted: true },
    { name: 'Vendedores', href: '/vendedores', icon: Users, restricted: true },
    { name: 'Gastos', href: '/gastos', icon: Banknote, restricted: true },
    { name: 'Finanzas', href: '/finanzas', icon: LineChart, restricted: true }
  ];

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="md:hidden fixed top-0 left-0 w-full h-16 glass z-40 flex items-center justify-between px-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <img src="/logo2.jpeg" alt="Logo" className="h-10 w-10 object-contain rounded-lg bg-white p-1" />
          <span className="font-bold text-white text-lg">Menendez Seg. Ind.</span>
        </div>
        <button 
          onClick={() => setIsOpen(true)}
          className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
        >
          <Menu size={24} />
        </button>
      </div>

      {/* Overlay */}
      {isOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`w-64 h-[100dvh] fixed left-0 top-0 border-r border-white/5 glass flex flex-col z-50 transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
        <div className="p-4 md:p-6 flex flex-col items-center justify-center border-b border-white/5 relative">
          <button 
            className="md:hidden absolute top-4 right-4 p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg"
            onClick={() => setIsOpen(false)}
          >
            <X size={20} />
          </button>
          <div className="w-full bg-white rounded-xl p-3 mb-2 shadow-lg shadow-red-900/20 mt-6 md:mt-0">
            <img src="/logo2.jpeg" alt="Menendez Seguridad Industrial" className="w-full h-auto object-contain" />
          </div>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          const isDisabled = item.restricted && initialRole !== 'Gerente';

          if (isDisabled) {
            return (
              <div
                key={item.name}
                className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl text-gray-600 bg-white/5 cursor-not-allowed opacity-50"
                title="Acceso exclusivo para Gerencia"
              >
                <div className="flex items-center gap-3">
                  <item.icon size={20} className="text-gray-600" />
                  {item.name}
                </div>
              </div>
            );
          }

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group
                ${isActive 
                  ? 'bg-red-600/10 text-red-600 font-medium' 
                  : 'text-gray-400 hover:text-gray-100 hover:bg-white/5'
                }`}
            >
              <item.icon size={20} className={isActive ? 'text-red-600' : 'text-gray-500 group-hover:text-gray-300'} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/5">
        <div className="flex flex-col gap-2 mb-4 px-4 py-2 bg-slate-900/50 rounded-xl border border-white/5">
          <span className="text-xs text-gray-400">Logueado como</span>
          <span className="text-sm font-medium text-white truncate" title={email}>{email}</span>
          <span className="text-xs text-red-400 font-bold uppercase tracking-wider">{initialRole}</span>
        </div>
        
        <form action={logout}>
          <button type="submit" className="flex w-full items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors">
            <LogOut size={20} />
            Cerrar Sesión
          </button>
        </form>

        {initialRole === 'Gerente' && (
          <Link href="/ajustes" className="flex w-full items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:text-gray-100 hover:bg-white/5 transition-colors mt-2">
            <Settings size={20} className="text-gray-500" />
            Ajustes
          </Link>
        )}
      </div>
    </aside>
    </>
  );
}
