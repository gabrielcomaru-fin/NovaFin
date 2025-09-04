import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { DollarSign, BarChart, Target, ShieldCheck, Zap, Star } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/SupabaseAuthContext';

const TitleAnimator = ({ text }) => {
  const words = text.split(" ");
  const container = {
    hidden: { opacity: 0 },
    visible: (i = 1) => ({
      opacity: 1,
      transition: { staggerChildren: 0.12, delayChildren: 0.04 * i },
    }),
  };

  const child = {
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        type: "spring",
        damping: 12,
        stiffness: 100,
      },
    },
    hidden: {
      opacity: 0,
      x: 20,
      transition: {
        type: "spring",
        damping: 12,
        stiffness: 100,
      },
    },
  };

  return (
    <motion.h1
      className="text-4xl md:text-6xl font-extrabold tracking-tighter mb-4"
      variants={container}
      initial="hidden"
      animate="visible"
    >
      {words.map((word, index) => (
        <React.Fragment key={index}>
          {word === "Financeira" ? (
            <span className="gradient-text-blue">{word}</span>
          ) : (
            word
          )}
          {index < words.length - 1 && ' '}
        </React.Fragment>
      ))}
    </motion.h1>
  );
};


const TestimonialCarousel = () => {
  const testimonials = [
    {
      name: "Ana P.",
      role: "Designer",
      quote: "Finalmente um app que me ajuda a visualizar meus gastos de forma clara. Atingi minha meta de poupança em 3 meses!"
    },
    {
      name: "Carlos S.",
      role: "Desenvolvedor",
      quote: "A calculadora de juros compostos é uma virada de jogo. Consigo projetar meus investimentos e tomar decisões melhores."
    },
    {
      name: "Mariana F.",
      role: "Autônoma",
      quote: "Organizar minhas finanças era um caos. Com o FinanceApp, tudo ficou mais simples e intuitivo. Recomendo!"
    }
  ];

  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [testimonials.length]);

  return (
    <div className="relative max-w-2xl mx-auto mt-12 h-40">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.5 }}
          className="absolute inset-0 flex flex-col items-center justify-center text-center"
        >
          <p className="text-lg italic text-muted-foreground">"{testimonials[currentIndex].quote}"</p>
          <div className="mt-4">
            <span className="font-semibold">{testimonials[currentIndex].name}</span>
            <span className="text-muted-foreground">, {testimonials[currentIndex].role}</span>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};


export function LandingPage() {
  const { signUp } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const features = [
    {
      icon: <BarChart className="w-8 h-8 text-[hsl(var(--vibrant-accent))]" />,
      title: "Controle Total",
      description: "Monitore seus gastos e receitas. Categorize transações e entenda para onde seu dinheiro está indo."
    },
    {
      icon: <Target className="w-8 h-8 text-[hsl(var(--vibrant-accent))]" />,
      title: "Alcance Suas Metas",
      description: "Defina metas de investimento e tetos de gastos. Acompanhe seu progresso e receba dicas para chegar lá."
    },
    {
      icon: <Zap className="w-8 h-8 text-[hsl(var(--vibrant-accent))]" />,
      title: "Visão de Futuro",
      description: "Use nossa calculadora para projetar o crescimento do seu patrimônio e planejar sua independência financeira."
    },
     {
      icon: <ShieldCheck className="w-8 h-8 text-[hsl(var(--vibrant-accent))]" />,
      title: "Segurança em Primeiro Lugar",
      description: "Seus dados são criptografados e protegidos. Gerencie suas finanças com tranquilidade."
    }
  ];
  
  const handleRegister = async (e) => {
    e.preventDefault();
    const { error } = await signUp({ email, password });
    if (error) {
      toast({
        title: "Erro no Cadastro",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Verifique seu e-mail!",
        description: "Enviamos um link de confirmação para o seu e-mail.",
      });
    }
  };

  return (
    <>
      <Helmet>
        <title>FinanceApp - Transforme sua Vida Financeira</title>
        <meta name="description" content="A ferramenta definitiva para controle de gastos, planejamento de investimentos e educação financeira. Comece hoje a construir seu futuro." />
      </Helmet>
      <div className="min-h-screen bg-background text-foreground">
        <header className="absolute top-0 left-0 right-0 z-20 p-4">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
             <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-primary-foreground" />
                </div>
                <span className="text-xl font-bold">FinanceApp</span>
             </div>
             <Button asChild variant="ghost">
                <Link to="/login">Fazer Login</Link>
             </Button>
          </div>
        </header>

        <main>
          <section className="relative min-h-screen flex items-center justify-center text-center overflow-hidden px-4">
             <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
             <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="z-10"
              >
                <TitleAnimator text="Transforme sua Vida Financeira" />

                <p className="max-w-2xl mx-auto text-lg md:text-xl text-muted-foreground mb-8">
                  A ferramenta definitiva para controle de gastos, planejamento de investimentos e educação financeira. Comece a construir seu futuro hoje.
                </p>
                <div className="flex justify-center gap-4">
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button size="lg" className="gradient-bg-vibrant text-primary-foreground shadow-lg" asChild>
                      <Link to="/register">Comece Agora (É Grátis!)</Link>
                    </Button>
                  </motion.div>
                </div>
                <TestimonialCarousel />
             </motion.div>
          </section>

           <section id="features" className="py-20 md:py-32 bg-secondary">
            <div className="max-w-7xl mx-auto px-4">
              <div className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-bold">Tudo que você precisa para dominar suas finanças</h2>
                <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">Simples, intuitivo e poderoso. Ferramentas que realmente fazem a diferença no seu dia a dia.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {features.map((feature, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 50 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.3 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    whileHover={{ y: -5, transition: { duration: 0.2 } }}
                    className="h-full"
                  >
                    <div className="bg-card p-6 rounded-lg text-left h-full border hover:border-primary/50 transition-colors">
                      <div className="inline-block bg-primary/10 p-3 rounded-full mb-4">
                        {feature.icon}
                      </div>
                      <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                      <p className="text-muted-foreground">{feature.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>
          
           <section className="py-20 md:py-32 bg-background">
              <div className="max-w-4xl mx-auto text-center px-4">
                 <h2 className="text-3xl md:text-4xl font-bold mb-4">Liberdade Financeira ao Seu Alcance</h2>
                 <p className="text-muted-foreground mb-8">Crie sua conta gratuita em segundos e dê o primeiro passo em direção aos seus objetivos.</p>
                 <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.5 }}
                    transition={{ duration: 0.5 }}
                    className="max-w-md mx-auto bg-card border rounded-lg p-6 shadow-xl"
                  >
                    <form onSubmit={handleRegister} className="flex flex-col gap-4">
                      <Input 
                        type="email" 
                        placeholder="Seu melhor e-mail" 
                        className="h-12"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                      <Input 
                        type="password" 
                        placeholder="Crie uma senha forte" 
                        className="h-12"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                      <Button type="submit" size="lg" className="h-12 gradient-bg-vibrant text-primary-foreground">Quero Começar Agora</Button>
                    </form>
                  </motion.div>
              </div>
           </section>
        </main>
        
        <footer className="border-t py-6 bg-secondary">
            <div className="max-w-7xl mx-auto px-4 text-center text-muted-foreground">
                <p>&copy; {new Date().getFullYear()} FinanceApp. Todos os direitos reservados.</p>
            </div>
        </footer>
      </div>
    </>
  );
}