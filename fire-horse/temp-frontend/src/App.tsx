import { Routes, Route } from 'react-router-dom';
import { Layout } from './components';

// Páginas
import { HomePage } from './pages/HomePage';
import { UsersPage } from './pages/UsersPage';
import { EventsPage } from './pages/EventsPage';
import { BetsPage } from './pages/BetsPage';
import { SettingsPage } from './pages/SettingsPage';
import { NotFoundPage } from './pages/NotFoundPage';

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/usuarios" element={<UsersPage />} />
        <Route path="/eventos" element={<EventsPage />} />
        <Route path="/apostas" element={<BetsPage />} />
        <Route path="/configuracoes" element={<SettingsPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Layout>
  );
}

export default App;
