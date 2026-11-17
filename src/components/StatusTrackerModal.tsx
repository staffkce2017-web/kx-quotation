import React, { useState, useRef } from 'react';
import { Quotation, QuotationStatus, StatusAttachment } from '../types';
import { useAuth } from '../context/AuthContext';
import {
  X,
  CheckCircle2,
  Clock,
  Send,
  FileCheck,
  Receipt,
  XCircle,
  User,
  Calendar,
  MessageSquare,
  Paperclip,
  Link2,
  ExternalLink,
  Download,
  Trash2,
  Eye,
  FileText,
  Image as ImageIcon,
  FileSpreadsheet,
  Plus,
  AlertCircle
} from 'lucide-react';

interface StatusTrackerModalProps {
  quotation: Quotation;
  isOpen: boolean;
  onClose: () => void;
  onUpdateStatus: (
    newStatus: QuotationStatus,
    note: string,
    updatedBy: string,
    attachments?: StatusAttachment[]
  ) => void;
  onAddAttachmentToLog?: (logId: string, attachment: StatusAttachment) => void;
  onOpenSlipModal: () => void;
}

const STATUS_DEFINITIONS: {
  status: QuotationStatus;
  label: string;
  subtext: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}[] = [
  {
    status: 'DRAFT',
    label: 'ร่างเอกสาร (Draft)',
    subtext: 'อยู่ระหว่างจัดทำข้อมูลและตรวจทาน',
    icon: Clock,
    color: 'slate',
  },
  {
    status: 'SENT',
    label: 'ส่งใบเสนอราคาแล้ว (Sent)',
    subtext: 'ส่งให้ลูกค้าทางอีเมลหรือช่องทางติดต่อแล้ว',
    icon: Send,
    color: 'blue',
  },
  {
    status: 'CONFIRMED',
    label: 'ลูกค้าลงนามยืนยันแล้ว (Confirmed)',
    subtext: 'ลูกค้าเซ็นรับบริการและยืนยันจองห้อง',
    icon: FileCheck,
    color: 'indigo',
  },
  {
    status: 'PAID',
    label: 'ชำระเงินแล้ว (Paid)',
    subtext: 'ตรวจสอบยอดเงินและสลิปการโอนเรียบร้อย',
    icon: Receipt,
    color: 'emerald',
  },
  {
    status: 'COMPLETED',
    label: 'งานเสร็จสิ้น (Completed)',
    subtext: 'จัดงานสัมมนาเรียบร้อย ปิดจ๊อบ',
    icon: CheckCircle2,
    color: 'teal',
  },
  {
    status: 'CANCELLED',
    label: 'ยกเลิก (Cancelled)',
    subtext: 'ลูกค้ายกเลิกหรือไม่ชำระตามกำหนด',
    icon: XCircle,
    color: 'rose',
  },
];

const formatFileSize = (bytes?: number) => {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const getFileIcon = (att: StatusAttachment) => {
  if (att.type === 'link') {
    return <Link2 className="w-4 h-4 text-blue-600" />;
  }
  const mime = att.mimeType?.toLowerCase() || '';
  const name = att.name.toLowerCase();
  if (mime.startsWith('image/') || name.match(/\.(png|jpg|jpeg|webp|gif|svg)$/)) {
    return <ImageIcon className="w-4 h-4 text-emerald-600" />;
  }
  if (mime.includes('pdf') || name.endsWith('.pdf')) {
    return <FileText className="w-4 h-4 text-rose-600" />;
  }
  if (name.match(/\.(xls|xlsx|csv)$/)) {
    return <FileSpreadsheet className="w-4 h-4 text-emerald-700" />;
  }
  return <FileCheck className="w-4 h-4 text-neutral-600" />;
};

export const StatusTrackerModal: React.FC<StatusTrackerModalProps> = ({
  quotation,
  isOpen,
  onClose,
  onUpdateStatus,
  onAddAttachmentToLog,
  onOpenSlipModal,
}) => {
  const { userProfile } = useAuth();
  const [selectedStatus, setSelectedStatus] = useState<QuotationStatus>(quotation.status);
  const [note, setNote] = useState('');
  const [updatedBy, setUpdatedBy] = useState(() => userProfile?.displayName || 'พจนา (ฝ่ายขาย)');
  
  // Attachments State for the new status update form
  const [attachments, setAttachments] = useState<StatusAttachment[]>([]);
  const [isAddingLink, setIsAddingLink] = useState(false);
  const [linkName, setLinkName] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Quick attach to existing log
  const [activeLogAttachId, setActiveLogAttachId] = useState<string | null>(null);
  const [logLinkName, setLogLinkName] = useState('');
  const [logLinkUrl, setLogLinkUrl] = useState('');
  const [isLogAddingLink, setIsLogAddingLink] = useState(false);
  const logFileInputRef = useRef<HTMLInputElement>(null);

  // Full-size Preview Image Lightbox
  const [previewImage, setPreviewImage] = useState<{ url: string; name: string } | null>(null);

  if (!isOpen) return null;

  const currentStatusIndex = STATUS_DEFINITIONS.findIndex((s) => s.status === quotation.status);

  // File Upload Handler for new update form
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file: File) => {
      if (file.size > 15 * 1024 * 1024) {
        alert(`ไฟล์ "${file.name}" มีขนาดเกิน 15 MB กรุณาเลือกไฟล์ที่ขนาดเล็กกว่านี้`);
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const newAttachment: StatusAttachment = {
          id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          name: file.name,
          url: reader.result as string,
          type: 'file',
          size: file.size,
          mimeType: file.type,
          uploadedAt: new Date().toISOString(),
        };
        setAttachments((prev) => [...prev, newAttachment]);
      };
      reader.readAsDataURL(file);
    });

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Add Link Handler for new update form
  const handleAddLink = () => {
    if (!linkUrl.trim()) return;

    let formattedUrl = linkUrl.trim();
    if (!/^https?:\/\//i.test(formattedUrl)) {
      formattedUrl = `https://${formattedUrl}`;
    }

    const newLink: StatusAttachment = {
      id: `link-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      name: linkName.trim() || formattedUrl,
      url: formattedUrl,
      type: 'link',
      uploadedAt: new Date().toISOString(),
    };

    setAttachments((prev) => [...prev, newLink]);
    setLinkName('');
    setLinkUrl('');
    setIsAddingLink(false);
  };

  // Quick File Upload to an existing history log
  const handleLogFileChange = (logId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !onAddAttachmentToLog) return;

    Array.from(files).forEach((file: File) => {
      if (file.size > 15 * 1024 * 1024) {
        alert(`ไฟล์ "${file.name}" มีขนาดเกิน 15 MB`);
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const newAttachment: StatusAttachment = {
          id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          name: file.name,
          url: reader.result as string,
          type: 'file',
          size: file.size,
          mimeType: file.type,
          uploadedAt: new Date().toISOString(),
        };
        onAddAttachmentToLog(logId, newAttachment);
      };
      reader.readAsDataURL(file);
    });

    if (logFileInputRef.current) logFileInputRef.current.value = '';
  };

  // Quick Link addition to an existing history log
  const handleAddLinkToLog = (logId: string) => {
    if (!logLinkUrl.trim() || !onAddAttachmentToLog) return;

    let formattedUrl = logLinkUrl.trim();
    if (!/^https?:\/\//i.test(formattedUrl)) {
      formattedUrl = `https://${formattedUrl}`;
    }

    const newLink: StatusAttachment = {
      id: `link-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      name: logLinkName.trim() || formattedUrl,
      url: formattedUrl,
      type: 'link',
      uploadedAt: new Date().toISOString(),
    };

    onAddAttachmentToLog(logId, newLink);
    setLogLinkName('');
    setLogLinkUrl('');
    setIsLogAddingLink(false);
    setActiveLogAttachId(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateStatus(selectedStatus, note, updatedBy, attachments);
    if (selectedStatus === 'PAID' && !quotation.paymentSlip) {
      onOpenSlipModal();
    }
    setAttachments([]);
    setNote('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full overflow-hidden border border-neutral-200 flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between bg-neutral-50 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold bg-neutral-200 text-neutral-800 px-2 py-0.5 rounded">
                {quotation.quoteNumber}
              </span>
              <h3 className="font-bold text-neutral-800 text-lg">
                อัพเดทและติดตามสถานะของงาน
              </h3>
            </div>
            <p className="text-xs text-neutral-500 mt-0.5">
              {quotation.jobTitle} • {quotation.customer.name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-700 p-1.5 rounded-lg hover:bg-neutral-100 transition-colors cursor-pointer"
            title="ปิดหน้าต่าง"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Visual Step Progress Bar */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-3">
              ขั้นตอนสถานะปัจจุบัน (Status Pipeline)
            </h4>
            <div className="grid grid-cols-5 gap-1 relative">
              {STATUS_DEFINITIONS.filter((s) => s.status !== 'CANCELLED').map((step, idx) => {
                const isPassed = currentStatusIndex >= idx && quotation.status !== 'CANCELLED';
                const isCurrent = quotation.status === step.status;
                const IconComponent = step.icon;

                return (
                  <div
                    key={step.status}
                    className={`flex flex-col items-center text-center p-2 rounded-lg border transition-all ${
                      isCurrent
                        ? 'border-neutral-900 bg-neutral-900 text-white shadow-xs'
                        : isPassed
                        ? 'border-emerald-300 bg-emerald-50/70 text-emerald-900'
                        : 'border-neutral-200 bg-neutral-50/50 text-neutral-400'
                    }`}
                  >
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center mb-1 text-xs font-bold ${
                        isCurrent
                          ? 'bg-white text-neutral-900'
                          : isPassed
                          ? 'bg-emerald-600 text-white'
                          : 'bg-neutral-200 text-neutral-500'
                      }`}
                    >
                      <IconComponent className="w-4 h-4" />
                    </div>
                    <span className="text-[11px] font-semibold leading-tight line-clamp-1">
                      {step.label.split(' ')[0]}
                    </span>
                    <span className={`text-[9px] mt-0.5 leading-none ${isCurrent ? 'text-neutral-300' : 'text-neutral-500'}`}>
                      {step.status}
                    </span>
                  </div>
                );
              })}
            </div>
            {quotation.status === 'CANCELLED' && (
              <div className="mt-2 p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <XCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>งานนี้ถูกทำเครื่องหมายว่ายกเลิก (Cancelled)</span>
              </div>
            )}
          </div>

          {/* Form to Update Status */}
          <form onSubmit={handleSubmit} className="bg-neutral-50/90 rounded-xl p-4 border border-neutral-200 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-700 flex items-center gap-1.5">
              <span>เปลี่ยนสถานะใหม่</span>
              <span className="text-neutral-400 font-normal">| เลือกสถานะและแนบหลักฐาน</span>
            </h4>

            {/* Status Options Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {STATUS_DEFINITIONS.map((def) => {
                const Icon = def.icon;
                const isSelected = selectedStatus === def.status;
                return (
                  <button
                    type="button"
                    key={def.status}
                    onClick={() => setSelectedStatus(def.status)}
                    className={`flex items-start gap-2.5 p-2.5 rounded-lg text-left border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-neutral-900 bg-white ring-2 ring-neutral-900 shadow-xs'
                        : 'border-neutral-200 bg-white hover:border-neutral-300 text-neutral-700'
                    }`}
                  >
                    <div
                      className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 mt-0.5 ${
                        isSelected ? 'bg-neutral-900 text-white' : 'bg-neutral-100 text-neutral-600'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-neutral-900">{def.label}</div>
                      <div className="text-[10px] text-neutral-500 leading-tight mt-0.5">
                        {def.subtext}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {selectedStatus === 'PAID' && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between text-xs text-emerald-900">
                <div className="flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-emerald-600" />
                  <span>
                    {quotation.paymentSlip
                      ? 'มีสลิปหลักฐานแนบอยู่แล้ว'
                      : 'ยังไม่มีสลิปแนบ ต้องการแนบสลิปการโอนเงินด้วยหรือไม่?'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={onOpenSlipModal}
                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-semibold transition-colors shrink-0 cursor-pointer"
                >
                  {quotation.paymentSlip ? 'ดูสลิปที่แนบ' : 'แนบสลิปเลย'}
                </button>
              </div>
            )}

            {/* Note & Updated By Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-semibold text-neutral-700 mb-1">
                  ผู้บันทึกการอัพเดท
                </label>
                <input
                  type="text"
                  value={updatedBy}
                  onChange={(e) => setUpdatedBy(e.target.value)}
                  className="w-full px-3 py-1.5 border border-neutral-300 rounded-md bg-white text-xs focus:outline-none focus:ring-1 focus:ring-neutral-800"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">
                  บันทึกเหตุผล / หมายเหตุ
                </label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="เช่น ลูกค้าส่งเอกสารคอนเฟิร์มแล้ว, แจ้งเลื่อนเวลา"
                  className="w-full px-3 py-1.5 border border-neutral-300 rounded-md bg-white text-xs focus:outline-none focus:ring-1 focus:ring-neutral-800"
                />
              </div>
            </div>

            {/* 📎 Attach Files & Links Section */}
            <div className="pt-2 border-t border-neutral-200/80 space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-800">
                  <Paperclip className="w-3.5 h-3.5 text-blue-600" />
                  <span>แนบไฟล์เอกสารหรือลิ้งค์ที่เกี่ยวข้อง (Attachments & Links)</span>
                  {attachments.length > 0 && (
                    <span className="bg-blue-100 text-blue-800 text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                      {attachments.length}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  {/* File Upload Button */}
                  <input
                    type="file"
                    multiple
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-2.5 py-1 bg-white hover:bg-neutral-100 text-neutral-700 border border-neutral-300 rounded-md text-[11px] font-medium transition-colors flex items-center gap-1 cursor-pointer shadow-2xs"
                  >
                    <Paperclip className="w-3 h-3 text-neutral-600" />
                    <span>+ แนบไฟล์</span>
                  </button>

                  {/* Add Link Button */}
                  <button
                    type="button"
                    onClick={() => setIsAddingLink(!isAddingLink)}
                    className="px-2.5 py-1 bg-white hover:bg-neutral-100 text-neutral-700 border border-neutral-300 rounded-md text-[11px] font-medium transition-colors flex items-center gap-1 cursor-pointer shadow-2xs"
                  >
                    <Link2 className="w-3 h-3 text-blue-600" />
                    <span>+ แนบลิ้งค์</span>
                  </button>
                </div>
              </div>

              {/* Add Link Input Box */}
              {isAddingLink && (
                <div className="p-2.5 bg-blue-50/70 border border-blue-200 rounded-lg space-y-2 text-xs">
                  <div className="font-semibold text-blue-900 text-[11px] flex items-center gap-1">
                    <Link2 className="w-3.5 h-3.5 text-blue-600" />
                    <span>กรอกข้อมูลลิ้งค์ (Google Drive, Dropbox, ERP, Email ฯลฯ)</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                    <input
                      type="text"
                      value={linkName}
                      onChange={(e) => setLinkName(e.target.value)}
                      placeholder="ชื่อกำกับ (เช่น ใบเสนอราคาเซ็นแล้ว หรือ PO ลูกค้า)..."
                      className="sm:col-span-5 px-2.5 py-1 bg-white border border-neutral-300 rounded text-xs"
                    />
                    <input
                      type="url"
                      value={linkUrl}
                      onChange={(e) => setLinkUrl(e.target.value)}
                      placeholder="https://drive.google.com/..."
                      className="sm:col-span-5 px-2.5 py-1 bg-white border border-neutral-300 rounded text-xs font-mono"
                    />
                    <div className="sm:col-span-2 flex gap-1">
                      <button
                        type="button"
                        onClick={handleAddLink}
                        disabled={!linkUrl.trim()}
                        className="flex-1 px-2 py-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded text-[11px] font-semibold transition-colors cursor-pointer"
                      >
                        เพิ่ม
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsAddingLink(false)}
                        className="px-2 py-1 bg-white border border-neutral-300 text-neutral-600 rounded text-[11px] cursor-pointer"
                      >
                        ยกเลิก
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* List of Attached Items in current update form */}
              {attachments.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  {attachments.map((att, idx) => {
                    const isImg = att.type === 'file' && (att.mimeType?.startsWith('image/') || att.name.match(/\.(png|jpg|jpeg|webp)$/i));
                    return (
                      <div
                        key={att.id || idx}
                        className="flex items-center justify-between p-2 bg-white border border-neutral-200 rounded-lg shadow-2xs text-xs gap-2"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          {isImg ? (
                            <img
                              src={att.url}
                              alt={att.name}
                              className="w-7 h-7 rounded object-cover border border-neutral-200 shrink-0 cursor-pointer"
                              onClick={() => setPreviewImage({ url: att.url, name: att.name })}
                              title="คลิกดูภาพขยาย"
                            />
                          ) : (
                            <div className="w-7 h-7 rounded bg-neutral-100 flex items-center justify-center shrink-0">
                              {getFileIcon(att)}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-medium text-neutral-800 truncate text-[11.5px]" title={att.name}>
                              {att.name}
                            </p>
                            <p className="text-[10px] text-neutral-400">
                              {att.type === 'file' ? formatFileSize(att.size) : '🔗 เว็บลิ้งค์'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          {att.type === 'link' ? (
                            <a
                              href={att.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                              title="เปิดทดสอบลิ้งค์"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          ) : isImg ? (
                            <button
                              type="button"
                              onClick={() => setPreviewImage({ url: att.url, name: att.name })}
                              className="p-1 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded cursor-pointer"
                              title="ดูพรีวิว"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          ) : null}

                          <button
                            type="button"
                            onClick={() => setAttachments((prev) => prev.filter((_, i) => i !== idx))}
                            className="p-1 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 rounded cursor-pointer"
                            title="ลบรายการนี้"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-[11px] text-neutral-400 italic">
                  ยังไม่มีไฟล์หรือลิ้งค์แนบ (สามารถคลิกปุ่ม "+ แนบไฟล์" หรือ "+ แนบลิ้งค์" ด้านบนเพื่อแนบหลักฐาน)
                </div>
              )}
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                className="px-5 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                บันทึกการเปลี่ยนแปลงสถานะ
              </button>
            </div>
          </form>

          {/* Timeline History of Status Logs */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-3 flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-neutral-700" />
              <span>ประวัติการอัพเดทสถานะ (Status History Log)</span>
              <span className="text-neutral-400 font-normal">({quotation.statusLogs.length} รายการ)</span>
            </h4>

            {/* Hidden file input for quick log attachment */}
            <input
              type="file"
              multiple
              ref={logFileInputRef}
              onChange={(e) => {
                if (activeLogAttachId) {
                  handleLogFileChange(activeLogAttachId, e);
                }
              }}
              accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt"
              className="hidden"
            />

            <div className="space-y-3.5 relative pl-4 border-l-2 border-neutral-200 ml-2">
              {quotation.statusLogs.slice().reverse().map((log) => {
                const logDef = STATUS_DEFINITIONS.find((s) => s.status === log.status);
                const LogIcon = logDef?.icon || Clock;
                const hasAttachments = log.attachments && log.attachments.length > 0;
                const isQuickAttaching = activeLogAttachId === log.id;

                return (
                  <div key={log.id} className="relative group">
                    {/* Dot on line */}
                    <div className="absolute -left-[23px] top-1.5 w-3.5 h-3.5 rounded-full bg-white border-2 border-neutral-800 flex items-center justify-center">
                      <div className="w-1.5 h-1.5 bg-neutral-800 rounded-full"></div>
                    </div>

                    <div className="bg-white p-3.5 rounded-xl border border-neutral-200 shadow-2xs hover:border-neutral-300 transition-colors space-y-2">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${
                            log.status === 'PAID' ? 'bg-emerald-500' :
                            log.status === 'CONFIRMED' ? 'bg-indigo-500' :
                            log.status === 'SENT' ? 'bg-blue-500' :
                            log.status === 'COMPLETED' ? 'bg-teal-500' :
                            log.status === 'CANCELLED' ? 'bg-rose-500' : 'bg-neutral-400'
                          }`}></span>
                          <span className="text-xs font-bold text-neutral-800">
                            {logDef?.label.split(' ')[0] || log.status}
                          </span>
                          <span className="text-[10px] text-neutral-400 font-mono">
                            ({log.status})
                          </span>
                        </div>
                        <div className="text-[10.5px] text-neutral-400 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>{new Date(log.timestamp).toLocaleString('th-TH')}</span>
                        </div>
                      </div>

                      {log.note && (
                        <p className="text-xs text-neutral-700 bg-neutral-50/90 p-2 rounded-lg border border-neutral-100 leading-relaxed">
                          {log.note}
                        </p>
                      )}

                      {/* Display Attachments & Links in Log */}
                      {hasAttachments && (
                        <div className="pt-1.5 space-y-1.5">
                          <div className="text-[11px] font-semibold text-neutral-700 flex items-center gap-1">
                            <Paperclip className="w-3 h-3 text-blue-600" />
                            <span>เอกสารและลิ้งค์แนบ ({log.attachments!.length}):</span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                            {log.attachments!.map((att) => {
                              const isImg = att.type === 'file' && (att.mimeType?.startsWith('image/') || att.name.match(/\.(png|jpg|jpeg|webp)$/i));
                              return (
                                <div
                                  key={att.id}
                                  className="flex items-center justify-between p-2 bg-neutral-50/90 hover:bg-neutral-100/80 border border-neutral-200 rounded-lg text-xs transition-colors"
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    {isImg ? (
                                      <img
                                        src={att.url}
                                        alt={att.name}
                                        className="w-8 h-8 rounded object-cover border border-neutral-200 shrink-0 cursor-pointer"
                                        onClick={() => setPreviewImage({ url: att.url, name: att.name })}
                                        title="คลิกดูภาพขยาย"
                                      />
                                    ) : (
                                      <div className="w-8 h-8 rounded bg-white border border-neutral-200 flex items-center justify-center shrink-0">
                                        {getFileIcon(att)}
                                      </div>
                                    )}
                                    <div className="min-w-0">
                                      <p className="font-semibold text-neutral-800 text-[11px] truncate" title={att.name}>
                                        {att.name}
                                      </p>
                                      <p className="text-[9.5px] text-neutral-400">
                                        {att.type === 'file' ? formatFileSize(att.size) : '🔗 เว็บลิ้งค์'}
                                      </p>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-1 shrink-0 ml-1">
                                    {att.type === 'link' ? (
                                      <a
                                        href={att.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-1 px-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded text-[10px] font-medium flex items-center gap-1"
                                        title="เปิดลิ้งค์ในแท็บใหม่"
                                      >
                                        <span>เปิด</span>
                                        <ExternalLink className="w-3 h-3" />
                                      </a>
                                    ) : (
                                      <>
                                        {isImg && (
                                          <button
                                            type="button"
                                            onClick={() => setPreviewImage({ url: att.url, name: att.name })}
                                            className="p-1 text-neutral-600 hover:text-neutral-900 rounded cursor-pointer"
                                            title="ดูภาพ"
                                          >
                                            <Eye className="w-3.5 h-3.5" />
                                          </button>
                                        )}
                                        <a
                                          href={att.url}
                                          download={att.name}
                                          className="p-1 px-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded text-[10px] font-medium flex items-center gap-1"
                                          title="ดาวน์โหลดไฟล์"
                                        >
                                          <Download className="w-3 h-3" />
                                          <span>ดาวน์โหลด</span>
                                        </a>
                                      </>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Quick Add attachment/link to this history log */}
                      {onAddAttachmentToLog && (
                        <div className="pt-1.5 flex flex-wrap items-center justify-between gap-1 text-[10.5px]">
                          <div className="flex items-center gap-1 text-neutral-500">
                            <User className="w-3 h-3" />
                            <span>บันทึกโดย: <strong className="text-neutral-700">{log.updatedBy}</strong></span>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                setActiveLogAttachId(log.id);
                                logFileInputRef.current?.click();
                              }}
                              className="text-neutral-500 hover:text-neutral-800 px-1.5 py-0.5 rounded hover:bg-neutral-100 transition-colors flex items-center gap-0.5 cursor-pointer"
                              title="แนบไฟล์เพิ่มในบันทึกนี้"
                            >
                              <Paperclip className="w-3 h-3 text-neutral-400" />
                              <span>แนบไฟล์เพิ่ม</span>
                            </button>
                            <span className="text-neutral-300">|</span>
                            <button
                              type="button"
                              onClick={() => {
                                if (activeLogAttachId === log.id && isLogAddingLink) {
                                  setIsLogAddingLink(false);
                                  setActiveLogAttachId(null);
                                } else {
                                  setActiveLogAttachId(log.id);
                                  setIsLogAddingLink(true);
                                }
                              }}
                              className="text-blue-600 hover:text-blue-800 px-1.5 py-0.5 rounded hover:bg-blue-50 transition-colors flex items-center gap-0.5 cursor-pointer"
                              title="แนบลิ้งค์เพิ่มในบันทึกนี้"
                            >
                              <Link2 className="w-3 h-3" />
                              <span>แนบลิ้งค์เพิ่ม</span>
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Quick Add Link Box for this log */}
                      {isQuickAttaching && isLogAddingLink && (
                        <div className="mt-2 p-2 bg-blue-50/80 border border-blue-200 rounded-lg space-y-1.5 text-xs">
                          <div className="text-[11px] font-semibold text-blue-900 flex items-center gap-1">
                            <Link2 className="w-3 h-3 text-blue-600" />
                            <span>เพิ่มลิ้งค์ในบันทึกนี้:</span>
                          </div>
                          <div className="flex flex-col sm:flex-row gap-1.5">
                            <input
                              type="text"
                              value={logLinkName}
                              onChange={(e) => setLogLinkName(e.target.value)}
                              placeholder="ชื่อกำกับ (เช่น ใบเสร็จ / เอกสาร)..."
                              className="px-2 py-1 bg-white border border-neutral-300 rounded text-xs flex-1"
                            />
                            <input
                              type="url"
                              value={logLinkUrl}
                              onChange={(e) => setLogLinkUrl(e.target.value)}
                              placeholder="https://..."
                              className="px-2 py-1 bg-white border border-neutral-300 rounded text-xs font-mono flex-1"
                            />
                            <div className="flex gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => handleAddLinkToLog(log.id)}
                                disabled={!logLinkUrl.trim()}
                                className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded text-xs font-medium cursor-pointer"
                              >
                                บันทึกลิ้งค์
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setIsLogAddingLink(false);
                                  setActiveLogAttachId(null);
                                }}
                                className="px-2 py-1 bg-white border border-neutral-300 text-neutral-600 rounded text-xs cursor-pointer"
                              >
                                ยกเลิก
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox Image Preview Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 z-60 bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="bg-white rounded-xl overflow-hidden max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-4 py-3 bg-neutral-900 text-white flex items-center justify-between shrink-0">
              <span className="font-semibold text-xs truncate max-w-md">
                {previewImage.name}
              </span>
              <div className="flex items-center gap-2">
                <a
                  href={previewImage.url}
                  download={previewImage.name}
                  className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-white text-xs rounded flex items-center gap-1 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>ดาวน์โหลด</span>
                </a>
                <button
                  type="button"
                  onClick={() => setPreviewImage(null)}
                  className="p-1 text-neutral-400 hover:text-white rounded transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-4 overflow-auto flex items-center justify-center bg-neutral-950/20 max-h-[80vh]">
              <img
                src={previewImage.url}
                alt={previewImage.name}
                className="max-h-full max-w-full object-contain rounded"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
