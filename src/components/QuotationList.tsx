import React, { useState, useEffect, useMemo } from 'react';
import { Quotation, QuotationStatus, CustomerRecord } from '../types';
import { formatCurrency, formatThaiDate } from '../utils/thaiBahtText';
import { getNextQuotationNumber } from '../utils/numberGenerator';
import { NumberingSettingsModal } from './NumberingSettingsModal';
import { CustomerSyncModal } from './CustomerSyncModal';
import { loadCustomers } from '../utils/customerSync';
import { getQuotationPreparedBy, isMatchingPreparedBy } from './DataAnalyticsView';
import { loadPreparedByPresets } from './QuotationEditor';
import {
  FileText,
  Search,
  Plus,
  Printer,
  Edit2,
  Copy,
  Trash2,
  Receipt,
  CheckCircle2,
  Clock,
  Send,
  FileCheck,
  XCircle,
  MoreVertical,
  Calendar,
  ExternalLink,
  Sparkles,
  Paperclip,
  Settings,
  Hash,
  Database,
  RotateCcw,
  UserCheck,
} from 'lucide-react';

interface QuotationListProps {
  quotations: Quotation[];
  isLoading?: boolean;
  onSelectQuotation: (quotation: Quotation) => void;
  onEditQuotation: (quotation: Quotation) => void;
  onCreateNew: () => void;
  onDuplicateQuotation: (quotation: Quotation) => void;
  onDeleteQuotation: (id: string) => void;
  onOpenStatusModal: (quotation: Quotation) => void;
  onOpenSlipModal: (quotation: Quotation) => void;
  onRestoreDemo?: () => void;
  onClearAll?: () => void;
}

export const QuotationList: React.FC<QuotationListProps> = ({
  quotations,
  isLoading = false,
  onSelectQuotation,
  onEditQuotation,
  onCreateNew,
  onDuplicateQuotation,
  onDeleteQuotation,
  onOpenStatusModal,
  onOpenSlipModal,
  onRestoreDemo,
  onClearAll,
}) => {
  const [activeTab, setActiveTab] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [preparedByFilter, setPreparedByFilter] = useState<string>('ALL');
  const [isNumberSettingsOpen, setIsNumberSettingsOpen] = useState<boolean>(false);
  const [isCustomerSyncOpen, setIsCustomerSyncOpen] = useState<boolean>(false);
  const [customers, setCustomers] = useState<CustomerRecord[]>(loadCustomers);

  // Dynamic Prepared By Options
  const preparedByOptions = useMemo(() => {
    const set = new Set<string>();
    quotations.forEach((q) => {
      const name = getQuotationPreparedBy(q);
      if (name && name !== 'ไม่ระบุผู้จัดทำ') {
        set.add(name);
      }
    });
    try {
      const presets = loadPreparedByPresets();
      presets.forEach((p) => {
        if (p.name) set.add(p.name);
      });
    } catch (e) {}
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'th'));
  }, [quotations]);

  // Sync listener to update customer count
  useEffect(() => {
    const handleUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<CustomerRecord[]>;
      if (customEvent.detail) {
        setCustomers(customEvent.detail);
      }
    };
    window.addEventListener('kx_customers_updated', handleUpdate);
    return () => window.removeEventListener('kx_customers_updated', handleUpdate);
  }, []);

  const nextQuoteNumber = getNextQuotationNumber(quotations);

  const statusTabConfig = [
    { key: 'ALL', label: 'ทั้งหมด', count: quotations.length },
    { key: 'DRAFT', label: 'ร่าง', count: quotations.filter((q) => q.status === 'DRAFT').length },
    { key: 'SENT', label: 'ส่งแล้ว', count: quotations.filter((q) => q.status === 'SENT').length },
    { key: 'CONFIRMED', label: 'ลงนามแล้ว', count: quotations.filter((q) => q.status === 'CONFIRMED').length },
    { key: 'PAID', label: 'ชำระเงินแล้ว', count: quotations.filter((q) => q.status === 'PAID').length },
    { key: 'COMPLETED', label: 'เสร็จสิ้น', count: quotations.filter((q) => q.status === 'COMPLETED').length },
  ];

  const filteredQuotations = quotations.filter((q) => {
    const matchesTab = activeTab === 'ALL' || q.status === activeTab;
    const qSearch = (searchQuery || '').toLowerCase();
    const matchesSearch =
      !qSearch ||
      (q.quoteNumber || '').toLowerCase().includes(qSearch) ||
      (q.customer?.name || '').toLowerCase().includes(qSearch) ||
      (q.jobTitle || '').toLowerCase().includes(qSearch) ||
      (q.customer?.contactPerson || '').toLowerCase().includes(qSearch);

    const qPrep = getQuotationPreparedBy(q);
    const matchesPreparedBy = isMatchingPreparedBy(qPrep, preparedByFilter);

    return matchesTab && matchesSearch && matchesPreparedBy;
  });

  const getStatusBadge = (status: QuotationStatus) => {
    switch (status) {
      case 'DRAFT':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700">
            <Clock className="w-3 h-3" /> ร่าง (Draft)
          </span>
        );
      case 'SENT':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <Send className="w-3 h-3" /> ส่งแล้ว (Sent)
          </span>
        );
      case 'CONFIRMED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
            <FileCheck className="w-3 h-3" /> ลงนามแล้ว (Confirmed)
          </span>
        );
      case 'PAID':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <Receipt className="w-3 h-3" /> ชำระแล้ว (Paid)
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-teal-50 text-teal-700 border border-teal-200">
            <CheckCircle2 className="w-3 h-3" /> เสร็จสิ้น (Completed)
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3 h-3" /> ยกเลิก
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Search & Actions Bar */}
      <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        {/* Search & Prepared By Filter */}
        <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[280px]">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-3 text-neutral-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหาเลขที่ใบเสนอราคา, ลูกค้า, ชื่องาน..."
              className="w-full pl-9 pr-4 py-2 border border-neutral-300 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-neutral-800"
            />
          </div>

          {/* Prepared By Dropdown */}
          <div className="flex items-center gap-1.5 shrink-0">
            <select
              value={preparedByFilter}
              onChange={(e) => setPreparedByFilter(e.target.value)}
              className="px-3 py-2 bg-white border border-blue-300 rounded-lg text-xs font-semibold text-blue-900 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-2xs cursor-pointer min-w-[150px]"
            >
              <option value="ALL">👤 ผู้จัดทำทั้งหมด</option>
              {preparedByOptions.map((name) => (
                <option key={name} value={name}>
                  👤 {name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Right Actions: Next Running Number Badge, Customer DB, & Create Button */}
        <div className="flex items-center gap-2">
          {/* Customer Database & Sync Button */}
          <button
            type="button"
            onClick={() => setIsCustomerSyncOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-neutral-100 hover:bg-neutral-200 border border-neutral-200 rounded-lg text-xs font-semibold text-neutral-800 transition-all shadow-2xs cursor-pointer"
            title="จัดการฐานข้อมูลลูกค้า และซิงค์ข้อมูลจากลิงก์ Google Sheets"
          >
            <Database className="w-3.5 h-3.5 text-neutral-600" />
            <span className="hidden sm:inline">ฐานข้อมูลลูกค้า</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 bg-neutral-200 text-neutral-800 rounded-full font-bold">
              {customers.length}
            </span>
          </button>

          {/* Quick badge showing the next sequential quotation number */}
          <button
            type="button"
            onClick={() => setIsNumberSettingsOpen(true)}
            className="group flex items-center gap-2 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg text-xs transition-all shadow-2xs cursor-pointer"
            title="คลิกเพื่อดูและตั้งค่าระบบรันเลขที่ใบเสนอราคาอัตโนมัติ"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-600 group-hover:rotate-12 transition-transform" />
            <div className="text-left">
              <span className="text-[9px] text-amber-800 uppercase block font-semibold leading-none">เลขรันถัดไป</span>
              <span className="font-mono font-bold text-neutral-900 leading-none">{nextQuoteNumber}</span>
            </div>
            <Settings className="w-3 h-3 text-neutral-400 group-hover:text-neutral-700 ml-0.5" />
          </button>

          {/* Create Button */}
          <button
            onClick={onCreateNew}
            className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            สร้างใบเสนอราคาใหม่
          </button>
        </div>
      </div>

      {/* Filter Tabs & Prepared By Filter Badge */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1 overflow-x-auto pb-1 text-xs">
          {statusTabConfig.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer ${
                  isActive
                    ? 'bg-neutral-900 text-white font-semibold'
                    : 'bg-white hover:bg-neutral-100 text-neutral-600 border border-neutral-200'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    isActive ? 'bg-neutral-700 text-white' : 'bg-neutral-100 text-neutral-600'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {preparedByFilter !== 'ALL' && (
          <div className="flex items-center gap-2 text-xs bg-blue-50 text-blue-900 px-3 py-1 rounded-lg border border-blue-200">
            <span>แสดงเฉพาะผู้จัดทำ: <strong>{preparedByFilter}</strong></span>
            <button
              onClick={() => setPreparedByFilter('ALL')}
              className="text-rose-600 hover:text-rose-800 font-bold ml-1 cursor-pointer"
              title="ยกเลิกการกรองผู้จัดทำ"
            >
              ×
            </button>
          </div>
        )}
      </div>

      {/* Quotation Cards Grid / List */}
      <div className="grid grid-cols-1 gap-3">
        {isLoading ? (
          <div className="bg-white p-12 text-center rounded-xl border border-neutral-200 text-neutral-500 space-y-3">
            <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-xs text-neutral-500 font-medium">กำลังซิงค์ข้อมูลใบเสนอราคาจาก Firebase Cloud Firestore...</p>
          </div>
        ) : filteredQuotations.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-xl border border-neutral-200 text-neutral-500 space-y-3">
            <div className="w-14 h-14 bg-neutral-100 rounded-full flex items-center justify-center mx-auto text-neutral-400">
              <FileText className="w-7 h-7" />
            </div>
            <div>
              <p className="text-sm font-medium">ไม่พบใบเสนอราคาที่ตรงกับเงื่อนไข</p>
              <p className="text-xs text-neutral-400 mt-1">ลองเปลี่ยนคำค้นหาหรือตัวกรองสถานะ/ผู้จัดทำ</p>
            </div>
            {preparedByFilter !== 'ALL' && (
              <button
                type="button"
                onClick={() => setPreparedByFilter('ALL')}
                className="px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
              >
                แสดงผู้จัดทำทั้งหมด
              </button>
            )}
          </div>
        ) : (
          filteredQuotations.map((quotation) => {
            const total = quotation.items.reduce((sum, item) => sum + item.amount, 0);
            const prepName = getQuotationPreparedBy(quotation);

            return (
              <div
                key={quotation.id}
                className="bg-white rounded-xl border border-neutral-200 shadow-2xs hover:shadow-xs hover:border-neutral-300 transition-all p-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                {/* Info Column */}
                <div className="flex items-start gap-3.5 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-neutral-100 border border-neutral-200 flex items-center justify-center shrink-0 text-neutral-700 font-mono text-xs font-bold">
                    KX
                  </div>

                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono font-bold text-neutral-900 text-sm">
                        {quotation.quoteNumber}
                      </span>
                      {getStatusBadge(quotation.status)}

                      {/* Prepared By Tag */}
                      <span className="text-[10px] font-semibold text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                        👤 {prepName}
                      </span>

                      {quotation.paymentSlip && (
                        <button
                          onClick={() => onOpenSlipModal(quotation)}
                          className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 hover:bg-emerald-100 flex items-center gap-1 transition-colors cursor-pointer"
                          title="ดูหลักฐานสลิปโอนเงิน"
                        >
                          <Receipt className="w-3 h-3" />
                          มีสลิปแนบ
                        </button>
                      )}

                      {(() => {
                        const totalAtt = quotation.statusLogs?.reduce(
                          (acc, log) => acc + (log.attachments?.length || 0),
                          0
                        ) || 0;
                        if (totalAtt === 0) return null;
                        return (
                          <button
                            onClick={() => onOpenStatusModal(quotation)}
                            className="text-[10px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 hover:bg-blue-100 flex items-center gap-1 transition-colors cursor-pointer"
                            title={`มีไฟล์หรือลิ้งค์แนบในประวัติสถานะ ${totalAtt} รายการ`}
                          >
                            <Paperclip className="w-3 h-3 text-blue-600" />
                            <span>{totalAtt} ไฟล์/ลิ้งค์แนบ</span>
                          </button>
                        );
                      })()}
                    </div>

                    <div className="text-xs font-semibold text-neutral-800 line-clamp-1">
                      {quotation.jobTitle}
                    </div>

                    <div className="text-[11px] text-neutral-500 flex flex-wrap items-center gap-x-4 gap-y-1">
                      <span>ลูกค้า: <strong className="text-neutral-700">{quotation.customer.name}</strong></span>
                      {quotation.customer.contactPerson && (
                        <span>ผู้ติดต่อ: {quotation.customer.contactPerson}</span>
                      )}
                      <span>วันที่ออก: {formatThaiDate(quotation.issueDate, 'short')}</span>
                      {(quotation.eventDate || quotation.usageDate) && (
                        <span className="text-neutral-700">
                          วันที่ใช้งาน:{' '}
                          {/^\d{4}-\d{2}-\d{2}$/.test(quotation.eventDate || quotation.usageDate || '')
                            ? formatThaiDate(quotation.eventDate || quotation.usageDate || '', 'short')
                            : (quotation.eventDate || quotation.usageDate)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Amount & Actions Column */}
                <div className="flex items-center justify-between md:justify-end gap-4 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-neutral-100">
                  <div className="text-right">
                    <div className="text-[10px] text-neutral-400">ยอดรวมสุทธิ</div>
                    <div className="text-base font-bold font-mono text-neutral-900">
                      ฿{formatCurrency(total)}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Status Update Button */}
                    <button
                      onClick={() => onOpenStatusModal(quotation)}
                      className="px-2.5 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                      title="อัปเดตสถานะและแนบสลิป/ประวัติงาน"
                    >
                      อัปเดตสถานะ
                    </button>

                    {/* View Button */}
                    <button
                      onClick={() => onSelectQuotation(quotation)}
                      className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-xs font-medium transition-colors cursor-pointer"
                    >
                      ดูเอกสาร
                    </button>

                    {/* Action Dropdown / Direct Buttons */}
                    <button
                      onClick={() => onEditQuotation(quotation)}
                      className="p-1.5 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors cursor-pointer"
                      title="แก้ไขใบเสนอราคา"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => onDuplicateQuotation(quotation)}
                      className="p-1.5 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors cursor-pointer"
                      title="คัดลอกสร้างใบใหม่"
                    >
                      <Copy className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => onDeleteQuotation(quotation.id)}
                      className="p-1.5 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title="ลบใบเสนอราคา"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modals */}
      <NumberingSettingsModal
        isOpen={isNumberSettingsOpen}
        onClose={() => setIsNumberSettingsOpen(false)}
        quotations={quotations}
      />

      <CustomerSyncModal
        isOpen={isCustomerSyncOpen}
        onClose={() => setIsCustomerSyncOpen(false)}
        quotations={quotations}
      />
    </div>
  );
};
