# Phase 7: Polish & Packaging

## Prerequisites
- All previous phases completed (1-6)
- App fully functional with all features
- Gamification and AI coach working
- API key management implemented

## Context
The app is feature-complete. This final phase focuses on polish, settings management, data portability (import/export), and creating a distributable macOS application with proper code signing and notarization.

**Entering State:** Fully functional Electron app in development mode
**Exiting State:** Signed, notarized .dmg file ready for distribution

## Objectives
1. Create Settings page with all configuration options
2. Implement data export functionality (JSON backup)
3. Implement data import functionality
4. Create CSV import wizard for trade data
5. Build data migration tool from Supabase
6. Configure electron-builder for macOS
7. Set up code signing with Developer ID
8. Implement notarization for Gatekeeper approval
9. Create distributable .dmg installer

---

## Files to Create

| File Path | Purpose | Source Reference |
|-----------|---------|-----------------|
| `src/main/services/export.ts` | Data export service | New file |
| `src/main/services/import.ts` | Data import service | New file |
| `src/main/ipc/settings.ts` | Settings IPC handlers | New file |
| `src/renderer/pages/Settings.tsx` | Settings page | New file |
| `src/renderer/components/settings/DataExport.tsx` | Export UI | New file |
| `src/renderer/components/settings/DataImport.tsx` | Import UI | New file |
| `src/renderer/components/import/CSVUploader.tsx` | CSV uploader | `components/import/CSVUploader.tsx` |
| `src/renderer/components/import/ColumnMapper.tsx` | Column mapping | `components/import/ColumnMapper.tsx` |
| `src/renderer/components/import/ImportPreview.tsx` | Import preview | New file |
| `src/renderer/pages/Import.tsx` | CSV import wizard | New file |
| `electron-builder.yml` | Build configuration | New file |
| `scripts/notarize.js` | Notarization script | New file |
| `entitlements.mac.plist` | macOS entitlements | New file |

## Files to Modify

| File Path | Modifications |
|-----------|--------------|
| `src/main/ipc/index.ts` | Register settings handlers |
| `src/main/preload.ts` | Add settings and file dialog APIs |
| `src/renderer/App.tsx` | Add settings and import routes |
| `package.json` | Add build scripts and metadata |

---

## Detailed Instructions

### Task 7.1: Create Export Service

**Step 1:** Create `src/main/services/export.ts`:
```typescript
import { db } from '../database/connection';
import { app, dialog } from 'electron';
import * as fs from 'fs';
import * as path from 'path';

export interface ExportData {
  version: string;
  exported_at: string;
  app_version: string;
  data: {
    trades: any[];
    strategies: any[];
    pre_trade_journals: any[];
    post_trade_journals: any[];
    gamification: any;
  };
}

export const exportService = {
  async exportAllData(): Promise<{ success: boolean; path?: string; error?: string }> {
    try {
      // Gather all data
      const trades = db.prepare('SELECT * FROM trades').all();
      const strategies = db.prepare('SELECT * FROM strategies').all();
      const preJournals = db.prepare('SELECT * FROM pre_trade_journals').all();
      const postJournals = db.prepare('SELECT * FROM post_trade_journals').all();
      const gamification = db.prepare('SELECT * FROM gamification WHERE user_id = ?').get('local-user');

      const exportData: ExportData = {
        version: '1.0',
        exported_at: new Date().toISOString(),
        app_version: app.getVersion(),
        data: {
          trades,
          strategies,
          pre_trade_journals: preJournals,
          post_trade_journals: postJournals,
          gamification,
        },
      };

      // Show save dialog
      const { filePath, canceled } = await dialog.showSaveDialog({
        title: 'Export Trading Journal Data',
        defaultPath: path.join(
          app.getPath('documents'),
          `mindful-trader-backup-${new Date().toISOString().split('T')[0]}.json`
        ),
        filters: [
          { name: 'JSON Files', extensions: ['json'] },
        ],
      });

      if (canceled || !filePath) {
        return { success: false, error: 'Export cancelled' };
      }

      // Write file
      fs.writeFileSync(filePath, JSON.stringify(exportData, null, 2));

      return { success: true, path: filePath };
    } catch (error) {
      console.error('Export error:', error);
      return { success: false, error: (error as Error).message };
    }
  },

  async exportToCSV(): Promise<{ success: boolean; path?: string; error?: string }> {
    try {
      const trades = db.prepare(`
        SELECT 
          t.*,
          s.name as strategy_name
        FROM trades t
        LEFT JOIN strategies s ON t.strategy_id = s.id
        ORDER BY t.entry_date DESC
      `).all();

      // Build CSV
      const headers = [
        'Date', 'Ticker', 'Direction', 'Strategy', 'Entry Price', 'Exit Price',
        'Quantity', 'Gross P&L', 'Net P&L', 'Return %', 'Commissions', 'Hold Duration'
      ];

      const rows = trades.map((t: any) => [
        t.entry_date,
        t.ticker,
        t.direction,
        t.strategy_name || '',
        t.entry_price,
        t.exit_price || '',
        t.quantity,
        t.gross_pnl || '',
        t.net_pnl || '',
        t.return_percent || '',
        t.commissions || 0,
        t.hold_duration_minutes || '',
      ]);

      const csv = [headers, ...rows].map(row => row.join(',')).join('\n');

      // Show save dialog
      const { filePath, canceled } = await dialog.showSaveDialog({
        title: 'Export Trades to CSV',
        defaultPath: path.join(
          app.getPath('documents'),
          `mindful-trader-trades-${new Date().toISOString().split('T')[0]}.csv`
        ),
        filters: [
          { name: 'CSV Files', extensions: ['csv'] },
        ],
      });

      if (canceled || !filePath) {
        return { success: false, error: 'Export cancelled' };
      }

      fs.writeFileSync(filePath, csv);

      return { success: true, path: filePath };
    } catch (error) {
      console.error('CSV Export error:', error);
      return { success: false, error: (error as Error).message };
    }
  },

  getExportStats(): { trades: number; strategies: number; journals: number } {
    const trades = (db.prepare('SELECT COUNT(*) as count FROM trades').get() as any).count;
    const strategies = (db.prepare('SELECT COUNT(*) as count FROM strategies').get() as any).count;
    const preJournals = (db.prepare('SELECT COUNT(*) as count FROM pre_trade_journals').get() as any).count;
    const postJournals = (db.prepare('SELECT COUNT(*) as count FROM post_trade_journals').get() as any).count;

    return {
      trades,
      strategies,
      journals: preJournals + postJournals,
    };
  },
};
```

---

### Task 7.2: Create Import Service

**Step 1:** Create `src/main/services/import.ts`:
```typescript
import { db } from '../database/connection';
import { dialog } from 'electron';
import * as fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import type { ExportData } from './export';

export interface ImportResult {
  success: boolean;
  imported: {
    trades: number;
    strategies: number;
    journals: number;
  };
  errors: string[];
}

export interface CSVImportOptions {
  columnMapping: Record<string, string>;
  hasHeader: boolean;
  dateFormat: string;
}

export const importService = {
  async importFromBackup(): Promise<ImportResult> {
    const result: ImportResult = {
      success: false,
      imported: { trades: 0, strategies: 0, journals: 0 },
      errors: [],
    };

    try {
      // Show open dialog
      const { filePaths, canceled } = await dialog.showOpenDialog({
        title: 'Import Trading Journal Backup',
        filters: [
          { name: 'JSON Files', extensions: ['json'] },
        ],
        properties: ['openFile'],
      });

      if (canceled || filePaths.length === 0) {
        result.errors.push('Import cancelled');
        return result;
      }

      const fileContent = fs.readFileSync(filePaths[0], 'utf-8');
      const data: ExportData = JSON.parse(fileContent);

      // Validate format
      if (!data.version || !data.data) {
        result.errors.push('Invalid backup file format');
        return result;
      }

      // Begin transaction
      const transaction = db.transaction(() => {
        // Import strategies first (trades reference them)
        for (const strategy of data.data.strategies || []) {
          try {
            // Check if exists
            const existing = db.prepare('SELECT id FROM strategies WHERE id = ?').get(strategy.id);
            if (!existing) {
              db.prepare(`
                INSERT INTO strategies (id, user_id, name, description, setup_criteria, entry_rules, exit_rules, risk_reward_target, win_rate_target, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
              `).run(
                strategy.id,
                'local-user',
                strategy.name,
                strategy.description,
                strategy.setup_criteria,
                strategy.entry_rules,
                strategy.exit_rules,
                strategy.risk_reward_target,
                strategy.win_rate_target,
                strategy.created_at,
                strategy.updated_at
              );
              result.imported.strategies++;
            }
          } catch (err) {
            result.errors.push(`Strategy ${strategy.name}: ${(err as Error).message}`);
          }
        }

        // Import trades
        for (const trade of data.data.trades || []) {
          try {
            const existing = db.prepare('SELECT id FROM trades WHERE id = ?').get(trade.id);
            if (!existing) {
              db.prepare(`
                INSERT INTO trades (id, user_id, ticker, direction, strategy_id, entry_date, exit_date, entry_price, exit_price, quantity, commissions, slippage, gross_pnl, net_pnl, return_percent, initial_stop_loss, actual_stop_loss, risk_amount, reward_amount, actual_rr, hold_duration_minutes, market_conditions, screenshot_url, day_of_week, hour_of_day, imported_from_csv, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
              `).run(
                trade.id,
                'local-user',
                trade.ticker,
                trade.direction,
                trade.strategy_id,
                trade.entry_date,
                trade.exit_date,
                trade.entry_price,
                trade.exit_price,
                trade.quantity,
                trade.commissions,
                trade.slippage,
                trade.gross_pnl,
                trade.net_pnl,
                trade.return_percent,
                trade.initial_stop_loss,
                trade.actual_stop_loss,
                trade.risk_amount,
                trade.reward_amount,
                trade.actual_rr,
                trade.hold_duration_minutes,
                trade.market_conditions,
                trade.screenshot_url,
                trade.day_of_week,
                trade.hour_of_day,
                trade.imported_from_csv,
                trade.created_at,
                trade.updated_at
              );
              result.imported.trades++;
            }
          } catch (err) {
            result.errors.push(`Trade ${trade.ticker}: ${(err as Error).message}`);
          }
        }

        // Import journals
        for (const journal of data.data.pre_trade_journals || []) {
          try {
            const existing = db.prepare('SELECT id FROM pre_trade_journals WHERE id = ?').get(journal.id);
            if (!existing) {
              db.prepare(`
                INSERT INTO pre_trade_journals (id, user_id, trade_id, emotional_state, emotional_score, market_bias, spy_trend, sector_context, strategy_id, setup_quality, confluence_factors, checklist, planned_entry, planned_stop_loss, planned_target, planned_risk_reward, planned_position_size, planned_risk_amount, thesis, concerns, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
              `).run(
                journal.id,
                'local-user',
                journal.trade_id,
                journal.emotional_state,
                journal.emotional_score,
                journal.market_bias,
                journal.spy_trend,
                journal.sector_context,
                journal.strategy_id,
                journal.setup_quality,
                journal.confluence_factors,
                journal.checklist,
                journal.planned_entry,
                journal.planned_stop_loss,
                journal.planned_target,
                journal.planned_risk_reward,
                journal.planned_position_size,
                journal.planned_risk_amount,
                journal.thesis,
                journal.concerns,
                journal.created_at
              );
              result.imported.journals++;
            }
          } catch (err) {
            result.errors.push(`Pre-trade journal: ${(err as Error).message}`);
          }
        }

        for (const journal of data.data.post_trade_journals || []) {
          try {
            const existing = db.prepare('SELECT id FROM post_trade_journals WHERE id = ?').get(journal.id);
            if (!existing) {
              db.prepare(`
                INSERT INTO post_trade_journals (id, user_id, trade_id, pre_trade_journal_id, emotional_state, emotional_score, execution_quality, followed_plan, rule_violations, what_went_well, what_went_wrong, lessons_learned, reflection_notes, ai_analysis_completed, ai_insights, would_repeat, repeat_reasoning, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
              `).run(
                journal.id,
                'local-user',
                journal.trade_id,
                journal.pre_trade_journal_id,
                journal.emotional_state,
                journal.emotional_score,
                journal.execution_quality,
                journal.followed_plan,
                journal.rule_violations,
                journal.what_went_well,
                journal.what_went_wrong,
                journal.lessons_learned,
                journal.reflection_notes,
                journal.ai_analysis_completed,
                journal.ai_insights,
                journal.would_repeat,
                journal.repeat_reasoning,
                journal.created_at
              );
              result.imported.journals++;
            }
          } catch (err) {
            result.errors.push(`Post-trade journal: ${(err as Error).message}`);
          }
        }
      });

      transaction();
      result.success = true;

    } catch (error) {
      result.errors.push((error as Error).message);
    }

    return result;
  },

  parseCSV(content: string, hasHeader: boolean = true): { headers: string[]; rows: string[][] } {
    const lines = content.trim().split('\n');
    const headers = hasHeader ? lines[0].split(',').map(h => h.trim().replace(/"/g, '')) : [];
    const rows = (hasHeader ? lines.slice(1) : lines).map(line => {
      // Handle quoted fields with commas
      const fields: string[] = [];
      let current = '';
      let inQuotes = false;
      
      for (const char of line) {
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          fields.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      fields.push(current.trim());
      
      return fields;
    });

    return { headers, rows };
  },

  async importFromCSV(
    filePath: string,
    mapping: Record<string, number>,
    hasHeader: boolean = true
  ): Promise<ImportResult> {
    const result: ImportResult = {
      success: false,
      imported: { trades: 0, strategies: 0, journals: 0 },
      errors: [],
    };

    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const { rows } = this.parseCSV(content, hasHeader);

      const transaction = db.transaction(() => {
        for (let i = 0; i < rows.length; i++) {
          const row = rows[i];
          try {
            const id = uuidv4();
            const now = new Date().toISOString();

            // Extract values using mapping
            const ticker = row[mapping.ticker] || '';
            const direction = (row[mapping.direction] || 'long').toLowerCase();
            const entryDate = row[mapping.entry_date] || now;
            const exitDate = row[mapping.exit_date] || null;
            const entryPrice = parseFloat(row[mapping.entry_price]) || 0;
            const exitPrice = mapping.exit_price !== undefined ? parseFloat(row[mapping.exit_price]) || null : null;
            const quantity = parseInt(row[mapping.quantity]) || 1;
            const commissions = mapping.commissions !== undefined ? parseFloat(row[mapping.commissions]) || 0 : 0;

            if (!ticker) {
              result.errors.push(`Row ${i + 1}: Missing ticker`);
              continue;
            }

            // Calculate P&L if we have exit price
            let grossPnl = null;
            let netPnl = null;
            let returnPercent = null;

            if (exitPrice !== null) {
              if (direction === 'long') {
                grossPnl = (exitPrice - entryPrice) * quantity;
              } else {
                grossPnl = (entryPrice - exitPrice) * quantity;
              }
              netPnl = grossPnl - commissions;
              returnPercent = ((exitPrice - entryPrice) / entryPrice) * 100;
              if (direction === 'short') returnPercent = -returnPercent;
            }

            // Extract day and hour from entry date
            const entryDateObj = new Date(entryDate);
            const dayOfWeek = entryDateObj.getDay();
            const hourOfDay = entryDateObj.getHours();

            db.prepare(`
              INSERT INTO trades (id, user_id, ticker, direction, entry_date, exit_date, entry_price, exit_price, quantity, commissions, gross_pnl, net_pnl, return_percent, day_of_week, hour_of_day, imported_from_csv, created_at, updated_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
            `).run(
              id,
              'local-user',
              ticker.toUpperCase(),
              direction,
              entryDate,
              exitDate,
              entryPrice,
              exitPrice,
              quantity,
              commissions,
              grossPnl,
              netPnl,
              returnPercent,
              dayOfWeek,
              hourOfDay,
              now,
              now
            );

            result.imported.trades++;
          } catch (err) {
            result.errors.push(`Row ${i + 1}: ${(err as Error).message}`);
          }
        }
      });

      transaction();
      result.success = result.imported.trades > 0;

    } catch (error) {
      result.errors.push((error as Error).message);
    }

    return result;
  },
};
```

---

### Task 7.3: Create Settings IPC Handlers

**Step 1:** Create `src/main/ipc/settings.ts`:
```typescript
import { ipcMain, dialog, shell, app } from 'electron';
import { exportService } from '../services/export';
import { importService } from '../services/import';
import * as fs from 'fs';
import * as path from 'path';

export function registerSettingsHandlers(): void {
  // Export handlers
  ipcMain.handle('settings:exportAllData', async () => {
    try {
      const result = await exportService.exportAllData();
      return { data: result, error: null };
    } catch (error) {
      return { data: null, error: (error as Error).message };
    }
  });

  ipcMain.handle('settings:exportToCSV', async () => {
    try {
      const result = await exportService.exportToCSV();
      return { data: result, error: null };
    } catch (error) {
      return { data: null, error: (error as Error).message };
    }
  });

  ipcMain.handle('settings:getExportStats', async () => {
    try {
      const stats = exportService.getExportStats();
      return { data: stats, error: null };
    } catch (error) {
      return { data: null, error: (error as Error).message };
    }
  });

  // Import handlers
  ipcMain.handle('settings:importFromBackup', async () => {
    try {
      const result = await importService.importFromBackup();
      return { data: result, error: null };
    } catch (error) {
      return { data: null, error: (error as Error).message };
    }
  });

  ipcMain.handle('settings:selectCSVFile', async () => {
    try {
      const { filePaths, canceled } = await dialog.showOpenDialog({
        title: 'Select CSV File',
        filters: [
          { name: 'CSV Files', extensions: ['csv'] },
        ],
        properties: ['openFile'],
      });

      if (canceled || filePaths.length === 0) {
        return { data: null, error: 'Cancelled' };
      }

      const content = fs.readFileSync(filePaths[0], 'utf-8');
      const { headers, rows } = importService.parseCSV(content, true);

      return {
        data: {
          path: filePaths[0],
          headers,
          preview: rows.slice(0, 5),
          totalRows: rows.length,
        },
        error: null,
      };
    } catch (error) {
      return { data: null, error: (error as Error).message };
    }
  });

  ipcMain.handle('settings:importFromCSV', async (_, filePath: string, mapping: Record<string, number>, hasHeader: boolean) => {
    try {
      const result = await importService.importFromCSV(filePath, mapping, hasHeader);
      return { data: result, error: null };
    } catch (error) {
      return { data: null, error: (error as Error).message };
    }
  });

  // App info
  ipcMain.handle('settings:getAppInfo', async () => {
    return {
      data: {
        version: app.getVersion(),
        dataPath: app.getPath('userData'),
        platform: process.platform,
      },
      error: null,
    };
  });

  ipcMain.handle('settings:openDataFolder', async () => {
    shell.openPath(app.getPath('userData'));
  });

  ipcMain.handle('settings:openExternalLink', async (_, url: string) => {
    shell.openExternal(url);
  });
}
```

---

### Task 7.4: Update IPC Index and Preload

**Step 1:** Update `src/main/ipc/index.ts`:
```typescript
import { registerTradeHandlers } from './trades';
import { registerStrategyHandlers } from './strategies';
import { registerAnalyticsHandlers } from './analytics';
import { registerJournalHandlers } from './journals';
import { registerPsychologyHandlers } from './psychology';
import { registerGamificationHandlers } from './gamification';
import { registerAIHandlers } from './ai';
import { registerSettingsHandlers } from './settings';

export function registerAllIPCHandlers(): void {
  console.log('Registering IPC handlers...');
  
  registerTradeHandlers();
  registerStrategyHandlers();
  registerAnalyticsHandlers();
  registerJournalHandlers();
  registerPsychologyHandlers();
  registerGamificationHandlers();
  registerAIHandlers();
  registerSettingsHandlers();
  
  console.log('IPC handlers registered');
}
```

**Step 2:** Add to `src/main/preload.ts`:
```typescript
// Add to electronAPI object:
settings: {
  exportAllData: () => ipcRenderer.invoke('settings:exportAllData'),
  exportToCSV: () => ipcRenderer.invoke('settings:exportToCSV'),
  getExportStats: () => ipcRenderer.invoke('settings:getExportStats'),
  importFromBackup: () => ipcRenderer.invoke('settings:importFromBackup'),
  selectCSVFile: () => ipcRenderer.invoke('settings:selectCSVFile'),
  importFromCSV: (path, mapping, hasHeader) => ipcRenderer.invoke('settings:importFromCSV', path, mapping, hasHeader),
  getAppInfo: () => ipcRenderer.invoke('settings:getAppInfo'),
  openDataFolder: () => ipcRenderer.invoke('settings:openDataFolder'),
  openExternalLink: (url) => ipcRenderer.invoke('settings:openExternalLink', url),
},
```

---

### Task 7.5: Create Settings Page

**Step 1:** Create `src/renderer/pages/Settings.tsx`:
```tsx
import React, { useEffect, useState } from 'react';
import { APIKeySettings } from '@/components/settings/APIKeySettings';
import { Settings as SettingsIcon, Download, Upload, FolderOpen, ExternalLink, Database, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { APIResponse } from '@/types';

interface AppInfo {
  version: string;
  dataPath: string;
  platform: string;
}

interface ExportStats {
  trades: number;
  strategies: number;
  journals: number;
}

export function Settings() {
  const [appInfo, setAppInfo] = useState<AppInfo | null>(null);
  const [exportStats, setExportStats] = useState<ExportStats | null>(null);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchInfo = async () => {
      const infoRes: APIResponse<AppInfo> = await window.electronAPI.settings.getAppInfo();
      if (infoRes.data) setAppInfo(infoRes.data);

      const statsRes: APIResponse<ExportStats> = await window.electronAPI.settings.getExportStats();
      if (statsRes.data) setExportStats(statsRes.data);
    };
    fetchInfo();
  }, []);

  const handleExportJSON = async () => {
    setExporting(true);
    try {
      const result = await window.electronAPI.settings.exportAllData();
      if (result.data?.success) {
        toast({
          title: 'Export Complete',
          description: `Data saved to ${result.data.path}`,
          variant: 'success',
        });
      } else {
        toast({
          title: 'Export Failed',
          description: result.data?.error || 'Unknown error',
          variant: 'destructive',
        });
      }
    } finally {
      setExporting(false);
    }
  };

  const handleExportCSV = async () => {
    setExporting(true);
    try {
      const result = await window.electronAPI.settings.exportToCSV();
      if (result.data?.success) {
        toast({
          title: 'Export Complete',
          description: `Trades exported to ${result.data.path}`,
          variant: 'success',
        });
      } else {
        toast({
          title: 'Export Failed',
          description: result.data?.error || 'Unknown error',
          variant: 'destructive',
        });
      }
    } finally {
      setExporting(false);
    }
  };

  const handleImportBackup = async () => {
    setImporting(true);
    try {
      const result = await window.electronAPI.settings.importFromBackup();
      if (result.data?.success) {
        toast({
          title: 'Import Complete',
          description: `Imported ${result.data.imported.trades} trades, ${result.data.imported.strategies} strategies, ${result.data.imported.journals} journals`,
          variant: 'success',
        });
        // Refresh stats
        const statsRes: APIResponse<ExportStats> = await window.electronAPI.settings.getExportStats();
        if (statsRes.data) setExportStats(statsRes.data);
      } else if (result.data?.errors?.length) {
        toast({
          title: 'Import Completed with Errors',
          description: result.data.errors[0],
          variant: 'destructive',
        });
      }
    } finally {
      setImporting(false);
    }
  };

  const handleOpenDataFolder = () => {
    window.electronAPI.settings.openDataFolder();
  };

  return (
    <div className="p-8 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <SettingsIcon className="w-6 h-6 text-primary" />
        Settings
      </h1>

      <div className="space-y-6">
        {/* AI Settings */}
        <APIKeySettings />

        {/* Data Statistics */}
        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Database className="w-5 h-5 text-primary" />
            Your Data
          </h3>
          
          {exportStats && (
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-background-secondary rounded-lg p-4 text-center">
                <p className="text-2xl font-bold">{exportStats.trades}</p>
                <p className="text-sm text-muted-foreground">Trades</p>
              </div>
              <div className="bg-background-secondary rounded-lg p-4 text-center">
                <p className="text-2xl font-bold">{exportStats.strategies}</p>
                <p className="text-sm text-muted-foreground">Strategies</p>
              </div>
              <div className="bg-background-secondary rounded-lg p-4 text-center">
                <p className="text-2xl font-bold">{exportStats.journals}</p>
                <p className="text-sm text-muted-foreground">Journal Entries</p>
              </div>
            </div>
          )}
        </div>

        {/* Export/Import */}
        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Download className="w-5 h-5 text-primary" />
            Export & Backup
          </h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Full Backup (JSON)</p>
                <p className="text-sm text-muted-foreground">Export all data including journals</p>
              </div>
              <button
                onClick={handleExportJSON}
                disabled={exporting}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                Export JSON
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Trades Only (CSV)</p>
                <p className="text-sm text-muted-foreground">Export trades as spreadsheet</p>
              </div>
              <button
                onClick={handleExportCSV}
                disabled={exporting}
                className="flex items-center gap-2 px-4 py-2 border border-border rounded-md hover:bg-accent disabled:opacity-50"
              >
                <FileText className="w-4 h-4" />
                Export CSV
              </button>
            </div>
          </div>
        </div>

        {/* Import */}
        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Upload className="w-5 h-5 text-primary" />
            Import Data
          </h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Restore from Backup</p>
                <p className="text-sm text-muted-foreground">Import a JSON backup file</p>
              </div>
              <button
                onClick={handleImportBackup}
                disabled={importing}
                className="flex items-center gap-2 px-4 py-2 border border-border rounded-md hover:bg-accent disabled:opacity-50"
              >
                <Upload className="w-4 h-4" />
                Import Backup
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Import from CSV</p>
                <p className="text-sm text-muted-foreground">Import trades from spreadsheet</p>
              </div>
              <a
                href="#/import"
                className="flex items-center gap-2 px-4 py-2 border border-border rounded-md hover:bg-accent"
              >
                <FileText className="w-4 h-4" />
                CSV Import Wizard
              </a>
            </div>
          </div>
        </div>

        {/* About */}
        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">About</h3>
          
          {appInfo && (
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Version</span>
                <span className="font-mono">{appInfo.version}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Platform</span>
                <span className="font-mono">{appInfo.platform}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Data Location</span>
                <button
                  onClick={handleOpenDataFolder}
                  className="flex items-center gap-1 text-primary hover:underline"
                >
                  <FolderOpen className="w-4 h-4" />
                  Open Folder
                </button>
              </div>
            </div>
          )}

          <div className="mt-4 pt-4 border-t border-border">
            <p className="text-sm text-muted-foreground">
              The Mindful Trader - Local-First Trading Journal
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Your data stays on your computer. No cloud required.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

### Task 7.6: Create Import Page (CSV Wizard)

**Step 1:** Create `src/renderer/pages/Import.tsx`:
```tsx
import React, { useState } from 'react';
import { ArrowLeft, Upload, ChevronRight, Check, Loader2, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils/cn';

type Step = 'upload' | 'mapping' | 'preview' | 'complete';

const REQUIRED_FIELDS = ['ticker', 'entry_date', 'entry_price', 'quantity'];
const OPTIONAL_FIELDS = ['direction', 'exit_date', 'exit_price', 'commissions', 'strategy'];

interface CSVData {
  path: string;
  headers: string[];
  preview: string[][];
  totalRows: number;
}

interface ImportPageProps {
  onNavigate: (path: string) => void;
}

export function Import({ onNavigate }: ImportPageProps) {
  const [step, setStep] = useState<Step>('upload');
  const [csvData, setCSVData] = useState<CSVData | null>(null);
  const [mapping, setMapping] = useState<Record<string, number>>({});
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ trades: number; errors: string[] } | null>(null);
  const { toast } = useToast();

  const handleSelectFile = async () => {
    const response = await window.electronAPI.settings.selectCSVFile();
    if (response.data) {
      setCSVData(response.data);
      // Auto-map columns
      const autoMapping: Record<string, number> = {};
      response.data.headers.forEach((header, index) => {
        const normalized = header.toLowerCase().replace(/[_\s]/g, '');
        if (normalized.includes('ticker') || normalized.includes('symbol')) {
          autoMapping.ticker = index;
        } else if (normalized.includes('entry') && normalized.includes('date')) {
          autoMapping.entry_date = index;
        } else if (normalized.includes('exit') && normalized.includes('date')) {
          autoMapping.exit_date = index;
        } else if (normalized.includes('entry') && normalized.includes('price')) {
          autoMapping.entry_price = index;
        } else if (normalized.includes('exit') && normalized.includes('price')) {
          autoMapping.exit_price = index;
        } else if (normalized.includes('quantity') || normalized.includes('shares') || normalized.includes('qty')) {
          autoMapping.quantity = index;
        } else if (normalized.includes('direction') || normalized.includes('side')) {
          autoMapping.direction = index;
        } else if (normalized.includes('commission') || normalized.includes('fee')) {
          autoMapping.commissions = index;
        }
      });
      setMapping(autoMapping);
      setStep('mapping');
    }
  };

  const handleImport = async () => {
    if (!csvData) return;
    
    setImporting(true);
    try {
      const response = await window.electronAPI.settings.importFromCSV(csvData.path, mapping, true);
      if (response.data) {
        setResult({
          trades: response.data.imported.trades,
          errors: response.data.errors,
        });
        setStep('complete');
      }
    } catch (err) {
      toast({
        title: 'Import Failed',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setImporting(false);
    }
  };

  const canProceedToPreview = REQUIRED_FIELDS.every(field => mapping[field] !== undefined);

  return (
    <div className="p-8 max-w-4xl">
      <button
        onClick={() => onNavigate('/settings')}
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Settings
      </button>

      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <Upload className="w-6 h-6 text-primary" />
        Import Trades from CSV
      </h1>

      {/* Progress Steps */}
      <div className="flex items-center gap-4 mb-8">
        {(['upload', 'mapping', 'preview', 'complete'] as Step[]).map((s, i) => (
          <React.Fragment key={s}>
            <div className={cn(
              'flex items-center gap-2',
              step === s ? 'text-primary' : i < ['upload', 'mapping', 'preview', 'complete'].indexOf(step) ? 'text-profit' : 'text-muted-foreground'
            )}>
              <div className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium',
                step === s ? 'bg-primary text-primary-foreground' : 
                i < ['upload', 'mapping', 'preview', 'complete'].indexOf(step) ? 'bg-profit text-white' : 'bg-background-secondary'
              )}>
                {i < ['upload', 'mapping', 'preview', 'complete'].indexOf(step) ? <Check className="w-4 h-4" /> : i + 1}
              </div>
              <span className="text-sm capitalize">{s}</span>
            </div>
            {i < 3 && <ChevronRight className="w-4 h-4 text-muted-foreground" />}
          </React.Fragment>
        ))}
      </div>

      {/* Step Content */}
      {step === 'upload' && (
        <div className="bg-card border border-border rounded-lg p-8 text-center">
          <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-lg font-semibold mb-2">Select CSV File</h2>
          <p className="text-muted-foreground mb-6">
            Choose a CSV file containing your trade data
          </p>
          <button
            onClick={handleSelectFile}
            className="px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Choose File
          </button>
        </div>
      )}

      {step === 'mapping' && csvData && (
        <div className="space-y-6">
          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4">Map Columns</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Match your CSV columns to the required fields
            </p>

            <div className="space-y-4">
              <h3 className="font-medium text-sm text-muted-foreground">Required Fields</h3>
              {REQUIRED_FIELDS.map(field => (
                <div key={field} className="flex items-center gap-4">
                  <span className="w-32 text-sm capitalize">{field.replace(/_/g, ' ')} *</span>
                  <select
                    value={mapping[field] ?? ''}
                    onChange={(e) => setMapping({ ...mapping, [field]: parseInt(e.target.value) })}
                    className="flex-1 px-3 py-2 bg-input border border-border rounded-md"
                  >
                    <option value="">Select column...</option>
                    {csvData.headers.map((header, index) => (
                      <option key={index} value={index}>{header}</option>
                    ))}
                  </select>
                </div>
              ))}

              <h3 className="font-medium text-sm text-muted-foreground mt-6">Optional Fields</h3>
              {OPTIONAL_FIELDS.map(field => (
                <div key={field} className="flex items-center gap-4">
                  <span className="w-32 text-sm capitalize">{field.replace(/_/g, ' ')}</span>
                  <select
                    value={mapping[field] ?? ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === '') {
                        const { [field]: _, ...rest } = mapping;
                        setMapping(rest);
                      } else {
                        setMapping({ ...mapping, [field]: parseInt(value) });
                      }
                    }}
                    className="flex-1 px-3 py-2 bg-input border border-border rounded-md"
                  >
                    <option value="">Not mapped</option>
                    {csvData.headers.map((header, index) => (
                      <option key={index} value={index}>{header}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-between">
            <button
              onClick={() => setStep('upload')}
              className="px-4 py-2 border border-border rounded-md hover:bg-accent"
            >
              Back
            </button>
            <button
              onClick={() => setStep('preview')}
              disabled={!canProceedToPreview}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
            >
              Next: Preview
            </button>
          </div>
        </div>
      )}

      {step === 'preview' && csvData && (
        <div className="space-y-6">
          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4">Preview Import</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Importing {csvData.totalRows} trades
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 px-4">Ticker</th>
                    <th className="text-left py-2 px-4">Date</th>
                    <th className="text-right py-2 px-4">Entry</th>
                    <th className="text-right py-2 px-4">Exit</th>
                    <th className="text-right py-2 px-4">Qty</th>
                  </tr>
                </thead>
                <tbody>
                  {csvData.preview.slice(0, 5).map((row, i) => (
                    <tr key={i} className="border-b border-border">
                      <td className="py-2 px-4 font-mono">{row[mapping.ticker]}</td>
                      <td className="py-2 px-4">{row[mapping.entry_date]}</td>
                      <td className="py-2 px-4 text-right font-mono">{row[mapping.entry_price]}</td>
                      <td className="py-2 px-4 text-right font-mono">{mapping.exit_price !== undefined ? row[mapping.exit_price] : '-'}</td>
                      <td className="py-2 px-4 text-right font-mono">{row[mapping.quantity]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {csvData.totalRows > 5 && (
              <p className="text-xs text-muted-foreground mt-2">
                ...and {csvData.totalRows - 5} more rows
              </p>
            )}
          </div>

          <div className="flex justify-between">
            <button
              onClick={() => setStep('mapping')}
              className="px-4 py-2 border border-border rounded-md hover:bg-accent"
            >
              Back
            </button>
            <button
              onClick={handleImport}
              disabled={importing}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
            >
              {importing && <Loader2 className="w-4 h-4 animate-spin" />}
              Import {csvData.totalRows} Trades
            </button>
          </div>
        </div>
      )}

      {step === 'complete' && result && (
        <div className="bg-card border border-border rounded-lg p-8 text-center">
          <Check className="w-16 h-16 text-profit mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Import Complete!</h2>
          <p className="text-muted-foreground mb-6">
            Successfully imported {result.trades} trades
          </p>

          {result.errors.length > 0 && (
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-6 text-left">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-yellow-500" />
                <span className="font-medium text-yellow-500">{result.errors.length} errors occurred</span>
              </div>
              <ul className="text-sm text-muted-foreground space-y-1">
                {result.errors.slice(0, 5).map((err, i) => (
                  <li key={i}>• {err}</li>
                ))}
                {result.errors.length > 5 && (
                  <li>...and {result.errors.length - 5} more</li>
                )}
              </ul>
            </div>
          )}

          <button
            onClick={() => onNavigate('/trades')}
            className="px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            View Trades
          </button>
        </div>
      )}
    </div>
  );
}
```

---

### Task 7.7: Update App.tsx with Routes

**Step 1:** Update `src/renderer/App.tsx`:

Add imports:
```tsx
import { Settings } from '@/pages/Settings';
import { Import } from '@/pages/Import';
```

Add routes in `renderPage()`:
```tsx
if (currentPath === '/settings') {
  return <Settings />;
}
if (currentPath === '/import') {
  return <Import onNavigate={navigate} />;
}
```

---

### Task 7.8: Configure Electron Builder

**Step 1:** Create `electron-builder.yml` in project root:
```yaml
appId: com.mindfultrader.app
productName: The Mindful Trader
copyright: Copyright © 2024

directories:
  output: dist
  buildResources: resources

files:
  - "out/**/*"
  - "node_modules/**/*"
  - "package.json"

mac:
  category: public.app-category.finance
  target:
    - target: dmg
      arch:
        - x64
        - arm64
  icon: resources/icon.icns
  hardenedRuntime: true
  gatekeeperAssess: false
  entitlements: entitlements.mac.plist
  entitlementsInherit: entitlements.mac.plist
  notarize:
    teamId: ${env.APPLE_TEAM_ID}

dmg:
  sign: false
  contents:
    - x: 130
      y: 220
    - x: 410
      y: 220
      type: link
      path: /Applications

extraResources:
  - from: "node_modules/better-sqlite3/build/Release/better_sqlite3.node"
    to: "app/better_sqlite3.node"

afterSign: scripts/notarize.js

# Rebuild native modules for Electron
electronDownload:
  cache: .cache/electron

npmRebuild: true
```

---

### Task 7.9: Create macOS Entitlements

**Step 1:** Create `entitlements.mac.plist` in project root:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>com.apple.security.cs.allow-jit</key>
    <true/>
    <key>com.apple.security.cs.allow-unsigned-executable-memory</key>
    <true/>
    <key>com.apple.security.cs.disable-library-validation</key>
    <true/>
    <key>com.apple.security.automation.apple-events</key>
    <true/>
    <key>com.apple.security.network.client</key>
    <true/>
    <key>keychain-access-groups</key>
    <array>
        <string>$(AppIdentifierPrefix)com.mindfultrader.app</string>
    </array>
</dict>
</plist>
```

---

### Task 7.10: Create Notarization Script

**Step 1:** Create `scripts/notarize.js`:
```javascript
const { notarize } = require('@electron/notarize');

exports.default = async function notarizing(context) {
  const { electronPlatformName, appOutDir } = context;
  
  if (electronPlatformName !== 'darwin') {
    return;
  }

  // Skip notarization if credentials not present
  if (!process.env.APPLE_ID || !process.env.APPLE_APP_SPECIFIC_PASSWORD) {
    console.log('Skipping notarization - credentials not found');
    return;
  }

  const appName = context.packager.appInfo.productFilename;

  console.log(`Notarizing ${appName}...`);

  await notarize({
    appBundleId: 'com.mindfultrader.app',
    appPath: `${appOutDir}/${appName}.app`,
    appleId: process.env.APPLE_ID,
    appleIdPassword: process.env.APPLE_APP_SPECIFIC_PASSWORD,
    teamId: process.env.APPLE_TEAM_ID,
  });

  console.log('Notarization complete!');
};
```

---

### Task 7.11: Update Package.json

**Step 1:** Add/update the following in `package.json`:
```json
{
  "name": "mindful-trader",
  "version": "1.0.0",
  "description": "The Mindful Trader - Local-First Trading Journal",
  "author": "Your Name",
  "license": "MIT",
  "main": "out/main/index.js",
  "scripts": {
    "dev": "electron-vite dev",
    "build": "electron-vite build",
    "preview": "electron-vite preview",
    "type-check": "tsc --noEmit",
    "lint": "eslint . --ext .ts,.tsx",
    "postinstall": "electron-rebuild -f -w better-sqlite3",
    "pack": "npm run build && electron-builder --dir",
    "dist": "npm run build && electron-builder",
    "dist:mac": "npm run build && electron-builder --mac",
    "dist:universal": "npm run build && electron-builder --mac --universal"
  },
  "devDependencies": {
    "@electron/notarize": "^2.2.0",
    "@electron/rebuild": "^3.4.0",
    "electron": "^28.0.0",
    "electron-builder": "^24.9.0",
    "electron-vite": "^2.0.0",
    "typescript": "^5.3.0",
    "vite": "^5.0.0"
  },
  "dependencies": {
    "better-sqlite3": "^9.2.0",
    "keytar": "^7.9.0",
    "uuid": "^9.0.0",
    "recharts": "^2.10.0",
    "lucide-react": "^0.294.0"
  }
}
```

---

### Task 7.12: Create App Icon

**Step 1:** Create the app icon:

1. Create a 1024x1024 PNG image for the app icon
2. Use `iconutil` on macOS to create the `.icns` file:

```bash
# Create iconset directory
mkdir -p resources/icon.iconset

# Create various sizes (assuming you have icon.png at 1024x1024)
sips -z 16 16     resources/icon.png --out resources/icon.iconset/icon_16x16.png
sips -z 32 32     resources/icon.png --out resources/icon.iconset/icon_16x16@2x.png
sips -z 32 32     resources/icon.png --out resources/icon.iconset/icon_32x32.png
sips -z 64 64     resources/icon.png --out resources/icon.iconset/icon_32x32@2x.png
sips -z 128 128   resources/icon.png --out resources/icon.iconset/icon_128x128.png
sips -z 256 256   resources/icon.png --out resources/icon.iconset/icon_128x128@2x.png
sips -z 256 256   resources/icon.png --out resources/icon.iconset/icon_256x256.png
sips -z 512 512   resources/icon.png --out resources/icon.iconset/icon_256x256@2x.png
sips -z 512 512   resources/icon.png --out resources/icon.iconset/icon_512x512.png
sips -z 1024 1024 resources/icon.png --out resources/icon.iconset/icon_512x512@2x.png

# Convert to icns
iconutil -c icns resources/icon.iconset
```

---

### Task 7.13: Build and Package

**Step 1:** Build for development testing:
```bash
npm run pack
```
This creates an unpackaged app in `dist/mac` for testing.

**Step 2:** Build signed DMG:
```bash
# Set environment variables for signing
export APPLE_ID="your.email@example.com"
export APPLE_APP_SPECIFIC_PASSWORD="xxxx-xxxx-xxxx-xxxx"
export APPLE_TEAM_ID="XXXXXXXXXX"

# Build DMG
npm run dist:mac
```

**Step 3:** For universal binary (Intel + Apple Silicon):
```bash
npm run dist:universal
```

---

## Success Criteria

- [ ] Settings page displays with all sections
- [ ] Data export to JSON works
- [ ] Data export to CSV works
- [ ] Data import from JSON backup works
- [ ] CSV import wizard completes successfully
- [ ] Column mapping auto-detects common headers
- [ ] App version displays correctly
- [ ] Data folder can be opened
- [ ] `npm run pack` creates working app
- [ ] `npm run dist:mac` creates DMG
- [ ] DMG mounts and shows drag-to-install interface
- [ ] App launches from /Applications after install
- [ ] Native modules (better-sqlite3, keytar) work in packaged app
- [ ] Code signing passes (if credentials provided)
- [ ] Notarization completes (if credentials provided)

### Test Workflow

1. Open Settings page
2. Verify data statistics
3. Export all data to JSON
4. Export trades to CSV
5. Open exported files and verify contents
6. Reset database or use new profile
7. Import from JSON backup
8. Verify data restored
9. Test CSV import wizard
10. Build packaged app
11. Install from DMG
12. Launch installed app
13. Verify all features work

---

## Human Oversight Checkpoints

### Checkpoint: Before Building Distribution

**Manual Verification Required:**
1. Test app thoroughly in development mode
2. Verify all features work correctly
3. Check for console errors
4. Verify data persistence works
5. Test on both Intel and Apple Silicon Macs if building universal

### Checkpoint: Code Signing Setup

**Required for Distribution:**
1. Enroll in Apple Developer Program ($99/year)
2. Create Developer ID Application certificate
3. Create App-specific password for notarization
4. Set environment variables

### Checkpoint: After Packaging

**Manual Verification Required:**
1. Mount the DMG
2. Drag app to Applications
3. Launch from Applications (not from DMG)
4. Verify Gatekeeper allows the app
5. Test all features in packaged version
6. Check that native modules work

---

## Handoff Complete

### Summary

This completes the implementation plan for migrating "The Mindful Trader" from Next.js + Supabase to Electron + SQLite.

### Total Files Created Across All Phases

| Phase | New Files | Modified Files |
|-------|-----------|----------------|
| 1. Project Setup | ~15 | 0 |
| 2. Database Layer | ~12 | 2 |
| 3. Core Features | ~20 | 2 |
| 4. Journaling | ~10 | 4 |
| 5. Psychology Analytics | ~12 | 3 |
| 6. Gamification AI | ~10 | 4 |
| 7. Polish Packaging | ~12 | 4 |

**Total: ~91 new files, ~19 modifications**

### Key Technologies Used

- **Electron 28+** - Desktop app framework
- **React 18** - UI framework
- **TypeScript** - Type safety
- **better-sqlite3** - Local database
- **keytar** - Secure credential storage
- **Recharts** - Charts and visualizations
- **electron-builder** - App packaging
- **electron-vite** - Fast development build

### Final App Features

1. ✅ Trade logging with full CRUD
2. ✅ Strategy management
3. ✅ Pre and post-trade journaling
4. ✅ Emotion tracking with visual selectors
5. ✅ Psychology dashboard with metrics
6. ✅ Analytics with charts and heatmaps
7. ✅ Gamification (streaks, badges, levels)
8. ✅ AI-powered trade analysis
9. ✅ Secure API key management
10. ✅ Data export/import
11. ✅ CSV import wizard
12. ✅ Distributable macOS app

---

**Implementation Plan Complete**

All 7 phases documented and ready for execution.
