import React, { useState, useEffect } from 'react';
import { Quotation, QuotationItem, QuotationLayoutSettings, DEFAULT_LAYOUT_SETTINGS } from '../types';
import { KXLogo } from './KXLogo';
import { QRCodeCanvas } from './QRCodeCanvas';
import { processSignatureDataUrl } from '../utils/signatureProcessor';
import {
  arabicToThaiBahtText,
  arabicToEnglishBahtText,
  formatCurrency,
  formatThaiDate,
  formatThaiDateSmart,
  formatThaiDateRange,
  formatEnglishDate,
  formatEnglishDateSmart,
  formatEnglishDateRange,
  translateThaiDateToEnglish,
  isNoDiscountItem,
} from '../utils/thaiBahtText';
import { generatePromptPayPayload } from '../utils/promptpay';
import { MapPin, Phone } from 'lucide-react';
import {
  translatePhrase,
  translateUnit,
  translateAddress,
  translateContactPerson,
  translateCompanyName,
  restorePhraseToThai,
  restoreUnitToThai,
} from '../utils/quotationTranslator';

function ProcessedSignatureImg({ src, alt, height, className }: { src: string; alt: string; height: number; className: string }) {
  const [processedSrc, setProcessedSrc] = useState<string>(src);

  useEffect(() => {
    let isMounted = true;
    if (src && src.startsWith('data:image/')) {
      processSignatureDataUrl(src, { convertToBlue: true })
        .then((cleaned) => {
          if (isMounted) setProcessedSrc(cleaned);
        })
        .catch(() => {
          if (isMounted) setProcessedSrc(src);
        });
    } else {
      setProcessedSrc(src);
    }
    return () => {
      isMounted = false;
    };
  }, [src]);

  return (
    <img
      src={processedSrc}
      alt={alt}
      style={{ height: `${height}px`, maxHeight: `${height}px` }}
      className={className}
    />
  );
}

export function consolidateDocumentItems(items: QuotationItem[]): QuotationItem[] {
  if (!items || items.length === 0) return [];

  const result: (QuotationItem & { _dates?: string[] })[] = [];

  for (const item of items) {
    let cleanDesc = (item.description || '')
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

    // Ensure all opening parentheses have matching closing parentheses
    const openCount = (cleanDesc.match(/\(/g) || []).length;
    const closeCount = (cleanDesc.match(/\)/g) || []).length;
    if (openCount > closeCount) {
      cleanDesc += ')'.repeat(openCount - closeCount);
    }

    const time = (item.usageTime || item.eventTime || '').trim();
    const unitPrice = Number(item.unitPrice) || 0;
    const discountPercent = Number(item.discountPercent) || 0;
    const unit = (item.unit || '').trim();
    const itemDate = (item.usageDate || item.eventDate || '').trim();
    const itemJobTitle = (item.jobTitle || '').trim();

    const existingIndex = result.findIndex(
      (r) =>
        r.description.trim() === cleanDesc &&
        (r.usageTime || r.eventTime || '').trim() === time &&
        (r.jobTitle || '').trim() === itemJobTitle &&
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
        jobTitle: itemJobTitle || existing.jobTitle,
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
        jobTitle: itemJobTitle,
        _dates: dates,
      });
    }
  }

  return result;
}

function cleanDisplay(val?: string): string {
  if (!val) return '';
  const s = String(val).trim();
  if (s === '-' || s === '--' || s === '---' || s === '–' || s === '—' || s.toLowerCase() === 'none' || s.toLowerCase() === 'n/a' || s.toLowerCase() === 'undefined' || s.toLowerCase() === 'null') {
    return '';
  }
  return s;
}

interface QuotationDocumentProps {
  quotation: Quotation;
  showSignatures?: boolean;
  logoUrl?: string;
  headerTitle?: string;
  headerSubtitle?: string;
  layoutSettings?: QuotationLayoutSettings;
}

export const QuotationDocument: React.FC<QuotationDocumentProps> = ({
  quotation,
  showSignatures = true,
  logoUrl,
  headerTitle,
  headerSubtitle,
  layoutSettings,
}) => {
  // Merge layout settings with quotation settings and defaults
  const settings: QuotationLayoutSettings = {
    ...DEFAULT_LAYOUT_SETTINGS,
    ...(quotation.layoutSettings || {}),
    ...(layoutSettings || {}),
  };

  const isEn = quotation.language === 'en';
  const activeLogo = logoUrl !== undefined ? logoUrl : quotation.logoUrl;
  const activeTitle = headerTitle !== undefined 
    ? headerTitle 
    : isEn 
      ? (quotation.headerTitle === 'ใบเสนอราคา' ? 'QUOTATION' : quotation.headerTitle || 'QUOTATION')
      : (quotation.headerTitle === 'QUOTATION' ? 'ใบเสนอราคา' : quotation.headerTitle || 'ใบเสนอราคา');

  // Under 'ใบเสนอราคา', remove '(ต้นฉบับ)' / 'ต้นฉบับ' / '(ORIGINAL)' as requested
  const rawSubtitle = headerSubtitle !== undefined 
    ? headerSubtitle 
    : quotation.headerSubtitle;

  const isOriginalOrDefault = !rawSubtitle ||
    rawSubtitle === '(ต้นฉบับ)' ||
    rawSubtitle === 'ต้นฉบับ' ||
    rawSubtitle === '(ORIGINAL)' ||
    rawSubtitle === 'ORIGINAL';

  const activeSubtitle = isOriginalOrDefault ? '' : rawSubtitle;

  const companyName = quotation.companyInfo?.companyName ?? 'Knowledge Xchange';
  const companyTaxId = quotation.companyInfo?.taxId ?? '099-4-000-16009-7';
  const rawAddress = quotation.companyInfo?.address;
  const companyAddress = isEn
    ? (!rawAddress || rawAddress.includes('เคเอกซ์') || rawAddress.includes('กรุงธนบุรี')
        ? 'KX Building, 110/1 Krung Thonburi Rd.,\nBang Lamphu Lang, Khlong San, Bangkok 10600'
        : translateAddress(rawAddress))
    : (!rawAddress || rawAddress.includes('KX Building') || rawAddress.includes('Krung Thonburi')
        ? '110/1 อาคารเคเอกซ์ ถนนกรุงธนบุรี\nแขวงบางลำภูล่าง เขตคลองสาน กทม. 10600'
        : rawAddress);
  const companyWebsite = quotation.companyInfo?.website ?? 'www.kxinnovation.com';
  const companyPhone = quotation.companyInfo?.phone ?? '02-470-7906, 02-470-7907';

  const showHeaderLogo = settings.showLogo !== false;
  const showHeaderCompany = settings.showHeaderCompanyInfo !== false;
  const showHeaderSection = showHeaderLogo || showHeaderCompany;

  const headerFontFamilyStyle = (() => {
    switch (settings.headerFontFamily) {
      case 'Sarabun':
        return "'Sarabun', 'TH Sarabun New', sans-serif";
      case 'Prompt':
        return "'Prompt', sans-serif";
      case 'Kanit':
        return "'Kanit', sans-serif";
      case 'Mitr':
        return "'Mitr', sans-serif";
      case 'Chakra Petch':
        return "'Chakra Petch', sans-serif";
      case 'Bai Jamjuree':
        return "'Bai Jamjuree', sans-serif";
      case 'IBM Plex Sans Thai':
        return "'IBM Plex Sans Thai', sans-serif";
      case 'Noto Sans Thai':
        return "'Noto Sans Thai', sans-serif";
      case 'system-ui':
        return "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
      case 'Trirong':
      default:
        return "'Trirong', 'TH Sarabun New', 'Sarabun', 'Cordia New', serif";
    }
  })();

  const companyFontFamilyStyle = (() => {
    if (!settings.companyFontFamily) return headerFontFamilyStyle;
    switch (settings.companyFontFamily) {
      case 'Sarabun':
        return "'Sarabun', 'TH Sarabun New', sans-serif";
      case 'Prompt':
        return "'Prompt', sans-serif";
      case 'Kanit':
        return "'Kanit', sans-serif";
      case 'Mitr':
        return "'Mitr', sans-serif";
      case 'Chakra Petch':
        return "'Chakra Petch', sans-serif";
      case 'Bai Jamjuree':
        return "'Bai Jamjuree', sans-serif";
      case 'IBM Plex Sans Thai':
        return "'IBM Plex Sans Thai', sans-serif";
      case 'Noto Sans Thai':
        return "'Noto Sans Thai', sans-serif";
      case 'system-ui':
        return "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
      case 'Trirong':
      default:
        return "'Trirong', 'TH Sarabun New', 'Sarabun', 'Cordia New', serif";
    }
  })();

  const bankFontFamilyStyle = (() => {
    switch (settings.bankFontFamily) {
      case 'Trirong':
        return "'Trirong', 'TH Sarabun New', 'Cordia New', serif";
      case 'Prompt':
        return "'Prompt', sans-serif";
      case 'Kanit':
        return "'Kanit', sans-serif";
      case 'Mitr':
        return "'Mitr', sans-serif";
      case 'Chakra Petch':
        return "'Chakra Petch', sans-serif";
      case 'Bai Jamjuree':
        return "'Bai Jamjuree', sans-serif";
      case 'IBM Plex Sans Thai':
        return "'IBM Plex Sans Thai', sans-serif";
      case 'Noto Sans Thai':
        return "'Noto Sans Thai', sans-serif";
      case 'system-ui':
        return "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
      case 'Sarabun':
        return "'Sarabun', 'TH Sarabun New', sans-serif";
      default:
        return headerFontFamilyStyle;
    }
  })();

  const totalAmount = quotation.items.reduce((sum, item) => sum + item.amount, 0);
  const thaiBahtText = isEn ? arabicToEnglishBahtText(totalAmount) : arabicToThaiBahtText(totalAmount);

  // Dynamic Spacing classes
  const spacingClass = {
    compact: {
      header: 'pb-1.5 mb-1.5',
      quoteMeta: 'mb-1.5',
      customerBox: 'mb-1.5',
      itemsTable: 'mb-1.5',
      termsBox: 'mb-1.5',
      bankBox: 'mb-1.5',
      tableCellPy: 'py-1',
      signaturesPy: 'p-1.5 min-h-[75px]',
    },
    normal: {
      header: 'pb-2.5 mb-2 print:pb-1.5 print:mb-1.5',
      quoteMeta: 'mb-1.5 print:mb-1',
      customerBox: 'mb-2.5 print:mb-1.5',
      itemsTable: 'mb-2 print:mb-1',
      termsBox: 'mb-1.5 print:mb-1',
      bankBox: 'mb-2.5 print:mb-1.5',
      tableCellPy: 'py-1.5 print:py-1',
      signaturesPy: 'p-2 min-h-[90px] print:p-1.5 print:min-h-[75px]',
    },
    relaxed: {
      header: 'pb-4 mb-4',
      quoteMeta: 'mb-3',
      customerBox: 'mb-4',
      itemsTable: 'mb-3',
      termsBox: 'mb-3',
      bankBox: 'mb-4',
      tableCellPy: 'py-2',
      signaturesPy: 'p-2.5 min-h-[105px]',
    },
  }[settings.sectionSpacing || 'normal'];

  // Dynamic Font Size classes - 100% Harmonized to 11px uniform size in normal mode
  const fontClass = {
    compact: {
      page: 'text-[10px]',
      headerTitle: 'text-[14px]',
      headerSubtitle: 'text-[10px]',
      headerCenter: 'text-[10px]',
      headerRight: 'text-[10px]',
      meta: 'text-[10px]',
      customer: 'text-[10px]',
      table: 'text-[10px]',
      totalWord: 'text-[10px]',
      totalNum: 'text-[10px]',
      terms: 'text-[10px]',
      termsList: 'text-[10px]',
      bank: 'text-[10px]',
      signatures: 'text-[10px]',
    },
    normal: {
      page: 'text-[11px]',
      headerTitle: 'text-[16px]',
      headerSubtitle: 'text-[11px]',
      headerCenter: 'text-[11px]',
      headerRight: 'text-[11px]',
      meta: 'text-[11px]',
      customer: 'text-[11px]',
      table: 'text-[11px]',
      totalWord: 'text-[11px]',
      totalNum: 'text-[11px]',
      terms: 'text-[11px]',
      termsList: 'text-[11px]',
      bank: 'text-[11px]',
      signatures: 'text-[11px]',
    },
    large: {
      page: 'text-[12px]',
      headerTitle: 'text-[18px]',
      headerSubtitle: 'text-[12px]',
      headerCenter: 'text-[12px]',
      headerRight: 'text-[12px]',
      meta: 'text-[12px]',
      customer: 'text-[12px]',
      table: 'text-[12px]',
      totalWord: 'text-[12px]',
      totalNum: 'text-[12px]',
      terms: 'text-[12px]',
      termsList: 'text-[12px]',
      bank: 'text-[12px]',
      signatures: 'text-[12px]',
    },
  }[settings.fontSize || 'normal'];

  // Maintain exactly all requested empty reserve rows (default 10)
  const consolidatedItemsList = consolidateDocumentItems(quotation.items);
  const targetFillerRows = settings.minEmptyRows !== undefined ? Math.max(0, settings.minEmptyRows) : 10;

  return (
    <div
      id="printable-quotation"
      className={`quotation-page bg-white text-neutral-900 mx-auto ${fontClass.page} leading-snug select-text print:p-0 print:m-0`}
      style={{
        fontFamily: headerFontFamilyStyle,
        fontFeatureSettings: '"tnum" 1, "lnum" 1',
        fontVariantNumeric: 'tabular-nums lining-nums',
        WebkitFontSmoothing: 'antialiased',
        MozOsxFontSmoothing: 'grayscale',
        textRendering: 'geometricPrecision',
        width: '820px',
        minWidth: '820px',
        maxWidth: '820px',
        minHeight: '1060px',
        paddingTop: `${settings.paddingTop}px`,
        paddingBottom: `${settings.paddingBottom}px`,
        paddingLeft: `${settings.paddingLeft}px`,
        paddingRight: `${settings.paddingRight}px`,
        boxSizing: 'border-box',
      }}
    >
      {/* 1. Header Section (Toggleable & Freely Positionable) */}
      {showHeaderSection && (
        <div
          className={`flex ${
            settings.logoAlign === 'center'
              ? 'flex-col items-center text-center gap-2'
              : settings.logoAlign === 'right'
              ? 'flex-row-reverse justify-between items-start'
              : 'justify-between items-start'
          } border-b border-neutral-300 ${spacingClass.header} transition-transform duration-75`}
          style={{
            transform: `translate(${settings.headerOffsetX || 0}px, ${settings.headerOffsetY || 0}px)`,
            paddingTop: settings.headerPaddingTop !== undefined ? `${settings.headerPaddingTop}px` : undefined,
            paddingBottom: settings.headerPaddingBottom !== undefined ? `${settings.headerPaddingBottom}px` : undefined,
            marginBottom: settings.headerMarginBottom !== undefined ? `${settings.headerMarginBottom}px` : undefined,
          }}
        >
          {/* Logo & Custom Header Text */}
          {showHeaderLogo && (
            <div
              className={`${
                settings.logoAlign === 'center'
                  ? 'w-full flex flex-col items-center justify-center gap-1.5'
                  : showHeaderCompany
                  ? 'w-[36%] flex items-center gap-3'
                  : 'w-full flex items-center gap-3'
              }`}
            >
              {activeLogo ? (
                <img
                  src={activeLogo}
                  alt="Logo"
                  style={{
                    height: `${settings.logoHeight || 56}px`,
                    maxHeight: `${settings.logoHeight || 56}px`,
                    maxWidth: settings.logoMaxWidth ? `${settings.logoMaxWidth}px` : `${Math.round((settings.logoHeight || 56) * 3.5)}px`,
                  }}
                  className="object-contain shrink-0"
                />
              ) : (
                <div
                  className="shrink-0 flex items-center justify-center"
                  style={{
                    transform: `scale(${Math.min(2.0, Math.max(0.4, (settings.logoHeight || 56) / 56))})`,
                    transformOrigin: settings.logoAlign === 'center' ? 'center' : 'left center',
                  }}
                >
                  <KXLogo size="md" />
                </div>
              )}
              {(activeTitle || activeSubtitle) && (
                <div
                  className={`flex flex-col justify-center min-w-0 ${
                    settings.logoAlign === 'center' ? 'items-center text-center' : ''
                  }`}
                  style={{ fontFamily: headerFontFamilyStyle }}
                >
                  {activeTitle && (
                    <div
                      className={`font-normal text-neutral-900 leading-tight ${
                        settings.headerTitleFontSize ? '' : fontClass.headerTitle
                      }`}
                      style={{
                        fontSize: settings.headerTitleFontSize ? `${settings.headerTitleFontSize}px` : undefined,
                        fontFamily: headerFontFamilyStyle,
                      }}
                    >
                      {activeTitle}
                    </div>
                  )}
                  {activeSubtitle && (
                    <div
                      className={`text-neutral-500 font-normal tracking-wider uppercase ${
                        settings.headerSubtitleFontSize ? '' : fontClass.headerSubtitle
                      }`}
                      style={{
                        fontSize: settings.headerSubtitleFontSize ? `${settings.headerSubtitleFontSize}px` : undefined,
                        fontFamily: headerFontFamilyStyle,
                      }}
                    >
                      {activeSubtitle}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Company Information: Tax ID, Web, Address & Phone */}
          {showHeaderCompany && (
            <div
              className={`flex ${
                settings.logoAlign === 'center'
                  ? 'w-full flex-col sm:flex-row justify-center items-center gap-4 text-center'
                  : 'flex-1 flex justify-between items-start gap-3'
              }`}
              style={{
                fontFamily: companyFontFamilyStyle,
                lineHeight: settings.companyLineHeight ? settings.companyLineHeight : undefined,
                transform:
                  settings.companyOffsetX || settings.companyOffsetY
                    ? `translate(${settings.companyOffsetX || 0}px, ${settings.companyOffsetY || 0}px)`
                    : undefined,
                paddingTop: settings.companyPaddingTop !== undefined ? `${settings.companyPaddingTop}px` : undefined,
                paddingBottom: settings.companyPaddingBottom !== undefined ? `${settings.companyPaddingBottom}px` : undefined,
              }}
            >
              {/* Center / Left block: Company Name, Tax ID & Web */}
              <div
                className={`${
                  settings.companyAlign === 'left'
                    ? 'text-left'
                    : settings.companyAlign === 'center'
                    ? 'text-center'
                    : settings.companyAlign === 'right'
                    ? 'text-right'
                    : settings.logoAlign === 'center'
                    ? 'w-full text-center'
                    : showHeaderLogo
                    ? 'w-[40%] text-center shrink-0'
                    : 'w-[40%] text-left shrink-0'
                } ${settings.headerCompanyFontSize ? '' : fontClass.headerCenter} text-neutral-800 pt-1`}
                style={{
                  fontSize: settings.headerCompanyFontSize ? `${settings.headerCompanyFontSize}px` : undefined,
                }}
              >
                {companyName && <div className="font-normal text-neutral-900">{companyName}</div>}
                {companyTaxId && (
                  <>
                    <div>{isEn ? 'Tax ID' : 'เลขประจำตัวผู้เสียภาษี'}</div>
                    <div className="font-medium tracking-wide">{companyTaxId}</div>
                  </>
                )}
                {companyWebsite && <div className="text-neutral-600">{companyWebsite}</div>}
              </div>

              {/* Right block: Address & Phone */}
              <div
                className={`${
                  settings.companyAlign === 'left'
                    ? 'text-left'
                    : settings.companyAlign === 'center'
                    ? 'text-center'
                    : settings.companyAlign === 'right'
                    ? 'text-right'
                    : settings.logoAlign === 'center'
                    ? 'w-full text-center'
                    : settings.logoAlign === 'right'
                    ? 'flex-1 min-w-[270px] text-left'
                    : 'flex-1 min-w-[270px] text-right'
                } ${settings.headerCompanyFontSize ? '' : fontClass.headerRight} text-neutral-700 pt-1`}
                style={{
                  fontSize: settings.headerCompanyFontSize ? `${settings.headerCompanyFontSize}px` : undefined,
                }}
              >
                {companyAddress && (
                  <div
                    className={`flex items-start ${
                      settings.companyAlign === 'left'
                        ? 'justify-start'
                        : settings.companyAlign === 'center'
                        ? 'justify-center'
                        : settings.companyAlign === 'right'
                        ? 'justify-end'
                        : settings.logoAlign === 'center'
                        ? 'justify-center'
                        : settings.logoAlign === 'right'
                        ? 'justify-start'
                        : 'justify-end'
                    } gap-1 mb-1`}
                  >
                    <MapPin className="w-3 h-3 mt-0.5 shrink-0 text-neutral-500" />
                    <div className="flex flex-col">
                      {companyAddress.split('\n').map((line, idx) => (
                        <div key={idx} className="whitespace-nowrap leading-tight">{line}</div>
                      ))}
                    </div>
                  </div>
                )}
                {companyPhone && (
                  <div
                    className={`flex items-center ${
                      settings.companyAlign === 'left'
                        ? 'justify-start'
                        : settings.companyAlign === 'center'
                        ? 'justify-center'
                        : settings.companyAlign === 'right'
                        ? 'justify-end'
                        : settings.logoAlign === 'center'
                        ? 'justify-center'
                        : settings.logoAlign === 'right'
                        ? 'justify-start'
                        : 'justify-end'
                    } gap-1 text-neutral-800 font-medium`}
                  >
                    <Phone className="w-3 h-3 shrink-0 text-neutral-500" />
                    <span>{companyPhone}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 2. Quotation Number & Date */}
      <div className={`${spacingClass.quoteMeta} ${fontClass.meta} flex flex-col items-start gap-1`}>
        <div className="flex items-center gap-2">
          <span className="font-normal text-neutral-900">{isEn ? 'Quotation No. :' : 'เลขที่ใบเสนอราคา :'}</span>
          <span className="tabular-nums font-normal tracking-wide text-neutral-900">{quotation.quoteNumber}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-normal text-neutral-900">{isEn ? 'Issue Date :' : 'วันที่ออกเอกสาร :'}</span>
          <span>{isEn ? formatEnglishDate(quotation.issueDate, 'full') : formatThaiDate(quotation.issueDate, 'full')}</span>
        </div>
      </div>

      {/* 3. Customer Information Box */}
      {settings.showCustomerInfo !== false && (
        <div className={`border border-neutral-800 rounded-xs ${spacingClass.customerBox} ${fontClass.customer} overflow-hidden`}>
        <div className="grid grid-cols-12 divide-x divide-neutral-800">
          {/* Left Column (Customer Profile) */}
          <div className="col-span-7 p-2 print:py-1 space-y-1 print:space-y-0.5">
            <div className="flex items-start">
              <span className="font-normal text-neutral-900 mr-1 shrink-0">{isEn ? 'Customer :' : 'ลูกค้า :'}</span>
              <span className="font-normal text-neutral-900">
                {quotation.customer.name}
              </span>
            </div>
            <div className="flex items-start">
              <span className="font-normal text-neutral-900 mr-1 shrink-0">{isEn ? 'Tax ID :' : 'เลขประจำตัวผู้เสียภาษี :'}</span>
              <span className="tabular-nums tracking-wide">{cleanDisplay(quotation.customer.taxId)}</span>
            </div>
            <div className="flex items-start">
              <span className="font-normal text-neutral-900 mr-1 shrink-0">{isEn ? 'Address :' : 'ที่อยู่ :'}</span>
              <span className="text-neutral-800 leading-tight">
                {quotation.customer.address}
              </span>
            </div>
          </div>

          {/* Right Column (Customer Contact Details) */}
          <div className="col-span-5 p-2 print:py-1 space-y-1 print:space-y-0.5">
            <div className="flex items-start">
              <span className="font-normal text-neutral-900 w-20 shrink-0">{isEn ? 'Customer Code :' : 'รหัสลูกค้า :'}</span>
              <span className="tabular-nums font-normal tracking-wide">{cleanDisplay(quotation.customer.customerCode)}</span>
            </div>
            <div className="flex items-start">
              <span className="font-normal text-neutral-900 w-20 shrink-0">{isEn ? 'Contact Person :' : 'ผู้ติดต่อ :'}</span>
              <span className="font-normal">
                {cleanDisplay(quotation.customer.contactPerson)}
              </span>
            </div>
            <div className="flex items-start">
              <span className="font-normal text-neutral-900 w-20 shrink-0">{isEn ? 'Mobile :' : 'เบอร์มือถือ :'}</span>
              <span className="tabular-nums">{cleanDisplay(quotation.customer.mobile)}</span>
            </div>
            {cleanDisplay(quotation.customer.email) && (
              <div className="flex items-start">
                <span className="font-normal text-neutral-900 w-20 shrink-0">{isEn ? 'Email :' : 'อีเมล :'}</span>
                <span>{cleanDisplay(quotation.customer.email)}</span>
              </div>
            )}
          </div>
        </div>
      </div>
      )}

      {/* 4. Table of Items */}
      <div className={`border border-neutral-800 rounded-xs ${spacingClass.itemsTable} overflow-hidden`}>
        <table className={`w-full ${fontClass.table} border-collapse`}>
          <thead>
            <tr className="border-b border-neutral-800 bg-neutral-50/50 text-neutral-900 font-normal text-center divide-x divide-neutral-800">
              <th className="py-1 px-1.5 w-10">{isEn ? 'No.' : 'ลำดับ'}</th>
              <th className="py-1 px-2 text-center w-[360px]">{isEn ? 'Description' : 'รายการ'}</th>
              <th className="py-1 px-1.5 w-20">
                {isEn ? 'Qty / Unit' : <>จำนวน<br />/หน่วย</>}
              </th>
              <th className="py-1 px-2 w-15">{isEn ? 'Unit Price' : 'ราคา/หน่วย'}</th>
              <th className="py-1 px-1.5 w-14">{isEn ? 'Discount' : 'ส่วนลด'}</th>
              <th className="py-1 px-2 w-25">{isEn ? 'Net Amount' : 'จำนวนเงินสุทธิ'}</th>
            </tr>
          </thead>
          <tbody className={settings.showRowDividerLines ? "divide-y divide-neutral-200" : ""}>
            {/* Job Title Row (Fallback when global jobTitle is specified and no items have room-specific jobTitle) */}
            {quotation.jobTitle && !consolidateDocumentItems(quotation.items).some((it) => it.jobTitle) && (
              <tr className="divide-x divide-neutral-800">
                <td className="py-1 px-1.5 text-center align-top font-normal text-neutral-400 w-10"></td>
                <td colSpan={5} className="py-1.5 px-2.5 bg-neutral-100/30">
                  <div className="flex items-center gap-2">
                    <span className="font-normal text-neutral-900">
                      {isEn ? 'Job Title :' : 'ชื่องาน :'} {isEn ? translatePhrase(quotation.jobTitle) : quotation.jobTitle}
                    </span>
                  </div>
                </td>
              </tr>
            )}

            {/* Line Items */}
            {consolidateDocumentItems(quotation.items).map((item, index) => {
              const cleanDescription = item.description || '';
              const rawDate = item.usageDate || item.eventDate || '';
              const displayDate = isEn 
                ? (/[ก-๙]/.test(rawDate) ? translateThaiDateToEnglish(rawDate) : (formatEnglishDateSmart(rawDate) || rawDate)) 
                : (formatThaiDateSmart(rawDate) || rawDate);
              const hasDate = Boolean(displayDate);
              const isFoodOrServiceItem =
                cleanDescription.includes('อาหาร') ||
                cleanDescription.includes('เบรค') ||
                cleanDescription.includes('Snack Box') ||
                cleanDescription.includes('บุฟเฟ่ต์') ||
                cleanDescription.includes('ค็อกเทล') ||
                cleanDescription.includes('Coffee Break') ||
                cleanDescription.includes('นำเข้าอาหาร');
              const hasTime = Boolean((item.usageTime || item.eventTime) && !isFoodOrServiceItem);

              return (
                <tr key={item.id || index} className="divide-x divide-neutral-800 min-h-[28px]">
                  <td className={`${spacingClass.tableCellPy} px-1.5 text-center align-top font-normal w-10`}>{index + 1}</td>
                  <td className={`${spacingClass.tableCellPy} px-2.5 align-top w-[360px]`}>
                    {item.jobTitle && (
                      <div className="text-[11.5px] font-normal text-neutral-900 mb-0.5 flex items-baseline gap-1.5 leading-snug">
                        <span className="font-normal text-neutral-800">{isEn ? 'Job Title :' : 'ชื่องาน :'}</span>
                        <span className="text-neutral-950 font-normal">{isEn ? translatePhrase(item.jobTitle) : restorePhraseToThai(item.jobTitle)}</span>
                      </div>
                    )}
                    <div className="font-normal text-neutral-900 whitespace-pre-line">
                      {isEn ? translatePhrase(cleanDescription) : restorePhraseToThai(cleanDescription)}
                    </div>
                    {(hasDate || hasTime) && (
                      <div className="text-[11px] text-neutral-800 mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 leading-tight">
                        {hasDate && (
                          <span>
                            <span className="font-normal text-neutral-800">{isEn ? 'Event Date : ' : 'วันที่ใช้งาน : '}</span>
                            <span className="text-neutral-900 font-normal">
                              {displayDate}
                            </span>
                          </span>
                        )}
                        {hasTime && (
                          <span>
                            {hasDate && <span className="text-neutral-400 mx-1.5 font-normal">|</span>}
                            <span className="font-normal text-neutral-800">{isEn ? 'Time : ' : 'เวลา : '}</span>
                            <span className="text-neutral-900 font-normal">
                              {item.usageTime || item.eventTime}
                            </span>
                          </span>
                        )}
                      </div>
                    )}
                  </td>
                  <td className={`${spacingClass.tableCellPy} px-1.5 text-center align-top w-20`}>
                    {item.unit && item.unit.trim() ? `${item.quantity} / ${isEn ? translateUnit(item.unit.trim()) : restoreUnitToThai(item.unit.trim())}` : item.quantity}
                  </td>
                  <td className={`${spacingClass.tableCellPy} px-2 text-right align-top tabular-nums w-22`}>
                    {formatCurrency(item.unitPrice)}
                  </td>
                  <td className={`${spacingClass.tableCellPy} px-1 text-center align-top tabular-nums w-14`}>
                    {isNoDiscountItem(cleanDescription) || item.discountPercent <= 0 ? '-' : `${item.discountPercent}%`}
                  </td>
                  <td className={`${spacingClass.tableCellPy} px-2 text-right align-top tabular-nums font-medium w-20`}>
                    {formatCurrency(item.amount)}
                  </td>
                </tr>
              );
            })}

            {/* Empty Spacer Rows to guarantee minimum 10 empty rows and consistent document layout */}
            {Array.from({ length: targetFillerRows }).map((_, idx) => (
              <tr key={`filler-${idx}`} className="divide-x divide-neutral-800 h-[19px] min-h-[19px] print:h-[13.5px] print:min-h-[13.5px]">
                <td className="py-0.5 print:py-0 px-1.5 text-center leading-none select-none w-10">&nbsp;</td>
                <td className="py-0.5 print:py-0 px-2.5 leading-none w-[360px]">&nbsp;</td>
                <td className="py-0.5 print:py-0 px-1.5 leading-none w-20">&nbsp;</td>
                <td className="py-0.5 print:py-0 px-2 leading-none w-22">&nbsp;</td>
                <td className="py-0.5 print:py-0 px-1 leading-none w-14">&nbsp;</td>
                <td className="py-0.5 print:py-0 px-2 leading-none w-20">&nbsp;</td>
              </tr>
            ))}

            {/* Deadlines and Conditions row */}
            <tr className="border-t border-neutral-800 divide-x divide-neutral-800">
              <td colSpan={4} className={`p-2 leading-relaxed ${fontClass.table} text-neutral-800`}>
                <div>
                  <span className="font-normal text-neutral-900">{isEn ? 'Payment Due :' : 'กำหนดชำระเงิน :'}</span>{' '}
                  {isEn ? `by ${formatEnglishDate(quotation.paymentDueDate, 'full')}` : `ภายในวันที่ ${formatThaiDate(quotation.paymentDueDate, 'full')}`}
                </div>
                <div>
                  <span className="font-normal text-neutral-900">{isEn ? 'Cancellation Notice Deadline :' : 'หากต้องการยกเลิกการใช้งานกรุณาแจ้ง :'}</span>{' '}
                  {isEn ? `by ${formatEnglishDate(quotation.cancellationNoticeDate, 'full')}` : `ภายในวันที่ ${formatThaiDate(quotation.cancellationNoticeDate, 'full')}`}
                </div>
                {settings.showOvertimeNote && quotation.overtimeNote && (
                  <div className="text-neutral-700">
                    <span className="font-normal text-neutral-900">{isEn ? 'Note :' : 'หมายเหตุ :'}</span>{' '}
                    {isEn ? translatePhrase(quotation.overtimeNote) : quotation.overtimeNote}
                  </div>
                )}
                {settings.showOvertimeNote && quotation.specialRemarks && (
                  <div className="text-neutral-700">
                    <span className="font-normal text-neutral-900">{isEn ? 'Additional Remarks :' : 'หมายเหตุเพิ่มเติม :'}</span>{' '}
                    {isEn ? translatePhrase(quotation.specialRemarks) : quotation.specialRemarks}
                  </div>
                )}
              </td>
              <td colSpan={2} className="p-2 text-right align-bottom bg-neutral-50/30">
                <div className="text-[10px] text-neutral-500 mb-0.5">{isEn ? 'Grand Total' : 'รวมเงินทั้งสิ้น / Total'}</div>
              </td>
            </tr>

            {/* Total Amount Row with Thai Baht Words */}
            <tr className="border-t-2 border-neutral-800 divide-x divide-neutral-800 font-normal bg-neutral-100/40">
              <td colSpan={4} className={`py-1.5 px-3 text-center ${fontClass.totalWord} text-neutral-900`}>
                {thaiBahtText}
              </td>
              <td colSpan={2} className={`py-1.5 px-2 text-right ${fontClass.totalNum} tabular-nums font-normal text-neutral-900`}>
                {formatCurrency(totalAmount)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* 5. Notes & Terms of Payment (Toggleable) */}
      {settings.showPaymentTerms && (() => {
        const customFontSize = settings.paymentTermsFontSize;
        const alignClass = settings.paymentTermsAlign === 'center'
          ? 'text-center'
          : settings.paymentTermsAlign === 'right'
          ? 'text-right'
          : 'text-left';
        const lineHeightVal = settings.paymentTermsLineHeight === 'tight'
          ? 'leading-tight'
          : settings.paymentTermsLineHeight === 'relaxed'
          ? 'leading-relaxed'
          : 'leading-snug';

        const styleObj: React.CSSProperties = {
          fontSize: customFontSize ? `${customFontSize}px` : undefined,
          textAlign: settings.paymentTermsAlign || 'left',
          lineHeight: settings.paymentTermsLineHeight === 'tight' ? 1.25 : settings.paymentTermsLineHeight === 'relaxed' ? 1.7 : 1.45,
        };

        const paymentIsEn = quotation.paymentLanguage === 'en' || (quotation.paymentLanguage !== 'th' && isEn);

        // When payment is English, ensure the terms are strictly in English (no Thai characters).
        // If custom English terms are not provided or contain Thai, fall back to undefined so standard English terms are rendered!
        const activeCustomTerms = paymentIsEn
          ? ((quotation.customPaymentTermsTextEn && !/[ก-๙]/.test(quotation.customPaymentTermsTextEn))
              ? quotation.customPaymentTermsTextEn
              : (quotation.translations?.en?.customPaymentTermsText && !/[ก-๙]/.test(quotation.translations.en.customPaymentTermsText))
              ? quotation.translations.en.customPaymentTermsText
              : (quotation.language === 'en' && quotation.customPaymentTermsText && !/[ก-๙]/.test(quotation.customPaymentTermsText))
              ? quotation.customPaymentTermsText
              : undefined)
          : quotation.customPaymentTermsText;

        return (
          <div
            className={`${fontClass.terms} ${lineHeightVal} ${alignClass} space-y-0.5 ${spacingClass.termsBox} text-neutral-800`}
            style={styleObj}
          >
            <div className="font-medium text-neutral-900">
              <span className="font-normal">{paymentIsEn ? 'Remarks :' : 'หมายเหตุ :'}</span> {paymentIsEn ? 'Please sign and confirm room reservation within 7 days. Beyond this period, we reserve the right to cancel the booking for other clients.' : 'กรุณาเซ็นคอนเฟิร์มการจองห้อง ภายใน 7 วัน หากเกินระยะเวลาที่กำหนด ทางเราขออนุญาตยกเลิกการจองเพื่อสงวนสิทธิ์แก่ลูกค้าท่านอื่น'}
            </div>

            <div className="pt-0.5">
              <div className="font-normal text-neutral-900">{paymentIsEn ? 'Terms of Payment :' : 'เงื่อนไขการชำระเงิน :'}</div>
              {activeCustomTerms ? (
                <div className="space-y-0.5 pl-0.5 text-neutral-700">
                  {activeCustomTerms.split('\n').map((line, idx) => {
                    const trimmed = line.trim();
                    if (!trimmed) return <div key={idx} className="h-1" />;
                    return (
                      <div key={idx} className={`flex items-start gap-1.5 ${settings.paymentTermsAlign === 'center' ? 'justify-center' : settings.paymentTermsAlign === 'right' ? 'justify-end' : 'justify-start'}`}>
                        {!trimmed.startsWith('•') && !trimmed.startsWith('-') && !trimmed.startsWith('*') && (
                          <span className="shrink-0">•</span>
                        )}
                        <span>{trimmed}</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <ul className={`list-disc list-inside space-y-0.5 pl-1 ${fontClass.termsList} text-neutral-700`}>
                  {quotation.paymentTermType === 'GOVERNMENT_30_DAYS' ? (
                    <li>
                      {paymentIsEn
                        ? `Credit billing terms: payment within 30 days ${quotation.paymentDueDate ? `(Due date: ${formatEnglishDate(quotation.paymentDueDate, 'full')})` : ''}`
                        : `เครดิตวางบิลชำระเงินภายใน 30 วัน ${quotation.paymentDueDate ? `(ครบกำหนดชำระเงินวันที่ ${formatThaiDate(quotation.paymentDueDate, 'full')})` : ''}`}
                    </li>
                  ) : (
                    <li>
                      {paymentIsEn
                        ? `Please pay 100% at least 7 days prior to event date ${quotation.paymentDueDate ? `(Due date: ${formatEnglishDate(quotation.paymentDueDate, 'full')})` : ''}`
                        : `กรุณาชำระเงิน 100% ก่อนเริ่มงานอย่างน้อย 7 วัน ${quotation.paymentDueDate ? `(กำหนดชำระภายในวันที่ ${formatThaiDate(quotation.paymentDueDate, 'full')})` : ''}`}
                    </li>
                  )}
                  <li>
                    {paymentIsEn
                      ? 'KX is a government agency; exempt from VAT and Withholding Tax. Clients may request official documentation from sales officers.'
                      : 'KX เป็นหน่วยงานราชการ ไม่มี Vat ไม่มีหัก ณ ที่จ่าย ลูกค้าสามารถขอเอกสารเพิ่มเติมกับเจ้าหน้าที่ฝ่ายขาย'}
                  </li>
                  <li>
                    {paymentIsEn
                      ? `In case of modification/cancellation or exemption, please notify at least 14 days in advance ${quotation.cancellationNoticeDate ? `(by ${formatEnglishDate(quotation.cancellationNoticeDate, 'full')})` : ''}. Failure to comply reserves KX's rights on subsequent bookings.`
                      : `ในกรณีของการเปลี่ยนแปลง/ยกเลิกหรือขอยกเว้น กรุณาแจ้งให้เราทราบล่วงหน้าอย่างน้อย 14 วัน ${quotation.cancellationNoticeDate ? `(ภายในวันที่ ${formatThaiDate(quotation.cancellationNoticeDate, 'full')})` : ''} หากไม่ปฏิบัติตามเงื่อนไข ทางอาคารเคเอกซ์ขอสงวนสิทธิ์ในการจองครั้งถัดไป`}
                  </li>
                  <li>
                    {paymentIsEn
                      ? 'Failure to notify in advance will result in a strictly non-refundable policy under all circumstances.'
                      : 'หากไม่แจ้งให้ทราบทางอาคาร KX ขอสงวนสิทธิ์ที่จะไม่คืนเงินในกรณีใด ๆ ทั้งสิ้น'}
                  </li>
                  <li>
                    {paymentIsEn
                      ? 'For further information, please contact 02-4707907 (Khun Mod, Accounting) or 02-4707906 (Book, Nook, Tik - Sales).'
                      : 'สำหรับข้อมูลเพิ่มเติมกรุณาติดต่อ 02-4707907 (คุณมด บัญชี) 02-4707906 (บุ๊ค, นุ้ค, ติ๊ก )'}
                  </li>
                </ul>
              )}
            </div>
          </div>
        );
      })()}

      {/* 6. Payment Method & QR Code (Auto-fit to box height without overflow) */}
      {settings.showBankInfo && (() => {
        const boxHeight = settings.paymentBoxHeight ?? 75.6; // 2 cm ≈ 75.6px
        const paymentIsEn = quotation.paymentLanguage === 'en' || (quotation.paymentLanguage !== 'th' && isEn);

        // Available vertical space inside payment box:
        const qrCanvasSize = settings.autoFitQr !== false
          ? Math.max(32, Math.round(boxHeight - 6))
          : (settings.qrSize ? Math.max(30, settings.qrSize) : Math.max(32, Math.round(boxHeight - 6)));
        const qrCardSize = qrCanvasSize + 6;

        // Base uniform font size
        const bankBaseSize = settings.bankFontSize ?? 11;

        // Specific sizes for each block (default to bankBaseSize so everything is 100% uniform!)
        const titleFontSize = settings.bankTitleFontSize ?? bankBaseSize;
        const labelFontSize = settings.bankLabelFontSize ?? bankBaseSize;
        const detailsFontSize = settings.bankDetailsFontSize ?? bankBaseSize;
        const accountNumberFontSize = settings.bankAccountNumberFontSize ?? bankBaseSize;

        // Bold / Normal weights for each block
        const isTitleBold = settings.bankTitleBold !== false;
        const isLabelBold = settings.bankLabelBold !== false;
        const isDetailsBold = settings.bankDetailsBold === true;
        const isAccountNumberBold = settings.bankAccountNumberBold !== false;

        const displayBankName = paymentIsEn
          ? (quotation.bankInfoEn?.bankName || (quotation.bankInfo.bankName.includes('กรุงไทย') ? 'Krungthai Bank Public Co., Ltd.' : quotation.bankInfo.bankName))
          : quotation.bankInfo.bankName;

        const displayBranch = paymentIsEn
          ? (quotation.bankInfoEn?.branch || (quotation.bankInfo.branch.includes('พระจอมเกล้า') ? 'KMUTT Branch' : quotation.bankInfo.branch.includes('ศรีอยุธยา') ? 'Sri Ayutthaya Road Branch' : translatePhrase(quotation.bankInfo.branch)))
          : quotation.bankInfo.branch;

        const displayAccountName = paymentIsEn
          ? (quotation.bankInfoEn?.accountName || (quotation.bankInfo.accountName.includes('พระจอมเกล้า') || quotation.bankInfo.accountName.includes('เคเอกซ์') ? "King Mongkut's University of Technology Thonburi (KX Building)" : translateCompanyName(quotation.bankInfo.accountName)))
          : quotation.bankInfo.accountName;

        return (
          <div
            className={`rounded-xs px-3 py-1 print:py-0.5 flex items-center justify-between ${spacingClass.bankBox}`}
            style={{
              height: `${boxHeight}px`,
              minHeight: `${boxHeight}px`,
              maxHeight: `${boxHeight}px`,
              boxSizing: 'border-box',
              fontFamily: bankFontFamilyStyle,
            }}
          >
            {/* Left: Bank Transfer Details */}
            <div
              className="space-y-0.5 flex flex-col justify-center min-w-0"
              style={{ fontSize: `${bankBaseSize}px` }}
            >
              <div
                className={`text-neutral-900 leading-tight ${isTitleBold ? 'font-normal' : 'font-normal'}`}
                style={{ fontSize: `${titleFontSize}px` }}
              >
                {paymentIsEn ? 'Payment Method' : 'การชำระเงิน'}
              </div>
              <div className="flex items-center gap-2 leading-tight">
                <span
                  className={`shrink-0 ${isLabelBold ? 'font-normal' : 'font-normal'}`}
                  style={{ fontSize: `${labelFontSize}px` }}
                >
                  {paymentIsEn ? 'Bank Transfer :' : 'โดยการโอนเงิน :'}
                </span>
                <span
                  className={`truncate ${isDetailsBold ? 'font-normal' : 'font-normal'}`}
                  style={{ fontSize: `${detailsFontSize}px` }}
                >
                  {displayBankName} {displayBranch}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-0.5 leading-tight">
                <div className="truncate">
                  <span
                    className={isLabelBold ? 'font-normal' : 'font-normal'}
                    style={{ fontSize: `${labelFontSize}px` }}
                  >
                    {paymentIsEn ? 'Account Name :' : 'ชื่อบัญชี :'}
                  </span>{' '}
                  <span
                    className={isDetailsBold ? 'font-normal' : 'font-normal'}
                    style={{ fontSize: `${detailsFontSize}px` }}
                  >
                    {displayAccountName}
                  </span>
                </div>
                <div>
                  <span
                    className={isLabelBold ? 'font-normal' : 'font-normal'}
                    style={{ fontSize: `${labelFontSize}px` }}
                  >
                    {paymentIsEn ? 'Account No. :' : 'เลขที่บัญชี :'}
                  </span>{' '}
                  <span
                    className={`tabular-nums tracking-wider text-neutral-900 ${isAccountNumberBold ? 'font-normal' : 'font-normal'}`}
                    style={{ fontSize: `${accountNumberFontSize}px` }}
                  >
                    {quotation.bankInfo.accountNumber}
                  </span>
                </div>
              </div>
            </div>

            {/* Right: QR Code for Payment (Auto-fit to box height & non-overflowing - no divider line in front) */}
            <div className="flex items-center gap-2 pl-3 shrink-0 h-full overflow-hidden">
              <div
                className="text-right leading-tight text-neutral-600"
                style={{ fontSize: `${Math.max(8, bankBaseSize - 1.5)}px` }}
              >
                <span className="font-normal text-neutral-900 block">{paymentIsEn ? 'Pay via' : 'ชำระผ่าน'}</span>
                <span>QR code</span>
              </div>
              {quotation.bankInfo?.qrImageUrl ? (
                <div
                  className="inline-flex items-center justify-center p-0.5 bg-white rounded-xs shrink-0 max-h-full"
                  style={{ width: `${qrCardSize}px`, height: `${qrCardSize}px`, boxSizing: 'border-box' }}
                >
                  <img
                    src={quotation.bankInfo.qrImageUrl}
                    alt={isEn ? "Payment QR Code" : "QR Code สำหรับชำระเงิน"}
                    style={{ width: `${qrCanvasSize}px`, height: `${qrCanvasSize}px`, objectFit: 'contain' }}
                    className="block"
                  />
                </div>
              ) : (
                <div className="flex items-center justify-center max-h-full shrink-0">
                  <QRCodeCanvas
                    value={
                      quotation.bankInfo?.qrType === 'custom_payload' && quotation.bankInfo?.qrCustomPayload
                        ? quotation.bankInfo.qrCustomPayload
                        : generatePromptPayPayload(
                            quotation.bankInfo?.qrPromptPayCode || '0994000160097',
                            totalAmount
                          )
                    }
                    size={qrCanvasSize}
                  />
                </div>
              )}
            </div>
          </div>
        );
      })()}



      {/* 7. Signature Columns Section (Toggleable & Fully Customizable) */}
      {settings.showSignatures && showSignatures && (() => {
        const sigHeight = settings.signatureHeight || 32;
        const baseSigners = [
          {
            id: 'receivedBy',
            title: isEn
              ? (quotation.signatures.receivedBy.title?.includes('ผู้รับบริการ') || !quotation.signatures.receivedBy.title ? 'Customer / Client' : quotation.signatures.receivedBy.title)
              : (quotation.signatures.receivedBy.title === 'Customer / Client' || !quotation.signatures.receivedBy.title ? 'ผู้รับบริการ/Received By' : quotation.signatures.receivedBy.title),
            name: quotation.signatures.receivedBy.name,
            signatureUrl: quotation.signatures.receivedBy.signatureUrl,
            date: quotation.signatures.receivedBy.date,
            mode: quotation.signatures.receivedBy.mode || (quotation.signatures.receivedBy.signatureUrl ? 'image' : quotation.signatures.receivedBy.name ? 'text' : 'handwrite'),
            enabled: quotation.signatures.receivedBy.enabled !== false,
          },
          {
            id: 'preparedBy',
            title: isEn
              ? (quotation.signatures.preparedBy.title?.includes('ผู้จัดทำ') || !quotation.signatures.preparedBy.title ? 'Prepared by' : quotation.signatures.preparedBy.title)
              : (quotation.signatures.preparedBy.title === 'Prepared by' || !quotation.signatures.preparedBy.title ? 'ผู้จัดทำ/Prepared By' : quotation.signatures.preparedBy.title),
            name: quotation.signatures.preparedBy.name,
            signatureUrl: quotation.signatures.preparedBy.signatureUrl,
            date: quotation.signatures.preparedBy.date,
            mode: quotation.signatures.preparedBy.mode || (quotation.signatures.preparedBy.signatureUrl ? 'image' : 'text'),
            enabled: quotation.signatures.preparedBy.enabled !== false,
          },
          {
            id: 'approvedBy',
            title: isEn
              ? (quotation.signatures.approvedBy.title?.includes('ผู้ตรวจสอบ') || !quotation.signatures.approvedBy.title ? 'Approved by' : quotation.signatures.approvedBy.title)
              : (quotation.signatures.approvedBy.title === 'Approved by' || !quotation.signatures.approvedBy.title ? 'ผู้ตรวจสอบ/Approved By' : quotation.signatures.approvedBy.title),
            name: quotation.signatures.approvedBy.name,
            signatureUrl: quotation.signatures.approvedBy.signatureUrl,
            date: quotation.signatures.approvedBy.date,
            mode: quotation.signatures.approvedBy.mode || (quotation.signatures.approvedBy.signatureUrl ? 'image' : 'text'),
            enabled: quotation.signatures.approvedBy.enabled !== false,
          },
          {
            id: 'authorizedSignature',
            title: isEn
              ? (quotation.signatures.authorizedSignature.title?.includes('ผู้มีอำนาจ') || !quotation.signatures.authorizedSignature.title ? 'Authorized Signature' : quotation.signatures.authorizedSignature.title)
              : (quotation.signatures.authorizedSignature.title === 'Authorized Signature' || !quotation.signatures.authorizedSignature.title ? 'ผู้มีอำนาจลงนาม/Authorized Signature' : quotation.signatures.authorizedSignature.title),
            name: quotation.signatures.authorizedSignature.name,
            signatureUrl: quotation.signatures.authorizedSignature.signatureUrl,
            date: quotation.signatures.authorizedSignature.date,
            mode: quotation.signatures.authorizedSignature.mode || (quotation.signatures.authorizedSignature.signatureUrl ? 'image' : 'text'),
            enabled: quotation.signatures.authorizedSignature.enabled !== false,
          },
        ];

        const activeBase = baseSigners.filter((s) => s.enabled);
        const additional = (quotation.signatures.additionalSignatures || []).filter((s) => s.enabled !== false);
        const allSigners = [...activeBase, ...additional];
        const totalCount = allSigners.length;

        if (totalCount === 0) return null;

        // Custom or calculated grid columns
        const explicitCols = settings.signatureGridCols;
        const cols = explicitCols && explicitCols !== 'auto' 
          ? explicitCols 
          : totalCount === 1 ? 1
          : totalCount === 2 ? 2
          : totalCount === 3 ? 3
          : totalCount === 4 ? 4
          : totalCount <= 6 ? 3
          : 4;

        // Break allSigners into rows matching cols
        const rows: typeof allSigners[] = [];
        for (let i = 0; i < allSigners.length; i += cols) {
          rows.push(allSigners.slice(i, i + cols));
        }

        return (
          <div className="w-full overflow-hidden print:break-inside-avoid print:page-break-inside-avoid rounded-xs">
            <table className={`w-full border-collapse border border-neutral-800 text-center ${fontClass.signatures}`}>
              <tbody>
                {rows.map((row, rIdx) => (
                  <tr key={rIdx}>
                    {row.map((sig, sIdx) => {
                      const isHandwrite = sig.mode === 'handwrite' || (!sig.signatureUrl && !sig.name);
                      return (
                        <td
                          key={sig.id || sIdx}
                          className={`border border-neutral-800 align-top ${spacingClass.signaturesPy} px-1.5`}
                          style={{ width: `${100 / cols}%` }}
                        >
                          <div className="flex flex-col justify-between h-full min-h-[75px]" style={{ borderColor: '#ffffff' }}>
                            <div className="font-normal text-neutral-900 leading-tight whitespace-pre-line mb-1">
                              {sig.title}
                            </div>
                            <div className="py-1 min-h-[38px] flex flex-col items-center justify-end my-auto">
                              {sig.signatureUrl && sig.mode !== 'handwrite' ? (
                                <ProcessedSignatureImg
                                  src={sig.signatureUrl}
                                  alt={sig.title}
                                  height={sigHeight}
                                  className="max-w-[115px] object-contain mb-0.5"
                                />
                              ) : isHandwrite ? (
                                <div className="w-full flex flex-col items-center justify-end">
                                  <div className="w-28 sm:w-34 border-b border-neutral-400 border-dotted mb-1"></div>
                                  <span className="font-medium text-neutral-800 text-[11px]">
                                    ( {sig.name ? sig.name : '................................................'} )
                                  </span>
                                </div>
                              ) : (
                                <span className="font-medium text-neutral-900 leading-tight">
                                  ( {sig.name || '................................................'} )
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-neutral-600 mt-1">
                              {sig.date
                                ? `${isEn ? 'Date ' : 'วันที่/Date '}${isEn ? formatEnglishDate(sig.date, 'short') : formatThaiDate(sig.date, 'short')}`
                                : isEn ? 'Date ……/……/…….' : 'วันที่/Date……/……/…….'}
                            </div>
                          </div>
                        </td>
                      );
                    })}
                    {row.length < cols && Array.from({ length: cols - row.length }).map((_, fIdx) => (
                      <td
                        key={`empty-${fIdx}`}
                        className="border border-neutral-800"
                        style={{ width: `${100 / cols}%` }}
                      />
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })()}
    </div>
  );
};
