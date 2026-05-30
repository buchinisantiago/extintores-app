import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Sidebar from '@/components/Sidebar';
import { cookies } from 'next/headers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'FireControl - Gestión de Extintores',
  description: 'Panel interno para gestión de stock y clientes',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const role = (cookieStore.get('user_role')?.value as 'Gerente' | 'Administrativo') || 'Gerente';

  return (
    <html lang="es">
      <body className={`${inter.className} min-h-screen bg-slate-950 text-slate-50 flex`}>
        <Sidebar initialRole={role} />
        <main className="flex-1 ml-64 p-8">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}
