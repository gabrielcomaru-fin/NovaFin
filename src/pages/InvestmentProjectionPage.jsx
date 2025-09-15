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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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

    // Controles do modo simples
    const [simpleRisk, setSimpleRisk] = useState('moderado'); // conservador|moderado|arrojado
    const [simpleHorizon, setSimpleHorizon] = useState(5); // anos: 3|5|10

    // RNG determinístico para Monte Carlo (reprodutível)
    const hashStringToSeed = (str) => {
        let h = 2166136261 >>> 0;
        for (let i = 0; i < str.length; i++) {
            h ^= str.charCodeAt(i);
            h = Math.imul(h, 16777619);
        }
        return h >>> 0;
    };
    const mulberry32 = (seed) => {
        let t = seed >>> 0;
        return () => {
            t += 0x6D2B79F5;
            let r = Math.imul(t ^ (t >>> 15), 1 | t);
            r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
            return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
        };
    };
    const createSeededRandomFromData = (data) => {
        const key = JSON.stringify({
            ia: data.initialAmount,
            mc: data.monthlyContribution,
            gc: data.goalContribution,
            ar: data.annualRate,
            vv: data.volatilityAnnual,
            iaa: data.inflationAnnual,
            cg: data.contributionGrowthAnnual,
            y: data.years,
            ta: data.targetAmount,
            td: data.targetDate,
        });
        return mulberry32(hashStringToSeed(key));
    };

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
        let totalContributionsAvg = 0;
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
                totalContributionsAvg += contribAvg;
            }
        }

        // Monte Carlo – bands p10/p50/p90 (determinístico para as mesmas premissas)
        const simulations = 300; // conservador para performance
        const rng = createSeededRandomFromData(calcData);
        const paths = new Array(months + 1).fill(0).map(() => []);
        for (let s = 0; s < simulations; s++) {
            let value = initial;
            let contrib = monthlyAvg;
            for (let m = 0; m <= months; m++) {
                if (!paths[m]) paths[m] = [];
                paths[m].push(value);
                if (m < months) {
                    // retorno com ruído normal – aproxima GBM discreto
                    const u1 = Math.max(1e-12, rng());
                    const u2 = rng();
                    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
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

        const contributionShare = totalAverage > 0 ? Math.min(100, Math.max(0, (totalContributionsAvg / totalAverage) * 100)) : 0;

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
            composition: {
                contributionShare,
                growthShare: Math.max(0, 100 - contributionShare),
            }
        });
        setChartData(deterministicChart);
        setPercentileData(bands);
    };

    // Helpers determinísticos para comparar cenários e sensibilidade
    const computeDeterministicFinal = (data) => {
        const initial = parseCurrency(data.initialAmount);
        const monthlyAvg = parseCurrency(data.monthlyContribution);
        const annualRate = parseFloat(data.annualRate) / 100;
        const contribGrowth = parseFloat(data.contributionGrowthAnnual) / 100;
        const years = parseInt(data.years);
        const months = years * 12;
        const monthlyMu = Math.pow(1 + annualRate, 1/12) - 1;
        const monthlyContribGrowth = Math.pow(1 + contribGrowth, 1/12) - 1;
        let total = initial;
        let contrib = monthlyAvg;
        let totalContrib = 0;
        for (let m = 0; m < months; m++) {
            total = total * (1 + monthlyMu) + contrib;
            contrib = contrib * (1 + monthlyContribGrowth);
            totalContrib += contrib;
        }
        const contributionShare = total > 0 ? Math.min(100, Math.max(0, (totalContrib / total) * 100)) : 0;
        return { total, contributionShare };
    };

    const computeRequiredMonthly = (data) => {
        const initial = parseCurrency(data.initialAmount);
        const targetAmount = parseCurrency(data.targetAmount) || 0;
        const annualRate = parseFloat(data.annualRate) / 100;
        const years = parseInt(data.years);
        const months = years * 12;
        if (!targetAmount || months <= 0) return null;
        const r = Math.pow(1 + annualRate, 1/12) - 1;
        const n = months;
        const fv0 = initial * Math.pow(1 + r, n);
        const factor = r === 0 ? n : (Math.pow(1 + r, n) - 1) / r;
        return Math.max(0, (targetAmount - fv0) / factor);
    };

    // Cálculo automático do modo simples com presets de risco/horizonte
    const calculateSimple = () => {
        const riskPresets = {
            conservador: { rate: 6, vol: 8 },
            moderado: { rate: 10, vol: 12 },
            arrojado: { rate: 14, vol: 18 },
        };
        const { rate, vol } = riskPresets[simpleRisk] || riskPresets.moderado;
        
        // Sempre usar o horizonte selecionado para data-alvo
        const futureDate = new Date();
        futureDate.setFullYear(futureDate.getFullYear() + simpleHorizon);
        const targetDate = futureDate.toISOString().split('T')[0]; // formato YYYY-MM-DD
        
        const next = {
            initialAmount: (totalInvestmentBalance || 0).toString(),
            monthlyContribution: (averageMonthlyInvestment || 0).toString(),
            goalContribution: (investmentGoal || 0).toString(),
            annualRate: String(rate),
            volatilityAnnual: String(vol),
            inflationAnnual: calcData.inflationAnnual, // manter valor atual
            contributionGrowthAnnual: calcData.contributionGrowthAnnual,
            years: String(simpleHorizon),
            targetAmount: calcData.targetAmount,
            targetDate: targetDate,
        };
        setCalcData(next);
        // calcular diretamente com os novos valores
        calculateProjectionWithData(next);
    };

    // Função auxiliar para calcular com dados específicos
    const calculateProjectionWithData = (data) => {
        const initial = parseCurrency(data.initialAmount);
        const monthlyAvg = parseCurrency(data.monthlyContribution);
        const monthlyGoal = parseCurrency(data.goalContribution);
        const annualRate = parseFloat(data.annualRate) / 100;
        const annualVol = parseFloat(data.volatilityAnnual) / 100;
        const annualInflation = parseFloat(data.inflationAnnual) / 100;
        const contribGrowth = parseFloat(data.contributionGrowthAnnual) / 100;
        const years = parseInt(data.years);
        const months = years * 12;

        const targetAmount = parseCurrency(data.targetAmount) || 0;
        const targetDate = data.targetDate ? new Date(data.targetDate) : null;

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
        let totalContributionsAvg = 0;
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
                totalContributionsAvg += contribAvg;
            }
        }

        // Monte Carlo – bands p10/p50/p90 (determinístico para as mesmas premissas)
        const simulations = 300; // conservador para performance
        const rng = createSeededRandomFromData(data);
        const paths = new Array(months + 1).fill(0).map(() => []);
        for (let s = 0; s < simulations; s++) {
            let value = initial;
            let contrib = monthlyAvg;
            for (let m = 0; m <= months; m++) {
                if (!paths[m]) paths[m] = [];
                paths[m].push(value);
                if (m < months) {
                    // retorno com ruído normal – aproxima GBM discreto
                    const u1 = Math.max(1e-12, rng());
                    const u2 = rng();
                    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
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

        const contributionShare = totalAverage > 0 ? Math.min(100, Math.max(0, (totalContributionsAvg / totalAverage) * 100)) : 0;

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
            composition: {
                contributionShare,
                growthShare: Math.max(0, 100 - contributionShare),
            }
        });
        setChartData(deterministicChart);
        setPercentileData(bands);
    };

    // Recalcular automaticamente quando mudar presets simples ou dados base
    useEffect(() => {
        calculateSimple();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [simpleRisk, simpleHorizon, totalInvestmentBalance, averageMonthlyInvestment, investmentGoal]);

    return (
        <>
            <Helmet>
                <title>Projeção de Investimentos - FinanceApp</title>
                <meta name="description" content="Simule o crescimento do seu patrimônio com base em suas metas e rendimentos." />
            </Helmet>
            <div className="space-y-6">
                <h1 className="text-2xl font-bold tracking-tight">Projeção de Investimentos</h1>

                <Tabs defaultValue="simple">
                    <TabsList className="mb-2">
                        <TabsTrigger value="simple">Simples</TabsTrigger>
                        <TabsTrigger value="advanced">Avançado</TabsTrigger>
                    </TabsList>

                    <TabsContent value="simple">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2"><Zap className="text-primary"/>Projeção Automática</CardTitle>
                                <CardDescription>Usa seu histórico para preencher e simular automaticamente.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                    <div className="space-y-2">
                                        <Label>Perfil de Risco</Label>
                                        <div className="grid grid-cols-3 gap-2">
                                            <Button variant={simpleRisk === 'conservador' ? 'default' : 'secondary'} onClick={() => setSimpleRisk('conservador')}>
                                                <div className="text-center">
                                                    <div className="font-semibold">Conservador</div>
                                                    <div className="text-xs opacity-75">6% a.a.</div>
                                                </div>
                                            </Button>
                                            <Button variant={simpleRisk === 'moderado' ? 'default' : 'secondary'} onClick={() => setSimpleRisk('moderado')}>
                                                <div className="text-center">
                                                    <div className="font-semibold">Moderado</div>
                                                    <div className="text-xs opacity-75">10% a.a.</div>
                                                </div>
                                            </Button>
                                            <Button variant={simpleRisk === 'arrojado' ? 'default' : 'secondary'} onClick={() => setSimpleRisk('arrojado')}>
                                                <div className="text-center">
                                                    <div className="font-semibold">Arrojado</div>
                                                    <div className="text-xs opacity-75">14% a.a.</div>
                                                </div>
                                            </Button>
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            {simpleRisk === 'conservador' && 'Renda fixa, CDB, Tesouro. Menor risco, retorno mais previsível.'}
                                            {simpleRisk === 'moderado' && 'Mistura de renda fixa e variável. Equilíbrio entre risco e retorno.'}
                                            {simpleRisk === 'arrojado' && 'Mais ações, fundos de ações. Maior potencial, mais volatilidade.'}
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Horizonte</Label>
                                        <div className="grid grid-cols-3 gap-2">
                                            <Button variant={simpleHorizon === 3 ? 'default' : 'secondary'} onClick={() => setSimpleHorizon(3)}>3 anos</Button>
                                            <Button variant={simpleHorizon === 5 ? 'default' : 'secondary'} onClick={() => setSimpleHorizon(5)}>5 anos</Button>
                                            <Button variant={simpleHorizon === 10 ? 'default' : 'secondary'} onClick={() => setSimpleHorizon(10)}>10 anos</Button>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="targetAmountSimple">Meta (opcional)</Label>
                                        <CurrencyInput id="targetAmountSimple" value={calcData.targetAmount} onChange={(val) => handleCurrencyChange(val, 'targetAmount')} />
                                    </div>
                                </div>
                                <div className="mb-4">
                                    <Button onClick={calculateSimple} className="w-full">
                                        Atualizar Projeção
                                    </Button>
                                </div>

                                {/* Resumo rápido didático */}
                                {result && (
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                                        <Card>
                                            <CardHeader className="pb-2">
                                                <CardTitle className="text-sm font-medium">Patrimônio estimado no fim</CardTitle>
                                                <CardDescription>Com base no seu histórico</CardDescription>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="text-2xl font-bold">R$ {result.average.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                                            </CardContent>
                                        </Card>
                                        <Card>
                                            <CardHeader className="pb-2">
                                                <CardTitle className="text-sm font-medium">Composição: Aportes vs Rendimentos</CardTitle>
                                                <CardDescription>Quanto vem de disciplina x juros</CardDescription>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="w-full h-3 bg-muted rounded overflow-hidden">
                                                    <div className="h-full bg-primary" style={{ width: `${Math.round(result.composition.contributionShare)}%` }} />
                                                </div>
                                                <div className="text-xs text-muted-foreground mt-2">
                                                    {Math.round(result.composition.contributionShare)}% aportes • {Math.round(result.composition.growthShare)}% rendimentos
                                                </div>
                                            </CardContent>
                                        </Card>
                                        <Card>
                                            <CardHeader className="pb-2">
                                                <CardTitle className="text-sm font-medium">Probabilidade de atingir a meta</CardTitle>
                                                <CardDescription>Se você definiu meta e data</CardDescription>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="text-2xl font-bold">{result.probabilityToTarget === null ? '-' : `${Math.round(result.probabilityToTarget * 100)}%`}</div>
                                                <p className="text-xs text-muted-foreground">Dica: aumentar um pouco o aporte eleva muito a chance.</p>
                                            </CardContent>
                                        </Card>
                                    </div>
                                )}

                                {/* Marcos por ano (tabela simples) */}
                                {chartData.length > 0 && (
                                    <div className="mt-6">
                                        <div className="text-lg font-semibold mb-4 flex items-center gap-2">
                                            <Target className="h-5 w-5 text-primary" />
                                            Marcos por ano
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {chartData.map((row, index) => (
                                                <Card key={row.name} className="relative overflow-hidden">
                                                    <CardHeader className="pb-2">
                                                        <CardTitle className="text-lg font-bold text-primary">
                                                            {row.name}
                                                        </CardTitle>
                                                        <CardDescription>
                                                            {index === 0 ? 'Situação atual' : 
                                                             index === 1 ? 'Primeiro ano' :
                                                             index === 2 ? 'Segundo ano' :
                                                             `Ano ${index}`}
                                                        </CardDescription>
                                                    </CardHeader>
                                                    <CardContent>
                                                        <div className="space-y-3">
                                                            <div className="flex justify-between items-center">
                                                                <span className="text-sm text-muted-foreground">Cenário Média</span>
                                                                <span className="font-bold text-lg">
                                                                    R$ {row['Projeção (Média)'].toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                                                                </span>
                                                            </div>
                                                            <div className="flex justify-between items-center">
                                                                <span className="text-sm text-muted-foreground">Cenário Meta</span>
                                                                <span className="font-bold text-lg text-primary">
                                                                    R$ {row['Projeção (Meta)'].toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                                                                </span>
                                                            </div>
                                                            {index > 0 && (
                                                                <div className="pt-2 border-t">
                                                                    <div className="text-xs text-muted-foreground">
                                                                        Diferença: R$ {(row['Projeção (Meta)'] - row['Projeção (Média)']).toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Dicas rápidas */}
                                {result && (
                                    <div className="mt-6 text-sm text-muted-foreground">
                                        {result.requiredMonthlyContribution !== null ? (
                                            <div>
                                                Para alcançar sua meta no prazo, um aporte de cerca de <span className="font-medium">R$ {result.requiredMonthlyContribution.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/mês</span> seria suficiente (assumindo as premissas).
                                            </div>
                                        ) : (
                                            <div>
                                                Defina uma meta e data-alvo para receber uma sugestão prática de aporte mensal.
                                            </div>
                                        )}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="advanced">
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
                    </TabsContent>
                </Tabs>

                {result && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-6"
                    >
                        {/* Comparativo de cenários e sensibilidade de aporte */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {/* Comparativo de cenários */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2"><BarChart className="h-4 w-4"/>Comparativo de Cenários</CardTitle>
                                    <CardDescription>Estimativa determinística ao fim do horizonte atual.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {(() => {
                                        const presets = [
                                            { key: 'conservador', label: 'Conservador', rate: 6, vol: 8 },
                                            { key: 'moderado', label: 'Moderado', rate: 10, vol: 12 },
                                            { key: 'arrojado', label: 'Arrojado', rate: 14, vol: 18 },
                                        ];
                                        const rows = presets.map(p => {
                                            const data = {
                                                ...calcData,
                                                annualRate: String(p.rate),
                                                volatilityAnnual: String(p.vol),
                                            };
                                            const out = computeDeterministicFinal(data);
                                            return { ...p, total: out.total, contributionShare: out.contributionShare };
                                        });
                                        return (
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                                {rows.map(r => (
                                                    <div key={r.key} className="p-3 rounded border">
                                                        <div className="text-sm text-muted-foreground">{r.label}</div>
                                                        <div className="text-xl font-bold">R$ {r.total.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}</div>
                                                        <div className="mt-2 h-2 bg-muted rounded overflow-hidden">
                                                            <div className="h-full bg-primary" style={{ width: `${Math.round(r.contributionShare)}%` }} />
                                                        </div>
                                                        <div className="text-xs text-muted-foreground mt-1">{Math.round(r.contributionShare)}% aportes</div>
                                                    </div>
                                                ))}
                                            </div>
                                        );
                                    })()}
                                </CardContent>
                            </Card>

                            {/* Sensibilidade de aporte */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2"><PiggyBank className="h-4 w-4"/>Sensibilidade de Aporte</CardTitle>
                                    <CardDescription>Quanto falta por mês para atingir sua meta no prazo.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {(() => {
                                        const required = computeRequiredMonthly(calcData);
                                        if (required === null) {
                                            return <div className="text-sm text-muted-foreground">Defina uma meta (R$) e data-alvo para ver a sugestão de aporte.</div>;
                                        }
                                        const atual = parseFloat(calcData.goalContribution || calcData.monthlyContribution || '0');
                                        const falta = Math.max(0, required - atual);
                                        return (
                                            <div className="space-y-2">
                                                <div className="text-2xl font-semibold">R$ {required.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} / mês</div>
                                                {falta > 0 ? (
                                                    <div className="text-sm text-muted-foreground">Faltam cerca de R$ {falta.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/mês para atingir sua meta no prazo.</div>
                                                ) : (
                                                    <div className="text-sm text-muted-foreground">Você já está no caminho para bater a meta com o aporte atual.</div>
                                                )}
                                            </div>
                                        );
                                    })()}
                                </CardContent>
                            </Card>
                        </div>

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
