import { useState } from 'react';
import { Box, Button, Heading, VStack, HStack, useDisclosure } from '@chakra-ui/react';
import { Card, DataTable, ErrorMessage } from '../components';
import { UserForm } from '../components/forms/UserForm';
import { FiPlus } from 'react-icons/fi';

// Tipos
type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'active' | 'inactive';
};

export const UsersPage = () => {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  
  // Dados de exemplo - em um app real, isso viria de uma API
  const [users, setUsers] = useState<User[]>([
    { id: '1', name: 'João Silva', email: 'joao@email.com', role: 'admin', status: 'active' },
    { id: '2', name: 'Maria Santos', email: 'maria@email.com', role: 'user', status: 'active' },
  ]);

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    onOpen();
  };

  const handleDelete = (userId: string) => {
    // Implementar lógica de exclusão
    console.log('Excluir usuário:', userId);
  };

  const handleSubmit = (data: Omit<User, 'id'>) => {
    if (selectedUser) {
      // Atualizar usuário existente
      setUsers(users.map(u => u.id === selectedUser.id ? { ...u, ...data } : u));
    } else {
      // Adicionar novo usuário
      const newUser = { ...data, id: Math.random().toString(), status: 'active' as const };
      setUsers([...users, newUser]);
    }
    onClose();
    setSelectedUser(null);
  };

  const columns = [
    {
      key: 'name',
      header: 'Nome',
      accessor: (user: User) => user.name,
    },
    {
      key: 'email',
      header: 'E-mail',
      accessor: (user: User) => user.email,
    },
    {
      key: 'role',
      header: 'Função',
      accessor: (user: User) => user.role === 'admin' ? 'Administrador' : 'Usuário',
    },
    {
      key: 'status',
      header: 'Status',
      accessor: (user: User) => (
        <Box
          as="span"
          px={2}
          py={1}
          borderRadius="full"
          bg={user.status === 'active' ? 'green.100' : 'gray.100'}
          color={user.status === 'active' ? 'green.800' : 'gray.800'}
          fontSize="sm"
        >
          {user.status === 'active' ? 'Ativo' : 'Inativo'}
        </Box>
      ),
    },
  ];

  return (
    <Box>
      <HStack justify="space-between" mb={6}>
        <Box>
          <Heading size="lg">Usuários</Heading>
          <Text color="gray.600">Gerencie os usuários do sistema</Text>
        </Box>
        <Button 
          leftIcon={<FiPlus />} 
          colorScheme="blue"
          onClick={() => {
            setSelectedUser(null);
            onOpen();
          }}
        >
          Novo Usuário
        </Button>
      </HStack>

      <Card>
        <DataTable
          columns={columns}
          data={users}
          page={1}
          totalPages={1}
          onPageChange={() => {}}
          onRowClick={handleEdit}
        />
      </Card>

      <UserForm
        isOpen={isOpen}
        onClose={() => {
          onClose();
          setSelectedUser(null);
        }}
        onSubmit={handleSubmit}
        initialValues={selectedUser || undefined}
      />
    </Box>
  );
};
