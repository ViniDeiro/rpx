import React from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/layout/Layout';
import { Check, ArrowLeft, Home } from 'react-feather';
import Link from 'next/link';

export default function WithdrawSuccessPage() {
  const router = useRouter();

  return (
    <Layout title="Saque Solicitado">
      <div className="container py-16">
        <div className="max-w-lg mx-auto">
          <div className="bg-card rounded-lg shadow-md overflow-hidden">
            <div className="p-8 flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mb-6">
                <Check className="text-green-500" size={40} />
              </div>
              
              <h1 className="text-2xl font-bold mb-4">Saque Solicitado com Sucesso!</h1>
              
              <p className="text-gray-400 mb-6">
                Sua solicitação de saque foi recebida e está sendo processada. 
                O valor será transferido para sua conta dentro de até 3 dias úteis.
              </p>

              <div className="p-4 bg-yellow-900/20 border border-yellow-500/30 rounded-lg w-full mb-6 text-left">
                <h3 className="font-medium text-yellow-400 mb-2">Informações importantes:</h3>
                <ul className="text-sm text-gray-300 space-y-1">
                  <li>• Você receberá um e-mail quando o saque for processado</li>
                  <li>• O tempo de processamento varia conforme o método escolhido</li>
                  <li>• Em caso de dúvidas, entre em contato com nosso suporte</li>
                </ul>
              </div>

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