import { Box, Button, Heading, Text, VStack } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';

export const NotFoundPage = () => {
  const navigate = useNavigate();
  
  return (
    <Box textAlign="center" py={10} px={6}>
      <Heading
        display="inline-block"
        as="h1"
        size="4xl"
        bgGradient="linear(to-r, blue.400, blue.600)"
        backgroundClip="text">
        404
      </Heading>
      <Text fontSize="18px" mt={3} mb={2}>
        Página não encontrada
      </Text>
      <Text color={'gray.500'} mb={6}>
        A página que você está procurando não existe ou foi movida.
      </Text>

      <VStack spacing={4} mt={8}>
        <Button
          leftIcon={<FiArrowLeft />}
          colorScheme="blue"
          variant="outline"
          onClick={() => navigate(-1)}
        >
          Voltar
        </Button>
        <Button
          colorScheme="blue"
          variant="solid"
          onClick={() => navigate('/')}
        >
          Ir para a Página Inicial
        </Button>
      </VStack>
    </Box>
  );
};
