import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';

const GamificationContext = createContext(null);

const STORAGE_KEY = 'novaFin_gamification_v1';

const defaultState = {
  points: 0,
  achievements: [],
  history: [], // { date, type, payload }
};

const ACHIEVEMENTS = [
  { id: 'first_deposit', title: 'Primeiro Aporte', description: 'Você registrou seu primeiro aporte!', points: 50, condition: (s) => s.history.some(h => h.type === 'deposit') },
  { id: 'streak_month_3', title: '3 meses seguidos', description: 'Você bateu a meta por 3 meses consecutivos!', points: 80, condition: (s) => (s.monthlyStreak || 0) >= 3 },
  { id: 'streak_month_6', title: '6 meses seguidos', description: 'Você bateu a meta por 6 meses consecutivos!', points: 180, condition: (s) => (s.monthlyStreak || 0) >= 6 },
  { id: 'streak_month_12', title: '12 meses seguidos', description: 'Você bateu a meta por 12 meses consecutivos!', points: 400, condition: (s) => (s.monthlyStreak || 0) >= 12 },
  { id: 'goal_month_hit', title: 'Meta do mês batida', description: 'Você atingiu sua meta mensal de aportes!', points: 100, condition: (s) => s.metaMonthHit === true },
];

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...defaultState };
    const parsed = JSON.parse(raw);
    return { ...defaultState, ...parsed };
  } catch {
    return { ...defaultState };
  }
}

function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
}

export function GamificationProvider({ children }) {
  const { user } = useAuth();
  const [state, setState] = useState(loadState);

  useEffect(() => {
    saveState(state);
  }, [state]);

  // Carregar do Supabase quando logado
  useEffect(() => {
    const loadFromDb = async () => {
      if (!user) return;
      try {
        const { data: g, error } = await supabase
          .from('gamificacao')
          .select('points')
          .eq('usuario_id', user.id)
          .maybeSingle();
        if (!error && g) {
          setState((s) => ({ ...s, points: g.points || 0 }));
        }
        const { data: ach, error: achErr } = await supabase
          .from('gamificacao_conquistas')
          .select('achievement_id, unlocked_at')
          .eq('usuario_id', user.id);
        if (!achErr && Array.isArray(ach)) {
          const byId = new Set(ach.map(a => a.achievement_id));
          setState((s) => ({
            ...s,
            achievements: ACHIEVEMENTS.filter(a => byId.has(a.id)).map(a => ({ ...a, unlockedAt: ach.find(x => x.achievement_id === a.id)?.unlocked_at }))
          }));
        }
      } catch {}
    };
    loadFromDb();
  }, [user]);

  const addPoints = useCallback((amount, reason) => {
    setState((s) => ({
      ...s,
      points: Math.max(0, (s.points || 0) + (amount || 0)),
      history: [...s.history, { date: new Date().toISOString(), type: 'points', payload: { amount, reason } }],
    }));
    (async () => {
      try {
        if (!user) return;
        // Usar o valor mais recente do localStorage como fallback
        const nextPoints = (Number(localStorage.getItem('tmp_points')) || 0) + (amount || 0);
        await supabase.from('gamificacao').upsert({ usuario_id: user.id, points: nextPoints });
      } catch {}
    })();
  }, [user]);

  const registerAction = useCallback((actionType, payload = {}) => {
    setState((prev) => ({
      ...prev,
      history: [...prev.history, { date: new Date().toISOString(), type: actionType, payload }],
    }));
  }, []);

  const evaluateAchievements = useCallback((extras = {}) => {
    setState((prev) => {
      const currentIds = new Set(prev.achievements.map((a) => a.id));
      const temp = { ...prev, ...extras };
      const newlyUnlocked = ACHIEVEMENTS.filter((a) => !currentIds.has(a.id) && a.condition(temp));
      if (newlyUnlocked.length === 0) return prev;
      const pointsEarned = newlyUnlocked.reduce((sum, a) => sum + (a.points || 0), 0);
      const next = {
        ...prev,
        achievements: [...prev.achievements, ...newlyUnlocked.map((a) => ({ ...a, unlockedAt: new Date().toISOString() }))],
        points: prev.points + pointsEarned,
      };
      (async () => {
        try {
          if (!user) return;
          await supabase.from('gamificacao').upsert({ usuario_id: user.id, points: next.points });
          if (newlyUnlocked.length > 0) {
            await supabase.from('gamificacao_conquistas').upsert(newlyUnlocked.map(a => ({ usuario_id: user.id, achievement_id: a.id, unlocked_at: new Date().toISOString() })));
          }
        } catch {}
      })();
      return next;
    });
  }, [user]);

  const value = useMemo(() => ({
    points: state.points,
    achievements: state.achievements,
    addPoints,
    registerAction,
    evaluateAchievements,
    setMetaMonthHit: (hit) => setState((s) => ({ ...s, metaMonthHit: !!hit })),
  }), [state, addPoints, registerAction, evaluateAchievements]);

  return (
    <GamificationContext.Provider value={value}>
      {children}
    </GamificationContext.Provider>
  );
}

export function useGamification() {
  const ctx = useContext(GamificationContext);
  if (!ctx) throw new Error('useGamification must be used within GamificationProvider');
  return ctx;
}


