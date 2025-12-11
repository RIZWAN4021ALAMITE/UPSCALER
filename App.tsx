import React, { useState, useCallback, useRef } from 'react';
import JSZip from 'jszip';
import { 
  AppState, 
  ImageFile, 
  ProcessingStatus, 
  UpscaleFactor, 
  DpiOutput,
  ImageSettings 
} from './types';
import { SettingsPanel } from './components/SettingsPanel';
import { ImageCard } from './components/ImageCard';
import { processImage } from './services/imageProcessor';
import { ICONS, MAX_FILES } from './constants';

const DEFAULT_SETTINGS: ImageSettings = {
  upscaleFactor: UpscaleFactor.X4,
  dpi: DpiOutput.DPI_300,
  preserveStyle: true,
  enabled: true
};

const App: React.FC = () => {
  const [files, setFiles] = useState<ImageFile[]>([]);
  const [globalSettings, setGlobalSettings] = useState<ImageSettings>(DEFAULT_SETTINGS);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessingBatch, setIsProcessingBatch] = useState(false);
  const [isZipping, setIsZipping] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Handlers ---

  const handleFiles = useCallback((newFiles: FileList | null) => {
    if (!newFiles) return;
    
    const validFiles = Array.from(newFiles).filter(file => file.type.startsWith('image/'));
    
    if (files.length + validFiles.length > MAX_FILES) {
      alert(`Maximum ${MAX_FILES} images allowed in a batch.`);
      return;
    }

    const processedFiles: ImageFile[] = validFiles.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      originalName: file.name,
      previewUrl: URL.createObjectURL(file),
      status: ProcessingStatus.IDLE,
      settings: { ...globalSettings },
      width: 0,
      height: 0
    }));

    // Update dimensions async
    processedFiles.forEach(pf => {
      const img = new Image();
      img.onload = () => {
        setFiles(prev => prev.map(f => f.id === pf.id ? { ...f, width: img.width, height: img.height } : f));
      };
      img.src = pf.previewUrl;
    });

    setFiles(prev => [...prev, ...processedFiles]);
  }, [files, globalSettings]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const updateGlobalSettings = (newSettings: Partial<ImageSettings>) => {
    setGlobalSettings(prev => {
      const updated = { ...prev, ...newSettings };
      // Also update all IDLE files
      setFiles(files => files.map(f => 
        f.status === ProcessingStatus.IDLE 
          ? { ...f, settings: { ...f.settings, ...newSettings } } 
          : f
      ));
      return updated;
    });
  };

  const updateFileSettings = (id: string, newSettings: Partial<ImageSettings>) => {
    setFiles(prev => prev.map(f => f.id === id ? { ...f, settings: { ...f.settings, ...newSettings } } : f));
  };

  const updateFileAnalysis = (id: string, analysis: string) => {
    setFiles(prev => prev.map(f => f.id === id ? { ...f, analysis } : f));
  };

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const processBatch = async () => {
    setIsProcessingBatch(true);
    
    // Process strictly sequentially or parallel limited (let's do sequential for demo clarity/CPU)
    const filesToProcess = files.filter(f => f.status === ProcessingStatus.IDLE || f.status === ProcessingStatus.ERROR);
    
    for (const file of filesToProcess) {
      // Set status to processing
      setFiles(prev => prev.map(f => f.id === file.id ? { ...f, status: ProcessingStatus.PROCESSING } : f));
      
      try {
        const resultUrl = await processImage(file, (progress) => {
          // Could update progress state here if we had a progress bar per card
        });
        
        setFiles(prev => prev.map(f => f.id === file.id ? { 
          ...f, 
          status: ProcessingStatus.COMPLETED, 
          processedUrl: resultUrl 
        } : f));

      } catch (error) {
        setFiles(prev => prev.map(f => f.id === file.id ? { 
          ...f, 
          status: ProcessingStatus.ERROR, 
          error: "Processing failed" 
        } : f));
      }
    }

    setIsProcessingBatch(false);
  };

  const downloadAllZip = async () => {
    const completedFiles = files.filter(f => f.status === ProcessingStatus.COMPLETED && f.processedUrl);
    if (completedFiles.length === 0) return;

    setIsZipping(true);
    try {
      const zip = new JSZip();
      
      // Add files to zip
      for (const file of completedFiles) {
        if (file.processedUrl) {
           const blob = await fetch(file.processedUrl).then(r => r.blob());
           const nameWithoutExt = file.originalName.replace(/\.[^/.]+$/, "");
           zip.file(`${nameWithoutExt}_UPSCALED.png`, blob);
        }
      }

      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `UltraArt_Batch_${new Date().toISOString().slice(0,10)}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
    } catch (e) {
      console.error("Zip failed", e);
      alert("Failed to create ZIP file.");
    } finally {
      setIsZipping(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 pb-40 select-none">
      {/* Mobile-optimized Header */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-50 pt-[env(safe-area-inset-top)]">
        <div className="max-w-7xl mx-auto px-4 h-14 md:h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 md:w-9 md:h-9 bg-gradient-to-tr from-blue-600 to-emerald-400 rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-blue-900/20">
              U
            </div>
            <h1 className="text-lg md:text-xl font-bold tracking-tight text-white leading-none">
              UltraArt<span className="text-blue-500">Pro</span>
            </h1>
          </div>
          <div className="flex gap-2 items-center">
             <span className="hidden md:flex text-xs font-medium px-2 py-1 bg-purple-900/30 text-purple-400 border border-purple-800/50 rounded-full items-center gap-1">
               {ICONS.Layers} Batch
             </span>
             <button className="text-slate-400 p-2 hover:bg-slate-800 rounded-full transition-colors active:scale-95">
               <span className="sr-only">Help</span>
               <div className="w-5 h-5 flex items-center justify-center border border-current rounded-full text-xs font-bold">?</div>
             </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-3 md:px-6 py-4 md:py-8">
        
        {/* Global Controls & Drop Zone Container */}
        <div className="space-y-6">
          
          {/* Hero / Empty State - Mobile First */}
          {files.length === 0 ? (
             <div 
               className={`border border-dashed rounded-2xl p-6 md:p-12 text-center transition-all duration-300 flex flex-col items-center justify-center min-h-[60vh] md:min-h-[400px] ${
                 isDragging 
                 ? 'border-blue-500 bg-blue-500/10' 
                 : 'border-slate-800 bg-slate-900/30'
               }`}
               onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
               onDragLeave={() => setIsDragging(false)}
               onDrop={handleDrop}
             >
               <div className="w-20 h-20 bg-slate-800/80 rounded-2xl flex items-center justify-center mb-6 text-blue-500 shadow-xl border border-slate-700">
                 <div className="scale-150">{ICONS.Upload}</div>
               </div>
               <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">Upload Artwork</h2>
               <p className="text-slate-400 text-sm md:text-base max-w-xs md:max-w-md mx-auto mb-8 leading-relaxed">
                 High-precision upscaling for artists. <br />
                 <span className="text-emerald-400 font-medium">Transparency safe.</span>
               </p>
               
               <button 
                 onClick={() => fileInputRef.current?.click()}
                 className="w-full max-w-xs bg-blue-600 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-lg shadow-blue-600/20 active:scale-95 transition-transform flex items-center justify-center gap-2"
               >
                 {ICONS.Image} Select Images
               </button>
               <p className="text-slate-600 text-xs mt-4">Supports PNG, JPG, WEBP</p>
             </div>
          ) : (
            <>
               {/* Global Settings Bar - Compact for Mobile */}
               <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 shadow-xl">
                 <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-800/50">
                   <h2 className="text-base font-semibold text-white flex items-center gap-2">
                     {ICONS.Settings} Batch Settings
                   </h2>
                   <button 
                     className="text-xs font-medium text-red-400 bg-red-400/10 px-3 py-1.5 rounded-full active:bg-red-400/20"
                     onClick={() => {
                        if(confirm('Clear all images?')) setFiles([]);
                     }}
                   >
                     Clear All
                   </button>
                 </div>
                 <SettingsPanel 
                   settings={globalSettings} 
                   onUpdate={updateGlobalSettings} 
                   isGlobal={true} 
                 />
               </div>

               {/* Add More Button */}
               <button 
                 className="w-full border border-dashed border-slate-700 bg-slate-900/30 rounded-xl p-4 flex items-center justify-center gap-2 active:bg-slate-800 transition-colors group"
                 onClick={() => fileInputRef.current?.click()}
               >
                 <span className="text-slate-400 group-hover:text-blue-400 text-sm font-semibold transition-colors flex items-center gap-2">
                   {ICONS.Upload} Add Images ({files.length}/{MAX_FILES})
                 </span>
               </button>
            </>
          )}

          {/* Grid - 1 Col on Mobile, Multi on Desktop */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 pb-20">
            {files.map((file) => (
              <ImageCard 
                key={file.id} 
                image={file} 
                onRemove={removeFile}
                onUpdateSettings={updateFileSettings}
                onAnalyze={updateFileAnalysis}
              />
            ))}
          </div>
        </div>
      </main>

      {/* Sticky Action Bar - Safe Area Aware */}
      <div 
        className={`fixed bottom-0 left-0 right-0 border-t border-slate-800 bg-slate-950/90 backdrop-blur-xl transform transition-transform duration-300 z-40 pb-[env(safe-area-inset-bottom)] ${files.length > 0 ? 'translate-y-0' : 'translate-y-full'}`}
      >
        <div className="max-w-7xl mx-auto p-4 flex flex-col md:flex-row items-center justify-between gap-3">
          
          <div className="hidden md:block text-sm text-slate-400 font-medium">
            <span className="text-slate-200">{files.length}</span> images ready
          </div>
          
          <div className="grid grid-cols-2 md:flex gap-3 w-full md:w-auto">
            {/* Download ZIP Button */}
            {files.some(f => f.status === ProcessingStatus.COMPLETED) && (
               <button 
                 onClick={downloadAllZip}
                 disabled={isZipping}
                 className="col-span-1 md:w-auto flex items-center justify-center gap-2 bg-slate-800 text-white px-4 py-3.5 rounded-xl font-bold text-sm border border-slate-700 active:scale-95 transition-transform"
               >
                 {isZipping ? (
                   <span className="animate-pulse">Zipping...</span>
                 ) : (
                   <>{ICONS.Download} Save ZIP</>
                 )}
               </button>
            )}

            <button 
              onClick={processBatch}
              disabled={isProcessingBatch || files.every(f => f.status === ProcessingStatus.COMPLETED)}
              className={`
                ${files.some(f => f.status === ProcessingStatus.COMPLETED) ? 'col-span-1' : 'col-span-2'}
                md:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white px-6 py-3.5 rounded-xl font-bold text-sm shadow-lg shadow-blue-900/30 active:scale-95 transition-transform disabled:opacity-50 disabled:cursor-not-allowed
              `}
            >
              {isProcessingBatch ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Processing...
                </>
              ) : (
                <>
                  {ICONS.Zap} Upscale All
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <input 
        type="file" 
        multiple 
        ref={fileInputRef} 
        onChange={(e) => handleFiles(e.target.files)} 
        className="hidden" 
        accept="image/png, image/jpeg, image/webp"
      />
    </div>
  );
};

export default App;