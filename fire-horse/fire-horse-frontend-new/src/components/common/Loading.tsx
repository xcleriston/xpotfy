import { Flex, Spinner } from '@chakra-ui/react';

type LoadingProps = {
  size?: string;
  color?: string;
  fullScreen?: boolean;
};

export const Loading = ({ 
  size = 'xl', 
  color = 'blue.500',
  fullScreen = false 
}: LoadingProps) => {
  return (
    <Flex
      justify="center"
      align="center"
      width={fullScreen ? '100vw' : '100%'}
      height={fullScreen ? '100vh' : '100%'}
      position={fullScreen ? 'fixed' : 'relative'}
      top={0}
      left={0}
      zIndex={fullScreen ? 'overlay' : 'auto'}
      bg={fullScreen ? 'rgba(0, 0, 0, 0.4)' : 'transparent'}
    >
      <Spinner
        thickness="4px"
        speed="0.65s"
        emptyColor="gray.200"
        color={color}
        size={size}
      />
    </Flex>
  );
};
