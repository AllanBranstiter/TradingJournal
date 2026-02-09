# Phase 4: Journaling - Pre/Post Trade Journals

## Prerequisites
- Phase 3 completed (Trade & Strategy CRUD functional)
- IPC handler pattern established
- Trade creation flow working
- Types include journal interfaces

## Context
The core trade and strategy CRUD is functional. Now we need to add the journaling capability that is central to "The Mindful Trader" concept - capturing emotional state before and after trades to build trading psychology awareness.

**Entering State:** Trade CRUD working, no journaling capability
**Exiting State:** Full pre-trade and post-trade journaling workflow integrated with trades

## Objectives
1. Create IPC handlers for pre-trade and post-trade journals
2. Create journals DAL (Data Access Layer)
3. Migrate EmotionSelector and StarRating components
4. Create pre-trade journal form
5. Create post-trade journal form
6. Integrate journals into trade detail view
7. Update trade creation flow to optionally include pre-trade journal

---

## Files to Create

| File Path | Purpose | Source Reference |
|-----------|---------|-----------------|
| `src/main/database/dal/journals.ts` | Journal DAL | New file |
| `src/main/ipc/journals.ts` | Journal IPC handlers | New file |
| `src/renderer/components/trades/EmotionSelector.tsx` | Emotion picker | `components/trades/EmotionSelector.tsx` |
| `src/renderer/components/trades/StarRating.tsx` | Star rating input | `components/trades/StarRating.tsx` |
| `src/renderer/components/journals/PreTradeJournalForm.tsx` | Pre-trade journal form | New file |
| `src/renderer/components/journals/PostTradeJournalForm.tsx` | Post-trade journal form | New file |
| `src/renderer/components/journals/JournalCard.tsx` | Display journal entry | New file |
| `src/renderer/hooks/useJournals.ts` | Journal data hook | New file |
| `src/renderer/pages/TradeDetail.tsx` | Trade detail with journals | New file |

## Files to Modify

| File Path | Modifications |
|-----------|--------------|
| `src/main/ipc/index.ts` | Register journal handlers |
| `src/main/preload.ts` | Add journal API methods |
| `src/renderer/App.tsx` | Add trade detail route |
| `src/renderer/types/index.ts` | Add journal input types |
| `src/renderer/pages/TradeNew.tsx` | Add optional pre-trade journal section |

---

## Detailed Instructions

### Task 4.1: Create Journals DAL

**Step 1:** Create `src/main/database/dal/journals.ts`:
```typescript
import { db } from '../connection';
import { v4 as uuidv4 } from 'uuid';

// Types
export interface CreatePreTradeJournalInput {
  trade_id?: string | null;
  emotional_state: string[];
  emotional_score?: number | null;
  market_bias?: 'bullish' | 'bearish' | 'neutral' | 'choppy' | null;
  spy_trend?: 'uptrend' | 'downtrend' | 'sideways' | null;
  sector_context?: string | null;
  strategy_id?: string | null;
  setup_quality?: number | null;
  confluence_factors?: string[] | null;
  checklist?: Record<string, boolean> | null;
  planned_entry?: number | null;
  planned_stop_loss?: number | null;
  planned_target?: number | null;
  planned_risk_reward?: number | null;
  planned_position_size?: number | null;
  planned_risk_amount?: number | null;
  thesis?: string | null;
  concerns?: string | null;
}

export interface CreatePostTradeJournalInput {
  trade_id?: string | null;
  pre_trade_journal_id?: string | null;
  emotional_state: string[];
  emotional_score?: number | null;
  execution_quality?: number | null;
  followed_plan?: boolean | null;
  rule_violations?: string[] | null;
  what_went_well?: string | null;
  what_went_wrong?: string | null;
  lessons_learned?: string | null;
  reflection_notes?: string | null;
  would_repeat?: boolean | null;
  repeat_reasoning?: string | null;
}

export const journalsDAL = {
  // ========================
  // PRE-TRADE JOURNALS
  // ========================
  
  createPreTradeJournal(data: CreatePreTradeJournalInput) {
    const id = uuidv4();
    const now = new Date().toISOString();
    
    const stmt = db.prepare(`
      INSERT INTO pre_trade_journals (
        id, user_id, trade_id, emotional_state, emotional_score,
        market_bias, spy_trend, sector_context, strategy_id,
        setup_quality, confluence_factors, checklist,
        planned_entry, planned_stop_loss, planned_target,
        planned_risk_reward, planned_position_size, planned_risk_amount,
        thesis, concerns, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      id,
      'local-user',
      data.trade_id || null,
      JSON.stringify(data.emotional_state),
      data.emotional_score ?? null,
      data.market_bias ?? null,
      data.spy_trend ?? null,
      data.sector_context ?? null,
      data.strategy_id ?? null,
      data.setup_quality ?? null,
      data.confluence_factors ? JSON.stringify(data.confluence_factors) : null,
      data.checklist ? JSON.stringify(data.checklist) : null,
      data.planned_entry ?? null,
      data.planned_stop_loss ?? null,
      data.planned_target ?? null,
      data.planned_risk_reward ?? null,
      data.planned_position_size ?? null,
      data.planned_risk_amount ?? null,
      data.thesis ?? null,
      data.concerns ?? null,
      now
    );
    
    return this.findPreTradeJournalById(id)!;
  },
  
  findPreTradeJournalById(id: string) {
    const stmt = db.prepare('SELECT * FROM pre_trade_journals WHERE id = ?');
    return stmt.get(id) as any | undefined;
  },
  
  findPreTradeJournalsByTradeId(tradeId: string) {
    const stmt = db.prepare('SELECT * FROM pre_trade_journals WHERE trade_id = ? ORDER BY created_at DESC');
    return stmt.all(tradeId) as any[];
  },
  
  updatePreTradeJournal(id: string, data: Partial<CreatePreTradeJournalInput>) {
    const existing = this.findPreTradeJournalById(id);
    if (!existing) return null;
    
    const updates: string[] = [];
    const values: any[] = [];
    
    if (data.trade_id !== undefined) {
      updates.push('trade_id = ?');
      values.push(data.trade_id);
    }
    if (data.emotional_state !== undefined) {
      updates.push('emotional_state = ?');
      values.push(JSON.stringify(data.emotional_state));
    }
    if (data.emotional_score !== undefined) {
      updates.push('emotional_score = ?');
      values.push(data.emotional_score);
    }
    if (data.market_bias !== undefined) {
      updates.push('market_bias = ?');
      values.push(data.market_bias);
    }
    if (data.spy_trend !== undefined) {
      updates.push('spy_trend = ?');
      values.push(data.spy_trend);
    }
    if (data.sector_context !== undefined) {
      updates.push('sector_context = ?');
      values.push(data.sector_context);
    }
    if (data.strategy_id !== undefined) {
      updates.push('strategy_id = ?');
      values.push(data.strategy_id);
    }
    if (data.setup_quality !== undefined) {
      updates.push('setup_quality = ?');
      values.push(data.setup_quality);
    }
    if (data.confluence_factors !== undefined) {
      updates.push('confluence_factors = ?');
      values.push(data.confluence_factors ? JSON.stringify(data.confluence_factors) : null);
    }
    if (data.checklist !== undefined) {
      updates.push('checklist = ?');
      values.push(data.checklist ? JSON.stringify(data.checklist) : null);
    }
    if (data.planned_entry !== undefined) {
      updates.push('planned_entry = ?');
      values.push(data.planned_entry);
    }
    if (data.planned_stop_loss !== undefined) {
      updates.push('planned_stop_loss = ?');
      values.push(data.planned_stop_loss);
    }
    if (data.planned_target !== undefined) {
      updates.push('planned_target = ?');
      values.push(data.planned_target);
    }
    if (data.planned_risk_reward !== undefined) {
      updates.push('planned_risk_reward = ?');
      values.push(data.planned_risk_reward);
    }
    if (data.planned_position_size !== undefined) {
      updates.push('planned_position_size = ?');
      values.push(data.planned_position_size);
    }
    if (data.planned_risk_amount !== undefined) {
      updates.push('planned_risk_amount = ?');
      values.push(data.planned_risk_amount);
    }
    if (data.thesis !== undefined) {
      updates.push('thesis = ?');
      values.push(data.thesis);
    }
    if (data.concerns !== undefined) {
      updates.push('concerns = ?');
      values.push(data.concerns);
    }
    
    if (updates.length === 0) return existing;
    
    values.push(id);
    const stmt = db.prepare(`UPDATE pre_trade_journals SET ${updates.join(', ')} WHERE id = ?`);
    stmt.run(...values);
    
    return this.findPreTradeJournalById(id);
  },
  
  deletePreTradeJournal(id: string): boolean {
    const stmt = db.prepare('DELETE FROM pre_trade_journals WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  },
  
  // ========================
  // POST-TRADE JOURNALS
  // ========================
  
  createPostTradeJournal(data: CreatePostTradeJournalInput) {
    const id = uuidv4();
    const now = new Date().toISOString();
    
    const stmt = db.prepare(`
      INSERT INTO post_trade_journals (
        id, user_id, trade_id, pre_trade_journal_id,
        emotional_state, emotional_score, execution_quality,
        followed_plan, rule_violations,
        what_went_well, what_went_wrong, lessons_learned,
        reflection_notes, ai_analysis_completed, ai_insights,
        would_repeat, repeat_reasoning, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      id,
      'local-user',
      data.trade_id || null,
      data.pre_trade_journal_id || null,
      JSON.stringify(data.emotional_state),
      data.emotional_score ?? null,
      data.execution_quality ?? null,
      data.followed_plan !== undefined ? (data.followed_plan ? 1 : 0) : null,
      data.rule_violations ? JSON.stringify(data.rule_violations) : null,
      data.what_went_well ?? null,
      data.what_went_wrong ?? null,
      data.lessons_learned ?? null,
      data.reflection_notes ?? null,
      0, // ai_analysis_completed
      null, // ai_insights
      data.would_repeat !== undefined ? (data.would_repeat ? 1 : 0) : null,
      data.repeat_reasoning ?? null,
      now
    );
    
    return this.findPostTradeJournalById(id)!;
  },
  
  findPostTradeJournalById(id: string) {
    const stmt = db.prepare('SELECT * FROM post_trade_journals WHERE id = ?');
    return stmt.get(id) as any | undefined;
  },
  
  findPostTradeJournalsByTradeId(tradeId: string) {
    const stmt = db.prepare('SELECT * FROM post_trade_journals WHERE trade_id = ? ORDER BY created_at DESC');
    return stmt.all(tradeId) as any[];
  },
  
  updatePostTradeJournal(id: string, data: Partial<CreatePostTradeJournalInput> & { 
    ai_analysis_completed?: boolean;
    ai_insights?: Record<string, any>;
  }) {
    const existing = this.findPostTradeJournalById(id);
    if (!existing) return null;
    
    const updates: string[] = [];
    const values: any[] = [];
    
    if (data.trade_id !== undefined) {
      updates.push('trade_id = ?');
      values.push(data.trade_id);
    }
    if (data.pre_trade_journal_id !== undefined) {
      updates.push('pre_trade_journal_id = ?');
      values.push(data.pre_trade_journal_id);
    }
    if (data.emotional_state !== undefined) {
      updates.push('emotional_state = ?');
      values.push(JSON.stringify(data.emotional_state));
    }
    if (data.emotional_score !== undefined) {
      updates.push('emotional_score = ?');
      values.push(data.emotional_score);
    }
    if (data.execution_quality !== undefined) {
      updates.push('execution_quality = ?');
      values.push(data.execution_quality);
    }
    if (data.followed_plan !== undefined) {
      updates.push('followed_plan = ?');
      values.push(data.followed_plan ? 1 : 0);
    }
    if (data.rule_violations !== undefined) {
      updates.push('rule_violations = ?');
      values.push(data.rule_violations ? JSON.stringify(data.rule_violations) : null);
    }
    if (data.what_went_well !== undefined) {
      updates.push('what_went_well = ?');
      values.push(data.what_went_well);
    }
    if (data.what_went_wrong !== undefined) {
      updates.push('what_went_wrong = ?');
      values.push(data.what_went_wrong);
    }
    if (data.lessons_learned !== undefined) {
      updates.push('lessons_learned = ?');
      values.push(data.lessons_learned);
    }
    if (data.reflection_notes !== undefined) {
      updates.push('reflection_notes = ?');
      values.push(data.reflection_notes);
    }
    if (data.ai_analysis_completed !== undefined) {
      updates.push('ai_analysis_completed = ?');
      values.push(data.ai_analysis_completed ? 1 : 0);
    }
    if (data.ai_insights !== undefined) {
      updates.push('ai_insights = ?');
      values.push(data.ai_insights ? JSON.stringify(data.ai_insights) : null);
    }
    if (data.would_repeat !== undefined) {
      updates.push('would_repeat = ?');
      values.push(data.would_repeat ? 1 : 0);
    }
    if (data.repeat_reasoning !== undefined) {
      updates.push('repeat_reasoning = ?');
      values.push(data.repeat_reasoning);
    }
    
    if (updates.length === 0) return existing;
    
    values.push(id);
    const stmt = db.prepare(`UPDATE post_trade_journals SET ${updates.join(', ')} WHERE id = ?`);
    stmt.run(...values);
    
    return this.findPostTradeJournalById(id);
  },
  
  deletePostTradeJournal(id: string): boolean {
    const stmt = db.prepare('DELETE FROM post_trade_journals WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  },
  
  // Link journal to trade
  linkPreTradeJournalToTrade(journalId: string, tradeId: string) {
    const stmt = db.prepare('UPDATE pre_trade_journals SET trade_id = ? WHERE id = ?');
    const result = stmt.run(tradeId, journalId);
    return result.changes > 0;
  },
  
  linkPostTradeJournalToTrade(journalId: string, tradeId: string) {
    const stmt = db.prepare('UPDATE post_trade_journals SET trade_id = ? WHERE id = ?');
    const result = stmt.run(tradeId, journalId);
    return result.changes > 0;
  },
};
```

**Step 2:** Update `src/main/database/dal/index.ts` to export journals:
```typescript
export { tradesDAL } from './trades';
export { strategiesDAL } from './strategies';
export { analyticsDAL } from './analytics';
export { gamificationDAL } from './gamification';
export { journalsDAL, type CreatePreTradeJournalInput, type CreatePostTradeJournalInput } from './journals';
```

---

### Task 4.2: Create Journal IPC Handlers

**Step 1:** Create `src/main/ipc/journals.ts`:
```typescript
import { ipcMain } from 'electron';
import { journalsDAL, type CreatePreTradeJournalInput, type CreatePostTradeJournalInput } from '../database/dal';
import { gamificationDAL } from '../database/dal';

export function registerJournalHandlers(): void {
  // ========================
  // PRE-TRADE JOURNALS
  // ========================
  
  ipcMain.handle('journals:createPreTrade', async (_, data: CreatePreTradeJournalInput) => {
    try {
      const journal = journalsDAL.createPreTradeJournal(data);
      
      // Update gamification for journaling
      gamificationDAL.updateStreak();
      gamificationDAL.checkAndAwardBadges();
      
      return { data: journal, error: null };
    } catch (error) {
      console.error('Error in journals:createPreTrade:', error);
      return { data: null, error: (error as Error).message };
    }
  });
  
  ipcMain.handle('journals:getPreTradeById', async (_, id: string) => {
    try {
      const journal = journalsDAL.findPreTradeJournalById(id);
      if (!journal) {
        return { data: null, error: 'Pre-trade journal not found' };
      }
      return { data: journal, error: null };
    } catch (error) {
      console.error('Error in journals:getPreTradeById:', error);
      return { data: null, error: (error as Error).message };
    }
  });
  
  ipcMain.handle('journals:getPreTradeByTradeId', async (_, tradeId: string) => {
    try {
      const journals = journalsDAL.findPreTradeJournalsByTradeId(tradeId);
      return { data: journals, error: null };
    } catch (error) {
      console.error('Error in journals:getPreTradeByTradeId:', error);
      return { data: null, error: (error as Error).message };
    }
  });
  
  ipcMain.handle('journals:updatePreTrade', async (_, id: string, data: Partial<CreatePreTradeJournalInput>) => {
    try {
      const journal = journalsDAL.updatePreTradeJournal(id, data);
      if (!journal) {
        return { data: null, error: 'Pre-trade journal not found' };
      }
      return { data: journal, error: null };
    } catch (error) {
      console.error('Error in journals:updatePreTrade:', error);
      return { data: null, error: (error as Error).message };
    }
  });
  
  ipcMain.handle('journals:deletePreTrade', async (_, id: string) => {
    try {
      const success = journalsDAL.deletePreTradeJournal(id);
      return { data: success, error: null };
    } catch (error) {
      console.error('Error in journals:deletePreTrade:', error);
      return { data: null, error: (error as Error).message };
    }
  });
  
  // ========================
  // POST-TRADE JOURNALS
  // ========================
  
  ipcMain.handle('journals:createPostTrade', async (_, data: CreatePostTradeJournalInput) => {
    try {
      const journal = journalsDAL.createPostTradeJournal(data);
      
      // Update gamification for journaling
      gamificationDAL.updateStreak();
      gamificationDAL.checkAndAwardBadges();
      
      return { data: journal, error: null };
    } catch (error) {
      console.error('Error in journals:createPostTrade:', error);
      return { data: null, error: (error as Error).message };
    }
  });
  
  ipcMain.handle('journals:getPostTradeById', async (_, id: string) => {
    try {
      const journal = journalsDAL.findPostTradeJournalById(id);
      if (!journal) {
        return { data: null, error: 'Post-trade journal not found' };
      }
      return { data: journal, error: null };
    } catch (error) {
      console.error('Error in journals:getPostTradeById:', error);
      return { data: null, error: (error as Error).message };
    }
  });
  
  ipcMain.handle('journals:getPostTradeByTradeId', async (_, tradeId: string) => {
    try {
      const journals = journalsDAL.findPostTradeJournalsByTradeId(tradeId);
      return { data: journals, error: null };
    } catch (error) {
      console.error('Error in journals:getPostTradeByTradeId:', error);
      return { data: null, error: (error as Error).message };
    }
  });
  
  ipcMain.handle('journals:updatePostTrade', async (_, id: string, data: Partial<CreatePostTradeJournalInput>) => {
    try {
      const journal = journalsDAL.updatePostTradeJournal(id, data);
      if (!journal) {
        return { data: null, error: 'Post-trade journal not found' };
      }
      return { data: journal, error: null };
    } catch (error) {
      console.error('Error in journals:updatePostTrade:', error);
      return { data: null, error: (error as Error).message };
    }
  });
  
  ipcMain.handle('journals:deletePostTrade', async (_, id: string) => {
    try {
      const success = journalsDAL.deletePostTradeJournal(id);
      return { data: success, error: null };
    } catch (error) {
      console.error('Error in journals:deletePostTrade:', error);
      return { data: null, error: (error as Error).message };
    }
  });
  
  // ========================
  // LINKING
  // ========================
  
  ipcMain.handle('journals:linkPreTradeToTrade', async (_, journalId: string, tradeId: string) => {
    try {
      const success = journalsDAL.linkPreTradeJournalToTrade(journalId, tradeId);
      return { data: success, error: null };
    } catch (error) {
      console.error('Error in journals:linkPreTradeToTrade:', error);
      return { data: null, error: (error as Error).message };
    }
  });
  
  ipcMain.handle('journals:linkPostTradeToTrade', async (_, journalId: string, tradeId: string) => {
    try {
      const success = journalsDAL.linkPostTradeJournalToTrade(journalId, tradeId);
      return { data: success, error: null };
    } catch (error) {
      console.error('Error in journals:linkPostTradeToTrade:', error);
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

export function registerAllIPCHandlers(): void {
  console.log('Registering IPC handlers...');
  
  registerTradeHandlers();
  registerStrategyHandlers();
  registerAnalyticsHandlers();
  registerJournalHandlers();
  
  console.log('IPC handlers registered');
}
```

---

### Task 4.3: Update Preload Script

**Step 1:** Update `src/main/preload.ts` to add journal methods:
```typescript
// Add to the electronAPI object:
journals: {
  // Pre-trade
  createPreTrade: (data) => ipcRenderer.invoke('journals:createPreTrade', data),
  getPreTradeById: (id) => ipcRenderer.invoke('journals:getPreTradeById', id),
  getPreTradeByTradeId: (tradeId) => ipcRenderer.invoke('journals:getPreTradeByTradeId', tradeId),
  updatePreTrade: (id, data) => ipcRenderer.invoke('journals:updatePreTrade', id, data),
  deletePreTrade: (id) => ipcRenderer.invoke('journals:deletePreTrade', id),
  
  // Post-trade
  createPostTrade: (data) => ipcRenderer.invoke('journals:createPostTrade', data),
  getPostTradeById: (id) => ipcRenderer.invoke('journals:getPostTradeById', id),
  getPostTradeByTradeId: (tradeId) => ipcRenderer.invoke('journals:getPostTradeByTradeId', tradeId),
  updatePostTrade: (id, data) => ipcRenderer.invoke('journals:updatePostTrade', id, data),
  deletePostTrade: (id) => ipcRenderer.invoke('journals:deletePostTrade', id),
  
  // Linking
  linkPreTradeToTrade: (journalId, tradeId) => ipcRenderer.invoke('journals:linkPreTradeToTrade', journalId, tradeId),
  linkPostTradeToTrade: (journalId, tradeId) => ipcRenderer.invoke('journals:linkPostTradeToTrade', journalId, tradeId),
},
```

---

### Task 4.4: Create EmotionSelector Component

**Step 1:** Create `src/renderer/components/trades/EmotionSelector.tsx`:
```tsx
import React from 'react';
import { cn } from '@/lib/utils/cn';

interface EmotionSelectorProps {
  value: string[];
  onChange: (emotions: string[]) => void;
  type?: 'pre-trade' | 'post-trade';
  className?: string;
}

const PRE_TRADE_EMOTIONS = [
  { value: 'confident', label: 'Confident', emoji: '💪' },
  { value: 'anxious', label: 'Anxious', emoji: '😰' },
  { value: 'neutral', label: 'Neutral', emoji: '😐' },
  { value: 'fomo', label: 'FOMO', emoji: '😱' },
  { value: 'revenge', label: 'Revenge', emoji: '😤' },
  { value: 'overconfident', label: 'Overconfident', emoji: '🤩' },
  { value: 'fearful', label: 'Fearful', emoji: '😨' },
  { value: 'greedy', label: 'Greedy', emoji: '🤑' },
  { value: 'frustrated', label: 'Frustrated', emoji: '😣' },
  { value: 'disciplined', label: 'Disciplined', emoji: '🎯' },
  { value: 'impulsive', label: 'Impulsive', emoji: '⚡' },
  { value: 'patient', label: 'Patient', emoji: '🧘' },
];

const POST_TRADE_EMOTIONS = [
  { value: 'relieved', label: 'Relieved', emoji: '😌' },
  { value: 'regret', label: 'Regret', emoji: '😔' },
  { value: 'validated', label: 'Validated', emoji: '✅' },
  { value: 'frustrated', label: 'Frustrated', emoji: '😣' },
  { value: 'proud', label: 'Proud', emoji: '🏆' },
  { value: 'disappointed', label: 'Disappointed', emoji: '😞' },
  { value: 'confident', label: 'Confident', emoji: '💪' },
  { value: 'anxious', label: 'Anxious', emoji: '😰' },
  { value: 'greedy', label: 'Greedy', emoji: '🤑' },
  { value: 'disciplined', label: 'Disciplined', emoji: '🎯' },
];

export function EmotionSelector({
  value = [],
  onChange,
  type = 'pre-trade',
  className,
}: EmotionSelectorProps) {
  const emotions = type === 'pre-trade' ? PRE_TRADE_EMOTIONS : POST_TRADE_EMOTIONS;

  const toggleEmotion = (emotion: string) => {
    if (value.includes(emotion)) {
      onChange(value.filter(e => e !== emotion));
    } else {
      onChange([...value, emotion]);
    }
  };

  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {emotions.map(emotion => {
        const isSelected = value.includes(emotion.value);
        
        return (
          <button
            key={emotion.value}
            type="button"
            onClick={() => toggleEmotion(emotion.value)}
            className={cn(
              'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 border',
              isSelected
                ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                : 'bg-background-secondary text-muted-foreground border-border hover:bg-accent hover:text-foreground'
            )}
          >
            <span>{emotion.emoji}</span>
            <span>{emotion.label}</span>
          </button>
        );
      })}
    </div>
  );
}
```

---

### Task 4.5: Create StarRating Component

**Step 1:** Create `src/renderer/components/trades/StarRating.tsx`:
```tsx
import React, { useState } from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface StarRatingProps {
  value: number;
  onChange?: (rating: number) => void;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  readonly?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
};

export function StarRating({
  value = 0,
  onChange,
  max = 5,
  size = 'md',
  readonly = false,
  className,
}: StarRatingProps) {
  const [hoverValue, setHoverValue] = useState<number | null>(null);

  const handleClick = (rating: number) => {
    if (!readonly && onChange) {
      onChange(rating);
    }
  };

  const handleMouseEnter = (rating: number) => {
    if (!readonly) {
      setHoverValue(rating);
    }
  };

  const handleMouseLeave = () => {
    if (!readonly) {
      setHoverValue(null);
    }
  };

  const displayValue = hoverValue !== null ? hoverValue : value;

  return (
    <div className={cn('flex items-center gap-1', className)}>
      {Array.from({ length: max }, (_, i) => i + 1).map(rating => {
        const isFilled = rating <= displayValue;
        
        return (
          <button
            key={rating}
            type="button"
            onClick={() => handleClick(rating)}
            onMouseEnter={() => handleMouseEnter(rating)}
            onMouseLeave={handleMouseLeave}
            disabled={readonly}
            className={cn(
              'transition-all duration-150',
              readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'
            )}
            aria-label={`Rate ${rating} out of ${max}`}
          >
            <Star
              className={cn(
                sizeClasses[size],
                'transition-colors duration-150',
                isFilled
                  ? 'fill-yellow-500 text-yellow-500'
                  : 'fill-none text-gray-600'
              )}
            />
          </button>
        );
      })}
    </div>
  );
}
```

---

### Task 4.6: Create useJournals Hook

**Step 1:** Create `src/renderer/hooks/useJournals.ts`:
```typescript
import { useState, useCallback } from 'react';
import type { PreTradeJournal, PostTradeJournal, APIResponse } from '../types';
import { useToast } from './use-toast';

interface CreatePreTradeJournalInput {
  trade_id?: string | null;
  emotional_state: string[];
  emotional_score?: number | null;
  market_bias?: 'bullish' | 'bearish' | 'neutral' | 'choppy' | null;
  spy_trend?: 'uptrend' | 'downtrend' | 'sideways' | null;
  setup_quality?: number | null;
  thesis?: string | null;
  concerns?: string | null;
  planned_entry?: number | null;
  planned_stop_loss?: number | null;
  planned_target?: number | null;
}

interface CreatePostTradeJournalInput {
  trade_id?: string | null;
  pre_trade_journal_id?: string | null;
  emotional_state: string[];
  emotional_score?: number | null;
  execution_quality?: number | null;
  followed_plan?: boolean | null;
  rule_violations?: string[] | null;
  what_went_well?: string | null;
  what_went_wrong?: string | null;
  lessons_learned?: string | null;
  reflection_notes?: string | null;
  would_repeat?: boolean | null;
  repeat_reasoning?: string | null;
}

export function useJournals() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // ========================
  // PRE-TRADE JOURNALS
  // ========================
  
  const createPreTradeJournal = useCallback(async (data: CreatePreTradeJournalInput): Promise<PreTradeJournal | null> => {
    setLoading(true);
    try {
      const response: APIResponse<PreTradeJournal> = await window.electronAPI.journals.createPreTrade(data);
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      toast({
        title: 'Success',
        description: 'Pre-trade journal created',
        variant: 'success',
      });
      
      return response.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create pre-trade journal';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const getPreTradeJournalsByTrade = useCallback(async (tradeId: string): Promise<PreTradeJournal[]> => {
    try {
      const response: APIResponse<PreTradeJournal[]> = await window.electronAPI.journals.getPreTradeByTradeId(tradeId);
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      return response.data || [];
    } catch (err) {
      console.error('Failed to fetch pre-trade journals:', err);
      return [];
    }
  }, []);

  const updatePreTradeJournal = useCallback(async (id: string, data: Partial<CreatePreTradeJournalInput>): Promise<PreTradeJournal | null> => {
    setLoading(true);
    try {
      const response: APIResponse<PreTradeJournal> = await window.electronAPI.journals.updatePreTrade(id, data);
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      toast({
        title: 'Success',
        description: 'Pre-trade journal updated',
        variant: 'success',
      });
      
      return response.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update pre-trade journal';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // ========================
  // POST-TRADE JOURNALS
  // ========================
  
  const createPostTradeJournal = useCallback(async (data: CreatePostTradeJournalInput): Promise<PostTradeJournal | null> => {
    setLoading(true);
    try {
      const response: APIResponse<PostTradeJournal> = await window.electronAPI.journals.createPostTrade(data);
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      toast({
        title: 'Success',
        description: 'Post-trade journal created',
        variant: 'success',
      });
      
      return response.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create post-trade journal';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const getPostTradeJournalsByTrade = useCallback(async (tradeId: string): Promise<PostTradeJournal[]> => {
    try {
      const response: APIResponse<PostTradeJournal[]> = await window.electronAPI.journals.getPostTradeByTradeId(tradeId);
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      return response.data || [];
    } catch (err) {
      console.error('Failed to fetch post-trade journals:', err);
      return [];
    }
  }, []);

  const updatePostTradeJournal = useCallback(async (id: string, data: Partial<CreatePostTradeJournalInput>): Promise<PostTradeJournal | null> => {
    setLoading(true);
    try {
      const response: APIResponse<PostTradeJournal> = await window.electronAPI.journals.updatePostTrade(id, data);
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      toast({
        title: 'Success',
        description: 'Post-trade journal updated',
        variant: 'success',
      });
      
      return response.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update post-trade journal';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // ========================
  // LINKING
  // ========================
  
  const linkPreTradeToTrade = useCallback(async (journalId: string, tradeId: string): Promise<boolean> => {
    try {
      const response: APIResponse<boolean> = await window.electronAPI.journals.linkPreTradeToTrade(journalId, tradeId);
      return response.data ?? false;
    } catch {
      return false;
    }
  }, []);

  const linkPostTradeToTrade = useCallback(async (journalId: string, tradeId: string): Promise<boolean> => {
    try {
      const response: APIResponse<boolean> = await window.electronAPI.journals.linkPostTradeToTrade(journalId, tradeId);
      return response.data ?? false;
    } catch {
      return false;
    }
  }, []);

  return {
    loading,
    // Pre-trade
    createPreTradeJournal,
    getPreTradeJournalsByTrade,
    updatePreTradeJournal,
    // Post-trade
    createPostTradeJournal,
    getPostTradeJournalsByTrade,
    updatePostTradeJournal,
    // Linking
    linkPreTradeToTrade,
    linkPostTradeToTrade,
  };
}
```

---

### Task 4.7: Create PreTradeJournalForm Component

**Step 1:** Create `src/renderer/components/journals/PreTradeJournalForm.tsx`:
```tsx
import React, { useState } from 'react';
import { EmotionSelector } from '@/components/trades/EmotionSelector';
import { StarRating } from '@/components/trades/StarRating';
import { cn } from '@/lib/utils/cn';

interface PreTradeJournalFormProps {
  onSubmit: (data: PreTradeJournalData) => Promise<void>;
  onCancel: () => void;
  initialData?: Partial<PreTradeJournalData>;
  loading?: boolean;
}

export interface PreTradeJournalData {
  emotional_state: string[];
  emotional_score: number;
  market_bias: 'bullish' | 'bearish' | 'neutral' | 'choppy' | null;
  spy_trend: 'uptrend' | 'downtrend' | 'sideways' | null;
  setup_quality: number;
  thesis: string;
  concerns: string;
  planned_entry: number | null;
  planned_stop_loss: number | null;
  planned_target: number | null;
}

export function PreTradeJournalForm({
  onSubmit,
  onCancel,
  initialData,
  loading,
}: PreTradeJournalFormProps) {
  const [formData, setFormData] = useState<PreTradeJournalData>({
    emotional_state: initialData?.emotional_state || [],
    emotional_score: initialData?.emotional_score || 5,
    market_bias: initialData?.market_bias || null,
    spy_trend: initialData?.spy_trend || null,
    setup_quality: initialData?.setup_quality || 3,
    thesis: initialData?.thesis || '',
    concerns: initialData?.concerns || '',
    planned_entry: initialData?.planned_entry || null,
    planned_stop_loss: initialData?.planned_stop_loss || null,
    planned_target: initialData?.planned_target || null,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Emotional State */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-3">
          How are you feeling before this trade?
        </label>
        <EmotionSelector
          value={formData.emotional_state}
          onChange={(emotions) => setFormData({ ...formData, emotional_state: emotions })}
          type="pre-trade"
        />
      </div>

      {/* Emotional Score Slider */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Emotional Readiness Score: {formData.emotional_score}/10
        </label>
        <input
          type="range"
          min="1"
          max="10"
          value={formData.emotional_score}
          onChange={(e) => setFormData({ ...formData, emotional_score: parseInt(e.target.value) })}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <span>Not Ready</span>
          <span>Peak State</span>
        </div>
      </div>

      {/* Market Context */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Market Bias
          </label>
          <select
            value={formData.market_bias || ''}
            onChange={(e) => setFormData({ ...formData, market_bias: e.target.value as any || null })}
            className="w-full px-3 py-2 bg-input border border-border rounded-md"
          >
            <option value="">Select...</option>
            <option value="bullish">Bullish</option>
            <option value="bearish">Bearish</option>
            <option value="neutral">Neutral</option>
            <option value="choppy">Choppy</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            SPY Trend
          </label>
          <select
            value={formData.spy_trend || ''}
            onChange={(e) => setFormData({ ...formData, spy_trend: e.target.value as any || null })}
            className="w-full px-3 py-2 bg-input border border-border rounded-md"
          >
            <option value="">Select...</option>
            <option value="uptrend">Uptrend</option>
            <option value="downtrend">Downtrend</option>
            <option value="sideways">Sideways</option>
          </select>
        </div>
      </div>

      {/* Setup Quality */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Setup Quality
        </label>
        <StarRating
          value={formData.setup_quality}
          onChange={(rating) => setFormData({ ...formData, setup_quality: rating })}
          max={5}
        />
      </div>

      {/* Planned Levels */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Planned Entry
          </label>
          <input
            type="number"
            step="0.01"
            value={formData.planned_entry || ''}
            onChange={(e) => setFormData({ ...formData, planned_entry: e.target.value ? parseFloat(e.target.value) : null })}
            className="w-full px-3 py-2 bg-input border border-border rounded-md"
            placeholder="0.00"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Planned Stop
          </label>
          <input
            type="number"
            step="0.01"
            value={formData.planned_stop_loss || ''}
            onChange={(e) => setFormData({ ...formData, planned_stop_loss: e.target.value ? parseFloat(e.target.value) : null })}
            className="w-full px-3 py-2 bg-input border border-border rounded-md"
            placeholder="0.00"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Planned Target
          </label>
          <input
            type="number"
            step="0.01"
            value={formData.planned_target || ''}
            onChange={(e) => setFormData({ ...formData, planned_target: e.target.value ? parseFloat(e.target.value) : null })}
            className="w-full px-3 py-2 bg-input border border-border rounded-md"
            placeholder="0.00"
          />
        </div>
      </div>

      {/* Thesis */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Trade Thesis
        </label>
        <textarea
          value={formData.thesis}
          onChange={(e) => setFormData({ ...formData, thesis: e.target.value })}
          rows={3}
          className="w-full px-3 py-2 bg-input border border-border rounded-md"
          placeholder="Why are you taking this trade? What's the setup?"
        />
      </div>

      {/* Concerns */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Concerns / Red Flags
        </label>
        <textarea
          value={formData.concerns}
          onChange={(e) => setFormData({ ...formData, concerns: e.target.value })}
          rows={2}
          className="w-full px-3 py-2 bg-input border border-border rounded-md"
          placeholder="Any concerns about this trade?"
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-2 border border-border rounded-md hover:bg-accent"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading || formData.emotional_state.length === 0}
          className={cn(
            'flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90',
            (loading || formData.emotional_state.length === 0) && 'opacity-50 cursor-not-allowed'
          )}
        >
          {loading ? 'Saving...' : 'Save Journal'}
        </button>
      </div>
    </form>
  );
}
```

---

### Task 4.8: Create PostTradeJournalForm Component

**Step 1:** Create `src/renderer/components/journals/PostTradeJournalForm.tsx`:
```tsx
import React, { useState } from 'react';
import { EmotionSelector } from '@/components/trades/EmotionSelector';
import { StarRating } from '@/components/trades/StarRating';
import { cn } from '@/lib/utils/cn';

interface PostTradeJournalFormProps {
  onSubmit: (data: PostTradeJournalData) => Promise<void>;
  onCancel: () => void;
  initialData?: Partial<PostTradeJournalData>;
  loading?: boolean;
}

export interface PostTradeJournalData {
  emotional_state: string[];
  emotional_score: number;
  execution_quality: number;
  followed_plan: boolean | null;
  rule_violations: string[];
  what_went_well: string;
  what_went_wrong: string;
  lessons_learned: string;
  reflection_notes: string;
  would_repeat: boolean | null;
  repeat_reasoning: string;
}

const RULE_VIOLATIONS = [
  { value: 'moved_stop_loss', label: 'Moved Stop Loss' },
  { value: 'oversized_position', label: 'Oversized Position' },
  { value: 'exited_early', label: 'Exited Early' },
  { value: 'no_stop_loss', label: 'No Stop Loss' },
  { value: 'revenge_trade', label: 'Revenge Trade' },
  { value: 'overtrading', label: 'Overtrading' },
];

export function PostTradeJournalForm({
  onSubmit,
  onCancel,
  initialData,
  loading,
}: PostTradeJournalFormProps) {
  const [formData, setFormData] = useState<PostTradeJournalData>({
    emotional_state: initialData?.emotional_state || [],
    emotional_score: initialData?.emotional_score || 5,
    execution_quality: initialData?.execution_quality || 3,
    followed_plan: initialData?.followed_plan ?? null,
    rule_violations: initialData?.rule_violations || [],
    what_went_well: initialData?.what_went_well || '',
    what_went_wrong: initialData?.what_went_wrong || '',
    lessons_learned: initialData?.lessons_learned || '',
    reflection_notes: initialData?.reflection_notes || '',
    would_repeat: initialData?.would_repeat ?? null,
    repeat_reasoning: initialData?.repeat_reasoning || '',
  });

  const toggleRuleViolation = (violation: string) => {
    if (formData.rule_violations.includes(violation)) {
      setFormData({
        ...formData,
        rule_violations: formData.rule_violations.filter(v => v !== violation),
      });
    } else {
      setFormData({
        ...formData,
        rule_violations: [...formData.rule_violations, violation],
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Emotional State */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-3">
          How are you feeling after this trade?
        </label>
        <EmotionSelector
          value={formData.emotional_state}
          onChange={(emotions) => setFormData({ ...formData, emotional_state: emotions })}
          type="post-trade"
        />
      </div>

      {/* Emotional Score */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Emotional State Score: {formData.emotional_score}/10
        </label>
        <input
          type="range"
          min="1"
          max="10"
          value={formData.emotional_score}
          onChange={(e) => setFormData({ ...formData, emotional_score: parseInt(e.target.value) })}
          className="w-full"
        />
      </div>

      {/* Execution Quality */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Execution Quality
        </label>
        <StarRating
          value={formData.execution_quality}
          onChange={(rating) => setFormData({ ...formData, execution_quality: rating })}
          max={5}
        />
        <p className="text-xs text-muted-foreground mt-1">
          How well did you execute the trade plan?
        </p>
      </div>

      {/* Followed Plan */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Did you follow your trading plan?
        </label>
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => setFormData({ ...formData, followed_plan: true })}
            className={cn(
              'px-4 py-2 rounded-md border transition-colors',
              formData.followed_plan === true
                ? 'bg-profit text-white border-profit'
                : 'border-border hover:bg-accent'
            )}
          >
            Yes
          </button>
          <button
            type="button"
            onClick={() => setFormData({ ...formData, followed_plan: false })}
            className={cn(
              'px-4 py-2 rounded-md border transition-colors',
              formData.followed_plan === false
                ? 'bg-loss text-white border-loss'
                : 'border-border hover:bg-accent'
            )}
          >
            No
          </button>
        </div>
      </div>

      {/* Rule Violations */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-3">
          Any rule violations?
        </label>
        <div className="flex flex-wrap gap-2">
          {RULE_VIOLATIONS.map(violation => (
            <button
              key={violation.value}
              type="button"
              onClick={() => toggleRuleViolation(violation.value)}
              className={cn(
                'px-3 py-1.5 rounded-full text-sm border transition-colors',
                formData.rule_violations.includes(violation.value)
                  ? 'bg-loss text-white border-loss'
                  : 'border-border hover:bg-accent'
              )}
            >
              {violation.label}
            </button>
          ))}
        </div>
      </div>

      {/* Reflection */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            What went well?
          </label>
          <textarea
            value={formData.what_went_well}
            onChange={(e) => setFormData({ ...formData, what_went_well: e.target.value })}
            rows={2}
            className="w-full px-3 py-2 bg-input border border-border rounded-md"
            placeholder="What did you do right in this trade?"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            What went wrong?
          </label>
          <textarea
            value={formData.what_went_wrong}
            onChange={(e) => setFormData({ ...formData, what_went_wrong: e.target.value })}
            rows={2}
            className="w-full px-3 py-2 bg-input border border-border rounded-md"
            placeholder="What could you have done better?"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Lessons Learned
          </label>
          <textarea
            value={formData.lessons_learned}
            onChange={(e) => setFormData({ ...formData, lessons_learned: e.target.value })}
            rows={2}
            className="w-full px-3 py-2 bg-input border border-border rounded-md"
            placeholder="What did this trade teach you?"
          />
        </div>
      </div>

      {/* Would Repeat */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Would you take this trade again?
        </label>
        <div className="flex gap-4 mb-2">
          <button
            type="button"
            onClick={() => setFormData({ ...formData, would_repeat: true })}
            className={cn(
              'px-4 py-2 rounded-md border transition-colors',
              formData.would_repeat === true
                ? 'bg-profit text-white border-profit'
                : 'border-border hover:bg-accent'
            )}
          >
            Yes
          </button>
          <button
            type="button"
            onClick={() => setFormData({ ...formData, would_repeat: false })}
            className={cn(
              'px-4 py-2 rounded-md border transition-colors',
              formData.would_repeat === false
                ? 'bg-loss text-white border-loss'
                : 'border-border hover:bg-accent'
            )}
          >
            No
          </button>
        </div>
        {formData.would_repeat !== null && (
          <textarea
            value={formData.repeat_reasoning}
            onChange={(e) => setFormData({ ...formData, repeat_reasoning: e.target.value })}
            rows={2}
            className="w-full px-3 py-2 bg-input border border-border rounded-md"
            placeholder="Why or why not?"
          />
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-2 border border-border rounded-md hover:bg-accent"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading || formData.emotional_state.length === 0}
          className={cn(
            'flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90',
            (loading || formData.emotional_state.length === 0) && 'opacity-50 cursor-not-allowed'
          )}
        >
          {loading ? 'Saving...' : 'Save Journal'}
        </button>
      </div>
    </form>
  );
}
```

---

### Task 4.9: Create JournalCard Component

**Step 1:** Create `src/renderer/components/journals/JournalCard.tsx`:
```tsx
import React from 'react';
import { StarRating } from '@/components/trades/StarRating';
import { formatDateTime } from '@/lib/utils/formatting';
import { parseJsonField } from '@/types';
import { cn } from '@/lib/utils/cn';
import { Brain, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

interface JournalCardProps {
  type: 'pre-trade' | 'post-trade';
  journal: any;
  onEdit?: () => void;
}

// Map emotion values to emojis
const EMOTION_EMOJIS: Record<string, string> = {
  confident: '💪',
  anxious: '😰',
  neutral: '😐',
  fomo: '😱',
  revenge: '😤',
  overconfident: '🤩',
  fearful: '😨',
  greedy: '🤑',
  frustrated: '😣',
  disciplined: '🎯',
  impulsive: '⚡',
  patient: '🧘',
  relieved: '😌',
  regret: '😔',
  validated: '✅',
  proud: '🏆',
  disappointed: '😞',
};

export function JournalCard({ type, journal, onEdit }: JournalCardProps) {
  const emotionalState = parseJsonField<string[]>(journal.emotional_state, []);
  
  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
          <Brain className="w-4 h-4 text-primary" />
          {type === 'pre-trade' ? 'Pre-Trade Journal' : 'Post-Trade Journal'}
        </h3>
        <span className="text-xs text-muted-foreground">
          {formatDateTime(journal.created_at)}
        </span>
      </div>

      {/* Emotions */}
      <div className="mb-4">
        <p className="text-xs text-muted-foreground mb-2">Emotional State</p>
        <div className="flex flex-wrap gap-2">
          {emotionalState.map((emotion: string) => (
            <span
              key={emotion}
              className="inline-flex items-center gap-1 px-2 py-1 bg-background-secondary rounded-full text-xs"
            >
              <span>{EMOTION_EMOJIS[emotion] || '🔘'}</span>
              <span className="capitalize">{emotion}</span>
            </span>
          ))}
        </div>
      </div>

      {/* Score */}
      {journal.emotional_score && (
        <div className="mb-4">
          <p className="text-xs text-muted-foreground mb-1">
            Emotional Score: {journal.emotional_score}/10
          </p>
          <div className="h-2 bg-background-secondary rounded-full">
            <div
              className={cn(
                'h-full rounded-full',
                journal.emotional_score >= 7 ? 'bg-profit' :
                journal.emotional_score >= 4 ? 'bg-yellow-500' : 'bg-loss'
              )}
              style={{ width: `${journal.emotional_score * 10}%` }}
            />
          </div>
        </div>
      )}

      {type === 'pre-trade' && (
        <>
          {/* Setup Quality */}
          {journal.setup_quality && (
            <div className="mb-4">
              <p className="text-xs text-muted-foreground mb-1">Setup Quality</p>
              <StarRating value={journal.setup_quality} readonly size="sm" />
            </div>
          )}

          {/* Market Context */}
          {(journal.market_bias || journal.spy_trend) && (
            <div className="flex gap-4 mb-4">
              {journal.market_bias && (
                <div>
                  <p className="text-xs text-muted-foreground">Market Bias</p>
                  <p className="text-sm capitalize">{journal.market_bias}</p>
                </div>
              )}
              {journal.spy_trend && (
                <div>
                  <p className="text-xs text-muted-foreground">SPY Trend</p>
                  <p className="text-sm capitalize">{journal.spy_trend}</p>
                </div>
              )}
            </div>
          )}

          {/* Thesis */}
          {journal.thesis && (
            <div className="mb-4">
              <p className="text-xs text-muted-foreground mb-1">Thesis</p>
              <p className="text-sm">{journal.thesis}</p>
            </div>
          )}

          {/* Concerns */}
          {journal.concerns && (
            <div className="mb-4">
              <p className="text-xs text-muted-foreground mb-1">Concerns</p>
              <p className="text-sm text-yellow-500">{journal.concerns}</p>
            </div>
          )}
        </>
      )}

      {type === 'post-trade' && (
        <>
          {/* Followed Plan */}
          {journal.followed_plan !== null && (
            <div className="flex items-center gap-2 mb-4">
              {journal.followed_plan ? (
                <CheckCircle className="w-4 h-4 text-profit" />
              ) : (
                <XCircle className="w-4 h-4 text-loss" />
              )}
              <span className="text-sm">
                {journal.followed_plan ? 'Followed trading plan' : 'Did not follow plan'}
              </span>
            </div>
          )}

          {/* Execution Quality */}
          {journal.execution_quality && (
            <div className="mb-4">
              <p className="text-xs text-muted-foreground mb-1">Execution Quality</p>
              <StarRating value={journal.execution_quality} readonly size="sm" />
            </div>
          )}

          {/* Rule Violations */}
          {journal.rule_violations && (
            <div className="mb-4">
              {(() => {
                const violations = parseJsonField<string[]>(journal.rule_violations, []);
                if (violations.length === 0) return null;
                return (
                  <>
                    <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 text-loss" />
                      Rule Violations
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {violations.map((v: string) => (
                        <span
                          key={v}
                          className="px-2 py-1 bg-loss/10 text-loss rounded-full text-xs"
                        >
                          {v.replace(/_/g, ' ')}
                        </span>
                      ))}
                    </div>
                  </>
                );
              })()}
            </div>
          )}

          {/* What went well/wrong */}
          {journal.what_went_well && (
            <div className="mb-4">
              <p className="text-xs text-profit mb-1">What went well</p>
              <p className="text-sm">{journal.what_went_well}</p>
            </div>
          )}

          {journal.what_went_wrong && (
            <div className="mb-4">
              <p className="text-xs text-loss mb-1">What went wrong</p>
              <p className="text-sm">{journal.what_went_wrong}</p>
            </div>
          )}

          {/* Lessons */}
          {journal.lessons_learned && (
            <div className="mb-4">
              <p className="text-xs text-muted-foreground mb-1">Lessons Learned</p>
              <p className="text-sm">{journal.lessons_learned}</p>
            </div>
          )}
        </>
      )}

      {onEdit && (
        <button
          onClick={onEdit}
          className="text-sm text-primary hover:underline"
        >
          Edit
        </button>
      )}
    </div>
  );
}
```

---

### Task 4.10: Create TradeDetail Page

**Step 1:** Create `src/renderer/pages/TradeDetail.tsx`:
```tsx
import React, { useEffect, useState } from 'react';
import { useTrades } from '@/hooks/useTrades';
import { useJournals } from '@/hooks/useJournals';
import { JournalCard } from '@/components/journals/JournalCard';
import { PreTradeJournalForm } from '@/components/journals/PreTradeJournalForm';
import { PostTradeJournalForm } from '@/components/journals/PostTradeJournalForm';
import { formatCurrency, formatDateTime, formatPercent, getPnLClass } from '@/lib/utils/formatting';
import type { TradeWithRelations, PreTradeJournal, PostTradeJournal } from '@/types';
import { ArrowLeft, Plus, TrendingUp, TrendingDown, Edit2, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface TradeDetailProps {
  tradeId: string;
  onNavigate: (path: string) => void;
}

export function TradeDetail({ tradeId, onNavigate }: TradeDetailProps) {
  const { getTrade, deleteTrade } = useTrades({ autoFetch: false });
  const { 
    createPreTradeJournal, 
    createPostTradeJournal,
    getPreTradeJournalsByTrade,
    getPostTradeJournalsByTrade,
    loading: journalLoading 
  } = useJournals();
  
  const [trade, setTrade] = useState<TradeWithRelations | null>(null);
  const [preJournals, setPreJournals] = useState<PreTradeJournal[]>([]);
  const [postJournals, setPostJournals] = useState<PostTradeJournal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPreJournalForm, setShowPreJournalForm] = useState(false);
  const [showPostJournalForm, setShowPostJournalForm] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const tradeData = await getTrade(tradeId);
      if (tradeData) {
        setTrade(tradeData);
        
        // Fetch journals
        const pre = await getPreTradeJournalsByTrade(tradeId);
        const post = await getPostTradeJournalsByTrade(tradeId);
        setPreJournals(pre);
        setPostJournals(post);
      }
      setLoading(false);
    };
    
    fetchData();
  }, [tradeId, getTrade, getPreTradeJournalsByTrade, getPostTradeJournalsByTrade]);

  const handleDeleteTrade = async () => {
    if (window.confirm('Are you sure you want to delete this trade?')) {
      const success = await deleteTrade(tradeId);
      if (success) {
        onNavigate('/trades');
      }
    }
  };

  const handleCreatePreJournal = async (data: any) => {
    const journal = await createPreTradeJournal({
      ...data,
      trade_id: tradeId,
    });
    if (journal) {
      setPreJournals([journal, ...preJournals]);
      setShowPreJournalForm(false);
    }
  };

  const handleCreatePostJournal = async (data: any) => {
    const journal = await createPostTradeJournal({
      ...data,
      trade_id: tradeId,
      pre_trade_journal_id: preJournals[0]?.id || null,
    });
    if (journal) {
      setPostJournals([journal, ...postJournals]);
      setShowPostJournalForm(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-background-secondary rounded w-48" />
          <div className="h-32 bg-background-secondary rounded" />
          <div className="h-48 bg-background-secondary rounded" />
        </div>
      </div>
    );
  }

  if (!trade) {
    return (
      <div className="p-8">
        <p className="text-muted-foreground">Trade not found</p>
        <button
          onClick={() => onNavigate('/trades')}
          className="text-primary hover:underline mt-4"
        >
          Back to Trades
        </button>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl">
      {/* Back button */}
      <button
        onClick={() => onNavigate('/trades')}
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Trades
      </button>

      {/* Trade Header */}
      <div className="bg-card border border-border rounded-lg p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold font-mono">{trade.ticker}</h1>
              <span
                className={cn(
                  'inline-flex items-center gap-1 px-2 py-1 rounded text-sm font-medium',
                  trade.direction === 'long'
                    ? 'bg-profit/10 text-profit'
                    : 'bg-loss/10 text-loss'
                )}
              >
                {trade.direction === 'long' ? (
                  <TrendingUp className="w-4 h-4" />
                ) : (
                  <TrendingDown className="w-4 h-4" />
                )}
                {trade.direction.toUpperCase()}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              {formatDateTime(trade.entry_date)}
              {trade.exit_date && ` → ${formatDateTime(trade.exit_date)}`}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => onNavigate(`/trades/${tradeId}/edit`)}
              className="p-2 text-muted-foreground hover:text-foreground"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={handleDeleteTrade}
              className="p-2 text-muted-foreground hover:text-loss"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Trade Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-muted-foreground">Entry Price</p>
            <p className="font-mono font-medium">${trade.entry_price.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Exit Price</p>
            <p className="font-mono font-medium">
              {trade.exit_price ? `$${trade.exit_price.toFixed(2)}` : '-'}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Quantity</p>
            <p className="font-mono font-medium">{trade.quantity}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">P&L</p>
            <p className={cn('font-mono font-bold text-lg', getPnLClass(trade.net_pnl))}>
              {formatCurrency(trade.net_pnl)}
            </p>
          </div>
        </div>

        {/* Additional metrics */}
        <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-border">
          <div>
            <p className="text-xs text-muted-foreground">Return</p>
            <p className={cn('font-mono', getPnLClass(trade.return_percent))}>
              {formatPercent(trade.return_percent)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">R:R</p>
            <p className="font-mono">{trade.actual_rr?.toFixed(2) || '-'}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Strategy</p>
            <p className="text-sm">{trade.strategies?.name || 'None'}</p>
          </div>
        </div>
      </div>

      {/* Journals Section */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Pre-Trade Journals */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Pre-Trade Journal</h2>
            {preJournals.length === 0 && !showPreJournalForm && (
              <button
                onClick={() => setShowPreJournalForm(true)}
                className="flex items-center gap-1 text-sm text-primary hover:underline"
              >
                <Plus className="w-4 h-4" />
                Add Entry
              </button>
            )}
          </div>

          {showPreJournalForm ? (
            <div className="bg-card border border-border rounded-lg p-4">
              <PreTradeJournalForm
                onSubmit={handleCreatePreJournal}
                onCancel={() => setShowPreJournalForm(false)}
                loading={journalLoading}
              />
            </div>
          ) : preJournals.length > 0 ? (
            preJournals.map(journal => (
              <JournalCard
                key={journal.id}
                type="pre-trade"
                journal={journal}
              />
            ))
          ) : (
            <div className="bg-card border border-border rounded-lg p-6 text-center">
              <p className="text-muted-foreground text-sm">
                No pre-trade journal entry yet
              </p>
            </div>
          )}
        </div>

        {/* Post-Trade Journals */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Post-Trade Journal</h2>
            {postJournals.length === 0 && !showPostJournalForm && trade.exit_price && (
              <button
                onClick={() => setShowPostJournalForm(true)}
                className="flex items-center gap-1 text-sm text-primary hover:underline"
              >
                <Plus className="w-4 h-4" />
                Add Entry
              </button>
            )}
          </div>

          {showPostJournalForm ? (
            <div className="bg-card border border-border rounded-lg p-4">
              <PostTradeJournalForm
                onSubmit={handleCreatePostJournal}
                onCancel={() => setShowPostJournalForm(false)}
                loading={journalLoading}
              />
            </div>
          ) : postJournals.length > 0 ? (
            postJournals.map(journal => (
              <JournalCard
                key={journal.id}
                type="post-trade"
                journal={journal}
              />
            ))
          ) : (
            <div className="bg-card border border-border rounded-lg p-6 text-center">
              <p className="text-muted-foreground text-sm">
                {trade.exit_price 
                  ? 'No post-trade journal entry yet'
                  : 'Close the trade to add post-trade journal'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

---

### Task 4.11: Update App.tsx Routes

**Step 1:** Update `src/renderer/App.tsx` to add trade detail route:

In the `renderPage()` function, update the trade detail section:
```tsx
// Replace the existing trade detail placeholder:
if (currentPath.startsWith('/trades/') && currentPath !== '/trades/new') {
  const id = currentPath.split('/')[2];
  if (id === 'new') {
    return <TradeNew onNavigate={navigate} />;
  }
  return <TradeDetail tradeId={id} onNavigate={navigate} />;
}
```

Add import at top:
```tsx
import { TradeDetail } from '@/pages/TradeDetail';
```

---

## Success Criteria

- [ ] Pre-trade journal form works with emotion selector
- [ ] Post-trade journal form works with emotion selector
- [ ] Star rating component works for setup quality and execution quality
- [ ] Journals save to database correctly
- [ ] Journals display in trade detail view
- [ ] Journals link correctly to trades
- [ ] Gamification streak updates when journaling
- [ ] Journal data persists between sessions
- [ ] All emotion types display with correct emojis
- [ ] Rule violations can be selected/deselected

### Test Workflow

1. Create a new trade
2. Navigate to trade detail
3. Add pre-trade journal with emotions
4. Set emotional score via slider
5. Rate setup quality with stars
6. Save pre-trade journal
7. Add exit price to close trade
8. Add post-trade journal
9. Mark rule violations if any
10. Save post-trade journal
11. Verify both journals display correctly

---

## Handoff to Next Phase

### Completed in This Phase
- Journal DAL with full CRUD
- IPC handlers for pre/post trade journals
- EmotionSelector component (direct port)
- StarRating component (direct port)
- PreTradeJournalForm component
- PostTradeJournalForm component
- JournalCard display component
- TradeDetail page with journal integration
- useJournals hook

### Files Ready for Phase 5
- Journal data available for psychology analysis
- Emotional state data captured for correlation
- Rule violations tracked for pattern detection

### State of the App
- Full trade lifecycle with journaling
- Emotional state tracked before and after trades
- Setup quality and execution quality rated
- Rule violations documented
- Ready for psychology metrics calculation

### Next Phase Prerequisites Met
- Journal data structure in place
- Emotional data being captured
- Trade-journal relationships established

---

**Next Document:** `05_PHASE_PSYCHOLOGY_ANALYTICS.md`
