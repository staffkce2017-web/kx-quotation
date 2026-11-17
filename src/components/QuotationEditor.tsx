import React, { useState, useEffect, useRef } from 'react';
import {
  Quotation,
  QuotationItem,
  CustomerRecord,
  CustomerSyncConfig,
  PaymentTermType,
  RoomCatalogItem,
  QuotationLayoutSettings,
  DEFAULT_LAYOUT_SETTINGS,
  AnnexConfig,
  AnnexEquipmentRow,
  AnnexFineRow,
  AdditionalSignatureItem,
  BankInfo,
} from '../types';
import { PRESET_ROOMS_AND_EQUIPMENT } from '../data/initialData';
import { QuotationDocument } from './QuotationDocument';
import { AnnexDocument, DEFAULT_ANNEX_EQUIPMENT, DEFAULT_ANNEX_FINES, DEFAULT_ANNEX_TERMS_TEXT } from './AnnexDocument';
import { KXLogo } from './KXLogo';
import { QRCodeCanvas } from './QRCodeCanvas';
import { generatePromptPayPayload } from '../utils/promptpay';
import { useAuth } from '../context/AuthContext';
import { arabicToThaiBahtText, formatCurrency, formatThaiDate, formatThaiDateSmart, formatThaiDateRange, formatEnglishDate, isNoDiscountItem } from '../utils/thaiBahtText';
import {
  getNextQuotationNumber,
  checkQuoteNumberAvailability,
  loadNumberingSettings,
  NumberingSettings,
} from '../utils/numberGenerator';
import { translateQuotationToEnglish, restoreQuotationToThai, translatePhrase } from '../utils/quotationTranslator';
import { NumberingSettingsModal } from './NumberingSettingsModal';
import { CustomerSyncModal } from './CustomerSyncModal';
import { RoomCatalogModal } from './RoomCatalogModal';
import { DynamicRoomCalculator } from './DynamicRoomCalculator';
import { FoodCateringModal } from './FoodCateringModal';
import { loadRoomCatalog, getDayType, getAvailableFloors } from '../utils/roomCatalog';
import {
  loadCustomers,
  saveCustomers,
  loadSyncConfig,
  saveSyncConfig,
  findCustomerByCode,
  searchCustomers,
  fetchCustomerDataFromUrl,
  mergeCustomers,
  syncCustomersRealtime,
  normalizeCustomerCode,
  parseCustomerData,
  sanitizeCustomerRecord,
} from '../utils/customerSync';
import {
  getRememberedItems,
  saveItemToPricingMemory,
  getCustomerPreference,
  saveCustomerQuotationMemory,
  findRememberedPriceForDescription,
  RememberedItem,
  CustomerPricingPreference,
} from '../utils/pricingMemory';
import {
  processSignatureFile,
  processSignatureDataUrl,
  invertSignatureImage,
  convertToBlueInk,
  convertToBlackInk,
} from '../utils/signatureProcessor';
import { ManagePreparedByModal } from './ManagePreparedByModal';
import {
  Plus,
  Trash2,
  Eye,
  Edit3,
  Save,
  Sparkles,
  Copy,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  Settings,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Hash,
  Link2,
  Database,
  Users,
  Building,
  Building2,
  Zap,
  Coffee,
  Utensils,
  Mail,
  Phone,
  Search,
  Check,
  Tag,
  Percent,
  Calendar,
  Clock,
  Layers,
  Upload,
  Image as ImageIcon,
  X,
  Sliders,
  SlidersHorizontal,
  Move,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Type,
  Smile,
  Maximize2,
  Minimize2,
  LayoutTemplate,
  EyeOff,
  LayoutGrid,
  CheckSquare,
  Square,
  FileText,
  ChevronsUpDown,
  ChevronDown,
  ChevronUp,
  ChevronsDown,
  ChevronsUp,
  PenTool,
  UserCheck,
  MapPin,
  Globe,
  QrCode,
  CreditCard,
} from 'lucide-react';

const HEADER_BRANDING_STORAGE_KEY = 'kx_quotation_header_branding_v1';
const SIGNATURES_STORAGE_KEY = 'kx_quotation_default_signatures_v1';
const BANK_INFO_STORAGE_KEY = 'kx_bank_payment_info_pref_v1';
const STAFF_SIGNATURES_STORAGE_KEY = 'kx_staff_signatures_cache_v1';

export const getStaffSavedSignature = (staffName: string): string | null => {
  try {
    const raw = localStorage.getItem(STAFF_SIGNATURES_STORAGE_KEY);
    if (raw) {
      const map = JSON.parse(raw);
      const cleanKey = staffName.replace(/\s*\(.*\)$/, '').trim();
      return map[staffName] || map[cleanKey] || null;
    }
  } catch (e) {}
  return null;
};

export const saveStaffSignature = (staffName: string, signatureUrl: string) => {
  try {
    const raw = localStorage.getItem(STAFF_SIGNATURES_STORAGE_KEY);
    const map = raw ? JSON.parse(raw) : {};
    const cleanKey = staffName.replace(/\s*\(.*\)$/, '').trim();
    map[staffName] = signatureUrl;
    map[cleanKey] = signatureUrl;
    localStorage.setItem(STAFF_SIGNATURES_STORAGE_KEY, JSON.stringify(map));
  } catch (e) {}
};

function getSavedBankInfo(): Partial<BankInfo> | null {
  try {
    const raw = localStorage.getItem(BANK_INFO_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return null;
}

const createSvgSignature = (pathD: string, underlineD?: string) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 70" width="220" height="70">
    <path d="${pathD}" fill="none" stroke="#1d4ed8" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" />
    ${underlineD ? `<path d="${underlineD}" fill="none" stroke="#1d4ed8" stroke-width="1.8" stroke-linecap="round" />` : ''}
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

export const createTextSvgSignature = (nameText: string, pathD?: string, underlineD?: string) => {
  const cleanName = nameText.replace(/\s*\(.*\)$/, '').trim();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 70" width="220" height="70">
    <style>
      .sig-text { font-family: 'Kalam', 'Caveat', 'Itim', 'Mitr', 'Sarabun', -apple-system, sans-serif; font-size: 32px; font-weight: 700; fill: #1d4ed8; font-style: italic; letter-spacing: 1px; }
      .sig-path { fill: none; stroke: #1d4ed8; stroke-linecap: round; stroke-linejoin: round; }
    </style>
    ${pathD ? `<path d="${pathD}" class="sig-path" stroke-width="2.2" opacity="0.9" />` : ''}
    <text x="110" y="44" text-anchor="middle" class="sig-text">${cleanName}</text>
    <path d="${underlineD || 'M 35 54 Q 110 59 185 50'}" class="sig-path" stroke-width="2" />
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

export const generateStandardPaymentTerms = (
  type: PaymentTermType = 'PRIVATE_7_DAYS',
  dueDate?: string,
  noticeDate?: string
): string => {
  const formattedDueDate = dueDate ? formatThaiDate(dueDate, 'full') : '';
  const formattedNoticeDate = noticeDate ? formatThaiDate(noticeDate, 'full') : '';

  const line1 =
    type === 'GOVERNMENT_30_DAYS'
      ? `• เครดิตวางบิลชำระเงินภายใน 30 วัน${formattedDueDate ? ` (ครบกำหนดชำระเงินวันที่ ${formattedDueDate})` : ''}`
      : `• กรุณาชำระเงิน 100% ก่อนเริ่มงานอย่างน้อย 7 วัน${formattedDueDate ? ` (กำหนดชำระภายในวันที่ ${formattedDueDate})` : ''}`;

  return [
    line1,
    '• KX เป็นหน่วยงานราชการ ไม่มี Vat ไม่มีหัก ณ ที่จ่าย ลูกค้าสามารถขอเอกสารเพิ่มเติมกับเจ้าหน้าที่ฝ่ายขาย',
    `• ในกรณีของการเปลี่ยนแปลง/ยกเลิกหรือขอยกเว้น กรุณาแจ้งให้เราทราบล่วงหน้าอย่างน้อย 14 วัน${formattedNoticeDate ? ` (ภายในวันที่ ${formattedNoticeDate})` : ''} หากไม่ปฏิบัติตามเงื่อนไข ทางอาคารเคเอกซ์ขอสงวนสิทธิ์ในการจองครั้งถัดไป`,
    '• หากไม่แจ้งให้ทราบทางอาคาร KX ขอสงวนสิทธิ์ที่จะไม่คืนเงินในกรณีใด ๆ ทั้งสิ้น',
    '• สำหรับข้อมูลเพิ่มเติมกรุณาติดต่อ 02-4707907 (คุณมด บัญชี) 02-4707906 (บุ๊ค, นุ้ค, ติ๊ก )',
  ].join('\n');
};

export const generateStandardPaymentTermsEn = (
  type: PaymentTermType = 'PRIVATE_7_DAYS',
  dueDate?: string,
  noticeDate?: string
): string => {
  const formattedDueDate = dueDate ? formatEnglishDate(dueDate, 'full') : '';
  const formattedNoticeDate = noticeDate ? formatEnglishDate(noticeDate, 'full') : '';

  const line1 =
    type === 'GOVERNMENT_30_DAYS'
      ? `• Credit billing terms: payment within 30 days${formattedDueDate ? ` (Due date: ${formattedDueDate})` : ''}`
      : `• Please pay 100% at least 7 days prior to event date${formattedDueDate ? ` (Due date: ${formattedDueDate})` : ''}`;

  return [
    line1,
    '• KX is a government agency; exempt from VAT and Withholding Tax. Clients may request official documentation from sales officers.',
    `• In case of modification/cancellation or exemption, please notify at least 14 days in advance${formattedNoticeDate ? ` (by ${formattedNoticeDate})` : ''}. Failure to comply reserves KX's rights on subsequent bookings.`,
    '• Failure to notify in advance will result in a strictly non-refundable policy under all circumstances.',
    '• For further information, please contact 02-4707907 (Khun Mod, Accounting) or 02-4707906 (Book, Nook, Tik - Sales).',
  ].join('\n');
};

export interface SignerPreset {
  name: string;
  role?: string;
  signatureUrl: string;
}

export const DEFAULT_PRESET_PREPARED_BY: SignerPreset[] = [
  {
    name: 'พจนา (ฝ่ายขาย)',
    role: 'เจ้าหน้าที่ฝ่ายขายและการตลาด',
    signatureUrl: createTextSvgSignature(
      'พจนา',
      'M 25 42 Q 35 15 48 35 T 62 40 Q 75 10 88 38 Q 95 50 110 32 T 135 25 Q 155 18 175 35',
      'M 35 54 Q 100 58 175 48'
    ),
  },
  {
    name: 'คุณนุ้ค (ฝ่ายขาย)',
    role: 'เจ้าหน้าที่ฝ่ายขายและการตลาด',
    signatureUrl: createTextSvgSignature(
      'นุ้ค',
      'M 20 40 C 30 14 44 16 56 36 C 68 50 78 18 96 22 C 114 26 126 40 146 25',
      'M 28 53 Q 102 57 176 47'
    ),
  },
  {
    name: 'คุณบุ๊ค (ฝ่ายขาย)',
    role: 'เจ้าหน้าที่ฝ่ายขายและการตลาด',
    signatureUrl: createTextSvgSignature(
      'บุ๊ค',
      'M 22 38 Q 36 15 50 36 T 76 32 Q 92 10 110 40 T 142 26',
      'M 30 52 Q 105 56 178 46'
    ),
  },
  {
    name: 'คุณติ๊ก (ฝ่ายขาย)',
    role: 'เจ้าหน้าที่ฝ่ายขายและการตลาด',
    signatureUrl: createTextSvgSignature(
      'ติ๊ก',
      'M 24 36 C 36 12 48 16 60 36 T 85 30 Q 100 12 120 40 T 152 24',
      'M 32 53 Q 106 57 180 47'
    ),
  },
  {
    name: 'คุณมด (บัญชี/การเงิน)',
    role: 'เจ้าหน้าที่การเงินและบัญชี',
    signatureUrl: createTextSvgSignature(
      'มด',
      'M 20 42 C 30 16 42 18 54 36 T 80 32 Q 96 14 115 38 T 148 26',
      'M 26 54 Q 100 58 174 48'
    ),
  },
  {
    name: 'วาสนา',
    role: 'เจ้าหน้าที่บริการลูกค้าและการตลาด',
    signatureUrl: createTextSvgSignature(
      'วาสนา',
      'M 22 45 C 28 20 40 18 45 35 C 50 48 60 22 75 25 C 90 28 95 48 115 32 C 130 18 150 25 170 30',
      'M 30 53 Q 100 56 175 48'
    ),
  },
  {
    name: 'ชลธิชา',
    role: 'เจ้าหน้าที่บริหารงานทั่วไป',
    signatureUrl: createTextSvgSignature(
      'ชลธิชา',
      'M 20 38 Q 32 15 45 38 T 70 36 Q 85 12 100 42 Q 115 15 130 35 T 165 30',
      'M 32 52 Q 100 56 168 47'
    ),
  },
  {
    name: 'ณัฐพงษ์',
    role: 'เจ้าหน้าที่สนับสนุนกิจกรรม',
    signatureUrl: createTextSvgSignature(
      'ณัฐพงษ์',
      'M 25 38 C 35 12 45 15 55 35 T 80 32 Q 95 10 115 38 T 145 28 Q 165 20 180 32',
      'M 30 52 Q 105 56 175 46'
    ),
  },
];

export const PREPARED_BY_PRESETS_STORAGE_KEY = 'kx_prepared_by_presets_v1';

export const loadPreparedByPresets = (): SignerPreset[] => {
  try {
    const raw = localStorage.getItem(PREPARED_BY_PRESETS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {}
  return DEFAULT_PRESET_PREPARED_BY;
};

export const savePreparedByPresets = (presets: SignerPreset[]) => {
  try {
    localStorage.setItem(PREPARED_BY_PRESETS_STORAGE_KEY, JSON.stringify(presets));
    window.dispatchEvent(new CustomEvent('kx_prepared_by_presets_updated', { detail: presets }));
  } catch (e) {}
};

export const PRESET_PREPARED_BY: SignerPreset[] = DEFAULT_PRESET_PREPARED_BY;

export const findPreparedPreset = (name: string, list?: SignerPreset[]): SignerPreset | undefined => {
  const targetList = list && list.length > 0 ? list : loadPreparedByPresets();
  if (!name) return targetList[0];
  const clean = name.trim().toLowerCase();
  const base = clean.replace(/\s*\(.*\)$/, '').replace(/คุณ/g, '').trim();
  return (
    targetList.find((p) => p.name === name) ||
    targetList.find((p) => p.name.toLowerCase() === clean) ||
    targetList.find((p) => {
      const pBase = p.name.toLowerCase().replace(/\s*\(.*\)$/, '').replace(/คุณ/g, '').trim();
      return pBase === base || base.includes(pBase) || pBase.includes(base);
    })
  );
};

export const PRESET_APPROVED_BY: SignerPreset[] = [
  {
    name: 'ศิริวรรณ',
    role: 'ผู้จัดการส่วนบริการและบริหารพื้นที่',
    signatureUrl: createSvgSignature(
      'M 22 36 C 30 12 42 16 50 32 C 58 48 65 18 80 22 C 98 26 102 46 120 30 C 135 16 152 28 175 22',
      'M 28 46 Q 100 52 180 40'
    ),
  },
  {
    name: 'นันทวัน',
    role: 'หัวหน้าฝ่ายบริการลูกค้าสัมพันธ์',
    signatureUrl: createSvgSignature(
      'M 25 40 Q 38 18 52 35 T 78 32 Q 95 10 112 40 T 145 28 Q 160 22 178 35',
      'M 35 48 Q 105 48 170 42'
    ),
  },
  {
    name: 'สุภัทรา',
    role: 'ผู้ช่วยผู้อำนวยการฝ่ายปฏิบัติการ',
    signatureUrl: createSvgSignature(
      'M 20 42 C 30 15 45 20 58 35 T 85 30 Q 100 12 118 42 T 150 25 Q 168 18 182 32',
      'M 32 50 Q 105 54 178 44'
    ),
  },
];

export const PRESET_AUTHORIZED: SignerPreset[] = [
  {
    name: 'ดร.ภัทร บุณยรัตพันธุ์',
    role: 'ผู้ช่วยผู้อำนวยการอาคารเคเอ็กซ์',
    signatureUrl: createSvgSignature(
      'M 18 40 C 25 12 38 15 45 38 C 52 55 60 15 78 20 C 95 24 105 45 125 22 C 145 5 155 35 182 25 M 70 12 L 82 28',
      'M 15 50 Q 95 54 185 40'
    ),
  },
  {
    name: 'รศ.ดร.สุวิทย์ แซ่เตีย',
    role: 'อธิการบดี มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าธนบุรี',
    signatureUrl: createSvgSignature(
      'M 20 35 C 32 10 48 15 58 38 C 65 52 75 18 95 22 C 115 26 125 42 145 25 C 160 12 170 28 185 20',
      'M 25 48 Q 110 52 180 38'
    ),
  },
  {
    name: 'ดร.วรรณภพ กล่อมเกลี้ยง',
    role: 'ผู้อำนวยการฝ่ายพัฒนาธุรกิจนวัตกรรม',
    signatureUrl: createSvgSignature(
      'M 22 42 C 30 16 44 18 56 36 T 82 32 Q 98 12 118 40 T 152 28 Q 170 18 185 30',
      'M 28 48 Q 102 52 178 42'
    ),
  },
];

const getSavedHeaderBranding = () => {
  try {
    const saved = localStorage.getItem(HEADER_BRANDING_STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.warn('Failed to load header branding from localStorage:', e);
  }
  return null;
};

const getSavedSignatures = () => {
  try {
    const saved = localStorage.getItem(SIGNATURES_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed;
    }
  } catch (e) {
    console.warn('Failed to load signatures from localStorage:', e);
  }
  return null;
};

interface QuotationEditorProps {
  initialQuotation?: Quotation;
  quotations: Quotation[];
  onSave: (savedQuotation: Quotation) => void;
  onCancel: () => void;
}

export function stripWeekdayLabel(text: string): string {
  if (!text) return '';
  let cleaned = text
    // 1. Remove day notes
    .replace(/\s*•\s*วันธรรมดา\s*จันทร์\s*-\s*ศุกร์/gi, '')
    .replace(/\s*\(วันธรรมดา\s*จันทร์\s*-\s*ศุกร์\)/gi, '')
    .replace(/วันธรรมดา\s*จันทร์\s*-\s*ศุกร์/gi, '')
    .replace(/\s*•\s*วันเสาร์\s*-\s*อาทิตย์/gi, '')
    .replace(/\s*\(วันเสาร์\s*-\s*อาทิตย์\)/gi, '')
    .replace(/วันเสาร์\s*-\s*อาทิตย์/gi, '')
    // 2. Remove half-day / full-day / hourly notes in parenthesis or standalone
    .replace(/\s*\(\s*ครึ่งวัน[^)]*\)/gi, '')
    .replace(/\s*\(\s*เต็มวัน[^)]*\)/gi, '')
    .replace(/\s*\(\s*\d+\s*ชม\.?[^)]*\)/gi, '')
    .replace(/\s*•\s*ครึ่งวัน[^\n)]*/gi, '')
    .replace(/\s*•\s*เต็มวัน[^\n)]*/gi, '')
    // 3. Clean up empty parentheses, dangling bullets or spaces
    .replace(/\(\s*•\s*/g, '(')
    .replace(/\(\s*\)/g, '')
    .replace(/\s*•\s*$/g, '')
    .replace(/\s*\(\s*$/g, '')
    .trim();

  // Ensure matching parentheses
  const openCount = (cleaned.match(/\(/g) || []).length;
  const closeCount = (cleaned.match(/\)/g) || []).length;
  if (openCount > closeCount) {
    cleaned += ')'.repeat(openCount - closeCount);
  }

  return cleaned;
}

export function findMatchingRoom(item: QuotationItem, catalog: RoomCatalogItem[]): RoomCatalogItem | undefined {
  if (item.roomId) {
    const found = catalog.find((r) => r.id === item.roomId);
    if (found) return found;
  }
  if (item.roomName) {
    const found = catalog.find((r) => r.name.toLowerCase() === item.roomName?.toLowerCase());
    if (found) return found;
  }
  const desc = (item.description || '').toLowerCase();
  const rooms = catalog.filter((r) => r.category === 'room').sort((a, b) => b.name.length - a.name.length);
  for (const r of rooms) {
    const cleanName = r.name.toLowerCase().trim();
    if (cleanName && desc.includes(cleanName)) {
      return r;
    }
  }
  for (const r of rooms) {
    const words = r.name.toLowerCase().split(/\s+/);
    for (const w of words) {
      if (w.length >= 3 && desc.includes(w)) {
        return r;
      }
    }
  }
  return undefined;
}

export function detectRateType(item: QuotationItem): 'half_day' | 'half_day_afternoon' | 'full_day' | 'custom' {
  if (item.rateType) return item.rateType;
  const desc = (item.description || '').toLowerCase();
  const time = (item.usageTime || item.eventTime || '').toLowerCase();
  if (desc.includes('ครึ่งวัน') || time.includes('12:00')) {
    return 'half_day';
  }
  if (time.includes('13:00') && time.includes('17:00')) {
    return 'half_day_afternoon';
  }
  if (desc.includes('เต็มวัน') || time.includes('17:00') || time.includes('18:00') || desc.includes('8 ชม')) {
    return 'full_day';
  }
  return 'half_day';
}

export const QuotationEditor: React.FC<QuotationEditorProps> = ({
  initialQuotation,
  quotations = [],
  onSave,
  onCancel,
}) => {
  const { userProfile } = useAuth();
  const isEditing = !!initialQuotation;

  const defaultDate = new Date().toISOString().split('T')[0];

  // Auto-run number states
  const [autoRunOnDateChange, setAutoRunOnDateChange] = useState(!isEditing);
  const [isNumberSettingsOpen, setIsNumberSettingsOpen] = useState(false);

  // Form State
  const [quoteNumber, setQuoteNumber] = useState(() => {
    if (initialQuotation?.quoteNumber) return initialQuotation.quoteNumber;
    return getNextQuotationNumber(quotations, defaultDate);
  });
  const [issueDate, setIssueDate] = useState(defaultDate);
  const [jobTitle, setJobTitle] = useState(initialQuotation?.jobTitle || '');
  const [eventTime, setEventTime] = useState(initialQuotation?.eventTime || '');

  // Customer & Event Form State (Unified formData state for direct two-way binding)
  const [formData, setFormData] = useState({
    customerCode: initialQuotation?.customer.customerCode || '',
    customerName: initialQuotation?.customer.name || '',
    taxId: initialQuotation?.customer.taxId || '',
    address: initialQuotation?.customer.address || '',
    contactPerson: initialQuotation?.customer.contactPerson || '',
    mobile: initialQuotation?.customer.mobile || '',
    phone: initialQuotation?.customer.phone || '',
    email: initialQuotation?.customer.email || '',
    eventDate: initialQuotation?.eventDate || initialQuotation?.usageDate || defaultDate || '',
  });

  // Backward-compatible individual field aliases
  const customerName = formData.customerName;
  const taxId = formData.taxId;
  const address = formData.address;
  const customerCode = formData.customerCode;
  const contactPerson = formData.contactPerson;
  const mobile = formData.mobile;
  const phone = formData.phone;
  const email = formData.email;
  const eventDate = formData.eventDate;

  const setCustomerCode = (val: string) => setFormData((prev) => ({ ...prev, customerCode: val }));
  const setCustomerName = (val: string) => setFormData((prev) => ({ ...prev, customerName: val }));
  const setTaxId = (val: string) => setFormData((prev) => ({ ...prev, taxId: val }));
  const setAddress = (val: string) => setFormData((prev) => ({ ...prev, address: val }));
  const setContactPerson = (val: string) => setFormData((prev) => ({ ...prev, contactPerson: val }));
  const setMobile = (val: string) => setFormData((prev) => ({ ...prev, mobile: val }));
  const setPhone = (val: string) => setFormData((prev) => ({ ...prev, phone: val }));
  const setEmail = (val: string) => setFormData((prev) => ({ ...prev, email: val }));
  const setEventDate = (val: string) => setFormData((prev) => ({ ...prev, eventDate: val }));

  // Customer DB & Link Sync State
  const [customers, setCustomers] = useState<CustomerRecord[]>(loadCustomers);
  const [isCustomerSyncOpen, setIsCustomerSyncOpen] = useState(false);
  const [matchedCustomer, setMatchedCustomer] = useState<CustomerRecord | null>(() => {
    if (initialQuotation?.customer.customerCode) {
      return findCustomerByCode(initialQuotation.customer.customerCode, loadCustomers()) || null;
    }
    return null;
  });
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [isQuickSyncing, setIsQuickSyncing] = useState(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showSmartPaste, setShowSmartPaste] = useState(false);
  const [smartPasteText, setSmartPasteText] = useState('');
  const [syncConfig, setSyncConfig] = useState<CustomerSyncConfig>(loadSyncConfig);
  const [sheetUrlInput, setSheetUrlInput] = useState<string>(() => loadSyncConfig().sheetUrl || '');
  const [showSheetLinkBar, setShowSheetLinkBar] = useState<boolean>(true);

  // Customer discount rate state (sourced from initial quotation, matched customer from Column J, or default 0)
  const initialDiscountRate = initialQuotation?.customer.discountRate !== undefined
    ? initialQuotation.customer.discountRate
    : (matchedCustomer?.discountRate ?? 0);
  const [customerDiscountRate, setCustomerDiscountRate] = useState<number>(initialDiscountRate);
  const [discountRateInput, setDiscountRateInput] = useState<string>(String(initialDiscountRate));
  const [isDiscountOverridden, setIsDiscountOverridden] = useState<boolean>(false);

  // Line items
  const [items, setItems] = useState<QuotationItem[]>(() => {
    const rawItems = initialQuotation?.items || [
      {
        id: 'item-1',
        description: 'ค่าห้อง X11.2 ชั้น 11 วันที่ 26 กันยายน 2569',
        quantity: 1,
        unit: 'ห้อง',
        unitPrice: 7500,
        discountPercent: initialDiscountRate,
        amount: Math.max(0, Math.round((7500 - (7500 * initialDiscountRate) / 100) * 100) / 100),
        usageDate: initialQuotation?.eventDate || '2026-09-26',
        usageTime: initialQuotation?.eventTime || '08:00 - 18:00',
      },
    ];
    return rawItems.map((it) => ({
      ...it,
      description: stripWeekdayLabel(it.description),
      usageDate: it.usageDate || it.eventDate || initialQuotation?.eventDate || '',
      eventDate: it.usageDate || it.eventDate || initialQuotation?.eventDate || '',
      usageTime: it.usageTime || it.eventTime || initialQuotation?.eventTime || '',
      eventTime: it.usageTime || it.eventTime || initialQuotation?.eventTime || '',
    }));
  });

  // Payment terms: Private (7 days before event) vs Government (30 days billing credit)
  const [paymentTermType, setPaymentTermType] = useState<PaymentTermType>(() => {
    if (initialQuotation?.paymentTermType) return initialQuotation.paymentTermType;
    const initDept = matchedCustomer?.department || '';
    const initName = initialQuotation?.customer?.name || '';
    if (
      initDept.includes('ราชการ') ||
      initDept.includes('มหาวิทยาลัย') ||
      initName.includes('มหาวิทยาลัย') ||
      initName.includes('ราชการ')
    ) {
      return 'GOVERNMENT_30_DAYS';
    }
    return 'PRIVATE_7_DAYS';
  });

  const [paymentDueDate, setPaymentDueDate] = useState(initialQuotation?.paymentDueDate || '2026-09-19');
  const [cancellationNoticeDate, setCancellationNoticeDate] = useState(initialQuotation?.cancellationNoticeDate || '2026-09-12');
  const [customPaymentTermsText, setCustomPaymentTermsText] = useState<string>(
    initialQuotation?.translations?.th?.customPaymentTermsText ||
    (initialQuotation?.language !== 'en' ? initialQuotation?.customPaymentTermsText : '') ||
    initialQuotation?.customPaymentTermsText ||
    ''
  );
  const [customPaymentTermsTextEn, setCustomPaymentTermsTextEn] = useState<string>(
    initialQuotation?.customPaymentTermsTextEn ||
    initialQuotation?.translations?.en?.customPaymentTermsText ||
    (initialQuotation?.language === 'en' ? initialQuotation?.customPaymentTermsText : '') ||
    ''
  );
  const [termsActiveTab, setTermsActiveTab] = useState<'th' | 'en'>(
    initialQuotation?.language === 'en' ? 'en' : 'th'
  );
  const [paymentLanguage, setPaymentLanguage] = useState<'auto' | 'th' | 'en'>(
    initialQuotation?.paymentLanguage || 'auto'
  );
  const [overtimeNote, setOvertimeNote] = useState(
    initialQuotation?.overtimeNote || 'กรณีใช้งานเกิน 18.00 จะมีค่าบริการจัดสถานที่'
  );
  const [specialRemarks, setSpecialRemarks] = useState(initialQuotation?.specialRemarks || '');
  // เพิ่ม State สำหรับเก็บรูปโลโก้และข้อความหัวกระดาษ + ข้อมูลบริษัท (โหลดค่าจาก localStorage หรือค่าเริ่มต้น)
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [logoUrl, setLogoUrl] = useState<string>(() => {
    if (initialQuotation?.logoUrl !== undefined && initialQuotation.logoUrl !== '') {
      return initialQuotation.logoUrl;
    }
    const saved = getSavedHeaderBranding();
    return saved?.logoUrl ?? (initialQuotation?.logoUrl || '');
  });
  const [headerTitle, setHeaderTitle] = useState<string>(() => {
    if (initialQuotation?.headerTitle !== undefined && initialQuotation.headerTitle !== '') {
      return initialQuotation.headerTitle;
    }
    const saved = getSavedHeaderBranding();
    return saved?.headerTitle ?? (initialQuotation?.headerTitle || 'ใบเสนอราคา');
  });
  const [headerSubtitle, setHeaderSubtitle] = useState<string>(() => {
    const raw = (initialQuotation?.headerSubtitle !== undefined && initialQuotation.headerSubtitle !== '')
      ? initialQuotation.headerSubtitle
      : getSavedHeaderBranding()?.headerSubtitle ?? '';
    if (raw === '(ต้นฉบับ)' || raw === 'ต้นฉบับ' || raw === '(ORIGINAL)' || raw === 'ORIGINAL') {
      return '';
    }
    return raw;
  });

  // ข้อมูลบริษัทสำหรับหัวกระดาษ (Company Name, Tax ID, Address, Website, Phone)
  const [companyName, setCompanyName] = useState<string>(() => {
    if (initialQuotation?.companyInfo?.companyName !== undefined) {
      return initialQuotation.companyInfo.companyName;
    }
    const saved = getSavedHeaderBranding();
    return saved?.companyName ?? 'Knowledge Xchange';
  });
  const [companyTaxId, setCompanyTaxId] = useState<string>(() => {
    if (initialQuotation?.companyInfo?.taxId !== undefined) {
      return initialQuotation.companyInfo.taxId;
    }
    const saved = getSavedHeaderBranding();
    return saved?.companyTaxId ?? '099-4-000-16009-7';
  });
  const [companyAddress, setCompanyAddress] = useState<string>(() => {
    if (initialQuotation?.companyInfo?.address !== undefined) {
      return initialQuotation.companyInfo.address;
    }
    const saved = getSavedHeaderBranding();
    return saved?.companyAddress ?? '110/1 อาคารเคเอกซ์ ถนนกรุงธนบุรี\nแขวงบางลำภูล่าง เขตคลองสาน\nกทม. 10600';
  });
  const [companyWebsite, setCompanyWebsite] = useState<string>(() => {
    if (initialQuotation?.companyInfo?.website !== undefined) {
      return initialQuotation.companyInfo.website;
    }
    const saved = getSavedHeaderBranding();
    return saved?.companyWebsite ?? 'www.kxinnovation.com';
  });
  const [companyPhone, setCompanyPhone] = useState<string>(() => {
    if (initialQuotation?.companyInfo?.phone !== undefined) {
      return initialQuotation.companyInfo.phone;
    }
    const saved = getSavedHeaderBranding();
    return saved?.companyPhone ?? '02-470-7906, 02-470-7907';
  });

  // ข้อมูลบัญชีธนาคารและการชำระเงิน (Bank Account & Payment QR)
  const [bankName, setBankName] = useState<string>(() => {
    if (initialQuotation?.bankInfo?.bankName) return initialQuotation.bankInfo.bankName;
    return getSavedBankInfo()?.bankName ?? 'ธนาคารกรุงไทย';
  });
  const [bankBranch, setBankBranch] = useState<string>(() => {
    if (initialQuotation?.bankInfo?.branch) return initialQuotation.bankInfo.branch;
    return getSavedBankInfo()?.branch ?? 'สาขา ม.เทคโนโลยีพระจอมเกล้าธนบุรี';
  });
  const [bankAccountName, setBankAccountName] = useState<string>(() => {
    if (initialQuotation?.bankInfo?.accountName) return initialQuotation.bankInfo.accountName;
    return getSavedBankInfo()?.accountName ?? 'มจธ.สำนักเคเอกซ์';
  });
  const [bankAccountNumber, setBankAccountNumber] = useState<string>(() => {
    if (initialQuotation?.bankInfo?.accountNumber) return initialQuotation.bankInfo.accountNumber;
    return getSavedBankInfo()?.accountNumber ?? '037-7-14212-0';
  });
  const [bankNameEn, setBankNameEn] = useState<string>(() => {
    if (initialQuotation?.bankInfoEn?.bankName) return initialQuotation.bankInfoEn.bankName;
    return 'Krungthai Bank Public Co., Ltd.';
  });
  const [bankBranchEn, setBankBranchEn] = useState<string>(() => {
    if (initialQuotation?.bankInfoEn?.branch) return initialQuotation.bankInfoEn.branch;
    return 'King Mongkut\'s University of Technology Thonburi Branch';
  });
  const [bankAccountNameEn, setBankAccountNameEn] = useState<string>(() => {
    if (initialQuotation?.bankInfoEn?.accountName) return initialQuotation.bankInfoEn.accountName;
    return 'KMUTT Knowledge Xchange';
  });
  const [bankAccountNumberEn, setBankAccountNumberEn] = useState<string>(() => {
    if (initialQuotation?.bankInfoEn?.accountNumber) return initialQuotation.bankInfoEn.accountNumber;
    return initialQuotation?.bankInfo?.accountNumber || '037-7-14212-0';
  });
  const [bankInfoActiveTab, setBankInfoActiveTab] = useState<'th' | 'en'>('th');
  const [qrPromptPayCode, setQrPromptPayCode] = useState<string>(() => {
    if (initialQuotation?.bankInfo?.qrPromptPayCode) return initialQuotation.bankInfo.qrPromptPayCode;
    return getSavedBankInfo()?.qrPromptPayCode ?? '0994000160097';
  });
  const [qrImageUrl, setQrImageUrl] = useState<string>(() => {
    if (initialQuotation?.bankInfo?.qrImageUrl) return initialQuotation.bankInfo.qrImageUrl;
    return getSavedBankInfo()?.qrImageUrl ?? '';
  });
  const [qrType, setQrType] = useState<'promptpay' | 'image' | 'custom_payload'>(() => {
    if (initialQuotation?.bankInfo?.qrType) return initialQuotation.bankInfo.qrType;
    if (initialQuotation?.bankInfo?.qrImageUrl) return 'image';
    return (getSavedBankInfo()?.qrType as any) || 'promptpay';
  });
  const [qrCustomPayload, setQrCustomPayload] = useState<string>(() => {
    if (initialQuotation?.bankInfo?.qrCustomPayload) return initialQuotation.bankInfo.qrCustomPayload;
    return getSavedBankInfo()?.qrCustomPayload ?? '';
  });
  const qrFileInputRef = useRef<HTMLInputElement>(null);


  // Custom Layout & Spacing Controller State
  const [layoutSettings, setLayoutSettings] = useState<QuotationLayoutSettings>(() => {
    const saved = getSavedHeaderBranding();
    const savedLayout = saved?.layoutSettings || {};
    return {
      ...DEFAULT_LAYOUT_SETTINGS,
      ...savedLayout,
      ...(initialQuotation?.layoutSettings || {}),
    };
  });
  const [isLayoutSettingsCollapsed, setIsLayoutSettingsCollapsed] = useState<boolean>(false);

  // Customer Pricing Memory & Frequent Items State
  const [rememberedGlobalItems, setRememberedGlobalItems] = useState<RememberedItem[]>(() => getRememberedItems());
  const [customerPricingPref, setCustomerPricingPref] = useState<CustomerPricingPreference | null>(() =>
    getCustomerPreference(formData.customerName || initialQuotation?.customer?.name || '')
  );

  useEffect(() => {
    if (formData.customerName) {
      const pref = getCustomerPreference(formData.customerName);
      setCustomerPricingPref(pref);
    } else {
      setCustomerPricingPref(null);
    }
  }, [formData.customerName]);

  // Collapsible Accordion States for All 7 Sections
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({
    headerBranding: !isEditing,
    metaInfo: false,
    customerInfo: false,
    roomCalculator: false,
    itemsTable: false,
    paymentSignatures: false,
    layoutPrint: !isEditing,
  });

  // Form display density/scale: 'compact' | 'standard' | 'spacious'
  const [formDensity, setFormDensity] = useState<'compact' | 'standard' | 'spacious'>(() => {
    try {
      const saved = localStorage.getItem('kx_form_density_pref');
      if (saved === 'compact' || saved === 'standard' || saved === 'spacious') {
        return saved;
      }
    } catch (e) {
      // fallback
    }
    return 'standard';
  });

  const handleSetFormDensity = (density: 'compact' | 'standard' | 'spacious') => {
    setFormDensity(density);
    try {
      localStorage.setItem('kx_form_density_pref', density);
    } catch (e) {
      // ignore
    }
  };

  const toggleSection = (sectionKey: string) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [sectionKey]: !prev[sectionKey],
    }));
  };

  const collapseAllSections = () => {
    setCollapsedSections({
      headerBranding: true,
      metaInfo: true,
      customerInfo: true,
      roomCalculator: true,
      itemsTable: true,
      paymentSignatures: true,
      layoutPrint: true,
    });
  };

  const expandAllSections = () => {
    setCollapsedSections({
      headerBranding: false,
      metaInfo: false,
      customerInfo: false,
      roomCalculator: false,
      itemsTable: false,
      paymentSignatures: false,
      layoutPrint: false,
    });
  };

  const expandEssentialSections = () => {
    setCollapsedSections({
      headerBranding: true,
      layoutPrint: true,
      metaInfo: false,
      customerInfo: false,
      roomCalculator: false,
      itemsTable: false,
      paymentSignatures: false,
    });
  };

  // ซิงค์บันทึกค่าหัวกระดาษ, ข้อมูลบริษัท และ Layout ลงใน localStorage อัตโนมัติเมื่อมีการเปลี่ยนแปลง
  useEffect(() => {
    try {
      localStorage.setItem(
        HEADER_BRANDING_STORAGE_KEY,
        JSON.stringify({
          logoUrl,
          headerTitle,
          headerSubtitle,
          companyName,
          companyTaxId,
          companyAddress,
          companyWebsite,
          companyPhone,
          layoutSettings: {
            headerFontFamily: layoutSettings.headerFontFamily,
            headerTitleFontSize: layoutSettings.headerTitleFontSize,
            headerSubtitleFontSize: layoutSettings.headerSubtitleFontSize,
            headerCompanyFontSize: layoutSettings.headerCompanyFontSize,
            companyFontFamily: layoutSettings.companyFontFamily,
            companyAlign: layoutSettings.companyAlign,
            companyLineHeight: layoutSettings.companyLineHeight,
            companyOffsetX: layoutSettings.companyOffsetX,
            companyOffsetY: layoutSettings.companyOffsetY,
            companyPaddingTop: layoutSettings.companyPaddingTop,
            companyPaddingBottom: layoutSettings.companyPaddingBottom,
            logoHeight: layoutSettings.logoHeight,
            logoAlign: layoutSettings.logoAlign,
            headerOffsetX: layoutSettings.headerOffsetX,
            headerOffsetY: layoutSettings.headerOffsetY,
            headerPaddingTop: layoutSettings.headerPaddingTop,
            headerPaddingBottom: layoutSettings.headerPaddingBottom,
            headerMarginBottom: layoutSettings.headerMarginBottom,
            showLogo: layoutSettings.showLogo,
            showHeaderCompanyInfo: layoutSettings.showHeaderCompanyInfo,
          },
        })
      );
    } catch (e) {
      console.warn('Failed to save header branding to localStorage:', e);
    }
  }, [
    logoUrl,
    headerTitle,
    headerSubtitle,
    companyName,
    companyTaxId,
    companyAddress,
    companyWebsite,
    companyPhone,
    layoutSettings,
  ]);

  const updateLayout = (updates: Partial<QuotationLayoutSettings>) => {
    setLayoutSettings((prev) => ({ ...prev, ...updates }));
  };

  // Auto-save bank info & payment QR preference to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(
        BANK_INFO_STORAGE_KEY,
        JSON.stringify({
          bankName,
          branch: bankBranch,
          accountName: bankAccountName,
          accountNumber: bankAccountNumber,
          qrPromptPayCode,
          qrImageUrl,
          qrType,
          qrCustomPayload,
        })
      );
    } catch (e) {
      console.warn('Failed to save bank info to localStorage:', e);
    }
  }, [bankName, bankBranch, bankAccountName, bankAccountNumber, qrPromptPayCode, qrImageUrl, qrType, qrCustomPayload]);

  const handleQRImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('กรุณาเลือกไฟล์ภาพขนาดไม่เกิน 5 MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setQrImageUrl(reader.result as string);
        setQrType('image');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveQRImage = () => {
    setQrImageUrl('');
    if (qrFileInputRef.current) {
      qrFileInputRef.current.value = '';
    }
    if (qrType === 'image') {
      setQrType('promptpay');
    }
  };

  // ฟังก์ชันรองรับการอัปโหลดไฟล์รูปภาพโลโก้

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('กรุณาเลือกไฟล์ภาพขนาดไม่เกิน 5 MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogo = () => {
    setLogoUrl('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const applyLayoutPreset = (preset: 'fit' | 'default' | 'compact' | 'spacious') => {
    switch (preset) {
      case 'fit':
        setLayoutSettings((prev) => ({
          ...prev,
          paddingTop: 24,
          paddingBottom: 24,
          paddingLeft: 30,
          paddingRight: 30,
          fontSize: 'compact',
          sectionSpacing: 'compact',
          logoHeight: 48,
        }));
        break;
      case 'compact':
        setLayoutSettings((prev) => ({
          ...prev,
          paddingTop: 20,
          paddingBottom: 20,
          paddingLeft: 25,
          paddingRight: 25,
          fontSize: 'compact',
          sectionSpacing: 'compact',
          logoHeight: 44,
        }));
        break;
      case 'spacious':
        setLayoutSettings((prev) => ({
          ...prev,
          paddingTop: 44,
          paddingBottom: 44,
          paddingLeft: 44,
          paddingRight: 44,
          fontSize: 'large',
          sectionSpacing: 'relaxed',
          logoHeight: 64,
        }));
        break;
      case 'default':
      default:
        setLayoutSettings((prev) => ({
          ...DEFAULT_LAYOUT_SETTINGS,
          showLogo: prev.showLogo,
          showPaymentTerms: prev.showPaymentTerms,
          showOvertimeNote: prev.showOvertimeNote,
          showBankInfo: prev.showBankInfo,
          showSignatures: prev.showSignatures,
        }));
        break;
    }
  };

  // Master Real-time Discount Controller & Manual Override
  const handleDiscountChange = (newVal: string, isManual = true) => {
    setDiscountRateInput(newVal);
    if (isManual) {
      setIsDiscountOverridden(true);
    }

    const trimmed = newVal.trim();
    let numericRate = 0;
    if (trimmed !== '') {
      const parsed = parseFloat(trimmed);
      if (!isNaN(parsed)) {
        numericRate = Math.max(0, Math.min(100, Math.round(parsed * 100) / 100));
      }
    }

    setCustomerDiscountRate(numericRate);

    // Apply new discount to all line items in real-time
    setItems((prev) =>
      prev.map((item) => {
        const subtotal = item.quantity * item.unitPrice;
        const discAmount = (subtotal * numericRate) / 100;
        return {
          ...item,
          discountPercent: numericRate,
          amount: Math.max(0, Math.round((subtotal - discAmount) * 100) / 100),
        };
      })
    );
  };

  // Automatic calculation of Payment Due Date and Cancellation Notice Date from Event Date
  const calculateTermsDates = (
    targetEventDate: string,
    termType: PaymentTermType,
    showToast = false
  ) => {
    if (!targetEventDate) return;
    try {
      const parts = targetEventDate.split('-');
      if (parts.length !== 3) return;
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10);
      const d = parseInt(parts[2], 10);
      if (!y || !m || !d) return;

      const evt = new Date(y, m - 1, d);

      // 1. Cancellation / Exception notice: at least 14 days before event
      const noticeDate = new Date(evt);
      noticeDate.setDate(noticeDate.getDate() - 14);
      const noticeStr = `${noticeDate.getFullYear()}-${String(noticeDate.getMonth() + 1).padStart(2, '0')}-${String(noticeDate.getDate()).padStart(2, '0')}`;
      setCancellationNoticeDate(noticeStr);

      // 2. Payment due date
      if (termType === 'PRIVATE_7_DAYS') {
        // Private: at least 7 days before event start
        const payDate = new Date(evt);
        payDate.setDate(payDate.getDate() - 7);
        const payStr = `${payDate.getFullYear()}-${String(payDate.getMonth() + 1).padStart(2, '0')}-${String(payDate.getDate()).padStart(2, '0')}`;
        setPaymentDueDate(payStr);
      } else {
        // Government: 30 days credit billing after event
        const payDate = new Date(evt);
        payDate.setDate(payDate.getDate() + 30);
        const payStr = `${payDate.getFullYear()}-${String(payDate.getMonth() + 1).padStart(2, '0')}-${String(payDate.getDate()).padStart(2, '0')}`;
        setPaymentDueDate(payStr);
      }

      if (showToast) {
        setSyncStatusMsg({
          type: 'success',
          text: `คำนวณวันชำระเงิน (${termType === 'PRIVATE_7_DAYS' ? 'ลูกค้าเอกชน ก่อนจัดงาน 7 วัน' : 'ลูกค้าราชการ เครดิต 30 วัน'}) และวันแจ้งยกเว้น (14 วัน) เรียบร้อยแล้ว`,
        });
        setTimeout(() => setSyncStatusMsg(null), 4000);
      }
    } catch (e) {
      console.error('Failed to calculate terms dates:', e);
    }
  };

  const applyCustomerDiscountToAll = (rate: number) => {
    handleDiscountChange(String(rate), false);
    setSyncStatusMsg({
      type: 'success',
      text: `นำส่วนลด ${rate}% ไปใช้กับทุกรายการในใบเสนอราคาเรียบร้อยแล้ว`,
    });
    setTimeout(() => setSyncStatusMsg(null), 3500);
  };

  // Sync listener to receive customer updates across components
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

  // Real-time Background Sync with Google Sheets (on Mount, Tab Focus & Periodic 30s)
  useEffect(() => {
    let isMounted = true;

    const performBackgroundSync = async () => {
      const config = loadSyncConfig();
      if (!config.sheetUrl || config.autoSync === false) return;

      try {
        const res = await syncCustomersRealtime();
        if (isMounted && res.success && res.customers) {
          setCustomers(res.customers);
        }
      } catch (e) {
        // Silent background sync
      }
    };

    // 1. Initial sync on editor open
    performBackgroundSync();

    // 2. Real-time sync when switching back from Google Sheets tab
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        performBackgroundSync();
      }
    };
    window.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', handleVisibility);

    // 3. Periodic real-time interval (30 seconds)
    const timer = setInterval(performBackgroundSync, 30000);

    return () => {
      isMounted = false;
      window.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', handleVisibility);
      clearInterval(timer);
    };
  }, []);

  // Handler to apply selected/matched customer to all form inputs
  const applyCustomer = (cust: CustomerRecord, showToast = true, overwriteCode = true) => {
    if (!cust) return;
    const cleanCust = sanitizeCustomerRecord(cust);

    const newCode = (overwriteCode && cleanCust.customerCode) ? cleanCust.customerCode : (cust.customerCode || formData.customerCode);
    const newName = cleanCust.name === 'ลูกค้าไม่ระบุชื่อ' ? '' : (cleanCust.name || (cust as any).customerName || '');
    const newTaxId = cleanCust.taxId || (cust as any).taxId || '';
    const newAddress = cleanCust.address || (cust as any).address || '';
    const newContact = cleanCust.contactPerson || (cust as any).contact || (cust as any).contactPerson || '';
    const newMobile = cleanCust.mobile || cleanCust.phone || (cust as any).mobile || (cust as any).phone || '';
    const newPhone = cleanCust.phone || cleanCust.mobile || (cust as any).phone || (cust as any).mobile || '';
    const newEmail = cleanCust.email || (cust as any).email || '';

    const newEventDate = (!isEditing && (cleanCust.eventDate || (cleanCust as any).usageDate))
      ? (cleanCust.eventDate || (cleanCust as any).usageDate)
      : formData.eventDate;

    // Auto-fill all customer fields directly into formData State
    setFormData(prev => ({
      ...prev,
      customerCode: newCode,
      customerName: newName,
      taxId: newTaxId,
      address: newAddress,
      contactPerson: newContact,
      mobile: newMobile,
      phone: newPhone,
      email: newEmail,
      eventDate: newEventDate || prev.eventDate,
    }));

    const targetDate = cleanCust.eventDate || eventDate;
    if (!isEditing) {
      if (cleanCust.jobTitle) setJobTitle(cleanCust.jobTitle);
      if (cleanCust.eventDate) setEventDate(cleanCust.eventDate);
      if (cleanCust.eventTime) setEventTime(cleanCust.eventTime);
    }

    // 1. Auto-pull Column J discount as Default Value
    const sheetDiscount = cleanCust.discountRate !== undefined && cleanCust.discountRate >= 0 ? cleanCust.discountRate : 0;
    setCustomerDiscountRate(sheetDiscount);
    setDiscountRateInput(String(sheetDiscount));
    setIsDiscountOverridden(false);

    // Apply default discount from Column J to all line items immediately
    setItems((prev) =>
      prev.map((item) => {
        const subtotal = item.quantity * item.unitPrice;
        const discAmount = (subtotal * sheetDiscount) / 100;
        return {
          ...item,
          discountPercent: sheetDiscount,
          amount: Math.max(0, Math.round((subtotal - discAmount) * 100) / 100),
        };
      })
    );

    // Apply Payment Terms based on Department (Government 30 days credit vs Private 7 days)
    const custDept = String(cleanCust.department || '');
    const custName = String(cleanCust.name || '');
    const isGov =
      custDept.includes('ราชการ') ||
      custDept.includes('มหาวิทยาลัย') ||
      custDept.includes('รัฐ') ||
      custName.includes('มหาวิทยาลัย') ||
      custName.includes('ราชการ') ||
      custName.includes('กระทรวง') ||
      custName.includes('กรม');
    
    const newTerm: PaymentTermType = isGov ? 'GOVERNMENT_30_DAYS' : 'PRIVATE_7_DAYS';
    setPaymentTermType(newTerm);
    calculateTermsDates(targetDate, newTerm);

    setMatchedCustomer(cleanCust);
    setShowCustomerDropdown(false);
    if (showToast) {
      const detailsList = [
        `รหัส: ${cleanCust.customerCode}`,
        cleanCust.taxId ? `เลขผู้เสียภาษี: ${cleanCust.taxId}` : '',
        newPhone ? `โทร: ${newPhone}` : '',
        cleanCust.email ? `อีเมล: ${cleanCust.email}` : '',
        cleanCust.address ? `ที่อยู่: ${cleanCust.address.length > 25 ? cleanCust.address.slice(0, 25) + '...' : cleanCust.address}` : '',
        `ส่วนลด: ${sheetDiscount}%`,
      ].filter(Boolean).join(' • ');

      setSyncStatusMsg({
        type: 'success',
        text: `ดึงข้อมูลลูกค้าสำเร็จ: ${cleanCust.name} (${detailsList})`,
      });
      setTimeout(() => setSyncStatusMsg(null), 5000);
    }
  };

  // Handler to parse and apply raw customer text / copy-pasted blocks
  const handleApplySmartPaste = () => {
    if (!smartPasteText.trim()) {
      setSyncStatusMsg({
        type: 'error',
        text: 'กรุณาวางข้อความข้อมูลลูกค้าในช่องก่อนกดประมวลผล',
      });
      return;
    }

    try {
      const records = parseCustomerData(smartPasteText, 'วางข้อความเร็ว');
      if (records && records.length > 0) {
        const target = records[0];
        const { merged } = mergeCustomers(customers, records);
        setCustomers(merged);
        applyCustomer(target, true, true);
        setShowSmartPaste(false);
        setSmartPasteText('');
        setSyncStatusMsg({
          type: 'success',
          text: `แยกข้อมูลและกรอกฟอร์มสำเร็จ: ${target.name} (${target.customerCode || 'ลูกค้า'}) • บันทึกลงฐานข้อมูลแล้ว`,
        });
        setTimeout(() => setSyncStatusMsg(null), 5000);
      } else {
        setSyncStatusMsg({
          type: 'error',
          text: 'ไม่สามารถแยกข้อมูลได้ กรุณาตรวจสอบว่ามีชื่อบริษัท, รหัสลูกค้า, หรือที่อยู่',
        });
      }
    } catch (err: any) {
      setSyncStatusMsg({
        type: 'error',
        text: err?.message || 'เกิดข้อผิดพลาดในการประมวลผลข้อความ',
      });
    }
  };

  // Handler when typing in customer code field
  const handleCustomerCodeChange = (val: string) => {
    setCustomerCode(val);
    setShowCustomerDropdown(true);

    if (!val || !val.trim()) {
      setMatchedCustomer(null);
      return;
    }

    // Auto-apply if exact or unambiguous match (by code, numbers, tax ID, or name)
    const found = findCustomerByCode(val, customers);
    if (found) {
      applyCustomer(found, false, false);
    } else {
      setMatchedCustomer(null);
    }
  };

  // Manual trigger when user presses Enter, clicks "ดึงข้อมูล", or exits customer code field (with fresh Google Sheets real-time sync)
  const handleCustomerLookup = async (overrideCode?: string) => {
    const trimmed = (overrideCode || formData.customerCode).trim();
    if (!trimmed) {
      setShowCustomerDropdown(true);
      setSyncStatusMsg({
        type: 'error',
        text: 'กรุณากรอกรหัสลูกค้า (เช่น KX002258), ชื่อบริษัท, หรือเลขผู้เสียภาษี เพื่อดึงข้อมูล',
      });
      return;
    }

    const targetUrl = (sheetUrlInput || syncConfig.sheetUrl || '').trim();

    // 1. Fresh Real-time Google Sheets Sync (No cache) if link is available
    if (targetUrl) {
      setIsQuickSyncing(true);
      try {
        const result = await fetchCustomerDataFromUrl(targetUrl);
        if (result.records && result.records.length > 0) {
          const { merged } = mergeCustomers(customers, result.records);
          setCustomers(merged);

          // Find customer in newly fetched real-time records
          const sheetMatch = findCustomerByCode(trimmed, result.records) || findCustomerByCode(trimmed, merged);
          if (sheetMatch) {
            setFormData(prev => ({
              ...prev,
              customerCode: sheetMatch.customerCode || prev.customerCode,
              customerName: (sheetMatch as any).name || (sheetMatch as any).customerName || '',
              taxId: (sheetMatch as any).taxId || '',
              contactPerson: (sheetMatch as any).contact || (sheetMatch as any).contactPerson || '',
              phone: (sheetMatch as any).phone || (sheetMatch as any).mobile || '',
              mobile: (sheetMatch as any).mobile || (sheetMatch as any).phone || '',
              email: (sheetMatch as any).email || '',
              address: (sheetMatch as any).address || '',
            }));
            applyCustomer(sheetMatch, true, true);
            setIsQuickSyncing(false);
            setShowCustomerDropdown(false);
            return;
          }
        }
      } catch (err: any) {
        console.warn('Real-time Google Sheet sync error, falling back to local database:', err);
      } finally {
        setIsQuickSyncing(false);
      }
    }

    // 2. Check local database / cache
    const found = findCustomerByCode(trimmed, customers);
    if (found) {
      setFormData(prev => ({
        ...prev,
        customerCode: found.customerCode || prev.customerCode,
        customerName: (found as any).name || (found as any).customerName || '',
        taxId: (found as any).taxId || '',
        contactPerson: (found as any).contact || (found as any).contactPerson || '',
        phone: (found as any).phone || (found as any).mobile || '',
        mobile: (found as any).mobile || (found as any).phone || '',
        email: (found as any).email || '',
        address: (found as any).address || '',
      }));
      applyCustomer(found, true, true);
      setShowCustomerDropdown(false);
      return;
    }

    // 3. Search candidates
    setShowCustomerDropdown(true);
    const candidates = searchCustomers(trimmed, customers);
    if (candidates.length > 0) {
      if (candidates.length === 1) {
        const singleFound = candidates[0];
        setFormData(prev => ({
          ...prev,
          customerCode: singleFound.customerCode || prev.customerCode,
          customerName: (singleFound as any).name || (singleFound as any).customerName || '',
          taxId: (singleFound as any).taxId || '',
          contactPerson: (singleFound as any).contact || (singleFound as any).contactPerson || '',
          phone: (singleFound as any).phone || (singleFound as any).mobile || '',
          mobile: (singleFound as any).mobile || (singleFound as any).phone || '',
          email: (singleFound as any).email || '',
          address: (singleFound as any).address || '',
        }));
        applyCustomer(singleFound, true, true);
        setShowCustomerDropdown(false);
        return;
      }
      setSyncStatusMsg({
        type: 'success',
        text: `พบ ${candidates.length} รายการที่ใกล้เคียงกับ "${trimmed}" (คลิกเลือกในรายการแนะนำด้านล่าง)`,
      });
    } else {
      setSyncStatusMsg({
        type: 'error',
        text: `ไม่พบข้อมูลสำหรับ "${trimmed}" ใน Google Sheets หรือฐานข้อมูล (${customers.length} รายการ) ตรวจสอบรหัสหรือกดซิงค์จากชีต`,
      });
    }
  };

  const handleManualLookup = handleCustomerLookup;

  // Quick sync from saved Google Sheets link
  const handleQuickSyncFromLink = async () => {
    const url = (sheetUrlInput || syncConfig.sheetUrl || '').trim();
    if (url) {
      await handleDirectSheetSync(url);
      return;
    }
    // No link saved yet, make sure customer section is opened and open sync modal
    setCollapsedSections(prev => ({ ...prev, customerInfo: false }));
    setIsCustomerSyncOpen(true);
  };

  // Direct sync from typed/pasted Google Sheets link
  const handleDirectSheetSync = async (urlToSync?: string) => {
    const targetUrl = (urlToSync || sheetUrlInput || syncConfig.sheetUrl || '').trim();
    if (!targetUrl) {
      setCollapsedSections(prev => ({ ...prev, customerInfo: false }));
      setIsCustomerSyncOpen(true);
      setSyncStatusMsg({
        type: 'error',
        text: 'กรุณาระบุลิงก์ Google Sheets สำหรับซิงค์ข้อมูล',
      });
      return;
    }

    setIsQuickSyncing(true);
    setSyncStatusMsg(null);

    try {
      const result = await fetchCustomerDataFromUrl(targetUrl);
      if (!result.records || result.records.length === 0) {
        setSyncStatusMsg({
          type: 'error',
          text: 'เชื่อมต่อชีตได้ แต่ไม่พบข้อมูลลูกค้า กรุณาตรวจสอบหัวตาราง (รหัสลูกค้า, ชื่อบริษัท, ที่อยู่)',
        });
        setIsQuickSyncing(false);
        return;
      }

      const { merged, addedCount, updatedCount } = mergeCustomers(customers, result.records);
      setCustomers(merged);

      // Save sync config
      const newConfig: CustomerSyncConfig = {
        sheetUrl: targetUrl,
        lastSyncedAt: new Date().toISOString(),
        autoSync: true,
      };
      saveSyncConfig(newConfig);
      setSyncConfig(newConfig);
      setSheetUrlInput(targetUrl);

      setSyncStatusMsg({
        type: 'success',
        text: `🎉 ซิงค์ข้อมูลเรียลไทม์สำเร็จ! ดึงลูกค้าได้ ${result.records.length} รายการ (เพิ่มใหม่ ${addedCount} ราย, ปรับปรุง ${updatedCount} ราย รวมทั้งหมด ${merged.length} ราย) พร้อมคำนวณส่วนลดคอลัมน์ J อัตโนมัติทันที`,
      });
      setTimeout(() => setSyncStatusMsg(null), 6000);

      // If customerCode is already typed, re-apply it from fresh records
      if (formData.customerCode) {
        const matched = findCustomerByCode(formData.customerCode, merged);
        if (matched) {
          setFormData(prev => ({
            ...prev,
            customerCode: matched.customerCode || formData.customerCode,
            customerName: (matched as any).name || (matched as any).customerName || '',
            taxId: (matched as any).taxId || '',
            contactPerson: (matched as any).contact || (matched as any).contactPerson || '',
            phone: (matched as any).phone || (matched as any).mobile || '',
            mobile: (matched as any).mobile || (matched as any).phone || '',
            email: (matched as any).email || '',
            address: (matched as any).address || '',
          }));
          applyCustomer(matched, true, true);
        }
      }
    } catch (err: any) {
      setSyncStatusMsg({
        type: 'error',
        text: err?.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อ Google Sheets',
      });
    } finally {
      setIsQuickSyncing(false);
    }
  };

  const handleSync = handleDirectSheetSync;

  // Save current customer info in form directly into customer database
  const handleSaveCurrentCustomerToDb = () => {
    if (!customerName.trim() && !customerCode.trim()) {
      setSyncStatusMsg({
        type: 'error',
        text: 'กรุณาระบุรหัสลูกค้าหรือชื่อบริษัทก่อนบันทึกลงฐานข้อมูล',
      });
      return;
    }

    const cleanCode = normalizeCustomerCode(customerCode) || `CUST-${Date.now()}`;
    const newRecord: CustomerRecord = {
      id: matchedCustomer?.id || `cust-${cleanCode}`,
      customerCode: cleanCode,
      name: customerName.trim() || 'ลูกค้าไม่ระบุชื่อ',
      taxId: taxId.trim(),
      address: address.trim(),
      contactPerson: contactPerson.trim(),
      mobile: mobile.trim(),
      phone: phone.trim(),
      email: email.trim(),
      department: paymentTermType === 'GOVERNMENT_30_DAYS' ? 'ราชการ' : 'เอกชน',
      discountRate: customerDiscountRate,
      source: 'บันทึกจากหน้าใบเสนอราคา',
      updatedAt: new Date().toISOString(),
    };

    const { merged, addedCount, updatedCount } = mergeCustomers(customers, [newRecord]);
    setCustomers(merged);
    setMatchedCustomer(newRecord);
    setSyncStatusMsg({
      type: 'success',
      text: `บันทึกข้อมูลลูกค้า "${newRecord.name} (${newRecord.customerCode})" ลงในฐานข้อมูลเรียบร้อยแล้ว`,
    });
    setTimeout(() => setSyncStatusMsg(null), 4000);
  };

  // Room catalog state & modal
  const [roomCatalog, setRoomCatalog] = useState<RoomCatalogItem[]>(loadRoomCatalog);
  const [isRoomCatalogModalOpen, setIsRoomCatalogModalOpen] = useState(false);
  const [isFoodCateringModalOpen, setIsFoodCateringModalOpen] = useState(false);

  useEffect(() => {
    const handleRoomsUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<RoomCatalogItem[]>;
      if (customEvent.detail) {
        setRoomCatalog(customEvent.detail);
      }
    };
    window.addEventListener('kx_rooms_updated', handleRoomsUpdate);
    return () => window.removeEventListener('kx_rooms_updated', handleRoomsUpdate);
  }, []);

  // Signatures State (Text & Signature Images)
  const preparedBySigInputRef = useRef<HTMLInputElement>(null);
  const approvedBySigInputRef = useRef<HTMLInputElement>(null);
  const authorizedSigInputRef = useRef<HTMLInputElement>(null);

  // Customer / Received By Signature State (Image 2)
  const [receivedByEnabled, setReceivedByEnabled] = useState<boolean>(
    initialQuotation?.signatures?.receivedBy?.enabled !== false
  );
  const [receivedByTitle, setReceivedByTitle] = useState<string>(
    initialQuotation?.signatures?.receivedBy?.title || 'ผู้รับบริการ/Received By'
  );
  const [receivedByName, setReceivedByName] = useState<string>(() => {
    if (initialQuotation?.signatures?.receivedBy?.name !== undefined) {
      return initialQuotation.signatures.receivedBy.name;
    }
    return initialQuotation?.customer?.contactPerson || initialQuotation?.customer?.name || '';
  });
  const [receivedBySignatureUrl, setReceivedBySignatureUrl] = useState<string>(
    initialQuotation?.signatures?.receivedBy?.signatureUrl || ''
  );
  const [receivedByMode, setReceivedByMode] = useState<'handwrite' | 'image' | 'text'>(() => {
    if (initialQuotation?.signatures?.receivedBy?.mode) {
      return initialQuotation.signatures.receivedBy.mode;
    }
    return initialQuotation?.signatures?.receivedBy?.signatureUrl ? 'image' : 'handwrite';
  });
  const [receivedByDate, setReceivedByDate] = useState<string>(
    initialQuotation?.signatures?.receivedBy?.date || ''
  );

  // Dynamic Prepared By Presets State & Modal
  const [preparedByPresets, setPreparedByPresets] = useState<SignerPreset[]>(loadPreparedByPresets);
  const [isManagePreparedByModalOpen, setIsManagePreparedByModalOpen] = useState(false);

  useEffect(() => {
    const handlePresetsUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<SignerPreset[]>;
      if (customEvent.detail) {
        setPreparedByPresets(customEvent.detail);
      }
    };
    window.addEventListener('kx_prepared_by_presets_updated', handlePresetsUpdate);
    return () => window.removeEventListener('kx_prepared_by_presets_updated', handlePresetsUpdate);
  }, []);

  const handleSavePresetsList = (newPresets: SignerPreset[]) => {
    setPreparedByPresets(newPresets);
    savePreparedByPresets(newPresets);
  };

  const [preparedByEnabled, setPreparedByEnabled] = useState<boolean>(
    initialQuotation?.signatures?.preparedBy?.enabled !== false
  );
  const [preparedByTitle, setPreparedByTitle] = useState<string>(
    initialQuotation?.signatures?.preparedBy?.title || 'ผู้จัดทำ/Prepared By'
  );
  const [preparedByDate, setPreparedByDate] = useState<string>(
    initialQuotation?.signatures?.preparedBy?.date || ''
  );
  const [preparedByMode, setPreparedByMode] = useState<'handwrite' | 'image' | 'text'>(() => {
    if (initialQuotation?.signatures?.preparedBy?.mode) {
      return initialQuotation.signatures.preparedBy.mode;
    }
    const saved = getSavedSignatures();
    const sigUrl =
      initialQuotation?.signatures?.preparedBy?.signatureUrl ||
      saved?.preparedBy?.signatureUrl ||
      preparedByPresets[0]?.signatureUrl;
    return sigUrl ? 'image' : 'text';
  });

  const [preparedBy, setPreparedBy] = useState(() => {
    if (initialQuotation?.signatures?.preparedBy?.name !== undefined) {
      return initialQuotation.signatures.preparedBy.name;
    }
    const saved = getSavedSignatures();
    return userProfile?.displayName || saved?.preparedBy?.name || preparedByPresets[0]?.name || 'พจนา (ฝ่ายขาย)';
  });

  const [preparedBySignatureUrl, setPreparedBySignatureUrl] = useState<string>(() => {
    if (initialQuotation?.signatures?.preparedBy?.signatureUrl !== undefined) {
      return initialQuotation.signatures.preparedBy.signatureUrl;
    }
    const saved = getSavedSignatures();
    if (saved?.preparedBy?.signatureUrl !== undefined) {
      return saved.preparedBy.signatureUrl;
    }
    const targetName = userProfile?.displayName || preparedByPresets[0]?.name || 'พจนา (ฝ่ายขาย)';
    const staffSaved = getStaffSavedSignature(targetName);
    if (staffSaved) return staffSaved;
    const preset = findPreparedPreset(targetName, preparedByPresets) || preparedByPresets[0];
    return preset?.signatureUrl || '';
  });

  const [approvedByEnabled, setApprovedByEnabled] = useState<boolean>(
    initialQuotation?.signatures?.approvedBy?.enabled !== false
  );
  const [approvedByTitle, setApprovedByTitle] = useState<string>(
    initialQuotation?.signatures?.approvedBy?.title || 'ผู้ตรวจสอบ/Approved By'
  );
  const [approvedByDate, setApprovedByDate] = useState<string>(
    initialQuotation?.signatures?.approvedBy?.date || ''
  );
  const [approvedByMode, setApprovedByMode] = useState<'handwrite' | 'image' | 'text'>(() => {
    if (initialQuotation?.signatures?.approvedBy?.mode) {
      return initialQuotation.signatures.approvedBy.mode;
    }
    const saved = getSavedSignatures();
    const sigUrl =
      initialQuotation?.signatures?.approvedBy?.signatureUrl ||
      saved?.approvedBy?.signatureUrl ||
      PRESET_APPROVED_BY[0]?.signatureUrl;
    return sigUrl ? 'image' : 'text';
  });

  const [approvedBy, setApprovedBy] = useState(() => {
    if (initialQuotation?.signatures?.approvedBy?.name !== undefined) {
      return initialQuotation.signatures.approvedBy.name;
    }
    const saved = getSavedSignatures();
    return saved?.approvedBy?.name ?? 'ศิริวรรณ';
  });
  const [approvedBySignatureUrl, setApprovedBySignatureUrl] = useState<string>(() => {
    if (initialQuotation?.signatures?.approvedBy?.signatureUrl !== undefined) {
      return initialQuotation.signatures.approvedBy.signatureUrl;
    }
    const saved = getSavedSignatures();
    if (saved?.approvedBy?.signatureUrl !== undefined) {
      return saved.approvedBy.signatureUrl;
    }
    return PRESET_APPROVED_BY.find(p => p.name === 'ศิริวรรณ')?.signatureUrl || '';
  });

  const [authorizedEnabled, setAuthorizedEnabled] = useState<boolean>(
    initialQuotation?.signatures?.authorizedSignature?.enabled !== false
  );
  const [authorizedTitle, setAuthorizedTitle] = useState<string>(
    initialQuotation?.signatures?.authorizedSignature?.title || 'ผู้มีอำนาจลงนาม/Authorized Signature'
  );
  const [authorizedDate, setAuthorizedDate] = useState<string>(
    initialQuotation?.signatures?.authorizedSignature?.date || ''
  );
  const [authorizedMode, setAuthorizedMode] = useState<'handwrite' | 'image' | 'text'>(() => {
    if (initialQuotation?.signatures?.authorizedSignature?.mode) {
      return initialQuotation.signatures.authorizedSignature.mode;
    }
    const saved = getSavedSignatures();
    const sigUrl =
      initialQuotation?.signatures?.authorizedSignature?.signatureUrl ||
      saved?.authorizedSignature?.signatureUrl ||
      PRESET_AUTHORIZED[0]?.signatureUrl;
    return sigUrl ? 'image' : 'text';
  });

  const [authorizedName, setAuthorizedName] = useState(() => {
    if (initialQuotation?.signatures?.authorizedSignature?.name !== undefined) {
      return initialQuotation.signatures.authorizedSignature.name;
    }
    const saved = getSavedSignatures();
    return saved?.authorizedSignature?.name ?? 'ดร.ภัทร บุณยรัตพันธุ์';
  });
  const [authorizedSignatureUrl, setAuthorizedSignatureUrl] = useState<string>(() => {
    if (initialQuotation?.signatures?.authorizedSignature?.signatureUrl !== undefined) {
      return initialQuotation.signatures.authorizedSignature.signatureUrl;
    }
    const saved = getSavedSignatures();
    if (saved?.authorizedSignature?.signatureUrl !== undefined) {
      return saved.authorizedSignature.signatureUrl;
    }
    return PRESET_AUTHORIZED.find(p => p.name === 'ดร.ภัทร บุณยรัตพันธุ์')?.signatureUrl || '';
  });

  // Ensure preparedBy, approvedBy and authorizedSignature are processed through processSignatureDataUrl on mount/load
  useEffect(() => {
    if (preparedBySignatureUrl && !preparedBySignatureUrl.startsWith('data:image/svg+xml')) {
      processSignatureDataUrl(preparedBySignatureUrl, { convertToBlue: true })
        .then((processed) => {
          if (processed && processed !== preparedBySignatureUrl) {
            setPreparedBySignatureUrl(processed);
          }
        })
        .catch(() => {});
    }
    if (approvedBySignatureUrl && !approvedBySignatureUrl.startsWith('data:image/svg+xml')) {
      processSignatureDataUrl(approvedBySignatureUrl, { convertToBlue: true })
        .then((processed) => {
          if (processed && processed !== approvedBySignatureUrl) {
            setApprovedBySignatureUrl(processed);
          }
        })
        .catch(() => {});
    }
    if (authorizedSignatureUrl && !authorizedSignatureUrl.startsWith('data:image/svg+xml')) {
      processSignatureDataUrl(authorizedSignatureUrl, { convertToBlue: true })
        .then((processed) => {
          if (processed && processed !== authorizedSignatureUrl) {
            setAuthorizedSignatureUrl(processed);
          }
        })
        .catch(() => {});
    }
  }, []);

  // Additional Signatures State (เพิ่มช่องสำหรับเขียนลายเซ็นเพิ่มเติม)
  const [additionalSignatures, setAdditionalSignatures] = useState<AdditionalSignatureItem[]>(
    initialQuotation?.signatures?.additionalSignatures || []
  );

  const receivedBySigInputRef = useRef<HTMLInputElement>(null);
  const [logoUrlInput, setLogoUrlInput] = useState<string>('');

  // Preset Selection Handlers
  const handleSelectPreparedByPreset = async (selectedName: string) => {
    if (selectedName === 'custom') {
      return;
    }
    const preset = findPreparedPreset(selectedName, preparedByPresets) || preparedByPresets.find((p) => p.name === selectedName);
    if (preset) {
      setPreparedBy(preset.name);
      setPreparedByMode('image');
      const staffSaved = getStaffSavedSignature(preset.name);
      const targetSig = staffSaved || preset.signatureUrl;
      try {
        const processed = await processSignatureDataUrl(targetSig, { convertToBlue: true });
        setPreparedBySignatureUrl(processed);
      } catch (e) {
        setPreparedBySignatureUrl(targetSig);
      }
    }
  };

  const handleSelectApprovedByPreset = async (selectedName: string) => {
    if (selectedName === 'custom') {
      return;
    }
    const preset = PRESET_APPROVED_BY.find((p) => p.name === selectedName);
    if (preset) {
      setApprovedBy(preset.name);
      try {
        const processed = await processSignatureDataUrl(preset.signatureUrl, { convertToBlue: true });
        setApprovedBySignatureUrl(processed);
      } catch (e) {
        setApprovedBySignatureUrl(preset.signatureUrl);
      }
    }
  };

  const handleSelectAuthorizedPreset = async (selectedName: string) => {
    if (selectedName === 'custom') {
      return;
    }
    const preset = PRESET_AUTHORIZED.find((p) => p.name === selectedName);
    if (preset) {
      setAuthorizedName(preset.name);
      try {
        const processed = await processSignatureDataUrl(preset.signatureUrl, { convertToBlue: true });
        setAuthorizedSignatureUrl(processed);
      } catch (e) {
        setAuthorizedSignatureUrl(preset.signatureUrl);
      }
    }
  };

  // Auto-save signatures to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(
        SIGNATURES_STORAGE_KEY,
        JSON.stringify({
          preparedBy: { name: preparedBy, signatureUrl: preparedBySignatureUrl },
          approvedBy: { name: approvedBy, signatureUrl: approvedBySignatureUrl },
          authorizedSignature: { name: authorizedName, signatureUrl: authorizedSignatureUrl },
        })
      );
    } catch (e) {
      console.warn('Failed to save signatures to localStorage:', e);
    }
  }, [preparedBy, preparedBySignatureUrl, approvedBy, approvedBySignatureUrl, authorizedName, authorizedSignatureUrl]);

  const handleSignatureUpload = async (
    setter: (url: string) => void,
    e: React.ChangeEvent<HTMLInputElement>,
    onComplete?: () => void
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('กรุณาเลือกไฟล์ภาพลายเซ็นขนาดไม่เกิน 5 MB');
        return;
      }
      try {
        const processed = await processSignatureFile(file);
        setter(processed);
        if (onComplete) onComplete();
      } catch (err) {
        console.warn('Signature processing fallback:', err);
        const reader = new FileReader();
        reader.onloadend = () => {
          setter(reader.result as string);
          if (onComplete) onComplete();
        };
        reader.readAsDataURL(file);
      }
    }
  };

  // View state: 'split' | 'form' | 'preview'
  const [viewMode, setViewMode] = useState<'split' | 'form' | 'preview'>('form');
  const [previewPageTab, setPreviewPageTab] = useState<'quotation' | 'annex' | 'both'>('quotation');
  const [isAnnexSectionOpen, setIsAnnexSectionOpen] = useState<boolean>(false);

  // Language & Translation Mode ('th' | 'en')
  const [docLanguage, setDocLanguage] = useState<'th' | 'en'>(initialQuotation?.language || 'th');
  const [isTranslating, setIsTranslating] = useState<boolean>(false);
  const [translationStatusMsg, setTranslationStatusMsg] = useState<string | null>(null);
  const [thaiBackupStore, setThaiBackupStore] = useState<Partial<Quotation> | undefined>(
    initialQuotation?.translations?.th
  );
  const [englishBackupStore, setEnglishBackupStore] = useState<Partial<Quotation> | undefined>(
    initialQuotation?.translations?.en
  );

  // Annex (Page 2) Terms & Penalties Customization State
  const [annexConfig, setAnnexConfig] = useState<AnnexConfig>(() => {
    return initialQuotation?.annexConfig || {
      title: 'การให้บริการห้องประชุมอาคารเคเอกซ์',
      section1Title: '1. เงื่อนไขการใช้บริการห้องประชุมอาคารเคเอกซ์',
      termsText: DEFAULT_ANNEX_TERMS_TEXT,
      section2Title: '2. ค่าเช่าอุปกรณ์เสริมสำหรับห้องประชุม',
      equipmentList: DEFAULT_ANNEX_EQUIPMENT,
      equipmentNote: 'หมายเหตุ : เนื่องด้วยอุปกรณ์มีจำนวนจำกัด หากลูกค้าต้องการใช้อุปกรณ์เสริมสามารถแจ้งในวันที่ออกใบเสนอราคา',
      section3Title: '3. ค่าปรับ',
      finesList: DEFAULT_ANNEX_FINES,
      fontFamily: 'Sarabun',
      fontSize: 11.5,
      paddingTop: 57,
      paddingBottom: 57,
      paddingLeft: 57,
      paddingRight: 57,
      lineHeight: 'normal',
      showLogo: true,
    };
  });

  const updateAnnex = (fields: Partial<AnnexConfig>) => {
    setAnnexConfig((prev) => ({ ...prev, ...fields }));
  };

  const annexLogoInputRef = useRef<HTMLInputElement>(null);
  const [annexLogoUrlInput, setAnnexLogoUrlInput] = useState<string>('');

  const handleAnnexLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('กรุณาเลือกไฟล์ภาพขนาดไม่เกิน 5 MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        updateAnnex({ logoUrl: reader.result as string, showLogo: true });
      };
      reader.readAsDataURL(file);
    }
  };

  const updateItem = (id: string, field: keyof QuotationItem, value: any) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;

        const updated = { ...item, [field]: value };
        if (field === 'usageDate') updated.eventDate = value;
        if (field === 'eventDate') updated.usageDate = value;
        if (field === 'usageTime') updated.eventTime = value;
        if (field === 'eventTime') updated.usageTime = value;
        if (field === 'description') {
          const stripped = stripWeekdayLabel(value);
          updated.description = stripped;
          // Check if there is a remembered price for this exact description when unit price is 0 or empty
          if ((!item.unitPrice || item.unitPrice === 0) && stripped.trim()) {
            const remembered = findRememberedPriceForDescription(stripped, customerName);
            if (remembered) {
              updated.unitPrice = remembered.price;
              if (remembered.unit) updated.unit = remembered.unit;
              if (remembered.discount !== undefined && item.discountPercent === 0) {
                updated.discountPercent = remembered.discount;
              }
            }
          }
        }

        // If date changes and item is tied to a catalog room, recalculate weekday/weekend rate
        if ((field === 'usageDate' || field === 'eventDate') && value) {
          const room = findMatchingRoom(item, roomCatalog);
          if (room && item.rateType && item.rateType !== 'custom') {
            const dayInfo = getDayType(value);
            const isFullDay = item.rateType === 'full_day';
            const newPrice = isFullDay
              ? (dayInfo.isWeekend ? (room.fullDayWeekendPrice || Math.round((room.fullDayPrice || room.unitPrice) * 1.2)) : (room.fullDayPrice || room.unitPrice))
              : (dayInfo.isWeekend ? (room.halfDayWeekendPrice || Math.round((room.halfDayPrice || Math.round(room.unitPrice * 0.6)) * 1.2)) : (room.halfDayPrice || Math.round(room.unitPrice * 0.6)));
            updated.unitPrice = newPrice;
            const floorLabel = room.floor ? ` ${room.floor}` : '';
            updated.description = stripWeekdayLabel(`ค่าเช่าห้อง ${room.name}${floorLabel}`);
          }
        }

        if (isNoDiscountItem(updated.description)) {
          updated.discountPercent = 0;
        }

        // Recalculate amount if quantity, unitPrice, or discount changes
        const qty = field === 'quantity' ? (value === '' ? 0 : Number(value)) : (updated.quantity || 1);
        const price = field === 'unitPrice' ? (value === '' ? 0 : Number(value)) : (updated.unitPrice || 0);
        const disc = field === 'discountPercent' ? (value === '' ? 0 : Number(value)) : (item.discountPercent || 0);
        
        const subtotal = (isNaN(qty) ? 0 : qty) * (isNaN(price) ? 0 : price);
        const validDisc = isNaN(disc) ? 0 : Math.max(0, Math.min(100, disc));
        const discountAmount = (subtotal * validDisc) / 100;
        updated.amount = Math.max(0, Math.round((subtotal - discountAmount) * 100) / 100);

        // Save to pricing memory if user edited price or description
        if ((field === 'unitPrice' || field === 'description') && updated.description?.trim()) {
          saveItemToPricingMemory(updated, customerName);
        }

        return updated;
      })
    );
  };

  const handleRateTypeChange = (
    itemId: string,
    newRateType: 'half_day' | 'half_day_afternoon' | 'full_day' | 'custom'
  ) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;

        if (newRateType === 'custom') {
          return { ...item, rateType: 'custom' };
        }

        const room = findMatchingRoom(item, roomCatalog);
        const targetDate = item.usageDate || item.eventDate || formData.eventDate || '';
        const dayInfo = getDayType(targetDate);

        let newPrice = item.unitPrice;
        let newTime = item.usageTime || item.eventTime || '';
        let rateLabel = '';

        if (newRateType === 'half_day') {
          rateLabel = 'ครึ่งวัน 4 ชม.';
          newTime = '08:00 - 12:00';
          if (room) {
            newPrice = dayInfo.isWeekend
              ? (room.halfDayWeekendPrice || Math.round((room.halfDayPrice || room.unitPrice * 0.6) * 1.2))
              : (room.halfDayPrice || Math.round(room.unitPrice * 0.6));
          }
        } else if (newRateType === 'half_day_afternoon') {
          rateLabel = 'ครึ่งวัน 4 ชม.';
          newTime = '13:00 - 17:00';
          if (room) {
            newPrice = dayInfo.isWeekend
              ? (room.halfDayWeekendPrice || Math.round((room.halfDayPrice || room.unitPrice * 0.6) * 1.2))
              : (room.halfDayPrice || Math.round(room.unitPrice * 0.6));
          }
        } else if (newRateType === 'full_day') {
          rateLabel = 'เต็มวัน 8 ชม.';
          newTime = '08:00 - 17:00';
          if (room) {
            newPrice = dayInfo.isWeekend
              ? (room.fullDayWeekendPrice || Math.round((room.fullDayPrice || room.unitPrice) * 1.2))
              : (room.fullDayPrice || room.unitPrice);
          }
        }

        // Update description
        let updatedDesc = item.description;
        if (room) {
          const floorLabel = room.floor ? ` ${room.floor}` : '';
          updatedDesc = `ค่าเช่าห้อง ${room.name}${floorLabel}`;
        }
        updatedDesc = stripWeekdayLabel(updatedDesc);

        const qty = item.quantity || 1;
        const disc = item.discountPercent || 0;
        const subtotal = qty * newPrice;
        const discountAmount = (subtotal * disc) / 100;
        const newAmount = Math.max(0, Math.round((subtotal - discountAmount) * 100) / 100);

        return {
          ...item,
          rateType: newRateType,
          unitPrice: newPrice,
          description: updatedDesc,
          usageTime: newTime,
          eventTime: newTime,
          amount: newAmount,
          roomId: room?.id || item.roomId,
          roomName: room?.name || item.roomName,
        };
      })
    );
  };

  const handleSelectRoomForItem = (itemId: string, roomId: string) => {
    if (!roomId) return;
    const room = roomCatalog.find((r) => r.id === roomId);
    if (!room) return;

    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;

        const currentRate = detectRateType(item);
        const isFullDay = currentRate === 'full_day';
        const targetDate = item.usageDate || item.eventDate || formData.eventDate || '';
        const dayInfo = getDayType(targetDate);

        const newTime = isFullDay
          ? '08:00 - 17:00'
          : currentRate === 'half_day_afternoon'
            ? '13:00 - 17:00'
            : '08:00 - 12:00';

        const newPrice = isFullDay
          ? (dayInfo.isWeekend ? (room.fullDayWeekendPrice || Math.round((room.fullDayPrice || room.unitPrice) * 1.2)) : (room.fullDayPrice || room.unitPrice))
          : (dayInfo.isWeekend ? (room.halfDayWeekendPrice || Math.round((room.halfDayPrice || Math.round(room.unitPrice * 0.6)) * 1.2)) : (room.halfDayPrice || Math.round(room.unitPrice * 0.6)));

        const floorLabel = room.floor ? ` ${room.floor}` : '';
        const newDesc = `ค่าเช่าห้อง ${room.name}${floorLabel}`;

        const qty = item.quantity || 1;
        const disc = item.discountPercent || 0;
        const subtotal = qty * newPrice;
        const discountAmount = (subtotal * disc) / 100;
        const newAmount = Math.max(0, Math.round((subtotal - discountAmount) * 100) / 100);

        return {
          ...item,
          roomId: room.id,
          roomName: room.name,
          description: stripWeekdayLabel(newDesc),
          unit: 'ห้อง',
          unitPrice: newPrice,
          usageTime: newTime,
          eventTime: newTime,
          amount: newAmount,
          rateType: isFullDay ? 'full_day' : currentRate,
        };
      })
    );
  };

  const handleConsolidateMultiDayItems = () => {
    setItems((prev) => {
      const result: (QuotationItem & { _dates?: string[] })[] = [];

      for (const item of prev) {
        const cleanDesc = stripWeekdayLabel(item.description || '');
        const time = (item.usageTime || item.eventTime || '').trim();
        const unitPrice = Number(item.unitPrice) || 0;
        const discountPercent = Number(item.discountPercent) || 0;
        const unit = (item.unit || '').trim();
        const itemDate = (item.usageDate || item.eventDate || '').trim();

        const existingIndex = result.findIndex(
          (r) =>
            stripWeekdayLabel(r.description || '').trim() === cleanDesc &&
            (r.usageTime || r.eventTime || '').trim() === time &&
            (Number(r.unitPrice) || 0) === unitPrice &&
            (Number(r.discountPercent) || 0) === discountPercent &&
            (r.unit || '').trim() === unit
        );

        if (existingIndex >= 0) {
          const existing = result[existingIndex];
          const dates = existing._dates || (existing.usageDate ? [existing.usageDate] : []);
          if (itemDate) {
            dates.push(itemDate);
          }

          const mergedQty = (Number(existing.quantity) || 1) + (Number(item.quantity) || 1);
          const subtotal = mergedQty * unitPrice;
          const discountAmount = (subtotal * discountPercent) / 100;
          const mergedAmount = Math.max(0, Math.round((subtotal - discountAmount) * 100) / 100);
          const formattedDateRange = formatThaiDateRange(dates);

          result[existingIndex] = {
            ...existing,
            quantity: mergedQty,
            amount: mergedAmount,
            usageDate: formattedDateRange,
            eventDate: formattedDateRange,
            _dates: dates,
          };
        } else {
          const dates = itemDate ? [itemDate] : [];
          const formattedDate = itemDate ? formatThaiDateSmart(itemDate) : '';
          result.push({
            ...item,
            description: cleanDesc || item.description,
            usageDate: formattedDate || itemDate,
            eventDate: formattedDate || itemDate,
            _dates: dates,
          });
        }
      }

      return result.map(({ _dates, ...rest }) => rest);
    });
  };

  const handleInstantUpdateRoomItem = (autoItem: QuotationItem) => {
    setItems((prev) => {
      // Find existing room item (auto item or first item if it's a room)
      const existingIdx = prev.findIndex(
        (it) => it.id === 'auto-room-item-1' || it.description.startsWith('ค่าเช่าห้อง') || it.description.startsWith('ค่าห้อง')
      );
      const cleanAuto = {
        ...autoItem,
        description: stripWeekdayLabel(autoItem.description),
      };
      if (existingIdx >= 0) {
        const next = [...prev];
        next[existingIdx] = {
          ...cleanAuto,
          id: next[existingIdx].id,
          usageDate: cleanAuto.usageDate || next[existingIdx].usageDate || formData.eventDate || '',
          eventDate: cleanAuto.eventDate || next[existingIdx].eventDate || formData.eventDate || '',
          usageTime: cleanAuto.usageTime || next[existingIdx].usageTime || eventTime || '',
          eventTime: cleanAuto.eventTime || next[existingIdx].eventTime || eventTime || '',
        };
        return next;
      }
      return [
        {
          ...cleanAuto,
          usageDate: cleanAuto.usageDate || formData.eventDate || '',
          eventDate: cleanAuto.eventDate || formData.eventDate || '',
          usageTime: cleanAuto.usageTime || eventTime || '',
          eventTime: cleanAuto.eventTime || eventTime || '',
        },
        ...prev,
      ];
    });
  };

  const handleAddRoomItem = (newItem: QuotationItem) => {
    const cleanItem = {
      ...newItem,
      description: stripWeekdayLabel(newItem.description),
      usageDate: newItem.usageDate || newItem.eventDate || formData.eventDate || '',
      eventDate: newItem.eventDate || newItem.usageDate || formData.eventDate || '',
      usageTime: newItem.usageTime || newItem.eventTime || eventTime || '',
      eventTime: newItem.eventTime || newItem.usageTime || eventTime || '',
    };
    setItems((prev) => [...prev, cleanItem]);
    setSyncStatusMsg({
      type: 'success',
      text: `เพิ่มรายการห้อง "${cleanItem.description}" ลงในตารางเรียบร้อยแล้ว`,
    });
    setTimeout(() => setSyncStatusMsg(null), 3500);
  };

  const handleAddMultipleRoomItems = (newItems: QuotationItem[]) => {
    if (newItems.length === 0) return;
    const cleanItems = newItems.map((it) => ({
      ...it,
      description: stripWeekdayLabel(it.description),
      usageDate: it.usageDate || it.eventDate || formData.eventDate || '',
      eventDate: it.eventDate || it.usageDate || formData.eventDate || '',
      usageTime: it.usageTime || it.eventTime || eventTime || '',
      eventTime: it.eventTime || it.usageTime || eventTime || '',
    }));
    setItems((prev) => [...prev, ...cleanItems]);
    setSyncStatusMsg({
      type: 'success',
      text: `เพิ่มห้องและวันที่ใช้งาน ${cleanItems.length} รายการลงในตารางเรียบร้อยแล้ว`,
    });
    setTimeout(() => setSyncStatusMsg(null), 4000);
  };

  const addItem = () => {
    const disc = customerDiscountRate || 0;
    const unitPrice = 1000;
    const subtotal = unitPrice;
    const discAmount = (subtotal * disc) / 100;
    const newItem: QuotationItem = {
      id: `item-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      description: 'บริการห้องประชุม / อุปกรณ์เสริม',
      quantity: 1,
      unit: 'รายการ',
      unitPrice: unitPrice,
      discountPercent: disc,
      amount: Math.max(0, subtotal - discAmount),
      usageDate: formData.eventDate || eventDate || '',
      eventDate: formData.eventDate || eventDate || '',
      usageTime: eventTime || '08:00 - 17:00',
      eventTime: eventTime || '08:00 - 17:00',
    };
    setItems((prev) => [...prev, newItem]);
  };

  const addPresetItem = (preset: RoomCatalogItem) => {
    const disc = customerDiscountRate || 0;
    const subtotal = preset.unitPrice;
    const discAmount = (subtotal * disc) / 100;
    const newItem: QuotationItem = {
      id: `item-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      description: stripWeekdayLabel(preset.name),
      quantity: 1,
      unit: preset.unit,
      unitPrice: preset.unitPrice,
      discountPercent: disc,
      amount: Math.max(0, subtotal - discAmount),
      usageDate: formData.eventDate || eventDate || '',
      eventDate: formData.eventDate || eventDate || '',
      usageTime: eventTime || '08:00 - 17:00',
      eventTime: eventTime || '08:00 - 17:00',
      roomName: preset.name,
    };
    setItems((prev) => [...prev, newItem]);
  };

  const duplicateItem = (sourceItem: QuotationItem) => {
    let nextDate = sourceItem.usageDate || sourceItem.eventDate || formData.eventDate || '';
    if (/^\d{4}-\d{2}-\d{2}$/.test(nextDate)) {
      try {
        const d = new Date(nextDate);
        d.setDate(d.getDate() + 1);
        nextDate = d.toISOString().split('T')[0];
      } catch (e) {}
    }

    const newItem: QuotationItem = {
      ...sourceItem,
      id: `item-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      description: stripWeekdayLabel(sourceItem.description),
      usageDate: nextDate,
      eventDate: nextDate,
      usageTime: sourceItem.usageTime || sourceItem.eventTime || eventTime || '',
      eventTime: sourceItem.usageTime || sourceItem.eventTime || eventTime || '',
    };

    setItems((prev) => {
      const idx = prev.findIndex((it) => it.id === sourceItem.id);
      if (idx >= 0) {
        const next = [...prev];
        next.splice(idx + 1, 0, newItem);
        return next;
      }
      return [...prev, newItem];
    });

    setSyncStatusMsg({
      type: 'success',
      text: `คัดลอกรายการเรียบร้อยแล้ว${nextDate ? ` (วันที่ ${nextDate})` : ''}`,
    });
    setTimeout(() => setSyncStatusMsg(null), 3000);
  };

  const removeItem = (id: string) => {
    if (items.length <= 1) {
      setSyncStatusMsg({
        type: 'error',
        text: 'ใบเสนอราคาต้องมีอย่างน้อย 1 รายการ',
      });
      setTimeout(() => setSyncStatusMsg(null), 3000);
      return;
    }
    setItems(items.filter((item) => item.id !== id));
  };

  const grossSubtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  const totalAmount = items.reduce((sum, item) => sum + item.amount, 0);
  const totalDiscountSavings = Math.max(0, Math.round((grossSubtotal - totalAmount) * 100) / 100);

  // Construct current preview quotation object
  const currentQuotation: Quotation = {
    id: initialQuotation?.id || `quote-${Date.now()}`,
    quoteNumber,
    issueDate,
    jobTitle,
    eventDate: formData.eventDate || eventDate || '',
    usageDate: formData.eventDate || eventDate || '',
    eventTime,
    customer: {
      name: formData.customerName,
      taxId: formData.taxId,
      address: formData.address,
      customerCode: formData.customerCode,
      contactPerson: formData.contactPerson,
      mobile: formData.mobile,
      phone: formData.phone,
      email: formData.email,
      department: matchedCustomer?.department,
      discountRate: customerDiscountRate,
    },
    items,
    paymentTermType,
    paymentDueDate,
    cancellationNoticeDate,
    paymentLanguage,
    customPaymentTermsText: customPaymentTermsText || '',
    customPaymentTermsTextEn: customPaymentTermsTextEn || '',
    overtimeNote,
    specialRemarks,
    bankInfo: {
      bankName,
      branch: bankBranch,
      accountName: bankAccountName,
      accountNumber: bankAccountNumber,
      qrPromptPayCode,
      qrImageUrl,
      qrType,
      qrCustomPayload,
    },
    bankInfoEn: {
      bankName: bankNameEn,
      branch: bankBranchEn,
      accountName: bankAccountNameEn,
      accountNumber: bankAccountNumberEn,
    },

    signatures: {
      receivedBy: {
        title: receivedByTitle,
        name: receivedByName,
        signatureUrl: receivedBySignatureUrl,
        date: receivedByDate,
        mode: receivedByMode,
        enabled: receivedByEnabled,
      },
      preparedBy: {
        title: preparedByTitle,
        name: preparedBy,
        signatureUrl: preparedBySignatureUrl,
        date: preparedByDate || issueDate,
        mode: preparedByMode,
        enabled: preparedByEnabled,
      },
      approvedBy: {
        title: approvedByTitle,
        name: approvedBy,
        signatureUrl: approvedBySignatureUrl,
        date: approvedByDate || issueDate,
        mode: approvedByMode,
        enabled: approvedByEnabled,
      },
      authorizedSignature: {
        title: authorizedTitle,
        name: authorizedName,
        signatureUrl: authorizedSignatureUrl,
        date: authorizedDate || issueDate,
        mode: authorizedMode,
        enabled: authorizedEnabled,
      },
      additionalSignatures,
    },
    logoUrl,
    headerTitle,
    headerSubtitle,
    companyInfo: {
      companyName,
      taxId: companyTaxId,
      address: companyAddress,
      website: companyWebsite,
      phone: companyPhone,
    },
    layoutSettings,
    annexConfig: {
      ...annexConfig,
      logoUrl: annexConfig.logoUrl || logoUrl,
      companyName: annexConfig.companyName || '',
    },
    status: initialQuotation?.status || 'DRAFT',
    statusLogs: initialQuotation?.statusLogs || [
      {
        id: `log-${Date.now()}`,
        status: 'DRAFT',
        timestamp: new Date().toISOString(),
        note: 'สร้างใบเสนอราคาใหม่',
        updatedBy: preparedBy,
      },
    ],
    paymentSlip: initialQuotation?.paymentSlip,
    language: docLanguage,
    translations: {
      ...(initialQuotation?.translations || {}),
      th: {
        ...(thaiBackupStore || initialQuotation?.translations?.th || {}),
        customPaymentTermsText: docLanguage === 'th' ? (customPaymentTermsText || '') : (thaiBackupStore?.customPaymentTermsText || initialQuotation?.translations?.th?.customPaymentTermsText || customPaymentTermsText || ''),
      },
      en: {
        ...(englishBackupStore || initialQuotation?.translations?.en || {}),
        customPaymentTermsText: customPaymentTermsTextEn || (docLanguage === 'en' ? customPaymentTermsText : '') || (englishBackupStore?.customPaymentTermsText || initialQuotation?.translations?.en?.customPaymentTermsText || ''),
      },
    },
    createdAt: initialQuotation?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const getCurrentFormStateSnapshot = (): Partial<Quotation> => ({
    jobTitle,
    customer: { name: customerName, taxId, address, customerCode, contactPerson, mobile, phone, email },
    items: items.map((it) => ({ ...it })),
    customPaymentTermsText,
    customPaymentTermsTextEn,
    paymentLanguage,
    overtimeNote,
    specialRemarks,
    bankInfo: { ...currentQuotation.bankInfo },
    headerTitle,
    headerSubtitle,
    signatures: JSON.parse(JSON.stringify(currentQuotation.signatures)),
    annexConfig: annexConfig ? JSON.parse(JSON.stringify(annexConfig)) : undefined,
  });

  const applyQuotationSnapshot = (snapshot: Partial<Quotation>) => {
    if (snapshot.jobTitle) setJobTitle(snapshot.jobTitle);
    if (snapshot.customer) setFormData(prev => ({...prev, ...snapshot.customer}));
    if (snapshot.items) setItems(snapshot.items);
    if (snapshot.customPaymentTermsText !== undefined) setCustomPaymentTermsText(snapshot.customPaymentTermsText);
    if (snapshot.customPaymentTermsTextEn !== undefined) setCustomPaymentTermsTextEn(snapshot.customPaymentTermsTextEn);
    if (snapshot.paymentLanguage) setPaymentLanguage(snapshot.paymentLanguage);
    if (snapshot.overtimeNote !== undefined) setOvertimeNote(snapshot.overtimeNote);
    if (snapshot.specialRemarks !== undefined) setSpecialRemarks(snapshot.specialRemarks);
    if (snapshot.bankInfo) {
      if (snapshot.bankInfo.bankName) setBankName(snapshot.bankInfo.bankName);
      if (snapshot.bankInfo.branch) setBankBranch(snapshot.bankInfo.branch);
      if (snapshot.bankInfo.accountName) setBankAccountName(snapshot.bankInfo.accountName);
      if (snapshot.bankInfo.accountNumber) setBankAccountNumber(snapshot.bankInfo.accountNumber);
    }
    if (snapshot.bankInfoEn) {
      if (snapshot.bankInfoEn.bankName) setBankNameEn(snapshot.bankInfoEn.bankName);
      if (snapshot.bankInfoEn.branch) setBankBranchEn(snapshot.bankInfoEn.branch);
      if (snapshot.bankInfoEn.accountName) setBankAccountNameEn(snapshot.bankInfoEn.accountName);
      if (snapshot.bankInfoEn.accountNumber) setBankAccountNumberEn(snapshot.bankInfoEn.accountNumber);
    }
    if (snapshot.headerTitle) setHeaderTitle(snapshot.headerTitle);
    if (snapshot.headerSubtitle) setHeaderSubtitle(snapshot.headerSubtitle);
    if (snapshot.signatures) {
       if (snapshot.signatures.receivedBy?.title) setReceivedByTitle(snapshot.signatures.receivedBy.title);
       if (snapshot.signatures.preparedBy?.title) setPreparedByTitle(snapshot.signatures.preparedBy.title);
       if (snapshot.signatures.approvedBy?.title) setApprovedByTitle(snapshot.signatures.approvedBy.title);
       if (snapshot.signatures.authorizedSignature?.title) setAuthorizedTitle(snapshot.signatures.authorizedSignature.title);
    }
    if (snapshot.annexConfig) setAnnexConfig(snapshot.annexConfig);
  };

  // Language Switching Handler (Thai <-> English) with AI & lossless fallback
  const handleSwitchLanguage = async (targetLang: 'th' | 'en') => {
    if (targetLang === docLanguage || isTranslating) return;

    // 1. Snapshot current state into proper backup store
    const currentSnapshot = getCurrentFormStateSnapshot();
    if (docLanguage === 'th') {
      setThaiBackupStore(currentSnapshot);
    } else {
      setEnglishBackupStore(currentSnapshot);
    }

    setIsTranslating(true);
    setTranslationStatusMsg(`กำลังสลับเป็นภาษา${targetLang === 'en' ? 'อังกฤษ' : 'ไทย'}...`);

    const safetyTimer = setTimeout(() => {
      setIsTranslating(false);
    }, 6000);

    try {
      // 2. Check if target language already has saved state
      const existingTarget = targetLang === 'en'
        ? (englishBackupStore || initialQuotation?.translations?.en)
        : (thaiBackupStore || initialQuotation?.translations?.th);

      if (existingTarget) {
        applyQuotationSnapshot(existingTarget);
        if (targetLang === 'en' && (!existingTarget.customPaymentTermsTextEn || /[ก-๙]/.test(existingTarget.customPaymentTermsTextEn))) {
          const stdEn = generateStandardPaymentTermsEn(paymentTermType, paymentDueDate, cancellationNoticeDate);
          setCustomPaymentTermsTextEn(stdEn);
        }
        setDocLanguage(targetLang);
        setTermsActiveTab(targetLang);
        setTranslationStatusMsg(null);
      } else {
        // 3. Fallback: AI Translation/Restoration
        if (targetLang === 'en') {
          try {
            const { quotation: translatedQ } = await translateQuotationToEnglish({
              ...currentQuotation,
              language: 'th',
              translations: { th: currentSnapshot },
            });
            applyQuotationSnapshot(translatedQ);
            const cleanEn = (translatedQ.customPaymentTermsText && !/[ก-๙]/.test(translatedQ.customPaymentTermsText))
              ? translatedQ.customPaymentTermsText
              : generateStandardPaymentTermsEn(paymentTermType, paymentDueDate, cancellationNoticeDate);
            setCustomPaymentTermsTextEn(cleanEn);
            setDocLanguage('en');
            setTermsActiveTab('en');
            setTranslationStatusMsg('✓ แปลงเป็นภาษาอังกฤษเรียบร้อยแล้ว');
          } catch (err) {
            setCustomPaymentTermsTextEn(generateStandardPaymentTermsEn(paymentTermType, paymentDueDate, cancellationNoticeDate));
            setDocLanguage('en');
            setTermsActiveTab('en');
            setTranslationStatusMsg('✓ สลับเป็นภาษาอังกฤษเรียบร้อยแล้ว');
          }
        } else {
          const restored = restoreQuotationToThai({
            ...currentQuotation,
            language: 'en',
            translations: { th: thaiBackupStore || initialQuotation?.translations?.th },
          });
          applyQuotationSnapshot(restored);
          setDocLanguage('th');
          setTermsActiveTab('th');
          setTranslationStatusMsg('✓ สลับเป็นภาษาไทยเรียบร้อยแล้ว');
        }
        setTimeout(() => setTranslationStatusMsg(null), 3000);
      }
    } finally {
      clearTimeout(safetyTimer);
      setIsTranslating(false);
    }
  };

  // Auto-running handlers
  const handleAutoGenerateNumber = (customDate?: string) => {
    const next = getNextQuotationNumber(quotations, customDate || issueDate);
    setQuoteNumber(next);
  };

  const handleIssueDateChange = (newDate: string) => {
    setIssueDate(newDate);
    if (autoRunOnDateChange && !isEditing) {
      const next = getNextQuotationNumber(quotations, newDate);
      setQuoteNumber(next);
    }
  };

  const availability = checkQuoteNumberAvailability(quoteNumber, quotations, initialQuotation?.id);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) {
      alert('กรุณากรอกชื่อลูกค้าหรือชื่อบริษัท');
      return;
    }
    if (availability.isDuplicate) {
      const confirmSave = window.confirm(
        `เลขที่ใบเสนอราคา "${quoteNumber}" ซ้ำกับเอกสาร "${availability.duplicateWith?.jobTitle || ''}" (${availability.duplicateWith?.customer.name || ''})\n\nต้องการใช้เลขนี้จริงหรือไม่? (แนะนำให้กด "รันเลขอัตโนมัติ" เพื่อไม่ให้เลขซ้ำ)`
      );
      if (!confirmSave) return;
    }
    // Save to customer preference & item pricing memory
    try {
      saveCustomerQuotationMemory(currentQuotation);
    } catch (err) {
      console.warn('Memory save error:', err);
    }
    onSave(currentQuotation);
  };

  return (
    <div className="space-y-4">
      {/* Top action bar */}
      <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="p-2 text-neutral-500 hover:text-neutral-800 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-lg font-bold text-neutral-900">
              {isEditing ? `แก้ไขใบเสนอราคา ${quoteNumber}` : 'สร้างใบเสนอราคาใหม่ (KX Quotation)'}
            </h2>
            <p className="text-xs text-neutral-500">
              กรอกข้อมูลรายการ ค่าห้องประชุม และอุปกรณ์เสริมตามมาตรฐานอาคาร KX
            </p>
          </div>
        </div>

        {/* Language & View Toggles & Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Language Switcher: Thai / English */}
          <div className="bg-neutral-100 p-1 rounded-lg flex items-center text-xs font-semibold border border-neutral-200">
            <button
              type="button"
              disabled={isTranslating}
              onClick={() => handleSwitchLanguage('th')}
              className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 cursor-pointer ${
                docLanguage === 'th'
                  ? 'bg-white shadow-xs text-neutral-900 font-bold border border-neutral-200/60'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
              title="สลับเป็นภาษาไทย"
            >
              <span>🇹🇭</span>
              <span>ภาษาไทย</span>
            </button>
            <button
              type="button"
              disabled={isTranslating}
              onClick={() => handleSwitchLanguage('en')}
              className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 cursor-pointer ${
                docLanguage === 'en'
                  ? 'bg-blue-600 shadow-xs text-white font-bold'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
              title="สลับเป็นภาษาอังกฤษ (ระบบจะแปลข้อมูลทั้งหมดให้อัตโนมัติ)"
            >
              <span>🇺🇸</span>
              <span>EN</span>
              {isTranslating && (
                <span className="w-2.5 h-2.5 border-2 border-current border-t-transparent rounded-full animate-spin ml-0.5" />
              )}
            </button>
          </div>

          {/* View Toggle */}
          <div className="bg-neutral-100 p-1 rounded-lg flex items-center text-xs font-medium">
            <button
              type="button"
              onClick={() => setViewMode('form')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                viewMode === 'form' ? 'bg-white shadow-xs text-neutral-900 font-bold' : 'text-neutral-600'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5 inline mr-1" />
              แบบฟอร์ม
            </button>
            <button
              type="button"
              onClick={() => setViewMode('preview')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                viewMode === 'preview' ? 'bg-white shadow-xs text-neutral-900 font-bold' : 'text-neutral-600'
              }`}
            >
              <Eye className="w-3.5 h-3.5 inline mr-1" />
              ตัวอย่างเอกสาร
            </button>
            <button
              type="button"
              onClick={() => setViewMode('split')}
              className={`px-3 py-1.5 rounded-md transition-all hidden md:flex items-center ${
                viewMode === 'split' ? 'bg-white shadow-xs text-neutral-900 font-bold' : 'text-neutral-600'
              }`}
            >
              สองหน้าจอ
            </button>
          </div>

          <button
            type="button"
            onClick={handleFormSubmit}
            className="px-5 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors"
          >
            <Save className="w-4 h-4" />
            {isEditing ? 'บันทึกการแก้ไข' : 'บันทึกใบเสนอราคา'}
          </button>
        </div>
      </div>

      {/* Translation Status Notification / Feedback Banner */}
      {translationStatusMsg && (
        <div className="bg-blue-50 border border-blue-200 text-blue-900 px-4 py-2.5 rounded-xl text-xs flex items-center justify-between shadow-2xs animate-fade-in">
          <div className="flex items-center gap-2">
            {isTranslating ? (
              <span className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            ) : (
              <span>✨</span>
            )}
            <span className="font-medium">{translationStatusMsg}</span>
          </div>
          <span className="text-[11px] text-blue-600 font-mono font-semibold">
            {docLanguage === 'en' ? '🇬🇧 English Mode' : '🇹🇭 โหมดภาษาไทย'}
          </span>
        </div>
      )}

      {/* Editor Content Area */}
      <div className={`grid gap-6 ${viewMode === 'split' ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
        {/* Form Column */}
        {(viewMode === 'form' || viewMode === 'split') && (
          <form
            onSubmit={handleFormSubmit}
            className={
              formDensity === 'compact'
                ? 'space-y-3.5 text-xs'
                : formDensity === 'spacious'
                ? 'space-y-6 text-sm'
                : 'space-y-5'
            }
          >
            {/* Quick Global Action Toolbar: Expand / Collapse All Sections & Density */}
            <div className="bg-white p-3.5 rounded-xl border border-neutral-200 shadow-2xs space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-neutral-900 text-white flex items-center justify-center shadow-xs">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-neutral-900">จัดการแบบฟอร์ม (Form Sections)</span>
                      <span className="text-[10px] text-neutral-700 bg-neutral-100 px-2 py-0.5 rounded-full font-mono font-semibold border border-neutral-200">
                        {Object.values(collapsedSections).filter((c) => !c).length}/7 ส่วนเปิดอยู่
                      </span>
                    </div>
                    <p className="text-[10.5px] text-neutral-500">ปรับขนาดย่อ/ขยาย และความหนาแน่นของแบบฟอร์มตามต้องการ</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Density / Size Selector */}
                  <div className="flex items-center gap-1 bg-neutral-100 p-1 rounded-lg border border-neutral-200/80 text-xs">
                    <span className="text-[10px] font-semibold text-neutral-500 px-1.5 flex items-center gap-1">
                      <Sliders className="w-3 h-3 text-neutral-500" />
                      ขนาดส่วน:
                    </span>
                    <button
                      type="button"
                      onClick={() => handleSetFormDensity('compact')}
                      className={`px-2 py-1 rounded text-[11px] font-medium transition-all ${
                        formDensity === 'compact'
                          ? 'bg-white text-neutral-900 shadow-xs font-bold'
                          : 'text-neutral-600 hover:text-neutral-900'
                      }`}
                      title="ขนาดกะทัดรัด (ประหยัดพื้นที่หน้าจอ)"
                    >
                      🗜️ กะทัดรัด
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSetFormDensity('standard')}
                      className={`px-2 py-1 rounded text-[11px] font-medium transition-all ${
                        formDensity === 'standard'
                          ? 'bg-white text-neutral-900 shadow-xs font-bold'
                          : 'text-neutral-600 hover:text-neutral-900'
                      }`}
                      title="ขนาดมาตรฐาน"
                    >
                      📄 ปกติ
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSetFormDensity('spacious')}
                      className={`px-2 py-1 rounded text-[11px] font-medium transition-all ${
                        formDensity === 'spacious'
                          ? 'bg-white text-neutral-900 shadow-xs font-bold'
                          : 'text-neutral-600 hover:text-neutral-900'
                      }`}
                      title="ขนาดสบายตา (ตัวหนังสือและช่องกรอกใหญ่ขึ้น)"
                    >
                      📐 สบายตา
                    </button>
                  </div>

                  {/* Expand / Collapse Controls */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={expandAllSections}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-neutral-700 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 rounded-lg transition-colors shadow-2xs active:scale-95"
                      title="กางออกและแสดงเนื้อหาทุกส่วนในแบบฟอร์ม"
                    >
                      <ChevronsDown className="w-3.5 h-3.5 text-neutral-600" />
                      <span>กางทั้งหมด</span>
                    </button>
                    <button
                      type="button"
                      onClick={collapseAllSections}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-neutral-700 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 rounded-lg transition-colors shadow-2xs active:scale-95"
                      title="พับเก็บเนื้อหาทุกส่วนเพื่อให้หน้าจอกระชับ"
                    >
                      <ChevronsUp className="w-3.5 h-3.5 text-neutral-600" />
                      <span>พับทั้งหมด</span>
                    </button>
                    <button
                      type="button"
                      onClick={expandEssentialSections}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-neutral-700 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 rounded-lg transition-colors shadow-2xs active:scale-95"
                      title="เปิดเฉพาะส่วนข้อมูลงาน ลูกค้า ห้อง และรายการสินค้า"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      <span>เฉพาะส่วนหลัก</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Quick Jump / Toggle Section Chips */}
              <div className="pt-2.5 border-t border-neutral-100 flex flex-wrap items-center gap-1.5">
                <span className="text-[10.5px] font-semibold text-neutral-400 mr-1">ทางลัดส่วน:</span>
                {[
                  { key: 'headerBranding', num: '1', label: 'หัวกระดาษ & บริษัท' },
                  { key: 'layoutPrint', num: '2', label: 'จัดหน้า A4' },
                  { key: 'metaInfo', num: '3', label: 'ข้อมูลเอกสาร' },
                  { key: 'customerInfo', num: '4', label: 'ข้อมูลลูกค้า' },
                  { key: 'roomCalculator', num: '5', label: 'คำนวณห้อง' },
                  { key: 'itemsTable', num: '6', label: 'รายการสินค้า' },
                  { key: 'paymentSignatures', num: '7', label: 'เงื่อนไข & ลายเซ็น' },
                ].map((s) => {
                  const isOpen = !collapsedSections[s.key];
                  return (
                    <button
                      key={s.key}
                      type="button"
                      onClick={() => toggleSection(s.key)}
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium transition-all ${
                        isOpen
                          ? 'bg-neutral-900 text-white shadow-2xs font-semibold'
                          : 'bg-neutral-50 text-neutral-600 hover:bg-neutral-100 border border-neutral-200'
                      }`}
                      title={`${isOpen ? 'คลิกเพื่อพับเก็บส่วนนี้' : 'คลิกเพื่อกางออกส่วนนี้'}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${isOpen ? 'bg-emerald-400' : 'bg-neutral-300'}`} />
                      <span>{s.num}. {s.label}</span>
                      {isOpen ? (
                        <ChevronUp className="w-3 h-3 text-neutral-400" />
                      ) : (
                        <ChevronDown className="w-3 h-3 text-neutral-400" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 1. จัดการส่วนหัวกระดาษและข้อมูลบริษัท (Header, Branding & Company Info) */}
            <div className="bg-white rounded-xl border border-neutral-200 shadow-2xs overflow-hidden">
              <div
                onClick={() => toggleSection('headerBranding')}
                className="w-full px-5 py-3.5 flex flex-wrap items-center justify-between gap-2 bg-white hover:bg-neutral-50/80 transition-colors cursor-pointer border-b border-neutral-100 select-none"
              >
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-neutral-900"></span>
                  <h3 className="text-sm font-bold text-neutral-800">
                    1. จัดการส่วนหัวกระดาษและข้อมูลบริษัท (Header & Company Controls)
                  </h3>
                  <span className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded font-medium">
                    💾 บันทึกอัตโนมัติ
                  </span>
                  {collapsedSections.headerBranding && (
                    <span className="text-[10px] text-neutral-500 bg-neutral-100 px-1.5 py-0.5 rounded">
                      ย่ออยู่
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  {(logoUrl ||
                    headerTitle !== 'ใบเสนอราคา' ||
                    headerSubtitle !== 'QUOTATION' ||
                    companyName !== 'Knowledge Xchange' ||
                    companyTaxId !== '099-4-000-16009-7' ||
                    companyAddress !== '110/1 อาคารเคเอกซ์ ถนนกรุงธนบุรี\nแขวงบางลำภูล่าง เขตคลองสาน\nกทม. 10600' ||
                    companyWebsite !== 'www.kxinnovation.com' ||
                    companyPhone !== '02-470-7906, 02-470-7907' ||
                    layoutSettings.headerFontFamily !== 'Trirong' ||
                    layoutSettings.headerTitleFontSize !== 16 ||
                    layoutSettings.headerSubtitleFontSize !== 11 ||
                    (layoutSettings.headerCompanyFontSize && layoutSettings.headerCompanyFontSize !== 11) ||
                    layoutSettings.logoHeight !== 56 ||
                    layoutSettings.logoAlign !== 'left' ||
                    layoutSettings.headerOffsetX !== 0 ||
                    layoutSettings.headerOffsetY !== 0 ||
                    layoutSettings.showLogo === false ||
                    layoutSettings.showHeaderCompanyInfo === false) && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveLogo();
                        setHeaderTitle('ใบเสนอราคา');
                        setHeaderSubtitle('QUOTATION');
                        setCompanyName('Knowledge Xchange');
                        setCompanyTaxId('099-4-000-16009-7');
                        setCompanyAddress('110/1 อาคารเคเอกซ์ ถนนกรุงธนบุรี\nแขวงบางลำภูล่าง เขตคลองสาน\nกทม. 10600');
                        setCompanyWebsite('www.kxinnovation.com');
                        setCompanyPhone('02-470-7906, 02-470-7907');
                        updateLayout({
                          headerFontFamily: 'Trirong',
                          headerTitleFontSize: 16,
                          headerSubtitleFontSize: 11,
                          headerCompanyFontSize: 11,
                          logoHeight: 56,
                          logoAlign: 'left',
                          headerOffsetX: 0,
                          headerOffsetY: 0,
                          headerPaddingTop: 0,
                          headerPaddingBottom: 0,
                          headerMarginBottom: 12,
                          showLogo: true,
                          showHeaderCompanyInfo: true,
                        });
                      }}
                      className="text-[11px] text-neutral-500 hover:text-neutral-800 font-medium underline"
                    >
                      รีเซ็ตค่าเริ่มต้น
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSection('headerBranding');
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-800 border border-neutral-200 transition-colors"
                    title={collapsedSections.headerBranding ? 'คลิกเพื่อกางออก' : 'คลิกเพื่อพับเก็บ'}
                  >
                    {collapsedSections.headerBranding ? (
                      <>
                        <ChevronsDown className="w-3.5 h-3.5 text-neutral-600" />
                        <span>กางออก</span>
                      </>
                    ) : (
                      <>
                        <ChevronsUp className="w-3.5 h-3.5 text-neutral-600" />
                        <span>พับย่อ</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Collapsed Summary Ribbon */}
              {collapsedSections.headerBranding && (
                <div
                  onClick={() => toggleSection('headerBranding')}
                  className="px-5 py-2.5 bg-neutral-50/70 hover:bg-neutral-100/80 cursor-pointer flex flex-wrap items-center justify-between gap-2 text-xs text-neutral-600 border-t border-neutral-100 transition-colors select-none"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-neutral-800">🏢 {companyName || 'Knowledge Xchange'}</span>
                    <span className="text-neutral-400">•</span>
                    <span>หัวเรื่อง: {headerTitle} ({headerSubtitle})</span>
                    <span className="text-neutral-400">•</span>
                    <span>{logoUrl ? '🖼️ ใช้โลโก้อัปโหลด' : '🖼️ โลโก้ KX'}</span>
                    <span className="text-neutral-400">•</span>
                    <span>ฟอนต์ {layoutSettings.headerFontFamily || 'Trirong'}</span>
                  </div>
                  <span className="text-[11px] text-blue-600 font-semibold hover:underline flex items-center gap-1">
                    <ChevronsDown className="w-3 h-3" /> คลิกเพื่อขยายแก้ไข
                  </span>
                </div>
              )}

              {!collapsedSections.headerBranding && (
                <div className="p-5 pt-4 space-y-4">

              {/* Toggle Switches for Header Visibility */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-neutral-50 p-2.5 rounded-lg border border-neutral-200">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={layoutSettings.showLogo !== false}
                    onChange={(e) => updateLayout({ showLogo: e.target.checked })}
                    className="rounded text-neutral-900 focus:ring-neutral-800 w-4 h-4"
                  />
                  <div className="text-xs">
                    <span className="font-semibold text-neutral-800">🖼️ แสดงโลโก้ & หัวเรื่อง (Show Logo & Title)</span>
                    <p className="text-[10.5px] text-neutral-500">แสดงภาพโลโก้และข้อความชื่อเอกสารด้านซ้าย/กึ่งกลาง</p>
                  </div>
                </label>

                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={layoutSettings.showHeaderCompanyInfo !== false}
                    onChange={(e) => updateLayout({ showHeaderCompanyInfo: e.target.checked })}
                    className="rounded text-neutral-900 focus:ring-neutral-800 w-4 h-4"
                  />
                  <div className="text-xs">
                    <span className="font-semibold text-neutral-800">🏢 แสดงข้อมูลบริษัท & ที่อยู่ (Show Company Info)</span>
                    <p className="text-[10.5px] text-neutral-500">แสดงชื่อบริษัท, เลขผู้เสียภาษี, เว็บไซต์, ที่อยู่ และเบอร์โทร</p>
                  </div>
                </label>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 text-xs">
                {/* Left Column: Logo Upload, Logo Size Slider, Alignment & Offsets (5 cols) */}
                <div className="lg:col-span-5 space-y-3.5 bg-neutral-50/70 p-3.5 rounded-xl border border-neutral-200/80">
                  <div className="flex items-center justify-between">
                    <label className="font-semibold text-neutral-800 flex items-center gap-1.5">
                      <ImageIcon className="w-3.5 h-3.5 text-neutral-600" />
                      <span>รูปภาพโลโก้หัวกระดาษ</span>
                    </label>
                    {logoUrl ? (
                      <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 font-medium">
                        ใช้รูปที่อัปโหลด
                      </span>
                    ) : (
                      <span className="text-[10px] text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 font-medium">
                        ใช้โลโก้ KX ดั้งเดิม
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-24 h-18 rounded-lg border-2 border-dashed border-neutral-300 bg-white flex items-center justify-center overflow-hidden p-1 shrink-0 relative group shadow-2xs">
                      {logoUrl ? (
                        <>
                          <img
                            src={logoUrl}
                            alt="Logo preview"
                            className="max-h-full max-w-full object-contain"
                          />
                          <button
                            type="button"
                            onClick={handleRemoveLogo}
                            className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white rounded-full p-0.5 hover:bg-rose-600 shadow-xs"
                            title="ลบโลโก้ที่อัปโหลด"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </>
                      ) : (
                        <div className="text-center">
                          <KXLogo size="sm" />
                          <span className="text-[9px] text-neutral-400 block font-medium mt-1">โลโก้ KX</span>
                        </div>
                      )}
                    </div>

                    <div className="flex-1 space-y-1.5">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-md text-xs font-medium transition-colors shadow-2xs">
                          <Upload className="w-3.5 h-3.5" />
                          <span>{logoUrl ? 'เปลี่ยนรูปโลโก้' : 'อัปโหลดรูปโลโก้'}</span>
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleLogoUpload}
                            className="hidden"
                          />
                        </label>
                        {logoUrl && (
                          <button
                            type="button"
                            onClick={handleRemoveLogo}
                            className="px-2.5 py-1.5 text-neutral-600 hover:text-rose-600 hover:bg-rose-50 border border-neutral-200 rounded-md text-xs transition-colors"
                          >
                            ใช้โลโก้ KX
                          </button>
                        )}
                      </div>
                      <p className="text-[10px] text-neutral-500 leading-tight">
                        รองรับ PNG, JPG, SVG (แนะนำไฟล์โปร่งใส ขนาดไม่เกิน 5MB)
                      </p>

                      {/* Direct Image URL input */}
                      <div className="pt-1 flex items-center gap-1.5">
                        <input
                          type="url"
                          value={logoUrlInput}
                          onChange={(e) => setLogoUrlInput(e.target.value)}
                          placeholder="หรือวางลิงก์รูปภาพ URL..."
                          className="flex-1 px-2 py-1 text-[11px] border border-neutral-300 rounded bg-white font-mono placeholder:text-neutral-400"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (logoUrlInput.trim()) {
                              setLogoUrl(logoUrlInput.trim());
                              setLogoUrlInput('');
                            }
                          }}
                          disabled={!logoUrlInput.trim()}
                          className="px-2 py-1 text-[11px] bg-neutral-800 hover:bg-neutral-900 disabled:opacity-50 text-white rounded font-medium transition-colors shrink-0"
                        >
                          ดึงรูปภาพ
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Logo Height Slider & Quick Buttons */}
                  <div className="pt-2 border-t border-neutral-200/80 space-y-1.5">
                    <div className="flex justify-between items-center text-[11px] text-neutral-700 font-semibold">
                      <span className="flex items-center gap-1">
                        <Maximize2 className="w-3 h-3 text-neutral-500" />
                        <span>ขนาดความสูงโลโก้ (Logo Height):</span>
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => updateLayout({ logoHeight: Math.max(24, (layoutSettings.logoHeight || 56) - 2) })}
                          className="px-1 text-[9px] bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 rounded font-mono"
                          title="ลดขนาด 2px"
                        >
                          -2
                        </button>
                        <span className="font-mono font-bold text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.2 rounded text-[11px]">
                          {layoutSettings.logoHeight || 56}px
                        </span>
                        <button
                          type="button"
                          onClick={() => updateLayout({ logoHeight: Math.min(140, (layoutSettings.logoHeight || 56) + 2) })}
                          className="px-1 text-[9px] bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 rounded font-mono"
                          title="เพิ่มขนาด 2px"
                        >
                          +2
                        </button>
                      </div>
                    </div>
                    <input
                      type="range"
                      min="24"
                      max="140"
                      value={layoutSettings.logoHeight || 56}
                      onChange={(e) => updateLayout({ logoHeight: Number(e.target.value) })}
                      className="w-full accent-neutral-900 cursor-pointer"
                    />
                    <div className="flex items-center justify-between gap-1">
                      {[36, 48, 56, 64, 80, 100, 120].map((size) => (
                        <button
                          key={size}
                          type="button"
                          onClick={() => updateLayout({ logoHeight: size })}
                          className={`px-1.5 py-0.5 text-[10px] rounded border font-mono transition-colors ${
                            (layoutSettings.logoHeight || 56) === size
                              ? 'bg-neutral-900 text-white border-neutral-900 font-bold'
                              : 'bg-white text-neutral-600 border-neutral-300 hover:bg-neutral-100'
                          }`}
                        >
                          {size}px
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Logo Max Width Slider (ความกว้างสูงสุด) */}
                  <div className="pt-2 border-t border-neutral-200/80 space-y-1.5">
                    <div className="flex justify-between items-center text-[11px] text-neutral-700 font-semibold">
                      <span>ความกว้างสูงสุดของรูป (Logo Max Width):</span>
                      <span className="font-mono font-bold text-neutral-800 bg-neutral-100 px-1.5 py-0.2 rounded text-[10.5px]">
                        {layoutSettings.logoMaxWidth ? `${layoutSettings.logoMaxWidth}px` : 'อัตโนมัติ (Auto)'}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="80"
                      max="380"
                      value={layoutSettings.logoMaxWidth || 200}
                      onChange={(e) => updateLayout({ logoMaxWidth: Number(e.target.value) })}
                      className="w-full accent-neutral-800 cursor-pointer h-1.5"
                    />
                    <div className="flex items-center justify-between gap-1">
                      <button
                        type="button"
                        onClick={() => updateLayout({ logoMaxWidth: undefined })}
                        className={`px-1.5 py-0.5 text-[10px] rounded border transition-colors ${
                          !layoutSettings.logoMaxWidth
                            ? 'bg-neutral-900 text-white border-neutral-900 font-bold'
                            : 'bg-white text-neutral-600 border-neutral-300 hover:bg-neutral-100'
                        }`}
                      >
                        Auto
                      </button>
                      {[120, 160, 200, 260, 320].map((w) => (
                        <button
                          key={w}
                          type="button"
                          onClick={() => updateLayout({ logoMaxWidth: w })}
                          className={`px-1.5 py-0.5 text-[10px] rounded border font-mono transition-colors ${
                            layoutSettings.logoMaxWidth === w
                              ? 'bg-neutral-900 text-white border-neutral-900 font-bold'
                              : 'bg-white text-neutral-600 border-neutral-300 hover:bg-neutral-100'
                          }`}
                        >
                          {w}px
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Header Alignment Controls */}
                  <div className="pt-2 border-t border-neutral-200/80 space-y-2">
                    <label className="block text-[11px] font-semibold text-neutral-700">
                      การจัดวางตำแหน่งหัวกระดาษ (Header Alignment):
                    </label>
                    <div className="grid grid-cols-3 gap-1 p-0.5 bg-neutral-200/70 rounded-md">
                      {[
                        { id: 'left', label: 'ชิดซ้าย', icon: AlignLeft },
                        { id: 'center', label: 'กึ่งกลาง', icon: AlignCenter },
                        { id: 'right', label: 'ชิดขวา', icon: AlignRight },
                      ].map((item) => {
                        const Icon = item.icon;
                        const isSel = (layoutSettings.logoAlign || 'left') === item.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => updateLayout({ logoAlign: item.id as any })}
                            className={`py-1 text-center rounded flex items-center justify-center gap-1 text-[11px] font-medium transition-all ${
                              isSel
                                ? 'bg-white text-neutral-900 shadow-2xs font-bold'
                                : 'text-neutral-600 hover:text-neutral-900'
                            }`}
                          >
                            <Icon className="w-3.5 h-3.5" />
                            <span>{item.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Header Position D-Pad & Offsets */}
                  <div className="pt-2 border-t border-neutral-200/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="font-semibold text-neutral-700 flex items-center gap-1 text-[11px]">
                        <Move className="w-3 h-3 text-neutral-500" />
                        <span>ปุ่มเลื่อนตำแหน่ง (Position Controls)</span>
                      </label>
                      <button
                        type="button"
                        onClick={() =>
                          updateLayout({
                            headerOffsetX: 0,
                            headerOffsetY: 0,
                          })
                        }
                        className="text-[10px] text-neutral-500 hover:text-neutral-900 underline flex items-center gap-0.5"
                      >
                        <RotateCcw className="w-2.5 h-2.5" />
                        <span>รีเซ็ตตำแหน่ง</span>
                      </button>
                    </div>

                    {/* D-Pad Quick Move Buttons */}
                    <div className="p-2 bg-white rounded-lg border border-neutral-200 flex flex-col items-center gap-1.5 shadow-2xs">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => updateLayout({ headerOffsetY: Math.max(-40, (layoutSettings.headerOffsetY || 0) - 5) })}
                          className="px-2 py-0.5 text-[10px] bg-neutral-100 hover:bg-neutral-200 rounded border border-neutral-300 font-mono text-neutral-700"
                          title="เลื่อนขึ้น 5px"
                        >
                          ⬆ -5px
                        </button>
                        <button
                          type="button"
                          onClick={() => updateLayout({ headerOffsetY: Math.max(-40, (layoutSettings.headerOffsetY || 0) - 1) })}
                          className="p-1.5 bg-neutral-900 text-white hover:bg-neutral-800 rounded shadow-2xs"
                          title="เลื่อนขึ้น 1px"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-[10px] text-neutral-500 font-mono w-14 text-center font-bold">
                          Y: {layoutSettings.headerOffsetY || 0}px
                        </span>
                        <button
                          type="button"
                          onClick={() => updateLayout({ headerOffsetY: Math.min(60, (layoutSettings.headerOffsetY || 0) + 1) })}
                          className="p-1.5 bg-neutral-900 text-white hover:bg-neutral-800 rounded shadow-2xs"
                          title="เลื่อนลง 1px"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => updateLayout({ headerOffsetY: Math.min(60, (layoutSettings.headerOffsetY || 0) + 5) })}
                          className="px-2 py-0.5 text-[10px] bg-neutral-100 hover:bg-neutral-200 rounded border border-neutral-300 font-mono text-neutral-700"
                          title="เลื่อนลง 5px"
                        >
                          ⬇ +5px
                        </button>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => updateLayout({ headerOffsetX: Math.max(-60, (layoutSettings.headerOffsetX || 0) - 5) })}
                          className="px-2 py-0.5 text-[10px] bg-neutral-100 hover:bg-neutral-200 rounded border border-neutral-300 font-mono text-neutral-700"
                          title="เลื่อนซ้าย 5px"
                        >
                          ⬅ -5px
                        </button>
                        <button
                          type="button"
                          onClick={() => updateLayout({ headerOffsetX: Math.max(-60, (layoutSettings.headerOffsetX || 0) - 1) })}
                          className="p-1.5 bg-neutral-900 text-white hover:bg-neutral-800 rounded shadow-2xs"
                          title="เลื่อนซ้าย 1px"
                        >
                          <ArrowLeft className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-[10px] text-neutral-500 font-mono w-14 text-center font-bold">
                          X: {layoutSettings.headerOffsetX || 0}px
                        </span>
                        <button
                          type="button"
                          onClick={() => updateLayout({ headerOffsetX: Math.min(60, (layoutSettings.headerOffsetX || 0) + 1) })}
                          className="p-1.5 bg-neutral-900 text-white hover:bg-neutral-800 rounded shadow-2xs"
                          title="เลื่อนขวา 1px"
                        >
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => updateLayout({ headerOffsetX: Math.min(60, (layoutSettings.headerOffsetX || 0) + 5) })}
                          className="px-2 py-0.5 text-[10px] bg-neutral-100 hover:bg-neutral-200 rounded border border-neutral-300 font-mono text-neutral-700"
                          title="เลื่อนขวา 5px"
                        >
                          ➡ +5px
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <div>
                        <div className="flex justify-between items-center text-[10.5px] text-neutral-600 mb-0.5">
                          <span>สไลเดอร์แนวนอน (X)</span>
                          <span className="font-mono font-bold text-neutral-800">
                            {layoutSettings.headerOffsetX || 0}px
                          </span>
                        </div>
                        <input
                          type="range"
                          min="-60"
                          max="60"
                          value={layoutSettings.headerOffsetX || 0}
                          onChange={(e) => updateLayout({ headerOffsetX: Number(e.target.value) })}
                          className="w-full accent-neutral-900 cursor-pointer h-1.5"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between items-center text-[10.5px] text-neutral-600 mb-0.5">
                          <span>สไลเดอร์แนวตั้ง (Y)</span>
                          <span className="font-mono font-bold text-neutral-800">
                            {layoutSettings.headerOffsetY || 0}px
                          </span>
                        </div>
                        <input
                          type="range"
                          min="-40"
                          max="60"
                          value={layoutSettings.headerOffsetY || 0}
                          onChange={(e) => updateLayout({ headerOffsetY: Number(e.target.value) })}
                          className="w-full accent-neutral-900 cursor-pointer h-1.5"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Vertical Spacing & Padding Controls */}
                  <div className="pt-2 border-t border-neutral-200/80 space-y-2.5 bg-neutral-100/60 p-2.5 rounded-lg">
                    <div className="flex items-center justify-between">
                      <label className="font-semibold text-neutral-800 flex items-center gap-1 text-[11px]">
                        <SlidersHorizontal className="w-3.5 h-3.5 text-neutral-600" />
                        <span>ระยะเว้นบน-ล่าง (Vertical Spacing)</span>
                      </label>
                      <button
                        type="button"
                        onClick={() =>
                          updateLayout({
                            headerPaddingTop: 0,
                            headerPaddingBottom: 0,
                            headerMarginBottom: 12,
                          })
                        }
                        className="text-[10px] text-neutral-500 hover:text-neutral-900 underline"
                      >
                        ค่ามาตรฐาน
                      </button>
                    </div>

                    {/* Top Padding */}
                    <div className="space-y-1">
                      <div className="flex justify-between items-center text-[10.5px]">
                        <span className="text-neutral-600 font-medium">ระยะเว้นบน (Top Padding)</span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => updateLayout({ headerPaddingTop: Math.max(0, (layoutSettings.headerPaddingTop || 0) - 2) })}
                            className="px-1 text-[9px] bg-white border border-neutral-300 rounded font-mono"
                          >
                            -2
                          </button>
                          <span className="font-mono font-bold text-neutral-900 bg-white border border-neutral-200 px-1.5 py-0.2 rounded text-[10px]">
                            {layoutSettings.headerPaddingTop || 0}px
                          </span>
                          <button
                            type="button"
                            onClick={() => updateLayout({ headerPaddingTop: Math.min(50, (layoutSettings.headerPaddingTop || 0) + 2) })}
                            className="px-1 text-[9px] bg-white border border-neutral-300 rounded font-mono"
                          >
                            +2
                          </button>
                        </div>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="50"
                        value={layoutSettings.headerPaddingTop || 0}
                        onChange={(e) => updateLayout({ headerPaddingTop: Number(e.target.value) })}
                        className="w-full accent-neutral-800 cursor-pointer h-1.5"
                      />
                      <div className="flex items-center justify-between gap-1">
                        {[0, 4, 8, 12, 16, 24].map((pad) => (
                          <button
                            key={pad}
                            type="button"
                            onClick={() => updateLayout({ headerPaddingTop: pad })}
                            className={`px-1.5 py-0.2 text-[9.5px] rounded border font-mono transition-colors ${
                              (layoutSettings.headerPaddingTop || 0) === pad
                                ? 'bg-neutral-900 text-white border-neutral-900 font-bold'
                                : 'bg-white text-neutral-600 border-neutral-300 hover:bg-neutral-100'
                            }`}
                          >
                            {pad}px
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Bottom Padding */}
                    <div className="space-y-1 pt-1 border-t border-neutral-200/60">
                      <div className="flex justify-between items-center text-[10.5px]">
                        <span className="text-neutral-600 font-medium">ระยะเว้นในล่าง (Bottom Padding)</span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => updateLayout({ headerPaddingBottom: Math.max(0, (layoutSettings.headerPaddingBottom || 0) - 2) })}
                            className="px-1 text-[9px] bg-white border border-neutral-300 rounded font-mono"
                          >
                            -2
                          </button>
                          <span className="font-mono font-bold text-neutral-900 bg-white border border-neutral-200 px-1.5 py-0.2 rounded text-[10px]">
                            {layoutSettings.headerPaddingBottom || 0}px
                          </span>
                          <button
                            type="button"
                            onClick={() => updateLayout({ headerPaddingBottom: Math.min(50, (layoutSettings.headerPaddingBottom || 0) + 2) })}
                            className="px-1 text-[9px] bg-white border border-neutral-300 rounded font-mono"
                          >
                            +2
                          </button>
                        </div>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="50"
                        value={layoutSettings.headerPaddingBottom || 0}
                        onChange={(e) => updateLayout({ headerPaddingBottom: Number(e.target.value) })}
                        className="w-full accent-neutral-800 cursor-pointer h-1.5"
                      />
                      <div className="flex items-center justify-between gap-1">
                        {[0, 4, 8, 12, 16, 24].map((pad) => (
                          <button
                            key={pad}
                            type="button"
                            onClick={() => updateLayout({ headerPaddingBottom: pad })}
                            className={`px-1.5 py-0.2 text-[9.5px] rounded border font-mono transition-colors ${
                              (layoutSettings.headerPaddingBottom || 0) === pad
                                ? 'bg-neutral-900 text-white border-neutral-900 font-bold'
                                : 'bg-white text-neutral-600 border-neutral-300 hover:bg-neutral-100'
                            }`}
                          >
                            {pad}px
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Bottom Margin (Distance to Quote Meta) */}
                    <div className="space-y-1 pt-1 border-t border-neutral-200/60">
                      <div className="flex justify-between items-center text-[10.5px]">
                        <span className="text-neutral-600 font-medium">ระยะห่างด้านล่าง (Bottom Margin)</span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => updateLayout({ headerMarginBottom: Math.max(0, (layoutSettings.headerMarginBottom ?? 12) - 2) })}
                            className="px-1 text-[9px] bg-white border border-neutral-300 rounded font-mono"
                          >
                            -2
                          </button>
                          <span className="font-mono font-bold text-neutral-900 bg-white border border-neutral-200 px-1.5 py-0.2 rounded text-[10px]">
                            {layoutSettings.headerMarginBottom ?? 12}px
                          </span>
                          <button
                            type="button"
                            onClick={() => updateLayout({ headerMarginBottom: Math.min(40, (layoutSettings.headerMarginBottom ?? 12) + 2) })}
                            className="px-1 text-[9px] bg-white border border-neutral-300 rounded font-mono"
                          >
                            +2
                          </button>
                        </div>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="40"
                        value={layoutSettings.headerMarginBottom ?? 12}
                        onChange={(e) => updateLayout({ headerMarginBottom: Number(e.target.value) })}
                        className="w-full accent-neutral-800 cursor-pointer h-1.5"
                      />
                      <div className="flex items-center justify-between gap-1">
                        {[0, 6, 12, 16, 20, 24].map((margin) => (
                          <button
                            key={margin}
                            type="button"
                            onClick={() => updateLayout({ headerMarginBottom: margin })}
                            className={`px-1.5 py-0.2 text-[9.5px] rounded border font-mono transition-colors ${
                              (layoutSettings.headerMarginBottom ?? 12) === margin
                                ? 'bg-neutral-900 text-white border-neutral-900 font-bold'
                                : 'bg-white text-neutral-600 border-neutral-300 hover:bg-neutral-100'
                            }`}
                          >
                            {margin}px
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column: Title, Subtitle, Company Info Form & Font Controls (7 cols) */}
                <div className="lg:col-span-7 space-y-4">
                  {/* Font Family Dropdown & Badges for Header */}
                  <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200/80 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <label className="font-semibold text-neutral-800 flex items-center gap-1.5 text-xs">
                        <Type className="w-3.5 h-3.5 text-neutral-600" />
                        <span>เลือกฟอนต์หัวกระดาษ (Header Font Family)</span>
                      </label>
                      <span className="text-[10px] text-neutral-600 bg-white border border-neutral-200 px-2 py-0.5 rounded font-mono font-medium">
                        {layoutSettings.headerFontFamily || 'Trirong'}
                      </span>
                    </div>

                    {/* Font Dropdown Select */}
                    <div className="relative">
                      <select
                        value={layoutSettings.headerFontFamily || 'Trirong'}
                        onChange={(e) => updateLayout({ headerFontFamily: e.target.value })}
                        className="w-full px-3 py-2 border border-neutral-300 rounded-md bg-white text-xs font-medium text-neutral-800 focus:ring-1 focus:ring-neutral-800 shadow-2xs"
                      >
                        <option value="Trirong">🏛️ Trirong (ฟอนต์ทางการ / คลาสสิก มีหัว)</option>
                        <option value="Sarabun">🇹🇭 Sarabun (ฟอนต์สารบรรณ มาตรฐานเอกสารราชการ/องค์กร)</option>
                        <option value="Prompt">🏢 Prompt (ฟอนต์โมเดิร์น ไร้หัว สไตล์โมเดิร์น)</option>
                        <option value="Kanit">🎨 Kanit (ฟอนต์กว้าง ทันสมัย ดีไซน์ยอดนิยม)</option>
                        <option value="Mitr">✨ Mitr (ฟอนต์โค้งมน นุ่มนวล ดูเป็นมิตร)</option>
                        <option value="Chakra Petch">⚡ Chakra Petch (ฟอนต์เหลี่ยม โมเดิร์น เทคโนโลยี)</option>
                        <option value="Bai Jamjuree">🌿 Bai Jamjuree (ฟอนต์อ่านง่าย ทรงพรีเมียม)</option>
                        <option value="IBM Plex Sans Thai">💼 IBM Plex Sans Thai (ฟอนต์ธุรกิจสากล กึ่งทางการ)</option>
                        <option value="Noto Sans Thai">🌐 Noto Sans Thai (ฟอนต์มาตรฐานสากล Google)</option>
                        <option value="system-ui">💻 System UI (ฟอนต์มาตรฐานระบบ Sans-serif)</option>
                      </select>
                    </div>

                    {/* Quick Font Chips */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 pt-0.5">
                      {[
                        { id: 'Trirong', label: '🏛️ Trirong' },
                        { id: 'Sarabun', label: '🇹🇭 Sarabun' },
                        { id: 'Prompt', label: '🏢 Prompt' },
                        { id: 'Kanit', label: '🎨 Kanit' },
                        { id: 'Mitr', label: '✨ Mitr' },
                        { id: 'Chakra Petch', label: '⚡ Chakra Petch' },
                        { id: 'IBM Plex Sans Thai', label: '💼 IBM Plex' },
                        { id: 'system-ui', label: '💻 System UI' },
                      ].map((f) => {
                        const isSelected = (layoutSettings.headerFontFamily || 'Trirong') === f.id;
                        return (
                          <button
                            key={f.id}
                            type="button"
                            onClick={() => updateLayout({ headerFontFamily: f.id })}
                            className={`py-1 px-2 text-center rounded-md border text-[10.5px] font-medium transition-all ${
                              isSelected
                                ? 'bg-neutral-900 text-white border-neutral-900 font-bold shadow-2xs'
                                : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-100'
                            }`}
                          >
                            <span>{f.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Header Title Field with Emoji picker and Presets */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="font-semibold text-neutral-800 flex items-center gap-1">
                        <span>ข้อความหัวเรื่อง (Header Title)</span>
                        <span className="text-neutral-400 font-normal text-[10px]">(รองรับอีโมจิ & ข้อความอิสระ)</span>
                      </label>
                      <div className="flex items-center gap-1 text-[11px]">
                        <span className="text-neutral-500">ขนาด:</span>
                        <button
                          type="button"
                          onClick={() => updateLayout({ headerTitleFontSize: Math.max(12, (layoutSettings.headerTitleFontSize || 16) - 1) })}
                          className="px-1 text-[9px] bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 rounded font-mono"
                          title="ลดขนาด 1px"
                        >
                          -1
                        </button>
                        <span className="font-mono font-bold text-blue-700 bg-blue-50 border border-blue-200 px-1 py-0.2 rounded text-[10px]">
                          {layoutSettings.headerTitleFontSize || 16}px
                        </span>
                        <button
                          type="button"
                          onClick={() => updateLayout({ headerTitleFontSize: Math.min(36, (layoutSettings.headerTitleFontSize || 16) + 1) })}
                          className="px-1 text-[9px] bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 rounded font-mono"
                          title="เพิ่มขนาด 1px"
                        >
                          +1
                        </button>
                      </div>
                    </div>

                    <div className="relative">
                      <input
                        type="text"
                        value={headerTitle}
                        onChange={(e) => setHeaderTitle(e.target.value)}
                        className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-1 focus:ring-neutral-800 font-medium text-xs shadow-2xs"
                        placeholder="ใบเสนอราคา หรือพิมพ์ข้อความ / อีโมจิตามต้องการ..."
                      />
                    </div>

                    {/* Quick Emoji shortcuts for Title */}
                    <div className="flex flex-wrap items-center gap-1 pt-0.5">
                      <span className="text-[10px] text-neutral-400 mr-0.5 flex items-center gap-0.5">
                        <Smile className="w-3 h-3 text-amber-500" /> อีโมจิ:
                      </span>
                      {['🏢', '📄', '📑', '🏷️', '📌', '📋', '🏛️', '🌟', '✨', '💼', '🎓', '🛎️'].map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => setHeaderTitle((prev) => (prev ? `${prev} ${emoji}` : emoji))}
                          className="px-1.5 py-0.5 bg-neutral-100 hover:bg-neutral-200 rounded text-xs transition-colors"
                          title={`แทรกอีโมจิ ${emoji}`}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>

                    {/* Title Quick Presets & Font Size Slider */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                      <div className="flex flex-wrap items-center gap-1">
                        <span className="text-[10px] text-neutral-400 mr-0.5">พรีเซ็ต:</span>
                        {['ใบเสนอราคา', 'ใบเสนอราคา / QUOTATION', 'ใบแจ้งค่าบริการ', 'ข้อเสนอโครงการ'].map((preset) => (
                          <button
                            key={preset}
                            type="button"
                            onClick={() => setHeaderTitle(preset)}
                            className={`text-[10px] px-2 py-0.5 rounded border transition-colors ${
                              headerTitle === preset
                                ? 'bg-neutral-800 text-white border-neutral-800 font-semibold'
                                : 'bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-100'
                            }`}
                          >
                            {preset}
                          </button>
                        ))}
                      </div>

                      <div className="flex items-center gap-1 ml-auto">
                        <span className="text-[10px] text-neutral-500">สเกล:</span>
                        {[14, 16, 18, 20, 24, 28].map((size) => (
                          <button
                            key={size}
                            type="button"
                            onClick={() => updateLayout({ headerTitleFontSize: size })}
                            className={`px-1.5 py-0.5 text-[10px] rounded border font-mono transition-colors ${
                              (layoutSettings.headerTitleFontSize || 16) === size
                                ? 'bg-blue-600 text-white border-blue-600 font-bold'
                                : 'bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-100'
                            }`}
                          >
                            {size}px
                          </button>
                        ))}
                      </div>
                    </div>

                    <input
                      type="range"
                      min="12"
                      max="36"
                      value={layoutSettings.headerTitleFontSize || 16}
                      onChange={(e) => updateLayout({ headerTitleFontSize: Number(e.target.value) })}
                      className="w-full accent-blue-600 cursor-pointer h-1.5"
                    />
                  </div>

                  {/* Header Subtitle Field with Presets and Font Size Slider */}
                  <div className="space-y-1.5 pt-2 border-t border-neutral-200/60">
                    <div className="flex items-center justify-between">
                      <label className="font-semibold text-neutral-800 flex items-center gap-1">
                        <span>หัวเรื่องย่อย (Header Subtitle)</span>
                        <span className="text-neutral-400 font-normal text-[10px]">(รองรับอีโมจิ & ข้อความอิสระ)</span>
                      </label>
                      <div className="flex items-center gap-1 text-[11px]">
                        <span className="text-neutral-500">ขนาด:</span>
                        <button
                          type="button"
                          onClick={() => updateLayout({ headerSubtitleFontSize: Math.max(9, (layoutSettings.headerSubtitleFontSize || 11) - 1) })}
                          className="px-1 text-[9px] bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 rounded font-mono"
                          title="ลดขนาด 1px"
                        >
                          -1
                        </button>
                        <span className="font-mono font-bold text-blue-700 bg-blue-50 border border-blue-200 px-1 py-0.2 rounded text-[10px]">
                          {layoutSettings.headerSubtitleFontSize || 11}px
                        </span>
                        <button
                          type="button"
                          onClick={() => updateLayout({ headerSubtitleFontSize: Math.min(24, (layoutSettings.headerSubtitleFontSize || 11) + 1) })}
                          className="px-1 text-[9px] bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 rounded font-mono"
                          title="เพิ่มขนาด 1px"
                        >
                          +1
                        </button>
                      </div>
                    </div>

                    <div className="relative">
                      <input
                        type="text"
                        value={headerSubtitle}
                        onChange={(e) => setHeaderSubtitle(e.target.value)}
                        className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-1 focus:ring-neutral-800 font-mono text-xs shadow-2xs"
                        placeholder="QUOTATION"
                      />
                    </div>

                    {/* Subtitle Quick Presets & Font Size Slider */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
                      <div className="flex flex-wrap items-center gap-1">
                        <span className="text-[10px] text-neutral-400 mr-0.5">พรีเซ็ต:</span>
                        {['QUOTATION', 'ESTIMATE', 'OFFICIAL QUOTE', 'PROPOSAL'].map((preset) => (
                          <button
                            key={preset}
                            type="button"
                            onClick={() => setHeaderSubtitle(preset)}
                            className={`text-[10px] px-2 py-0.5 rounded border font-mono transition-colors ${
                              headerSubtitle === preset
                                ? 'bg-neutral-800 text-white border-neutral-800 font-semibold'
                                : 'bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-100'
                            }`}
                          >
                            {preset}
                          </button>
                        ))}
                      </div>

                      <div className="flex items-center gap-1 ml-auto">
                        <span className="text-[10px] text-neutral-500">สเกล:</span>
                        {[9, 10, 11, 12, 14, 16].map((size) => (
                          <button
                            key={size}
                            type="button"
                            onClick={() => updateLayout({ headerSubtitleFontSize: size })}
                            className={`px-1.5 py-0.5 text-[10px] rounded border font-mono transition-colors ${
                              (layoutSettings.headerSubtitleFontSize || 11) === size
                                ? 'bg-blue-600 text-white border-blue-600 font-bold'
                                : 'bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-100'
                            }`}
                          >
                            {size}px
                          </button>
                        ))}
                      </div>
                    </div>

                    <input
                      type="range"
                      min="9"
                      max="24"
                      value={layoutSettings.headerSubtitleFontSize || 11}
                      onChange={(e) => updateLayout({ headerSubtitleFontSize: Number(e.target.value) })}
                      className="w-full accent-blue-600 cursor-pointer h-1.5"
                    />
                  </div>

                  {/* Company Info Customization Section */}
                  <div className="space-y-3.5 pt-3 border-t border-neutral-200/80 bg-neutral-50/70 p-3.5 rounded-xl border border-neutral-200">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <Building className="w-4 h-4 text-neutral-800" />
                        <span className="font-bold text-neutral-900 text-xs">
                          ข้อมูลบริษัท & รายละเอียดผู้ให้บริการ (Company Info & Tax)
                        </span>
                      </div>
                      <span className="text-[10px] text-neutral-500 font-medium">
                        🏢 ปรับแต่งฟอนต์, การจัดวาง และตำแหน่งข้อมูลบริษัท
                      </span>
                    </div>

                    {/* 1. Font Family & Size Controls for Company Info */}
                    <div className="p-2.5 bg-white rounded-lg border border-neutral-200 space-y-2.5">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {/* Font Family Dropdown */}
                        <div>
                          <label className="block text-[11px] font-semibold text-neutral-700 mb-1 flex items-center gap-1">
                            <Type className="w-3.5 h-3.5 text-neutral-500" />
                            <span>ฟอนต์ข้อมูลบริษัท (Company Font Family):</span>
                          </label>
                          <select
                            value={layoutSettings.companyFontFamily || layoutSettings.headerFontFamily || 'Trirong'}
                            onChange={(e) => updateLayout({ companyFontFamily: e.target.value })}
                            className="w-full px-2.5 py-1.5 bg-white border border-neutral-300 rounded-md text-xs text-neutral-800 focus:ring-1 focus:ring-neutral-800 font-medium cursor-pointer"
                          >
                            <option value="Trirong">Trirong (ทางการ / มาตรฐาน)</option>
                            <option value="Sarabun">Sarabun (สารบรรณ สะอาดตา)</option>
                            <option value="Prompt">Prompt (โมเดิร์น สวยงาม)</option>
                            <option value="Kanit">Kanit (ทันสมัย มีพลัง)</option>
                            <option value="Mitr">Mitr (อ่านง่าย เป็นมิตร)</option>
                            <option value="Chakra Petch">Chakra Petch (คมชัด ทันสมัย)</option>
                            <option value="Bai Jamjuree">Bai Jamjuree (เหลี่ยม โมเดิร์น)</option>
                            <option value="IBM Plex Sans Thai">IBM Plex Sans Thai (มาตรฐานองค์กร)</option>
                            <option value="Noto Sans Thai">Noto Sans Thai (สากล เรียบหรู)</option>
                            <option value="system-ui">System Default (ฟอนต์ระบบ)</option>
                          </select>
                        </div>

                        {/* Alignment */}
                        <div>
                          <label className="block text-[11px] font-semibold text-neutral-700 mb-1 flex items-center gap-1">
                            <AlignLeft className="w-3.5 h-3.5 text-neutral-500" />
                            <span>การจัดวางข้อความบริษัท (Company Alignment):</span>
                          </label>
                          <div className="grid grid-cols-4 gap-1 p-0.5 bg-neutral-100 rounded-md border border-neutral-200">
                            {[
                              { id: 'auto', label: 'Auto (ตามโลโก้)' },
                              { id: 'left', label: 'ชิดซ้าย' },
                              { id: 'center', label: 'กึ่งกลาง' },
                              { id: 'right', label: 'ชิดขวา' },
                            ].map((alignOpt) => (
                              <button
                                key={alignOpt.id}
                                type="button"
                                onClick={() => updateLayout({ companyAlign: alignOpt.id as any })}
                                className={`py-1 text-[10.5px] rounded font-medium transition-all ${
                                  (layoutSettings.companyAlign || 'auto') === alignOpt.id
                                    ? 'bg-neutral-900 text-white shadow-2xs font-bold'
                                    : 'text-neutral-600 hover:text-neutral-900'
                                }`}
                              >
                                {alignOpt.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Font Size Slider & Increment */}
                      <div className="pt-2 border-t border-neutral-100 space-y-1.5">
                        <div className="flex flex-wrap items-center justify-between gap-1 text-[11px]">
                          <span className="font-semibold text-neutral-700">
                            ขนาดฟอนต์ข้อมูลบริษัท: <span className="font-mono font-bold text-neutral-900">{layoutSettings.headerCompanyFontSize || 11}px</span>
                          </span>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => updateLayout({ headerCompanyFontSize: Math.max(8, (layoutSettings.headerCompanyFontSize || 11) - 1) })}
                              className="px-1.5 py-0.5 text-[10px] bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 rounded font-mono font-bold"
                              title="ลดขนาด 1px"
                            >
                              -1
                            </button>
                            {[9, 10, 11, 12, 13, 14, 16].map((size) => (
                              <button
                                key={size}
                                type="button"
                                onClick={() => updateLayout({ headerCompanyFontSize: size })}
                                className={`px-1.5 py-0.5 text-[10px] rounded border font-mono transition-colors ${
                                  (layoutSettings.headerCompanyFontSize || 11) === size
                                    ? 'bg-neutral-900 text-white border-neutral-900 font-bold'
                                    : 'bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-100'
                                }`}
                              >
                                {size}
                              </button>
                            ))}
                            <button
                              type="button"
                              onClick={() => updateLayout({ headerCompanyFontSize: Math.min(20, (layoutSettings.headerCompanyFontSize || 11) + 1) })}
                              className="px-1.5 py-0.5 text-[10px] bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 rounded font-mono font-bold"
                              title="เพิ่มขนาด 1px"
                            >
                              +1
                            </button>
                          </div>
                        </div>
                        <input
                          type="range"
                          min="8"
                          max="20"
                          value={layoutSettings.headerCompanyFontSize || 11}
                          onChange={(e) => updateLayout({ headerCompanyFontSize: Number(e.target.value) })}
                          className="w-full accent-neutral-900 cursor-pointer h-1.5"
                        />
                      </div>
                    </div>

                    {/* 2. Spacing & Offsets for Company Info */}
                    <div className="p-2.5 bg-white rounded-lg border border-neutral-200 space-y-2.5">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {/* Line Height */}
                        <div>
                          <div className="flex justify-between items-center text-[10.5px] font-semibold text-neutral-700 mb-1">
                            <span>ระยะห่างบรรทัด (Line Height):</span>
                            <span className="font-mono text-neutral-900 font-bold">
                              {layoutSettings.companyLineHeight ? `${layoutSettings.companyLineHeight}` : '1.25 (ปกติ)'}
                            </span>
                          </div>
                          <div className="grid grid-cols-4 gap-1 p-0.5 bg-neutral-100 rounded-md border border-neutral-200">
                            {[
                              { val: 1.15, label: '1.15' },
                              { val: 1.25, label: '1.25' },
                              { val: 1.45, label: '1.45' },
                              { val: 1.65, label: '1.65' },
                            ].map((lh) => (
                              <button
                                key={lh.val}
                                type="button"
                                onClick={() => updateLayout({ companyLineHeight: lh.val })}
                                className={`py-1 text-[10px] rounded font-medium ${
                                  (layoutSettings.companyLineHeight || 1.25) === lh.val
                                    ? 'bg-neutral-900 text-white font-bold'
                                    : 'text-neutral-600 hover:text-neutral-900'
                                }`}
                              >
                                {lh.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Top Padding */}
                        <div>
                          <div className="flex justify-between items-center text-[10.5px] font-semibold text-neutral-700 mb-1">
                            <span>ระยะเว้นบน (Top Pad):</span>
                            <span className="font-mono text-neutral-900 font-bold">{layoutSettings.companyPaddingTop || 0}px</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="30"
                            value={layoutSettings.companyPaddingTop || 0}
                            onChange={(e) => updateLayout({ companyPaddingTop: Number(e.target.value) })}
                            className="w-full accent-neutral-900 cursor-pointer h-1.5 mt-2"
                          />
                        </div>

                        {/* Bottom Padding */}
                        <div>
                          <div className="flex justify-between items-center text-[10.5px] font-semibold text-neutral-700 mb-1">
                            <span>ระยะเว้นล่าง (Bottom Pad):</span>
                            <span className="font-mono text-neutral-900 font-bold">{layoutSettings.companyPaddingBottom || 0}px</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="30"
                            value={layoutSettings.companyPaddingBottom || 0}
                            onChange={(e) => updateLayout({ companyPaddingBottom: Number(e.target.value) })}
                            className="w-full accent-neutral-900 cursor-pointer h-1.5 mt-2"
                          />
                        </div>
                      </div>

                      {/* Position Offsets (X / Y) */}
                      <div className="pt-2 border-t border-neutral-100 flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-1 text-[11px] font-semibold text-neutral-700">
                          <Move className="w-3.5 h-3.5 text-neutral-500" />
                          <span>ขยับตำแหน่งแนวตั้ง/แนวนอน:</span>
                          <span className="font-mono text-[10px] text-neutral-500 ml-1">
                            (X: {layoutSettings.companyOffsetX || 0}px, Y: {layoutSettings.companyOffsetY || 0}px)
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => updateLayout({ companyOffsetX: (layoutSettings.companyOffsetX || 0) - 2 })}
                            className="px-2 py-0.5 bg-neutral-100 hover:bg-neutral-200 rounded text-[10.5px] font-medium border border-neutral-200"
                            title="เลื่อนซ้าย 2px"
                          >
                            ⬅️ -2px
                          </button>
                          <button
                            type="button"
                            onClick={() => updateLayout({ companyOffsetX: (layoutSettings.companyOffsetX || 0) + 2 })}
                            className="px-2 py-0.5 bg-neutral-100 hover:bg-neutral-200 rounded text-[10.5px] font-medium border border-neutral-200"
                            title="เลื่อนขวา 2px"
                          >
                            ➡️ +2px
                          </button>
                          <button
                            type="button"
                            onClick={() => updateLayout({ companyOffsetY: (layoutSettings.companyOffsetY || 0) - 2 })}
                            className="px-2 py-0.5 bg-neutral-100 hover:bg-neutral-200 rounded text-[10.5px] font-medium border border-neutral-200"
                            title="เลื่อนขึ้น 2px"
                          >
                            ⬆️ -2px
                          </button>
                          <button
                            type="button"
                            onClick={() => updateLayout({ companyOffsetY: (layoutSettings.companyOffsetY || 0) + 2 })}
                            className="px-2 py-0.5 bg-neutral-100 hover:bg-neutral-200 rounded text-[10.5px] font-medium border border-neutral-200"
                            title="เลื่อนลง 2px"
                          >
                            ⬇️ +2px
                          </button>
                          {(layoutSettings.companyOffsetX || layoutSettings.companyOffsetY) ? (
                            <button
                              type="button"
                              onClick={() => updateLayout({ companyOffsetX: 0, companyOffsetY: 0 })}
                              className="px-2 py-0.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded text-[10.5px] font-medium"
                              title="รีเซ็ตตำแหน่งเป็น 0"
                            >
                              <RotateCcw className="w-3 h-3 inline mr-0.5" /> รีเซ็ต
                            </button>
                          ) : null}
                        </div>
                      </div>
                    </div>

                    {/* 3. Text Inputs for Company Details */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
                          ชื่อบริษัท / องค์กร (Company Name)
                        </label>
                        <input
                          type="text"
                          value={companyName}
                          onChange={(e) => setCompanyName(e.target.value)}
                          className="w-full px-2.5 py-1.5 border border-neutral-300 rounded-md bg-white text-xs focus:ring-1 focus:ring-neutral-800"
                          placeholder="Knowledge Xchange"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
                          เลขประจำตัวผู้เสียภาษี (Tax ID)
                        </label>
                        <input
                          type="text"
                          value={companyTaxId}
                          onChange={(e) => setCompanyTaxId(e.target.value)}
                          className="w-full px-2.5 py-1.5 border border-neutral-300 rounded-md bg-white text-xs font-mono focus:ring-1 focus:ring-neutral-800"
                          placeholder="099-4-000-16009-7"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-neutral-700 mb-1 flex items-center gap-1">
                          <Globe className="w-3 h-3 text-neutral-500" />
                          <span>เว็บไซต์ (Website)</span>
                        </label>
                        <input
                          type="text"
                          value={companyWebsite}
                          onChange={(e) => setCompanyWebsite(e.target.value)}
                          className="w-full px-2.5 py-1.5 border border-neutral-300 rounded-md bg-white text-xs font-mono focus:ring-1 focus:ring-neutral-800"
                          placeholder="www.kxinnovation.com"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-neutral-700 mb-1 flex items-center gap-1">
                          <Phone className="w-3 h-3 text-neutral-500" />
                          <span>เบอร์โทรศัพท์ (Phone)</span>
                        </label>
                        <input
                          type="text"
                          value={companyPhone}
                          onChange={(e) => setCompanyPhone(e.target.value)}
                          className="w-full px-2.5 py-1.5 border border-neutral-300 rounded-md bg-white text-xs font-mono focus:ring-1 focus:ring-neutral-800"
                          placeholder="02-470-7906, 02-470-7907"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-neutral-700 mb-1 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-neutral-500" />
                        <span>ที่อยู่บริษัท (Address - รองรับการขึ้นบรรทัดใหม่)</span>
                      </label>
                      <textarea
                        rows={3}
                        value={companyAddress}
                        onChange={(e) => setCompanyAddress(e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-neutral-300 rounded-md bg-white text-xs focus:ring-1 focus:ring-neutral-800 font-sans"
                        placeholder="110/1 อาคารเคเอกซ์ ถนนกรุงธนบุรี..."
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

            {/* 2. ตัวควบคุมการจัดหน้ากระดาษ & ระยะห่าง (Custom Layout & Spacing Controller) */}
            <div className="bg-white rounded-xl border border-neutral-200 shadow-2xs overflow-hidden">
              <div
                onClick={() => toggleSection('layoutPrint')}
                className="w-full px-5 py-3.5 flex flex-wrap items-center justify-between gap-2 bg-white hover:bg-neutral-50/80 transition-colors cursor-pointer border-b border-neutral-100 select-none"
              >
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-neutral-800" />
                  <h3 className="text-sm font-bold text-neutral-800">
                    2. ปรับแต่งจัดหน้ากระดาษ & ระยะห่าง (Layout & Print Settings)
                  </h3>
                  {collapsedSections.layoutPrint && (
                    <span className="text-[10px] text-neutral-500 bg-neutral-100 px-1.5 py-0.5 rounded">
                      ย่ออยู่
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    onClick={() => applyLayoutPreset('fit')}
                    className="text-[11px] font-medium bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 px-2.5 py-1 rounded transition-colors flex items-center gap-1 shadow-2xs"
                    title="ปรับย่อระยะและฟอนต์ให้พอดี 1 หน้ากระดาษ A4"
                  >
                    <Maximize2 className="w-3 h-3 text-amber-700" />
                    พอดี 1 หน้า (Fit A4)
                  </button>
                  <button
                    type="button"
                    onClick={() => applyLayoutPreset('default')}
                    className="text-[11px] text-neutral-500 hover:text-neutral-800 font-medium underline px-1"
                  >
                    คืนค่าเริ่มต้น
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleSection('layoutPrint')}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-800 border border-neutral-200 transition-colors"
                    title={collapsedSections.layoutPrint ? 'คลิกเพื่อกางออก' : 'คลิกเพื่อพับเก็บ'}
                  >
                    {collapsedSections.layoutPrint ? (
                      <>
                        <ChevronsDown className="w-3.5 h-3.5 text-neutral-600" />
                        <span>กางออก</span>
                      </>
                    ) : (
                      <>
                        <ChevronsUp className="w-3.5 h-3.5 text-neutral-600" />
                        <span>พับย่อ</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Collapsed Summary Ribbon */}
              {collapsedSections.layoutPrint && (
                <div
                  onClick={() => toggleSection('layoutPrint')}
                  className="px-5 py-2.5 bg-neutral-50/70 hover:bg-neutral-100/80 cursor-pointer flex flex-wrap items-center justify-between gap-2 text-xs text-neutral-600 border-t border-neutral-100 transition-colors select-none"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-neutral-800">📄 ระยะขอบ A4:</span>
                    <span>บน {layoutSettings.paddingTop}px, ล่าง {layoutSettings.paddingBottom}px, ซ้าย {layoutSettings.paddingLeft}px, ขวา {layoutSettings.paddingRight}px</span>
                    <span className="text-neutral-400">•</span>
                    <span>ขนาดฟอนต์: {layoutSettings.fontSize === 'compact' ? 'เล็ก' : layoutSettings.fontSize === 'large' ? 'ใหญ่' : 'ปกติ'}</span>
                    <span className="text-neutral-400">•</span>
                    <span>ระยะห่าง: {layoutSettings.sectionSpacing === 'compact' ? 'ชิด' : layoutSettings.sectionSpacing === 'relaxed' ? 'โปร่ง' : 'ปกติ'}</span>
                  </div>
                  <span className="text-[11px] text-blue-600 font-semibold hover:underline flex items-center gap-1">
                    <ChevronsDown className="w-3 h-3" /> คลิกเพื่อขยายแก้ไข
                  </span>
                </div>
              )}

              {!collapsedSections.layoutPrint && (
                <div className="p-5 pt-4 space-y-4 text-xs">
                  {/* Presets Quick Toolbar */}
                  <div className="flex flex-wrap items-center gap-1.5 p-2 bg-neutral-50 rounded-lg border border-neutral-200/80">
                    <span className="text-[11px] font-semibold text-neutral-600 mr-1 flex items-center gap-1">
                      <LayoutTemplate className="w-3.5 h-3.5" /> พรีเซ็ตการจัดหน้า:
                    </span>
                    <button
                      type="button"
                      onClick={() => applyLayoutPreset('fit')}
                      className="px-2.5 py-1 bg-white hover:bg-neutral-100 border border-neutral-300 rounded text-[11px] font-medium text-neutral-800 transition-colors"
                    >
                      🎯 พอดี 1 หน้า (Fit 1 Page)
                    </button>
                    <button
                      type="button"
                      onClick={() => applyLayoutPreset('compact')}
                      className="px-2.5 py-1 bg-white hover:bg-neutral-100 border border-neutral-300 rounded text-[11px] font-medium text-neutral-800 transition-colors"
                    >
                      🗜️ ขอบกระชับ (Compact)
                    </button>
                    <button
                      type="button"
                      onClick={() => applyLayoutPreset('default')}
                      className="px-2.5 py-1 bg-white hover:bg-neutral-100 border border-neutral-300 rounded text-[11px] font-medium text-neutral-800 transition-colors"
                    >
                      📄 มาตรฐาน (Default A4)
                    </button>
                    <button
                      type="button"
                      onClick={() => applyLayoutPreset('spacious')}
                      className="px-2.5 py-1 bg-white hover:bg-neutral-100 border border-neutral-300 rounded text-[11px] font-medium text-neutral-800 transition-colors"
                    >
                      📐 ขยายระยะห่าง (Spacious)
                    </button>
                  </div>

                  {/* 4-Direction Page Margins (Padding) */}
                  <div>
                    <label className="block font-semibold text-neutral-700 mb-2">
                      ระยะขอบกระดาษ A4 (Margins / Padding: px)
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-neutral-50/50 p-3 rounded-lg border border-neutral-200">
                      <div>
                        <div className="flex justify-between items-center text-[11px] text-neutral-600 mb-1">
                          <span>บน (Top)</span>
                          <span className="font-mono font-bold text-neutral-900">{layoutSettings.paddingTop}px</span>
                        </div>
                        <input
                          type="range"
                          min="10"
                          max="70"
                          value={layoutSettings.paddingTop}
                          onChange={(e) => updateLayout({ paddingTop: Number(e.target.value) })}
                          className="w-full accent-neutral-900 cursor-pointer"
                        />
                      </div>
                      <div>
                        <div className="flex justify-between items-center text-[11px] text-neutral-600 mb-1">
                          <span>ล่าง (Bottom)</span>
                          <span className="font-mono font-bold text-neutral-900">{layoutSettings.paddingBottom}px</span>
                        </div>
                        <input
                          type="range"
                          min="10"
                          max="70"
                          value={layoutSettings.paddingBottom}
                          onChange={(e) => updateLayout({ paddingBottom: Number(e.target.value) })}
                          className="w-full accent-neutral-900 cursor-pointer"
                        />
                      </div>
                      <div>
                        <div className="flex justify-between items-center text-[11px] text-neutral-600 mb-1">
                          <span>ซ้าย (Left)</span>
                          <span className="font-mono font-bold text-neutral-900">{layoutSettings.paddingLeft}px</span>
                        </div>
                        <input
                          type="range"
                          min="15"
                          max="70"
                          value={layoutSettings.paddingLeft}
                          onChange={(e) => updateLayout({ paddingLeft: Number(e.target.value) })}
                          className="w-full accent-neutral-900 cursor-pointer"
                        />
                      </div>
                      <div>
                        <div className="flex justify-between items-center text-[11px] text-neutral-600 mb-1">
                          <span>ขวา (Right)</span>
                          <span className="font-mono font-bold text-neutral-900">{layoutSettings.paddingRight}px</span>
                        </div>
                        <input
                          type="range"
                          min="15"
                          max="70"
                          value={layoutSettings.paddingRight}
                          onChange={(e) => updateLayout({ paddingRight: Number(e.target.value) })}
                          className="w-full accent-neutral-900 cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Font Size & Section Spacing Controls */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Font Size */}
                    <div className="space-y-1.5">
                      <label className="block font-semibold text-neutral-700">
                        ขนาดตัวอักษรภาพรวม (Document Font Size)
                      </label>
                      <div className="grid grid-cols-3 gap-1.5 p-1 bg-neutral-100 rounded-lg">
                        {(['compact', 'normal', 'large'] as const).map((size) => (
                          <button
                            key={size}
                            type="button"
                            onClick={() => updateLayout({ fontSize: size })}
                            className={`py-1.5 text-center rounded-md font-medium text-xs transition-all ${
                              layoutSettings.fontSize === size
                                ? 'bg-white shadow-xs text-neutral-900 font-bold border border-neutral-200'
                                : 'text-neutral-600 hover:text-neutral-900'
                            }`}
                          >
                            {size === 'compact' && 'เล็ก (11px)'}
                            {size === 'normal' && 'ปกติ (12px)'}
                            {size === 'large' && 'ใหญ่ (13px)'}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Section Spacing */}
                    <div className="space-y-1.5">
                      <label className="block font-semibold text-neutral-700">
                        ระยะห่างระหว่างเซกชัน (Section Spacing)
                      </label>
                      <div className="grid grid-cols-3 gap-1.5 p-1 bg-neutral-100 rounded-lg">
                        {(['compact', 'normal', 'relaxed'] as const).map((spacing) => (
                          <button
                            key={spacing}
                            type="button"
                            onClick={() => updateLayout({ sectionSpacing: spacing })}
                            className={`py-1.5 text-center rounded-md font-medium text-xs transition-all ${
                              layoutSettings.sectionSpacing === spacing
                                ? 'bg-white shadow-xs text-neutral-900 font-bold border border-neutral-200'
                                : 'text-neutral-600 hover:text-neutral-900'
                            }`}
                          >
                            {spacing === 'compact' && 'กระชับ (ชิด)'}
                            {spacing === 'normal' && 'ปานกลาง'}
                            {spacing === 'relaxed' && 'โปร่งสบาย'}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Minimum Empty Reserve Rows in Table */}
                    <div className="space-y-1.5 md:col-span-2 p-2.5 bg-amber-50/70 border border-amber-200 rounded-lg">
                      <div className="flex items-center justify-between">
                        <label className="font-semibold text-neutral-800 text-xs flex items-center gap-1.5">
                          <LayoutGrid className="w-3.5 h-3.5 text-amber-700" />
                          <span>จำนวนบรรทัดว่างสำรองในตาราง (Empty Reserve Rows):</span>
                          <span className="font-mono font-bold text-amber-900 bg-amber-200/80 px-1.5 py-0.2 rounded text-[11px]">
                            {layoutSettings.minEmptyRows !== undefined ? layoutSettings.minEmptyRows : 10} บรรทัด
                          </span>
                        </label>
                        <span className="text-[10.5px] text-amber-900 font-medium">
                          ⭐ ค่ามาตรฐาน: 10 บรรทัด (แสดงสำรองสม่ำเสมอทุกครั้ง)
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap pt-1">
                        {[6, 8, 10, 12, 15].map((rows) => (
                          <button
                            key={rows}
                            type="button"
                            onClick={() => updateLayout({ minEmptyRows: rows })}
                            className={`px-2.5 py-1 text-xs rounded-md font-semibold transition-all cursor-pointer ${
                              (layoutSettings.minEmptyRows !== undefined ? layoutSettings.minEmptyRows : 10) === rows
                                ? 'bg-neutral-900 text-white shadow-2xs'
                                : 'bg-white text-neutral-700 hover:bg-neutral-100 border border-neutral-300'
                            }`}
                          >
                            {rows} บรรทัด {rows === 10 ? '(มาตรฐาน)' : ''}
                          </button>
                        ))}
                        <div className="flex items-center gap-1.5 ml-auto">
                          <span className="text-[10px] text-neutral-500">ปรับเอง:</span>
                          <input
                            type="range"
                            min="2"
                            max="20"
                            value={layoutSettings.minEmptyRows !== undefined ? layoutSettings.minEmptyRows : 10}
                            onChange={(e) => updateLayout({ minEmptyRows: Number(e.target.value) })}
                            className="w-24 accent-neutral-900 cursor-pointer"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Header Positioning, Offsets & Spacing (ขยับตำแหน่งและระยะห่างหัวกระดาษอย่างอิสระ) */}
                  <div className="bg-neutral-50/80 p-3.5 rounded-lg border border-neutral-200 space-y-3">
                    <div className="flex items-center justify-between border-b border-neutral-200/80 pb-2">
                      <div className="flex items-center gap-1.5 font-semibold text-neutral-800 text-[11.5px]">
                        <Move className="w-3.5 h-3.5 text-neutral-700" />
                        <span>ปรับตำแหน่ง & ระยะห่างหัวกระดาษอิสระ (Header Position & Spacing)</span>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          updateLayout({
                            headerOffsetY: 0,
                            headerOffsetX: 0,
                            headerPaddingTop: 0,
                            headerPaddingBottom: 0,
                            headerMarginBottom: 12,
                          })
                        }
                        className="text-[10.5px] text-neutral-500 hover:text-neutral-900 underline font-medium"
                      >
                        รีเซ็ตตำแหน่งหัวกระดาษ (Reset Offset)
                      </button>
                    </div>

                    {/* X and Y Offset Sliders */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div>
                        <div className="flex justify-between items-center text-[11px] text-neutral-700 font-medium mb-1">
                          <span>ขยับ ขึ้น - ลง (Vertical Y-Offset)</span>
                          <span className="font-mono font-bold text-neutral-900">
                            {layoutSettings.headerOffsetY || 0}px
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="range"
                            min="-40"
                            max="60"
                            value={layoutSettings.headerOffsetY || 0}
                            onChange={(e) => updateLayout({ headerOffsetY: Number(e.target.value) })}
                            className="w-full accent-neutral-900 cursor-pointer"
                          />
                          <button
                            type="button"
                            onClick={() => updateLayout({ headerOffsetY: 0 })}
                            className="text-[10px] px-1.5 py-0.5 bg-neutral-200 hover:bg-neutral-300 text-neutral-700 rounded font-mono"
                            title="ตั้งเป็น 0px"
                          >
                            0
                          </button>
                        </div>
                        <div className="flex justify-between text-[9.5px] text-neutral-400 mt-0.5">
                          <span>⬆️ เลื่อนขึ้น (-40)</span>
                          <span>เลื่อนลง (+60) ⬇️</span>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between items-center text-[11px] text-neutral-700 font-medium mb-1">
                          <span>ขยับ ซ้าย - ขวา (Horizontal X-Offset)</span>
                          <span className="font-mono font-bold text-neutral-900">
                            {layoutSettings.headerOffsetX || 0}px
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="range"
                            min="-60"
                            max="60"
                            value={layoutSettings.headerOffsetX || 0}
                            onChange={(e) => updateLayout({ headerOffsetX: Number(e.target.value) })}
                            className="w-full accent-neutral-900 cursor-pointer"
                          />
                          <button
                            type="button"
                            onClick={() => updateLayout({ headerOffsetX: 0 })}
                            className="text-[10px] px-1.5 py-0.5 bg-neutral-200 hover:bg-neutral-300 text-neutral-700 rounded font-mono"
                            title="ตั้งเป็น 0px"
                          >
                            0
                          </button>
                        </div>
                        <div className="flex justify-between text-[9.5px] text-neutral-400 mt-0.5">
                          <span>⬅️ เลื่อนซ้าย (-60)</span>
                          <span>เลื่อนขวา (+60) ➡️</span>
                        </div>
                      </div>
                    </div>

                    {/* Header Padding Top, Bottom & Margin Bottom */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 border-t border-neutral-200/60">
                      <div>
                        <div className="flex justify-between items-center text-[11px] text-neutral-700 font-medium mb-1">
                          <span>ระยะห่างด้านบน (Top Pad)</span>
                          <span className="font-mono font-bold text-neutral-900">
                            {layoutSettings.headerPaddingTop || 0}px
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="40"
                          value={layoutSettings.headerPaddingTop || 0}
                          onChange={(e) => updateLayout({ headerPaddingTop: Number(e.target.value) })}
                          className="w-full accent-neutral-900 cursor-pointer"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between items-center text-[11px] text-neutral-700 font-medium mb-1">
                          <span>ระยะห่างในหัวกระดาษ (Bottom Pad)</span>
                          <span className="font-mono font-bold text-neutral-900">
                            {layoutSettings.headerPaddingBottom || 0}px
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="40"
                          value={layoutSettings.headerPaddingBottom || 0}
                          onChange={(e) => updateLayout({ headerPaddingBottom: Number(e.target.value) })}
                          className="w-full accent-neutral-900 cursor-pointer"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between items-center text-[11px] text-neutral-700 font-medium mb-1">
                          <span>ช่องว่างใต้เส้นคั่น (Bottom Margin)</span>
                          <span className="font-mono font-bold text-neutral-900">
                            {layoutSettings.headerMarginBottom !== undefined ? layoutSettings.headerMarginBottom : 12}px
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="50"
                          value={layoutSettings.headerMarginBottom !== undefined ? layoutSettings.headerMarginBottom : 12}
                          onChange={(e) => updateLayout({ headerMarginBottom: Number(e.target.value) })}
                          className="w-full accent-neutral-900 cursor-pointer"
                        />
                      </div>
                    </div>

                    {/* Header Font & Font Sizes in Drawer */}
                    <div className="pt-2 border-t border-neutral-200/60 space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="font-semibold text-neutral-700 flex items-center gap-1 text-[11px]">
                          <Type className="w-3 h-3 text-neutral-500" />
                          <span>ฟอนต์หัวกระดาษ (Header Font)</span>
                        </label>
                        <span className="font-mono text-[10px] text-neutral-500">
                          {layoutSettings.headerFontFamily || 'Trirong'}
                        </span>
                      </div>
                      <div className="grid grid-cols-4 gap-1 p-0.5 bg-neutral-200/60 rounded-md">
                        {[
                          { id: 'Trirong', label: 'Trirong' },
                          { id: 'Sarabun', label: 'Sarabun' },
                          { id: 'Prompt', label: 'Prompt' },
                          { id: 'system-ui', label: 'System' },
                        ].map((f) => (
                          <button
                            key={f.id}
                            type="button"
                            onClick={() => updateLayout({ headerFontFamily: f.id })}
                            className={`py-1 text-center rounded text-[10.5px] transition-all ${
                              (layoutSettings.headerFontFamily || 'Trirong') === f.id
                                ? 'bg-white text-neutral-900 shadow-2xs font-bold'
                                : 'text-neutral-600 hover:text-neutral-900'
                            }`}
                          >
                            {f.label}
                          </button>
                        ))}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        <div>
                          <div className="flex justify-between items-center text-[10.5px] text-neutral-600 mb-1">
                            <span>ขนาดหัวเรื่อง (Title)</span>
                            <span className="font-mono font-bold text-neutral-900">
                              {layoutSettings.headerTitleFontSize || 16}px
                            </span>
                          </div>
                          <input
                            type="range"
                            min="12"
                            max="32"
                            value={layoutSettings.headerTitleFontSize || 16}
                            onChange={(e) => updateLayout({ headerTitleFontSize: Number(e.target.value) })}
                            className="w-full accent-neutral-900 cursor-pointer h-1.5"
                          />
                        </div>
                        <div>
                          <div className="flex justify-between items-center text-[10.5px] text-neutral-600 mb-1">
                            <span>ขนาดย่อย (Subtitle)</span>
                            <span className="font-mono font-bold text-neutral-900">
                              {layoutSettings.headerSubtitleFontSize || 11}px
                            </span>
                          </div>
                          <input
                            type="range"
                            min="9"
                            max="22"
                            value={layoutSettings.headerSubtitleFontSize || 11}
                            onChange={(e) => updateLayout({ headerSubtitleFontSize: Number(e.target.value) })}
                            className="w-full accent-neutral-900 cursor-pointer h-1.5"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Logo Height & Alignment */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-neutral-200/60">
                      <div>
                        <div className="flex justify-between items-center text-[11px] text-neutral-700 font-semibold mb-1">
                          <span>ความสูง/ขนาดโลโก้ (Logo Height)</span>
                          <span className="font-mono font-bold text-neutral-900">{layoutSettings.logoHeight || 56}px</span>
                        </div>
                        <input
                          type="range"
                          min="24"
                          max="140"
                          value={layoutSettings.logoHeight || 56}
                          onChange={(e) => updateLayout({ logoHeight: Number(e.target.value) })}
                          className="w-full accent-neutral-900 cursor-pointer"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-neutral-700 mb-1">
                          การจัดวางทิศทางหัวกระดาษ (Header Alignment)
                        </label>
                        <div className="grid grid-cols-3 gap-1 p-1 bg-neutral-200/60 rounded-md">
                          <button
                            type="button"
                            onClick={() => updateLayout({ logoAlign: 'left' })}
                            className={`py-1 text-center rounded flex items-center justify-center gap-1 font-medium transition-all ${
                              layoutSettings.logoAlign === 'left'
                                ? 'bg-white text-neutral-900 shadow-2xs font-bold'
                                : 'text-neutral-600 hover:text-neutral-900'
                            }`}
                          >
                            <AlignLeft className="w-3.5 h-3.5" /> ซ้าย
                          </button>
                          <button
                            type="button"
                            onClick={() => updateLayout({ logoAlign: 'center' })}
                            className={`py-1 text-center rounded flex items-center justify-center gap-1 font-medium transition-all ${
                              layoutSettings.logoAlign === 'center'
                                ? 'bg-white text-neutral-900 shadow-2xs font-bold'
                                : 'text-neutral-600 hover:text-neutral-900'
                            }`}
                          >
                            <AlignCenter className="w-3.5 h-3.5" /> กลาง
                          </button>
                          <button
                            type="button"
                            onClick={() => updateLayout({ logoAlign: 'right' })}
                            className={`py-1 text-center rounded flex items-center justify-center gap-1 font-medium transition-all ${
                              layoutSettings.logoAlign === 'right'
                                ? 'bg-white text-neutral-900 shadow-2xs font-bold'
                                : 'text-neutral-600 hover:text-neutral-900'
                            }`}
                          >
                            <AlignRight className="w-3.5 h-3.5" /> ขวา
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Signature Image Height in Layout Settings */}
                    <div className="pt-2 border-t border-neutral-200/60">
                      <div className="flex justify-between items-center text-[11px] text-neutral-700 font-semibold mb-1">
                        <span className="flex items-center gap-1">
                          <PenTool className="w-3 h-3 text-neutral-600" />
                          <span>ขนาด/ความสูงรูปภาพลายเซ็น (Signature Image Height)</span>
                        </span>
                        <span className="font-mono font-bold text-neutral-900">
                          {layoutSettings.signatureHeight || 32}px
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <input
                          type="range"
                          min="20"
                          max="64"
                          value={layoutSettings.signatureHeight || 32}
                          onChange={(e) => updateLayout({ signatureHeight: Number(e.target.value) })}
                          className="w-full accent-neutral-900 cursor-pointer"
                        />
                        <div className="flex items-center gap-1 shrink-0">
                          {[24, 32, 40, 48].map((size) => (
                            <button
                              key={size}
                              type="button"
                              onClick={() => updateLayout({ signatureHeight: size })}
                              className={`px-1.5 py-0.5 text-[10px] rounded border font-mono transition-colors ${
                                (layoutSettings.signatureHeight || 32) === size
                                  ? 'bg-neutral-900 text-white border-neutral-900 font-bold'
                                  : 'bg-white text-neutral-600 border-neutral-300 hover:bg-neutral-100'
                              }`}
                            >
                              {size}px
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Payment Terms Typography & Alignment in Layout Settings */}
                    <div className="pt-2 border-t border-neutral-200/60 space-y-2">
                      <div className="flex justify-between items-center text-[11px] text-neutral-700 font-semibold">
                        <span className="flex items-center gap-1">
                          <FileText className="w-3 h-3 text-neutral-600" />
                          <span>ฟอนต์เงื่อนไขการชำระเงิน (Payment Terms Font Size)</span>
                        </span>
                        <span className="font-mono font-bold text-neutral-900">
                          {layoutSettings.paymentTermsFontSize || 11}px
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <input
                          type="range"
                          min="10"
                          max="18"
                          value={layoutSettings.paymentTermsFontSize || 11}
                          onChange={(e) => updateLayout({ paymentTermsFontSize: Number(e.target.value) })}
                          className="w-full accent-neutral-900 cursor-pointer"
                        />
                        <div className="flex items-center gap-1 shrink-0">
                          {[10, 11, 12, 14, 16].map((size) => (
                            <button
                              key={size}
                              type="button"
                              onClick={() => updateLayout({ paymentTermsFontSize: size })}
                              className={`px-1.5 py-0.5 text-[10px] rounded border font-mono transition-colors ${
                                (layoutSettings.paymentTermsFontSize || 11) === size
                                  ? 'bg-neutral-900 text-white border-neutral-900 font-bold'
                                  : 'bg-white text-neutral-600 border-neutral-300 hover:bg-neutral-100'
                              }`}
                            >
                              {size}px
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
                        <div>
                          <label className="block text-neutral-600 font-medium mb-1">การจัดวางข้อความ</label>
                          <div className="grid grid-cols-3 gap-1 p-0.5 bg-neutral-200/60 rounded">
                            {(['left', 'center', 'right'] as const).map((align) => (
                              <button
                                key={align}
                                type="button"
                                onClick={() => updateLayout({ paymentTermsAlign: align })}
                                className={`py-0.5 text-center rounded flex items-center justify-center font-medium ${
                                  (layoutSettings.paymentTermsAlign || 'left') === align
                                    ? 'bg-white text-neutral-900 shadow-2xs font-bold'
                                    : 'text-neutral-600 hover:text-neutral-900'
                                }`}
                              >
                                {align === 'left' ? <AlignLeft className="w-3 h-3" /> : align === 'center' ? <AlignCenter className="w-3 h-3" /> : <AlignRight className="w-3 h-3" />}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <label className="block text-neutral-600 font-medium mb-1">ระยะห่างบรรทัด</label>
                          <div className="grid grid-cols-3 gap-1 p-0.5 bg-neutral-200/60 rounded">
                            {(['tight', 'normal', 'relaxed'] as const).map((lh) => (
                              <button
                                key={lh}
                                type="button"
                                onClick={() => updateLayout({ paymentTermsLineHeight: lh })}
                                className={`py-0.5 text-[10px] text-center rounded font-medium ${
                                  (layoutSettings.paymentTermsLineHeight || 'normal') === lh
                                    ? 'bg-white text-neutral-900 shadow-2xs font-bold'
                                    : 'text-neutral-600 hover:text-neutral-900'
                                }`}
                              >
                                {lh === 'tight' ? 'กระชับ' : lh === 'normal' ? 'ปกติ' : 'โปร่ง'}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Section Visibility Toggles */}
                  <div>
                    <label className="block font-semibold text-neutral-700 mb-2">
                      ซ่อน/แสดงบล็อกในเอกสาร (Toggle Document Blocks Visibility)
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                      <label className="flex items-center gap-2 p-2 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 cursor-pointer transition-colors">
                        <input
                          type="checkbox"
                          checked={layoutSettings.showLogo}
                          onChange={(e) => updateLayout({ showLogo: e.target.checked })}
                          className="rounded text-neutral-900 focus:ring-neutral-800 w-4 h-4"
                        />
                        <span className="font-medium text-neutral-800 text-[11.5px]">
                          🖼️ โลโก้ & ส่วนหัวแบรนด์
                        </span>
                      </label>

                      <label className="flex items-center gap-2 p-2 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 cursor-pointer transition-colors">
                        <input
                          type="checkbox"
                          checked={layoutSettings.showPaymentTerms}
                          onChange={(e) => updateLayout({ showPaymentTerms: e.target.checked })}
                          className="rounded text-neutral-900 focus:ring-neutral-800 w-4 h-4"
                        />
                        <span className="font-medium text-neutral-800 text-[11.5px]">
                          📜 เงื่อนไขการชำระเงิน
                        </span>
                      </label>

                      <label className="flex items-center gap-2 p-2 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 cursor-pointer transition-colors">
                        <input
                          type="checkbox"
                          checked={layoutSettings.showOvertimeNote}
                          onChange={(e) => updateLayout({ showOvertimeNote: e.target.checked })}
                          className="rounded text-neutral-900 focus:ring-neutral-800 w-4 h-4"
                        />
                        <span className="font-medium text-neutral-800 text-[11.5px]">
                          ⏱️ หมายเหตุ OT / เพิ่มเติม
                        </span>
                      </label>

                      <label className="flex items-center gap-2 p-2 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 cursor-pointer transition-colors">
                        <input
                          type="checkbox"
                          checked={layoutSettings.showBankInfo}
                          onChange={(e) => updateLayout({ showBankInfo: e.target.checked })}
                          className="rounded text-neutral-900 focus:ring-neutral-800 w-4 h-4"
                        />
                        <span className="font-medium text-neutral-800 text-[11.5px]">
                          🏦 บัญชีธนาคาร & QR Code
                        </span>
                      </label>

                      <label className="flex items-center gap-2 p-2 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 cursor-pointer transition-colors">
                        <input
                          type="checkbox"
                          checked={layoutSettings.showSignatures}
                          onChange={(e) => updateLayout({ showSignatures: e.target.checked })}
                          className="rounded text-neutral-900 focus:ring-neutral-800 w-4 h-4"
                        />
                        <span className="font-medium text-neutral-800 text-[11.5px]">
                          ✍️ บล็อกผู้ลงนาม 4 ช่อง
                        </span>
                      </label>

                      <label className="flex items-center gap-2 p-2 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 cursor-pointer transition-colors">
                        <input
                          type="checkbox"
                          checked={layoutSettings.showCustomerInfo !== false}
                          onChange={(e) => updateLayout({ showCustomerInfo: e.target.checked })}
                          className="rounded text-neutral-900 focus:ring-neutral-800 w-4 h-4"
                        />
                        <span className="font-medium text-neutral-800 text-[11.5px]">
                          👤 แสดงข้อมูล/ชื่อลูกค้า
                        </span>
                      </label>
                    </div>

                    {/* Payment Box Height Controller (2 cm default) */}
                    <div className="mt-3 pt-3 border-t border-neutral-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                      <span className="text-[11.5px] font-semibold text-neutral-700">ความสูงกล่องชำระเงิน (กำหนด 2 ซม. / QR พอดี):</span>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => updateLayout({ paymentBoxHeight: Math.max(50, (layoutSettings.paymentBoxHeight || 75.6) - 5) })}
                          className="px-2 py-1 text-xs bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 rounded font-mono cursor-pointer"
                        >
                          -5px
                        </button>
                        <span className="font-mono font-bold text-neutral-900 bg-neutral-50 border border-neutral-200 px-2.5 py-0.5 rounded text-xs">
                          {Math.round(layoutSettings.paymentBoxHeight || 75.6)}px (~{((layoutSettings.paymentBoxHeight || 75.6) / 37.795).toFixed(1)} ซม.)
                        </span>
                        <button
                          type="button"
                          onClick={() => updateLayout({ paymentBoxHeight: Math.min(180, (layoutSettings.paymentBoxHeight || 75.6) + 5) })}
                          className="px-2 py-1 text-xs bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 rounded font-mono cursor-pointer"
                        >
                          +5px
                        </button>
                        <div className="flex items-center gap-1 pl-1">
                          <button
                            type="button"
                            onClick={() => updateLayout({ paymentBoxHeight: 75.6, qrSize: 56, autoFitQr: true })}
                            className={`text-[10px] px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                              Math.abs((layoutSettings.paymentBoxHeight || 75.6) - 75.6) < 1
                                ? 'bg-neutral-900 text-white border-neutral-900 font-bold'
                                : 'bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-100'
                            }`}
                          >
                            2 ซม. (มาตรฐาน)
                          </button>
                          <button
                            type="button"
                            onClick={() => updateLayout({ paymentBoxHeight: 94.5, qrSize: 72, autoFitQr: true })}
                            className={`text-[10px] px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                              Math.abs((layoutSettings.paymentBoxHeight || 75.6) - 94.5) < 1
                                ? 'bg-neutral-900 text-white border-neutral-900 font-bold'
                                : 'bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-100'
                            }`}
                          >
                            2.5 ซม.
                          </button>
                          <button
                            type="button"
                            onClick={() => updateLayout({ paymentBoxHeight: 113.4, qrSize: 90, autoFitQr: true })}
                            className={`text-[10px] px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                              Math.abs((layoutSettings.paymentBoxHeight || 75.6) - 113.4) < 1
                                ? 'bg-neutral-900 text-white border-neutral-900 font-bold'
                                : 'bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-100'
                            }`}
                          >
                            3 ซม.
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Bank Font & QR Size Controls in Layout Settings */}
                    <div className="mt-2.5 pt-2.5 border-t border-neutral-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                      <span className="text-[11.5px] font-semibold text-neutral-700">ฟอนต์และขนาดตัว QR Code ในช่องชำระเงิน:</span>
                      <div className="flex flex-wrap items-center gap-2">
                        <select
                          value={layoutSettings.bankFontFamily || 'Sarabun'}
                          onChange={(e) => updateLayout({ bankFontFamily: e.target.value })}
                          className="px-2 py-1 text-xs border border-neutral-300 rounded bg-white text-neutral-800"
                        >
                          <option value="Sarabun">Sarabun (สารบรรณ)</option>
                          <option value="Trirong">Trirong (มีหัว)</option>
                          <option value="Prompt">Prompt (โมเดิร์น)</option>
                          <option value="Kanit">Kanit (คณิต)</option>
                          <option value="IBM Plex Sans Thai">IBM Plex</option>
                          <option value="Noto Sans Thai">Noto Sans</option>
                        </select>
                        <div className="flex items-center gap-1 text-xs">
                          <span className="text-neutral-500 text-[11px]">ฟอนต์:</span>
                          <button
                            type="button"
                            onClick={() => updateLayout({ bankFontSize: Math.max(8, (layoutSettings.bankFontSize || 10) - 0.5) })}
                            className="px-1.5 py-0.5 bg-neutral-100 border border-neutral-300 rounded font-mono text-[10px] cursor-pointer"
                          >
                            -
                          </button>
                          <span className="font-mono font-bold text-neutral-900 bg-neutral-50 px-1 border border-neutral-200 rounded text-[11px]">
                            {layoutSettings.bankFontSize || 10}px
                          </span>
                          <button
                            type="button"
                            onClick={() => updateLayout({ bankFontSize: Math.min(16, (layoutSettings.bankFontSize || 10) + 0.5) })}
                            className="px-1.5 py-0.5 bg-neutral-100 border border-neutral-300 rounded font-mono text-[10px] cursor-pointer"
                          >
                            +
                          </button>
                        </div>
                        <div className="flex items-center gap-1 text-xs pl-1 border-l border-neutral-200">
                          <span className="text-neutral-500 text-[11px]">QR:</span>
                          <button
                            type="button"
                            onClick={() => updateLayout({ autoFitQr: !(layoutSettings.autoFitQr !== false) })}
                            className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border cursor-pointer ${
                              layoutSettings.autoFitQr !== false
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                : 'bg-neutral-100 text-neutral-600 border-neutral-300'
                            }`}
                            title="สลับระหว่างพอดีกล่องอัตโนมัติ กับกำหนดขนาดเอง"
                          >
                            {layoutSettings.autoFitQr !== false ? '✨ พอดีช่อง' : 'กำหนดเอง'}
                          </button>
                          <button
                            type="button"
                            onClick={() => updateLayout({ qrSize: Math.max(36, (layoutSettings.qrSize || 56) - 4), autoFitQr: false })}
                            className="px-1.5 py-0.5 bg-neutral-100 border border-neutral-300 rounded font-mono text-[10px] cursor-pointer"
                          >
                            -
                          </button>
                          <span className="font-mono font-bold text-neutral-900 bg-neutral-50 px-1 border border-neutral-200 rounded text-[11px]">
                            {layoutSettings.autoFitQr !== false ? 'พอดีกล่อง' : `${layoutSettings.qrSize || 56}px`}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateLayout({ qrSize: Math.min(110, (layoutSettings.qrSize || 56) + 4), autoFitQr: false })}
                            className="px-1.5 py-0.5 bg-neutral-100 border border-neutral-300 rounded font-mono text-[10px] cursor-pointer"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 3. ข้อมูลเอกสาร (Document Info) */}
            <div className="bg-white rounded-xl border border-neutral-200 shadow-2xs overflow-hidden">
              <div
                onClick={() => toggleSection('metaInfo')}
                className="w-full px-5 py-3.5 flex flex-wrap items-center justify-between gap-2 bg-white hover:bg-neutral-50/80 transition-colors cursor-pointer border-b border-neutral-100 select-none"
              >
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-neutral-900"></span>
                  <h3 className="text-sm font-bold text-neutral-800">
                    3. ข้อมูลเอกสาร (Document Info)
                  </h3>
                  {quoteNumber && (
                    <span className="text-[10px] text-neutral-700 bg-neutral-100 border border-neutral-200 px-2 py-0.5 rounded font-mono font-semibold">
                      {quoteNumber}
                    </span>
                  )}
                  {collapsedSections.metaInfo && (
                    <span className="text-[10px] text-neutral-500 bg-neutral-100 px-1.5 py-0.5 rounded">
                      ย่ออยู่
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSection('metaInfo');
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-800 border border-neutral-200 transition-colors"
                    title={collapsedSections.metaInfo ? 'คลิกเพื่อกางออก' : 'คลิกเพื่อพับเก็บ'}
                  >
                    {collapsedSections.metaInfo ? (
                      <>
                        <ChevronsDown className="w-3.5 h-3.5 text-neutral-600" />
                        <span>กางออก</span>
                      </>
                    ) : (
                      <>
                        <ChevronsUp className="w-3.5 h-3.5 text-neutral-600" />
                        <span>พับย่อ</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Collapsed Summary Ribbon */}
              {collapsedSections.metaInfo && (
                <div
                  onClick={() => toggleSection('metaInfo')}
                  className="px-5 py-2.5 bg-neutral-50/70 hover:bg-neutral-100/80 cursor-pointer flex flex-wrap items-center justify-between gap-2 text-xs text-neutral-600 border-t border-neutral-100 transition-colors select-none"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-neutral-800">📄 {quoteNumber || 'ไม่ได้ระบุเลข'}</span>
                    <span className="text-neutral-400">•</span>
                    <span>ออกเอกสาร: {issueDate || '-'}</span>
                    <span className="text-neutral-400">•</span>
                    <span className="text-blue-700 font-medium">ผู้จัดทำ: {preparedBy || '-'}</span>
                  </div>
                  <span className="text-[11px] text-blue-600 font-semibold hover:underline flex items-center gap-1">
                    <ChevronsDown className="w-3 h-3" /> คลิกเพื่อขยายแก้ไข
                  </span>
                </div>
              )}

              {!collapsedSections.metaInfo && (
                <div className="p-5 pt-4 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-semibold text-neutral-700">
                      เลขที่ใบเสนอราคา <span className="text-rose-500">*</span>
                    </label>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleAutoGenerateNumber()}
                        className="text-[11px] text-amber-800 hover:text-amber-950 font-semibold flex items-center gap-1 bg-amber-50 hover:bg-amber-100 px-1.5 py-0.5 rounded border border-amber-200 transition-colors"
                        title="คำนวณและรันเลขที่ถัดไปอัตโนมัติ"
                      >
                        <Sparkles className="w-3 h-3 text-amber-600" />
                        รันเลขอัตโนมัติ
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsNumberSettingsOpen(true)}
                        className="text-[11px] text-neutral-500 hover:text-neutral-800 p-0.5 rounded hover:bg-neutral-100 transition-colors"
                        title="ตั้งค่ารูปแบบและเงื่อนไขการรันเลข"
                      >
                        <Settings className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="relative">
                    <input
                      type="text"
                      value={quoteNumber}
                      onChange={(e) => setQuoteNumber(e.target.value)}
                      className={`w-full px-3 py-2 border rounded-md font-mono font-bold focus:outline-none focus:ring-1 ${
                        availability.isDuplicate
                          ? 'border-rose-400 bg-rose-50 text-rose-900 focus:ring-rose-500'
                          : 'border-neutral-300 focus:ring-neutral-800'
                      }`}
                      placeholder="KX/003/09/69"
                      required
                    />
                    {quoteNumber && (
                      <div className="absolute right-2 top-2.5">
                        {availability.isDuplicate ? (
                          <AlertTriangle className="w-4 h-4 text-rose-500" title="เลขนี้ซ้ำกับเอกสารอื่น" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" title="เลขที่พร้อมใช้งาน" />
                        )}
                      </div>
                    )}
                  </div>

                  {/* Duplicate warning & Quick action */}
                  {availability.isDuplicate ? (
                    <div className="mt-1.5 text-[11px] text-rose-600 bg-rose-50 p-2 rounded border border-rose-200 flex flex-col gap-1">
                      <div className="flex items-start gap-1">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                        <span>
                          ซ้ำกับใบเสนอราคา <strong>{availability.duplicateWith?.quoteNumber}</strong> ({availability.duplicateWith?.customer.name})
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleAutoGenerateNumber()}
                        className="text-left text-xs font-bold text-rose-800 underline hover:text-rose-950 flex items-center gap-1"
                      >
                        <RefreshCw className="w-3 h-3" /> คลิกตรงนี้เพื่อรันเลขใหม่ถัดไปทันที
                      </button>
                    </div>
                  ) : (
                    <div className="mt-1 text-[10px] text-neutral-400 flex items-center justify-between">
                      <span>✓ เลขที่พร้อมใช้งาน</span>
                      <span className="font-mono text-neutral-500">Auto-running</span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">
                    วันที่ออกเอกสาร <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={issueDate}
                    onChange={(e) => handleIssueDateChange(e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-1 focus:ring-neutral-800"
                    required
                  />
                  <label className="mt-1 flex items-center gap-1.5 text-[10px] text-neutral-500 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={autoRunOnDateChange}
                      onChange={(e) => setAutoRunOnDateChange(e.target.checked)}
                      className="rounded text-neutral-900 focus:ring-neutral-900"
                    />
                    <span>อัพเดทเลขรันอัตโนมัติเมื่อเปลี่ยนเดือน/ปี</span>
                  </label>
                </div>

                {/* Column 3: ผู้จัดทำเอกสาร (Prepared By / Sales Officer) */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-semibold text-neutral-700">
                      ผู้จัดทำ (Prepared By) <span className="text-rose-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsManagePreparedByModalOpen(true)}
                      className="text-[10.5px] text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded font-semibold border border-blue-200 flex items-center gap-1 transition-colors cursor-pointer"
                      title="แก้ไขชื่อ, ลายเซ็น, ลบชื่อที่ไม่ต้องการ, หรือเพิ่มคนใหม่"
                    >
                      <Settings className="w-3 h-3 text-blue-600" />
                      <span>จัดการรายชื่อ & ลายเซ็น</span>
                    </button>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 min-w-0">
                        <select
                          value={
                            preparedByPresets.some((p) => p.name === preparedBy)
                              ? preparedBy
                              : findPreparedPreset(preparedBy, preparedByPresets)?.name || 'custom'
                          }
                          onChange={(e) => handleSelectPreparedByPreset(e.target.value)}
                          className="w-full px-2.5 py-2 bg-white border border-neutral-300 rounded-md text-xs font-semibold text-neutral-800 focus:outline-none focus:ring-1 focus:ring-neutral-800 cursor-pointer shadow-2xs"
                          title="เลือกผู้จัดทำเพื่อเปลี่ยนลายเซ็นอัตโนมัติ"
                        >
                          {preparedByPresets.map((preset) => (
                            <option key={preset.name} value={preset.name}>
                              👤 {preset.name} {preset.role ? `(${preset.role})` : ''}
                            </option>
                          ))}
                          <option value="custom">➕ พิมพ์กำหนดชื่อเอง...</option>
                        </select>
                      </div>

                      {preparedBySignatureUrl && (
                        <div
                          className="h-[38px] px-2 bg-white border border-neutral-200 rounded-md flex items-center justify-center shrink-0 shadow-2xs bg-neutral-50/50 cursor-pointer hover:border-blue-400 group relative"
                          title={`ตัวอย่างลายเซ็นหมึกน้ำเงินของ ${preparedBy} (คลิกเพื่อแก้ไข/จัดการ)`}
                          onClick={() => setIsManagePreparedByModalOpen(true)}
                        >
                          <img
                            src={preparedBySignatureUrl}
                            alt="Signature Preview"
                            className="h-7 max-w-[75px] object-contain"
                          />
                        </div>
                      )}
                    </div>

                    {(!preparedByPresets.some((p) => p.name === preparedBy) && !findPreparedPreset(preparedBy, preparedByPresets)) && (
                      <input
                        type="text"
                        value={preparedBy}
                        onChange={(e) => setPreparedBy(e.target.value)}
                        placeholder="พิมพ์ชื่อ-นามสกุล ผู้จัดทำ..."
                        className="w-full px-2.5 py-1.5 border border-neutral-300 rounded-md bg-white text-xs focus:ring-1 focus:ring-neutral-800"
                      />
                    )}
                  </div>
                  <div className="mt-1 text-[10px] text-neutral-500 flex items-center justify-between">
                    <span>เปลี่ยนคน ลายเซ็นจะสลับตามทันที</span>
                    <button
                      type="button"
                      onClick={() => setIsManagePreparedByModalOpen(true)}
                      className="text-blue-600 hover:text-blue-800 hover:underline font-medium flex items-center gap-0.5"
                    >
                      <span>แก้ไข/ลบรายชื่อ</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

            {/* 4. ข้อมูลลูกค้าและผู้ติดต่อ (Customer & Contact Info) */}
            <div className="bg-white rounded-xl border border-neutral-200 shadow-2xs overflow-hidden">
              <div
                onClick={() => toggleSection('customerInfo')}
                className="w-full px-5 py-3.5 flex flex-wrap items-center justify-between gap-2 bg-white hover:bg-neutral-50/80 transition-colors cursor-pointer border-b border-neutral-100 select-none"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-neutral-900"></span>
                  <h3 className="text-sm font-bold text-neutral-800">
                    4. ข้อมูลลูกค้าและผู้ติดต่อ (Customer & Contact Info)
                  </h3>
                  {matchedCustomer && (
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        <Check className="w-3 h-3 text-emerald-600" />
                        {matchedCustomer.customerCode}
                      </span>
                      {matchedCustomer.department && (
                        <span className="text-[11px] font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                          {matchedCustomer.department}
                        </span>
                      )}
                      {customerDiscountRate > 0 && (
                        <span className="text-[11px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-300 flex items-center gap-1">
                          <Tag className="w-3 h-3" />
                          ส่วนลด {customerDiscountRate}%
                        </span>
                      )}
                    </div>
                  )}
                  {collapsedSections.customerInfo && (
                    <span className="text-[10px] text-neutral-500 bg-neutral-100 px-1.5 py-0.5 rounded">
                      ย่ออยู่
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    onClick={handleQuickSyncFromLink}
                    disabled={isQuickSyncing}
                    className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
                    title="ซิงค์ข้อมูลลูกค้าล่าสุดจากลิงก์ Google Sheets"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 text-amber-600 ${isQuickSyncing ? 'animate-spin' : ''}`} />
                    <span>{isQuickSyncing ? 'กำลังซิงค์...' : 'ซิงค์จากลิงก์'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowSmartPaste(!showSmartPaste)}
                    className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    title="วางข้อความข้อมูลลูกค้าจากไลน์หรืออีเมลเพื่อแยกฟิลด์และกรอกอัตโนมัติ"
                  >
                    <span>📋 วางข้อความแยกฟิลด์</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsCustomerSyncOpen(true)}
                    className="px-2.5 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 border border-neutral-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    title="จัดการลิงก์ Google Sheets, อัพโหลดไฟล์ หรือดูฐานข้อมูลลูกค้า"
                  >
                    <Database className="w-3.5 h-3.5 text-neutral-600" />
                    <span>ฐานข้อมูลลูกค้า ({customers.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleSection('customerInfo')}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-800 border border-neutral-200 transition-colors"
                    title={collapsedSections.customerInfo ? 'คลิกเพื่อกางออก' : 'คลิกเพื่อพับเก็บ'}
                  >
                    {collapsedSections.customerInfo ? (
                      <>
                        <ChevronsDown className="w-3.5 h-3.5 text-neutral-600" />
                        <span>กางออก</span>
                      </>
                    ) : (
                      <>
                        <ChevronsUp className="w-3.5 h-3.5 text-neutral-600" />
                        <span>พับย่อ</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Collapsed Summary Ribbon */}
              {collapsedSections.customerInfo && (
                <div
                  onClick={() => toggleSection('customerInfo')}
                  className="px-5 py-2.5 bg-neutral-50/70 hover:bg-neutral-100/80 cursor-pointer flex flex-wrap items-center justify-between gap-2 text-xs text-neutral-600 border-t border-neutral-100 transition-colors select-none"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-neutral-800">👤 {customerName || 'ยังไม่ระบุชื่อลูกค้า'}</span>
                    {customerCode && <span className="text-neutral-500 font-mono">({customerCode})</span>}
                    <span className="text-neutral-400">•</span>
                    <span>ผู้ติดต่อ: {contactPerson || '-'}</span>
                    <span className="text-neutral-400">•</span>
                    <span>โทร: {mobile || phone || '-'}</span>
                    <span className="text-neutral-400">•</span>
                    <span className="font-bold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                      ส่วนลด {customerDiscountRate}%
                    </span>
                  </div>
                  <span className="text-[11px] text-blue-600 font-semibold hover:underline flex items-center gap-1">
                    <ChevronsDown className="w-3 h-3" /> คลิกเพื่อขยายแก้ไข
                  </span>
                </div>
              )}

              {!collapsedSections.customerInfo && (
                <div className="p-5 pt-4 space-y-4">

              {/* Sync status toast / banner */}
              {syncStatusMsg && (
                <div
                  className={`p-2.5 rounded-lg text-xs flex items-center gap-2 border ${
                    syncStatusMsg.type === 'success'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-rose-50 text-rose-800 border-rose-200'
                  }`}
                >
                  {syncStatusMsg.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                  <span className="font-medium">{syncStatusMsg.text}</span>
                </div>
              )}

              {/* Smart Paste Collapsible Box */}
              {showSmartPaste && (
                <div className="p-4 bg-blue-50/60 border border-blue-200 rounded-xl space-y-2.5 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-blue-950 text-xs flex items-center gap-1.5">
                      <span>📋 วางข้อความข้อมูลลูกค้า (Smart Auto-Parser)</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowSmartPaste(false)}
                      className="text-xs text-neutral-500 hover:text-neutral-800 font-bold"
                    >
                      ✕ ปิด
                    </button>
                  </div>
                  <p className="text-[11px] text-blue-800">
                    สามารถก๊อปปี้ข้อความจาก LINE, อีเมล หรือชีตมาวางได้เลย ระบบจะแยก <b>รหัสลูกค้า, ชื่อบริษัท, Tax ID, ที่อยู่, ผู้ติดต่อ, เบอร์โทร, อีเมล, ส่วนลด</b> และกรอกลงฟอร์มให้อัตโนมัติทันที
                  </p>
                  <textarea
                    rows={3}
                    value={smartPasteText}
                    onChange={(e) => setSmartPasteText(e.target.value)}
                    placeholder="วางข้อความข้อมูลลูกค้าที่นี่ เช่น:&#10;รหัสลูกค้า: KX001966&#10;ชื่อบริษัท: บริษัท ทรู คอร์ปอเรชั่น จำกัด (มหาชน)&#10;ผู้ติดต่อ: คุณจิราภรณ์ พัฒนศิลป์ โทร: 089-196-6196"
                    className="w-full p-2.5 bg-white border border-blue-300 rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-neutral-500">
                      รองรับทั้งรูปแบบบรรทัดเดี่ยวและข้อความหลายบรรทัด
                    </span>
                    <button
                      type="button"
                      onClick={handleApplySmartPaste}
                      className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs flex items-center gap-1 transition-colors"
                    >
                      <span>⚡ แยกฟิลด์และกรอกลงฟอร์มทันที</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Google Sheets Direct Link & Sync Bar */}
              <div className="p-3.5 bg-linear-to-r from-amber-50/70 via-amber-50/40 to-neutral-50 rounded-xl border border-amber-200/80 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-amber-500/20 text-amber-900 flex items-center justify-center font-bold text-xs">
                      🔗
                    </div>
                    <label className="font-bold text-neutral-900 text-xs flex items-center gap-1.5">
                      <span>ลิงก์ Google Sheets สำหรับซิงค์ข้อมูลลูกค้า (Real-time Sync)</span>
                    </label>
                  </div>
                  {syncConfig.lastSyncedAt && (
                    <span className="text-[10.5px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      ซิงค์ล่าสุด: {new Date(syncConfig.lastSyncedAt).toLocaleTimeString('th-TH')} ({customers.length} ราย)
                    </span>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <input
                      type="url"
                      value={sheetUrlInput}
                      onChange={(e) => setSheetUrlInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleDirectSheetSync();
                        }
                      }}
                      placeholder="วางลิงก์ Google Sheets เช่น https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5.../edit"
                      className="w-full px-3 py-2 bg-white border border-neutral-300 focus:border-amber-500 rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-amber-200 shadow-2xs"
                    />
                    {sheetUrlInput && (
                      <button
                        type="button"
                        onClick={() => setSheetUrlInput('')}
                        className="absolute right-2.5 top-2 text-neutral-400 hover:text-neutral-700 text-xs font-bold"
                        title="ล้างลิงก์"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDirectSheetSync()}
                    disabled={isQuickSyncing}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white rounded-lg text-xs font-bold shrink-0 flex items-center justify-center gap-1.5 shadow-xs transition-all disabled:opacity-50 cursor-pointer"
                    title="กดเพื่อดึงข้อมูลลูกค้าและส่วนลดคอลัมน์ J จาก Google Sheets ทันที"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isQuickSyncing ? 'animate-spin' : ''}`} />
                    <span>{isQuickSyncing ? 'กำลังซิงค์...' : '🔄 ซิงค์ข้อมูลทันที'}</span>
                  </button>
                </div>

                <div className="flex flex-wrap items-center justify-between text-[10.5px] text-neutral-500 pt-0.5">
                  <span>
                    💡 <b>คำแนะนำ:</b> ตั้งค่าสิทธิ์ใน Google Sheets เป็น <i>"ทุกคนที่มีลิงก์มีสิทธิ์ดู" (Anyone with the link can view)</i> เพื่อให้อ่านข้อมูลได้ตลอดเวลา
                  </span>
                  {sheetUrlInput && (
                    <span className="text-emerald-700 font-semibold">
                      ✓ มีการตั้งค่าลิงก์ชีตแล้ว (ระบบจะ Auto-sync อัตโนมัติ)
                    </span>
                  )}
                </div>
              </div>

              {/* Customer Code, Name & Discount (%) */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 text-xs">
                {/* Customer Code (col 5) */}
                <div className="relative sm:col-span-5">
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-neutral-700 flex items-center gap-1">
                      <Hash className="w-3 h-3 text-neutral-400" />
                      รหัสลูกค้า (Customer Code)
                    </label>
                    <span className="text-[10px] text-amber-800 font-medium bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                      พิมพ์เพื่อดึงข้อมูลอัตโนมัติ
                    </span>
                  </div>

                  <div className="flex gap-1.5">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        value={formData.customerCode || ''}
                        onChange={(e) => handleCustomerCodeChange(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            setShowCustomerDropdown(false);
                            handleManualLookup();
                          }
                        }}
                        onFocus={() => setShowCustomerDropdown(true)}
                        onBlur={() => {
                          // Allow click on dropdown items before triggering real-time lookup
                          setTimeout(() => {
                            setShowCustomerDropdown(false);
                            if (formData.customerCode.trim()) {
                              if (!matchedCustomer || normalizeCustomerCode(matchedCustomer.customerCode) !== normalizeCustomerCode(formData.customerCode.trim())) {
                                handleManualLookup(formData.customerCode.trim());
                              }
                            }
                          }, 250);
                        }}
                        className="w-full px-3 py-2 border border-neutral-300 rounded-md font-mono font-bold text-neutral-900 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                        placeholder="เช่น KX002258 หรือ KX001966"
                      />
                      {formData.customerCode && (
                        <button
                          type="button"
                          onClick={() => {
                            setFormData((prev) => ({
                              ...prev,
                              customerCode: '',
                              customerName: '',
                              taxId: '',
                              address: '',
                              contactPerson: '',
                              mobile: '',
                              phone: '',
                              email: '',
                            }));
                            setMatchedCustomer(null);
                            if (!isDiscountOverridden) {
                              setCustomerDiscountRate(0);
                              setDiscountRateInput('0');
                              setItems((prev) =>
                                prev.map((item) => {
                                  const subtotal = item.quantity * item.unitPrice;
                                  return {
                                    ...item,
                                    discountPercent: 0,
                                    amount: Math.max(0, Math.round(subtotal * 100) / 100),
                                  };
                                })
                              );
                            }
                          }}
                          className="absolute right-2 top-2.5 text-neutral-400 hover:text-neutral-700"
                          title="ล้างค่า"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleManualLookup()}
                      disabled={isQuickSyncing}
                      className="px-3 py-2 bg-neutral-900 hover:bg-neutral-800 active:scale-95 text-white rounded-md text-xs font-semibold shrink-0 flex items-center gap-1.5 transition-all shadow-xs disabled:opacity-50 cursor-pointer"
                      title="กดเพื่อดึงข้อมูลลูกค้าสดใหม่จาก Google Sheets (ไม่ติดแคช) หรือกด Enter"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isQuickSyncing ? 'animate-spin' : ''}`} />
                      <span>{isQuickSyncing ? 'กำลังดึง...' : 'ดึงข้อมูล'}</span>
                    </button>
                  </div>

                  {/* Suggestions dropdown */}
                  {showCustomerDropdown && (
                    <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-neutral-300 rounded-xl shadow-2xl z-40 max-h-72 overflow-y-auto divide-y divide-neutral-100">
                      <div className="p-2.5 bg-neutral-100 text-[11px] font-semibold text-neutral-600 flex items-center justify-between sticky top-0 z-10 border-b border-neutral-200">
                        <span className="flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-neutral-600" />
                          <span>เลือกจากฐานข้อมูลลูกค้า ({customers.length} รายการ)</span>
                        </span>
                        <button
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            setShowCustomerDropdown(false);
                          }}
                          className="text-neutral-500 hover:text-neutral-800 font-bold px-1.5 py-0.5 rounded hover:bg-neutral-200"
                        >
                          ✕ ปิด
                        </button>
                      </div>
                      {searchCustomers(formData.customerCode, customers).map((cust) => (
                        <div
                          key={cust.id || cust.customerCode}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            applyCustomer(cust, true, true);
                          }}
                          className="p-3 hover:bg-amber-50/80 cursor-pointer transition-colors text-left group"
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-mono font-bold px-2 py-0.5 bg-neutral-900 text-white rounded text-[11px]">
                              {cust.customerCode}
                            </span>
                            <span className="font-bold text-neutral-900 truncate group-hover:text-amber-900">
                              {cust.name}
                            </span>
                            {cust.discountRate !== undefined && cust.discountRate > 0 ? (
                              <span className="ml-auto text-[10.5px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-300 shrink-0">
                                คอลัมน์ J: ลด {cust.discountRate}%
                              </span>
                            ) : (
                              <span className="ml-auto text-[10px] text-neutral-500 bg-neutral-100 px-1.5 py-0.5 rounded shrink-0">
                                คอลัมน์ J: 0%
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-neutral-600 flex flex-wrap items-center gap-x-3 gap-y-1">
                            {cust.department && <span className="text-blue-700 font-medium">สังกัด: {cust.department}</span>}
                            {cust.contactPerson && <span>ผู้ติดต่อ: {cust.contactPerson}</span>}
                            {cust.mobile && <span>โทร: {cust.mobile}</span>}
                            {cust.taxId && <span className="font-mono text-[10.5px] text-neutral-500">Tax: {cust.taxId}</span>}
                          </div>
                          <div className="mt-1.5 flex justify-end">
                            <span className="text-[10px] font-semibold text-amber-700 bg-white border border-amber-300 px-2 py-0.5 rounded shadow-2xs group-hover:bg-amber-500 group-hover:text-white transition-colors">
                              👉 คลิกเพื่อนำข้อมูลลูกค้านี้มาใส่ในฟอร์ม
                            </span>
                          </div>
                        </div>
                      ))}
                      {searchCustomers(formData.customerCode, customers).length === 0 && (
                        <div className="p-4 text-center text-neutral-500 text-xs">
                          <p className="font-medium">ไม่พบรหัสลูกค้าที่ตรงกับ "{formData.customerCode}"</p>
                          <div className="mt-2 flex items-center justify-center gap-2">
                            <button
                              type="button"
                              onMouseDown={(e) => {
                                e.preventDefault();
                                setShowCustomerDropdown(false);
                                setIsCustomerSyncOpen(true);
                              }}
                              className="px-3 py-1 bg-amber-500 text-white rounded text-xs font-semibold hover:bg-amber-600 shadow-xs"
                            >
                              + นำเข้า/ซิงค์ Google Sheets
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {matchedCustomer ? (
                    <div className="mt-1.5 p-2 bg-emerald-50 border border-emerald-300 rounded-lg text-xs text-emerald-950 flex items-center justify-between shadow-xs">
                      <div className="flex items-center gap-1.5 truncate">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span className="font-semibold truncate">
                          เชื่อมต่อ: {matchedCustomer.name}
                        </span>
                      </div>
                      <span className="shrink-0 font-bold bg-emerald-200 text-emerald-900 px-1.5 py-0.5 rounded text-[10px]">
                        คอลัมน์ J: {matchedCustomer.discountRate ?? 0}%
                      </span>
                    </div>
                  ) : (
                    <div className="mt-1.5 flex flex-wrap items-center gap-1 text-[10.5px]">
                      <span className="text-neutral-500 font-medium">ลูกค้ายอดนิยม:</span>
                      {customers.slice(0, 5).map((quickCust) => (
                        <button
                          key={quickCust.customerCode || quickCust.id}
                          type="button"
                          onClick={() => applyCustomer(quickCust, true, true)}
                          className="px-1.5 py-0.5 bg-neutral-100 hover:bg-amber-100 text-neutral-800 hover:text-amber-900 border border-neutral-200 rounded font-medium transition-colors"
                          title={`คลิกเพื่อเลือก ${quickCust.name} (${quickCust.customerCode})`}
                        >
                          ⚡ {quickCust.customerCode} ({quickCust.name.replace(/^(บริษัท|บจก\.)\s*/, '').slice(0, 8)}..)
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Customer Name (col 4) */}
                <div className="sm:col-span-4">
                  <label className="block font-semibold text-neutral-700 mb-1">
                    ชื่อลูกค้า / นิติบุคคล <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.customerName || ''}
                    onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-1 focus:ring-neutral-800 font-medium text-neutral-900 bg-white"
                    placeholder="ระบุชื่อลูกค้าหรือชื่อบริษัท"
                    required
                  />
                  {matchedCustomer?.department && (
                    <p className="text-[10px] text-blue-600 mt-1 truncate">
                      สังกัด: {matchedCustomer.department}
                    </p>
                  )}
                </div>

                {/* Discount (%) Field: Auto-pull from Col J, Editable Manual Override, Real-time Recalc (col 3) */}
                <div className="sm:col-span-3">
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-neutral-800 flex items-center gap-1">
                      <Percent className="w-3.5 h-3.5 text-amber-600" />
                      ส่วนลด (%)
                    </label>
                    {isDiscountOverridden ? (
                      <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                        แก้ไขเอง
                      </span>
                    ) : matchedCustomer?.discountRate !== undefined ? (
                      <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                        ดึงจาก คอลัมน์ J ({matchedCustomer.discountRate}%)
                      </span>
                    ) : (
                      <span className="text-[10px] text-neutral-500">
                        เริ่มต้น 0%
                      </span>
                    )}
                  </div>

                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="any"
                      value={discountRateInput}
                      onChange={(e) => handleDiscountChange(e.target.value, true)}
                      onFocus={(e) => e.target.select()}
                      className="w-full pl-3 pr-8 py-2 border-2 border-amber-300 focus:border-amber-500 rounded-md font-mono font-bold text-neutral-900 bg-amber-50/30 focus:outline-none focus:ring-2 focus:ring-amber-200 text-right cursor-text"
                      placeholder="0"
                      title="คลิกเพื่อพิมพ์แก้ไขเปอร์เซ็นต์ส่วนลดได้อย่างอิสระ"
                    />
                    <span className="absolute right-3 top-2 text-neutral-400 font-bold font-mono pointer-events-none">
                      %
                    </span>
                  </div>

                  <div className="flex items-center justify-between mt-1 text-[10px]">
                    <span className="text-neutral-500">คำนวณราคาสุทธิ Real-time</span>
                    {matchedCustomer && matchedCustomer.discountRate !== undefined && matchedCustomer.discountRate !== customerDiscountRate && (
                      <button
                        type="button"
                        onClick={() => handleDiscountChange(String(matchedCustomer.discountRate || 0), false)}
                        className="text-amber-800 hover:text-amber-950 font-semibold underline"
                        title="คืนค่าเป็นค่าตามคอลัมน์ J"
                      >
                        ↺ รีเซ็ต ({matchedCustomer.discountRate}%)
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Tax ID, Contact Person, Mobile */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">
                    เลขประจำตัวผู้เสียภาษี
                  </label>
                  <input
                    type="text"
                    value={formData.taxId || ''}
                    onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-md font-mono focus:outline-none focus:ring-1 focus:ring-neutral-800 text-neutral-900 bg-white"
                    placeholder="ระบุเลขประจำตัวผู้เสียภาษี 13 หลัก"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">
                    ชื่อผู้ติดต่อ
                  </label>
                  <input
                    type="text"
                    value={formData.contactPerson || ''}
                    onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-1 focus:ring-neutral-800 text-neutral-900 bg-white"
                    placeholder="ระบุชื่อผู้ติดต่อ"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">
                    เบอร์มือถือ
                  </label>
                  <input
                    type="text"
                    value={formData.mobile || ''}
                    onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-md font-mono focus:outline-none focus:ring-1 focus:ring-neutral-800 text-neutral-900 bg-white"
                    placeholder="ระบุเบอร์มือถือ"
                  />
                </div>
              </div>

              {/* Phone, Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">
                    เบอร์โทรศัพท์สำนักงาน
                  </label>
                  <input
                    type="text"
                    value={formData.phone || ''}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-md font-mono focus:outline-none focus:ring-1 focus:ring-neutral-800 text-neutral-900 bg-white"
                    placeholder="ระบุเบอร์โทรสำนักงาน"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">
                    อีเมล (Email)
                  </label>
                  <input
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-md font-mono focus:outline-none focus:ring-1 focus:ring-neutral-800 text-neutral-900 bg-white"
                    placeholder="ระบุอีเมล"
                  />
                </div>
              </div>

              {/* Address */}
              <div className="text-xs">
                <label className="block font-semibold text-neutral-700 mb-1">
                  ที่อยู่ลูกค้า
                </label>
                <textarea
                  rows={2}
                  value={formData.address || ''}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-1 focus:ring-neutral-800 text-xs text-neutral-900 bg-white"
                  placeholder="ระบุที่อยู่ออกใบกำกับภาษี / ใบเสนอราคา"
                />
              </div>

              {/* Quick Customer Actions Bar */}
              <div className="pt-2 border-t border-neutral-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md font-medium">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    ระบบซิงค์ข้อมูลลูกค้า Real-time ทำงานอัตโนมัติ
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSaveCurrentCustomerToDb}
                    className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg font-semibold text-xs flex items-center gap-1.5 transition-colors shadow-xs"
                    title="บันทึกหรืออัพเดทข้อมูลลูกค้าที่กรอกในฟอร์มนี้ไปยังฐานข้อมูลลูกค้า"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>บันทึกข้อมูลลูกค้านี้ลงฐานข้อมูล</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 5. คำนวณค่าห้องอัตโนมัติทันที (Instant Auto-Calculator) */}
        <div className="bg-white rounded-xl border border-neutral-200 shadow-2xs overflow-hidden">
          <div
            onClick={() => toggleSection('roomCalculator')}
            className="w-full px-5 py-3.5 flex flex-wrap items-center justify-between gap-2 bg-white hover:bg-neutral-50/80 transition-colors cursor-pointer border-b border-neutral-100 select-none"
          >
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
              <h3 className="text-sm font-bold text-neutral-800">
                5. คำนวณค่าห้องอัตโนมัติทันที (Instant Auto-Calculator)
              </h3>
              <span className="text-[10px] text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded font-medium">
                ⚡ อัจฉริยะ 1-Click
              </span>
              {collapsedSections.roomCalculator && (
                <span className="text-[10px] text-neutral-500 bg-neutral-100 px-1.5 py-0.5 rounded">
                  ย่ออยู่
                </span>
              )}
            </div>

            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                onClick={() => setIsRoomCatalogModalOpen(true)}
                className="px-2.5 py-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 border border-neutral-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                title="จัดการห้องประชุม แคตตาล็อกราคา และเพิ่มห้องใหม่"
              >
                <Layers className="w-3.5 h-3.5 text-neutral-600" />
                <span>จัดการห้อง/ราคา ({roomCatalog.length})</span>
              </button>

              <button
                type="button"
                onClick={() => toggleSection('roomCalculator')}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-800 border border-neutral-200 transition-colors"
                title={collapsedSections.roomCalculator ? 'คลิกเพื่อกางออก' : 'คลิกเพื่อพับเก็บ'}
              >
                {collapsedSections.roomCalculator ? (
                  <>
                    <ChevronsDown className="w-3.5 h-3.5 text-neutral-600" />
                    <span>กางออก</span>
                  </>
                ) : (
                  <>
                    <ChevronsUp className="w-3.5 h-3.5 text-neutral-600" />
                    <span>พับย่อ</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Collapsed Summary Ribbon */}
          {collapsedSections.roomCalculator && (
            <div
              onClick={() => toggleSection('roomCalculator')}
              className="px-5 py-2.5 bg-neutral-50/70 hover:bg-neutral-100/80 cursor-pointer flex flex-wrap items-center justify-between gap-2 text-xs text-neutral-600 border-t border-neutral-100 transition-colors select-none"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold text-neutral-800">⚡ คำนวณค่าห้อง:</span>
                <span>{eventDate ? `📅 ${eventDate}` : 'ยังไม่ระบุวันจัดงาน'}</span>
                <span className="text-neutral-400">•</span>
                <span>ส่วนลดปัจจุบัน {customerDiscountRate}%</span>
                <span className="text-neutral-400">•</span>
                <span>แคตตาล็อก {roomCatalog.length} ห้อง</span>
              </div>
              <span className="text-[11px] text-blue-600 font-semibold hover:underline flex items-center gap-1">
                <ChevronsDown className="w-3 h-3" /> คลิกเพื่อขยายคำนวณ
              </span>
            </div>
          )}

          {!collapsedSections.roomCalculator && (
            <div className="p-5 pt-4">
              <DynamicRoomCalculator
                eventDate={eventDate}
                onEventDateChange={(newDate) => {
                  setEventDate(newDate);
                  calculateTermsDates(newDate, paymentTermType);
                }}
                customerDiscountRate={customerDiscountRate}
                onInstantUpdateRoomItem={handleInstantUpdateRoomItem}
                onAddRoomItem={handleAddRoomItem}
                onAddMultipleRoomItems={handleAddMultipleRoomItems}
                onOpenCatalogAdmin={() => setIsRoomCatalogModalOpen(true)}
                defaultEventTime={eventTime}
                onUpdateTimeRange={(timeStr) => setEventTime(timeStr)}
              />
            </div>
          )}
        </div>

        {/* 6. ตารางรายการใบเสนอราคา (Quotation Items Table) */}
        <div className="bg-white rounded-xl border border-neutral-200 shadow-2xs overflow-hidden">
          <div
            onClick={() => toggleSection('itemsTable')}
            className="w-full px-5 py-3.5 flex flex-wrap items-center justify-between gap-2 bg-white hover:bg-neutral-50/80 transition-colors cursor-pointer border-b border-neutral-100 select-none"
          >
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-neutral-900"></span>
              <h3 className="text-sm font-bold text-neutral-800">
                6. ตารางรายการใบเสนอราคา (Items Table)
              </h3>
              <span className="text-[10px] text-neutral-700 bg-neutral-100 border border-neutral-200 px-2 py-0.5 rounded font-mono font-semibold">
                {items.length} รายการ
              </span>
              <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                ฿{formatCurrency(totalAmount)}
              </span>
              {collapsedSections.itemsTable && (
                <span className="text-[10px] text-neutral-500 bg-neutral-100 px-1.5 py-0.5 rounded">
                  ย่ออยู่
                </span>
              )}
            </div>

            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                onClick={addItem}
                className="px-3 py-1 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" />
                เพิ่มแถวรายการ
              </button>

              <button
                type="button"
                onClick={() => toggleSection('itemsTable')}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-800 border border-neutral-200 transition-colors"
                title={collapsedSections.itemsTable ? 'คลิกเพื่อกางออก' : 'คลิกเพื่อพับเก็บ'}
              >
                {collapsedSections.itemsTable ? (
                  <>
                    <ChevronsDown className="w-3.5 h-3.5 text-neutral-600" />
                    <span>กางออก</span>
                  </>
                ) : (
                  <>
                    <ChevronsUp className="w-3.5 h-3.5 text-neutral-600" />
                    <span>พับย่อ</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Collapsed Summary Ribbon */}
          {collapsedSections.itemsTable && (
            <div
              onClick={() => toggleSection('itemsTable')}
              className="px-5 py-2.5 bg-neutral-50/70 hover:bg-neutral-100/80 cursor-pointer flex flex-wrap items-center justify-between gap-2 text-xs text-neutral-600 border-t border-neutral-100 transition-colors select-none"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold text-neutral-800">📦 {items.length} รายการ:</span>
                <span className="truncate max-w-xs">{items.map(i => i.description).slice(0, 2).join(', ')}{items.length > 2 ? '...' : ''}</span>
                <span className="text-neutral-400">•</span>
                <span>ส่วนลด {customerDiscountRate}%</span>
                <span className="text-neutral-400">•</span>
                <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                  ราคาสุทธิ ฿{formatCurrency(totalAmount)}
                </span>
              </div>
              <span className="text-[11px] text-blue-600 font-semibold hover:underline flex items-center gap-1">
                <ChevronsDown className="w-3 h-3" /> คลิกเพื่อขยายจัดการรายการ
              </span>
            </div>
          )}

          {!collapsedSections.itemsTable && (
            <div className="p-5 pt-4 space-y-4">

              {/* Interactive Real-time Discount Control Bar */}
              <div className="p-3.5 bg-gradient-to-r from-amber-50/90 via-orange-50/50 to-amber-50/80 border border-amber-300 rounded-xl space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-amber-500 text-white flex items-center justify-center font-bold text-xs">
                      %
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 font-bold text-xs text-neutral-800">
                        <span>ระบบควบคุมส่วนลดใบเสนอราคา (Discount Rate %)</span>
                        {isDiscountOverridden ? (
                          <span className="text-[10px] font-semibold text-amber-800 bg-amber-100 px-2 py-0.2 rounded-full border border-amber-300">
                            ✎ แก้ไขเอง (Manual Override)
                          </span>
                        ) : matchedCustomer?.discountRate !== undefined ? (
                          <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.2 rounded-full border border-emerald-300">
                            ✓ ดึงจาก คอลัมน์ J ({matchedCustomer.discountRate}%)
                          </span>
                        ) : null}
                      </div>
                      <p className="text-[11px] text-neutral-600">
                        ดึงค่าเริ่มต้นอัตโนมัติจากฐานข้อมูลลูกค้า (คอลัมน์ J) และสามารถพิมพ์แก้ไขตัวเลขเพื่อคำนวณราคาสุทธิแบบ Real-time ได้ทันที
                      </p>
                    </div>
                  </div>

                  {/* Manual Editable Discount Input */}
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-semibold text-neutral-700">ระบุส่วนลด:</span>
                    <div className="relative w-24">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="any"
                        value={discountRateInput}
                        onChange={(e) => handleDiscountChange(e.target.value, true)}
                        className="w-full pl-2.5 pr-6 py-1.5 bg-white border-2 border-amber-400 focus:border-amber-600 rounded-lg text-right font-mono font-bold text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-amber-200"
                        placeholder="0"
                      />
                      <span className="absolute right-2 top-2 text-neutral-400 font-bold text-xs pointer-events-none">
                        %
                      </span>
                    </div>
                  </div>
                </div>

                {/* Preset quick buttons */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-amber-200/60 text-xs">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px] text-neutral-500 font-medium">ปุ่มลัดส่วนลด:</span>
                    {[0, 5, 10, 15, 20, 25, 30].map((rate) => (
                      <button
                        type="button"
                        key={rate}
                        onClick={() => handleDiscountChange(String(rate), true)}
                        className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-all ${
                          customerDiscountRate === rate
                            ? 'bg-neutral-900 text-white shadow-xs'
                            : 'bg-white border border-amber-200 text-neutral-700 hover:bg-amber-100/70'
                        }`}
                      >
                        {rate === 0 ? 'ไม่มี (0%)' : `${rate}%`}
                      </button>
                    ))}
                    {matchedCustomer?.discountRate !== undefined && customerDiscountRate !== matchedCustomer.discountRate && (
                      <button
                        type="button"
                        onClick={() => handleDiscountChange(String(matchedCustomer.discountRate || 0), false)}
                        className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-600 hover:bg-amber-700 text-white transition-all ml-1 shadow-xs"
                      >
                        ↺ รีเซ็ตตามคอลัมน์ J ({matchedCustomer.discountRate}%)
                      </button>
                    )}
                  </div>

                  <span className="text-[11px] text-amber-900 font-medium">
                    {customerDiscountRate > 0
                      ? `กำลังใช้ส่วนลด ${customerDiscountRate}% กับรายการทั้งหมด`
                      : 'ยังไม่มีการคิดส่วนลด (0%)'}
                  </span>
                </div>
              </div>

              {/* Quick Presets: Food & Beverage Catering + Room Catalog */}
              <div className="space-y-2.5">
                {/* 1. Food & Catering Services Builder Section */}
                <div className="p-3.5 bg-gradient-to-r from-amber-50/90 via-orange-50/60 to-amber-50/90 border-2 border-amber-300/90 rounded-2xl space-y-3 shadow-xs">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-base">🍱</span>
                      <div>
                        <span className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                          <span>ข้อมูลอาหารและเครื่องดื่ม (F&B / Catering):</span>
                        </span>
                        <p className="text-[10px] text-amber-800">ค่าอาหารว่าง (เบรค / Snack Box) และอาหารกลาง (กล่อง / บุฟเฟ่ต์ / ค็อกเทล)</p>
                      </div>
                    </div>
                    
                    <button
                      type="button"
                      onClick={() => setIsFoodCateringModalOpen(true)}
                      className="px-3 py-1.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm shadow-amber-600/20 active:scale-95 transition-all cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-200" />
                      <span>+ จัดการและเลือกเมนูอาหารละเอียด...</span>
                    </button>
                  </div>

                  {/* 1.1 Quick Selection for Coffee Break */}
                  <div className="space-y-1.5">
                    <div className="text-[11px] font-bold text-neutral-700 flex items-center gap-1">
                      <Coffee className="w-3.5 h-3.5 text-amber-700" />
                      <span>1. ค่าอาหารว่าง (Coffee Break & Snack Box):</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        { label: 'เบรคเช้า 1 เบรค', desc: 'ค่าอาหารว่าง (Coffee Break) 1 เบรค (เช้า)', price: 85, unit: 'ท่าน' },
                        { label: 'เบรคบ่าย 1 เบรค', desc: 'ค่าอาหารว่าง (Coffee Break) 1 เบรค (บ่าย)', price: 85, unit: 'ท่าน' },
                        { label: 'เบรค เช้า+บ่าย 2 เบรค', desc: 'ค่าอาหารว่าง (Coffee Break) 2 เบรค (เช้า + บ่าย)', price: 160, unit: 'ท่าน' },
                        { label: 'Snack Box (เช้า 1 เบรค)', desc: 'ค่าอาหารว่าง (Snack Box) 1 เบรค (เช้า)', price: 75, unit: 'กล่อง' },
                        { label: 'Snack Box (บ่าย 1 เบรค)', desc: 'ค่าอาหารว่าง (Snack Box) 1 เบรค (บ่าย)', price: 75, unit: 'กล่อง' },
                        { label: 'Snack Box (เช้า+บ่าย 2 เบรค)', desc: 'ค่าอาหารว่าง (Snack Box) 2 เบรค (เช้า + บ่าย)', price: 140, unit: 'กล่อง' },
                      ].map((item) => (
                        <button
                          type="button"
                          key={item.label}
                          onClick={() => {
                            const disc = 0;
                            const defaultQty = Number(formData.pax) || 30;
                            const subtotal = defaultQty * item.price;
                            const newItem: QuotationItem = {
                              id: `food-snack-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                              description: item.desc,
                              quantity: defaultQty,
                              unit: item.unit,
                              unitPrice: item.price,
                              discountPercent: disc,
                              amount: Math.round(subtotal * 100) / 100,
                              usageDate: formData.eventDate || '',
                              eventDate: formData.eventDate || '',
                              usageTime: '',
                              eventTime: '',
                            };
                            setItems((prev) => [...prev, newItem]);
                            setSyncStatusMsg({
                              type: 'success',
                              text: `เพิ่มรายการ "${item.desc}" (${defaultQty} ${item.unit}) เรียบร้อยแล้ว`,
                            });
                            setTimeout(() => setSyncStatusMsg(null), 3000);
                          }}
                          className="px-2.5 py-1 bg-white hover:bg-amber-100/80 border border-amber-300 text-amber-950 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shadow-2xs hover:shadow-xs active:scale-95 group"
                          title={`คลิกเพื่อเพิ่ม ${item.desc} (฿${item.price}/${item.unit})`}
                        >
                          <span className="text-amber-800 font-bold group-hover:text-amber-950">+ {item.label}</span>
                          <span className="font-mono text-[11px] bg-amber-100 text-amber-900 px-1.5 py-0.2 rounded font-bold">
                            ฿{item.price}/{item.unit}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 1.2 Quick Selection for Main Meals */}
                  <div className="space-y-1.5 pt-1.5 border-t border-amber-200/60">
                    <div className="text-[11px] font-bold text-neutral-700 flex items-center gap-1">
                      <Utensils className="w-3.5 h-3.5 text-orange-700" />
                      <span>2. อาหารกลาง / อาหารมื้อหลัก (Meal Box / Buffet / Cocktail):</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        { label: 'อาหารกล่อง มื้อกลางวัน', desc: 'ค่าอาหารกล่อง (Meal Box) มื้อกลางวัน', price: 120, unit: 'กล่อง' },
                        { label: 'อาหารกล่อง มื้อเช้า', desc: 'ค่าอาหารกล่อง (Meal Box) มื้อเช้า', price: 100, unit: 'กล่อง' },
                        { label: 'บุฟเฟ่ต์ มื้อกลางวัน', desc: 'ค่าอาหารจัดเลี้ยง (บุฟเฟ่ต์ / Buffet) มื้อกลางวัน', price: 280, unit: 'ท่าน' },
                        { label: 'บุฟเฟ่ต์ มื้อเย็น', desc: 'ค่าอาหารจัดเลี้ยง (บุฟเฟ่ต์ / Buffet) มื้อเย็น', price: 320, unit: 'ท่าน' },
                        { label: 'ค็อกเทล มื้อเย็น', desc: 'ค่าอาหารจัดเลี้ยง (ค็อกเทล / Cocktail) มื้อเย็น', price: 350, unit: 'ท่าน' },
                      ].map((item) => (
                        <button
                          type="button"
                          key={item.label}
                          onClick={() => {
                            const disc = 0;
                            const defaultQty = Number(formData.pax) || 30;
                            const subtotal = defaultQty * item.price;
                            const newItem: QuotationItem = {
                              id: `food-meal-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                              description: item.desc,
                              quantity: defaultQty,
                              unit: item.unit,
                              unitPrice: item.price,
                              discountPercent: disc,
                              amount: Math.round(subtotal * 100) / 100,
                              usageDate: formData.eventDate || '',
                              eventDate: formData.eventDate || '',
                              usageTime: '',
                              eventTime: '',
                            };
                            setItems((prev) => [...prev, newItem]);
                            setSyncStatusMsg({
                              type: 'success',
                              text: `เพิ่มรายการ "${item.desc}" (${defaultQty} ${item.unit}) เรียบร้อยแล้ว`,
                            });
                            setTimeout(() => setSyncStatusMsg(null), 3000);
                          }}
                          className="px-2.5 py-1 bg-white hover:bg-orange-100/80 border border-orange-300 text-orange-950 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shadow-2xs hover:shadow-xs active:scale-95 group"
                          title={`คลิกเพื่อเพิ่ม ${item.desc} (฿${item.price}/${item.unit})`}
                        >
                          <span className="text-orange-800 font-bold group-hover:text-orange-950">+ {item.label}</span>
                          <span className="font-mono text-[11px] bg-orange-100 text-orange-900 px-1.5 py-0.2 rounded font-bold">
                            ฿{item.price}/{item.unit}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 2. Food & Beverage Bring-in Fees Section */}
                <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-amber-900 flex items-center gap-1.5">
                      <span>🏷️</span>
                      <span>ค่านำเข้าอาหารและเครื่องดื่ม (Food & Beverage Corkage Fees):</span>
                    </span>
                    <span className="text-[10px] text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded-full font-medium border border-amber-200">
                      ⚡ คลิกเพื่อเพิ่มในตารางทันที
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {[
                      {
                        name: 'นำเข้าอาหารและเครื่องดื่ม (แบบกล่อง) 25 - 29 ท่าน',
                        shortLabel: 'กล่อง 25-29 ท่าน',
                        price: 500,
                        unit: 'วัน',
                      },
                      {
                        name: 'นำเข้าอาหารและเครื่องดื่ม (แบบกล่อง) 30 - 100 ท่าน',
                        shortLabel: 'กล่อง 30-100 ท่าน',
                        price: 1000,
                        unit: 'วัน',
                      },
                      {
                        name: 'นำเข้าอาหารและเครื่องดื่ม (แบบกล่อง) 100 ท่านขึ้นไป',
                        shortLabel: 'กล่อง 100 ท่านขึ้นไป',
                        price: 1500,
                        unit: 'วัน',
                      },
                      {
                        name: 'นำเข้าอาหารและเครื่องดื่ม (บุฟเฟ่ต์) 2,000 บาท/วัน',
                        shortLabel: 'บุฟเฟ่ต์ (2,000 บ./วัน)',
                        price: 2000,
                        unit: 'วัน',
                      },
                      {
                        name: 'นำเข้าอาหารและเครื่องดื่ม (บุฟเฟ่ต์) 3,000 บาท/วัน',
                        shortLabel: 'บุฟเฟ่ต์ (3,000 บ./วัน)',
                        price: 3000,
                        unit: 'วัน',
                      },
                    ].map((corkage) => (
                      <button
                        type="button"
                        key={corkage.name}
                        onClick={() => {
                          const disc = 0;
                          const subtotal = corkage.price;
                          const newItem: QuotationItem = {
                            id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                            description: corkage.name,
                            quantity: 1,
                            unit: corkage.unit,
                            unitPrice: corkage.price,
                            discountPercent: disc,
                            amount: subtotal,
                          };
                          setItems((prev) => [...prev, newItem]);
                          setSyncStatusMsg({
                            type: 'success',
                            text: `เพิ่มรายการ "${corkage.name}" ในราคา ฿${formatCurrency(corkage.price)} เรียบร้อยแล้ว`,
                          });
                          setTimeout(() => setSyncStatusMsg(null), 3000);
                        }}
                        className="px-2.5 py-1.5 bg-white hover:bg-amber-100/70 border border-amber-300 text-amber-950 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shadow-2xs hover:shadow-xs active:scale-95 group"
                        title={`${corkage.name} (฿${formatCurrency(corkage.price)} / ${corkage.unit})`}
                      >
                        <span className="text-amber-700 font-bold group-hover:text-amber-900">+ {corkage.shortLabel}</span>
                        <span className="font-mono text-[11px] bg-amber-100 text-amber-900 px-1.5 py-0.2 rounded font-bold">
                          ฿{formatCurrency(corkage.price)}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Room & Service Catalog Quick Presets */}
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-[11px] font-semibold text-neutral-600 uppercase tracking-wider flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      เลือกด่วนจากแคตตาล็อกห้องและบริการอาคาร KX:
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsRoomCatalogModalOpen(true)}
                      className="text-[11px] text-neutral-500 hover:text-neutral-900 underline"
                    >
                      + เพิ่ม/แก้ไขห้อง ({roomCatalog.length})
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {roomCatalog.map((room) => (
                      <button
                        type="button"
                        key={room.id}
                        onClick={() => addPresetItem(room)}
                        className="px-2.5 py-1 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 rounded-md text-[11px] text-neutral-700 transition-colors flex items-center gap-1 group"
                        title={`${room.name} (${room.unitPrice} บาท/${room.unit})`}
                      >
                        <span>+ {room.name}</span>
                        <span className="font-mono text-neutral-400 group-hover:text-neutral-600">
                          ({formatCurrency(room.unitPrice)} บ.)
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. Customer Frequent Memory & History */}
                {customerPricingPref && customerPricingPref.frequentItems && customerPricingPref.frequentItems.length > 0 && (
                  <div className="p-3 bg-gradient-to-r from-emerald-50 via-teal-50/50 to-emerald-50 border border-emerald-300 rounded-xl space-y-2">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-emerald-600" />
                        <span>ประวัติรายการและราคาที่ "{customerName || formData.customerName}" เคยใช้บ่อย (ระบบจดจำอัตโนมัติ):</span>
                      </span>
                      <span className="text-[10.5px] bg-emerald-100 text-emerald-900 border border-emerald-300 px-2 py-0.5 rounded-full font-semibold">
                        ความจำ {customerPricingPref.frequentItems.length} รายการ
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {customerPricingPref.frequentItems.map((fi) => (
                        <button
                          type="button"
                          key={fi.id}
                          onClick={() => {
                            const disc = fi.discountPercent !== undefined ? fi.discountPercent : (customerDiscountRate || 0);
                            const subtotal = fi.unitPrice;
                            const discAmt = (subtotal * disc) / 100;
                            const newItem: QuotationItem = {
                              id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                              description: fi.description,
                              quantity: 1,
                              unit: fi.unit || 'รายการ',
                              unitPrice: fi.unitPrice,
                              discountPercent: disc,
                              amount: Math.max(0, Math.round((subtotal - discAmt) * 100) / 100),
                              usageDate: formData.eventDate || '',
                              eventDate: formData.eventDate || '',
                            };
                            setItems((prev) => [...prev, newItem]);
                            setSyncStatusMsg({
                              type: 'success',
                              text: `ดึงรายการ "${fi.description}" จากความจำ (฿${formatCurrency(fi.unitPrice)}) เรียบร้อยแล้ว`,
                            });
                            setTimeout(() => setSyncStatusMsg(null), 3000);
                          }}
                          className="px-2.5 py-1 bg-white hover:bg-emerald-100/90 border border-emerald-300 text-emerald-950 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shadow-2xs hover:shadow-xs active:scale-95 group cursor-pointer"
                          title={`คลิกเพื่อใส่ ${fi.description} ในราคา ฿${formatCurrency(fi.unitPrice)}`}
                        >
                          <span className="text-emerald-800 font-bold group-hover:text-emerald-950">+ {fi.description}</span>
                          <span className="font-mono text-[11px] bg-emerald-100 text-emerald-900 px-1.5 py-0.2 rounded font-bold">
                            ฿{formatCurrency(fi.unitPrice)}/{fi.unit || 'รายการ'}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Datalist for Autocompleting Remembered Descriptions */}
              <datalist id="kx-pricing-memory-list">
                {rememberedGlobalItems.map((mem) => (
                  <option key={mem.id} value={mem.description}>
                    ฿{formatCurrency(mem.unitPrice)}/{mem.unit}
                  </option>
                ))}
              </datalist>

              {/* Line Items Header with Consolidate Button */}
              <div className="flex items-center justify-between gap-2 pt-1">
                <span className="text-xs font-bold text-neutral-800">
                  รายการในเอกสาร ({items.length} รายการ):
                </span>
                {items.length > 1 && (
                  <button
                    type="button"
                    onClick={handleConsolidateMultiDayItems}
                    className="px-2.5 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 rounded-md text-[11px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                    title="รวมรายการห้องเดียวกันที่ใช้งานหลายวันให้อยู่ในแถวเดียวกัน (เช่น 1-3 ตุลาคม)"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-700" />
                    <span>⚡ รวมห้องเดียวกันหลายวัน (เช่น 1-3 ต.ค.)</span>
                  </button>
                )}
              </div>

              {/* Line Items Rows */}
              <div className="space-y-3">
                {items.map((item, index) => {
                  const matchedRoom = findMatchingRoom(item, roomCatalog);
                  const isRoomItem = Boolean(
                    matchedRoom ||
                    item.roomId ||
                    item.description?.includes('ค่าเช่าห้อง') ||
                    item.description?.includes('ค่าห้อง')
                  );
                  const currentRateType = detectRateType(item);
                  const itemDayInfo = getDayType(item.usageDate || item.eventDate || formData.eventDate);
                  const availableFloors = getAvailableFloors(roomCatalog);

                  return (
                    <div
                      key={item.id}
                      className="p-3 bg-neutral-50/70 border border-neutral-200 rounded-lg space-y-2 text-xs relative group"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-neutral-500 w-6">#{index + 1}</span>
                        <input
                          type="text"
                          list="kx-pricing-memory-list"
                          value={item.description}
                          onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                          className="flex-1 px-2.5 py-1.5 border border-neutral-300 rounded bg-white font-medium focus:outline-none focus:ring-1 focus:ring-neutral-800"
                          placeholder="รายละเอียดรายการ เช่น ค่าห้อง X11.2 ชั้น 11"
                          required
                        />
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => duplicateItem(item)}
                            className="px-2 py-1 bg-white hover:bg-neutral-100 text-neutral-700 border border-neutral-300 rounded text-[11px] font-semibold flex items-center gap-1 transition-colors shadow-2xs cursor-pointer"
                            title="คัดลอกรายการนี้เป็นแถวใหม่ (สะดวกเมื่อมีงานหลายวันหรือหลายห้อง)"
                          >
                            <Copy className="w-3.5 h-3.5 text-neutral-500" />
                            <span className="hidden sm:inline">คัดลอก</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => removeItem(item.id)}
                            className="text-neutral-400 hover:text-rose-600 p-1 transition-colors cursor-pointer"
                            title="ลบรายการนี้"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* ช่องใส่เมนูคำนวณอัตโนมัติ (ครึ่งวัน / เต็มวัน) - แสดงเฉพาะรายการค่าห้องสัมมนา */}
                      {isRoomItem && (
                        <div className="flex flex-wrap items-center justify-between gap-2 bg-gradient-to-r from-amber-50/90 via-orange-50/50 to-amber-50/70 border border-amber-300 rounded-lg p-2 text-xs">
                          {/* 1. เลือกห้องในระบบ */}
                          <div className="flex items-center gap-1.5 flex-1 min-w-[210px]">
                            <Building2 className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                            <span className="text-[11px] font-bold text-neutral-800 shrink-0">ห้องสัมมนา:</span>
                            <select
                              value={matchedRoom?.id || item.roomId || ''}
                              onChange={(e) => handleSelectRoomForItem(item.id, e.target.value)}
                              className="flex-1 bg-white border border-neutral-300 rounded px-2 py-1 text-xs font-medium text-neutral-900 focus:ring-1 focus:ring-amber-500 focus:outline-none cursor-pointer"
                            >
                              <option value="">-- เลือกห้องเพื่อดึงราคาและคำนวณอัตโนมัติ --</option>
                              {availableFloors.map((fl) => (
                                <optgroup key={fl} label={`ชั้น ${fl}`}>
                                  {roomCatalog.filter((r) => r.category === 'room' && r.floor === fl).map((r) => (
                                    <option key={r.id} value={r.id}>
                                      {r.name} ({fl}) • ครึ่งวัน ฿{formatCurrency(r.halfDayPrice || 0)} / เต็มวัน ฿{formatCurrency(r.fullDayPrice || r.unitPrice)}
                                    </option>
                                  ))}
                                </optgroup>
                              ))}
                            </select>
                          </div>

                          {/* 2. เมนูคำนวณเรท ครึ่งวัน หรือ เต็มวัน */}
                          <div className="flex items-center gap-2 shrink-0 flex-wrap">
                            <div className="flex items-center gap-1.5">
                              <Zap className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                              <span className="text-[11px] font-bold text-neutral-800 shrink-0">เรทคำนวณ:</span>
                              <select
                                value={currentRateType}
                                onChange={(e) => handleRateTypeChange(item.id, e.target.value as any)}
                                className="bg-white border-2 border-amber-500 font-bold rounded-md px-2 py-1 text-xs text-neutral-900 focus:ring-2 focus:ring-amber-500 cursor-pointer shadow-2xs hover:border-amber-600"
                              >
                                <option value="half_day">🕒 ครึ่งวัน (เช้า 08:00 - 12:00)</option>
                                <option value="half_day_afternoon">🕒 ครึ่งวัน (บ่าย 13:00 - 17:00)</option>
                                <option value="full_day">☀️ เต็มวัน (08:00 - 17:00)</option>
                                <option value="custom">✏️ กำหนดเอง (Custom)</option>
                              </select>
                            </div>

                            {/* Day Type Badge */}
                            <span
                              className={`text-[9.5px] font-bold px-1.5 py-0.5 rounded border shrink-0 flex items-center gap-1 ${
                                itemDayInfo.isWeekend
                                  ? 'bg-orange-100 text-orange-900 border-orange-300'
                                  : 'bg-emerald-100 text-emerald-900 border-emerald-300'
                              }`}
                              title={itemDayInfo.isWeekend ? 'คำนวณตามเรทวันเสาร์-อาทิตย์' : 'คำนวณตามเรทวันธรรมดา'}
                            >
                              <span>{itemDayInfo.isWeekend ? '🌴' : '🏢'}</span>
                              <span>{itemDayInfo.isWeekend ? 'เสาร์-อาทิตย์' : 'วันธรรมดา'}</span>
                            </span>
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                      <div>
                        <label className="block text-[10px] text-neutral-500 font-semibold mb-0.5">
                          จำนวน
                        </label>
                        <input
                          type="number"
                          min="1"
                          step="1"
                          value={item.quantity}
                          onChange={(e) => updateItem(item.id, 'quantity', e.target.value)}
                          className="w-full px-2 py-1 border border-neutral-300 rounded bg-white text-center font-mono focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] text-neutral-500 font-semibold mb-0.5">
                          หน่วย
                        </label>
                        <input
                          type="text"
                          value={item.unit}
                          onChange={(e) => updateItem(item.id, 'unit', e.target.value)}
                          className="w-full px-2 py-1 border border-neutral-300 rounded bg-white text-center focus:outline-none"
                          placeholder="ห้อง, เครื่อง/วัน"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] text-neutral-500 font-semibold mb-0.5">
                          ราคา/หน่วย (บาท)
                        </label>
                        <input
                          type="number"
                          step="1"
                          value={item.unitPrice}
                          onChange={(e) => updateItem(item.id, 'unitPrice', e.target.value)}
                          className="w-full px-2 py-1 border border-neutral-300 rounded bg-white text-right font-mono focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] text-neutral-500 font-semibold mb-0.5">
                          ส่วนลด (%)
                        </label>
                        {isNoDiscountItem(item.description) ? (
                          <div className="w-full px-2 py-1 border border-neutral-200 rounded bg-neutral-100 text-center font-mono text-neutral-400 text-xs font-semibold select-none" title="รายการนี้ไม่มีส่วนลด">
                            - (ไม่มี)
                          </div>
                        ) : (
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="any"
                            value={item.discountPercent ?? 0}
                            onChange={(e) => updateItem(item.id, 'discountPercent', e.target.value)}
                            className="w-full px-2 py-1 border border-neutral-300 rounded bg-white text-center font-mono focus:outline-none focus:ring-1 focus:ring-amber-500 text-amber-900 font-semibold"
                          />
                        )}
                      </div>
                    </div>

                    {/* Usage Date & Time per line item & Amount */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-neutral-200/60 text-[11px]">
                      <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[300px]">
                        {/* 1. วันที่ใช้งาน */}
                        <div className="flex items-center gap-1">
                          <label className="font-semibold text-neutral-600 flex items-center gap-1 shrink-0">
                            <Calendar className="w-3 h-3 text-amber-600" />
                            <span>วันที่ใช้งาน:</span>
                          </label>
                          <input
                            type="text"
                            value={item.usageDate || item.eventDate || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              updateItem(item.id, 'usageDate', val);
                              updateItem(item.id, 'eventDate', val);
                            }}
                            placeholder="เช่น 2026-10-15 หรือ 15-16 ต.ค. 2569"
                            className="w-32 sm:w-36 px-2 py-0.5 border border-neutral-300 rounded bg-white text-xs font-medium text-neutral-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                          />
                          <div className="relative shrink-0">
                            <input
                              type="date"
                              value={/^\d{4}-\d{2}-\d{2}$/.test(item.usageDate || item.eventDate || '') ? (item.usageDate || item.eventDate) : ''}
                              onChange={(e) => {
                                const val = e.target.value;
                                if (val) {
                                  updateItem(item.id, 'usageDate', val);
                                  updateItem(item.id, 'eventDate', val);
                                }
                              }}
                              className="w-7 h-6 border border-neutral-300 rounded cursor-pointer bg-neutral-100 text-[10px] p-0.5"
                              title="เลือกจากปฏิทิน"
                            />
                          </div>
                        </div>

                        {/* 2. เวลาใช้งาน */}
                        <div className="flex items-center gap-1">
                          <label className="font-semibold text-neutral-600 flex items-center gap-1 shrink-0">
                            <Clock className="w-3 h-3 text-blue-600" />
                            <span>เวลาใช้งาน:</span>
                          </label>
                          <input
                            type="text"
                            value={item.usageTime || item.eventTime || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              updateItem(item.id, 'usageTime', val);
                              updateItem(item.id, 'eventTime', val);
                            }}
                            placeholder="เช่น 08:00 - 12:00"
                            className="w-28 sm:w-32 px-2 py-0.5 border border-neutral-300 rounded bg-white text-xs font-medium text-neutral-900 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                          />
                          {/* Quick Preset Buttons for Time */}
                          <div className="flex items-center gap-0.5">
                            <button
                              type="button"
                              onClick={() => handleRateTypeChange(item.id, 'half_day')}
                              className="px-1.5 py-0.5 rounded bg-neutral-100 hover:bg-amber-100 hover:text-amber-900 text-neutral-700 text-[9.5px] font-medium cursor-pointer transition-colors"
                              title="คำนวณเรทครึ่งวันเช้า 08:00 - 12:00"
                            >
                              เช้า
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRateTypeChange(item.id, 'half_day_afternoon')}
                              className="px-1.5 py-0.5 rounded bg-neutral-100 hover:bg-amber-100 hover:text-amber-900 text-neutral-700 text-[9.5px] font-medium cursor-pointer transition-colors"
                              title="คำนวณเรทครึ่งวันบ่าย 13:00 - 17:00"
                            >
                              บ่าย
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRateTypeChange(item.id, 'full_day')}
                              className="px-1.5 py-0.5 rounded bg-neutral-100 hover:bg-amber-100 hover:text-amber-900 text-neutral-700 text-[9.5px] font-medium cursor-pointer transition-colors"
                              title="คำนวณเรทเต็มวัน 08:00 - 17:00"
                            >
                              เต็มวัน
                            </button>
                          </div>
                        </div>

                        {/* Quick Helper Buttons: Same as Doc & +1 Day */}
                        <div className="flex items-center gap-1">
                          {formData.eventDate && (item.usageDate !== formData.eventDate && item.eventDate !== formData.eventDate) && (
                            <button
                              type="button"
                              onClick={() => {
                                updateItem(item.id, 'usageDate', formData.eventDate);
                                updateItem(item.id, 'eventDate', formData.eventDate);
                                if (eventTime && !item.usageTime) {
                                  updateItem(item.id, 'usageTime', eventTime);
                                  updateItem(item.id, 'eventTime', eventTime);
                                }
                              }}
                              className="px-1.5 py-0.5 rounded bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 text-[10px] font-medium cursor-pointer"
                              title="ใช้วันและเวลาเดียวกับเอกสาร"
                            >
                              วันเดียวกับเอกสาร
                            </button>
                          )}

                          {/^\d{4}-\d{2}-\d{2}$/.test(item.usageDate || item.eventDate || '') && (
                            <button
                              type="button"
                              onClick={() => {
                                const cur = item.usageDate || item.eventDate || '';
                                try {
                                  const d = new Date(cur);
                                  d.setDate(d.getDate() + 1);
                                  const next = d.toISOString().split('T')[0];
                                  updateItem(item.id, 'usageDate', next);
                                  updateItem(item.id, 'eventDate', next);
                                } catch (e) {}
                              }}
                              className="px-1.5 py-0.5 rounded bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-800 text-[10px] font-medium cursor-pointer"
                              title="เลื่อนไปวันถัดไป (+1 วัน)"
                            >
                              +1 วัน
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-neutral-500">จำนวนเงินสุทธิ:</span>
                        <span className="font-bold text-neutral-900 font-mono text-sm">
                          {formatCurrency(item.amount)} บาท
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
              </div>

              {/* Total Calculation Card with Live Breakdown & Thai Baht Text */}
              <div className="bg-neutral-900 text-white p-4 sm:p-5 rounded-xl space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-neutral-800 pb-3">
                  <div className="space-y-1">
                    <div className="text-xs text-neutral-400">ข้อความตัวอักษรภาษาไทย (คำนวณอัตโนมัติ Real-time):</div>
                    <div className="text-sm sm:text-base font-bold text-amber-300">
                      {arabicToThaiBahtText(totalAmount)}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-xs text-neutral-400">ยอดรวมทั้งสิ้นสุทธิ (Net Total)</div>
                    <div className="text-2xl sm:text-3xl font-bold font-mono tracking-tight text-white">
                      {formatCurrency(totalAmount)} <span className="text-sm font-normal text-neutral-400">บาท</span>
                    </div>
                  </div>
                </div>

                {/* Subtotal and Discount Breakdown */}
                {totalDiscountSavings > 0 && (
                  <div className="flex flex-wrap items-center justify-between text-xs text-neutral-400 pt-1">
                    <div className="flex items-center gap-3">
                      <span>ยอดก่อนหักส่วนลด: <strong className="text-neutral-200 font-mono">{formatCurrency(grossSubtotal)}</strong> บาท</span>
                      <span className="text-neutral-600">•</span>
                      <span className="text-amber-400">
                        ส่วนลดรวม: <strong className="font-mono">-{formatCurrency(totalDiscountSavings)}</strong> บาท
                        {customerDiscountRate > 0 && ` (${customerDiscountRate}%)`}
                      </span>
                    </div>
                    <span className="text-[11px] text-emerald-400 font-medium">
                      ✓ ยอดสุทธิและตัวอักษรภาษาไทยคำนวณตามส่วนลดล่าสุดทันที
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 7. กำหนดเงื่อนไขการชำระเงินและผู้ลงนามในเอกสาร (Payment Terms & Signatures) */}
        <div className="bg-white rounded-xl border border-neutral-200 shadow-2xs overflow-hidden">
          <div
            onClick={() => toggleSection('paymentSignatures')}
            className="w-full px-5 py-3.5 flex flex-wrap items-center justify-between gap-2 bg-white hover:bg-neutral-50/80 transition-colors cursor-pointer border-b border-neutral-100 select-none"
          >
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-neutral-900"></span>
              <h3 className="text-sm font-bold text-neutral-800">
                7. กำหนดเงื่อนไขการชำระเงินและผู้ลงนามในเอกสาร (Payment Terms & Signatures)
              </h3>
              {collapsedSections.paymentSignatures && (
                <span className="text-[10px] text-neutral-500 bg-neutral-100 px-1.5 py-0.5 rounded">
                  ย่ออยู่
                </span>
              )}
            </div>

            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                onClick={() => calculateTermsDates(eventDate, paymentTermType, true)}
                className="px-2.5 py-1 text-xs font-semibold text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-lg flex items-center gap-1.5 transition-colors"
                title="คำนวณวันกำหนดชำระและวันแจ้งยกเว้นใหม่อัตโนมัติตามวันจัดงาน"
              >
                <RefreshCw className="w-3.5 h-3.5 text-neutral-600" />
                <span>คำนวณวันอัตโนมัติ</span>
              </button>

              <button
                type="button"
                onClick={() => toggleSection('paymentSignatures')}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-800 border border-neutral-200 transition-colors"
                title={collapsedSections.paymentSignatures ? 'คลิกเพื่อกางออก' : 'คลิกเพื่อพับเก็บ'}
              >
                {collapsedSections.paymentSignatures ? (
                  <>
                    <ChevronsDown className="w-3.5 h-3.5 text-neutral-600" />
                    <span>กางออก</span>
                  </>
                ) : (
                  <>
                    <ChevronsUp className="w-3.5 h-3.5 text-neutral-600" />
                    <span>พับย่อ</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Collapsed Summary Ribbon */}
          {collapsedSections.paymentSignatures && (
            <div
              onClick={() => toggleSection('paymentSignatures')}
              className="px-5 py-2.5 bg-neutral-50/70 hover:bg-neutral-100/80 cursor-pointer flex flex-wrap items-center justify-between gap-2 text-xs text-neutral-600 border-t border-neutral-100 transition-colors select-none"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold text-neutral-800">
                  💳 {paymentTermType === 'PRIVATE_7_DAYS' ? 'ลูกค้าเอกชน (ก่อนเริ่มงาน 7 วัน)' : 'ลูกค้าราชการ (เครดิต 30 วัน)'}
                </span>
                {paymentDueDate && <span>• ครบกำหนด: {paymentDueDate}</span>}
                <span className="text-neutral-400">•</span>
                <span>ผู้จัดทำ: {preparedBy || '-'}</span>
                <span className="text-neutral-400">•</span>
                <span>ผู้อนุมัติ: {approvedBy || '-'}</span>
                <span className="text-neutral-400">•</span>
                <span>ผู้มีอำนาจลงนาม: {authorizedName || '-'}</span>
              </div>
              <span className="text-[11px] text-blue-600 font-semibold hover:underline flex items-center gap-1">
                <ChevronsDown className="w-3 h-3" /> คลิกเพื่อขยายแก้ไข
              </span>
            </div>
          )}

          {!collapsedSections.paymentSignatures && (
            <div className="p-5 pt-4 space-y-4">
              {/* Payment Term Type Selector */}
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-2">
                  ประเภทลูกค้าและเงื่อนไขการชำระเงิน:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div
                    onClick={() => {
                      setPaymentTermType('PRIVATE_7_DAYS');
                      calculateTermsDates(eventDate, 'PRIVATE_7_DAYS', true);
                    }}
                    className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                      paymentTermType === 'PRIVATE_7_DAYS'
                        ? 'border-neutral-900 bg-neutral-50/80 shadow-xs'
                        : 'border-neutral-200 hover:border-neutral-300 bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-bold text-xs text-neutral-900 flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full ${paymentTermType === 'PRIVATE_7_DAYS' ? 'bg-emerald-600' : 'bg-neutral-300'}`} />
                          ชำระเงิน 100% ก่อนเริ่มงานอย่างน้อย 7 วัน
                        </div>
                        <p className="text-[11px] text-neutral-500 mt-1 leading-relaxed">
                          ชำระเงินเต็มจำนวน 100% ก่อนเริ่มงานอย่างน้อย 7 วัน
                        </p>
                      </div>
                      {paymentTermType === 'PRIVATE_7_DAYS' && (
                        <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      )}
                    </div>
                  </div>

                  <div
                    onClick={() => {
                      setPaymentTermType('GOVERNMENT_30_DAYS');
                      calculateTermsDates(eventDate, 'GOVERNMENT_30_DAYS', true);
                    }}
                    className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                      paymentTermType === 'GOVERNMENT_30_DAYS'
                        ? 'border-neutral-900 bg-neutral-50/80 shadow-xs'
                        : 'border-neutral-200 hover:border-neutral-300 bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-bold text-xs text-neutral-900 flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full ${paymentTermType === 'GOVERNMENT_30_DAYS' ? 'bg-blue-600' : 'bg-neutral-300'}`} />
                          เครดิตวางบิลชำระเงินภายใน 30 วัน
                        </div>
                        <p className="text-[11px] text-neutral-500 mt-1 leading-relaxed">
                          เครดิตวางบิลชำระเงินภายใน 30 วัน
                        </p>
                      </div>
                      {paymentTermType === 'GOVERNMENT_30_DAYS' && (
                        <Check className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Automatic Calculation Summary Box */}
              <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-lg text-xs space-y-2">
                <div className="flex items-center justify-between text-[11px] text-neutral-500 font-semibold border-b border-neutral-200/60 pb-1.5">
                  <span className="flex items-center gap-1 text-neutral-700">
                    <Calendar className="w-3.5 h-3.5 text-neutral-500" />
                    การคำนวณวันที่อัตโนมัติ (อิงจากวันจัดงาน: <span className="font-mono text-neutral-900">{eventDate || 'ไม่ได้ระบุ'}</span>)
                  </span>
                  <span className="text-emerald-700 font-medium">คำนวณอัตโนมัติเรียบร้อย</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-0.5">
                  <div>
                    <span className="text-[11px] text-neutral-500 block">
                      กำหนดชำระเงิน ({paymentTermType === 'PRIVATE_7_DAYS' ? 'ก่อนเริ่มงาน 7 วัน' : 'เครดิต 30 วัน'}):
                    </span>
                    <span className="font-mono font-bold text-sm text-neutral-900">
                      {paymentDueDate || '-'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-neutral-500 block">
                      หากต้องการยกเว้นกรุณาแจ้งล่วงหน้า (อย่างน้อย 14 วัน):
                    </span>
                    <span className="font-mono font-bold text-sm text-neutral-900">
                      {cancellationNoticeDate || '-'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">
                    วันที่กำหนดชำระเงิน (Payment Due Date)
                  </label>
                  <input
                    type="date"
                    value={paymentDueDate}
                    onChange={(e) => setPaymentDueDate(e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-1 focus:ring-neutral-800"
                  />
                  <span className="text-[10px] text-neutral-400 mt-0.5 block">
                    {paymentTermType === 'PRIVATE_7_DAYS'
                      ? 'ลูกค้าเอกชน: ก่อนวันจัดงานอย่างน้อย 7 วัน'
                      : 'ลูกค้าราชการ/มหาวิทยาลัย: เครดิต 30 วัน'}
                  </span>
                </div>

                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">
                    หากยกเว้น/ยกเลิกแจ้งล่วงหน้า (อย่างน้อย 14 วัน)
                  </label>
                  <input
                    type="date"
                    value={cancellationNoticeDate}
                    onChange={(e) => setCancellationNoticeDate(e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-1 focus:ring-neutral-800"
                  />
                  <span className="text-[10px] text-neutral-400 mt-0.5 block">
                    คำนวณย้อนหลัง 14 วันก่อนวันจัดงาน {eventDate ? `(${eventDate})` : ''}
                  </span>
                </div>
              </div>

              {/* Payment Terms Editor & Controller */}
              <div className="p-4 bg-slate-50/80 border border-slate-200 rounded-xl space-y-3.5 text-xs">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/80 pb-2">
                  <div className="flex items-center gap-1.5 font-bold text-slate-900 text-xs">
                    <FileText className="w-4 h-4 text-blue-600" />
                    <span>ข้อความเงื่อนไขการชำระเงิน (Payment Terms Text & Format)</span>
                  </div>
                </div>

                {/* Language Selector for Terms */}
                <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-100 p-1.5 rounded-lg border border-slate-200">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setTermsActiveTab('th')}
                      className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                        termsActiveTab === 'th'
                          ? 'bg-white text-slate-900 shadow-2xs font-bold border border-slate-200/80'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <span>🇹🇭</span>
                      <span>เงื่อนไขภาษาไทย</span>
                      {customPaymentTermsText && <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>}
                    </button>
                    <button
                      type="button"
                      onClick={() => setTermsActiveTab('en')}
                      className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                        termsActiveTab === 'en'
                          ? 'bg-blue-600 text-white shadow-2xs font-bold'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <span>🇬🇧</span>
                      <span>เงื่อนไขภาษาอังกฤษ (English)</span>
                      {customPaymentTermsTextEn && <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>}
                    </button>
                  </div>

                  {/* Quick Action buttons based on active tab */}
                  <div className="flex items-center gap-1.5">
                    {termsActiveTab === 'th' ? (
                      <button
                        type="button"
                        onClick={() => {
                          const standardText = generateStandardPaymentTerms(
                            paymentTermType,
                            paymentDueDate,
                            cancellationNoticeDate
                          );
                          setCustomPaymentTermsText(standardText);
                          setSyncStatusMsg({
                            type: 'success',
                            text: 'โหลดข้อความเงื่อนไขมาตรฐานภาษาไทยเรียบร้อยแล้ว',
                          });
                          setTimeout(() => setSyncStatusMsg(null), 3000);
                        }}
                        className="px-2.5 py-1 text-[11px] font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-md flex items-center gap-1 transition-colors cursor-pointer"
                        title="โหลดข้อความเงื่อนไขมาตรฐานภาษาไทย 5 ข้อพร้อมวันที่คำนวณล่าสุด"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>โหลดข้อความมาตรฐาน (TH)</span>
                      </button>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            const standardEn = generateStandardPaymentTermsEn(
                              paymentTermType,
                              paymentDueDate,
                              cancellationNoticeDate
                            );
                            setCustomPaymentTermsTextEn(standardEn);
                            setSyncStatusMsg({
                              type: 'success',
                              text: 'โหลดข้อความเงื่อนไขมาตรฐานภาษาอังกฤษเรียบร้อยแล้ว',
                            });
                            setTimeout(() => setSyncStatusMsg(null), 3000);
                          }}
                          className="px-2.5 py-1 text-[11px] font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-md flex items-center gap-1 transition-colors cursor-pointer"
                          title="โหลดข้อความมาตรฐานภาษาอังกฤษ 5 ข้อพร้อมวันที่คำนวณล่าสุด"
                        >
                          <RefreshCw className="w-3 h-3" />
                          <span>โหลดข้อความมาตรฐาน (EN)</span>
                        </button>
                        {customPaymentTermsText && (
                          <button
                            type="button"
                            onClick={() => {
                              const translated = translatePhrase(customPaymentTermsText);
                              setCustomPaymentTermsTextEn(translated);
                              setSyncStatusMsg({
                                type: 'success',
                                text: 'แปลข้อความเงื่อนไขจากภาษาไทยเรียบร้อยแล้ว',
                              });
                              setTimeout(() => setSyncStatusMsg(null), 3000);
                            }}
                            className="px-2.5 py-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-md flex items-center gap-1 transition-colors cursor-pointer"
                            title="คัดลอกและแปลข้อความเงื่อนไขจากภาษาไทยเป็นภาษาอังกฤษ"
                          >
                            <Sparkles className="w-3 h-3" />
                            <span>แปลจากภาษาไทย</span>
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Textarea for editing payment terms */}
                <div>
                  <div className="flex items-center justify-between mb-1 text-[11px]">
                    <label className="font-semibold text-slate-700">
                      {termsActiveTab === 'th' ? 'พิมพ์แก้ไข / เพิ่ม / ลบข้อความเงื่อนไขภาษาไทยแต่ละบรรทัดได้อิสระ:' : 'พิมพ์แก้ไขเงื่อนไขภาษาอังกฤษ (English Payment Terms):'}
                    </label>
                    <span className="text-slate-400">
                      {termsActiveTab === 'th' ? '(ระบบจะใส่สัญลักษณ์ • นำหน้าให้อัตโนมัติเมื่อขึ้นบรรทัดใหม่)' : '(Use • bullet points for each condition)'}
                    </span>
                  </div>

                  {termsActiveTab === 'th' ? (
                    <>
                      <textarea
                        rows={6}
                        value={
                          customPaymentTermsText !== ''
                            ? customPaymentTermsText
                            : generateStandardPaymentTerms(
                                paymentTermType,
                                paymentDueDate,
                                cancellationNoticeDate
                              )
                        }
                        onChange={(e) => setCustomPaymentTermsText(e.target.value)}
                        className="w-full text-xs font-mono border border-slate-300 rounded-lg p-3 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 leading-relaxed shadow-2xs"
                        placeholder="พิมพ์เงื่อนไขการชำระเงินภาษาไทยแต่ละบรรทัด..."
                      />
                      {customPaymentTermsText && (
                        <div className="flex items-center justify-between mt-1 text-[10.5px]">
                          <span className="text-emerald-600 font-medium">
                            ✓ กำลังใช้ข้อความภาษาไทยที่กำหนดเอง (Customized)
                          </span>
                          <button
                            type="button"
                            onClick={() => setCustomPaymentTermsText('')}
                            className="text-neutral-500 hover:text-red-600 underline cursor-pointer"
                          >
                            ล้างเพื่อกลับไปใช้ค่าอัตโนมัติตั้งต้น
                          </button>
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <textarea
                        rows={6}
                        value={
                          customPaymentTermsTextEn !== ''
                            ? customPaymentTermsTextEn
                            : generateStandardPaymentTermsEn(
                                paymentTermType,
                                paymentDueDate,
                                cancellationNoticeDate
                              )
                        }
                        onChange={(e) => setCustomPaymentTermsTextEn(e.target.value)}
                        className="w-full text-xs font-mono border border-blue-300 rounded-lg p-3 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 leading-relaxed shadow-2xs"
                        placeholder="Type English payment terms lines here..."
                      />
                      <div className="flex items-center justify-between mt-1 text-[10.5px]">
                        {customPaymentTermsTextEn ? (
                          <span className="text-emerald-600 font-medium">
                            ✓ บันทึกข้อความเงื่อนไขภาษาอังกฤษเรียบร้อยแล้ว (Custom English Terms Saved)
                          </span>
                        ) : (
                          <span className="text-blue-600 font-medium">
                            ℹ กำลังใช้ข้อความมาตรฐานภาษาอังกฤษอัตโนมัติ (Default English Terms)
                          </span>
                        )}
                        {customPaymentTermsTextEn && (
                          <button
                            type="button"
                            onClick={() => setCustomPaymentTermsTextEn('')}
                            className="text-neutral-500 hover:text-red-600 underline cursor-pointer"
                          >
                            รีเซ็ตกลับเป็นภาษาอังกฤษมาตรฐาน
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>

                {/* 2. Styling Controller: Font Size, Alignment, Line Spacing */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-200/80 bg-white/60 p-2.5 rounded-lg border border-slate-200/60">
                  {/* Font Size Slider */}
                  <div className="space-y-1 sm:col-span-1">
                    <div className="flex justify-between items-center text-[11px] font-semibold text-slate-700">
                      <span className="flex items-center gap-1">
                        <Type className="w-3.5 h-3.5 text-slate-500" />
                        <span>ขนาดฟอนต์:</span>
                      </span>
                      <span className="font-mono font-bold text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.2 rounded text-[11px]">
                        {layoutSettings.paymentTermsFontSize || 11}px
                      </span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="18"
                      value={layoutSettings.paymentTermsFontSize || 11}
                      onChange={(e) => updateLayout({ paymentTermsFontSize: Number(e.target.value) })}
                      className="w-full accent-blue-600 cursor-pointer"
                    />
                    <div className="flex items-center justify-between gap-1">
                      {[10, 11, 12, 14, 16].map((size) => (
                        <button
                          key={size}
                          type="button"
                          onClick={() => updateLayout({ paymentTermsFontSize: size })}
                          className={`px-1.5 py-0.5 text-[10px] rounded border font-mono transition-colors ${
                            (layoutSettings.paymentTermsFontSize || 11) === size
                              ? 'bg-blue-600 text-white border-blue-600 font-bold'
                              : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-100'
                          }`}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Alignment Controller */}
                  <div className="space-y-1 sm:col-span-1">
                    <label className="block text-[11px] font-semibold text-slate-700">
                      จัดตำแหน่งข้อความ (Alignment):
                    </label>
                    <div className="grid grid-cols-3 gap-1 p-0.5 bg-slate-200/70 rounded-md">
                      {(
                        [
                          { id: 'left', label: 'ซ้าย', icon: AlignLeft },
                          { id: 'center', label: 'กลาง', icon: AlignCenter },
                          { id: 'right', label: 'ขวา', icon: AlignRight },
                        ] as const
                      ).map((item) => {
                        const Icon = item.icon;
                        const isSel = (layoutSettings.paymentTermsAlign || 'left') === item.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => updateLayout({ paymentTermsAlign: item.id })}
                            className={`py-1 text-center rounded flex items-center justify-center gap-1 text-xs font-medium transition-all ${
                              isSel
                                ? 'bg-white text-slate-900 shadow-2xs font-bold'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            <Icon className="w-3.5 h-3.5" />
                            <span>{item.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Line Height / Spacing Controller */}
                  <div className="space-y-1 sm:col-span-1">
                    <label className="block text-[11px] font-semibold text-slate-700">
                      ระยะห่างบรรทัด (Line Height):
                    </label>
                    <div className="grid grid-cols-3 gap-1 p-0.5 bg-slate-200/70 rounded-md">
                      {(
                        [
                          { id: 'tight', label: 'กระชับ' },
                          { id: 'normal', label: 'ปกติ' },
                          { id: 'relaxed', label: 'โปร่ง' },
                        ] as const
                      ).map((item) => {
                        const isSel = (layoutSettings.paymentTermsLineHeight || 'normal') === item.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => updateLayout({ paymentTermsLineHeight: item.id })}
                            className={`py-1 text-center rounded text-xs font-medium transition-all ${
                              isSel
                                ? 'bg-white text-slate-900 shadow-2xs font-bold'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            {item.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-xs">
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  หมายเหตุค่าบริการล่วงเวลา
                </label>
                <textarea
                  rows={3}
                  value={overtimeNote}
                  onChange={(e) => setOvertimeNote(e.target.value)}
                  className="w-full text-sm border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500"
                  placeholder="พิมพ์หมายเหตุ 3 บรรทัดที่นี่..."
                />
              </div>

              {/* Bank Account & Payment QR Code Editor */}
              <div className="p-4 bg-amber-50/60 border border-amber-200/90 rounded-xl space-y-3.5 text-xs">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-200/80 pb-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-900 flex items-center justify-center font-bold">
                      <QrCode className="w-4 h-4 text-amber-800" />
                    </div>
                    <div>
                      <div className="font-bold text-neutral-900 text-xs flex items-center gap-1.5">
                        <span>ข้อมูลบัญชีธนาคาร & ตัว QR Code สำหรับชำระเงิน</span>
                        <span className="text-[10px] text-amber-800 font-semibold bg-amber-100 border border-amber-300 px-1.5 py-0.2 rounded-full">
                          แก้ไขได้อิสระ
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-500">
                        ระบุเลขที่บัญชี หรืออัปโหลดภาพ QR Code ธนาคาร / แก้ไขรหัส PromptPay
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setBankName('ธนาคารกรุงไทย');
                      setBankBranch('สาขา ม.เทคโนโลยีพระจอมเกล้าธนบุรี');
                      setBankAccountName('มจธ.สำนักเคเอกซ์');
                      setBankAccountNumber('037-7-14212-0');
                      setQrPromptPayCode('0994000160097');
                      setQrImageUrl('');
                      setQrType('promptpay');
                      setQrCustomPayload('');
                      setSyncStatusMsg({
                        type: 'success',
                        text: 'รีเซ็ตข้อมูลธนาคารและ QR เป็นค่าเริ่มต้น มจธ. สำนักเคเอกซ์ เรียบร้อยแล้ว',
                      });
                      setTimeout(() => setSyncStatusMsg(null), 3000);
                    }}
                    className="px-2.5 py-1 text-[11px] font-semibold text-neutral-700 hover:text-neutral-900 bg-white hover:bg-neutral-100 border border-neutral-300 rounded-md flex items-center gap-1 transition-colors cursor-pointer"
                    title="รีเซ็ตเป็นค่าเริ่มต้นบัญชี มจธ. เคเอกซ์"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>รีเซ็ตค่าเริ่มต้น</span>
                  </button>
                </div>

                {/* Payment Language Selector (Requirement 1) */}
                <div className="bg-amber-100/70 p-2.5 rounded-lg border border-amber-200 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-amber-900">ภาษาสำหรับส่วนการชำระเงิน (Payment Language):</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setPaymentLanguage('auto')}
                      className={`px-2.5 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${
                        paymentLanguage === 'auto'
                          ? 'bg-amber-600 text-white shadow-2xs font-bold'
                          : 'bg-white text-neutral-700 hover:bg-amber-50 border border-amber-200'
                      }`}
                    >
                      อัตโนมัติตามเอกสาร (Auto)
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentLanguage('th')}
                      className={`px-2.5 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${
                        paymentLanguage === 'th'
                          ? 'bg-amber-600 text-white shadow-2xs font-bold'
                          : 'bg-white text-neutral-700 hover:bg-amber-50 border border-amber-200'
                      }`}
                    >
                      🇹🇭 ภาษาไทย (Thai)
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentLanguage('en')}
                      className={`px-2.5 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${
                        paymentLanguage === 'en'
                          ? 'bg-amber-600 text-white shadow-2xs font-bold'
                          : 'bg-white text-neutral-700 hover:bg-amber-50 border border-amber-200'
                      }`}
                    >
                      🇬🇧 ภาษาอังกฤษ (English)
                    </button>
                  </div>
                </div>

                {/* 1. Bank Account Details Grid with Thai/English Tabs */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-semibold text-neutral-800">
                      ข้อมูลบัญชีธนาคาร (Bank Account Details):
                    </span>
                    <div className="flex items-center gap-1 bg-amber-100/70 p-1 rounded-md">
                      <button
                        type="button"
                        onClick={() => setBankInfoActiveTab('th')}
                        className={`px-2 py-0.5 rounded text-xs font-semibold transition-all cursor-pointer ${
                          bankInfoActiveTab === 'th'
                            ? 'bg-amber-600 text-white shadow-2xs font-bold'
                            : 'bg-white text-neutral-700 hover:bg-amber-50'
                        }`}
                      >
                        🇹🇭 ภาษาไทย
                      </button>
                      <button
                        type="button"
                        onClick={() => setBankInfoActiveTab('en')}
                        className={`px-2 py-0.5 rounded text-xs font-semibold transition-all cursor-pointer ${
                          bankInfoActiveTab === 'en'
                            ? 'bg-amber-600 text-white shadow-2xs font-bold'
                            : 'bg-white text-neutral-700 hover:bg-amber-50'
                        }`}
                      >
                        🇬🇧 ภาษาอังกฤษ (English)
                      </button>
                    </div>
                  </div>

                  {bankInfoActiveTab === 'th' ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                      <div>
                        <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
                          ธนาคาร (Bank) [ไทย]:
                        </label>
                        <input
                          type="text"
                          value={bankName}
                          onChange={(e) => setBankName(e.target.value)}
                          placeholder="เช่น ธนาคารกรุงไทย"
                          className="w-full px-2.5 py-1.5 border border-neutral-300 rounded-lg text-xs bg-white text-neutral-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
                          สาขา (Branch) [ไทย]:
                        </label>
                        <input
                          type="text"
                          value={bankBranch}
                          onChange={(e) => setBankBranch(e.target.value)}
                          placeholder="เช่น สาขา ม.เทคโนโลยีพระจอมเกล้าธนบุรี"
                          className="w-full px-2.5 py-1.5 border border-neutral-300 rounded-lg text-xs bg-white text-neutral-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
                          ชื่อบัญชี (Account Name) [ไทย]:
                        </label>
                        <input
                          type="text"
                          value={bankAccountName}
                          onChange={(e) => setBankAccountName(e.target.value)}
                          placeholder="เช่น มจธ.สำนักเคเอกซ์"
                          className="w-full px-2.5 py-1.5 border border-neutral-300 rounded-lg text-xs bg-white text-neutral-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
                          เลขที่บัญชี (Account No.) [ใช้ร่วมกัน]:
                        </label>
                        <input
                          type="text"
                          value={bankAccountNumber}
                          onChange={(e) => {
                            setBankAccountNumber(e.target.value);
                            setBankAccountNumberEn(e.target.value);
                          }}
                          placeholder="เช่น 037-7-14212-0"
                          className="w-full px-2.5 py-1.5 border border-neutral-300 rounded-lg text-xs font-mono font-bold bg-white text-neutral-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                      <div>
                        <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
                          Bank Name [English]:
                        </label>
                        <input
                          type="text"
                          value={bankNameEn}
                          onChange={(e) => setBankNameEn(e.target.value)}
                          placeholder="e.g. Krungthai Bank Public Co., Ltd."
                          className="w-full px-2.5 py-1.5 border border-neutral-300 rounded-lg text-xs bg-white text-neutral-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
                          Branch [English]:
                        </label>
                        <input
                          type="text"
                          value={bankBranchEn}
                          onChange={(e) => setBankBranchEn(e.target.value)}
                          placeholder="e.g. King Mongkut's University of Technology Thonburi"
                          className="w-full px-2.5 py-1.5 border border-neutral-300 rounded-lg text-xs bg-white text-neutral-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
                          Account Name [English]:
                        </label>
                        <input
                          type="text"
                          value={bankAccountNameEn}
                          onChange={(e) => setBankAccountNameEn(e.target.value)}
                          placeholder="e.g. KMUTT Knowledge Xchange"
                          className="w-full px-2.5 py-1.5 border border-neutral-300 rounded-lg text-xs bg-white text-neutral-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
                          Account No. [Shared]:
                        </label>
                        <input
                          type="text"
                          value={bankAccountNumberEn}
                          onChange={(e) => {
                            setBankAccountNumberEn(e.target.value);
                            setBankAccountNumber(e.target.value);
                          }}
                          placeholder="e.g. 037-7-14212-0"
                          className="w-full px-2.5 py-1.5 border border-neutral-300 rounded-lg text-xs font-mono font-bold bg-white text-neutral-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. QR Code Mode Selection & Settings */}
                <div className="pt-2 border-t border-amber-200/70">
                  <label className="block text-[11px] font-semibold text-neutral-800 mb-1.5">
                    รูปแบบตัว QR Code ชำระเงิน (Payment QR Format):
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 p-1 bg-amber-100/60 rounded-lg mb-3">
                    <button
                      type="button"
                      onClick={() => setQrType('promptpay')}
                      className={`py-1.5 px-2.5 rounded-md text-xs font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        qrType === 'promptpay'
                          ? 'bg-white text-amber-950 font-bold shadow-xs'
                          : 'text-neutral-600 hover:text-neutral-900'
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                      <span>1. PromptPay อัตโนมัติ</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setQrType('image')}
                      className={`py-1.5 px-2.5 rounded-md text-xs font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        qrType === 'image'
                          ? 'bg-white text-amber-950 font-bold shadow-xs'
                          : 'text-neutral-600 hover:text-neutral-900'
                      }`}
                    >
                      <Upload className="w-3.5 h-3.5 text-blue-600" />
                      <span>2. อัปโหลดภาพ QR ธนาคาร</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setQrType('custom_payload')}
                      className={`py-1.5 px-2.5 rounded-md text-xs font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        qrType === 'custom_payload'
                          ? 'bg-white text-amber-950 font-bold shadow-xs'
                          : 'text-neutral-600 hover:text-neutral-900'
                      }`}
                    >
                      <Link2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>3. กำหนดข้อความ/ลิงก์เอง</span>
                    </button>
                  </div>

                  {/* Panel Content based on selected QR mode */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center bg-white p-3 rounded-lg border border-amber-200/90 shadow-2xs">
                    {/* Mode 1: PromptPay ID Input */}
                    {qrType === 'promptpay' && (
                      <div className="sm:col-span-8 space-y-1.5">
                        <label className="block text-[11px] font-semibold text-neutral-800">
                          รหัสพร้อมเพย์ (เลขประจำตัวผู้เสียภาษี 13 หลัก หรือ เบอร์มือถือ 10 หลัก):
                        </label>
                        <input
                          type="text"
                          value={qrPromptPayCode}
                          onChange={(e) => setQrPromptPayCode(e.target.value.replace(/[^0-9]/g, ''))}
                          placeholder="เช่น 0994000160097 หรือ 0812345678"
                          className="w-full px-3 py-2 border border-neutral-300 focus:border-amber-500 rounded-lg text-xs font-mono font-bold focus:outline-none focus:ring-1 focus:ring-amber-500"
                        />
                        <div className="flex flex-wrap items-center gap-2 text-[10.5px] text-neutral-500">
                          <span>💡 ปัจจุบัน: <b>{qrPromptPayCode.length === 13 ? 'เลขนิติบุคคล/Tax ID 13 หลัก' : qrPromptPayCode.length === 10 ? 'เบอร์โทรศัพท์ 10 หลัก' : 'รหัสทั่วไป'}</b></span>
                          <span className="text-neutral-400">•</span>
                          <span className="text-emerald-700 font-medium">ระบบจะคำนวณยอดเงิน {formatCurrency(totalAmount)} บาท และ Gen ตัว QR Code แบบ EMVCo ให้อัตโนมัติ</span>
                        </div>
                      </div>
                    )}

                    {/* Mode 2: Image Upload */}
                    {qrType === 'image' && (
                      <div className="sm:col-span-8 space-y-2">
                        <label className="block text-[11px] font-semibold text-neutral-800">
                          อัปโหลดไฟล์ภาพ QR Code ที่แคปจากแอปธนาคาร:
                        </label>
                        <div className="flex flex-wrap items-center gap-2">
                          <input
                            ref={qrFileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleQRImageUpload}
                            className="hidden"
                            id="qr-file-upload-input"
                          />
                          <label
                            htmlFor="qr-file-upload-input"
                            className="px-3.5 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-xs font-semibold cursor-pointer flex items-center gap-1.5 shadow-2xs transition-colors"
                          >
                            <Upload className="w-3.5 h-3.5" />
                            <span>{qrImageUrl ? 'เปลี่ยนรูปภาพ QR' : 'เลือกไฟล์ภาพ QR Code'}</span>
                          </label>
                          {qrImageUrl && (
                            <button
                              type="button"
                              onClick={handleRemoveQRImage}
                              className="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-xs font-semibold flex items-center gap-1 border border-red-200 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>ลบรูปภาพ</span>
                            </button>
                          )}
                        </div>
                        <p className="text-[10.5px] text-neutral-500">
                          รองรับไฟล์ PNG, JPG, WebP ขนาดไม่เกิน 5 MB (แนะนำรูปภาพสี่เหลี่ยมจัตุรัสที่มีความคมชัดสูง)
                        </p>
                      </div>
                    )}

                    {/* Mode 3: Custom Text / URL */}
                    {qrType === 'custom_payload' && (
                      <div className="sm:col-span-8 space-y-1.5">
                        <label className="block text-[11px] font-semibold text-neutral-800">
                          ข้อความหรือลิงก์ Payment URL สำหรับฝังใน QR Code:
                        </label>
                        <textarea
                          rows={2}
                          value={qrCustomPayload}
                          onChange={(e) => setQrCustomPayload(e.target.value)}
                          placeholder="วางลิงก์หน้าชำระเงิน หรือโค้ด QR ตามต้องการ..."
                          className="w-full px-3 py-1.5 border border-neutral-300 focus:border-amber-500 rounded-lg text-xs font-mono focus:outline-none focus:ring-1 focus:ring-amber-500"
                        />
                      </div>
                    )}

                    {/* Live Preview Column (col 4) */}
                    <div className="sm:col-span-4 flex flex-col items-center justify-center p-2.5 bg-neutral-50 rounded-lg border border-neutral-200 text-center">
                      <div className="text-[10px] text-neutral-500 font-semibold mb-1">
                        ตัวอย่าง QR ที่จะแสดงบนเอกสาร
                      </div>
                      <div className="p-1 bg-white border border-neutral-300 rounded-xs shadow-2xs">
                        {qrType === 'image' && qrImageUrl ? (
                          <img
                            src={qrImageUrl}
                            alt="QR Preview"
                            className="w-16 h-16 object-contain"
                          />
                        ) : (
                          <QRCodeCanvas
                            value={
                              qrType === 'custom_payload' && qrCustomPayload
                                ? qrCustomPayload
                                : generatePromptPayPayload(qrPromptPayCode || '0994000160097', totalAmount)
                            }
                            size={64}
                          />
                        )}
                      </div>
                      <div className="text-[10px] text-neutral-600 mt-1 font-mono font-medium">
                        {qrType === 'image' ? (qrImageUrl ? 'ภาพ QR ที่อัปโหลด' : 'ยังไม่ได้อัปโหลดภาพ') : qrType === 'promptpay' ? `${qrPromptPayCode || 'KX'}` : 'Custom QR'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Bank Info Font, Granular Block Sizes & Bold/Normal Weights, and QR Code Size */}
                <div className="pt-3 border-t border-amber-200/80 space-y-3 bg-white p-3.5 rounded-lg border border-amber-200/90 shadow-2xs">
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-neutral-100">
                    <div>
                      <span className="font-bold text-neutral-800 text-xs flex items-center gap-1.5">
                        <span>⚙️ ปรับแต่งฟอนต์ ขนาดตัวอักษรแต่ละก้อน และความหนา (Font, Size & Weight)</span>
                      </span>
                      <p className="text-[10.5px] text-neutral-500">
                        เลือกปรับขนาดของแต่ละก้อนข้อความได้อิสระ หรือกดปรับให้เท่ากันทุกก้อนในคลิกเดียว พร้อมเลือก ตัวหนา / ตัวปกติ
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          const base = layoutSettings.bankFontSize || 10.5;
                          updateLayout({
                            bankTitleFontSize: base,
                            bankLabelFontSize: base,
                            bankDetailsFontSize: base,
                            bankAccountNumberFontSize: base,
                          });
                        }}
                        className="px-2.5 py-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-md flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                        title="ปรับขนาดตัวหนังสือทุกก้อนให้เท่ากันเป๊ะตามขนาดหลัก"
                      >
                        <span>⚡ ปรับทุกก้อนให้ขนาดเท่ากัน ({layoutSettings.bankFontSize || 10.5}px)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => updateLayout({
                          bankFontFamily: 'Sarabun',
                          bankFontSize: 10.5,
                          bankTitleFontSize: undefined,
                          bankTitleBold: true,
                          bankLabelFontSize: undefined,
                          bankLabelBold: true,
                          bankDetailsFontSize: undefined,
                          bankDetailsBold: false,
                          bankAccountNumberFontSize: undefined,
                          bankAccountNumberBold: true,
                          qrSize: 62,
                          paymentBoxHeight: 75.6,
                        })}
                        className="px-2 py-1 text-[10.5px] text-amber-800 hover:text-amber-950 font-medium underline cursor-pointer"
                      >
                        คืนค่าเริ่มต้น
                      </button>
                    </div>
                  </div>

                  {/* Top Bar: Font Family & Base Uniform Size */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 p-2.5 bg-amber-50/50 rounded-lg border border-amber-200/60">
                    <div className="sm:col-span-6">
                      <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
                        แบบอักษร (Font Family):
                      </label>
                      <select
                        value={layoutSettings.bankFontFamily || 'Sarabun'}
                        onChange={(e) => updateLayout({ bankFontFamily: e.target.value })}
                        className="w-full px-2.5 py-1.5 border border-neutral-300 rounded-md bg-white text-xs font-medium text-neutral-800 focus:ring-1 focus:ring-amber-500 shadow-2xs"
                      >
                        <option value="Sarabun">🇹🇭 Sarabun (ฟอนต์สารบรรณ มาตรฐานทางการ / แนะนำ)</option>
                        <option value="Trirong">🏛️ Trirong (ฟอนต์มีหัว คลาสสิก)</option>
                        <option value="Prompt">🏢 Prompt (ฟอนต์โมเดิร์น ไร้หัว)</option>
                        <option value="Kanit">🎨 Kanit (ฟอนต์กว้าง โมเดิร์น)</option>
                        <option value="Mitr">✨ Mitr (ฟอนต์โค้งมน เป็นมิตร)</option>
                        <option value="Chakra Petch">⚡ Chakra Petch (ฟอนต์เหลี่ยม คมชัด)</option>
                        <option value="Bai Jamjuree">🌿 Bai Jamjuree (ฟอนต์อ่านง่าย ทรงพรีเมียม)</option>
                        <option value="IBM Plex Sans Thai">💼 IBM Plex Sans Thai (ฟอนต์ธุรกิจสากล)</option>
                        <option value="Noto Sans Thai">🌐 Noto Sans Thai (ฟอนต์มาตรฐานสากล)</option>
                        <option value="system-ui">💻 System UI (ฟอนต์ระบบเครื่อง)</option>
                      </select>
                    </div>

                    <div className="sm:col-span-6">
                      <div className="flex justify-between items-center text-[11px] mb-1">
                        <span className="font-semibold text-neutral-700">ขนาดตัวอักษรหลัก (Base Font Size):</span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => updateLayout({ bankFontSize: Math.max(8, (layoutSettings.bankFontSize || 10.5) - 0.5) })}
                            className="px-1.5 py-0.2 bg-white hover:bg-neutral-100 border border-neutral-300 rounded text-[10px] font-mono cursor-pointer"
                          >
                            -0.5
                          </button>
                          <span className="font-mono font-bold text-amber-800 bg-white border border-amber-300 px-1.5 py-0.2 rounded text-[11px]">
                            {layoutSettings.bankFontSize || 10.5}px
                          </span>
                          <button
                            type="button"
                            onClick={() => updateLayout({ bankFontSize: Math.min(16, (layoutSettings.bankFontSize || 10.5) + 0.5) })}
                            className="px-1.5 py-0.2 bg-white hover:bg-neutral-100 border border-neutral-300 rounded text-[10px] font-mono cursor-pointer"
                          >
                            +0.5
                          </button>
                        </div>
                      </div>
                      <input
                        type="range"
                        min="8"
                        max="16"
                        step="0.5"
                        value={layoutSettings.bankFontSize || 10.5}
                        onChange={(e) => updateLayout({ bankFontSize: Number(e.target.value) })}
                        className="w-full accent-amber-600 cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* 4 Granular Blocks Customizer ("เลือกก้อนได้เอง และเลือกตัวหนาหรือปกติ") */}
                  <div>
                    <label className="block text-[11.5px] font-bold text-neutral-800 mb-1.5">
                      ปรับขนาดและรูปแบบแยกตามก้อนข้อความ (Granular Blocks & Bold Styles):
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">

                      {/* Block 1: Header "การชำระเงิน" */}
                      <div className="p-2.5 bg-neutral-50 rounded-lg border border-neutral-200 flex flex-col justify-between space-y-2">
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-neutral-800 text-[11px]">1. หัวข้อ "การชำระเงิน"</span>
                            <button
                              type="button"
                              onClick={() => updateLayout({ bankTitleBold: !(layoutSettings.bankTitleBold !== false) })}
                              className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors cursor-pointer ${
                                layoutSettings.bankTitleBold !== false
                                  ? 'bg-neutral-900 text-white border-neutral-900'
                                  : 'bg-white text-neutral-600 border-neutral-300 hover:bg-neutral-100'
                              }`}
                            >
                              {layoutSettings.bankTitleBold !== false ? 'ตัวหนา (B)' : 'ปกติ (N)'}
                            </button>
                          </div>
                          <p className="text-[10px] text-neutral-500 mt-0.5">ข้อความหัวเรื่องด้านบน</p>
                        </div>
                        <div className="flex items-center justify-between pt-1 border-t border-neutral-200">
                          <span className="text-[10.5px] text-neutral-600 font-medium">ขนาด:</span>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => updateLayout({ bankTitleFontSize: Math.max(8, (layoutSettings.bankTitleFontSize || layoutSettings.bankFontSize || 10.5) - 0.5) })}
                              className="px-1.5 py-0.5 bg-white border border-neutral-300 rounded text-[9.5px] font-mono cursor-pointer"
                            >
                              -
                            </button>
                            <span className="font-mono font-bold text-neutral-900 bg-white border border-neutral-200 px-1 rounded text-[10.5px]">
                              {layoutSettings.bankTitleFontSize || layoutSettings.bankFontSize || 10.5}px
                            </span>
                            <button
                              type="button"
                              onClick={() => updateLayout({ bankTitleFontSize: Math.min(18, (layoutSettings.bankTitleFontSize || layoutSettings.bankFontSize || 10.5) + 0.5) })}
                              className="px-1.5 py-0.5 bg-white border border-neutral-300 rounded text-[9.5px] font-mono cursor-pointer"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Block 2: Labels ("โดยการโอนเงิน :", "ชื่อบัญชี :", "เลขที่บัญชี :") */}
                      <div className="p-2.5 bg-neutral-50 rounded-lg border border-neutral-200 flex flex-col justify-between space-y-2">
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-neutral-800 text-[11px]">2. ป้ายกำกับคำนำหน้า</span>
                            <button
                              type="button"
                              onClick={() => updateLayout({ bankLabelBold: !(layoutSettings.bankLabelBold !== false) })}
                              className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors cursor-pointer ${
                                layoutSettings.bankLabelBold !== false
                                  ? 'bg-neutral-900 text-white border-neutral-900'
                                  : 'bg-white text-neutral-600 border-neutral-300 hover:bg-neutral-100'
                              }`}
                            >
                              {layoutSettings.bankLabelBold !== false ? 'ตัวหนา (B)' : 'ปกติ (N)'}
                            </button>
                          </div>
                          <p className="text-[10px] text-neutral-500 mt-0.5">โดยการโอนเงิน, ชื่อบัญชี, เลขที่บัญชี</p>
                        </div>
                        <div className="flex items-center justify-between pt-1 border-t border-neutral-200">
                          <span className="text-[10.5px] text-neutral-600 font-medium">ขนาด:</span>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => updateLayout({ bankLabelFontSize: Math.max(8, (layoutSettings.bankLabelFontSize || layoutSettings.bankFontSize || 10.5) - 0.5) })}
                              className="px-1.5 py-0.5 bg-white border border-neutral-300 rounded text-[9.5px] font-mono cursor-pointer"
                            >
                              -
                            </button>
                            <span className="font-mono font-bold text-neutral-900 bg-white border border-neutral-200 px-1 rounded text-[10.5px]">
                              {layoutSettings.bankLabelFontSize || layoutSettings.bankFontSize || 10.5}px
                            </span>
                            <button
                              type="button"
                              onClick={() => updateLayout({ bankLabelFontSize: Math.min(18, (layoutSettings.bankLabelFontSize || layoutSettings.bankFontSize || 10.5) + 0.5) })}
                              className="px-1.5 py-0.5 bg-white border border-neutral-300 rounded text-[9.5px] font-mono cursor-pointer"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Block 3: Details (Bank name, branch, account name) */}
                      <div className="p-2.5 bg-neutral-50 rounded-lg border border-neutral-200 flex flex-col justify-between space-y-2">
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-neutral-800 text-[11px]">3. ข้อมูลธนาคาร & ชื่อบัญชี</span>
                            <button
                              type="button"
                              onClick={() => updateLayout({ bankDetailsBold: !layoutSettings.bankDetailsBold })}
                              className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors cursor-pointer ${
                                layoutSettings.bankDetailsBold
                                  ? 'bg-neutral-900 text-white border-neutral-900'
                                  : 'bg-white text-neutral-600 border-neutral-300 hover:bg-neutral-100'
                              }`}
                            >
                              {layoutSettings.bankDetailsBold ? 'ตัวหนา (B)' : 'ปกติ (N)'}
                            </button>
                          </div>
                          <p className="text-[10px] text-neutral-500 mt-0.5">ชื่อธนาคาร สาขา และชื่อบัญชี</p>
                        </div>
                        <div className="flex items-center justify-between pt-1 border-t border-neutral-200">
                          <span className="text-[10.5px] text-neutral-600 font-medium">ขนาด:</span>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => updateLayout({ bankDetailsFontSize: Math.max(8, (layoutSettings.bankDetailsFontSize || layoutSettings.bankFontSize || 10.5) - 0.5) })}
                              className="px-1.5 py-0.5 bg-white border border-neutral-300 rounded text-[9.5px] font-mono cursor-pointer"
                            >
                              -
                            </button>
                            <span className="font-mono font-bold text-neutral-900 bg-white border border-neutral-200 px-1 rounded text-[10.5px]">
                              {layoutSettings.bankDetailsFontSize || layoutSettings.bankFontSize || 10.5}px
                            </span>
                            <button
                              type="button"
                              onClick={() => updateLayout({ bankDetailsFontSize: Math.min(18, (layoutSettings.bankDetailsFontSize || layoutSettings.bankFontSize || 10.5) + 0.5) })}
                              className="px-1.5 py-0.5 bg-white border border-neutral-300 rounded text-[9.5px] font-mono cursor-pointer"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Block 4: Account Number ("037-7-14212-0") */}
                      <div className="p-2.5 bg-neutral-50 rounded-lg border border-neutral-200 flex flex-col justify-between space-y-2">
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-neutral-800 text-[11px]">4. หมายเลขบัญชี</span>
                            <button
                              type="button"
                              onClick={() => updateLayout({ bankAccountNumberBold: !(layoutSettings.bankAccountNumberBold !== false) })}
                              className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors cursor-pointer ${
                                layoutSettings.bankAccountNumberBold !== false
                                  ? 'bg-neutral-900 text-white border-neutral-900'
                                  : 'bg-white text-neutral-600 border-neutral-300 hover:bg-neutral-100'
                              }`}
                            >
                              {layoutSettings.bankAccountNumberBold !== false ? 'ตัวหนา (B)' : 'ปกติ (N)'}
                            </button>
                          </div>
                          <p className="text-[10px] text-neutral-500 mt-0.5">ตัวเลขบัญชีธนาคาร</p>
                        </div>
                        <div className="flex items-center justify-between pt-1 border-t border-neutral-200">
                          <span className="text-[10.5px] text-neutral-600 font-medium">ขนาด:</span>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => updateLayout({ bankAccountNumberFontSize: Math.max(8, (layoutSettings.bankAccountNumberFontSize || layoutSettings.bankFontSize || 10.5) - 0.5) })}
                              className="px-1.5 py-0.5 bg-white border border-neutral-300 rounded text-[9.5px] font-mono cursor-pointer"
                            >
                              -
                            </button>
                            <span className="font-mono font-bold text-neutral-900 bg-white border border-neutral-200 px-1 rounded text-[10.5px]">
                              {layoutSettings.bankAccountNumberFontSize || layoutSettings.bankFontSize || 10.5}px
                            </span>
                            <button
                              type="button"
                              onClick={() => updateLayout({ bankAccountNumberFontSize: Math.min(20, (layoutSettings.bankAccountNumberFontSize || layoutSettings.bankFontSize || 10.5) + 0.5) })}
                              className="px-1.5 py-0.5 bg-white border border-neutral-300 rounded text-[9.5px] font-mono cursor-pointer"
                            >
                              +
                            </button>
                            <button
                              type="button"
                              onClick={() => updateLayout({ bankAccountNumberFontSize: undefined })}
                              className="text-[9px] text-blue-600 hover:underline px-0.5 cursor-pointer"
                              title="ให้ขนาดเท่ากับข้อความอื่นพอดี"
                            >
                              เท่ากัน
                            </button>
                          </div>
                        </div>
                      </div>

                    </div>
                  </div>

                  {/* QR Code Size & Payment Box Height */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-neutral-100">
                    <div>
                      <div className="flex justify-between items-center text-[11px] mb-1">
                        <label className="font-semibold text-neutral-700 flex items-center gap-1.5">
                          <span>ขนาดตัว QR Code สำหรับชำระเงิน:</span>
                          <button
                            type="button"
                            onClick={() => updateLayout({ autoFitQr: !(layoutSettings.autoFitQr !== false) })}
                            className={`text-[9.5px] px-1.5 py-0.2 rounded font-semibold cursor-pointer border transition-colors ${
                              layoutSettings.autoFitQr !== false
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                : 'bg-neutral-100 text-neutral-600 border-neutral-300'
                            }`}
                            title="สลับระหว่างปรับอัตโนมัติให้พอดีความสูงกล่อง กับ กำหนดขนาดเอง"
                          >
                            {layoutSettings.autoFitQr !== false ? '✨ พอดีความสูงอัตโนมัติ (เปิดอยู่)' : 'กำหนดขนาดเอง'}
                          </button>
                        </label>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => updateLayout({ qrSize: Math.max(36, (layoutSettings.qrSize || 56) - 4), autoFitQr: false })}
                            className="px-1.5 py-0.2 bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 rounded text-[10px] font-mono cursor-pointer"
                          >
                            -4
                          </button>
                          <span className="font-mono font-bold text-amber-800 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded text-[11px]">
                            {layoutSettings.autoFitQr !== false ? 'พอดีกล่อง' : `${layoutSettings.qrSize || 56}px`}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateLayout({ qrSize: Math.min(110, (layoutSettings.qrSize || 56) + 4), autoFitQr: false })}
                            className="px-1.5 py-0.2 bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 rounded text-[10px] font-mono cursor-pointer"
                          >
                            +4
                          </button>
                        </div>
                      </div>
                      <input
                        type="range"
                        min="36"
                        max="110"
                        step="2"
                        value={layoutSettings.qrSize || 56}
                        onChange={(e) => updateLayout({ qrSize: Number(e.target.value), autoFitQr: false })}
                        className="w-full accent-amber-600 cursor-pointer"
                      />
                      <div className="flex flex-wrap items-center gap-1 pt-1">
                        <button
                          type="button"
                          onClick={() => updateLayout({ autoFitQr: true, qrSize: 56 })}
                          className={`text-[9.5px] px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                            layoutSettings.autoFitQr !== false
                              ? 'bg-emerald-700 text-white border-emerald-700 font-bold'
                              : 'bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-100'
                          }`}
                        >
                          ✨ พอดีความสูงกล่องอัตโนมัติ
                        </button>
                        {[
                          { label: 'เล็ก (48px)', val: 48 },
                          { label: '2 ซม. (56px)', val: 56 },
                          { label: '2.5 ซม. (72px)', val: 72 },
                          { label: '3 ซม. (90px)', val: 90 },
                        ].map((item) => (
                          <button
                            key={item.val}
                            type="button"
                            onClick={() => updateLayout({ qrSize: item.val, autoFitQr: false })}
                            className={`text-[9.5px] px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                              layoutSettings.autoFitQr === false && (layoutSettings.qrSize || 56) === item.val
                                ? 'bg-amber-800 text-white border-amber-800 font-bold'
                                : 'bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-100'
                            }`}
                          >
                            {item.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Payment Box Height Controller */}
                    <div>
                      <div className="flex justify-between items-center text-[11px] mb-1">
                        <span className="font-semibold text-neutral-700">ความสูงช่องชำระเงิน (Box Height):</span>
                        <span className="font-mono font-bold text-neutral-900 bg-neutral-50 border border-neutral-200 px-2 py-0.2 rounded text-[10.5px]">
                          {Math.round(layoutSettings.paymentBoxHeight || 75.6)}px (~{((layoutSettings.paymentBoxHeight || 75.6) / 37.795).toFixed(1)} ซม.)
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-1">
                        <button
                          type="button"
                          onClick={() => updateLayout({ paymentBoxHeight: 75.6, qrSize: 56, autoFitQr: true })}
                          className={`text-[10px] px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                            Math.abs((layoutSettings.paymentBoxHeight || 75.6) - 75.6) < 1
                              ? 'bg-neutral-900 text-white border-neutral-900 font-bold'
                              : 'bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-100'
                          }`}
                        >
                          2 ซม. (มาตรฐาน)
                        </button>
                        <button
                          type="button"
                          onClick={() => updateLayout({ paymentBoxHeight: 94.5, qrSize: 72, autoFitQr: true })}
                          className={`text-[10px] px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                            Math.abs((layoutSettings.paymentBoxHeight || 75.6) - 94.5) < 1
                              ? 'bg-neutral-900 text-white border-neutral-900 font-bold'
                              : 'bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-100'
                          }`}
                        >
                          2.5 ซม.
                        </button>
                        <button
                          type="button"
                          onClick={() => updateLayout({ paymentBoxHeight: 113.4, qrSize: 90, autoFitQr: true })}
                          className={`text-[10px] px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                            Math.abs((layoutSettings.paymentBoxHeight || 75.6) - 113.4) < 1
                              ? 'bg-neutral-900 text-white border-neutral-900 font-bold'
                              : 'bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-100'
                          }`}
                        >
                          3 ซม.
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3 pt-3 border-t border-neutral-200">

                <div className="flex flex-wrap items-center justify-between gap-1">
                  <div className="flex items-center gap-1.5 font-semibold text-neutral-800 text-xs">
                    <PenTool className="w-3.5 h-3.5 text-neutral-800" />
                    <span>ข้อมูลผู้ลงนาม & รูปภาพลายเซ็น (Signatures & Approval Setup)</span>
                  </div>
                  <span className="text-[11px] text-neutral-500">
                    💡 หากอัปโหลดรูปลายเซ็น ระบบจะแสดงภาพลายเซ็นแทนตัวหนังสือชื่อในเอกสาร A4 ทันที
                  </span>
                </div>

                {/* Signature Image Height & Grid Layout Controller Bar */}
                <div className="p-3 bg-neutral-50/90 border border-neutral-200 rounded-xl space-y-2.5 text-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[11.5px] font-semibold text-neutral-700 whitespace-nowrap flex items-center gap-1">
                        📏 ขนาดความสูงช่องลายเซ็น:
                      </span>
                      <span className="font-mono font-bold text-neutral-900 bg-white border border-neutral-200 px-2 py-0.5 rounded text-xs">
                        {layoutSettings.signatureHeight || 32}px
                      </span>
                    </div>
                    <div className="flex items-center gap-3 flex-1 max-w-md">
                      <input
                        type="range"
                        min="20"
                        max="64"
                        value={layoutSettings.signatureHeight || 32}
                        onChange={(e) => updateLayout({ signatureHeight: Number(e.target.value) })}
                        className="w-full accent-neutral-900 cursor-pointer"
                      />
                      <div className="flex items-center gap-1 shrink-0">
                        {[
                          { label: 'เล็ก', val: 24 },
                          { label: 'ปกติ', val: 32 },
                          { label: 'ขยาย', val: 40 },
                          { label: 'ใหญ่', val: 48 },
                        ].map((item) => (
                          <button
                            key={item.val}
                            type="button"
                            onClick={() => updateLayout({ signatureHeight: item.val })}
                            className={`px-2 py-0.5 text-[10.5px] rounded border font-medium transition-colors ${
                              (layoutSettings.signatureHeight || 32) === item.val
                                ? 'bg-neutral-900 text-white border-neutral-900'
                                : 'bg-white text-neutral-600 border-neutral-300 hover:bg-neutral-100'
                            }`}
                          >
                            {item.label} ({item.val}px)
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Grid Columns Layout Selector */}
                  <div className="pt-2 border-t border-neutral-200/80 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[11.5px] font-semibold text-neutral-700">
                        📐 การจัดวางคอลัมน์ตารางลายเซ็น (Signature Columns Layout):
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      {[
                        { id: 'auto', label: 'อัตโนมัติ (Auto)' },
                        { id: 2, label: '2 คอลัมน์' },
                        { id: 3, label: '3 คอลัมน์' },
                        { id: 4, label: '4 คอลัมน์' },
                      ].map((colOpt) => {
                        const isSelected = (layoutSettings.signatureGridCols || 'auto') === colOpt.id;
                        return (
                          <button
                            key={colOpt.label}
                            type="button"
                            onClick={() => updateLayout({ signatureGridCols: colOpt.id as any })}
                            className={`px-2.5 py-1 text-[11px] rounded-md font-medium border transition-colors ${
                              isSelected
                                ? 'bg-neutral-900 text-white border-neutral-900 font-bold shadow-2xs'
                                : 'bg-white text-neutral-700 border-neutral-300 hover:bg-neutral-100'
                            }`}
                          >
                            {colOpt.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 text-xs">
                  {/* Card 1: Received By / Customer Signature (Image 2) */}
                  <div className={`p-3 rounded-lg border transition-all flex flex-col justify-between space-y-2.5 ${
                    receivedByEnabled ? 'bg-neutral-50/80 border-neutral-300' : 'bg-neutral-100/50 border-neutral-200 opacity-60'
                  }`}>
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="flex items-center gap-1.5 cursor-pointer font-semibold text-neutral-800 text-[11.5px]">
                          <input
                            type="checkbox"
                            checked={receivedByEnabled}
                            onChange={(e) => setReceivedByEnabled(e.target.checked)}
                            className="rounded text-neutral-900 focus:ring-0 w-3.5 h-3.5 cursor-pointer"
                          />
                          <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                          <span>1. ผู้รับบริการ (Received By)</span>
                        </label>
                        <span className={`text-[10px] px-1.5 py-0.2 rounded font-medium border ${
                          receivedByMode === 'handwrite'
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : receivedBySignatureUrl
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-neutral-100 text-neutral-600 border-neutral-200'
                        }`}>
                          {receivedByMode === 'handwrite' ? '✍️ เซ็นสด' : receivedBySignatureUrl ? '🖼️ มีภาพ' : '📝 พิมพ์ชื่อ'}
                        </span>
                      </div>

                      {/* Custom Title / Role */}
                      <div className="mb-1.5">
                        <label className="block text-[10px] text-neutral-500 font-medium mb-0.5">
                          ข้อความตำแหน่ง/หัวข้อ:
                        </label>
                        <input
                          type="text"
                          value={receivedByTitle}
                          onChange={(e) => setReceivedByTitle(e.target.value)}
                          placeholder="เช่น ผู้รับบริการ/Received By"
                          className="w-full px-2 py-1 bg-white border border-neutral-300 rounded text-xs text-neutral-800 font-medium"
                        />
                      </div>

                      {/* Signer Name Input */}
                      <div className="mb-2">
                        <label className="block text-[10px] text-neutral-500 font-medium mb-0.5">
                          ชื่อผู้รับบริการ (ในวงเล็บ):
                        </label>
                        <input
                          type="text"
                          value={receivedByName}
                          onChange={(e) => setReceivedByName(e.target.value)}
                          placeholder="เช่น คุณดนยา โอฬาริกเดช หรือเว้นว่าง..."
                          className="w-full px-2.5 py-1.5 border border-neutral-300 rounded-md bg-white text-xs font-semibold text-neutral-900 focus:ring-1 focus:ring-neutral-800"
                        />
                      </div>

                      {/* Mode Switcher */}
                      <div className="mb-2">
                        <label className="block text-[10px] text-neutral-500 font-medium mb-0.5">
                          รูปแบบการลงนาม:
                        </label>
                        <div className="grid grid-cols-3 gap-1 bg-neutral-200/60 p-0.5 rounded-md">
                          <button
                            type="button"
                            onClick={() => setReceivedByMode('handwrite')}
                            className={`py-1 text-[10px] rounded font-medium transition-all ${
                              receivedByMode === 'handwrite'
                                ? 'bg-white text-neutral-900 font-bold shadow-2xs'
                                : 'text-neutral-600 hover:text-neutral-900'
                            }`}
                          >
                            ✍️ เซ็นสด
                          </button>
                          <button
                            type="button"
                            onClick={() => setReceivedByMode('image')}
                            className={`py-1 text-[10px] rounded font-medium transition-all ${
                              receivedByMode === 'image'
                                ? 'bg-white text-neutral-900 font-bold shadow-2xs'
                                : 'text-neutral-600 hover:text-neutral-900'
                            }`}
                          >
                            🖼️ ใส่ภาพ
                          </button>
                          <button
                            type="button"
                            onClick={() => setReceivedByMode('text')}
                            className={`py-1 text-[10px] rounded font-medium transition-all ${
                              receivedByMode === 'text'
                                ? 'bg-white text-neutral-900 font-bold shadow-2xs'
                                : 'text-neutral-600 hover:text-neutral-900'
                            }`}
                          >
                            📝 พิมพ์ชื่อ
                          </button>
                        </div>
                      </div>

                      {/* Signature Image Box if image mode */}
                      <input
                        type="file"
                        ref={receivedBySigInputRef}
                        onChange={(e) => {
                          handleSignatureUpload(setReceivedBySignatureUrl, e);
                          setReceivedByMode('image');
                        }}
                        accept="image/png,image/jpeg,image/webp,image/svg+xml"
                        className="hidden"
                      />

                      {receivedByMode === 'image' && (
                        <div className="mb-2">
                          {receivedBySignatureUrl ? (
                            <div className="relative bg-white border border-neutral-200 rounded-md p-1.5 flex flex-col items-center justify-center">
                              <img
                                src={receivedBySignatureUrl}
                                alt="Received Signature"
                                className="h-10 max-w-full object-contain"
                              />
                              <div className="flex flex-wrap items-center gap-1 mt-1.5 w-full">
                                <button
                                  type="button"
                                  onClick={() => receivedBySigInputRef.current?.click()}
                                  className="flex-1 text-[10px] py-0.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded text-center"
                                >
                                  เปลี่ยนภาพ
                                </button>
                                <button
                                  type="button"
                                  onClick={async () => {
                                    try {
                                      const inverted = await invertSignatureImage(receivedBySignatureUrl);
                                      setReceivedBySignatureUrl(inverted);
                                    } catch (e) {}
                                  }}
                                  className="px-1.5 py-0.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded text-[9.5px]"
                                  title="สลับสี (ขาว/ดำ)"
                                >
                                  🔄 สลับสี
                                </button>
                                <button
                                  type="button"
                                  onClick={async () => {
                                    try {
                                      const cleaned = await processSignatureDataUrl(receivedBySignatureUrl, { removeWhiteBg: true });
                                      setReceivedBySignatureUrl(cleaned);
                                    } catch (e) {}
                                  }}
                                  className="px-1.5 py-0.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded text-[9.5px]"
                                  title="ลบพื้นหลังขาว/เทาให้โปร่งใส"
                                >
                                  ✨ ตัดพื้นหลัง
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setReceivedBySignatureUrl('');
                                    setReceivedByMode('handwrite');
                                  }}
                                  className="px-1.5 py-0.5 bg-red-50 hover:bg-red-100 text-red-600 rounded text-[10px]"
                                  title="ลบภาพและเปลี่ยนเป็นเว้นเขียนสด"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => receivedBySigInputRef.current?.click()}
                              className="w-full py-1.5 px-2 border border-dashed border-neutral-300 hover:border-neutral-500 rounded-md bg-white text-neutral-600 flex items-center justify-center gap-1 text-[10.5px]"
                            >
                              <Upload className="w-3 h-3 text-neutral-500" />
                              <span>อัปโหลดภาพลายเซ็น</span>
                            </button>
                          )}
                        </div>
                      )}

                      {/* Date input */}
                      <div className="pt-1.5 border-t border-neutral-200/60">
                        <div className="flex items-center justify-between mb-0.5 text-[10px] text-neutral-500">
                          <span>วันที่ลงนาม (Date):</span>
                          <div className="flex gap-1">
                            <button
                              type="button"
                              onClick={() => setReceivedByDate(new Date().toISOString().split('T')[0])}
                              className="text-[9.5px] text-blue-600 hover:underline"
                            >
                              วันนี้
                            </button>
                            <span className="text-neutral-300">|</span>
                            <button
                              type="button"
                              onClick={() => setReceivedByDate('')}
                              className="text-[9.5px] text-neutral-400 hover:text-neutral-600"
                            >
                              เว้นว่าง
                            </button>
                          </div>
                        </div>
                        <input
                          type="date"
                          value={receivedByDate}
                          onChange={(e) => setReceivedByDate(e.target.value)}
                          className="w-full px-2 py-1 bg-white border border-neutral-300 rounded text-xs font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Card 2: Prepared By */}
                  <div className={`p-3 rounded-lg border transition-all flex flex-col justify-between space-y-2.5 ${
                    preparedByEnabled ? 'bg-neutral-50/80 border-neutral-300' : 'bg-neutral-100/50 border-neutral-200 opacity-60'
                  }`}>
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="flex items-center gap-1.5 cursor-pointer font-semibold text-neutral-800 text-[11.5px]">
                          <input
                            type="checkbox"
                            checked={preparedByEnabled}
                            onChange={(e) => setPreparedByEnabled(e.target.checked)}
                            className="rounded text-neutral-900 focus:ring-0 w-3.5 h-3.5 cursor-pointer"
                          />
                          <UserCheck className="w-3.5 h-3.5 text-neutral-700" />
                          <span>2. ผู้จัดทำ (Prepared By)</span>
                        </label>
                        <span className={`text-[10px] px-1.5 py-0.2 rounded font-medium border ${
                          preparedByMode === 'handwrite'
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : preparedBySignatureUrl
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-neutral-100 text-neutral-600 border-neutral-200'
                        }`}>
                          {preparedByMode === 'handwrite' ? '✍️ เซ็นสด' : preparedBySignatureUrl ? '🖼️ มีภาพ' : '📝 พิมพ์ชื่อ'}
                        </span>
                      </div>

                      {/* Title input */}
                      <div className="mb-1.5">
                        <label className="block text-[10px] text-neutral-500 font-medium mb-0.5">
                          ข้อความตำแหน่ง/หัวข้อ:
                        </label>
                        <input
                          type="text"
                          value={preparedByTitle}
                          onChange={(e) => setPreparedByTitle(e.target.value)}
                          className="w-full px-2 py-1 bg-white border border-neutral-300 rounded text-xs text-neutral-800 font-medium"
                        />
                      </div>

                      {/* Preset Dropdown with Manage Button */}
                      <div className="mb-1.5">
                        <div className="flex items-center justify-between mb-0.5">
                          <label className="block text-[10px] text-neutral-500 font-medium">
                            เลือกจากรายชื่อมาตรฐาน:
                          </label>
                          <button
                            type="button"
                            onClick={() => setIsManagePreparedByModalOpen(true)}
                            className="text-[9.5px] text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-0.5 font-medium cursor-pointer"
                            title="แก้ไขชื่อ, ลายเซ็น, ลบชื่อที่ไม่ต้องการ, หรือเพิ่มคนใหม่"
                          >
                            <Settings className="w-2.5 h-2.5" />
                            <span>จัดการ/ลบรายชื่อ</span>
                          </button>
                        </div>
                        <select
                          value={
                            preparedByPresets.some((p) => p.name === preparedBy)
                              ? preparedBy
                              : findPreparedPreset(preparedBy, preparedByPresets)?.name || 'custom'
                          }
                          onChange={(e) => handleSelectPreparedByPreset(e.target.value)}
                          className="w-full px-2 py-1 bg-white border border-neutral-300 rounded text-xs text-neutral-800 focus:ring-1 focus:ring-neutral-800 font-medium cursor-pointer"
                        >
                          {preparedByPresets.map((preset) => (
                            <option key={preset.name} value={preset.name}>
                              {preset.name} {preset.role ? `(${preset.role})` : ''}
                            </option>
                          ))}
                          <option value="custom">➕ พิมพ์กำหนดชื่อเอง...</option>
                        </select>
                      </div>

                      {/* Custom/Editable Name Input */}
                      <div className="mb-2">
                        <label className="block text-[10px] text-neutral-500 font-medium mb-0.5">
                          ชื่อที่แสดงในเอกสาร:
                        </label>
                        <input
                          type="text"
                          value={preparedBy}
                          onChange={(e) => setPreparedBy(e.target.value)}
                          placeholder="พิมพ์ชื่อ-นามสกุล..."
                          className="w-full px-2.5 py-1.5 border border-neutral-300 rounded-md bg-white text-xs focus:ring-1 focus:ring-neutral-800"
                        />
                      </div>

                      {/* Mode Switcher */}
                      <div className="mb-2">
                        <label className="block text-[10px] text-neutral-500 font-medium mb-0.5">
                          รูปแบบการลงนาม:
                        </label>
                        <div className="grid grid-cols-3 gap-1 bg-neutral-200/60 p-0.5 rounded-md">
                          <button
                            type="button"
                            onClick={() => setPreparedByMode('handwrite')}
                            className={`py-1 text-[10px] rounded font-medium transition-all ${
                              preparedByMode === 'handwrite'
                                ? 'bg-white text-neutral-900 font-bold shadow-2xs'
                                : 'text-neutral-600 hover:text-neutral-900'
                            }`}
                          >
                            ✍️ เซ็นสด
                          </button>
                          <button
                            type="button"
                            onClick={() => setPreparedByMode('image')}
                            className={`py-1 text-[10px] rounded font-medium transition-all ${
                              preparedByMode === 'image'
                                ? 'bg-white text-neutral-900 font-bold shadow-2xs'
                                : 'text-neutral-600 hover:text-neutral-900'
                            }`}
                          >
                            🖼️ ใส่ภาพ
                          </button>
                          <button
                            type="button"
                            onClick={() => setPreparedByMode('text')}
                            className={`py-1 text-[10px] rounded font-medium transition-all ${
                              preparedByMode === 'text'
                                ? 'bg-white text-neutral-900 font-bold shadow-2xs'
                                : 'text-neutral-600 hover:text-neutral-900'
                            }`}
                          >
                            📝 พิมพ์ชื่อ
                          </button>
                        </div>
                      </div>

                      {/* Signature Image Box */}
                      <input
                        type="file"
                        ref={preparedBySigInputRef}
                        onChange={(e) => {
                          handleSignatureUpload(
                            (url) => {
                              setPreparedBySignatureUrl(url);
                              saveStaffSignature(preparedBy, url);
                            },
                            e,
                            () => setPreparedByMode('image')
                          );
                          setPreparedByMode('image');
                        }}
                        accept="image/png,image/jpeg,image/webp,image/svg+xml"
                        className="hidden"
                      />

                      {preparedByMode === 'image' && (
                        <div className="mb-2">
                          {preparedBySignatureUrl ? (
                            <div className="relative bg-white border border-neutral-200 rounded-md p-2 flex flex-col items-center justify-center">
                              <img
                                src={preparedBySignatureUrl}
                                alt="Prepared Signature"
                                className="h-11 max-w-full object-contain"
                              />
                              <div className="flex flex-wrap items-center gap-1 mt-1.5 w-full">
                                <button
                                  type="button"
                                  onClick={() => preparedBySigInputRef.current?.click()}
                                  className="flex-1 text-[10px] py-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded text-center font-medium transition-colors"
                                >
                                  เปลี่ยนภาพ
                                </button>
                                <button
                                  type="button"
                                  onClick={async () => {
                                    try {
                                      const blue = await convertToBlueInk(preparedBySignatureUrl);
                                      setPreparedBySignatureUrl(blue);
                                    } catch (e) {}
                                  }}
                                  className="px-1.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded text-[10px] font-bold"
                                  title="เปลี่ยนเป็นสีหมึกน้ำเงิน (Blue Pen Ink)"
                                >
                                  🔵 หมึกน้ำเงิน
                                </button>
                                <button
                                  type="button"
                                  onClick={async () => {
                                    try {
                                      const black = await convertToBlackInk(preparedBySignatureUrl);
                                      setPreparedBySignatureUrl(black);
                                    } catch (e) {}
                                  }}
                                  className="px-1.5 py-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded text-[10px] font-medium"
                                  title="เปลี่ยนเป็นสีหมึกดำ (Black Ink)"
                                >
                                  ⚫ หมึกดำ
                                </button>
                                <button
                                  type="button"
                                  onClick={async () => {
                                    try {
                                      const cleaned = await processSignatureDataUrl(preparedBySignatureUrl, { removeWhiteBg: true, convertToBlue: true });
                                      setPreparedBySignatureUrl(cleaned);
                                    } catch (e) {}
                                  }}
                                  className="px-1.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded text-[10px] font-medium"
                                  title="ลบพื้นหลังขาว/เทาให้โปร่งใส"
                                >
                                  ✨ ตัดพื้นหลัง
                                </button>
                                <button
                                  type="button"
                                  onClick={async () => {
                                    try {
                                      const inverted = await invertSignatureImage(preparedBySignatureUrl);
                                      setPreparedBySignatureUrl(inverted);
                                    } catch (e) {}
                                  }}
                                  className="px-1.5 py-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded text-[10px] font-medium"
                                  title="สลับสี (กรณีภาพเป็นสีขาวบนพื้นดำ)"
                                >
                                  🔄 สลับสี
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setPreparedBySignatureUrl('')}
                                  className="px-2 py-1 bg-red-50 hover:bg-red-100 text-red-600 rounded text-[10px] font-medium transition-colors"
                                  title="ลบรูปลายเซ็นและกลับไปใช้ข้อความชื่อ"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-1">
                              <button
                                type="button"
                                onClick={() => preparedBySigInputRef.current?.click()}
                                className="w-full py-2 px-2 border border-dashed border-neutral-300 hover:border-neutral-500 rounded-md bg-white hover:bg-neutral-50 text-neutral-600 flex items-center justify-center gap-1.5 transition-colors text-[11px]"
                              >
                                <Upload className="w-3.5 h-3.5 text-neutral-500" />
                                <span>อัปโหลดรูปลายเซ็น</span>
                              </button>
                              {findPreparedPreset(preparedBy) && (
                                <button
                                  type="button"
                                  onClick={async () => {
                                    const preset = findPreparedPreset(preparedBy);
                                    if (preset) {
                                      try {
                                        const processed = await processSignatureDataUrl(preset.signatureUrl, { convertToBlue: true });
                                        setPreparedBySignatureUrl(processed);
                                      } catch (e) {
                                        setPreparedBySignatureUrl(preset.signatureUrl);
                                      }
                                      setPreparedByMode('image');
                                    }
                                  }}
                                  className="w-full py-1 text-[10.5px] text-blue-600 hover:text-blue-800 hover:underline font-medium text-center"
                                >
                                  ⚡ โหลดรูปลายเซ็น Preset ของ {preparedBy}
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Date input */}
                      <div className="pt-1.5 border-t border-neutral-200/60">
                        <div className="flex items-center justify-between mb-0.5 text-[10px] text-neutral-500">
                          <span>วันที่ลงนาม (Date):</span>
                          <div className="flex gap-1">
                            <button
                              type="button"
                              onClick={() => setPreparedByDate(new Date().toISOString().split('T')[0])}
                              className="text-[9.5px] text-blue-600 hover:underline"
                            >
                              วันนี้
                            </button>
                            <span className="text-neutral-300">|</span>
                            <button
                              type="button"
                              onClick={() => setPreparedByDate('')}
                              className="text-[9.5px] text-neutral-400 hover:text-neutral-600"
                            >
                              เว้นว่าง
                            </button>
                          </div>
                        </div>
                        <input
                          type="date"
                          value={preparedByDate}
                          onChange={(e) => setPreparedByDate(e.target.value)}
                          className="w-full px-2 py-1 bg-white border border-neutral-300 rounded text-xs font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Card 3: Approved By */}
                  <div className={`p-3 rounded-lg border transition-all flex flex-col justify-between space-y-2.5 ${
                    approvedByEnabled ? 'bg-neutral-50/80 border-neutral-300' : 'bg-neutral-100/50 border-neutral-200 opacity-60'
                  }`}>
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="flex items-center gap-1.5 cursor-pointer font-semibold text-neutral-800 text-[11.5px]">
                          <input
                            type="checkbox"
                            checked={approvedByEnabled}
                            onChange={(e) => setApprovedByEnabled(e.target.checked)}
                            className="rounded text-neutral-900 focus:ring-0 w-3.5 h-3.5 cursor-pointer"
                          />
                          <UserCheck className="w-3.5 h-3.5 text-neutral-700" />
                          <span>3. ผู้ตรวจสอบ (Approved By)</span>
                        </label>
                        <span className={`text-[10px] px-1.5 py-0.2 rounded font-medium border ${
                          approvedByMode === 'handwrite'
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : approvedBySignatureUrl
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-neutral-100 text-neutral-600 border-neutral-200'
                        }`}>
                          {approvedByMode === 'handwrite' ? '✍️ เซ็นสด' : approvedBySignatureUrl ? '🖼️ มีภาพ' : '📝 พิมพ์ชื่อ'}
                        </span>
                      </div>

                      {/* Title input */}
                      <div className="mb-1.5">
                        <label className="block text-[10px] text-neutral-500 font-medium mb-0.5">
                          ข้อความตำแหน่ง/หัวข้อ:
                        </label>
                        <input
                          type="text"
                          value={approvedByTitle}
                          onChange={(e) => setApprovedByTitle(e.target.value)}
                          className="w-full px-2 py-1 bg-white border border-neutral-300 rounded text-xs text-neutral-800 font-medium"
                        />
                      </div>

                      {/* Preset Dropdown */}
                      <div className="mb-1.5">
                        <label className="block text-[10px] text-neutral-500 font-medium mb-0.5">
                          เลือกจากรายชื่อมาตรฐาน (Preset):
                        </label>
                        <select
                          value={
                            PRESET_APPROVED_BY.some((p) => p.name === approvedBy)
                              ? approvedBy
                              : 'custom'
                          }
                          onChange={(e) => handleSelectApprovedByPreset(e.target.value)}
                          className="w-full px-2 py-1 bg-white border border-neutral-300 rounded text-xs text-neutral-800 focus:ring-1 focus:ring-neutral-800 font-medium cursor-pointer"
                        >
                          {PRESET_APPROVED_BY.map((preset) => (
                            <option key={preset.name} value={preset.name}>
                              {preset.name} {preset.role ? `(${preset.role})` : ''}
                            </option>
                          ))}
                          <option value="custom">➕ พิมพ์กำหนดชื่อเอง...</option>
                        </select>
                      </div>

                      {/* Custom/Editable Name Input */}
                      <div className="mb-2">
                        <label className="block text-[10px] text-neutral-500 font-medium mb-0.5">
                          ชื่อที่แสดงในเอกสาร:
                        </label>
                        <input
                          type="text"
                          value={approvedBy}
                          onChange={(e) => setApprovedBy(e.target.value)}
                          placeholder="พิมพ์ชื่อ-นามสกุล..."
                          className="w-full px-2.5 py-1.5 border border-neutral-300 rounded-md bg-white text-xs focus:ring-1 focus:ring-neutral-800"
                        />
                      </div>

                      {/* Mode Switcher */}
                      <div className="mb-2">
                        <label className="block text-[10px] text-neutral-500 font-medium mb-0.5">
                          รูปแบบการลงนาม:
                        </label>
                        <div className="grid grid-cols-3 gap-1 bg-neutral-200/60 p-0.5 rounded-md">
                          <button
                            type="button"
                            onClick={() => setApprovedByMode('handwrite')}
                            className={`py-1 text-[10px] rounded font-medium transition-all ${
                              approvedByMode === 'handwrite'
                                ? 'bg-white text-neutral-900 font-bold shadow-2xs'
                                : 'text-neutral-600 hover:text-neutral-900'
                            }`}
                          >
                            ✍️ เซ็นสด
                          </button>
                          <button
                            type="button"
                            onClick={() => setApprovedByMode('image')}
                            className={`py-1 text-[10px] rounded font-medium transition-all ${
                              approvedByMode === 'image'
                                ? 'bg-white text-neutral-900 font-bold shadow-2xs'
                                : 'text-neutral-600 hover:text-neutral-900'
                            }`}
                          >
                            🖼️ ใส่ภาพ
                          </button>
                          <button
                            type="button"
                            onClick={() => setApprovedByMode('text')}
                            className={`py-1 text-[10px] rounded font-medium transition-all ${
                              approvedByMode === 'text'
                                ? 'bg-white text-neutral-900 font-bold shadow-2xs'
                                : 'text-neutral-600 hover:text-neutral-900'
                            }`}
                          >
                            📝 พิมพ์ชื่อ
                          </button>
                        </div>
                      </div>

                      {/* Signature Image Box */}
                      <input
                        type="file"
                        ref={approvedBySigInputRef}
                        onChange={(e) => {
                          handleSignatureUpload(setApprovedBySignatureUrl, e, () => setApprovedByMode('image'));
                          setApprovedByMode('image');
                        }}
                        accept="image/png,image/jpeg,image/webp,image/svg+xml"
                        className="hidden"
                      />

                      {approvedByMode === 'image' && (
                        <div className="mb-2">
                          {approvedBySignatureUrl ? (
                            <div className="relative bg-white border border-neutral-200 rounded-md p-2 flex flex-col items-center justify-center">
                              <img
                                src={approvedBySignatureUrl}
                                alt="Approved Signature"
                                className="h-11 max-w-full object-contain"
                              />
                              <div className="flex flex-wrap items-center gap-1 mt-1.5 w-full">
                                <button
                                  type="button"
                                  onClick={() => approvedBySigInputRef.current?.click()}
                                  className="flex-1 text-[10px] py-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded text-center font-medium transition-colors"
                                >
                                  เปลี่ยนภาพ
                                </button>
                                <button
                                  type="button"
                                  onClick={async () => {
                                    try {
                                      const blue = await convertToBlueInk(approvedBySignatureUrl);
                                      setApprovedBySignatureUrl(blue);
                                    } catch (e) {}
                                  }}
                                  className="px-1.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded text-[10px] font-bold"
                                  title="เปลี่ยนเป็นสีหมึกน้ำเงิน (Blue Pen Ink)"
                                >
                                  🔵 หมึกน้ำเงิน
                                </button>
                                <button
                                  type="button"
                                  onClick={async () => {
                                    try {
                                      const black = await convertToBlackInk(approvedBySignatureUrl);
                                      setApprovedBySignatureUrl(black);
                                    } catch (e) {}
                                  }}
                                  className="px-1.5 py-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded text-[10px] font-medium"
                                  title="เปลี่ยนเป็นสีหมึกดำ (Black Ink)"
                                >
                                  ⚫ หมึกดำ
                                </button>
                                <button
                                  type="button"
                                  onClick={async () => {
                                    try {
                                      const cleaned = await processSignatureDataUrl(approvedBySignatureUrl, { removeWhiteBg: true, convertToBlue: true });
                                      setApprovedBySignatureUrl(cleaned);
                                    } catch (e) {}
                                  }}
                                  className="px-1.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded text-[10px] font-medium"
                                  title="ลบพื้นหลังขาว/เทาให้โปร่งใส"
                                >
                                  ✨ ตัดพื้นหลัง
                                </button>
                                <button
                                  type="button"
                                  onClick={async () => {
                                    try {
                                      const inverted = await invertSignatureImage(approvedBySignatureUrl);
                                      setApprovedBySignatureUrl(inverted);
                                    } catch (e) {}
                                  }}
                                  className="px-1.5 py-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded text-[10px] font-medium"
                                  title="สลับสี (กรณีภาพเป็นสีขาวบนพื้นดำ)"
                                >
                                  🔄 สลับสี
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setApprovedBySignatureUrl('')}
                                  className="px-2 py-1 bg-red-50 hover:bg-red-100 text-red-600 rounded text-[10px] font-medium transition-colors"
                                  title="ลบรูปลายเซ็นและกลับไปใช้ข้อความชื่อ"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-1">
                              <button
                                type="button"
                                onClick={() => approvedBySigInputRef.current?.click()}
                                className="w-full py-2 px-2 border border-dashed border-neutral-300 hover:border-neutral-500 rounded-md bg-white hover:bg-neutral-50 text-neutral-600 flex items-center justify-center gap-1.5 transition-colors text-[11px]"
                              >
                                <Upload className="w-3.5 h-3.5 text-neutral-500" />
                                <span>อัปโหลดรูปลายเซ็น</span>
                              </button>
                              {PRESET_APPROVED_BY.find((p) => p.name === approvedBy) && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const preset = PRESET_APPROVED_BY.find((p) => p.name === approvedBy);
                                    if (preset) setApprovedBySignatureUrl(preset.signatureUrl);
                                  }}
                                  className="w-full py-1 text-[10.5px] text-blue-600 hover:text-blue-800 hover:underline font-medium text-center"
                                >
                                  ⚡ โหลดรูปลายเซ็น Preset ของ {approvedBy}
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Date input */}
                      <div className="pt-1.5 border-t border-neutral-200/60">
                        <div className="flex items-center justify-between mb-0.5 text-[10px] text-neutral-500">
                          <span>วันที่ลงนาม (Date):</span>
                          <div className="flex gap-1">
                            <button
                              type="button"
                              onClick={() => setApprovedByDate(new Date().toISOString().split('T')[0])}
                              className="text-[9.5px] text-blue-600 hover:underline"
                            >
                              วันนี้
                            </button>
                            <span className="text-neutral-300">|</span>
                            <button
                              type="button"
                              onClick={() => setApprovedByDate('')}
                              className="text-[9.5px] text-neutral-400 hover:text-neutral-600"
                            >
                              เว้นว่าง
                            </button>
                          </div>
                        </div>
                        <input
                          type="date"
                          value={approvedByDate}
                          onChange={(e) => setApprovedByDate(e.target.value)}
                          className="w-full px-2 py-1 bg-white border border-neutral-300 rounded text-xs font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Card 4: Authorized Signature */}
                  <div className={`p-3 rounded-lg border transition-all flex flex-col justify-between space-y-2.5 ${
                    authorizedEnabled ? 'bg-neutral-50/80 border-neutral-300' : 'bg-neutral-100/50 border-neutral-200 opacity-60'
                  }`}>
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="flex items-center gap-1.5 cursor-pointer font-semibold text-neutral-800 text-[11.5px]">
                          <input
                            type="checkbox"
                            checked={authorizedEnabled}
                            onChange={(e) => setAuthorizedEnabled(e.target.checked)}
                            className="rounded text-neutral-900 focus:ring-0 w-3.5 h-3.5 cursor-pointer"
                          />
                          <UserCheck className="w-3.5 h-3.5 text-neutral-700" />
                          <span>4. ผู้มีอำนาจลงนาม (Authorized)</span>
                        </label>
                        <span className={`text-[10px] px-1.5 py-0.2 rounded font-medium border ${
                          authorizedMode === 'handwrite'
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : authorizedSignatureUrl
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-neutral-100 text-neutral-600 border-neutral-200'
                        }`}>
                          {authorizedMode === 'handwrite' ? '✍️ เซ็นสด' : authorizedSignatureUrl ? '🖼️ มีภาพ' : '📝 พิมพ์ชื่อ'}
                        </span>
                      </div>

                      {/* Title input */}
                      <div className="mb-1.5">
                        <label className="block text-[10px] text-neutral-500 font-medium mb-0.5">
                          ข้อความตำแหน่ง/หัวข้อ:
                        </label>
                        <input
                          type="text"
                          value={authorizedTitle}
                          onChange={(e) => setAuthorizedTitle(e.target.value)}
                          className="w-full px-2 py-1 bg-white border border-neutral-300 rounded text-xs text-neutral-800 font-medium"
                        />
                      </div>

                      {/* Preset Dropdown */}
                      <div className="mb-1.5">
                        <label className="block text-[10px] text-neutral-500 font-medium mb-0.5">
                          เลือกจากรายชื่อมาตรฐาน (Preset):
                        </label>
                        <select
                          value={
                            PRESET_AUTHORIZED.some((p) => p.name === authorizedName)
                              ? authorizedName
                              : 'custom'
                          }
                          onChange={(e) => handleSelectAuthorizedPreset(e.target.value)}
                          className="w-full px-2 py-1 bg-white border border-neutral-300 rounded text-xs text-neutral-800 focus:ring-1 focus:ring-neutral-800 font-medium cursor-pointer"
                        >
                          {PRESET_AUTHORIZED.map((preset) => (
                            <option key={preset.name} value={preset.name}>
                              {preset.name} {preset.role ? `(${preset.role})` : ''}
                            </option>
                          ))}
                          <option value="custom">➕ พิมพ์กำหนดชื่อเอง...</option>
                        </select>
                      </div>

                      {/* Custom/Editable Name Input */}
                      <div className="mb-2">
                        <label className="block text-[10px] text-neutral-500 font-medium mb-0.5">
                          ชื่อที่แสดงในเอกสาร:
                        </label>
                        <input
                          type="text"
                          value={authorizedName}
                          onChange={(e) => setAuthorizedName(e.target.value)}
                          placeholder="พิมพ์ชื่อ-นามสกุล..."
                          className="w-full px-2.5 py-1.5 border border-neutral-300 rounded-md bg-white text-xs focus:ring-1 focus:ring-neutral-800"
                        />
                      </div>

                      {/* Mode Switcher */}
                      <div className="mb-2">
                        <label className="block text-[10px] text-neutral-500 font-medium mb-0.5">
                          รูปแบบการลงนาม:
                        </label>
                        <div className="grid grid-cols-3 gap-1 bg-neutral-200/60 p-0.5 rounded-md">
                          <button
                            type="button"
                            onClick={() => setAuthorizedMode('handwrite')}
                            className={`py-1 text-[10px] rounded font-medium transition-all ${
                              authorizedMode === 'handwrite'
                                ? 'bg-white text-neutral-900 font-bold shadow-2xs'
                                : 'text-neutral-600 hover:text-neutral-900'
                            }`}
                          >
                            ✍️ เซ็นสด
                          </button>
                          <button
                            type="button"
                            onClick={() => setAuthorizedMode('image')}
                            className={`py-1 text-[10px] rounded font-medium transition-all ${
                              authorizedMode === 'image'
                                ? 'bg-white text-neutral-900 font-bold shadow-2xs'
                                : 'text-neutral-600 hover:text-neutral-900'
                            }`}
                          >
                            🖼️ ใส่ภาพ
                          </button>
                          <button
                            type="button"
                            onClick={() => setAuthorizedMode('text')}
                            className={`py-1 text-[10px] rounded font-medium transition-all ${
                              authorizedMode === 'text'
                                ? 'bg-white text-neutral-900 font-bold shadow-2xs'
                                : 'text-neutral-600 hover:text-neutral-900'
                            }`}
                          >
                            📝 พิมพ์ชื่อ
                          </button>
                        </div>
                      </div>

                      {/* Signature Image Box */}
                      <input
                        type="file"
                        ref={authorizedSigInputRef}
                        onChange={(e) => {
                          handleSignatureUpload(setAuthorizedSignatureUrl, e, () => setAuthorizedMode('image'));
                          setAuthorizedMode('image');
                        }}
                        accept="image/png,image/jpeg,image/webp,image/svg+xml"
                        className="hidden"
                      />

                      {authorizedMode === 'image' && (
                        <div className="mb-2">
                          {authorizedSignatureUrl ? (
                            <div className="relative bg-white border border-neutral-200 rounded-md p-2 flex flex-col items-center justify-center">
                              <img
                                src={authorizedSignatureUrl}
                                alt="Authorized Signature"
                                className="h-11 max-w-full object-contain"
                              />
                              <div className="flex flex-wrap items-center gap-1 mt-1.5 w-full">
                                <button
                                  type="button"
                                  onClick={() => authorizedSigInputRef.current?.click()}
                                  className="flex-1 text-[10px] py-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded text-center font-medium transition-colors"
                                >
                                  เปลี่ยนภาพ
                                </button>
                                <button
                                  type="button"
                                  onClick={async () => {
                                    try {
                                      const blue = await convertToBlueInk(authorizedSignatureUrl);
                                      setAuthorizedSignatureUrl(blue);
                                    } catch (e) {}
                                  }}
                                  className="px-1.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded text-[10px] font-bold"
                                  title="เปลี่ยนเป็นสีหมึกน้ำเงิน (Blue Pen Ink)"
                                >
                                  🔵 หมึกน้ำเงิน
                                </button>
                                <button
                                  type="button"
                                  onClick={async () => {
                                    try {
                                      const black = await convertToBlackInk(authorizedSignatureUrl);
                                      setAuthorizedSignatureUrl(black);
                                    } catch (e) {}
                                  }}
                                  className="px-1.5 py-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded text-[10px] font-medium"
                                  title="เปลี่ยนเป็นสีหมึกดำ (Black Ink)"
                                >
                                  ⚫ หมึกดำ
                                </button>
                                <button
                                  type="button"
                                  onClick={async () => {
                                    try {
                                      const cleaned = await processSignatureDataUrl(authorizedSignatureUrl, { removeWhiteBg: true, convertToBlue: true });
                                      setAuthorizedSignatureUrl(cleaned);
                                    } catch (e) {}
                                  }}
                                  className="px-1.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded text-[10px] font-medium"
                                  title="ลบพื้นหลังขาว/เทาให้โปร่งใส"
                                >
                                  ✨ ตัดพื้นหลัง
                                </button>
                                <button
                                  type="button"
                                  onClick={async () => {
                                    try {
                                      const inverted = await invertSignatureImage(authorizedSignatureUrl);
                                      setAuthorizedSignatureUrl(inverted);
                                    } catch (e) {}
                                  }}
                                  className="px-1.5 py-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded text-[10px] font-medium"
                                  title="สลับสี (กรณีภาพเป็นสีขาวบนพื้นดำ)"
                                >
                                  🔄 สลับสี
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setAuthorizedSignatureUrl('')}
                                  className="px-2 py-1 bg-red-50 hover:bg-red-100 text-red-600 rounded text-[10px] font-medium transition-colors"
                                  title="ลบรูปลายเซ็นและกลับไปใช้ข้อความชื่อ"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-1">
                              <button
                                type="button"
                                onClick={() => authorizedSigInputRef.current?.click()}
                                className="w-full py-2 px-2 border border-dashed border-neutral-300 hover:border-neutral-500 rounded-md bg-white hover:bg-neutral-50 text-neutral-600 flex items-center justify-center gap-1.5 transition-colors text-[11px]"
                              >
                                <Upload className="w-3.5 h-3.5 text-neutral-500" />
                                <span>อัปโหลดรูปลายเซ็น</span>
                              </button>
                              {PRESET_AUTHORIZED.find((p) => p.name === authorizedName) && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const preset = PRESET_AUTHORIZED.find((p) => p.name === authorizedName);
                                    if (preset) setAuthorizedSignatureUrl(preset.signatureUrl);
                                  }}
                                  className="w-full py-1 text-[10.5px] text-blue-600 hover:text-blue-800 hover:underline font-medium text-center"
                                >
                                  ⚡ โหลดรูปลายเซ็น Preset ของ {authorizedName}
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Date input */}
                      <div className="pt-1.5 border-t border-neutral-200/60">
                        <div className="flex items-center justify-between mb-0.5 text-[10px] text-neutral-500">
                          <span>วันที่ลงนาม (Date):</span>
                          <div className="flex gap-1">
                            <button
                              type="button"
                              onClick={() => setAuthorizedDate(new Date().toISOString().split('T')[0])}
                              className="text-[9.5px] text-blue-600 hover:underline"
                            >
                              วันนี้
                            </button>
                            <span className="text-neutral-300">|</span>
                            <button
                              type="button"
                              onClick={() => setAuthorizedDate('')}
                              className="text-[9.5px] text-neutral-400 hover:text-neutral-600"
                            >
                              เว้นว่าง
                            </button>
                          </div>
                        </div>
                        <input
                          type="date"
                          value={authorizedDate}
                          onChange={(e) => setAuthorizedDate(e.target.value)}
                          className="w-full px-2 py-1 bg-white border border-neutral-300 rounded text-xs font-mono"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Additional Signature Blocks (ใส่ช่องสำหรับเขียนลายเซ็นเพิ่มเติม) */}
                <div className="mt-4 p-4 bg-amber-50/80 border border-amber-200 rounded-xl space-y-3.5 shadow-2xs">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-200/80 pb-2.5">
                    <div className="flex items-center gap-2">
                      <PenTool className="w-4 h-4 text-amber-700" />
                      <span className="font-bold text-neutral-900 text-xs">
                        ช่องสำหรับเขียนลายเซ็นเพิ่มเติม (Additional Signatures)
                      </span>
                      <span className="text-[10.5px] text-amber-900 bg-amber-200/90 px-2 py-0.5 rounded-full font-bold">
                        {additionalSignatures.length} ช่อง
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        const newSig: AdditionalSignatureItem = {
                          id: `add-sig-${Date.now()}`,
                          title: 'พยาน / ผู้ประสานงาน',
                          name: '',
                          mode: 'handwrite',
                          enabled: true,
                        };
                        setAdditionalSignatures((prev) => [...prev, newSig]);
                      }}
                      className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-xs font-bold shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      + เพิ่มช่องสำหรับเขียนลายเซ็นเพิ่มเติม
                    </button>
                  </div>

                  {/* Quick Role Templates Chips */}
                  <div className="flex flex-wrap items-center gap-1.5 text-xs">
                    <span className="text-[11px] font-semibold text-neutral-600 mr-1 flex items-center gap-1">
                      ⚡ เพิ่มด่วน:
                    </span>
                    {[
                      { title: 'พยาน (Witness)', mode: 'handwrite' as const },
                      { title: 'ผู้อนุมัติโครงการ (Project Approver)', mode: 'handwrite' as const },
                      { title: 'ผู้ประสานงาน (Coordinator)', mode: 'handwrite' as const },
                      { title: 'ผู้สั่งซื้อ / ลูกค้า (Customer Buyer)', mode: 'handwrite' as const },
                      { title: 'ผู้รับมอบอำนาจ (Authorized Representative)', mode: 'handwrite' as const },
                    ].map((tpl) => (
                      <button
                        key={tpl.title}
                        type="button"
                        onClick={() => {
                          const newSig: AdditionalSignatureItem = {
                            id: `add-sig-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
                            title: tpl.title,
                            name: '',
                            mode: tpl.mode,
                            enabled: true,
                          };
                          setAdditionalSignatures((prev) => [...prev, newSig]);
                        }}
                        className="px-2.5 py-1 bg-white hover:bg-amber-100/70 text-neutral-800 border border-amber-300 rounded-md text-[11px] font-medium transition-colors shadow-2xs cursor-pointer flex items-center gap-1"
                      >
                        <span>+ {tpl.title}</span>
                      </button>
                    ))}
                  </div>

                  {additionalSignatures.length === 0 ? (
                    <div className="p-3 bg-white/70 border border-amber-200 rounded-lg text-center text-neutral-600 text-xs italic">
                      ยังไม่มีช่องลายเซ็นเพิ่มเติม (สามารถกดปุ่ม "+ เพิ่มช่องสำหรับเขียนลายเซ็นเพิ่มเติม" หรือเลือกปุ่มเพิ่มด่วนด้านบน เพื่อเพิ่มช่องเซ็นชื่อ พยาน ผู้อนุมัติโครงการ หรือผู้รับบริการร่วมได้ตามต้องการ)
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {additionalSignatures.map((extraSig, idx) => (
                        <div
                          key={extraSig.id || idx}
                          className={`p-3 rounded-lg border shadow-2xs space-y-2.5 relative transition-all ${
                            extraSig.enabled !== false
                              ? 'bg-white border-amber-300'
                              : 'bg-neutral-100 border-neutral-300 opacity-60'
                          }`}
                        >
                          <div className="flex items-center justify-between border-b border-amber-100 pb-1.5">
                            <label className="flex items-center gap-1.5 cursor-pointer text-[11px] font-bold text-amber-950">
                              <input
                                type="checkbox"
                                checked={extraSig.enabled !== false}
                                onChange={(e) => {
                                  const list = [...additionalSignatures];
                                  list[idx] = { ...list[idx], enabled: e.target.checked };
                                  setAdditionalSignatures(list);
                                }}
                                className="rounded text-neutral-900 focus:ring-0 w-3.5 h-3.5 cursor-pointer"
                              />
                              <span>ช่องลายเซ็นเพิ่มเติม #{idx + 1}</span>
                            </label>

                            <div className="flex items-center gap-1">
                              {/* Reorder Buttons */}
                              {idx > 0 && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const list = [...additionalSignatures];
                                    const temp = list[idx - 1];
                                    list[idx - 1] = list[idx];
                                    list[idx] = temp;
                                    setAdditionalSignatures(list);
                                  }}
                                  className="text-neutral-500 hover:text-neutral-900 p-0.5 rounded hover:bg-neutral-100"
                                  title="ย้ายขึ้น"
                                >
                                  <ArrowUp className="w-3.5 h-3.5" />
                                </button>
                              )}
                              {idx < additionalSignatures.length - 1 && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const list = [...additionalSignatures];
                                    const temp = list[idx + 1];
                                    list[idx + 1] = list[idx];
                                    list[idx] = temp;
                                    setAdditionalSignatures(list);
                                  }}
                                  className="text-neutral-500 hover:text-neutral-900 p-0.5 rounded hover:bg-neutral-100"
                                  title="ย้ายลง"
                                >
                                  <ArrowDown className="w-3.5 h-3.5" />
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => {
                                  setAdditionalSignatures((prev) => prev.filter((_, i) => i !== idx));
                                }}
                                className="text-neutral-400 hover:text-rose-600 p-0.5 rounded hover:bg-rose-50 cursor-pointer"
                                title="ลบช่องนี้"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          <div>
                            <label className="block text-[10px] text-neutral-500 font-medium mb-0.5">
                              หัวข้อ / ตำแหน่ง:
                            </label>
                            <input
                              type="text"
                              value={extraSig.title}
                              onChange={(e) => {
                                const list = [...additionalSignatures];
                                list[idx] = { ...list[idx], title: e.target.value };
                                setAdditionalSignatures(list);
                              }}
                              placeholder="เช่น พยาน หรือ ผู้อนุมัติงบประมาณ"
                              className="w-full px-2 py-1 border border-neutral-300 rounded text-xs font-medium"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] text-neutral-500 font-medium mb-0.5">
                              ชื่อ-นามสกุล (ในวงเล็บ):
                            </label>
                            <input
                              type="text"
                              value={extraSig.name || ''}
                              onChange={(e) => {
                                const list = [...additionalSignatures];
                                list[idx] = { ...list[idx], name: e.target.value };
                                setAdditionalSignatures(list);
                              }}
                              placeholder="พิมพ์ชื่อหรือเว้นว่างไว้เขียนสด..."
                              className="w-full px-2 py-1 border border-neutral-300 rounded text-xs font-medium"
                            />
                          </div>

                          {/* Mode Switcher */}
                          <div>
                            <label className="block text-[10px] text-neutral-500 font-medium mb-0.5">
                              รูปแบบการลงนาม:
                            </label>
                            <div className="grid grid-cols-3 gap-1 bg-neutral-100 p-0.5 rounded-md border border-neutral-200">
                              <button
                                type="button"
                                onClick={() => {
                                  const list = [...additionalSignatures];
                                  list[idx] = { ...list[idx], mode: 'handwrite' };
                                  setAdditionalSignatures(list);
                                }}
                                className={`py-1 text-[10px] rounded font-medium transition-all ${
                                  (extraSig.mode || 'handwrite') === 'handwrite'
                                    ? 'bg-white text-neutral-900 font-bold shadow-2xs'
                                    : 'text-neutral-600 hover:text-neutral-900'
                                }`}
                              >
                                ✍️ เซ็นสด
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  const list = [...additionalSignatures];
                                  list[idx] = { ...list[idx], mode: 'image' };
                                  setAdditionalSignatures(list);
                                }}
                                className={`py-1 text-[10px] rounded font-medium transition-all ${
                                  extraSig.mode === 'image'
                                    ? 'bg-white text-neutral-900 font-bold shadow-2xs'
                                    : 'text-neutral-600 hover:text-neutral-900'
                                }`}
                              >
                                🖼️ ใส่ภาพ
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  const list = [...additionalSignatures];
                                  list[idx] = { ...list[idx], mode: 'text' };
                                  setAdditionalSignatures(list);
                                }}
                                className={`py-1 text-[10px] rounded font-medium transition-all ${
                                  extraSig.mode === 'text'
                                    ? 'bg-white text-neutral-900 font-bold shadow-2xs'
                                    : 'text-neutral-600 hover:text-neutral-900'
                                }`}
                              >
                                📝 พิมพ์ชื่อ
                              </button>
                            </div>
                          </div>

                          {/* Image upload box if mode is image */}
                          {extraSig.mode === 'image' && (
                            <div>
                              {extraSig.signatureUrl ? (
                                <div className="relative bg-white border border-neutral-200 rounded-md p-1.5 flex flex-col items-center justify-center">
                                  <img
                                    src={extraSig.signatureUrl}
                                    alt={extraSig.title}
                                    className="h-10 max-w-full object-contain"
                                  />
                                  <div className="flex flex-wrap items-center gap-1 mt-1 w-full">
                                    <label className="flex-1 text-[10px] py-0.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded text-center cursor-pointer">
                                      เปลี่ยนภาพ
                                      <input
                                        type="file"
                                        accept="image/png,image/jpeg,image/webp,image/svg+xml"
                                        className="hidden"
                                        onChange={async (e) => {
                                          const file = e.target.files?.[0];
                                          if (file) {
                                            try {
                                              const cleaned = await processSignatureFile(file);
                                              const list = [...additionalSignatures];
                                              list[idx] = { ...list[idx], signatureUrl: cleaned, mode: 'image' };
                                              setAdditionalSignatures(list);
                                            } catch (err) {
                                              const reader = new FileReader();
                                              reader.onloadend = () => {
                                                const list = [...additionalSignatures];
                                                list[idx] = { ...list[idx], signatureUrl: reader.result as string, mode: 'image' };
                                                setAdditionalSignatures(list);
                                              };
                                              reader.readAsDataURL(file);
                                            }
                                          }
                                        }}
                                      />
                                    </label>
                                    <button
                                      type="button"
                                      onClick={async () => {
                                        try {
                                          const inv = await invertSignatureImage(extraSig.signatureUrl || '');
                                          const list = [...additionalSignatures];
                                          list[idx] = { ...list[idx], signatureUrl: inv };
                                          setAdditionalSignatures(list);
                                        } catch (e) {}
                                      }}
                                      className="px-1.5 py-0.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded text-[9.5px]"
                                      title="สลับสี (ขาว/ดำ)"
                                    >
                                      🔄 สลับสี
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const list = [...additionalSignatures];
                                        list[idx] = { ...list[idx], signatureUrl: '', mode: 'handwrite' };
                                        setAdditionalSignatures(list);
                                      }}
                                      className="px-1.5 py-0.5 bg-red-50 hover:bg-red-100 text-red-600 rounded text-[10px]"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <label className="w-full py-1.5 px-2 border border-dashed border-neutral-300 hover:border-neutral-500 rounded-md bg-neutral-50 text-neutral-600 flex items-center justify-center gap-1 text-[10.5px] cursor-pointer">
                                  <Upload className="w-3 h-3 text-neutral-500" />
                                  <span>อัปโหลดภาพลายเซ็น</span>
                                  <input
                                    type="file"
                                    accept="image/png,image/jpeg,image/webp,image/svg+xml"
                                    className="hidden"
                                    onChange={async (e) => {
                                      const file = e.target.files?.[0];
                                      if (file) {
                                        try {
                                          const cleaned = await processSignatureFile(file);
                                          const list = [...additionalSignatures];
                                          list[idx] = { ...list[idx], signatureUrl: cleaned, mode: 'image' };
                                          setAdditionalSignatures(list);
                                        } catch (err) {
                                          const reader = new FileReader();
                                          reader.onloadend = () => {
                                            const list = [...additionalSignatures];
                                            list[idx] = { ...list[idx], signatureUrl: reader.result as string, mode: 'image' };
                                            setAdditionalSignatures(list);
                                          };
                                          reader.readAsDataURL(file);
                                        }
                                      }
                                    }}
                                  />
                                </label>
                              )}
                            </div>
                          )}

                          {/* Date input */}
                          <div className="pt-1 border-t border-neutral-100">
                            <div className="flex items-center justify-between mb-0.5 text-[10px] text-neutral-500">
                              <span>วันที่ลงนาม:</span>
                              <div className="flex gap-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const list = [...additionalSignatures];
                                    list[idx] = { ...list[idx], date: new Date().toISOString().split('T')[0] };
                                    setAdditionalSignatures(list);
                                  }}
                                  className="text-[9.5px] text-blue-600 hover:underline"
                                >
                                  วันนี้
                                </button>
                                <span className="text-neutral-300">|</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const list = [...additionalSignatures];
                                    list[idx] = { ...list[idx], date: '' };
                                    setAdditionalSignatures(list);
                                  }}
                                  className="text-[9.5px] text-neutral-400 hover:text-neutral-600"
                                >
                                  เว้นว่าง
                                </button>
                              </div>
                            </div>
                            <input
                              type="date"
                              value={extraSig.date || ''}
                              onChange={(e) => {
                                const list = [...additionalSignatures];
                                list[idx] = { ...list[idx], date: e.target.value };
                                setAdditionalSignatures(list);
                              }}
                              className="w-full px-2 py-1 bg-white border border-neutral-300 rounded text-xs font-mono"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Section 7: ข้อกำหนดและค่าปรับ หน้า 2 (Page 2 Annex Customizer) */}
        <div className="bg-white p-4 rounded-xl border border-neutral-200 space-y-3 shadow-2xs">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-neutral-800 flex items-center gap-2">
              <FileText className="w-4 h-4 text-amber-600" />
              <span>ส่วนที่ 7: ข้อกำหนดและค่าปรับ (หน้า 2 / Annex Document)</span>
              <span className="text-[10px] bg-amber-100 text-amber-900 border border-amber-300 font-semibold px-2 py-0.5 rounded-full">
                ปรับแต่งฟอนต์ ขนาด และเนื้อหาได้อิสระ
              </span>
            </h3>
            <button
              type="button"
              onClick={() => setIsAnnexSectionOpen(!isAnnexSectionOpen)}
              className="text-xs text-neutral-600 hover:text-neutral-900 flex items-center gap-1 font-semibold px-2.5 py-1 bg-neutral-100 hover:bg-neutral-200 rounded-md transition-colors cursor-pointer"
            >
              <span>{isAnnexSectionOpen ? 'ซ่อนการปรับแต่ง' : '✏️ เปิดแก้ไขข้อกำหนดหน้า 2'}</span>
              {isAnnexSectionOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>

          {isAnnexSectionOpen && (
            <div className="pt-3 border-t border-neutral-100 space-y-4 text-xs">
              {/* Typography & Page Sizing Toolbar */}
              <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 space-y-3">
                <div className="font-bold text-neutral-800 text-[12px] flex items-center justify-between">
                  <span>🎨 รูปแบบฟอนต์และระยะจัดหน้า 2:</span>
                  <button
                    type="button"
                    onClick={() => {
                      setAnnexConfig({
                        title: 'การให้บริการห้องประชุมอาคารเคเอกซ์',
                        section1Title: '1. เงื่อนไขการใช้บริการห้องประชุมอาคารเคเอกซ์',
                        termsText: DEFAULT_ANNEX_TERMS_TEXT,
                        section2Title: '2. ค่าเช่าอุปกรณ์เสริมสำหรับห้องประชุม',
                        equipmentList: DEFAULT_ANNEX_EQUIPMENT,
                        equipmentNote: 'หมายเหตุ : เนื่องด้วยอุปกรณ์มีจำนวนจำกัด หากลูกค้าต้องการใช้อุปกรณ์เสริมสามารถแจ้งในวันที่ออกใบเสนอราคา',
                        section3Title: '3. ค่าปรับ',
                        finesList: DEFAULT_ANNEX_FINES,
                        fontFamily: 'Sarabun',
                        fontSize: 11.5,
                        paddingTop: 36,
                        paddingBottom: 36,
                        paddingLeft: 44,
                        paddingRight: 44,
                        lineHeight: 'normal',
                        showLogo: true,
                      });
                    }}
                    className="text-[11px] text-red-600 hover:underline cursor-pointer"
                  >
                    ↺ รีเซ็ตกลับเป็นค่าเริ่มต้น KX
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {/* Font Family */}
                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
                      แบบฟอนต์ (Font Family):
                    </label>
                    <select
                      value={annexConfig.fontFamily || 'Sarabun'}
                      onChange={(e) => updateAnnex({ fontFamily: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-white border border-neutral-300 rounded-lg text-xs font-medium focus:ring-1 focus:ring-neutral-800 cursor-pointer"
                    >
                      <option value="Sarabun">Sarabun (สารบรรณ - ทางการ)</option>
                      <option value="Trirong">Trirong (ไตรรงค์ - มีหัว)</option>
                      <option value="Prompt">Prompt (พร้อมท์ - โมเดิร์น)</option>
                      <option value="Kanit">Kanit (คณิต - คมชัด)</option>
                      <option value="Mitr">Mitr (มิตร - สบายตา)</option>
                      <option value="Bai Jamjuree">Bai Jamjuree (จามจุรี)</option>
                      <option value="IBM Plex Sans Thai">IBM Plex Sans Thai</option>
                    </select>
                  </div>

                  {/* Font Size */}
                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
                      ขนาดฟอนต์: <span className="font-mono font-bold text-neutral-900">{annexConfig.fontSize || 11.5}px</span>
                    </label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="range"
                        min="9.5"
                        max="15"
                        step="0.5"
                        value={annexConfig.fontSize || 11.5}
                        onChange={(e) => updateAnnex({ fontSize: Number(e.target.value) })}
                        className="flex-1 accent-neutral-900 cursor-pointer"
                      />
                      <div className="flex gap-1">
                        {[10.5, 11.5, 12.5].map((sz) => (
                          <button
                            key={sz}
                            type="button"
                            onClick={() => updateAnnex({ fontSize: sz })}
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold cursor-pointer ${
                              (annexConfig.fontSize || 11.5) === sz
                                ? 'bg-neutral-900 text-white'
                                : 'bg-white border border-neutral-200 text-neutral-700'
                            }`}
                          >
                            {sz}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Line Spacing */}
                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
                      ระยะห่างบรรทัด:
                    </label>
                    <div className="flex gap-1">
                      {[
                        { id: 'tight', label: 'ชิด' },
                        { id: 'normal', label: 'ปกติ' },
                        { id: 'relaxed', label: 'โปร่ง' },
                      ].map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => updateAnnex({ lineHeight: item.id as any })}
                          className={`flex-1 py-1 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
                            (annexConfig.lineHeight || 'normal') === item.id
                              ? 'bg-neutral-900 text-white'
                              : 'bg-white border border-neutral-200 text-neutral-700 hover:bg-neutral-100'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Show Logo Checkbox */}
                  <div className="flex items-center gap-2 pt-4">
                    <label className="flex items-center gap-2 cursor-pointer font-semibold text-neutral-800 text-[11.5px]">
                      <input
                        type="checkbox"
                        checked={annexConfig.showLogo !== false}
                        onChange={(e) => updateAnnex({ showLogo: e.target.checked })}
                        className="rounded text-neutral-900 focus:ring-0 w-4 h-4 cursor-pointer"
                      />
                      <span>แสดงโลโก้บนหัวเอกสาร</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* 🖼️ แผงควบคุมรูปภาพโลโก้ & ข้อความหัวกระดาษหน้า 2 */}
              <div className="p-4 bg-white border border-neutral-200 rounded-xl space-y-4 shadow-2xs">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-200 pb-2.5">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-blue-600" />
                    <span className="font-bold text-neutral-900 text-xs sm:text-sm">
                      รูปภาพโลโก้ & ข้อความหัวกระดาษหน้า 2 (Header Logo & Custom Texts)
                    </span>
                  </div>
                  <span className="text-[11px] text-neutral-500">
                    💡 ปรับเปลี่ยนรูปภาพ ขนาด ตำแหน่ง และพิมพ์ข้อความหัวกระดาษสำหรับหน้า 2 ได้อย่างอิสระ
                  </span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 text-xs">
                  {/* Left Column: Logo Upload, Sizing & Alignment (6 cols) */}
                  <div className="lg:col-span-6 space-y-3 bg-neutral-50 p-3.5 rounded-xl border border-neutral-200">
                    <div className="flex items-center justify-between">
                      <label className="font-semibold text-neutral-800 flex items-center gap-1.5 text-xs">
                        <ImageIcon className="w-3.5 h-3.5 text-neutral-600" />
                        <span>รูปภาพโลโก้หัวกระดาษหน้า 2:</span>
                      </label>
                      <div className="flex items-center gap-2">
                        <label className="flex items-center gap-1.5 cursor-pointer text-[11px] font-medium text-neutral-700">
                          <input
                            type="checkbox"
                            checked={annexConfig.showLogo !== false}
                            onChange={(e) => updateAnnex({ showLogo: e.target.checked })}
                            className="rounded text-neutral-900 focus:ring-0 w-3.5 h-3.5 cursor-pointer"
                          />
                          <span>แสดงรูปโลโก้</span>
                        </label>
                      </div>
                    </div>

                    {/* Logo Preview and Upload Controls */}
                    <div className="flex items-center gap-3">
                      <div className="w-24 h-18 rounded-lg border-2 border-dashed border-neutral-300 bg-white flex items-center justify-center overflow-hidden p-1 shrink-0 relative group shadow-2xs">
                        {(annexConfig.logoUrl || logoUrl) ? (
                          <>
                            <img
                              src={annexConfig.logoUrl || logoUrl}
                              alt="Logo preview"
                              className="max-h-full max-w-full object-contain"
                            />
                            {annexConfig.logoUrl && (
                              <button
                                type="button"
                                onClick={() => updateAnnex({ logoUrl: '' })}
                                className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white rounded-full p-0.5 hover:bg-rose-600 shadow-xs cursor-pointer"
                                title="ลบภาพโลโก้หน้า 2"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            )}
                          </>
                        ) : (
                          <div className="text-center">
                            <KXLogo size="sm" />
                            <span className="text-[9px] text-neutral-400 block font-medium mt-1">โลโก้ KX</span>
                          </div>
                        )}
                      </div>

                      <div className="flex-1 space-y-1.5">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-md text-xs font-medium transition-colors shadow-2xs">
                            <Upload className="w-3.5 h-3.5" />
                            <span>{annexConfig.logoUrl ? 'เปลี่ยนรูปโลโก้' : 'อัปโหลดรูปโลโก้'}</span>
                            <input
                              ref={annexLogoInputRef}
                              type="file"
                              accept="image/*"
                              onChange={handleAnnexLogoUpload}
                              className="hidden"
                            />
                          </label>

                          {logoUrl && !annexConfig.logoUrl && (
                            <span className="text-[10px] text-blue-700 bg-blue-50 border border-blue-200 px-2 py-1 rounded font-medium">
                              ⚡ ซิงค์รูปเดียวกับหน้า 1
                            </span>
                          )}

                          {logoUrl && annexConfig.logoUrl && (
                            <button
                              type="button"
                              onClick={() => updateAnnex({ logoUrl: logoUrl })}
                              className="px-2 py-1 bg-white hover:bg-neutral-100 text-neutral-700 border border-neutral-300 rounded text-xs transition-colors"
                            >
                              ใช้รูปเดียวกับหน้า 1
                            </button>
                          )}

                          {annexConfig.logoUrl && (
                            <button
                              type="button"
                              onClick={() => updateAnnex({ logoUrl: '' })}
                              className="px-2 py-1 text-neutral-600 hover:text-rose-600 hover:bg-rose-50 border border-neutral-200 rounded text-xs transition-colors"
                            >
                              ใช้โลโก้ KX
                            </button>
                          )}
                        </div>
                        <p className="text-[10px] text-neutral-500 leading-tight">
                          รองรับ PNG, JPG, SVG, WebP (แนะนำไฟล์พื้นหลังโปร่งใส ขนาดไม่เกิน 5MB)
                        </p>

                        {/* Direct URL Input */}
                        <div className="pt-1 flex items-center gap-1.5">
                          <input
                            type="url"
                            value={annexLogoUrlInput}
                            onChange={(e) => setAnnexLogoUrlInput(e.target.value)}
                            placeholder="หรือวางลิงก์รูปภาพ URL..."
                            className="flex-1 px-2 py-1 text-[11px] border border-neutral-300 rounded bg-white font-mono placeholder:text-neutral-400"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if (annexLogoUrlInput.trim()) {
                                updateAnnex({ logoUrl: annexLogoUrlInput.trim(), showLogo: true });
                                setAnnexLogoUrlInput('');
                              }
                            }}
                            disabled={!annexLogoUrlInput.trim()}
                            className="px-2.5 py-1 text-[11px] bg-neutral-800 hover:bg-neutral-900 disabled:opacity-50 text-white rounded font-medium transition-colors shrink-0 cursor-pointer"
                          >
                            ดึงรูปภาพ
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Logo Height Adjustment */}
                    <div className="pt-2 border-t border-neutral-200 space-y-1.5">
                      <div className="flex justify-between items-center text-[11px] text-neutral-700 font-semibold">
                        <span className="flex items-center gap-1">
                          <Maximize2 className="w-3 h-3 text-neutral-500" />
                          <span>ขนาดความสูงโลโก้หน้า 2:</span>
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => updateAnnex({ logoHeight: Math.max(24, (annexConfig.logoHeight || 56) - 2) })}
                            className="px-1 text-[9px] bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 rounded font-mono"
                            title="ลดขนาด 2px"
                          >
                            -2
                          </button>
                          <span className="font-mono font-bold text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.2 rounded text-[11px]">
                            {annexConfig.logoHeight || 56}px
                          </span>
                          <button
                            type="button"
                            onClick={() => updateAnnex({ logoHeight: Math.min(140, (annexConfig.logoHeight || 56) + 2) })}
                            className="px-1 text-[9px] bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 rounded font-mono"
                            title="เพิ่มขนาด 2px"
                          >
                            +2
                          </button>
                        </div>
                      </div>
                      <input
                        type="range"
                        min="24"
                        max="140"
                        value={annexConfig.logoHeight || 56}
                        onChange={(e) => updateAnnex({ logoHeight: Number(e.target.value) })}
                        className="w-full accent-neutral-900 cursor-pointer h-1.5"
                      />
                      <div className="flex items-center justify-between gap-1">
                        {[36, 48, 56, 64, 80, 100, 120].map((sz) => (
                          <button
                            key={sz}
                            type="button"
                            onClick={() => updateAnnex({ logoHeight: sz })}
                            className={`px-1.5 py-0.5 text-[10px] rounded border font-mono transition-colors cursor-pointer ${
                              (annexConfig.logoHeight || 56) === sz
                                ? 'bg-neutral-900 text-white border-neutral-900 font-bold'
                                : 'bg-white text-neutral-600 border-neutral-300 hover:bg-neutral-100'
                            }`}
                          >
                            {sz}px
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Logo Alignment */}
                    <div className="pt-2 border-t border-neutral-200 flex items-center justify-between gap-2">
                      <span className="text-[11px] font-semibold text-neutral-700">จัดตำแหน่งโลโก้:</span>
                      <div className="flex gap-1">
                        {(
                          [
                            { id: 'left', label: 'ชิดซ้าย', icon: AlignLeft },
                            { id: 'center', label: 'กึ่งกลาง', icon: AlignCenter },
                            { id: 'right', label: 'ชิดขวา', icon: AlignRight },
                          ] as const
                        ).map((pos) => {
                          const Icon = pos.icon;
                          const isSel = (annexConfig.logoAlign || 'center') === pos.id;
                          return (
                            <button
                              key={pos.id}
                              type="button"
                              onClick={() => updateAnnex({ logoAlign: pos.id })}
                              className={`px-2.5 py-1 text-[11px] rounded flex items-center gap-1 font-medium transition-colors cursor-pointer border ${
                                isSel
                                  ? 'bg-neutral-900 text-white border-neutral-900 font-bold shadow-2xs'
                                  : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-100'
                              }`}
                            >
                              <Icon className="w-3 h-3" />
                              <span>{pos.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Header Text, Titles, Subtitle, Company & Font (6 cols) */}
                  <div className="lg:col-span-6 space-y-3 bg-neutral-50 p-3.5 rounded-xl border border-neutral-200">
                    <div className="flex items-center justify-between">
                      <label className="font-semibold text-neutral-800 flex items-center gap-1.5 text-xs">
                        <Type className="w-3.5 h-3.5 text-neutral-600" />
                        <span>ข้อความและฟอนต์หัวกระดาษหน้า 2:</span>
                      </label>
                    </div>

                    {/* Header Font Family Selector */}
                    <div>
                      <div className="flex justify-between items-center mb-1 text-[11px]">
                        <span className="font-semibold text-neutral-700">แบบฟอนต์หัวกระดาษหน้า 2:</span>
                        <span className="font-mono text-[10px] text-neutral-500 bg-white border border-neutral-200 px-1.5 py-0.2 rounded">
                          {annexConfig.headerFontFamily || annexConfig.fontFamily || 'Sarabun'}
                        </span>
                      </div>
                      <select
                        value={annexConfig.headerFontFamily || annexConfig.fontFamily || 'Sarabun'}
                        onChange={(e) => updateAnnex({ headerFontFamily: e.target.value })}
                        className="w-full px-2.5 py-1.5 bg-white border border-neutral-300 rounded-md text-xs font-medium text-neutral-800 focus:ring-1 focus:ring-neutral-800 cursor-pointer shadow-2xs"
                      >
                        <option value="Sarabun">🇹🇭 Sarabun (ฟอนต์สารบรรณ มาตรฐานเอกสารราชการ/องค์กร)</option>
                        <option value="Trirong">🏛️ Trirong (ฟอนต์ไตรรงค์ - ทางการ คลาสสิก)</option>
                        <option value="Prompt">🏢 Prompt (ฟอนต์พร้อมท์ - โมเดิร์น ไร้หัว)</option>
                        <option value="Kanit">🎨 Kanit (ฟอนต์คณิต - คมชัด โมเดิร์นยอดนิยม)</option>
                        <option value="Mitr">✨ Mitr (ฟอนต์มิตร - อ่อนหวาน สบายตา)</option>
                        <option value="Chakra Petch">⚡ Chakra Petch (ฟอนต์จักรเพชร - เทคโนโลยี)</option>
                        <option value="Bai Jamjuree">🌿 Bai Jamjuree (ฟอนต์จามจุรี - พรีเมียม)</option>
                        <option value="IBM Plex Sans Thai">💼 IBM Plex Sans Thai (ฟอนต์ธุรกิจสากล)</option>
                        <option value="Noto Sans Thai">🌐 Noto Sans Thai (ฟอนต์สากล Google)</option>
                      </select>
                    </div>

                    {/* Header Document Title Input */}
                    <div className="space-y-1">
                      <div className="flex justify-between items-center text-[11px]">
                        <label className="font-semibold text-neutral-800 flex items-center gap-1">
                          <span>หัวข้อเอกสารหน้า 2 (Document Title):</span>
                        </label>
                        <div className="flex items-center gap-1 text-[10.5px]">
                          <span className="text-neutral-500">ขนาด:</span>
                          <button
                            type="button"
                            onClick={() => updateAnnex({ headerTitleFontSize: Math.max(12, (annexConfig.headerTitleFontSize || (annexConfig.fontSize || 11.5) + 3.5) - 1) })}
                            className="px-1 text-[9px] bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 rounded font-mono"
                          >
                            -1
                          </button>
                          <span className="font-mono font-bold text-blue-700 bg-blue-50 border border-blue-200 px-1 py-0.2 rounded text-[10px]">
                            {annexConfig.headerTitleFontSize || Math.round((annexConfig.fontSize || 11.5) + 3.5)}px
                          </span>
                          <button
                            type="button"
                            onClick={() => updateAnnex({ headerTitleFontSize: Math.min(32, (annexConfig.headerTitleFontSize || (annexConfig.fontSize || 11.5) + 3.5) + 1) })}
                            className="px-1 text-[9px] bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 rounded font-mono"
                          >
                            +1
                          </button>
                        </div>
                      </div>
                      <input
                        type="text"
                        value={annexConfig.title || ''}
                        onChange={(e) => updateAnnex({ title: e.target.value })}
                        placeholder="การให้บริการห้องประชุมอาคารเคเอกซ์"
                        className="w-full px-2.5 py-1.5 border border-neutral-300 rounded-md text-xs font-semibold focus:ring-1 focus:ring-neutral-800 bg-white shadow-2xs"
                      />

                      {/* Quick Presets for Title */}
                      <div className="flex flex-wrap items-center gap-1 pt-0.5">
                        <span className="text-[10px] text-neutral-400">พรีเซ็ต:</span>
                        {[
                          'การให้บริการห้องประชุมอาคารเคเอกซ์',
                          'เงื่อนไขการให้บริการห้องประชุม (ANNEX)',
                          'ข้อกำหนดและเงื่อนไขการใช้บริการอาคาร',
                        ].map((pTitle) => (
                          <button
                            key={pTitle}
                            type="button"
                            onClick={() => updateAnnex({ title: pTitle })}
                            className={`text-[9.5px] px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                              (annexConfig.title || '') === pTitle
                                ? 'bg-neutral-800 text-white border-neutral-800 font-semibold'
                                : 'bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-100'
                            }`}
                          >
                            {pTitle.length > 25 ? `${pTitle.substring(0, 25)}...` : pTitle}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Subtitle Input */}
                    <div className="space-y-1">
                      <label className="block text-[11px] font-semibold text-neutral-700">
                        ข้อความหัวเรื่องย่อย (Header Subtitle / กำกับเอกสาร):
                      </label>
                      <input
                        type="text"
                        value={annexConfig.headerSubtitle || ''}
                        onChange={(e) => updateAnnex({ headerSubtitle: e.target.value })}
                        placeholder="เช่น (ANNEX TO QUOTATION) หรือ ระเบียบการใช้อุปกรณ์และสถานที่"
                        className="w-full px-2.5 py-1.5 border border-neutral-300 rounded-md text-xs bg-white focus:ring-1 focus:ring-neutral-800 shadow-2xs"
                      />
                    </div>



                    {/* Header Text Alignment */}
                    <div className="pt-1.5 border-t border-neutral-200 flex items-center justify-between gap-2">
                      <span className="text-[11px] font-semibold text-neutral-700">จัดตำแหน่งข้อความหัวกระดาษ:</span>
                      <div className="flex gap-1">
                        {(
                          [
                            { id: 'left', label: 'ชิดซ้าย' },
                            { id: 'center', label: 'กึ่งกลาง' },
                            { id: 'right', label: 'ชิดขวา' },
                          ] as const
                        ).map((align) => {
                          const isSel = (annexConfig.headerAlign || 'center') === align.id;
                          return (
                            <button
                              key={align.id}
                              type="button"
                              onClick={() => updateAnnex({ headerAlign: align.id })}
                              className={`px-2.5 py-1 text-[11px] rounded font-medium transition-colors cursor-pointer border ${
                                isSel
                                  ? 'bg-neutral-900 text-white border-neutral-900 font-bold shadow-2xs'
                                  : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-100'
                              }`}
                            >
                              <span>{align.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 1: เงื่อนไขการใช้บริการ */}
              <div className="space-y-1.5 p-3 bg-neutral-50/80 border border-neutral-200 rounded-xl">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-neutral-800">
                    หัวข้อข้อที่ 1:
                  </label>
                </div>
                <input
                  type="text"
                  value={annexConfig.section1Title || ''}
                  onChange={(e) => updateAnnex({ section1Title: e.target.value })}
                  className="w-full px-2.5 py-1 border border-neutral-300 rounded-md text-xs font-semibold"
                />
                <label className="block text-[11px] font-semibold text-neutral-600 mt-2">
                  รายละเอียดเงื่อนไข (แก้ไขข้อความ ย่อหน้า หรือลำดับเลขได้อิสระ):
                </label>
                <textarea
                  rows={6}
                  value={annexConfig.termsText || ''}
                  onChange={(e) => updateAnnex({ termsText: e.target.value })}
                  className="w-full px-2.5 py-2 border border-neutral-300 rounded-lg text-xs font-sarabun leading-relaxed bg-white focus:ring-1 focus:ring-neutral-800"
                />
              </div>

              {/* Section 2: ค่าเช่าอุปกรณ์เสริม */}
              <div className="space-y-2 p-3 bg-neutral-50/80 border border-neutral-200 rounded-xl">
                <div className="flex items-center justify-between">
                  <input
                    type="text"
                    value={annexConfig.section2Title || ''}
                    onChange={(e) => updateAnnex({ section2Title: e.target.value })}
                    className="px-2 py-1 border border-neutral-300 rounded-md text-xs font-bold w-2/3"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const newList = [
                        ...(annexConfig.equipmentList || DEFAULT_ANNEX_EQUIPMENT),
                        { id: `eq-${Date.now()}`, name: 'อุปกรณ์เสริมใหม่', price: '500 บาท/ชิ้น/วัน' },
                      ];
                      updateAnnex({ equipmentList: newList });
                    }}
                    className="px-2 py-1 bg-neutral-900 text-white rounded text-[11px] font-bold hover:bg-neutral-800 cursor-pointer"
                  >
                    + เพิ่มแถวอุปกรณ์
                  </button>
                </div>

                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {(annexConfig.equipmentList || DEFAULT_ANNEX_EQUIPMENT).map((eq, idx) => (
                    <div key={eq.id} className="flex items-center gap-2">
                      <span className="text-[11px] font-bold text-neutral-400 w-4">{idx + 1}</span>
                      <input
                        type="text"
                        value={eq.name}
                        onChange={(e) => {
                          const list = [...(annexConfig.equipmentList || DEFAULT_ANNEX_EQUIPMENT)];
                          list[idx] = { ...list[idx], name: e.target.value };
                          updateAnnex({ equipmentList: list });
                        }}
                        placeholder="ชื่อรายการอุปกรณ์"
                        className="flex-1 px-2 py-1 bg-white border border-neutral-300 rounded text-xs"
                      />
                      <input
                        type="text"
                        value={eq.price}
                        onChange={(e) => {
                          const list = [...(annexConfig.equipmentList || DEFAULT_ANNEX_EQUIPMENT)];
                          list[idx] = { ...list[idx], price: e.target.value };
                          updateAnnex({ equipmentList: list });
                        }}
                        placeholder="ค่าบริการ เช่น 500 บาท/เครื่อง/วัน"
                        className="w-48 px-2 py-1 bg-white border border-neutral-300 rounded text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const list = (annexConfig.equipmentList || DEFAULT_ANNEX_EQUIPMENT).filter((_, i) => i !== idx);
                          updateAnnex({ equipmentList: list });
                        }}
                        className="text-neutral-400 hover:text-rose-600 p-1 cursor-pointer"
                        title="ลบแถวนี้"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                <div>
                  <label className="block text-[10.5px] text-neutral-500 font-medium mb-0.5">
                    หมายเหตุด้านล่างตารางอุปกรณ์:
                  </label>
                  <input
                    type="text"
                    value={annexConfig.equipmentNote || ''}
                    onChange={(e) => updateAnnex({ equipmentNote: e.target.value })}
                    className="w-full px-2 py-1 bg-white border border-neutral-300 rounded text-xs"
                  />
                </div>
              </div>

              {/* Section 3: ค่าปรับ */}
              <div className="space-y-2 p-3 bg-neutral-50/80 border border-neutral-200 rounded-xl">
                <div className="flex items-center justify-between">
                  <input
                    type="text"
                    value={annexConfig.section3Title || ''}
                    onChange={(e) => updateAnnex({ section3Title: e.target.value })}
                    className="px-2 py-1 border border-neutral-300 rounded-md text-xs font-bold w-2/3"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const newList = [
                        ...(annexConfig.finesList || DEFAULT_ANNEX_FINES),
                        { id: `fine-${Date.now()}`, description: 'กรณีเกิดความเสียหายใหม่', fine: 'ชำระตามจริง' },
                      ];
                      updateAnnex({ finesList: newList });
                    }}
                    className="px-2 py-1 bg-neutral-900 text-white rounded text-[11px] font-bold hover:bg-neutral-800 cursor-pointer"
                  >
                    + เพิ่มแถวค่าปรับ
                  </button>
                </div>

                <div className="space-y-1.5 max-h-56 overflow-y-auto">
                  {(annexConfig.finesList || DEFAULT_ANNEX_FINES).map((fine, idx) => (
                    <div key={fine.id} className="flex items-start gap-2">
                      <span className="text-[11px] font-bold text-neutral-400 w-4 pt-1.5">{idx + 1}</span>
                      <textarea
                        rows={2}
                        value={fine.description}
                        onChange={(e) => {
                          const list = [...(annexConfig.finesList || DEFAULT_ANNEX_FINES)];
                          list[idx] = { ...list[idx], description: e.target.value };
                          updateAnnex({ finesList: list });
                        }}
                        placeholder="รายละเอียดกรณีความเสียหายหรือค่าปรับ"
                        className="flex-1 px-2 py-1 bg-white border border-neutral-300 rounded text-xs leading-tight"
                      />
                      <input
                        type="text"
                        value={fine.fine}
                        onChange={(e) => {
                          const list = [...(annexConfig.finesList || DEFAULT_ANNEX_FINES)];
                          list[idx] = { ...list[idx], fine: e.target.value };
                          updateAnnex({ finesList: list });
                        }}
                        placeholder="ค่าปรับ เช่น 3,000 บาท"
                        className="w-40 px-2 py-1 bg-white border border-neutral-300 rounded text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const list = (annexConfig.finesList || DEFAULT_ANNEX_FINES).filter((_, i) => i !== idx);
                          updateAnnex({ finesList: list });
                        }}
                        className="text-neutral-400 hover:text-rose-600 p-1 pt-1.5 cursor-pointer"
                        title="ลบแถวนี้"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

            {/* Bottom Save Button */}
            <div className="flex justify-end gap-3 pb-8">
              <button
                type="button"
                onClick={onCancel}
                className="px-5 py-2.5 border border-neutral-300 hover:bg-neutral-100 text-neutral-700 rounded-lg text-xs font-semibold transition-colors"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-2 transition-colors"
              >
                <Save className="w-4 h-4" />
                {isEditing ? 'บันทึกการแก้ไข' : 'บันทึกใบเสนอราคา'}
              </button>
            </div>
          </form>
        )}

        {/* Live Preview Column */}
        {(viewMode === 'preview' || viewMode === 'split') && (
          <div className="space-y-3">
            {/* Quick Interactive Layout Bar for Live Preview */}
            <div className="bg-white p-2.5 rounded-xl border border-neutral-200 shadow-2xs flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-1 bg-neutral-100 p-0.5 rounded-lg">
                <button
                  type="button"
                  onClick={() => setPreviewPageTab('quotation')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                    previewPageTab === 'quotation'
                      ? 'bg-neutral-900 text-white shadow-xs'
                      : 'text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  📄 หน้า 1 (ใบเสนอราคา)
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewPageTab('annex')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                    previewPageTab === 'annex'
                      ? 'bg-neutral-900 text-white shadow-xs'
                      : 'text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  📋 หน้า 2 (ข้อกำหนด & ค่าปรับ)
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewPageTab('both')}
                  className={`px-2 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                    previewPageTab === 'both'
                      ? 'bg-neutral-900 text-white shadow-xs'
                      : 'text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  ทั้ง 2 หน้า
                </button>
              </div>

              {previewPageTab !== 'annex' ? (
                <div className="flex items-center gap-2">
                  <span className="text-neutral-400">|</span>
                  <button
                    type="button"
                    onClick={() => applyLayoutPreset('fit')}
                    className="px-2 py-0.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded text-[11px] font-semibold transition-colors cursor-pointer"
                  >
                    🎯 พอดี 1 หน้า
                  </button>
                  <span className="text-[11px] text-neutral-500">ฟอนต์:</span>
                  {(['compact', 'normal', 'large'] as const).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => updateLayout({ fontSize: s })}
                      className={`px-1.5 py-0.5 rounded text-[10.5px] font-semibold transition-colors cursor-pointer ${
                        layoutSettings.fontSize === s
                          ? 'bg-neutral-900 text-white'
                          : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                      }`}
                    >
                      {s === 'compact' ? 'เล็ก' : s === 'normal' ? 'ปกติ' : 'ใหญ่'}
                    </button>
                  ))}
                  <span className="text-neutral-400">|</span>
                  <span className="text-[11px] text-neutral-500">แถวว่าง:</span>
                  {[8, 10, 12].map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => updateLayout({ minEmptyRows: r })}
                      className={`px-1.5 py-0.5 rounded text-[10.5px] font-semibold transition-colors cursor-pointer ${
                        (layoutSettings.minEmptyRows !== undefined ? layoutSettings.minEmptyRows : 10) === r
                          ? 'bg-neutral-900 text-white'
                          : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                      }`}
                      title={`แสดงแถวว่างสำรองในตาราง ${r} แถว`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-neutral-400">|</span>
                  <span className="text-[11px] text-neutral-500">ฟอนต์หน้า 2:</span>
                  <span className="font-bold text-neutral-800">{annexConfig.fontFamily || 'Sarabun'} ({annexConfig.fontSize || 11.5}px)</span>
                </div>
              )}
            </div>

            <div className="border border-neutral-200 rounded-xl overflow-hidden shadow-sm bg-neutral-100/50 p-2 sm:p-4 flex flex-col items-center space-y-6">
              {(previewPageTab === 'quotation' || previewPageTab === 'both') && (
                <div className="scale-[0.9] sm:scale-100 origin-top shadow-xl">
                  <QuotationDocument
                    quotation={currentQuotation}
                    logoUrl={logoUrl}
                    headerTitle={headerTitle}
                    headerSubtitle={headerSubtitle}
                    layoutSettings={layoutSettings}
                  />
                </div>
              )}

              {(previewPageTab === 'annex' || previewPageTab === 'both') && (
                <div className="scale-[0.9] sm:scale-100 origin-top shadow-xl">
                  <AnnexDocument
                    customerName={contactPerson || customerName}
                    config={{
                      ...annexConfig,
                      fontFamily: annexConfig.fontFamily || layoutSettings.headerFontFamily || 'Trirong',
                      fontSize: annexConfig.fontSize || 11,
                      logoUrl: annexConfig.logoUrl || logoUrl,
                      companyName: annexConfig.companyName || '',
                    }}
                    language={docLanguage}
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Numbering Settings Modal */}
      <NumberingSettingsModal
        isOpen={isNumberSettingsOpen}
        onClose={() => setIsNumberSettingsOpen(false)}
        quotations={quotations}
        onSettingsSaved={() => {
          if (!isEditing) {
            handleAutoGenerateNumber();
          }
        }}
      />

      {/* Customer Sync & Import Modal */}
      <CustomerSyncModal
        isOpen={isCustomerSyncOpen}
        onClose={() => setIsCustomerSyncOpen(false)}
        customers={customers}
        onCustomersUpdated={(updated) => {
          setCustomers(updated);
          if (customerCode) {
            const matched = findCustomerByCode(customerCode, updated);
            if (matched) applyCustomer(matched, false);
          }
        }}
        onSelectCustomer={(cust) => {
          applyCustomer(cust, true);
        }}
      />

      {/* Room & Price Catalog Modal */}
      <RoomCatalogModal
        isOpen={isRoomCatalogModalOpen}
        onClose={() => setIsRoomCatalogModalOpen(false)}
        onSelectItem={(room) => {
          addPresetItem(room);
        }}
      />

      {/* Food & Catering Services Modal */}
      <FoodCateringModal
        isOpen={isFoodCateringModalOpen}
        onClose={() => setIsFoodCateringModalOpen(false)}
        onAddItems={(newItems) => {
          setItems((prev) => [...prev, ...newItems]);
          setSyncStatusMsg({
            type: 'success',
            text: `เพิ่มรายการอาหารและเครื่องดื่ม ${newItems.length} รายการเรียบร้อยแล้ว`,
          });
          setTimeout(() => setSyncStatusMsg(null), 3500);
        }}
        eventDate={formData.eventDate}
        defaultGuestCount={Number(formData.pax) || 30}
        discountRate={customerDiscountRate}
      />

      {/* Manage Prepared By Signers Modal */}
      <ManagePreparedByModal
        isOpen={isManagePreparedByModalOpen}
        onClose={() => setIsManagePreparedByModalOpen(false)}
        presets={preparedByPresets}
        onSavePresets={handleSavePresetsList}
        currentSelectedName={preparedBy}
        onSelectPerson={(preset) => {
          setPreparedBy(preset.name);
          setPreparedBySignatureUrl(preset.signatureUrl);
          setPreparedByMode('image');
        }}
      />
    </div>
  );
};
