import React, { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  AlertCircle, 
  CheckCircle, 
  Info, 
  TrendingUp, 
  TrendingDown,
  Target,
  DollarSign,
  Calendar,
  Shield,
  Lightbulb,
  AlertTriangle
} from 'lucide-react';

export const SmartAlerts = ({ insights, recommendations, financialHealth, trends }) => {
  const getAlertIcon = (type) => {
    switch (type) {
      case 'warning': return AlertTriangle;
      case 'error': return AlertCircle;
      case 'success': return CheckCircle;
      case 'info': return Info;
      default: return Info;
    }
  };

  const getAlertColor = (type) => {
    switch (type) {
      case 'warning': return 'text-orange-600';
      case 'error': return 'text-red-600';
      case 'success': return 'text-green-600';
      case 'info': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  const getAlertVariant = (type) => {
    switch (type) {
      case 'warning': return 'destructive';
      case 'error': return 'destructive';
      case 'success': return 'default';
      case 'info': return 'default';
      default: return 'default';
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'high': return <Badge variant="destructive">Alta</Badge>;
      case 'medium': return <Badge variant="secondary">Média</Badge>;
      case 'low': return <Badge variant="outline">Baixa</Badge>;
      default: return <Badge variant="outline">N/A</Badge>;
    }
  };

  const alerts = useMemo(() => {
    const alertList = [];
    
    // Alertas baseados em insights
    if (insights) {
      insights.forEach(insight => {
        alertList.push({
          id: `insight-${insight.title}`,
          type: insight.type,
          title: insight.title,
          message: insight.message,
          recommendation: insight.recommendation,
          action: insight.action,
          priority: insight.priority,
          icon: getAlertIcon(insight.type),
          color: getAlertColor(insight.type)
        });
      });
    }
    
    // Alertas baseados na saúde financeira
    if (financialHealth) {
      if (financialHealth.liquidityRatio < 2) {
        alertList.push({
          id: 'low-liquidity',
          type: 'warning',
          title: 'Reserva de Emergência Baixa',
          message: `Sua reserva de emergência cobre apenas ${financialHealth.liquidityRatio.toFixed(1)} mês(es) de gastos`,
          recommendation: 'Construa uma reserva de emergência de 3-6 meses',
          action: 'Aumentar reserva',
          priority: 'high',
          icon: Shield,
          color: 'text-orange-600'
        });
      }
      
      if (financialHealth.savingsRate < 10) {
        alertList.push({
          id: 'low-savings',
          type: 'warning',
          title: 'Taxa de Poupança Baixa',
          message: `Sua taxa de poupança está em ${financialHealth.savingsRate.toFixed(1)}%`,
          recommendation: 'Tente aumentar para pelo menos 20%',
          action: 'Aumentar poupança',
          priority: 'high',
          icon: TrendingDown,
          color: 'text-red-600'
        });
      }
      
      if (financialHealth.investmentDiversification < 30) {
        alertList.push({
          id: 'low-diversification',
          type: 'info',
          title: 'Baixa Diversificação',
          message: 'Seus investimentos estão concentrados em poucas categorias',
          recommendation: 'Diversifique seus investimentos',
          action: 'Diversificar',
          priority: 'medium',
          icon: Target,
          color: 'text-blue-600'
        });
      }
    }
    
    // Alertas baseados em tendências
    if (trends) {
      if (trends.spending === 'increasing') {
        alertList.push({
          id: 'spending-trend',
          type: 'warning',
          title: 'Tendência de Aumento nos Gastos',
          message: 'Seus gastos estão aumentando mês a mês',
          recommendation: 'Revise suas categorias de gastos',
          action: 'Revisar gastos',
          priority: 'high',
          icon: TrendingUp,
          color: 'text-red-600'
        });
      }
      
      if (trends.investment === 'decreasing') {
        alertList.push({
          id: 'investment-trend',
          type: 'warning',
          title: 'Tendência de Redução nos Investimentos',
          message: 'Seus investimentos estão diminuindo',
          recommendation: 'Mantenha a consistência nos aportes',
          action: 'Aumentar aportes',
          priority: 'high',
          icon: TrendingDown,
          color: 'text-red-600'
        });
      }
    }
    
    // Alertas baseados em recomendações
    if (recommendations) {
      recommendations.forEach((rec, index) => {
        alertList.push({
          id: `recommendation-${index}`,
          type: 'info',
          title: rec.title,
          message: rec.description,
          recommendation: rec.recommendation,
          action: rec.action,
          priority: rec.priority,
          icon: Lightbulb,
          color: 'text-blue-600'
        });
      });
    }
    
    // Ordenar por prioridade
    return alertList.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }, [insights, recommendations, financialHealth, trends]);

  if (alerts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Alertas Inteligentes
          </CardTitle>
          <CardDescription>Nenhum alerta no momento</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-green-600 mb-2">
              Tudo em ordem!
            </h3>
            <p className="text-muted-foreground">
              Sua situação financeira está estável. Continue monitorando regularmente.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Alertas Inteligentes
          </CardTitle>
          <CardDescription>
            {alerts.length} alerta{alerts.length !== 1 ? 's' : ''} encontrado{alerts.length !== 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {alerts.map((alert) => {
              const IconComponent = alert.icon;
              return (
                <Alert key={alert.id} variant={getAlertVariant(alert.type)}>
                  <IconComponent className="h-4 w-4" />
                  <AlertTitle className="flex items-center justify-between">
                    <span>{alert.title}</span>
                    <div className="flex items-center gap-2">
                      {getPriorityBadge(alert.priority)}
                    </div>
                  </AlertTitle>
                  <AlertDescription className="space-y-3">
                    <p>{alert.message}</p>
                    {alert.recommendation && (
                      <div className="bg-muted p-3 rounded-lg">
                        <p className="text-sm font-medium mb-1">Recomendação:</p>
                        <p className="text-sm">{alert.recommendation}</p>
                      </div>
                    )}
                    {alert.action && (
                      <Button size="sm" variant="outline">
                        {alert.action}
                      </Button>
                    )}
                  </AlertDescription>
                </Alert>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Resumo dos Alertas */}
      <Card>
        <CardHeader>
          <CardTitle>Resumo dos Alertas</CardTitle>
          <CardDescription>Distribuição por tipo e prioridade</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {['high', 'medium', 'low'].map((priority) => {
              const count = alerts.filter(alert => alert.priority === priority).length;
              return (
                <div key={priority} className="text-center">
                  <div className="text-2xl font-bold">
                    {count}
                  </div>
                  <div className="text-sm text-muted-foreground capitalize">
                    {priority === 'high' ? 'Alta' : priority === 'medium' ? 'Média' : 'Baixa'}
                  </div>
                </div>
              );
            })}
            <div className="text-center">
              <div className="text-2xl font-bold">
                {alerts.length}
              </div>
              <div className="text-sm text-muted-foreground">
                Total
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recomendações Prioritárias */}
      <Card>
        <CardHeader>
          <CardTitle>Recomendações Prioritárias</CardTitle>
          <CardDescription>Ações mais importantes para melhorar sua saúde financeira</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {alerts
              .filter(alert => alert.priority === 'high')
              .slice(0, 3)
              .map((alert) => (
                <div key={alert.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium">{alert.title}</h4>
                    <Badge variant="destructive">Prioritário</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    {alert.message}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline">
                      {alert.action}
                    </Button>
                    <Button size="sm" variant="ghost">
                      Mais detalhes
                    </Button>
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
