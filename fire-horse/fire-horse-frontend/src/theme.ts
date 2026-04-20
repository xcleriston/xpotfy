import { extendTheme, type ThemeConfig } from '@chakra-ui/react';

// Configuração do tema claro/escuro
const config: ThemeConfig = {
  initialColorMode: 'light',
  useSystemColorMode: false,
};

// Cores personalizadas
const colors = {
  brand: {
    50: '#e6f7ff',
    100: '#b3e0ff',
    200: '#80caff',
    300: '#4db3ff',
    400: '#1a9dff',
    500: '#0084ff',
    600: '#0066cc',
    700: '#004d99',
    800: '#003366',
    900: '#001a33',
  },
};

// Estilos globais
const styles = {
  global: {
    'html, body': {
      fontFamily: '"Roboto", sans-serif',
      backgroundColor: 'gray.50',
    },
    a: {
      _hover: {
        textDecoration: 'none',
      },
    },
  },
};

// Componentes personalizados
const components = {
  Button: {
    baseStyle: {
      fontWeight: 'medium',
      borderRadius: 'md',
    },
    variants: {
      solid: (props: any) => ({
        bg: props.colorMode === 'dark' ? 'brand.400' : 'brand.500',
        color: 'white',
        _hover: {
          bg: props.colorMode === 'dark' ? 'brand.300' : 'brand.600',
        },
      }),
    },
  },
};

const theme = extendTheme({
  config,
  colors,
  styles,
  components,
});

export default theme;
