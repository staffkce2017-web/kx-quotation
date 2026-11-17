import { Quotation } from '../types';
import { formatThaiDate } from './thaiBahtText';

export function exportQuotationsToCSV(quotations: Quotation[], filename = 'kx_quotations_export.csv'): void {
  // UTF-8 BOM for Excel Thai language support
  const BOM = '\uFEFF';

  const headers = [
    'เลขที่ใบเสนอราคา',
    'สถานะ',
    'วันที่ออกเอกสาร',
    'ชื่องาน / กิจกรรม',
    'วันจัดงาน',
    'เวลาจัดงาน',
    'รหัสลูกค้า',
    'ชื่อลูกค้า/บริษัท',
    'เลขผู้เสียภาษี',
    'ผู้ติดต่อ',
    'เบอร์โทรศัพท์',
    'กำหนดชำระเงิน',
    'ยอดรวม (บาท)',
    'สถานะการชำระเงิน',
    'เลขอ้างอิงสลิป',
    'ผู้จัดทำ'
  ];

  const rows = quotations.map((q) => {
    const totalAmount = q.items.reduce((sum, item) => sum + item.amount, 0);
    const statusThaiMap: Record<string, string> = {
      DRAFT: 'ร่าง',
      SENT: 'ส่งใบเสนอราคาแล้ว',
      CONFIRMED: 'ลูกค้าลงนามแล้ว',
      PAID: 'ชำระเงินแล้ว',
      COMPLETED: 'เสร็จสิ้น',
      CANCELLED: 'ยกเลิก'
    };

    return [
      `"${q.quoteNumber}"`,
      `"${statusThaiMap[q.status] || q.status}"`,
      `"${formatThaiDate(q.issueDate, 'short')}"`,
      `"${q.jobTitle.replace(/"/g, '""')}"`,
      `"${q.eventDate ? formatThaiDate(q.eventDate, 'short') : '-'}"`,
      `"${q.eventTime || '-'}"`,
      `"${q.customer.customerCode || '-'}"`,
      `"${q.customer.name.replace(/"/g, '""')}"`,
      `"${q.customer.taxId || '-'}"`,
      `"${q.customer.contactPerson.replace(/"/g, '""')}"`,
      `"${q.customer.mobile || '-'}"`,
      `"${formatThaiDate(q.paymentDueDate, 'short')}"`,
      totalAmount.toFixed(2),
      q.paymentSlip ? '"ชำระแล้ว (มีสลิป)"' : (q.status === 'PAID' ? '"ชำระแล้ว"' : '"ยังไม่ชำระ"'),
      `"${q.paymentSlip?.refNumber || '-'}"`,
      `"${q.signatures.preparedBy.name}"`
    ].join(',');
  });

  const csvContent = BOM + [headers.join(','), ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportDetailedItemsCSV(quotations: Quotation[], filename = 'kx_quotations_line_items.csv'): void {
  const BOM = '\uFEFF';

  const headers = [
    'เลขที่ใบเสนอราคา',
    'วันที่ออกเอกสาร',
    'ลูกค้า',
    'ชื่องาน',
    'ลำดับ',
    'รายการ',
    'จำนวน',
    'หน่วย',
    'ราคาต่อหน่วย',
    'ส่วนลด (%)',
    'จำนวนเงินสุทธิ',
    'สถานะ'
  ];

  const rows: string[] = [];

  quotations.forEach((q) => {
    q.items.forEach((item, index) => {
      rows.push([
        `"${q.quoteNumber}"`,
        `"${formatThaiDate(q.issueDate, 'short')}"`,
        `"${q.customer.name.replace(/"/g, '""')}"`,
        `"${q.jobTitle.replace(/"/g, '""')}"`,
        index + 1,
        `"${item.description.replace(/"/g, '""')}"`,
        item.quantity,
        `"${item.unit}"`,
        item.unitPrice.toFixed(2),
        item.discountPercent,
        item.amount.toFixed(2),
        `"${q.status}"`
      ].join(','));
    });
  });

  const csvContent = BOM + [headers.join(','), ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
