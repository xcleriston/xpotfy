import { Box, Button, Heading, Text, VStack, useColorMode } from '@chakra-ui/react';
import { useState } from 'react';

function App() {
  const { colorMode, toggleColorMode } = useColorMode();
  const [count, setCount] = useState(0);

  return (
    <Box minH="100vh" p={8} bg={colorMode === 'dark' ? 'gray.900' : 'gray.50'}>
      <VStack spacing={6} align="center">
        <Heading>Fire Horse</Heading>
        <Text>Bem-vindo ao sistema de apostas</Text>
        
        <Box p={6} bg={colorMode === 'dark' ? 'gray.800' : 'white'} rounded="lg" shadow="md" w="100%" maxW="md">
          <Text fontSize="xl" mb={4}>Contador: {count}</Text>
          <Button 
            colorScheme="blue" 
            onClick={() => setCount(count + 1)}
            mb={4}
            w="100%"
          >
            Incrementar
          </Button>
          
          <Button 
            colorScheme="teal" 
            variant="outline"
            onClick={toggleColorMode}
            w="100%"
          >
            Alternar para modo {colorMode === 'light' ? 'escuro' : 'claro'}
          </Button>
        </Box>
      </VStack>
    </Box>
  );
}

export default App;
