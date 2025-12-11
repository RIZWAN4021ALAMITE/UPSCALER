import React, { useState } from 'react';
import { ImageFile, ProcessingStatus } from '../types';
import { ICONS } from '../constants';
import { analyzeImage } from '../services/geminiService';

interface ImageCardProps {
  image: ImageFile;
  onRemove: (id: string) => void;
  onUpdateSettings: (id: string, settings: any) => void;
  onAnalyze: (id: string, result: string) => void;
}

export const ImageCard: React.FC<ImageCardProps> = ({ image, onRemove, onUpdateSettings, onAnalyze }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleMagicAnalyze = async () => {
    setIsAnalyzing(true);
    const result = await analyzeImage(image.file);
    onAnalyze(image.id, result);
    setIsAnalyzing(false);
  };

  const isProcessing = image.status === ProcessingStatus.PROCESSING;
  const isComplete = image.status === ProcessingStatus.COMPLETED;

  // Helper to ensure correct extension
  const getDownloadFilename = () => {
    const nameWithoutExt = image.originalName.replace(/\.[^/.]+$/, "");
    return `${nameWithoutExt}_UPSCALED.png`;
  };

  return (
    <div className="group relative bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-md">
      <div className="flex p-3 gap-4 items-center">
        {/* Thumbnail with transparency grid */}
        <div className="relative w-20 h-20 md:w-24 md:h-24 flex-shrink-0 bg-slate-950 rounded-xl overflow-hidden border border-slate-800">
           {/* Modern transparency grid */}
           <div className="absolute inset-0" 
                style={{
                  backgroundImage: 'conic-gradient(#1e293b 90deg, #0f172a 90deg 180deg, #1e293b 180deg 270deg, #0f172a 270deg)', 
                  backgroundSize: '16px 16px',
                  opacity: 0.5
                }} 
           />
           <img 
            src={isComplete && image.processedUrl ? image.processedUrl : image.previewUrl} 
            alt="Preview" 
            className="absolute inset-0 w-full h-full object-contain z-10 p-1" 
           />
           
           {isProcessing && (
             <div className="absolute inset-0 z-20 bg-slate-950/70 flex items-center justify-center">
               <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
             </div>
           )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 flex flex-col justify-center h-full py-1">
          <div className="flex justify-between items-start">
            <div className="pr-8">
              <h3 className="text-sm font-semibold text-slate-200 truncate leading-tight mb-1">
                {image.originalName}
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                {Math.round(image.file.size / 1024)}KB • {image.width} × {image.height}
              </p>
            </div>
            
            {/* Huge touch target for close button */}
            <button 
              onClick={() => onRemove(image.id)}
              className="absolute top-0 right-0 p-4 text-slate-500 hover:text-red-400 active:text-red-500 transition-colors"
              disabled={isProcessing}
            >
              <div className="bg-slate-800/50 rounded-full p-1">{ICONS.Close}</div>
            </button>
          </div>

          {/* Status / Action Area */}
          <div className="mt-2.5">
             {image.analysis ? (
               <div className="text-[11px] leading-tight text-emerald-400 bg-emerald-950/40 px-2.5 py-1.5 rounded-lg border border-emerald-900/50 inline-flex items-center gap-1.5">
                 {ICONS.Zap} <span>{image.analysis.substring(0, 50)}{image.analysis.length > 50 ? '...' : ''}</span>
               </div>
             ) : (
                <div className="flex flex-wrap gap-2">
                   {!isComplete && !isProcessing && (
                    <button 
                        onClick={handleMagicAnalyze}
                        disabled={isAnalyzing}
                        className={`h-8 px-3 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all border ${isAnalyzing ? 'bg-slate-800 text-slate-500 border-slate-700' : 'bg-slate-800 text-blue-400 border-slate-700 active:bg-slate-700'}`}
                    >
                        {isAnalyzing ? <span className="animate-pulse">Analyzing...</span> : <>{ICONS.Magic} Check Quality</>}
                    </button>
                   )}
                   {isComplete && (
                     <div className="h-8 px-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                       {ICONS.Check} Processed
                     </div>
                   )}
                </div>
             )}
          </div>
        </div>
      </div>

      {/* Footer controls - Mobile Optimized */}
      <div className="bg-slate-950/30 px-3 py-2.5 border-t border-slate-800 flex items-center justify-between text-xs">
         <div className="flex items-center gap-3 text-slate-400 font-medium">
             <div className="flex items-center gap-1.5 bg-slate-800 rounded px-2 py-0.5">
               {ICONS.Maximize} {image.settings.upscaleFactor}x
             </div>
             {image.settings.dpi && <div className="hidden xs:block">{image.settings.dpi} DPI</div>}
         </div>
         {isComplete && (
           <a 
             href={image.processedUrl} 
             download={getDownloadFilename()}
             className="text-blue-400 active:text-blue-300 font-bold flex items-center gap-1.5 px-2 py-1 -mr-1"
           >
             {ICONS.Download} SAVE
           </a>
         )}
      </div>
    </div>
  );
};