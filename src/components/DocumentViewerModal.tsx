import React, { useState, useEffect } from 'react';
import { Quotation } from '../types';
import { QuotationDocument } from './QuotationDocument';
import { AnnexDocument } from './AnnexDocument';
import {
  X,
  Printer,
  Edit2,
  Receipt,
  Download,
  ChevronLeft,
  Paperclip,
  CheckCircle2,
  AlertCircle,
  Loader2,
  FileText,
  FileCheck2,
  Layers,
  Sparkles,
  QrCode,
  Upload,
  Trash2,
  RotateCcw,
  Check,
} from 'lucide-react';
import { PDFPageSelection, generateAndDownloadPDF } from '../utils/pdfExport';
import { QRCodeCanvas } from './QRCodeCanvas';
import { generatePromptPayPayload } from '../utils/promptpay';
import { formatCurrency } from '../utils/thaiBahtText';


interface DocumentViewerModalProps {
  quotation: Quotation | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (quotation: Quotation) => void;
  onOpenStatusModal: (quotation: Quotation) => void;
  onOpenSlipModal: (quotation: Quotation) => void;
  onUpdateQuotation?: (quotation: Quotation) => void;
}

export const DocumentViewerModal: React.FC<DocumentViewerModalProps> = ({
  quotation,
  isOpen,
  onClose,
  onEdit,
  onOpenStatusModal,
  onOpenSlipModal,
  onUpdateQuotation,
}) => {
  // Screen Preview Tab
  const [activePage, setActivePage] = useState<'quotation' | 'annex' | 'both'>('quotation');

  // PDF Download Modal / Dialog State
  const [isPdfModalOpen, setIsPdfModalOpen] = useState<boolean>(false);
  const [pdfSelection, setPdfSelection] = useState<PDFPageSelection>('both');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);
  const [pdfProgress, setPdfProgress] = useState<string>('');
  const [pdfError, setPdfError] = useState<string>('');

  // Standard Print State
  const [isPrinting, setIsPrinting] = useState<boolean>(false);

  // Document state that updates when edited or props change
  const [docQuotation, setDocQuotation] = useState<Quotation | null>(quotation);

  useEffect(() => {
    if (quotation) {
      setDocQuotation(quotation);
    }
  }, [quotation]);

  // Quick QR Editor Modal State
  const [isQREditModalOpen, setIsQREditModalOpen] = useState(false);
  const [editBankName, setEditBankName] = useState(quotation?.bankInfo?.bankName || 'ธนาคารกรุงไทย');
  const [editBankBranch, setEditBankBranch] = useState(quotation?.bankInfo?.branch || 'สาขา ม.เทคโนโลยีพระจอมเกล้าธนบุรี');
  const [editBankAccountName, setEditBankAccountName] = useState(quotation?.bankInfo?.accountName || 'มจธ.สำนักเคเอกซ์');
  const [editBankAccountNumber, setEditBankAccountNumber] = useState(quotation?.bankInfo?.accountNumber || '037-7-14212-0');
  const [editQrPromptPayCode, setEditQrPromptPayCode] = useState(quotation?.bankInfo?.qrPromptPayCode || '0994000160097');
  const [editQrImageUrl, setEditQrImageUrl] = useState(quotation?.bankInfo?.qrImageUrl || '');
  const [editQrType, setEditQrType] = useState<'promptpay' | 'image' | 'custom_payload'>(
    quotation?.bankInfo?.qrType || (quotation?.bankInfo?.qrImageUrl ? 'image' : 'promptpay')
  );
  const [editQrCustomPayload, setEditQrCustomPayload] = useState(quotation?.bankInfo?.qrCustomPayload || '');
  const [qrSaveSuccess, setQrSaveSuccess] = useState(false);

  if (!isOpen || !quotation || !docQuotation) return null;

  const totalAmount = docQuotation.items.reduce((sum, item) => sum + item.amount, 0);

  const openQREditModal = () => {
    setEditBankName(docQuotation.bankInfo?.bankName || 'ธนาคารกรุงไทย');
    setEditBankBranch(docQuotation.bankInfo?.branch || 'สาขา ม.เทคโนโลยีพระจอมเกล้าธนบุรี');
    setEditBankAccountName(docQuotation.bankInfo?.accountName || 'มจธ.สำนักเคเอกซ์');
    setEditBankAccountNumber(docQuotation.bankInfo?.accountNumber || '037-7-14212-0');
    setEditQrPromptPayCode(docQuotation.bankInfo?.qrPromptPayCode || '0994000160097');
    setEditQrImageUrl(docQuotation.bankInfo?.qrImageUrl || '');
    setEditQrType(docQuotation.bankInfo?.qrType || (docQuotation.bankInfo?.qrImageUrl ? 'image' : 'promptpay'));
    setEditQrCustomPayload(docQuotation.bankInfo?.qrCustomPayload || '');
    setQrSaveSuccess(false);
    setIsQREditModalOpen(true);
  };

  const handleSaveQR = () => {
    const updated: Quotation = {
      ...docQuotation,
      bankInfo: {
        bankName: editBankName,
        branch: editBankBranch,
        accountName: editBankAccountName,
        accountNumber: editBankAccountNumber,
        qrPromptPayCode: editQrPromptPayCode,
        qrImageUrl: editQrImageUrl,
        qrType: editQrType,
        qrCustomPayload: editQrCustomPayload,
      },
      updatedAt: new Date().toISOString(),
    };
    setDocQuotation(updated);
    try {
      localStorage.setItem('print_quotation_data', JSON.stringify(updated));
      sessionStorage.setItem('print_quotation_data', JSON.stringify(updated));
      localStorage.setItem(
        'kx_bank_payment_info_pref_v1',
        JSON.stringify(updated.bankInfo)
      );
    } catch (e) {}
    onUpdateQuotation?.(updated);
    setQrSaveSuccess(true);
    setTimeout(() => {
      setQrSaveSuccess(false);
      setIsQREditModalOpen(false);
    }, 600);
  };

  const handleQuickQRImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('กรุณาเลือกไฟล์ภาพขนาดไม่เกิน 5 MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditQrImageUrl(reader.result as string);
        setEditQrType('image');
      };
      reader.readAsDataURL(file);
    }
  };


  // Handle Direct PDF File Generation & Download
  const handleDownloadPDF = async () => {
    setIsGeneratingPdf(true);
    setPdfError('');
    try {
      await generateAndDownloadPDF({
        selection: pdfSelection,
        quoteNumber: docQuotation.quoteNumber,
        customerName: docQuotation.customer.name,
      });
      setIsGeneratingPdf(false);
      setIsPdfModalOpen(false);
    } catch (err) {
      console.error('PDF generation error:', err);
      setPdfError('เกิดข้อผิดพลาดในการสร้างไฟล์ PDF โปรดลองอีกครั้ง');
      setIsGeneratingPdf(false);
    }
  };

  // Handle Print / "Save as PDF"
  const getPrintUrl = (customSelection?: PDFPageSelection) => {
    const targetPage = customSelection || (activePage === 'quotation' ? 'quotation' : activePage === 'annex' ? 'annex' : 'both');
    return `${window.location.origin}${window.location.pathname}?print=${encodeURIComponent(docQuotation.id)}&page=${targetPage}`;
  };

  const handlePreparePrint = (customSelection?: PDFPageSelection) => {
    try {
      localStorage.setItem('print_quotation_data', JSON.stringify(docQuotation));
      sessionStorage.setItem('print_quotation_data', JSON.stringify(docQuotation));
    } catch (e) {
      console.warn('Failed to cache print quotation:', e);
    }
  };


  const isInIframe = () => {
    try {
      return window.self !== window.top;
    } catch (e) {
      return true;
    }
  };

  const handlePrintClick = (e: React.MouseEvent<HTMLAnchorElement>, customSelection?: PDFPageSelection) => {
    handlePreparePrint(customSelection);

    // If running in top-level window (not inside an iframe sandbox), window.print() works directly!
    if (!isInIframe()) {
      e.preventDefault();
      try {
        window.focus();
        window.print();
      } catch (err) {
        console.error('Direct print notice, opening print tab:', err);
        window.open(getPrintUrl(customSelection), '_blank');
      }
    }
    // If running in an iframe (e.g. AI Studio preview), standard anchor link with target="_blank"
    // safely opens a top-level browser tab where window.print() can run without iframe sandbox blocks!
  };

  const getFileNamePreview = () => {
    const safeNo = quotation.quoteNumber.replace(/[/\\?%*:|"<>]/g, '-');
    if (pdfSelection === 'quotation') return `${safeNo}_ใบเสนอราคา.pdf`;
    if (pdfSelection === 'annex') return `${safeNo}_ข้อกำหนดและค่าปรับ.pdf`;
    return `${safeNo}.pdf (2 หน้าครบชุด)`;
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-xs flex justify-center items-start p-2 sm:p-4 print:p-0 print:m-0 print:static print:bg-white print:overflow-visible">
      {/* Top Floating Control Bar (Hidden on Print) */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-neutral-900/95 backdrop-blur-md text-white px-4 py-2.5 shadow-md flex flex-wrap items-center justify-between gap-3 no-print">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 rounded-md text-xs font-medium transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            ย้อนกลับ
          </button>
          <div>
            <div className="font-mono font-bold text-sm text-amber-300">
              {quotation.quoteNumber}
            </div>
            <div className="text-[11px] text-neutral-400 line-clamp-1">
              {quotation.jobTitle} • {quotation.customer.name}
            </div>
          </div>
        </div>

        {/* Page Switcher for On-Screen Preview */}
        <div className="bg-neutral-800 p-1 rounded-lg flex items-center text-xs">
          <button
            onClick={() => setActivePage('quotation')}
            className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
              activePage === 'quotation' ? 'bg-neutral-700 text-white font-semibold' : 'text-neutral-400 hover:text-white'
            }`}
          >
            หน้า 1: ใบเสนอราคา
          </button>
          <button
            onClick={() => setActivePage('annex')}
            className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
              activePage === 'annex' ? 'bg-neutral-700 text-white font-semibold' : 'text-neutral-400 hover:text-white'
            }`}
          >
            หน้า 2: ข้อกำหนดและค่าปรับ
          </button>
          <button
            onClick={() => setActivePage('both')}
            className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
              activePage === 'both' ? 'bg-neutral-700 text-white font-semibold' : 'text-neutral-400 hover:text-white'
            }`}
          >
            แสดงทั้ง 2 หน้า
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {quotation.paymentSlip && (
            <button
              onClick={() => onOpenSlipModal(quotation)}
              className="px-3 py-1.5 bg-emerald-800/80 hover:bg-emerald-700 text-emerald-100 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Receipt className="w-3.5 h-3.5" />
              ดูสลิปโอน
            </button>
          )}

          <button
            onClick={() => onOpenStatusModal(quotation)}
            className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <span>สถานะ: <strong className="text-white ml-1">{quotation.status}</strong></span>
            {(() => {
              const totalAtt = quotation.statusLogs?.reduce((acc, log) => acc + (log.attachments?.length || 0), 0) || 0;
              if (totalAtt > 0) {
                return (
                  <span className="flex items-center gap-0.5 text-[10px] bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded font-mono">
                    <Paperclip className="w-3 h-3" />
                    {totalAtt}
                  </span>
                );
              }
              return null;
            })()}
          </button>

          <button
            onClick={() => {
              onClose();
              onEdit(docQuotation);
            }}
            className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
          >
            <Edit2 className="w-3.5 h-3.5" />
            แก้ไข
          </button>

          {/* Quick Edit Payment QR Button */}
          <button
            onClick={openQREditModal}
            className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-amber-300 hover:text-amber-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border border-neutral-700"
            title="แก้ไขตัว QR Code หรือข้อมูลบัญชีธนาคารสำหรับชำระเงิน"
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>แก้ไข QR ชำระเงิน</span>
          </button>


          {/* Direct Print Button */}
          <a
            href={getPrintUrl()}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => handlePrintClick(e)}
            className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold rounded-lg text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer active:scale-95 no-underline"
            title="เปิดหน้าต่างพิมพ์ของเบราว์เซอร์ เพื่อเลือกเครื่องพิมพ์ หรือสั่ง Save as PDF"
          >
            <Printer className="w-4 h-4" />
            <span>สั่งพิมพ์ (Print)</span>
          </a>

          {/* Download PDF Trigger Button */}
          <button
            onClick={() => {
              // Pre-select based on current active view
              setPdfSelection(activePage === 'quotation' ? 'quotation' : activePage === 'annex' ? 'annex' : 'both');
              setPdfError('');
              setIsPdfModalOpen(true);
            }}
            className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="ดาวน์โหลดเป็นไฟล์ PDF ลงเครื่องโดยตรง"
          >
            <Download className="w-3.5 h-3.5" />
            <span>ดาวน์โหลด PDF</span>
          </button>

          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-md transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* PDF Page Selection Modal / Dialog */}
      {isPdfModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150 no-print">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-neutral-200 overflow-hidden flex flex-col animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-neutral-200 bg-neutral-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-amber-500/20 text-amber-400 rounded-lg">
                  <Download className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">เลือกหน้าที่ต้องการบันทึกเป็น PDF</h3>
                  <p className="text-[11px] text-neutral-400">ระบบจะสร้างและดาวน์โหลดไฟล์ .pdf ลงเครื่องทันที</p>
                </div>
              </div>
              <button
                onClick={() => !isGeneratingPdf && setIsPdfModalOpen(false)}
                disabled={isGeneratingPdf}
                className="text-neutral-400 hover:text-white p-1 rounded-md transition-colors cursor-pointer disabled:opacity-50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4">
              {/* Option Cards */}
              <div className="space-y-2.5">
                {/* Option 1: Both Pages */}
                <label
                  onClick={() => !isGeneratingPdf && setPdfSelection('both')}
                  className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                    pdfSelection === 'both'
                      ? 'border-neutral-900 bg-neutral-50 ring-2 ring-neutral-900 shadow-2xs'
                      : 'border-neutral-200 hover:border-neutral-300 bg-white'
                  }`}
                >
                  <input
                    type="radio"
                    name="pdf-page-select"
                    checked={pdfSelection === 'both'}
                    onChange={() => setPdfSelection('both')}
                    className="mt-1 text-neutral-900 focus:ring-neutral-900"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-neutral-900 text-xs flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-neutral-700" />
                        <span>ดาวน์โหลดครบชุด (รวม 2 หน้าใน 1 ไฟล์)</span>
                      </span>
                      <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.2 rounded">
                        แนะนำ
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-500 mt-0.5">
                      รวมหน้า 1 ใบเสนอราคา และหน้า 2 ข้อกำหนดและค่าปรับ
                    </p>
                  </div>
                </label>

                {/* Option 2: Page 1 Only */}
                <label
                  onClick={() => !isGeneratingPdf && setPdfSelection('quotation')}
                  className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                    pdfSelection === 'quotation'
                      ? 'border-neutral-900 bg-neutral-50 ring-2 ring-neutral-900 shadow-2xs'
                      : 'border-neutral-200 hover:border-neutral-300 bg-white'
                  }`}
                >
                  <input
                    type="radio"
                    name="pdf-page-select"
                    checked={pdfSelection === 'quotation'}
                    onChange={() => setPdfSelection('quotation')}
                    className="mt-1 text-neutral-900 focus:ring-neutral-900"
                  />
                  <div className="flex-1 min-w-0">
                    <span className="font-bold text-neutral-900 text-xs flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-blue-600" />
                      <span>ดาวน์โหลดเฉพาะหน้า 1: ใบเสนอราคา (Quotation)</span>
                    </span>
                    <p className="text-[11px] text-neutral-500 mt-0.5">
                      เอกสารตารางรายการเช่าห้อง อาหาร และยอดเงินรวมพร้อมลายเซ็น
                    </p>
                  </div>
                </label>

                {/* Option 3: Page 2 Only */}
                <label
                  onClick={() => !isGeneratingPdf && setPdfSelection('annex')}
                  className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                    pdfSelection === 'annex'
                      ? 'border-neutral-900 bg-neutral-50 ring-2 ring-neutral-900 shadow-2xs'
                      : 'border-neutral-200 hover:border-neutral-300 bg-white'
                  }`}
                >
                  <input
                    type="radio"
                    name="pdf-page-select"
                    checked={pdfSelection === 'annex'}
                    onChange={() => setPdfSelection('annex')}
                    className="mt-1 text-neutral-900 focus:ring-neutral-900"
                  />
                  <div className="flex-1 min-w-0">
                    <span className="font-bold text-neutral-900 text-xs flex items-center gap-1.5">
                      <FileCheck2 className="w-3.5 h-3.5 text-purple-600" />
                      <span>ดาวน์โหลดเฉพาะหน้า 2: ข้อกำหนดและค่าปรับ (Annex)</span>
                    </span>
                    <p className="text-[11px] text-neutral-500 mt-0.5">
                      เอกสารเงื่อนไขการใช้บริการ ค่าอุปกรณ์เสริม และตารางค่าปรับ
                    </p>
                  </div>
                </label>
              </div>

              {/* File Name Info Box */}
              <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 text-xs flex items-center justify-between">
                <span className="text-neutral-500">ชื่อไฟล์ที่จะดาวน์โหลด:</span>
                <span className="font-mono font-bold text-neutral-800 text-[11px] truncate max-w-[200px]">
                  {getFileNamePreview()}
                </span>
              </div>

              {/* Progress & Error Status */}
              {isGeneratingPdf && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-center gap-2 animate-in fade-in">
                  <Loader2 className="w-4 h-4 animate-spin text-amber-600 shrink-0" />
                  <span className="font-medium">{pdfProgress || 'กำลังเตรียมข้อมูล PDF...'}</span>
                </div>
              )}

              {pdfError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{pdfError}</span>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3.5 bg-neutral-50 border-t border-neutral-200 flex flex-wrap items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setIsPdfModalOpen(false)}
                disabled={isGeneratingPdf}
                className="px-3.5 py-2 text-xs font-semibold text-neutral-600 hover:text-neutral-800 rounded-lg cursor-pointer transition-colors disabled:opacity-50"
              >
                ยกเลิก
              </button>

              <div className="flex items-center gap-2">
                {/* Print button inside modal */}
                <a
                  href={getPrintUrl(pdfSelection)}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => {
                    handlePrintClick(e, pdfSelection);
                    setIsPdfModalOpen(false);
                  }}
                  className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg text-xs font-semibold transition-all shadow-xs cursor-pointer flex items-center gap-1.5 active:scale-95 no-underline"
                  title="สั่งพิมพ์ผ่านหน้าต่างเบราว์เซอร์ เพื่อเลือกเครื่องพิมพ์"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>สั่งพิมพ์ (Print)</span>
                </a>

                {/* Direct PDF Download Button */}
                <button
                  type="button"
                  onClick={handleDownloadPDF}
                  disabled={isGeneratingPdf}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
                >
                  {isGeneratingPdf ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-neutral-900" />
                      <span>กำลังสร้าง PDF...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-3.5 h-3.5" />
                      <span>ดาวน์โหลด PDF</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick QR & Bank Information Editor Modal */}
      {isQREditModalOpen && (
        <div className="fixed inset-0 z-60 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 no-print">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-neutral-200 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-5 py-4 bg-neutral-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                  <QrCode className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">แก้ไขตัว QR การชำระเงิน</h3>
                  <p className="text-[11px] text-neutral-400">
                    ปรับเปลี่ยนรหัส PromptPay, อัปโหลดภาพ QR ธนาคาร หรือเปลี่ยนเลขบัญชี
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsQREditModalOpen(false)}
                className="p-1 text-neutral-400 hover:text-white rounded-md transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto text-xs">
              {/* QR Mode Switcher */}
              <div>
                <label className="block text-[11px] font-semibold text-neutral-700 mb-1.5">
                  เลือกรูปแบบตัว QR Code:
                </label>
                <div className="grid grid-cols-3 gap-1 p-1 bg-neutral-100 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setEditQrType('promptpay')}
                    className={`py-1.5 px-2 rounded-md font-medium text-center transition-all cursor-pointer ${
                      editQrType === 'promptpay'
                        ? 'bg-white text-neutral-900 font-bold shadow-xs'
                        : 'text-neutral-600 hover:text-neutral-900'
                    }`}
                  >
                    1. PromptPay อัตโนมัติ
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditQrType('image')}
                    className={`py-1.5 px-2 rounded-md font-medium text-center transition-all cursor-pointer ${
                      editQrType === 'image'
                        ? 'bg-white text-neutral-900 font-bold shadow-xs'
                        : 'text-neutral-600 hover:text-neutral-900'
                    }`}
                  >
                    2. อัปโหลดภาพ QR
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditQrType('custom_payload')}
                    className={`py-1.5 px-2 rounded-md font-medium text-center transition-all cursor-pointer ${
                      editQrType === 'custom_payload'
                        ? 'bg-white text-neutral-900 font-bold shadow-xs'
                        : 'text-neutral-600 hover:text-neutral-900'
                    }`}
                  >
                    3. ข้อความ/ลิงก์เอง
                  </button>
                </div>
              </div>

              {/* Mode 1: PromptPay ID */}
              {editQrType === 'promptpay' && (
                <div className="space-y-1.5 bg-amber-50/70 p-3.5 rounded-xl border border-amber-200">
                  <label className="block text-[11px] font-semibold text-neutral-800">
                    เลขพร้อมเพย์ (Tax ID 13 หลัก หรือ เบอร์โทร 10 หลัก):
                  </label>
                  <input
                    type="text"
                    value={editQrPromptPayCode}
                    onChange={(e) => setEditQrPromptPayCode(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="เช่น 0994000160097 หรือ 0812345678"
                    className="w-full px-3 py-2 bg-white border border-neutral-300 focus:border-amber-500 rounded-lg text-xs font-mono font-bold focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                  <div className="text-[10.5px] text-neutral-600 flex items-center justify-between">
                    <span>
                      ยอดเงินในเอกสาร: <b>{formatCurrency(totalAmount)} บาท</b>
                    </span>
                    <button
                      type="button"
                      onClick={() => setEditQrPromptPayCode('0994000160097')}
                      className="text-amber-800 hover:underline font-medium cursor-pointer"
                    >
                      ใช้เลขเคเอกซ์ (0994000160097)
                    </button>
                  </div>
                </div>
              )}

              {/* Mode 2: Image Upload */}
              {editQrType === 'image' && (
                <div className="space-y-2.5 bg-neutral-50 p-3.5 rounded-xl border border-neutral-200">
                  <label className="block text-[11px] font-semibold text-neutral-800">
                    อัปโหลดรูปภาพ QR Code (ภาพจากแอปธนาคาร):
                  </label>
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleQuickQRImageUpload}
                      className="hidden"
                      id="modal-quick-qr-upload"
                    />
                    <label
                      htmlFor="modal-quick-qr-upload"
                      className="px-3.5 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-xs font-semibold cursor-pointer flex items-center gap-1.5 shadow-2xs transition-colors"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>{editQrImageUrl ? 'เปลี่ยนภาพ QR' : 'เลือกไฟล์ภาพ QR Code'}</span>
                    </label>
                    {editQrImageUrl && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditQrImageUrl('');
                          setEditQrType('promptpay');
                        }}
                        className="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-xs font-semibold flex items-center gap-1 border border-red-200 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>ลบรูปภาพ</span>
                      </button>
                    )}
                  </div>
                  <p className="text-[10.5px] text-neutral-500">
                    รองรับไฟล์ภาพ PNG, JPG, WebP ขนาดไม่เกิน 5 MB
                  </p>
                </div>
              )}

              {/* Mode 3: Custom payload */}
              {editQrType === 'custom_payload' && (
                <div className="space-y-1.5 bg-neutral-50 p-3.5 rounded-xl border border-neutral-200">
                  <label className="block text-[11px] font-semibold text-neutral-800">
                    ข้อความหรือลิงก์ Payment URL:
                  </label>
                  <textarea
                    rows={2}
                    value={editQrCustomPayload}
                    onChange={(e) => setEditQrCustomPayload(e.target.value)}
                    placeholder="วางลิงก์หน้าชำระเงิน หรือโค้ด QR..."
                    className="w-full px-3 py-1.5 bg-white border border-neutral-300 focus:border-amber-500 rounded-lg text-xs font-mono focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              )}

              {/* Live Preview of QR */}
              <div className="flex items-center gap-4 p-3 bg-neutral-50 rounded-xl border border-neutral-200">
                <div className="p-1 bg-white border border-neutral-300 rounded-xs shadow-2xs shrink-0">
                  {editQrType === 'image' && editQrImageUrl ? (
                    <img
                      src={editQrImageUrl}
                      alt="QR Preview"
                      className="w-16 h-16 object-contain"
                    />
                  ) : (
                    <QRCodeCanvas
                      value={
                        editQrType === 'custom_payload' && editQrCustomPayload
                          ? editQrCustomPayload
                          : generatePromptPayPayload(editQrPromptPayCode || '0994000160097', totalAmount)
                      }
                      size={64}
                    />
                  )}
                </div>
                <div className="space-y-0.5 text-neutral-700 min-w-0 flex-1">
                  <div className="font-bold text-neutral-900 text-xs">
                    {editBankName} ({editBankBranch})
                  </div>
                  <div className="text-[11px] text-neutral-600 truncate">
                    ชื่อบัญชี: {editBankAccountName}
                  </div>
                  <div className="font-mono font-bold text-xs text-neutral-900">
                    เลขที่บัญชี: {editBankAccountNumber}
                  </div>
                </div>
              </div>

              {/* Bank Account Details Inputs */}
              <div className="space-y-2 pt-2 border-t border-neutral-200">
                <span className="font-semibold text-neutral-800 text-[11px] block">
                  แก้ไขข้อความบัญชีธนาคาร (ทางซ้ายของ QR Code):
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-neutral-500 block mb-0.5">ชื่อธนาคาร:</label>
                    <input
                      type="text"
                      value={editBankName}
                      onChange={(e) => setEditBankName(e.target.value)}
                      className="w-full px-2 py-1 border border-neutral-300 rounded text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-neutral-500 block mb-0.5">สาขา:</label>
                    <input
                      type="text"
                      value={editBankBranch}
                      onChange={(e) => setEditBankBranch(e.target.value)}
                      className="w-full px-2 py-1 border border-neutral-300 rounded text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-neutral-500 block mb-0.5">ชื่อบัญชี:</label>
                    <input
                      type="text"
                      value={editBankAccountName}
                      onChange={(e) => setEditBankAccountName(e.target.value)}
                      className="w-full px-2 py-1 border border-neutral-300 rounded text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-neutral-500 block mb-0.5">เลขที่บัญชี:</label>
                    <input
                      type="text"
                      value={editBankAccountNumber}
                      onChange={(e) => setEditBankAccountNumber(e.target.value)}
                      className="w-full px-2 py-1 border border-neutral-300 rounded font-mono font-bold text-xs"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3.5 bg-neutral-100 border-t border-neutral-200 flex items-center justify-between">
              <div>
                {qrSaveSuccess && (
                  <span className="text-emerald-700 font-semibold flex items-center gap-1 text-xs animate-in fade-in">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>บันทึกข้อมูล QR สำเร็จ!</span>
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsQREditModalOpen(false)}
                  className="px-3.5 py-1.5 bg-white hover:bg-neutral-200 text-neutral-700 font-medium rounded-lg text-xs border border-neutral-300 transition-colors cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  onClick={handleSaveQR}
                  className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold rounded-lg text-xs shadow-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>บันทึกข้อมูล QR</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Document Scroll Viewport (On-screen Preview) */}
      <div id="printable-modal-content" className="w-full max-w-4xl pt-16 sm:pt-18 pb-16 px-1 sm:px-3 flex flex-col items-center space-y-8 print:p-0 print:m-0 print:max-w-none print:space-y-0">
        {(activePage === 'quotation' || activePage === 'both') && (
          <div className="w-full bg-white shadow-2xl rounded-xs border border-neutral-300 print:shadow-none print:border-none print:m-0 quotation-page">
            <QuotationDocument quotation={docQuotation} />
          </div>
        )}

        {(activePage === 'annex' || activePage === 'both') && (
          <div className="w-full bg-white shadow-2xl rounded-xs border border-neutral-300 print:shadow-none print:border-none print:m-0 annex-page">
            <AnnexDocument
              customerName={docQuotation.customer.contactPerson || docQuotation.customer.name}
              config={{
                ...docQuotation.annexConfig,
                fontFamily: docQuotation.annexConfig?.fontFamily || docQuotation.layoutSettings?.headerFontFamily || 'Trirong',
                fontSize: docQuotation.annexConfig?.fontSize || 11,
                logoUrl: docQuotation.annexConfig?.logoUrl || docQuotation.logoUrl,
                companyName: docQuotation.annexConfig?.companyName,
              }}
              language={docQuotation.language}
            />
          </div>
        )}
      </div>

      {/* Dedicated High-Fidelity Off-Screen Container for Consistent PDF Generation */}
      <div
        style={{
          position: 'fixed',
          left: '-10000px',
          top: 0,
          width: '820px',
          backgroundColor: '#ffffff',
          zIndex: -999,
          pointerEvents: 'none',
        }}
        aria-hidden="true"
        className="no-print"
      >
        <div id="export-page-quotation" className="bg-white">
          <QuotationDocument quotation={docQuotation} />
        </div>
        <div id="export-page-annex" className="bg-white">
          <AnnexDocument
            customerName={docQuotation.customer.contactPerson || docQuotation.customer.name}
            config={{
              ...docQuotation.annexConfig,
              fontFamily: docQuotation.annexConfig?.fontFamily || docQuotation.layoutSettings?.headerFontFamily || 'Trirong',
              fontSize: docQuotation.annexConfig?.fontSize || 11,
              logoUrl: docQuotation.annexConfig?.logoUrl || docQuotation.logoUrl,
              companyName: docQuotation.annexConfig?.companyName,
            }}
            language={docQuotation.language}
          />
        </div>
      </div>

    </div>
  );
};
