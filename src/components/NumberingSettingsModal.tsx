import React, { useState } from 'react';
import {
  NumberingSettings,
  NumberingFormat,
  ResetFrequency,
  loadNumberingSettings,
  saveNumberingSettings,
  getNextQuotationNumber,
  getUpcomingNumbersPreview,
  formatQuotationNumber,
} from '../utils/numberGenerator';
import { Quotation } from '../types';
import { X, Hash, Sparkles, Check, RotateCcw, AlertCircle, Calendar } from 'lucide-react';

interface NumberingSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  quotations: Quotation[];
  onSettingsSaved?: (newSettings: NumberingSettings) => void;
}

export const NumberingSettingsModal: React.FC<NumberingSettingsModalProps> = ({
  isOpen,
  onClose,
  quotations,
  onSettingsSaved,
}) => {
  const [settings, setSettings] = useState<NumberingSettings>(loadNumberingSettings());
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const nextNumber = getNextQuotationNumber(quotations, new Date().toISOString().split('T')[0], settings);
  const previews = getUpcomingNumbersPreview(5, quotations, new Date().toISOString().split('T')[0], settings);

  const handleSave = () => {
    saveNumberingSettings(settings);
    setSavedSuccess(true);
    if (onSettingsSaved) {
      onSettingsSaved(settings);
    }
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 800);
  };

  const handleResetDefault = () => {
    const defaultSettings: NumberingSettings = {
      prefix: 'KX',
      digits: 3,
      format: 'KX_SLASH',
      resetFrequency: 'monthly',
      startSequence: 1,
    };
    setSettings(defaultSettings);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-neutral-200 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-neutral-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-400 text-neutral-950 flex items-center justify-center font-bold">
              <Hash className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base">ตั้งค่าการรันเลขที่ใบเสนอราคาอัตโนมัติ</h3>
              <p className="text-xs text-neutral-400">ระบบ Auto-Running Quotation Number</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 text-xs max-h-[80vh] overflow-y-auto">
          {/* Active Preview Banner */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] font-semibold text-amber-800 uppercase tracking-wider block">
                  เลขที่ใบเสนอราคาถัดไปที่จะออก (Next Running Number)
                </span>
                <span className="text-xl font-extrabold font-mono text-neutral-900 mt-0.5 block">
                  {nextNumber}
                </span>
              </div>
              <span className="px-2.5 py-1 bg-amber-200 text-amber-900 rounded-full font-bold text-[11px] flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                รันอัตโนมัติ
              </span>
            </div>
            <p className="text-[11px] text-amber-700 mt-2">
              คำนวณจากใบเสนอราคา {quotations.length} รายการที่มีอยู่ในระบบ และวันที่ปัจจุบัน
            </p>
          </div>

          {/* Form Settings */}
          <div className="space-y-4">
            {/* Prefix, Digits & Start Sequence */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-neutral-700 mb-1">
                  คำนำหน้า (Prefix)
                </label>
                <input
                  type="text"
                  value={settings.prefix}
                  onChange={(e) => setSettings({ ...settings, prefix: e.target.value.toUpperCase() })}
                  placeholder="KX"
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg font-mono font-bold focus:outline-none focus:ring-1 focus:ring-neutral-800 uppercase"
                />
                <span className="text-[10px] text-neutral-400 mt-1 block">
                  เช่น KX, QT, INV
                </span>
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">
                  จำนวนหลักลำดับเลข
                </label>
                <select
                  value={settings.digits}
                  onChange={(e) => setSettings({ ...settings, digits: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-neutral-800"
                >
                  <option value={2}>2 หลัก (01, 02...)</option>
                  <option value={3}>3 หลัก (001, 002...) (KX)</option>
                  <option value={4}>4 หลัก (0001, 0002...)</option>
                  <option value={5}>5 หลัก (00001...)</option>
                </select>
                <span className="text-[10px] text-neutral-400 mt-1 block">
                  ความยาวเลขลำดับ เช่น 003
                </span>
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">
                  ลำดับเลขเริ่มต้น (Start)
                </label>
                <input
                  type="number"
                  min={1}
                  max={99999}
                  value={settings.startSequence}
                  onChange={(e) => setSettings({ ...settings, startSequence: Math.max(1, parseInt(e.target.value) || 1) })}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg font-mono font-bold focus:outline-none focus:ring-1 focus:ring-neutral-800"
                />
                <span className="text-[10px] text-neutral-400 mt-1 block">
                  ค่าเริ่มต้นเมื่อเริ่มรอบใหม่
                </span>
              </div>
            </div>

            {/* Format Pattern */}
            <div>
              <label className="block font-semibold text-neutral-700 mb-1.5">
                รูปแบบโครงสร้างเลขที่เอกสาร (Pattern Format)
              </label>
              <div className="grid grid-cols-1 gap-2">
                {[
                  {
                    value: 'KX_SLASH' as NumberingFormat,
                    label: 'KX / ลำดับ / เดือน / ปี พ.ศ. (มาตรฐานอาคาร KX)',
                    example: `${settings.prefix || 'KX'}/${String(1).padStart(settings.digits, '0')}/09/69`,
                    recommended: true,
                  },
                  {
                    value: 'KX_DASH' as NumberingFormat,
                    label: 'KX-ปีเดือน-ลำดับ (ขีดคั่น)',
                    example: `${settings.prefix || 'KX'}-6909-${String(1).padStart(settings.digits, '0')}`,
                  },
                  {
                    value: 'YEAR_MONTH_RUNNING' as NumberingFormat,
                    label: 'KX / ปี พ.ศ. เต็ม / เดือน / ลำดับ',
                    example: `${settings.prefix || 'KX'}/2569/09/${String(1).padStart(settings.digits, '0')}`,
                  },
                  {
                    value: 'SIMPLE_RUNNING' as NumberingFormat,
                    label: 'KX-ลำดับ (ไม่ระบุเดือนปี)',
                    example: `${settings.prefix || 'KX'}-${String(1).padStart(settings.digits, '0')}`,
                  },
                ].map((item) => (
                  <label
                    key={item.value}
                    className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition-all ${
                      settings.format === item.value
                        ? 'border-neutral-900 bg-neutral-50 ring-1 ring-neutral-900'
                        : 'border-neutral-200 hover:border-neutral-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <input
                        type="radio"
                        name="numbering_format"
                        checked={settings.format === item.value}
                        onChange={() => setSettings({ ...settings, format: item.value })}
                        className="text-neutral-900 focus:ring-neutral-900"
                      />
                      <div>
                        <div className="font-semibold text-neutral-900 flex items-center gap-1.5">
                          <span>{item.label}</span>
                          {item.recommended && (
                            <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-bold">
                              แนะนำ
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <span className="font-mono font-bold text-neutral-600 bg-white px-2 py-0.5 rounded border border-neutral-200 text-[11px]">
                      {item.example}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Reset Frequency */}
            <div>
              <label className="block font-semibold text-neutral-700 mb-1.5">
                เงื่อนไขการเริ่มนับ 1 ใหม่ (Sequence Reset Rule)
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 'monthly' as ResetFrequency, label: 'รีเซ็ตทุกเดือน', desc: 'ขึ้นเดือนใหม่เริ่ม 001' },
                  { value: 'yearly' as ResetFrequency, label: 'รีเซ็ตทุกปี', desc: 'ขึ้นปีใหม่เริ่ม 001' },
                  { value: 'continuous' as ResetFrequency, label: 'รันต่อเนื่อง', desc: 'รันยาวไม่รีเซ็ต' },
                ].map((freq) => (
                  <button
                    key={freq.value}
                    type="button"
                    onClick={() => setSettings({ ...settings, resetFrequency: freq.value })}
                    className={`p-2.5 rounded-lg border text-left transition-all ${
                      settings.resetFrequency === freq.value
                        ? 'border-neutral-900 bg-neutral-900 text-white shadow-xs'
                        : 'border-neutral-200 hover:bg-neutral-50 text-neutral-700'
                    }`}
                  >
                    <div className="font-bold text-xs">{freq.label}</div>
                    <div className={`text-[10px] mt-0.5 ${settings.resetFrequency === freq.value ? 'text-neutral-300' : 'text-neutral-400'}`}>
                      {freq.desc}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Upcoming Previews */}
            <div>
              <label className="block font-semibold text-neutral-700 mb-1.5">
                ตัวอย่างลำดับ 5 เลขที่ถัดไป:
              </label>
              <div className="flex flex-wrap gap-1.5">
                {previews.map((item, idx) => (
                  <span
                    key={idx}
                    className="font-mono text-[11px] px-2.5 py-1 bg-neutral-100 border border-neutral-200 rounded-md text-neutral-700 font-semibold"
                  >
                    #{idx + 1}: {item}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-neutral-50 px-6 py-3.5 border-t border-neutral-200 flex items-center justify-between">
          <button
            type="button"
            onClick={handleResetDefault}
            className="text-neutral-500 hover:text-neutral-800 text-xs flex items-center gap-1 font-medium"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            คืนค่าเริ่มต้น KX
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white border border-neutral-300 hover:bg-neutral-100 text-neutral-700 rounded-lg text-xs font-semibold transition-colors"
            >
              ยกเลิก
            </button>
            <button
              type="button"
              onClick={handleSave}
              className={`px-5 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all ${
                savedSuccess
                  ? 'bg-emerald-600 text-white'
                  : 'bg-neutral-900 hover:bg-neutral-800 text-white'
              }`}
            >
              {savedSuccess ? (
                <>
                  <Check className="w-4 h-4" />
                  บันทึกเรียบร้อย
                </>
              ) : (
                'บันทึกการตั้งค่า'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
