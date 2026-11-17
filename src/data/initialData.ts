import { Quotation } from '../types';

export const KX_COMPANY_INFO = {
  name: 'Knowledge Xchange',
  taxId: '099-4-000-16009-7',
  website: 'www.kxinnovation.com',
  address: '110/1 อาคารเคเอกซ์ ถนนกรุงธนบุรี แขวงบางลำภูล่าง เขตคลองสาน กทม. 10600',
  phones: '02-470-7906, 02-470-7907',
  accountInfo: {
    bankName: 'ธนาคารกรุงเทพ',
    branch: 'สาขา ม.เทคโนโลยีพระจอมเกล้าธนบุรี',
    accountName: 'มจธ.สำนักเคเอกซ์',
    accountNumber: '037-7-14212-0',
  },
  contacts: '02-4707907 (คุณมด บัญชี) 02-4707906 (บุ๊ค, นุ้ค, ติ๊ก )'
};

export const INITIAL_QUOTATIONS: Quotation[] = [
  {
    id: 'kx-quote-003-09-69',
    quoteNumber: 'KX/003/09/69',
    issueDate: '2026-09-01',
    jobTitle: 'Data Governance in Action รุ่นที่ 15',
    eventDate: '2026-09-26',
    eventTime: '08:00-18:00',
    customer: {
      name: 'บริษัท เออินเทลลิเจนซ์ จำกัด (สำนักงานใหญ่)',
      taxId: '0125563017434',
      address: '99/186 หมู่ที่ 1 ต.อ้อมเกร็ด อ.ปากเกร็ด จ.นนทบุรี',
      customerCode: 'KX002231',
      contactPerson: 'คุณสุภัสสร ศิริฐานนท์',
      mobile: '094-979-2972',
      phone: '',
      email: 'supassorn@a-intelligence.co.th'
    },
    items: [
      {
        id: 'item-1',
        description: 'ค่าห้อง X11.2 ชั้น 11 วันที่ 26 กันยายน 2569 (เวลา 08:00-18:00)',
        quantity: 1,
        unit: 'ห้อง',
        unitPrice: 7500,
        discountPercent: 0,
        amount: 7500
      }
    ],
    paymentDueDate: '2026-09-19',
    cancellationNoticeDate: '2026-09-12',
    overtimeNote: 'กรณีใช้งานเกิน 18.00 จะมีค่าบริการจัดสถานที่',
    specialRemarks: 'จัดโต๊ะแบบ Classroom รองรับผู้เข้าอบรม 25 ท่าน พร้อมระบบ Hybrid Zoom',
    bankInfo: {
      bankName: 'ธนาคารกรุงเทพ',
      branch: 'สาขา ม.เทคโนโลยีพระจอมเกล้าธนบุรี',
      accountName: 'มจธ.สำนักเคเอกซ์',
      accountNumber: '037-7-14212-0',
      qrPromptPayCode: '0994000160097'
    },
    signatures: {
      receivedBy: {
        name: 'สุภัสสร ศิริฐานนท์',
        date: '2026-09-05'
      },
      preparedBy: {
        name: 'พจนา',
        date: '2026-09-01'
      },
      approvedBy: {
        name: 'ศิริวรรณ',
        date: '2026-09-02'
      },
      authorizedSignature: {
        name: 'ดร.ภัทร บุณยรัตพันธุ์',
        date: '2026-09-02'
      }
    },
    status: 'PAID',
    statusLogs: [
      {
        id: 'log-1',
        status: 'DRAFT',
        timestamp: '2026-09-01T09:30:00.000Z',
        note: 'สร้างร่างใบเสนอราคาเบื้องต้น',
        updatedBy: 'พจนา'
      },
      {
        id: 'log-2',
        status: 'SENT',
        timestamp: '2026-09-02T10:15:00.000Z',
        note: 'ส่งใบเสนอราคาให้ลูกค้าผ่านอีเมล',
        updatedBy: 'พจนา'
      },
      {
        id: 'log-3',
        status: 'CONFIRMED',
        timestamp: '2026-09-05T14:20:00.000Z',
        note: 'ลูกค้าลงนามยืนยันการจองห้องเรียบร้อย',
        updatedBy: 'สุภัสสร',
        attachments: [
          {
            id: 'att-sample-1',
            name: 'เอกสารยืนยันการจองห้องสัมมนา_ลงนามแล้ว.pdf',
            url: '#',
            type: 'file',
            size: 245760,
            mimeType: 'application/pdf',
            uploadedAt: '2026-09-05T14:20:00.000Z',
          },
          {
            id: 'link-sample-1',
            name: 'โฟลเดอร์เอกสารและสัญญาลูกค้า (Google Drive)',
            url: 'https://drive.google.com',
            type: 'link',
            uploadedAt: '2026-09-05T14:20:00.000Z',
          },
        ],
      },
      {
        id: 'log-4',
        status: 'PAID',
        timestamp: '2026-09-16T14:05:00.000Z',
        note: 'ตรวจสอบสลิปโอนเงินผ่าน SCB Easy ยอด 7,500.00 บาท ถูกต้องครบถ้วน',
        updatedBy: 'คุณมด บัญชี'
      }
    ],
    paymentSlip: {
      id: 'slip-001',
      uploadedAt: '2026-09-16T14:00:00.000Z',
      amount: 7500,
      bankName: 'SCB Easy',
      transferDate: '2026-09-16',
      transferTime: '14:00',
      refNumber: '202609164ICXebWabeOG1jOXB',
      senderName: 'นาย นัคนันท์ น. (xxx-xxx391-2)',
      receiverAccount: 'มจธ.สำนักเคเอกซ์ (x-2120)',
      notes: 'สลิปหลักฐานการโอนเงินค่าห้อง X11.2 รุ่นที่ 15 ตรวจสอบผ่านบัญชีแล้ว'
    },
    createdAt: '2026-09-01T09:30:00.000Z',
    updatedAt: '2026-09-16T14:05:00.000Z'
  },
  {
    id: 'kx-quote-004-09-69',
    quoteNumber: 'KX/004/09/69',
    issueDate: '2026-09-03',
    jobTitle: 'สัมมนา AI Transformation Strategy & Executive Workshop',
    eventDate: '2026-09-28',
    eventTime: '09:00-17:00',
    customer: {
      name: 'บริษัท ดิจิทัล โซลูชั่นส์ อินโนเวชั่น จำกัด',
      taxId: '0105558129841',
      address: '123/45 อาคารไซเบอร์เวิลด์ ชั้น 24 ถ.รัชดาภิเษก ห้วยขวาง กทม.',
      customerCode: 'KX001842',
      contactPerson: 'คุณวรวุฒิ วิจิตรสกุล',
      mobile: '081-445-6789',
      phone: '02-692-5500',
      email: 'worawut@ds-inno.com'
    },
    items: [
      {
        id: 'item-201',
        description: 'ค่าห้อง Auditorium ชั้น 7 วันที่ 28 กันยายน 2569 (เวลา 09:00-17:00)',
        quantity: 1,
        unit: 'ห้อง',
        unitPrice: 18000,
        discountPercent: 10,
        amount: 16200
      },
      {
        id: 'item-202',
        description: 'ชุดเครื่องเสียงและไมค์ลอย (เสริม 4 ตัว)',
        quantity: 1,
        unit: 'ชุด',
        unitPrice: 2000,
        discountPercent: 0,
        amount: 2000
      },
      {
        id: 'item-203',
        description: 'น้ำดื่มและเครื่องต้มน้ำร้อนจัดเลี้ยง',
        quantity: 2,
        unit: 'ชุด',
        unitPrice: 360,
        discountPercent: 0,
        amount: 720
      }
    ],
    paymentDueDate: '2026-09-21',
    cancellationNoticeDate: '2026-09-14',
    overtimeNote: 'กรณีใช้งานเกิน 18.00 จะมีค่าบริการจัดสถานที่ชั่วโมงละ 1,500 บาท',
    specialRemarks: 'ต้องการจอ LED เวที และบันทึกวิดีโอเทปสัมมนา',
    bankInfo: {
      bankName: 'ธนาคารกรุงเทพ',
      branch: 'สาขา ม.เทคโนโลยีพระจอมเกล้าธนบุรี',
      accountName: 'มจธ.สำนักเคเอกซ์',
      accountNumber: '037-7-14212-0',
      qrPromptPayCode: '0994000160097'
    },
    signatures: {
      receivedBy: {
        name: 'วรวุฒิ วิจิตรสกุล',
        date: '2026-09-08'
      },
      preparedBy: {
        name: 'พจนา',
        date: '2026-09-03'
      },
      approvedBy: {
        name: 'ศิริวรรณ',
        date: '2026-09-04'
      },
      authorizedSignature: {
        name: 'ดร.ภัทร บุณยรัตพันธุ์',
        date: '2026-09-04'
      }
    },
    status: 'CONFIRMED',
    statusLogs: [
      {
        id: 'log-201',
        status: 'DRAFT',
        timestamp: '2026-09-03T11:00:00.000Z',
        note: 'สร้างใบเสนอราคาสำหรับงานสัมมนา Auditorium',
        updatedBy: 'พจนา'
      },
      {
        id: 'log-202',
        status: 'SENT',
        timestamp: '2026-09-04T09:30:00.000Z',
        note: 'ส่งใบเสนอราคาพร้อมส่วนลด 10% ให้ลูกค้า',
        updatedBy: 'พจนา'
      },
      {
        id: 'log-203',
        status: 'CONFIRMED',
        timestamp: '2026-09-08T16:45:00.000Z',
        note: 'ลูกค้าลงนามยืนยัน รอแนบสลิปชำระเงินภายใน 21 ก.ย.',
        updatedBy: 'คุณวรวุฒิ'
      }
    ],
    createdAt: '2026-09-03T11:00:00.000Z',
    updatedAt: '2026-09-08T16:45:00.000Z'
  },
  {
    id: 'kx-quote-005-09-69',
    quoteNumber: 'KX/005/09/69',
    issueDate: '2026-09-10',
    jobTitle: 'อบรมเชิงปฏิบัติการ IoT & Smart Factory Workshop',
    eventDate: '2026-10-05',
    eventTime: '08:30-16:30',
    customer: {
      name: 'บริษัท สยาม ออโตเมชั่น เทคโนโลยีส์ จำกัด',
      taxId: '0105562098712',
      address: '88/9 นิคมอุตสาหกรรมบางพลี ต.บางเสาธง อ.บางเสาธง จ.สมุทรปราการ',
      customerCode: 'KX003011',
      contactPerson: 'คุณเกรียงไกร สมบูรณ์',
      mobile: '086-778-9901',
      phone: '02-705-1122',
      email: 'kriangkrai@siamauto.co.th'
    },
    items: [
      {
        id: 'item-301',
        description: 'ค่าห้อง Workshop X10.1 ชั้น 10 วันที่ 5 ตุลาคม 2569 (08:30-16:30)',
        quantity: 1,
        unit: 'ห้อง',
        unitPrice: 9500,
        discountPercent: 0,
        amount: 9500
      },
      {
        id: 'item-302',
        description: 'ค่าจั๊มไฟ พร้อมเบรกเกอร์สำหรับอุปกรณ์สาธิต IoT',
        quantity: 2,
        unit: 'จุด/วัน',
        unitPrice: 1000,
        discountPercent: 0,
        amount: 2000
      }
    ],
    paymentDueDate: '2026-09-28',
    cancellationNoticeDate: '2026-09-21',
    overtimeNote: 'กรณีใช้งานเกิน 18.00 จะมีค่าบริการจัดสถานที่',
    specialRemarks: 'ขอพื้นที่เพิ่มเติมสำหรับวางโมเดลเครื่องจักรจำลอง',
    bankInfo: {
      bankName: 'ธนาคารกรุงเทพ',
      branch: 'สาขา ม.เทคโนโลยีพระจอมเกล้าธนบุรี',
      accountName: 'มจธ.สำนักเคเอกซ์',
      accountNumber: '037-7-14212-0',
      qrPromptPayCode: '0994000160097'
    },
    signatures: {
      receivedBy: {
        name: '',
        date: ''
      },
      preparedBy: {
        name: 'พจนา',
        date: '2026-09-10'
      },
      approvedBy: {
        name: 'ศิริวรรณ',
        date: '2026-09-11'
      },
      authorizedSignature: {
        name: 'ดร.ภัทร บุณยรัตพันธุ์',
        date: '2026-09-11'
      }
    },
    status: 'SENT',
    statusLogs: [
      {
        id: 'log-301',
        status: 'DRAFT',
        timestamp: '2026-09-10T10:00:00.000Z',
        note: 'ร่างใบเสนอราคาห้อง Workshop IoT',
        updatedBy: 'พจนา'
      },
      {
        id: 'log-302',
        status: 'SENT',
        timestamp: '2026-09-11T13:30:00.000Z',
        note: 'ส่งใบเสนอราคาให้ลูกค้าพิจารณา',
        updatedBy: 'พจนา'
      }
    ],
    createdAt: '2026-09-10T10:00:00.000Z',
    updatedAt: '2026-09-11T13:30:00.000Z'
  }
];

export const PRESET_ROOMS_AND_EQUIPMENT = [
  { description: 'ค่าห้อง X11.2 ชั้น 11 (เวลา 08:00-18:00)', unit: 'ห้อง', unitPrice: 7500 },
  { description: 'ค่าห้อง Workshop X10.1 ชั้น 10 (เวลา 08:00-18:00)', unit: 'ห้อง', unitPrice: 9500 },
  { description: 'ค่าห้อง Auditorium ชั้น 7 (เวลา 09:00-17:00)', unit: 'ห้อง', unitPrice: 18000 },
  { description: 'ค่าห้องประชุม Boardroom X14 (เวลา 09:00-17:00)', unit: 'ห้อง', unitPrice: 12000 },
  { description: 'นำเข้าอาหารและเครื่องดื่ม (แบบกล่อง) 25 - 29 ท่าน', unit: 'วัน', unitPrice: 500 },
  { description: 'นำเข้าอาหารและเครื่องดื่ม (แบบกล่อง) 30 - 100 ท่าน', unit: 'วัน', unitPrice: 1000 },
  { description: 'นำเข้าอาหารและเครื่องดื่ม (แบบกล่อง) 100 ท่านขึ้นไป', unit: 'วัน', unitPrice: 1500 },
  { description: 'นำเข้าอาหารและเครื่องดื่ม (บุฟเฟ่ต์) 2,000 บาท/วัน', unit: 'วัน', unitPrice: 2000 },
  { description: 'นำเข้าอาหารและเครื่องดื่ม (บุฟเฟ่ต์) 3,000 บาท/วัน', unit: 'วัน', unitPrice: 3000 },
  { description: 'จอทีวีขนาด 55 นิ้ว', unit: 'เครื่อง/วัน', unitPrice: 500 },
  { description: 'ฟลิปชาร์ต', unit: 'อัน/วัน', unitPrice: 300 },
  { description: 'ชุดโปรเจคเตอร์ (เสริม)', unit: 'เครื่อง/วัน', unitPrice: 1000 },
  { description: 'ชุดเครื่องเสียง (เสริม)', unit: 'เครื่อง/วัน', unitPrice: 1000 },
  { description: 'ค่าจั๊มไฟ พร้อมเบรคเกอร์', unit: 'จุด/วัน', unitPrice: 1000 },
  { description: 'น้ำดื่มขนาด 350 มล.', unit: 'แพ็ค', unitPrice: 60 },
  { description: 'เครื่องต้มน้ำร้อน (พร้อมน้ำ)', unit: 'เครื่อง', unitPrice: 300 },
];
