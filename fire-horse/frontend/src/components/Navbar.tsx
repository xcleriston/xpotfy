import { Box, Flex, IconButton, useColorMode, useColorModeValue, Text, HStack, Avatar, Menu, MenuButton, MenuList, MenuItem, useDisclosure } from '@chakra-ui/react';
import { FiMenu, FiMoon, FiSun, FiBell, FiUser, FiLogOut } from 'react-icons/fi';

type NavbarProps = {
  onToggleSidebar: () => void;
};

const Navbar = ({ onToggleSidebar }: NavbarProps) => {
  const { colorMode, toggleColorMode } = useColorMode();
  const bg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const { isOpen, onOpen, onClose } = useDisclosure();

  return (
    <Box
      as="header"
      position="fixed"
      top={0}
      left={0}
      right={0}
      zIndex={10}
      bg={bg}
      borderBottomWidth="1px"
      borderBottomColor={borderColor}
      px={4}
      height="60px"
    >
      <Flex h={16} alignItems="center" justifyContent="space-between">
        <HStack spacing={4}>
          <IconButton
            icon={<FiMenu />}
            variant="ghost"
            aria-label="Abrir menu"
            onClick={onToggleSidebar}
          />
          <Text fontSize="xl" fontWeight="bold" color="brand.500">
            Fire Horse
          </Text>
        </HStack>

        <HStack spacing={4}>
          <IconButton
            icon={colorMode === 'light' ? <FiMoon /> : <FiSun />}
            variant="ghost"
            aria-label="Alternar tema"
            onClick={toggleColorMode}
          />
          
          <IconButton
            icon={<FiBell />}
            variant="ghost"
            aria-label="Notificações"
          />
          
          <Menu isOpen={isOpen} onClose={onClose}>
            <MenuButton
              as={IconButton}
              variant="ghost"
              rounded="full"
              onMouseEnter={onOpen}
              onMouseLeave={onClose}
            >
              <Avatar size="sm" name="Usuário" />
            </MenuButton>
            <MenuList onMouseEnter={onOpen} onMouseLeave={onClose}>
              <MenuItem icon={<FiUser />}>Perfil</MenuItem>
              <MenuItem icon={<FiLogOut />} color="red.500">
                Sair
              </MenuItem>
            </MenuList>
          </Menu>
        </HStack>
      </Flex>
    </Box>
  );
};

export default Navbar;
