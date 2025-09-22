import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input, CurrencyInput } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calculator, LineChart, Target, PiggyBank } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export function CalculatorPage() {
  const [calcData, setCalcData] = useState({
    initialAmount: '',
    monthlyContribution: '',
    annualRate: '10',
    years: '10'
  });
  const [result, setResult] = useState(null);
  const [chartData, setChartData] = useState([]);

  const handleCurrencyChange = (value, field) => {
    setCalcData({ ...calcData, [field]: value });
  };
  
  const parseCurrency = (value) => {
    if (typeof value === 'number') return value;
    if (typeof value === 'string' && value.trim() === '') return 0;
    return parseFloat(String(value).replace(/\./g, '').replace(',', '.'));
  }

  const calculate = () => {
    const initial = parseCurrency(calcData.initialAmount);
    const monthly = parseCurrency(calcData.monthlyContribution);
    const rate = parseFloat(calcData.annualRate) / 100 / 12;
    const years = parseInt(calcData.years);
    const months = years * 12;

    if (isNaN(rate) || isNaN(months) || months <= 0) {
      setResult(null);
      setChartData([]);
      return;
    }

    let total = initial;
    const newChartData = [];
    
    for (let i = 0; i <= months; i++) {
        if (i % 12 === 0 || i === months) {
            newChartData.push({
                name: `Ano ${Math.floor(i / 12)}`,
                "Valor Acumulado": parseFloat(total.toFixed(2)),
            });
        }
        if (i < months) {
          total = total * (1 + rate) + monthly;
        }
    }

    const totalContributed = initial + (monthly * months);
    const earnings = total - totalContributed;

    setResult({
      total,
      totalContributed,
      earnings
    });
    setChartData(newChartData);
  };

  return (
    <>
      <Helmet>
        <title>Calculadora de Juros Compostos - Lumify</title>
        <meta name="description" content="Projete o crescimento dos seus investimentos com a calculadora de juros compostos." />
      </Helmet>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">Calculadora de Juros Compostos</h1>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Calculator className="text-primary"/>Simulador de Juros Compostos</CardTitle>
            <CardDescription>Veja o potencial de crescimento dos seus investimentos ao longo do tempo.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="space-y-2">
                <Label htmlFor="initialAmount">Valor Inicial (R$)</Label>
                <CurrencyInput
                  id="initialAmount"
                  placeholder="0,00"
                  value={calcData.initialAmount}
                  onChange={(value) => handleCurrencyChange(value, 'initialAmount')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="monthlyContribution">Aporte Mensal (R$)</Label>
                <CurrencyInput
                  id="monthlyContribution"
                  placeholder="0,00"
                  value={calcData.monthlyContribution}
                  onChange={(value) => handleCurrencyChange(value, 'monthlyContribution')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="annualRate">Rendimento Anual (%)</Label>
                <Input id="annualRate" type="number" value={calcData.annualRate} onChange={(e) => setCalcData({ ...calcData, annualRate: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="years">Período (anos)</Label>
                <Input id="years" type="number" value={calcData.years} onChange={(e) => setCalcData({ ...calcData, years: e.target.value })} />
              </div>
            </div>
            <Button onClick={calculate} className="w-full">
              Calcular Projeção
            </Button>
          </CardContent>
        </Card>

        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Total Acumulado</CardTitle>
                  <Target className="h-4 w-4 text-muted-foreground"/>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-primary">R$ {result.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Total Aportado</CardTitle>
                  <PiggyBank className="h-4 w-4 text-muted-foreground"/>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">R$ {result.totalContributed.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Juros Acumulados</CardTitle>
                  <LineChart className="h-4 w-4 text-muted-foreground"/>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-green-500">R$ {result.earnings.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                </CardContent>
              </Card>
            </div>
            
            {chartData.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Evolução do Patrimônio</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                      <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} tickFormatter={(value) => `R$${value/1000}k`} />
                      <Tooltip
                         contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
                         formatter={(value) => [`R$ ${value.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`, "Valor"]}
                      />
                      <Area type="monotone" dataKey="Valor Acumulado" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorUv)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </motion.div>
        )}
      </div>
    </>
  );
}