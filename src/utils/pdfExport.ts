import jsPDF from 'jspdf';
import html2canvas from 'html2canvas-pro';

export type PDFPageSelection = 'quotation' | 'annex' | 'both';

export interface ExportPDFParams {
  quotationElementId?: string;
  annexElementId?: string;
  selection: PDFPageSelection;
  quoteNumber: string;
  customerName?: string;
  onProgress?: (status: string) => void;
}

/**
 * Converts modern color functions (oklch, oklab, lch, lab) in computed & inline styles
 * into standard rgb(...) for complete cross-compatibility.
 */
function sanitizeModernColorsInClone(clonedElement: HTMLElement) {
  try {
    const tempEl = document.createElement('div');
    document.body.appendChild(tempEl);

    const elements = [clonedElement, ...Array.from(clonedElement.getElementsByTagName('*'))] as HTMLElement[];
    const colorProps = [
      'color',
      'backgroundColor',
      'borderColor',
      'borderTopColor',
      'borderBottomColor',
      'borderLeftColor',
      'borderRightColor',
      'outlineColor',
      'textDecorationColor',
      'fill',
      'stroke',
    ];

    for (const el of elements) {
      if (!el.style) continue;
      try {
        const computed = window.getComputedStyle(el);
        for (const prop of colorProps) {
          const val = (el.style as any)[prop] || computed[prop as any];
          if (
            typeof val === 'string' &&
            (val.includes('oklch') || val.includes('oklab') || val.includes('lch') || val.includes('lab'))
          ) {
            try {
              tempEl.style.color = val;
              const converted = window.getComputedStyle(tempEl).color;
              if (converted && !converted.includes('oklch') && !converted.includes('oklab')) {
                (el.style as any)[prop] = converted;
              }
            } catch (e) {}
          }
        }
      } catch (e) {}
    }

    if (tempEl.parentNode) {
      tempEl.parentNode.removeChild(tempEl);
    }
  } catch (e) {
    console.warn('Color sanitization notice:', e);
  }
}

/**
 * Exports quotation and/or annex pages directly to a real downloadable PDF file.
 * Generates high-definition lossless PNG pages with crisp Thai typography.
 */
export async function generateAndDownloadPDF({
  quotationElementId = 'export-page-quotation',
  annexElementId = 'export-page-annex',
  selection,
  quoteNumber,
  customerName,
  onProgress,
}: ExportPDFParams): Promise<void> {
  // 1. Wait for web fonts to be completely ready
  if (typeof document !== 'undefined' && 'fonts' in document) {
    try {
      await (document as any).fonts.ready;
    } catch (e) {
      console.warn('fonts.ready notice:', e);
    }
  }

  // Small delay to ensure layout re-calculations finish
  await new Promise((r) => setTimeout(r, 160));

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  const a4WidthMm = 210;
  const a4HeightMm = 297;

  const sanitizeFileName = (str: string) =>
    str.replace(/[/\\?%*:|"<>]/g, '-').trim();

  const safeQuoteNo = sanitizeFileName(quoteNumber || 'Quotation');
  const safeCustomer = customerName ? `_${sanitizeFileName(customerName).slice(0, 30)}` : '';

  // Format: KX + DDMMYYYY + - + QUOTE_NO
  // quoteNumber is assumed to be something like "001" or "Q-001"
  const dateObj = new Date();
  const day = String(dateObj.getDate()).padStart(2, '0');
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const year = dateObj.getFullYear();
  const formattedDate = `${day}${month}${year}`;
  
  // Extract number part if format is "Q-001" or "KX/001/..."
  const parts = quoteNumber.split(/[\/\-]/);
  const quoteNumberPart = parts.find(part => /^\d{3}$/.test(part)) || parts.pop() || safeQuoteNo;

  let fileName = `KX${formattedDate}-${quoteNumberPart}.pdf`;
  if (selection === 'quotation') {
    fileName = `KX${formattedDate}-${quoteNumberPart}_ใบเสนอราคา.pdf`;
  } else if (selection === 'annex') {
    fileName = `KX${formattedDate}-${quoteNumberPart}_ข้อกำหนดและค่าปรับ.pdf`;
  }

  const captureElement = async (el: HTMLElement): Promise<string> => {
    // scale: 6 produces exactly ~600 DPI print quality (820px * 6 = 4,920px across 8.27in A4 width)
    const canvas = await html2canvas(el, {
      scale: 6,
      width: 820,
      windowWidth: 820,
      useCORS: true,
      allowTaint: true,
      logging: false,
      backgroundColor: '#ffffff',
      imageTimeout: 20000,
      onclone: (_clonedDoc, clonedElement) => {
        // Reset parent positions in clone so it renders at origin (0, 0)
        if (clonedElement.parentElement) {
          clonedElement.parentElement.style.position = 'static';
          clonedElement.parentElement.style.left = '0';
          clonedElement.parentElement.style.top = '0';
          clonedElement.parentElement.style.transform = 'none';
        }

        clonedElement.style.position = 'static';
        clonedElement.style.left = '0';
        clonedElement.style.top = '0';
        clonedElement.style.margin = '0';
        (clonedElement.style as any).webkitFontSmoothing = 'antialiased';
        clonedElement.style.textRendering = 'optimizeLegibility';
        (clonedElement.style as any).imageRendering = '-webkit-optimize-contrast';

        // Apply crisp font rendering to all child text nodes
        const allElements = clonedElement.getElementsByTagName('*');
        for (let i = 0; i < allElements.length; i++) {
          const item = allElements[i] as HTMLElement;
          if (item && item.style) {
            (item.style as any).webkitFontSmoothing = 'antialiased';
            item.style.textRendering = 'optimizeLegibility';
          }
        }

        sanitizeModernColorsInClone(clonedElement);
      },
    });

    // 100% LOSSLESS PNG format: completely eliminates JPEG block noise and blurry edges
    const imgData = canvas.toDataURL('image/png');
    // Release canvas dimensions to free RAM immediately
    canvas.width = 1;
    canvas.height = 1;
    return imgData;
  };

  let isFirstPage = true;

  // Process Page 1: Quotation
  if (selection === 'quotation' || selection === 'both') {
    onProgress?.('กำลังประมวลผลหน้า 1 (ใบเสนอราคา)...');
    const quoteEl = document.getElementById(quotationElementId);
    if (!quoteEl) {
      throw new Error('ไม่พบข้อมูลหน้าใบเสนอราคาสำหรับการสร้าง PDF');
    }

    const imgData = await captureElement(quoteEl);
    pdf.addImage(imgData, 'PNG', 0, 0, a4WidthMm, a4HeightMm, undefined, 'FAST');
    isFirstPage = false;
  }

  // Process Page 2: Annex
  if (selection === 'annex' || selection === 'both') {
    onProgress?.('กำลังประมวลผลหน้า 2 (ข้อกำหนดและค่าปรับ)...');
    const annexEl = document.getElementById(annexElementId);
    if (!annexEl) {
      throw new Error('ไม่พบข้อมูลหน้าข้อกำหนดและค่าปรับสำหรับการสร้าง PDF');
    }

    const imgData = await captureElement(annexEl);
    if (!isFirstPage) {
      pdf.addPage('a4', 'portrait');
    }
    pdf.addImage(imgData, 'PNG', 0, 0, a4WidthMm, a4HeightMm, undefined, 'FAST');
  }

  onProgress?.('กำลังดาวน์โหลดไฟล์ PDF เข้าสู่เครื่อง...');
  pdf.save(fileName);
}
