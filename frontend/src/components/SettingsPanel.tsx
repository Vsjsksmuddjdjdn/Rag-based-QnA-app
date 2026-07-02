import { Gauge, ListFilter, SlidersHorizontal, Thermometer } from "lucide-react";
import type { ChatSettings } from "../types";

interface SettingsPanelProps {
  settings: ChatSettings;
  onChange: (settings: ChatSettings) => void;
}

export function SettingsPanel({ settings, onChange }: SettingsPanelProps) {
  return (
    <section className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-4 flex items-center gap-2">
        <SlidersHorizontal className="h-4 w-4 text-teal-600 dark:text-teal-300" />
        <h2 className="text-sm font-bold text-zinc-950 dark:text-white">Settings</h2>
      </div>

      <div className="space-y-4">
        <label className="block">
          <span className="mb-1 flex items-center gap-2 text-xs font-semibold text-zinc-600 dark:text-zinc-300">
            <Gauge className="h-3.5 w-3.5" />
            Model
          </span>
          <input
            value={settings.model}
            onChange={(event) => onChange({ ...settings, model: event.target.value })}
            className="field"
          />
        </label>

        <label className="block">
          <span className="mb-1 flex items-center gap-2 text-xs font-semibold text-zinc-600 dark:text-zinc-300">
            <Thermometer className="h-3.5 w-3.5" />
            Temperature {settings.temperature.toFixed(1)}
          </span>
          <input
            type="range"
            min="0"
            max="1.5"
            step="0.1"
            value={settings.temperature}
            onChange={(event) => onChange({ ...settings, temperature: Number(event.target.value) })}
            className="w-full accent-teal-600"
          />
        </label>

        <label className="block">
          <span className="mb-1 flex items-center gap-2 text-xs font-semibold text-zinc-600 dark:text-zinc-300">
            <ListFilter className="h-3.5 w-3.5" />
            Top K {settings.topK}
          </span>
          <input
            type="range"
            min="1"
            max="12"
            step="1"
            value={settings.topK}
            onChange={(event) => onChange({ ...settings, topK: Number(event.target.value) })}
            className="w-full accent-teal-600"
          />
        </label>

        <div>
          <span className="mb-2 block text-xs font-semibold text-zinc-600 dark:text-zinc-300">
            Retrieval mode
          </span>
          <div className="grid grid-cols-2 rounded-lg bg-zinc-100 p-1 dark:bg-zinc-800">
            {(["similarity", "mmr"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => onChange({ ...settings, retrievalMode: mode })}
                className={
                  settings.retrievalMode === mode
                    ? "rounded-md bg-white px-3 py-2 text-xs font-semibold text-zinc-950 shadow-sm dark:bg-zinc-950 dark:text-white"
                    : "rounded-md px-3 py-2 text-xs font-semibold text-zinc-500 dark:text-zinc-400"
                }
              >
                {mode.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <label className="flex items-center justify-between rounded-lg border border-zinc-200 p-3 text-sm dark:border-zinc-800">
          <span className="font-medium text-zinc-700 dark:text-zinc-200">Show context</span>
          <input
            type="checkbox"
            checked={settings.showContext}
            onChange={(event) => onChange({ ...settings, showContext: event.target.checked })}
            className="h-4 w-4 accent-teal-600"
          />
        </label>

        <label className="flex items-center justify-between rounded-lg border border-zinc-200 p-3 text-sm dark:border-zinc-800">
          <span className="font-medium text-zinc-700 dark:text-zinc-200">Stream answers</span>
          <input
            type="checkbox"
            checked={settings.stream}
            onChange={(event) => onChange({ ...settings, stream: event.target.checked })}
            className="h-4 w-4 accent-teal-600"
          />
        </label>
      </div>
    </section>
  );
}
