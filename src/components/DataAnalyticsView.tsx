import React, { useState, useMemo } from 'react';
import { Quotation, QuotationStatus } from '../types';
import { formatCurrency, formatThaiDate } from '../utils/thaiBahtText';
import { exportQuotationsToCSV, exportDetailedItemsCSV } from '../utils/csvExport';
import { loadPreparedByPresets, SignerPreset } from './QuotationEditor';
import {
  BarChart3,
  Download,
  Upload,
  Calendar,
  DollarSign,
  CheckCircle,
  Clock,
  TrendingUp,
  FileSpreadsheet,
  Building2,
  PieChart,
  Search,
  Filter,
  CheckCircle2,
  FileDown,
  UserCheck,
  Users,
  XCircle,
  RotateCcw,
} from 'lucide-react';

interface DataAnalyticsViewProps {
  quotations: Quotation[];
  onImportQuotations: (imported: Quotation[]) => void;
  onSelectQuotation: (quotation: Quotation) => void;
}

// Helper to get Prepared By name from quotation
export const getQuotationPreparedBy = (q: Quotation): string => {
  const name = q.signatures?.preparedBy?.name;
  if (name && name.trim()) {
    return name.trim();
  }
  return 'ไม่ระบุผู้จัดทำ';
};

// Helper to match preparedBy filter
export const isMatchingPreparedBy = (qPreparedBy: string, filterName: string): boolean => {
  if (!filterName || filterName === 'ALL') return true;
  if (!qPreparedBy) return false;

  const cleanQ = qPreparedBy.toLowerCase().replace(/\s*\(.*\)$/, '').replace(/คุณ/g, '').trim();
  const cleanFilter = filterName.toLowerCase().replace(/\s*\(.*\)$/, '').replace(/คุณ/g, '').trim();

  return (
    qPreparedBy === filterName ||
    cleanQ === cleanFilter ||
    cleanQ.includes(cleanFilter) ||
    cleanFilter.includes(cleanQ)
  );
};

export const DataAnalyticsView: React.FC<DataAnalyticsViewProps> = ({
  quotations,
  onImportQuotations,
  onSelectQuotation,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [preparedByFilter, setPreparedByFilter] = useState<string>('ALL');

  // Dynamic Prepared By Options List
  const preparedByOptions = useMemo(() => {
    const set = new Set<string>();

    // 1. Collect from actual existing quotations
    quotations.forEach((q) => {
      const name = getQuotationPreparedBy(q);
      if (name && name !== 'ไม่ระบุผู้จัดทำ') {
        set.add(name);
      }
    });

    // 2. Collect from presets in system
    try {
      const presets = loadPreparedByPresets();
      presets.forEach((p) => {
        if (p.name) set.add(p.name);
      });
    } catch (e) {
      console.warn('Could not load preparedBy presets:', e);
    }

    return Array.from(set).sort((a, b) => a.localeCompare(b, 'th'));
  }, [quotations]);

  // Prepared By Summary Breakdown (All quotations grouped byPrepared By)
  const preparedByBreakdown = useMemo(() => {
    const map: Record<
      string,
      {
        name: string;
        totalQuotes: number;
        totalRevenue: number;
        paidRevenue: number;
        confirmedRevenue: number;
        draftRevenue: number;
      }
    > = {};

    quotations.forEach((q) => {
      const prepName = getQuotationPreparedBy(q);
      const quoteTotal = q.items.reduce((s, i) => s + i.amount, 0);

      if (!map[prepName]) {
        map[prepName] = {
          name: prepName,
          totalQuotes: 0,
          totalRevenue: 0,
          paidRevenue: 0,
          confirmedRevenue: 0,
          draftRevenue: 0,
        };
      }

      map[prepName].totalQuotes += 1;
      map[prepName].totalRevenue += quoteTotal;
      if (q.status === 'PAID') {
        map[prepName].paidRevenue += quoteTotal;
      } else if (q.status === 'CONFIRMED') {
        map[prepName].confirmedRevenue += quoteTotal;
      } else if (q.status === 'DRAFT') {
        map[prepName].draftRevenue += quoteTotal;
      }
    });

    return Object.values(map).sort((a, b) => b.totalRevenue - a.totalRevenue);
  }, [quotations]);

  // Filtered quotations for analytics, metrics, charts and export
  const filteredQuotations = useMemo(() => {
    return quotations.filter((q) => {
      const s = (searchTerm || '').toLowerCase();
      const matchSearch =
        !s ||
        (q.quoteNumber || '').toLowerCase().includes(s) ||
        (q.customer?.name || '').toLowerCase().includes(s) ||
        (q.jobTitle || '').toLowerCase().includes(s) ||
        (q.customer?.contactPerson || '').toLowerCase().includes(s);

      const matchStatus = statusFilter === 'ALL' || q.status === statusFilter;

      const qPrep = getQuotationPreparedBy(q);
      const matchPreparedBy = isMatchingPreparedBy(qPrep, preparedByFilter);

      return matchSearch && matchStatus && matchPreparedBy;
    });
  }, [quotations, searchTerm, statusFilter, preparedByFilter]);

  // Computed KPI Metrics (Dynamic based on filteredQuotations)
  const metrics = useMemo(() => {
    let totalQuotedValue = 0;
    let paidRevenue = 0;
    let confirmedPendingRevenue = 0;
    let draftValue = 0;
    let paidCount = 0;
    let confirmedCount = 0;

    filteredQuotations.forEach((q) => {
      const quoteTotal = q.items.reduce((s, i) => s + i.amount, 0);
      totalQuotedValue += quoteTotal;

      if (q.status === 'PAID') {
        paidRevenue += quoteTotal;
        paidCount++;
      } else if (q.status === 'CONFIRMED') {
        confirmedPendingRevenue += quoteTotal;
        confirmedCount++;
      } else if (q.status === 'DRAFT') {
        draftValue += quoteTotal;
      }
    });

    const activeCount = filteredQuotations.length;
    const conversionRate = activeCount > 0 ? ((paidCount + confirmedCount) / activeCount) * 100 : 0;

    return {
      totalQuotedValue,
      paidRevenue,
      confirmedPendingRevenue,
      draftValue,
      totalCount: activeCount,
      paidCount,
      confirmedCount,
      conversionRate,
    };
  }, [filteredQuotations]);

  // Room / Resource Breakdown (Dynamic based on filteredQuotations)
  const resourceBreakdown = useMemo(() => {
    const map: Record<string, { count: number; totalRevenue: number }> = {};

    filteredQuotations.forEach((q) => {
      q.items.forEach((item) => {
        // Group by simplified key
        let key = item.description || '';
        if (key.includes('X11.2')) key = 'ห้องประชุม X11.2 (ชั้น 11)';
        else if (key.includes('Auditorium')) key = 'ห้อง Auditorium (ชั้น 7)';
        else if (key.includes('X10.1')) key = 'ห้อง Workshop X10.1 (ชั้น 10)';
        else if (key.includes('Boardroom')) key = 'ห้องประชุม Boardroom X14';
        else if (key.includes('ทีวี')) key = 'จอทีวี 55 นิ้ว';
        else if (key.includes('โปรเจคเตอร์')) key = 'ชุดโปรเจคเตอร์';
        else if (key.includes('เครื่องเสียง')) key = 'ชุดเครื่องเสียง';
        else if (key.includes('จั๊มไฟ')) key = 'ค่าจั๊มไฟ/เบรคเกอร์';

        if (!map[key]) {
          map[key] = { count: 0, totalRevenue: 0 };
        }
        map[key].count += item.quantity;
        map[key].totalRevenue += item.amount;
      });
    });

    return Object.entries(map).sort((a, b) => b[1].totalRevenue - a[1].totalRevenue);
  }, [filteredQuotations]);

  // Top Customers Breakdown (Dynamic based on filteredQuotations)
  const topCustomers = useMemo(() => {
    const map: Record<string, { name: string; quotesCount: number; totalAmount: number; status: string }> = {};

    filteredQuotations.forEach((q) => {
      const name = q.customer.name;
      const total = q.items.reduce((s, i) => s + i.amount, 0);

      if (!map[name]) {
        map[name] = { name, quotesCount: 0, totalAmount: 0, status: q.status };
      }
      map[name].quotesCount += 1;
      map[name].totalAmount += total;
    });

    return Object.values(map).sort((a, b) => b.totalAmount - a.totalAmount);
  }, [filteredQuotations]);

  // Handle JSON Import
  const handleJSONImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          if (Array.isArray(parsed)) {
            onImportQuotations(parsed);
            alert(`นำเข้าข้อมูลใบเสนอราคาสำเร็จ ${parsed.length} รายการ`);
          } else {
            alert('รูปแบบไฟล์ JSON ไม่ถูกต้อง (ต้องเป็น array ของใบเสนอราคา)');
          }
        } catch (err) {
          alert('เกิดข้อผิดพลาดในการอ่านไฟล์ JSON');
        }
      };
      reader.readAsText(file);
    }
  };

  // Handle JSON Export Backup
  const handleJSONBackup = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(quotations, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `kx_quotations_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const hasActiveFilters = preparedByFilter !== 'ALL' || statusFilter !== 'ALL' || searchTerm.trim() !== '';

  const handleResetFilters = () => {
    setPreparedByFilter('ALL');
    setStatusFilter('ALL');
    setSearchTerm('');
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Master Filter Bar */}
      <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-2xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-neutral-900 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-neutral-800" />
              สรุปข้อมูลและประมวลผล (Analytics & Data Hub)
            </h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              ภาพรวมมูลค่าใบเสนอราคา สถิติการใช้ห้องประชุม และเครื่องมือส่งออกข้อมูลตามผู้จัดทำ
            </p>
          </div>

          {/* Data Processing & Export Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => exportQuotationsToCSV(filteredQuotations, 'kx_quotations_summary.csv')}
              className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              title="ส่งออกสรุปใบเสนอราคาเป็นไฟล์ Excel CSV (รองรับภาษาไทย)"
            >
              <FileSpreadsheet className="w-4 h-4" />
              ส่งออก CSV สรุปงาน ({filteredQuotations.length})
            </button>

            <button
              onClick={() => exportDetailedItemsCSV(filteredQuotations, 'kx_quotations_items.csv')}
              className="px-3.5 py-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="ส่งออกรายละเอียดรายบรรทัดค่าห้องและอุปกรณ์เสริม"
            >
              <FileDown className="w-4 h-4" />
              ส่งออก CSV รายการย่อย
            </button>

            <button
              onClick={handleJSONBackup}
              className="px-3 py-2 border border-neutral-300 hover:bg-neutral-50 text-neutral-700 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
              title="สำรองข้อมูลทั้งหมดในรูปแบบ JSON"
            >
              <Download className="w-3.5 h-3.5" />
              สำรอง JSON
            </button>

            <label className="px-3 py-2 border border-neutral-300 hover:bg-neutral-50 text-neutral-700 rounded-lg text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-colors">
              <Upload className="w-3.5 h-3.5" />
              <span>นำเข้า JSON</span>
              <input
                type="file"
                accept=".json"
                onChange={handleJSONImport}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Global Filter Bar for Summary & Reports */}
        <div className="pt-3 border-t border-neutral-100 flex flex-wrap items-center justify-between gap-3 bg-neutral-50/70 p-3 rounded-lg border border-neutral-200/80">
          <div className="flex flex-wrap items-center gap-3">
            {/* Prepared By Filter Selector */}
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-neutral-800 flex items-center gap-1.5 shrink-0">
                <UserCheck className="w-4 h-4 text-blue-600" />
                <span>ผู้จัดทำ (Prepared By):</span>
              </label>
              <select
                value={preparedByFilter}
                onChange={(e) => setPreparedByFilter(e.target.value)}
                className="px-3 py-1.5 bg-white border border-blue-300 rounded-lg text-xs font-semibold text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs cursor-pointer min-w-[180px]"
              >
                <option value="ALL">👤 ผู้จัดทำทั้งหมด ({quotations.length} รายการ)</option>
                {preparedByOptions.map((name) => {
                  const count = quotations.filter((q) => isMatchingPreparedBy(getQuotationPreparedBy(q), name)).length;
                  return (
                    <option key={name} value={name}>
                      👤 {name} ({count} ใบ)
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Status Filter Selector */}
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-neutral-700 shrink-0">
                สถานะเอกสาร:
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-2.5 py-1.5 border border-neutral-300 rounded-lg text-xs focus:outline-none bg-white font-medium"
              >
                <option value="ALL">สถานะทั้งหมด</option>
                <option value="DRAFT">ร่าง (Draft)</option>
                <option value="SENT">ส่งแล้ว (Sent)</option>
                <option value="CONFIRMED">ลูกค้าคอนเฟิร์มแล้ว (Confirmed)</option>
                <option value="PAID">ชำระเงินแล้ว (Paid)</option>
                <option value="COMPLETED">เสร็จสิ้น (Completed)</option>
                <option value="CANCELLED">ยกเลิก (Cancelled)</option>
              </select>
            </div>

            {/* Clear Filter Button */}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="px-2.5 py-1.5 text-xs text-rose-700 hover:text-rose-900 hover:bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                title="ล้างการเลือกตัวกรองทั้งหมด"
              >
                <RotateCcw className="w-3 h-3 text-rose-600" />
                <span>ล้างตัวกรอง</span>
              </button>
            )}
          </div>

          <div className="text-xs font-medium text-neutral-500">
            แสดงสรุปผล <span className="font-bold text-neutral-900 font-mono">{filteredQuotations.length}</span> จาก <span className="font-mono">{quotations.length}</span> ใบเสนอราคา
          </div>
        </div>

        {/* Active Filter Indicator Badge */}
        {preparedByFilter !== 'ALL' && (
          <div className="px-3.5 py-2 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between text-xs text-blue-900 animate-fade-in">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
              <span>
                กำลังสรุปผลข้อมูลเฉพาะผู้จัดทำ: <strong>"{preparedByFilter}"</strong> (พบ {filteredQuotations.length} รายการ)
              </span>
            </div>
            <button
              onClick={() => setPreparedByFilter('ALL')}
              className="text-blue-700 hover:text-blue-900 font-semibold underline text-[11px] cursor-pointer"
            >
              แสดงของผู้จัดทำทั้งหมด
            </button>
          </div>
        )}
      </div>

      {/* Prepared By Sales Breakdown Selector Cards */}
      <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-2xs space-y-3">
        <div className="flex items-center justify-between border-b border-neutral-100 pb-2.5">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-600" />
            <h3 className="font-bold text-neutral-800 text-sm">
              สรุปยอดผลงานแยกตามผู้จัดทำ (Sales & Staff Performance)
            </h3>
          </div>
          <span className="text-xs text-neutral-400">
            คลิกที่การ์ดเพื่อเลือกดูข้อมูลเฉพาะบุคคล
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {/* All Staff Card */}
          <button
            type="button"
            onClick={() => setPreparedByFilter('ALL')}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
              preparedByFilter === 'ALL'
                ? 'bg-blue-600 text-white border-blue-600 shadow-md ring-2 ring-blue-300'
                : 'bg-neutral-50 hover:bg-neutral-100 text-neutral-800 border-neutral-200'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold truncate">👥 ผู้จัดทำทั้งหมด</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  preparedByFilter === 'ALL' ? 'bg-blue-700 text-white' : 'bg-neutral-200 text-neutral-700'
                }`}
              >
                {quotations.length} ใบ
              </span>
            </div>
            <div className="text-lg font-bold font-mono">
              ฿{formatCurrency(quotations.reduce((sum, q) => sum + q.items.reduce((s, i) => s + i.amount, 0), 0))}
            </div>
            <div className={`text-[10.5px] mt-1 ${preparedByFilter === 'ALL' ? 'text-blue-100' : 'text-neutral-500'}`}>
              ยอดรวมทั้งศูนย์ KX
            </div>
          </button>

          {/* Individual Staff Cards */}
          {preparedByBreakdown.map((staff) => {
            const isSelected = isMatchingPreparedBy(staff.name, preparedByFilter);

            return (
              <button
                key={staff.name}
                type="button"
                onClick={() => setPreparedByFilter(staff.name)}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-blue-600 text-white border-blue-600 shadow-md ring-2 ring-blue-300'
                    : 'bg-white hover:bg-neutral-50 text-neutral-800 border-neutral-200 hover:border-blue-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold truncate flex items-center gap-1">
                    <span>👤</span>
                    <span>{staff.name}</span>
                  </span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      isSelected ? 'bg-blue-700 text-white' : 'bg-blue-50 text-blue-800 border border-blue-200'
                    }`}
                  >
                    {staff.totalQuotes} ใบ
                  </span>
                </div>
                <div className="text-base font-bold font-mono">
                  ฿{formatCurrency(staff.totalRevenue)}
                </div>
                <div
                  className={`text-[10.5px] mt-1 flex items-center justify-between ${
                    isSelected ? 'text-blue-100' : 'text-neutral-500'
                  }`}
                >
                  <span>ชำระแล้ว: ฿{formatCurrency(staff.paidRevenue)}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* KPI Metric Cards (Updated dynamically by Prepared By) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Quoted */}
        <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-2xs">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">
              มูลค่าใบเสนอราคารวม {preparedByFilter !== 'ALL' && `(${preparedByFilter})`}
            </span>
            <div className="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-700">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-neutral-900">
            ฿{formatCurrency(metrics.totalQuotedValue)}
          </div>
          <div className="text-xs text-neutral-500 mt-1 flex items-center gap-1">
            <span>ทั้งหมด {metrics.totalCount} ฉบับ</span>
          </div>
        </div>

        {/* Card 2: Paid Revenue */}
        <div className="bg-white p-4 rounded-xl border border-emerald-200 bg-emerald-50/20 shadow-2xs">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
              ยอดชำระเงินแล้ว (Paid)
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-800">
            ฿{formatCurrency(metrics.paidRevenue)}
          </div>
          <div className="text-xs text-emerald-600 mt-1">
            {metrics.paidCount} งานที่มีสลิปและโอนเงินครบถ้วน
          </div>
        </div>

        {/* Card 3: Confirmed / Pending Collection */}
        <div className="bg-white p-4 rounded-xl border border-blue-200 bg-blue-50/20 shadow-2xs">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-800">
              รอยืนยันชำระเงิน
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-700">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-blue-800">
            ฿{formatCurrency(metrics.confirmedPendingRevenue)}
          </div>
          <div className="text-xs text-blue-600 mt-1">
            {metrics.confirmedCount} งานที่ลงนามแล้ว รอสลิปโอนเงิน
          </div>
        </div>

        {/* Card 4: Conversion Rate */}
        <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-2xs">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">
              อัตราคอนเฟิร์มงาน (Rate)
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-700">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-neutral-900">
            {metrics.conversionRate.toFixed(1)}%
          </div>
          <div className="text-xs text-neutral-500 mt-1">
            สัดส่วนงานที่ลูกค้ายืนยันหรือชำระแล้ว
          </div>
        </div>
      </div>

      {/* Analytics Charts & Breakdowns Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. สถิติการใช้งานห้องและอุปกรณ์เสริม */}
        <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
            <h3 className="font-bold text-neutral-800 text-sm flex items-center gap-2">
              <Building2 className="w-4 h-4 text-neutral-700" />
              สรุปการจองห้องและบริการเสริม (Facility Utilization)
            </h3>
            <span className="text-xs text-neutral-400">เรียงตามมูลค่ารวม</span>
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
            {resourceBreakdown.length === 0 ? (
              <div className="text-center py-8 text-neutral-400 text-xs">
                ไม่มีข้อมูลการจองห้องสำหรับตัวกรองนี้
              </div>
            ) : (
              resourceBreakdown.map(([resourceName, data], index) => {
                const percent =
                  metrics.totalQuotedValue > 0
                    ? (data.totalRevenue / metrics.totalQuotedValue) * 100
                    : 0;

                return (
                  <div key={resourceName} className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-neutral-800">
                        {index + 1}. {resourceName}
                      </span>
                      <span className="font-mono text-neutral-600">
                        ฿{formatCurrency(data.totalRevenue)} ({data.count} ครั้ง)
                      </span>
                    </div>
                    <div className="w-full bg-neutral-100 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-neutral-800 h-full rounded-full transition-all"
                        style={{ width: `${Math.min(100, percent)}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* 2. อันดับลูกค้าตามยอดการจอง */}
        <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
            <h3 className="font-bold text-neutral-800 text-sm flex items-center gap-2">
              <PieChart className="w-4 h-4 text-neutral-700" />
              ลูกค้ายอดจองสูงสุด (Top Clients)
            </h3>
            <span className="text-xs text-neutral-400">{topCustomers.length} องค์กร</span>
          </div>

          <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
            {topCustomers.length === 0 ? (
              <div className="text-center py-8 text-neutral-400 text-xs">
                ไม่มีข้อมูลลูกค้าสำหรับตัวกรองนี้
              </div>
            ) : (
              topCustomers.map((client, index) => (
                <div
                  key={client.name}
                  className="p-2.5 bg-neutral-50 rounded-lg border border-neutral-200/60 flex items-center justify-between hover:bg-neutral-100/70 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-5 text-center font-bold text-neutral-400 text-xs">
                      #{index + 1}
                    </span>
                    <div>
                      <div className="text-xs font-semibold text-neutral-900 line-clamp-1">
                        {client.name}
                      </div>
                      <div className="text-[11px] text-neutral-500">
                        {client.quotesCount} ใบเสนอราคา
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-xs font-bold font-mono text-neutral-900">
                      ฿{formatCurrency(client.totalAmount)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Filterable Data Table for Custom Processing */}
      <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-2xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-100 pb-3">
          <div>
            <h3 className="font-bold text-neutral-800 text-sm">
              ตารางข้อมูลใบเสนอราคาสำหรับตรวจสอบ (Data Records)
            </h3>
            <p className="text-xs text-neutral-500">
              พบ {filteredQuotations.length} จาก {quotations.length} รายการ
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-neutral-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="ค้นหาเลขที่, ลูกค้า, งาน..."
                className="pl-8 pr-3 py-1.5 border border-neutral-300 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-neutral-800 w-48 sm:w-60"
              />
            </div>

            {/* Filter by Prepared By inside table header */}
            <select
              value={preparedByFilter}
              onChange={(e) => setPreparedByFilter(e.target.value)}
              className="px-2.5 py-1.5 border border-blue-300 rounded-lg text-xs font-semibold text-blue-900 focus:outline-none bg-white"
            >
              <option value="ALL">ผู้จัดทำทั้งหมด</option>
              {preparedByOptions.map((name) => (
                <option key={name} value={name}>
                  👤 {name}
                </option>
              ))}
            </select>

            {/* Filter by Status */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 border border-neutral-300 rounded-lg text-xs focus:outline-none bg-white font-medium"
            >
              <option value="ALL">สถานะทั้งหมด</option>
              <option value="DRAFT">ร่าง (Draft)</option>
              <option value="SENT">ส่งแล้ว (Sent)</option>
              <option value="CONFIRMED">ลูกค้าคอนเฟิร์มแล้ว (Confirmed)</option>
              <option value="PAID">ชำระเงินแล้ว (Paid)</option>
              <option value="COMPLETED">เสร็จสิ้น (Completed)</option>
              <option value="CANCELLED">ยกเลิก (Cancelled)</option>
            </select>
          </div>
        </div>

        {/* Records Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-neutral-200 text-neutral-500 font-semibold bg-neutral-50/50">
                <th className="py-2.5 px-2">เลขที่</th>
                <th className="py-2.5 px-2">วันที่ออก</th>
                <th className="py-2.5 px-3">ผู้จัดทำ</th>
                <th className="py-2.5 px-3">ลูกค้า / องค์กร</th>
                <th className="py-2.5 px-3">ชื่องาน</th>
                <th className="py-2.5 px-2 text-right">ยอดรวม (บาท)</th>
                <th className="py-2.5 px-2 text-center">สถานะ</th>
                <th className="py-2.5 px-2 text-center">สลิปการโอน</th>
                <th className="py-2.5 px-2 text-right">การจัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filteredQuotations.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-10 text-neutral-400 text-xs">
                    ไม่พบใบเสนอราคาที่ตรงกับตัวกรองที่เลือก
                  </td>
                </tr>
              ) : (
                filteredQuotations.map((q) => {
                  const total = q.items.reduce((s, i) => s + i.amount, 0);
                  const qPrep = getQuotationPreparedBy(q);

                  const statusColorMap: Record<string, string> = {
                    DRAFT: 'bg-slate-100 text-slate-700',
                    SENT: 'bg-blue-50 text-blue-700 border border-blue-200',
                    CONFIRMED: 'bg-indigo-50 text-indigo-700 border border-indigo-200',
                    PAID: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
                    COMPLETED: 'bg-teal-50 text-teal-700 border border-teal-200',
                    CANCELLED: 'bg-rose-50 text-rose-700 border border-rose-200',
                  };

                  return (
                    <tr key={q.id} className="hover:bg-neutral-50/80 transition-colors">
                      <td className="py-2.5 px-2 font-mono font-semibold text-neutral-800">
                        {q.quoteNumber}
                      </td>
                      <td className="py-2.5 px-2 text-neutral-500">
                        {formatThaiDate(q.issueDate, 'short')}
                      </td>
                      <td className="py-2.5 px-3 text-neutral-800">
                        <span className="inline-flex items-center gap-1 font-semibold text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-100 text-[11px]">
                          👤 {qPrep}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-medium text-neutral-900">
                        {q.customer.name}
                      </td>
                      <td className="py-2.5 px-3 text-neutral-600 line-clamp-1">
                        {q.jobTitle}
                      </td>
                      <td className="py-2.5 px-2 text-right font-mono font-bold text-neutral-800">
                        {formatCurrency(total)}
                      </td>
                      <td className="py-2.5 px-2 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold inline-block ${statusColorMap[q.status] || 'bg-neutral-100 text-neutral-600'}`}>
                          {q.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-2 text-center">
                        {q.paymentSlip ? (
                          <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded text-[10px] font-medium inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> แนบแล้ว
                          </span>
                        ) : (
                          <span className="text-neutral-400 text-[10px]">-</span>
                        )}
                      </td>
                      <td className="py-2.5 px-2 text-right">
                        <button
                          onClick={() => onSelectQuotation(q)}
                          className="px-2.5 py-1 text-xs font-semibold text-neutral-700 hover:text-neutral-900 bg-neutral-100 hover:bg-neutral-200 rounded transition-colors cursor-pointer"
                        >
                          ดูเอกสาร
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
