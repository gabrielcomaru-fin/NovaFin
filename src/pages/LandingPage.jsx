import React from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { DollarSign, BarChart, Target, ShieldCheck, Star } from 'lucide-react';

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
      
      <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/40">
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

        {/* Main */}
        <main className="container mx-auto px-4 py-16">
          {/* Hero compacto */}
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-5xl font-bold tracking-tight mb-5">
              Clareza financeira <span className="text-primary">em minutos</span>
            </h1>
            <p className="text-lg text-muted-foreground mb-6 max-w-2xl mx-auto">
              Orçamento, gastos, investimentos e metas em um só lugar. Simples, direto e bonito.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/register">
                <Button size="lg" className="w-full sm:w-auto">Começar grátis</Button>
              </Link>
              <Link to="/login">
                <Button size="lg" variant="outline" className="w-full sm:w-auto">Ver demo</Button>
              </Link>
            </div>
            <div className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Star className="h-4 w-4 text-yellow-500" />
              <span>4.8/5 avaliação média</span>
              <span className="mx-2">•</span>
              <span>Sem cartão • Cancele quando quiser</span>
            </div>
          </div>

          {/* Mockup visual minimalista */}
          <div className="relative mt-12">
            <div className="absolute inset-0 -z-10 bg-gradient-to-r from-primary/20 via-fuchsia-500/10 to-cyan-500/10 blur-3xl rounded-3xl" aria-hidden />
            <div className="relative mx-auto max-w-5xl rounded-2xl border bg-card/80 backdrop-blur shadow-xl p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl border bg-background">
                  <p className="text-sm text-muted-foreground">Saldo</p>
                  <p className="mt-2 text-2xl font-bold">R$ 12.480</p>
                  <div className="mt-4 flex items-end gap-1 h-16">
                    <div className="w-2 bg-primary/30 h-6 rounded" />
                    <div className="w-2 bg-primary/40 h-8 rounded" />
                    <div className="w-2 bg-primary/60 h-10 rounded" />
                    <div className="w-2 bg-primary/70 h-12 rounded" />
                    <div className="w-2 bg-primary h-14 rounded" />
                    <div className="w-2 bg-primary/60 h-10 rounded" />
                    <div className="w-2 bg-primary/40 h-8 rounded" />
            </div>
                </div>
                <div className="p-4 rounded-xl border bg-background">
                  <p className="text-sm text-muted-foreground">Gastos do mês</p>
                  <p className="mt-2 text-2xl font-bold text-red-500">R$ 3.260</p>
                  <div className="mt-4 grid grid-cols-4 gap-2">
                    <div className="h-16 rounded bg-red-500/20" />
                    <div className="h-10 rounded bg-amber-500/20" />
                    <div className="h-8 rounded bg-blue-500/20" />
                    <div className="h-6 rounded bg-emerald-500/20" />
                  </div>
                </div>
                <div className="p-4 rounded-xl border bg-background">
                  <p className="text-sm text-muted-foreground">Meta de aporte</p>
                  <p className="mt-2 text-2xl font-bold text-emerald-500">R$ 1.000</p>
                  <div className="mt-4 w-full h-2 bg-muted rounded">
                    <div className="h-2 bg-emerald-500 rounded" style={{ width: '72%' }} />
                </div>
                  <p className="mt-2 text-xs text-muted-foreground">72% do objetivo neste mês</p>
                </div>
              </div>
              </div>
            </div>

          {/* Features condensadas */}
          <section className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 rounded-xl border bg-card">
              <BarChart className="h-5 w-5 text-primary mb-2" />
              <p className="font-medium">Dashboards claros</p>
              <p className="text-sm text-muted-foreground">KPIs essenciais, sem ruído.</p>
            </div>
            <div className="p-5 rounded-xl border bg-card">
              <Target className="h-5 w-5 text-primary mb-2" />
              <p className="font-medium">Metas guiadas</p>
              <p className="text-sm text-muted-foreground">Acompanhamento simples e objetivo.</p>
            </div>
            <div className="p-5 rounded-xl border bg-card">
              <ShieldCheck className="h-5 w-5 text-primary mb-2" />
              <p className="font-medium">Privacidade e segurança</p>
              <p className="text-sm text-muted-foreground">Boas práticas por padrão.</p>
            </div>
          </section>

          {/* Problema → Solução (compacto) */}
          <section className="mt-16 grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            <div>
              <h2 className="text-2xl font-semibold">Problemas comuns</h2>
              <ul className="mt-4 list-disc pl-5 text-sm text-muted-foreground space-y-2">
                <li>Gastos dispersos e pouca clareza do todo</li>
                <li>Metas sem acompanhamento real ao longo do mês</li>
                <li>Relatórios que não se traduzem em ação</li>
              </ul>
            </div>
            <div>
              <h3 className="text-2xl font-semibold">Como o Lumify resolve</h3>
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-4 rounded-lg border bg-card">
                  <BarChart className="h-5 w-5 text-primary mb-2" />
                  <p className="font-medium">Insights diretos</p>
                  <p className="text-xs text-muted-foreground">KPIs essenciais, prontos para agir.</p>
                </div>
                <div className="p-4 rounded-lg border bg-card">
                  <Target className="h-5 w-5 text-primary mb-2" />
                  <p className="font-medium">Metas acompanhadas</p>
                  <p className="text-xs text-muted-foreground">Alertas e progresso mensal sempre à vista.</p>
                </div>
                <div className="p-4 rounded-lg border bg-card">
                  <ShieldCheck className="h-5 w-5 text-primary mb-2" />
                  <p className="font-medium">Dados organizados</p>
                  <p className="text-xs text-muted-foreground">Tudo centralizado e seguro, sem planilhas quebradas.</p>
                </div>
              </div>
            </div>
          </section>

          {/* CTA final compacto */}
          <section className="mt-16 text-center">
            <p className="text-sm text-muted-foreground">Pronto para começar?</p>
            <div className="mt-3 flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/register">
                <Button size="lg" className="w-full sm:w-auto">Criar conta</Button>
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