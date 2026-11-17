import React, { useEffect, useRef } from 'react';
import QRCode from 'qrcode';

interface QRCodeCanvasProps {
  value: string;
  size?: number;
  className?: string;
}

export const QRCodeCanvas: React.FC<QRCodeCanvasProps> = ({
  value,
  size = 54,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current && value) {
      // Render at 4x resolution (minimum 256px) for ultra-sharp output on Retina screens and 600 DPI print
      const renderWidth = Math.max(256, Math.round(size * 4));
      QRCode.toCanvas(
        canvasRef.current,
        value,
        {
          width: renderWidth,
          margin: 1,
          color: {
            dark: '#000000',
            light: '#ffffff',
          },
          errorCorrectionLevel: 'M',
        },
        (error) => {
          if (error) console.error('QR code generation error:', error);
        }
      );
    }
  }, [value, size]);

  return (
    <div
      className={`inline-flex flex-col items-center justify-center p-0.5 bg-white border border-neutral-300 rounded-xs shrink-0 ${className}`}
      style={{ width: `${size + 4}px`, height: `${size + 4}px`, boxSizing: 'border-box' }}
    >
      <canvas
        ref={canvasRef}
        style={{
          width: `${size}px`,
          height: `${size}px`,
          maxWidth: '100%',
          maxHeight: '100%',
          imageRendering: 'pixelated',
          display: 'block',
        }}
      />
    </div>
  );
};

