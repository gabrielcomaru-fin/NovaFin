import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/enhanced-card';
import { TrendingUp } from 'lucide-react';
import { useMicroInteractions } from '@/hooks/useMicroInteractions';

const ProjectionCard = memo(function ProjectionCard({ projection12m }) {
  const { createStaggerAnimation } = useMicroInteractions();
  
  return (
    <motion.div
      {...createStaggerAnimation(0.7)}
    >
      <Card className="h-full" hover={true} animation="subtle">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-income" /> Projeção de 12 meses (aporte médio 3m)
          </CardTitle>
          <CardDescription>
            Estimativa simples baseada no aporte médio recente. Use a página Projeção para um modelo detalhado.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            R$ {projection12m.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-xs text-muted-foreground">
            Não considera rendimentos; apenas constância de aportes.
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
});

export { ProjectionCard };
