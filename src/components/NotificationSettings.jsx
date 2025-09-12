import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useNotifications } from '@/hooks/useNotifications';
import { Bell, BellOff, Settings, CheckCircle, XCircle } from 'lucide-react';

export const NotificationSettings = () => {
  const { 
    isSupported, 
    permission, 
    requestPermission 
  } = useNotifications();
  
  const [settings, setSettings] = useState({
    expenseLimits: true,
    investmentGoals: true,
    pendingBills: true,
    financialTips: false,
    monthlyReports: true
  });

  const [isRequesting, setIsRequesting] = useState(false);

  // Carregar configurações salvas
  useEffect(() => {
    const savedSettings = localStorage.getItem('notificationSettings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  }, []);

  // Salvar configurações
  const saveSettings = (newSettings) => {
    setSettings(newSettings);
    localStorage.setItem('notificationSettings', JSON.stringify(newSettings));
  };

  const handlePermissionRequest = async () => {
    setIsRequesting(true);
    try {
      await requestPermission();
    } finally {
      setIsRequesting(false);
    }
  };

  const handleSettingChange = (key, value) => {
    const newSettings = { ...settings, [key]: value };
    saveSettings(newSettings);
  };

  const getPermissionStatus = () => {
    if (!isSupported) {
      return {
        icon: XCircle,
        text: 'Não suportado',
        color: 'text-red-500',
        description: 'Seu navegador não suporta notificações push'
      };
    }

    switch (permission) {
      case 'granted':
        return {
          icon: CheckCircle,
          text: 'Ativado',
          color: 'text-green-500',
          description: 'Notificações estão ativas'
        };
      case 'denied':
        return {
          icon: XCircle,
          text: 'Bloqueado',
          color: 'text-red-500',
          description: 'Notificações foram bloqueadas. Ative nas configurações do navegador'
        };
      default:
        return {
          icon: BellOff,
          text: 'Não configurado',
          color: 'text-yellow-500',
          description: 'Permissão não foi solicitada ainda'
        };
    }
  };

  const status = getPermissionStatus();
  const StatusIcon = status.icon;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Notificações
        </CardTitle>
        <CardDescription>
          Configure como você deseja receber lembretes sobre suas finanças
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Status da permissão */}
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex items-center gap-3">
            <StatusIcon className={`h-5 w-5 ${status.color}`} />
            <div>
              <p className="font-medium">Status: {status.text}</p>
              <p className="text-sm text-muted-foreground">{status.description}</p>
            </div>
          </div>
          {permission !== 'granted' && isSupported && (
            <Button 
              onClick={handlePermissionRequest}
              disabled={isRequesting}
              variant="outline"
            >
              {isRequesting ? 'Solicitando...' : 'Ativar Notificações'}
            </Button>
          )}
        </div>

        {/* Configurações de notificação */}
        {permission === 'granted' && (
          <div className="space-y-4">
            <h4 className="font-medium flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Tipos de Notificação
            </h4>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="expense-limits">Limites de gastos</Label>
                  <p className="text-sm text-muted-foreground">
                    Avisar quando atingir 80% do limite de uma categoria
                  </p>
                </div>
                <Switch
                  id="expense-limits"
                  checked={settings.expenseLimits}
                  onCheckedChange={(checked) => handleSettingChange('expenseLimits', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="investment-goals">Metas de investimento</Label>
                  <p className="text-sm text-muted-foreground">
                    Avisar sobre o progresso das metas de investimento
                  </p>
                </div>
                <Switch
                  id="investment-goals"
                  checked={settings.investmentGoals}
                  onCheckedChange={(checked) => handleSettingChange('investmentGoals', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="pending-bills">Contas pendentes</Label>
                  <p className="text-sm text-muted-foreground">
                    Lembrar sobre contas não pagas
                  </p>
                </div>
                <Switch
                  id="pending-bills"
                  checked={settings.pendingBills}
                  onCheckedChange={(checked) => handleSettingChange('pendingBills', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="financial-tips">Dicas financeiras</Label>
                  <p className="text-sm text-muted-foreground">
                    Receber dicas e conselhos financeiros
                  </p>
                </div>
                <Switch
                  id="financial-tips"
                  checked={settings.financialTips}
                  onCheckedChange={(checked) => handleSettingChange('financialTips', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="monthly-reports">Relatórios mensais</Label>
                  <p className="text-sm text-muted-foreground">
                    Notificar quando relatórios mensais estiverem disponíveis
                  </p>
                </div>
                <Switch
                  id="monthly-reports"
                  checked={settings.monthlyReports}
                  onCheckedChange={(checked) => handleSettingChange('monthlyReports', checked)}
                />
              </div>
            </div>
          </div>
        )}

        {!isSupported && (
          <div className="text-center py-8 text-muted-foreground">
            <BellOff className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Notificações não são suportadas neste navegador</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
