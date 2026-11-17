import { Quotation } from '../types';

export type NumberingFormat = 'KX_SLASH' | 'KX_DASH' | 'YEAR_MONTH_RUNNING' | 'SIMPLE_RUNNING';
export type ResetFrequency = 'monthly' | 'yearly' | 'continuous';

export interface NumberingSettings {
  prefix: string;              // e.g. 'KX'
  digits: number;              // e.g. 3 (001, 002)
  format: NumberingFormat;     // e.g. 'KX_SLASH' (KX/003/09/69)
  resetFrequency: ResetFrequency; // 'monthly' | 'yearly' | 'continuous'
  startSequence: number;       // default 1
}

export const DEFAULT_NUMBERING_SETTINGS: NumberingSettings = {
  prefix: 'KX',
  digits: 3,
  format: 'KX_SLASH',
  resetFrequency: 'monthly',
  startSequence: 1,
};

const STORAGE_SETTINGS_KEY = 'kx_quotation_numbering_settings_v1';

/**
 * โหลดการตั้งค่าการรันเลขที่เอกสารจาก localStorage
 */
export function loadNumberingSettings(): NumberingSettings {
  try {
    const saved = localStorage.getItem(STORAGE_SETTINGS_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return { ...DEFAULT_NUMBERING_SETTINGS, ...parsed };
    }
  } catch (e) {
    console.warn('Failed to load numbering settings:', e);
  }
  return DEFAULT_NUMBERING_SETTINGS;
}

/**
 * บันทึกการตั้งค่าการรันเลขที่เอกสาร
 */
export function saveNumberingSettings(settings: NumberingSettings): void {
  try {
    localStorage.setItem(STORAGE_SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save numbering settings:', e);
  }
}

/**
 * แปลงปี ค.ศ. เป็นปี พ.ศ. (Buddhist Era)
 */
export function getThaiBuddhistYear(dateInput: Date | string): { full: number; short: string } {
  const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  const gregorianYear = isNaN(d.getTime()) ? new Date().getFullYear() : d.getFullYear();
  const buddhistYear = gregorianYear + 543;
  const shortYear = String(buddhistYear).slice(-2);
  return { full: buddhistYear, short: shortYear };
}

/**
 * ดึงเดือนแบบ 2 หลัก (01-12)
 */
export function getTwoDigitMonth(dateInput: Date | string): string {
  const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  const month = isNaN(d.getTime()) ? new Date().getMonth() + 1 : d.getMonth() + 1;
  return String(month).padStart(2, '0');
}

/**
 * สร้าง string เลขที่ใบเสนอราคาจากพารามิเตอร์
 */
export function formatQuotationNumber(
  sequence: number,
  dateInput: Date | string,
  settings: NumberingSettings = DEFAULT_NUMBERING_SETTINGS
): string {
  const { short: shortYear, full: fullYear } = getThaiBuddhistYear(dateInput);
  const month = getTwoDigitMonth(dateInput);
  const seqStr = String(sequence).padStart(settings.digits, '0');
  const prefix = settings.prefix.trim().toUpperCase() || 'KX';

  switch (settings.format) {
    case 'KX_SLASH':
      // รูปแบบมาตรฐาน KX: KX/003/09/69
      return `${prefix}/${seqStr}/${month}/${shortYear}`;
    case 'KX_DASH':
      // รูปแบบขีด: KX-6909-003
      return `${prefix}-${shortYear}${month}-${seqStr}`;
    case 'YEAR_MONTH_RUNNING':
      // รูปแบบปีเต็ม: KX/2569/09/003
      return `${prefix}/${fullYear}/${month}/${seqStr}`;
    case 'SIMPLE_RUNNING':
      // รูปแบบเรียบง่าย: KX-003
      return `${prefix}-${seqStr}`;
    default:
      return `${prefix}/${seqStr}/${month}/${shortYear}`;
  }
}

/**
 * แยกส่วนประกอบของเลขที่ใบเสนอราคา
 */
export function parseQuotationNumber(quoteNumber: string) {
  if (!quoteNumber) return null;
  const clean = quoteNumber.trim();

  // Pattern 1: KX/003/09/69
  const slashMatch = clean.match(/^([A-Za-z0-9_-]+)\/(\d+)\/(\d{1,2})\/(\d{2,4})$/);
  if (slashMatch) {
    return {
      prefix: slashMatch[1],
      sequence: parseInt(slashMatch[2], 10),
      month: slashMatch[3].padStart(2, '0'),
      year: slashMatch[4],
      raw: clean,
    };
  }

  // Pattern 2: KX-6909-003 or KX-256909-003
  const dashMatch = clean.match(/^([A-Za-z0-9]+)-(\d{2,4})(\d{2})-(\d+)$/);
  if (dashMatch) {
    return {
      prefix: dashMatch[1],
      year: dashMatch[2],
      month: dashMatch[3],
      sequence: parseInt(dashMatch[4], 10),
      raw: clean,
    };
  }

  // Generic fallback: ดึงตัวเลขแรกหรือตัวเลขสุดท้าย
  const numbers = clean.match(/\d+/g);
  if (numbers && numbers.length > 0) {
    return {
      prefix: clean.split(/[\/\-_]/)[0] || 'KX',
      sequence: parseInt(numbers[0], 10),
      raw: clean,
    };
  }

  return null;
}

/**
 * คำนวณหาเลขที่ใบเสนอราคาถัดไปอัตโนมัติ (Next Auto-Running Quotation Number)
 */
export function getNextQuotationNumber(
  existingQuotations: Quotation[],
  targetDate: string = new Date().toISOString().split('T')[0],
  settings: NumberingSettings = loadNumberingSettings()
): string {
  const { short: targetYearShort } = getThaiBuddhistYear(targetDate);
  const targetMonth = getTwoDigitMonth(targetDate);
  const prefix = settings.prefix.trim().toUpperCase() || 'KX';

  let highestSeq = 0;

  for (const quote of existingQuotations) {
    if (!quote.quoteNumber) continue;
    const parsed = parseQuotationNumber(quote.quoteNumber);
    if (!parsed) continue;

    // ตรวจสอบเงื่อนไขตาม resetFrequency
    if (settings.resetFrequency === 'monthly') {
      // ต้องตรงทั้งปีและเดือน
      if (parsed.year && parsed.month) {
        const quoteYearShort = parsed.year.slice(-2);
        if (quoteYearShort === targetYearShort && parsed.month === targetMonth) {
          if (parsed.sequence > highestSeq) {
            highestSeq = parsed.sequence;
          }
        }
      } else {
        // ถ้าไม่มีข้อมูลเดือน ให้ดูตาม sequence
        if (parsed.sequence > highestSeq) highestSeq = parsed.sequence;
      }
    } else if (settings.resetFrequency === 'yearly') {
      // รีเซ็ตทุกปี: ตรงแค่ปี
      if (parsed.year) {
        const quoteYearShort = parsed.year.slice(-2);
        if (quoteYearShort === targetYearShort) {
          if (parsed.sequence > highestSeq) {
            highestSeq = parsed.sequence;
          }
        }
      } else {
        if (parsed.sequence > highestSeq) highestSeq = parsed.sequence;
      }
    } else {
      // continuous: รันต่อเนื่อง ไม่สนใจเดือนปี
      if (parsed.sequence > highestSeq) {
        highestSeq = parsed.sequence;
      }
    }
  }

  const nextSeq = highestSeq >= settings.startSequence ? highestSeq + 1 : settings.startSequence;
  return formatQuotationNumber(nextSeq, targetDate, settings);
}

/**
 * ตรวจสอบว่าเลขที่ใบเสนอราคานี้ซ้ำกับที่มีอยู่แล้วในระบบหรือไม่
 */
export function checkQuoteNumberAvailability(
  quoteNumber: string,
  existingQuotations: Quotation[],
  currentQuoteId?: string
): { isDuplicate: boolean; duplicateWith?: Quotation } {
  const trimmed = quoteNumber.trim().toLowerCase();
  if (!trimmed) return { isDuplicate: false };

  const found = existingQuotations.find(
    (q) => q.quoteNumber.trim().toLowerCase() === trimmed && q.id !== currentQuoteId
  );

  return {
    isDuplicate: !!found,
    duplicateWith: found,
  };
}

/**
 * พรีวิวชุดตัวเลขถัดไป N รายการ (เช่น ดูตัวอย่าง 3-5 ลำดับถัดไป)
 */
export function getUpcomingNumbersPreview(
  count: number = 5,
  existingQuotations: Quotation[],
  targetDate: string = new Date().toISOString().split('T')[0],
  settings: NumberingSettings = loadNumberingSettings()
): string[] {
  const first = getNextQuotationNumber(existingQuotations, targetDate, settings);
  const parsed = parseQuotationNumber(first);
  const startSeq = parsed ? parsed.sequence : settings.startSequence;

  const results: string[] = [];
  for (let i = 0; i < count; i++) {
    results.push(formatQuotationNumber(startSeq + i, targetDate, settings));
  }
  return results;
}
