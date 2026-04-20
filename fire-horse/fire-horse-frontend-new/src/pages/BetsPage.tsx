import { Box, Heading, VStack, Text, SimpleGrid, Card, CardHeader, CardBody, CardFooter, Button, Badge, HStack, useDisclosure } from '@chakra-ui/react';
import { FiFilter, FiDownload } from 'react-icons/fi';

type Bet = {
  id: string;
  event: string;
  user: string;
  amount: number;
  potentialWin: number;
  status: 'pending' | 'won' | 'lost' | 'canceled';
  date: string;
};

export const BetsPage = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  
  // Dados de exemplo
  const bets: Bet[] = [
    {
      id: '1',
      event: 'Brasil x Argentina',
      user: 'João Silva',
      amount: 100,
      potentialWin: 250,
      status: 'pending',
      date: '2023-12-01T20:00:00',
    },
    {
      id: '2',
      event: 'Flamengo x Palmeiras',
      user: 'Maria Santos',
      amount: 50,
      potentialWin: 150,
      status: 'won',
      date: '2023-11-25T21:00:00',
    },
  ];

  const getStatusBadge = (status: Bet['status']) => {
    const statusMap = {
      pending: { label: 'Pendente', color: 'yellow' },
      won: { label: 'Ganhou', color: 'green' },
      lost: { label: 'Perdeu', color: 'red' },
      canceled: { label: 'Cancelada', color: 'gray' },
    };
    
    const { label, color } = statusMap[status];
    
    return (
      <Badge colorScheme={color} variant="subtle">
        {label}
      </Badge>
    );
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <Box>
      <HStack justify="space-between" mb={6}>
        <Box>
          <Heading size="lg">Apostas</Heading>
          <Text color="gray.600">Histórico e gerenciamento de apostas</Text>
        </Box>
        <HStack>
          <Button leftIcon={<FiFilter />} variant="outline">
            Filtrar
          </Button>
          <Button leftIcon={<FiDownload />} colorScheme="blue">
            Exportar
          </Button>
        </HStack>
      </HStack>

      <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
        {bets.map((bet) => (
          <Card key={bet.id} variant="outline" _hover={{ shadow: 'md' }} transition="all 0.2s">
            <CardHeader pb={2}>
              <HStack justify="space-between">
                <Text fontWeight="bold" fontSize="lg">{bet.event}</Text>
                {getStatusBadge(bet.status)}
              </HStack>
              <Text fontSize="sm" color="gray.500">
                {new Date(bet.date).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
            </CardHeader>
            <CardBody py={2}>
              <VStack spacing={2} align="stretch">
                <HStack justify="space-between">
                  <Text>Apostador:</Text>
                  <Text fontWeight="medium">{bet.user}</Text>
                </HStack>
                <HStack justify="space-between">
                  <Text>Valor:</Text>
                  <Text fontWeight="medium">{formatCurrency(bet.amount)}</Text>
                </HStack>
                <HStack justify="space-between">
                  <Text>Ganho potencial:</Text>
                  <Text fontWeight="medium" color="green.500">
                    {formatCurrency(bet.potentialWin)}
                  </Text>
                </HStack>
              </VStack>
            </CardBody>
            <CardFooter pt={2}>
              <Button size="sm" colorScheme="blue" variant="outline" width="full">
                Ver Detalhes
              </Button>
            </CardFooter>
          </Card>
        ))}
      </SimpleGrid>
    </Box>
  );
};
