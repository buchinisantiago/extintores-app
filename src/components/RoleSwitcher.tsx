'use client';

import { useState, useTransition } from 'react';
import { setRole } from '@/app/actions/role';
import { Shield } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function RoleSwitcher({ initialRole }: { initialRole: 'Gerente' | 'Administrativo' }) {
  const [role, setLocalRole] = useState(initialRole);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleRoleChange = (newRole: 'Gerente' | 'Administrativo') => {
    setLocalRole(newRole);
    startTransition(async () => {
      await setRole(newRole);
      router.refresh();
    });
  };

  return (
    <div className="flex flex-col gap-2 p-4 mt-auto border-t border-white/5">
      <div className="flex items-center gap-2 text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
        <Shield size={14} />
        Simulador de Rol
      </div>
      <div className="flex bg-black/40 rounded-lg p-1">
        <button
          onClick={() => handleRoleChange('Gerente')}
          disabled={isPending}
          className={`flex-1 text-xs py-1.5 px-2 rounded-md transition-all ${
            role === 'Gerente' 
              ? 'bg-red-600 text-white font-medium shadow-md' 
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Gerente
        </button>
        <button
          onClick={() => handleRoleChange('Administrativo')}
          disabled={isPending}
          className={`flex-1 text-xs py-1.5 px-2 rounded-md transition-all ${
            role === 'Administrativo' 
              ? 'bg-red-600 text-white font-medium shadow-md' 
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Admin.
        </button>
      </div>
    </div>
  );
}
