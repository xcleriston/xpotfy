import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  FormControl,
  FormLabel,
  VStack,
  useToast,
} from '@chakra-ui/react';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import { FormInput, FormSelect } from './';

const userSchema = Yup.object().shape({
  name: Yup.string().required('O nome é obrigatório'),
  email: Yup.string().email('E-mail inválido').required('O e-mail é obrigatório'),
  role: Yup.string().required('A função é obrigatória'),
  password: Yup.string()
    .min(6, 'A senha deve ter no mínimo 6 caracteres')
    .when('$isEditing', (isEditing, schema) => {
      return isEditing 
        ? schema.notRequired() 
        : schema.required('A senha é obrigatória');
    }),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password'), null], 'As senhas não conferem')
    .when('$isEditing', (isEditing, schema) => {
      return isEditing 
        ? schema.notRequired()
        : schema.required('Confirme a senha');
    }),
});

type UserFormValues = {
  name: string;
  email: string;
  role: string;
  password?: string;
  confirmPassword?: string;
};

type UserFormProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (values: Omit<UserFormValues, 'confirmPassword'>) => void;
  initialValues?: {
    name: string;
    email: string;
    role: string;
  };
};

export const UserForm = ({ isOpen, onClose, onSubmit, initialValues }: UserFormProps) => {
  const toast = useToast();
  const isEditing = !!initialValues;

  const handleSubmit = async (values: UserFormValues, { setSubmitting }: any) => {
    try {
      const { confirmPassword, ...userData } = values;
      await onSubmit(userData);
      
      toast({
        title: isEditing ? 'Usuário atualizado' : 'Usuário criado',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      onClose();
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Ocorreu um erro ao salvar o usuário',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalOverlay />
      <Formik
        initialValues={{
          name: initialValues?.name || '',
          email: initialValues?.email || '',
          role: initialValues?.role || 'user',
          password: '',
          confirmPassword: '',
        }}
        validationSchema={userSchema}
        onSubmit={handleSubmit}
        context={{ isEditing }}
      >
        {({ isSubmitting, dirty, isValid }) => (
          <Form>
            <ModalContent>
              <ModalHeader>
                {isEditing ? 'Editar Usuário' : 'Novo Usuário'}
              </ModalHeader>
              <ModalCloseButton />
              <ModalBody pb={6}>
                <VStack spacing={4}>
                  <FormInput 
                    name="name" 
                    label="Nome Completo" 
                    placeholder="Digite o nome do usuário"
                  />
                  
                  <FormInput 
                    name="email" 
                    label="E-mail" 
                    type="email"
                    placeholder="Digite o e-mail do usuário"
                    isDisabled={isEditing}
                  />
                  
                  <FormSelect
                    name="role"
                    label="Função"
                    options={[
                      { value: 'admin', label: 'Administrador' },
                      { value: 'user', label: 'Usuário' },
                    ]}
                  />
                  
                  {!isEditing && (
                    <>
                      <FormInput 
                        name="password" 
                        label="Senha" 
                        type="password"
                        placeholder="Digite uma senha"
                      />
                      
                      <FormInput 
                        name="confirmPassword" 
                        label="Confirmar Senha" 
                        type="password"
                        placeholder="Confirme a senha"
                      />
                    </>
                  )}
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
