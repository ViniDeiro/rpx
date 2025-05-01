'use client';

import './globals.css';
import { Inter } from 'next/font/google';
import { usePathname } from 'next/navigation';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '@/contexts/AuthContext';
import { Layout } from '@/components/layout/layout';
import { ThemeProvider } from '@/components/providers/theme-provider';
import SessionProvider from '@/components/providers/SessionProvider';
import { useAuth } from '@/contexts/AuthContext';
import dynamic from 'next/dynamic';

const inter = Inter({ subsets: ['latin'] });

// Carregar o Layout dinamicamente para melhorar a performance inicial
const DynamicLayout = dynamic(() => import('@/components/layout/layout').then(mod => mod.Layout), {
  ssr: false,
  loading: () => <div className="min-h-screen bg-background" />
});

function MainLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  
  return <DynamicLayout>{children}</DynamicLayout>;
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const isAdminPage = pathname?.startsWith('/admin');

  return (
    <html lang="pt-BR">
      <head>
        <link rel="icon" href="/images/favicon.svg" type="image/svg+xml" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#6930c3" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className={`${inter.className} min-h-screen overflow-x-hidden bg-background`}>
        <SessionProvider>
          <ThemeProvider>
            <AuthProvider>
              {isAdminPage ? children : <MainLayout>{children}</MainLayout>}
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
            </AuthProvider>
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
