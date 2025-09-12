import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';

export const useNotifications = () => {
  const [permission, setPermission] = useState(Notification.permission);
  const [isSupported, setIsSupported] = useState('Notification' in window);
  const { toast } = useToast();

  // Verificar suporte e permissão
  useEffect(() => {
    if (!isSupported) return;
    
    setPermission(Notification.permission);
  }, [isSupported]);

  // Solicitar permissão para notificações
  const requestPermission = useCallback(async () => {
    if (!isSupported) {
      toast({
        variant: "destructive",
        title: "Notificações não suportadas",
        description: "Seu navegador não suporta notificações push.",
      });
      return false;
    }

    if (permission === 'granted') {
      return true;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      
      if (result === 'granted') {
        toast({
          title: "Notificações ativadas",
          description: "Você receberá lembretes sobre suas finanças.",
        });
        return true;
      } else {
        toast({
          variant: "destructive",
          title: "Permissão negada",
          description: "As notificações foram bloqueadas. Você pode ativá-las nas configurações do navegador.",
        });
        return false;
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao solicitar permissão",
        description: "Não foi possível solicitar permissão para notificações.",
      });
      return false;
    }
  }, [isSupported, permission, toast]);

  // Enviar notificação
  const sendNotification = useCallback((title, options = {}) => {
    if (!isSupported || permission !== 'granted') {
      // Fallback para toast se notificações não estiverem disponíveis
      toast({
        title,
        description: options.body || '',
        ...options
      });
      return;
    }

    try {
      const notification = new Notification(title, {
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        ...options
      });

      // Auto-close após 5 segundos
      setTimeout(() => {
        notification.close();
      }, 5000);

      return notification;
    } catch (error) {
      console.error('Erro ao enviar notificação:', error);
      // Fallback para toast
      toast({
        title,
        description: options.body || '',
        ...options
      });
    }
  }, [isSupported, permission, toast]);

  // Notificações específicas para finanças
  const sendFinancialReminder = useCallback((type, data) => {
    const notifications = {
      expenseLimit: {
        title: '⚠️ Limite de gastos atingido',
        body: `Você atingiu ${data.percentage}% do limite em ${data.category}`,
        tag: 'expense-limit'
      },
      investmentGoal: {
        title: '🎯 Meta de investimento',
        body: data.achieved 
          ? `Parabéns! Você atingiu sua meta de investimento!`
          : `Você está ${data.percentage}% da sua meta de investimento`,
        tag: 'investment-goal'
      },
      billReminder: {
        title: '📅 Lembrete de conta',
        body: `Você tem ${data.count} conta(s) pendente(s) para pagar`,
        tag: 'bill-reminder'
      },
      savingsTip: {
        title: '💡 Dica financeira',
        body: data.tip,
        tag: 'savings-tip'
      },
      monthlyReport: {
        title: '📊 Relatório mensal',
        body: `Seu relatório financeiro de ${data.month} está disponível`,
        tag: 'monthly-report'
      }
    };

    const notification = notifications[type];
    if (notification) {
      sendNotification(notification.title, {
        body: notification.body,
        tag: notification.tag,
        requireInteraction: type === 'expenseLimit' || type === 'billReminder'
      });
    }
  }, [sendNotification]);

  // Agendar notificação
  const scheduleNotification = useCallback((title, options, delay) => {
    if (!isSupported || permission !== 'granted') return null;

    return setTimeout(() => {
      sendNotification(title, options);
    }, delay);
  }, [isSupported, permission, sendNotification]);

  // Cancelar notificação agendada
  const cancelScheduledNotification = useCallback((timeoutId) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }, []);

  return {
    isSupported,
    permission,
    requestPermission,
    sendNotification,
    sendFinancialReminder,
    scheduleNotification,
    cancelScheduledNotification,
  };
};
