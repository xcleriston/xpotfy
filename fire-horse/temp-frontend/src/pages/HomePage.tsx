import { Box, Heading, Text, VStack } from '@chakra-ui/react';
import { Card } from '../components';

export const HomePage = () => {
  return (
    <Box>
      <VStack spacing={6} align="stretch">
        <Box>
          <Heading size="lg" mb={2}>Bem-vindo ao Fire Horse</Heading>
          <Text color="gray.600">Sistema de gerenciamento de apostas</Text>
        </Box>

        <Card>
          <VStack spacing={4} align="stretch">
            <Heading size="md">Visão Geral</Heading>
            <Text>Resumo das apostas, eventos e usuários ativos serão exibidos aqui.</Text>
          </VStack>
        </Card>
      </VStack>
    </Box>
  );
};
