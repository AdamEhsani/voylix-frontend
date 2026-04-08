import { useState } from 'react';
import { 
  Moon, 
  Sun, 
  Bell, 
  Lock, 
  Shield, 
  Globe,
  ChevronRight,
  Monitor
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { cn } from '../utils';

export function SettingsPage() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Einstellungen</h1>
        <p className="text-zinc-500 dark:text-zinc-400">Verwalten Sie Ihre persönlichen Präferenzen und Kontoeinstellungen.</p>
      </div>

      <div className="max-w-3xl space-y-6">
        {/* Appearance */}
        <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-zinc-100 dark:border-zinc-800">
            <h3 className="font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <Monitor size={20} className="text-zinc-400" /> Erscheinungsbild
            </h3>
          </div>
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-zinc-900 dark:text-white">Dunkelmodus</p>
                <p className="text-xs text-zinc-500">Wechseln Sie zwischen hellem und dunklem Design.</p>
              </div>
              <button 
                onClick={toggleTheme}
                className={cn(
                  "relative inline-flex h-6 w-11 items-center rounded-full transition-colors outline-none",
                  theme === 'dark' ? "bg-emerald-600" : "bg-zinc-200 dark:bg-zinc-700"
                )}
              >
                <span className={cn(
                  "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                  theme === 'dark' ? "translate-x-6" : "translate-x-1"
                )} />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-zinc-900 dark:text-white">Sprache</p>
                <p className="text-xs text-zinc-500">Die Systemsprache ist derzeit auf Deutsch festgelegt.</p>
              </div>
              <div className="flex items-center gap-2 text-sm font-medium text-zinc-500">
                <Globe size={16} /> Deutsch
              </div>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-zinc-100 dark:border-zinc-800">
            <h3 className="font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <Bell size={20} className="text-zinc-400" /> Benachrichtigungen
            </h3>
          </div>
          <div className="p-6 space-y-4">
            {[
              { label: 'E-Mail Benachrichtigungen', desc: 'Erhalten Sie Updates zu Ihren Extraktionen per E-Mail.' },
              { label: 'Token-Warnungen', desc: 'Benachrichtigung wenn Ihr Token-Guthaben niedrig ist.' },
              { label: 'Sicherheits-Updates', desc: 'Wichtige Informationen zu Ihrem Konto.' }
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-bold text-zinc-900 dark:text-white">{item.label}</p>
                  <p className="text-xs text-zinc-500">{item.desc}</p>
                </div>
                <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-emerald-600 outline-none">
                  <span className="inline-block h-4 w-4 transform translate-x-6 rounded-full bg-white" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Security */}
        <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-zinc-100 dark:border-zinc-800">
            <h3 className="font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <Shield size={20} className="text-zinc-400" /> Sicherheit
            </h3>
          </div>
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
            <button className="w-full p-6 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-zinc-500">
                  <Lock size={20} />
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold text-zinc-900 dark:text-white">Passwort ändern</p>
                  <p className="text-xs text-zinc-500">Aktualisieren Sie Ihr Passwort regelmäßig.</p>
                </div>
              </div>
              <ChevronRight size={20} className="text-zinc-400" />
            </button>
            <button className="w-full p-6 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-zinc-500">
                  <Shield size={20} />
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold text-zinc-900 dark:text-white">Zwei-Faktor-Authentifizierung</p>
                  <p className="text-xs text-zinc-500">Zusätzliche Sicherheitsebene für Ihr Konto.</p>
                </div>
              </div>
              <span className="text-xs font-bold text-orange-600 bg-orange-50 dark:bg-orange-900/20 px-2 py-1 rounded-lg">Nicht aktiv</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
