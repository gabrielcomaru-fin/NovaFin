import React from 'react';
import { Helmet } from 'react-helmet';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { GamificationPanel } from '@/components/GamificationPanel';

export function GamificationPage() {
  return (
    <>
      <Helmet>
        <title>Conquistas - FinanceApp</title>
        <meta name="description" content="Acompanhe seus pontos, streaks e conquistas." />
      </Helmet>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">Conquistas</h1>

        <GamificationPanel />

        <Card>
          <CardHeader>
            <CardTitle>Como ganhar pontos</CardTitle>
            <CardDescription>Dicas rápidas para evoluir</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="list-disc pl-5 text-sm space-y-1 text-muted-foreground">
              <li>Registre aportes regularmente para manter seu streak diário.</li>
              <li>Quanto maior o aporte, mais pontos de bônus você ganha.</li>
              <li>Bata a meta do período para desbloquear conquistas especiais.</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </>
  );
}


