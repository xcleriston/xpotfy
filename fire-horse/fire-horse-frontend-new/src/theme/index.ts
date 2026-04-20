import { extendTheme, type ThemeConfig } from '@chakra-ui/react';
import { mode } from '@chakra-ui/theme-tools';

// Configuração do tema
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
    400: '#1a9cff',
    500: '#0080ff',
    600: '#0066cc',
    700: '#004d99',
    800: '#003366',
    900: '#001a33',
  },
  success: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e',
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#14532d',
  },
  warning: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
  },
  error: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d',
  },
};

// Estilos globais
const styles = {
  global: (props: any) => ({
    body: {
      bg: mode('gray.50', 'gray.900')(props),
      color: mode('gray.800', 'whiteAlpha.900')(props),
      fontFeatureSettings: '"cv02", "cv03", "cv04", "cv11"',
    },
  }),
};

// Tipografia
const fonts = {
  heading: `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif`,
  body: `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif`,
  mono: `'Fira Code', 'Fira Mono', 'Menlo', 'Monaco', 'Consolas', 'Courier New', monospace`,
};

// Tamanhos de fonte
const fontSizes = {
  xs: '0.75rem',
  sm: '0.875rem',
  md: '1rem',
  lg: '1.125rem',
  xl: '1.25rem',
  '2xl': '1.5rem',
  '3xl': '1.875rem',
  '4xl': '2.25rem',
  '5xl': '3rem',
  '6xl': '3.75rem',
};

// Espaçamentos
const space = {
  px: '1px',
  0.5: '0.125rem',
  1: '0.25rem',
  1.5: '0.375rem',
  2: '0.5rem',
  2.5: '0.625rem',
  3: '0.75rem',
  3.5: '0.875rem',
  4: '1rem',
  5: '1.25rem',
  6: '1.5rem',
  7: '1.75rem',
  8: '2rem',
  9: '2.25rem',
  10: '2.5rem',
  12: '3rem',
  14: '3.5rem',
  16: '4rem',
  20: '5rem',
  24: '6rem',
  28: '7rem',
  32: '8rem',
  36: '9rem',
  40: '10rem',
  44: '11rem',
  48: '12rem',
  52: '13rem',
  56: '14rem',
  60: '15rem',
  64: '16rem',
  72: '18rem',
  80: '20rem',
  96: '24rem',
};

// Tamanhos
const sizes = {
  ...space,
  max: 'max-content',
  min: 'min-content',
  full: '100%',
  '3xs': '14rem',
  '2xs': '16rem',
  xs: '20rem',
  sm: '24rem',
  md: '28rem',
  lg: '32rem',
  xl: '36rem',
  '2xl': '42rem',
  '3xl': '48rem',
  '4xl': '56rem',
  '5xl': '64rem',
  '6xl': '72rem',
  '7xl': '80rem',
  '8xl': '90rem',
  container: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },
};

// Bordas arredondadas
const radii = {
  none: '0',
  sm: '0.125rem',
  base: '0.25rem',
  md: '0.375rem',
  lg: '0.5rem',
  xl: '0.75rem',
  '2xl': '1rem',
  '3xl': '1.5rem',
  full: '9999px',
};

// Sombras
const shadows = {
  xs: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  sm: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)', 
  base: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  md: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  lg: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  xl: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 #0000',
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
  outline: '0 0 0 3px rgba(66, 153, 225, 0.6)',
  none: 'none',
};

// Z-index
const zIndices = {
  hide: -1,
  auto: 'auto',
  base: 0,
  docked: 10,
  dropdown: 1000,
  sticky: 1100,
  banner: 1200,
  overlay: 1300,
  modal: 1400,
  popover: 1500,
  skipLink: 1600,
  toast: 1700,
  tooltip: 1800,
};

// Componentes personalizados
const components = {
  Button: {
    baseStyle: {
      fontWeight: 'medium',
      borderRadius: 'md',
      _focus: {
        boxShadow: 'outline',
      },
    },
    sizes: {
      lg: {
        h: 12,
        minW: 12,
        fontSize: 'lg',
        px: 6,
      },
      md: {
        h: 10,
        minW: 10,
        fontSize: 'md',
        px: 4,
      },
      sm: {
        h: 8,
        minW: 8,
        fontSize: 'sm',
        px: 3,
      },
      xs: {
        h: 6,
        minW: 6,
        fontSize: 'xs',
        px: 2,
      },
    },
    variants: {
      solid: (props: any) => ({
        bg: 'brand.500',
        color: 'white',
        _hover: {
          bg: 'brand.600',
          _disabled: {
            bg: 'brand.500',
          },
        },
        _active: { bg: 'brand.700' },
      }),
      outline: (props: any) => ({
        border: '2px solid',
        borderColor: 'brand.500',
        color: 'brand.500',
        _hover: {
          bg: 'brand.50',
        },
        _active: {
          bg: 'brand.100',
        },
      }),
      ghost: (props: any) => ({
        color: 'brand.500',
        _hover: {
          bg: 'brand.50',
        },
        _active: {
          bg: 'brand.100',
        },
      }),
      link: (props: any) => ({
        color: 'brand.500',
        _hover: {
          textDecoration: 'none',
          color: 'brand.600',
        },
        _active: {
          color: 'brand.700',
        },
      }),
    },
    defaultProps: {
      size: 'md',
      variant: 'solid',
      colorScheme: 'brand',
    },
  },
  Input: {
    baseStyle: {
      field: {
        _focus: {
          borderColor: 'brand.500',
          boxShadow: '0 0 0 1px var(--chakra-colors-brand-500)',
        },
      },
    },
    variants: {
      outline: (props: any) => ({
        field: {
          border: '1px solid',
          borderColor: 'inherit',
          bg: 'inherit',
          _hover: {
            borderColor: 'gray.300',
          },
          _readOnly: {
            boxShadow: 'none !important',
            userSelect: 'all',
          },
          _disabled: {
            opacity: 0.4,
            cursor: 'not-allowed',
          },
          _invalid: {
            borderColor: 'red.500',
            boxShadow: '0 0 0 1px var(--chakra-colors-red-500)',
          },
          _focus: {
            zIndex: 1,
            borderColor: 'brand.500',
            boxShadow: '0 0 0 1px var(--chakra-colors-brand-500)',
          },
        },
      }),
    },
    defaultProps: {
      size: 'md',
      variant: 'outline',
    },
  },
  Textarea: {
    variants: {
      outline: (props: any) => ({
        _focus: {
          borderColor: 'brand.500',
          boxShadow: '0 0 0 1px var(--chakra-colors-brand-500)',
        },
      }),
    },
  },
  Select: {
    variants: {
      outline: (props: any) => ({
        field: {
          _focus: {
            borderColor: 'brand.500',
            boxShadow: '0 0 0 1px var(--chakra-colors-brand-500)', 
          },
        },
      }),
    },
  },
  Checkbox: {
    baseStyle: {
      control: {
        _checked: {
          bg: 'brand.500',
          borderColor: 'brand.500',
          color: 'white',
          _hover: {
            bg: 'brand.600',
            borderColor: 'brand.600',
          },
        },
      },
    },
  },
  Radio: {
    baseStyle: {
      control: {
        _checked: {
          _before: {
            bg: 'white',
          },
          bg: 'brand.500',
          borderColor: 'brand.500',
          _hover: {
            bg: 'brand.600',
            borderColor: 'brand.600',
          },
        },
      },
    },
  },
  Switch: {
    baseStyle: {
      track: {
        _checked: {
          bg: 'brand.500',
        },
      },
    },
  },
  Menu: {
    baseStyle: (props: any) => ({
      button: {
        _hover: {
          bg: mode('gray.100', 'whiteAlpha.200')(props),
        },
        _active: {
          bg: mode('gray.200', 'whiteAlpha.300')(props),
        },
      },
    }),
  },
  Modal: {
    baseStyle: (props: any) => ({
      dialog: {
        bg: mode('white', 'gray.800')(props),
      },
    }),
  },
  Tooltip: {
    baseStyle: (props: any) => ({
      bg: mode('gray.800', 'gray.200')(props),
      color: mode('white', 'gray.800')(props),
    }),
  },
};

// Configuração do tema
const theme = extendTheme({
  config,
  colors,
  fonts,
  fontSizes,
  space,
  sizes,
  radii,
  shadows,
  zIndices,
  styles,
  components,
  // Outras personalizações podem ser adicionadas aqui
});

export default theme;
