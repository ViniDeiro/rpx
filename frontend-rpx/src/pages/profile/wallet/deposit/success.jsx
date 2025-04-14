import React from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/layout/Layout';
import { Check, ArrowLeft, Home } from 'react-feather';
import Link from 'next/link';

export default function DepositSuccessPage() {
  const router = useRouter();

  return (
    <Layout title="Depósito Realizado">
      <div className="container py-16">
        <div className="max-w-lg mx-auto">
          <div className="bg-card rounded-lg shadow-md overflow-hidden">
            <div className="p-8 flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mb-6">
                <Check className="text-green-500" size={40} />
              </div>
              
              <h1 className="text-2xl font-bold mb-4">Depósito Solicitado com Sucesso!</h1>
              
              <p className="text-gray-400 mb-6">
                Sua solicitação de depósito foi recebida e está sendo processada. 
                Em breve você receberá uma confirmação quando o valor for creditado em sua conta.
              </p>

              <div className="w-full flex flex-col sm:flex-row gap-3 mt-4">
                <Link 
                  href="/profile/wallet" 
                  className="flex-1 flex items-center justify-center gap-2 bg-card-hover hover:bg-gray-700 rounded-md py-3 px-6"
                >
                  <ArrowLeft size={18} />
                  <span>Voltar para Carteira</span>
                </Link>
                <Link 
                  href="/profile" 
                  className="flex-1 flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover rounded-md py-3 px-6"
                >
                  <Home size={18} />
                  <span>Ir para Perfil</span>
                </Link>
              </div>
            </div>
          </div>

          <div className="mt-6 text-center text-sm text-gray-500">
            <p>
              Se tiver alguma dúvida, entre em contato com nosso suporte através do
              e-mail <a href="mailto:suporte@rpx.com" className="text-primary hover:underline">suporte@rpx.com</a>
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
} 