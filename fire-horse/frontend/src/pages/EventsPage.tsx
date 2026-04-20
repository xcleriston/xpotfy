import { Box, Heading, Text, Button, useDisclosure, VStack, HStack, Badge, Table, Thead, Tbody, Tr, Th, Td, Input, InputGroup, InputLeftElement, Select, IconButton } from '@chakra-ui/react';
import { FiPlus, FiSearch, FiFilter, FiCalendar, FiMapPin, FiUsers, FiDollarSign, FiEdit2, FiTrash2, FiEye } from 'react-icons/fi';
import { useState } from 'react';
import EventModal from '../components/EventModal';

// Dados de exemplo
const events = [
  {
    id: 'event-1',
    name: 'Corrida 5 - Grande Prêmio Brasil',
    venue: 'Hipódromo do Cristal',
    date: '2023-06-15T16:30:00',
    status: 'scheduled',
    marketCount: 8,
    country: 'BR',
    eventType: 'Horse Racing'
  },
  {
    id: 'event-2',
    name: 'Corrida 3 - Copa Verão',
    venue: 'Jockey Club',
    date: '2023-06-16T15:00:00',
    status: 'scheduled',
    marketCount: 6,
    country: 'BR',
    eventType: 'Horse Racing'
  },
  {
    id: 'event-3',
    name: 'Corrida 7 - Troféu Cidade Maravilhosa',
    venue: 'Hipódromo da Gávea',
    date: '2023-06-10T14:15:00',
    status: 'completed',
    marketCount: 10,
    country: 'BR',
    eventType: 'Horse Racing'
  },
  {
    id: 'event-4',
    name: 'Corrida 1 - Prêmio Especial',
    venue: 'Hipódromo do Cristal',
    date: '2023-06-18T13:45:00',
    status: 'scheduled',
    marketCount: 7,
    country: 'BR',
    eventType: 'Horse Racing'
  },
];

const EventsPage = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [venueFilter, setVenueFilter] = useState('all');

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         event.venue.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || event.status === statusFilter;
    const matchesVenue = venueFilter === 'all' || event.venue === venueFilter;
    
    return matchesSearch && matchesStatus && matchesVenue;
  });

  const handleEdit = (event) => {
    setSelectedEvent(event);
    onOpen();
  };

  const handleAddNew = () => {
    setSelectedEvent(null);
    onOpen();
  };

  const handleSave = (eventData) => {
    console.log('Salvar evento:', eventData);
    onClose();
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'scheduled':
        return <Badge colorScheme="blue">Agendado</Badge>;
      case 'in_progress':
        return <Badge colorScheme="green">Em Andamento</Badge>;
      case 'completed':
        return <Badge colorScheme="gray">Concluído</Badge>;
      case 'cancelled':
        return <Badge colorScheme="red">Cancelado</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  // Extrair locais únicos para o filtro
  const venues = [...new Set(events.map(event => event.venue))];

  return (
    <Box>
      <Heading size="lg" mb={6}>
        Gerenciar Eventos
      </Heading>
      
      <Box bg="white" p={4} borderRadius="md" boxShadow="sm" mb={6}>
        <HStack spacing={4} mb={4} flexWrap="wrap">
          <InputGroup maxW="400px" mb={{ base: 2, md: 0 }}>
            <InputLeftElement pointerEvents="none">
              <FiSearch color="gray.300" />
            </InputLeftElement>
            <Input 
              placeholder="Buscar eventos..." 
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
              <option value="scheduled">Agendado</option>
              <option value="in_progress">Em Andamento</option>
              <option value="completed">Concluído</option>
              <option value="cancelled">Cancelado</option>
            </Select>
            
            <Select 
              width="180px"
              value={venueFilter}
              onChange={(e) => setVenueFilter(e.target.value)}
            >
              <option value="all">Todos os locais</option>
              {venues.map(venue => (
                <option key={venue} value={venue}>{venue}</option>
              ))}
            </Select>
          </HStack>
          
          <Button 
            leftIcon={<FiPlus />} 
            colorScheme="blue" 
            ml="auto"
            onClick={handleAddNew}
          >
            Novo Evento
          </Button>
        </HStack>
        
        <Box overflowX="auto">
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>Nome do Evento</Th>
                <Th>Local</Th>
                <Th>Data e Hora</Th>
                <Th>Mercados</Th>
                <Th>Status</Th>
                <Th textAlign="right">Ações</Th>
              </Tr>
            </Thead>
            <Tbody>
              {filteredEvents.map((event) => (
                <Tr key={event.id} _hover={{ bg: 'gray.50' }}>
                  <Td fontWeight="medium">{event.name}</Td>
                  <Td>
                    <HStack>
                      <FiMapPin size={16} />
                      <Text>{event.venue}</Text>
                    </HStack>
                  </Td>
                  <Td>
                    <HStack>
                      <FiCalendar size={16} />
                      <Text>{new Date(event.date).toLocaleString()}</Text>
                    </HStack>
                  </Td>
                  <Td>
                    <HStack>
                      <FiDollarSign size={16} />
                      <Text>{event.marketCount} mercados</Text>
                    </HStack>
                  </Td>
                  <Td>{getStatusBadge(event.status)}</Td>
                  <Td>
                    <HStack spacing={2} justify="flex-end">
                      <IconButton 
                        aria-label="Ver detalhes"
                        icon={<FiEye />} 
                        size="sm"
                        variant="ghost"
                        colorScheme="blue"
                      />
                      <IconButton 
                        aria-label="Editar evento"
                        icon={<FiEdit2 />} 
                        size="sm"
                        variant="ghost"
                        colorScheme="blue"
                        onClick={() => handleEdit(event)}
                      />
                      <IconButton 
                        aria-label="Excluir evento"
                        icon={<FiTrash2 />} 
                        size="sm"
                        variant="ghost"
                        colorScheme="red"
                      />
                    </HStack>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>
      </Box>
      
      <EventModal 
        isOpen={isOpen} 
        onClose={onClose} 
        event={selectedEvent}
        onSave={handleSave}
      />
    </Box>
  );
};

export default EventsPage;
