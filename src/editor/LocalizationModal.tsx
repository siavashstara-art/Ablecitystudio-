/**
 * AbleStudio - Localization & String Resources Inspector
 * Direct UI for Android strings.xml dictionary, live RTL verification,
 * and multi-language preview comparisons.
 */

import React, { useState } from 'react';
import { DesignProject } from '../data/model/DesignProject';
import {
  SUPPORTED_LOCALES,
  STRING_RESOURCES,
  LocaleCode,
  resolveContent,
} from '../core/localization/LocalizationEngine';
import { Languages, X, Globe, Check, AlignRight, AlignLeft } from 'lucide-react';

interface LocalizationModalProps {
  project: DesignProject;
  activeLocale: LocaleCode;
  isOpen: boolean;
  onClose: () => void;
  onSelectLocale: (locale: LocaleCode) => void;
}

export const LocalizationModal: React.FC<LocalizationModalProps> = ({
  project,
  activeLocale,
  isOpen,
  onClose,
  onSelectLocale,
}) => {
  const [activeTab, setActiveTab] = useState<'preview' | 'dictionary'>('preview');

  if (!isOpen) return null;

  // Extract all string keys referenced in this project
  const boundKeys = project.layers
    .map((l) => (l.type === 'text' ? l.stringKey : l.type === 'badge' ? l.stringKey : undefined))
    .filter(Boolean) as string[];

  const uniqueKeys = Array.from(new Set(boundKeys));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-4xl max-h-[85vh] flex flex-col bg-stone-900 border border-stone-800 rounded-xl shadow-2xl overflow-hidden text-stone-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-800 bg-stone-900/90">
          <div className="flex items-center gap-2.5">
            <Globe className="text-amber-500" size={22} />
            <div>
              <h2 className="text-base font-semibold font-display">Localization & Strings Resource Suite</h2>
              <p className="text-xs text-stone-400">Android res/values/strings.xml & RTL Engine</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-white rounded-lg hover:bg-stone-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-stone-800 bg-stone-950/40">
          <button
            onClick={() => setActiveTab('preview')}
            className={`pb-2.5 text-xs font-medium border-b-2 transition-colors ${
              activeTab === 'preview'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            Multi-Language Live Previews
          </button>
          <button
            onClick={() => setActiveTab('dictionary')}
            className={`pb-2.5 text-xs font-medium border-b-2 transition-colors ${
              activeTab === 'dictionary'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            String Keys Dictionary ({uniqueKeys.length} Bound)
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'preview' ? (
            <div className="space-y-6">
              <div className="text-xs text-stone-400">
                Click any language below to set it as the active editing locale. Arabic automatically activates RTL layout alignment.
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {SUPPORTED_LOCALES.map((locale) => {
                  const isCurrent = locale.code === activeLocale;
                  return (
                    <div
                      key={locale.code}
                      onClick={() => onSelectLocale(locale.code)}
                      className={`cursor-pointer p-4 rounded-xl border transition-all ${
                        isCurrent
                          ? 'bg-amber-500/10 border-amber-500 shadow-md ring-1 ring-amber-500/40'
                          : 'bg-stone-950/60 border-stone-800 hover:border-stone-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{locale.flag}</span>
                          <div>
                            <div className="text-sm font-semibold text-stone-200">{locale.nativeName}</div>
                            <div className="text-[11px] text-stone-400">
                              {locale.name} ({locale.code.toUpperCase()})
                            </div>
                          </div>
                        </div>

                        {locale.direction === 'rtl' ? (
                          <span className="flex items-center gap-1 text-[10px] font-mono-data px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                            <AlignRight size={10} /> RTL
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-[10px] font-mono-data px-1.5 py-0.5 rounded bg-stone-800 text-stone-400">
                            <AlignLeft size={10} /> LTR
                          </span>
                        )}
                      </div>

                      {/* Mini Preview Box */}
                      <div
                        className="p-3 rounded-lg bg-stone-900 border border-stone-800 space-y-1.5 text-xs select-none"
                        dir={locale.direction}
                      >
                        <div className="font-semibold text-stone-100 line-clamp-1">
                          {resolveContent('@string/template.event_title', locale.code) || 'Main Headline Title'}
                        </div>
                        <div className="text-[11px] text-stone-400 line-clamp-2">
                          {resolveContent('@string/template.event_subtitle', locale.code) || 'Accessible design layout'}
                        </div>
                      </div>

                      <div className="mt-3 flex items-center justify-between text-xs">
                        {isCurrent ? (
                          <span className="flex items-center gap-1 text-amber-400 font-medium">
                            <Check size={14} /> Active
                          </span>
                        ) : (
                          <span className="text-stone-400 hover:text-white">Switch to this</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-xs text-stone-400">
                Translations mapped to Android <code className="text-amber-400 font-mono-data">@string/key</code> format. Any text layer bound to these keys translates across all supported locales.
              </div>

              <div className="border border-stone-800 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-stone-950 text-stone-400 uppercase font-mono-data text-[10px] border-b border-stone-800">
                    <tr>
                      <th className="p-3">Resource Key</th>
                      <th className="p-3">English (Default)</th>
                      <th className="p-3">Spanish</th>
                      <th className="p-3">Japanese</th>
                      <th className="p-3">Arabic (RTL)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-800 bg-stone-900/40">
                    {uniqueKeys.length > 0 ? (
                      uniqueKeys.map((rawKey) => {
                        const key = rawKey.replace('@string/', '');
                        return (
                          <tr key={rawKey} className="hover:bg-stone-800/40 transition-colors">
                            <td className="p-3 font-mono-data text-amber-400 font-medium whitespace-nowrap">
                              @{key}
                            </td>
                            <td className="p-3 text-stone-200">{STRING_RESOURCES.en[key] || '—'}</td>
                            <td className="p-3 text-stone-300">{STRING_RESOURCES.es[key] || '—'}</td>
                            <td className="p-3 text-stone-300">{STRING_RESOURCES.ja[key] || '—'}</td>
                            <td className="p-3 text-stone-300 font-arabic" dir="rtl">
                              {STRING_RESOURCES.ar[key] || '—'}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={5} className="p-6 text-center text-stone-400">
                          No text layers in this design are currently bound to @string/ keys. You can bind any layer in the Layer Inspector panel.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
