# Phase 5: Psychology & Analytics

## Prerequisites
- Phase 4 completed (Journaling functional)
- Journal data being captured (emotions, rule violations)
- Trade data with P&L calculations
- Analytics DAL already created in Phase 2

## Context
With journaling in place, we can now build the psychology dashboard and analytics views. This phase brings together trade performance data with emotional/behavioral data to provide insights into trading psychology patterns.

**Entering State:** Full trade + journal workflow, no psychology or analytics views
**Exiting State:** Complete psychology dashboard and analytics charts with real data

## Objectives
1. Create psychology IPC handlers and DAL
2. Build psychology metrics calculations
3. Create time-based analysis (day/hour heatmaps)
4. Port Recharts components for performance charts
5. Build psychology dashboard
6. Create analytics page with multiple chart types
7. Implement emotion-performance correlation analysis

---

## Files to Create

| File Path | Purpose | Source Reference |
|-----------|---------|-----------------|
| `src/main/database/dal/psychology.ts` | Psychology metrics DAL | New file |
| `src/main/ipc/psychology.ts` | Psychology IPC handlers | New file |
| `src/renderer/hooks/usePsychologyMetrics.ts` | Psychology metrics hook | `lib/hooks/usePsychologyMetrics.ts` |
| `src/renderer/hooks/useTimeAnalytics.ts` | Time-based analytics hook | `lib/hooks/useTimeAnalytics.ts` |
| `src/renderer/components/analytics/TimeHeatmap.tsx` | Day/hour heatmap | `components/analytics/TimeHeatmap.tsx` |
| `src/renderer/components/analytics/PerformanceChart.tsx` | Line/bar charts | `components/dashboard/PerformanceChart.tsx` |
| `src/renderer/components/analytics/EmotionCorrelation.tsx` | Emotion vs P&L | New file |
| `src/renderer/components/psychology/DisciplineScore.tsx` | Discipline metrics | New file |
| `src/renderer/components/psychology/EmotionTrends.tsx` | Emotion patterns | New file |
| `src/renderer/components/psychology/RuleAdherence.tsx` | Rule following stats | New file |
| `src/renderer/components/dashboard/EquityCurve.tsx` | Equity curve chart | `components/dashboard/EquityCurve.tsx` |
| `src/renderer/pages/Psychology.tsx` | Psychology dashboard | New file |
| `src/renderer/pages/Analytics.tsx` | Analytics page | New file |

## Files to Modify

| File Path | Modifications |
|-----------|--------------|
| `src/main/ipc/index.ts` | Register psychology handlers |
| `src/main/preload.ts` | Add psychology API methods |
| `src/renderer/App.tsx` | Add psychology and analytics routes |

---

## Detailed Instructions

### Task 5.1: Create Psychology DAL

**Step 1:** Create `src/main/database/dal/psychology.ts`:
```typescript
import { db } from '../connection';

export interface PsychologyMetrics {
  period_start: string;
  period_end: string;
  total_trades: number;
  trades_with_journals: number;
  discipline_score: number;
  rule_adherence_rate: number;
  fomo_trade_count: number;
  revenge_trade_count: number;
  most_common_pre_emotion: string | null;
  most_common_post_emotion: string | null;
  emotional_volatility: number;
  disciplined_trade_win_rate: number;
  fomo_trade_win_rate: number;
  emotion_performance: EmotionPerformance[];
}

export interface EmotionPerformance {
  emotion: string;
  trade_count: number;
  win_rate: number;
  avg_pnl: number;
  total_pnl: number;
}

export interface TimeSlotData {
  dayOfWeek: number;
  hour?: number;
  tradeCount: number;
  winRate: number;
  avgPnl: number;
  totalPnl: number;
}

type PeriodType = 'week' | 'month' | 'all';

function getPeriodDates(period: PeriodType): { start: string; end: string } {
  const end = new Date();
  let start: Date;
  
  switch (period) {
    case 'week':
      start = new Date(end);
      start.setDate(start.getDate() - 7);
      break;
    case 'month':
      start = new Date(end);
      start.setMonth(start.getMonth() - 1);
      break;
    case 'all':
    default:
      start = new Date('2020-01-01');
      break;
  }
  
  return {
    start: start.toISOString(),
    end: end.toISOString(),
  };
}

export const psychologyDAL = {
  getPsychologyMetrics(period: PeriodType = 'week'): PsychologyMetrics {
    const { start, end } = getPeriodDates(period);
    
    // Get total trades in period
    const totalTradesStmt = db.prepare(`
      SELECT COUNT(*) as count 
      FROM trades 
      WHERE entry_date >= ? AND entry_date <= ?
    `);
    const totalTrades = (totalTradesStmt.get(start, end) as any).count;
    
    // Get trades with journals
    const journaledTradesStmt = db.prepare(`
      SELECT COUNT(DISTINCT t.id) as count
      FROM trades t
      INNER JOIN pre_trade_journals ptj ON ptj.trade_id = t.id
      WHERE t.entry_date >= ? AND t.entry_date <= ?
    `);
    const tradesWithJournals = (journaledTradesStmt.get(start, end) as any).count;
    
    // Get rule adherence rate
    const ruleAdherenceStmt = db.prepare(`
      SELECT 
        COUNT(CASE WHEN postj.followed_plan = 1 THEN 1 END) as followed,
        COUNT(*) as total
      FROM trades t
      INNER JOIN post_trade_journals postj ON postj.trade_id = t.id
      WHERE t.entry_date >= ? AND t.entry_date <= ?
    `);
    const adherence = ruleAdherenceStmt.get(start, end) as any;
    const ruleAdherenceRate = adherence.total > 0 
      ? (adherence.followed / adherence.total) * 100 
      : 0;
    
    // Get FOMO and revenge trade counts
    const emotionCountsStmt = db.prepare(`
      SELECT 
        SUM(CASE WHEN ptj.emotional_state LIKE '%fomo%' THEN 1 ELSE 0 END) as fomo_count,
        SUM(CASE WHEN ptj.emotional_state LIKE '%revenge%' THEN 1 ELSE 0 END) as revenge_count
      FROM trades t
      INNER JOIN pre_trade_journals ptj ON ptj.trade_id = t.id
      WHERE t.entry_date >= ? AND t.entry_date <= ?
    `);
    const emotionCounts = emotionCountsStmt.get(start, end) as any;
    
    // Get disciplined trade win rate
    const disciplinedWinRateStmt = db.prepare(`
      SELECT 
        COUNT(CASE WHEN t.net_pnl > 0 THEN 1 END) as wins,
        COUNT(*) as total
      FROM trades t
      INNER JOIN pre_trade_journals ptj ON ptj.trade_id = t.id
      WHERE t.entry_date >= ? AND t.entry_date <= ?
        AND ptj.emotional_state LIKE '%disciplined%'
        AND t.net_pnl IS NOT NULL
    `);
    const disciplinedStats = disciplinedWinRateStmt.get(start, end) as any;
    const disciplinedWinRate = disciplinedStats.total > 0
      ? (disciplinedStats.wins / disciplinedStats.total) * 100
      : 0;
    
    // Get FOMO trade win rate
    const fomoWinRateStmt = db.prepare(`
      SELECT 
        COUNT(CASE WHEN t.net_pnl > 0 THEN 1 END) as wins,
        COUNT(*) as total
      FROM trades t
      INNER JOIN pre_trade_journals ptj ON ptj.trade_id = t.id
      WHERE t.entry_date >= ? AND t.entry_date <= ?
        AND ptj.emotional_state LIKE '%fomo%'
        AND t.net_pnl IS NOT NULL
    `);
    const fomoStats = fomoWinRateStmt.get(start, end) as any;
    const fomoWinRate = fomoStats.total > 0
      ? (fomoStats.wins / fomoStats.total) * 100
      : 0;
    
    // Calculate discipline score (composite metric)
    const journalRate = totalTrades > 0 ? (tradesWithJournals / totalTrades) * 100 : 0;
    const fomoRate = totalTrades > 0 ? ((emotionCounts.fomo_count || 0) / totalTrades) * 100 : 0;
    const revengeRate = totalTrades > 0 ? ((emotionCounts.revenge_count || 0) / totalTrades) * 100 : 0;
    
    // Discipline score: journal rate + rule adherence - fomo rate - revenge rate
    const disciplineScore = Math.max(0, Math.min(100, 
      (journalRate * 0.3) + (ruleAdherenceRate * 0.4) - (fomoRate * 0.15) - (revengeRate * 0.15)
    ));
    
    // Get emotion performance breakdown
    const emotionPerformance = this.getEmotionPerformance(start, end);
    
    return {
      period_start: start,
      period_end: end,
      total_trades: totalTrades,
      trades_with_journals: tradesWithJournals,
      discipline_score: Math.round(disciplineScore),
      rule_adherence_rate: Math.round(ruleAdherenceRate),
      fomo_trade_count: emotionCounts.fomo_count || 0,
      revenge_trade_count: emotionCounts.revenge_count || 0,
      most_common_pre_emotion: this.getMostCommonEmotion(start, end, 'pre'),
      most_common_post_emotion: this.getMostCommonEmotion(start, end, 'post'),
      emotional_volatility: this.calculateEmotionalVolatility(start, end),
      disciplined_trade_win_rate: Math.round(disciplinedWinRate),
      fomo_trade_win_rate: Math.round(fomoWinRate),
      emotion_performance: emotionPerformance,
    };
  },
  
  getMostCommonEmotion(start: string, end: string, type: 'pre' | 'post'): string | null {
    const table = type === 'pre' ? 'pre_trade_journals' : 'post_trade_journals';
    const stmt = db.prepare(`
      SELECT emotional_state
      FROM ${table} j
      INNER JOIN trades t ON j.trade_id = t.id
      WHERE t.entry_date >= ? AND t.entry_date <= ?
    `);
    
    const journals = stmt.all(start, end) as any[];
    const emotionCounts: Record<string, number> = {};
    
    journals.forEach(j => {
      try {
        const emotions = JSON.parse(j.emotional_state || '[]');
        emotions.forEach((e: string) => {
          emotionCounts[e] = (emotionCounts[e] || 0) + 1;
        });
      } catch {
        // Skip malformed data
      }
    });
    
    let maxEmotion: string | null = null;
    let maxCount = 0;
    
    Object.entries(emotionCounts).forEach(([emotion, count]) => {
      if (count > maxCount) {
        maxCount = count;
        maxEmotion = emotion;
      }
    });
    
    return maxEmotion;
  },
  
  calculateEmotionalVolatility(start: string, end: string): number {
    const stmt = db.prepare(`
      SELECT ptj.emotional_score
      FROM pre_trade_journals ptj
      INNER JOIN trades t ON ptj.trade_id = t.id
      WHERE t.entry_date >= ? AND t.entry_date <= ?
        AND ptj.emotional_score IS NOT NULL
    `);
    
    const scores = stmt.all(start, end) as any[];
    if (scores.length < 2) return 0;
    
    const values = scores.map(s => s.emotional_score);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    
    return Math.round(Math.sqrt(variance) * 10); // Scale to 0-100
  },
  
  getEmotionPerformance(start: string, end: string): EmotionPerformance[] {
    const stmt = db.prepare(`
      SELECT 
        ptj.emotional_state,
        t.net_pnl
      FROM trades t
      INNER JOIN pre_trade_journals ptj ON ptj.trade_id = t.id
      WHERE t.entry_date >= ? AND t.entry_date <= ?
        AND t.net_pnl IS NOT NULL
    `);
    
    const trades = stmt.all(start, end) as any[];
    const emotionStats: Record<string, { trades: number; wins: number; totalPnl: number }> = {};
    
    trades.forEach(trade => {
      try {
        const emotions = JSON.parse(trade.emotional_state || '[]');
        emotions.forEach((emotion: string) => {
          if (!emotionStats[emotion]) {
            emotionStats[emotion] = { trades: 0, wins: 0, totalPnl: 0 };
          }
          emotionStats[emotion].trades++;
          if (trade.net_pnl > 0) emotionStats[emotion].wins++;
          emotionStats[emotion].totalPnl += trade.net_pnl;
        });
      } catch {
        // Skip malformed data
      }
    });
    
    return Object.entries(emotionStats).map(([emotion, stats]) => ({
      emotion,
      trade_count: stats.trades,
      win_rate: stats.trades > 0 ? Math.round((stats.wins / stats.trades) * 100) : 0,
      avg_pnl: stats.trades > 0 ? Math.round(stats.totalPnl / stats.trades) : 0,
      total_pnl: Math.round(stats.totalPnl),
    })).sort((a, b) => b.trade_count - a.trade_count);
  },
  
  getTimeHeatmapData(period: 'day' | 'hour'): TimeSlotData[] {
    if (period === 'day') {
      // Get performance by day of week
      const stmt = db.prepare(`
        SELECT 
          day_of_week,
          COUNT(*) as trade_count,
          SUM(CASE WHEN net_pnl > 0 THEN 1 ELSE 0 END) as wins,
          AVG(net_pnl) as avg_pnl,
          SUM(net_pnl) as total_pnl
        FROM trades
        WHERE net_pnl IS NOT NULL AND day_of_week IS NOT NULL
        GROUP BY day_of_week
      `);
      
      const data = stmt.all() as any[];
      return data.map(row => ({
        dayOfWeek: row.day_of_week,
        tradeCount: row.trade_count,
        winRate: row.trade_count > 0 ? Math.round((row.wins / row.trade_count) * 100) : 0,
        avgPnl: Math.round(row.avg_pnl || 0),
        totalPnl: Math.round(row.total_pnl || 0),
      }));
    } else {
      // Get performance by day and hour
      const stmt = db.prepare(`
        SELECT 
          day_of_week,
          hour_of_day,
          COUNT(*) as trade_count,
          SUM(CASE WHEN net_pnl > 0 THEN 1 ELSE 0 END) as wins,
          AVG(net_pnl) as avg_pnl,
          SUM(net_pnl) as total_pnl
        FROM trades
        WHERE net_pnl IS NOT NULL 
          AND day_of_week IS NOT NULL 
          AND hour_of_day IS NOT NULL
        GROUP BY day_of_week, hour_of_day
      `);
      
      const data = stmt.all() as any[];
      return data.map(row => ({
        dayOfWeek: row.day_of_week,
        hour: row.hour_of_day,
        tradeCount: row.trade_count,
        winRate: row.trade_count > 0 ? Math.round((row.wins / row.trade_count) * 100) : 0,
        avgPnl: Math.round(row.avg_pnl || 0),
        totalPnl: Math.round(row.total_pnl || 0),
      }));
    }
  },
  
  getRuleViolationStats(start: string, end: string) {
    const stmt = db.prepare(`
      SELECT postj.rule_violations
      FROM post_trade_journals postj
      INNER JOIN trades t ON postj.trade_id = t.id
      WHERE t.entry_date >= ? AND t.entry_date <= ?
        AND postj.rule_violations IS NOT NULL
    `);
    
    const journals = stmt.all(start, end) as any[];
    const violationCounts: Record<string, number> = {};
    
    journals.forEach(j => {
      try {
        const violations = JSON.parse(j.rule_violations || '[]');
        violations.forEach((v: string) => {
          violationCounts[v] = (violationCounts[v] || 0) + 1;
        });
      } catch {
        // Skip malformed data
      }
    });
    
    return Object.entries(violationCounts)
      .map(([violation, count]) => ({ violation, count }))
      .sort((a, b) => b.count - a.count);
  },
};
```

**Step 2:** Update `src/main/database/dal/index.ts`:
```typescript
export { tradesDAL } from './trades';
export { strategiesDAL } from './strategies';
export { analyticsDAL } from './analytics';
export { gamificationDAL } from './gamification';
export { journalsDAL, type CreatePreTradeJournalInput, type CreatePostTradeJournalInput } from './journals';
export { psychologyDAL, type PsychologyMetrics, type EmotionPerformance, type TimeSlotData } from './psychology';
```

---

### Task 5.2: Create Psychology IPC Handlers

**Step 1:** Create `src/main/ipc/psychology.ts`:
```typescript
import { ipcMain } from 'electron';
import { psychologyDAL } from '../database/dal';

type PeriodType = 'week' | 'month' | 'all';

export function registerPsychologyHandlers(): void {
  ipcMain.handle('psychology:getMetrics', async (_, period: PeriodType = 'week') => {
    try {
      const metrics = psychologyDAL.getPsychologyMetrics(period);
      return { data: metrics, error: null };
    } catch (error) {
      console.error('Error in psychology:getMetrics:', error);
      return { data: null, error: (error as Error).message };
    }
  });
  
  ipcMain.handle('psychology:getTimeHeatmap', async (_, period: 'day' | 'hour') => {
    try {
      const data = psychologyDAL.getTimeHeatmapData(period);
      return { data, error: null };
    } catch (error) {
      console.error('Error in psychology:getTimeHeatmap:', error);
      return { data: null, error: (error as Error).message };
    }
  });
  
  ipcMain.handle('psychology:getEmotionPerformance', async (_, startDate?: string, endDate?: string) => {
    try {
      const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const end = endDate || new Date().toISOString();
      const data = psychologyDAL.getEmotionPerformance(start, end);
      return { data, error: null };
    } catch (error) {
      console.error('Error in psychology:getEmotionPerformance:', error);
      return { data: null, error: (error as Error).message };
    }
  });
  
  ipcMain.handle('psychology:getRuleViolations', async (_, startDate?: string, endDate?: string) => {
    try {
      const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const end = endDate || new Date().toISOString();
      const data = psychologyDAL.getRuleViolationStats(start, end);
      return { data, error: null };
    } catch (error) {
      console.error('Error in psychology:getRuleViolations:', error);
      return { data: null, error: (error as Error).message };
    }
  });
}
```

**Step 2:** Update `src/main/ipc/index.ts`:
```typescript
import { registerTradeHandlers } from './trades';
import { registerStrategyHandlers } from './strategies';
import { registerAnalyticsHandlers } from './analytics';
import { registerJournalHandlers } from './journals';
import { registerPsychologyHandlers } from './psychology';

export function registerAllIPCHandlers(): void {
  console.log('Registering IPC handlers...');
  
  registerTradeHandlers();
  registerStrategyHandlers();
  registerAnalyticsHandlers();
  registerJournalHandlers();
  registerPsychologyHandlers();
  
  console.log('IPC handlers registered');
}
```

---

### Task 5.3: Update Preload Script

**Step 1:** Add to `src/main/preload.ts`:
```typescript
// Add to electronAPI object:
psychology: {
  getMetrics: (period) => ipcRenderer.invoke('psychology:getMetrics', period),
  getTimeHeatmap: (period) => ipcRenderer.invoke('psychology:getTimeHeatmap', period),
  getEmotionPerformance: (start, end) => ipcRenderer.invoke('psychology:getEmotionPerformance', start, end),
  getRuleViolations: (start, end) => ipcRenderer.invoke('psychology:getRuleViolations', start, end),
},
```

---

### Task 5.4: Create usePsychologyMetrics Hook

**Step 1:** Create `src/renderer/hooks/usePsychologyMetrics.ts`:
```typescript
import { useState, useEffect, useCallback } from 'react';
import type { APIResponse } from '../types';

export interface PsychologyMetrics {
  period_start: string;
  period_end: string;
  total_trades: number;
  trades_with_journals: number;
  discipline_score: number;
  rule_adherence_rate: number;
  fomo_trade_count: number;
  revenge_trade_count: number;
  most_common_pre_emotion: string | null;
  most_common_post_emotion: string | null;
  emotional_volatility: number;
  disciplined_trade_win_rate: number;
  fomo_trade_win_rate: number;
  emotion_performance: EmotionPerformance[];
}

export interface EmotionPerformance {
  emotion: string;
  trade_count: number;
  win_rate: number;
  avg_pnl: number;
  total_pnl: number;
}

export type PeriodType = 'week' | 'month' | 'all';

export function usePsychologyMetrics(initialPeriod: PeriodType = 'week') {
  const [data, setData] = useState<PsychologyMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<PeriodType>(initialPeriod);

  const fetchMetrics = useCallback(async (currentPeriod: PeriodType) => {
    setLoading(true);
    setError(null);
    
    try {
      const response: APIResponse<PsychologyMetrics> = await window.electronAPI.psychology.getMetrics(currentPeriod);
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      setData(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch psychology metrics');
      console.error('Failed to fetch psychology metrics:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMetrics(period);
  }, [period, fetchMetrics]);

  const changePeriod = useCallback((newPeriod: PeriodType) => {
    setPeriod(newPeriod);
  }, []);

  const refresh = useCallback(() => {
    fetchMetrics(period);
  }, [period, fetchMetrics]);

  return {
    data,
    loading,
    error,
    period,
    changePeriod,
    refresh,
  };
}
```

---

### Task 5.5: Create useTimeAnalytics Hook

**Step 1:** Create `src/renderer/hooks/useTimeAnalytics.ts`:
```typescript
import { useState, useEffect, useCallback } from 'react';
import type { APIResponse } from '../types';

export interface TimeSlotData {
  dayOfWeek: number;
  hour?: number;
  tradeCount: number;
  winRate: number;
  avgPnl: number;
  totalPnl: number;
}

interface UseTimeAnalyticsOptions {
  period: 'day' | 'hour';
  startDate?: string;
  endDate?: string;
}

export function useTimeAnalytics(options: UseTimeAnalyticsOptions) {
  const [heatmapData, setHeatmapData] = useState<TimeSlotData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response: APIResponse<TimeSlotData[]> = await window.electronAPI.psychology.getTimeHeatmap(options.period);
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      setHeatmapData(response.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch time analytics');
      console.error('Failed to fetch time analytics:', err);
    } finally {
      setLoading(false);
    }
  }, [options.period]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    heatmapData,
    loading,
    error,
    refresh: fetchData,
  };
}
```

---

### Task 5.6: Create TimeHeatmap Component

**Step 1:** Create `src/renderer/components/analytics/TimeHeatmap.tsx`:
```tsx
import React, { useMemo, useState } from 'react';
import { useTimeAnalytics, type TimeSlotData } from '@/hooks/useTimeAnalytics';
import { cn } from '@/lib/utils/cn';

interface TimeHeatmapProps {
  period: 'day' | 'hour';
  onCellClick?: (data: TimeSlotData) => void;
}

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const TRADING_HOURS = Array.from({ length: 8 }, (_, i) => i + 9); // 9am - 4pm

export function TimeHeatmap({ period, onCellClick }: TimeHeatmapProps) {
  const { heatmapData, loading, error } = useTimeAnalytics({ period });

  const getColor = (winRate: number, tradeCount: number): string => {
    if (tradeCount === 0) return '#1f2937'; // bg-gray-800
    
    // Opacity based on sample size
    const opacity = tradeCount < 5 ? '4D' : ''; // 30% if few trades
    
    if (winRate < 40) return `#ef4444${opacity}`; // red
    if (winRate < 60) return `#f59e0b${opacity}`; // yellow
    return `#10b981${opacity}`; // green
  };

  const getCellData = (day: number, hour?: number): TimeSlotData | null => {
    if (period === 'day') {
      return heatmapData.find(d => d.dayOfWeek === day) || null;
    }
    return heatmapData.find(d => d.dayOfWeek === day && d.hour === hour) || null;
  };

  const formatPnl = (pnl: number) => {
    const sign = pnl >= 0 ? '+' : '';
    return `${sign}$${pnl.toFixed(0)}`;
  };

  if (loading) {
    return (
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Time Performance Heatmap</h3>
        <div className="h-64 animate-pulse bg-background-secondary rounded" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Time Performance Heatmap</h3>
        <div className="h-64 flex items-center justify-center text-muted-foreground">
          Failed to load heatmap data
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <h3 className="text-lg font-semibold mb-4">
        Time Performance Heatmap
        <span className="text-sm font-normal text-muted-foreground ml-2">
          ({period === 'day' ? 'By Day of Week' : 'By Hour & Day'})
        </span>
      </h3>

      {period === 'day' ? (
        <div className="space-y-4">
          <div className="grid grid-cols-7 gap-2">
            {DAY_LABELS.map((day, idx) => {
              const data = getCellData(idx);
              return (
                <div key={idx} className="text-center">
                  <div className="text-xs font-medium mb-1 text-muted-foreground">{day}</div>
                  <div
                    className="relative rounded-lg p-4 cursor-pointer hover:ring-2 hover:ring-primary transition-all"
                    style={{ backgroundColor: getColor(data?.winRate || 0, data?.tradeCount || 0) }}
                    onClick={() => data && onCellClick?.(data)}
                    title={data
                      ? `Win Rate: ${data.winRate}%\nTrades: ${data.tradeCount}\nAvg P&L: ${formatPnl(data.avgPnl)}`
                      : 'No data'
                    }
                  >
                    {data ? (
                      <div className="space-y-1">
                        <div className="text-lg font-bold text-white">{data.winRate}%</div>
                        <div className="text-xs text-white/80">{data.tradeCount} trades</div>
                        <div className="text-xs font-semibold text-white">{formatPnl(data.avgPnl)}</div>
                      </div>
                    ) : (
                      <div className="text-xs text-muted-foreground py-4">No data</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <HeatmapLegend />
        </div>
      ) : (
        <div className="space-y-4 overflow-x-auto">
          <div className="min-w-max">
            {/* Header row with hour labels */}
            <div className="grid gap-1 mb-2" style={{ gridTemplateColumns: '80px repeat(8, 1fr)' }}>
              <div /> {/* Empty corner */}
              {TRADING_HOURS.map((hour) => (
                <div key={hour} className="text-xs font-medium text-center text-muted-foreground">
                  {hour % 12 || 12}{hour >= 12 ? 'pm' : 'am'}
                </div>
              ))}
            </div>

            {/* Data rows */}
            {DAY_LABELS.map((day, dayIdx) => (
              <div
                key={dayIdx}
                className="grid gap-1 mb-1"
                style={{ gridTemplateColumns: '80px repeat(8, 1fr)' }}
              >
                <div className="text-xs font-medium flex items-center text-muted-foreground">
                  {day}
                </div>
                {TRADING_HOURS.map((hour) => {
                  const data = getCellData(dayIdx, hour);
                  return (
                    <div
                      key={hour}
                      className="relative rounded p-2 cursor-pointer hover:ring-2 hover:ring-primary transition-all min-h-[60px] flex items-center justify-center"
                      style={{ backgroundColor: getColor(data?.winRate || 0, data?.tradeCount || 0) }}
                      onClick={() => data && onCellClick?.(data)}
                      title={data
                        ? `Win Rate: ${data.winRate}%\nTrades: ${data.tradeCount}\nAvg P&L: ${formatPnl(data.avgPnl)}`
                        : 'No data'
                      }
                    >
                      {data ? (
                        <div className="text-center">
                          <div className="text-sm font-bold text-white">{data.winRate}%</div>
                          <div className="text-[10px] text-white/70">{data.tradeCount}t</div>
                        </div>
                      ) : (
                        <div className="text-[10px] text-muted-foreground">-</div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
          <HeatmapLegend />
        </div>
      )}
    </div>
  );
}

function HeatmapLegend() {
  return (
    <div className="flex items-center justify-center gap-4 pt-2 border-t border-border">
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 rounded" style={{ backgroundColor: '#ef4444' }} />
        <span className="text-xs text-muted-foreground">Poor (&lt;40%)</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 rounded" style={{ backgroundColor: '#f59e0b' }} />
        <span className="text-xs text-muted-foreground">Average (40-60%)</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 rounded" style={{ backgroundColor: '#10b981' }} />
        <span className="text-xs text-muted-foreground">Good (&gt;60%)</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 rounded opacity-30" style={{ backgroundColor: '#10b981' }} />
        <span className="text-xs text-muted-foreground">&lt;5 trades</span>
      </div>
    </div>
  );
}
```

---

### Task 5.7: Create EquityCurve Component

**Step 1:** Install Recharts (should already be in dependencies from Phase 1, if not add it):
```bash
npm install recharts
```

**Step 2:** Create `src/renderer/components/dashboard/EquityCurve.tsx`:
```tsx
import React, { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { formatCurrency } from '@/lib/utils/formatting';
import type { APIResponse } from '@/types';

interface EquityCurveData {
  date: string;
  cumulative_pnl: number;
  trade_count: number;
}

export function EquityCurve() {
  const [data, setData] = useState<EquityCurveData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response: APIResponse<EquityCurveData[]> = await window.electronAPI.analytics.getEquityCurve();
        if (response.data) {
          setData(response.data);
        }
      } catch (error) {
        console.error('Failed to fetch equity curve:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Equity Curve</h3>
        <div className="h-64 animate-pulse bg-background-secondary rounded" />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Equity Curve</h3>
        <div className="h-64 flex items-center justify-center text-muted-foreground">
          No trade data available
        </div>
      </div>
    );
  }

  const lastValue = data[data.length - 1]?.cumulative_pnl || 0;
  const isPositive = lastValue >= 0;

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Equity Curve</h3>
        <span className={`text-lg font-mono font-bold ${isPositive ? 'text-profit' : 'text-loss'}`}>
          {formatCurrency(lastValue)}
        </span>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis
              dataKey="date"
              tick={{ fill: '#9ca3af', fontSize: 11 }}
              tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              stroke="#4b5563"
            />
            <YAxis
              tick={{ fill: '#9ca3af', fontSize: 11 }}
              tickFormatter={(value) => `$${value.toLocaleString()}`}
              stroke="#4b5563"
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1f2937',
                border: '1px solid #374151',
                borderRadius: '6px',
              }}
              labelFormatter={(value) => new Date(value).toLocaleDateString()}
              formatter={(value: number) => [formatCurrency(value), 'P&L']}
            />
            <ReferenceLine y={0} stroke="#6b7280" strokeDasharray="3 3" />
            <Line
              type="monotone"
              dataKey="cumulative_pnl"
              stroke={isPositive ? '#10b981' : '#ef4444'}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: isPositive ? '#10b981' : '#ef4444' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
```

---

### Task 5.8: Create EmotionCorrelation Component

**Step 1:** Create `src/renderer/components/analytics/EmotionCorrelation.tsx`:
```tsx
import React, { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { formatCurrency } from '@/lib/utils/formatting';
import type { APIResponse } from '@/types';
import type { EmotionPerformance } from '@/hooks/usePsychologyMetrics';

const EMOTION_EMOJIS: Record<string, string> = {
  confident: '💪',
  anxious: '😰',
  neutral: '😐',
  fomo: '😱',
  revenge: '😤',
  overconfident: '🤩',
  disciplined: '🎯',
  patient: '🧘',
  frustrated: '😣',
  fearful: '😨',
  greedy: '🤑',
  impulsive: '⚡',
};

export function EmotionCorrelation() {
  const [data, setData] = useState<EmotionPerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'winRate' | 'avgPnl'>('winRate');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response: APIResponse<EmotionPerformance[]> = await window.electronAPI.psychology.getEmotionPerformance();
        if (response.data) {
          setData(response.data.slice(0, 10)); // Top 10 emotions
        }
      } catch (error) {
        console.error('Failed to fetch emotion performance:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Emotion Performance</h3>
        <div className="h-64 animate-pulse bg-background-secondary rounded" />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Emotion Performance</h3>
        <div className="h-64 flex items-center justify-center text-muted-foreground">
          No emotion data available. Add journal entries to see correlations.
        </div>
      </div>
    );
  }

  const chartData = data.map(d => ({
    ...d,
    label: `${EMOTION_EMOJIS[d.emotion] || '🔘'} ${d.emotion}`,
  }));

  const getBarColor = (value: number, isWinRate: boolean) => {
    if (isWinRate) {
      if (value >= 60) return '#10b981';
      if (value >= 40) return '#f59e0b';
      return '#ef4444';
    } else {
      return value >= 0 ? '#10b981' : '#ef4444';
    }
  };

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Emotion Performance</h3>
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('winRate')}
            className={`px-3 py-1 text-sm rounded ${
              viewMode === 'winRate'
                ? 'bg-primary text-primary-foreground'
                : 'bg-background-secondary text-muted-foreground'
            }`}
          >
            Win Rate
          </button>
          <button
            onClick={() => setViewMode('avgPnl')}
            className={`px-3 py-1 text-sm rounded ${
              viewMode === 'avgPnl'
                ? 'bg-primary text-primary-foreground'
                : 'bg-background-secondary text-muted-foreground'
            }`}
          >
            Avg P&L
          </button>
        </div>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis
              type="number"
              tick={{ fill: '#9ca3af', fontSize: 11 }}
              tickFormatter={(value) => viewMode === 'winRate' ? `${value}%` : formatCurrency(value)}
              stroke="#4b5563"
            />
            <YAxis
              type="category"
              dataKey="label"
              tick={{ fill: '#9ca3af', fontSize: 11 }}
              stroke="#4b5563"
              width={80}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1f2937',
                border: '1px solid #374151',
                borderRadius: '6px',
              }}
              formatter={(value: number, name: string) => [
                viewMode === 'winRate' ? `${value}%` : formatCurrency(value),
                viewMode === 'winRate' ? 'Win Rate' : 'Avg P&L'
              ]}
              labelFormatter={(label) => label}
            />
            <Bar
              dataKey={viewMode === 'winRate' ? 'win_rate' : 'avg_pnl'}
              radius={[0, 4, 4, 0]}
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={getBarColor(
                    viewMode === 'winRate' ? entry.win_rate : entry.avg_pnl,
                    viewMode === 'winRate'
                  )}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="text-xs text-muted-foreground text-center mt-2">
        Based on {data.reduce((sum, d) => sum + d.trade_count, 0)} trades with journal entries
      </div>
    </div>
  );
}
```

---

### Task 5.9: Create DisciplineScore Component

**Step 1:** Create `src/renderer/components/psychology/DisciplineScore.tsx`:
```tsx
import React from 'react';
import { cn } from '@/lib/utils/cn';
import { Target, CheckCircle, AlertTriangle } from 'lucide-react';

interface DisciplineScoreProps {
  score: number;
  ruleAdherenceRate: number;
  journaledPercent: number;
}

export function DisciplineScore({ score, ruleAdherenceRate, journaledPercent }: DisciplineScoreProps) {
  const getScoreColor = (value: number) => {
    if (value >= 70) return 'text-profit';
    if (value >= 40) return 'text-yellow-500';
    return 'text-loss';
  };

  const getScoreLabel = (value: number) => {
    if (value >= 80) return 'Excellent';
    if (value >= 60) return 'Good';
    if (value >= 40) return 'Needs Work';
    return 'Poor';
  };

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Target className="w-5 h-5 text-primary" />
        Discipline Score
      </h3>

      <div className="text-center mb-6">
        <div className={cn('text-5xl font-bold', getScoreColor(score))}>
          {score}
        </div>
        <div className="text-sm text-muted-foreground mt-1">
          {getScoreLabel(score)}
        </div>
      </div>

      {/* Score Ring */}
      <div className="relative w-32 h-32 mx-auto mb-6">
        <svg className="w-32 h-32 transform -rotate-90">
          <circle
            cx="64"
            cy="64"
            r="56"
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            className="text-background-secondary"
          />
          <circle
            cx="64"
            cy="64"
            r="56"
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            strokeDasharray={`${(score / 100) * 352} 352`}
            className={getScoreColor(score)}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={cn('text-2xl font-bold', getScoreColor(score))}>
            {score}%
          </span>
        </div>
      </div>

      {/* Breakdown */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-profit" />
            <span className="text-sm">Rule Adherence</span>
          </div>
          <span className="font-mono text-sm">{ruleAdherenceRate}%</span>
        </div>
        <div className="h-2 bg-background-secondary rounded-full overflow-hidden">
          <div
            className="h-full bg-profit rounded-full transition-all"
            style={{ width: `${ruleAdherenceRate}%` }}
          />
        </div>

        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-yellow-500" />
            <span className="text-sm">Journaled Trades</span>
          </div>
          <span className="font-mono text-sm">{journaledPercent}%</span>
        </div>
        <div className="h-2 bg-background-secondary rounded-full overflow-hidden">
          <div
            className="h-full bg-yellow-500 rounded-full transition-all"
            style={{ width: `${journaledPercent}%` }}
          />
        </div>
      </div>
    </div>
  );
}
```

---

### Task 5.10: Create Psychology Page

**Step 1:** Create `src/renderer/pages/Psychology.tsx`:
```tsx
import React from 'react';
import { usePsychologyMetrics, type PeriodType } from '@/hooks/usePsychologyMetrics';
import { DisciplineScore } from '@/components/psychology/DisciplineScore';
import { EmotionCorrelation } from '@/components/analytics/EmotionCorrelation';
import { TimeHeatmap } from '@/components/analytics/TimeHeatmap';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { cn } from '@/lib/utils/cn';
import { Brain, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';

export function Psychology() {
  const { data, loading, period, changePeriod } = usePsychologyMetrics('week');

  if (loading) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-6">Psychology Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-card border border-border rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-6">Psychology Dashboard</h1>
        <div className="bg-card border border-border rounded-lg p-8 text-center">
          <Brain className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">
            No psychology data available. Start journaling your trades to see insights.
          </p>
        </div>
      </div>
    );
  }

  const journaledPercent = data.total_trades > 0
    ? Math.round((data.trades_with_journals / data.total_trades) * 100)
    : 0;

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Brain className="w-6 h-6 text-primary" />
          Psychology Dashboard
        </h1>
        
        {/* Period Selector */}
        <div className="flex gap-2">
          {(['week', 'month', 'all'] as PeriodType[]).map((p) => (
            <button
              key={p}
              onClick={() => changePeriod(p)}
              className={cn(
                'px-4 py-2 rounded-md text-sm transition-colors',
                period === p
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-background-secondary text-muted-foreground hover:text-foreground'
              )}
            >
              {p === 'week' ? 'Week' : p === 'month' ? 'Month' : 'All Time'}
            </button>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricCard
          title="Discipline Score"
          value={`${data.discipline_score}/100`}
          valueClassName={data.discipline_score >= 70 ? 'text-profit' : data.discipline_score >= 40 ? 'text-yellow-500' : 'text-loss'}
        />
        <MetricCard
          title="Rule Adherence"
          value={`${data.rule_adherence_rate}%`}
          valueClassName={data.rule_adherence_rate >= 80 ? 'text-profit' : 'text-yellow-500'}
          subtitle={`${data.trades_with_journals}/${data.total_trades} trades`}
        />
        <MetricCard
          title="FOMO Trades"
          value={data.fomo_trade_count.toString()}
          valueClassName={data.fomo_trade_count > 0 ? 'text-loss' : 'text-muted-foreground'}
          subtitle={data.fomo_trade_win_rate > 0 ? `${data.fomo_trade_win_rate}% win rate` : undefined}
        />
        <MetricCard
          title="Revenge Trades"
          value={data.revenge_trade_count.toString()}
          valueClassName={data.revenge_trade_count > 0 ? 'text-loss' : 'text-muted-foreground'}
        />
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Discipline Score Visual */}
        <DisciplineScore
          score={data.discipline_score}
          ruleAdherenceRate={data.rule_adherence_rate}
          journaledPercent={journaledPercent}
        />

        {/* Win Rate Comparison */}
        <div className="bg-card border border-border rounded-lg p-6 lg:col-span-2">
          <h3 className="text-lg font-semibold mb-4">Emotional State Impact</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-background-secondary rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-profit" />
                <span className="text-sm font-medium">Disciplined Trades</span>
              </div>
              <div className="text-3xl font-bold text-profit">
                {data.disciplined_trade_win_rate}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">Win Rate</p>
            </div>
            
            <div className="bg-background-secondary rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingDown className="w-5 h-5 text-loss" />
                <span className="text-sm font-medium">FOMO Trades</span>
              </div>
              <div className="text-3xl font-bold text-loss">
                {data.fomo_trade_win_rate}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">Win Rate</p>
            </div>
          </div>

          <div className="mt-4 p-4 bg-background-secondary rounded-lg">
            <p className="text-sm text-muted-foreground">
              {data.disciplined_trade_win_rate > data.fomo_trade_win_rate ? (
                <>
                  <span className="text-profit font-medium">
                    Disciplined trades outperform FOMO trades by {data.disciplined_trade_win_rate - data.fomo_trade_win_rate}%
                  </span>
                  . Focus on waiting for quality setups.
                </>
              ) : data.disciplined_trade_win_rate < data.fomo_trade_win_rate ? (
                <>
                  <span className="text-yellow-500 font-medium">
                    Interesting pattern detected
                  </span>
                  . Your FOMO trades are performing better - review your setup criteria.
                </>
              ) : (
                'Not enough data to compare emotional state impact on performance.'
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Emotion Performance Chart */}
      <div className="mb-8">
        <EmotionCorrelation />
      </div>

      {/* Common Emotions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Pre-Trade Emotions</h3>
          {data.most_common_pre_emotion ? (
            <div>
              <p className="text-sm text-muted-foreground mb-2">Most common:</p>
              <span className="inline-flex items-center gap-2 px-3 py-2 bg-background-secondary rounded-full">
                <span className="capitalize font-medium">{data.most_common_pre_emotion}</span>
              </span>
            </div>
          ) : (
            <p className="text-muted-foreground">No pre-trade journal data</p>
          )}
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Post-Trade Emotions</h3>
          {data.most_common_post_emotion ? (
            <div>
              <p className="text-sm text-muted-foreground mb-2">Most common:</p>
              <span className="inline-flex items-center gap-2 px-3 py-2 bg-background-secondary rounded-full">
                <span className="capitalize font-medium">{data.most_common_post_emotion}</span>
              </span>
            </div>
          ) : (
            <p className="text-muted-foreground">No post-trade journal data</p>
          )}
        </div>
      </div>

      {/* Time Heatmap */}
      <TimeHeatmap period="day" />
    </div>
  );
}
```

---

### Task 5.11: Create Analytics Page

**Step 1:** Create `src/renderer/pages/Analytics.tsx`:
```tsx
import React, { useState } from 'react';
import { EquityCurve } from '@/components/dashboard/EquityCurve';
import { TimeHeatmap } from '@/components/analytics/TimeHeatmap';
import { EmotionCorrelation } from '@/components/analytics/EmotionCorrelation';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { formatCurrency, formatPercent } from '@/lib/utils/formatting';
import type { TradePerformanceSummary, StrategyPerformance, APIResponse } from '@/types';
import { BarChart3 } from 'lucide-react';
import { useEffect } from 'react';

export function Analytics() {
  const [summary, setSummary] = useState<TradePerformanceSummary | null>(null);
  const [strategyPerformance, setStrategyPerformance] = useState<StrategyPerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const [heatmapPeriod, setHeatmapPeriod] = useState<'day' | 'hour'>('day');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [summaryRes, strategyRes] = await Promise.all([
          window.electronAPI.analytics.getPerformanceSummary() as Promise<APIResponse<TradePerformanceSummary>>,
          window.electronAPI.analytics.getStrategyPerformance() as Promise<APIResponse<StrategyPerformance[]>>,
        ]);

        if (summaryRes.data) setSummary(summaryRes.data);
        if (strategyRes.data) setStrategyPerformance(strategyRes.data);
      } catch (error) {
        console.error('Failed to fetch analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-6">Analytics</h1>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-card border border-border rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <BarChart3 className="w-6 h-6 text-primary" />
        Analytics
      </h1>

      {/* Performance Summary */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <MetricCard
            title="Total P&L"
            value={formatCurrency(summary.total_pnl)}
            valueClassName={summary.total_pnl >= 0 ? 'text-profit' : 'text-loss'}
            subtitle={`${summary.total_trades} trades`}
          />
          <MetricCard
            title="Win Rate"
            value={formatPercent(summary.win_rate, 1).replace('+', '')}
            subtitle={`${summary.winning_trades}W / ${summary.losing_trades}L`}
          />
          <MetricCard
            title="Profit Factor"
            value={summary.profit_factor.toFixed(2)}
            valueClassName={summary.profit_factor >= 1 ? 'text-profit' : 'text-loss'}
          />
          <MetricCard
            title="Avg R:R"
            value={summary.avg_risk_reward.toFixed(2)}
          />
        </div>
      )}

      {/* Equity Curve */}
      <div className="mb-8">
        <EquityCurve />
      </div>

      {/* Win/Loss Stats */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <MetricCard
            title="Average Win"
            value={formatCurrency(summary.avg_win)}
            valueClassName="text-profit"
          />
          <MetricCard
            title="Average Loss"
            value={formatCurrency(summary.avg_loss)}
            valueClassName="text-loss"
          />
          <MetricCard
            title="Largest Win"
            value={formatCurrency(summary.largest_win)}
            valueClassName="text-profit"
          />
        </div>
      )}

      {/* Time Heatmap */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <h2 className="text-lg font-semibold">Performance by Time</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setHeatmapPeriod('day')}
              className={`px-3 py-1 text-sm rounded ${
                heatmapPeriod === 'day'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-background-secondary text-muted-foreground'
              }`}
            >
              Day
            </button>
            <button
              onClick={() => setHeatmapPeriod('hour')}
              className={`px-3 py-1 text-sm rounded ${
                heatmapPeriod === 'hour'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-background-secondary text-muted-foreground'
              }`}
            >
              Hour
            </button>
          </div>
        </div>
        <TimeHeatmap period={heatmapPeriod} />
      </div>

      {/* Strategy Performance */}
      {strategyPerformance.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">Strategy Performance</h2>
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-background-secondary">
                  <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Strategy</th>
                  <th className="text-right text-xs font-medium text-muted-foreground px-4 py-3">Trades</th>
                  <th className="text-right text-xs font-medium text-muted-foreground px-4 py-3">Win Rate</th>
                  <th className="text-right text-xs font-medium text-muted-foreground px-4 py-3">P&L</th>
                  <th className="text-right text-xs font-medium text-muted-foreground px-4 py-3">Profit Factor</th>
                </tr>
              </thead>
              <tbody>
                {strategyPerformance.map((strategy) => (
                  <tr key={strategy.strategy_id || 'none'} className="border-b border-border last:border-b-0">
                    <td className="px-4 py-3">
                      <span className="font-medium">{strategy.strategy_name || 'No Strategy'}</span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-sm">
                      {strategy.total_trades}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-sm">
                      {strategy.win_rate.toFixed(1)}%
                    </td>
                    <td className={`px-4 py-3 text-right font-mono text-sm ${
                      strategy.total_pnl >= 0 ? 'text-profit' : 'text-loss'
                    }`}>
                      {formatCurrency(strategy.total_pnl)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-sm">
                      {strategy.profit_factor.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Emotion Correlation */}
      <div className="mb-8">
        <EmotionCorrelation />
      </div>
    </div>
  );
}
```

---

### Task 5.12: Update App.tsx Routes

**Step 1:** Update `src/renderer/App.tsx` to add psychology and analytics routes:

Add imports:
```tsx
import { Psychology } from '@/pages/Psychology';
import { Analytics } from '@/pages/Analytics';
```

Update the `renderPage()` function:
```tsx
if (currentPath === '/psychology') {
  return <Psychology />;
}
if (currentPath === '/analytics') {
  return <Analytics />;
}
```

---

## Success Criteria

- [ ] Psychology dashboard loads with metrics
- [ ] Discipline score calculates correctly
- [ ] Time heatmap shows day-of-week performance
- [ ] Time heatmap shows hour-of-day performance
- [ ] Emotion correlation chart renders with data
- [ ] Equity curve chart renders with trade history
- [ ] Strategy performance table shows real data
- [ ] Period selector (week/month/all) works
- [ ] Analytics page loads all charts
- [ ] Win rate by emotion shows correlation
- [ ] FOMO/revenge trade counts are accurate

### Test Workflow

1. Add several trades with journals
2. Navigate to Psychology dashboard
3. Verify discipline score reflects journaling rate
4. Check emotion performance chart
5. Switch between week/month/all periods
6. Navigate to Analytics
7. View equity curve
8. Check time heatmap by day
9. Switch to hour view
10. Review strategy performance table

---

## Handoff to Next Phase

### Completed in This Phase
- Psychology DAL with metrics calculations
- Psychology IPC handlers
- usePsychologyMetrics and useTimeAnalytics hooks
- TimeHeatmap component with day/hour views
- EmotionCorrelation chart
- EquityCurve chart with Recharts
- DisciplineScore component
- Full Psychology dashboard
- Full Analytics page
- Emotion-performance correlation analysis

### Files Ready for Phase 6
- Psychology metrics available for gamification
- Emotion tracking ready for AI analysis
- Rule violation data captured

### State of the App
- Complete trading workflow with journaling
- Psychology insights dashboard
- Full analytics with charts
- Time-based performance analysis
- Emotion-performance correlation visible

### Next Phase Prerequisites Met
- Journal data structure supports AI analysis
- Gamification DAL already exists from Phase 2
- Psychology metrics can feed into achievements

---

**Next Document:** `06_PHASE_GAMIFICATION_AI.md`
