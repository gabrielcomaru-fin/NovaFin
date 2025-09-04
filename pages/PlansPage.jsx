import React from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, Star } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const plans = [
  {
    name: 'Free',
    price: 'R$0',
    description: 'O essencial para começar a organizar suas finanças.',
    features: [
      'Controle de gastos básico',
      'Cadastro de 1 conta bancária',
      'Visão geral no dashboard',
    ],
    cta: 'Seu plano atual',
    isCurrent: true,
  },
  {
    name: 'Pro',
    price: 'R$9,90',
    priceSuffix: '/mês',
    description: 'Ferramentas poderosas para otimizar seus resultados.',
    features: [
      'Tudo do plano Free',
      'Múltiplas contas bancárias',
      'Metas de aporte personalizadas',
      'Teto de gastos por categoria',
      'Dicas financeiras automáticas',
    ],
    cta: 'Fazer Upgrade',
  },
  {
    name: 'Premium',
    price: 'R$19,90',
    priceSuffix: '/mês',
    description: 'A experiência completa para dominar suas finanças.',
    features: [
      'Tudo do plano Pro',
      'Projeções de investimento avançadas',
      'Simulador de juros compostos detalhado',
      'Relatórios completos (PDF/Excel)',
      'Suporte prioritário',
    ],
    cta: 'Fazer Upgrade',
  },
];

export function PlansPage() {
  const { toast } = useToast();

  const handleUpgradeClick = (planName) => {
    toast({
      title: '🚧 Funcionalidade em desenvolvimento!',
      description: `A integração com o Stripe para o plano ${planName} ainda não foi implementada.`,
    });
  };

  return (
    <>
      <Helmet>
        <title>Planos - FinanceApp</title>
        <meta name="description" content="Escolha o plano que melhor se adapta às suas necessidades financeiras." />
      </Helmet>
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight">Nossos Planos</h1>
          <p className="text-muted-foreground mt-2">Encontre o plano perfeito para sua jornada financeira.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card className={`flex flex-col h-full ${plan.name === 'Pro' ? 'border-primary ring-2 ring-primary' : ''}`}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {plan.name === 'Pro' && <Star className="text-primary w-5 h-5" />}
                    {plan.name}
                  </CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                  <div className="mb-6">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    {plan.priceSuffix && <span className="text-muted-foreground">{plan.priceSuffix}</span>}
                  </div>
                  <ul className="space-y-3">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-green-500 mt-1 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button
                    className="w-full"
                    disabled={plan.isCurrent}
                    onClick={() => handleUpgradeClick(plan.name)}
                    variant={plan.name === 'Pro' ? 'default' : 'outline'}
                  >
                    {plan.cta}
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </div>
        <div className="text-center text-muted-foreground text-sm">
          <p>Para integrar os pagamentos com Stripe, primeiro você precisa obter suas chaves de API.</p>
          <p>Você pode solicitar a integração no próximo prompt!</p>
        </div>
      </div>
    </>
  );
}