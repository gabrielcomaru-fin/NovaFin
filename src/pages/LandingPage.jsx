import React from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { DollarSign, BarChart, Target, ShieldCheck, Zap, Star } from 'lucide-react';

const LandingPage = () => {
  return (
    <>
      <Helmet>
        <title>Lumify - Controle financeiro inteligente para sua vida</title>
        <meta name="description" content="Lumify: organize gastos, acompanhe investimentos, projete metas e tome decisões com dashboards e insights em tempo real." />
        <meta name="keywords" content="Lumify, controle financeiro, finanças pessoais, orçamento, despesas, investimentos, metas financeiras, dashboards, relatórios" />
        <meta property="og:title" content="Lumify - Controle financeiro inteligente" />
        <meta property="og:description" content="Centralize suas finanças, automatize o controle de despesas e acompanhe investimentos com visualizações claras." />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="/og-image.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Lumify - Controle financeiro inteligente" />
        <meta name="twitter:description" content="Centralize suas finanças, automatize o controle e acompanhe investimentos com visualizações claras." />
        <meta name="twitter:image" content="/og-image.png" />
        <meta property="og:site_name" content="Lumify" />
        <link rel="canonical" href="/" />
        <script type="application/ld+json">{JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'SoftwareApplication',
          name: 'Lumify',
          applicationCategory: 'FinanceApplication',
          operatingSystem: 'Web',
          description: 'Plataforma para organizar despesas, acompanhar investimentos e bater metas.',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'BRL' },
          aggregateRating: { '@type': 'AggregateRating', ratingValue: '4.8', reviewCount: '124' }
        })}</script>
      </Helmet>
      
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
        {/* Header */}
        <header className="container mx-auto px-4 py-6">
          <nav className="flex items-center justify-between" aria-label="Primary">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-8 w-8 text-primary" />
              <span className="text-2xl font-bold">Lumify</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link to="/login">
                <Button variant="ghost">Entrar</Button>
              </Link>
              <Link to="/register">
                <Button>Começar Grátis</Button>
              </Link>
            </div>
          </nav>
        </header>

        {/* Hero Section */}
        <main className="container mx-auto px-4 py-16">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-5xl font-bold tracking-tight mb-6">
              Controle total das suas <span className="text-primary">finanças</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              O Lumify centraliza orçamento, despesas, investimentos e projeções. Decisões mais rápidas, metas batidas e tranquilidade financeira.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/register">
                <Button size="lg" className="w-full sm:w-auto">
                  Começar grátis
                </Button>
              </Link>
              <Link to="/login">
                <Button size="lg" variant="outline" className="w-full sm:w-auto">
                  Ver demo
                </Button>
              </Link>
            </div>
            <p className="text-xs text-muted-foreground mt-3">Sem cartão de crédito • Cancele quando quiser</p>
          </div>

          {/* Prova social simples */}
          <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
            <div>
              <p className="text-3xl font-bold">5 min</p>
              <p className="text-sm text-muted-foreground">para configurar</p>
            </div>
            <div>
              <p className="text-3xl font-bold">4.8/5</p>
              <p className="text-sm text-muted-foreground">satisfação média</p>
            </div>
            <div>
              <p className="text-3xl font-bold">+12</p>
              <p className="text-sm text-muted-foreground">gráficos e relatórios</p>
            </div>
          </div>

          {/* Problema → Solução */}
          <section className="mt-24 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div className="space-y-4">
              <h2 className="text-3xl font-bold">Chega de planilhas quebradas e falta de visibilidade</h2>
              <ul className="list-disc pl-5 text-muted-foreground space-y-2">
                <li>Gastos espalhados e difícil entender para onde o dinheiro vai.</li>
                <li>Metas de investimento sem acompanhamento real.</li>
                <li>Relatórios confusos que não viram ação.</li>
              </ul>
            </div>
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">Como o Lumify resolve</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg border bg-card">
                  <BarChart className="h-5 w-5 text-primary mb-2" />
                  <p className="font-medium">Insights acionáveis</p>
                  <p className="text-sm text-muted-foreground">KPIs e gráficos que revelam oportunidades e riscos.</p>
                </div>
                <div className="p-4 rounded-lg border bg-card">
                  <Target className="h-5 w-5 text-primary mb-2" />
                  <p className="font-medium">Metas guiadas</p>
                  <p className="text-sm text-muted-foreground">Projeções e alertas para manter o ritmo mensal.</p>
                </div>
                <div className="p-4 rounded-lg border bg-card">
                  <ShieldCheck className="h-5 w-5 text-primary mb-2" />
                  <p className="font-medium">Dados seguros</p>
                  <p className="text-sm text-muted-foreground">Boas práticas de segurança e foco em privacidade.</p>
                </div>
                <div className="p-4 rounded-lg border bg-card">
                  <Zap className="h-5 w-5 text-primary mb-2" />
                  <p className="font-medium">Configuração rápida</p>
                  <p className="text-sm text-muted-foreground">Comece em minutos. Sem fricção.</p>
                </div>
              </div>
            </div>
          </section>

          {/* Benefícios orientados a resultados */}
          <section className="mt-24">
            <h2 className="text-3xl font-bold text-center">Benefícios que geram resultado</h2>
            <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 rounded-lg border bg-card">
                <p className="text-lg font-semibold">Corte gastos desnecessários</p>
                <p className="text-sm text-muted-foreground mt-2">Identifique categorias que mais pesam e ajuste com confiança.</p>
              </div>
              <div className="p-6 rounded-lg border bg-card">
                <p className="text-lg font-semibold">Invista com consistência</p>
                <p className="text-sm text-muted-foreground mt-2">Acompanhe a meta mensal e construa patrimônio a longo prazo.</p>
              </div>
              <div className="p-6 rounded-lg border bg-card">
                <p className="text-lg font-semibold">Tenha clareza do agora</p>
                <p className="text-sm text-muted-foreground mt-2">Saiba seu status e tome decisões sem adivinhações.</p>
              </div>
            </div>
          </section>

          {/* Como funciona */}
          <section className="mt-24">
            <h2 className="text-3xl font-bold text-center">Como funciona</h2>
            <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 rounded-lg border bg-card">
                <p className="text-sm text-muted-foreground">Passo 1</p>
                <p className="text-lg font-semibold">Crie sua conta</p>
                <p className="text-sm text-muted-foreground mt-2">Personalize categorias e metas em poucos cliques.</p>
              </div>
              <div className="p-6 rounded-lg border bg-card">
                <p className="text-sm text-muted-foreground">Passo 2</p>
                <p className="text-lg font-semibold">Registre gastos e aportes</p>
                <p className="text-sm text-muted-foreground mt-2">Veja os números ganharem vida em dashboards.</p>
              </div>
              <div className="p-6 rounded-lg border bg-card">
                <p className="text-sm text-muted-foreground">Passo 3</p>
                <p className="text-lg font-semibold">Aja com base em insights</p>
                <p className="text-sm text-muted-foreground mt-2">Ajuste orçamento, aumente aportes e alcance as metas.</p>
              </div>
            </div>
          </section>

          {/* Casos de uso */}
          <section className="mt-24">
            <h2 className="text-3xl font-bold text-center">Feito para diferentes momentos</h2>
            <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 rounded-lg border bg-card">
                <p className="font-semibold">Começando agora</p>
                <p className="text-sm text-muted-foreground mt-2">Base sólida para organizar a vida financeira do zero.</p>
              </div>
              <div className="p-6 rounded-lg border bg-card">
                <p className="font-semibold">Buscando otimizar</p>
                <p className="text-sm text-muted-foreground mt-2">Controle fino de categorias e corte de desperdícios.</p>
              </div>
              <div className="p-6 rounded-lg border bg-card">
                <p className="font-semibold">Foco em acumular</p>
                <p className="text-sm text-muted-foreground mt-2">Metas de aporte consistentes e projeções de crescimento.</p>
              </div>
            </div>
          </section>

          {/* Depoimentos curtos */}
          <section className="mt-24">
            <h2 className="text-3xl font-bold text-center">O que usuários dizem</h2>
            <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 rounded-lg border bg-card">
                <p className="text-sm">“Em 2 semanas cortei 12% dos gastos fixos.”</p>
                <p className="mt-3 text-xs text-muted-foreground">Ana R.</p>
              </div>
              <div className="p-6 rounded-lg border bg-card">
                <p className="text-sm">“Finalmente bati minha meta de aporte 3 meses seguidos.”</p>
                <p className="mt-3 text-xs text-muted-foreground">Marcos V.</p>
              </div>
              <div className="p-6 rounded-lg border bg-card">
                <p className="text-sm">“Clareza em minutos. Os dashboards são diretos e úteis.”</p>
                <p className="mt-3 text-xs text-muted-foreground">Juliana C.</p>
              </div>
            </div>
          </section>

          {/* Segurança */}
          <section className="mt-24">
            <h2 className="text-3xl font-bold text-center">Segurança e privacidade</h2>
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 rounded-lg border bg-card text-center">
                <ShieldCheck className="h-6 w-6 text-primary mx-auto mb-2" />
                <p className="font-medium">Boas práticas</p>
                <p className="text-sm text-muted-foreground">Padrões modernos aplicados de ponta a ponta.</p>
              </div>
              <div className="p-6 rounded-lg border bg-card text-center">
                <div className="h-6" />
                <p className="font-medium">Controle de dados</p>
                <p className="text-sm text-muted-foreground">Você decide o que guardar e remover.</p>
              </div>
              <div className="p-6 rounded-lg border bg-card text-center">
                <div className="h-6" />
                <p className="font-medium">Disponibilidade</p>
                <p className="text-sm text-muted-foreground">Alta estabilidade para não atrapalhar sua rotina.</p>
              </div>
            </div>
          </section>

          {/* FAQ */}
          <section className="mt-24">
            <h2 className="text-3xl font-bold text-center">Perguntas frequentes</h2>
            <div className="mt-8 max-w-3xl mx-auto space-y-4">
              <details className="p-4 rounded-lg border bg-card">
                <summary className="font-medium cursor-pointer">Preciso de cartão para começar?</summary>
                <p className="text-sm text-muted-foreground mt-2">Não. Você pode testar gratuitamente sem cartão.</p>
              </details>
              <details className="p-4 rounded-lg border bg-card">
                <summary className="font-medium cursor-pointer">Posso exportar meus dados?</summary>
                <p className="text-sm text-muted-foreground mt-2">Sim, exporte relatórios e dados para acompanhamento externo.</p>
              </details>
              <details className="p-4 rounded-lg border bg-card">
                <summary className="font-medium cursor-pointer">Como defino minhas metas?</summary>
                <p className="text-sm text-muted-foreground mt-2">Defina seu aporte mensal alvo e acompanhe o progresso automaticamente.</p>
              </details>
            </div>
          </section>

          {/* Planos (resumo) */}
          <section className="mt-24">
            <h2 className="text-3xl font-bold text-center">Planos simples e diretos</h2>
            <p className="text-center text-muted-foreground mt-2">Comece grátis e evolua quando fizer sentido.</p>
            <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 rounded-lg border bg-card">
                <p className="text-sm text-muted-foreground">Gratuito</p>
                <p className="text-3xl font-bold mt-2">R$ 0</p>
                <ul className="mt-4 text-sm text-muted-foreground space-y-2">
                  <li>• Controle de despesas</li>
                  <li>• Dashboards básicos</li>
                  <li>• Metas mensais</li>
                </ul>
              </div>
              <div className="p-6 rounded-lg border bg-card">
                <p className="text-sm text-muted-foreground">Essencial</p>
                <p className="text-3xl font-bold mt-2">R$ 19/mês</p>
                <ul className="mt-4 text-sm text-muted-foreground space-y-2">
                  <li>• Tudo do Gratuito</li>
                  <li>• Relatórios avançados</li>
                  <li>• Exportações</li>
                </ul>
              </div>
              <div className="p-6 rounded-lg border bg-card">
                <p className="text-sm text-muted-foreground">Pro</p>
                <p className="text-3xl font-bold mt-2">R$ 39/mês</p>
                <ul className="mt-4 text-sm text-muted-foreground space-y-2">
                  <li>• Tudo do Essencial</li>
                  <li>• Projeções avançadas</li>
                  <li>• Prioridade no suporte</li>
                </ul>
              </div>
            </div>
            <div className="text-center mt-6">
              <Link to="/planos">
                <Button size="lg">Ver detalhes dos planos</Button>
              </Link>
            </div>
          </section>

          {/* CTA final */}
          <section className="mt-24 text-center">
            <h2 className="text-3xl font-bold">Pronto para iluminar suas finanças?</h2>
            <p className="text-muted-foreground mt-3">Comece agora e tenha clareza desde o primeiro dia.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mt-6">
              <Link to="/register">
                <Button size="lg" className="w-full sm:w-auto">Criar conta gratuita</Button>
              </Link>
              <Link to="/login">
                <Button size="lg" variant="outline" className="w-full sm:w-auto">Explorar demo</Button>
              </Link>
            </div>
          </section>
        </main>

        {/* Footer */}
        <footer className="container mx-auto px-4 py-8 border-t">
          <div className="text-center text-muted-foreground">
            <p>&copy; 2024 Lumify. Todos os direitos reservados.</p>
          </div>
        </footer>
      </div>
    </>
  );
};

export { LandingPage };