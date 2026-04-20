import { Box, Flex, IconButton, useColorMode, useColorModeValue, Text, HStack, Avatar, Menu, MenuButton, MenuList, MenuItem } from '@chakra-ui/react';
import { FiMenu, FiMoon, FiSun, FiBell, FiUser, FiLogOut } from 'react-icons/fi';

type NavbarProps = {
  onToggleSidebar: () => void;
};

export const Navbar = ({ onToggleSidebar }: NavbarProps) => {
  const { colorMode, toggleColorMode } = useColorMode();
  const bg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  return (
    <Box 
      bg={bg}
      px={4}
      borderBottomWidth="1px"
      borderColor={borderColor}
      position="fixed"
      top={0}
      left={0}
      right={0}
      zIndex="sticky"
      height="60px"
    >
      <Flex h={16} alignItems="center" justifyContent="space-between">
        <HStack spacing={4}>
          <IconButton
            icon={<FiMenu />}
            variant="ghost"
            onClick={onToggleSidebar}
            aria-label="Abrir menu"
          />
          <Text fontWeight="bold" fontSize="xl">Fire Horse</Text>
        </HStack>

        <HStack spacing={4}>
          <IconButton
            icon={colorMode === 'light' ? <FiMoon /> : <FiSun />}
            onClick={toggleColorMode}
            variant="ghost"
            aria-label="Alternar tema"
          />
          
          <IconButton
            icon={<FiBell />}
            variant="ghost"
            aria-label="Notificações"
            position="relative"
          >
            <Box
              position="absolute"
              top={1}
              right={1}
              w={2}
              h={2}
              bg="red.500"
              borderRadius="full"
            />
          </IconButton>
          
          <Menu>
            <MenuButton>
              <Avatar size="sm" cursor="pointer" name="Usuário" />
            </MenuButton>
            <MenuList>
              <MenuItem icon={<FiUser />}>Meu Perfil</MenuItem>
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
