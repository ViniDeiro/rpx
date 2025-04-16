'use client';

import './globals.css';
import { Inter } from 'next/font/google';
import { usePathname } from 'next/navigation';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '@/contexts/AuthContext';
import { Layout } from '@/components/layout/layout';
import NotificationHandler from '@/components/notifications/NotificationHandler';
import ThemeProvider from '@/components/providers/ThemeProvider';
import SessionProvider from '@/components/providers/SessionProvider';
import NotificationBell from '@/components/notifications/NotificationBell';

const inter = Inter({ subsets: ['latin'] });

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
      </head>
      <body className={`${inter.className} min-h-screen overflow-x-hidden bg-background`}>
        <SessionProvider>
          <ThemeProvider>
            <AuthProvider>
              {isAdminPage ? (
                children
              ) : (
                <>
                  <Layout>{children}</Layout>
                  <NotificationHandler />
                  <NotificationBell />
                </>
              )}
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
