'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Package, 
  Users, 
  ShoppingCart, 
  Settings,
  Flame
} from 'lucide-react';

const navItems = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Stock M.P.', href: '/stock/mp', icon: Package },
  { name: 'Stock Terminado', href: '/stock/terminado', icon: Flame },
  { name: 'Clientes', href: '/clientes', icon: Users },
  { name: 'Ventas', href: '/ventas', icon: ShoppingCart },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 h-screen fixed left-0 top-0 border-r border-white/5 glass flex flex-col">
      <div className="p-6 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center border border-orange-500/50 text-orange-500">
          <Flame size={24} />
        </div>
        <h1 className="font-bold text-xl tracking-tight">FireControl</h1>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
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

      <div className="p-4">
        <button className="flex w-full items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:text-gray-100 hover:bg-white/5 transition-colors">
          <Settings size={20} className="text-gray-500" />
          Ajustes
        </button>
      </div>
    </aside>
  );
}
