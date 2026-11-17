import React, { useState, useEffect } from 'react';
import {
  CloudUpload,
  Database,
  CheckCircle2,
  X,
  AlertCircle,
  FileText,
  Upload,
  Check,
  RefreshCw,
  Trash2,
} from 'lucide-react';
import { Quotation } from '../types';
import { formatCurrency, formatThaiDate } from '../utils/thaiBahtText';
import {
  scanLocalStorageQuotations,
  batchUploadQuotationsToFirestore,
} from '../services/quotationFirestore';

interface SyncToCloudModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingCloudQuoteIds: string[];
}

export const SyncToCloudModal: React.FC<SyncToCloudModalProps> = ({
  isOpen,
  onClose,
  existingCloudQuoteIds,
}) => {
  const [localQuotes, setLocalQuotes] = useState<Quotation[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadSuccessCount, setUploadSuccessCount] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [clearLocalAfterSync, setClearLocalAfterSync] = useState<boolean>(true);

  // Scan on open
  useEffect(() => {
    if (isOpen) {
      setUploadSuccessCount(null);
      setErrorMessage('');
      const scanned = scanLocalStorageQuotations();
      setLocalQuotes(scanned);
      // Select all by default
      setSelectedIds(new Set(scanned.map((q) => q.id)));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedIds.size === localQuotes.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(localQuotes.map((q) => q.id)));
    }
  };

  const handleUpload = async () => {
    const toUpload = localQuotes.filter((q) => selectedIds.has(q.id));
    if (toUpload.length === 0) {
      setErrorMessage('กรุณาเลือกอย่างน้อย 1 รายการเพื่อส่งขึ้น Cloud');
      return;
    }

    setIsUploading(true);
    setErrorMessage('');

    try {
      const count = await batchUploadQuotationsToFirestore(toUpload);
      setUploadSuccessCount(count);

      // Optionally clean up scanned keys from LocalStorage
      if (clearLocalAfterSync) {
        try {
          const keys = [
            'kx_quotations_app_v1',
            'kx_quotations_data_v2',
            'kx_quotations_realtime_cache',
          ];
          keys.forEach((k) => localStorage.removeItem(k));
        } catch (e) {}
      }
    } catch (err: any) {
      console.error('Failed to sync to Firestore:', err);
      setErrorMessage(err?.message || 'เกิดข้อผิดพลาดในการส่งข้อมูลขึ้น Cloud Firestore');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed)) {
          const valid = parsed.filter((item) => item && item.id && item.quoteNumber);
          if (valid.length > 0) {
            setLocalQuotes((prev) => {
              const map = new Map<string, Quotation>();
              prev.forEach((q) => map.set(q.id, q));
              valid.forEach((q) => map.set(q.id, q));
              const merged = Array.from(map.values());
              setSelectedIds(new Set(merged.map((m) => m.id)));
              return merged;
            });
            setErrorMessage('');
          } else {
            setErrorMessage('ไฟล์ JSON ไม่มีรูปแบบข้อมูลใบเสนอราคาที่ถูกต้อง');
          }
        } else {
          setErrorMessage('ข้อมูลในไฟล์ JSON ต้องเป็น Array ของใบเสนอราคา');
        }
      } catch (err) {
        setErrorMessage('ไม่สามารถอ่านไฟล์ JSON ได้ กรุณาตรวจสอบรูปแบบไฟล์');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-neutral-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-neutral-200 bg-neutral-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/20 border border-orange-500/40 text-orange-400 flex items-center justify-center shrink-0">
              <CloudUpload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>ส่งข้อมูลขึ้น Cloud Firestore (Sync Data to Cloud)</span>
              </h3>
              <p className="text-xs text-neutral-400">
                นำข้อมูลใบเสนอราคาจาก LocalStorage ในเครื่องส่งขึ้นฐานข้อมูล Cloud Firestore Real-time
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white p-1.5 rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {/* Success Banner */}
          {uploadSuccessCount !== null ? (
            <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-xl text-center space-y-3 animate-in zoom-in-95 duration-150">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-base font-bold text-emerald-900">
                  ส่งข้อมูลขึ้น Cloud Firestore เรียบร้อยแล้ว!
                </h4>
                <p className="text-xs text-emerald-700 mt-1">
                  จำนวน {uploadSuccessCount} รายการถูกบันทึกลง Cloud เรียบร้อยแล้ว และระบบ onSnapshot ได้กระจายข้อมูลไปยังทุกเครื่องแบบ Real-time ทันที
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer inline-flex items-center gap-1.5"
              >
                <span>เสร็จสิ้น (ปิดหน้าต่าง)</span>
              </button>
            </div>
          ) : (
            <>
              {/* Scan Status Summary */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-neutral-50 rounded-xl border border-neutral-200">
                <div className="flex items-center gap-2.5">
                  <Database className="w-4 h-4 text-neutral-600" />
                  <span className="text-xs font-semibold text-neutral-800">
                    ตรวจพบในเครื่อง (LocalStorage):{' '}
                    <strong className="text-orange-600 font-mono text-sm">{localQuotes.length}</strong> รายการ
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <label className="cursor-pointer text-xs text-neutral-600 hover:text-neutral-900 font-medium px-2.5 py-1 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-100 flex items-center gap-1 shadow-2xs">
                    <Upload className="w-3.5 h-3.5 text-neutral-500" />
                    <span>นำเข้าไฟล์ JSON</span>
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const rescanned = scanLocalStorageQuotations();
                      setLocalQuotes(rescanned);
                      setSelectedIds(new Set(rescanned.map((q) => q.id)));
                    }}
                    className="p-1.5 text-neutral-500 hover:text-neutral-800 hover:bg-neutral-200/60 rounded-lg transition-colors cursor-pointer"
                    title="สแกนซ้ำ"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Error Alert */}
              {errorMessage && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Quotes Preview List */}
              {localQuotes.length === 0 ? (
                <div className="p-10 text-center border-2 border-dashed border-neutral-200 rounded-xl text-neutral-400 space-y-2">
                  <FileText className="w-10 h-10 mx-auto text-neutral-300" />
                  <p className="text-sm font-semibold text-neutral-700">ไม่พบข้อมูลเก่าใน LocalStorage ของเบราว์เซอร์นี้</p>
                  <p className="text-xs text-neutral-400 max-w-sm mx-auto">
                    ข้อมูลอาจถูกย้ายขึ้น Cloud เรียบร้อยแล้ว หรือสามารถเลือก "นำเข้าไฟล์ JSON" ด้านบนเพื่อนำไฟล์สำรองมาส่งขึ้น Cloud ได้ครับ
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-neutral-600 px-1">
                    <button
                      type="button"
                      onClick={handleSelectAll}
                      className="font-semibold text-neutral-800 hover:underline cursor-pointer flex items-center gap-1.5"
                    >
                      <div className={`w-4 h-4 rounded border flex items-center justify-center text-white text-[10px] ${
                        selectedIds.size === localQuotes.length ? 'bg-neutral-900 border-neutral-900' : 'border-neutral-300'
                      }`}>
                        {selectedIds.size === localQuotes.length && <Check className="w-3 h-3" />}
                      </div>
                      <span>เลือกทั้งหมด ({selectedIds.size}/{localQuotes.length})</span>
                    </button>
                    <span className="text-[11px] text-neutral-400">
                      * รายการที่มีอยู่บน Cloud แล้วจะถูกอัปเดตทับเป็นข้อมูลล่าสุด
                    </span>
                  </div>

                  <div className="border border-neutral-200 rounded-xl divide-y divide-neutral-100 max-h-72 overflow-y-auto bg-white">
                    {localQuotes.map((q) => {
                      const isSelected = selectedIds.has(q.id);
                      const isAlreadyOnCloud = existingCloudQuoteIds.includes(q.id);
                      const totalAmount = q.items?.reduce((s, it) => s + (Number(it.amount) || 0), 0) || 0;

                      return (
                        <div
                          key={q.id}
                          onClick={() => handleToggleSelect(q.id)}
                          className={`p-3 flex items-center justify-between gap-3 text-xs cursor-pointer transition-colors ${
                            isSelected ? 'bg-orange-50/50' : 'hover:bg-neutral-50'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                              isSelected ? 'bg-orange-600 border-orange-600 text-white' : 'border-neutral-300 bg-white'
                            }`}>
                              {isSelected && <Check className="w-3 h-3" />}
                            </div>

                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-neutral-900 text-xs">
                                  {q.quoteNumber}
                                </span>
                                {isAlreadyOnCloud && (
                                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-50 text-blue-700 border border-blue-200 font-semibold">
                                    มีบน Cloud แล้ว
                                  </span>
                                )}
                              </div>
                              <div className="text-neutral-700 font-medium truncate max-w-sm mt-0.5">
                                {q.customer?.name || 'ไม่ระบุลูกค้า'}
                                {q.jobTitle ? ` - ${q.jobTitle}` : ''}
                              </div>
                              <div className="text-[10px] text-neutral-400 mt-0.5">
                                วันที่: {formatThaiDate(q.issueDate, 'short')}
                              </div>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="font-mono font-bold text-neutral-900 text-xs block">
                              ฿{formatCurrency(totalAmount)}
                            </span>
                            <span className="text-[10px] text-neutral-400 capitalize">
                              {q.status}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Clean LocalStorage Option */}
                  <label className="flex items-center gap-2 pt-2 text-xs text-neutral-600 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={clearLocalAfterSync}
                      onChange={(e) => setClearLocalAfterSync(e.target.checked)}
                      className="rounded border-neutral-300 text-orange-600 focus:ring-orange-500"
                    />
                    <span>ล้างข้อมูลใน LocalStorage ของเบราว์เซอร์นี้ทิ้งหลังส่งขึ้น Cloud สำเร็จ (แนะนำเพื่อไม่ให้สับสน)</span>
                  </label>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {uploadSuccessCount === null && (
          <div className="p-4 bg-neutral-50 border-t border-neutral-200 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              disabled={isUploading}
              className="px-4 py-2 text-xs font-semibold text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/60 rounded-lg transition-colors cursor-pointer"
            >
              ยกเลิก
            </button>

            <button
              type="button"
              onClick={handleUpload}
              disabled={isUploading || selectedIds.size === 0}
              className="px-5 py-2.5 bg-neutral-900 hover:bg-neutral-800 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-2"
            >
              {isUploading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>กำลังส่งข้อมูลขึ้น Cloud Firestore...</span>
                </>
              ) : (
                <>
                  <CloudUpload className="w-4 h-4 text-orange-400" />
                  <span>ส่ง {selectedIds.size} รายการขึ้น Cloud Firestore</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
