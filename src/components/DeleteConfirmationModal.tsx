import React from 'react';
import { Quotation } from '../types';
import { formatCurrency, formatThaiDate } from '../utils/thaiBahtText';
import { Trash2, AlertTriangle, X, Check } from 'lucide-react';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  quotation: Quotation | null;
  onConfirmDelete: (id: string) => void;
}

export const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  isOpen,
  onClose,
  quotation,
  onConfirmDelete,
}) => {
  if (!isOpen || !quotation) return null;

  const totalAmount = quotation.items.reduce((sum, item) => sum + item.amount, 0);

  const handleConfirm = () => {
    onConfirmDelete(quotation.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-neutral-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 border-b border-neutral-100 flex items-center justify-between bg-rose-50/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-neutral-900">
                ยืนยันการลบใบเสนอราคา
              </h3>
              <p className="text-xs text-rose-700 font-medium">
                การดำเนินการนี้ไม่สามารถเรียกคืนได้
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-700 p-1.5 rounded-lg hover:bg-white/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-neutral-500">เลขที่ใบเสนอราคา:</span>
              <span className="font-mono font-bold text-neutral-900 text-sm bg-neutral-200/70 px-2 py-0.5 rounded">
                {quotation.quoteNumber}
              </span>
            </div>
            <div className="flex items-start justify-between gap-2">
              <span className="text-neutral-500 shrink-0">ลูกค้า/บริษัท:</span>
              <span className="font-semibold text-neutral-900 text-right">
                {quotation.customer.name}
              </span>
            </div>
            {quotation.jobTitle && (
              <div className="flex items-start justify-between gap-2">
                <span className="text-neutral-500 shrink-0">ชื่องาน:</span>
                <span className="text-neutral-700 text-right">
                  {quotation.jobTitle}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between pt-1 border-t border-neutral-200/60">
              <span className="text-neutral-500">ยอดรวมสุทธิ:</span>
              <span className="font-mono font-bold text-emerald-700 text-sm">
                ฿{formatCurrency(totalAmount)}
              </span>
            </div>
          </div>

          <p className="text-xs text-neutral-600 leading-relaxed">
            คุณต้องการลบใบเสนอราคาฉบับนี้ออกจากระบบอย่างถาวรใช่หรือไม่? ข้อมูลทั้งหมดที่เกี่ยวข้องจะถูกลบออกจากระบบ
          </p>
        </div>

        {/* Actions */}
        <div className="p-4 bg-neutral-50 border-t border-neutral-100 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white hover:bg-neutral-100 text-neutral-700 border border-neutral-300 rounded-xl text-xs font-semibold transition-colors"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>ยืนยันการลบ</span>
          </button>
        </div>
      </div>
    </div>
  );
};
