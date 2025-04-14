import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/layout/Layout';
import { CheckCircle, ArrowRight } from 'react-feather';
import Link from 'next/link';

export default function WithdrawSuccessPage() {
  const router = useRouter();
  
  // Redirecionar para o perfil após 5 segundos
  useEffect(() => {
    const timeout = setTimeout(() => {
      router.push('/profile');
    }, 5000);
    
    return () => clearTimeout(timeout);
  }, [router]);
  
  return (
    <Layout title="Saque Solicitado">
      <div className="container py-16">
        <div className="max-w-md mx-auto bg-card rounded-lg shadow-md overflow-hidden">
          <div className="p-6 text-center">
            <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
              <CheckCircle size={48} className="text-green-500" />
            </div>
            
            <h1 className="text-2xl font-bold mb-4">Saque Solicitado com Sucesso!</h1>
            
            <p className="text-muted mb-6">
              Sua solicitação de saque foi registrada com sucesso. O processamento será concluído em até 48 horas úteis.
              Você receberá uma notificação quando o valor for transferido.
            </p>
            
            <div className="bg-card-hover rounded-md p-4 mb-6 text-left">
              <div className="text-sm">
                <div className="mb-2">
                  <span className="text-muted">Protocolo:</span>
                  <span className="ml-2 font-mono">{Math.random().toString(36).substring(2, 10).toUpperCase()}</span>
                </div>
                <div>
                  <span className="text-muted">Status:</span>
                  <span className="ml-2 text-yellow-500">Em processamento</span>
                </div>
              </div>
            </div>
            
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