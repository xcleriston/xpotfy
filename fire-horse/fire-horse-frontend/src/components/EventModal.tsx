import { Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter, ModalBody, ModalCloseButton, Button, FormControl, FormLabel, Input, VStack, Select, useToast, Textarea, HStack, Switch } from '@chakra-ui/react';
import { useState, useEffect } from 'react';
import { FiCalendar, FiMapPin, FiGlobe, FiClock } from 'react-icons/fi';

type Event = {
  id?: string;
  name: string;
  venue: string;
  date: string;
  status: string;
  country: string;
  eventType: string;
  description?: string;
  isFeatured?: boolean;
};

type EventModalProps = {
  isOpen: boolean;
  onClose: () => void;
  event: Event | null;
  onSave: (event: Event) => void;
};

const EventModal = ({ isOpen, onClose, event, onSave }: EventModalProps) => {
  const toast = useToast();
  const [formData, setFormData] = useState<Event>({
    name: '',
    venue: '',
    date: new Date().toISOString().slice(0, 16),
    status: 'scheduled',
    country: 'BR',
    eventType: 'Horse Racing',
    description: '',
    isFeatured: false
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Preencher o formulário quando o evento for alterado
  useEffect(() => {
    if (event) {
      setFormData({
        ...event,
        date: event.date ? new Date(event.date).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16)
      });
    } else {
      setFormData({
        name: '',
        venue: '',
        date: new Date().toISOString().slice(0, 16),
        status: 'scheduled',
        country: 'BR',
        eventType: 'Horse Racing',
        description: '',
        isFeatured: false
      });
    }
  }, [event]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSwitchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: checked
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulando uma requisição assíncrona
    setTimeout(() => {
      onSave(formData);
      
      toast({
        title: 'Sucesso!',
        description: event ? 'Evento atualizado com sucesso.' : 'Evento criado com sucesso.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      setIsSubmitting(false);
      onClose();
    }, 1000);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalOverlay />
      <form onSubmit={handleSubmit}>
        <ModalContent>
          <ModalHeader>
            {event ? 'Editar Evento' : 'Criar Novo Evento'}
          </ModalHeader>
          <ModalCloseButton />
          
          <ModalBody pb={6}>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Nome do Evento</FormLabel>
                <Input 
                  name="name" 
                  value={formData.name} 
                  onChange={handleChange} 
                  placeholder="Ex: Grande Prêmio Brasil" 
                />
              </FormControl>
              
              <FormControl isRequired>
                <FormLabel>Local</FormLabel>
                <Input 
                  name="venue" 
                  value={formData.venue} 
                  onChange={handleChange} 
                  placeholder="Ex: Hipódromo do Cristal" 
                  leftElement={<FiMapPin />}
                />
              </FormControl>
              
              <FormControl isRequired>
                <FormLabel>Data e Hora</FormLabel>
                <Input 
                  type="datetime-local" 
                  name="date" 
                  value={formData.date} 
                  onChange={handleChange}
                  leftElement={<FiCalendar />}
                />
              </FormControl>
              
              <FormControl>
                <FormLabel>Descrição</FormLabel>
                <Textarea 
                  name="description" 
                  value={formData.description || ''} 
                  onChange={handleChange} 
                  placeholder="Descrição detalhada do evento..."
                  rows={3}
                />
              </FormControl>
              
              <HStack w="100%" spacing={6}>
                <FormControl isRequired>
                  <FormLabel>País</FormLabel>
                  <Select 
                    name="country" 
                    value={formData.country} 
                    onChange={handleChange}
                    leftElement={<FiGlobe />}
                  >
                    <option value="BR">Brasil</option>
                    <option value="AR">Argentina</option>
                    <option value="UY">Uruguai</option>
                    <option value="CL">Chile</option>
                    <option value="US">Estados Unidos</option>
                    <option value="GB">Reino Unido</option>
                  </Select>
                </FormControl>
                
                <FormControl isRequired>
                  <FormLabel>Tipo de Evento</FormLabel>
                  <Select 
                    name="eventType" 
                    value={formData.eventType} 
                    onChange={handleChange}
                  >
                    <option value="Horse Racing">Corrida de Cavalos</option>
                    <option value="Greyhound">Corrida de Cães</option>
                    <option value="Football">Futebol</option>
                    <option value="Tennis">Tênis</option>
                    <option value="Basketball">Basquete</option>
                    <option value="Other">Outro</option>
                  </Select>
                </FormControl>
              </HStack>
              
              <HStack w="100%" spacing={6}>
                <FormControl isRequired>
                  <FormLabel>Status</FormLabel>
                  <Select 
                    name="status" 
                    value={formData.status} 
                    onChange={handleChange}
                  >
                    <option value="scheduled">Agendado</option>
                    <option value="in_progress">Em Andamento</option>
                    <option value="completed">Concluído</option>
                    <option value="cancelled">Cancelado</option>
                  </Select>
                </FormControl>
                
                <FormControl display="flex" alignItems="center" mt={6}>
                  <FormLabel htmlFor="is-featured" mb="0">
                    Destaque?
                  </FormLabel>
                  <Switch 
                    id="is-featured" 
                    name="isFeatured"
                    isChecked={formData.isFeatured}
                    onChange={handleSwitchChange}
                    colorScheme="blue"
                  />
                </FormControl>
              </HStack>
            </VStack>
          </ModalBody>
          
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Cancelar
            </Button>
            <Button 
              colorScheme="blue" 
              type="submit"
              isLoading={isSubmitting}
              loadingText="Salvando..."
            >
              Salvar Evento
            </Button>
          </ModalFooter>
        </ModalContent>
      </form>
    </Modal>
  );
};

export default EventModal;
