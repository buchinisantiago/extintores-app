import { Flame } from 'lucide-react';
import { login } from './actions';

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-orange-500/20 flex items-center justify-center border border-orange-500/50 text-orange-500 mb-4 shadow-lg shadow-orange-500/20">
            <Flame size={32} />
          </div>
          <h1 className="text-3xl font-black tracking-tight text-white">FireControl</h1>
          <p className="text-gray-400 mt-2 text-center">Inicia sesión en el panel de gestión</p>
        </div>

        <div className="glass p-8 rounded-2xl border-t-4 border-t-orange-500 shadow-2xl">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium text-center">
              Correo o contraseña incorrectos. Por favor, intenta nuevamente.
            </div>
          )}

          <form action={login} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Correo Electrónico</label>
              <input 
                name="email" 
                type="email" 
                required 
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-all"
                placeholder="usuario@empresa.com"
                defaultValue="gerencia@tuempresa.com"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Contraseña</label>
              <input 
                name="password" 
                type="password" 
                required 
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-all"
                placeholder="••••••••"
              />
            </div>

            <button 
              type="submit" 
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-4 rounded-xl transition-colors shadow-lg shadow-orange-500/25 mt-2"
            >
              Ingresar al Sistema
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
