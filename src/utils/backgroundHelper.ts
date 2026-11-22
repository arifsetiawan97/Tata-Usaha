import React from 'react';
import { BackgroundConfig } from '../types';

export interface BackgroundPresetOption {
  id: string;
  label: string;
  description: string;
  backgroundCss: string;
  overlayColor: string;
  defaultOpacity: number;
  isDarkSurface: boolean;
}

export const MAIN_BACKGROUND_PRESETS: BackgroundPresetOption[] = [
  {
    id: 'default',
    label: 'Gelap Klasik SI-OPS',
    description: 'Gradien slate gelap standar dengan kontras tinggi',
    backgroundCss: 'linear-gradient(180deg, #0f172a 0%, #111827 52%, #020617 100%)',
    overlayColor: 'rgba(15, 23, 42, 0.25)',
    defaultOpacity: 0.55,
    isDarkSurface: true
  },
  {
    id: 'nusantara_navy',
    label: 'Biru Nusantara',
    description: 'Biru maritim mendalam dengan aksen cahaya lembut',
    backgroundCss:
      'radial-gradient(circle at 18% 18%, rgba(56, 189, 248, 0.24), transparent 46%), radial-gradient(circle at 82% 24%, rgba(14, 165, 233, 0.18), transparent 44%), linear-gradient(145deg, #082f49 0%, #0f172a 55%, #020617 100%)',
    overlayColor: 'rgba(8, 25, 48, 0.3)',
    defaultOpacity: 0.45,
    isDarkSurface: true
  },
  {
    id: 'emerald_campus',
    label: 'Zamrud Pendidikan',
    description: 'Nuansa hijau hutan teduh & profesional',
    backgroundCss:
      'radial-gradient(circle at 20% 20%, rgba(16, 185, 129, 0.22), transparent 45%), radial-gradient(circle at 85% 75%, rgba(20, 184, 166, 0.16), transparent 48%), linear-gradient(155deg, #022c22 0%, #0f172a 58%, #030712 100%)',
    overlayColor: 'rgba(4, 30, 24, 0.3)',
    defaultOpacity: 0.45,
    isDarkSurface: true
  },
  {
    id: 'warm_twilight',
    label: 'Senja Akademik',
    description: 'Latar obsidian dengan kehangatan emas senja',
    backgroundCss:
      'radial-gradient(circle at 78% 18%, rgba(245, 158, 11, 0.22), transparent 45%), radial-gradient(circle at 15% 80%, rgba(234, 88, 12, 0.14), transparent 48%), linear-gradient(155deg, #1c1917 0%, #0f172a 58%, #090d16 100%)',
    overlayColor: 'rgba(20, 16, 14, 0.3)',
    defaultOpacity: 0.45,
    isDarkSurface: true
  },
  {
    id: 'ocean_horizon',
    label: 'Cakrawala Samudra',
    description: 'Biru baja tenang dengan kedalaman horizon',
    backgroundCss:
      'radial-gradient(circle at 50% 0%, rgba(96, 165, 250, 0.22), transparent 55%), linear-gradient(180deg, #172554 0%, #0f172a 55%, #020617 100%)',
    overlayColor: 'rgba(15, 23, 42, 0.25)',
    defaultOpacity: 0.45,
    isDarkSurface: true
  },
  {
    id: 'architectural_grid',
    label: 'Pola Arsitektur',
    description: 'Kisi geometris halus di atas kanvas slate gelap',
    backgroundCss:
      'linear-gradient(rgba(148, 163, 184, 0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(148, 163, 184, 0.08) 1px, transparent 1px), linear-gradient(180deg, #0f172a 0%, #020617 100%)',
    overlayColor: 'rgba(15, 23, 42, 0.2)',
    defaultOpacity: 0.4,
    isDarkSurface: true
  }
];

export const SERVICE_BACKGROUND_PRESETS: BackgroundPresetOption[] = [
  {
    id: 'default',
    label: 'Bersih Standar',
    description: 'Kanvas kerja terang netral & ringan',
    backgroundCss: 'linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)',
    overlayColor: 'rgba(248, 250, 252, 0)',
    defaultOpacity: 0.72,
    isDarkSurface: false
  },
  {
    id: 'soft_sky',
    label: 'Langit Pagi',
    description: 'Nuansa biru langit cerah & segar untuk administrasi',
    backgroundCss:
      'radial-gradient(circle at 12% 10%, rgba(56, 189, 248, 0.22), transparent 45%), radial-gradient(circle at 88% 85%, rgba(14, 165, 233, 0.16), transparent 48%), linear-gradient(160deg, #f0f9ff 0%, #e0f2fe 48%, #f8fafc 100%)',
    overlayColor: 'rgba(255, 255, 255, 0.15)',
    defaultOpacity: 0.65,
    isDarkSurface: false
  },
  {
    id: 'mint_sanctuary',
    label: 'Hijau Teduh',
    description: 'Warna daun sage lembut yang nyaman di mata',
    backgroundCss:
      'radial-gradient(circle at 82% 12%, rgba(16, 185, 129, 0.2), transparent 46%), radial-gradient(circle at 15% 88%, rgba(20, 184, 166, 0.15), transparent 48%), linear-gradient(160deg, #ecfdf5 0%, #f0fdfa 52%, #f8fafc 100%)',
    overlayColor: 'rgba(255, 255, 255, 0.15)',
    defaultOpacity: 0.65,
    isDarkSurface: false
  },
  {
    id: 'warm_parchment',
    label: 'Kertas Hangat',
    description: 'Nuansa krem & amber lembut untuk dokumentasi',
    backgroundCss:
      'radial-gradient(circle at 20% 15%, rgba(245, 158, 11, 0.18), transparent 48%), radial-gradient(circle at 88% 82%, rgba(217, 119, 6, 0.12), transparent 46%), linear-gradient(160deg, #fffbeb 0%, #fef3c7 35%, #f8fafc 100%)',
    overlayColor: 'rgba(255, 255, 255, 0.15)',
    defaultOpacity: 0.65,
    isDarkSurface: false
  },
  {
    id: 'ocean_slate',
    label: 'Biru Malam Elegan',
    description: 'Latar ruang kerja biru tua kontras dengan kartu putih bersih',
    backgroundCss:
      'radial-gradient(circle at 20% 20%, rgba(59, 130, 246, 0.25), transparent 48%), linear-gradient(160deg, #0f172a 0%, #1e293b 55%, #0f172a 100%)',
    overlayColor: 'rgba(15, 23, 42, 0.2)',
    defaultOpacity: 0.68,
    isDarkSurface: true
  },
  {
    id: 'subtle_blueprint',
    label: 'Kisi Kerja Halus',
    description: 'Pola grid tipis profesional untuk ketelitian kerja',
    backgroundCss:
      'linear-gradient(rgba(15, 23, 42, 0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(15, 23, 42, 0.045) 1px, transparent 1px), linear-gradient(180deg, #f8fafc 0%, #eef2f6 100%)',
    overlayColor: 'rgba(248, 250, 252, 0.1)',
    defaultOpacity: 0.65,
    isDarkSurface: false
  }
];

const SAFE_IMAGE_DATA_URL_REGEX = /^data:image\/(png|jpeg|jpg|webp|gif);base64,[A-Za-z0-9+/=\s]+$/i;
const SAFE_HTTP_URL_REGEX = /^https?:\/\/[^\s<>'"]{4,1200}$/i;

export function isSafeBackgroundImageUrl(url?: string | null): boolean {
  if (typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (!trimmed || trimmed.length > 1_650_000) return false;
  return SAFE_IMAGE_DATA_URL_REGEX.test(trimmed) || SAFE_HTTP_URL_REGEX.test(trimmed);
}

export async function compressImageFileToDataUrl(
  file: File,
  options: { maxWidth?: number; maxHeight?: number; maxBytes?: number } = {}
): Promise<string> {
  if (!file || typeof file.type !== 'string' || !file.type.startsWith('image/')) {
    throw new Error('Berkas harus berupa gambar (PNG, JPG, WEBP, atau GIF).');
  }
  if (file.type === 'image/svg+xml') {
    throw new Error('Format SVG tidak diizinkan demi keamanan. Gunakan JPG, PNG, atau WEBP.');
  }
  if (file.size > 15 * 1024 * 1024) {
    throw new Error('Ukuran berkas foto terlalu besar (maksimal 15 MB).');
  }

  const maxWidth = options.maxWidth ?? 1600;
  const maxHeight = options.maxHeight ?? 1000;
  const maxBytes = options.maxBytes ?? 650_000;

  const rawDataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Gagal membaca berkas foto yang dipilih.'));
    reader.readAsDataURL(file);
  });

  if (file.type === 'image/gif' && rawDataUrl.length <= maxBytes) {
    return rawDataUrl;
  }

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Gambar tidak dapat diproses. Pastikan berkas foto tidak rusak.'));
    image.src = rawDataUrl;
  });

  let targetW = img.naturalWidth || img.width || 1280;
  let targetH = img.naturalHeight || img.height || 720;
  const scale = Math.min(1, maxWidth / targetW, maxHeight / targetH);
  targetW = Math.max(1, Math.round(targetW * scale));
  targetH = Math.max(1, Math.round(targetH * scale));

  const canvas = document.createElement('canvas');
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return rawDataUrl;
  }
  ctx.drawImage(img, 0, 0, targetW, targetH);

  const qualities = [0.84, 0.72, 0.58, 0.44];
  let bestResult = '';
  for (const q of qualities) {
    const webp = canvas.toDataURL('image/webp', q);
    const candidate = webp.startsWith('data:image/webp')
      ? webp
      : canvas.toDataURL('image/jpeg', q);
    bestResult = candidate;
    if (candidate.length <= maxBytes) {
      return candidate;
    }
  }
  if (bestResult.length > 1_550_000) {
    throw new Error('Foto masih terlalu besar setelah dikompresi. Pilih gambar dengan resolusi lebih kecil.');
  }
  return bestResult;
}

export function resolveBackgroundPresentation(
  config: BackgroundConfig | null | undefined,
  presets: BackgroundPresetOption[],
  variant: 'main' | 'service'
): {
  isCustomized: boolean;
  isDarkCanvas: boolean;
  layerStyle: React.CSSProperties;
  overlayStyle: React.CSSProperties;
} {
  const defaultPreset = presets[0];
  if (!config || config.deleted || config.mode === 'default') {
    const isGrid = defaultPreset.id === 'architectural_grid' || defaultPreset.id === 'subtle_blueprint';
    return {
      isCustomized: false,
      isDarkCanvas: defaultPreset.isDarkSurface,
      layerStyle: {
        backgroundImage: defaultPreset.backgroundCss,
        ...(isGrid ? { backgroundSize: '32px 32px, 32px 32px, 100% 100%' } : {})
      },
      overlayStyle: { backgroundColor: 'transparent' }
    };
  }

  const blurPx = Math.max(0, Math.min(16, Number(config.blurPx) || 0));
  const overlayOpacity = Number.isFinite(Number(config.overlayOpacity))
    ? Math.max(0, Math.min(0.92, Number(config.overlayOpacity)))
    : variant === 'main'
    ? 0.55
    : 0.72;

  if (config.mode === 'image' && isSafeBackgroundImageUrl(config.imageUrl)) {
    const cleanUrl = config.imageUrl!.trim().replace(/"/g, '%22');
    const scrimBase = variant === 'main' ? '15, 23, 42' : '248, 250, 252';
    return {
      isCustomized: true,
      isDarkCanvas: variant === 'main',
      layerStyle: {
        backgroundImage: `url("${cleanUrl}")`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        ...(blurPx > 0
          ? {
              filter: `blur(${blurPx}px)`,
              transform: 'scale(1.06)'
            }
          : {})
      },
      overlayStyle: {
        backgroundColor: `rgba(${scrimBase}, ${overlayOpacity})`
      }
    };
  }

  if (config.mode === 'color') {
    const c1 = /^#[0-9a-fA-F]{6}$/.test(config.customColor || '') ? config.customColor! : '#0f172a';
    const c2 = /^#[0-9a-fA-F]{6}$/.test(config.customColorSecondary || '')
      ? config.customColorSecondary!
      : '';
    const bgStyle: React.CSSProperties = c2
      ? { backgroundImage: `linear-gradient(145deg, ${c1} 0%, ${c2} 100%)` }
      : { backgroundColor: c1 };
    const isDark = isHexDark(c1);
    const scrimBase = variant === 'main' ? '15, 23, 42' : isDark ? '15, 23, 42' : '248, 250, 252';
    return {
      isCustomized: true,
      isDarkCanvas: isDark,
      layerStyle: bgStyle,
      overlayStyle: {
        backgroundColor:
          variant === 'main'
            ? `rgba(${scrimBase}, ${Math.min(0.75, overlayOpacity * 0.65)})`
            : `rgba(${scrimBase}, ${Math.min(0.85, overlayOpacity * 0.45)})`
      }
    };
  }

  // Preset mode
  const foundPreset = presets.find(p => p.id === config.presetId) || defaultPreset;
  const isGrid = foundPreset.id === 'architectural_grid' || foundPreset.id === 'subtle_blueprint';
  return {
    isCustomized: foundPreset.id !== 'default',
    isDarkCanvas: foundPreset.isDarkSurface,
    layerStyle: {
      backgroundImage: foundPreset.backgroundCss,
      ...(isGrid ? { backgroundSize: '32px 32px, 32px 32px, 100% 100%' } : {})
    },
    overlayStyle: {
      backgroundColor: foundPreset.overlayColor
    }
  };
}

function isHexDark(hex: string): boolean {
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return true;
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance < 0.52;
}
