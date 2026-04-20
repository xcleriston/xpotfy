import { useState } from 'react';
import { Box, Heading, VStack, Text, Tabs, TabList, TabPanels, Tab, TabPanel, useToast, FormControl, FormLabel, Switch, Input, Button, HStack, useColorMode } from '@chakra-ui/react';
import { Card } from '../components';

export const SettingsPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();
  const { colorMode, toggleColorMode } = useColorMode();
  
  const handleSave = () => {
    setIsLoading(true);
    // Simula uma requisição
    setTimeout(() => {
      setIsLoading(false);
      toast({
        title: 'Configurações salvas',
        description: 'Suas configurações foram salvas com sucesso.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    }, 1000);
  };

  return (
    <Box>
      <Box mb={6}>
        <Heading size="lg">Configurações</Heading>
        <Text color="gray.600">Gerencie as configurações do sistema</Text>
      </Box>

      <Card>
        <Tabs variant="enclosed">
          <TabList>
            <Tab>Geral</Tab>
            <Tab>Segurança</Tab>
            <Tab>Notificações</Tab>
          </TabList>

          <TabPanels mt={4}>
            <TabPanel>
              <VStack spacing={6} align="stretch">
                <FormControl display="flex" alignItems="center">
                  <FormLabel htmlFor="dark-mode" mb="0">
                    Modo Escuro
                  </FormLabel>
                  <Switch 
                    id="dark-mode" 
                    isChecked={colorMode === 'dark'}
                    onChange={toggleColorMode}
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Nome do Sistema</FormLabel>
                  <Input 
                    placeholder="Fire Horse"
                    defaultValue="Fire Horse"
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>E-mail de Contato</FormLabel>
                  <Input 
                    type="email"
                    placeholder="contato@firehorse.com"
                    defaultValue="contato@firehorse.com"
                  />
                </FormControl>
              </VStack>
            </TabPanel>

            <TabPanel>
              <VStack spacing={6} align="stretch">
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
              </VStack>
            </TabPanel>

            <TabPanel>
              <VStack spacing={6} align="stretch">
                <FormControl display="flex" alignItems="center">
                  <FormLabel htmlFor="email-notifications" mb="0">
                    Notificações por E-mail
                  </FormLabel>
                  <Switch id="email-notifications" defaultChecked />
                </FormControl>

                <FormControl display="flex" alignItems="center">
                  <FormLabel htmlFor="push-notifications" mb="0">
                    Notificações Push
                  </FormLabel>
                  <Switch id="push-notifications" defaultChecked />
                </FormControl>

                <FormControl>
                  <FormLabel>Frequência de Relatórios</FormLabel>
                  <select style={{
                    width: '100%',
                    padding: '0.5rem',
                    borderRadius: '0.375rem',
                    border: '1px solid #e2e8f0',
                    backgroundColor: colorMode === 'dark' ? '#2d3748' : 'white'
                  }}>
                    <option value="daily">Diário</option>
                    <option value="weekly">Semanal</option>
                    <option value="monthly">Mensal</option>
                  </select>
                </FormControl>
              </VStack>
            </TabPanel>
          </TabPanels>
        </Tabs>

        <HStack justify="flex-end" mt={8}>
          <Button variant="outline" mr={2}>
            Cancelar
          </Button>
          <Button 
            colorScheme="blue" 
            onClick={handleSave}
            isLoading={isLoading}
            loadingText="Salvando..."
          >
            Salvar Alterações
          </Button>
        </HStack>
      </Card>
    </Box>
  );
};
