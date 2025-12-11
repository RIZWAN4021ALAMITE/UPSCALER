import React from 'react';
import { UpscaleFactor, DpiOutput, ImageSettings } from '../types';

interface SettingsPanelProps {
  settings: ImageSettings;
  onUpdate: (newSettings: Partial<ImageSettings>) => void;
  isGlobal?: boolean;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ settings, onUpdate, isGlobal = false }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-4 text-sm">
      {/* Upscale Factor */}
      <div className="flex flex-col gap-2">
        <label className="text-slate-400 font-bold text-xs uppercase tracking-wider pl-1">
          Upscale Factor
        </label>
        <div className="grid grid-cols-4 gap-1 bg-slate-800/50 rounded-xl p-1.5 border border-slate-700">
          {[UpscaleFactor.NONE, UpscaleFactor.X2, UpscaleFactor.X4, UpscaleFactor.X8].map((factor) => (
            <button
              key={factor}
              onClick={() => onUpdate({ upscaleFactor: factor })}
              className={`h-10 md:h-9 flex items-center justify-center rounded-lg text-xs font-bold transition-all active:scale-95 ${
                settings.upscaleFactor === factor
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-900/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700'
              }`}
            >
              {factor === 1 ? 'Off' : `${factor}×`}
            </button>
          ))}
        </div>
      </div>

      {/* DPI Output */}
      <div className="flex flex-col gap-2">
        <label className="text-slate-400 font-bold text-xs uppercase tracking-wider pl-1">
          Target DPI
        </label>
        <div className="relative">
          <select
            value={settings.dpi}
            onChange={(e) => onUpdate({ dpi: Number(e.target.value) as DpiOutput })}
            className="w-full appearance-none bg-slate-800/50 border border-slate-700 rounded-xl px-4 h-12 md:h-[52px] text-white focus:ring-2 focus:ring-blue-500 outline-none font-medium text-sm"
          >
            {Object.values(DpiOutput)
              .filter(v => typeof v === 'number')
              .map((dpi) => (
              <option key={dpi} value={dpi}>{dpi} DPI (Print Quality)</option>
            ))}
          </select>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
          </div>
        </div>
      </div>
    </div>
  );
};