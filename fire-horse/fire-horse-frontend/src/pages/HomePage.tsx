import { Box, Heading, Text, SimpleGrid, Card, CardHeader, CardBody, CardFooter, Button, VStack, HStack, Icon, Stat, StatLabel, StatNumber, StatHelpText, StatArrow } from '@chakra-ui/react';
import { FiDollarSign, FiUsers, FiCalendar, FiTrendingUp } from 'react-icons/fi';

const HomePage = () => {
  return (
    <Box>
      <Heading size="lg" mb={6}>
        Painel de Controle
      </Heading>
      
      <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6} mb={8}>
        <StatCard 
          title="Saldo Atual" 
          value="R$ 5.280,50" 
          icon={FiDollarSign} 
          change={12.5}
          isCurrency
        />
        <StatCard 
          title="Total de Usuários" 
          value="1.245" 
          icon={FiUsers}
          change={8.2}
        />
        <StatCard 
          title="Eventos Hoje" 
          value="12" 
          icon={FiCalendar}
          change={-3.1}
        />
        <StatCard 
          title="Lucro Mensal" 
          value="R$ 2.450,75" 
          icon={FiTrendingUp}
          change={24.7}
          isCurrency
        />
      </SimpleGrid>
      
      <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
        <Card>
          <CardHeader>
            <Heading size="md">Últimas Apostas</Heading>
          </CardHeader>
          <CardBody>
            <VStack align="stretch" spacing={4}>
              <BetItem 
                event="Corrida 5 - Hipódromo do Cristal"
                runner="Cavalo dos Ventos"
                amount="R$ 100,00"
                odd="3.50"
                status="Ganhou"
                isWin={true}
              />
              <BetItem 
                event="Corrida 3 - Hipódromo da Gávea"
                runner="Trovão Azul"
                amount="R$ 50,00"
                odd="2.10"
                status="Perdeu"
                isWin={false}
              />
              <BetItem 
                event="Corrida 1 - Jockey Club"
                runner="Flecha Dourada"
                amount="R$ 75,00"
                odd="1.80"
                status="Pendente"
              />
            </VStack>
          </CardBody>
          <CardFooter>
            <Button variant="link" colorScheme="blue">Ver todas as apostas</Button>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader>
            <Heading size="md">Próximos Eventos</Heading>
          </CardHeader>
          <CardBody>
            <VStack align="stretch" spacing={4}>
              <EventItem 
                name="Corrida 7 - Grande Prêmio Brasil"
                venue="Hipódromo do Cristal"
                date="Hoje, 16:30"
                runners={8}
              />
              <EventItem 
                name="Corrida 5 - Copa Verão"
                venue="Jockey Club"
                date="Amanhã, 15:00"
                runners={12}
              />
              <EventItem 
                name="Corrida 3 - Troféu Cidade Maravilhosa"
                venue="Hipódromo da Gávea"
                date="Amanhã, 16:15"
                runners={10}
              />
            </VStack>
          </CardBody>
          <CardFooter>
            <Button variant="link" colorScheme="blue">Ver todos os eventos</Button>
          </CardFooter>
        </Card>
      </SimpleGrid>
    </Box>
  );
};

// Componentes auxiliares
const StatCard = ({ title, value, icon, change, isCurrency = false }) => {
  const isPositive = change >= 0;
  
  return (
    <Card>
      <CardBody>
        <HStack justify="space-between">
          <Box>
            <Text fontSize="sm" color="gray.500" mb={1}>
              {title}
            </Text>
            <Stat>
              <StatNumber fontSize="xl">
                {isCurrency ? value : new Intl.NumberFormat().format(value)}
              </StatNumber>
              {change && (
                <StatHelpText mb={0}>
                  <StatArrow type={isPositive ? 'increase' : 'decrease'} />
                  {Math.abs(change)}%
                  <Text as="span" fontSize="xs" color="gray.500" ml={1}>
                    vs último mês
                  </Text>
                </StatHelpText>
              )}
            </Stat>
          </Box>
          <Icon as={icon} boxSize={8} color="brand.500" opacity={0.8} />
        </HStack>
      </CardBody>
    </Card>
  );
};

const BetItem = ({ event, runner, amount, odd, status, isWin }) => {
  const statusColor = 
    status === 'Ganhou' ? 'green.500' : 
    status === 'Perdeu' ? 'red.500' : 'yellow.500';
  
  return (
    <Box 
      p={3} 
      borderWidth="1px" 
      borderRadius="md"
      borderLeftWidth="4px"
      borderLeftColor={isWin === undefined ? 'yellow.500' : isWin ? 'green.500' : 'red.500'}
    >
      <Text fontWeight="medium" noOfLines={1}>{event}</Text>
      <HStack justify="space-between" mt={1}>
        <Text fontSize="sm" color="gray.500">{runner}</Text>
        <Text fontSize="sm" fontWeight="medium">{amount}</Text>
      </HStack>
      <HStack justify="space-between" mt={2}>
        <Text fontSize="sm">
          Odd: <Text as="span" fontWeight="medium">{odd}</Text>
        </Text>
        <Text fontSize="sm" color={statusColor} fontWeight="medium">
          {status}
        </Text>
      </HStack>
    </Box>
  );
};

const EventItem = ({ name, venue, date, runners }) => {
  return (
    <Box p={3} borderWidth="1px" borderRadius="md">
      <Text fontWeight="medium" noOfLines={1}>{name}</Text>
      <HStack spacing={4} mt={1} color="gray.500" fontSize="sm">
        <HStack spacing={1}>
          <Icon as={FiCalendar} />
          <Text>{date}</Text>
        </HStack>
        <Text>•</Text>
        <Text>{venue}</Text>
      </HStack>
      <HStack mt={2} spacing={2}>
        <Box 
          px={2} 
          py={1} 
          bg="brand.50" 
          color="brand.600" 
          borderRadius="full" 
          fontSize="xs"
          fontWeight="medium"
        >
          {runners} cavalos
        </Box>
      </HStack>
    </Box>
  );
};

export default HomePage;
