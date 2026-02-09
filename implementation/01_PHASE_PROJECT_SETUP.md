# Phase 1: Project Setup

## Prerequisites
- Node.js 18+ installed
- npm or yarn package manager
- macOS development environment
- Git initialized
- Source project exists at `/Users/allanbranstiter/Documents/GitHub/TradingJournal`

## Context
This is the first phase. We are creating a new Electron + React + TypeScript project from scratch, then copying and configuring the UI framework (Tailwind, Shadcn) from the existing web app.

**Entering State:** Empty directory
**Exiting State:** Electron app that opens a window with styled placeholder content

## Objectives
1. Initialize Electron + React + TypeScript project with Vite
2. Configure the build system for main, preload, and renderer processes
3. Set up Tailwind CSS with the existing theme configuration
4. Copy Shadcn/UI components from source project
5. Create basic app shell with placeholder navigation
6. Verify development hot-reload works

---

## Files to Create

| File Path | Purpose | Source Reference |
|-----------|---------|-----------------|
| `package.json` | Project dependencies and scripts | New file |
| `tsconfig.json` | Base TypeScript config | New file |
| `tsconfig.main.json` | Main process TypeScript config | New file |
| `tsconfig.renderer.json` | Renderer process TypeScript config | New file |
| `vite.main.config.ts` | Vite config for main process | New file |
| `vite.preload.config.ts` | Vite config for preload script | New file |
| `vite.renderer.config.ts` | Vite config for renderer | New file |
| `electron-builder.yml` | Build/packaging configuration | New file |
| `tailwind.config.ts` | Tailwind configuration | Copy from source |
| `postcss.config.js` | PostCSS configuration | Copy from source |
| `src/main/index.ts` | Electron main process entry | New file |
| `src/main/preload.ts` | Context bridge for IPC | New file |
| `src/renderer/index.html` | HTML entry point | New file |
| `src/renderer/main.tsx` | React entry point | New file |
| `src/renderer/App.tsx` | Root React component | New file |
| `src/renderer/styles/globals.css` | Global styles with Tailwind | Copy from source |
| `src/renderer/components/ui/*` | Shadcn UI components | Copy from source |
| `src/renderer/lib/utils/cn.ts` | Class name utility | Copy from source |

---

## Detailed Instructions

### Task 1.1: Create Project Directory and Initialize

**Step 1:** Create the target project directory
```bash
mkdir -p /Users/allanbranstiter/Documents/GitHub/TradingJournal-Mac
cd /Users/allanbranstiter/Documents/GitHub/TradingJournal-Mac
git init
```

**Step 2:** Create `package.json` with the following content:
```json
{
  "name": "trading-journal-mac",
  "version": "1.0.0",
  "description": "The Mindful Trader - Psychology-First Trading Journal for macOS",
  "main": "dist/main/index.js",
  "author": "Your Name",
  "license": "MIT",
  "scripts": {
    "dev": "electron-vite dev",
    "build": "electron-vite build",
    "preview": "electron-vite preview",
    "package": "electron-builder",
    "package:mac": "electron-builder --mac",
    "type-check": "tsc --noEmit",
    "lint": "eslint . --ext .ts,.tsx",
    "rebuild": "electron-rebuild -f -w better-sqlite3"
  },
  "dependencies": {
    "@hookform/resolvers": "^3.3.0",
    "@radix-ui/react-avatar": "^1.1.11",
    "@radix-ui/react-checkbox": "^1.3.3",
    "@radix-ui/react-dialog": "^1.1.15",
    "@radix-ui/react-dropdown-menu": "^2.1.16",
    "@radix-ui/react-label": "^2.1.8",
    "@radix-ui/react-progress": "^1.1.8",
    "@radix-ui/react-radio-group": "^1.3.8",
    "@radix-ui/react-select": "^2.2.6",
    "@radix-ui/react-separator": "^1.1.8",
    "@radix-ui/react-slider": "^1.3.6",
    "@radix-ui/react-slot": "^1.2.4",
    "@radix-ui/react-tabs": "^1.1.13",
    "@radix-ui/react-toast": "^1.2.15",
    "better-sqlite3": "^9.2.2",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.0",
    "date-fns": "^3.0.0",
    "electron-store": "^8.1.0",
    "keytar": "^7.9.0",
    "lightweight-charts": "^4.2.3",
    "lucide-react": "^0.300.0",
    "papaparse": "^5.5.3",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-hook-form": "^7.49.0",
    "recharts": "^2.10.0",
    "tailwind-merge": "^2.2.0",
    "uuid": "^9.0.0",
    "zod": "^3.22.0",
    "zustand": "^4.5.7"
  },
  "devDependencies": {
    "@electron/rebuild": "^3.4.0",
    "@types/better-sqlite3": "^7.6.8",
    "@types/node": "^20.10.0",
    "@types/papaparse": "^5.5.2",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@types/uuid": "^9.0.7",
    "@typescript-eslint/eslint-plugin": "^6.0.0",
    "@typescript-eslint/parser": "^6.0.0",
    "autoprefixer": "^10.4.16",
    "electron": "^28.0.0",
    "electron-builder": "^24.9.0",
    "electron-vite": "^2.0.0",
    "eslint": "^8.0.0",
    "postcss": "^8.4.32",
    "tailwindcss": "^3.4.0",
    "typescript": "^5.3.0",
    "vite": "^5.0.0"
  }
}
```

**Step 3:** Install dependencies
```bash
npm install
```

---

### Task 1.2: Create TypeScript Configuration Files

**Step 1:** Create `tsconfig.json` (base configuration):
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "declaration": true,
    "declarationMap": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/renderer/*"],
      "@main/*": ["./src/main/*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

**Step 2:** Create `tsconfig.main.json` (main process):
```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "composite": true,
    "outDir": "dist/main",
    "lib": ["ES2022"],
    "module": "ESNext",
    "noEmit": false
  },
  "include": ["src/main/**/*"]
}
```

**Step 3:** Create `tsconfig.renderer.json` (renderer process):
```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "composite": true,
    "jsx": "react-jsx",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "outDir": "dist/renderer",
    "noEmit": false
  },
  "include": ["src/renderer/**/*"]
}
```

---

### Task 1.3: Create Vite Configuration Files

**Step 1:** Create `vite.main.config.ts`:
```typescript
import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/main/index.ts'),
      formats: ['cjs'],
      fileName: () => 'index.js',
    },
    outDir: 'dist/main',
    rollupOptions: {
      external: [
        'electron',
        'better-sqlite3',
        'keytar',
        'electron-store',
        'path',
        'fs',
        'url',
        'crypto',
      ],
    },
    minify: false,
    sourcemap: true,
  },
  resolve: {
    alias: {
      '@main': path.resolve(__dirname, 'src/main'),
    },
  },
});
```

**Step 2:** Create `vite.preload.config.ts`:
```typescript
import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/main/preload.ts'),
      formats: ['cjs'],
      fileName: () => 'preload.js',
    },
    outDir: 'dist/preload',
    rollupOptions: {
      external: ['electron'],
    },
    minify: false,
    sourcemap: true,
  },
});
```

**Step 3:** Create `vite.renderer.config.ts`:
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: 'dist/renderer',
    sourcemap: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src/renderer'),
    },
  },
  server: {
    port: 5173,
  },
});
```

**Step 4:** Install the React plugin:
```bash
npm install -D @vitejs/plugin-react
```

---

### Task 1.4: Create electron-vite Configuration

**Step 1:** Create `electron.vite.config.ts` in project root:
```typescript
import { defineConfig, externalizeDepsPlugin } from 'electron-vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    build: {
      rollupOptions: {
        input: {
          index: path.resolve(__dirname, 'src/main/index.ts'),
        },
      },
    },
    resolve: {
      alias: {
        '@main': path.resolve(__dirname, 'src/main'),
      },
    },
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    build: {
      rollupOptions: {
        input: {
          preload: path.resolve(__dirname, 'src/main/preload.ts'),
        },
      },
    },
  },
  renderer: {
    plugins: [react()],
    root: path.resolve(__dirname, 'src/renderer'),
    build: {
      rollupOptions: {
        input: {
          index: path.resolve(__dirname, 'src/renderer/index.html'),
        },
      },
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src/renderer'),
      },
    },
  },
});
```

---

### Task 1.5: Create Electron Main Process

**Step 1:** Create directory structure:
```bash
mkdir -p src/main
mkdir -p src/renderer/components/ui
mkdir -p src/renderer/styles
mkdir -p src/renderer/lib/utils
```

**Step 2:** Create `src/main/index.ts`:
```typescript
import { app, BrowserWindow, shell } from 'electron';
import path from 'path';

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

let mainWindow: BrowserWindow | null = null;

function createWindow(): void {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 768,
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false, // Required for better-sqlite3
    },
    titleBarStyle: 'hiddenInset', // macOS native title bar
    trafficLightPosition: { x: 16, y: 16 },
    backgroundColor: '#0a0e1a', // Dark theme background
    show: false, // Don't show until ready
  });

  // Show window when ready to prevent visual flash
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  // Open external links in default browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // Load the app
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// App lifecycle
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    // On macOS, re-create window when dock icon is clicked
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  // On macOS, apps typically stay active until Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Security: Prevent navigation to external URLs
app.on('web-contents-created', (_, contents) => {
  contents.on('will-navigate', (event, url) => {
    const parsedUrl = new URL(url);
    if (parsedUrl.origin !== 'http://localhost:5173') {
      event.preventDefault();
    }
  });
});
```

**Step 3:** Create `src/main/preload.ts`:
```typescript
import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Platform info
  platform: process.platform,
  
  // Placeholder for future IPC methods
  // These will be added in Phase 2 and 3
  
  // Trades
  trades: {
    getAll: (filters?: any) => ipcRenderer.invoke('trades:getAll', filters),
    getById: (id: string) => ipcRenderer.invoke('trades:getById', id),
    create: (data: any) => ipcRenderer.invoke('trades:create', data),
    update: (id: string, data: any) => ipcRenderer.invoke('trades:update', id, data),
    delete: (id: string) => ipcRenderer.invoke('trades:delete', id),
  },
  
  // Strategies
  strategies: {
    getAll: () => ipcRenderer.invoke('strategies:getAll'),
    create: (data: any) => ipcRenderer.invoke('strategies:create', data),
    update: (id: string, data: any) => ipcRenderer.invoke('strategies:update', id, data),
    delete: (id: string) => ipcRenderer.invoke('strategies:delete', id),
  },
  
  // Journals
  journals: {
    getPreTradeByTradeId: (tradeId: string) => ipcRenderer.invoke('journals:getPreTradeByTradeId', tradeId),
    getPostTradeByTradeId: (tradeId: string) => ipcRenderer.invoke('journals:getPostTradeByTradeId', tradeId),
    createPreTrade: (data: any) => ipcRenderer.invoke('journals:createPreTrade', data),
    createPostTrade: (data: any) => ipcRenderer.invoke('journals:createPostTrade', data),
    updatePreTrade: (id: string, data: any) => ipcRenderer.invoke('journals:updatePreTrade', id, data),
    updatePostTrade: (id: string, data: any) => ipcRenderer.invoke('journals:updatePostTrade', id, data),
  },
  
  // Analytics
  analytics: {
    getPerformanceSummary: () => ipcRenderer.invoke('analytics:getPerformanceSummary'),
    getPsychologyCorrelation: () => ipcRenderer.invoke('analytics:getPsychologyCorrelation'),
    getStrategyPerformance: () => ipcRenderer.invoke('analytics:getStrategyPerformance'),
    getMonthlyPerformance: () => ipcRenderer.invoke('analytics:getMonthlyPerformance'),
    getTimeAnalysis: () => ipcRenderer.invoke('analytics:getTimeAnalysis'),
  },
  
  // Gamification
  gamification: {
    getStatus: () => ipcRenderer.invoke('gamification:getStatus'),
    updateStreak: () => ipcRenderer.invoke('gamification:updateStreak'),
    checkBadges: () => ipcRenderer.invoke('gamification:checkBadges'),
  },
  
  // AI
  ai: {
    analyzeTrade: (tradeId: string) => ipcRenderer.invoke('ai:analyzeTrade', tradeId),
    getWeeklySummary: () => ipcRenderer.invoke('ai:getWeeklySummary'),
  },
  
  // Settings
  settings: {
    get: (key: string) => ipcRenderer.invoke('settings:get', key),
    set: (key: string, value: any) => ipcRenderer.invoke('settings:set', key, value),
    getAll: () => ipcRenderer.invoke('settings:getAll'),
  },
  
  // Keychain (secure storage)
  keychain: {
    getApiKey: () => ipcRenderer.invoke('keychain:getApiKey'),
    setApiKey: (key: string) => ipcRenderer.invoke('keychain:setApiKey', key),
    deleteApiKey: () => ipcRenderer.invoke('keychain:deleteApiKey'),
  },
  
  // File operations
  files: {
    exportData: (format: string) => ipcRenderer.invoke('files:exportData', format),
    importData: (filePath: string) => ipcRenderer.invoke('files:importData', filePath),
    selectFile: (options: any) => ipcRenderer.invoke('files:selectFile', options),
    saveScreenshot: (buffer: Buffer, tradeId: string) => ipcRenderer.invoke('files:saveScreenshot', buffer, tradeId),
  },
});

// Type definitions for renderer process
declare global {
  interface Window {
    electronAPI: {
      platform: string;
      trades: {
        getAll: (filters?: any) => Promise<any[]>;
        getById: (id: string) => Promise<any>;
        create: (data: any) => Promise<any>;
        update: (id: string, data: any) => Promise<any>;
        delete: (id: string) => Promise<boolean>;
      };
      strategies: {
        getAll: () => Promise<any[]>;
        create: (data: any) => Promise<any>;
        update: (id: string, data: any) => Promise<any>;
        delete: (id: string) => Promise<boolean>;
      };
      journals: {
        getPreTradeByTradeId: (tradeId: string) => Promise<any>;
        getPostTradeByTradeId: (tradeId: string) => Promise<any>;
        createPreTrade: (data: any) => Promise<any>;
        createPostTrade: (data: any) => Promise<any>;
        updatePreTrade: (id: string, data: any) => Promise<any>;
        updatePostTrade: (id: string, data: any) => Promise<any>;
      };
      analytics: {
        getPerformanceSummary: () => Promise<any>;
        getPsychologyCorrelation: () => Promise<any[]>;
        getStrategyPerformance: () => Promise<any[]>;
        getMonthlyPerformance: () => Promise<any[]>;
        getTimeAnalysis: () => Promise<any>;
      };
      gamification: {
        getStatus: () => Promise<any>;
        updateStreak: () => Promise<any>;
        checkBadges: () => Promise<any[]>;
      };
      ai: {
        analyzeTrade: (tradeId: string) => Promise<any>;
        getWeeklySummary: () => Promise<any>;
      };
      settings: {
        get: (key: string) => Promise<any>;
        set: (key: string, value: any) => Promise<void>;
        getAll: () => Promise<Record<string, any>>;
      };
      keychain: {
        getApiKey: () => Promise<string | null>;
        setApiKey: (key: string) => Promise<void>;
        deleteApiKey: () => Promise<void>;
      };
      files: {
        exportData: (format: string) => Promise<string>;
        importData: (filePath: string) => Promise<any>;
        selectFile: (options: any) => Promise<string | null>;
        saveScreenshot: (buffer: Buffer, tradeId: string) => Promise<string>;
      };
    };
  }
}
```

---

### Task 1.6: Create Renderer Entry Points

**Step 1:** Create `src/renderer/index.html`:
```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: file:; connect-src 'self' https://openrouter.ai;">
    <title>The Mindful Trader</title>
  </head>
  <body class="bg-background text-foreground">
    <div id="root"></div>
    <script type="module" src="./main.tsx"></script>
  </body>
</html>
```

**Step 2:** Create `src/renderer/main.tsx`:
```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/globals.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

**Step 3:** Create `src/renderer/App.tsx`:
```tsx
import React from 'react';

function App() {
  return (
    <div className="min-h-screen bg-background">
      {/* macOS title bar drag region */}
      <div className="h-12 bg-background-secondary draggable flex items-center justify-center border-b border-border">
        <span className="text-sm text-muted-foreground font-medium">
          The Mindful Trader
        </span>
      </div>
      
      {/* Main content area - placeholder */}
      <div className="flex h-[calc(100vh-48px)]">
        {/* Sidebar placeholder */}
        <aside className="w-64 bg-background-secondary border-r border-border p-4">
          <nav className="space-y-2">
            <div className="text-sm font-medium text-foreground px-3 py-2 rounded-md bg-accent">
              Dashboard
            </div>
            <div className="text-sm text-muted-foreground px-3 py-2 hover:bg-accent/50 rounded-md cursor-pointer">
              Trades
            </div>
            <div className="text-sm text-muted-foreground px-3 py-2 hover:bg-accent/50 rounded-md cursor-pointer">
              Psychology
            </div>
            <div className="text-sm text-muted-foreground px-3 py-2 hover:bg-accent/50 rounded-md cursor-pointer">
              Analytics
            </div>
            <div className="text-sm text-muted-foreground px-3 py-2 hover:bg-accent/50 rounded-md cursor-pointer">
              Settings
            </div>
          </nav>
        </aside>
        
        {/* Main content placeholder */}
        <main className="flex-1 p-8">
          <h1 className="text-3xl font-bold text-foreground mb-6">
            Welcome to The Mindful Trader
          </h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {/* Placeholder metric cards */}
            <div className="bg-card rounded-lg border border-border p-6">
              <p className="text-sm text-muted-foreground mb-1">Total P&amp;L</p>
              <p className="text-2xl font-bold text-profit">$0.00</p>
            </div>
            <div className="bg-card rounded-lg border border-border p-6">
              <p className="text-sm text-muted-foreground mb-1">Win Rate</p>
              <p className="text-2xl font-bold text-foreground">0%</p>
            </div>
            <div className="bg-card rounded-lg border border-border p-6">
              <p className="text-sm text-muted-foreground mb-1">Total Trades</p>
              <p className="text-2xl font-bold text-foreground">0</p>
            </div>
            <div className="bg-card rounded-lg border border-border p-6">
              <p className="text-sm text-muted-foreground mb-1">Profit Factor</p>
              <p className="text-2xl font-bold text-foreground">0.00</p>
            </div>
          </div>
          
          <div className="bg-card rounded-lg border border-border p-6">
            <h2 className="text-lg font-semibold mb-4">Setup Status</h2>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-profit"></span>
                <span>Electron app running</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-profit"></span>
                <span>React rendering</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-profit"></span>
                <span>Tailwind CSS loaded</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-muted"></span>
                <span>Database connection (Phase 2)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-muted"></span>
                <span>IPC handlers (Phase 2)</span>
              </div>
            </div>
          </div>
          
          <p className="mt-8 text-sm text-muted-foreground">
            Platform: {window.electronAPI?.platform || 'Unknown'}
          </p>
        </main>
      </div>
    </div>
  );
}

export default App;
```

---

### Task 1.7: Set Up Tailwind CSS

**Step 1:** Create `tailwind.config.ts`:
```typescript
import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/renderer/**/*.{js,ts,jsx,tsx}',
    './src/renderer/index.html',
  ],
  theme: {
    extend: {
      colors: {
        // Background colors
        background: {
          DEFAULT: '#0a0e1a',
          secondary: '#141b2d',
          tertiary: '#1f2940',
        },
        // Foreground/text colors
        foreground: {
          DEFAULT: '#e0e6ed',
        },
        // Muted text
        'muted-foreground': '#8b92a7',
        // Card backgrounds
        card: {
          DEFAULT: '#141b2d',
          foreground: '#e0e6ed',
        },
        // Border colors
        border: '#252e42',
        // Input backgrounds
        input: '#1f2940',
        // Primary accent
        primary: {
          DEFAULT: '#3b82f6',
          foreground: '#ffffff',
        },
        // Secondary
        secondary: {
          DEFAULT: '#1f2940',
          foreground: '#e0e6ed',
        },
        // Accent for hover states
        accent: {
          DEFAULT: '#1f2940',
          foreground: '#e0e6ed',
        },
        // Destructive (errors)
        destructive: {
          DEFAULT: '#ef4444',
          foreground: '#ffffff',
        },
        // Muted backgrounds
        muted: {
          DEFAULT: '#1f2940',
          foreground: '#8b92a7',
        },
        // Ring for focus states
        ring: '#3b82f6',
        // Trading-specific colors
        profit: '#10b981',
        loss: '#ef4444',
        warning: '#f59e0b',
        info: '#3b82f6',
        purple: '#8b5cf6',
        // Chart colors
        chart: {
          grid: '#252e42',
          axis: '#4a5568',
          bull: '#10b981',
          bear: '#ef4444',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        lg: '0.5rem',
        md: '0.375rem',
        sm: '0.25rem',
      },
    },
  },
  plugins: [],
};

export default config;
```

**Step 2:** Create `postcss.config.js`:
```javascript
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

**Step 3:** Create `src/renderer/styles/globals.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Custom base styles */
@layer base {
  :root {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 90%;
    --card: 222.2 84% 8%;
    --card-foreground: 210 40% 90%;
    --popover: 222.2 84% 8%;
    --popover-foreground: 210 40% 90%;
    --primary: 217.2 91.2% 59.8%;
    --primary-foreground: 0 0% 100%;
    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 90%;
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 60%;
    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 90%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 90%;
    --border: 217.2 32.6% 20%;
    --input: 217.2 32.6% 17.5%;
    --ring: 217.2 91.2% 59.8%;
    --radius: 0.5rem;
  }

  * {
    @apply border-border;
  }

  body {
    @apply bg-background text-foreground;
    font-feature-settings: "rlig" 1, "calt" 1;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  /* Hide scrollbar but keep functionality */
  ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }

  ::-webkit-scrollbar-track {
    background: transparent;
  }

  ::-webkit-scrollbar-thumb {
    background: #4a5568;
    border-radius: 4px;
  }

  ::-webkit-scrollbar-thumb:hover {
    background: #5a6578;
  }
}

@layer utilities {
  /* macOS title bar drag region */
  .draggable {
    -webkit-app-region: drag;
  }

  .no-drag {
    -webkit-app-region: no-drag;
  }

  /* Hide number input spinners */
  input[type="number"]::-webkit-inner-spin-button,
  input[type="number"]::-webkit-outer-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }

  input[type="number"] {
    -moz-appearance: textfield;
  }
}
```

---

### Task 1.8: Copy Utility Functions

**Step 1:** Create `src/renderer/lib/utils/cn.ts`:
```typescript
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

---

### Task 1.9: Create electron-builder Configuration

**Step 1:** Create `electron-builder.yml`:
```yaml
appId: com.mindfultrader.app
productName: The Mindful Trader
copyright: Copyright © 2026

directories:
  output: release
  buildResources: resources

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
  entitlements: build/entitlements.mac.plist
  entitlementsInherit: build/entitlements.mac.inherit.plist

dmg:
  artifactName: "${productName}-${version}-${arch}.dmg"
  contents:
    - x: 130
      y: 220
    - x: 410
      y: 220
      type: link
      path: /Applications

files:
  - dist/**/*
  - "!node_modules/**/*"
  - node_modules/better-sqlite3/**/*
  - node_modules/keytar/**/*

asarUnpack:
  - "**/*.node"
  - "**/better-sqlite3/**"
  - "**/keytar/**"

npmRebuild: true

extraMetadata:
  main: dist/main/index.js
```

**Step 2:** Create `build/entitlements.mac.plist`:
```bash
mkdir -p build
```

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
</dict>
</plist>
```

**Step 3:** Create `build/entitlements.mac.inherit.plist`:
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
</dict>
</plist>
```

---

### Task 1.10: Create Placeholder App Icon

**Step 1:** Create resources directory:
```bash
mkdir -p resources
```

**Note:** For development, we'll use a placeholder. Create a proper icon later using a 1024x1024 PNG and converting to `.icns` format using:
```bash
# When you have a PNG icon ready:
# iconutil -c icns icon.iconset
```

For now, the app will use the default Electron icon.

---

### Task 1.11: Create .gitignore

**Step 1:** Create `.gitignore`:
```
# Dependencies
node_modules/

# Build outputs
dist/
release/
out/

# Environment files
.env
.env.local
.env.*.local

# IDE
.idea/
.vscode/
*.swp
*.swo
.DS_Store

# Logs
*.log
npm-debug.log*

# Database files (user data)
*.db
*.sqlite
*.sqlite3

# Temporary files
tmp/
temp/
```

---

### Task 1.12: Test the Setup

**Step 1:** Rebuild native modules:
```bash
npm run rebuild
```

**Step 2:** Run in development mode:
```bash
npm run dev
```

**Expected Result:**
- Electron window opens
- Dark-themed interface displays
- Placeholder dashboard shows with navigation
- No console errors related to missing modules

---

## Success Criteria

- [ ] `npm install` completes without errors
- [ ] `npm run dev` launches an Electron window
- [ ] React app renders in the window
- [ ] Tailwind CSS styles are applied (dark theme visible)
- [ ] No TypeScript compilation errors
- [ ] Placeholder navigation sidebar displays
- [ ] Metric cards display with styling
- [ ] `window.electronAPI.platform` returns 'darwin'
- [ ] Hot reload works (edit App.tsx and see changes)

---

## Handoff to Next Phase

### Completed in This Phase
- Electron + React + TypeScript project structure
- Vite build configuration
- Tailwind CSS with custom theme
- Basic IPC bridge structure (placeholder handlers)
- macOS window configuration

### Files Ready for Phase 2
- `src/main/index.ts` - Add database initialization
- `src/main/preload.ts` - IPC handlers defined (need implementations)

### State of the App
- Window opens with placeholder content
- No database connection yet
- IPC handlers defined but not implemented
- Ready to add SQLite database layer

### Next Phase Prerequisites Met
- Node.js Electron environment working
- Native module build system configured
- File structure ready for database code

---

**Next Document:** `02_PHASE_DATABASE_LAYER.md`
