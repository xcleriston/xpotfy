import { Box, BoxProps, useColorModeValue } from '@chakra-ui/react';

type CardProps = BoxProps & {
  children: React.ReactNode;
};

export const Card = ({ children, ...rest }: CardProps) => {
  const bg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  
  return (
    <Box
      bg={bg}
      borderRadius="lg"
      borderWidth="1px"
      borderColor={borderColor}
      p={6}
      shadow="sm"
      _hover={{ shadow: 'md' }}
      transition="all 0.2s"
      {...rest}
    >
      {children}
    </Box>
  );
};
