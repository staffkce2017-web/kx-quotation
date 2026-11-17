export type { CustomerRecord, CustomerSyncConfig } from '../types';
import { CustomerRecord, CustomerSyncConfig } from '../types';

export const CUSTOMERS_STORAGE_KEY = 'kx_customers_db_v1';
export const SYNC_CONFIG_STORAGE_KEY = 'kx_customer_sync_config_v1';
export const RAW_SHEET_DATA_KEY = 'kx_raw_sheet_data_v1';

// Seeded / default customer database with standard KX clients
// NOTE: Disallowed hardcoding of discount numbers. All discount rates initialize to 0%
// and are populated exclusively via Dynamic Direct Reference from Column J in Google Sheets.
export const DEFAULT_CUSTOMERS: CustomerRecord[] = [
  {
    id: 'cust-kx000508',
    customerCode: 'KX000508',
    name: 'ลูกค้า KX Innovation (เชื่อมต่อ Google Sheets คอลัมน์ J)',
    contactPerson: '',
    mobile: '',
    phone: '',
    email: '',
    address: '',
    taxId: '',
    department: 'เอกชน',
    discountRate: 0,
    source: 'Google Sheets (คอลัมน์ J)',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'cust-kx001699',
    customerCode: 'KX001699',
    name: 'บริษัท ป๊อปอัพ จำกัด',
    contactPerson: 'คุณหฤทัย พระชนีย์',
    mobile: '086-416-6490',
    phone: '',
    email: 'contact@popup.co.th',
    address: '1042/99 ซ.สุขุมวิท 101 แขวงบางจาก เขตพระโขนง จ.กรุงเทพมหานคร 10260',
    taxId: '0105563143308',
    department: 'เอกชน',
    discountRate: 0,
    source: 'แบบฟอร์มขอใบเสนอราคา',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'cust-kx001782',
    customerCode: 'KX001782',
    name: 'บริษัท เซ็นทรัล พีเพิล ดีเวลลอปเม้นท์ เซ็นเตอร์ จำกัด (สำนักงานใหญ่)',
    contactPerson: 'คุณณัฐวรรณ จารย์คุณ',
    mobile: '086-347-2070',
    phone: '',
    email: 'nattawan@central.co.th',
    address: '306 อาคารเซ็นทรัลสีลม ถนนสีลม แขวงสุริยวงศ์ เขตบางรัก กรุงเทพมหานคร 10500',
    taxId: '0105551040525',
    department: 'เอกชน',
    discountRate: 0,
    source: 'แบบฟอร์มขอใบเสนอราคา',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'cust-kx000095',
    customerCode: 'KX000095',
    name: 'บริษัท เอสซีจี ซิเมนต์-ผลิตภัณฑ์ก่อสร้าง จำกัด (สำนักงานใหญ่)',
    contactPerson: 'คุณเนตรดาว อ่ำอุ่น',
    mobile: '081-823-4567',
    phone: '02-586-3333',
    email: 'netdao@scg.com',
    address: '1 ถ.ปูนซิเมนต์ไทย แขวงบางซื่อ เขตบางซื่อ กรุงเทพมหานคร 10800',
    taxId: '0105542000095',
    department: 'เอกชน',
    discountRate: 0,
    source: 'Google Sheets (คอลัมน์ J)',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'cust-kx002231',
    customerCode: 'KX002231',
    name: 'บริษัท เออินเทลลิเจนซ์ จำกัด (สำนักงานใหญ่)',
    contactPerson: 'คุณสุภัสสร ศิริฐานนท์',
    mobile: '094-979-2972',
    phone: '',
    email: 'supassorn@a-intelligence.co.th',
    address: '99/186 หมู่ที่ 1 ต.อ้อมเกร็ด อ.ปากเกร็ด จ.นนทบุรี',
    taxId: '0125563017434',
    department: 'เอกชน',
    discountRate: 0,
    source: 'ฐานข้อมูลใบเสนอราคา',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'cust-kx001842',
    customerCode: 'KX001842',
    name: 'บริษัท ดิจิทัล โซลูชั่นส์ อินโนเวชั่น จำกัด',
    contactPerson: 'คุณวรวุฒิ วิจิตรสกุล',
    mobile: '081-445-6789',
    phone: '02-692-5500',
    email: 'worawut@ds-inno.com',
    address: '123/45 อาคารไซเบอร์เวิลด์ ชั้น 24 ถ.รัชดาภิเษก ห้วยขวาง กทม.',
    taxId: '0105558129841',
    department: 'เอกชน',
    discountRate: 0,
    source: 'ฐานข้อมูลใบเสนอราคา',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'cust-kx003011',
    customerCode: 'KX003011',
    name: 'บริษัท สยาม ออโตเมชั่น เทคโนโลยีส์ จำกัด',
    contactPerson: 'คุณเกรียงไกร สมบูรณ์',
    mobile: '086-778-9901',
    phone: '02-705-1122',
    email: 'kriangkrai@siamauto.co.th',
    address: '88/9 นิคมอุตสาหกรรมบางพลี ต.บางเสาธง อ.บางเสาธง จ.สมุทรปราการ',
    taxId: '0105562098712',
    department: 'เอกชน',
    discountRate: 0,
    source: 'ฐานข้อมูลใบเสนอราคา',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'cust-kx001947',
    customerCode: 'KX001947',
    name: 'บริษัท เอสซีจี ซิเมนต์-ผลิตภัณฑ์ก่อสร้าง จำกัด (สำนักงานใหญ่)',
    contactPerson: 'คุณเนตรดาว อ่ำอุ่น',
    mobile: '081-823-4567',
    phone: '02-586-3333',
    email: 'netdao@scg.com',
    address: '1 ถ.ปูนซิเมนต์ไทย แขวงบางซื่อ เขตบางซื่อ กรุงเทพมหานคร 10800',
    taxId: '0105542000095',
    department: 'เอกชน',
    discountRate: 0,
    source: 'Google Sheets (คอลัมน์ J)',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'cust-kx001966',
    customerCode: 'KX001966',
    name: 'บริษัท ทรู คอร์ปอเรชั่น จำกัด (มหาชน)',
    contactPerson: 'คุณจิราภรณ์ พัฒนศิลป์',
    mobile: '089-196-6196',
    phone: '02-196-6000',
    email: 'contact@truecorp.co.th',
    address: '18 อาคารทรูทาวเวอร์ ถนนรัชดาภิเษก แขวงห้วยขวาง เขตห้วยขวาง กรุงเทพมหานคร 10310',
    taxId: '0107535000213',
    department: 'เอกชน',
    discountRate: 0,
    source: 'Google Sheets (คอลัมน์ J)',
    updatedAt: new Date().toISOString()
  }
];

// Helper to safely parse discount percentage from Column J or any discount cell
// Supports:
// - Google Sheets decimal export: 0.15 -> 15%, 0.10 -> 10%, 0.20 -> 20%, 0.05 -> 5%
// - Text percentages: "15%", " 15% ", "15.0%", "ลด 15%", "ส่วนลด 15%"
// - Formula output strings from =IFERROR(VLOOKUP(..., IMPORTRANGE(...)))
// - Safe discarding of errors like #N/A, #REF!, #VALUE!, "-", "0", "ไม่มี"
export function parseDiscountPercentage(val: any): number {
  if (val === null || val === undefined) return 0;
  
  // 1. Direct numeric handling
  if (typeof val === 'number') {
    if (isNaN(val)) return 0;
    // Decimals between 0 and 1 from Google Sheets percentage formatting (e.g. 0.15 -> 15%)
    if (val > 0 && val < 1) {
      return Math.round(val * 100 * 100) / 100;
    }
    if (val >= 1 && val <= 100) {
      return Math.round(val * 100) / 100;
    }
    return 0;
  }

  // 2. Clean string
  let str = String(val).trim();
  // Strip surrounding quotes (from CSV exports e.g. ""15%"")
  str = str.replace(/^["']+|["']+$/g, '').trim();
  if (!str) return 0;

  // 3. Check for formula error strings or empty placeholders
  const lower = str.toLowerCase();
  if (
    lower === '-' ||
    lower === '--' ||
    lower === 'ไม่มี' ||
    lower === 'none' ||
    lower === 'null' ||
    lower === 'n/a' ||
    lower === 'na' ||
    lower === 'nil' ||
    lower === '0' ||
    lower === '0%' ||
    lower === '0.0' ||
    lower === '0.00' ||
    lower === '0.0%' ||
    lower.startsWith('#') // e.g. #N/A, #REF!, #VALUE!, #ERROR!, #NAME?, #DIV/0!
  ) {
    return 0;
  }

  // 4. Handle un-evaluated formula strings e.g. "=15%" or "=0.15"
  if (str.startsWith('=')) {
    const simple = str.replace(/^=\s*/, '').trim();
    if (!simple.includes('(')) {
      str = simple;
    } else {
      // Unevaluated complex formula like "=IFERROR(VLOOKUP(...))"
      return 0;
    }
  }

  // 5. Normalize European comma decimal e.g. "0,15" -> "0.15"
  str = str.replace(/(\d+),(\d{1,2})%?$/, '$1.$2');

  // 6. Explicit Thai discount patterns e.g. "ลด 15%", "ส่วนลด 20%"
  const thaiMatch = str.match(/(?:ส่วนลด|ลด)\s*[:=]?\s*(\d+(?:\.\d+)?)\s*%/i);
  if (thaiMatch) {
    const num = parseFloat(thaiMatch[1]);
    if (!isNaN(num) && num > 0 && num <= 100) {
      return Math.round(num * 100) / 100;
    }
  }

  // 7. Explicit percentage string e.g. "15%", " 15 % "
  const percentMatch = str.match(/(\d+(?:\.\d+)?)\s*%/);
  if (percentMatch) {
    const num = parseFloat(percentMatch[1]);
    if (!isNaN(num) && num >= 0 && num <= 100) {
      return Math.round(num * 100) / 100;
    }
  }

  // 8. General number / decimal matching (e.g. "0.15", ".15", "15")
  const numMatch = str.match(/(0?\.\d+|\d+(?:\.\d+)?)/);
  if (numMatch) {
    const num = parseFloat(numMatch[1]);
    if (!isNaN(num)) {
      // Decimal representation from Google Sheets (0.15 = 15%, 0.10 = 10%, 0.20 = 20%)
      if (num > 0 && num < 1) {
        return Math.round(num * 100 * 100) / 100;
      }
      if (num >= 1 && num <= 100) {
        return Math.round(num * 100) / 100;
      }
    }
  }

  return 0;
}

// Load all customers from localStorage merged with defaults
export function loadCustomers(): CustomerRecord[] {
  try {
    const raw = localStorage.getItem(CUSTOMERS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const map = new Map<string, CustomerRecord>();
        DEFAULT_CUSTOMERS.forEach(c => {
          if (c.customerCode) map.set(normalizeCustomerCode(c.customerCode), sanitizeCustomerRecord(c));
        });
        parsed.forEach((c: CustomerRecord) => {
          if (c.customerCode) {
            const norm = normalizeCustomerCode(c.customerCode);
            const defaultMatch = DEFAULT_CUSTOMERS.find(dc => normalizeCustomerCode(dc.customerCode) === norm);
            
            // Preserve the actual discountRate from Google Sheets (0% is preserved as 0%, 20% as 20%)
            const discountRate = c.discountRate !== undefined ? c.discountRate : (defaultMatch?.discountRate ?? 0);

            map.set(norm, sanitizeCustomerRecord({
              ...defaultMatch,
              ...c,
              id: c.id || `cust-${norm}`,
              discountRate
            }));
          }
        });
        return Array.from(map.values());
      }
    }
  } catch (err) {
    console.warn('Error loading customers from localStorage:', err);
  }
  return DEFAULT_CUSTOMERS.map(sanitizeCustomerRecord);
}

// Save customers to localStorage and dispatch event
export function saveCustomers(customers: CustomerRecord[]): void {
  try {
    localStorage.setItem(CUSTOMERS_STORAGE_KEY, JSON.stringify(customers));
    window.dispatchEvent(new CustomEvent('kx_customers_updated', { detail: customers }));
  } catch (err) {
    console.error('Error saving customers to localStorage:', err);
  }
}

// Load sync config
export function loadSyncConfig(): CustomerSyncConfig {
  try {
    const raw = localStorage.getItem(SYNC_CONFIG_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.warn('Error loading sync config:', err);
  }
  return {
    sheetUrl: '',
    autoSync: true,
  };
}

// Save sync config
export function saveSyncConfig(config: CustomerSyncConfig): void {
  try {
    localStorage.setItem(SYNC_CONFIG_STORAGE_KEY, JSON.stringify(config));
  } catch (err) {
    console.error('Error saving sync config:', err);
  }
}

/**
 * Normalizes customer code by removing whitespace, hyphens, underscores, dots, slashes
 * and converting to uppercase.
 * Example: 'KX-001699' -> 'KX001699'
 * Example: 'kx 001699' -> 'KX001699'
 * Example: '1699' -> '1699'
 */
export function normalizeCustomerCode(code: string): string {
  if (!code) return '';
  return code
    .toUpperCase()
    .trim()
    .replace(/[\s\-_./\\]+/g, '');
}

/**
 * Extract numeric portion of a customer code without leading zeroes
 * Example: 'KX001699' -> '1699'
 * Example: '1699' -> '1699'
 */
export function extractSignificantNumber(code: string): string {
  if (!code) return '';
  const digits = code.replace(/[^0-9]/g, '');
  if (!digits) return '';
  const parsed = parseInt(digits, 10);
  return isNaN(parsed) ? '' : parsed.toString();
}

/**
 * Dynamic Direct Reference: Find customer row directly in Google Sheets raw CSV/data
 * Uses parseCustomerData to ensure accurate header scoring and column mapping.
 */
export function findCustomerInSheetRawData(
  queryCode: string,
  rawSheetText?: string
): CustomerRecord | undefined {
  if (!queryCode || !queryCode.trim()) return undefined;
  const text = rawSheetText || (typeof localStorage !== 'undefined' ? localStorage.getItem(RAW_SHEET_DATA_KEY) : null);
  if (!text) return undefined;

  try {
    const parsed = parseCustomerData(text, 'Google Sheets (Real-time)');
    if (parsed && parsed.length > 0) {
      const normQuery = normalizeCustomerCode(queryCode);
      const queryDigits = queryCode.replace(/[^0-9]/g, '');

      // 1. Exact normalized match
      const exact = parsed.find(c => normalizeCustomerCode(c.customerCode) === normQuery);
      if (exact) return exact;

      // 2. Significant number match (e.g. 1966 matches KX001966)
      if (queryDigits.length >= 3) {
        const querySig = extractSignificantNumber(queryCode);
        const matchSig = parsed.find(c => extractSignificantNumber(c.customerCode) === querySig);
        if (matchSig) return matchSig;
      }

      // 3. Tax ID match
      if (queryDigits.length >= 10) {
        const taxMatch = parsed.find(c => (c.taxId || '').replace(/[^0-9]/g, '') === queryDigits);
        if (taxMatch) return taxMatch;
      }

      // 4. Suffix match
      if (queryDigits.length >= 4) {
        const suffixMatch = parsed.find(c => {
          const cDigits = (c.customerCode || '').replace(/[^0-9]/g, '');
          return cDigits === queryDigits || cDigits.endsWith(queryDigits);
        });
        if (suffixMatch) return suffixMatch;
      }

      // 5. Company Name match
      const clean = queryCode.trim().toLowerCase();
      if (clean.length >= 3) {
        const nameMatch = parsed.find(c => (c.name || '').toLowerCase().includes(clean));
        if (nameMatch) return nameMatch;
      }
    }
  } catch (err) {
    console.warn('Error in findCustomerInSheetRawData:', err);
  }

  return undefined;
}

/**
 * Robust customer lookup by code:
 * - Exact match on normalized code (e.g. 'KX001699' === 'KX-001699')
 * - Direct numeric match (e.g. '1966' matches 'KX001966' or '001966')
 * - Significant number match (e.g. '1966' matches 'KX001966')
 * - Suffix match on numbers (e.g. '001966' matches 'KX001966')
 * - Tax ID match (13 digits or 10+ digits)
 * - Phone / Mobile match (9-10 digits)
 * - Company Name & Contact Person match
 */
export function findCustomerByCode(
  queryCode: string,
  customerList?: CustomerRecord[]
): CustomerRecord | undefined {
  if (!queryCode || !queryCode.trim()) return undefined;

  const list = customerList || loadCustomers();
  const rawQuery = queryCode.trim();
  const queryNorm = normalizeCustomerCode(rawQuery);
  const queryDigits = rawQuery.replace(/[^0-9]/g, '');
  const querySigNum = extractSignificantNumber(rawQuery);
  const queryLower = rawQuery.toLowerCase();

  // 1. Exact normalized match in customerList (e.g. 'KX001966' === 'KX001966')
  const exact = list.find(c => normalizeCustomerCode(c.customerCode) === queryNorm);
  if (exact) return exact;

  // 2. Query with / without 'KX' prefix
  if (queryNorm.startsWith('KX')) {
    const withoutKx = queryNorm.substring(2);
    const matchWithout = list.find(c => {
      const cNorm = normalizeCustomerCode(c.customerCode);
      return cNorm === withoutKx || cNorm.replace(/^KX/, '') === withoutKx;
    });
    if (matchWithout) return matchWithout;
  } else {
    const withKx = 'KX' + queryNorm;
    const matchWith = list.find(c => normalizeCustomerCode(c.customerCode) === withKx);
    if (matchWith) return matchWith;
  }

  // 3. Significant numbers match (e.g. '1966' or '001966' matches 'KX001966')
  if (queryDigits.length >= 3 && querySigNum) {
    const numMatches = list.filter(c => {
      const cSig = extractSignificantNumber(c.customerCode);
      return cSig === querySigNum;
    });

    if (numMatches.length === 1) {
      return numMatches[0];
    } else if (numMatches.length > 1) {
      const kxMatch = numMatches.find(c => normalizeCustomerCode(c.customerCode).startsWith('KX'));
      if (kxMatch) return kxMatch;
      return numMatches[0];
    }
  }

  // 4. Numeric Suffix match (e.g. '001966' or '1966' endsWith in code)
  if (queryDigits.length >= 3) {
    const suffixMatch = list.find(c => {
      const cDigits = (c.customerCode || '').replace(/[^0-9]/g, '');
      return cDigits === queryDigits || cDigits.endsWith(queryDigits) || queryDigits.endsWith(cDigits);
    });
    if (suffixMatch) return suffixMatch;
  }

  // 5. Tax ID match (13 digits or 10+ digits match e.g. '0107535000213')
  if (queryDigits.length >= 10) {
    const taxMatch = list.find(c => {
      const cTax = (c.taxId || '').replace(/[^0-9]/g, '');
      return cTax === queryDigits || cTax.includes(queryDigits);
    });
    if (taxMatch) return taxMatch;
  }

  // 6. Phone number match (9-10 digits)
  if (queryDigits.length >= 9 && queryDigits.startsWith('0')) {
    const phoneMatch = list.find(c => {
      const cMobile = (c.mobile || '').replace(/[^0-9]/g, '');
      const cPhone = (c.phone || '').replace(/[^0-9]/g, '');
      return cMobile === queryDigits || cPhone === queryDigits;
    });
    if (phoneMatch) return phoneMatch;
  }

  // 7. Company Name / Contact Person match (2+ characters)
  if (queryLower.length >= 2 && !queryDigits.startsWith('010')) {
    const nameMatch = list.find(c => 
      (c.name && c.name.toLowerCase().includes(queryLower)) ||
      (c.contactPerson && c.contactPerson.toLowerCase().includes(queryLower))
    );
    if (nameMatch) return nameMatch;
  }

  // 8. Check dynamically parsed raw sheet data
  try {
    const directSheetMatch = findCustomerInSheetRawData(queryCode);
    if (directSheetMatch) {
      return directSheetMatch;
    }
  } catch (e) {
    // Ignore error
  }

  // 9. Fallback to DEFAULT_CUSTOMERS if query matches a default customer
  if (customerList && customerList !== DEFAULT_CUSTOMERS) {
    const fallbackDefault = findCustomerByCode(queryCode, DEFAULT_CUSTOMERS);
    if (fallbackDefault) return fallbackDefault;
  }

  return undefined;
}

/**
 * Search customers for autocomplete dropdown and directory
 */
export function searchCustomers(
  query: string,
  customerList?: CustomerRecord[]
): CustomerRecord[] {
  const list = (customerList || loadCustomers()).filter(Boolean);
  if (!query || !query.trim()) {
    return list.slice(0, 20);
  }
  const qClean = (query || '').trim().toLowerCase();
  const qNorm = normalizeCustomerCode(query || '');
  const qDigits = (query || '').replace(/[^0-9]/g, '');
  const qSigNum = extractSignificantNumber(query || '');

  const scored = list.map(c => {
    if (!c) return { customer: c, score: 0 };
    const code = (c.customerCode || '').toLowerCase();
    const codeNorm = normalizeCustomerCode(c.customerCode || '');
    const name = (c.name || '').toLowerCase();
    const contact = (c.contactPerson || '').toLowerCase();
    const phone = (c.mobile || c.phone || '').replace(/[^0-9]/g, '');
    const tax = (c.taxId || '').replace(/[^0-9]/g, '');
    const cDigits = (c.customerCode || '').replace(/[^0-9]/g, '');
    const cSigNum = extractSignificantNumber(c.customerCode || '');
    const dept = (c.department || '').toLowerCase();

    let score = 0;
    if (codeNorm && qNorm && codeNorm === qNorm) score += 100;
    else if (code.includes(qClean)) score += 50;
    else if (qSigNum && cSigNum && cSigNum === qSigNum) score += 40;
    else if (qDigits.length >= 2 && cDigits.includes(qDigits)) score += 30;

    if (name.includes(qClean)) score += 35;
    if (contact.includes(qClean)) score += 25;
    if (qDigits.length >= 4 && (tax.includes(qDigits) || phone.includes(qDigits))) score += 25;
    if (dept.includes(qClean)) score += 15;

    return { customer: c, score };
  });

  return scored
    .filter(item => item.customer && item.score > 0)
    .sort((a, b) => b.score - a.score)
    .map(item => item.customer)
    .slice(0, 15);
}

/**
 * Smart delimiter detection and line splitter (handles comma, semicolon, tab, quotes)
 */
export function splitRow(line: string, preferredDelimiter?: string): string[] {
  if (!line) return [];

  let delimiter = preferredDelimiter;
  if (!delimiter) {
    // Count commas, tabs, semicolons outside quotes
    let commas = 0, tabs = 0, semicolons = 0;
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') inQuotes = !inQuotes;
      else if (!inQuotes) {
        if (char === '\t') tabs++;
        else if (char === ',') commas++;
        else if (char === ';') semicolons++;
      }
    }
    if (tabs > commas && tabs > semicolons) delimiter = '\t';
    else if (semicolons > commas && semicolons > tabs) delimiter = ';';
    else delimiter = ',';
  }

  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

// Clean and extract fields from label strings
function cleanLabel(str: string): string {
  return String(str || '')
    .replace(/^[-*•#\d.]+\s*/, '')
    .replace(/[:：]/g, '')
    .trim()
    .toLowerCase();
}

// Helper to strip placeholder values, header labels, and empty strings
function cleanFieldValue(val: any): string {
  if (val === null || val === undefined) return '';
  const str = String(val).trim().replace(/^['"]+|['"]+$/g, '').trim();
  const lower = str.toLowerCase();
  if (
    !str ||
    lower === 'undefined' ||
    lower === 'null' ||
    lower === 'n/a' ||
    lower === 'na' ||
    lower === '-' ||
    lower === '--' ||
    lower === '---' ||
    lower === 'none' ||
    lower === 'ไม่มี' ||
    lower === 'ไม่ระบุ' ||
    lower === 'ข้อมูลผู้ติดต่อ' ||
    lower.includes('ข้อมูลผู้ติดต่อ') ||
    lower === 'ข้อมูลลูกค้า' ||
    lower.includes('ข้อมูลลูกค้า') ||
    lower === 'ผู้ติดต่อ' ||
    lower === 'ชื่อผู้ติดต่อ' ||
    lower === 'รหัสลูกค้า' ||
    lower === 'ชื่อลูกค้า' ||
    lower === 'ชื่อบริษัท' ||
    lower === 'ที่อยู่' ||
    lower === 'ที่อยู่ลูกค้า' ||
    lower === 'อีเมล' ||
    lower === 'เบอร์โทร' ||
    lower === 'เบอร์มือถือ' ||
    lower === 'เบอร์โทรศัพท์' ||
    lower === 'เลขผู้เสียภาษี' ||
    lower === 'เลขประจำตัวผู้เสียภาษี' ||
    lower === 'ส่วนลด' ||
    lower === 'customer code' ||
    lower === 'customer name' ||
    lower === 'company' ||
    lower === 'contact person' ||
    lower === 'phone' ||
    lower === 'tel' ||
    lower === 'mobile' ||
    lower === 'email' ||
    lower === 'e-mail' ||
    lower === 'address' ||
    lower === 'tax id' ||
    lower === 'taxno' ||
    lower === 'discount'
  ) {
    return '';
  }
  return str;
}

export function cleanEmail(val: any): string {
  const str = cleanFieldValue(val);
  if (!str) return '';
  // An email must contain '@' and '.', must NOT contain Thai characters, spaces, or contact labels
  if (
    /[\u0E00-\u0E7F]/.test(str) ||
    str.includes(' ') ||
    !str.includes('@') ||
    !str.includes('.') ||
    str.toLowerCase().includes('ข้อมูล') ||
    str.toLowerCase().includes('ผู้ติดต่อ') ||
    str.toLowerCase().includes('contact')
  ) {
    return '';
  }
  const match = str.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  return match ? match[0] : '';
}

export function cleanPhone(val: any): string {
  if (val === null || val === undefined) return '';
  const str = String(val).trim().replace(/^['"]+|['"]+$/g, '').trim();
  if (!str) return '';
  if (str.includes('@') || str.includes('ข้อมูลผู้ติดต่อ') || str.includes('ข้อมูลลูกค้า')) {
    return '';
  }
  const digits = str.replace(/[^0-9]/g, '');
  if (digits.length < 7) {
    return '';
  }
  return str;
}

export function cleanTaxId(val: any): string {
  if (val === null || val === undefined) return '';
  const str = String(val).trim().replace(/^['"]+|['"]+$/g, '').trim();
  if (!str) return '';
  if (str.includes('@') || str.includes('ข้อมูลผู้ติดต่อ') || str.includes('ข้อมูลลูกค้า')) {
    return '';
  }
  const digits = str.replace(/[^0-9]/g, '');
  if (digits.length >= 5) {
    return digits;
  }
  return '';
}

export function cleanContact(val: any): string {
  const str = cleanFieldValue(val);
  if (!str) return '';
  const lower = str.toLowerCase();
  if (
    str.includes('@') ||
    lower.includes('ข้อมูลผู้ติดต่อ') ||
    lower.includes('ข้อมูลลูกค้า') ||
    lower === 'ผู้ติดต่อ' ||
    lower === 'ชื่อผู้ติดต่อ' ||
    lower === 'ชื่อ นามสกุล ผู้ติดต่อ' ||
    lower === 'ชื่อ-นามสกุล ผู้ติดต่อ' ||
    lower === 'contact' ||
    lower === 'contact person' ||
    lower === 'contact name'
  ) {
    return '';
  }
  return str;
}

export function cleanAddress(val: any): string {
  const str = cleanFieldValue(val);
  if (!str) return '';
  const lower = str.toLowerCase();
  if (
    str.includes('@') ||
    lower.includes('ข้อมูลผู้ติดต่อ') ||
    lower.includes('ข้อมูลลูกค้า') ||
    lower === 'ที่อยู่' ||
    lower === 'ที่อยู่ลูกค้า' ||
    lower === 'ที่อยู่บริษัท' ||
    lower === 'address' ||
    lower === 'company address'
  ) {
    return '';
  }
  return str;
}

export function cleanCustomerCode(val: any): string {
  const str = cleanFieldValue(val);
  if (!str) return '';
  const lower = str.toLowerCase();
  if (
    lower.includes('ข้อมูลผู้ติดต่อ') ||
    lower.includes('ข้อมูลลูกค้า') ||
    lower === 'รหัสลูกค้า' ||
    lower === 'customer code' ||
    lower === 'code' ||
    lower === 'customercode'
  ) {
    return '';
  }
  return normalizeCustomerCode(str);
}

export function cleanCustomerName(val: any): string {
  const str = cleanFieldValue(val);
  if (!str) return '';
  const lower = str.toLowerCase();
  if (
    lower.includes('ข้อมูลผู้ติดต่อ') ||
    lower.includes('ข้อมูลลูกค้า') ||
    lower === 'ชื่อลูกค้า' ||
    lower === 'ชื่อบริษัท' ||
    lower === 'customer name' ||
    lower === 'company' ||
    lower === 'company name' ||
    lower === 'ลูกค้าไม่ระบุชื่อ'
  ) {
    return '';
  }
  return str;
}

/**
 * Ensure every field in a CustomerRecord has safe string defaults (fallback "")
 * to avoid any runtime errors or undefined issues in state or form rendering.
 */
export function sanitizeCustomerRecord(c: Partial<CustomerRecord> | null | undefined): CustomerRecord {
  if (!c) {
    return {
      id: `cust-${Date.now()}`,
      customerCode: '',
      name: '',
      taxId: '',
      address: '',
      contactPerson: '',
      mobile: '',
      phone: '',
      email: '',
      department: 'เอกชน',
      discountRate: 0,
      jobTitle: '',
      eventDate: '',
      eventTime: '',
      source: '',
      updatedAt: new Date().toISOString(),
    };
  }

  const phoneClean = cleanPhone(c.phone || c.mobile);
  const mobileClean = cleanPhone(c.mobile || c.phone);
  const emailClean = cleanEmail(c.email);
  const taxIdClean = cleanTaxId(c.taxId);
  const addressClean = cleanAddress(c.address);
  const contactClean = cleanContact(c.contactPerson);
  const codeClean = cleanCustomerCode(c.customerCode);
  const nameClean = cleanCustomerName(c.name) || (codeClean ? `ลูกค้า (${codeClean})` : 'ลูกค้าไม่ระบุชื่อ');

  return {
    ...c,
    id: c.id || `cust-${codeClean || Date.now()}`,
    customerCode: codeClean,
    name: nameClean,
    taxId: taxIdClean,
    address: addressClean,
    contactPerson: contactClean,
    mobile: mobileClean,
    phone: phoneClean,
    email: emailClean,
    department: cleanFieldValue(c.department) || 'เอกชน',
    discountRate: typeof c.discountRate === 'number' && !isNaN(c.discountRate) ? c.discountRate : 0,
    jobTitle: cleanFieldValue(c.jobTitle),
    eventDate: cleanFieldValue(c.eventDate),
    eventTime: cleanFieldValue(c.eventTime),
    foodBeverage: cleanFieldValue(c.foodBeverage),
    notes: cleanFieldValue(c.notes),
    source: cleanFieldValue(c.source) || 'Google Sheets',
    updatedAt: c.updatedAt || new Date().toISOString(),
  };
}

/**
 * Score how likely a column header represents Customer Code (e.g. 'KX001699')
 */
function scoreCodeColumn(header?: string, sampleValues?: string[]): number {
  const h = (header || '').toLowerCase().trim();

  // Instant Disqualifiers (Negative matches)
  if (
    h.includes('ไปรษณีย์') ||
    h.includes('postal') ||
    h.includes('zip') ||
    h.includes('สาขา') ||
    h.includes('branch') ||
    h.includes('ภาษี') ||
    h.includes('tax') ||
    h.includes('พนักงาน') ||
    h.includes('staff') ||
    h.includes('ลำดับ') ||
    h.includes('no.') ||
    h.includes('index') ||
    h.includes('item')
  ) {
    return -100;
  }

  let score = 0;

  // High-confidence header keywords
  if (
    h === 'รหัสลูกค้า' ||
    h === 'customercode' ||
    h === 'customer code' ||
    h === 'cust code' ||
    h === 'custcode' ||
    h === 'kx code' ||
    h === 'kxcode' ||
    h === 'client code' ||
    h === 'clientcode' ||
    h === 'customer id' ||
    h === 'cust id' ||
    h === 'เลขที่ลูกค้า' ||
    h === 'รหัสประจำตัวลูกค้า' ||
    h === 'client id'
  ) {
    score += 80;
  } else if (h.includes('รหัสลูกค้า') || h.includes('customercode') || h.includes('kx')) {
    score += 50;
  } else if (h.includes('code') || h === 'รหัส' || h === 'id') {
    score += 25;
  }

  // Data pattern inspection: look for customer code formats in the data rows
  let kxCount = 0;
  let shortCodeCount = 0;
  let nonZipNumbers = 0;

  for (const val of sampleValues || []) {
    const v = String(val || '').trim();
    if (!v) continue;
    if (/^KX[-_ ]?\d{4,7}$/i.test(v)) {
      kxCount++;
    } else if (/^[A-Z]{1,4}[-_ ]?\d{3,7}$/i.test(v)) {
      shortCodeCount++;
    } else if (/^\d{3,6}$/.test(v) && !/^\d{5}$/.test(v)) {
      nonZipNumbers++;
    }
  }

  score += kxCount * 15;
  score += shortCodeCount * 8;
  score += nonZipNumbers * 3;

  return score;
}

/**
 * Score how likely a column header represents the Company / Customer Name.
 */
function scoreNameColumn(header?: string, sampleValues?: string[]): number {
  const h = (header || '').toLowerCase().trim();

  // Disqualifiers
  if (
    h.includes('ผู้ติดต่อ') ||
    h.includes('contact') ||
    h.includes('พนักงาน') ||
    h.includes('staff') ||
    h.includes('อีเมล') ||
    h.includes('email') ||
    h.includes('ที่อยู่') ||
    h.includes('address') ||
    h.includes('ภาษี') ||
    h.includes('tax')
  ) {
    return -100;
  }

  let score = 0;
  if (
    h === 'ชื่อลูกค้า' ||
    h === 'company' ||
    h === 'customer name' ||
    h === 'ชื่อบริษัท' ||
    h === 'company name' ||
    h === 'ชื่อนิติบุคคล' ||
    h === 'บริษัท' ||
    h === 'ลูกค้า' ||
    h === 'client name' ||
    h === 'account name' ||
    h === 'organization' ||
    h === 'ชื่อองค์กร' ||
    h === 'หน่วยงาน' ||
    h === 'customer'
  ) {
    score += 85;
  } else if (h.includes('ชื่อลูกค้า') || h.includes('company') || h.includes('customer name') || h.includes('ชื่อบริษัท')) {
    score += 55;
  } else if ((h.includes('ชื่อ') && !h.includes('ผู้ติดต่อ')) || (h.includes('name') && !h.includes('contact'))) {
    score += 30;
  }

  // Data pattern inspection
  for (const val of sampleValues || []) {
    const v = String(val || '').trim();
    if (v.includes('บริษัท') || v.includes('บจก') || v.includes('หจก') || v.includes('จำกัด') || v.includes('Co.,') || v.includes('Ltd') || v.includes('มหาวิทยาลัย')) {
      score += 5;
    }
  }

  return score;
}

/**
 * Score how likely a column represents Tax ID (เลขผู้เสียภาษี)
 * Supports: Tax ID, TaxNo, Tax No, เลขผู้เสียภาษี, เลขประจำตัวผู้เสียภาษี, ภ.พ.20, Tax Identification Number, TaxNumber, Tax_ID, เลขนิติบุคคล, เลขประจำตัวผู้เสียภาษีอากร
 */
function scoreTaxIdColumn(header?: string, sampleValues?: string[]): number {
  const h = (header || '').toLowerCase().trim();
  if (
    h.includes('ไปรษณีย์') ||
    h.includes('โทร') ||
    h.includes('phone') ||
    h.includes('vat') ||
    h.includes('ภาษีมูลค่าเพิ่ม') ||
    h.includes('อัตราภาษี') ||
    h.includes('tax rate') ||
    h.includes('tax%')
  ) {
    return -100;
  }

  let score = 0;
  // Exact high-confidence matches (Thai & English)
  if (
    h === 'tax id' ||
    h === 'taxid' ||
    h === 'tax no' ||
    h === 'tax no.' ||
    h === 'taxno' ||
    h === 'tax_no' ||
    h === 'tax-no' ||
    h === 'tax number' ||
    h === 'taxnumber' ||
    h === 'tax_id' ||
    h === 'tax-id' ||
    h === 'เลขผู้เสียภาษี' ||
    h === 'เลขประจำตัวผู้เสียภาษี' ||
    h === 'เลขประจำตัวผู้เสียภาษีอากร' ||
    h === 'เลขนิติบุคคล' ||
    h === 'tax identification number' ||
    h === 'taxpayer id' ||
    h === 'taxpayer identification number' ||
    h === 'ภ.พ.20' ||
    h === 'ภพ20' ||
    h === 'เลขภาษี' ||
    h === '13 หลัก'
  ) {
    score += 85;
  } else if (
    h.includes('เลขผู้เสียภาษี') ||
    h.includes('เลขประจำตัวผู้เสียภาษี') ||
    h.includes('taxno') ||
    h.includes('tax id') ||
    h.includes('tax_id') ||
    h.includes('ภ.พ.20') ||
    h.includes('ภพ20') ||
    h.includes('ภาษี') ||
    h.includes('tax')
  ) {
    score += 50;
  }

  for (const val of sampleValues || []) {
    const raw = String(val || '').trim();
    const digits = raw.replace(/[^0-9]/g, '');
    if (digits.length === 13) {
      score += 10;
    } else if (digits.length >= 10 && digits.length <= 15) {
      score += 5;
    }
  }
  return score;
}

/**
 * Score how likely a column header represents Contact Person (ชื่อผู้ติดต่อ / ผู้ประสานงาน)
 * Supports: ชื่อผู้ติดต่อ, ผู้ติดต่อ, Contact Person, Contact Name, Contact, ผู้ประสานงาน, ชื่อ นามสกุล ผู้ติดต่อ
 */
function scoreContactColumn(header?: string, sampleValues?: string[]): number {
  const h = (header || '').toLowerCase().trim();
  if (
    h.includes('email') ||
    h.includes('e-mail') ||
    h.includes('อีเมล') ||
    h.includes('อีเมล์') ||
    h.includes('mail') ||
    h.includes('บริษัท') ||
    h.includes('company') ||
    h.includes('ที่อยู่') ||
    h.includes('address') ||
    h.includes('โทร') ||
    h.includes('phone') ||
    h.includes('tel') ||
    h.includes('ภาษี') ||
    h.includes('tax')
  ) {
    return -100;
  }

  let score = 0;
  if (
    h === 'ชื่อผู้ติดต่อ' ||
    h === 'ผู้ติดต่อ' ||
    h === 'contact person' ||
    h === 'contact name' ||
    h === 'contact' ||
    h === 'ผู้ประสานงาน' ||
    h === 'ชื่อ นามสกุล ผู้ติดต่อ' ||
    h === 'ชื่อ-นามสกุล ผู้ติดต่อ' ||
    h === 'coordinator' ||
    h === 'ผู้ประสาน'
  ) {
    score += 90;
  } else if (
    h.includes('ผู้ติดต่อ') ||
    h.includes('contact') ||
    h.includes('ผู้ประสานงาน') ||
    h.includes('ชื่อ-นามสกุล')
  ) {
    score += 55;
  }

  for (const val of sampleValues || []) {
    const v = String(val || '').trim();
    if (v.startsWith('คุณ') || v.startsWith('นาย') || v.startsWith('นาง') || v.startsWith('ดร.') || v.startsWith('Mr.') || v.startsWith('Ms.')) {
      score += 5;
    }
  }
  return score;
}

/**
 * Score how likely a column represents Phone / Mobile (เบอร์โทร, เบอร์มือถือ, เบอร์โทรศัพท์)
 * Supports: เบอร์โทร, Phone, Tel, Mobile, เบอร์มือถือ, เบอร์โทรศัพท์, โทรศัพท์, มือถือ, โทร, Tel No, Phone No
 */
function scorePhoneColumn(header?: string, sampleValues?: string[]): number {
  const h = (header || '').toLowerCase().trim();
  if (
    h.includes('ภาษี') ||
    h.includes('tax') ||
    h.includes('ไปรษณีย์') ||
    h.includes('zip') ||
    h.includes('postal') ||
    h.includes('code') ||
    h.includes('รหัส') ||
    h.includes('email') ||
    h.includes('อีเมล') ||
    h.includes('ที่อยู่') ||
    h.includes('address')
  ) {
    return -100;
  }

  let score = 0;
  if (
    h === 'เบอร์โทร' ||
    h === 'phone' ||
    h === 'tel' ||
    h === 'mobile' ||
    h === 'เบอร์มือถือ' ||
    h === 'เบอร์โทรศัพท์' ||
    h === 'โทรศัพท์' ||
    h === 'มือถือ' ||
    h === 'โทร' ||
    h === 'tel no' ||
    h === 'tel.' ||
    h === 'phone no' ||
    h === 'phone_no' ||
    h === 'phone number' ||
    h === 'mobile phone' ||
    h === 'telephone' ||
    h === 'contact number' ||
    h === 'เบอร์ติดต่อ' ||
    h === 'เบอร์ผู้ติดต่อ'
  ) {
    score += 90;
  } else if (
    h.includes('เบอร์โทร') ||
    h.includes('เบอร์มือถือ') ||
    h.includes('โทรศัพท์') ||
    h.includes('เบอร์ติดต่อ') ||
    h.includes('mobile') ||
    h.includes('phone') ||
    h.includes('tel') ||
    h.includes('โทร')
  ) {
    score += 55;
  }

  for (const val of sampleValues || []) {
    const digits = String(val || '').replace(/[^0-9]/g, '');
    if (digits.length >= 9 && digits.length <= 10 && digits.startsWith('0')) {
      score += 8;
    }
  }
  return score;
}

/**
 * Score how likely a column represents Email (อีเมล)
 * Supports: อีเมล, Email, E-mail, อีเมล์, Mail, Contact Email, Customer Email
 * CRITICAL: Must NEVER match Contact Person columns or "ข้อมูลผู้ติดต่อ"
 */
function scoreEmailColumn(header?: string, sampleValues?: string[]): number {
  const h = (header || '').toLowerCase().trim();
  if (h.includes('web') || h.includes('url') || h.includes('link')) return -100;

  // Disqualify contact name, phone, address, tax headers if they don't explicitly mention email
  const isExplicitEmail = h.includes('email') || h.includes('e-mail') || h.includes('อีเมล') || h.includes('อีเมล์') || h === 'mail';
  if (!isExplicitEmail) {
    if (
      h.includes('ผู้ติดต่อ') ||
      h.includes('contact') ||
      h.includes('person') ||
      h.includes('ชื่อ') ||
      h.includes('name') ||
      h.includes('ข้อมูล') ||
      h.includes('โทร') ||
      h.includes('phone') ||
      h.includes('tel') ||
      h.includes('ที่อยู่') ||
      h.includes('address') ||
      h.includes('ภาษี') ||
      h.includes('tax')
    ) {
      return -100;
    }
  }

  let score = 0;
  if (
    h === 'อีเมล' ||
    h === 'email' ||
    h === 'e-mail' ||
    h === 'อีเมล์' ||
    h === 'mail' ||
    h === 'contact email' ||
    h === 'customer email' ||
    h === 'e_mail' ||
    h === 'email address' ||
    h === 'e-mail address' ||
    h === 'อีเมลลูกค้า' ||
    h === 'อีเมลติดต่อ' ||
    h === 'user email'
  ) {
    score += 95;
  } else if (
    h.includes('email') ||
    h.includes('e-mail') ||
    h.includes('อีเมล') ||
    h.includes('อีเมล์')
  ) {
    score += 65;
  } else if (h.includes('mail') && !h.includes('gmail')) {
    score += 30;
  }

  // Sample data verification: strongly verify if samples contain '@'
  let atCount = 0;
  for (const val of sampleValues || []) {
    const v = String(val || '').trim();
    if (v.includes('@') && v.includes('.')) {
      atCount++;
    }
  }
  score += atCount * 15;

  return score;
}

/**
 * Score how likely a column represents Address (ที่อยู่)
 * Supports: ที่อยู่, Address, ที่อยู่ลูกค้า, ที่อยู่บริษัท, Company Address, Billing Address, Customer Address
 */
function scoreAddressColumn(header?: string, sampleValues?: string[]): number {
  const h = (header || '').toLowerCase().trim();
  if (
    h.includes('email') ||
    h.includes('e-mail') ||
    h.includes('อีเมล') ||
    h.includes('อีเมล์') ||
    h.includes('ip') ||
    h.includes('mac') ||
    h.includes('web') ||
    h.includes('โทร') ||
    h.includes('phone') ||
    h.includes('ผู้ติดต่อ') ||
    h.includes('contact') ||
    h.includes('ภาษี') ||
    h.includes('tax')
  ) {
    return -100;
  }

  let score = 0;
  if (
    h === 'ที่อยู่' ||
    h === 'address' ||
    h === 'ที่อยู่ลูกค้า' ||
    h === 'ที่อยู่บริษัท' ||
    h === 'company address' ||
    h === 'customer address' ||
    h === 'billing address' ||
    h === 'ที่อยู่เปิดบิล' ||
    h === 'ที่อยู่ออกใบกำกับภาษี' ||
    h === 'ที่อยู่ออกใบกำกับ' ||
    h === 'ที่อยู่ออกใบเสนอราคา' ||
    h === 'ที่อยู่ตามภ.พ.20' ||
    h === 'full address' ||
    h === 'สถานที่ตั้ง' ||
    h === 'สถานที่ติดต่อ' ||
    h === 'address detail' ||
    h === 'contact address' ||
    h === 'location'
  ) {
    score += 90;
  } else if (
    h.includes('ที่อยู่') ||
    h.includes('address') ||
    h.includes('สถานที่ตั้ง') ||
    h.includes('สถานที่ติดต่อ') ||
    h.includes('สถานที่')
  ) {
    score += 55;
  }

  for (const val of sampleValues || []) {
    const v = String(val || '');
    if (
      v.includes('ถนน') ||
      v.includes('ซอย') ||
      v.includes('แขวง') ||
      v.includes('เขต') ||
      v.includes('กทม') ||
      v.includes('จังหวัด') ||
      v.includes('อำเภอ') ||
      v.includes('ตำบล') ||
      v.includes('ต.') ||
      v.includes('อ.') ||
      v.includes('จ.') ||
      v.includes('ถ.') ||
      v.includes('เลขที่') ||
      /\b\d{5}\b/.test(v)
    ) {
      score += 8;
    }
  }
  return score;
}

/**
 * Score how likely a column represents Discount (%)
 */
function scoreDiscountColumn(header?: string, sampleValues?: string[], colIndex?: number): number {
  const h = (header || '').toLowerCase().trim();
  if (h.includes('vat') || h.includes('ภาษีมูลค่าเพิ่ม') || h.includes('tax rate') || h.includes('tax%')) {
    return -100;
  }

  let score = 0;
  if (colIndex === 9) {
    score += 45;
  }
  if (
    h === 'ส่วนลด' ||
    h === 'ส่วนลด (%)' ||
    h === 'ส่วนลด(%)' ||
    h === '%ส่วนลด' ||
    h === 'ส่วนลดค่าห้อง' ||
    h === 'อัตราส่วนลด' ||
    h === 'ส่วนลดพิเศษ' ||
    h === 'เปอร์เซ็นต์ส่วนลด' ||
    h === 'discount' ||
    h === 'discount (%)' ||
    h === 'discount rate' ||
    h === 'discount_rate' ||
    h === 'disc' ||
    h === 'rate' ||
    h === 'col j' ||
    h === 'column j' ||
    h === 'j'
  ) {
    score += 70;
  } else if (h.includes('ส่วนลด') || h.includes('discount') || h.includes('disc')) {
    score += 50;
  }

  for (const val of sampleValues || []) {
    const v = String(val || '').trim();
    if (/%$/.test(v) || /^\d{1,2}(\.\d+)?%?$/.test(v) || /^(0\.\d+)$/.test(v) || /ลด\s*\d+/.test(v)) {
      score += 7;
    }
  }
  return score;
}

/**
 * Dynamic Direct Reference Discount Extractor:
 * 1. Target Column J (Index 9 = 10th column in 1-based indexing in Google Sheets: A..J) directly 100%.
 *    - If Column J is present in the row, its exact value is used without any hardcoding or overrides:
 *      * If 0% -> returns 0
 *      * If 20% -> returns 20
 *      * If 15% -> returns 15
 * 2. Only if the row has fewer than 10 columns (cols.length < 10):
 *    - Check the detected discountIdx or headerCols containing "ส่วนลด" / "Discount".
 */
export function extractDiscountFromRow(
  cols: string[],
  discountIdx: number,
  headerCols: string[]
): number {
  if (!cols || !Array.isArray(cols)) return 0;

  // Direct Column J (Index 9, 10th column in Google Sheets: A=1, B=2, ..., J=10)
  if (cols.length >= 10 && cols[9] !== undefined && cols[9] !== null) {
    const rawJ = String(cols[9]).trim();
    return parseDiscountPercentage(rawJ);
  }

  // Fallback only if row does not have 10 columns
  if (discountIdx !== -1 && cols.length > discountIdx && cols[discountIdx] !== undefined && cols[discountIdx] !== null) {
    return parseDiscountPercentage(cols[discountIdx]);
  }

  // Fallback: Check headers if row doesn't have Column J
  if (headerCols && Array.isArray(headerCols) && headerCols.length > 0) {
    for (let c = 0; c < headerCols.length; c++) {
      const h = String(headerCols[c] || '').toLowerCase().trim();
      if (h.includes('ส่วนลด') || h.includes('discount') || h.includes('disc') || h === '%') {
        if (cols.length > c && cols[c] !== undefined && cols[c] !== null) {
          return parseDiscountPercentage(cols[c]);
        }
      }
    }
  }

  return 0;
}

/**
 * Score how likely a column represents Department / Customer Type (เอกชน, ราชการ, มหาวิทยาลัย)
 */
function scoreDepartmentColumn(header?: string, sampleValues?: string[]): number {
  const h = (header || '').toLowerCase().trim();
  let score = 0;
  if (
    h.includes('ประเภทลูกค้า') ||
    h.includes('กลุ่มลูกค้า') ||
    h.includes('หน่วยงาน') ||
    h.includes('สังกัด') ||
    h.includes('department') ||
    h.includes('client type') ||
    h.includes('customer type') ||
    h === 'ประเภท'
  ) {
    score += 55;
  }

  for (const val of sampleValues || []) {
    const v = String(val || '').trim().toLowerCase();
    if (
      v.includes('เอกชน') ||
      v.includes('ราชการ') ||
      v.includes('รัฐ') ||
      v.includes('มหาวิทยาลัย') ||
      v.includes('มจธ')
    ) {
      score += 8;
    }
  }
  return score;
}

/**
 * Universal Parser for Customer Data:
 * 1. Smart Tabular CSV / TSV / Semicolon with automatic column mapping & data-inspection.
 * 2. Vertical form-response block format (e.g. from LINE, Google Forms, or email).
 */
export function parseCustomerData(rawText: string, sourceLabel = 'นำเข้า'): CustomerRecord[] {
  if (!rawText || !rawText.trim()) return [];

  // Cache raw sheet text for Dynamic Direct Reference
  try {
    if (typeof localStorage !== 'undefined' && rawText.length > 20) {
      localStorage.setItem(RAW_SHEET_DATA_KEY, rawText);
    }
  } catch (e) {
    // Ignore storage issues
  }

  const rawLines = rawText.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
  if (rawLines.length === 0) return [];

  // 1. Attempt Tabular parsing first
  // Find the row that is most likely the table header
  let bestHeaderIndex = -1;
  let maxHeaderColsCount = 0;

  for (let i = 0; i < Math.min(rawLines.length, 10); i++) {
    const rawLine = rawLines[i];
    if (!rawLine) continue;
    const cols = splitRow(rawLine);
    if (cols.length >= 2) {
      let keywordsCount = 0;
      for (const col of cols) {
        const lower = String(col || '').toLowerCase();
        if (
          lower.includes('รหัส') ||
          lower.includes('ชื่อ') ||
          lower.includes('บริษัท') ||
          lower.includes('ลูกค้า') ||
          lower.includes('ที่อยู่') ||
          lower.includes('ภาษี') ||
          lower.includes('ผู้ติดต่อ') ||
          lower.includes('เบอร์') ||
          lower.includes('code') ||
          lower.includes('name') ||
          lower.includes('tax') ||
          lower.includes('phone')
        ) {
          keywordsCount++;
        }
      }
      if (keywordsCount >= 2 && keywordsCount > maxHeaderColsCount) {
        maxHeaderColsCount = keywordsCount;
        bestHeaderIndex = i;
      }
    }
  }

  if (bestHeaderIndex !== -1) {
    const headerCols = splitRow(rawLines[bestHeaderIndex] || '');
    const numCols = headerCols.length;

    // Sample data rows to assist scoring
    const sampleRows: string[][] = [];
    for (let i = bestHeaderIndex + 1; i < Math.min(rawLines.length, bestHeaderIndex + 15); i++) {
      const lineStr = rawLines[i];
      if (!lineStr) continue;
      const cols = splitRow(lineStr);
      if (cols.length >= 2) sampleRows.push(cols);
    }

    // Determine the best column index for each field
    const getBestColumn = (
      scorer: (header: string, sampleValues: string[], colIndex?: number) => number,
      assignedCols: Set<number>
    ) => {
      let bestIdx = -1;
      let highestScore = 0;

      for (let c = 0; c < numCols; c++) {
        if (assignedCols.has(c)) continue;
        const header = String(headerCols[c] || '');
        const samples = sampleRows.map(r => (r && r[c] !== undefined && r[c] !== null) ? String(r[c]) : '');
        const score = scorer(header, samples, c);
        if (score > highestScore) {
          highestScore = score;
          bestIdx = c;
        }
      }
      return bestIdx;
    };

    const assigned = new Set<number>();
    const codeIdx = getBestColumn(scoreCodeColumn, assigned);
    if (codeIdx !== -1) assigned.add(codeIdx);

    const nameIdx = getBestColumn(scoreNameColumn, assigned);
    if (nameIdx !== -1) assigned.add(nameIdx);

    const taxIdIdx = getBestColumn(scoreTaxIdColumn, assigned);
    if (taxIdIdx !== -1) assigned.add(taxIdIdx);

    const contactIdx = getBestColumn(scoreContactColumn, assigned);
    if (contactIdx !== -1) assigned.add(contactIdx);

    const phoneIdx = getBestColumn(scorePhoneColumn, assigned);
    if (phoneIdx !== -1) assigned.add(phoneIdx);

    // Optional second phone/mobile column if available
    const mobileIdx = getBestColumn((h, s) => {
      const header = (h || '').toLowerCase().trim();
      if (header.includes('มือถือ') || header.includes('mobile')) return 70;
      return scorePhoneColumn(h, s);
    }, assigned);
    if (mobileIdx !== -1) assigned.add(mobileIdx);

    const emailIdx = getBestColumn(scoreEmailColumn, assigned);
    if (emailIdx !== -1) assigned.add(emailIdx);

    const addressIdx = getBestColumn(scoreAddressColumn, assigned);
    if (addressIdx !== -1) assigned.add(addressIdx);

    let discountIdx = getBestColumn(scoreDiscountColumn, assigned);
    // Explicit Fallback for Column J (Index 9 in 0-indexed system, i.e. 10th column):
    // If not already matched and row has at least 10 columns, check Column J
    if (discountIdx === -1 && numCols >= 10 && !assigned.has(9)) {
      discountIdx = 9;
    }
    if (discountIdx !== -1) assigned.add(discountIdx);

    const deptIdx = getBestColumn(scoreDepartmentColumn, assigned);
    if (deptIdx !== -1) assigned.add(deptIdx);

    const parsedTabular: CustomerRecord[] = [];

    for (let i = bestHeaderIndex + 1; i < rawLines.length; i++) {
      const lineStr = rawLines[i];
      if (!lineStr) continue;
      const cols = splitRow(lineStr);
      if (cols.length < 1) continue;

      let rawCode = (codeIdx !== -1 && cols[codeIdx] !== undefined && cols[codeIdx] !== null) ? String(cols[codeIdx]).trim() : '';
      const name = (nameIdx !== -1 && cols[nameIdx] !== undefined && cols[nameIdx] !== null) ? String(cols[nameIdx]).trim() : '';
      let taxId = (taxIdIdx !== -1 && cols[taxIdIdx] !== undefined && cols[taxIdIdx] !== null) ? String(cols[taxIdIdx]).trim() : '';
      const contact = (contactIdx !== -1 && cols[contactIdx] !== undefined && cols[contactIdx] !== null) ? String(cols[contactIdx]).trim() : '';
      const rawPhone = (phoneIdx !== -1 && cols[phoneIdx] !== undefined && cols[phoneIdx] !== null) ? String(cols[phoneIdx]).trim() : '';
      const rawMobile = (mobileIdx !== -1 && cols[mobileIdx] !== undefined && cols[mobileIdx] !== null) ? String(cols[mobileIdx]).trim() : '';
      let email = (emailIdx !== -1 && cols[emailIdx] !== undefined && cols[emailIdx] !== null) ? String(cols[emailIdx]).trim() : '';
      let address = (addressIdx !== -1 && cols[addressIdx] !== undefined && cols[addressIdx] !== null) ? String(cols[addressIdx]).trim() : '';

      // Strip spreadsheet escape quotes e.g. "'0105558000000" or """value"""
      taxId = taxId.replace(/^['"]+|['"]+$/g, '').trim();
      email = email.replace(/^['"]+|['"]+$/g, '').trim();
      address = address.replace(/^['"]+|['"]+$/g, '').trim();

      const phoneFinal = (rawPhone || rawMobile || '').replace(/^['"]+|['"]+$/g, '').trim();
      const mobileFinal = (rawMobile || rawPhone || '').replace(/^['"]+|['"]+$/g, '').trim();

      // Multi-tier Column J and offset discount extraction
      const discountRate = extractDiscountFromRow(cols, discountIdx, headerCols);

      let department = '';
      if (deptIdx !== -1 && cols[deptIdx] !== undefined && cols[deptIdx] !== null) {
        department = String(cols[deptIdx]).trim();
      }
      if (!department) {
        if (name && (name.includes('มหาวิทยาลัย') || name.includes('กระทรวง') || name.includes('กรม') || name.includes('สวทช') || name.includes('มจธ'))) {
          department = 'ราชการ';
        } else {
          department = 'เอกชน';
        }
      }

      // If code is empty but row contains a KX code anywhere, extract it
      if (!rawCode) {
        for (const col of cols) {
          if (!col) continue;
          const match = String(col).match(/\b(KX[-_ ]?\d{3,7})\b/i);
          if (match) {
            rawCode = match[1];
            break;
          }
        }
      }

      // If neither code nor name exist, skip empty row
      if (!rawCode && !name) continue;

      // Clean customer code
      const customerCode = normalizeCustomerCode(rawCode) || (name ? `CUST-${i}` : '');
      if (!customerCode && !name) continue;

      const record = sanitizeCustomerRecord({
        id: `cust-${customerCode || i}-${Date.now()}`,
        customerCode: customerCode,
        name: name || 'ลูกค้าไม่ระบุชื่อ',
        taxId: taxId || '',
        address: address || '',
        contactPerson: contact || '',
        mobile: mobileFinal || '',
        phone: phoneFinal || '',
        email: email || '',
        department: department || 'เอกชน',
        discountRate: discountRate !== undefined ? discountRate : 0,
        source: sourceLabel,
        updatedAt: new Date().toISOString(),
      });

      parsedTabular.push(record);
    }

    if (parsedTabular.length > 0) {
      return parsedTabular;
    }
  }

  // 2. Vertical Block Parsing (User's specific text or form copy format)
  const parsedVertical: CustomerRecord[] = [];
  let currentRecord: Partial<CustomerRecord> | null = null;

  const commitRecord = () => {
    if (currentRecord && (currentRecord.customerCode || currentRecord.name || currentRecord.taxId)) {
      let rawCode = currentRecord.customerCode || '';
      if (!rawCode && currentRecord.taxId) {
        const cleanTax = currentRecord.taxId.replace(/[^0-9]/g, '');
        const matchedByTax = DEFAULT_CUSTOMERS.find(dc => (dc.taxId || '').replace(/[^0-9]/g, '') === cleanTax);
        if (matchedByTax) {
          rawCode = matchedByTax.customerCode;
          if (!currentRecord.address && matchedByTax.address) currentRecord.address = matchedByTax.address;
          if (!currentRecord.department && matchedByTax.department) currentRecord.department = matchedByTax.department;
          if (currentRecord.discountRate === undefined && matchedByTax.discountRate !== undefined) currentRecord.discountRate = matchedByTax.discountRate;
        }
      }
      const cleanCode = normalizeCustomerCode(rawCode);

      const record = sanitizeCustomerRecord({
        id: `cust-${cleanCode || Date.now()}`,
        customerCode: cleanCode || (currentRecord.name ? `CUST-${parsedVertical.length + 1}` : ''),
        name: currentRecord.name?.trim() || 'ลูกค้าไม่ระบุชื่อ',
        taxId: currentRecord.taxId?.trim() || '',
        address: currentRecord.address?.trim() || '',
        contactPerson: currentRecord.contactPerson?.trim() || '',
        mobile: currentRecord.mobile?.trim() || currentRecord.phone?.trim() || '',
        phone: currentRecord.phone?.trim() || currentRecord.mobile?.trim() || '',
        email: currentRecord.email?.trim() || '',
        department: currentRecord.department?.trim() || 'เอกชน',
        discountRate: currentRecord.discountRate !== undefined ? currentRecord.discountRate : 0,
        jobTitle: currentRecord.jobTitle?.trim() || '',
        eventDate: currentRecord.eventDate?.trim() || '',
        eventTime: currentRecord.eventTime?.trim() || '',
        source: sourceLabel,
        updatedAt: new Date().toISOString(),
      });

      parsedVertical.push(record);
    }
    currentRecord = null;
  };

  for (let i = 0; i < rawLines.length; i++) {
    const line = String(rawLines[i] || '');
    if (!line) continue;
    const cols = splitRow(line);
    const col0 = String(cols[0] || '');
    const col1 = String(cols[1] || '');

    // Check for Customer Code in lines like "รบกวนขอข้อมูลการออกใบเสนอราคา,KX001699" or "KX001699"
    const kxMatch = line ? line.match(/\b(KX[-_ ]?\d{4,7})\b/i) : null;
    const isNewBlock = 
      line.includes('รบกวนขอข้อมูลการออกใบเสนอราคา') ||
      (col0.includes('รหัสลูกค้า') && col1) ||
      (kxMatch && !col0.includes('ที่อยู่') && !col0.includes('อ้างอิง')) ||
      (col0.includes('เลขผู้เสียภาษี') && currentRecord && (currentRecord.taxId || currentRecord.name));

    if (isNewBlock && currentRecord && (currentRecord.customerCode || currentRecord.name)) {
      commitRecord();
    }

    if (!currentRecord) {
      currentRecord = {
        customerCode: '',
        name: '',
        taxId: '',
        address: '',
        contactPerson: '',
        mobile: '',
        phone: '',
        email: '',
      };
    }

    if (kxMatch && !currentRecord.customerCode) {
      currentRecord.customerCode = normalizeCustomerCode(kxMatch[1]);
    }

    const label = cleanLabel(col0);
    const rawVal = col1 || (cols.length > 2 ? cols.slice(1).map(c => String(c || '')).join(' ').trim() : '');
    const val = rawVal.replace(/^['"]+|['"]+$/g, '').trim();

    if (
      label.includes('ชื่อ นามสกุล ผู้ติดต่อ') ||
      label.includes('ชื่อผู้ติดต่อ') ||
      label.includes('ผู้ติดต่อ') ||
      label.includes('ผู้ประสานงาน') ||
      label.includes('contact person') ||
      label.includes('contact name') ||
      label.includes('contact')
    ) {
      currentRecord.contactPerson = val;
    } else if (
      label.includes('เบอร์โทร') ||
      label.includes('เบอร์มือถือ') ||
      label.includes('เบอร์โทรศัพท์') ||
      label.includes('โทรศัพท์') ||
      label.includes('มือถือ') ||
      label.includes('โทร') ||
      label.includes('mobile') ||
      label.includes('phone') ||
      label.includes('tel') ||
      label.includes('telephone')
    ) {
      currentRecord.mobile = val;
      currentRecord.phone = val;
    } else if (
      label.includes('email') ||
      label.includes('e-mail') ||
      label.includes('อีเมล') ||
      label.includes('อีเมล์') ||
      label.includes('mail')
    ) {
      currentRecord.email = val;
    } else if (
      label.includes('ชื่อบริษัท') ||
      label.includes('ชื่อลูกค้า') ||
      label.includes('company') ||
      label.includes('customer name') ||
      label.includes('client name') ||
      (label.includes('บริษัท') && !label.includes('ผู้ติดต่อ'))
    ) {
      currentRecord.name = val;
    } else if (
      label.includes('ที่อยู่') ||
      label.includes('ที่อยู่ลูกค้า') ||
      label.includes('ที่อยู่บริษัท') ||
      label.includes('address') ||
      label.includes('สถานที่ตั้ง') ||
      label.includes('สถานที่ติดต่อ')
    ) {
      currentRecord.address = val;
    } else if (
      label.includes('เลขประจำตัวผู้เสียภาษี') ||
      label.includes('เลขผู้เสียภาษี') ||
      label.includes('tax') ||
      label.includes('taxno') ||
      label.includes('tax id') ||
      label.includes('tax no') ||
      label.includes('ภ.พ.20') ||
      label.includes('ภพ20') ||
      label.includes('ภาษี')
    ) {
      currentRecord.taxId = val.replace(/^['"]+|['"]+$/g, '').trim();
    } else if (label.includes('ชื่องาน')) {
      currentRecord.jobTitle = val;
    } else if (label.includes('วันใช้งาน') || label.includes('วันจัดงาน')) {
      currentRecord.eventDate = val;
    } else if (label.includes('เวลา')) {
      currentRecord.eventTime = val;
    } else if (label.includes('ส่วนลด') || label.includes('discount')) {
      currentRecord.discountRate = parseDiscountPercentage(val);
    } else if (label.includes('ประเภทลูกค้า') || label.includes('หน่วยงาน') || label.includes('department') || label.includes('ประเภท')) {
      currentRecord.department = val.trim();
    } else if (label.includes('รหัสลูกค้า') || (label === 'code' && !label.includes('zip') && !label.includes('post'))) {
      if (val) currentRecord.customerCode = normalizeCustomerCode(val);
    }
  }

  commitRecord();
  return parsedVertical;
}

/**
 * Convert Google Sheet URL into direct CSV export link with cache-busting support
 */
export function formatGoogleSheetUrl(inputUrl?: string): string {
  const url = String(inputUrl || '').trim();
  if (!url) return '';

  // Already an export CSV or gviz link
  if (url.includes('format=csv') || url.includes('output=csv') || url.includes('tqx=out:csv')) {
    return url;
  }

  // Published Google Sheet URL: https://docs.google.com/spreadsheets/d/e/{PUB_ID}/pubhtml...
  const pubMatch = url.match(/\/spreadsheets\/d\/e\/([a-zA-Z0-9-_]+)/);
  if (pubMatch && pubMatch[1]) {
    const gidMatch = url.match(/[#&?]gid=([0-9]+)/);
    const gidParam = gidMatch ? `&gid=${gidMatch[1]}` : '';
    return `https://docs.google.com/spreadsheets/d/e/${pubMatch[1]}/pub?output=csv${gidParam}`;
  }

  // Standard Google Sheet URL (supports /u/0/ or regular): https://docs.google.com/spreadsheets/(?:u/\d+/)?d/{SPREADSHEET_ID}/edit#gid={GID}
  const sheetIdMatch = url.match(/\/spreadsheets\/(?:u\/\d+\/)?d\/([a-zA-Z0-9-_]+)/);
  if (sheetIdMatch && sheetIdMatch[1]) {
    const sheetId = sheetIdMatch[1];
    const gidMatch = url.match(/[#&?]gid=([0-9]+)/);
    const gid = gidMatch ? gidMatch[1] : '0';
    return `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;
  }

  // If user pasted just a raw Google Sheet ID
  if (/^[a-zA-Z0-9-_]{20,60}$/.test(url)) {
    return `https://docs.google.com/spreadsheets/d/${url}/export?format=csv&gid=0`;
  }

  return url;
}

/**
 * Fetch customer data from URL (handles Google Sheets and CSV files with real-time cache busting)
 */
export async function fetchCustomerDataFromUrl(url: string): Promise<{
  text: string;
  records: CustomerRecord[];
  finalUrl: string;
}> {
  if (!url || !url.trim()) {
    throw new Error('กรุณาระบุลิงก์ Google Sheets หรือ URL ของไฟล์ CSV');
  }

  const baseUrl = formatGoogleSheetUrl(url);
  if (!baseUrl) {
    throw new Error('กรุณาระบุลิงก์ Google Sheets หรือ URL ของไฟล์ CSV ที่ถูกต้อง');
  }

  // Append timestamp cache-buster to ensure 100% real-time freshest data from Google Sheets CDN
  const sep = baseUrl.includes('?') ? '&' : '?';
  const formattedUrl = `${baseUrl}${sep}_nocache=${Date.now()}`;

  let text = '';
  let lastError: any = null;

  // 1. Direct fetch with explicit cache bypass headers
  try {
    const res = await fetch(formattedUrl, {
      method: 'GET',
      cache: 'no-store',
      headers: {
        Accept: 'text/csv, text/plain, */*',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
      },
    });
    if (res.ok) {
      const directText = await res.text();
      if (directText && typeof directText === 'string' && !directText.includes('<!DOCTYPE html>') && !directText.includes('<html')) {
        text = directText;
      }
    }
  } catch (err) {
    lastError = err;
    console.warn('Direct fetch failed, attempting proxy fallback...', err);
  }

  // 1.1 Alternative gviz export URL if standard export was blocked
  if (!text) {
    const sheetIdMatch = url.match(/\/spreadsheets\/(?:u\/\d+\/)?d\/([a-zA-Z0-9-_]+)/);
    if (sheetIdMatch && sheetIdMatch[1]) {
      const gidMatch = url.match(/[#&?]gid=([0-9]+)/);
      const gid = gidMatch ? gidMatch[1] : '0';
      const gvizUrl = `https://docs.google.com/spreadsheets/d/${sheetIdMatch[1]}/gviz/tq?tqx=out:csv&gid=${gid}&_nocache=${Date.now()}`;
      try {
        const gRes = await fetch(gvizUrl, { cache: 'no-store' });
        if (gRes.ok) {
          const gText = await gRes.text();
          if (gText && typeof gText === 'string' && !gText.includes('<!DOCTYPE html>') && !gText.includes('<html')) {
            text = gText;
          }
        }
      } catch (e) {
        // Continue to proxies
      }
    }
  }

  // 2. Fallback to reliable CORS proxies with unique cache-buster parameter
  if (!text || (typeof text === 'string' && (text.includes('<!DOCTYPE html>') || text.includes('<html')))) {
    const proxyUrls = [
      `https://api.allorigins.win/raw?url=${encodeURIComponent(formattedUrl)}`,
      `https://corsproxy.io/?${encodeURIComponent(formattedUrl)}`,
      `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(formattedUrl)}`,
    ];

    for (const proxyUrl of proxyUrls) {
      try {
        const pRes = await fetch(proxyUrl, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
          },
        });
        if (pRes.ok) {
          const proxyText = await pRes.text();
          if (proxyText && proxyText.length > 5 && typeof proxyText === 'string' && !proxyText.includes('<!DOCTYPE html>') && !proxyText.includes('<html')) {
            text = proxyText;
            break;
          }
        }
      } catch (e) {
        lastError = e;
      }
    }
  }

  if (!text) {
    throw new Error(
      `ไม่สามารถเข้าถึงลิงก์ได้ (${lastError?.message || 'Network/CORS'}). กรุณาตรวจสอบว่า Google Sheets ตั้งค่าสิทธิ์แชร์เป็น 'ทุกคนที่มีลิงก์มีสิทธิ์ดู' (Anyone with the link can view) หรือลองนำเข้าเป็นไฟล์ CSV แทน`
    );
  }

  // Detect if returned text is Google login page (meaning sheet is private)
  if (typeof text === 'string' && (text.includes('accounts.google.com') || text.includes('Sign in - Google Accounts'))) {
    throw new Error(
      'Google Sheets นี้ยังไม่ได้เปิดสิทธิ์สาธารณะ: กรุณากดปุ่ม "แชร์" (Share) ใน Google Sheets แล้วเปลี่ยนสิทธิ์เป็น "ทุกคนที่มีลิงก์มีสิทธิ์ดู" (Anyone with the link can view)'
    );
  }

  // Cache raw sheet data for Dynamic Direct Reference
  try {
    if (typeof localStorage !== 'undefined' && text) {
      localStorage.setItem(RAW_SHEET_DATA_KEY, text);
    }
  } catch (e) {
    console.warn('Could not cache raw sheet data:', e);
  }

  const records = parseCustomerData(text, 'Google Sheets (Real-time)');
  return {
    text,
    records,
    finalUrl: formattedUrl,
  };
}

/**
 * Real-time Background / Instant Sync with Google Sheet
 */
export async function syncCustomersRealtime(): Promise<{
  success: boolean;
  recordsCount?: number;
  addedCount?: number;
  updatedCount?: number;
  error?: string;
  customers?: CustomerRecord[];
}> {
  const config = loadSyncConfig();
  if (!config.sheetUrl || !config.sheetUrl.trim()) {
    return { success: false, error: 'ยังไม่ได้ระบุลิงก์ Google Sheets' };
  }

  try {
    const result = await fetchCustomerDataFromUrl(config.sheetUrl);
    if (result.records && result.records.length > 0) {
      const currentList = loadCustomers();
      const { merged, addedCount, updatedCount } = mergeCustomers(currentList, result.records);
      const newConfig: CustomerSyncConfig = {
        ...config,
        lastSyncedAt: new Date().toISOString(),
      };
      saveSyncConfig(newConfig);
      return {
        success: true,
        recordsCount: result.records.length,
        addedCount,
        updatedCount,
        customers: merged,
      };
    }
    return { success: false, error: 'ไม่พบข้อมูลลูกค้าในชีต' };
  } catch (err: any) {
    return { success: false, error: err?.message || 'เกิดข้อผิดพลาดในการดึงข้อมูล' };
  }
}

/**
 * Merge new records with existing list, avoiding duplicates by normalized customerCode
 * Fresh values from newly imported/synced records always overwrite older/stale cached values.
 */
export function mergeCustomers(
  existingList: CustomerRecord[],
  newRecords: CustomerRecord[]
): {
  merged: CustomerRecord[];
  addedCount: number;
  updatedCount: number;
} {
  const map = new Map<string, CustomerRecord>();
  let addedCount = 0;
  let updatedCount = 0;

  (existingList || []).forEach(c => {
    if (c && c.customerCode) {
      map.set(normalizeCustomerCode(c.customerCode), sanitizeCustomerRecord(c));
    }
  });

  (newRecords || []).forEach(c => {
    if (!c || !c.customerCode) return;
    const key = normalizeCustomerCode(c.customerCode);
    if (map.has(key)) {
      const prev = map.get(key)!;
      map.set(key, sanitizeCustomerRecord({
        ...prev,
        ...c,
        id: prev.id || c.id,
        name: c.name && c.name !== 'ลูกค้าไม่ระบุชื่อ' ? c.name : (prev.name || c.name),
        taxId: (c.taxId !== undefined && c.taxId !== '' ? c.taxId : prev.taxId) || '',
        address: (c.address !== undefined && c.address !== '' ? c.address : prev.address) || '',
        contactPerson: (c.contactPerson !== undefined && c.contactPerson !== '' ? c.contactPerson : prev.contactPerson) || '',
        mobile: (c.mobile !== undefined && c.mobile !== '' ? c.mobile : (prev.mobile || c.phone || prev.phone || '')) || '',
        phone: (c.phone !== undefined && c.phone !== '' ? c.phone : (prev.phone || c.mobile || prev.mobile || '')) || '',
        email: (c.email !== undefined && c.email !== '' ? c.email : prev.email) || '',
        department: (c.department !== undefined && c.department !== '' ? c.department : prev.department) || 'เอกชน',
        discountRate: c.discountRate !== undefined ? c.discountRate : (prev.discountRate ?? 0),
        source: c.source || prev.source,
        updatedAt: new Date().toISOString(),
      }));
      updatedCount++;
    } else {
      map.set(key, sanitizeCustomerRecord(c));
      addedCount++;
    }
  });

  const merged = Array.from(map.values());
  saveCustomers(merged);
  return { merged, addedCount, updatedCount };
}
