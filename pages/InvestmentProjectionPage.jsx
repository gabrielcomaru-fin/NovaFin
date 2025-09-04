import React, { useState, useEffect, useMemo } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input, CurrencyInput } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Zap, Target, PiggyBank, BarChart } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import { useFinance } from '@/contexts/FinanceDataContext';
import { format, getMonth, getYear, startOfMonth, subMonths } from 'date-fns';

export function InvestmentProjectionPage() {
    const { totalInvestmentBalance, investmentGoal, investments } = useFinance();

    const averageMonthlyInvestment = useMemo(() => {
        if (!investments || investments.length === 0) return 0;

        const contributionsByMonth = investments.reduce((acc, inv) => {
            const date = new Date(inv.data);
            const monthKey = format(date, 'yyyy-MM');
            acc[monthKey] = (acc[monthKey] || 0) + inv.valor_aporte;
            return acc;
        }, {});

        const numberOfMonths = Object.keys(contributionsByMonth).length;
        if (numberOfMonths === 0) return 0;

        const totalContributions = Object.values(contributionsByMonth).reduce((sum, amount) => sum + amount, 0);
        return totalContributions / numberOfMonths;
    }, [investments]);

    const [calcData, setCalcData] = useState({
        initialAmount: '',
        monthlyContribution: '',
        goalContribution: '',
        annualRate: '10',
        years: '10'
    });
    
    useEffect(() => {
        setCalcData(prev => ({
            ...prev,
            initialAmount: totalInvestmentBalance.toString(),
            monthlyContribution: averageMonthlyInvestment.toString(),
            goalContribution: investmentGoal.toString()
        }));
    }, [totalInvestmentBalance, averageMonthlyInvestment, investmentGoal]);

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

    const calculateProjection = () => {
        const initial = parseCurrency(calcData.initialAmount);
        const monthlyAverage = parseCurrency(calcData.monthlyContribution);
        const monthlyGoal = parseCurrency(calcData.goalContribution);
        const rate = parseFloat(calcData.annualRate) / 100 / 12;
        const years = parseInt(calcData.years);
        const months = years * 12;

        if (isNaN(rate) || isNaN(months) || months <= 0) {
            setResult(null);
            setChartData([]);
            return;
        }

        let totalAverage = initial;
        let totalGoal = initial;
        const newChartData = [];

        for (let i = 0; i <= months; i++) {
            if (i % 12 === 0 || i === months) {
                newChartData.push({
                    name: `Ano ${Math.floor(i / 12)}`,
                    "Projeção (Média)": parseFloat(totalAverage.toFixed(2)),
                    "Projeção (Meta)": parseFloat(totalGoal.toFixed(2)),
                });
            }
            if (i < months) {
                totalAverage = totalAverage * (1 + rate) + monthlyAverage;
                totalGoal = totalGoal * (1 + rate) + monthlyGoal;
            }
        }

        setResult({
            average: {
                total: totalAverage,
                contributed: initial + (monthlyAverage * months),
                earnings: totalAverage - (initial + (monthlyAverage * months))
            },
            goal: {
                total: totalGoal,
                contributed: initial + (monthlyGoal * months),
                earnings: totalGoal - (initial + (monthlyGoal * months))
            }
        });
        setChartData(newChartData);
    };

    return (
        <>
            <Helmet>
                <title>Projeção de Investimentos - FinanceApp</title>
                <meta name="description" content="Simule o crescimento do seu patrimônio com base em suas metas e rendimentos." />
            </Helmet>
            <div className="space-y-6">
                <h1 className="text-2xl font-bold tracking-tight">Projeção de Investimentos</h1>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Zap className="text-primary"/>Simulador de Patrimônio</CardTitle>
                        <CardDescription>Compare cenários e veja o potencial de crescimento dos seus investimentos.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                            <div className="space-y-2">
                                <Label htmlFor="initialAmount">Patrimônio Inicial (R$)</Label>
                                <CurrencyInput id="initialAmount" value={calcData.initialAmount} onChange={(val) => handleCurrencyChange(val, 'initialAmount')} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="annualRate">Rendimento Anual (%)</Label>
                                <Input id="annualRate" type="number" value={calcData.annualRate} onChange={(e) => setCalcData({ ...calcData, annualRate: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="years">Período (anos)</Label>
                                <Input id="years" type="number" value={calcData.years} onChange={(e) => setCalcData({ ...calcData, years: e.target.value })} />
                            </div>
                            <div className="space-y-2 md:col-span-2 lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="monthlyContribution">Aporte Mensal (Média Atual)</Label>
                                    <CurrencyInput id="monthlyContribution" value={calcData.monthlyContribution} onChange={(val) => handleCurrencyChange(val, 'monthlyContribution')} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="goalContribution">Aporte Mensal (Meta)</Label>
                                    <CurrencyInput id="goalContribution" value={calcData.goalContribution} onChange={(val) => handleCurrencyChange(val, 'goalContribution')} />
                                </div>
                            </div>
                        </div>
                        <Button onClick={calculateProjection} className="w-full">
                            Calcular Projeção Comparativa
                        </Button>
                    </CardContent>
                </Card>

                {result && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-6"
                    >
                        {chartData.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2"><BarChart className="text-primary"/>Comparativo de Projeções</CardTitle>
                                    <CardDescription>Evolução do seu patrimônio: Meta vs. Média de Aportes.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <ResponsiveContainer width="100%" height={350}>
                                        <AreaChart data={chartData}>
                                            <defs>
                                                <linearGradient id="colorGoal" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                                                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                                                </linearGradient>
                                                <linearGradient id="colorAverage" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="hsl(var(--vibrant-accent))" stopOpacity={0.7}/>
                                                    <stop offset="95%" stopColor="hsl(var(--vibrant-accent))" stopOpacity={0}/>
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                            <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                                            <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} tickFormatter={(value) => `R$${value/1000}k`} />
                                            <Tooltip
                                                contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
                                                formatter={(value, name) => [`R$ ${value.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`, name]}
                                            />
                                            <Legend />
                                            <Area type="monotone" dataKey="Projeção (Meta)" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorGoal)" />
                                            <Area type="monotone" dataKey="Projeção (Média)" stroke="hsl(var(--vibrant-accent))" fillOpacity={1} fill="url(#colorAverage)" />
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