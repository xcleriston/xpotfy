import { Box, useDisclosure } from '@chakra-ui/react';
import { ReactNode, useState } from 'react';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';

type LayoutProps = {
  children: ReactNode;
};

export const Layout = ({ children }: LayoutProps) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const { onClose } = useDisclosure();

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <Box minH="100vh" bg="gray.50" _dark={{ bg: 'gray.900' }}>
      <Navbar onToggleSidebar={toggleSidebar} />
      <Sidebar isOpen={isSidebarOpen} />
      <Box
        ml={{ base: 0, md: isSidebarOpen ? '250px' : '70px' }}
        mt="60px"
        p={4}
        transition="margin-left 0.3s ease"
      >
        {children}
      </Box>
    </Box>
  );
};
