import React from 'react';
import { 
  Upload, 
  X, 
  Settings, 
  Check, 
  Image as ImageIcon, 
  Zap, 
  Download, 
  Trash2, 
  Maximize, 
  Layers, 
  Wand2,
  AlertCircle
} from 'lucide-react';

export const ICONS = {
  Upload: <Upload size={24} />,
  Close: <X size={20} />,
  Settings: <Settings size={20} />,
  Check: <Check size={20} />,
  Image: <ImageIcon size={24} />,
  Zap: <Zap size={16} />,
  Download: <Download size={20} />,
  Trash: <Trash2 size={20} />,
  Maximize: <Maximize size={16} />,
  Layers: <Layers size={16} />,
  Magic: <Wand2 size={16} />,
  Alert: <AlertCircle size={20} />
};

export const MAX_FILES = 50;
export const ACCENT_COLOR = "text-blue-500";
export const BG_ACCENT = "bg-blue-600";