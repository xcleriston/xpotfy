import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  VStack,
  useToast,
  SimpleGrid,
  Textarea,
} from '@chakra-ui/react';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import { FormInput, FormSelect, FormDatePicker } from './';

const eventSchema = Yup.object().shape({
  name: Yup.string().required('O nome do evento é obrigatório'),
  description: Yup.string(),
  startDate: Yup.date().required('A data de início é obrigatória'),
  endDate: Yup.date()
    .min(Yup.ref('startDate'), 'A data final deve ser após a data de início')
    .required('A data final é obrigatória'),
  status: Yup.string().required('O status é obrigatório'),
  location: Yup.string().required('A localização é obrigatória'),
});

type EventFormValues = {
  name: string;
  description: string;
  startDate: string | Date;
  endDate: string | Date;
  status: string;
  location: string;
};

type EventFormProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (values: EventFormValues) => void;
  initialValues?: EventFormValues;
};

export const EventForm = ({ isOpen, onClose, onSubmit, initialValues }: EventFormProps) => {
  const toast = useToast();
  const isEditing = !!initialValues;

  const handleSubmit = async (values: EventFormValues, { setSubmitting }: any) => {
    try {
      await onSubmit(values);
      
      toast({
        title: isEditing ? 'Evento atualizado' : 'Evento criado',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      onClose();
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Ocorreu um erro ao salvar o evento',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl">
      <ModalOverlay />
      <Formik
        initialValues={{
          name: initialValues?.name || '',
          description: initialValues?.description || '',
          startDate: initialValues?.startDate || new Date(),
          endDate: initialValues?.endDate || new Date(),
          status: initialValues?.status || 'scheduled',
          location: initialValues?.location || '',
        }}
        validationSchema={eventSchema}
        onSubmit={handleSubmit}
      >
        {({ isSubmitting, dirty, isValid, values, setFieldValue }) => (
          <Form>
            <ModalContent>
              <ModalHeader>
                {isEditing ? 'Editar Evento' : 'Novo Evento'}
              </ModalHeader>
              <ModalCloseButton />
              <ModalBody pb={6}>
                <VStack spacing={4}>
                  <FormInput 
                    name="name" 
                    label="Nome do Evento" 
                    placeholder="Ex: Jogo Flamengo x Palmeiras"
                  />
                  
                  <FormControl>
                    <FormLabel>Descrição</FormLabel>
                    <Textarea
                      name="description"
                      placeholder="Detalhes sobre o evento..."
                      value={values.description}
                      onChange={(e) => setFieldValue('description', e.target.value)}
                      rows={3}
                    />
                  </FormControl>
                  
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} width="100%">
                    <FormDatePicker
                      name="startDate"
                      label="Data de Início"
                      showTimeSelect
                      timeFormat="HH:mm"
                      timeIntervals={15}
                      dateFormat="dd/MM/yyyy HH:mm"
                      timeCaption="Hora"
                    />
                    
                    <FormDatePicker
                      name="endDate"
                      label="Data de Término"
                      showTimeSelect
                      timeFormat="HH:mm"
                      timeIntervals={15}
                      dateFormat="dd/MM/yyyy HH:mm"
                      timeCaption="Hora"
                      minDate={values.startDate}
                    />
                  </SimpleGrid>
                  
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} width="100%">
                    <FormSelect
                      name="status"
                      label="Status"
                      options={[
                        { value: 'scheduled', label: 'Agendado' },
                        { value: 'in_progress', label: 'Em Andamento' },
                        { value: 'finished', label: 'Finalizado' },
                        { value: 'canceled', label: 'Cancelado' },
                      ]}
                    />
                    
                    <FormInput 
                      name="location" 
                      label="Localização" 
                      placeholder="Ex: Maracanã, Rio de Janeiro"
                    />
                  </SimpleGrid>
                </VStack>
              </ModalBody>

              <ModalFooter>
                <Button 
                  variant="ghost" 
                  mr={3} 
                  onClick={onClose}
                  isDisabled={isSubmitting}
                >
                  Cancelar
                </Button>
                <Button 
                  colorScheme="blue" 
                  type="submit"
                  isLoading={isSubmitting}
                  isDisabled={!dirty || !isValid}
                >
                  {isEditing ? 'Atualizar' : 'Criar'}
                </Button>
              </ModalFooter>
            </ModalContent>
          </Form>
        )}
      </Formik>
    </Modal>
  );
};
