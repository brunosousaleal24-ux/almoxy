import React, { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';

interface BarcodeVisualProps {
  value: string;
  format?: 'CODE128' | 'EAN13' | 'EAN8' | 'UPC' | 'CODE39';
  width?: number;
  height?: number;
  displayValue?: boolean;
  fontSize?: number;
  lineColor?: string;
  background?: string;
  className?: string;
}

export const BarcodeVisual: React.FC<BarcodeVisualProps> = ({
  value,
  format = 'CODE128',
  width = 2,
  height = 48,
  displayValue = true,
  fontSize = 13,
  lineColor = '#000000',
  background = 'transparent',
  className = '',
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (!svgRef.current || !value) return;

    try {
      JsBarcode(svgRef.current, value, {
        format,
        width,
        height,
        displayValue,
        fontSize,
        font: 'monospace',
        fontOptions: 'bold',
        textMargin: 3,
        lineColor,
        background,
        margin: 6,
      });
    } catch (e) {
      // Fallback to generic CODE128 if format failed (e.g., checksum error on EAN13)
      try {
        if (svgRef.current) {
          JsBarcode(svgRef.current, value, {
            format: 'CODE128',
            width,
            height,
            displayValue,
            fontSize,
            font: 'monospace',
            fontOptions: 'bold',
            textMargin: 3,
            lineColor,
            background,
            margin: 6,
          });
        }
      } catch (fallbackError) {
        console.warn('JsBarcode render error:', fallbackError);
      }
    }
  }, [value, format, width, height, displayValue, fontSize, lineColor, background]);

  return (
    <div className={`inline-flex flex-col items-center justify-center ${className}`}>
      <svg ref={svgRef} className="max-w-full h-auto drop-shadow-xs" />
    </div>
  );
};
