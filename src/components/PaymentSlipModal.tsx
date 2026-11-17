import React, { useState } from 'react';
import { PaymentSlip, Quotation } from '../types';
import { X, Upload, CheckCircle2, FileText, QrCode } from 'lucide-react';
import { formatCurrency, formatThaiDate } from '../utils/thaiBahtText';

interface PaymentSlipModalProps {
  quotation: Quotation;
  isOpen: boolean;
  onClose: () => void;
  onSaveSlip: (slip: PaymentSlip) => void;
}

export const PaymentSlipModal: React.FC<PaymentSlipModalProps> = ({
  quotation,
  isOpen,
  onClose,
  onSaveSlip,
}) => {
  const existingSlip = quotation.paymentSlip;
  const totalAmount = quotation.items.reduce((sum, item) => sum + item.amount, 0);

  const [bankName, setBankName] = useState(existingSlip?.bankName || 'SCB Easy');
  const [amount, setAmount] = useState<number>(existingSlip?.amount || totalAmount);
  const [refNumber, setRefNumber] = useState(existingSlip?.refNumber || '202609164ICXebWabeOG1jOXB');
  const [senderName, setSenderName] = useState(existingSlip?.senderName || 'นาย นัคนันท์ น. (xxx-xxx391-2)');
  const [receiverAccount, setReceiverAccount] = useState(existingSlip?.receiverAccount || 'มจธ.สำนักเคเอกซ์ (x-2120)');
  const [transferDate, setTransferDate] = useState(existingSlip?.transferDate || '2026-09-16');
  const [transferTime, setTransferTime] = useState(existingSlip?.transferTime || '14:00');
  const [notes, setNotes] = useState(existingSlip?.notes || 'สลิปโอนเงินชำระค่าบริการห้องประชุม ตรวจสอบยอดตรงตามใบเสนอราคา');
  const [previewImage, setPreviewImage] = useState<string | undefined>(existingSlip?.imageUrl);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    const newSlip: PaymentSlip = {
      id: existingSlip?.id || `slip-${Date.now()}`,
      uploadedAt: new Date().toISOString(),
      amount: Number(amount),
      bankName,
      refNumber,
      senderName,
      receiverAccount,
      transferDate,
      transferTime,
      notes,
      imageUrl: previewImage,
    };
    onSaveSlip(newSlip);
    onClose();
  };

  const isMatchedAmount = Number(amount) === totalAmount;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full overflow-hidden border border-neutral-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between bg-neutral-50">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <h3 className="font-bold text-neutral-800 text-lg">
              หลักฐานสลิปการโอนเงิน (Payment Slip)
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-700 p-1 rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[78vh] overflow-y-auto">
          {/* Visual Slip Card */}
          <div className="flex flex-col items-center">
            <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2 self-start">
              ตัวอย่างสลิปที่แนบ (Slip Preview)
            </span>

            {previewImage ? (
              <div className="relative rounded-lg overflow-hidden border border-neutral-300 shadow-sm max-h-[380px] w-full">
                <img
                  src={previewImage}
                  alt="Payment Slip"
                  className="w-full h-auto object-contain"
                />
              </div>
            ) : (
              /* High-fidelity SCB Slip Visual Mockup matching page 4 of the attached PDF */
              <div className="w-full max-w-[280px] bg-gradient-to-b from-purple-50 via-white to-purple-50/40 rounded-xl p-4 border border-purple-200 shadow-sm text-center">
                <div className="flex justify-between items-center mb-3">
                  <div className="text-[10px] text-purple-700 font-bold tracking-tight bg-purple-100 px-2 py-0.5 rounded">
                    {bankName}
                  </div>
                  <div className="text-[10px] text-neutral-500">e-Slip</div>
                </div>

                <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 mb-1">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div className="text-sm font-bold text-emerald-700">โอนเงินสำเร็จ</div>
                <div className="text-[11px] text-neutral-500 mb-3">
                  {formatThaiDate(transferDate, 'short')} - {transferTime}
                </div>
                <div className="text-[9px] text-neutral-400 mb-3 font-mono">
                  รหัสอ้างอิง: {refNumber}
                </div>

                <div className="border-t border-b border-purple-100 py-2.5 text-left text-[11px] space-y-2">
                  <div>
                    <div className="text-[9px] text-neutral-400">จาก</div>
                    <div className="font-medium text-neutral-800">{senderName}</div>
                  </div>
                  <div>
                    <div className="text-[9px] text-neutral-400">ไปยัง</div>
                    <div className="font-semibold text-purple-900">{receiverAccount}</div>
                  </div>
                </div>

                <div className="py-2.5 flex justify-between items-baseline">
                  <span className="text-[11px] text-neutral-500">จำนวนเงิน</span>
                  <span className="text-lg font-bold text-neutral-900 font-mono">
                    {formatCurrency(amount)}
                  </span>
                </div>

                <div className="bg-neutral-50 rounded p-2 text-[9.5px] text-neutral-500 flex items-center justify-center gap-1.5 border border-dashed border-neutral-200">
                  <QrCode className="w-3.5 h-3.5 text-neutral-400" />
                  <span>สามารถสแกน QR เพื่อตรวจสอบ</span>
                </div>
              </div>
            )}

            {/* Upload Action */}
            <div className="mt-3 w-full">
              <label className="flex items-center justify-center gap-2 px-3 py-2 border border-dashed border-neutral-300 rounded-lg text-xs font-medium text-neutral-600 hover:bg-neutral-50 hover:border-neutral-400 cursor-pointer transition-colors">
                <Upload className="w-4 h-4 text-neutral-400" />
                <span>อัพโหลดรูปภาพสลิปจริง</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Form Fields */}
          <div className="space-y-3.5 text-xs text-neutral-700">
            <div>
              <label className="block font-semibold mb-1 text-neutral-800">
                ธนาคารผู้โอน
              </label>
              <input
                type="text"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                className="w-full px-3 py-1.5 border border-neutral-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="เช่น SCB Easy, K PLUS, Krungthai NEXT"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="font-semibold text-neutral-800">ยอดเงินที่โอน (บาท)</label>
                <span className="text-[11px] text-neutral-500">
                  ยอดตามใบเสนอราคา: {formatCurrency(totalAmount)}
                </span>
              </div>
              <input
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                className={`w-full px-3 py-1.5 border rounded-md font-mono text-sm font-semibold focus:outline-none ${
                  isMatchedAmount
                    ? 'border-emerald-400 bg-emerald-50/40 text-emerald-900'
                    : 'border-amber-400 bg-amber-50/40 text-amber-900'
                }`}
              />
              {isMatchedAmount ? (
                <p className="text-[11px] text-emerald-600 mt-0.5 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> ยอดเงินตรงกับใบเสนอราคา 100%
                </p>
              ) : (
                <p className="text-[11px] text-amber-600 mt-0.5">
                  ⚠️ ยอดเงินไม่ตรงกับใบเสนอราคา (ส่วนต่าง: {formatCurrency(Math.abs(amount - totalAmount))})
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-semibold mb-1 text-neutral-800">วันที่โอน</label>
                <input
                  type="date"
                  value={transferDate}
                  onChange={(e) => setTransferDate(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-neutral-300 rounded-md focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1 text-neutral-800">เวลาที่โอน</label>
                <input
                  type="time"
                  value={transferTime}
                  onChange={(e) => setTransferTime(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-neutral-300 rounded-md focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold mb-1 text-neutral-800">
                รหัสอ้างอิงธุรกรรม (Ref. No.)
              </label>
              <input
                type="text"
                value={refNumber}
                onChange={(e) => setRefNumber(e.target.value)}
                className="w-full px-3 py-1.5 border border-neutral-300 rounded-md font-mono text-xs focus:outline-none"
                placeholder="202609164ICXebWabeOG1jOXB"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1 text-neutral-800">ชื่อผู้โอน</label>
              <input
                type="text"
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
                className="w-full px-3 py-1.5 border border-neutral-300 rounded-md focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1 text-neutral-800">บันทึกเพิ่มเติม</label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-1.5 border border-neutral-300 rounded-md focus:outline-none text-xs"
              />
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="px-6 py-3.5 bg-neutral-50 border-t border-neutral-200 flex justify-between items-center">
          <div className="flex items-center gap-1.5 text-xs text-neutral-500">
            <FileText className="w-4 h-4" />
            <span>ใบเสนอราคา: <strong className="text-neutral-800">{quotation.quoteNumber}</strong></span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-neutral-300 text-neutral-700 rounded-lg text-xs font-medium hover:bg-neutral-100 transition-colors"
            >
              ยกเลิก
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors"
            >
              <CheckCircle2 className="w-4 h-4" />
              บันทึกสลิป & ยืนยันชำระเงิน
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
