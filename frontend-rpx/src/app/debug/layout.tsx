'use client';

import { SessionProvider } from 'next-auth/react';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Toaster } from 'react-hot-toast';

export default function DebugLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="bg-slate-900 min-h-screen text-white">
      <div className="max-w-[1200px] mx-auto p-4">
        <div className="mb-6 p-4 bg-slate-800 rounded-lg shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold">Área de Depuração</h1>
            <div className="text-xs py-1 px-2 bg-yellow-500 text-black rounded">MODO DESENVOLVIMENTO</div>
          </div>
          <p className="text-slate-300">
            Esta área é usada para depurar e testar funcionalidades do sistema. 
            Não utilize em ambiente de produção.
          </p>
        </div>
        
        <SessionProvider>
          <ThemeProvider>
            <div className="bg-slate-800 rounded-lg shadow-lg p-4">
              {children}
            </div>
            <Toaster />
            <ToastContainer 
              position="bottom-right"
              autoClose={5000}
              hideProgressBar={false}
              newestOnTop={false}
              closeOnClick
              rtl={false}
              pauseOnFocusLoss
              draggable
              pauseOnHover
              theme="dark"
            />
          </ThemeProvider>
        </SessionProvider>
      </div>
    </div>
  );
} 