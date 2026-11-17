import React, { useState } from 'react';
import {
  WorkspaceApp,
  Quotation,
} from '../types';
import {
  ExternalLink,
  RefreshCw,
  ArrowLeft,
  FileText,
  Receipt,
  Calendar,
  Users,
  Building2,
  CheckCircle2,
  Clock,
  Layers,
  Sparkles,
  ArrowUpRight,
  ShieldCheck,
  Search,
  Plus,
} from 'lucide-react';
import { APP_ICONS } from './Sidebar';
import { formatCurrency, formatThaiDate } from '../utils/thaiBahtText';

interface AppWorkspaceViewProps {
  app: WorkspaceApp;
  onBackToQuotation: () => void;
  quotations: Quotation[];
  onSelectQuotation?: (q: Quotation) => void;
}

export const AppWorkspaceView: React.FC<AppWorkspaceViewProps> = ({
  app,
  onBackToQuotation,
  quotations,
  onSelectQuotation,
}) => {
  const [iframeKey, setIframeKey] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');

  const AppIcon = APP_ICONS[app.iconName] || Layers;

  // Confirmed / Paid quotations for Invoicing module
  const billableQuotations = quotations.filter(
    (q) => q.status === 'CONFIRMED' || q.status === 'PAID' || q.status === 'COMPLETED'
  );

  // Corporate Customers extracted from quotations for CRM module
  const uniqueCustomers = React.useMemo(() => {
    const map = new Map<string, {
      name: string;
      taxId: string;
      address: string;
      contactPerson?: string;
      phone?: string;
      email?: string;
      quoteCount: number;
      totalSpend: number;
      lastDate: string;
    }>();

    quotations.forEach((q) => {
      const name = q.customer?.name?.trim();
      if (!name) return;
      const existing = map.get(name);
      const total = q.items.reduce((sum, it) => sum + (it.amount || 0), 0);
      if (existing) {
        existing.quoteCount += 1;
        existing.totalSpend += total;
        if (q.issueDate > existing.lastDate) {
          existing.lastDate = q.issueDate;
        }
      } else {
        map.set(name, {
          name,
          taxId: q.customer.taxId || '-',
          address: q.customer.address || '-',
          contactPerson: q.customer.contactPerson,
          phone: q.customer.mobile || q.customer.phone,
          email: q.customer.email,
          quoteCount: 1,
          totalSpend: total,
          lastDate: q.issueDate,
        });
      }
    });

    return Array.from(map.values()).sort((a, b) => b.totalSpend - a.totalSpend);
  }, [quotations]);

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-neutral-100 min-h-screen">
      {/* App Workspace Top Bar */}
      <header className="bg-white border-b border-neutral-200 px-4 sm:px-6 py-3.5 flex items-center justify-between gap-3 sticky top-0 z-20 shadow-2xs">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onBackToQuotation}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-200 text-xs font-semibold text-neutral-700 hover:text-neutral-900 hover:bg-neutral-50 transition-colors cursor-pointer shrink-0"
            title="กลับไปที่แอพ Quotation"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">กลับไปที่ Quotation</span>
          </button>

          <div className="h-5 w-px bg-neutral-200 hidden sm:block shrink-0" />

          <div className="flex items-center gap-2.5 min-w-0">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${app.color || 'bg-neutral-100 text-neutral-800 border-neutral-200'}`}>
              <AppIcon className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-sm text-neutral-900 truncate">
                  {app.name}
                </h1>
                {app.badge && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded font-bold bg-neutral-100 text-neutral-700 border border-neutral-200 shrink-0">
                    {app.badge}
                  </span>
                )}
              </div>
              {app.subtitle && (
                <p className="text-[11px] text-neutral-500 truncate">{app.subtitle}</p>
              )}
            </div>
          </div>
        </div>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          {app.type === 'iframe' && app.url && (
            <button
              onClick={() => setIframeKey((prev) => prev + 1)}
              className="p-2 rounded-lg border border-neutral-200 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50 transition-colors cursor-pointer"
              title="รีเฟรชหน้าเว็บ"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          )}

          {app.url && (
            <a
              href={app.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-900 text-white text-xs font-bold hover:bg-neutral-800 transition-colors cursor-pointer"
            >
              <span>เปิดในแท็บใหม่</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      </header>

      {/* Main Content Body */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
        {/* Case 1: Embedded iFrame App */}
        {app.type === 'iframe' && app.url && (
          <div className="w-full h-[calc(100vh-140px)] min-h-[600px] bg-white rounded-2xl border border-neutral-200 overflow-hidden shadow-xs flex flex-col">
            <iframe
              key={iframeKey}
              src={app.url}
              title={app.name}
              className="w-full h-full flex-1 border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
            />
          </div>
        )}

        {/* Case 2: External Link App */}
        {app.type === 'link' && (
          <div className="bg-white rounded-2xl border border-neutral-200 p-8 sm:p-12 text-center max-w-xl mx-auto space-y-5 shadow-xs">
            <div className={`w-16 h-16 rounded-2xl mx-auto flex items-center justify-center border ${app.color || 'bg-neutral-100 text-neutral-800 border-neutral-200'}`}>
              <AppIcon className="w-8 h-8" />
            </div>
            <div className="space-y-1.5">
              <h2 className="text-xl font-bold text-neutral-900">{app.name}</h2>
              <p className="text-xs text-neutral-500">{app.subtitle || 'แอพพลิเคชันภายนอกระบบ'}</p>
              {app.description && (
                <p className="text-xs text-neutral-600 pt-2">{app.description}</p>
              )}
            </div>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
              <a
                href={app.url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-6 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all"
              >
                <span>เปิดใช้งาน {app.name}</span>
                <ArrowUpRight className="w-4 h-4" />
              </a>
              <button
                onClick={onBackToQuotation}
                className="w-full sm:w-auto px-5 py-2.5 border border-neutral-200 hover:bg-neutral-50 text-neutral-700 rounded-xl text-xs font-semibold cursor-pointer"
              >
                กลับไปที่ Quotation
              </button>
            </div>
          </div>
        )}

        {/* Case 3: Native Built-in Modules */}
        {app.type === 'native' && app.id === 'invoice' && (
          <div className="space-y-6">
            {/* Header banner */}
            <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="p-1 rounded bg-blue-100 text-blue-900">
                    <Receipt className="w-4 h-4" />
                  </span>
                  <h2 className="text-base font-bold text-neutral-900">Invoice & Billing Manager</h2>
                  <span className="text-[10px] bg-blue-50 text-blue-800 border border-blue-200 px-2 py-0.5 rounded font-bold">
                    เชื่อมต่อข้อมูล Quotation
                  </span>
                </div>
                <p className="text-xs text-neutral-600">
                  ระบบออกใบแจ้งหนี้ ใบวางบิล และใบเสร็จรับเงินที่ดึงข้อมูลจากใบเสนอราคาที่ลูกค้าอนุมัติแล้ว
                </p>
              </div>

              <button
                onClick={onBackToQuotation}
                className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>ไปที่รายการใบเสนอราคา</span>
              </button>
            </div>

            {/* Invoicing Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-2xs">
                <p className="text-xs text-neutral-500 font-medium">ใบเสนอราคาที่ยืนยันแล้ว (พร้อมออกบิล)</p>
                <p className="text-2xl font-bold text-neutral-900 mt-1">{billableQuotations.length} รายการ</p>
                <p className="text-[11px] text-emerald-600 mt-1 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> ยืนยันจากลูกค้าเรียบร้อย
                </p>
              </div>

              <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-2xs">
                <p className="text-xs text-neutral-500 font-medium">ยอดเงินรวมที่พร้อมวางบิล</p>
                <p className="text-2xl font-bold text-blue-700 mt-1">
                  ฿{formatCurrency(billableQuotations.reduce((sum, q) => sum + q.items.reduce((s, it) => s + it.amount, 0), 0))}
                </p>
                <p className="text-[11px] text-neutral-500 mt-1">คำนวณจากยอดสุทธิในใบเสนอราคา</p>
              </div>

              <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-2xs">
                <p className="text-xs text-neutral-500 font-medium">สลิปการชำระเงินที่แนบแล้ว</p>
                <p className="text-2xl font-bold text-neutral-900 mt-1">
                  {quotations.filter((q) => q.paymentSlip).length} รายการ
                </p>
                <p className="text-[11px] text-emerald-600 mt-1 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> ตรวจสอบสลิปผ่านระบบ
                </p>
              </div>
            </div>

            {/* List of billable quotations */}
            <div className="bg-white rounded-2xl border border-neutral-200 shadow-2xs overflow-hidden">
              <div className="p-4 border-b border-neutral-200 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-xs text-neutral-900">รายการใบเสนอราคาที่พร้อมวางบิล / ออกใบแจ้งหนี้</h3>
                  <p className="text-[11px] text-neutral-500">คลิกที่รายการเพื่อดูเอกสารหรือดำเนินการต่อ</p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-neutral-200 bg-neutral-50 text-neutral-600 font-semibold">
                      <th className="py-2.5 px-4">เลขที่ใบเสนอราคา</th>
                      <th className="py-2.5 px-4">ลูกค้า / หน่วยงาน</th>
                      <th className="py-2.5 px-4">ชื่องาน</th>
                      <th className="py-2.5 px-4">วันที่ออก</th>
                      <th className="py-2.5 px-4 text-right">ยอดสุทธิ</th>
                      <th className="py-2.5 px-4 text-center">การดำเนินการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {billableQuotations.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-neutral-400">
                          ยังไม่มีใบเสนอราคาในสถานะยืนยันหรือชำระเงินแล้ว
                        </td>
                      </tr>
                    ) : (
                      billableQuotations.map((q) => {
                        const total = q.items.reduce((sum, it) => sum + it.amount, 0);
                        return (
                          <tr key={q.id} className="hover:bg-neutral-50 transition-colors">
                            <td className="py-3 px-4 font-bold text-neutral-900">{q.quoteNumber}</td>
                            <td className="py-3 px-4 text-neutral-800">{q.customer.name}</td>
                            <td className="py-3 px-4 text-neutral-600 truncate max-w-xs">{q.jobTitle}</td>
                            <td className="py-3 px-4 text-neutral-500 tabular-nums">{formatThaiDate(q.issueDate)}</td>
                            <td className="py-3 px-4 text-right font-bold text-neutral-900 tabular-nums">
                              ฿{formatCurrency(total)}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <button
                                onClick={() => {
                                  if (onSelectQuotation) {
                                    onSelectQuotation(q);
                                  } else {
                                    onBackToQuotation();
                                  }
                                }}
                                className="px-3 py-1 bg-neutral-100 hover:bg-neutral-900 hover:text-white rounded-lg text-[11px] font-semibold transition-colors cursor-pointer"
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
        )}

        {/* Case 4: Native Customer CRM Module */}
        {app.type === 'native' && app.id === 'crm' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="p-1 rounded bg-purple-100 text-purple-900">
                    <Users className="w-4 h-4" />
                  </span>
                  <h2 className="text-base font-bold text-neutral-900">Customer CRM Directory</h2>
                  <span className="text-[10px] bg-purple-50 text-purple-800 border border-purple-200 px-2 py-0.5 rounded font-bold">
                    {uniqueCustomers.length} องค์กร
                  </span>
                </div>
                <p className="text-xs text-neutral-600">
                  ฐานข้อมูลลูกค้าองค์กรและประวัติการใช้บริการที่รวบรวมจากใบเสนอราคาทั้งหมด
                </p>
              </div>

              {/* Search Box */}
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="ค้นหาชื่อลูกค้า, ผู้ติดต่อ..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs border border-neutral-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-neutral-900"
                />
              </div>
            </div>

            {/* Customers Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {uniqueCustomers
                .filter((c) =>
                  !searchTerm.trim() ||
                  c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  (c.contactPerson && c.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()))
                )
                .map((customer) => (
                  <div
                    key={customer.name}
                    className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-2xs hover:shadow-xs transition-shadow space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 border border-purple-200 flex items-center justify-center font-bold text-sm shrink-0">
                        {customer.name.slice(0, 2)}
                      </div>
                      <span className="text-[10px] bg-neutral-100 text-neutral-700 px-2 py-0.5 rounded-full font-bold">
                        {customer.quoteCount} ใบเสนอราคา
                      </span>
                    </div>

                    <div>
                      <h4 className="font-bold text-xs text-neutral-900 line-clamp-1">{customer.name}</h4>
                      <p className="text-[11px] text-neutral-500 mt-0.5 line-clamp-2">{customer.address}</p>
                    </div>

                    <div className="pt-2 border-t border-neutral-100 text-[11px] space-y-1 text-neutral-600">
                      {customer.contactPerson && (
                        <p><span className="text-neutral-400">ผู้ติดต่อ:</span> {customer.contactPerson}</p>
                      )}
                      {customer.phone && (
                        <p><span className="text-neutral-400">โทร:</span> {customer.phone}</p>
                      )}
                      <p className="pt-1 font-semibold text-neutral-900">
                        <span className="text-neutral-400 font-normal">ยอดรวม:</span> ฿{formatCurrency(customer.totalSpend)}
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Case 5: Native Venue & Room Booking Module */}
        {app.type === 'native' && app.id === 'booking' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="p-1 rounded bg-emerald-100 text-emerald-900">
                    <Calendar className="w-4 h-4" />
                  </span>
                  <h2 className="text-base font-bold text-neutral-900">KX Venue & Room Booking</h2>
                  <span className="text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded font-bold">
                    อาคารเคเอกซ์
                  </span>
                </div>
                <p className="text-xs text-neutral-600">
                  ปฏิทินตรวจสอบห้องสัมมนา ห้องประชุม และพื้นที่จัดงาน พร้อมอ้างอิงใบเสนอราคา
                </p>
              </div>

              <button
                onClick={onBackToQuotation}
                className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>สร้างใบเสนอราคาจองห้อง</span>
              </button>
            </div>

            {/* Room Categories */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { name: 'ห้องสัมมนา X11.1 - X11.4', floor: 'ชั้น 11', cap: '40 - 150 ท่าน', tag: 'ยอดนิยม' },
                { name: 'ห้องประชุมขนาดใหญ่ FL.7', floor: 'ชั้น 7', cap: '80 - 200 ท่าน', tag: 'Conference' },
                { name: 'พื้นที่จัดแสดง Exhibition FL.1', floor: 'ชั้น 1', cap: '150 - 300 ท่าน', tag: 'Hall' },
                { name: 'ห้องประชุม Executive FL.17', floor: 'ชั้น 17', cap: '20 - 50 ท่าน', tag: 'VIP' },
              ].map((room) => (
                <div key={room.name} className="bg-white p-4 rounded-xl border border-neutral-200 shadow-2xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                      {room.tag}
                    </span>
                    <span className="text-xs font-bold text-neutral-500">{room.floor}</span>
                  </div>
                  <h4 className="font-bold text-xs text-neutral-900">{room.name}</h4>
                  <p className="text-[11px] text-neutral-500">ความจุ: {room.cap}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Case 6: Custom Added App (General) */}
        {app.type === 'native' && !['invoice', 'crm', 'booking'].includes(app.id) && (
          <div className="bg-white rounded-2xl border border-neutral-200 p-8 text-center max-w-xl mx-auto space-y-5 shadow-xs">
            <div className={`w-16 h-16 rounded-2xl mx-auto flex items-center justify-center border ${app.color || 'bg-neutral-100 text-neutral-800 border-neutral-200'}`}>
              <AppIcon className="w-8 h-8" />
            </div>
            <div className="space-y-1.5">
              <h2 className="text-xl font-bold text-neutral-900">{app.name}</h2>
              <p className="text-xs text-neutral-500">{app.subtitle || 'เครื่องมือประจำเวิร์กสเปซ'}</p>
              {app.description && (
                <p className="text-xs text-neutral-600 pt-2">{app.description}</p>
              )}
            </div>

            <div className="pt-4 flex items-center justify-center gap-3">
              <button
                onClick={onBackToQuotation}
                className="px-5 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                กลับไปที่ Quotation
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
