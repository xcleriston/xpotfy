import { Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter, ModalBody, ModalCloseButton, Button, FormControl, FormLabel, Input, VStack, Select, useToast, Box, Avatar, Center } from '@chakra-ui/react';
import { useState, useEffect } from 'react';
import { FiUpload, FiUser } from 'react-icons/fi';

type User = {
  id?: number;
  name: string;
  email: string;
  role: string;
  status: string;
  avatar?: string;
};

type UserModalProps = {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onSave: (user: User) => void;
};

const UserModal = ({ isOpen, onClose, user, onSave }: UserModalProps) => {
  const toast = useToast();
  const [formData, setFormData] = useState<User>({
    name: '',
    email: '',
    role: 'user',
    status: 'active'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState('');

  // Preencher o formulário quando o usuário for alterado
  useEffect(() => {
    if (user) {
      setFormData(user);
      if (user.avatar) {
        setAvatarPreview(user.avatar);
      }
    } else {
      setFormData({
        name: '',
        email: '',
        role: 'user',
        status: 'active'
      });
      setAvatarPreview('');
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulando uma requisição assíncrona
    setTimeout(() => {
      onSave({
        ...formData,
        avatar: avatarPreview
      });
      
      toast({
        title: 'Sucesso!',
        description: user ? 'Usuário atualizado com sucesso.' : 'Usuário criado com sucesso.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      setIsSubmitting(false);
      onClose();
    }, 1000);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalOverlay />
      <form onSubmit={handleSubmit}>
        <ModalContent>
          <ModalHeader>
            {user ? 'Editar Usuário' : 'Adicionar Novo Usuário'}
          </ModalHeader>
          <ModalCloseButton />
          
          <ModalBody pb={6}>
            <VStack spacing={4}>
              <Center flexDirection="column">
                <Box position="relative" mb={4}>
                  <Avatar 
                    size="2xl" 
                    name={formData.name} 
                    src={avatarPreview} 
                    icon={<FiUser size={40} />}
                  />
                  <label htmlFor="avatar-upload">
                    <Box
                      as="span"
                      position="absolute"
                      bottom={0}
                      right={0}
                      bg="blue.500"
                      color="white"
                      p={2}
                      borderRadius="full"
                      cursor="pointer"
                      _hover={{ bg: 'blue.600' }}
                    >
                      <FiUpload />
                    </Box>
                  </label>
                  <Input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    display="none"
                    onChange={handleAvatarChange}
                  />
                </Box>
              </Center>
              
              <FormControl isRequired>
                <FormLabel>Nome</FormLabel>
                <Input 
                  name="name" 
                  value={formData.name} 
                  onChange={handleChange} 
                  placeholder="Nome completo" 
                />
              </FormControl>
              
              <FormControl isRequired>
                <FormLabel>Email</FormLabel>
                <Input 
                  type="email" 
                  name="email" 
                  value={formData.email} 
                  onChange={handleChange} 
                  placeholder="email@exemplo.com" 
                />
              </FormControl>
              
              <FormControl>
                <FormLabel>Senha</FormLabel>
                <Input 
                  type="password" 
                  name="password" 
                  onChange={handleChange} 
                  placeholder={user ? 'Deixe em branco para não alterar' : 'Senha'} 
                />
              </FormControl>
              
              <FormControl isRequired>
                <FormLabel>Função</FormLabel>
                <Select 
                  name="role" 
                  value={formData.role} 
                  onChange={handleChange}
                >
                  <option value="user">Usuário</option>
                  <option value="moderator">Moderador</option>
                  <option value="admin">Administrador</option>
                </Select>
              </FormControl>
              
              <FormControl isRequired>
                <FormLabel>Status</FormLabel>
                <Select 
                  name="status" 
                  value={formData.status} 
                  onChange={handleChange}
                >
                  <option value="active">Ativo</option>
                  <option value="inactive">Inativo</option>
                  <option value="suspended">Suspenso</option>
                </Select>
              </FormControl>
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
              Salvar
            </Button>
          </ModalFooter>
        </ModalContent>
      </form>
    </Modal>
  );
};

export default UserModal;
