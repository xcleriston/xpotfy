import { Box, VStack, Icon, Text, Flex, useColorModeValue } from '@chakra-ui/react';
import { FiHome, FiUsers, FiCalendar, FiDollarSign, FiSettings } from 'react-icons/fi';
import { NavLink } from 'react-router-dom';

type SidebarItemProps = {
  icon: any;
  to: string;
  children: React.ReactNode;
};

const SidebarItem = ({ icon, to, children }: SidebarItemProps) => {
  const activeBg = useColorModeValue('blue.50', 'blue.900');
  const activeColor = useColorModeValue('blue.700', 'blue.200');
  const hoverBg = useColorModeValue('gray.100', 'gray.700');
  
  return (
    <NavLink to={to} style={{ width: '100%' }}>
      {({ isActive }) => (
        <Flex
          align="center"
          px={4}
          py={3}
          mx={2}
          borderRadius="md"
          cursor="pointer"
          bg={isActive ? activeBg : 'transparent'}
          color={isActive ? activeColor : 'inherit'}
          _hover={{
            bg: isActive ? activeBg : hoverBg,
          }}
          transition="all 0.2s"
        >
          <Icon as={icon} mr={3} />
          <Text fontWeight="medium">{children}</Text>
        </Flex>
      )}
    </NavLink>
  );
};

type SidebarProps = {
  isOpen: boolean;
};

export const Sidebar = ({ isOpen }: SidebarProps) => {
  const bg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  
  return (
    <Box
      as="aside"
      position="fixed"
      left={0}
      top="60px"
      bottom={0}
      w={{ base: '250px', md: isOpen ? '250px' : '70px' }}
      bg={bg}
      borderRightWidth="1px"
      borderColor={borderColor}
      transition="width 0.3s ease"
      overflowY="auto"
      zIndex="docked"
      display={{ base: isOpen ? 'block' : 'none', md: 'block' }}
    >
      <VStack spacing={1} py={4} align="stretch">
        <SidebarItem icon={FiHome} to="/">
          Início
        </SidebarItem>
        <SidebarItem icon={FiUsers} to="/usuarios">
          Usuários
        </SidebarItem>
        <SidebarItem icon={FiCalendar} to="/eventos">
          Eventos
        </SidebarItem>
        <SidebarItem icon={FiDollarSign} to="/apostas">
          Apostas
        </SidebarItem>
        <SidebarItem icon={FiSettings} to="/configuracoes">
          Configurações
        </SidebarItem>
      </VStack>
    </Box>
  );
};
