'use client';

import './globals.css';
import { Inter } from 'next/font/google';
import { Layout } from '@/components/layout/layout';
import { AuthProvider } from '@/contexts/AuthContext';
import { usePathname } from 'next/navigation';

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
        <AuthProvider>
          {isAdminPage ? (
            children
          ) : (
            <Layout>{children}</Layout>
          )}
        </AuthProvider>
      </body>
    </html>
  );
}
