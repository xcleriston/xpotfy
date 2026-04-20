import { Box, Heading, VStack, HStack, Text, Divider, FormControl, FormLabel, Input, Button, Switch, useToast, Tabs, TabList, Tab, TabPanels, TabPanel, Select, Textarea } from '@chakra-ui/react';
import { FiSave, FiUser, FiLock, FiBell, FiCreditCard, FiGlobe, FiDollarSign } from 'react-icons/fi';
import { useState } from 'react';

const SettingsPage = () => {
  const toast = useToast();
  const [isSaving, setIsSaving] = useState(false);
  
  // Dados do perfil
  const [profile, setProfile] = useState({
    name: 'João Silva',
    email: 'joao@example.com',
    phone: '(11) 98765-4321',
    bio: 'Apaixonado por apostas em corridas de cavalos e análise de desempenho.'
  });
  
  // Configurações de notificação
  const [notifications, setNotifications] = useState({
    email: true,
    sms: false,
    push: true,
    betConfirmation: true,
    results: true,
    promotions: false
  });
  
  // Configurações de pagamento
  const [payment, setPayment] = useState({
    cardNumber: '**** **** **** 1234',
    cardName: 'JOÃO SILVA',
    expiry: '12/25',
    cvv: '***',
    currency: 'BRL'
  });
  
  // Configurações de privacidade
  const [privacy, setPrivacy] = useState({
    profileVisible: true,
    showEmail: false,
    showPhone: false,
    twoFactorAuth: true
  });

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleNotificationChange = (e) => {
    const { name, checked } = e.target;
    setNotifications(prev => ({
      ...prev,
      [name]: checked
    }));
  };

  const handlePaymentChange = (e) => {
    const { name, value } = e.target;
    setPayment(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePrivacyChange = (e) => {
    const { name, checked } = e.target;
    setPrivacy(prev => ({
      ...prev,
      [name]: checked
    }));
  };

  const handleSave = (section) => {
    setIsSaving(true);
    
    // Simulando uma requisição assíncrona
    setTimeout(() => {
      setIsSaving(false);
      
      toast({
        title: 'Configurações salvas',
        description: `As configurações de ${section} foram atualizadas com sucesso.`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    }, 1000);
  };

  return (
    <Box>
      <Heading size="lg" mb={6}>
        Configurações
      </Heading>
      
      <Tabs variant="enclosed" colorScheme="blue">
        <TabList>
          <Tab><FiUser style={{ marginRight: '8px' }} /> Perfil</Tab>
          <Tab><FiBell style={{ marginRight: '8px' }} /> Notificações</Tab>
          <Tab><FiCreditCard style={{ marginRight: '8px' }} /> Pagamento</Tab>
          <Tab><FiLock style={{ marginRight: '8px' }} /> Privacidade</Tab>
        </TabList>
        
        <TabPanels mt={4}>
          {/* Aba de Perfil */}
          <TabPanel p={0}>
            <VStack spacing={6} align="stretch">
              <Box bg="white" p={6} borderRadius="md" boxShadow="sm">
                <Heading size="md" mb={6}>Informações Pessoais</Heading>
                
                <VStack spacing={4} align="stretch">
                  <FormControl>
                    <FormLabel>Nome Completo</FormLabel>
                    <Input 
                      name="name"
                      value={profile.name}
                      onChange={handleProfileChange}
                      placeholder="Seu nome completo"
                    />
                  </FormControl>
                  
                  <FormControl>
                    <FormLabel>Email</FormLabel>
                    <Input 
                      type="email"
                      name="email"
                      value={profile.email}
                      onChange={handleProfileChange}
                      placeholder="seu@email.com"
                    />
                  </FormControl>
                  
                  <FormControl>
                    <FormLabel>Telefone</FormLabel>
                    <Input 
                      name="phone"
                      value={profile.phone}
                      onChange={handleProfileChange}
                      placeholder="(00) 00000-0000"
                    />
                  </FormControl>
                  
                  <FormControl>
                    <FormLabel>Biografia</FormLabel>
                    <Textarea 
                      name="bio"
                      value={profile.bio}
                      onChange={handleProfileChange}
                      placeholder="Conte um pouco sobre você..."
                      rows={3}
                    />
                  </FormControl>
                  
                  <HStack justify="flex-end" mt={4}>
                    <Button 
                      colorScheme="blue" 
                      leftIcon={<FiSave />}
                      onClick={() => handleSave('perfil')}
                      isLoading={isSaving}
                      loadingText="Salvando..."
                    >
                      Salvar Alterações
                    </Button>
                  </HStack>
                </VStack>
              </Box>
              
              <Box bg="white" p={6} borderRadius="md" boxShadow="sm">
                <Heading size="md" mb={6}>Alterar Senha</Heading>
                
                <VStack spacing={4} align="stretch">
                  <FormControl>
                    <FormLabel>Senha Atual</FormLabel>
                    <Input 
                      type="password"
                      placeholder="Digite sua senha atual"
                    />
                  </FormControl>
                  
                  <FormControl>
                    <FormLabel>Nova Senha</FormLabel>
                    <Input 
                      type="password"
                      placeholder="Digite a nova senha"
                    />
                  </FormControl>
                  
                  <FormControl>
                    <FormLabel>Confirmar Nova Senha</FormLabel>
                    <Input 
                      type="password"
                      placeholder="Confirme a nova senha"
                    />
                  </FormControl>
                  
                  <HStack justify="flex-end" mt={4}>
                    <Button 
                      colorScheme="blue" 
                      leftIcon={<FiSave />}
                      onClick={() => handleSave('senha')}
                      isLoading={isSaving}
                      loadingText="Salvando..."
                    >
                      Alterar Senha
                    </Button>
                  </HStack>
                </VStack>
              </Box>
            </VStack>
          </TabPanel>
          
          {/* Aba de Notificações */}
          <TabPanel p={0}>
            <Box bg="white" p={6} borderRadius="md" boxShadow="sm">
              <Heading size="md" mb={6}>Preferências de Notificação</Heading>
              
              <VStack spacing={6} align="stretch">
                <Box>
                  <Text fontWeight="medium" mb={3}>Métodos de Notificação</Text>
                  <VStack spacing={4} align="stretch">
                    <FormControl display="flex" alignItems="center" justifyContent="space-between">
                      <Box>
                        <FormLabel htmlFor="email-notifications" mb="0">Notificações por Email</FormLabel>
                        <Text fontSize="sm" color="gray.500">Receba atualizações importantes por email</Text>
                      </Box>
                      <Switch 
                        id="email-notifications" 
                        name="email"
                        isChecked={notifications.email}
                        onChange={handleNotificationChange}
                        colorScheme="blue"
                      />
                    </FormControl>
                    
                    <FormControl display="flex" alignItems="center" justifyContent="space-between">
                      <Box>
                        <FormLabel htmlFor="sms-notifications" mb="0">Notificações por SMS</FormLabel>
                        <Text fontSize="sm" color="gray.500">Receba alertas importantes por SMS</Text>
                      </Box>
                      <Switch 
                        id="sms-notifications" 
                        name="sms"
                        isChecked={notifications.sms}
                        onChange={handleNotificationChange}
                        colorScheme="blue"
                      />
                    </FormControl>
                    
                    <FormControl display="flex" alignItems="center" justifyContent="space-between">
                      <Box>
                        <FormLabel htmlFor="push-notifications" mb="0">Notificações Push</FormLabel>
                        <Text fontSize="sm" color="gray.500">Receba notificações no seu dispositivo</Text>
                      </Box>
                      <Switch 
                        id="push-notifications" 
                        name="push"
                        isChecked={notifications.push}
                        onChange={handleNotificationChange}
                        colorScheme="blue"
                      />
                    </FormControl>
                  </VStack>
                </Box>
                
                <Divider my={2} />
                
                <Box>
                  <Text fontWeight="medium" mb={3}>Tipos de Notificação</Text>
                  <VStack spacing={4} align="stretch">
                    <FormControl display="flex" alignItems="center" justifyContent="space-between">
                      <Box>
                        <FormLabel htmlFor="bet-confirmation" mb="0">Confirmação de Apostas</FormLabel>
                        <Text fontSize="sm" color="gray.500">Receba confirmação quando uma aposta for realizada</Text>
                      </Box>
                      <Switch 
                        id="bet-confirmation" 
                        name="betConfirmation"
                        isChecked={notifications.betConfirmation}
                        onChange={handleNotificationChange}
                        colorScheme="blue"
                      />
                    </FormControl>
                    
                    <FormControl display="flex" alignItems="center" justifyContent="space-between">
                      <Box>
                        <FormLabel htmlFor="results" mb="0">Resultados de Eventos</FormLabel>
                        <Text fontSize="sm" color="gray.500">Receba notificações sobre os resultados dos eventos</Text>
                      </Box>
                      <Switch 
                        id="results" 
                        name="results"
                        isChecked={notifications.results}
                        onChange={handleNotificationChange}
                        colorScheme="blue"
                      />
                    </FormControl>
                    
                    <FormControl display="flex" alignItems="center" justifyContent="space-between">
                      <Box>
                        <FormLabel htmlFor="promotions" mb="0">Promoções e Ofertas</FormLabel>
                        <Text fontSize="sm" color="gray.500">Receba ofertas especiais e promoções</Text>
                      </Box>
                      <Switch 
                        id="promotions" 
                        name="promotions"
                        isChecked={notifications.promotions}
                        onChange={handleNotificationChange}
                        colorScheme="blue"
                      />
                    </FormControl>
                  </VStack>
                </Box>
                
                <HStack justify="flex-end" mt={4}>
                  <Button 
                    colorScheme="blue" 
                    leftIcon={<FiSave />}
                    onClick={() => handleSave('notificações')}
                    isLoading={isSaving}
                    loadingText="Salvando..."
                  >
                    Salvar Preferências
                  </Button>
                </HStack>
              </VStack>
            </Box>
          </TabPanel>
          
          {/* Aba de Pagamento */}
          <TabPanel p={0}>
            <Box bg="white" p={6} borderRadius="md" boxShadow="sm">
              <Heading size="md" mb={6}>Métodos de Pagamento</Heading>
              
              <VStack spacing={6} align="stretch">
                <Box>
                  <Text fontWeight="medium" mb={3}>Cartão de Crédito</Text>
                  <VStack spacing={4} align="stretch">
                    <FormControl>
                      <FormLabel>Número do Cartão</FormLabel>
                      <Input 
                        name="cardNumber"
                        value={payment.cardNumber}
                        onChange={handlePaymentChange}
                        placeholder="**** **** **** ****"
                      />
                    </FormControl>
                    
                    <FormControl>
                      <FormLabel>Nome no Cartão</FormLabel>
                      <Input 
                        name="cardName"
                        value={payment.cardName}
                        onChange={handlePaymentChange}
                        placeholder="Nome como está no cartão"
                      />
                    </FormControl>
                    
                    <HStack spacing={4}>
                      <FormControl>
                        <FormLabel>Validade</FormLabel>
                        <Input 
                          name="expiry"
                          value={payment.expiry}
                          onChange={handlePaymentChange}
                          placeholder="MM/AA"
                        />
                      </FormControl>
                      
                      <FormControl>
                        <FormLabel>CVV</FormLabel>
                        <Input 
                          name="cvv"
                          value={payment.cvv}
                          onChange={handlePaymentChange}
                          placeholder="***"
                          type="password"
                          maxLength={3}
                        />
                      </FormControl>
                    </HStack>
                    
                    <FormControl>
                      <FormLabel>Moeda Padrão</FormLabel>
                      <Select 
                        name="currency"
                        value={payment.currency}
                        onChange={handlePaymentChange}
                        leftIcon={<FiDollarSign />}
                      >
                        <option value="BRL">Real Brasileiro (R$)</option>
                        <option value="USD">Dólar Americano (US$)</option>
                        <option value="EUR">Euro (€)</option>
                        <option value="GBP">Libra Esterlina (£)</option>
                      </Select>
                    </FormControl>
                  </VStack>
                </Box>
                
                <HStack justify="flex-end" mt={4}>
                  <Button 
                    colorScheme="blue" 
                    leftIcon={<FiSave />}
                    onClick={() => handleSave('pagamento')}
                    isLoading={isSaving}
                    loadingText="Salvando..."
                  >
                    Salvar Cartão
                  </Button>
                </HStack>
              </VStack>
            </Box>
          </TabPanel>
          
          {/* Aba de Privacidade */}
          <TabPanel p={0}>
            <Box bg="white" p={6} borderRadius="md" boxShadow="sm">
              <Heading size="md" mb={6}>Configurações de Privacidade</Heading>
              
              <VStack spacing={6} align="stretch">
                <Box>
                  <Text fontWeight="medium" mb={3}>Visibilidade do Perfil</Text>
                  <VStack spacing={4} align="stretch">
                    <FormControl display="flex" alignItems="center" justifyContent="space-between">
                      <Box>
                        <FormLabel htmlFor="profile-visible" mb="0">Perfil Público</FormLabel>
                        <Text fontSize="sm" color="gray.500">Tornar seu perfil visível para outros usuários</Text>
                      </Box>
                      <Switch 
                        id="profile-visible" 
                        name="profileVisible"
                        isChecked={privacy.profileVisible}
                        onChange={handlePrivacyChange}
                        colorScheme="blue"
                      />
                    </FormControl>
                    
                    <FormControl display="flex" alignItems="center" justifyContent="space-between">
                      <Box>
                        <FormLabel htmlFor="show-email" mb="0">Mostrar Email</FormLabel>
                        <Text fontSize="sm" color="gray.500">Tornar seu endereço de email visível para outros usuários</Text>
                      </Box>
                      <Switch 
                        id="show-email" 
                        name="showEmail"
                        isChecked={privacy.showEmail}
                        onChange={handlePrivacyChange}
                        colorScheme="blue"
                      />
                    </FormControl>
                    
                    <FormControl display="flex" alignItems="center" justifyContent="space-between">
                      <Box>
                        <FormLabel htmlFor="show-phone" mb="0">Mostrar Telefone</FormLabel>
                        <Text fontSize="sm" color="gray.500">Tornar seu número de telefone visível para outros usuários</Text>
                      </Box>
                      <Switch 
                        id="show-phone" 
                        name="showPhone"
                        isChecked={privacy.showPhone}
                        onChange={handlePrivacyChange}
                        colorScheme="blue"
                      />
                    </FormControl>
                  </VStack>
                </Box>
                
                <Divider my={2} />
                
                <Box>
                  <Text fontWeight="medium" mb={3}>Segurança da Conta</Text>
                  <VStack spacing={4} align="stretch">
                    <FormControl display="flex" alignItems="center" justifyContent="space-between">
                      <Box>
                        <FormLabel htmlFor="two-factor" mb="0">Autenticação em Dois Fatores</FormLabel>
                        <Text fontSize="sm" color="gray.500">Adicione uma camada extra de segurança à sua conta</Text>
                      </Box>
                      <Switch 
                        id="two-factor" 
                        name="twoFactorAuth"
                        isChecked={privacy.twoFactorAuth}
                        onChange={handlePrivacyChange}
                        colorScheme="blue"
                      />
                    </FormControl>
                    
                    <Box mt={4}>
                      <Text fontWeight="medium" mb={2}>Sessões Ativas</Text>
                      <Box p={4} borderWidth="1px" borderRadius="md" bg="gray.50">
                        <HStack justify="space-between">
                          <Box>
                            <Text fontWeight="medium">Navegador Chrome</Text>
                            <Text fontSize="sm" color="gray.500">Windows 10 • Último acesso: Hoje, 14:30</Text>
                            <Text fontSize="sm" color="blue.500">Dispositivo Atual</Text>
                          </Box>
                          <Button size="sm" colorScheme="red" variant="outline">
                            Sair
                          </Button>
                        </HStack>
                        
                        <Divider my={3} />
                        
                        <HStack justify="space-between" mt={2}>
                          <Box>
                            <Text fontWeight="medium">Navegador Firefox</Text>
                            <Text fontSize="sm" color="gray.500">Android • Último acesso: Ontem, 09:15</Text>
                          </Box>
                          <Button size="sm" colorScheme="red" variant="outline">
                            Sair
                          </Button>
                        </HStack>
                      </Box>
                    </Box>
                  </VStack>
                </Box>
                
                <HStack justify="flex-end" mt={4}>
                  <Button 
                    colorScheme="blue" 
                    leftIcon={<FiSave />}
                    onClick={() => handleSave('privacidade')}
                    isLoading={isSaving}
                    loadingText="Salvando..."
                  >
                    Salvar Configurações
                  </Button>
                </HStack>
              </VStack>
            </Box>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
};

export default SettingsPage;
