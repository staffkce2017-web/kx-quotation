/**
 * Convert number into Thai Baht text representation
 * e.g. 7500.00 -> "เจ็ดพันห้าร้อยบาทถ้วน"
 * e.g. 1024.50 -> "หนึ่งพันยี่สิบสี่บาทห้าสิบสตางค์"
 */

const THAI_NUMBERS = ['ศูนย์', 'หนึ่ง', 'สอง', 'สาม', 'สี่', 'ห้า', 'หก', 'เจ็ด', 'แปด', 'เก้า'];
const THAI_UNITS = ['', 'สิบ', 'ร้อย', 'พัน', 'หมื่น', 'แสน', 'ล้าน'];

function convertGroup(numberStr: string, isMillion: boolean = false): string {
  let result = '';
  const len = numberStr.length;

  for (let i = 0; i < len; i++) {
    const digit = parseInt(numberStr.charAt(i), 10);
    const pos = len - i - 1;

    if (digit !== 0) {
      if (pos === 0 && digit === 1 && len > 1 && !(isMillion && len === 1)) {
        // Special case for 'เอ็ด'
        if (numberStr.charAt(i - 1) === '0' && len > 2) {
          // e.g. 101 -> หนึ่งร้อยเอ็ด
          result += 'เอ็ด';
        } else {
          result += 'เอ็ด';
        }
      } else if (pos === 1 && digit === 2) {
        // Special case for 'ยี่สิบ'
        result += 'ยี่' + THAI_UNITS[pos];
      } else if (pos === 1 && digit === 1) {
        // Special case for 'สิบ'
        result += THAI_UNITS[pos];
      } else {
        result += THAI_NUMBERS[digit] + THAI_UNITS[pos];
      }
    }
  }

  return result;
}

export function arabicToThaiBahtText(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return 'ศูนย์บาทถ้วน';
  }

  const isNegative = amount < 0;
  amount = Math.abs(amount);

  const rounded = Math.round(amount * 100) / 100;
  const parts = rounded.toFixed(2).split('.');
  const integerPart = parts[0];
  const decimalPart = parts[1];

  let text = '';

  if (integerPart === '0' && decimalPart === '00') {
    return 'ศูนย์บาทถ้วน';
  }

  if (integerPart !== '0') {
    // Split into millions chunks if very large
    const chunks: string[] = [];
    let temp = integerPart;
    while (temp.length > 6) {
      chunks.unshift(temp.slice(-6));
      temp = temp.slice(0, -6);
    }
    chunks.unshift(temp);

    for (let c = 0; c < chunks.length; c++) {
      const isChunkMillion = c < chunks.length - 1;
      text += convertGroup(chunks[c], isChunkMillion);
      if (isChunkMillion) {
        text += 'ล้าน';
      }
    }
    text += 'บาท';
  }

  if (decimalPart === '00') {
    text += 'ถ้วน';
  } else {
    // Process satang
    const satangVal = parseInt(decimalPart, 10);
    if (satangVal > 0) {
      text += convertGroup(decimalPart) + 'สตางค์';
    } else {
      text += 'ถ้วน';
    }
  }

  return (isNegative ? 'ลบ' : '') + text;
}

export const THAI_MONTHS_FULL = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
];

export const THAI_MONTHS_SHORT = [
  'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
  'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
];

export function formatThaiDate(dateString?: string, format: 'full' | 'short' = 'full'): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;

  const day = date.getDate();
  const month = date.getMonth();
  const yearBE = date.getFullYear() + 543; // Buddhist Era

  if (format === 'short') {
    return `${day} ${THAI_MONTHS_SHORT[month]} ${yearBE}`;
  }
  return `${day} ${THAI_MONTHS_FULL[month]} ${yearBE}`;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('th-TH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format single date or range in standard Thai representation
 */
export function formatThaiDateSmart(dateStr?: string): string {
  if (!dateStr || !dateStr.trim()) return '';
  const trimmed = dateStr.trim();

  // Check if range like "2026-10-01 to 2026-10-03" or "2026-10-01 - 2026-10-03"
  const rangeMatch = trimmed.match(/^(\d{4}-\d{2}-\d{2})\s*(?:to|ถึง|-|~|\.\.)\s*(\d{4}-\d{2}-\d{2})$/i);
  if (rangeMatch) {
    return formatThaiDateRange([rangeMatch[1], rangeMatch[2]]);
  }

  // If single ISO date YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return formatThaiDate(trimmed, 'full');
  }

  // If contains Thai short months, expand to full
  let text = trimmed;
  THAI_MONTHS_SHORT.forEach((shortM, idx) => {
    const fullM = THAI_MONTHS_FULL[idx];
    text = text.replace(new RegExp(shortM.replace('.', '\\.'), 'g'), fullM);
  });

  return text;
}

/**
 * Formats an array of dates or date ranges into concise Thai format
 * e.g. ['2026-10-01', '2026-10-02', '2026-10-03'] => "1-3 ตุลาคม 2569"
 */
export function formatThaiDateRange(datesInput: string[] | string): string {
  if (!datesInput) return '';

  let rawList: string[] = [];
  if (Array.isArray(datesInput)) {
    rawList = datesInput.flatMap((d) => (d ? String(d).split(/[,;\n]+/) : []));
  } else {
    rawList = String(datesInput).split(/[,;\n]+/);
  }

  const isoDates: string[] = [];
  const otherTexts: string[] = [];

  for (const item of rawList) {
    const s = item.trim();
    if (!s) continue;

    const mRange = s.match(/^(\d{4}-\d{2}-\d{2})\s*(?:to|ถึง|-|~|\.\.)\s*(\d{4}-\d{2}-\d{2})$/i);
    if (mRange) {
      const d1 = new Date(mRange[1]);
      const d2 = new Date(mRange[2]);
      if (!isNaN(d1.getTime()) && !isNaN(d2.getTime())) {
        const cur = new Date(Math.min(d1.getTime(), d2.getTime()));
        const end = new Date(Math.max(d1.getTime(), d2.getTime()));
        while (cur <= end) {
          isoDates.push(cur.toISOString().split('T')[0]);
          cur.setDate(cur.getDate() + 1);
        }
        continue;
      }
    }

    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
      isoDates.push(s);
    } else {
      otherTexts.push(s);
    }
  }

  if (isoDates.length === 0) {
    return otherTexts.join(', ');
  }

  const uniqueDates = Array.from(new Set(isoDates)).sort();

  if (uniqueDates.length === 1 && otherTexts.length === 0) {
    return formatThaiDate(uniqueDates[0], 'full');
  }

  const parsed = uniqueDates.map((ds) => {
    const d = new Date(ds);
    return {
      iso: ds,
      day: d.getDate(),
      month: d.getMonth(),
      yearBE: d.getFullYear() + 543,
    };
  });

  const groups: { yearBE: number; month: number; days: number[] }[] = [];
  for (const p of parsed) {
    const last = groups[groups.length - 1];
    if (last && last.yearBE === p.yearBE && last.month === p.month) {
      if (!last.days.includes(p.day)) {
        last.days.push(p.day);
      }
    } else {
      groups.push({
        yearBE: p.yearBE,
        month: p.month,
        days: [p.day],
      });
    }
  }

  const groupFormatted = groups.map((g, idx) => {
    const sortedDays = [...g.days].sort((a, b) => a - b);
    const dayRanges: string[] = [];
    let startDay = sortedDays[0];
    let prevDay = sortedDays[0];

    for (let i = 1; i < sortedDays.length; i++) {
      const curDay = sortedDays[i];
      if (curDay === prevDay + 1) {
        prevDay = curDay;
      } else {
        if (startDay === prevDay) {
          dayRanges.push(`${startDay}`);
        } else {
          dayRanges.push(`${startDay}-${prevDay}`);
        }
        startDay = curDay;
        prevDay = curDay;
      }
    }

    if (startDay === prevDay) {
      dayRanges.push(`${startDay}`);
    } else {
      dayRanges.push(`${startDay}-${prevDay}`);
    }

    const daysStr = dayRanges.join(', ');
    const monthName = THAI_MONTHS_FULL[g.month];
    const nextGroup = groups[idx + 1];

    if (nextGroup && nextGroup.yearBE === g.yearBE) {
      return `${daysStr} ${monthName}`;
    }
    return `${daysStr} ${monthName} ${g.yearBE}`;
  });

  const rangeResult = groupFormatted.join(' - ');
  if (otherTexts.length > 0) {
    return `${rangeResult}, ${otherTexts.join(', ')}`;
  }
  return rangeResult;
}

/**
 * Checks whether an item description is a non-discountable fee type
 * (e.g. food, snack, beverage, corkage/import fees, extra equipment/services).
 */
export function isNoDiscountItem(description: string): boolean {
  const d = (description || '').toLowerCase();
  return (
    d.includes('อาหาร') ||
    d.includes('เบรค') ||
    d.includes('snack') ||
    d.includes('break') ||
    d.includes('บุฟเฟ่ต์') ||
    d.includes('ค็อกเทล') ||
    d.includes('ข้าว') ||
    d.includes('นำเข้า') ||
    d.includes('corkage') ||
    d.includes('อุปกรณ์') ||
    d.includes('projector') ||
    d.includes('โปรเจคเตอร์') ||
    d.includes('ไมค์') ||
    d.includes('เครื่องเสียง') ||
    d.includes('บริการ') ||
    d.includes('ค่าบริการ')
  );
}

// ==========================================
// English Baht Text and Date Formatters
// ==========================================

const ONES = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
const SCALES = ['', 'Thousand', 'Million', 'Billion', 'Trillion'];

function convertUnderThousand(num: number): string {
  let result = '';
  if (num >= 100) {
    result += ONES[Math.floor(num / 100)] + ' Hundred ';
    num %= 100;
  }
  if (num >= 20) {
    result += TENS[Math.floor(num / 10)] + (num % 10 !== 0 ? '-' + ONES[num % 10] : '') + ' ';
  } else if (num > 0) {
    result += ONES[num] + ' ';
  }
  return result.trim();
}

/**
 * Convert number into English Baht text representation
 * e.g. 15000.00 -> "Fifteen Thousand Baht Only"
 * e.g. 1024.50 -> "One Thousand Twenty-Four Baht and Fifty Satang"
 */
export function arabicToEnglishBahtText(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return 'Zero Baht Only';
  }

  const isNegative = amount < 0;
  amount = Math.abs(amount);

  const rounded = Math.round(amount * 100) / 100;
  const parts = rounded.toFixed(2).split('.');
  const integerPart = parseInt(parts[0], 10);
  const decimalPart = parseInt(parts[1], 10);

  if (integerPart === 0 && decimalPart === 0) {
    return 'Zero Baht Only';
  }

  let words = '';
  if (integerPart === 0) {
    words = 'Zero';
  } else {
    let num = integerPart;
    let scaleIndex = 0;
    const partsList: string[] = [];

    while (num > 0) {
      const chunk = num % 1000;
      if (chunk !== 0) {
        const chunkWords = convertUnderThousand(chunk);
        const scale = SCALES[scaleIndex];
        partsList.unshift(scale ? `${chunkWords} ${scale}` : chunkWords);
      }
      num = Math.floor(num / 1000);
      scaleIndex++;
    }
    words = partsList.join(' ');
  }

  let result = `${words} Baht`;

  if (decimalPart > 0) {
    const satangWords = convertUnderThousand(decimalPart);
    result += ` and ${satangWords} Satang`;
  } else {
    result += ' Only';
  }

  return (isNegative ? 'Minus ' : '') + result;
}

export const ENGLISH_MONTHS_FULL = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const ENGLISH_MONTHS_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

export function formatEnglishDate(dateString?: string, format: 'full' | 'short' = 'full'): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;

  const day = date.getDate();
  const month = date.getMonth();
  const yearCE = date.getFullYear();

  if (format === 'short') {
    return `${day} ${ENGLISH_MONTHS_SHORT[month]} ${yearCE}`;
  }
  return `${day} ${ENGLISH_MONTHS_FULL[month]} ${yearCE}`;
}

export function formatEnglishDateSmart(dateStr?: string): string {
  if (!dateStr) return '';
  const trimmed = dateStr.trim();

  // If already contains English letters, return as is
  if (/[a-zA-Z]/.test(trimmed)) return trimmed;

  // Check if it's a date range "YYYY-MM-DD - YYYY-MM-DD"
  const rangeMatch = trimmed.match(/^(\d{4}-\d{2}-\d{2})\s*[-–—]\s*(\d{4}-\d{2}-\d{2})$/);
  if (rangeMatch) {
    return formatEnglishDateRange([rangeMatch[1], rangeMatch[2]]);
  }

  // Standard YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return formatEnglishDate(trimmed, 'full');
  }

  return formatEnglishDate(trimmed, 'full') || trimmed;
}

export function formatEnglishDateRange(datesInput: string[] | string): string {
  if (!datesInput) return '';

  let rawDates: string[] = [];
  if (Array.isArray(datesInput)) {
    rawDates = datesInput;
  } else {
    rawDates = datesInput.split(/[,;\n]+/).map((s) => s.trim()).filter(Boolean);
  }

  if (rawDates.length === 0) return '';
  if (rawDates.length === 1 && !rawDates[0].includes('-')) {
    return formatEnglishDateSmart(rawDates[0]);
  }

  const parsedDates: { date: Date; yearCE: number; month: number; day: number; originalStr: string }[] = [];
  const otherTexts: string[] = [];

  for (const str of rawDates) {
    const trimmed = str.trim();
    const d = new Date(trimmed);
    if (!isNaN(d.getTime())) {
      parsedDates.push({
        date: d,
        yearCE: d.getFullYear(),
        month: d.getMonth(),
        day: d.getDate(),
        originalStr: trimmed,
      });
    } else {
      otherTexts.push(trimmed);
    }
  }

  if (parsedDates.length === 0) {
    return rawDates.join(', ');
  }

  parsedDates.sort((a, b) => a.date.getTime() - b.date.getTime());

  const uniqueDates: typeof parsedDates = [];
  for (const item of parsedDates) {
    if (!uniqueDates.some((u) => u.yearCE === item.yearCE && u.month === item.month && u.day === item.day)) {
      uniqueDates.push(item);
    }
  }

  if (uniqueDates.length === 1 && otherTexts.length === 0) {
    return formatEnglishDate(uniqueDates[0].originalStr, 'full');
  }

  return uniqueDates.map(u => `${u.day} ${ENGLISH_MONTHS_SHORT[u.month]} ${u.yearCE}`).join(' - ');
}


export function translateThaiDateToEnglish(thaiDateStr: string): string {
  let text = thaiDateStr;
  THAI_MONTHS_FULL.forEach((fullM, idx) => {
    text = text.replace(new RegExp(fullM, 'g'), ENGLISH_MONTHS_FULL[idx]);
  });
  THAI_MONTHS_SHORT.forEach((shortM, idx) => {
    text = text.replace(new RegExp(shortM.replace('.', '\.'), 'g'), ENGLISH_MONTHS_SHORT[idx]);
  });
  
  // Try to find a year (likely 2xxx) and convert to CE
  const yearMatch = text.match(/(\d{4})/);
  if (yearMatch) {
    const yearBE = parseInt(yearMatch[1], 10);
    if (yearBE > 2400) {
      text = text.replace(yearMatch[1], (yearBE - 543).toString());
    }
  }
  
  return text;
}
