import { Quotation, QuotationItem, AnnexConfig } from '../types';

// ============================================================================
// Dictionary and Heuristic Translators for Instant Offline Conversion
// ============================================================================

export const UNIT_TRANSLATIONS: Record<string, string> = {
  'ห้อง': 'Room',
  'วัน': 'Day',
  'ครึ่งวัน': 'Half-day',
  'ชั่วโมง': 'Hour',
  'ชม.': 'Hour',
  'เครื่อง': 'Unit',
  'เครื่อง/วัน': 'Unit/Day',
  'ชุด': 'Set',
  'ท่าน': 'Person',
  'คน': 'Pax',
  'งาน': 'Job',
  'รายการ': 'Item',
  'กล่อง': 'Box',
  'แก้ว': 'Cup',
  'ขวด': 'Bottle',
  'จุด': 'Point',
};

export const COMMON_PHRASE_TRANSLATIONS: [RegExp, string][] = [
  // KX Specific Room & Venues
  [/ค่าเช่าห้อง\s*([A-Za-z0-9.]+)\s*FL\.(\d+)/gi, 'Room Rental $1, FL.$2'],
  [/ค่าเช่าห้อง\s*([A-Za-z0-9.]+)\s*ชั้น\s*(\d+)/gi, 'Room Rental $1, FL.$2'],
  [/ค่าเช่าห้อง/gi, 'Room Rental'],
  [/ห้องสัมมนา\s*([A-Za-z0-9.]+)\s*ชั้น\s*(\d+)/gi, 'Seminar Room $1, FL.$2'],
  [/ห้องประชุม\s*([A-Za-z0-9.]+)\s*ชั้น\s*(\d+)/gi, 'Meeting Room $1, FL.$2'],
  [/ห้องจัดแสดงนิทรรศการ\s*ชั้น\s*(\d+)/gi, 'Exhibition Hall, FL.$1'],
  [/ห้องสัมมนา/gi, 'Seminar Room'],
  [/ห้องประชุม/gi, 'Meeting Room'],
  [/ชั้น\s*(\d+)/gi, 'FL.$1'],
  [/อาคารเคเอกซ์/gi, 'KX Building'],
  [/อาคาร KX/gi, 'KX Building'],
  [/มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าธนบุรี/gi, "King Mongkut's University of Technology Thonburi (KMUTT)"],

  // Catering & Food
  [/อาหารว่างและเครื่องดื่ม\s*\(Coffee Break\)/gi, 'Coffee Break & Refreshments'],
  [/อาหารว่างและเครื่องดื่ม/gi, 'Coffee Break & Refreshments'],
  [/อาหารกลางวันแบบบุฟเฟ่ต์/gi, 'Buffet Lunch'],
  [/อาหารกลางวัน\s*\(Buffet\)/gi, 'Buffet Lunch'],
  [/อาหารกลางวัน/gi, 'Lunch'],
  [/อาหารเย็นแบบค็อกเทล/gi, 'Cocktail Dinner'],
  [/อาหารเย็น/gi, 'Dinner'],
  [/คอฟฟี่เบรค/gi, 'Coffee Break'],
  [/สแน็คบ็อกซ์|สแน็คบอกซ์/gi, 'Snack Box'],
  [/ค่านำเข้าอาหารและเครื่องดื่ม/gi, 'Outside Food & Beverage Corkage Fee'],
  [/ค่านำเข้าอาหาร/gi, 'Outside Catering Fee'],
  [/ค่าเปิดขวด/gi, 'Corkage Fee'],
  [/ค่าอาหารว่าง/gi, 'Snack Fee'],
  [/เบรก/gi, 'Break'],
  [/เช้า/gi, 'Morning'],
  [/บ่าย/gi, 'Afternoon'],

  // Equipment & Facilities
  [/ไมโครโฟนไร้สาย/gi, 'Wireless Microphone'],
  [/ไมโครโฟน/gi, 'Microphone'],
  [/โปรเจคเตอร์พร้อมจอ/gi, 'Projector & Screen'],
  [/โปรเจคเตอร์/gi, 'Projector'],
  [/ระบบแสงและเสียง/gi, 'Lighting & Sound System'],
  [/เจ้าหน้าที่ช่างเทคนิค/gi, 'Audio-Visual Technician Support'],
  [/ช่างเทคนิคประจำห้อง/gi, 'On-site Technician'],
  [/ป้ายประชาสัมพันธ์/gi, 'Event Signage Display'],
  [/กระดานไวท์บอร์ด/gi, 'Whiteboard & Markers'],
  [/โพเดียมพร้อมไมค์/gi, 'Podium with Microphone'],
  [/โพเดียม/gi, 'Podium'],
  [/ฟลิปชาร์ท/gi, 'Flipchart with Paper & Markers'],
  [/โต๊ะลงทะเบียน/gi, 'Registration Desk Setup'],

  // Time & Session
  [/ช่วงเช้า/gi, 'Morning Session'],
  [/ช่วงบ่าย/gi, 'Afternoon Session'],
  [/เต็มวัน/gi, 'Full Day'],
  [/ครึ่งวัน/gi, 'Half Day'],
  [/วันธรรมดา/gi, 'Weekday'],
  [/วันเสาร์-อาทิตย์|เสาร์-อาทิตย์/gi, 'Weekend'],

  // Terms and conditions
  [/กรณีใช้งานเกิน\s*18\.00\s*จะมีค่าบริการจัดสถานที่/gi, 'Venue usage after 18:00 will incur additional venue management fee.'],
  [/กรณีใช้งานเกินเวลา/gi, 'Overtime venue usage fee applies.'],
  [/ไม่มี\s*Vat\s*ไม่มีหัก\s*ณ\s*ที่จ่าย/gi, 'Exempt from VAT and Withholding Tax'],
  [/ลูกค้าสามารถขอเอกสารเพิ่มเติมกับเจ้าหน้าที่ฝ่ายขาย/gi, 'Clients may request additional documentation from the sales department.'],
];

export function translatePhrase(text: string): string {
  if (!text) return text;
  let translated = text;
  for (const [regex, replacement] of COMMON_PHRASE_TRANSLATIONS) {
    translated = translated.replace(regex, replacement);
  }
  return translated;
}

export function translateUnit(unit: string): string {
  if (!unit) return unit;
  const trimmed = unit.trim();
  return UNIT_TRANSLATIONS[trimmed] || trimmed;
}

export function translateDepartment(dept?: string): string {
  if (!dept) return '';
  const d = dept.trim().toLowerCase();
  if (d.includes('เอกชน')) return 'Private Sector';
  if (d.includes('ราชการ') || d.includes('รัฐ')) return 'Government Agency';
  if (d.includes('มหาวิทยาลัย') || d.includes('สถาบัน')) return 'Educational Institution';
  if (d.includes('มูลนิธิ')) return 'Non-Profit Organization';
  return dept;
}

export function translateAddress(address?: string): string {
  if (!address) return '';
  let res = address;
  res = res.replace(/ถนน/g, 'Rd.');
  res = res.replace(/ถ\./g, 'Rd.');
  res = res.replace(/ซอย/g, 'Soi');
  res = res.replace(/ซ\./g, 'Soi');
  res = res.replace(/แขวง/g, 'Sub-district,');
  res = res.replace(/ตำบล/g, 'Sub-district,');
  res = res.replace(/ต\./g, 'Sub-district,');
  res = res.replace(/เขต/g, 'District,');
  res = res.replace(/อำเภอ/g, 'District,');
  res = res.replace(/อ\./g, 'District,');
  res = res.replace(/กรุงเทพมหานคร/g, 'Bangkok');
  res = res.replace(/กทม\./g, 'Bangkok');
  res = res.replace(/จังหวัด/g, 'Province');
  res = res.replace(/จ\./g, 'Province');
  res = res.replace(/อาคาร/g, 'Building');
  res = res.replace(/ชั้น/g, 'FL.');
  return res;
}

export function translateCompanyName(name?: string): string {
  if (!name) return '';
  let res = name;
  res = res.replace(/บริษัท\s+/g, '');
  res = res.replace(/\s*จำกัด\s*\(มหาชน\)/g, ' Public Co., Ltd.');
  res = res.replace(/\s*\(มหาชน\)/g, ' Public Co., Ltd.');
  res = res.replace(/\s*จำกัด/g, ' Co., Ltd.');
  res = res.replace(/มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าธนบุรี/g, "King Mongkut's University of Technology Thonburi (KMUTT)");
  res = res.replace(/สถาบัน/g, 'Institute');
  res = res.replace(/กรม/g, 'Department of');
  res = res.replace(/กระทรวง/g, 'Ministry of');
  return res;
}

export function translateContactPerson(contact?: string): string {
  if (!contact) return '';
  let res = contact;
  res = res.replace(/^คุณ\s*/g, 'Khun ');
  res = res.replace(/^ดร\.\s*/g, 'Dr. ');
  res = res.replace(/^อ\.\s*/g, 'Ajarn ');
  res = res.replace(/^ผศ\.\s*/g, 'Asst. Prof. ');
  res = res.replace(/^รศ\.\s*/g, 'Assoc. Prof. ');
  res = res.replace(/^ศ\.\s*/g, 'Prof. ');
  return res;
}

// ============================================================================
// AI-Enhanced Backend Translation Caller
// ============================================================================

async function callAiTranslationApi(payload: Record<string, any>, targetLang: 'en' | 'th'): Promise<Record<string, any> | null> {
  try {
    const res = await fetch('/api/translate-quotation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        textPayload: payload,
        targetLang,
      }),
    });

    if (res.status === 429) {
        console.warn('AI translation quota exceeded (429). Falling back to dictionary.');
        return null;
    }

    if (!res.ok) {
      console.warn('AI translation API returned non-200:', res.status);
      return null;
    }

    const data = await res.json();
    if (data.success && data.translated) {
      return data.translated;
    }
  } catch (err) {
    console.warn('AI translation network error, falling back to dictionary:', err);
  }
  return null;
}

// ============================================================================
// Main Quotation Translation Functions
// ============================================================================

export async function translateQuotationToEnglish(quotation: Quotation): Promise<{ quotation: Quotation; usedAi: boolean }> {
  // 1. Save pristine snapshot of Thai values
  const thaiBackup: Partial<Quotation> = {
    jobTitle: quotation.jobTitle,
    customer: { ...quotation.customer },
    items: quotation.items.map((it) => ({ ...it })),
    customPaymentTermsText: quotation.customPaymentTermsText,
    overtimeNote: quotation.overtimeNote,
    specialRemarks: quotation.specialRemarks,
    bankInfo: { ...quotation.bankInfo },
    headerTitle: quotation.headerTitle,
    headerSubtitle: quotation.headerSubtitle,
    signatures: JSON.parse(JSON.stringify(quotation.signatures)),
    annexConfig: quotation.annexConfig ? JSON.parse(JSON.stringify(quotation.annexConfig)) : undefined,
  };

  // 2. Prepare Dictionary-Based Translation First (Guaranteed Fast & Complete)
  const dictItems: QuotationItem[] = quotation.items.map((item) => ({
    ...item,
    description: translatePhrase(item.description),
    unit: translateUnit(item.unit),
    jobTitle: item.jobTitle ? translatePhrase(item.jobTitle) : item.jobTitle,
    roomName: item.roomName ? translatePhrase(item.roomName) : item.roomName,
  }));

  const dictCustomer = {
    ...quotation.customer,
  };

  const dictBankInfo = {
    ...quotation.bankInfo,
    bankName: quotation.bankInfo.bankName.includes('กรุงไทย') ? 'Krungthai Bank' : quotation.bankInfo.bankName,
    branch: quotation.bankInfo.branch.includes('พระจอมเกล้าธนบุรี')
      ? 'KMUTT Branch'
      : translatePhrase(quotation.bankInfo.branch),
    accountName: quotation.bankInfo.accountName.includes('พระจอมเกล้าธนบุรี')
      ? "King Mongkut's University of Technology Thonburi"
      : translateCompanyName(quotation.bankInfo.accountName),
  };

  const dictOvertime = quotation.overtimeNote
    ? translatePhrase(quotation.overtimeNote)
    : 'Venue usage after 18:00 will incur an additional venue management fee.';

  const dictJobTitle = translatePhrase(quotation.jobTitle);

  // Signatures
  const dictSignatures = JSON.parse(JSON.stringify(quotation.signatures));
  if (dictSignatures.receivedBy) {
    dictSignatures.receivedBy.title = 'Customer / Client';
  }
  if (dictSignatures.preparedBy) {
    dictSignatures.preparedBy.title = 'Prepared by';
  }
  if (dictSignatures.approvedBy) {
    dictSignatures.approvedBy.title = 'Approved by';
  }
  if (dictSignatures.authorizedSignature) {
    dictSignatures.authorizedSignature.title = 'Authorized Signature';
  }

  // Annex (Page 2)
  let dictAnnex: AnnexConfig | undefined = undefined;
  if (quotation.annexConfig) {
    dictAnnex = {
      ...quotation.annexConfig,
      title: quotation.annexConfig.title
        ? translatePhrase(quotation.annexConfig.title)
        : 'Rules & Terms for KX Conference Room and Venue Usage',
      section1Title: quotation.annexConfig.section1Title
        ? translatePhrase(quotation.annexConfig.section1Title)
        : '1. Venue Usage Terms & Service Conditions',
      termsText: quotation.annexConfig.termsText
        ? translatePhrase(quotation.annexConfig.termsText)
        : quotation.annexConfig.termsText,
      section2Title: quotation.annexConfig.section2Title
        ? translatePhrase(quotation.annexConfig.section2Title)
        : '2. Additional Rental Equipment & Rates',
      equipmentList: quotation.annexConfig.equipmentList?.map((eq) => ({
        ...eq,
        name: translatePhrase(eq.name),
      })),
      section3Title: quotation.annexConfig.section3Title
        ? translatePhrase(quotation.annexConfig.section3Title)
        : '3. Fines for Property Damage or Cleaning Fees',
      finesList: quotation.annexConfig.finesList?.map((fn) => ({
        ...fn,
        description: translatePhrase(fn.description),
      })),
      customerSignerTitle: 'Acknowledged & Agreed by Customer',
    };
  }

  let finalJobTitle = dictJobTitle;
  let finalCustomer = dictCustomer;
  let finalItems = dictItems;
  let finalOvertime = dictOvertime;
  let finalSpecialRemarks = quotation.specialRemarks ? translatePhrase(quotation.specialRemarks) : undefined;
  let finalCustomTerms = quotation.customPaymentTermsText
    ? translatePhrase(quotation.customPaymentTermsText)
    : undefined;
  let usedAi = false;

  // 3. Attempt AI Deep Translation for arbitrary free-form Thai text with 8s timeout
  try {
    const payloadToAi = {
      jobTitle: quotation.jobTitle,
      customerName: quotation.customer.name,
      customerAddress: quotation.customer.address,
      contactPerson: quotation.customer.contactPerson,
      specialRemarks: quotation.specialRemarks || '',
      customPaymentTermsText: quotation.customPaymentTermsText || '',
      itemDescriptions: quotation.items.map((it) => it.description),
      itemUnits: quotation.items.map((it) => it.unit),
    };

    const aiPromise = callAiTranslationApi(payloadToAi, 'en');
    const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 8000));
    const aiResult = await Promise.race([aiPromise, timeoutPromise]);

    if (aiResult) {
      usedAi = true;
      if (aiResult.jobTitle) finalJobTitle = aiResult.jobTitle;
      if (aiResult.specialRemarks) finalSpecialRemarks = aiResult.specialRemarks;
      if (aiResult.customPaymentTermsText) finalCustomTerms = aiResult.customPaymentTermsText;

      if (Array.isArray(aiResult.itemDescriptions) && aiResult.itemDescriptions.length === finalItems.length) {
        finalItems = finalItems.map((item, idx) => ({
          ...item,
          description: aiResult.itemDescriptions[idx] || item.description,
          unit: Array.isArray(aiResult.itemUnits) && aiResult.itemUnits[idx] ? aiResult.itemUnits[idx] : item.unit,
        }));
      }
    }
  } catch (err) {
    console.error('Error invoking AI translation, dictionary translation used:', err);
  }

  const translatedQuotation: Quotation = {
    ...quotation,
    language: 'en',
    translations: {
      ...quotation.translations,
      th: thaiBackup,
    },
    headerTitle: 'QUOTATION',
    headerSubtitle: '',
    jobTitle: finalJobTitle,
    customer: finalCustomer,
    items: finalItems,
    bankInfo: dictBankInfo,
    overtimeNote: finalOvertime,
    specialRemarks: finalSpecialRemarks,
    customPaymentTermsText: (finalCustomTerms && !/[ก-๙]/.test(finalCustomTerms)) ? finalCustomTerms : (quotation.customPaymentTermsTextEn && !/[ก-๙]/.test(quotation.customPaymentTermsTextEn)) ? quotation.customPaymentTermsTextEn : undefined,
    customPaymentTermsTextEn: (quotation.customPaymentTermsTextEn && !/[ก-๙]/.test(quotation.customPaymentTermsTextEn)) ? quotation.customPaymentTermsTextEn : (finalCustomTerms && !/[ก-๙]/.test(finalCustomTerms)) ? finalCustomTerms : undefined,
    signatures: dictSignatures,
    annexConfig: dictAnnex,
  };

  return { quotation: translatedQuotation, usedAi };
}

export function restoreQuotationToThai(quotation: Quotation): Quotation {
  // If we have a saved Thai backup, restore from it
  const th = quotation.translations?.th;
  if (th) {
    return {
      ...quotation,
      language: 'th',
      headerTitle: th.headerTitle || 'ใบเสนอราคา',
      headerSubtitle: th.headerSubtitle || '(ต้นฉบับ)',
      jobTitle: th.jobTitle ?? quotation.jobTitle,
      customer: th.customer ? { ...th.customer } : quotation.customer,
      items: th.items ? th.items.map((it) => ({ ...it })) : quotation.items,
      customPaymentTermsText: th.customPaymentTermsText ?? quotation.customPaymentTermsText,
      customPaymentTermsTextEn: quotation.customPaymentTermsTextEn,
      overtimeNote: th.overtimeNote ?? 'กรณีใช้งานเกิน 18.00 จะมีค่าบริการจัดสถานที่',
      specialRemarks: th.specialRemarks ?? quotation.specialRemarks,
      bankInfo: th.bankInfo ? { ...th.bankInfo } : quotation.bankInfo,
      signatures: th.signatures ? JSON.parse(JSON.stringify(th.signatures)) : quotation.signatures,
      annexConfig: th.annexConfig ? JSON.parse(JSON.stringify(th.annexConfig)) : quotation.annexConfig,
    };
  }

  // Fallback: reset titles to Thai
  return {
    ...quotation,
    language: 'th',
    headerTitle: 'ใบเสนอราคา',
    headerSubtitle: '(ต้นฉบับ)',
  };
}

export const REVERSE_UNIT_TRANSLATIONS: Record<string, string> = {
  'Room': 'ห้อง',
  'Day': 'วัน',
  'Half-day': 'ครึ่งวัน',
  'Hour': 'ชั่วโมง',
  'Unit': 'เครื่อง',
  'Unit/Day': 'เครื่อง/วัน',
  'Set': 'ชุด',
  'Person': 'ท่าน',
  'Pax': 'คน',
  'Job': 'งาน',
  'Item': 'รายการ',
  'Box': 'กล่อง',
  'Cup': 'แก้ว',
  'Bottle': 'ขวด',
  'Point': 'จุด',
};

export const REVERSE_PHRASE_TRANSLATIONS: [RegExp, string][] = [
  [/Room Rental\s*([A-Za-z0-9.]+)\s*FL\.(\d+)/gi, 'ค่าเช่าห้อง $1 ชั้น $2'],
  [/Room Rental/gi, 'ค่าเช่าห้อง'],
  [/Seminar Room\s*([A-Za-z0-9.]+)\s*FL\.(\d+)/gi, 'ห้องสัมมนา $1 ชั้น $2'],
  [/Meeting Room\s*([A-Za-z0-9.]+)\s*FL\.(\d+)/gi, 'ห้องประชุม $1 ชั้น $2'],
  [/Exhibition Hall,\s*FL\.(\d+)/gi, 'ห้องจัดแสดงนิทรรศการ ชั้น $1'],
  [/Seminar Room/gi, 'ห้องสัมมนา'],
  [/Meeting Room/gi, 'ห้องประชุม'],
  [/FL\.(\d+)/gi, 'ชั้น $1'],
  [/KX Building/gi, 'อาคารเคเอกซ์'],
  [/Coffee Break & Refreshments/gi, 'อาหารว่างและเครื่องดื่ม (Coffee Break)'],
  [/Buffet Lunch/gi, 'อาหารกลางวันแบบบุฟเฟ่ต์'],
  [/Lunch/gi, 'อาหารกลางวัน'],
  [/Dinner/gi, 'อาหารเย็น'],
  [/Coffee Break/gi, 'คอฟฟี่เบรค'],
  [/Snack Box/gi, 'สแน็คบ็อกซ์'],
  [/Wireless Microphone/gi, 'ไมโครโฟนไร้สาย'],
  [/Microphone/gi, 'ไมโครโฟน'],
  [/Projector & Screen/gi, 'โปรเจคเตอร์พร้อมจอ'],
  [/Projector/gi, 'โปรเจคเตอร์'],
];

export function restorePhraseToThai(text: string): string {
  if (!text) return text;
  let restored = text;
  for (const [regex, replacement] of REVERSE_PHRASE_TRANSLATIONS) {
    restored = restored.replace(regex, replacement);
  }
  return restored;
}

export function restoreUnitToThai(unit: string): string {
  if (!unit) return unit;
  const trimmed = unit.trim();
  return REVERSE_UNIT_TRANSLATIONS[trimmed] || trimmed;
}

