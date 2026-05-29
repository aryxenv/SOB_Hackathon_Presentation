import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { I18nProvider } from './i18n/I18nContext';
import { ExchangeShopPage } from './pages/ExchangeShopPage';

export default function App() {
  return (
    <I18nProvider>
      <HashRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<ExchangeShopPage />} />
            <Route path="exchange-shop" element={<ExchangeShopPage />} />
            <Route path="fan-wall" element={<Navigate to="/" replace />} />
            <Route path="players" element={<Navigate to="/" replace />} />
            <Route path="donate" element={<Navigate to="/" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </HashRouter>
    </I18nProvider>
  );
}
