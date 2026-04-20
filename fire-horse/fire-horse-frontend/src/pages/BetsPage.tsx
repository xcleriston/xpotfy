import { Box, Heading, Text, VStack, HStack, Badge, Table, Thead, Tbody, Tr, Th, Td, Input, InputGroup, InputLeftElement, Select, Button, useDisclosure, IconButton } from '@chakra-ui/react';
import { FiSearch, FiFilter, FiDollarSign, FiClock, FiTrendingUp, FiTrendingDown, FiEye } from 'react-icons/fi';
import { useState } from 'react';

// Dados de exemplo
const bets = [
  {
    id: 'bet-1',
    event: 'Corrida 5 - Grande Prêmio Brasil',
    market: 'Vencedor',
    selection: 'Cavalo dos Ventos',
    odd: 3.50,
    stake: 100.00,
    potentialReturn: 350.00,
    status: 'won',
    placedAt: '2023-06-10T14:30:00',
    settledAt: '2023-06-10T15:45:00'
  },
  {
    id: 'bet-2',
    event: 'Corrida 3 - Copa Verão',
    market: 'Top 3',
    selection: 'Trovão Azul',
    odd: 2.10,
    stake: 50.00,
    potentialReturn: 105.00,
    status: 'lost',
    placedAt: '2023-06-09T11:20:00',
    settledAt: '2023-06-09T12:35:00'
  },
  {
    id: 'bet-3',
    event: 'Corrida 1 - Prêmio Especial',
    market: 'Vencedor',
    selection: 'Flecha Dourada',
    odd: 1.80,
    stake: 75.00,
    potentialReturn: 135.00,
    status: 'pending',
    placedAt: '2023-06-11T09:15:00',
    settledAt: null
  },
  {
    id: 'bet-4',
    event: 'Corrida 7 - Troféu Cidade Maravilhosa',
    market: 'Top 2',
    selection: 'Relâmpago Negro',
    odd: 2.50,
    stake: 120.00,
    potentialReturn: 300.00,
    status: 'won',
    placedAt: '2023-06-08T16:45:00',
    settledAt: '2023-06-08T18:10:00'
  },
];

const BetsPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [marketFilter, setMarketFilter] = useState('all');
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedBet, setSelectedBet] = useState(null);

  const filteredBets = bets.filter(bet => {
    const matchesSearch = 
      bet.event.toLowerCase().includes(searchTerm.toLowerCase()) || 
      bet.selection.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || bet.status === statusFilter;
    const matchesMarket = marketFilter === 'all' || bet.market === marketFilter;
    
    return matchesSearch && matchesStatus && matchesMarket;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'won':
        return <Badge colorScheme="green">Ganhou</Badge>;
      case 'lost':
        return <Badge colorScheme="red">Perdeu</Badge>;
      case 'pending':
        return <Badge colorScheme="yellow">Pendente</Badge>;
      case 'cancelled':
        return <Badge colorScheme="gray">Cancelado</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getProfitLoss = (bet) => {
    if (bet.status === 'won') {
      return {
        amount: bet.potentialReturn - bet.stake,
        isProfit: true
      };
    } else if (bet.status === 'lost') {
      return {
        amount: -bet.stake,
        isProfit: false
      };
    }
    return {
      amount: 0,
      isProfit: false
    };
  };

  // Extrair mercados únicos para o filtro
  const markets = [...new Set(bets.map(bet => bet.market))];

  const handleViewBet = (bet) => {
    setSelectedBet(bet);
    onOpen();
  };

  return (
    <Box>
      <Heading size="lg" mb={6}>
        Histórico de Apostas
      </Heading>
      
      <Box bg="white" p={4} borderRadius="md" boxShadow="sm" mb={6}>
        <HStack spacing={4} mb={4} flexWrap="wrap">
          <InputGroup maxW="400px" mb={{ base: 2, md: 0 }}>
            <InputLeftElement pointerEvents="none">
              <FiSearch color="gray.300" />
            </InputLeftElement>
            <Input 
              placeholder="Buscar apostas..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </InputGroup>
          
          <HStack spacing={2} mb={{ base: 2, md: 0 }}>
            <Text whiteSpace="nowrap" color="gray.500">
              <FiFilter style={{ display: 'inline', marginRight: '4px' }} />
              Filtrar por:
            </Text>
            <Select 
              width="180px"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">Todos os status</option>
              <option value="won">Ganhas</option>
              <option value="lost">Perdidas</option>
              <option value="pending">Pendentes</option>
              <option value="cancelled">Canceladas</option>
            </Select>
            
            <Select 
              width="180px"
              value={marketFilter}
              onChange={(e) => setMarketFilter(e.target.value)}
            >
              <option value="all">Todos os mercados</option>
              {markets.map(market => (
                <option key={market} value={market}>{market}</option>
              ))}
            </Select>
          </HStack>
        </HStack>
        
        <Box overflowX="auto">
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>Evento</Th>
                <Th>Mercado/Seleção</Th>
                <Th>Odd</Th>
                <Th>Valor</Th>
                <Th>Retorno</Th>
                <Th>Status</Th>
                <Th>Resultado</Th>
                <Th>Ações</Th>
              </Tr>
            </Thead>
            <Tbody>
              {filteredBets.map((bet) => {
                const profitLoss = getProfitLoss(bet);
                
                return (
                  <Tr key={bet.id} _hover={{ bg: 'gray.50' }}>
                    <Td maxW="250px" isTruncated>{bet.event}</Td>
                    <Td>
                      <Box>
                        <Text fontWeight="medium">{bet.market}</Text>
                        <Text fontSize="sm" color="gray.500">{bet.selection}</Text>
                      </Box>
                    </Td>
                    <Td fontWeight="bold">{bet.odd.toFixed(2)}</Td>
                    <Td>R$ {bet.stake.toFixed(2)}</Td>
                    <Td>R$ {bet.potentialReturn.toFixed(2)}</Td>
                    <Td>{getStatusBadge(bet.status)}</Td>
                    <Td>
                      {bet.status !== 'pending' && (
                        <HStack color={profitLoss.isProfit ? 'green.500' : 'red.500'}>
                          {profitLoss.isProfit ? <FiTrendingUp /> : <FiTrendingDown />}
                          <Text>R$ {Math.abs(profitLoss.amount).toFixed(2)}</Text>
                        </HStack>
                      )}
                    </Td>
                    <Td>
                      <IconButton 
                        aria-label="Ver detalhes da aposta"
                        icon={<FiEye />} 
                        size="sm"
                        variant="ghost"
                        colorScheme="blue"
                        onClick={() => handleViewBet(bet)}
                      />
                    </Td>
                  </Tr>
                );
              })}
            </Tbody>
          </Table>
        </Box>
      </Box>
      
      {/* Modal de detalhes da aposta */}
      {/* <BetDetailsModal 
        isOpen={isOpen} 
        onClose={onClose} 
        bet={selectedBet} 
      /> */}
    </Box>
  );
};

export default BetsPage;
