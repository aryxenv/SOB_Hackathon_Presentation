import { useState } from 'react';
import { useIsLoggedIn, useProfileIdentity } from '../hooks/useProfile';
import { sessionInitials, setUserSession } from '../lib/session';
import { useI18n } from '../i18n/I18nContext';
import { ProfileModal } from './ProfileModal';
import './ProfileButton.css';

export function ProfileButton() {
  const { t } = useI18n();
  const isLoggedIn = useIsLoggedIn();
  const identity = useProfileIdentity();
  const [open, setOpen] = useState(false);

  const label = isLoggedIn && identity ? identity.name : t('profile.login');
  const initials = isLoggedIn && identity ? sessionInitials(identity.name) : null;
  const openProfile = () => {
    if (!isLoggedIn) {
      setUserSession({
        name: 'Supporter #719',
        email: 'supporter@sob.local',
        provider: 'email',
      });
    }
    setOpen(true);
  };

  return (
    <>
      <button
        type="button"
        className={`profile-btn ${isLoggedIn ? 'signed-in' : ''}`}
        onClick={openProfile}
        aria-label={label}
        title={label}
      >
        <span className="profile-avatar" aria-hidden>
          {initials ?? (
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
              <path d="M12 12c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm0 2c-3.33 0-10 1.67-10 5v1h20v-1c0-3.33-6.67-5-10-5z" />
            </svg>
          )}
        </span>
        <span className="profile-btn-label">{isLoggedIn ? initials : '#719'}</span>
      </button>

      {open && <ProfileModal onClose={() => setOpen(false)} />}
    </>
  );
}
