import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/layout/Layout';
import { CheckCircle, ArrowRight } from 'react-feather';
import Link from 'next/link';

export default function DepositSuccessPage() {
  const router = useRouter();
  
  // Redirecionar para o perfil após 5 segundos
  useEffect(() => {
    const timeout = setTimeout(() => {
      router.push('/profile');
    }, 5000);
    
    return () => clearTimeout(timeout);
  }, [router]);
  
  return (
    <Layout title="Depósito Realizado">
      <div className="container py-16">
        <div className="max-w-md mx-auto bg-card rounded-lg shadow-md overflow-hidden">
          <div className="p-6 text-center">
            <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
              <CheckCircle size={48} className="text-green-500" />
            </div>
            
            <h1 className="text-2xl font-bold mb-4">Depósito Realizado!</h1>
            
            <p className="text-muted mb-6">
              Seu depósito foi processado com sucesso. O valor já está disponível em sua conta.
              Você será redirecionado para o seu perfil automaticamente em 5 segundos.
            </p>
            
            <Link href="/profile" className="btn-primary flex items-center justify-center gap-2 mx-auto w-full">
              <span>Voltar ao Perfil</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
} 