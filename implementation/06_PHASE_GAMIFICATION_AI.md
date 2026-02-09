# Phase 6: Gamification & AI Coach

## Prerequisites
- Phase 5 completed (Psychology & Analytics working)
- Journal data being captured
- Gamification DAL already created in Phase 2
- Trade data with emotional state captured

## Context
The trading journal is fully functional with psychology insights. Now we add the gamification layer to encourage consistent journaling and the AI coach feature to provide personalized trading psychology feedback.

**Entering State:** Full journal workflow with psychology dashboard
**Exiting State:** Gamification streaks/badges working, AI analysis functional

## Objectives
1. Create gamification IPC handlers
2. Port GamificationWidget component
3. Implement streak tracking logic
4. Create badge award system
5. Integrate OpenRouter API for AI analysis
6. Implement secure API key storage using electron-keytar
7. Create AI insights component
8. Add gamification to dashboard

---

## Files to Create

| File Path | Purpose | Source Reference |
|-----------|---------|-----------------|
| `src/main/ipc/gamification.ts` | Gamification IPC handlers | New file |
| `src/main/ipc/ai.ts` | AI analysis IPC handlers | New file |
| `src/main/services/ai.ts` | AI service with OpenRouter | `app/api/ai/analyze-trade/route.ts` |
| `src/main/services/keychain.ts` | Secure key storage | New file |
| `src/renderer/hooks/useGamification.ts` | Gamification hook | `lib/hooks/useGamification.ts` |
| `src/renderer/hooks/useAIAnalysis.ts` | AI analysis hook | `lib/hooks/useAIAnalysis.ts` |
| `src/renderer/components/psychology/GamificationWidget.tsx` | Gamification UI | `components/psychology/GamificationWidget.tsx` |
| `src/renderer/components/psychology/AIInsightsCard.tsx` | AI insights display | `components/psychology/AIInsightsCard.tsx` |
| `src/renderer/components/settings/APIKeySettings.tsx` | API key management | New file |

## Files to Modify

| File Path | Modifications |
|-----------|--------------|
| `src/main/ipc/index.ts` | Register gamification and AI handlers |
| `src/main/preload.ts` | Add gamification and AI API methods |
| `src/renderer/pages/Dashboard.tsx` | Add GamificationWidget |
| `src/renderer/pages/TradeDetail.tsx` | Add AIInsightsCard |
| `package.json` | Add keytar dependency |

---

## Detailed Instructions

### Task 6.1: Install Keytar Dependency

**Step 1:** Install electron-keytar for secure API key storage:
```bash
cd TradingJournal-Mac
npm install keytar
npm install --save-dev @electron/rebuild
```

**Step 2:** Rebuild native modules for Electron:
```bash
npx electron-rebuild -f -w keytar
```

---

### Task 6.2: Create Keychain Service

**Step 1:** Create `src/main/services/keychain.ts`:
```typescript
import keytar from 'keytar';

const SERVICE_NAME = 'TheMindfulTrader';

export const keychainService = {
  async setAPIKey(key: string): Promise<void> {
    await keytar.setPassword(SERVICE_NAME, 'openrouter_api_key', key);
  },

  async getAPIKey(): Promise<string | null> {
    return keytar.getPassword(SERVICE_NAME, 'openrouter_api_key');
  },

  async deleteAPIKey(): Promise<boolean> {
    return keytar.deletePassword(SERVICE_NAME, 'openrouter_api_key');
  },

  async hasAPIKey(): Promise<boolean> {
    const key = await keytar.getPassword(SERVICE_NAME, 'openrouter_api_key');
    return key !== null && key.length > 0;
  },

  // Store preferred AI model
  async setPreferredModel(model: string): Promise<void> {
    await keytar.setPassword(SERVICE_NAME, 'preferred_ai_model', model);
  },

  async getPreferredModel(): Promise<string | null> {
    return keytar.getPassword(SERVICE_NAME, 'preferred_ai_model');
  },
};
```

---

### Task 6.3: Create AI Service

**Step 1:** Create `src/main/services/ai.ts`:
```typescript
import { keychainService } from './keychain';
import { tradesDAL, journalsDAL } from '../database/dal';

interface AIPromptData {
  trade: any;
  preJournal: any;
  postJournal: any;
  recentTrades: any[];
}

interface AIAnalysisResult {
  trade_id: string;
  analysis: {
    pattern_recognition: string;
    emotional_insights: string;
    improvement_suggestions: string;
    risk_assessment: string;
  };
  analyzed_at: string;
  model_used: string;
}

function buildAIPrompt(data: AIPromptData): string {
  const { trade, preJournal, postJournal, recentTrades } = data;

  // Parse JSON fields safely
  const parseJson = (val: any, def: any) => {
    if (!val) return def;
    try {
      return typeof val === 'string' ? JSON.parse(val) : val;
    } catch {
      return def;
    }
  };

  const preEmotions = parseJson(preJournal?.emotional_state, []);
  const postEmotions = parseJson(postJournal?.emotional_state, []);
  const ruleViolations = parseJson(postJournal?.rule_violations, []);

  return `You are a trading psychology coach inspired by Mark Douglas and Dr. Alexander Elder.

**Current Trade:**
- Ticker: ${trade.ticker}
- Direction: ${trade.direction}
- Result: ${trade.net_pnl > 0 ? 'Win' : 'Loss'} ($${trade.net_pnl?.toFixed(2) || 'N/A'})
- Return: ${trade.return_percent?.toFixed(2) || 'N/A'}%
- R:R: ${trade.actual_rr?.toFixed(2) || 'N/A'}

**Pre-Trade State:**
- Emotional State: ${preEmotions.join(', ') || 'Not recorded'}
- Emotional Score: ${preJournal?.emotional_score || 'N/A'}/10
- Setup Quality: ${preJournal?.setup_quality || 'N/A'}/5
- Thesis: "${preJournal?.thesis || 'Not provided'}"
- Concerns: "${preJournal?.concerns || 'None noted'}"

**Post-Trade Reflection:**
- Followed Plan: ${postJournal?.followed_plan ? 'Yes' : 'No'}
- Rule Violations: ${ruleViolations.join(', ') || 'None'}
- What Went Well: "${postJournal?.what_went_well || 'Not recorded'}"
- What Went Wrong: "${postJournal?.what_went_wrong || 'Not recorded'}"
- Lessons Learned: "${postJournal?.lessons_learned || 'Not recorded'}"
- Reflection: "${postJournal?.reflection_notes || 'Not provided'}"

**Recent Pattern (Last ${recentTrades.length} Trades):**
${recentTrades.map((t, i) => {
  const emotions = parseJson(t.pre_journals?.[0]?.emotional_state, []);
  const result = t.net_pnl > 0 ? 'Win' : t.net_pnl < 0 ? 'Loss' : 'Breakeven';
  return `${i + 1}. ${t.ticker}: ${result} ($${t.net_pnl?.toFixed(2) || 'N/A'}) - Emotions: ${emotions.join(', ') || 'N/A'}`;
}).join('\n')}

**Task:**
1. Identify emotional patterns (is FOMO, revenge trading, or overconfidence recurring?)
2. Detect rule-breaking trends (stop loss violations, position sizing issues?)
3. Analyze the relationship between emotional state and trade outcomes
4. Provide 2-3 actionable insights to improve discipline and consistency
5. Be supportive but honest (not just cheerleading, but constructive feedback)

**Response Format (JSON):**
{
  "pattern_recognition": "specific patterns identified in recent trading behavior",
  "emotional_insights": "specific observation about emotions and performance",
  "risk_assessment": "feedback on risk management and rule following",
  "improvement_suggestions": "2-3 actionable recommendations"
}`;
}

export const aiService = {
  async analyzeTradeJournal(tradeId: string): Promise<AIAnalysisResult> {
    // Check for API key
    const apiKey = await keychainService.getAPIKey();
    if (!apiKey) {
      throw new Error('OpenRouter API key not configured. Please add your API key in Settings.');
    }

    // Get trade with journals
    const trade = tradesDAL.findById(tradeId);
    if (!trade) {
      throw new Error('Trade not found');
    }

    const preJournals = journalsDAL.findPreTradeJournalsByTradeId(tradeId);
    const postJournals = journalsDAL.findPostTradeJournalsByTradeId(tradeId);

    if (!postJournals || postJournals.length === 0) {
      throw new Error('Please complete a post-trade journal before requesting AI analysis');
    }

    // Get recent trades for pattern detection
    const recentTrades = tradesDAL.findAll({ limit: 10 });

    // Build prompt
    const prompt = buildAIPrompt({
      trade,
      preJournal: preJournals[0] || null,
      postJournal: postJournals[0],
      recentTrades: recentTrades.filter(t => t.id !== tradeId),
    });

    // Get preferred model
    const preferredModel = await keychainService.getPreferredModel() || 'openai/gpt-4-turbo';

    // Call OpenRouter API
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://mindfultrader.app',
        'X-Title': 'The Mindful Trader',
      },
      body: JSON.stringify({
        model: preferredModel,
        messages: [
          {
            role: 'system',
            content: 'You are a trading psychology expert inspired by Mark Douglas ("Trading in the Zone") and Dr. Alexander Elder ("Trading for a Living"). You provide insightful, actionable feedback on trading behavior and emotional patterns. Always respond with valid JSON.'
          },
          { role: 'user', content: prompt }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('OpenRouter API error:', errorData);
      throw new Error(errorData.error?.message || 'Failed to connect to AI service. Please check your API key.');
    }

    const aiData = await response.json();
    
    let analysis;
    try {
      analysis = JSON.parse(aiData.choices[0].message.content);
    } catch {
      throw new Error('Failed to parse AI response');
    }

    const result: AIAnalysisResult = {
      trade_id: tradeId,
      analysis: {
        pattern_recognition: analysis.pattern_recognition || '',
        emotional_insights: analysis.emotional_insights || '',
        improvement_suggestions: analysis.improvement_suggestions || '',
        risk_assessment: analysis.risk_assessment || '',
      },
      analyzed_at: new Date().toISOString(),
      model_used: preferredModel,
    };

    // Store insights in post-trade journal
    if (postJournals[0]) {
      journalsDAL.updatePostTradeJournal(postJournals[0].id, {
        ai_analysis_completed: true,
        ai_insights: result.analysis,
      });
    }

    return result;
  },

  async getAvailableModels(): Promise<string[]> {
    // Return commonly used models for trading analysis
    return [
      'openai/gpt-4-turbo',
      'openai/gpt-4',
      'openai/gpt-3.5-turbo',
      'anthropic/claude-3-opus',
      'anthropic/claude-3-sonnet',
      'google/gemini-pro',
    ];
  },
};
```

---

### Task 6.4: Create Gamification IPC Handlers

**Step 1:** Create `src/main/ipc/gamification.ts`:
```typescript
import { ipcMain } from 'electron';
import { gamificationDAL } from '../database/dal';

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  earned_at: string;
}

export interface Milestone {
  id: string;
  name: string;
  description: string;
  target_value: number;
  current_value: number;
  completed: boolean;
  completion_date?: string;
}

export interface GamificationData {
  current_streak: number;
  longest_streak: number;
  total_trades: number;
  total_journal_entries: number;
  badges: Badge[];
  milestones: Milestone[];
  level: number;
  xp: number;
  xp_to_next_level: number;
}

// Badge definitions
const BADGE_DEFINITIONS: Record<string, { name: string; description: string; icon: string }> = {
  first_trade: { name: 'First Trade', description: 'Logged your first trade', icon: '🎯' },
  first_journal: { name: 'Mindful Start', description: 'Created your first journal entry', icon: '📝' },
  streak_7: { name: 'Week Warrior', description: 'Maintained a 7-day journaling streak', icon: '🔥' },
  streak_30: { name: 'Monthly Master', description: 'Maintained a 30-day journaling streak', icon: '⚡' },
  trades_10: { name: 'Getting Started', description: 'Logged 10 trades', icon: '📊' },
  trades_50: { name: 'Active Trader', description: 'Logged 50 trades', icon: '📈' },
  trades_100: { name: 'Century Club', description: 'Logged 100 trades', icon: '💯' },
  disciplined_10: { name: 'Discipline Seeker', description: '10 trades with disciplined emotional state', icon: '🎖️' },
  win_streak_5: { name: 'Hot Streak', description: '5 winning trades in a row', icon: '🏆' },
  journaled_all: { name: 'Complete Journal', description: 'Pre and post journal for 10 consecutive trades', icon: '📚' },
};

// Milestone definitions
const MILESTONE_DEFINITIONS = [
  { id: 'trades_10', name: '10 Trades', description: 'Log 10 trades', target: 10, type: 'trades' },
  { id: 'trades_50', name: '50 Trades', description: 'Log 50 trades', target: 50, type: 'trades' },
  { id: 'trades_100', name: '100 Trades', description: 'Log 100 trades', target: 100, type: 'trades' },
  { id: 'journals_10', name: '10 Journals', description: 'Create 10 journal entries', target: 10, type: 'journals' },
  { id: 'journals_50', name: '50 Journals', description: 'Create 50 journal entries', target: 50, type: 'journals' },
  { id: 'streak_7', name: '7 Day Streak', description: 'Maintain a 7-day streak', target: 7, type: 'streak' },
  { id: 'streak_30', name: '30 Day Streak', description: 'Maintain a 30-day streak', target: 30, type: 'streak' },
];

// Calculate level from XP
function calculateLevel(xp: number): { level: number; xp_to_next: number } {
  // XP required per level increases: 100, 200, 400, 800, etc.
  let level = 1;
  let totalXpRequired = 100;
  let xpForCurrentLevel = 100;

  while (xp >= totalXpRequired) {
    level++;
    xpForCurrentLevel = xpForCurrentLevel * 2;
    totalXpRequired += xpForCurrentLevel;
  }

  const xpIntoCurrentLevel = xp - (totalXpRequired - xpForCurrentLevel);
  const xp_to_next = xpForCurrentLevel - xpIntoCurrentLevel;

  return { level, xp_to_next };
}

export function registerGamificationHandlers(): void {
  ipcMain.handle('gamification:getData', async () => {
    try {
      const gamification = gamificationDAL.getOrCreate();
      const badges = JSON.parse(gamification.badges || '[]') as Badge[];
      
      // Calculate current values for milestones
      const totalTrades = gamificationDAL.getTotalTradesCount();
      const totalJournals = gamificationDAL.getTotalJournalsCount();
      
      const milestones: Milestone[] = MILESTONE_DEFINITIONS.map(def => {
        let currentValue = 0;
        if (def.type === 'trades') currentValue = totalTrades;
        else if (def.type === 'journals') currentValue = totalJournals;
        else if (def.type === 'streak') currentValue = gamification.longest_journaling_streak;
        
        return {
          id: def.id,
          name: def.name,
          description: def.description,
          target_value: def.target,
          current_value: currentValue,
          completed: currentValue >= def.target,
        };
      });
      
      // Calculate XP: 10 per trade, 20 per journal, 50 per badge
      const xp = (totalTrades * 10) + (totalJournals * 20) + (badges.length * 50);
      const { level, xp_to_next } = calculateLevel(xp);
      
      const data: GamificationData = {
        current_streak: gamification.current_journaling_streak,
        longest_streak: gamification.longest_journaling_streak,
        total_trades: totalTrades,
        total_journal_entries: totalJournals,
        badges,
        milestones,
        level,
        xp,
        xp_to_next_level: xp_to_next,
      };
      
      return { data, error: null };
    } catch (error) {
      console.error('Error in gamification:getData:', error);
      return { data: null, error: (error as Error).message };
    }
  });

  ipcMain.handle('gamification:checkAndAwardBadges', async () => {
    try {
      const result = gamificationDAL.checkAndAwardBadges();
      
      // Convert badge IDs to full badge objects
      const newBadges = result.newBadges.map(badgeId => {
        const def = BADGE_DEFINITIONS[badgeId];
        return def ? {
          id: badgeId,
          name: def.name,
          description: def.description,
          icon: def.icon,
          earned_at: new Date().toISOString(),
        } : null;
      }).filter(Boolean);
      
      return { data: { newBadges }, error: null };
    } catch (error) {
      console.error('Error in gamification:checkAndAwardBadges:', error);
      return { data: null, error: (error as Error).message };
    }
  });

  ipcMain.handle('gamification:updateStreak', async () => {
    try {
      gamificationDAL.updateStreak();
      return { data: true, error: null };
    } catch (error) {
      console.error('Error in gamification:updateStreak:', error);
      return { data: null, error: (error as Error).message };
    }
  });

  ipcMain.handle('gamification:getStreakStatus', async () => {
    try {
      const gamification = gamificationDAL.getOrCreate();
      const lastDate = gamification.last_journal_date;
      
      // Check if streak is at risk (no journal today)
      const today = new Date().toISOString().split('T')[0];
      const streakAtRisk = lastDate !== today && gamification.current_journaling_streak > 0;
      
      return {
        data: {
          currentStreak: gamification.current_journaling_streak,
          longestStreak: gamification.longest_journaling_streak,
          lastJournalDate: lastDate,
          streakAtRisk,
        },
        error: null,
      };
    } catch (error) {
      console.error('Error in gamification:getStreakStatus:', error);
      return { data: null, error: (error as Error).message };
    }
  });
}
```

---

### Task 6.5: Create AI IPC Handlers

**Step 1:** Create `src/main/ipc/ai.ts`:
```typescript
import { ipcMain } from 'electron';
import { aiService } from '../services/ai';
import { keychainService } from '../services/keychain';

export function registerAIHandlers(): void {
  ipcMain.handle('ai:analyzeTradeJournal', async (_, tradeId: string) => {
    try {
      const result = await aiService.analyzeTradeJournal(tradeId);
      return { data: result, error: null };
    } catch (error) {
      console.error('Error in ai:analyzeTradeJournal:', error);
      return { data: null, error: (error as Error).message };
    }
  });

  ipcMain.handle('ai:getAvailableModels', async () => {
    try {
      const models = await aiService.getAvailableModels();
      return { data: models, error: null };
    } catch (error) {
      console.error('Error in ai:getAvailableModels:', error);
      return { data: null, error: (error as Error).message };
    }
  });

  // API Key Management
  ipcMain.handle('ai:setAPIKey', async (_, key: string) => {
    try {
      await keychainService.setAPIKey(key);
      return { data: true, error: null };
    } catch (error) {
      console.error('Error in ai:setAPIKey:', error);
      return { data: null, error: (error as Error).message };
    }
  });

  ipcMain.handle('ai:hasAPIKey', async () => {
    try {
      const hasKey = await keychainService.hasAPIKey();
      return { data: hasKey, error: null };
    } catch (error) {
      console.error('Error in ai:hasAPIKey:', error);
      return { data: null, error: (error as Error).message };
    }
  });

  ipcMain.handle('ai:deleteAPIKey', async () => {
    try {
      const result = await keychainService.deleteAPIKey();
      return { data: result, error: null };
    } catch (error) {
      console.error('Error in ai:deleteAPIKey:', error);
      return { data: null, error: (error as Error).message };
    }
  });

  ipcMain.handle('ai:setPreferredModel', async (_, model: string) => {
    try {
      await keychainService.setPreferredModel(model);
      return { data: true, error: null };
    } catch (error) {
      console.error('Error in ai:setPreferredModel:', error);
      return { data: null, error: (error as Error).message };
    }
  });

  ipcMain.handle('ai:getPreferredModel', async () => {
    try {
      const model = await keychainService.getPreferredModel();
      return { data: model || 'openai/gpt-4-turbo', error: null };
    } catch (error) {
      console.error('Error in ai:getPreferredModel:', error);
      return { data: null, error: (error as Error).message };
    }
  });
}
```

---

### Task 6.6: Update IPC Index

**Step 1:** Update `src/main/ipc/index.ts`:
```typescript
import { registerTradeHandlers } from './trades';
import { registerStrategyHandlers } from './strategies';
import { registerAnalyticsHandlers } from './analytics';
import { registerJournalHandlers } from './journals';
import { registerPsychologyHandlers } from './psychology';
import { registerGamificationHandlers } from './gamification';
import { registerAIHandlers } from './ai';

export function registerAllIPCHandlers(): void {
  console.log('Registering IPC handlers...');
  
  registerTradeHandlers();
  registerStrategyHandlers();
  registerAnalyticsHandlers();
  registerJournalHandlers();
  registerPsychologyHandlers();
  registerGamificationHandlers();
  registerAIHandlers();
  
  console.log('IPC handlers registered');
}
```

---

### Task 6.7: Update Preload Script

**Step 1:** Add to `src/main/preload.ts`:
```typescript
// Add to electronAPI object:
gamification: {
  getData: () => ipcRenderer.invoke('gamification:getData'),
  checkAndAwardBadges: () => ipcRenderer.invoke('gamification:checkAndAwardBadges'),
  updateStreak: () => ipcRenderer.invoke('gamification:updateStreak'),
  getStreakStatus: () => ipcRenderer.invoke('gamification:getStreakStatus'),
},
ai: {
  analyzeTradeJournal: (tradeId) => ipcRenderer.invoke('ai:analyzeTradeJournal', tradeId),
  getAvailableModels: () => ipcRenderer.invoke('ai:getAvailableModels'),
  setAPIKey: (key) => ipcRenderer.invoke('ai:setAPIKey', key),
  hasAPIKey: () => ipcRenderer.invoke('ai:hasAPIKey'),
  deleteAPIKey: () => ipcRenderer.invoke('ai:deleteAPIKey'),
  setPreferredModel: (model) => ipcRenderer.invoke('ai:setPreferredModel', model),
  getPreferredModel: () => ipcRenderer.invoke('ai:getPreferredModel'),
},
```

---

### Task 6.8: Create useGamification Hook

**Step 1:** Create `src/renderer/hooks/useGamification.ts`:
```typescript
import { useState, useEffect, useCallback } from 'react';
import type { APIResponse } from '../types';

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  earned_at: string;
}

export interface Milestone {
  id: string;
  name: string;
  description: string;
  target_value: number;
  current_value: number;
  completed: boolean;
  completion_date?: string;
}

export interface GamificationData {
  current_streak: number;
  longest_streak: number;
  total_trades: number;
  total_journal_entries: number;
  badges: Badge[];
  milestones: Milestone[];
  level: number;
  xp: number;
  xp_to_next_level: number;
}

export function useGamification() {
  const [data, setData] = useState<GamificationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGamification = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response: APIResponse<GamificationData> = await window.electronAPI.gamification.getData();
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      setData(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch gamification data');
      console.error('Failed to fetch gamification data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGamification();
  }, [fetchGamification]);

  const refresh = useCallback(() => {
    fetchGamification();
  }, [fetchGamification]);

  return {
    data,
    loading,
    error,
    refresh,
  };
}
```

---

### Task 6.9: Create useAIAnalysis Hook

**Step 1:** Create `src/renderer/hooks/useAIAnalysis.ts`:
```typescript
import { useState, useCallback } from 'react';
import type { APIResponse } from '../types';

export interface AIAnalysisResult {
  trade_id: string;
  analysis: {
    pattern_recognition: string;
    emotional_insights: string;
    improvement_suggestions: string;
    risk_assessment: string;
  };
  analyzed_at: string;
  model_used: string;
}

export function useAIAnalysis() {
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AIAnalysisResult | null>(null);

  const analyzeTradeJournal = useCallback(async (tradeId: string): Promise<AIAnalysisResult | null> => {
    setAnalyzing(true);
    setError(null);
    setResult(null);

    try {
      const response: APIResponse<AIAnalysisResult> = await window.electronAPI.ai.analyzeTradeJournal(tradeId);

      if (response.error) {
        throw new Error(response.error);
      }

      setResult(response.data);
      return response.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      console.error('Failed to analyze trade:', err);
      return null;
    } finally {
      setAnalyzing(false);
    }
  }, []);

  const clearResult = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return {
    analyzing,
    error,
    result,
    analyzeTradeJournal,
    clearResult,
  };
}
```

---

### Task 6.10: Create GamificationWidget Component

**Step 1:** Create `src/renderer/components/psychology/GamificationWidget.tsx`:
```tsx
import React from 'react';
import { useGamification, type Badge, type Milestone } from '@/hooks/useGamification';
import { Trophy, Flame, Target, Zap } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export function GamificationWidget() {
  const { data, loading, error } = useGamification();

  if (loading) {
    return (
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 w-32 bg-background-secondary rounded" />
          <div className="h-24 bg-background-secondary rounded" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return null;
  }

  const {
    current_streak = 0,
    longest_streak = 0,
    badges = [],
    milestones = [],
    level = 1,
    xp = 0,
    xp_to_next_level = 100,
  } = data;

  const nextMilestone = milestones.find(m => !m.completed);
  const progressPercentage = nextMilestone
    ? (nextMilestone.current_value / nextMilestone.target_value) * 100
    : 0;

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Trophy className="w-5 h-5 text-yellow-500" />
        Your Progress
      </h3>

      {/* Current Streak */}
      <div className="flex items-center justify-between rounded-lg bg-background-secondary p-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-red-500">
            <Flame className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Current Streak</p>
            <p className="text-2xl font-bold">
              {current_streak} {current_streak === 1 ? 'day' : 'days'}
            </p>
          </div>
        </div>
        {longest_streak > 0 && (
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Best Streak</p>
            <p className="text-sm font-semibold text-yellow-500">
              {longest_streak} {longest_streak === 1 ? 'day' : 'days'}
            </p>
          </div>
        )}
      </div>

      {/* Badges */}
      {badges.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-3">
            <Trophy className="h-4 w-4 text-muted-foreground" />
            <p className="text-sm font-medium text-muted-foreground">
              Badges Earned ({badges.length})
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {badges.slice(0, 6).map((badge) => (
              <span
                key={badge.id}
                title={badge.description}
                className="inline-flex items-center gap-1 px-2 py-1 bg-profit/10 text-profit border border-profit/30 rounded-full text-xs"
              >
                <span>{badge.icon}</span>
                {badge.name}
              </span>
            ))}
            {badges.length > 6 && (
              <span className="inline-flex items-center px-2 py-1 bg-background-secondary rounded-full text-xs text-muted-foreground">
                +{badges.length - 6} more
              </span>
            )}
          </div>
        </div>
      )}

      {/* Next Milestone */}
      {nextMilestone && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm font-medium text-muted-foreground">Next Milestone</p>
            </div>
            <p className="text-xs text-muted-foreground">
              {nextMilestone.current_value} / {nextMilestone.target_value}
            </p>
          </div>
          <div className="space-y-2">
            <p className="text-sm">{nextMilestone.name}</p>
            <div className="h-2 bg-background-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all"
                style={{ width: `${Math.min(progressPercentage, 100)}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground">{nextMilestone.description}</p>
          </div>
        </div>
      )}

      {/* Level Info */}
      <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" />
            <p className="text-sm font-medium">Level {level}</p>
          </div>
          <p className="text-xs text-muted-foreground">
            {xp} / {xp + xp_to_next_level} XP
          </p>
        </div>
        <div className="h-1.5 bg-background-secondary rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all"
            style={{ width: `${(xp / (xp + xp_to_next_level)) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}
```

---

### Task 6.11: Create AIInsightsCard Component

**Step 1:** Create `src/renderer/components/psychology/AIInsightsCard.tsx`:
```tsx
import React, { useState } from 'react';
import { useAIAnalysis, type AIAnalysisResult } from '@/hooks/useAIAnalysis';
import { Brain, Lightbulb, TrendingUp, AlertTriangle, Sparkles, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface AIInsightsCardProps {
  tradeId: string;
  existingAnalysis?: AIAnalysisResult | null;
  onAnalysisComplete?: (analysis: AIAnalysisResult) => void;
}

export function AIInsightsCard({
  tradeId,
  existingAnalysis,
  onAnalysisComplete,
}: AIInsightsCardProps) {
  const { analyzing, error, analyzeTradeJournal } = useAIAnalysis();
  const [analysis, setAnalysis] = useState<AIAnalysisResult | null>(existingAnalysis || null);

  const handleAnalyze = async () => {
    const result = await analyzeTradeJournal(tradeId);
    if (result) {
      setAnalysis(result);
      onAnalysisComplete?.(result);
    }
  };

  if (analyzing) {
    return (
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Brain className="w-5 h-5 text-primary animate-pulse" />
          AI Analysis
        </h3>
        <div className="flex flex-col items-center justify-center py-8">
          <Loader2 className="w-8 h-8 text-primary animate-spin mb-4" />
          <p className="text-muted-foreground">Analyzing your trade...</p>
          <p className="text-xs text-muted-foreground mt-2">This may take a few seconds</p>
        </div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
          <Brain className="w-5 h-5 text-primary" />
          AI Analysis
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          Get AI-powered insights on your trade psychology and decision-making
        </p>

        <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 mb-4">
          <div className="flex items-start gap-3">
            <Sparkles className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <p className="font-medium mb-1">Unlock AI Insights</p>
              <p className="text-sm text-muted-foreground mb-3">
                Our AI will analyze your trade journal and provide personalized insights on:
              </p>
              <ul className="text-sm text-muted-foreground space-y-1 ml-4 list-disc">
                <li>Pattern recognition in your trading behavior</li>
                <li>Emotional state analysis and recommendations</li>
                <li>Risk management assessment</li>
                <li>Actionable improvement suggestions</li>
              </ul>
            </div>
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-loss/20 bg-loss/5 p-3 mb-4">
            <p className="text-sm text-loss">{error}</p>
          </div>
        )}

        <button
          onClick={handleAnalyze}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          <Brain className="w-4 h-4" />
          Analyze with AI
        </button>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Brain className="w-5 h-5 text-primary" />
          AI Analysis
        </h3>
        <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary border border-primary/30 rounded-full text-xs">
          <Sparkles className="w-3 h-3" />
          AI Powered
        </span>
      </div>
      <p className="text-xs text-muted-foreground mb-4">
        Analyzed {new Date(analysis.analyzed_at).toLocaleDateString()}
      </p>

      <div className="space-y-4">
        {/* Pattern Recognition */}
        <div className="rounded-lg border border-border p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-profit/20">
              <TrendingUp className="h-4 w-4 text-profit" />
            </div>
            <div className="flex-1">
              <p className="font-medium mb-1">Pattern Recognition</p>
              <p className="text-sm text-muted-foreground whitespace-pre-line">
                {analysis.analysis.pattern_recognition}
              </p>
            </div>
          </div>
        </div>

        {/* Emotional Insights */}
        <div className="rounded-lg border border-border p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-yellow-500/20">
              <Brain className="h-4 w-4 text-yellow-500" />
            </div>
            <div className="flex-1">
              <p className="font-medium mb-1">Emotional Insights</p>
              <p className="text-sm text-muted-foreground whitespace-pre-line">
                {analysis.analysis.emotional_insights}
              </p>
            </div>
          </div>
        </div>

        {/* Risk Assessment */}
        <div className="rounded-lg border border-border p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-loss/20">
              <AlertTriangle className="h-4 w-4 text-loss" />
            </div>
            <div className="flex-1">
              <p className="font-medium mb-1">Risk Assessment</p>
              <p className="text-sm text-muted-foreground whitespace-pre-line">
                {analysis.analysis.risk_assessment}
              </p>
            </div>
          </div>
        </div>

        {/* Improvement Suggestions */}
        <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20">
              <Lightbulb className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-medium mb-1">Recommendations</p>
              <p className="text-sm text-muted-foreground whitespace-pre-line">
                {analysis.analysis.improvement_suggestions}
              </p>
            </div>
          </div>
        </div>
      </div>

      <button
        onClick={handleAnalyze}
        className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-2 border border-border rounded-md hover:bg-accent"
      >
        <Brain className="w-4 h-4" />
        Refresh Analysis
      </button>
    </div>
  );
}
```

---

### Task 6.12: Create APIKeySettings Component

**Step 1:** Create `src/renderer/components/settings/APIKeySettings.tsx`:
```tsx
import React, { useState, useEffect } from 'react';
import { Key, Check, X, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { APIResponse } from '@/types';

export function APIKeySettings() {
  const [hasKey, setHasKey] = useState<boolean | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedModel, setSelectedModel] = useState('openai/gpt-4-turbo');
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    const checkKey = async () => {
      const response: APIResponse<boolean> = await window.electronAPI.ai.hasAPIKey();
      setHasKey(response.data ?? false);
      
      const modelResponse: APIResponse<string> = await window.electronAPI.ai.getPreferredModel();
      if (modelResponse.data) {
        setSelectedModel(modelResponse.data);
      }
      
      const modelsResponse: APIResponse<string[]> = await window.electronAPI.ai.getAvailableModels();
      if (modelsResponse.data) {
        setAvailableModels(modelsResponse.data);
      }
    };
    checkKey();
  }, []);

  const handleSaveKey = async () => {
    if (!apiKey.trim()) {
      toast({ title: 'Error', description: 'Please enter an API key', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      const response: APIResponse<boolean> = await window.electronAPI.ai.setAPIKey(apiKey.trim());
      
      if (response.error) {
        throw new Error(response.error);
      }

      setHasKey(true);
      setApiKey('');
      toast({ title: 'Success', description: 'API key saved securely', variant: 'success' });
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to save API key',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteKey = async () => {
    if (!window.confirm('Are you sure you want to delete your API key?')) return;

    try {
      await window.electronAPI.ai.deleteAPIKey();
      setHasKey(false);
      toast({ title: 'Success', description: 'API key deleted', variant: 'success' });
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to delete API key',
        variant: 'destructive',
      });
    }
  };

  const handleModelChange = async (model: string) => {
    setSelectedModel(model);
    try {
      await window.electronAPI.ai.setPreferredModel(model);
      toast({ title: 'Success', description: 'AI model preference saved', variant: 'success' });
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to save model preference',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Key className="w-5 h-5 text-primary" />
        AI Coach Settings
      </h3>

      <p className="text-sm text-muted-foreground mb-4">
        Connect your OpenRouter API key to enable AI-powered trade analysis.
        Your key is stored securely in the macOS Keychain.
      </p>

      {/* Current Status */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-sm">Status:</span>
        {hasKey === null ? (
          <span className="text-muted-foreground">Checking...</span>
        ) : hasKey ? (
          <span className="inline-flex items-center gap-1 text-profit">
            <Check className="w-4 h-4" />
            API Key Configured
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-muted-foreground">
            <X className="w-4 h-4" />
            Not Configured
          </span>
        )}
      </div>

      {/* API Key Input */}
      {!hasKey && (
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium mb-2">OpenRouter API Key</label>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-or-..."
                className="w-full px-3 py-2 pr-10 bg-input border border-border rounded-md"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Get your API key at{' '}
              <a
                href="https://openrouter.ai/keys"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                openrouter.ai/keys
              </a>
            </p>
          </div>

          <button
            onClick={handleSaveKey}
            disabled={saving || !apiKey.trim()}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Key className="w-4 h-4" />
            )}
            Save API Key
          </button>
        </div>
      )}

      {/* Delete Key Button */}
      {hasKey && (
        <div className="mb-6">
          <button
            onClick={handleDeleteKey}
            className="text-sm text-loss hover:underline"
          >
            Delete API Key
          </button>
        </div>
      )}

      {/* Model Selection */}
      <div>
        <label className="block text-sm font-medium mb-2">Preferred AI Model</label>
        <select
          value={selectedModel}
          onChange={(e) => handleModelChange(e.target.value)}
          className="w-full px-3 py-2 bg-input border border-border rounded-md"
        >
          {availableModels.map((model) => (
            <option key={model} value={model}>
              {model}
            </option>
          ))}
        </select>
        <p className="text-xs text-muted-foreground mt-1">
          Different models have different capabilities and costs
        </p>
      </div>
    </div>
  );
}
```

---

### Task 6.13: Update Dashboard with GamificationWidget

**Step 1:** Update `src/renderer/pages/Dashboard.tsx` to include the gamification widget:

Add import:
```tsx
import { GamificationWidget } from '@/components/psychology/GamificationWidget';
```

Add widget after the metrics grid and before recent trades:
```tsx
{/* Add after secondary metrics grid */}
<div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
  <div className="lg:col-span-2">
    {/* Recent Trades section moved here */}
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-foreground">Recent Trades</h2>
        <button
          onClick={() => onNavigate('/trades')}
          className="text-sm text-primary hover:underline"
        >
          View all →
        </button>
      </div>
      <TradeTable
        trades={recentTrades}
        onTradeClick={(trade) => onNavigate(`/trades/${trade.id}`)}
      />
    </div>
  </div>
  <div>
    <GamificationWidget />
  </div>
</div>
```

---

### Task 6.14: Update TradeDetail with AIInsightsCard

**Step 1:** Update `src/renderer/pages/TradeDetail.tsx` to include AI analysis:

Add import:
```tsx
import { AIInsightsCard } from '@/components/psychology/AIInsightsCard';
import { parseJsonField } from '@/types';
```

Add the AIInsightsCard after the post-trade journals section:
```tsx
{/* Add after the journals grid */}
{postJournals.length > 0 && (
  <div className="mt-8">
    <AIInsightsCard
      tradeId={tradeId}
      existingAnalysis={
        postJournals[0]?.ai_insights
          ? {
              trade_id: tradeId,
              analysis: parseJsonField(postJournals[0].ai_insights, {
                pattern_recognition: '',
                emotional_insights: '',
                improvement_suggestions: '',
                risk_assessment: '',
              }),
              analyzed_at: postJournals[0].created_at,
              model_used: 'unknown',
            }
          : null
      }
    />
  </div>
)}
```

---

## Success Criteria

- [ ] Gamification widget displays on dashboard
- [ ] Current streak tracks correctly
- [ ] Badges award when milestones are met
- [ ] Level and XP calculate correctly
- [ ] API key saves securely to Keychain
- [ ] API key persists between app restarts
- [ ] AI analysis works with valid API key
- [ ] AI insights display in trade detail
- [ ] Model preference saves and persists
- [ ] Error messages display for missing API key
- [ ] Streak resets after missed day

### Test Workflow

1. Open dashboard - verify gamification widget shows
2. Create several trades with journals
3. Verify streak increments
4. Check for badge awards
5. Go to Settings → add OpenRouter API key
6. Navigate to a trade with post-trade journal
7. Click "Analyze with AI"
8. Verify insights display
9. Restart app → verify API key persists
10. Delete API key → verify it's removed

---

## Handoff to Next Phase

### Completed in This Phase
- Gamification IPC handlers
- Keychain service for secure API key storage
- AI service with OpenRouter integration
- useGamification and useAIAnalysis hooks
- GamificationWidget with streaks, badges, milestones
- AIInsightsCard with analysis display
- APIKeySettings component
- Dashboard integration with gamification
- Trade detail integration with AI analysis

### Files Ready for Phase 7
- Complete app feature set
- Settings infrastructure ready
- Data export/import can use existing DAL

### State of the App
- Full trading journal with psychology tracking
- Gamification encourages consistent journaling
- AI coach provides personalized insights
- Secure API key management
- Ready for polish and packaging

### Next Phase Prerequisites Met
- All core features implemented
- UI components complete
- Data layer stable
- Ready for export/import and packaging

---

**Next Document:** `07_PHASE_POLISH_PACKAGING.md`
