/**
 * Utility for processing and cleaning uploaded signature images.
 * Completely removes black, dark, white, or paper backgrounds (including surrounding black boxes)
 * while preserving every stroke of the signature (blue, dark, or white ink).
 */

export interface ProcessSignatureOptions {
  convertToBlue?: boolean;
  removeWhiteBg?: boolean;
  autoDetectInvert?: boolean;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(new Error('Failed to load image for processing: ' + err));
    img.src = src;
  });
}

/**
 * Automatically cleans a signature image:
 * 1. Dark/Black background: detects black background box and turns it transparent,
 *    preserving blue/light/white strokes and converting them to crisp royal blue ink (#1d4ed8).
 * 2. White/Light paper background: detects paper background and turns it transparent,
 *    preserving dark/blue strokes and converting them to crisp royal blue ink (#1d4ed8).
 * 3. Transparent PNG: preserves existing alpha channel transparency and enhances ink visibility.
 */
export async function processSignatureDataUrl(
  dataUrl: string,
  options: ProcessSignatureOptions = {}
): Promise<string> {
  if (dataUrl.startsWith('data:image/svg+xml')) {
    if (options.convertToBlue !== false) {
      return recolorSvgToBlue(dataUrl);
    }
    return dataUrl;
  }

  const { convertToBlue = true } = options;

  try {
    const img = await loadImage(dataUrl);
    const maxDim = 1200;
    let w = img.naturalWidth || img.width;
    let h = img.naturalHeight || img.height;

    if (w > maxDim || h > maxDim) {
      if (w > h) {
        h = Math.round((h * maxDim) / w);
        w = maxDim;
      } else {
        w = Math.round((w * maxDim) / h);
        h = maxDim;
      }
    }

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return dataUrl;

    ctx.drawImage(img, 0, 0, w, h);
    const imgData = ctx.getImageData(0, 0, w, h);
    const data = imgData.data;

    // Scan border pixels to classify background type
    let transparentBorderCount = 0;
    let darkBorderCount = 0;
    let lightBorderCount = 0;
    let totalBorderSamples = 0;

    const checkBorderPixel = (x: number, y: number) => {
      const idx = (y * w + x) * 4;
      const a = data[idx + 3];
      totalBorderSamples++;

      if (a < 20) {
        transparentBorderCount++;
        return;
      }

      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      const maxVal = Math.max(r, g, b);
      const minVal = Math.min(r, g, b);

      if (maxVal <= 45) {
        darkBorderCount++;
      } else if (minVal >= 170) {
        lightBorderCount++;
      } else {
        // Intermediate shade
        const lum = 0.299 * r + 0.587 * g + 0.114 * b;
        if (lum < 90) darkBorderCount++;
        else lightBorderCount++;
      }
    };

    // Sample step across borders
    const stepX = Math.max(1, Math.floor(w / 50));
    const stepY = Math.max(1, Math.floor(h / 50));

    for (let x = 0; x < w; x += stepX) {
      checkBorderPixel(x, 0);
      checkBorderPixel(x, h - 1);
    }
    for (let y = 0; y < h; y += stepY) {
      checkBorderPixel(0, y);
      checkBorderPixel(w - 1, y);
    }

    const isAlreadyTransparent = transparentBorderCount > totalBorderSamples * 0.45;
    const isDarkBg = !isAlreadyTransparent && darkBorderCount >= lightBorderCount;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];

      // Already transparent pixel
      if (a < 15) {
        data[i + 3] = 0;
        continue;
      }

      if (isAlreadyTransparent) {
        // Case 1: Image already has transparent background
        if (convertToBlue) {
          data[i] = 29;
          data[i + 1] = 78;
          data[i + 2] = 216;
          data[i + 3] = Math.max(180, a);
        }
        continue;
      }

      if (isDarkBg) {
        // Case 2: Image has black/dark background box
        // Background pixels are near-black: max(r,g,b) <= 38
        const maxVal = Math.max(r, g, b);
        if (maxVal <= 38) {
          data[i + 3] = 0; // Black background -> completely transparent
        } else {
          // Signature stroke (could be blue ink, white, or light color)
          if (convertToBlue) {
            data[i] = 29;
            data[i + 1] = 78;
            data[i + 2] = 216;
          }
          // Smooth antialiasing transition for stroke edges
          const alphaRatio = Math.min(255, Math.round(((maxVal - 38) / 45) * 255));
          data[i + 3] = Math.max(200, alphaRatio);
        }
        continue;
      }

      // Case 3: Image has white or light paper background
      const minVal = Math.min(r, g, b);
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;

      if (minVal >= 195 || lum >= 205) {
        data[i + 3] = 0; // White paper -> completely transparent
      } else {
        // Signature stroke
        if (convertToBlue) {
          data[i] = 29;
          data[i + 1] = 78;
          data[i + 2] = 216;
        } else {
          data[i] = Math.round(r * 0.85);
          data[i + 1] = Math.round(g * 0.85);
          data[i + 2] = Math.round(b * 0.85);
        }
        const alphaRatio = Math.min(255, Math.round(((205 - lum) / 35) * 255));
        data[i + 3] = Math.max(190, alphaRatio);
      }
    }

    ctx.putImageData(imgData, 0, 0);
    return canvas.toDataURL('image/png');
  } catch (e) {
    console.warn('Error processing signature image, returning original:', e);
    return dataUrl;
  }
}

export async function invertSignatureImage(dataUrl: string): Promise<string> {
  return processSignatureDataUrl(dataUrl);
}

export function recolorSvgToBlue(svgDataUrl: string): string {
  try {
    let decoded = decodeURIComponent(svgDataUrl.replace('data:image/svg+xml;utf8,', ''));
    decoded = decoded.replace(/stroke="#111827"/g, 'stroke="#1d4ed8"');
    decoded = decoded.replace(/stroke="black"/g, 'stroke="#1d4ed8"');
    decoded = decoded.replace(/stroke="#000000"/g, 'stroke="#1d4ed8"');
    decoded = decoded.replace(/stroke="#000"/g, 'stroke="#1d4ed8"');
    return `data:image/svg+xml;utf8,${encodeURIComponent(decoded)}`;
  } catch (e) {
    return svgDataUrl;
  }
}

export async function convertToBlueInk(dataUrl: string): Promise<string> {
  if (dataUrl.startsWith('data:image/svg+xml')) {
    return recolorSvgToBlue(dataUrl);
  }
  return processSignatureDataUrl(dataUrl, { convertToBlue: true });
}

export async function convertToBlackInk(dataUrl: string): Promise<string> {
  if (dataUrl.startsWith('data:image/svg+xml')) {
    try {
      let decoded = decodeURIComponent(dataUrl.replace('data:image/svg+xml;utf8,', ''));
      decoded = decoded.replace(/stroke="#1d4ed8"/g, 'stroke="#111827"');
      decoded = decoded.replace(/stroke="#1e40af"/g, 'stroke="#111827"');
      return `data:image/svg+xml;utf8,${encodeURIComponent(decoded)}`;
    } catch (e) {
      return dataUrl;
    }
  }
  return processSignatureDataUrl(dataUrl, { convertToBlue: false });
}

export async function processSignatureFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const rawData = reader.result as string;
        const cleaned = await processSignatureDataUrl(rawData, { convertToBlue: true });
        resolve(cleaned);
      } catch (err) {
        resolve(reader.result as string);
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}
