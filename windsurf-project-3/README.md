# Otimizador de Carga

Aplicativo web para otimização de carga em veículos de transporte. Permite o upload de fotos da carga, análise automática de dimensões e sugestões de encaixe em diferentes tipos de veículos.

## Funcionalidades

- 📸 **Upload de Imagens**: Carregue fotos da sua carga para análise automática
- 🚚 **Cadastro de Veículos**: Gerencie caminhões, vans e outros veículos de transporte
- 📏 **Análise de Dimensões**: Detecção automática das dimensões da carga
- 🎯 **Otimização Inteligente**: Algoritmo que verifica se a carga cabe no veículo selecionado
- 📊 **Visualização 3D**: Representação visual do espaço de carga e posicionamento
- 💡 **Sugestões**: Recomendações quando a carga não cabe no veículo
- 📈 **Métricas de Utilização**: Percentual de uso do volume e capacidade de peso

## Tecnologias Utilizadas

### Backend
- **Node.js** com Express.js
- **Multer** para upload de arquivos
- **Sharp** para processamento de imagens
- **UUID** para identificação única

### Frontend
- **HTML5** semântico
- **Bootstrap 5** para design responsivo
- **JavaScript ES6+**
- **Font Awesome** para ícones
- **CSS3** com animações e gradientes

## Instalação

1. Clone o repositório:
```bash
git clone <repositório>
cd cargo-optimizer
```

2. Instale as dependências do backend:
```bash
npm install
```

3. Inicie o servidor:
```bash
npm start
```

Para desenvolvimento:
```bash
npm run dev
```

4. Abra o navegador e acesse:
```
http://localhost:5000
```

## Como Usar

1. **Carregar Imagem da Carga**
   - Clique na área de upload ou arraste uma imagem
   - A imagem será analisada automaticamente
   - Dê um nome para a sua carga

2. **Selecionar Veículo**
   - Escolha um dos veículos pré-cadastrados
   - Ou adicione um novo veículo com dimensões personalizadas

3. **Otimizar Carregamento**
   - Clique em "Otimizar Carregamento"
   - O sistema analisará se a carga cabe no veículo
   - Visualize os resultados e sugestões

4. **Analisar Resultados**
   - Verifique os percentuais de utilização
   - Veja o posicionamento sugerido
   - Acompanhe a visualização 3D

## Estrutura do Projeto

```
cargo-optimizer/
├── server.js              # Servidor backend
├── package.json           # Dependências do projeto
├── public/                # Arquivos estáticos
│   ├── index.html         # Página principal
│   ├── app.js            # Lógica frontend
│   └── uploads/          # Imagens carregadas
├── README.md              # Documentação
└── .gitignore            # Arquivos ignorados
```

## API Endpoints

### GET /api/vehicles
Retorna todos os veículos cadastrados

### POST /api/vehicles
Cadastra um novo veículo
- Body: `{ name, type, dimensions, capacity }`

### POST /api/upload
Faz upload e análise de uma imagem de carga
- FormData: `image`, `name`

### POST /api/optimize
Otimiza o carregamento de uma carga em um veículo
- Body: `{ cargoId, vehicleId }`

### GET /api/cargos
Retorna todas as cargas analisadas

## Algoritmo de Otimização

O sistema utiliza um algoritmo de verificação geométrica que:

1. **Compara Dimensões**: Verifica se a carga fisicamente cabe no espaço
2. **Calcula Volume**: Determina o percentual de utilização do espaço
3. **Verifica Peso**: Confirma se o peso está dentro da capacidade
4. **Gera Sugestões**: Oferece alternativas quando não há encaixe

## Features Futuras

- [ ] Integração com APIs de Computer Vision para análise mais precisa
- [ ] Algoritmo de empacotamento 3D avançado
- [ ] Múltiplas cargas por veículo
- [ ] Histórico de otimizações
- [ ] Exportação de relatórios
- [ ] Integração com sistemas de roteirização

## Contribuição

Contribuições são bem-vindas! Por favor:

1. Fork o projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## Licença

Este projeto está sob licença MIT.

## Contato

Para dúvidas ou sugestões, entre em contato através do GitHub.
