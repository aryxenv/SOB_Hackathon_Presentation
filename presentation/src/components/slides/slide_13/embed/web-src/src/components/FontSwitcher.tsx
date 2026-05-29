import { useState } from 'react';
import { useI18n } from '../i18n/I18nContext';
import {
  FONT_OPTIONS,
  getPreferredFontId,
  setPreferredFont,
} from '../lib/fontPreference';
import './FontSwitcher.css';

export function FontSwitcher() {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [fontId, setFontId] = useState(getPreferredFontId());

  const handleFontChange = (value: string) => {
    setFontId(value);
    setPreferredFont(value);
  };

  return (
    <div className="font-switcher">
      <button type="button" className="font-switcher-btn" onClick={() => setOpen((v) => !v)}>
        {t('font.changeButton')}
      </button>
      {open && (
        <label className="font-switcher-select-wrap">
          <span>{t('font.selectLabel')}</span>
          <select value={fontId} onChange={(e) => handleFontChange(e.target.value)}>
            {FONT_OPTIONS.map((font) => (
              <option key={font.id} value={font.id}>
                {font.label}
              </option>
            ))}
          </select>
        </label>
      )}
    </div>
  );
}
