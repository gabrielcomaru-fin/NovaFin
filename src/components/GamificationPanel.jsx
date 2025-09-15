import React from 'react';
import { Trophy, Star, Target } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useGamification } from '@/contexts/GamificationContext';
import { useFinance } from '@/contexts/FinanceDataContext';
import { eachMonthOfInterval, startOfMonth, endOfMonth, subMonths, parseISO } from 'date-fns';

export function GamificationPanel() {
  const { points, achievements } = useGamification();
  const { investments, investmentGoal } = useFinance();

  // Streak mensal: meses consecutivos recentes batendo a meta
  const computeMonthlyStreak = () => {
    const goal = Number(investmentGoal) || 0;
    if (!goal) return 0;
    const last12 = eachMonthOfInterval({ start: subMonths(new Date(), 11), end: new Date() });
    const achievedFlags = last12.map((m) => {
      const s = startOfMonth(m), e = endOfMonth(m);
      const invested = investments.filter(i => { const d = parseISO(i.data); return d >= s && d <= e; })
        .reduce((sum, i) => sum + i.valor_aporte, 0);
      return invested >= goal;
    });
    let streak = 0;
    for (let i = achievedFlags.length - 1; i >= 0; i--) {
      if (achievedFlags[i]) streak++; else break;
    }
    return streak;
  };

  const monthlyStreak = computeMonthlyStreak();

  const latestAchievements = [...(achievements || [])]
    .sort((a, b) => new Date(b.unlockedAt) - new Date(a.unlockedAt))
    .slice(0, 3);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Star className="h-4 w-4 text-primary" /> Conquistas
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-3 rounded-md border bg-card">
            <div className="text-xs text-muted-foreground">Pontos</div>
            <div className="text-2xl font-bold mt-1">{points}</div>
          </div>
          <div className="p-3 rounded-md border bg-card">
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <Trophy className="h-4 w-4 text-primary" /> Streak mensal (metas)
            </div>
            <div className="text-2xl font-bold mt-1">{monthlyStreak}m</div>
          </div>
          <div className="p-3 rounded-md border bg-card">
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <Trophy className="h-4 w-4 text-success" /> Conquistas
            </div>
            <div className="text-2xl font-bold mt-1">{achievements?.length || 0}</div>
          </div>
        </div>
        {latestAchievements.length > 0 && (
          <div className="mt-4">
            <div className="text-xs text-muted-foreground mb-2">Recentes</div>
            <div className="grid gap-2">
              {latestAchievements.map(a => (
                <div key={a.id} className="p-2 rounded-md border bg-muted/40 text-sm">
                  <span className="font-medium">{a.title}</span>
                  <span className="text-muted-foreground"> — {a.description}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}


