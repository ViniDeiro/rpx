import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Loja - RPX',
  description: 'Confira os produtos disponíveis na loja RPX',
};

export default function LojaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div>
      {children}
    </div>
  );
} 