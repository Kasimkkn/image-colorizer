// Advanced Image Processing Utilities for Colorization Tool

export interface ImageData {
  data: Uint8ClampedArray;
  width: number;
  height: number;
}

export interface Point {
  x: number;
  y: number;
}

export interface ColorRGBA {
  r: number;
  g: number;
  b: number;
  a: number;
}

export interface BlendOptions {
  mode: 'multiply' | 'overlay' | 'soft-light' | 'color-burn' | 'normal';
  opacity: number;
}

/**
 * Create a binary mask from polygon points
 */
export function createPolygonMask(
  width: number,
  height: number,
  polygonPoints: Point[]
): ImageData {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  // Clear canvas
  ctx.clearRect(0, 0, width, height);

  // Create polygon path
  ctx.beginPath();
  ctx.moveTo(polygonPoints[0].x, polygonPoints[0].y);
  for (let i = 1; i < polygonPoints.length; i++) {
    ctx.lineTo(polygonPoints[i].x, polygonPoints[i].y);
  }
  ctx.closePath();

  // Fill polygon
  ctx.fillStyle = 'white';
  ctx.fill();

  return ctx.getImageData(0, 0, width, height);
}

/**
 * Apply flood fill algorithm within a masked region
 */
export function floodFillInMask(
  imageData: ImageData,
  mask: ImageData,
  startPoint: Point,
  fillColor: ColorRGBA,
  tolerance: number = 10
): ImageData {
  const data = new Uint8ClampedArray(imageData.data);
  const result: ImageData = { data, width: imageData.width, height: imageData.height };

  const startPixelIndex = (startPoint.y * imageData.width + startPoint.x) * 4;
  const startColor = {
    r: imageData.data[startPixelIndex],
    g: imageData.data[startPixelIndex + 1],
    b: imageData.data[startPixelIndex + 2],
    a: imageData.data[startPixelIndex + 3]
  };

  const stack: Point[] = [startPoint];
  const visited = new Set<string>();

  while (stack.length > 0) {
    const point = stack.pop()!;
    const key = `${point.x},${point.y}`;

    if (visited.has(key)) continue;
    visited.add(key);

    // Check bounds
    if (point.x < 0 || point.x >= imageData.width || point.y < 0 || point.y >= imageData.height) {
      continue;
    }

    const pixelIndex = (point.y * imageData.width + point.x) * 4;
    const maskIndex = pixelIndex;

    // Check if pixel is within mask
    if (mask.data[maskIndex] === 0) continue;

    // Check color similarity
    const currentColor = {
      r: imageData.data[pixelIndex],
      g: imageData.data[pixelIndex + 1],
      b: imageData.data[pixelIndex + 2],
      a: imageData.data[pixelIndex + 3]
    };

    if (!isColorSimilar(startColor, currentColor, tolerance)) continue;

    // Fill pixel
    result.data[pixelIndex] = fillColor.r;
    result.data[pixelIndex + 1] = fillColor.g;
    result.data[pixelIndex + 2] = fillColor.b;
    result.data[pixelIndex + 3] = fillColor.a;

    // Add neighbors to stack
    stack.push(
      { x: point.x - 1, y: point.y },
      { x: point.x + 1, y: point.y },
      { x: point.x, y: point.y - 1 },
      { x: point.x, y: point.y + 1 }
    );
  }

  return result;
}

/**
 * Check if two colors are similar within tolerance
 */
function isColorSimilar(color1: ColorRGBA, color2: ColorRGBA, tolerance: number): boolean {
  return (
    Math.abs(color1.r - color2.r) <= tolerance &&
    Math.abs(color1.g - color2.g) <= tolerance &&
    Math.abs(color1.b - color2.b) <= tolerance &&
    Math.abs(color1.a - color2.a) <= tolerance
  );
}

/**
 * Apply Gaussian blur to smooth edges
 */
export function gaussianBlur(imageData: ImageData, radius: number = 2): ImageData {
  const canvas = document.createElement('canvas');
  canvas.width = imageData.width;
  canvas.height = imageData.height;
  const ctx = canvas.getContext('2d')!;

  ctx.putImageData(imageData, 0, 0);
  ctx.filter = `blur(${radius}px)`;
  ctx.drawImage(canvas, 0, 0);

  return ctx.getImageData(0, 0, imageData.width, imageData.height);
}

/**
 * Apply edge detection using Canny algorithm (simplified)
 */
export function detectEdges(imageData: ImageData, threshold: number = 50): ImageData {
  const grayscale = convertToGrayscale(imageData);
  const result = new ImageData(new Uint8ClampedArray(imageData.data), imageData.width, imageData.height);

  // Sobel edge detection
  const sobelX = [-1, 0, 1, -2, 0, 2, -1, 0, 1];
  const sobelY = [-1, -2, -1, 0, 0, 0, 1, 2, 1];

  for (let y = 1; y < imageData.height - 1; y++) {
    for (let x = 1; x < imageData.width - 1; x++) {
      let gx = 0, gy = 0;

      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          const idx = ((y + ky) * imageData.width + (x + kx)) * 4;
          const intensity = grayscale.data[idx];
          const kernelIdx = (ky + 1) * 3 + (kx + 1);

          gx += intensity * sobelX[kernelIdx];
          gy += intensity * sobelY[kernelIdx];
        }
      }

      const magnitude = Math.sqrt(gx * gx + gy * gy);
      const resultIdx = (y * imageData.width + x) * 4;

      if (magnitude > threshold) {
        result.data[resultIdx] = 255;     // R
        result.data[resultIdx + 1] = 255; // G
        result.data[resultIdx + 2] = 255; // B
        result.data[resultIdx + 3] = 255; // A
      } else {
        result.data[resultIdx] = 0;
        result.data[resultIdx + 1] = 0;
        result.data[resultIdx + 2] = 0;
        result.data[resultIdx + 3] = 255;
      }
    }
  }

  return result;
}

/**
 * Convert image to grayscale
 */
export function convertToGrayscale(imageData: ImageData): ImageData {
  const result = new ImageData(new Uint8ClampedArray(imageData.data), imageData.width, imageData.height);

  for (let i = 0; i < imageData.data.length; i += 4) {
    const r = imageData.data[i];
    const g = imageData.data[i + 1];
    const b = imageData.data[i + 2];

    // Luminance formula
    const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b);

    result.data[i] = gray;     // R
    result.data[i + 1] = gray; // G
    result.data[i + 2] = gray; // B
    result.data[i + 3] = imageData.data[i + 3]; // A (unchanged)
  }

  return result;
}

/**
 * Blend two colors using different blend modes
 */
export function blendColors(
  baseColor: ColorRGBA,
  overlayColor: ColorRGBA,
  options: BlendOptions
): ColorRGBA {
  const { mode, opacity } = options;
  let result: ColorRGBA;

  switch (mode) {
    case 'multiply':
      result = {
        r: (baseColor.r * overlayColor.r) / 255,
        g: (baseColor.g * overlayColor.g) / 255,
        b: (baseColor.b * overlayColor.b) / 255,
        a: baseColor.a
      };
      break;

    case 'overlay':
      result = {
        r: baseColor.r < 128
          ? (2 * baseColor.r * overlayColor.r) / 255
          : 255 - (2 * (255 - baseColor.r) * (255 - overlayColor.r)) / 255,
        g: baseColor.g < 128
          ? (2 * baseColor.g * overlayColor.g) / 255
          : 255 - (2 * (255 - baseColor.g) * (255 - overlayColor.g)) / 255,
        b: baseColor.b < 128
          ? (2 * baseColor.b * overlayColor.b) / 255
          : 255 - (2 * (255 - baseColor.b) * (255 - overlayColor.b)) / 255,
        a: baseColor.a
      };
      break;

    case 'soft-light':
      result = {
        r: overlayColor.r < 128
          ? baseColor.r - (255 - 2 * overlayColor.r) * baseColor.r * (255 - baseColor.r) / (255 * 255)
          : baseColor.r + (2 * overlayColor.r - 255) * (Math.sqrt(baseColor.r / 255) * 255 - baseColor.r) / 255,
        g: overlayColor.g < 128
          ? baseColor.g - (255 - 2 * overlayColor.g) * baseColor.g * (255 - baseColor.g) / (255 * 255)
          : baseColor.g + (2 * overlayColor.g - 255) * (Math.sqrt(baseColor.g / 255) * 255 - baseColor.g) / 255,
        b: overlayColor.b < 128
          ? baseColor.b - (255 - 2 * overlayColor.b) * baseColor.b * (255 - baseColor.b) / (255 * 255)
          : baseColor.b + (2 * overlayColor.b - 255) * (Math.sqrt(baseColor.b / 255) * 255 - baseColor.b) / 255,
        a: baseColor.a
      };
      break;

    case 'color-burn':
      result = {
        r: overlayColor.r === 0 ? 0 : Math.max(0, 255 - (255 - baseColor.r) * 255 / overlayColor.r),
        g: overlayColor.g === 0 ? 0 : Math.max(0, 255 - (255 - baseColor.g) * 255 / overlayColor.g),
        b: overlayColor.b === 0 ? 0 : Math.max(0, 255 - (255 - baseColor.b) * 255 / overlayColor.b),
        a: baseColor.a
      };
      break;

    default: // normal
      result = overlayColor;
  }

  // Apply opacity
  return {
    r: Math.round(baseColor.r + (result.r - baseColor.r) * opacity),
    g: Math.round(baseColor.g + (result.g - baseColor.g) * opacity),
    b: Math.round(baseColor.b + (result.b - baseColor.b) * opacity),
    a: baseColor.a
  };
}

/**
 * Apply color to a masked region using blend modes
 */
export function applyColorToMaskedRegion(
  baseImageData: ImageData,
  mask: ImageData,
  color: ColorRGBA,
  options: BlendOptions
): ImageData {
  const result = new ImageData(new Uint8ClampedArray(baseImageData.data), baseImageData.width, baseImageData.height);

  for (let i = 0; i < baseImageData.data.length; i += 4) {
    const maskValue = mask.data[i]; // Use red channel as mask

    if (maskValue > 0) {
      const baseColor: ColorRGBA = {
        r: baseImageData.data[i],
        g: baseImageData.data[i + 1],
        b: baseImageData.data[i + 2],
        a: baseImageData.data[i + 3]
      };

      const blendedColor = blendColors(baseColor, color, {
        ...options,
        opacity: options.opacity * (maskValue / 255) // Use mask intensity
      });

      result.data[i] = blendedColor.r;
      result.data[i + 1] = blendedColor.g;
      result.data[i + 2] = blendedColor.b;
      result.data[i + 3] = blendedColor.a;
    }
  }

  return result;
}

/**
 * Create anti-aliased mask edges
 */
export function createAntiAliasedMask(mask: ImageData, radius: number = 1): ImageData {
  return gaussianBlur(mask, radius);
}

/**
 * Morphological operations for mask cleanup
 */
export function morphologyClose(mask: ImageData, kernelSize: number = 3): ImageData {
  const dilated = morphologyDilate(mask, kernelSize);
  return morphologyErode(dilated, kernelSize);
}

export function morphologyDilate(mask: ImageData, kernelSize: number = 3): ImageData {
  const result = new ImageData(new Uint8ClampedArray(mask.data), mask.width, mask.height);
  const radius = Math.floor(kernelSize / 2);

  for (let y = radius; y < mask.height - radius; y++) {
    for (let x = radius; x < mask.width - radius; x++) {
      let maxValue = 0;

      for (let ky = -radius; ky <= radius; ky++) {
        for (let kx = -radius; kx <= radius; kx++) {
          const idx = ((y + ky) * mask.width + (x + kx)) * 4;
          maxValue = Math.max(maxValue, mask.data[idx]);
        }
      }

      const resultIdx = (y * mask.width + x) * 4;
      result.data[resultIdx] = maxValue;
      result.data[resultIdx + 1] = maxValue;
      result.data[resultIdx + 2] = maxValue;
      result.data[resultIdx + 3] = 255;
    }
  }

  return result;
}

export function morphologyErode(mask: ImageData, kernelSize: number = 3): ImageData {
  const result = new ImageData(new Uint8ClampedArray(mask.data), mask.width, mask.height);
  const radius = Math.floor(kernelSize / 2);

  for (let y = radius; y < mask.height - radius; y++) {
    for (let x = radius; x < mask.width - radius; x++) {
      let minValue = 255;

      for (let ky = -radius; ky <= radius; ky++) {
        for (let kx = -radius; kx <= radius; kx++) {
          const idx = ((y + ky) * mask.width + (x + kx)) * 4;
          minValue = Math.min(minValue, mask.data[idx]);
        }
      }

      const resultIdx = (y * mask.width + x) * 4;
      result.data[resultIdx] = minValue;
      result.data[resultIdx + 1] = minValue;
      result.data[resultIdx + 2] = minValue;
      result.data[resultIdx + 3] = 255;
    }
  }

  return result;
}

/**
 * Convert hex color to RGBA
 */
export function hexToRGBA(hex: string, alpha: number = 1): ColorRGBA {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
    a: Math.round(alpha * 255)
  } : { r: 0, g: 0, b: 0, a: 255 };
}

/**
 * Convert RGBA to hex color
 */
export function rgbaToHex(rgba: ColorRGBA): string {
  const toHex = (value: number) => {
    const hex = Math.round(value).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };

  return `#${toHex(rgba.r)}${toHex(rgba.g)}${toHex(rgba.b)}`;
}

/**
 * Simplify polygon points using Douglas-Peucker algorithm
 */
export function simplifyPolygon(points: Point[], tolerance: number = 1): Point[] {
  if (points.length <= 2) return points;

  // Find the point with maximum distance
  let maxDistance = 0;
  let maxIndex = 0;
  const start = points[0];
  const end = points[points.length - 1];

  for (let i = 1; i < points.length - 1; i++) {
    const distance = pointToLineDistance(points[i], start, end);
    if (distance > maxDistance) {
      maxDistance = distance;
      maxIndex = i;
    }
  }

  // If maximum distance is greater than tolerance, recursively simplify
  if (maxDistance > tolerance) {
    const firstHalf = simplifyPolygon(points.slice(0, maxIndex + 1), tolerance);
    const secondHalf = simplifyPolygon(points.slice(maxIndex), tolerance);

    return firstHalf.slice(0, -1).concat(secondHalf);
  } else {
    return [start, end];
  }
}

/**
 * Calculate distance from point to line
 */
function pointToLineDistance(point: Point, lineStart: Point, lineEnd: Point): number {
  const A = point.x - lineStart.x;
  const B = point.y - lineStart.y;
  const C = lineEnd.x - lineStart.x;
  const D = lineEnd.y - lineStart.y;

  const dot = A * C + B * D;
  const lenSq = C * C + D * D;

  if (lenSq === 0) return Math.sqrt(A * A + B * B);

  const param = dot / lenSq;

  let xx, yy;
  if (param < 0) {
    xx = lineStart.x;
    yy = lineStart.y;
  } else if (param > 1) {
    xx = lineEnd.x;
    yy = lineEnd.y;
  } else {
    xx = lineStart.x + param * C;
    yy = lineStart.y + param * D;
  }

  const dx = point.x - xx;
  const dy = point.y - yy;
  return Math.sqrt(dx * dx + dy * dy);
}