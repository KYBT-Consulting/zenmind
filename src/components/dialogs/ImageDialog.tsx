import React, { useState, useRef, useEffect } from 'react';
import {
  Image as ImageIcon,
  Upload,
  Link as LinkIcon,
  X,
  Trash2,
  Check,
} from 'lucide-react';
import { MindMapEngine } from '../../engine/MindMapEngine';
import { ActiveNodeInfo } from '../../types/mindmap';

interface ImageDialogProps {
  isOpen: boolean;
  engine: MindMapEngine | null;
  activeNode: ActiveNodeInfo | null;
  onClose: () => void;
}

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export const ImageDialog: React.FC<ImageDialogProps> = ({
  isOpen,
  engine,
  activeNode,
  onClose,
}) => {
  const [tab, setTab] = useState<'upload' | 'url'>('upload');
  const [imageUrl, setImageUrl] = useState<string>(activeNode?.image?.url || '');
  const [imageTitle, setImageTitle] = useState<string>(activeNode?.image?.title || '');
  const [width, setWidth] = useState<number>(activeNode?.image?.width || 180);
  const [height, setHeight] = useState<number>(activeNode?.image?.height || 120);
  const [previewError, setPreviewError] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // The dialog stays mounted while closed, so re-sync from the selected topic each time it opens
  useEffect(() => {
    if (!isOpen) return;
    setTab('upload');
    setImageUrl(activeNode?.image?.url || '');
    setImageTitle(activeNode?.image?.title || '');
    setWidth(activeNode?.image?.width || 180);
    setHeight(activeNode?.image?.height || 120);
    setPreviewError(false);
    setUploadError('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, activeNode?.uid]);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setUploadError('Please choose an image file.');
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setUploadError('Image is larger than 5MB. Please choose a smaller one.');
      return;
    }
    setUploadError('');

    const reader = new FileReader();
    reader.onerror = () => setUploadError('Could not read the selected file.');
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setImageUrl(result);
        setPreviewError(false);
        // Measure natural dimensions
        const img = new Image();
        img.onload = () => {
          const aspect = img.width / img.height;
          const initialW = Math.min(240, img.width);
          setWidth(Math.round(initialW));
          setHeight(Math.round(initialW / aspect));
        };
        img.src = result;
      }
    };
    reader.readAsDataURL(file);
  };

  const handleApply = () => {
    if (!engine || !imageUrl) return;
    engine.setNodeImage({
      url: imageUrl,
      title: imageTitle.trim(),
      width: Number(width) || 180,
      height: Number(height) || 120,
    });
    onClose();
  };

  const handleRemove = () => {
    if (!engine) return;
    engine.setNodeImage(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 select-none">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-xs">
              <ImageIcon size={16} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">Topic Image Attachment</h3>
              <p className="text-[11px] text-slate-400">Attach and resize an image on this topic</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Source Tabs */}
          <div className="flex rounded-lg bg-slate-100 p-1 text-xs font-semibold">
            <button
              onClick={() => setTab('upload')}
              className={`flex-1 py-1.5 rounded-md flex items-center justify-center gap-1.5 transition-all ${
                tab === 'upload' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Upload size={13} />
              Upload Local File
            </button>
            <button
              onClick={() => setTab('url')}
              className={`flex-1 py-1.5 rounded-md flex items-center justify-center gap-1.5 transition-all ${
                tab === 'url' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LinkIcon size={13} />
              Image URL
            </button>
          </div>

          {tab === 'upload' ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-200 hover:border-indigo-400 bg-slate-50 hover:bg-indigo-50/30 rounded-xl p-6 text-center cursor-pointer transition-colors"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <Upload size={24} className="mx-auto text-slate-400 mb-2" />
              <p className="text-xs font-semibold text-slate-700">Click to select image file</p>
              <p className="text-[10px] text-slate-400 mt-1">PNG, JPG, SVG, WebP, or GIF (max 5MB)</p>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Image Web URL</label>
              <input
                type="text"
                value={imageUrl}
                onChange={(e) => {
                  setImageUrl(e.target.value);
                  setPreviewError(false);
                }}
                placeholder="https://example.com/diagram.png"
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          )}

          {uploadError && <div className="text-xs text-rose-500 font-medium">{uploadError}</div>}

          {/* Preview Box */}
          {imageUrl && (
            <div className="space-y-3">
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Preview</div>
              <div className="relative border border-slate-200 rounded-xl bg-slate-50 p-2 flex items-center justify-center min-h-[120px] max-h-[180px] overflow-hidden">
                {previewError ? (
                  <div className="text-xs text-rose-500 font-medium">Failed to load image preview</div>
                ) : (
                  <img
                    src={imageUrl}
                    alt="Preview"
                    onError={() => setPreviewError(true)}
                    className="max-h-[160px] object-contain rounded-md shadow-xs"
                    style={{ width: `${Math.min(width, 220)}px` }}
                  />
                )}
              </div>

              {/* Dimensions & Caption */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-500 mb-1">Width (px)</label>
                  <input
                    type="number"
                    value={width}
                    onChange={(e) => setWidth(Math.max(20, parseInt(e.target.value) || 20))}
                    className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-500 mb-1">Height (px)</label>
                  <input
                    type="number"
                    value={height}
                    onChange={(e) => setHeight(Math.max(20, parseInt(e.target.value) || 20))}
                    className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-500 mb-1">Optional Caption / Title</label>
                <input
                  type="text"
                  value={imageTitle}
                  onChange={(e) => setImageTitle(e.target.value)}
                  placeholder="Image label or title"
                  className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          {activeNode?.image ? (
            <button
              onClick={handleRemove}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 px-3 py-1.5 rounded-lg hover:bg-rose-50 transition-colors"
            >
              <Trash2 size={13} />
              Remove Image
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              disabled={!imageUrl || previewError}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 rounded-lg shadow-sm transition-all"
            >
              <Check size={14} />
              Attach Image
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
