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
import { format } from 'date-fns';

export function InvestmentProjectionPage() {
    const { investments, investmentGoal } = useFinance();

    const totalInvestmentBalance = useMemo(() => {
        return investments.reduce((sum, investment) => sum + (investment.valor_aporte || 0), 0);
    }, [investments]);

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
        initialAmount: '0',
        monthlyContribution: '0',
        goalContribution: '0',
        annualRate: '10',
        volatilityAnnual: '12',
        inflationAnnual: '4',
        contributionGrowthAnnual: '0',
        years: '10',
        targetAmount: '',
        targetDate: ''
    });
    
    useEffect(() => {
        setCalcData(prev => ({
            ...prev,
            initialAmount: (totalInvestmentBalance || 0).toString(),
            monthlyContribution: (averageMonthlyInvestment || 0).toString(),
            goalContribution: (investmentGoal || 0).toString()
        }));
    }, [totalInvestmentBalance, averageMonthlyInvestment, investmentGoal]);

    const [result, setResult] = useState(null);
    const [chartData, setChartData] = useState([]);
    const [percentileData, setPercentileData] = useState([]);

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
        const monthlyAvg = parseCurrency(calcData.monthlyContribution);
        const monthlyGoal = parseCurrency(calcData.goalContribution);
        const annualRate = parseFloat(calcData.annualRate) / 100;
        const annualVol = parseFloat(calcData.volatilityAnnual) / 100;
        const annualInflation = parseFloat(calcData.inflationAnnual) / 100;
        const contribGrowth = parseFloat(calcData.contributionGrowthAnnual) / 100;
        const years = parseInt(calcData.years);
        const months = years * 12;

        const targetAmount = parseCurrency(calcData.targetAmount) || 0;
        const targetDate = calcData.targetDate ? new Date(calcData.targetDate) : null;

        if (isNaN(months) || months <= 0) {
            setResult(null);
            setChartData([]);
            setPercentileData([]);
            return;
        }

        // Taxas mensais (aproximações) – trabalha em termos nominais; mostramos KPI real quando necessário
        const monthlyMu = Math.pow(1 + annualRate, 1/12) - 1; // retorno médio mensal
        const monthlySigma = annualVol / Math.sqrt(12);
        const monthlyInflation = Math.pow(1 + annualInflation, 1/12) - 1;
        const monthlyContribGrowth = Math.pow(1 + contribGrowth, 1/12) - 1;

        // Série determinística (média e meta)
        let totalAverage = initial;
        let totalGoal = initial;
        let contribAvg = monthlyAvg;
        let contribGoal = monthlyGoal;
        const deterministicChart = [];
        for (let m = 0; m <= months; m++) {
            if (m % 12 === 0 || m === months) {
                deterministicChart.push({
                    name: `Ano ${Math.floor(m / 12)}`,
                    "Projeção (Média)": parseFloat(totalAverage.toFixed(2)),
                    "Projeção (Meta)": parseFloat(totalGoal.toFixed(2)),
                });
            }
            if (m < months) {
                totalAverage = totalAverage * (1 + monthlyMu) + contribAvg;
                totalGoal = totalGoal * (1 + monthlyMu) + contribGoal;
                contribAvg = contribAvg * (1 + monthlyContribGrowth);
                contribGoal = contribGoal * (1 + monthlyContribGrowth);
            }
        }

        // Monte Carlo – bands p10/p50/p90
        const simulations = 300; // conservador para performance
        const paths = new Array(months + 1).fill(0).map(() => []);
        for (let s = 0; s < simulations; s++) {
            let value = initial;
            let contrib = monthlyAvg;
            for (let m = 0; m <= months; m++) {
                if (!paths[m]) paths[m] = [];
                paths[m].push(value);
                if (m < months) {
                    // retorno com ruído normal – aproxima GBM discreto
                    const z = Math.sqrt(-2 * Math.log(Math.random())) * Math.cos(2 * Math.PI * Math.random());
                    const monthlyReturn = monthlyMu + monthlySigma * z;
                    value = value * (1 + monthlyReturn) + contrib;
                    contrib = contrib * (1 + monthlyContribGrowth);
                }
            }
        }
        const percentile = (arr, p) => {
            if (arr.length === 0) return 0;
            const sorted = [...arr].sort((a, b) => a - b);
            const idx = Math.min(sorted.length - 1, Math.max(0, Math.floor((p / 100) * (sorted.length - 1))));
            return sorted[idx];
        };
        const bands = paths.map((vals, i) => ({
            name: i % 12 === 0 || i === months ? `Ano ${Math.floor(i / 12)}` : '',
            p10: percentile(vals, 10),
            p50: percentile(vals, 50),
            p90: percentile(vals, 90),
        })).filter(d => d.name !== '');

        // Probabilidade de bater meta na data alvo
        let probabilityToTarget = null;
        let monthsToTarget = null;
        if (targetAmount > 0 && targetDate) {
            const now = new Date();
            const diffMonths = Math.max(0, Math.round((targetDate.getFullYear() - now.getFullYear()) * 12 + (targetDate.getMonth() - now.getMonth())));
            monthsToTarget = Math.min(diffMonths, months);
            const targetIdx = monthsToTarget;
            const valuesAtTarget = paths[targetIdx] || [];
            const hits = valuesAtTarget.filter(v => v >= targetAmount).length;
            probabilityToTarget = valuesAtTarget.length > 0 ? (hits / valuesAtTarget.length) : null;
        }

        // Aporte necessário (determinístico p50) para atingir a meta no prazo (se existir)
        let requiredMonthlyContribution = null;
        if (targetAmount > 0 && (monthsToTarget !== null)) {
            const r = monthlyMu;
            const n = monthsToTarget;
            const fv0 = initial * Math.pow(1 + r, n);
            const factor = r === 0 ? n : (Math.pow(1 + r, n) - 1) / r;
            requiredMonthlyContribution = Math.max(0, (targetAmount - fv0) / factor);
        }

        setResult({
            average: {
                total: totalAverage,
            },
            goal: {
                total: totalGoal,
            },
            probabilityToTarget,
            requiredMonthlyContribution,
            monthlyInflation,
        });
        setChartData(deterministicChart);
        setPercentileData(bands);
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
                        <CardTitle className="flex items-center gap-2"><Zap className="text-primary"/>Simulador de Patrimônio (Pressupostos)</CardTitle>
                        <CardDescription>Defina premissas e projete seu patrimônio com bandas de incerteza.</CardDescription>
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
                                <Label htmlFor="volatilityAnnual">Volatilidade Anual (%)</Label>
                                <Input id="volatilityAnnual" type="number" value={calcData.volatilityAnnual} onChange={(e) => setCalcData({ ...calcData, volatilityAnnual: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="years">Período (anos)</Label>
                                <Input id="years" type="number" value={calcData.years} onChange={(e) => setCalcData({ ...calcData, years: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="inflationAnnual">Inflação Anual (%)</Label>
                                <Input id="inflationAnnual" type="number" value={calcData.inflationAnnual} onChange={(e) => setCalcData({ ...calcData, inflationAnnual: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="contributionGrowthAnnual">Crescimento do Aporte (% a.a.)</Label>
                                <Input id="contributionGrowthAnnual" type="number" value={calcData.contributionGrowthAnnual} onChange={(e) => setCalcData({ ...calcData, contributionGrowthAnnual: e.target.value })} />
                            </div>
                            <div className="space-y-2 md:col-span-2 lg:col-span-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="monthlyContribution">Aporte Mensal (Média Atual)</Label>
                                    <CurrencyInput id="monthlyContribution" value={calcData.monthlyContribution} onChange={(val) => handleCurrencyChange(val, 'monthlyContribution')} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="goalContribution">Aporte Mensal (Meta)</Label>
                                    <CurrencyInput id="goalContribution" value={calcData.goalContribution} onChange={(val) => handleCurrencyChange(val, 'goalContribution')} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="targetAmount">Meta de Patrimônio (R$)</Label>
                                    <CurrencyInput id="targetAmount" value={calcData.targetAmount} onChange={(val) => handleCurrencyChange(val, 'targetAmount')} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="targetDate">Data-Alvo</Label>
                                    <Input id="targetDate" type="date" value={calcData.targetDate} onChange={(e) => setCalcData({ ...calcData, targetDate: e.target.value })} />
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
                        {/* KPIs de projeção */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium flex items-center gap-2"><PiggyBank className="h-4 w-4"/>Projeção 12m (p50)</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{percentileData[1] ? `R$ ${percentileData[1].p50.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '-'}</div>
                                    <p className="text-xs text-muted-foreground">Faixa: {percentileData[1] ? `R$ ${percentileData[1].p10.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} - R$ ${percentileData[1].p90.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '-'}</p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium flex items-center gap-2"><BarChart className="h-4 w-4"/>Projeção 24m (p50)</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{percentileData[2] ? `R$ ${percentileData[2].p50.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '-'}</div>
                                    <p className="text-xs text-muted-foreground">Faixa: {percentileData[2] ? `R$ ${percentileData[2].p10.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} - R$ ${percentileData[2].p90.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '-'}</p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium flex items-center gap-2"><LineChart className="h-4 w-4"/>Projeção 36m (p50)</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{percentileData[3] ? `R$ ${percentileData[3].p50.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '-'}</div>
                                    <p className="text-xs text-muted-foreground">Faixa: {percentileData[3] ? `R$ ${percentileData[3].p10.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} - R$ ${percentileData[3].p90.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '-'}</p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium flex items-center gap-2"><Target className="h-4 w-4"/>Prob. bater meta</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{result.probabilityToTarget === null ? '-' : `${Math.round(result.probabilityToTarget * 100)}%`}</div>
                                    <p className="text-xs text-muted-foreground">Até a data-alvo informada.</p>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Recomendação de aporte necessário */}
                        {result.requiredMonthlyContribution !== null && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2"><PiggyBank className="text-primary"/>Aporte necessário (estimativa)</CardTitle>
                                    <CardDescription>Para atingir a meta na data-alvo com retorno esperado.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-xl font-semibold">R$ {result.requiredMonthlyContribution.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} / mês</div>
                                    <p className="text-xs text-muted-foreground mt-1">Supondo crescimento do aporte de {calcData.contributionGrowthAnnual}% a.a. e retorno de {calcData.annualRate}% a.a.</p>
                                </CardContent>
                            </Card>
                        )}
                        {chartData.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2"><BarChart className="text-primary"/>Comparativo de Projeções</CardTitle>
                                    <CardDescription>Evolução do seu patrimônio: Meta vs. Média de Aportes e bandas (p10/p50/p90).</CardDescription>
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
                                                <linearGradient id="colorP50" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.7}/>
                                                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
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

                        {percentileData.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2"><LineChart className="text-primary"/>Bandas de Projeção (Monte Carlo)</CardTitle>
                                    <CardDescription>Percentis p10/p50/p90 por ano.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <ResponsiveContainer width="100%" height={350}>
                                        <AreaChart data={percentileData}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                            <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                                            <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} tickFormatter={(value) => `R$${value/1000}k`} />
                                            <Tooltip
                                                contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
                                                formatter={(value, name) => [`R$ ${value.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`, name]}
                                            />
                                            <Legend />
                                            <Area type="monotone" dataKey="p90" name="p90 (otimista)" stroke="#60a5fa" fill="#60a5fa33" />
                                            <Area type="monotone" dataKey="p50" name="p50 (mediano)" stroke="#22c55e" fill="#22c55e33" />
                                            <Area type="monotone" dataKey="p10" name="p10 (pessimista)" stroke="#f59e0b" fill="#f59e0b33" />
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
