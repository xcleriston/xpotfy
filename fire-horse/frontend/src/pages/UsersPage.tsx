import { Box, Heading, Table, Thead, Tbody, Tr, Th, Td, Badge, Avatar, Text, Button, HStack, Input, InputGroup, InputLeftElement, Select, useDisclosure } from '@chakra-ui/react';
import { FiSearch, FiUserPlus, FiEdit2, FiTrash2, FiFilter } from 'react-icons/fi';
import { useState } from 'react';
import UserModal from '../components/UserModal';

// Dados de exemplo
const users = [
  {
    id: 1,
    name: 'João Silva',
    email: 'joao@example.com',
    role: 'admin',
    status: 'active',
    lastLogin: '2023-05-15T10:30:00',
    avatar: 'https://randomuser.me/api/portraits/men/1.jpg'
  },
  {
    id: 2,
    name: 'Maria Oliveira',
    email: 'maria@example.com',
    role: 'user',
    status: 'active',
    lastLogin: '2023-05-16T14:45:00',
    avatar: 'https://randomuser.me/api/portraits/women/1.jpg'
  },
  {
    id: 3,
    name: 'Carlos Santos',
    email: 'carlos@example.com',
    role: 'user',
    status: 'inactive',
    lastLogin: '2023-05-10T09:15:00',
    avatar: 'https://randomuser.me/api/portraits/men/2.jpg'
  },
  {
    id: 4,
    name: 'Ana Pereira',
    email: 'ana@example.com',
    role: 'moderator',
    status: 'active',
    lastLogin: '2023-05-17T11:20:00',
    avatar: 'https://randomuser.me/api/portraits/women/2.jpg'
  },
];

const UsersPage = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    
    return matchesSearch && matchesStatus && matchesRole;
  });

  const handleEdit = (user) => {
    setSelectedUser(user);
    onOpen();
  };

  const handleAddNew = () => {
    setSelectedUser(null);
    onOpen();
  };

  const handleSave = (userData) => {
    console.log('Salvar usuário:', userData);
    onClose();
  };

  return (
    <Box>
      <Heading size="lg" mb={6}>
        Gerenciar Usuários
      </Heading>
      
      <Box bg="white" p={4} borderRadius="md" boxShadow="sm" mb={6}>
        <HStack spacing={4} mb={4}>
          <InputGroup maxW="400px">
            <InputLeftElement pointerEvents="none">
              <FiSearch color="gray.300" />
            </InputLeftElement>
            <Input 
              placeholder="Buscar usuários..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </InputGroup>
          
          <Select 
            placeholder="Status" 
            width="200px"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">Todos os status</option>
            <option value="active">Ativo</option>
            <option value="inactive">Inativo</option>
            <option value="suspended">Suspenso</option>
          </Select>
          
          <Select 
            placeholder="Função" 
            width="200px"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="all">Todas as funções</option>
            <option value="admin">Administrador</option>
            <option value="moderator">Moderador</option>
            <option value="user">Usuário</option>
          </Select>
          
          <Button 
            leftIcon={<FiUserPlus />} 
            colorScheme="blue" 
            ml="auto"
            onClick={handleAddNew}
          >
            Novo Usuário
          </Button>
        </HStack>
        
        <Box overflowX="auto">
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>Usuário</Th>
                <Th>Email</Th>
                <Th>Função</Th>
                <Th>Status</Th>
                <Th>Último Acesso</Th>
                <Th textAlign="right">Ações</Th>
              </Tr>
            </Thead>
            <Tbody>
              {filteredUsers.map((user) => (
                <Tr key={user.id} _hover={{ bg: 'gray.50' }}>
                  <Td>
                    <HStack>
                      <Avatar size="sm" name={user.name} src={user.avatar} />
                      <Text>{user.name}</Text>
                    </HStack>
                  </Td>
                  <Td>{user.email}</Td>
                  <Td>
                    <Badge 
                      colorScheme={
                        user.role === 'admin' ? 'red' : 
                        user.role === 'moderator' ? 'blue' : 'gray'
                      }
                      textTransform="capitalize"
                    >
                      {user.role}
                    </Badge>
                  </Td>
                  <Td>
                    <Badge 
                      colorScheme={user.status === 'active' ? 'green' : 'gray'}
                      textTransform="capitalize"
                    >
                      {user.status === 'active' ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </Td>
                  <Td>{new Date(user.lastLogin).toLocaleString()}</Td>
                  <Td textAlign="right">
                    <HStack spacing={2} justify="flex-end">
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        colorScheme="blue"
                        onClick={() => handleEdit(user)}
                      >
                        <FiEdit2 />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        colorScheme="red"
                      >
                        <FiTrash2 />
                      </Button>
                    </HStack>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>
      </Box>
      
      <UserModal 
        isOpen={isOpen} 
        onClose={onClose} 
        user={selectedUser}
        onSave={handleSave}
      />
    </Box>
  );
};

export default UsersPage;
