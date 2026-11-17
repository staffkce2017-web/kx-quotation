import React from 'react';
import { useAppLogo } from '../utils/logoManager';

interface KXLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  textColor?: 'dark' | 'light';
  customLogoUrl?: string | null;
  className?: string;
}

/**
 * Official KX Knowledge Xchange Vector Mark (<X)
 * Clean, modern vector glyph representing Knowledge Xchange.
 */
export const KXMark: React.FC<{
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  textColor?: 'dark' | 'light';
  className?: string;
}> = ({ size = 'md', textColor = 'dark', className = '' }) => {
  const isLight = textColor === 'light';
  const strokeColor = isLight ? '#FFFFFF' : '#18181B';

  const dimensions = {
    xs: { width: 34, height: 24, stroke: 5.5 },
    sm: { width: 44, height: 30, stroke: 6.5 },
    md: { width: 56, height: 38, stroke: 7.5 },
    lg: { width: 72, height: 48, stroke: 8.5 },
    xl: { width: 92, height: 60, stroke: 10 },
  }[size];

  return (
    <svg
      width={dimensions.width}
      height={dimensions.height}
      viewBox="0 0 76 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 select-none ${className}`}
      aria-label="Knowledge Xchange <X Logo"
    >
      {/* Left Chevron: < */}
      <path
        d="M 25 8 L 8 24 L 25 40"
        stroke={strokeColor}
        strokeWidth={dimensions.stroke}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Right Cross: X */}
      <path
        d="M 38 8 L 68 40"
        stroke={strokeColor}
        strokeWidth={dimensions.stroke}
        strokeLinecap="round"
      />
      <path
        d="M 68 8 L 38 40"
        stroke={strokeColor}
        strokeWidth={dimensions.stroke}
        strokeLinecap="round"
      />
    </svg>
  );
};

/**
 * Clean Brand Logo Component:
 * Displays only the clean logo graphic (<X or Custom Uploaded Image)
 * without any forced attached subtitle text.
 */
export const KXLogo: React.FC<KXLogoProps> = ({
  size = 'md',
  textColor = 'dark',
  customLogoUrl,
  className = '',
}) => {
  const { logoUrl } = useAppLogo();
  const activeLogo = customLogoUrl !== undefined ? customLogoUrl : logoUrl;

  const fontSizes = {
    xs: { h: 'h-6', maxW: 'max-w-[80px]' },
    sm: { h: 'h-8', maxW: 'max-w-[110px]' },
    md: { h: 'h-10', maxW: 'max-w-[150px]' },
    lg: { h: 'h-14', maxW: 'max-w-[200px]' },
    xl: { h: 'h-18', maxW: 'max-w-[260px]' },
  }[size];

  // If a custom image was explicitly uploaded, display only that clean logo image
  if (activeLogo) {
    return (
      <div className={`flex items-center shrink-0 ${className}`}>
        <img
          src={activeLogo}
          alt="Brand Logo"
          className={`${fontSizes.h} ${fontSizes.maxW} object-contain shrink-0`}
        />
      </div>
    );
  }

  // Official Knowledge Xchange Brand Identity: Only the clean vector <X symbol
  return (
    <div className={`flex items-center shrink-0 ${className}`}>
      <KXMark size={size} textColor={textColor} />
    </div>
  );
};
