import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { EnhancedButton } from '@/components/ui/enhanced-button';
import { EnhancedInput } from '@/components/ui/enhanced-input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/enhanced-card';
import { EnhancedSpinner, LoadingDots, AnimatedProgress } from '@/components/ui/enhanced-loading';
import { EnhancedToast, EnhancedToaster } from '@/components/ui/enhanced-toast';
import { useMicroInteractions } from '@/hooks/useMicroInteractions';
import { CheckCircle, XCircle, AlertCircle, Info } from 'lucide-react';

export const MicroInteractionsDemo = () => {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [inputStatus, setInputStatus] = useState('default');
  const [toasts, setToasts] = useState([]);
  const { variants, createStaggerAnimation } = useMicroInteractions();

  const showToast = (type, title, description) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, type, title, description }]);
    
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, 5000);
  };

  const handleLoadingDemo = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 3000);
  };

  const handleProgressDemo = () => {
    setProgress(0);
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    if (value.length === 0) {
      setInputStatus('default');
    } else if (value.length < 3) {
      setInputStatus('warning');
    } else if (value.includes('@')) {
      setInputStatus('success');
    } else {
      setInputStatus('error');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-4"
      >
        <h1 className="text-3xl font-bold">Micro-interações Demo</h1>
        <p className="text-muted-foreground">
          Demonstração das micro-interações implementadas no projeto
        </p>
      </motion.div>

      {/* Botões Aprimorados */}
      <motion.div
        {...createStaggerAnimation(0.1)}
        className="space-y-4"
      >
        <h2 className="text-2xl font-semibold">Botões Aprimorados</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <EnhancedButton 
            variant="default" 
            animation="subtle"
            onClick={() => showToast('default', 'Botão Padrão', 'Clique registrado!')}
          >
            Padrão
          </EnhancedButton>
          
          <EnhancedButton 
            variant="success" 
            animation="bounce"
            onClick={() => showToast('success', 'Sucesso!', 'Operação realizada com sucesso.')}
          >
            Sucesso
          </EnhancedButton>
          
          <EnhancedButton 
            variant="warning" 
            animation="glow"
            onClick={() => showToast('warning', 'Atenção', 'Esta ação requer confirmação.')}
          >
            Aviso
          </EnhancedButton>
          
          <EnhancedButton 
            variant="error" 
            animation="subtle"
            onClick={() => showToast('error', 'Erro', 'Algo deu errado.')}
          >
            Erro
          </EnhancedButton>
        </div>
      </motion.div>

      {/* Estados de Loading */}
      <motion.div
        {...createStaggerAnimation(0.2)}
        className="space-y-4"
      >
        <h2 className="text-2xl font-semibold">Estados de Loading</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card hover={true}>
            <CardHeader>
              <CardTitle>Spinners</CardTitle>
              <CardDescription>Diferentes tamanhos e cores</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-4">
                <EnhancedSpinner size="sm" color="primary" />
                <EnhancedSpinner size="md" color="success" />
                <EnhancedSpinner size="lg" color="warning" />
              </div>
            </CardContent>
          </Card>

          <Card hover={true}>
            <CardHeader>
              <CardTitle>Loading Dots</CardTitle>
              <CardDescription>Animção de pontos</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-4">
                <LoadingDots size="sm" color="primary" />
                <LoadingDots size="md" color="success" />
                <LoadingDots size="lg" color="warning" />
              </div>
            </CardContent>
          </Card>

          <Card hover={true}>
            <CardHeader>
              <CardTitle>Progress Bar</CardTitle>
              <CardDescription>Barra de progresso animada</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <AnimatedProgress 
                value={progress} 
                showPercentage={true}
                className="w-full"
              />
              <EnhancedButton 
                size="sm" 
                onClick={handleProgressDemo}
                disabled={progress > 0 && progress < 100}
              >
                Iniciar Progresso
              </EnhancedButton>
            </CardContent>
          </Card>
        </div>
      </motion.div>

      {/* Inputs Aprimorados */}
      <motion.div
        {...createStaggerAnimation(0.3)}
        className="space-y-4"
      >
        <h2 className="text-2xl font-semibold">Inputs com Feedback</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card hover={true}>
            <CardHeader>
              <CardTitle>Input com Status</CardTitle>
              <CardDescription>Digite para ver o feedback visual</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <EnhancedInput
                placeholder="Digite seu email..."
                status={inputStatus}
                onChange={handleInputChange}
                className="w-full"
              />
              <div className="text-sm text-muted-foreground">
                <p>• Vazio: Status padrão</p>
                <p>• Menos de 3 caracteres: Aviso</p>
                <p>• Contém @: Sucesso</p>
                <p>• Outros: Erro</p>
              </div>
            </CardContent>
          </Card>

          <Card hover={true}>
            <CardHeader>
              <CardTitle>Botão com Loading</CardTitle>
              <CardDescription>Demonstração de estado de carregamento</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <EnhancedButton
                loading={loading}
                loadingText="Processando..."
                onClick={handleLoadingDemo}
                className="w-full"
              >
                Iniciar Processo
              </EnhancedButton>
            </CardContent>
          </Card>
        </div>
      </motion.div>

      {/* Cards com Hover */}
      <motion.div
        {...createStaggerAnimation(0.4)}
        className="space-y-4"
      >
        <h2 className="text-2xl font-semibold">Cards Interativos</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card hover={true} animation="subtle">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-success" />
                Sucesso
              </CardTitle>
              <CardDescription>Card com hover sutil</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Este card tem uma animação sutil ao passar o mouse.
              </p>
            </CardContent>
          </Card>

          <Card hover={true} animation="default">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-warning" />
                Aviso
              </CardTitle>
              <CardDescription>Card com hover padrão</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Este card tem uma animação mais pronunciada.
              </p>
            </CardContent>
          </Card>

          <Card hover={false}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5 text-primary" />
                Estático
              </CardTitle>
              <CardDescription>Card sem hover</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Este card não tem animação de hover.
              </p>
            </CardContent>
          </Card>
        </div>
      </motion.div>

      {/* Toasts */}
      <EnhancedToaster 
        toasts={toasts} 
        onClose={(id) => setToasts(prev => prev.filter(toast => toast.id !== id))} 
      />
    </div>
  );
};
