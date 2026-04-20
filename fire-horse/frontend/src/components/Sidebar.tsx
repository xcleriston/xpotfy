import { Box, VStack, Flex, Text, Icon, Link, useColorModeValue } from '@chakra-ui/react';
import { NavLink as RouterLink, useLocation } from 'react-router-dom';
import { FiHome, FiUsers, FiCalendar, FiDollarSign, FiSettings } from 'react-icons/fi';

type RouteType = {
  path: string;
  name: string;
  icon: React.ElementType;
};

type SidebarProps = {
  isOpen: boolean;
  routes: RouteType[];
};

const Sidebar = ({ isOpen, routes }: SidebarProps) => {
  const location = useLocation();
  const bg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const activeBg = useColorModeValue('brand.50', 'brand.900');
  const activeColor = useColorModeValue('brand.600', 'brand.200');
  const hoverBg = useColorModeValue('gray.100', 'gray.700');

  return (
    <Box
      as="aside"
      position="fixed"
      left={0}
      top="60px"
      bottom={0}
      zIndex={5}
      w={{ base: isOpen ? '250px' : '80px', md: isOpen ? '250px' : '80px' }}
      bg={bg}
      borderRightWidth="1px"
      borderRightColor={borderColor}
      transition="width 0.3s ease"
      overflowX="hidden"
      overflowY="auto"
    >
      <VStack spacing={1} p={2} align="stretch">
        {routes.map(({ path, name, icon: Icon }) => {
          const isActive = location.pathname === path;
          
          return (
            <Link
              key={path}
              as={RouterLink}
              to={path}
              display="flex"
              alignItems="center"
              p={3}
              borderRadius="md"
              bg={isActive ? activeBg : 'transparent'}
              color={isActive ? activeColor : 'inherit'}
              _hover={{
                textDecoration: 'none',
                bg: isActive ? activeBg : hoverBg,
              }}
              transition="all 0.2s"
            >
              <Icon size={20} />
              {(isOpen || window.innerWidth >= 768) && (
                <Text ml={3} display={{ base: isOpen ? 'block' : 'none', md: 'block' }}>
                  {name}
                </Text>
              )}
            </Link>
          );
        })}
      </VStack>
    </Box>
  );
};

export default Sidebar;
