import { useEffect, useState } from 'react';
import ColorThief from 'colorthief';

export function useColorExtract(imageUrl) {
  const [colors, setColors] = useState(null);

  useEffect(() => {
    if (!imageUrl) return;

    const img = new Image();
    img.crossOrigin = 'Anonymous';

    img.onload = () => {
      try {
        const colorThief = new ColorThief();
        const palette = colorThief.getPalette(img, 5);

        // Find most vibrant color
        let maxSaturation = 0;
        let vibrant = palette[0];

        palette.forEach((rgb) => {
          const [r, g, b] = rgb;
          const max = Math.max(r, g, b);
          const min = Math.min(r, g, b);
          const saturation = max === 0 ? 0 : (max - min) / max;

          if (saturation > maxSaturation) {
            maxSaturation = saturation;
            vibrant = rgb;
          }
        });

        // Convert RGB to HSL
        const [r, g, b] = vibrant.map(v => v / 255);
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const l = (max + min) / 2;

        let h = 0;
        let s = 0;

        if (max !== min) {
          const d = max - min;
          s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

          switch (max) {
            case r:
              h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
              break;
            case g:
              h = ((b - r) / d + 2) / 6;
              break;
            case b:
              h = ((r - g) / d + 4) / 6;
              break;
          }
        }

        setColors({
          h: Math.round(h * 360),
          s: Math.round(s * 100),
          l: Math.round(l * 100),
        });
      } catch (error) {
        console.error('Error extracting colors:', error);
      }
    };

    img.onerror = () => {
      console.error('Error loading image for color extraction');
    };

    img.src = imageUrl;
  }, [imageUrl]);

  useEffect(() => {
    if (colors) {
      document.documentElement.style.setProperty('--accent-h', colors.h);
      document.documentElement.style.setProperty('--accent-s', `${colors.s}%`);
      document.documentElement.style.setProperty('--accent-l', `${colors.l}%`);
    }
  }, [colors]);

  return colors;
}
