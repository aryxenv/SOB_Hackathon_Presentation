const FONT_KEY = 'sob_font_preference';

export interface FontOption {
  id: string;
  label: string;
  family: string;
}

export const FONT_OPTIONS: FontOption[] = [
  {
    id: 'segoe',
    label: 'Segoe UI',
    family: "'Segoe UI', system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
  },
];

const DEFAULT_FONT_ID = 'segoe';

function getFontById(id: string): FontOption {
  return FONT_OPTIONS.find((font) => font.id === id) ?? FONT_OPTIONS[0];
}

export function getPreferredFontId(): string {
  return DEFAULT_FONT_ID;
}

export function applyPreferredFont(fontId: string): void {
  if (typeof document === 'undefined') return;
  const font = getFontById(fontId);
  const root = document.documentElement;
  root.style.setProperty('--font-body', font.family);
  root.style.setProperty('--font-display', font.family);
}

export function setPreferredFont(fontId: string): void {
  const nextId = FONT_OPTIONS.some((font) => font.id === fontId) ? fontId : DEFAULT_FONT_ID;
  if (typeof window !== 'undefined') {
    localStorage.setItem(FONT_KEY, nextId);
  }
  applyPreferredFont(nextId);
}

export function initializePreferredFont(): void {
  applyPreferredFont(getPreferredFontId());
}
