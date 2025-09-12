import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/enhanced-card';
import { AlertTriangle, TrendingUp, Lightbulb } from 'lucide-react';
import { useMicroInteractions } from '@/hooks/useMicroInteractions';

const TipsSection = memo(function TipsSection({ tips }) {
  const { createStaggerAnimation } = useMicroInteractions();
  
  const getIcon = (type) => {
    switch (type) {
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-warning mt-0.5 flex-shrink-0" />;
      case 'success':
        return <TrendingUp className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />;
      case 'tip':
        return <Lightbulb className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />;
      default:
        return <Lightbulb className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />;
    }
  };

  return (
    <motion.div
      {...createStaggerAnimation(0.9)}
    >
      <Card hover={true} animation="subtle">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-warning" />
            Dicas Financeiras
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {tips.map((tip, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + index * 0.1 }}
              className="p-3 rounded-lg flex items-start gap-3 bg-secondary"
            >
              {getIcon(tip.type)}
              <p className="text-sm text-muted-foreground">{tip.message}</p>
            </motion.div>
          ))}
        </CardContent>
      </Card>
    </motion.div>
  );
});

export { TipsSection };
