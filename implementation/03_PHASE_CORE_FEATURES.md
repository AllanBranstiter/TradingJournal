# Phase 3: Core Features - Trade & Strategy CRUD

## Prerequisites
- Phase 1 completed (Electron app launches)
- Phase 2 completed (Database layer functional)
- All DAL modules working
- Database initialized with schema

## Context
The database layer is functional. Now we need to wire up the IPC handlers to connect the React frontend to the SQLite database, and migrate the core Trade and Strategy components from the source project.

**Entering State:** Database working, no IPC handlers, placeholder UI
**Exiting State:** Full Trade and Strategy CRUD through the UI

## Objectives
1. Create IPC handlers for trades and strategies
2. Migrate TypeScript types from source project
3. Migrate and adapt React hooks for Electron IPC
4. Copy and adapt Trade list and form components
5. Copy and adapt Strategy management components
6. Set up React Router for navigation
7. Create the dashboard page with real metrics

---

## Files to Create

| File Path | Purpose | Source Reference |
|-----------|---------|-----------------|
| `src/main/ipc/trades.ts` | Trade IPC handlers | New file |
| `src/main/ipc/strategies.ts` | Strategy IPC handlers | New file |
| `src/main/ipc/index.ts` | IPC registration | New file |
| `src/renderer/types/index.ts` | TypeScript types | `lib/supabase/types.ts` |
| `src/renderer/hooks/useTrades.ts` | Trade data hook | `lib/hooks/useTrades.ts` |
| `src/renderer/hooks/useStrategies.ts` | Strategy data hook | `lib/hooks/useStrategies.ts` |
| `src/renderer/hooks/useMetrics.ts` | Metrics hook | `lib/hooks/useMetrics.ts` |
| `src/renderer/hooks/use-toast.ts` | Toast notifications | `lib/hooks/use-toast.ts` |
| `src/renderer/lib/utils/calculations.ts` | P&L calculations | `lib/utils/calculations.ts` |
| `src/renderer/lib/utils/formatting.ts` | Formatting utilities | `lib/utils/formatting.ts` |
| `src/renderer/lib/validation/trade.ts` | Zod schemas | `lib/validation/trade.ts` |
| `src/renderer/components/layout/Sidebar.tsx` | Navigation sidebar | `components/layout/Sidebar.tsx` |
| `src/renderer/components/layout/DashboardShell.tsx` | Dashboard layout | `components/layout/DashboardShell.tsx` |
| `src/renderer/components/dashboard/MetricCard.tsx` | Metric display | `components/dashboard/MetricCard.tsx` |
| `src/renderer/components/dashboard/RecentTrades.tsx` | Recent trades list | `components/dashboard/RecentTrades.tsx` |
| `src/renderer/components/dashboard/EquityCurve.tsx` | Equity chart | `components/dashboard/EquityCurve.tsx` |
| `src/renderer/components/trades/TradeTable.tsx` | Trade list table | New file (simplified) |
| `src/renderer/components/trades/TradeForm.tsx` | Trade entry form | New file (based on source) |
| `src/renderer/components/trades/TradeDetail.tsx` | Trade detail view | New file |
| `src/renderer/pages/Dashboard.tsx` | Dashboard page | New file |
| `src/renderer/pages/Trades.tsx` | Trades list page | New file |
| `src/renderer/pages/TradeNew.tsx` | New trade page | New file |
| `src/renderer/pages/Strategies.tsx` | Strategies page | New file |

## Files to Modify

| File Path | Modifications |
|-----------|--------------|
| `src/main/index.ts` | Register IPC handlers |
| `src/renderer/App.tsx` | Add React Router, real navigation |

---

## Detailed Instructions

### Task 3.1: Create IPC Handlers for Trades

**Step 1:** Create `src/main/ipc/trades.ts`:
```typescript
import { ipcMain } from 'electron';
import { tradesDAL, type TradeFilters, type CreateTradeInput } from '../database/dal';
import { gamificationDAL } from '../database/dal';

export function registerTradeHandlers(): void {
  // Get all trades with optional filters
  ipcMain.handle('trades:getAll', async (_, filters?: TradeFilters) => {
    try {
      const trades = tradesDAL.findAll(filters || {});
      return { data: trades, error: null };
    } catch (error) {
      console.error('Error in trades:getAll:', error);
      return { data: null, error: (error as Error).message };
    }
  });

  // Get single trade by ID
  ipcMain.handle('trades:getById', async (_, id: string) => {
    try {
      const trade = tradesDAL.findWithJournals(id);
      if (!trade) {
        return { data: null, error: 'Trade not found' };
      }
      return { data: trade, error: null };
    } catch (error) {
      console.error('Error in trades:getById:', error);
      return { data: null, error: (error as Error).message };
    }
  });

  // Create new trade
  ipcMain.handle('trades:create', async (_, data: CreateTradeInput) => {
    try {
      const trade = tradesDAL.create(data);
      
      // Update gamification
      gamificationDAL.incrementTradeCount();
      gamificationDAL.updateStreak();
      gamificationDAL.checkAndAwardBadges();
      
      return { data: trade, error: null };
    } catch (error) {
      console.error('Error in trades:create:', error);
      return { data: null, error: (error as Error).message };
    }
  });

  // Update existing trade
  ipcMain.handle('trades:update', async (_, id: string, data: Partial<CreateTradeInput>) => {
    try {
      const trade = tradesDAL.update(id, data);
      if (!trade) {
        return { data: null, error: 'Trade not found' };
      }
      return { data: trade, error: null };
    } catch (error) {
      console.error('Error in trades:update:', error);
      return { data: null, error: (error as Error).message };
    }
  });

  // Delete trade
  ipcMain.handle('trades:delete', async (_, id: string) => {
    try {
      const success = tradesDAL.delete(id);
      return { data: success, error: null };
    } catch (error) {
      console.error('Error in trades:delete:', error);
      return { data: null, error: (error as Error).message };
    }
  });

  // Get trade count
  ipcMain.handle('trades:count', async (_, filters?: TradeFilters) => {
    try {
      const count = tradesDAL.count(filters || {});
      return { data: count, error: null };
    } catch (error) {
      console.error('Error in trades:count:', error);
      return { data: null, error: (error as Error).message };
    }
  });
}
```

---

### Task 3.2: Create IPC Handlers for Strategies

**Step 1:** Create `src/main/ipc/strategies.ts`:
```typescript
import { ipcMain } from 'electron';
import { strategiesDAL, type CreateStrategyInput } from '../database/dal';

export function registerStrategyHandlers(): void {
  // Get all strategies
  ipcMain.handle('strategies:getAll', async () => {
    try {
      const strategies = strategiesDAL.findAll();
      return { data: strategies, error: null };
    } catch (error) {
      console.error('Error in strategies:getAll:', error);
      return { data: null, error: (error as Error).message };
    }
  });

  // Get single strategy by ID
  ipcMain.handle('strategies:getById', async (_, id: string) => {
    try {
      const strategy = strategiesDAL.findById(id);
      if (!strategy) {
        return { data: null, error: 'Strategy not found' };
      }
      return { data: strategy, error: null };
    } catch (error) {
      console.error('Error in strategies:getById:', error);
      return { data: null, error: (error as Error).message };
    }
  });

  // Create new strategy
  ipcMain.handle('strategies:create', async (_, data: CreateStrategyInput) => {
    try {
      const strategy = strategiesDAL.create(data);
      return { data: strategy, error: null };
    } catch (error) {
      console.error('Error in strategies:create:', error);
      return { data: null, error: (error as Error).message };
    }
  });

  // Update strategy
  ipcMain.handle('strategies:update', async (_, id: string, data: Partial<CreateStrategyInput>) => {
    try {
      const strategy = strategiesDAL.update(id, data);
      if (!strategy) {
        return { data: null, error: 'Strategy not found' };
      }
      return { data: strategy, error: null };
    } catch (error) {
      console.error('Error in strategies:update:', error);
      return { data: null, error: (error as Error).message };
    }
  });

  // Delete strategy
  ipcMain.handle('strategies:delete', async (_, id: string) => {
    try {
      const success = strategiesDAL.delete(id);
      return { data: success, error: null };
    } catch (error) {
      console.error('Error in strategies:delete:', error);
      return { data: null, error: (error as Error).message };
    }
  });
}
```

---

### Task 3.3: Create IPC Index and Registration

**Step 1:** Create `src/main/ipc/index.ts`:
```typescript
import { registerTradeHandlers } from './trades';
import { registerStrategyHandlers } from './strategies';

export function registerAllIPCHandlers(): void {
  console.log('Registering IPC handlers...');
  
  registerTradeHandlers();
  registerStrategyHandlers();
  
  console.log('IPC handlers registered');
}

export { registerTradeHandlers, registerStrategyHandlers };
```

**Step 2:** Update `src/main/index.ts` to register handlers:

Add import at top:
```typescript
import { registerAllIPCHandlers } from './ipc';
```

Update `app.whenReady()`:
```typescript
app.whenReady().then(() => {
  // Initialize database before creating window
  initializeDatabaseLayer();
  
  // Register IPC handlers
  registerAllIPCHandlers();
  
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});
```

---

### Task 3.4: Create TypeScript Types

**Step 1:** Create `src/renderer/types/index.ts`:
```typescript
// Trading Journal - TypeScript Types
// Adapted from source project for Electron app

// =====================================================
// ENUMS
// =====================================================

export type TradingStyle = 'day_trader' | 'swing_trader' | 'position_trader' | 'investor';
export type Direction = 'long' | 'short';
export type MarketBias = 'bullish' | 'bearish' | 'neutral' | 'choppy';
export type SpyTrend = 'uptrend' | 'downtrend' | 'sideways';

export type PreTradeEmotion = 'confident' | 'anxious' | 'neutral' | 'FOMO' | 'revenge' | 'overconfident';
export type PostTradeEmotion = 'relieved' | 'regret' | 'validated' | 'frustrated' | 'proud' | 'disappointed';

export type RuleViolation = 
  | 'moved_stop_loss' 
  | 'oversized_position' 
  | 'exited_early' 
  | 'no_stop_loss' 
  | 'revenge_trade' 
  | 'overtrading';

export type SampleSizeStatus = 'insufficient' | 'building' | 'sufficient';

// =====================================================
// TABLE INTERFACES
// =====================================================

export interface Trade {
  id: string;
  user_id: string;
  ticker: string;
  direction: Direction;
  strategy_id: string | null;
  entry_date: string;
  exit_date: string | null;
  entry_price: number;
  exit_price: number | null;
  quantity: number;
  commissions: number;
  slippage: number;
  gross_pnl: number | null;
  net_pnl: number | null;
  return_percent: number | null;
  initial_stop_loss: number | null;
  actual_stop_loss: number | null;
  risk_amount: number | null;
  reward_amount: number | null;
  actual_rr: number | null;
  hold_duration_minutes: number | null;
  market_conditions: string | null; // JSON string
  screenshot_url: string | null;
  day_of_week: number | null;
  hour_of_day: number | null;
  imported_from_csv: number;
  created_at: string;
  updated_at: string;
}

export interface TradeWithRelations extends Trade {
  pre_trade_journals?: PreTradeJournal[];
  post_trade_journals?: PostTradeJournal[];
  strategies?: Strategy | null;
}

export interface Strategy {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  setup_criteria: string | null; // JSON string
  entry_rules: string | null;
  exit_rules: string | null;
  risk_reward_target: number | null;
  win_rate_target: number | null;
  created_at: string;
  updated_at: string;
}

export interface PreTradeJournal {
  id: string;
  user_id: string;
  trade_id: string | null;
  emotional_state: string; // JSON array
  emotional_score: number | null;
  market_bias: MarketBias | null;
  spy_trend: SpyTrend | null;
  sector_context: string | null;
  strategy_id: string | null;
  setup_quality: number | null;
  confluence_factors: string | null; // JSON array
  checklist: string | null; // JSON object
  planned_entry: number | null;
  planned_stop_loss: number | null;
  planned_target: number | null;
  planned_risk_reward: number | null;
  planned_position_size: number | null;
  planned_risk_amount: number | null;
  thesis: string | null;
  concerns: string | null;
  created_at: string;
}

export interface PostTradeJournal {
  id: string;
  user_id: string;
  trade_id: string | null;
  pre_trade_journal_id: string | null;
  emotional_state: string; // JSON array
  emotional_score: number | null;
  execution_quality: number | null;
  followed_plan: number | null; // SQLite boolean
  rule_violations: string | null; // JSON array
  what_went_well: string | null;
  what_went_wrong: string | null;
  lessons_learned: string | null;
  reflection_notes: string | null;
  ai_analysis_completed: number; // SQLite boolean
  ai_insights: string | null; // JSON object
  would_repeat: number | null; // SQLite boolean
  repeat_reasoning: string | null;
  created_at: string;
}

export interface Gamification {
  id: string;
  user_id: string;
  current_journaling_streak: number;
  longest_journaling_streak: number;
  last_journal_date: string | null;
  total_trades_logged: number;
  total_days_journaled: number;
  badges: string; // JSON array
  updated_at: string;
}

// =====================================================
// VIEW TYPES
// =====================================================

export interface TradePerformanceSummary {
  user_id: string;
  total_trades: number;
  winning_trades: number;
  losing_trades: number;
  breakeven_trades: number;
  win_rate: number;
  total_pnl: number;
  total_wins: number;
  total_losses: number;
  avg_pnl: number;
  avg_win: number;
  avg_loss: number;
  profit_factor: number;
  avg_risk_reward: number;
  largest_win: number;
  largest_loss: number;
  avg_hold_minutes: number;
  total_commissions: number;
  total_slippage: number;
}

export interface StrategyPerformance {
  user_id: string;
  strategy_id: string | null;
  strategy_name: string | null;
  total_trades: number;
  winning_trades: number;
  win_rate: number;
  total_pnl: number;
  avg_pnl: number;
  avg_risk_reward: number;
  profit_factor: number;
  win_rate_target: number | null;
  risk_reward_target: number | null;
  sample_size_status: SampleSizeStatus;
}

export interface MonthlyPerformance {
  user_id: string;
  month: string;
  trades_count: number;
  monthly_pnl: number;
  win_rate: number;
  profit_factor: number;
  avg_risk_reward: number;
}

// =====================================================
// INPUT TYPES
// =====================================================

export interface CreateTradeInput {
  ticker: string;
  direction: Direction;
  strategy_id?: string | null;
  entry_date: string;
  exit_date?: string | null;
  entry_price: number;
  exit_price?: number | null;
  quantity: number;
  commissions?: number;
  slippage?: number;
  initial_stop_loss?: number | null;
  actual_stop_loss?: number | null;
  market_conditions?: string[] | null;
  screenshot_url?: string | null;
}

export interface CreateStrategyInput {
  name: string;
  description?: string | null;
  setup_criteria?: Record<string, any> | null;
  entry_rules?: string | null;
  exit_rules?: string | null;
  risk_reward_target?: number | null;
  win_rate_target?: number | null;
}

// =====================================================
// API RESPONSE TYPES
// =====================================================

export interface APIResponse<T> {
  data: T | null;
  error: string | null;
}

// =====================================================
// UTILITY TYPES
// =====================================================

export type TradeFilters = {
  ticker?: string;
  direction?: Direction;
  strategy_id?: string;
  start_date?: string;
  end_date?: string;
  limit?: number;
  offset?: number;
};

// Helper to parse JSON fields
export function parseJsonField<T>(value: string | null, defaultValue: T): T {
  if (!value) return defaultValue;
  try {
    return JSON.parse(value) as T;
  } catch {
    return defaultValue;
  }
}
```

---

### Task 3.5: Create Toast Hook

**Step 1:** Create `src/renderer/hooks/use-toast.ts`:
```typescript
import * as React from 'react';

const TOAST_LIMIT = 3;
const TOAST_REMOVE_DELAY = 5000;

type ToastVariant = 'default' | 'success' | 'destructive';

type Toast = {
  id: string;
  title?: string;
  description?: string;
  variant?: ToastVariant;
};

type ToastAction = 
  | { type: 'ADD_TOAST'; toast: Toast }
  | { type: 'UPDATE_TOAST'; toast: Partial<Toast> & { id: string } }
  | { type: 'DISMISS_TOAST'; toastId: string }
  | { type: 'REMOVE_TOAST'; toastId: string };

interface ToastState {
  toasts: Toast[];
}

let count = 0;

function genId() {
  count = (count + 1) % Number.MAX_VALUE;
  return count.toString();
}

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>();

function addToRemoveQueue(toastId: string, dispatch: React.Dispatch<ToastAction>) {
  if (toastTimeouts.has(toastId)) {
    return;
  }

  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId);
    dispatch({ type: 'REMOVE_TOAST', toastId });
  }, TOAST_REMOVE_DELAY);

  toastTimeouts.set(toastId, timeout);
}

function reducer(state: ToastState, action: ToastAction): ToastState {
  switch (action.type) {
    case 'ADD_TOAST':
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      };

    case 'UPDATE_TOAST':
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toast.id ? { ...t, ...action.toast } : t
        ),
      };

    case 'DISMISS_TOAST':
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      };

    case 'REMOVE_TOAST':
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      };

    default:
      return state;
  }
}

const ToastContext = React.createContext<{
  toasts: Toast[];
  toast: (props: Omit<Toast, 'id'>) => string;
  dismiss: (toastId: string) => void;
} | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = React.useReducer(reducer, { toasts: [] });

  const toast = React.useCallback((props: Omit<Toast, 'id'>) => {
    const id = genId();
    dispatch({ type: 'ADD_TOAST', toast: { ...props, id } });
    addToRemoveQueue(id, dispatch);
    return id;
  }, []);

  const dismiss = React.useCallback((toastId: string) => {
    dispatch({ type: 'DISMISS_TOAST', toastId });
  }, []);

  return (
    <ToastContext.Provider value={{ toasts: state.toasts, toast, dismiss }}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

// Standalone toast function for use outside React components
let toastFn: ((props: Omit<Toast, 'id'>) => string) | null = null;

export function setToastFunction(fn: (props: Omit<Toast, 'id'>) => string) {
  toastFn = fn;
}

export function toast(props: Omit<Toast, 'id'>): string {
  if (!toastFn) {
    console.warn('Toast function not initialized');
    return '';
  }
  return toastFn(props);
}
```

---

### Task 3.6: Create useTrades Hook

**Step 1:** Create `src/renderer/hooks/useTrades.ts`:
```typescript
import { useState, useEffect, useCallback } from 'react';
import type { Trade, TradeWithRelations, CreateTradeInput, TradeFilters, APIResponse } from '../types';
import { useToast } from './use-toast';

interface UseTradesOptions extends TradeFilters {
  autoFetch?: boolean;
}

interface UseTradesReturn {
  trades: TradeWithRelations[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  createTrade: (data: CreateTradeInput) => Promise<Trade | null>;
  updateTrade: (id: string, data: Partial<CreateTradeInput>) => Promise<Trade | null>;
  deleteTrade: (id: string) => Promise<boolean>;
  getTrade: (id: string) => Promise<TradeWithRelations | null>;
}

export function useTrades(options: UseTradesOptions = {}): UseTradesReturn {
  const [trades, setTrades] = useState<TradeWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchTrades = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const filters: TradeFilters = {
        ticker: options.ticker,
        direction: options.direction,
        strategy_id: options.strategy_id,
        start_date: options.start_date,
        end_date: options.end_date,
        limit: options.limit,
        offset: options.offset,
      };

      const response: APIResponse<Trade[]> = await window.electronAPI.trades.getAll(filters);

      if (response.error) {
        throw new Error(response.error);
      }

      setTrades(response.data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch trades';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [options.ticker, options.direction, options.strategy_id, options.start_date, options.end_date, options.limit, options.offset, toast]);

  useEffect(() => {
    if (options.autoFetch !== false) {
      fetchTrades();
    }
  }, [fetchTrades, options.autoFetch]);

  const createTrade = async (data: CreateTradeInput): Promise<Trade | null> => {
    try {
      const response: APIResponse<Trade> = await window.electronAPI.trades.create(data);

      if (response.error) {
        throw new Error(response.error);
      }

      if (response.data) {
        setTrades(prev => [response.data!, ...prev]);
        toast({
          title: 'Success',
          description: 'Trade created successfully',
          variant: 'success',
        });
        return response.data;
      }

      return null;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create trade';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      return null;
    }
  };

  const updateTrade = async (id: string, data: Partial<CreateTradeInput>): Promise<Trade | null> => {
    try {
      const response: APIResponse<Trade> = await window.electronAPI.trades.update(id, data);

      if (response.error) {
        throw new Error(response.error);
      }

      if (response.data) {
        setTrades(prev => prev.map(t => t.id === id ? response.data! : t));
        toast({
          title: 'Success',
          description: 'Trade updated successfully',
          variant: 'success',
        });
        return response.data;
      }

      return null;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update trade';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      return null;
    }
  };

  const deleteTrade = async (id: string): Promise<boolean> => {
    try {
      const response: APIResponse<boolean> = await window.electronAPI.trades.delete(id);

      if (response.error) {
        throw new Error(response.error);
      }

      setTrades(prev => prev.filter(t => t.id !== id));
      toast({
        title: 'Success',
        description: 'Trade deleted successfully',
        variant: 'success',
      });
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete trade';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      return false;
    }
  };

  const getTrade = async (id: string): Promise<TradeWithRelations | null> => {
    try {
      const response: APIResponse<TradeWithRelations> = await window.electronAPI.trades.getById(id);

      if (response.error) {
        throw new Error(response.error);
      }

      return response.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch trade';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      return null;
    }
  };

  return {
    trades,
    loading,
    error,
    refetch: fetchTrades,
    createTrade,
    updateTrade,
    deleteTrade,
    getTrade,
  };
}
```

---

### Task 3.7: Create useStrategies Hook

**Step 1:** Create `src/renderer/hooks/useStrategies.ts`:
```typescript
import { useState, useEffect, useCallback } from 'react';
import type { Strategy, CreateStrategyInput, APIResponse } from '../types';
import { useToast } from './use-toast';

interface UseStrategiesReturn {
  strategies: Strategy[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  createStrategy: (data: CreateStrategyInput) => Promise<Strategy | null>;
  updateStrategy: (id: string, data: Partial<CreateStrategyInput>) => Promise<Strategy | null>;
  deleteStrategy: (id: string) => Promise<boolean>;
}

export function useStrategies(): UseStrategiesReturn {
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchStrategies = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response: APIResponse<Strategy[]> = await window.electronAPI.strategies.getAll();

      if (response.error) {
        throw new Error(response.error);
      }

      setStrategies(response.data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch strategies';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchStrategies();
  }, [fetchStrategies]);

  const createStrategy = async (data: CreateStrategyInput): Promise<Strategy | null> => {
    try {
      const response: APIResponse<Strategy> = await window.electronAPI.strategies.create(data);

      if (response.error) {
        throw new Error(response.error);
      }

      if (response.data) {
        setStrategies(prev => [...prev, response.data!]);
        toast({
          title: 'Success',
          description: 'Strategy created successfully',
          variant: 'success',
        });
        return response.data;
      }

      return null;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create strategy';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      return null;
    }
  };

  const updateStrategy = async (id: string, data: Partial<CreateStrategyInput>): Promise<Strategy | null> => {
    try {
      const response: APIResponse<Strategy> = await window.electronAPI.strategies.update(id, data);

      if (response.error) {
        throw new Error(response.error);
      }

      if (response.data) {
        setStrategies(prev => prev.map(s => s.id === id ? response.data! : s));
        toast({
          title: 'Success',
          description: 'Strategy updated successfully',
          variant: 'success',
        });
        return response.data;
      }

      return null;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update strategy';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      return null;
    }
  };

  const deleteStrategy = async (id: string): Promise<boolean> => {
    try {
      const response: APIResponse<boolean> = await window.electronAPI.strategies.delete(id);

      if (response.error) {
        throw new Error(response.error);
      }

      setStrategies(prev => prev.filter(s => s.id !== id));
      toast({
        title: 'Success',
        description: 'Strategy deleted successfully',
        variant: 'success',
      });
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete strategy';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      return false;
    }
  };

  return {
    strategies,
    loading,
    error,
    refetch: fetchStrategies,
    createStrategy,
    updateStrategy,
    deleteStrategy,
  };
}
```

---

### Task 3.8: Create Utility Functions

**Step 1:** Create `src/renderer/lib/utils/calculations.ts`:
Copy the entire contents from `TradingJournal/lib/utils/calculations.ts` - this file is pure JavaScript and works unchanged.

**Step 2:** Create `src/renderer/lib/utils/formatting.ts`:
```typescript
/**
 * Format currency value
 */
export function formatCurrency(value: number | null | undefined, currency = 'USD'): string {
  if (value === null || value === undefined) return '-';
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Format percentage value
 */
export function formatPercent(value: number | null | undefined, decimals = 2): string {
  if (value === null || value === undefined) return '-';
  return `${value >= 0 ? '+' : ''}${value.toFixed(decimals)}%`;
}

/**
 * Format date for display
 */
export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return '-';
  
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Format datetime for display
 */
export function formatDateTime(dateString: string | null | undefined): string {
  if (!dateString) return '-';
  
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Format number with thousands separator
 */
export function formatNumber(value: number | null | undefined, decimals = 0): string {
  if (value === null || value === undefined) return '-';
  
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * Format price with appropriate decimals
 */
export function formatPrice(value: number | null | undefined): string {
  if (value === null || value === undefined) return '-';
  
  // Determine decimal places based on value
  const decimals = value < 1 ? 4 : value < 100 ? 2 : 2;
  
  return value.toFixed(decimals);
}

/**
 * Format duration in minutes to human readable
 */
export function formatDuration(minutes: number | null | undefined): string {
  if (minutes === null || minutes === undefined) return '-';
  
  if (minutes < 60) {
    return `${minutes}m`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (hours < 24) {
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  }
  
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  
  return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
}

/**
 * Get CSS class for P&L value
 */
export function getPnLClass(value: number | null | undefined): string {
  if (value === null || value === undefined) return 'text-muted-foreground';
  if (value > 0) return 'text-profit';
  if (value < 0) return 'text-loss';
  return 'text-muted-foreground';
}
```

---

### Task 3.9: Create Sidebar Component

**Step 1:** Create `src/renderer/components/layout/Sidebar.tsx`:
```tsx
import React from 'react';
import { cn } from '@/lib/utils/cn';
import {
  LayoutDashboard,
  TrendingUp,
  Brain,
  BarChart3,
  Settings,
  Plus,
  BookOpen,
  Target,
} from 'lucide-react';

interface SidebarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
}

interface NavItem {
  path: string;
  label: string;
  icon: React.ElementType;
}

const navItems: NavItem[] = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/trades', label: 'Trades', icon: TrendingUp },
  { path: '/strategies', label: 'Strategies', icon: Target },
  { path: '/psychology', label: 'Psychology', icon: Brain },
  { path: '/analytics', label: 'Analytics', icon: BarChart3 },
  { path: '/settings', label: 'Settings', icon: Settings },
];

export function Sidebar({ currentPath, onNavigate }: SidebarProps) {
  return (
    <aside className="w-64 bg-background-secondary border-r border-border flex flex-col">
      {/* Logo area */}
      <div className="h-14 flex items-center px-4 border-b border-border">
        <BookOpen className="w-6 h-6 text-primary mr-2" />
        <span className="font-semibold text-foreground">Mindful Trader</span>
      </div>
      
      {/* Quick action button */}
      <div className="p-4">
        <button
          onClick={() => onNavigate('/trades/new')}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span className="font-medium">New Trade</span>
        </button>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 px-3 py-2">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPath === item.path || 
              (item.path !== '/' && currentPath.startsWith(item.path));
            
            return (
              <li key={item.path}>
                <button
                  onClick={() => onNavigate(item.path)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
                    isActive
                      ? 'bg-accent text-foreground font-medium'
                      : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
      
      {/* Footer */}
      <div className="p-4 border-t border-border">
        <div className="text-xs text-muted-foreground">
          <p>The Mindful Trader</p>
          <p>v1.0.0 • Local Mode</p>
        </div>
      </div>
    </aside>
  );
}
```

---

### Task 3.10: Create MetricCard Component

**Step 1:** Create `src/renderer/components/dashboard/MetricCard.tsx`:
```tsx
import React from 'react';
import { cn } from '@/lib/utils/cn';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  className?: string;
  valueClassName?: string;
}

export function MetricCard({
  title,
  value,
  subtitle,
  trend,
  trendValue,
  className,
  valueClassName,
}: MetricCardProps) {
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  
  return (
    <div className={cn('bg-card rounded-lg border border-border p-6', className)}>
      <p className="text-sm text-muted-foreground mb-1">{title}</p>
      <p className={cn('text-2xl font-bold font-mono', valueClassName)}>
        {value}
      </p>
      {(subtitle || trendValue) && (
        <div className="flex items-center gap-2 mt-2">
          {trend && (
            <TrendIcon
              className={cn(
                'w-3 h-3',
                trend === 'up' && 'text-profit',
                trend === 'down' && 'text-loss',
                trend === 'neutral' && 'text-muted-foreground'
              )}
            />
          )}
          {trendValue && (
            <span
              className={cn(
                'text-xs',
                trend === 'up' && 'text-profit',
                trend === 'down' && 'text-loss',
                trend === 'neutral' && 'text-muted-foreground'
              )}
            >
              {trendValue}
            </span>
          )}
          {subtitle && (
            <span className="text-xs text-muted-foreground">{subtitle}</span>
          )}
        </div>
      )}
    </div>
  );
}
```

---

### Task 3.11: Create TradeTable Component

**Step 1:** Create `src/renderer/components/trades/TradeTable.tsx`:
```tsx
import React from 'react';
import type { Trade } from '@/types';
import { cn } from '@/lib/utils/cn';
import { formatCurrency, formatDateTime, formatPercent, getPnLClass } from '@/lib/utils/formatting';
import { ChevronRight, TrendingUp, TrendingDown } from 'lucide-react';

interface TradeTableProps {
  trades: Trade[];
  onTradeClick?: (trade: Trade) => void;
  loading?: boolean;
}

export function TradeTable({ trades, onTradeClick, loading }: TradeTableProps) {
  if (loading) {
    return (
      <div className="bg-card rounded-lg border border-border">
        <div className="p-8 text-center text-muted-foreground">
          Loading trades...
        </div>
      </div>
    );
  }

  if (trades.length === 0) {
    return (
      <div className="bg-card rounded-lg border border-border">
        <div className="p-8 text-center">
          <p className="text-muted-foreground mb-2">No trades yet</p>
          <p className="text-sm text-muted-foreground">
            Start logging your trades to track performance
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg border border-border overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border bg-background-secondary">
            <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">
              Ticker
            </th>
            <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">
              Direction
            </th>
            <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">
              Entry Date
            </th>
            <th className="text-right text-xs font-medium text-muted-foreground px-4 py-3">
              Entry
            </th>
            <th className="text-right text-xs font-medium text-muted-foreground px-4 py-3">
              Exit
            </th>
            <th className="text-right text-xs font-medium text-muted-foreground px-4 py-3">
              P&L
            </th>
            <th className="text-right text-xs font-medium text-muted-foreground px-4 py-3">
              Return
            </th>
            <th className="w-8"></th>
          </tr>
        </thead>
        <tbody>
          {trades.map((trade) => (
            <tr
              key={trade.id}
              onClick={() => onTradeClick?.(trade)}
              className={cn(
                'border-b border-border last:border-b-0 transition-colors',
                onTradeClick && 'cursor-pointer hover:bg-accent/50'
              )}
            >
              <td className="px-4 py-3">
                <span className="font-mono font-medium text-foreground">
                  {trade.ticker}
                </span>
              </td>
              <td className="px-4 py-3">
                <span
                  className={cn(
                    'inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium',
                    trade.direction === 'long'
                      ? 'bg-profit/10 text-profit'
                      : 'bg-loss/10 text-loss'
                  )}
                >
                  {trade.direction === 'long' ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : (
                    <TrendingDown className="w-3 h-3" />
                  )}
                  {trade.direction.toUpperCase()}
                </span>
              </td>
              <td className="px-4 py-3 text-muted-foreground text-sm">
                {formatDateTime(trade.entry_date)}
              </td>
              <td className="px-4 py-3 text-right font-mono text-sm">
                ${trade.entry_price.toFixed(2)}
              </td>
              <td className="px-4 py-3 text-right font-mono text-sm text-muted-foreground">
                {trade.exit_price ? `$${trade.exit_price.toFixed(2)}` : '-'}
              </td>
              <td className={cn('px-4 py-3 text-right font-mono font-medium', getPnLClass(trade.net_pnl))}>
                {formatCurrency(trade.net_pnl)}
              </td>
              <td className={cn('px-4 py-3 text-right font-mono text-sm', getPnLClass(trade.return_percent))}>
                {formatPercent(trade.return_percent)}
              </td>
              <td className="px-4 py-3">
                {onTradeClick && (
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

---

### Task 3.12: Create TradeForm Component

**Step 1:** Create `src/renderer/components/trades/TradeForm.tsx`:
```tsx
import React, { useState } from 'react';
import type { CreateTradeInput, Strategy } from '@/types';
import { cn } from '@/lib/utils/cn';

interface TradeFormProps {
  strategies: Strategy[];
  onSubmit: (data: CreateTradeInput) => Promise<void>;
  onCancel: () => void;
  initialData?: Partial<CreateTradeInput>;
  loading?: boolean;
}

export function TradeForm({
  strategies,
  onSubmit,
  onCancel,
  initialData,
  loading,
}: TradeFormProps) {
  const [formData, setFormData] = useState<CreateTradeInput>({
    ticker: initialData?.ticker || '',
    direction: initialData?.direction || 'long',
    strategy_id: initialData?.strategy_id || null,
    entry_date: initialData?.entry_date || new Date().toISOString().slice(0, 16),
    exit_date: initialData?.exit_date || '',
    entry_price: initialData?.entry_price || 0,
    exit_price: initialData?.exit_price || undefined,
    quantity: initialData?.quantity || 0,
    commissions: initialData?.commissions || 0,
    initial_stop_loss: initialData?.initial_stop_loss || undefined,
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? (value ? parseFloat(value) : undefined) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Info */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Ticker Symbol *
          </label>
          <input
            type="text"
            name="ticker"
            value={formData.ticker}
            onChange={handleChange}
            placeholder="AAPL"
            required
            className="w-full px-3 py-2 bg-input border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Direction *
          </label>
          <select
            name="direction"
            value={formData.direction}
            onChange={handleChange}
            className="w-full px-3 py-2 bg-input border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="long">Long</option>
            <option value="short">Short</option>
          </select>
        </div>
      </div>

      {/* Strategy */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Strategy
        </label>
        <select
          name="strategy_id"
          value={formData.strategy_id || ''}
          onChange={handleChange}
          className="w-full px-3 py-2 bg-input border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">No strategy</option>
          {strategies.map((strategy) => (
            <option key={strategy.id} value={strategy.id}>
              {strategy.name}
            </option>
          ))}
        </select>
      </div>

      {/* Dates */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Entry Date/Time *
          </label>
          <input
            type="datetime-local"
            name="entry_date"
            value={formData.entry_date.slice(0, 16)}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 bg-input border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Exit Date/Time
          </label>
          <input
            type="datetime-local"
            name="exit_date"
            value={formData.exit_date?.slice(0, 16) || ''}
            onChange={handleChange}
            className="w-full px-3 py-2 bg-input border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      {/* Prices */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Entry Price *
          </label>
          <input
            type="number"
            name="entry_price"
            value={formData.entry_price || ''}
            onChange={handleChange}
            step="0.01"
            min="0"
            required
            placeholder="0.00"
            className="w-full px-3 py-2 bg-input border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Exit Price
          </label>
          <input
            type="number"
            name="exit_price"
            value={formData.exit_price || ''}
            onChange={handleChange}
            step="0.01"
            min="0"
            placeholder="0.00"
            className="w-full px-3 py-2 bg-input border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Quantity *
          </label>
          <input
            type="number"
            name="quantity"
            value={formData.quantity || ''}
            onChange={handleChange}
            min="1"
            required
            placeholder="100"
            className="w-full px-3 py-2 bg-input border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      {/* Risk Management */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Stop Loss
          </label>
          <input
            type="number"
            name="initial_stop_loss"
            value={formData.initial_stop_loss || ''}
            onChange={handleChange}
            step="0.01"
            min="0"
            placeholder="0.00"
            className="w-full px-3 py-2 bg-input border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Commissions
          </label>
          <input
            type="number"
            name="commissions"
            value={formData.commissions || ''}
            onChange={handleChange}
            step="0.01"
            min="0"
            placeholder="0.00"
            className="w-full px-3 py-2 bg-input border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-2 border border-border rounded-md text-foreground hover:bg-accent transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className={cn(
            'flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors',
            loading && 'opacity-50 cursor-not-allowed'
          )}
        >
          {loading ? 'Saving...' : 'Save Trade'}
        </button>
      </div>
    </form>
  );
}
```

---

### Task 3.13: Create Dashboard Page

**Step 1:** Create `src/renderer/pages/Dashboard.tsx`:
```tsx
import React, { useEffect, useState } from 'react';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { TradeTable } from '@/components/trades/TradeTable';
import { formatCurrency, formatPercent, formatNumber } from '@/lib/utils/formatting';
import type { TradePerformanceSummary, Trade } from '@/types';

interface DashboardProps {
  onNavigate: (path: string) => void;
}

export function Dashboard({ onNavigate }: DashboardProps) {
  const [metrics, setMetrics] = useState<TradePerformanceSummary | null>(null);
  const [recentTrades, setRecentTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch performance summary
        const summaryResponse = await window.electronAPI.analytics.getPerformanceSummary();
        if (summaryResponse.data) {
          setMetrics(summaryResponse.data);
        }

        // Fetch recent trades
        const tradesResponse = await window.electronAPI.trades.getAll({ limit: 5 });
        if (tradesResponse.data) {
          setRecentTrades(tradesResponse.data);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-background-secondary rounded w-48"></div>
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-background-secondary rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const pnlTrend = metrics?.total_pnl 
    ? (metrics.total_pnl > 0 ? 'up' : metrics.total_pnl < 0 ? 'down' : 'neutral')
    : 'neutral';

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-foreground mb-6">Dashboard</h1>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricCard
          title="Total P&L"
          value={formatCurrency(metrics?.total_pnl || 0)}
          valueClassName={metrics?.total_pnl && metrics.total_pnl > 0 ? 'text-profit' : metrics?.total_pnl && metrics.total_pnl < 0 ? 'text-loss' : undefined}
          trend={pnlTrend}
          subtitle={`${metrics?.total_trades || 0} trades`}
        />
        <MetricCard
          title="Win Rate"
          value={formatPercent(metrics?.win_rate || 0, 1).replace('+', '')}
          subtitle={`${metrics?.winning_trades || 0}W / ${metrics?.losing_trades || 0}L`}
        />
        <MetricCard
          title="Profit Factor"
          value={formatNumber(metrics?.profit_factor || 0, 2)}
          valueClassName={metrics?.profit_factor && metrics.profit_factor > 1 ? 'text-profit' : 'text-loss'}
        />
        <MetricCard
          title="Avg R:R"
          value={formatNumber(metrics?.avg_risk_reward || 0, 2)}
          subtitle="Risk to Reward"
        />
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <MetricCard
          title="Average Win"
          value={formatCurrency(metrics?.avg_win || 0)}
          valueClassName="text-profit"
        />
        <MetricCard
          title="Average Loss"
          value={formatCurrency(metrics?.avg_loss || 0)}
          valueClassName="text-loss"
        />
        <MetricCard
          title="Avg Hold Time"
          value={`${Math.round((metrics?.avg_hold_minutes || 0) / 60)}h`}
          subtitle="hours"
        />
      </div>

      {/* Recent Trades */}
      <div className="mb-8">
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

      {/* Quick Actions */}
      {metrics?.total_trades === 0 && (
        <div className="bg-card border border-border rounded-lg p-6 text-center">
          <h3 className="text-lg font-medium text-foreground mb-2">
            Welcome to The Mindful Trader!
          </h3>
          <p className="text-muted-foreground mb-4">
            Start tracking your trades to see performance metrics and insights.
          </p>
          <button
            onClick={() => onNavigate('/trades/new')}
            className="px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            Log Your First Trade
          </button>
        </div>
      )}
    </div>
  );
}
```

---

### Task 3.14: Create Trades List Page

**Step 1:** Create `src/renderer/pages/Trades.tsx`:
```tsx
import React from 'react';
import { useTrades } from '@/hooks/useTrades';
import { TradeTable } from '@/components/trades/TradeTable';
import { Plus } from 'lucide-react';

interface TradesProps {
  onNavigate: (path: string) => void;
}

export function Trades({ onNavigate }: TradesProps) {
  const { trades, loading, refetch } = useTrades();

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">Trades</h1>
        <button
          onClick={() => onNavigate('/trades/new')}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Trade
        </button>
      </div>

      <TradeTable
        trades={trades}
        loading={loading}
        onTradeClick={(trade) => onNavigate(`/trades/${trade.id}`)}
      />
    </div>
  );
}
```

---

### Task 3.15: Create New Trade Page

**Step 1:** Create `src/renderer/pages/TradeNew.tsx`:
```tsx
import React, { useState } from 'react';
import { useTrades } from '@/hooks/useTrades';
import { useStrategies } from '@/hooks/useStrategies';
import { TradeForm } from '@/components/trades/TradeForm';
import { ArrowLeft } from 'lucide-react';

interface TradeNewProps {
  onNavigate: (path: string) => void;
}

export function TradeNew({ onNavigate }: TradeNewProps) {
  const { createTrade } = useTrades({ autoFetch: false });
  const { strategies } = useStrategies();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data: any) => {
    setLoading(true);
    try {
      const trade = await createTrade(data);
      if (trade) {
        onNavigate('/trades');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-2xl">
      <button
        onClick={() => onNavigate('/trades')}
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Trades
      </button>

      <h1 className="text-2xl font-bold text-foreground mb-6">Log New Trade</h1>

      <div className="bg-card border border-border rounded-lg p-6">
        <TradeForm
          strategies={strategies}
          onSubmit={handleSubmit}
          onCancel={() => onNavigate('/trades')}
          loading={loading}
        />
      </div>
    </div>
  );
}
```

---

### Task 3.16: Create Strategies Page

**Step 1:** Create `src/renderer/pages/Strategies.tsx`:
```tsx
import React, { useState } from 'react';
import { useStrategies } from '@/hooks/useStrategies';
import type { CreateStrategyInput } from '@/types';
import { Plus, Edit2, Trash2, Target } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface StrategiesProps {
  onNavigate: (path: string) => void;
}

export function Strategies({ onNavigate }: StrategiesProps) {
  const { strategies, loading, createStrategy, deleteStrategy } = useStrategies();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<CreateStrategyInput>({
    name: '',
    description: '',
    entry_rules: '',
    exit_rules: '',
    risk_reward_target: undefined,
    win_rate_target: undefined,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await createStrategy(formData);
    if (result) {
      setShowForm(false);
      setFormData({
        name: '',
        description: '',
        entry_rules: '',
        exit_rules: '',
        risk_reward_target: undefined,
        win_rate_target: undefined,
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this strategy?')) {
      await deleteStrategy(id);
    }
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">Strategies</h1>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Strategy
        </button>
      </div>

      {/* Strategy Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card border border-border rounded-lg p-6 w-full max-w-lg mx-4">
            <h2 className="text-lg font-semibold mb-4">Create Strategy</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full px-3 py-2 bg-input border border-border rounded-md"
                  placeholder="Bull Flag Breakout"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 bg-input border border-border rounded-md"
                  rows={2}
                  placeholder="Describe your strategy..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Target R:R</label>
                  <input
                    type="number"
                    value={formData.risk_reward_target || ''}
                    onChange={(e) => setFormData({ ...formData, risk_reward_target: parseFloat(e.target.value) || undefined })}
                    step="0.1"
                    className="w-full px-3 py-2 bg-input border border-border rounded-md"
                    placeholder="2.0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Target Win Rate</label>
                  <input
                    type="number"
                    value={formData.win_rate_target || ''}
                    onChange={(e) => setFormData({ ...formData, win_rate_target: parseFloat(e.target.value) || undefined })}
                    step="1"
                    min="0"
                    max="100"
                    className="w-full px-3 py-2 bg-input border border-border rounded-md"
                    placeholder="60"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 px-4 py-2 border border-border rounded-md hover:bg-accent"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Strategies List */}
      {loading ? (
        <div className="text-center py-8 text-muted-foreground">Loading...</div>
      ) : strategies.length === 0 ? (
        <div className="bg-card border border-border rounded-lg p-8 text-center">
          <Target className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No strategies yet</h3>
          <p className="text-muted-foreground mb-4">
            Create strategies to categorize and analyze your trades
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Create Your First Strategy
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {strategies.map((strategy) => (
            <div
              key={strategy.id}
              className="bg-card border border-border rounded-lg p-4 flex items-start justify-between"
            >
              <div className="flex-1">
                <h3 className="font-medium text-foreground">{strategy.name}</h3>
                {strategy.description && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {strategy.description}
                  </p>
                )}
                <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                  {strategy.risk_reward_target && (
                    <span>Target R:R: {strategy.risk_reward_target}</span>
                  )}
                  {strategy.win_rate_target && (
                    <span>Target WR: {strategy.win_rate_target}%</span>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleDelete(strategy.id)}
                  className="p-2 text-muted-foreground hover:text-loss transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

---

### Task 3.17: Update App.tsx with Navigation

**Step 1:** Update `src/renderer/App.tsx`:
```tsx
import React, { useState, useEffect } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Dashboard } from '@/pages/Dashboard';
import { Trades } from '@/pages/Trades';
import { TradeNew } from '@/pages/TradeNew';
import { Strategies } from '@/pages/Strategies';
import { ToastProvider, useToast, setToastFunction } from '@/hooks/use-toast';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

// Toast display component
function Toasts() {
  const { toasts, dismiss } = useToast();

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            'px-4 py-3 rounded-lg shadow-lg flex items-start gap-3 min-w-[300px] animate-in slide-in-from-right',
            toast.variant === 'success' && 'bg-profit text-white',
            toast.variant === 'destructive' && 'bg-loss text-white',
            (!toast.variant || toast.variant === 'default') && 'bg-card border border-border text-foreground'
          )}
        >
          <div className="flex-1">
            {toast.title && (
              <p className="font-medium text-sm">{toast.title}</p>
            )}
            {toast.description && (
              <p className="text-sm opacity-90">{toast.description}</p>
            )}
          </div>
          <button
            onClick={() => dismiss(toast.id)}
            className="opacity-70 hover:opacity-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}

// Toast connector
function ToastConnector() {
  const { toast } = useToast();
  useEffect(() => {
    setToastFunction(toast);
  }, [toast]);
  return null;
}

function AppContent() {
  const [currentPath, setCurrentPath] = useState('/');

  const navigate = (path: string) => {
    setCurrentPath(path);
  };

  // Simple router
  const renderPage = () => {
    if (currentPath === '/') {
      return <Dashboard onNavigate={navigate} />;
    }
    if (currentPath === '/trades') {
      return <Trades onNavigate={navigate} />;
    }
    if (currentPath === '/trades/new') {
      return <TradeNew onNavigate={navigate} />;
    }
    if (currentPath === '/strategies') {
      return <Strategies onNavigate={navigate} />;
    }
    if (currentPath === '/psychology') {
      return (
        <div className="p-8">
          <h1 className="text-2xl font-bold">Psychology</h1>
          <p className="text-muted-foreground mt-2">Coming in Phase 5</p>
        </div>
      );
    }
    if (currentPath === '/analytics') {
      return (
        <div className="p-8">
          <h1 className="text-2xl font-bold">Analytics</h1>
          <p className="text-muted-foreground mt-2">Coming in Phase 5</p>
        </div>
      );
    }
    if (currentPath === '/settings') {
      return (
        <div className="p-8">
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-muted-foreground mt-2">Coming in Phase 7</p>
        </div>
      );
    }
    // Trade detail page
    if (currentPath.startsWith('/trades/')) {
      const id = currentPath.split('/')[2];
      return (
        <div className="p-8">
          <h1 className="text-2xl font-bold">Trade Detail</h1>
          <p className="text-muted-foreground mt-2">Trade ID: {id}</p>
          <p className="text-muted-foreground">Full detail view coming in Phase 4</p>
        </div>
      );
    }
    return <Dashboard onNavigate={navigate} />;
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* macOS title bar spacer */}
      <div className="fixed top-0 left-0 right-0 h-8 bg-background-secondary draggable z-40" />
      
      {/* Sidebar */}
      <div className="fixed top-8 left-0 bottom-0 z-30">
        <Sidebar currentPath={currentPath} onNavigate={navigate} />
      </div>
      
      {/* Main content */}
      <main className="flex-1 ml-64 mt-8 overflow-auto">
        {renderPage()}
      </main>

      {/* Toasts */}
      <Toasts />
      <ToastConnector />
    </div>
  );
}

function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
}

export default App;
```

---

### Task 3.18: Add Analytics IPC Handler

**Step 1:** Create `src/main/ipc/analytics.ts`:
```typescript
import { ipcMain } from 'electron';
import { analyticsDAL } from '../database/dal';

export function registerAnalyticsHandlers(): void {
  ipcMain.handle('analytics:getPerformanceSummary', async () => {
    try {
      const data = analyticsDAL.getPerformanceSummary();
      return { data, error: null };
    } catch (error) {
      return { data: null, error: (error as Error).message };
    }
  });

  ipcMain.handle('analytics:getStrategyPerformance', async () => {
    try {
      const data = analyticsDAL.getStrategyPerformance();
      return { data, error: null };
    } catch (error) {
      return { data: null, error: (error as Error).message };
    }
  });

  ipcMain.handle('analytics:getMonthlyPerformance', async () => {
    try {
      const data = analyticsDAL.getMonthlyPerformance();
      return { data, error: null };
    } catch (error) {
      return { data: null, error: (error as Error).message };
    }
  });

  ipcMain.handle('analytics:getTimeAnalysis', async () => {
    try {
      const data = analyticsDAL.getTimeAnalysis();
      return { data, error: null };
    } catch (error) {
      return { data: null, error: (error as Error).message };
    }
  });

  ipcMain.handle('analytics:getEquityCurve', async () => {
    try {
      const data = analyticsDAL.getEquityCurve();
      return { data, error: null };
    } catch (error) {
      return { data: null, error: (error as Error).message };
    }
  });

  ipcMain.handle('analytics:getPsychologyCorrelation', async () => {
    try {
      const data = analyticsDAL.getPsychologyCorrelation();
      return { data, error: null };
    } catch (error) {
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

export function registerAllIPCHandlers(): void {
  console.log('Registering IPC handlers...');
  
  registerTradeHandlers();
  registerStrategyHandlers();
  registerAnalyticsHandlers();
  
  console.log('IPC handlers registered');
}
```

---

## Success Criteria

- [ ] `npm run dev` launches app with working navigation
- [ ] Dashboard shows real metrics (zeros initially)
- [ ] Can create a new trade through the form
- [ ] Trade appears in trades list after creation
- [ ] Can create strategies
- [ ] Strategies appear in dropdown on trade form
- [ ] Trade deletion works
- [ ] Toast notifications display
- [ ] P&L calculations are correct
- [ ] Navigation between pages works

### Test Workflow

1. Launch app
2. Navigate to Strategies → Create a strategy
3. Navigate to Trades → New Trade
4. Fill in trade form with exit price (for P&L calculation)
5. Submit trade
6. Verify trade appears in list
7. Return to Dashboard
8. Verify metrics updated

---

## Handoff to Next Phase

### Completed in This Phase
- IPC handlers for trades, strategies, analytics
- TypeScript types ported from source
- React hooks adapted for Electron IPC
- Trade CRUD UI (list, create, delete)
- Strategy CRUD UI
- Dashboard with live metrics
- Toast notification system
- Basic navigation

### Files Ready for Phase 4
- IPC structure ready for journal handlers
- Types include journal interfaces
- Trade form ready to add journal sections

### State of the App
- Can log trades with P&L tracking
- Can manage strategies
- Dashboard shows performance metrics
- No journaling capability yet

### Next Phase Prerequisites Met
- Trade creation flow working
- Database can store journal data
- UI patterns established

---

**Next Document:** `04_PHASE_JOURNALING.md`
