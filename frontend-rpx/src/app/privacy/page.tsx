'use client';

import Link from 'next/link';
import { ChevronLeft } from 'react-feather';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-indigo-950 text-white pb-16">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Cabeçalho */}
          <div className="mb-8">
            <Link href="/" className="inline-flex items-center text-purple-400 hover:text-purple-300 mb-6">
              <ChevronLeft size={20} className="mr-1" />
              Voltar para a página inicial
            </Link>
            <h1 className="text-3xl md:text-4xl font-bold mb-3">Política de Privacidade</h1>
            <p className="text-gray-300">Última atualização: {new Date().toLocaleDateString('pt-BR')}</p>
          </div>

          {/* Conteúdo */}
          <div className="prose prose-lg prose-invert max-w-none">
            <p>
              A RPX valoriza sua privacidade e está comprometida em proteger seus dados pessoais. Esta Política de Privacidade 
              descreve como coletamos, usamos, compartilhamos e protegemos suas informações quando você utiliza nossa plataforma, 
              em conformidade com a Lei Geral de Proteção de Dados Pessoais (Lei nº 13.709/2018) e o Marco Civil da Internet 
              (Lei nº 12.965/2014).
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-4 text-purple-400">1. Informações que Coletamos</h2>
            <div className="pl-6">
              <h3 className="text-xl font-semibold mt-4 mb-2">1.1. Informações fornecidas por você</h3>
              <p>
                Coletamos as informações que você nos fornece diretamente quando:
              </p>
              <ul className="list-disc pl-6 mt-2 mb-4">
                <li>Cria uma conta em nossa plataforma (nome completo, e-mail, telefone, data de nascimento);</li>
                <li>Completa seu perfil (nome de usuário, foto de perfil);</li>
                <li>Utiliza nossos serviços de apostas ou participa de torneios;</li>
                <li>Faz depósitos ou saques em sua conta;</li>
                <li>Entra em contato com nosso suporte ao cliente;</li>
                <li>Responde a pesquisas ou participa de promoções.</li>
              </ul>

              <h3 className="text-xl font-semibold mt-4 mb-2">1.2. Informações coletadas automaticamente</h3>
              <p>
                Quando você utiliza nossa plataforma, coletamos automaticamente:
              </p>
              <ul className="list-disc pl-6 mt-2 mb-4">
                <li>Informações sobre seu dispositivo (modelo, sistema operacional, identificadores únicos);</li>
                <li>Endereço IP e dados de localização aproximada;</li>
                <li>Informações de navegação e comportamento na plataforma;</li>
                <li>Histórico de apostas e transações;</li>
                <li>Registros de acesso, conforme exigido pelo Marco Civil da Internet (Art. 15).</li>
              </ul>
            </div>

            <h2 className="text-2xl font-bold mt-8 mb-4 text-purple-400">2. Base Legal para Processamento</h2>
            <div className="pl-6">
              <p>
                Processamos seus dados pessoais com base nas seguintes bases legais previstas na LGPD (Art. 7º):
              </p>
              <ul className="list-disc pl-6 mt-2 mb-4">
                <li><strong>Execução de contrato:</strong> Para fornecer os serviços solicitados por você;</li>
                <li><strong>Consentimento:</strong> Quando você nos autoriza expressamente a processar seus dados para finalidades específicas;</li>
                <li><strong>Interesse legítimo:</strong> Para melhorar nossos serviços, garantir a segurança da plataforma e prevenir fraudes;</li>
                <li><strong>Cumprimento de obrigação legal:</strong> Para atender requisitos legais e regulatórios aplicáveis.</li>
              </ul>
            </div>

            <h2 className="text-2xl font-bold mt-8 mb-4 text-purple-400">3. Finalidades do Processamento</h2>
            <div className="pl-6">
              <p>
                Utilizamos suas informações para:
              </p>
              <ul className="list-disc pl-6 mt-2 mb-4">
                <li>Criar e gerenciar sua conta;</li>
                <li>Fornecer os serviços solicitados, incluindo processamento de apostas e participação em torneios;</li>
                <li>Processar depósitos, apostas e saques;</li>
                <li>Verificar sua identidade e prevenir fraudes;</li>
                <li>Cumprir com obrigações legais, incluindo requisitos de verificação de idade e prevenção à lavagem de dinheiro;</li>
                <li>Personalizar sua experiência e oferecer conteúdo e promoções relevantes;</li>
                <li>Comunicar-se com você sobre atualizações, promoções e eventos;</li>
                <li>Melhorar nossos serviços e desenvolver novos recursos;</li>
                <li>Resolver disputas e solucionar problemas.</li>
              </ul>
            </div>

            <h2 className="text-2xl font-bold mt-8 mb-4 text-purple-400">4. Compartilhamento de Informações</h2>
            <div className="pl-6">
              <p>
                Podemos compartilhar suas informações com:
              </p>
              <ul className="list-disc pl-6 mt-2 mb-4">
                <li><strong>Prestadores de serviços:</strong> Empresas que nos auxiliam com processamento de pagamentos, verificação de identidade, hospedagem de dados, suporte ao cliente e análise de dados;</li>
                <li><strong>Parceiros comerciais:</strong> Organizadores de torneios e eventos com os quais colaboramos;</li>
                <li><strong>Autoridades reguladoras:</strong> Quando exigido por lei, regulamento ou processo legal;</li>
                <li><strong>Entidades de proteção ao crédito:</strong> Em caso de pagamentos não realizados ou fraudes detectadas;</li>
                <li><strong>Terceiros em caso de reorganização empresarial:</strong> Em caso de fusão, aquisição ou venda de ativos.</li>
              </ul>
              <p>
                Todo compartilhamento é realizado de acordo com a LGPD e com as medidas de segurança adequadas para proteger seus dados pessoais.
              </p>
            </div>

            <h2 className="text-2xl font-bold mt-8 mb-4 text-purple-400">5. Transferências Internacionais</h2>
            <div className="pl-6">
              <p>
                Seus dados pessoais podem ser transferidos para servidores localizados fora do Brasil, incluindo países que possam 
                não ter leis de proteção de dados equivalentes. Nestes casos, garantimos que a transferência seja realizada de acordo 
                com os requisitos da LGPD (Art. 33), adotando medidas como:
              </p>
              <ul className="list-disc pl-6 mt-2 mb-4">
                <li>Transferência para países com nível adequado de proteção;</li>
                <li>Utilização de cláusulas contratuais padrão;</li>
                <li>Obtenção de consentimento específico quando necessário.</li>
              </ul>
            </div>

            <h2 className="text-2xl font-bold mt-8 mb-4 text-purple-400">6. Segurança de Dados</h2>
            <div className="pl-6">
              <p>
                Implementamos medidas técnicas e organizacionais adequadas para proteger seus dados pessoais contra acesso não autorizado, 
                perda acidental ou modificação, conforme exigido pela LGPD (Art. 46). Estas medidas incluem:
              </p>
              <ul className="list-disc pl-6 mt-2 mb-4">
                <li>Criptografia de dados sensíveis;</li>
                <li>Controles de acesso rigorosos;</li>
                <li>Monitoramento contínuo para detecção de ameaças;</li>
                <li>Treinamento regular de nossa equipe em práticas de segurança;</li>
                <li>Avaliações periódicas de vulnerabilidades.</li>
              </ul>
              <p>
                Apesar de nossos esforços, nenhum sistema é completamente seguro. Em caso de violação de dados que possa afetar 
                seus direitos, notificaremos você e a Autoridade Nacional de Proteção de Dados (ANPD), conforme exigido pela 
                LGPD (Art. 48).
              </p>
            </div>

            <h2 className="text-2xl font-bold mt-8 mb-4 text-purple-400">7. Retenção de Dados</h2>
            <div className="pl-6">
              <p>
                Mantemos seus dados pessoais apenas pelo tempo necessário para cumprir as finalidades para as quais foram coletados, 
                incluindo obrigações legais, contábeis ou de relatórios.
              </p>
              <p className="mt-2">
                Os registros de acesso à plataforma são mantidos por pelo menos 6 meses, conforme exigido pelo Marco Civil da Internet (Art. 15). 
                Informações sobre transações financeiras são mantidas por pelo menos 5 anos, conforme exigido pela legislação fiscal e de 
                prevenção à lavagem de dinheiro.
              </p>
              <p className="mt-2">
                Quando seus dados não forem mais necessários, eles serão excluídos ou anonimizados de forma segura.
              </p>
            </div>

            <h2 className="text-2xl font-bold mt-8 mb-4 text-purple-400">8. Seus Direitos</h2>
            <div className="pl-6">
              <p>
                De acordo com a LGPD (Art. 18), você tem os seguintes direitos:
              </p>
              <ul className="list-disc pl-6 mt-2 mb-4">
                <li><strong>Confirmação e acesso:</strong> Saber se processamos seus dados e acessar os dados que temos sobre você;</li>
                <li><strong>Correção:</strong> Solicitar a correção de dados incompletos, inexatos ou desatualizados;</li>
                <li><strong>Anonimização, bloqueio ou eliminação:</strong> De dados desnecessários, excessivos ou tratados em desconformidade com a LGPD;</li>
                <li><strong>Portabilidade:</strong> Receber seus dados em formato legível para transferência a outro serviço;</li>
                <li><strong>Eliminação:</strong> Solicitar a exclusão de dados tratados com base no consentimento;</li>
                <li><strong>Informação:</strong> Ser informado sobre com quem compartilhamos seus dados;</li>
                <li><strong>Revogação do consentimento:</strong> Retirar seu consentimento a qualquer momento;</li>
                <li><strong>Oposição:</strong> Opor-se ao tratamento realizado com base em interesses legítimos.</li>
              </ul>
              <p>
                Para exercer seus direitos, entre em contato conosco pelos canais indicados na seção "Contato" desta política. 
                Responderemos à sua solicitação dentro do prazo previsto na LGPD.
              </p>
            </div>

            <h2 className="text-2xl font-bold mt-8 mb-4 text-purple-400">9. Cookies e Tecnologias Semelhantes</h2>
            <div className="pl-6">
              <p>
                Utilizamos cookies e tecnologias semelhantes para melhorar sua experiência, entender como você utiliza nossos serviços 
                e personalizar nosso conteúdo.
              </p>
              <p className="mt-2">
                Os cookies que utilizamos incluem:
              </p>
              <ul className="list-disc pl-6 mt-2 mb-4">
                <li><strong>Cookies essenciais:</strong> Necessários para o funcionamento da plataforma;</li>
                <li><strong>Cookies analíticos:</strong> Para analisar como você utiliza a plataforma e melhorar nossos serviços;</li>
                <li><strong>Cookies de funcionalidade:</strong> Para lembrar suas preferências e personalizar sua experiência;</li>
                <li><strong>Cookies de publicidade:</strong> Para apresentar anúncios relevantes com base em seus interesses.</li>
              </ul>
              <p className="mt-2">
                Você pode configurar seu navegador para recusar todos ou alguns cookies, ou para alertá-lo quando sites definem ou 
                acessam cookies. No entanto, desativar cookies pode afetar a funcionalidade da plataforma.
              </p>
            </div>

            <h2 className="text-2xl font-bold mt-8 mb-4 text-purple-400">10. Privacidade de Crianças e Adolescentes</h2>
            <div className="pl-6">
              <p>
                Nossa plataforma não é destinada a menores de 18 anos, conforme estabelecido no Estatuto da Criança e do 
                Adolescente (Lei 8.069/90) e regulamentações específicas para atividades de apostas.
              </p>
              <p className="mt-2">
                Não coletamos intencionalmente dados pessoais de menores de 18 anos. Se tomarmos conhecimento de que coletamos 
                dados pessoais de uma pessoa menor de 18 anos, tomaremos medidas para excluir essas informações de nossos servidores.
              </p>
            </div>

            <h2 className="text-2xl font-bold mt-8 mb-4 text-purple-400">11. Alterações nesta Política</h2>
            <div className="pl-6">
              <p>
                Podemos atualizar esta Política de Privacidade periodicamente para refletir alterações em nossas práticas ou 
                por outros motivos operacionais, legais ou regulatórios.
              </p>
              <p className="mt-2">
                Quando fizermos alterações significativas, notificaremos você através de aviso visível em nossa plataforma ou por e-mail, 
                e atualizaremos a data de "Última atualização" no topo desta política.
              </p>
              <p className="mt-2">
                Recomendamos que revise esta política periodicamente para se manter informado sobre como estamos protegendo suas informações.
              </p>
            </div>

            <h2 className="text-2xl font-bold mt-8 mb-4 text-purple-400">12. Resolução de Conflitos</h2>
            <div className="pl-6">
              <p>
                Se você tiver uma reclamação sobre como processamos seus dados pessoais, entre em contato conosco primeiro para 
                tentarmos resolver sua preocupação de maneira amigável.
              </p>
              <p className="mt-2">
                Você também tem o direito de apresentar uma reclamação à Autoridade Nacional de Proteção de Dados (ANPD) ou a 
                organismos de defesa do consumidor, como o Procon.
              </p>
            </div>

            <h2 className="text-2xl font-bold mt-8 mb-4 text-purple-400">13. Contato</h2>
            <div className="pl-6">
              <p>
                Se você tiver dúvidas, preocupações ou solicitações relacionadas a esta Política de Privacidade ou ao processamento 
                de seus dados pessoais, entre em contato com nosso Encarregado de Proteção de Dados (DPO) através dos seguintes canais:
              </p>
              <ul className="list-disc pl-6 mt-2 mb-4">
                <li>E-mail: privacidade@rpx-platform.com</li>
                <li>Formulário de contato: disponível na seção "Privacidade" da plataforma</li>
                <li>Endereço: [Endereço Físico da Empresa]</li>
              </ul>
              <p>
                Responderemos às suas solicitações dentro do prazo estabelecido pela LGPD.
              </p>
            </div>

            <div className="mt-10 pt-6 border-t border-gray-700">
              <p className="text-sm text-gray-400">
                Ao utilizar nossa plataforma, você reconhece que leu e compreendeu esta Política de Privacidade e concorda com a coleta, 
                uso, armazenamento e divulgação de seus dados pessoais de acordo com esta política e a legislação aplicável.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 