import { Outlet } from 'react-router-dom';
import { ProfileButton } from './ProfileButton';
import { useI18n } from '../i18n/I18nContext';
import { LOCALES } from '../i18n/translations';
import type { Locale } from '../types';
import logoSOBBlack from '../assets/logo-sob-black.png';
import './Layout.css';

export function Layout() {
  const { t, locale, setLocale } = useI18n();

  return (
    <div className="app-shell">
      <header className="site-header">
        <div className="header-top">
          <div className="brand" aria-label={t('app.name')}>
            <img className="brand-logo" src={logoSOBBlack} alt={t('app.name')} />
          </div>
          <div className="header-actions">
            <ProfileButton />
            <div className="lang-switch" role="group" aria-label="Language">
              {LOCALES.map(({ code, label }) => (
                <button
                  key={code}
                  type="button"
                  className={locale === code ? 'lang-btn active' : 'lang-btn'}
                  onClick={() => setLocale(code as Locale)}
                  aria-pressed={locale === code}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      <main className="site-main">
        <Outlet />
      </main>
    </div>
  );
}
