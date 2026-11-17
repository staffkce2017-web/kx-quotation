import React, { useState, useRef } from 'react';
import {
  X,
  Upload,
  RotateCcw,
  Check,
  Image as ImageIcon,
  Sparkles,
  AlertCircle,
  Loader2,
  Trash2,
} from 'lucide-react';
import { useAppLogo, KXLogoStyle, compressImageFile } from '../utils/logoManager';
import { KXMark, KXLogo } from './KXLogo';

interface LogoSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LogoSettingsModal: React.FC<LogoSettingsModalProps> = ({ isOpen, onClose }) => {
  const { logoUrl, logoStyle, updateLogo } = useAppLogo();
  const [selectedStyle, setSelectedStyle] = useState<KXLogoStyle>(logoStyle);
  const [customImage, setCustomImage] = useState<string | null>(logoUrl);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const [fileName, setFileName] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const processFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMessage('กรุณาเลือกไฟล์ที่เป็นรูปภาพ (PNG, JPG, SVG, WebP)');
      return;
    }

    setErrorMessage('');
    setIsProcessing(true);
    setFileName(file.name);

    try {
      // Compress and scale using canvas to prevent LocalStorage quota errors
      const compressedDataUrl = await compressImageFile(file, 800, 260);
      setCustomImage(compressedDataUrl);
      setSelectedStyle('custom_image');
    } catch (err: any) {
      console.error('Failed to process image:', err);
      setErrorMessage('เกิดข้อผิดพลาดในการอ่านไฟล์รูปภาพ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await processFile(file);
    }
    // Reset file input value so selecting the same file triggers again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      await processFile(file);
    }
  };

  const handleSave = () => {
    if (selectedStyle === 'custom_image') {
      if (customImage) {
        updateLogo(customImage, 'custom_image');
      } else {
        setErrorMessage('กรุณาเลือกไฟล์รูปภาพก่อนบันทึก หรือเลือกรูปแบบโลโก้ทางการ');
        return;
      }
    } else {
      updateLogo(null, selectedStyle);
    }
    onClose();
  };

  const handleResetToDefault = () => {
    setCustomImage(null);
    setFileName('');
    setSelectedStyle('orange_modern');
    updateLogo(null, 'orange_modern');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-neutral-200 animate-in zoom-in-95 duration-150 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between bg-neutral-50 shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-orange-100 text-orange-600 rounded-lg">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-neutral-900 text-base">
                ตั้งค่าและเปลี่ยนรูปโลโก้ (Brand Logo)
              </h3>
              <p className="text-xs text-neutral-500">
                เลือกรูปแบบโลโก้ KX หรืออัปโหลดไฟล์ภาพขององค์กร
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-700 p-1.5 rounded-lg hover:bg-neutral-200/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Live Preview Card */}
          <div className="bg-neutral-100/80 p-4 rounded-xl border border-neutral-200 text-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-2">
              ตัวอย่างการแสดงผลจริง (Preview)
            </span>
            <div className="flex items-center justify-center p-4 bg-white rounded-lg shadow-2xs border border-neutral-200/80 min-h-[80px]">
              {selectedStyle === 'custom_image' && customImage ? (
                <div className="flex items-center justify-center py-1">
                  <img
                    src={customImage}
                    alt="Custom Uploaded Logo"
                    className="max-h-14 max-w-[260px] object-contain"
                  />
                </div>
              ) : (
                <KXLogo size="md" textColor="dark" />
              )}
            </div>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Options */}
          <div className="space-y-3">
            <span className="text-xs font-bold text-neutral-700 block">
              เลือกรูปแบบโลโก้:
            </span>

            {/* Option 1: Official KX (<X) */}
            <label
              onClick={() => {
                setSelectedStyle('orange_modern');
                setErrorMessage('');
              }}
              className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-all ${
                selectedStyle === 'orange_modern'
                  ? 'border-neutral-900 bg-neutral-50/80 ring-2 ring-neutral-900 shadow-xs'
                  : 'border-neutral-200 hover:border-neutral-300 bg-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <KXMark size="sm" />
                <div>
                  <div className="text-xs font-bold text-neutral-900">
                    โลโก้ทางการ Knowledge Xchange (&lt;X)
                  </div>
                  <div className="text-[11px] text-neutral-500">
                    สัญลักษณ์ &lt;X และ KX • Innovation Ecosystem ตามมาตรฐานองค์กร
                  </div>
                </div>
              </div>
              {selectedStyle === 'orange_modern' && (
                <div className="w-5 h-5 rounded-full bg-neutral-900 text-white flex items-center justify-center">
                  <Check className="w-3 h-3" />
                </div>
              )}
            </label>

            {/* Option 2: Monochrome Minimalist */}
            <label
              onClick={() => {
                setSelectedStyle('monochrome_dark');
                setErrorMessage('');
              }}
              className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-all ${
                selectedStyle === 'monochrome_dark'
                  ? 'border-neutral-900 bg-neutral-50/80 ring-2 ring-neutral-900 shadow-xs'
                  : 'border-neutral-200 hover:border-neutral-300 bg-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <KXMark size="sm" textColor="dark" />
                <div>
                  <div className="text-xs font-bold text-neutral-900">
                    โลโก้ KX มินิมอล (Monochrome)
                  </div>
                  <div className="text-[11px] text-neutral-500">
                    โทนสีขาว-ดำ สุภาพ เรียบหรู
                  </div>
                </div>
              </div>
              {selectedStyle === 'monochrome_dark' && (
                <div className="w-5 h-5 rounded-full bg-neutral-900 text-white flex items-center justify-center">
                  <Check className="w-3 h-3" />
                </div>
              )}
            </label>

            {/* Option 3: Custom Upload */}
            <div
              className={`p-3.5 rounded-xl border transition-all ${
                selectedStyle === 'custom_image'
                  ? 'border-neutral-900 bg-neutral-50/80 ring-2 ring-neutral-900 shadow-xs'
                  : 'border-neutral-200 hover:border-neutral-300 bg-white'
              }`}
            >
              <div
                className="flex items-center justify-between cursor-pointer"
                onClick={() => {
                  setSelectedStyle('custom_image');
                  setErrorMessage('');
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center shrink-0">
                    <ImageIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-neutral-900">
                      อัปโหลดรูปภาพโลโก้ของคุณเอง (Upload Custom Logo)
                    </div>
                    <div className="text-[11px] text-neutral-500">
                      รองรับไฟล์ PNG โปร่งใส, JPG, SVG, WebP
                    </div>
                  </div>
                </div>
                {selectedStyle === 'custom_image' && (
                  <div className="w-5 h-5 rounded-full bg-neutral-900 text-white flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3" />
                  </div>
                )}
              </div>

              {/* Upload Drag & Drop Area */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragOver(true);
                }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDrop}
                className={`mt-3 p-3.5 border-2 border-dashed rounded-xl transition-colors text-center ${
                  isDragOver
                    ? 'border-orange-500 bg-orange-50/50'
                    : 'border-neutral-300 bg-white hover:border-neutral-400'
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  onClick={(e) => ((e.target as HTMLInputElement).value = '')}
                  accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
                  className="hidden"
                />

                {isProcessing ? (
                  <div className="py-2 flex items-center justify-center gap-2 text-xs text-neutral-600">
                    <Loader2 className="w-4 h-4 animate-spin text-orange-600" />
                    <span>กำลังประมวลผลและปรับขนาดรูปภาพ...</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <div className="flex flex-wrap items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-xs font-bold flex items-center gap-2 cursor-pointer shadow-xs transition-colors"
                      >
                        <Upload className="w-3.5 h-3.5 text-orange-400" />
                        <span>เลือกไฟล์รูปภาพจากเครื่อง...</span>
                      </button>

                      {customImage && (
                        <button
                          type="button"
                          onClick={() => {
                            setCustomImage(null);
                            setFileName('');
                            setSelectedStyle('orange_modern');
                          }}
                          className="px-3 py-2 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>ลบรูปที่อัปโหลด</span>
                        </button>
                      )}
                    </div>

                    <p className="text-[11px] text-neutral-400">
                      {fileName ? (
                        <span className="text-emerald-700 font-semibold">ไฟล์ที่เลือก: {fileName}</span>
                      ) : (
                        'หรือลากไฟล์ภาพมาวางที่นี่ (Drag & Drop)'
                      )}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-neutral-50 border-t border-neutral-200 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={handleResetToDefault}
            className="text-xs text-neutral-500 hover:text-neutral-800 flex items-center gap-1 cursor-pointer transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>คืนค่าเริ่มต้น</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-neutral-600 hover:text-neutral-800 hover:bg-neutral-200/60 rounded-lg transition-colors cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isProcessing}
              className="px-5 py-2 bg-neutral-900 hover:bg-neutral-800 disabled:opacity-50 text-white rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-4 h-4 text-emerald-400" />
              <span>บันทึกการเปลี่ยนแปลง</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
