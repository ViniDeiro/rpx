'use client';

import Link from 'next/link';
import { ChevronLeft } from 'react-feather';

export default function TermsPage() {
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
            <h1 className="text-3xl md:text-4xl font-bold mb-3">Termos de Uso</h1>
            <p className="text-gray-300">Última atualização: {new Date().toLocaleDateString('pt-BR')}</p>
          </div>

          {/* Conteúdo */}
          <div className="prose prose-lg prose-invert max-w-none">
            <p>
              Bem-vindo à plataforma RPX ("Plataforma"). Estes Termos de Uso ("Termos") regem sua utilização da Plataforma 
              e estabelecem os direitos e obrigações entre você e a RPX. Ao utilizar nossa Plataforma, você concorda expressamente 
              com estes Termos de Uso e nossa Política de Privacidade. Se você não concordar com alguma parte destes Termos, 
              solicitamos que não utilize nossa Plataforma.
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-4 text-purple-400">1. Definições</h2>
            <div className="pl-6">
              <p><strong>"Plataforma"</strong>: Refere-se ao site, aplicativos e todos os serviços oferecidos pela RPX.</p>
              <p><strong>"Usuário"</strong>: Toda pessoa física que se cadastrar na Plataforma e utilizar os serviços oferecidos.</p>
              <p><strong>"Conta"</strong>: Registro único do Usuário na Plataforma, protegido por credenciais de acesso.</p>
              <p><strong>"Conteúdo"</strong>: Todos os textos, imagens, vídeos, áudios e outros materiais disponibilizados na Plataforma.</p>
              <p><strong>"Serviços"</strong>: Todos os produtos, funcionalidades e recursos oferecidos pela Plataforma.</p>
            </div>

            <h2 className="text-2xl font-bold mt-8 mb-4 text-purple-400">2. Elegibilidade</h2>
            <div className="pl-6">
              <p>
                Para utilizar nossos serviços, você declara e garante que:
              </p>
              <ul className="list-disc pl-6 mt-2 mb-4">
                <li>Tem pelo menos 18 anos de idade, conforme exigido pelo Artigo 81 do Estatuto da Criança e do Adolescente (Lei 8.069/90) para atividades relacionadas a jogos;</li>
                <li>Possui capacidade legal para celebrar contratos sob as leis brasileiras;</li>
                <li>Está utilizando a Plataforma em conformidade com estes Termos e todas as leis aplicáveis;</li>
                <li>Não está proibido de participar de atividades de jogos eletrônicos ou apostas por qualquer lei aplicável;</li>
                <li>É responsável pela verificação se o uso da Plataforma é legal em sua jurisdição.</li>
              </ul>
              <p>
                A RPX poderá, a seu exclusivo critério, negar o acesso à Plataforma a qualquer pessoa que não cumpra os requisitos de elegibilidade 
                ou que viole estes Termos.
              </p>
            </div>

            <h2 className="text-2xl font-bold mt-8 mb-4 text-purple-400">3. Cadastro e Conta</h2>
            <div className="pl-6">
              <p>
                Para utilizar nossos serviços, é necessário a criação de uma conta. Durante o cadastro, você concorda em:
              </p>
              <ul className="list-disc pl-6 mt-2 mb-4">
                <li>Fornecer informações verdadeiras, precisas, atuais e completas sobre você;</li>
                <li>Manter e atualizar prontamente seus dados de cadastro para mantê-los verdadeiros, precisos, atuais e completos;</li>
                <li>Ser responsável por manter a confidencialidade de suas credenciais de acesso (nome de usuário e senha);</li>
                <li>Notificar imediatamente a RPX sobre qualquer uso não autorizado de sua conta ou qualquer outra violação de segurança;</li>
                <li>Aceitar total responsabilidade por todas as atividades que ocorram em sua conta.</li>
              </ul>
              <p>
                A RPX se reserva o direito de suspender ou encerrar sua conta, recusar qualquer uso atual ou futuro da Plataforma, 
                e/ou cancelar quaisquer transações em andamento, se houver motivos para acreditar que você forneceu informações falsas, 
                imprecisas ou incompletas, ou que de outra forma violou estes Termos.
              </p>
            </div>

            <h2 className="text-2xl font-bold mt-8 mb-4 text-purple-400">4. Modalidades de Uso</h2>
            <div className="pl-6">
              <p>
                A RPX oferece diferentes formas de interação, incluindo torneios de jogos eletrônicos e apostas em eventos esportivos. 
                Cada modalidade possui regras específicas que complementam estes Termos de Uso. Ao participar dessas atividades, você concorda 
                com as regras aplicáveis a cada modalidade.
              </p>
              <h3 className="text-xl font-semibold mt-4 mb-2">4.1 Apostas</h3>
              <p>
                Em atendimento à Lei 13.756/2018 e à Portaria do Ministério da Fazenda n° 4.595/2021, que regulamentam apostas de quota fixa 
                no território brasileiro, estabelecemos as seguintes condições:
              </p>
              <ul className="list-disc pl-6 mt-2 mb-4">
                <li>As apostas realizadas na Plataforma são de caráter recreativo;</li>
                <li>Você deve ter pelo menos 18 anos completos para realizar apostas;</li>
                <li>Apostas são sempre opcionais e voluntárias;</li>
                <li>Você reconhece que apostas envolvem risco e que é possível perder o valor apostado;</li>
                <li>A RPX se reserva o direito de estabelecer limites máximos e mínimos para apostas;</li>
                <li>Os resultados das apostas são baseados em eventos reais de esportes eletrônicos.</li>
              </ul>
            </div>

            <h2 className="text-2xl font-bold mt-8 mb-4 text-purple-400">5. Pagamentos e Reembolsos</h2>
            <div className="pl-6">
              <p>
                A realização de compras ou apostas na Plataforma está sujeita às seguintes condições:
              </p>
              <ul className="list-disc pl-6 mt-2 mb-4">
                <li>Você concorda em pagar por todos os produtos e serviços adquiridos através da Plataforma;</li>
                <li>Todos os pagamentos devem ser feitos através dos métodos disponibilizados pela RPX;</li>
                <li>A RPX se reserva o direito de alterar os preços de quaisquer serviços ou produtos a qualquer momento;</li>
                <li>Reembolsos podem ser concedidos em casos específicos, de acordo com a Política de Reembolso e em conformidade com o Código de Defesa do Consumidor (Lei 8.078/90);</li>
                <li>Em caso de erro no processamento de pagamento, a RPX se reserva o direito de corrigir o erro mesmo que o pagamento já tenha sido solicitado ou recebido.</li>
              </ul>
            </div>

            <h2 className="text-2xl font-bold mt-8 mb-4 text-purple-400">6. Conduta do Usuário</h2>
            <div className="pl-6">
              <p>
                Ao utilizar a Plataforma, você concorda em não:
              </p>
              <ul className="list-disc pl-6 mt-2 mb-4">
                <li>Violar quaisquer leis, regulamentos ou direitos de terceiros;</li>
                <li>Usar a Plataforma para fins ilegais, fraudulentos ou não autorizados;</li>
                <li>Interferir ou interromper a operação da Plataforma ou servidores ou redes conectadas à Plataforma;</li>
                <li>Tentar acessar áreas da Plataforma que não são públicas;</li>
                <li>Usar robôs, spiders, crawlers ou ferramentas similares para coletar dados da Plataforma;</li>
                <li>Publicar ou transmitir conteúdo que seja ilegal, ofensivo, ameaçador, abusivo, difamatório, que viole a privacidade, ou que seja prejudicial a menores;</li>
                <li>Usar a Plataforma para enviar material publicitário não solicitado;</li>
                <li>Usar a Plataforma para transmitir vírus, worms, cavalos de Tróia ou qualquer outro código, arquivo ou programa malicioso;</li>
                <li>Manipular identificadores para ocultar a origem de qualquer conteúdo transmitido através da Plataforma;</li>
                <li>Fazer-se passar por outra pessoa ou entidade ou representar falsamente sua afiliação com qualquer pessoa ou entidade.</li>
              </ul>
            </div>

            <h2 className="text-2xl font-bold mt-8 mb-4 text-purple-400">7. Propriedade Intelectual</h2>
            <div className="pl-6">
              <p>
                Todo o conteúdo presente na Plataforma, incluindo, mas não se limitando a textos, gráficos, logotipos, ícones, imagens, 
                clipes de áudio, downloads digitais, compilações de dados e software, é propriedade da RPX ou de seus licenciadores e está 
                protegido pelas leis de propriedade intelectual, incluindo a Lei de Direitos Autorais (Lei 9.610/98) e a Lei de Propriedade 
                Industrial (Lei 9.279/96).
              </p>
              <p className="mt-2">
                Você não pode usar, copiar, reproduzir, distribuir, transmitir, difundir, exibir, vender, licenciar ou explorar 
                qualquer conteúdo da Plataforma sem o consentimento prévio por escrito da RPX.
              </p>
            </div>

            <h2 className="text-2xl font-bold mt-8 mb-4 text-purple-400">8. Proteção de Dados</h2>
            <div className="pl-6">
              <p>
                A RPX valoriza a privacidade de seus usuários e está comprometida com a proteção de dados pessoais, em conformidade com a 
                Lei Geral de Proteção de Dados Pessoais (Lei 13.709/2018) e o Marco Civil da Internet (Lei 12.965/2014).
              </p>
              <p className="mt-2">
                Ao utilizar a Plataforma, você concorda com a coleta, uso, armazenamento e tratamento de seus dados pessoais conforme descrito 
                em nossa Política de Privacidade. Você tem o direito de acessar, corrigir e solicitar a exclusão de seus dados pessoais, conforme 
                estabelecido na LGPD.
              </p>
            </div>

            <h2 className="text-2xl font-bold mt-8 mb-4 text-purple-400">9. Limitação de Responsabilidade</h2>
            <div className="pl-6">
              <p>
                Em conformidade com o Código Civil Brasileiro (Lei 10.406/2002) e o Código de Defesa do Consumidor (Lei 8.078/90), estabelecemos que:
              </p>
              <ul className="list-disc pl-6 mt-2 mb-4">
                <li>A RPX não será responsável por quaisquer danos indiretos, incidentais, especiais, punitivos ou consequentes decorrentes do uso ou incapacidade de usar a Plataforma;</li>
                <li>A RPX não garante que a Plataforma será ininterrupta, segura ou livre de erros;</li>
                <li>A RPX não será responsável por conteúdo gerado por usuários;</li>
                <li>A RPX não será responsável por quaisquer perdas financeiras resultantes de apostas ou transações realizadas na Plataforma, desde que estas tenham sido processadas corretamente conforme solicitado pelo usuário;</li>
                <li>Em nenhum caso a responsabilidade total da RPX excederá o valor pago por você à RPX pelos serviços nos três meses anteriores ao evento que deu origem à reivindicação.</li>
              </ul>
            </div>

            <h2 className="text-2xl font-bold mt-8 mb-4 text-purple-400">10. Jogo Responsável</h2>
            <div className="pl-6">
              <p>
                A RPX promove o jogo responsável e adota medidas para prevenir e combater o vício em jogos, em conformidade com as diretrizes do 
                Ministério da Saúde e da Secretaria Nacional de Políticas sobre Drogas.
              </p>
              <ul className="list-disc pl-6 mt-2 mb-4">
                <li>Recomendamos que estabeleça limites de tempo e dinheiro para suas atividades de jogo;</li>
                <li>Disponibilizamos ferramentas para você monitorar e controlar suas atividades de jogo;</li>
                <li>Oferecemos opções de autoexclusão temporária ou permanente;</li>
                <li>Fornecemos informações sobre organizações que oferecem apoio a pessoas com problemas relacionados ao jogo.</li>
              </ul>
              <p>
                Se você acredita que pode estar desenvolvendo um problema com jogos ou apostas, entre em contato com serviços de apoio como o CAPS 
                (Centro de Atenção Psicossocial) ou o CVV (Centro de Valorização da Vida) pelo telefone 188.
              </p>
            </div>

            <h2 className="text-2xl font-bold mt-8 mb-4 text-purple-400">11. Modificações dos Termos</h2>
            <div className="pl-6">
              <p>
                A RPX se reserva o direito de modificar estes Termos a qualquer momento, a seu exclusivo critério. As alterações entrarão em vigor 
                imediatamente após a publicação dos Termos atualizados na Plataforma. O uso continuado da Plataforma após a publicação de quaisquer 
                alterações constitui aceitação dessas alterações.
              </p>
              <p className="mt-2">
                Recomendamos que você revise periodicamente estes Termos para estar ciente de quaisquer alterações. Alterações significativas 
                serão notificadas através de aviso visível na Plataforma.
              </p>
            </div>

            <h2 className="text-2xl font-bold mt-8 mb-4 text-purple-400">12. Rescisão</h2>
            <div className="pl-6">
              <p>
                A RPX pode, a seu exclusivo critério, suspender ou encerrar seu acesso a parte ou à totalidade da Plataforma, a qualquer momento, 
                por qualquer motivo, incluindo, sem limitação, violação destes Termos.
              </p>
              <p className="mt-2">
                Você pode encerrar sua conta a qualquer momento, descontinuando o uso da Plataforma e notificando a RPX. Em caso de rescisão, 
                as disposições destes Termos que, por sua natureza, devem sobreviver à rescisão, sobreviverão, incluindo, sem limitação, 
                as disposições de propriedade, isenções de garantia e limitações de responsabilidade.
              </p>
            </div>

            <h2 className="text-2xl font-bold mt-8 mb-4 text-purple-400">13. Lei Aplicável e Resolução de Disputas</h2>
            <div className="pl-6">
              <p>
                Estes Termos serão regidos e interpretados de acordo com as leis da República Federativa do Brasil, em conformidade com o 
                artigo 9º da Lei de Introdução às Normas do Direito Brasileiro (Decreto-Lei 4.657/42).
              </p>
              <p className="mt-2">
                Qualquer disputa decorrente ou relacionada a estes Termos será resolvida através de arbitragem, de acordo com a Lei de Arbitragem 
                (Lei 9.307/96), ou nos tribunais da comarca em que o usuário tem domicílio, conforme estabelecido pelo Código de Defesa do Consumidor.
              </p>
              <p className="mt-2">
                Antes de iniciar qualquer procedimento legal, buscamos resolver disputas de maneira amigável. Entre em contato com nosso Serviço de 
                Atendimento ao Cliente para tentar resolver qualquer problema.
              </p>
            </div>

            <h2 className="text-2xl font-bold mt-8 mb-4 text-purple-400">14. Contato</h2>
            <div className="pl-6">
              <p>
                Se você tiver alguma dúvida ou preocupação sobre estes Termos ou a Plataforma, entre em contato conosco através dos seguintes canais:
              </p>
              <ul className="list-disc pl-6 mt-2 mb-4">
                <li>E-mail: suporte@rpx-platform.com</li>
                <li>Telefone: (XX) XXXX-XXXX</li>
                <li>Formulário de contato: disponível na seção "Contato" da Plataforma</li>
                <li>Endereço: [Endereço Físico da Empresa]</li>
              </ul>
            </div>

            <div className="mt-10 pt-6 border-t border-gray-700">
              <p className="text-sm text-gray-400">
                Ao utilizar nossos serviços, você confirma que leu, entendeu e concorda com estes Termos de Uso. Se você não concorda com 
                qualquer parte destes Termos, por favor, não utilize nossa Plataforma.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 