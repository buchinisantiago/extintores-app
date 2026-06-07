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
  LogOut
} from 'lucide-react';
import { logout } from '@/app/login/actions';

export default function Sidebar({ initialRole, email }: { initialRole: string, email: string }) {
  const pathname = usePathname();

  const navItems = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Vencimientos', href: '/vencimientos', icon: Clock },
    { name: 'Stock M.P.', href: '/stock/mp', icon: Package },
    { name: 'Stock Terminado', href: '/stock/terminado', icon: Flame },
    { name: 'Clientes', href: '/clientes', icon: Users },
    { name: 'Ventas', href: '/ventas', icon: ShoppingCart },
    { name: 'Catálogo / Precios', href: '/catalogo', icon: Flame, restricted: true },
    { name: 'Vendedores', href: '/vendedores', icon: Users, restricted: true },
    { name: 'Gastos', href: '/gastos', icon: Banknote, restricted: true },
    { name: 'Finanzas', href: '/finanzas', icon: LineChart, restricted: true }
  ];

  return (
    <aside className="w-64 h-screen fixed left-0 top-0 border-r border-white/5 glass flex flex-col">
      <div className="p-6 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center border border-orange-500/50 text-orange-500">
          <Flame size={24} />
        </div>
        <h1 className="font-bold text-xl tracking-tight">FireControl</h1>
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
                  ? 'bg-orange-500/10 text-orange-500 font-medium' 
                  : 'text-gray-400 hover:text-gray-100 hover:bg-white/5'
                }`}
            >
              <item.icon size={20} className={isActive ? 'text-orange-500' : 'text-gray-500 group-hover:text-gray-300'} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/5">
        <div className="flex flex-col gap-2 mb-4 px-4 py-2 bg-slate-900/50 rounded-xl border border-white/5">
          <span className="text-xs text-gray-400">Logueado como</span>
          <span className="text-sm font-medium text-white truncate" title={email}>{email}</span>
          <span className="text-xs text-orange-400 font-bold uppercase tracking-wider">{initialRole}</span>
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
  );
}
