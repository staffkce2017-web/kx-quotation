export type QuotationStatus = 
  | 'DRAFT'        // ร่าง
  | 'SENT'         // ส่งใบเสนอราคาแล้ว
  | 'CONFIRMED'    // ลูกค้าลงนามยืนยันแล้ว
  | 'PAID'         // ชำระเงินแล้ว
  | 'COMPLETED'    // งานเสร็จสิ้น
  | 'CANCELLED';   // ยกเลิก

export type PaymentTermType = 'PRIVATE_7_DAYS' | 'GOVERNMENT_30_DAYS';

export interface RoomCatalogItem {
  id: string;
  name: string; // e.g., 'ห้องสัมมนา X11.2 ชั้น 11'
  category: 'room' | 'equipment' | 'service';
  unit: string; // e.g., 'ห้อง', 'เครื่อง/วัน', 'วัน', 'ครึ่งวัน', 'ชั่วโมง'
  unitPrice: number;
  
  // อัตราค่าเช่าวันธรรมดา (จันทร์ - ศุกร์)
  fullDayPrice?: number;      // ราคาเต็มวัน วันธรรมดา (8 - 10 ชั่วโมง)
  halfDayPrice?: number;      // ราคาครึ่งวัน วันธรรมดา (3 - 5 ชั่วโมง)
  hourlyPrice?: number;       // ราคารายชั่วโมง วันธรรมดา (กรณีอื่นๆ)

  // อัตราค่าเช่าวันเสาร์ - อาทิตย์ (Weekend)
  fullDayWeekendPrice?: number; // ราคาเต็มวัน วันเสาร์-อาทิตย์
  halfDayWeekendPrice?: number; // ราคาครึ่งวัน วันเสาร์-อาทิตย์
  hourlyWeekendPrice?: number;  // ราคารายชั่วโมง วันเสาร์-อาทิตย์

  description?: string;
  floor?: string;        // เช่น FL.7, FL.8, FL.7+8, FL.9, FL.10, FL.11, FL.12, FL.13, FL.17
  capacity?: string;
  sizeSqM?: number;      // ขนาดพื้นที่ (ตร.ม.)
  hasNaturalLight?: boolean; // แสงธรรมชาติ (Natural Light)
  theatreCapacity?: number;  // ความจุแบบ Theatre
  classroomCapacity?: number; // ความจุแบบ Classroom
  uShapeCapacity?: number;   // ความจุแบบ U-Shape
  isCustom?: boolean;
  createdAt?: string;
}

export interface QuotationItem {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  discountPercent: number;
  amount: number;
  usageDate?: string; // วันที่ใช้งานเฉพาะรายการ เช่น '2026-10-15' หรือ '15-16 ต.ค. 2569'
  eventDate?: string; // alias สำหรับ วันที่ใช้งาน
  usageTime?: string; // เวลาใช้งานเฉพาะรายการ เช่น '08:00 - 12:00' หรือ '08:00 - 17:00'
  eventTime?: string; // alias สำหรับ เวลาใช้งาน
  roomName?: string;  // ห้องที่ใช้งาน (ถ้ามี)
  roomId?: string;    // รหัสห้องใน Catalog (ถ้ามี)
  jobTitle?: string;  // ชื่องานเฉพาะห้องหรือรายการที่ใช้งาน
  rateType?: 'half_day' | 'half_day_afternoon' | 'full_day' | 'custom'; // รูปแบบเรทคำนวณอัตโนมัติ
}

export interface CustomerInfo {
  name: string;
  taxId: string;
  address: string;
  customerCode: string;
  contactPerson: string;
  mobile: string;
  phone?: string;
  email?: string;
  department?: string; // e.g., 'เอกชน', 'ราชการ'
  discountRate?: number; // e.g., 10 (ส่วนลด %)
}

export interface CustomerRecord extends CustomerInfo {
  id?: string;
  department?: string; // หน่วยงาน เช่น เอกชน, มหาวิทยาลัย, รัฐบาล
  discountRate?: number; // ส่วนลด (%)
  jobTitle?: string; // ชื่องาน
  eventDate?: string; // วันที่ใช้งาน
  usageDate?: string; // alias สำหรับ วันที่ใช้งาน
  eventTime?: string; // เวลาที่ใช้งาน
  foodBeverage?: string; // การนำเข้าอาหาร/เครื่องดื่ม
  notes?: string;
  source?: string; // ลิงก์ Google Sheets, ไฟล์แนบ, ฐานข้อมูลเริ่มต้น
  updatedAt?: string;
}

export interface CustomerSyncConfig {
  sheetUrl: string;
  lastSyncedAt?: string;
  autoSync: boolean;
}

export interface PaymentSlip {
  id: string;
  uploadedAt: string;
  amount: number;
  transferDate?: string;
  transferTime?: string;
  bankName?: string;
  refNumber?: string;
  imageUrl?: string;
  senderName?: string;
  receiverAccount?: string;
  notes?: string;
}

export interface StatusAttachment {
  id: string;
  name: string;
  url: string;               // data URL (for files) or http(s) URL (for web links)
  type: 'file' | 'link';
  size?: number;             // file size in bytes
  mimeType?: string;         // e.g. application/pdf, image/png
  uploadedAt?: string;
}

export interface StatusLog {
  id: string;
  status: QuotationStatus;
  timestamp: string;
  note?: string;
  updatedBy: string;
  attachments?: StatusAttachment[];
}

export interface AdditionalSignatureItem {
  id: string;
  title: string;              // e.g. "ผู้รับบริการ", "พยาน", "ผู้อนุมัติโครงการ", "ผู้มีอำนาจลงนามร่วม"
  name?: string;               // e.g. "คุณดนยา โอฬาริกเดช"
  signatureUrl?: string;       // dataUrl or image url
  date?: string;               // e.g. "2026-10-02"
  mode?: 'handwrite' | 'image' | 'text'; // 'handwrite' draws a clean dotted line for handwriting
  enabled?: boolean;           // default true
}

export interface SignatureConfig {
  receivedBy: {
    title?: string;
    name?: string;
    signatureUrl?: string;
    date?: string;
    mode?: 'handwrite' | 'image' | 'text';
    enabled?: boolean;
  };
  preparedBy: {
    title?: string;
    name: string;
    signatureUrl?: string;
    date?: string;
    mode?: 'handwrite' | 'image' | 'text';
    enabled?: boolean;
  };
  approvedBy: {
    title?: string;
    name: string;
    signatureUrl?: string;
    date?: string;
    mode?: 'handwrite' | 'image' | 'text';
    enabled?: boolean;
  };
  authorizedSignature: {
    title?: string;
    name: string;
    signatureUrl?: string;
    date?: string;
    mode?: 'handwrite' | 'image' | 'text';
    enabled?: boolean;
  };
  additionalSignatures?: AdditionalSignatureItem[];
}

export interface QuotationLayoutSettings {
  paddingTop: number;       // in px (e.g. 10 - 80, default 36)
  paddingBottom: number;    // in px (e.g. 10 - 80, default 36)
  paddingLeft: number;      // in px (e.g. 10 - 80, default 40)
  paddingRight: number;     // in px (e.g. 10 - 80, default 40)
  fontSize: 'compact' | 'normal' | 'large'; // 11px, 12px, 13px
  sectionSpacing: 'compact' | 'normal' | 'relaxed'; // tight (mb-1.5), normal (mb-2.5), relaxed (mb-4)
  logoHeight: number;       // in px (24 - 140, default 56)
  logoMaxWidth?: number;    // in px (e.g. 80 - 400, default auto)
  logoAlign: 'left' | 'center' | 'right';
  headerOffsetY?: number;   // in px (-40 to +60, default 0)
  headerOffsetX?: number;   // in px (-60 to +60, default 0)
  headerPaddingTop?: number; // in px (0 to 50, default 0)
  headerPaddingBottom?: number; // in px (0 to 50, default 0)
  headerMarginBottom?: number; // in px (0 to 50, default 12)
  headerFontFamily?: 'Trirong' | 'Sarabun' | 'Prompt' | 'system-ui' | string; // Font for header title & subtitle
  headerTitleFontSize?: number; // in px (12 - 32, default 16)
  headerSubtitleFontSize?: number; // in px (9 - 22, default 11)
  headerCompanyFontSize?: number; // in px (9 - 16, default 11)
  companyFontFamily?: 'Trirong' | 'Sarabun' | 'Prompt' | 'Kanit' | 'Mitr' | 'Chakra Petch' | 'Bai Jamjuree' | 'IBM Plex Sans Thai' | 'Noto Sans Thai' | 'system-ui' | string;
  companyAlign?: 'left' | 'center' | 'right' | 'auto'; // default 'auto' (follows logoAlign layout)
  companyLineHeight?: number; // e.g. 1.15, 1.25, 1.35, 1.5, 1.75 (default 1.25)
  companyOffsetX?: number; // in px (-40 to +40, default 0)
  companyOffsetY?: number; // in px (-30 to +40, default 0)
  companyPaddingTop?: number; // in px (0 to 30, default 0)
  companyPaddingBottom?: number; // in px (0 to 30, default 0)
  signatureHeight?: number; // in px (20 - 64, default 32)
  signatureGridCols?: 'auto' | 1 | 2 | 3 | 4; // grid layout for signatures
  minEmptyRows?: number;    // minimum empty reserve rows in table (default 10)
  paymentTermsFontSize?: number; // in px (10 - 18, default 11)
  paymentTermsAlign?: 'left' | 'center' | 'right'; // default 'left'
  paymentTermsLineHeight?: 'tight' | 'normal' | 'relaxed'; // default 'normal'
  showLogo: boolean;
  showHeaderCompanyInfo?: boolean; // toggle showing company info (center/right) in header
  showPaymentTerms: boolean;
  showOvertimeNote: boolean;
  showBankInfo: boolean;
  showSignatures: boolean;
  showRowDividerLines?: boolean; // เส้นสีเทาระหว่างบรรทัดในตาราง (ค่าเริ่มต้น: false เอาเส้นออก)
  showCustomerInfo?: boolean;   // แสดงกล่องข้อมูลลูกค้า (ค่าเริ่มต้น: true)
  paymentBoxHeight?: number;    // ความสูงของกล่องชำระเงิน (2 ซม ≈ 75.6px)
  bankFontFamily?: 'Sarabun' | 'Trirong' | 'Prompt' | 'Kanit' | 'Mitr' | 'Chakra Petch' | 'Bai Jamjuree' | 'IBM Plex Sans Thai' | 'Noto Sans Thai' | 'system-ui' | string; // ฟอนต์สำหรับข้อมูลชำระเงิน
  bankFontSize?: number;        // ขนาดฟอนต์ข้อมูลธนาคารหลัก (8 - 18px, ค่าเริ่มต้น: 10.5px)
  bankTitleFontSize?: number;   // ขนาดฟอนต์หัวข้อ "การชำระเงิน" (ถ้าไม่กำหนดจะเท่ากับ bankFontSize)
  bankTitleBold?: boolean;      // หัวข้อ "การชำระเงิน" ตัวหนา/ปกติ (ค่าเริ่มต้น: true)
  bankLabelFontSize?: number;   // ขนาดฟอนต์ป้ายกำกับ (โดยการโอนเงิน, ชื่อบัญชี, เลขที่บัญชี)
  bankLabelBold?: boolean;      // ป้ายกำกับตัวหนา/ปกติ (ค่าเริ่มต้น: true)
  bankDetailsFontSize?: number; // ขนาดฟอนต์ชื่อธนาคาร/สาขา/ชื่อบัญชี
  bankDetailsBold?: boolean;    // ข้อมูลชื่อธนาคาร/สาขา/ชื่อบัญชี ตัวหนา/ปกติ (ค่าเริ่มต้น: false)
  bankAccountNumberFontSize?: number; // ขนาดฟอนต์เลขที่บัญชี (ถ้าไม่กำหนดจะเท่ากับ bankFontSize เพื่อให้ขนาดเท่ากันเป๊ะ)
  bankAccountNumberBold?: boolean;    // เลขที่บัญชี ตัวหนา/ปกติ (ค่าเริ่มต้น: true)
  autoFitQr?: boolean;          // ปรับขนาด QR Code อัตโนมัติให้พอดีกับความสูงกล่องชำระเงิน (ค่าเริ่มต้น: true)
  qrSize?: number;              // ขนาดตัว QR Code (36 - 120px, ถ้า autoFitQr: true จะคำนวณอัตโนมัติ)
  paymentLanguage?: 'auto' | 'th' | 'en'; // ตัวเลือกภาษาเฉพาะส่วนการชำระเงิน ('th' | 'en' | 'auto')
}


export interface BankInfo {
  bankName: string;
  branch: string;
  accountName: string;
  accountNumber: string;
  qrPromptPayCode?: string; // PromptPay ID (e.g. 0994000160097 or Phone)
  qrImageUrl?: string;      // Custom uploaded QR code image
  qrCustomPayload?: string; // Custom QR text/URL/payload
  qrType?: 'promptpay' | 'image' | 'custom_payload';
}

export interface AnnexEquipmentRow {
  id: string;
  name: string;
  price: string;
}

export interface AnnexFineRow {
  id: string;
  description: string;
  fine: string;
}

export interface AnnexConfig {
  title?: string;
  headerSubtitle?: string;
  companyName?: string;
  section1Title?: string;
  termsText?: string;
  section2Title?: string;
  equipmentList?: AnnexEquipmentRow[];
  equipmentNote?: string;
  section3Title?: string;
  finesList?: AnnexFineRow[];
  fontFamily?: string;
  fontSize?: number; // in px (default 11.5)
  headerFontFamily?: string;
  headerTitleFontSize?: number; // in px
  headerAlign?: 'left' | 'center' | 'right';
  paddingTop?: number;
  paddingBottom?: number;
  paddingLeft?: number;
  paddingRight?: number;
  lineHeight?: 'tight' | 'normal' | 'relaxed';
  showLogo?: boolean;
  logoUrl?: string;
  logoHeight?: number;
  logoMaxWidth?: number;
  logoAlign?: 'left' | 'center' | 'right';
  customerSignerName?: string;
  customerSignerTitle?: string;
  additionalSignatures?: AdditionalSignatureItem[];
}

export const DEFAULT_LAYOUT_SETTINGS: QuotationLayoutSettings = {
  paddingTop: 57,       // 1.5 ซม. (15 มม. ≈ 57px ที่ 96 DPI)
  paddingBottom: 57,    // 1.5 ซม.
  paddingLeft: 57,      // 1.5 ซม.
  paddingRight: 57,     // 1.5 ซม.
  fontSize: 'normal',
  sectionSpacing: 'normal',
  logoHeight: 56,
  logoAlign: 'left',
  headerOffsetY: 0,
  headerOffsetX: 0,
  headerPaddingTop: 0,
  headerPaddingBottom: 0,
  headerMarginBottom: 12,
  headerFontFamily: 'Trirong',
  headerTitleFontSize: 16,
  headerSubtitleFontSize: 11,
  headerCompanyFontSize: 11,
  signatureHeight: 32,
  minEmptyRows: 10,
  paymentTermsFontSize: 11,
  paymentTermsAlign: 'left',
  paymentTermsLineHeight: 'normal',
  showLogo: true,
  showHeaderCompanyInfo: true,
  showPaymentTerms: true,
  showOvertimeNote: true,
  showBankInfo: true,
  showSignatures: true,
  showRowDividerLines: false, // เส้นสีเทาระหว่างบรรทัดเอาออกตามที่ผู้ใช้ต้องการ
  showCustomerInfo: true,     // แสดงกล่องข้อมูลลูกค้า
  paymentBoxHeight: 75.6,     // 2 ซม. (2 cm ≈ 75.6px ที่ 96 DPI)
  bankFontFamily: 'Trirong',
  bankFontSize: 11,
  bankTitleBold: true,
  bankLabelBold: true,
  bankDetailsBold: false,
  bankAccountNumberBold: true,
  autoFitQr: true,            // ค่าเริ่มต้น: ปรับขนาด QR Code อัตโนมัติให้พอดีความสูง 2 ซม. ไม่ล้นกล่อง
  qrSize: 56,                 // ขนาดที่พอดีความสูง 2 ซม. (รวมกรอบและระยะเว้นด้านใน)
};

export type QuotationLanguage = 'th' | 'en';

export interface Quotation {
  id: string;
  quoteNumber: string; // e.g., KX/003/09/69
  issueDate: string;   // e.g., 2026-09-01
  jobTitle: string;    // e.g., Data Governance in Action รุ่นที่ 15
  eventDate?: string;  // e.g., 2026-09-26 หรือ วันที่ใช้งาน
  usageDate?: string;  // alias สำหรับ วันที่ใช้งาน
  eventTime?: string;  // e.g., 08:00-18:00
  customer: CustomerInfo;
  items: QuotationItem[];
  
  // Payment Terms
  paymentTermType?: PaymentTermType; // 'PRIVATE_7_DAYS' | 'GOVERNMENT_30_DAYS'
  paymentDueDate: string;       // e.g., 2026-09-19
  cancellationNoticeDate: string; // e.g., 2026-09-12
  customPaymentTermsText?: string; // ข้อความเงื่อนไขการชำระเงินที่แก้ไขเอง (ภาษาไทย)
  customPaymentTermsTextEn?: string; // ข้อความเงื่อนไขการชำระเงินที่แก้ไขเอง (ภาษาอังกฤษ)
  overtimeNote: string;          // e.g., กรณีใช้งานเกิน 18.00 จะมีค่าบริการจัดสถานที่
  specialRemarks?: string;       // ข้อความหมายเหตุเพิ่มเติม
  
  // Bank Account & Payment Details
  bankInfo: BankInfo;
  bankInfoEn?: Partial<BankInfo>; // ข้อมูลบัญชีธนาคารฉบับภาษาอังกฤษ (ถ้ามี)
  paymentLanguage?: 'auto' | 'th' | 'en'; // ตัวเลือกภาษาสำหรับแสดงส่วนการชำระเงินโดยเฉพาะ ('th' | 'en' | 'auto')

  
  // Signatures
  signatures: SignatureConfig;

  // Header & Branding Customization
  logoUrl?: string;
  headerTitle?: string;
  headerSubtitle?: string;
  companyInfo?: {
    companyName?: string;
    taxId?: string;
    address?: string;
    website?: string;
    phone?: string;
  };

  // Layout & Spacing Controller
  layoutSettings?: QuotationLayoutSettings;

  // Annex (Page 2) Terms & Penalties Customization
  annexConfig?: AnnexConfig;

  // Status & Workflow
  status: QuotationStatus;
  statusLogs: StatusLog[];
  paymentSlip?: PaymentSlip;

  // Language & Translation Mode
  language?: QuotationLanguage; // 'th' | 'en' (default 'th')
  translations?: {
    th?: Partial<Quotation>;
    en?: Partial<Quotation>;
  };

  // Timestamps
  createdAt: string;
  updatedAt: string;
}

export type WorkspaceAppType = 'native' | 'iframe' | 'link';

export interface WorkspaceApp {
  id: string;
  name: string;
  subtitle?: string;
  iconName: string;
  color?: string;
  isBuiltIn?: boolean;
  type: WorkspaceAppType;
  url?: string;
  badge?: string;
  description?: string;
  createdAt?: string;
}

