import { Box, Container, Heading, Text, VStack, useColorMode } from '@chakra-ui/react';
import { Routes, Route, Link } from 'react-router-dom';
import { FiHome, FiUsers, FiCalendar, FiDollarSign, FiSettings } from 'react-icons/fi';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import HomePage from './pages/HomePage';
import UsersPage from './pages/UsersPage';
import EventsPage from './pages/EventsPage';
import BetsPage from './pages/BetsPage';
import SettingsPage from './pages/SettingsPage';
import { useState } from 'react';

// Tipos para as rotas
type RouteType = {
  path: string;
  name: string;
  icon: React.ElementType;
  component: React.ComponentType;
};

// Configuração das rotas
const routes: RouteType[] = [
  { path: '/', name: 'Início', icon: FiHome, component: HomePage },
  { path: '/users', name: 'Usuários', icon: FiUsers, component: UsersPage },
  { path: '/events', name: 'Eventos', icon: FiCalendar, component: EventsPage },
  { path: '/bets', name: 'Apostas', icon: FiDollarSign, component: BetsPage },
  { path: '/settings', name: 'Configurações', icon: FiSettings, component: SettingsPage },
];

function App() {
  const { colorMode } = useColorMode();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <Box minH="100vh" bg={colorMode === 'dark' ? 'gray.900' : 'gray.50'}>
      <Navbar onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
      
      <Box display="flex" pt="60px">
        <Sidebar isOpen={isSidebarOpen} routes={routes} />
        
        <Box 
          as="main" 
          flexGrow={1} 
          p={4} 
          ml={{ base: 0, md: isSidebarOpen ? '250px' : '80px' }}
          transition="margin-left 0.3s ease"
        >
          <Container maxW="container.xl">
            <Routes>
              {routes.map(({ path, component: Component }) => (
                <Route key={path} path={path} element={<Component />} />
              ))}
            </Routes>
          </Container>
        </Box>
      </Box>
    </Box>
  );
}

export default App;
