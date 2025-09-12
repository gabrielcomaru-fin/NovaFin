import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';

const ProjectionCard = memo(function ProjectionCard({ projection12m }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.7 }}
    >
      <Card className="h-full">
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
