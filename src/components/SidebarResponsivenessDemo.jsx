import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/enhanced-card';
import { CheckCircle, ArrowRight, Monitor, Smartphone } from 'lucide-react';

export const SidebarResponsivenessDemo = () => {
  const improvements = [
    {
      title: "Botão de Colapsar Reposicionado",
      description: "O botão agora fica posicionado absolutamente fora do sidebar, evitando overflow",
      icon: CheckCircle,
      details: [
        "Posicionamento absoluto com -right-4",
        "Botão circular com borda",
        "Z-index adequado para ficar sempre visível",
        "Transição suave da rotação do ícone"
      ]
    },
    {
      title: "Conteúdo Adaptativo",
      description: "O conteúdo principal se adapta automaticamente ao estado do sidebar",
      icon: ArrowRight,
      details: [
        "Margin-left dinâmico: 64px (expandido) / 16px (colapsado)",
        "Transição suave de 300ms",
        "Estado sincronizado entre componentes",
        "Responsivo em todas as telas"
      ]
    },
    {
      title: "Responsividade Mobile",
      description: "Comportamento otimizado para dispositivos móveis",
      icon: Smartphone,
      details: [
        "Drawer overlay no mobile",
        "Auto-close ao navegar",
        "Header mobile com menu hambúrguer",
        "Transições spring suaves"
      ]
    },
    {
      title: "Experiência Desktop",
      description: "Sidebar colapsável com ícones e tooltips",
      icon: Monitor,
      details: [
        "Largura: 256px (expandido) / 64px (colapsado)",
        "Ícones sempre visíveis quando colapsado",
        "Texto oculto quando colapsado",
        "Hover effects nos itens de navegação"
      ]
    }
  ];

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-4"
      >
        <h1 className="text-3xl font-bold">Sidebar Responsivo - Melhorias</h1>
        <p className="text-muted-foreground">
          Correções implementadas para melhorar a experiência do usuário
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {improvements.map((improvement, index) => {
          const Icon = improvement.icon;
          return (
            <motion.div
              key={improvement.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card hover={true} animation="subtle">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Icon className="h-5 w-5 text-primary" />
                    {improvement.title}
                  </CardTitle>
                  <CardDescription>
                    {improvement.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {improvement.details.map((detail, detailIndex) => (
                      <motion.li
                        key={detailIndex}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: (index * 0.1) + (detailIndex * 0.05) }}
                        className="flex items-start gap-2 text-sm text-muted-foreground"
                      >
                        <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                        {detail}
                      </motion.li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-success-muted border border-success rounded-lg p-6"
      >
        <h3 className="text-lg font-semibold text-success mb-2">
          ✅ Problemas Resolvidos
        </h3>
        <div className="space-y-2 text-sm">
          <p><strong>1. Botão de colapsar:</strong> Agora fica posicionado corretamente fora do sidebar</p>
          <p><strong>2. Espaço vazio:</strong> O conteúdo principal se adapta automaticamente ao estado colapsado</p>
          <p><strong>3. Responsividade:</strong> Funciona perfeitamente em desktop e mobile</p>
          <p><strong>4. Transições:</strong> Animações suaves em todas as mudanças de estado</p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-info-muted border border-info rounded-lg p-6"
      >
        <h3 className="text-lg font-semibold text-info mb-2">
          🎯 Como Testar
        </h3>
        <div className="space-y-2 text-sm">
          <p><strong>Desktop:</strong> Clique no botão de colapsar (seta) no sidebar para ver a adaptação</p>
          <p><strong>Mobile:</strong> Use o menu hambúrguer para abrir/fechar o drawer</p>
          <p><strong>Navegação:</strong> Teste navegar entre páginas com sidebar colapsado</p>
          <p><strong>Responsividade:</strong> Redimensione a janela para ver as adaptações</p>
        </div>
      </motion.div>
    </div>
  );
};
