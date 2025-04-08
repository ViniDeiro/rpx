import Head from 'next/head';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-rpx-dark text-rpx-light">
      <Head>
        <title>RPX - Plataforma de Competições e Apostas de Free Fire</title>
        <meta name="description" content="RPX - A melhor plataforma para competições e apostas de Free Fire" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <header className="bg-rpx-blue p-4">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold font-heading">RPX</h1>
          <nav>
            <ul className="flex space-x-4">
              <li><Link href="/torneios" className="hover:text-rpx-orange">Torneios</Link></li>
              <li><Link href="/rankings" className="hover:text-rpx-orange">Rankings</Link></li>
              <li><Link href="/apostas" className="hover:text-rpx-orange">Apostas</Link></li>
              <li><Link href="/loja" className="hover:text-rpx-orange">Loja</Link></li>
            </ul>
          </nav>
          <div className="flex space-x-2">
            <Link href="/login" className="px-4 py-2 border border-rpx-orange text-rpx-orange rounded hover:bg-rpx-orange hover:text-white">
              Login
            </Link>
            <Link href="/cadastro" className="px-4 py-2 bg-rpx-orange text-white rounded hover:bg-orange-700">
              Cadastre-se
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="py-20 bg-gradient-to-b from-rpx-blue to-rpx-dark">
          <div className="container mx-auto text-center">
            <h2 className="text-5xl font-bold mb-4 font-heading">Seja Bem-vindo à RPX</h2>
            <p className="text-xl mb-8 max-w-2xl mx-auto">
              A maior plataforma de competições e apostas de Free Fire do Brasil.
              Participe de torneios, aposte em jogadores profissionais e ganhe prêmios exclusivos!
            </p>
            <Link href="/cadastro" className="px-8 py-4 bg-rpx-orange text-white rounded-lg text-xl font-bold hover:bg-orange-700">
              Comece Agora
            </Link>
          </div>
        </section>

        <section className="py-16 bg-rpx-dark">
          <div className="container mx-auto">
            <h2 className="text-4xl font-bold mb-12 text-center font-heading">Principais Recursos</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-rpx-blue/20 p-8 rounded-lg">
                <h3 className="text-2xl font-bold mb-4">Torneios Diários</h3>
                <p>Participe de competições diárias com diferentes formatos e premiações incríveis.</p>
              </div>
              <div className="bg-rpx-blue/20 p-8 rounded-lg">
                <h3 className="text-2xl font-bold mb-4">Sistema de Apostas</h3>
                <p>Aposte nos melhores jogadores e equipes para multiplicar seus ganhos.</p>
              </div>
              <div className="bg-rpx-blue/20 p-8 rounded-lg">
                <h3 className="text-2xl font-bold mb-4">Lootboxes Exclusivas</h3>
                <p>Abra caixas com itens raros e exclusivos para personalizar sua experiência.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 bg-rpx-dark">
          <div className="container mx-auto">
            <h2 className="text-4xl font-bold mb-12 text-center font-heading">Próximos Torneios</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-rpx-blue/20 p-8 rounded-lg">
                <h3 className="text-2xl font-bold mb-2">RPX Daily Cup</h3>
                <p className="text-rpx-orange mb-4">Hoje às 20:00</p>
                <p className="mb-4">Torneio diário com premiação de R$1.000,00</p>
                <Link href="/torneios/daily-cup" className="px-4 py-2 bg-rpx-orange text-white rounded">
                  Inscreva-se
                </Link>
              </div>
              <div className="bg-rpx-blue/20 p-8 rounded-lg">
                <h3 className="text-2xl font-bold mb-2">RPX Pro League</h3>
                <p className="text-rpx-orange mb-4">Sábado às 15:00</p>
                <p className="mb-4">Campeonato semanal com premiação de R$5.000,00</p>
                <Link href="/torneios/pro-league" className="px-4 py-2 bg-rpx-orange text-white rounded">
                  Inscreva-se
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-rpx-blue p-8">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">RPX</h3>
              <p>A melhor plataforma de competições e apostas de Free Fire do Brasil.</p>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-4">Links Rápidos</h3>
              <ul className="space-y-2">
                <li><Link href="/torneios">Torneios</Link></li>
                <li><Link href="/rankings">Rankings</Link></li>
                <li><Link href="/apostas">Apostas</Link></li>
                <li><Link href="/loja">Loja</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-4">Suporte</h3>
              <ul className="space-y-2">
                <li><Link href="/faq">FAQ</Link></li>
                <li><Link href="/contato">Contato</Link></li>
                <li><Link href="/termos">Termos de Uso</Link></li>
                <li><Link href="/privacidade">Política de Privacidade</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-4">Redes Sociais</h3>
              <div className="flex space-x-4">
                <Link href="#" className="text-white hover:text-rpx-orange">
                  Instagram
                </Link>
                <Link href="#" className="text-white hover:text-rpx-orange">
                  Twitter
                </Link>
                <Link href="#" className="text-white hover:text-rpx-orange">
                  Discord
                </Link>
              </div>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-white/20 text-center">
            <p>&copy; {new Date().getFullYear()} RPX. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
} 