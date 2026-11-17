import React from 'react';
import { KXLogo } from './KXLogo';
import { AnnexConfig, AnnexEquipmentRow, AnnexFineRow } from '../types';

export const DEFAULT_ANNEX_EQUIPMENT: AnnexEquipmentRow[] = [
  { id: 'eq-1', name: 'จอทีวีขนาด 55 นิ้ว', price: '500 บาท/เครื่อง/วัน' },
  { id: 'eq-2', name: 'ฟลิปชาร์ต', price: '300 บาท/อัน/วัน' },
  { id: 'eq-3', name: 'ชุดโปรเจคเตอร์ (เสริม)', price: '1,000 บาท/เครื่อง/วัน' },
  { id: 'eq-4', name: 'ชุดเครื่องเสียง (เสริม)', price: '1,000 บาท/เครื่อง/วัน' },
  { id: 'eq-5', name: 'ค่าจั๊มไฟ พร้อมเบรคเกอร์', price: '1,000 บาท/จุด/วัน' },
  { id: 'eq-6', name: 'น้ำดื่มขนาด 350 มล.', price: '60 บาท/แพ็ค' },
  { id: 'eq-7', name: 'เครื่องต้มน้ำร้อน (พร้อมน้ำ)', price: '300 บาท/เครื่อง' },
];

export const DEFAULT_ANNEX_EQUIPMENT_EN: AnnexEquipmentRow[] = [
  { id: 'eq-1', name: '55" Television Display', price: '500 THB/unit/day' },
  { id: 'eq-2', name: 'Flipchart with Paper & Markers', price: '300 THB/set/day' },
  { id: 'eq-3', name: 'Extra Projector Set', price: '1,000 THB/unit/day' },
  { id: 'eq-4', name: 'Extra Audio Sound System', price: '1,000 THB/set/day' },
  { id: 'eq-5', name: 'Electrical Power Tie-in with Breaker', price: '1,000 THB/point/day' },
  { id: 'eq-6', name: 'Drinking Water 350 ml.', price: '60 THB/pack' },
  { id: 'eq-7', name: 'Hot Water Kettle (with water)', price: '300 THB/unit' },
];

export const DEFAULT_ANNEX_FINES: AnnexFineRow[] = [
  {
    id: 'fine-1',
    description: 'กรณีลูกค้าต้องการยกเลิกจองห้องประชุมต้องแจ้งล่วงหน้า 14 วัน ก่อนวันใช้งาน (หากไม่ปฏิบัติตามเงื่อนไข ทางอาคารเคเอกซ์ขอสงวนสิทธิ์ในการจองครั้งถัดไป)',
    fine: 'ไม่มีค่าใช้จ่าย',
  },
  { id: 'fine-2', description: 'กรณีไมค์ชำรุด เช่น แตก ยุบ หรือเสียหายจากการใช้งาน', fine: '3,000 บาท' },
  { id: 'fine-3', description: 'ไมค์สูญหาย / ใช้งานไม่ได้', fine: 'ชำระค่าซ่อมจริง หรือ ซื้อใหม่แทน' },
  { id: 'fine-4', description: 'กรณีโต๊ะชำรุด เช่น รอยขูด รอยกาว หรือ เกิดการพองตัวจากการใช้งาน', fine: '4,000 บาท' },
  { id: 'fine-5', description: 'กรณีเก้าอี้ชำรุด เช่น แตกหัก หรือล้อหลุดจากการใช้งาน', fine: '2,000 บาท' },
  { id: 'fine-6', description: 'กรณีพอยเตอร์ชำรุด เช่น แตกหัก หรือสูญหายจากการใช้งาน', fine: 'ชำระค่าซ่อมจริง หรือ ซื้อใหม่แทน' },
  { id: 'fine-7', description: 'ผ้าม่านเสียหายเล็กน้อย เช่น รอยยับที่ไม่สามารถแก้ไขได้', fine: '5,000 บาท' },
  { id: 'fine-8', description: 'ผ้าม่านเสียหายหนัก เช่น ขาด หรือชำรุด', fine: 'ชำระค่าซ่อมจริง หรือ ซื้อใหม่แทน' },
];

export const DEFAULT_ANNEX_FINES_EN: AnnexFineRow[] = [
  {
    id: 'fine-1',
    description: 'Meeting room cancellation must be notified at least 14 days prior to event date (Failure to comply reserves KX rights on subsequent bookings)',
    fine: 'No Fee',
  },
  { id: 'fine-2', description: 'Damaged microphone (cracked, dented, or broken from usage)', fine: '3,000 THB' },
  { id: 'fine-3', description: 'Lost or inoperable microphone', fine: 'Actual repair cost or full replacement' },
  { id: 'fine-4', description: 'Damaged table (scratched, adhesive stains, or surface blistering)', fine: '4,000 THB' },
  { id: 'fine-5', description: 'Damaged chair (broken parts or detached wheels)', fine: '2,000 THB' },
  { id: 'fine-6', description: 'Damaged pointer (broken or lost during event)', fine: 'Actual repair cost or full replacement' },
  { id: 'fine-7', description: 'Minor curtain damage (irreparable creases/marks)', fine: '5,000 THB' },
  { id: 'fine-8', description: 'Major curtain damage (torn, ripped, or broken)', fine: 'Actual repair cost or full replacement' },
];

export const DEFAULT_ANNEX_TERMS_TEXT = `1.1 ลูกค้าชำระเงินค่าห้องประชุมและค่าอาหาร 100% ก่อนเข้ารับบริการอย่างน้อย 7 วัน
1.2 การชำระค่าบริการ 2 ช่องทาง โดย:
   1. โอนเงินผ่านบัญชีธนาคาร
   2. ชำระผ่านเช็ค ลูกค้าต้องนำเช็คไปขึ้นเท่านั้น
   (หมายเหตุ : ค่าธรรมเนียมในการชำระเงินทั้ง 2 ช่องทาง ลูกค้าต้องเป็นฝ่ายรับผิดชอบค่าธรรมเนียมทั้งหมด)
1.3 กรณีลูกค้าไม่ชำระค่าบริการภายในระยะที่เวลากำหนด KX ขออนุญาตยกเลิกการจองห้องประชุมเพื่อสงวนสิทธิ์แก่ลูกค้าท่านอื่น
1.4 ลูกค้าต้องลงนามยืนยันใบเสนอราคาการจองห้องประชุมกลับภายใน 7 วัน (หลังจากได้รับใบเสนอราคา) หากเกินระยะเวลาที่กำหนด KX ขออนุญาตยกเลิกการจองห้องประชุมเพื่อสงวนสิทธิ์แก่ลูกค้าท่านอื่น`;

export const DEFAULT_ANNEX_TERMS_TEXT_EN = `1.1 Clients must pay 100% of meeting room and catering fees at least 7 days prior to service commencement.
1.2 Payment can be made through 2 channels:
   1. Bank transfer
   2. Cheque (Clients must personally deposit and clear the cheque)
   (Note: Any transaction or transfer fees incurred across both channels shall be borne entirely by the client.)
1.3 If payment is not completed within the designated period, KX reserves the right to cancel the booking to accommodate other clients.
1.4 Clients must sign and return the quotation confirmation within 7 days of receipt. Beyond this period, KX reserves the right to cancel the booking for other clients.`;

interface AnnexDocumentProps {
  customerName?: string;
  config?: AnnexConfig;
  language?: 'th' | 'en';
}

export const AnnexDocument: React.FC<AnnexDocumentProps> = ({ customerName, config, language = 'th' }) => {
  const isEn = language === 'en';
  const title = config?.title 
    ? (isEn && config.title === 'การให้บริการห้องประชุมอาคารเคเอกซ์' ? 'Rules & Terms for KX Conference Room and Venue Usage' : config.title)
    : (isEn ? 'Rules & Terms for KX Conference Room and Venue Usage' : 'การให้บริการห้องประชุมอาคารเคเอกซ์');

  const section1Title = config?.section1Title 
    ? (isEn && config.section1Title === '1. เงื่อนไขการใช้บริการห้องประชุมอาคารเคเอกซ์' ? '1. Terms and Conditions for KX Meeting Room Services' : config.section1Title)
    : (isEn ? '1. Terms and Conditions for KX Meeting Room Services' : '1. เงื่อนไขการใช้บริการห้องประชุมอาคารเคเอกซ์');

  const termsText = config?.termsText 
    ? (isEn && config.termsText === DEFAULT_ANNEX_TERMS_TEXT ? DEFAULT_ANNEX_TERMS_TEXT_EN : config.termsText)
    : (isEn ? DEFAULT_ANNEX_TERMS_TEXT_EN : DEFAULT_ANNEX_TERMS_TEXT);

  const section2Title = config?.section2Title 
    ? (isEn && config.section2Title === '2. ค่าเช่าอุปกรณ์เสริมสำหรับห้องประชุม' ? '2. Additional Rental Equipment & Rates' : config.section2Title)
    : (isEn ? '2. Additional Rental Equipment & Rates' : '2. ค่าเช่าอุปกรณ์เสริมสำหรับห้องประชุม');

  const rawEquipmentList = config?.equipmentList && config.equipmentList.length > 0 ? config.equipmentList : (isEn ? DEFAULT_ANNEX_EQUIPMENT_EN : DEFAULT_ANNEX_EQUIPMENT);
  const equipmentList = isEn
    ? rawEquipmentList.map(item => {
        const matchDefault = DEFAULT_ANNEX_EQUIPMENT.find(d => d.id === item.id || d.name === item.name);
        if (matchDefault) {
          const matchEn = DEFAULT_ANNEX_EQUIPMENT_EN.find(e => e.id === matchDefault.id);
          if (matchEn) return { ...item, name: matchEn.name, price: matchEn.price };
        }
        return item;
      })
    : rawEquipmentList;

  const equipmentNote = config?.equipmentNote 
    ? (isEn && config.equipmentNote.includes('เนื่องด้วยอุปกรณ์') ? 'Note: Equipment availability is limited. Please specify additional equipment requirements upon quotation issuance.' : config.equipmentNote)
    : (isEn ? 'Note: Equipment availability is limited. Please specify additional equipment requirements upon quotation issuance.' : 'หมายเหตุ : เนื่องด้วยอุปกรณ์มีจำนวนจำกัด หากลูกค้าต้องการใช้อุปกรณ์เสริมสามารถแจ้งในวันที่ออกใบเสนอราคา');

  const section3Title = config?.section3Title 
    ? (isEn && config.section3Title === '3. ค่าปรับ' ? '3. Penalty & Damage Fees' : config.section3Title)
    : (isEn ? '3. Penalty & Damage Fees' : '3. ค่าปรับ');

  const rawFinesList = config?.finesList && config.finesList.length > 0 ? config.finesList : (isEn ? DEFAULT_ANNEX_FINES_EN : DEFAULT_ANNEX_FINES);
  const finesList = isEn
    ? rawFinesList.map(item => {
        const matchDefault = DEFAULT_ANNEX_FINES.find(d => d.id === item.id || d.description === item.description);
        if (matchDefault) {
          const matchEn = DEFAULT_ANNEX_FINES_EN.find(e => e.id === matchDefault.id);
          if (matchEn) return { ...item, description: matchEn.description, fine: matchEn.fine };
        }
        return item;
      })
    : rawFinesList;
  
  const fontFamily = config?.fontFamily || 'Trirong';
  const baseFontSize = config?.fontSize || 11;
  const paddingTop = config?.paddingTop ?? 57;
  const paddingBottom = config?.paddingBottom ?? 57;
  const paddingLeft = config?.paddingLeft ?? 57;
  const paddingRight = config?.paddingRight ?? 57;
  const showLogo = config?.showLogo ?? true;
  const lineHeight = config?.lineHeight === 'tight' ? 1.25 : config?.lineHeight === 'relaxed' ? 1.6 : 1.4;

  const getFontFamilyStyle = (font?: string) => {
    switch (font) {
      case 'Trirong': return "'Trirong', 'TH Sarabun New', 'Sarabun', 'Cordia New', serif";
      case 'Prompt': return '"Prompt", sans-serif';
      case 'Kanit': return '"Kanit", sans-serif';
      case 'Mitr': return '"Mitr", sans-serif';
      case 'Chakra Petch': return '"Chakra Petch", sans-serif';
      case 'Bai Jamjuree': return '"Bai Jamjuree", sans-serif';
      case 'IBM Plex Sans Thai': return '"IBM Plex Sans Thai", sans-serif';
      case 'Noto Sans Thai': return '"Noto Sans Thai", sans-serif';
      case 'system-ui': return 'system-ui, sans-serif';
      case 'Sarabun': return '"Sarabun", sans-serif';
      default: return "'Trirong', 'TH Sarabun New', 'Sarabun', 'Cordia New', serif";
    }
  };

  const bodyFontFamilyStyle = getFontFamilyStyle(fontFamily);
  const headerFontFamilyStyle = getFontFamilyStyle(config?.headerFontFamily || fontFamily);
  const headerAlign = config?.headerAlign || (config?.logoAlign === 'left' ? 'left' : config?.logoAlign === 'right' ? 'right' : 'center');
  const logoAlign = config?.logoAlign || 'center';
  const logoHeight = config?.logoHeight || 56;
  const logoMaxWidth = config?.logoMaxWidth ? `${config.logoMaxWidth}px` : `${Math.round(logoHeight * 3.5)}px`;
  const titleFontSize = config?.headerTitleFontSize || (baseFontSize + 3.5);

  return (
    <div
      id="printable-annex"
      className="annex-page bg-white text-neutral-900 mx-auto select-text print:p-0 print:m-0"
      style={{
        fontFamily: bodyFontFamilyStyle,
        fontSize: `${baseFontSize}px`,
        lineHeight: lineHeight,
        WebkitFontSmoothing: 'antialiased',
        MozOsxFontSmoothing: 'grayscale',
        textRendering: 'geometricPrecision',
        width: '820px',
        minWidth: '820px',
        maxWidth: '820px',
        minHeight: '1060px',
        paddingTop: `${paddingTop}px`,
        paddingBottom: `${paddingBottom}px`,
        paddingLeft: `${paddingLeft}px`,
        paddingRight: `${paddingRight}px`,
        boxSizing: 'border-box',
      }}
    >
      {/* Header Section: Logo & Custom Header Texts */}
      <div className={`mb-5 ${
        logoAlign === 'left'
          ? 'flex flex-col sm:flex-row items-start justify-between gap-4'
          : logoAlign === 'right'
          ? 'flex flex-col sm:flex-row-reverse items-start justify-between gap-4'
          : 'flex flex-col items-center justify-center text-center gap-2.5'
      }`}>
        {/* Logo */}
        {showLogo && (
          <div className={`shrink-0 flex items-center ${
            logoAlign === 'left' ? 'justify-start' : logoAlign === 'right' ? 'justify-end' : 'justify-center w-full'
          }`}>
            {config?.logoUrl ? (
              <img
                src={config.logoUrl}
                alt="Logo"
                style={{
                  height: `${logoHeight}px`,
                  maxHeight: `${logoHeight}px`,
                  maxWidth: logoMaxWidth,
                }}
                className="object-contain"
              />
            ) : (
              <div
                className="flex items-center justify-center"
                style={{
                  transform: `scale(${Math.min(2.0, Math.max(0.4, logoHeight / 56))})`,
                  transformOrigin: logoAlign === 'left' ? 'left center' : logoAlign === 'right' ? 'right center' : 'center',
                }}
              >
                <KXLogo size="md" />
              </div>
            )}
          </div>
        )}

        {/* Header Titles */}
        <div
          className={`flex-1 flex flex-col justify-center min-w-0 ${
            headerAlign === 'left'
              ? 'text-left items-start'
              : headerAlign === 'right'
              ? 'text-right items-end'
              : 'text-center items-center w-full'
          }`}
          style={{ fontFamily: headerFontFamilyStyle }}
        >
          <div
            className="font-bold text-neutral-900 leading-tight"
            style={{ fontSize: `${titleFontSize}px` }}
          >
            {title}
          </div>

          {config?.headerSubtitle && (
            <div className="text-neutral-500 font-medium text-xs mt-1">
              {config.headerSubtitle}
            </div>
          )}
        </div>
      </div>

      {/* 1. เงื่อนไขการให้บริการห้องประชุมอาคารเคเอกซ์ */}
      <div className="mb-4 space-y-1 text-neutral-800">
        <div 
          className="font-bold text-neutral-900"
          style={{ fontSize: `${baseFontSize + 0.5}px` }}
        >
          {section1Title}
        </div>
        <div className="pl-3 whitespace-pre-line text-neutral-800 opacity-95">
          {termsText}
        </div>
      </div>

      {/* 2. ค่าเช่าอุปกรณ์เสริมสำหรับห้องประชุม */}
      <div className="mb-4">
        <div 
          className="font-bold text-neutral-900 mb-1"
          style={{ fontSize: `${baseFontSize + 0.5}px` }}
        >
          {section2Title}
        </div>
        <table className="w-full border border-neutral-700 text-left border-collapse">
          <thead>
            <tr className="border-b border-neutral-700 bg-neutral-100 font-bold text-neutral-900">
              <th className="py-1 px-3 border-r border-neutral-700 w-3/5 text-center">{isEn ? 'Equipment / Service' : 'รายการ'}</th>
              <th className="py-1 px-3 text-center">{isEn ? 'Rental Fee' : 'ค่าบริการ'}</th>
            </tr>
          </thead>
          <tbody>
            {equipmentList.map((item) => (
              <tr key={item.id}>
                <td className="py-1 px-3 border-r border-neutral-700">{item.name}</td>
                <td className="py-1 px-3">{item.price}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {equipmentNote && (
          <div className="text-[11px] text-neutral-600 mt-1">
            {equipmentNote}
          </div>
        )}
      </div>

      {/* 3. ค่าปรับ */}
      <div className="mb-5">
        <div 
          className="font-bold text-neutral-900 mb-1"
          style={{ fontSize: `${baseFontSize + 0.5}px` }}
        >
          {section3Title}
        </div>
        <table className="w-full border border-neutral-700 text-left border-collapse">
          <thead>
            <tr className="border-b border-neutral-700 bg-neutral-100 font-bold text-neutral-900">
              <th className="py-1 px-3 border-r border-neutral-700 w-3/5 text-center">{isEn ? 'Description / Infraction' : 'รายการ'}</th>
              <th className="py-1 px-3 text-center">{isEn ? 'Fine / Penalty' : 'ค่าปรับ'}</th>
            </tr>
          </thead>
          <tbody>
            {finesList.map((fine) => (
              <tr key={fine.id}>
                <td className="py-1 px-3 border-r border-neutral-700 whitespace-pre-line leading-tight">
                  {fine.description}
                </td>
                <td className="py-1 px-3 text-center whitespace-nowrap">
                  {fine.fine}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Customer Signature Lines */}
      {(() => {
        const primaryTitle = config?.customerSignerTitle || (isEn ? 'Customer / Authorized Client' : 'ผู้รับบริการ');
        const extraSigners = (config?.additionalSignatures || []).filter(s => s.enabled !== false);
        const allAnnexSigners = [
          { id: 'primary', name: '', title: primaryTitle, signatureUrl: undefined, date: undefined },
          ...extraSigners,
        ];

        return (
          <div className="pt-5 border-t border-neutral-300 flex flex-wrap items-end justify-around gap-6 text-center">
            {allAnnexSigners.map((sig, idx) => (
              <div key={sig.id || idx} className="min-w-[180px] max-w-[260px] flex-1 flex flex-col items-center">
                <div className="h-10 flex items-end justify-center w-full mb-2.5">
                  {sig.signatureUrl ? (
                    <img
                      src={sig.signatureUrl}
                      alt={sig.title}
                      className="max-h-9 max-w-[140px] object-contain mix-blend-multiply"
                    />
                  ) : (
                    <div className="w-44 border-b border-neutral-700 border-dotted"></div>
                  )}
                </div>
                <div className="text-neutral-800 text-[11px] font-medium mb-2">
                  ( {sig.id === 'primary' ? '...................................................' : (sig.name || '...................................................')} )
                </div>
                <div className="font-semibold text-neutral-900 text-[11px] mb-2">{sig.title || (isEn ? 'Customer / Client' : 'ผู้รับบริการ')}</div>
                <div className="text-[10.5px] text-neutral-500">
                  {sig.date ? `${isEn ? 'Date: ' : 'วันที่: '}${sig.date}` : isEn ? 'Date …… / …… / …………' : 'วันที่ …… / …… / …………'}
                </div>
              </div>
            ))}
          </div>
        );
      })()}
    </div>
  );
};
