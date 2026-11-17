import React, { useEffect, useState } from 'react';
import { Quotation } from '../types';
import { QuotationDocument } from './QuotationDocument';
import { AnnexDocument } from './AnnexDocument';
import { Printer, X, Download, Loader2 } from 'lucide-react';
import { generateAndDownloadPDF, PDFPageSelection } from '../utils/pdfExport';

interface PrintViewProps {
  quotation: Quotation;
  page?: PDFPageSelection;
  onClose?: () => void;
}

export const PrintView: React.FC<PrintViewProps> = ({
  quotation,
  page = 'both',
  onClose,
}) => {
  const [isDownloading, setIsDownloading] = useState(false);

  // Automatically trigger browser print dialog when the page mounts & web fonts are loaded
  useEffect(() => {
    let isCancelled = false;

    const prepareAndPrint = async () => {
      try {
        if (typeof document !== 'undefined' && 'fonts' in document) {
          await (document as any).fonts.ready;
        }
      } catch (e) {
        console.warn('fonts.ready notice:', e);
      }

      if (!isCancelled) {
        setTimeout(() => {
          if (isCancelled) return;
          try {
            window.focus();
            if (window.print) {
              window.print();
            } else {
              console.error('window.print is not available');
            }
          } catch (err) {
            console.error('Auto-print error:', err);
          }
        }, 350);
      }
    };

    prepareAndPrint();

    return () => {
      isCancelled = true;
    };
  }, []);


  const handleManualPrint = () => {
    try {
      window.focus();
      window.print();
    } catch (err) {
      console.error('Manual print error:', err);
    }
  };

  const handleDownloadPDF = async () => {
    setIsDownloading(true);
    try {
      const selectedPage: PDFPageSelection = page === 'quotation' || page === 'annex' ? page : 'both';
      await generateAndDownloadPDF({
        quotationElementId: 'printable-quotation',
        annexElementId: 'printable-annex',
        selection: selectedPage,
        quoteNumber: quotation.quoteNumber,
        customerName: quotation.customer.name,
      });
    } catch (err) {
      console.error('Download error in print view:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-100 flex flex-col items-center print:bg-white print:m-0 print:p-0">
      {/* Floating Control Bar - Hidden when printing */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-neutral-900/95 backdrop-blur-md text-white px-4 py-3 shadow-md flex items-center justify-between gap-3 no-print">
        <div className="flex items-center gap-3">
          <div className="font-mono font-bold text-sm text-amber-300">
            {quotation.quoteNumber}
          </div>
          <div className="text-xs text-neutral-300 hidden sm:block">
            {quotation.jobTitle || quotation.customer.name}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Print Button */}
          <button
            type="button"
            onClick={handleManualPrint}
            className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold rounded-lg text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer active:scale-95"
            title="เปิดหน้าต่างพิมพ์ของเบราว์เซอร์ เพื่อเลือกเครื่องพิมพ์ หรือ Save as PDF"
          >
            <Printer className="w-4 h-4" />
            <span>สั่งพิมพ์ (Print)</span>
          </button>

          {/* Backup Download Button */}
          <button
            type="button"
            onClick={handleDownloadPDF}
            disabled={isDownloading}
            className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
            title="ดาวน์โหลดเป็นไฟล์ PDF ลงเครื่อง"
          >
            {isDownloading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
            ) : (
              <Download className="w-3.5 h-3.5" />
            )}
            <span className="hidden sm:inline">โหลด PDF</span>
          </button>

          {/* Close Window Button */}
          <button
            type="button"
            onClick={() => {
              if (onClose) {
                onClose();
              } else if (window.opener) {
                window.close();
              } else {
                window.history.back();
              }
            }}
            className="p-1.5 text-neutral-400 hover:text-white rounded-md transition-colors cursor-pointer"
            title="ปิดหน้าต่าง"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Printable Document Area */}
      <div className="w-full max-w-4xl pt-16 pb-12 px-2 sm:px-4 flex flex-col items-center space-y-6 print:p-0 print:m-0 print:max-w-none print:space-y-0">
        {(page === 'quotation' || page === 'both') && (
          <div className="w-full bg-white shadow-xl rounded-xs border border-neutral-300 print:shadow-none print:border-none print:m-0 print:p-0">
            <QuotationDocument quotation={quotation} />
          </div>
        )}

        {(page === 'annex' || page === 'both') && (
          <div className="w-full bg-white shadow-xl rounded-xs border border-neutral-300 print:shadow-none print:border-none print:m-0 print:p-0">
            <AnnexDocument
              customerName={quotation.customer.contactPerson || quotation.customer.name}
              config={{
                ...quotation.annexConfig,
                fontFamily: quotation.annexConfig?.fontFamily || quotation.layoutSettings?.headerFontFamily || 'Trirong',
                fontSize: quotation.annexConfig?.fontSize || 11,
                logoUrl: quotation.annexConfig?.logoUrl || quotation.logoUrl,
                companyName: quotation.annexConfig?.companyName,
              }}
              language={quotation.language}
            />
          </div>
        )}
      </div>
    </div>
  );
};
