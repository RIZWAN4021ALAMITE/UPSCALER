export enum ProcessingStatus {
  IDLE = 'IDLE',
  ANALYZING = 'ANALYZING',
  QUEUED = 'QUEUED',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR'
}

export enum UpscaleFactor {
  NONE = 1,
  X2 = 2,
  X3 = 3,
  X4 = 4,
  X6 = 6,
  X8 = 8,
  X10 = 10
}

export enum DpiOutput {
  DPI_300 = 300,
  DPI_600 = 600,
  DPI_1200 = 1200
}

export interface ImageFile {
  id: string;
  file: File;
  previewUrl: string;
  processedUrl?: string;
  originalName: string;
  status: ProcessingStatus;
  settings: ImageSettings;
  analysis?: string; // Gemini analysis result
  error?: string;
  width: number;
  height: number;
}

export interface ImageSettings {
  upscaleFactor: UpscaleFactor;
  dpi: DpiOutput;
  preserveStyle: boolean;
  enabled: boolean;
}

export interface AppState {
  files: ImageFile[];
  globalSettings: ImageSettings;
}