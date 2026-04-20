import { useState } from 'react';
import { Box, Button, Heading, VStack, HStack, useDisclosure, Text } from '@chakra-ui/react';
import { Card, DataTable } from '../components';
import { EventForm } from '../components/forms/EventForm';
import { FiPlus } from 'react-icons/fi';

type Event = {
  id: string;
  name: string;
  date: string;
  status: 'scheduled' | 'in_progress' | 'finished' | 'canceled';
  participants: number;
};

export const EventsPage = () => {
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  
  // Dados de exemplo
  const [events, setEvents] = useState<Event[]>([
    { 
      id: '1', 
      name: 'Copa do Mundo 2023', 
      date: '2023-12-01T20:00:00', 
      status: 'scheduled',
      participants: 42
    },
    { 
      id: '2', 
      name: 'Liga dos Campeões', 
      date: '2023-11-25T21:00:00', 
      status: 'in_progress',
      participants: 28
    },
  ]);

  const getStatusBadge = (status: Event['status']) => {
    const statusMap = {
      scheduled: { label: 'Agendado', color: 'blue' },
      in_progress: { label: 'Em Andamento', color: 'green' },
      finished: { label: 'Finalizado', color: 'gray' },
      canceled: { label: 'Cancelado', color: 'red' },
    };
    const { label, color } = statusMap[status];
    
    return (
      <Box
        as="span"
        px={2}
        py={1}
        borderRadius="full"
        bg={`${color}.100`}
        color={`${color}.800`}
        fontSize="sm"
      >
        {label}
      </Box>
    );
  };

  const columns = [
    {
      key: 'name',
      header: 'Evento',
      accessor: (event: Event) => (
        <Box>
          <Text fontWeight="medium">{event.name}</Text>
          <Text fontSize="sm" color="gray.500">
            {new Date(event.date).toLocaleDateString('pt-BR', { 
              day: '2-digit', 
              month: '2-digit', 
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </Text>
        </Box>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      accessor: (event: Event) => getStatusBadge(event.status),
    },
    {
      key: 'participants',
      header: 'Participantes',
      accessor: (event: Event) => `${event.participants} apostadores`,
      isNumeric: true,
    },
  ];

  return (
    <Box>
      <HStack justify="space-between" mb={6}>
        <Box>
          <Heading size="lg">Eventos</Heading>
          <Text color="gray.600">Gerencie os eventos de apostas</Text>
        </Box>
        <Button 
          leftIcon={<FiPlus />} 
          colorScheme="blue"
          onClick={() => {
            setSelectedEvent(null);
            onOpen();
          }}
        >
          Novo Evento
        </Button>
      </HStack>

      <Card>
        <DataTable
          columns={columns}
          data={events}
          page={1}
          totalPages={1}
          onPageChange={() => {}}
          onRowClick={(event) => {
            setSelectedEvent(event);
            onOpen();
          }}
        />
      </Card>

      <EventForm
        isOpen={isOpen}
        onClose={() => {
          onClose();
          setSelectedEvent(null);
        }}
        onSubmit={(data) => {
          console.log('Dados do evento:', data);
          // Implementar lógica de salvamento
          onClose();
        }}
        initialValues={selectedEvent || undefined}
      />
    </Box>
  );
};
