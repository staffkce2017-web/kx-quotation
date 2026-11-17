import React, { useState, useEffect } from 'react';
import { CustomerRecord, CustomerSyncConfig } from '../types';
import {
  fetchCustomerDataFromUrl,
  loadSyncConfig,
  mergeCustomers,
  parseCustomerData,
  saveCustomers,
  saveSyncConfig,
  DEFAULT_CUSTOMERS,
  normalizeCustomerCode,
} from '../utils/customerSync';
import {
  Link2,
  Upload,
  Database,
  Search,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  X,
  Users,
  Phone,
  MapPin,
  ClipboardPaste,
  RotateCcw,
  Sparkles,
  Plus,
  Edit2,
  Trash2,
  Save,
  Check,
} from 'lucide-react';

interface CustomerSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCustomer?: (customer: CustomerRecord) => void;
  customers: CustomerRecord[];
  onCustomersUpdated: (updated: CustomerRecord[]) => void;
}

export const CustomerSyncModal: React.FC<CustomerSyncModalProps> = ({
  isOpen,
  onClose,
  onSelectCustomer,
  customers,
  onCustomersUpdated,
}) => {
  const [activeTab, setActiveTab] = useState<'link' | 'file' | 'paste' | 'list'>('link');

  // Link state
  const [syncConfig, setSyncConfig] = useState<CustomerSyncConfig>(loadSyncConfig);
  const [sheetUrl, setSheetUrl] = useState(syncConfig.sheetUrl || '');
  const [isFetching, setIsFetching] = useState(false);
  const [syncMessage, setSyncMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Paste text state
  const [pastedText, setPastedText] = useState('');
  const [pastePreviewCount, setPastePreviewCount] = useState<number | null>(null);

  // Search in list
  const [searchQuery, setSearchQuery] = useState('');

  // Editing & adding state
  const [editingCustomer, setEditingCustomer] = useState<CustomerRecord | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editFormData, setEditFormData] = useState<Partial<CustomerRecord>>({});

  // Recently imported preview
  const [recentImported, setRecentImported] = useState<CustomerRecord[] | null>(null);

  useEffect(() => {
    if (isOpen) {
      const cfg = loadSyncConfig();
      setSyncConfig(cfg);
      if (cfg.sheetUrl) {
        setSheetUrl(cfg.sheetUrl);
      }
      setSyncMessage(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Handle Sync from Link (Google Sheets / CSV URL)
  const handleFetchFromLink = async () => {
    if (!sheetUrl.trim()) {
      setSyncMessage({
        type: 'error',
        text: 'กรุณาระบุลิงก์ Google Sheets หรือ URL ไฟล์ CSV',
      });
      return;
    }

    setIsFetching(true);
    setSyncMessage(null);
    setRecentImported(null);

    try {
      const result = await fetchCustomerDataFromUrl(sheetUrl);
      if (!result.records || result.records.length === 0) {
        setSyncMessage({
          type: 'error',
          text: 'เชื่อมต่อลิงก์ได้ แต่ไม่พบข้อมูลลูกค้า กรุณาตรวจสอบหัวตารางในชีต (เช่น รหัสลูกค้า, ชื่อบริษัท, ที่อยู่)',
        });
        setIsFetching(false);
        return;
      }

      const { merged, addedCount, updatedCount } = mergeCustomers(customers, result.records);
      onCustomersUpdated(merged);
      setRecentImported(result.records);

      // Save config
      const newConfig: CustomerSyncConfig = {
        sheetUrl: sheetUrl.trim(),
        lastSyncedAt: new Date().toISOString(),
        autoSync: syncConfig.autoSync,
      };
      saveSyncConfig(newConfig);
      setSyncConfig(newConfig);

      setSyncMessage({
        type: 'success',
        text: `ดึงข้อมูลสำเร็จ! พบลูกค้า ${result.records.length} รายการ (เพิ่มใหม่ ${addedCount} ราย, อัพเดท ${updatedCount} ราย รวมทั้งหมด ${merged.length} ราย)`,
      });
    } catch (err: any) {
      setSyncMessage({
        type: 'error',
        text: err?.message || 'เกิดข้อผิดพลาดในการดึงข้อมูลจากลิงก์',
      });
    } finally {
      setIsFetching(false);
    }
  };

  // Handle File Upload (CSV or Text)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result as string;
      if (content) {
        const records = parseCustomerData(content, `ไฟล์ ${file.name}`);
        if (records.length === 0) {
          setSyncMessage({
            type: 'error',
            text: `ไม่พบข้อมูลลูกค้าในไฟล์ ${file.name} กรุณาตรวจสอบรูปแบบไฟล์ CSV/Text`,
          });
          return;
        }

        const { merged, addedCount, updatedCount } = mergeCustomers(customers, records);
        onCustomersUpdated(merged);
        setRecentImported(records);
        setSyncMessage({
          type: 'success',
          text: `นำเข้าไฟล์ ${file.name} สำเร็จ! พบลูกค้า ${records.length} รายการ (เพิ่มใหม่ ${addedCount} ราย, อัพเดท ${updatedCount} ราย)`,
        });
      }
    };
    reader.onerror = () => {
      setSyncMessage({ type: 'error', text: 'เกิดข้อผิดพลาดในการอ่านไฟล์' });
    };
    reader.readAsText(file, 'UTF-8');
  };

  // Handle Pasted Raw Data
  const handleProcessPastedText = () => {
    if (!pastedText.trim()) return;
    const records = parseCustomerData(pastedText, 'ข้อความที่วาง');
    if (records.length === 0) {
      setSyncMessage({
        type: 'error',
        text: 'ไม่พบข้อมูลลูกค้าในข้อความที่วาง กรุณาตรวจสอบว่ามีรหัสลูกค้า (เช่น KX001699) หรือชื่อบริษัท',
      });
      return;
    }

    const { merged, addedCount, updatedCount } = mergeCustomers(customers, records);
    onCustomersUpdated(merged);
    setRecentImported(records);
    setSyncMessage({
      type: 'success',
      text: `ประมวลผลข้อความสำเร็จ! พบลูกค้า ${records.length} รายการ (เพิ่มใหม่ ${addedCount} ราย, อัพเดท ${updatedCount} ราย)`,
    });
    setPastedText('');
  };

  // Insert sample text for test
  const handleInsertSampleText = () => {
    const sample = `รบกวนขอข้อมูลการออกใบเสนอราคา,KX001699
- ชื่อ นามสกุล ผู้ติดต่อ,คุณหฤทัย พระชนีย์
- เบอร์โทร,086-416-6490
- Email,contact@popup.co.th
- ชื่อบริษัท,บริษัท ป๊อปอัพ จำกัด
- ที่อยู่,1042/99 ซ.สุขุมวิท 101 แขวงบางจาก เขตพระโขนง จ.กรุงเทพมหานคร 10260
- เลขประจำตัวผู้เสียภาษี,0105563143308

รบกวนขอข้อมูลการออกใบเสนอราคา,KX001782
- ชื่อ นามสกุล ผู้ติดต่อ,คุณณัฐวรรณ จารย์คุณ
- เบอร์โทร,086-347-2070
- Email,nattawan@central.co.th
- ชื่อบริษัท,บริษัท เซ็นทรัล พีเพิล ดีเวลลอปเม้นท์ เซ็นเตอร์ จำกัด (สำนักงานใหญ่)
- ที่อยู่,306 อาคารเซ็นทรัลสีลม ถนนสีลม แขวงสุริยวงศ์ เขตบางรัก กรุงเทพมหานคร 10500
- เลขประจำตัวผู้เสียภาษี,0105551040525`;

    setPastedText(sample);
    const recs = parseCustomerData(sample);
    setPastePreviewCount(recs.length);
  };

  // Reset to default customers
  const handleResetDefaults = () => {
    if (window.confirm('คุณต้องการรีเซ็ตฐานข้อมูลลูกค้ากลับเป็นชุดเริ่มต้นของ KX ใช่หรือไม่?')) {
      saveCustomers(DEFAULT_CUSTOMERS);
      onCustomersUpdated(DEFAULT_CUSTOMERS);
      setSyncMessage({
        type: 'success',
        text: 'รีเซ็ตฐานข้อมูลลูกค้ากลับเป็นค่าเริ่มต้นเรียบร้อยแล้ว',
      });
    }
  };

  // Save edited or newly created customer
  const handleSaveCustomer = () => {
    if (!editFormData.customerCode?.trim() && !editFormData.name?.trim()) {
      alert('กรุณากรอกรหัสลูกค้าหรือชื่อบริษัท');
      return;
    }

    const cleanCode = normalizeCustomerCode(editFormData.customerCode || '') || `CUST-${Date.now()}`;
    const newRecord: CustomerRecord = {
      id: editingCustomer ? editingCustomer.id : `cust-${cleanCode}`,
      customerCode: cleanCode,
      name: editFormData.name?.trim() || 'ลูกค้าไม่ระบุชื่อ',
      taxId: editFormData.taxId?.trim() || '',
      address: editFormData.address?.trim() || '',
      contactPerson: editFormData.contactPerson?.trim() || '',
      mobile: editFormData.mobile?.trim() || '',
      phone: editFormData.phone?.trim() || '',
      email: editFormData.email?.trim() || '',
      department: editFormData.department?.trim() || 'เอกชน',
      source: editingCustomer?.source || 'จัดการด้วยตนเอง',
      updatedAt: new Date().toISOString(),
    };

    let updatedList: CustomerRecord[];
    if (editingCustomer) {
      updatedList = customers.map(c => c.id === editingCustomer.id ? newRecord : c);
    } else {
      updatedList = [newRecord, ...customers.filter(c => normalizeCustomerCode(c.customerCode) !== cleanCode)];
    }

    saveCustomers(updatedList);
    onCustomersUpdated(updatedList);
    setEditingCustomer(null);
    setIsAddingNew(false);
    setEditFormData({});
    setSyncMessage({
      type: 'success',
      text: `บันทึกข้อมูลลูกค้า ${newRecord.customerCode} สำเร็จ!`,
    });
  };

  // Delete customer
  const handleDeleteCustomer = (id: string, code: string) => {
    if (window.confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบรหัสลูกค้า "${code}"?`)) {
      const updatedList = customers.filter(c => c.id !== id);
      saveCustomers(updatedList);
      onCustomersUpdated(updatedList);
    }
  };

  // Filter customers for table
  const filteredCustomers = customers.filter((c) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    const qNorm = normalizeCustomerCode(searchQuery);
    const qDigits = searchQuery.replace(/[^0-9]/g, '');

    return (
      (c.customerCode || '').toLowerCase().includes(q) ||
      normalizeCustomerCode(c.customerCode || '').includes(qNorm) ||
      (qDigits && (c.customerCode || '').includes(qDigits)) ||
      (c.name || '').toLowerCase().includes(q) ||
      (c.contactPerson || '').toLowerCase().includes(q) ||
      (c.mobile || '').includes(q) ||
      (c.taxId || '').includes(q)
    );
  });

  return (
    <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-neutral-200 overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-neutral-200 bg-neutral-50/70 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-900 border border-amber-500/20 flex items-center justify-center">
              <Database className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-neutral-900">
                  ฐานข้อมูลลูกค้า & ดึงข้อมูลอัตโนมัติ
                </h2>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200 font-semibold">
                  {customers.length} รายการ
                </span>
              </div>
              <p className="text-xs text-neutral-500 mt-0.5">
                พิมพ์รหัสลูกค้าในใบเสนอราคาเพื่อดึง ชื่อบริษัท ที่อยู่ เลขผู้เสียภาษี และผู้ติดต่อได้ทันที
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-neutral-200 px-5 bg-white gap-2 pt-2">
          <button
            onClick={() => { setActiveTab('link'); setEditingCustomer(null); setIsAddingNew(false); }}
            className={`px-3 py-2 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'link'
                ? 'border-neutral-900 text-neutral-900'
                : 'border-transparent text-neutral-500 hover:text-neutral-900'
            }`}
          >
            <Link2 className="w-3.5 h-3.5" />
            ดึงข้อมูลจากลิงก์ (Google Sheets)
          </button>

          <button
            onClick={() => { setActiveTab('file'); setEditingCustomer(null); setIsAddingNew(false); }}
            className={`px-3 py-2 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'file'
                ? 'border-neutral-900 text-neutral-900'
                : 'border-transparent text-neutral-500 hover:text-neutral-900'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            นำเข้าไฟล์ CSV / Excel
          </button>

          <button
            onClick={() => { setActiveTab('paste'); setEditingCustomer(null); setIsAddingNew(false); }}
            className={`px-3 py-2 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'paste'
                ? 'border-neutral-900 text-neutral-900'
                : 'border-transparent text-neutral-500 hover:text-neutral-900'
            }`}
          >
            <ClipboardPaste className="w-3.5 h-3.5" />
            วางข้อความ / ฟอร์ม
          </button>

          <button
            onClick={() => setActiveTab('list')}
            className={`px-3 py-2 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'list'
                ? 'border-neutral-900 text-neutral-900'
                : 'border-transparent text-neutral-500 hover:text-neutral-900'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            รายชื่อลูกค้าทั้งหมด ({customers.length})
          </button>
        </div>

        {/* Message Banner */}
        {syncMessage && (
          <div
            className={`mx-5 mt-4 p-3 rounded-lg text-xs flex items-start gap-2 border ${
              syncMessage.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-rose-50 text-rose-800 border-rose-200'
            }`}
          >
            {syncMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            )}
            <div className="flex-1 font-medium">{syncMessage.text}</div>
            <button
              onClick={() => setSyncMessage(null)}
              className="text-neutral-400 hover:text-neutral-700"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Content Body */}
        <div className="p-5 overflow-y-auto flex-1 text-xs">
          {/* TAB 1: Link Sync */}
          {activeTab === 'link' && (
            <div className="space-y-4">
              <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-4">
                <h3 className="font-bold text-amber-950 flex items-center gap-1.5 mb-1 text-xs">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  วิธีเชื่อมต่อ Google Sheets ดึงข้อมูลลูกค้า
                </h3>
                <ol className="list-decimal list-inside space-y-1 text-neutral-600 text-[11px] leading-relaxed">
                  <li>เปิด Google Sheets ที่เก็บข้อมูลลูกค้า/การขอใบเสนอราคา</li>
                  <li>
                    กดปุ่ม <strong>แชร์ (Share)</strong> มุมขวาบน และเลือก{' '}
                    <span className="font-semibold text-neutral-900 bg-amber-100/70 px-1 rounded">
                      "ทุกคนที่มีลิงก์มีสิทธิ์ดู" (Anyone with the link can view)
                    </span>
                  </li>
                  <li>คัดลอก URL หน้าชีตมาวางในช่องด้านล่าง แล้วกด "ดึงข้อมูลจากลิงก์"</li>
                </ol>
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1.5">
                  ลิงก์ Google Sheets หรือ URL ของไฟล์ CSV:
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={sheetUrl}
                    onChange={(e) => setSheetUrl(e.target.value)}
                    placeholder="https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5.../edit#gid=0"
                    className="flex-1 px-3 py-2.5 border border-neutral-300 rounded-lg font-mono text-xs focus:outline-none focus:ring-2 focus:ring-neutral-800"
                  />
                  <button
                    type="button"
                    onClick={handleFetchFromLink}
                    disabled={isFetching}
                    className="px-4 py-2.5 bg-neutral-900 hover:bg-neutral-800 disabled:bg-neutral-400 text-white font-bold rounded-lg flex items-center gap-2 transition-all shadow-xs shrink-0"
                  >
                    <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
                    {isFetching ? 'กำลังซิงค์...' : 'ดึงข้อมูลสดทันที'}
                  </button>
                </div>

                <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 p-2.5 bg-emerald-50/60 border border-emerald-200 rounded-lg text-[11px]">
                  <label className="flex items-center gap-2 cursor-pointer text-emerald-950 font-medium">
                    <input
                      type="checkbox"
                      checked={syncConfig.autoSync !== false}
                      onChange={(e) => {
                        const newConf: CustomerSyncConfig = {
                          ...syncConfig,
                          sheetUrl: sheetUrl.trim(),
                          autoSync: e.target.checked,
                        };
                        saveSyncConfig(newConf);
                        setSyncConfig(newConf);
                      }}
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>⚡ เปิดใช้งานระบบซิงค์ Real-time อัตโนมัติ (ดึงข้อมูลล่าสุดอัตโนมัติทุก 30 วินาที และเมื่อสลับแท็บกลับมา)</span>
                  </label>

                  {syncConfig.lastSyncedAt && (
                    <span className="text-neutral-500 font-mono text-[10px]">
                      ซิงค์ล่าสุด: {new Date(syncConfig.lastSyncedAt).toLocaleTimeString('th-TH')}
                    </span>
                  )}
                </div>
              </div>

              {/* Sample Supported Header Formats */}
              <div className="border border-neutral-200 rounded-xl p-3.5 bg-neutral-50 space-y-2">
                <span className="font-bold text-neutral-700 block">
                  ระบบฉลาด ตรวจจับคอลัมน์ให้อัตโนมัติ (ไม่จำกัดลำดับคอลัมน์):
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px]">
                  <div className="p-2 bg-white rounded border border-neutral-200">
                    <span className="text-neutral-500 font-semibold block">รหัสลูกค้า:</span>
                    <span className="font-mono text-neutral-900">รหัสลูกค้า, KX Code, Code</span>
                  </div>
                  <div className="p-2 bg-white rounded border border-neutral-200">
                    <span className="text-neutral-500 font-semibold block">ชื่อบริษัท:</span>
                    <span className="text-neutral-900">ชื่อบริษัท, บริษัท, ชื่อลูกค้า</span>
                  </div>
                  <div className="p-2 bg-white rounded border border-neutral-200">
                    <span className="text-neutral-500 font-semibold block">เลขผู้เสียภาษี:</span>
                    <span className="text-neutral-900">เลขประจำตัวผู้เสียภาษี (13 หลัก)</span>
                  </div>
                  <div className="p-2 bg-white rounded border border-neutral-200">
                    <span className="text-neutral-500 font-semibold block">ผู้ติดต่อ:</span>
                    <span className="text-neutral-900">ชื่อผู้ติดต่อ, ผู้ประสานงาน</span>
                  </div>
                  <div className="p-2 bg-white rounded border border-neutral-200">
                    <span className="text-neutral-500 font-semibold block">เบอร์โทรศัพท์:</span>
                    <span className="text-neutral-900">เบอร์โทร, เบอร์มือถือ, Phone</span>
                  </div>
                  <div className="p-2 bg-white rounded border border-neutral-200">
                    <span className="text-neutral-500 font-semibold block">ที่อยู่:</span>
                    <span className="text-neutral-900">ที่อยู่บริษัท, ที่อยู่ออกใบกำกับ</span>
                  </div>
                </div>
              </div>

              {/* Recent Import Preview Table */}
              {recentImported && recentImported.length > 0 && (
                <div className="space-y-2 border border-emerald-200 bg-emerald-50/40 rounded-xl p-3.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-900 flex items-center gap-1.5">
                      <Check className="w-4 h-4 text-emerald-600" />
                      ตัวอย่างข้อมูลที่ดึงมาสำเร็จ ({recentImported.length} รายการ):
                    </span>
                    <button
                      type="button"
                      onClick={() => setActiveTab('list')}
                      className="text-emerald-800 font-semibold hover:underline"
                    >
                      ดูทั้งหมดในฐานข้อมูล →
                    </button>
                  </div>
                  <div className="max-h-48 overflow-y-auto rounded-lg border border-neutral-200 bg-white">
                    <table className="w-full text-[11px] text-left">
                      <thead className="bg-neutral-100 text-neutral-600 border-b border-neutral-200">
                        <tr>
                          <th className="p-2 font-semibold">รหัสลูกค้า</th>
                          <th className="p-2 font-semibold">ชื่อบริษัท</th>
                          <th className="p-2 font-semibold">ผู้ติดต่อ</th>
                          <th className="p-2 font-semibold">เบอร์โทร</th>
                          <th className="p-2 font-semibold text-right">ส่วนลด (คอลัมน์ J)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-100">
                        {recentImported.slice(0, 10).map((r, i) => (
                          <tr key={i} className="hover:bg-neutral-50">
                            <td className="p-2 font-mono font-bold text-neutral-900">{r.customerCode}</td>
                            <td className="p-2 text-neutral-800 font-medium">{r.name}</td>
                            <td className="p-2 text-neutral-600">{r.contactPerson || '-'}</td>
                            <td className="p-2 text-neutral-600 font-mono">{r.mobile || r.phone || '-'}</td>
                            <td className="p-2 text-right">
                              <span className={`inline-block font-mono font-bold px-2 py-0.5 rounded text-[10px] ${
                                (r.discountRate ?? 0) > 0
                                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                  : 'bg-neutral-100 text-neutral-600'
                              }`}>
                                {r.discountRate ?? 0}%
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: File Upload */}
          {activeTab === 'file' && (
            <div className="space-y-4">
              <label className="border-2 border-dashed border-neutral-300 hover:border-neutral-500 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer bg-neutral-50/50 hover:bg-neutral-50 transition-colors">
                <Upload className="w-10 h-10 text-neutral-400 mb-2" />
                <span className="font-bold text-neutral-800 text-sm">
                  คลิกเพื่อเลือกไฟล์ หรือลากไฟล์มาวางที่นี่
                </span>
                <span className="text-neutral-500 text-[11px] mt-1">
                  รองรับไฟล์ .csv, .txt (UTF-8) ที่ส่งออกจาก Google Sheets หรือ Excel
                </span>
                <input
                  type="file"
                  accept=".csv,.txt,.tsv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              {recentImported && recentImported.length > 0 && (
                <div className="space-y-2 border border-emerald-200 bg-emerald-50/40 rounded-xl p-3.5">
                  <span className="font-bold text-emerald-900 flex items-center gap-1.5">
                    <Check className="w-4 h-4 text-emerald-600" />
                    นำเข้าสำเร็จ {recentImported.length} รายการ
                  </span>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Paste Text */}
          {activeTab === 'paste' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-neutral-700">
                  วางข้อความจากการขอใบเสนอราคา หรือข้อความจาก LINE / อีเมล:
                </label>
                <button
                  type="button"
                  onClick={handleInsertSampleText}
                  className="text-amber-800 font-semibold hover:underline text-[11px] flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3 text-amber-600" />
                  ลองใส่ตัวอย่างฟอร์ม KX
                </button>
              </div>

              <textarea
                rows={8}
                value={pastedText}
                onChange={(e) => {
                  setPastedText(e.target.value);
                  const recs = parseCustomerData(e.target.value);
                  setPastePreviewCount(recs.length);
                }}
                placeholder="วางข้อความที่นี่ เช่น:
รบกวนขอข้อมูลการออกใบเสนอราคา,KX001699
- ชื่อ นามสกุล ผู้ติดต่อ,คุณหฤทัย พระชนีย์
- เบอร์โทร,086-416-6490
- ชื่อบริษัท,บริษัท ป๊อปอัพ จำกัด
- ที่อยู่,1042/99 ซ.สุขุมวิท 101 แขวงบางจาก เขตพระโขนง จ.กรุงเทพมหานคร 10260
- เลขประจำตัวผู้เสียภาษี,0105563143308"
                className="w-full p-3 border border-neutral-300 rounded-xl font-mono text-xs focus:outline-none focus:ring-2 focus:ring-neutral-800"
              />

              <div className="flex items-center justify-between">
                <span className="text-neutral-500 text-[11px]">
                  {pastePreviewCount !== null && pastePreviewCount > 0 ? (
                    <span className="text-emerald-700 font-bold">
                      ✓ ตรวจพบข้อมูลลูกค้า {pastePreviewCount} รายการ
                    </span>
                  ) : (
                    'วางข้อความแล้วระบบจะแยก รหัสลูกค้า, ชื่อบริษัท, ที่อยู่, ผู้ติดต่อ และเบอร์โทร ให้อัตโนมัติ'
                  )}
                </span>

                <button
                  type="button"
                  onClick={handleProcessPastedText}
                  disabled={!pastedText.trim()}
                  className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 disabled:bg-neutral-300 text-white font-bold rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <ClipboardPaste className="w-4 h-4" />
                  ประมวลผลและบันทึก
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: Customer Directory List & Direct Editing */}
          {activeTab === 'list' && (
            <div className="space-y-3">
              {/* If editing or adding customer form is open */}
              {(editingCustomer || isAddingNew) && (
                <div className="border border-amber-300 bg-amber-50/50 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-amber-200 pb-2">
                    <span className="font-bold text-amber-950 flex items-center gap-1.5 text-xs">
                      <Edit2 className="w-3.5 h-3.5 text-amber-700" />
                      {editingCustomer ? `แก้ไขข้อมูลลูกค้า (${editingCustomer.customerCode})` : 'เพิ่มข้อมูลลูกค้าใหม่'}
                    </span>
                    <button
                      type="button"
                      onClick={() => { setEditingCustomer(null); setIsAddingNew(false); }}
                      className="text-neutral-400 hover:text-neutral-700"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="font-semibold text-neutral-700 block mb-1">
                        รหัสลูกค้า (Customer Code) *
                      </label>
                      <input
                        type="text"
                        value={editFormData.customerCode || ''}
                        onChange={(e) => setEditFormData({ ...editFormData, customerCode: e.target.value })}
                        placeholder="เช่น KX001699"
                        className="w-full px-3 py-1.5 border border-neutral-300 rounded font-mono font-bold text-neutral-900 bg-white"
                      />
                    </div>

                    <div>
                      <label className="font-semibold text-neutral-700 block mb-1">
                        ชื่อบริษัท / ลูกค้า *
                      </label>
                      <input
                        type="text"
                        value={editFormData.name || ''}
                        onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                        placeholder="เช่น บริษัท ป๊อปอัพ จำกัด"
                        className="w-full px-3 py-1.5 border border-neutral-300 rounded text-neutral-900 bg-white"
                      />
                    </div>

                    <div>
                      <label className="font-semibold text-neutral-700 block mb-1">
                        เลขประจำตัวผู้เสียภาษี
                      </label>
                      <input
                        type="text"
                        value={editFormData.taxId || ''}
                        onChange={(e) => setEditFormData({ ...editFormData, taxId: e.target.value })}
                        placeholder="13 หลัก เช่น 0105563143308"
                        className="w-full px-3 py-1.5 border border-neutral-300 rounded font-mono text-neutral-900 bg-white"
                      />
                    </div>

                    <div>
                      <label className="font-semibold text-neutral-700 block mb-1">
                        ชื่อผู้ติดต่อ
                      </label>
                      <input
                        type="text"
                        value={editFormData.contactPerson || ''}
                        onChange={(e) => setEditFormData({ ...editFormData, contactPerson: e.target.value })}
                        placeholder="เช่น คุณหฤทัย พระชนีย์"
                        className="w-full px-3 py-1.5 border border-neutral-300 rounded text-neutral-900 bg-white"
                      />
                    </div>

                    <div>
                      <label className="font-semibold text-neutral-700 block mb-1">
                        เบอร์โทรศัพท์ / มือถือ
                      </label>
                      <input
                        type="text"
                        value={editFormData.mobile || ''}
                        onChange={(e) => setEditFormData({ ...editFormData, mobile: e.target.value })}
                        placeholder="เช่น 086-416-6490"
                        className="w-full px-3 py-1.5 border border-neutral-300 rounded font-mono text-neutral-900 bg-white"
                      />
                    </div>

                    <div>
                      <label className="font-semibold text-neutral-700 block mb-1">
                        อีเมล
                      </label>
                      <input
                        type="email"
                        value={editFormData.email || ''}
                        onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                        placeholder="เช่น contact@popup.co.th"
                        className="w-full px-3 py-1.5 border border-neutral-300 rounded text-neutral-900 bg-white"
                      />
                    </div>

                    <div>
                      <label className="font-semibold text-neutral-700 block mb-1">
                        ส่วนลด (คอลัมน์ J ใน Sheets) %
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="any"
                        value={editFormData.discountRate ?? 0}
                        onChange={(e) => setEditFormData({ ...editFormData, discountRate: Number(e.target.value) || 0 })}
                        placeholder="0"
                        className="w-full px-3 py-1.5 border border-amber-300 rounded font-mono font-bold text-neutral-900 bg-amber-50/40 text-right"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="font-semibold text-neutral-700 block mb-1">
                        ที่อยู่
                      </label>
                      <textarea
                        rows={2}
                        value={editFormData.address || ''}
                        onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
                        placeholder="ที่อยู่ตาม ภ.พ.20 หรือที่อยู่ออกใบกำกับภาษี"
                        className="w-full px-3 py-1.5 border border-neutral-300 rounded text-neutral-900 bg-white text-xs"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t border-amber-200">
                    <button
                      type="button"
                      onClick={() => { setEditingCustomer(null); setIsAddingNew(false); }}
                      className="px-3 py-1.5 bg-neutral-200 hover:bg-neutral-300 text-neutral-800 rounded font-semibold text-xs"
                    >
                      ยกเลิก
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveCustomer}
                      className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded font-bold text-xs flex items-center gap-1 shadow-xs"
                    >
                      <Save className="w-3.5 h-3.5" />
                      บันทึกข้อมูล
                    </button>
                  </div>
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-neutral-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="ค้นหาด้วยรหัส (เช่น 1699 หรือ KX001699), ชื่อบริษัท, ผู้ติดต่อ..."
                    className="w-full pl-8 pr-3 py-2 border border-neutral-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-neutral-800"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingNew(true);
                      setEditingCustomer(null);
                      setEditFormData({
                        customerCode: 'KX',
                        name: '',
                        department: 'เอกชน',
                      });
                    }}
                    className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    เพิ่มลูกค้าใหม่
                  </button>

                  <button
                    type="button"
                    onClick={handleResetDefaults}
                    className="px-2.5 py-1.5 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg border border-neutral-200 text-xs font-semibold flex items-center gap-1 transition-colors"
                    title="รีเซ็ตเป็นข้อมูลลูกค้าเริ่มต้น KX"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    รีเซ็ต KX
                  </button>
                </div>
              </div>

              <div className="border border-neutral-200 rounded-xl overflow-hidden">
                <div className="max-h-[340px] overflow-y-auto divide-y divide-neutral-100">
                  {filteredCustomers.length === 0 ? (
                    <div className="p-8 text-center text-neutral-400">
                      ไม่พบข้อมูลลูกค้าที่ค้นหา
                    </div>
                  ) : (
                    filteredCustomers.map((cust) => (
                      <div
                        key={cust.id || cust.customerCode}
                        className="p-3 hover:bg-neutral-50 transition-colors flex items-start justify-between gap-3"
                      >
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded font-mono font-bold bg-neutral-900 text-white text-[11px]">
                              {cust.customerCode}
                            </span>
                            <span className="font-bold text-neutral-900 text-xs">
                              {cust.name}
                            </span>
                            {cust.source && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-neutral-100 text-neutral-600 border border-neutral-200">
                                {cust.source}
                              </span>
                            )}
                            {cust.discountRate !== undefined && cust.discountRate > 0 && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 border border-amber-300 font-bold">
                                คอลัมน์ J: ลด {cust.discountRate}%
                              </span>
                            )}
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-[11px] text-neutral-600">
                            {cust.contactPerson && (
                              <div className="flex items-center gap-1">
                                <Users className="w-3 h-3 text-neutral-400 shrink-0" />
                                <span>{cust.contactPerson}</span>
                              </div>
                            )}
                            {cust.mobile && (
                              <div className="flex items-center gap-1 font-mono">
                                <Phone className="w-3 h-3 text-neutral-400 shrink-0" />
                                <span>{cust.mobile}</span>
                              </div>
                            )}
                            {cust.taxId && (
                              <div className="font-mono text-neutral-500">
                                เลขผู้เสียภาษี: {cust.taxId}
                              </div>
                            )}
                            {cust.address && (
                              <div className="sm:col-span-2 text-neutral-500 flex items-start gap-1">
                                <MapPin className="w-3 h-3 text-neutral-400 shrink-0 mt-0.5" />
                                <span className="line-clamp-1">{cust.address}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingCustomer(cust);
                              setIsAddingNew(false);
                              setEditFormData({ ...cust });
                            }}
                            className="p-1.5 text-neutral-500 hover:text-neutral-800 hover:bg-neutral-200/60 rounded transition-colors"
                            title="แก้ไขข้อมูลลูกค้ารายนี้"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteCustomer(cust.id, cust.customerCode)}
                            className="p-1.5 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                            title="ลบลูกค้ารายนี้"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>

                          {onSelectCustomer && (
                            <button
                              type="button"
                              onClick={() => {
                                onSelectCustomer(cust);
                                onClose();
                              }}
                              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold rounded-lg text-xs transition-colors shadow-2xs"
                            >
                              เลือกใช้นี้
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-neutral-200 bg-neutral-50 flex items-center justify-between text-xs text-neutral-500">
          <div className="flex items-center gap-2">
            <span>ฐานข้อมูลลูกค้าพร้อมทำงานแบบออฟไลน์และซิงค์ผ่านลิงก์</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-neutral-200 hover:bg-neutral-300 text-neutral-800 font-semibold rounded-lg transition-colors"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
