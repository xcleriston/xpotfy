# Fire Horse - Frontend

Frontend para o sistema de apostas Fire Horse, construído com React, TypeScript, Chakra UI e Vite.

## 🚀 Começando

### Pré-requisitos

- Node.js (versão 16 ou superior)
- npm ou yarn

### Instalação

1. Clone o repositório:
   ```bash
   git clone https://github.com/seu-usuario/fire-horse-frontend.git
   cd fire-horse-frontend
   ```

2. Instale as dependências:
   ```bash
   npm install
   # ou
   yarn
   ```

3. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   # ou
   yarn dev
   ```

4. Abra [http://localhost:3000](http://localhost:3000) no seu navegador para ver a aplicação.

## 🛠 Tecnologias

- [React](https://reactjs.org/)
- [TypeScript](https://www.typescriptlang.org/)
- [Chakra UI](https://chakra-ui.com/)
- [Vite](https://vitejs.dev/)
- [React Router](https://reactrouter.com/)
- [React Query](https://react-query.tanstack.com/)
- [Formik](https://formik.org/)
- [Yup](https://github.com/jquense/yup)
- [ESLint](https://eslint.org/)
- [Prettier](https://prettier.io/)

## 📦 Estrutura do Projeto

```
src/
├── components/         # Componentes reutilizáveis
│   ├── common/        # Componentes comuns (Loading, ErrorMessage, etc.)
│   ├── forms/         # Componentes de formulário
│   ├── layout/        # Componentes de layout (Header, Sidebar, etc.)
│   └── ui/            # Componentes de UI genéricos
├── hooks/             # Hooks personalizados
├── pages/             # Páginas da aplicação
├── services/          # Serviços de API
├── styles/            # Estilos globais
├── types/             # Tipos TypeScript
├── utils/             # Utilitários
├── App.tsx            # Componente principal
└── main.tsx           # Ponto de entrada da aplicação
```

## 🎨 Tema

O tema da aplicação pode ser personalizado através do arquivo `src/theme.ts`.

## 🔧 Desenvolvimento

- `npm run dev` - Inicia o servidor de desenvolvimento
- `npm run build` - Gera a versão de produção
- `npm run lint` - Executa o linter
- `npm run format` - Formata o código com Prettier
- `npm run preview` - Visualiza a versão de produção localmente

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 🙏 Agradecimentos

- [Chakra UI](https://chakra-ui.com/) pela incrível biblioteca de componentes
- [Vite](https://vitejs.dev/) pela incrível experiência de desenvolvimento
- [React Query](https://react-query.tanstack.com/) pelo gerenciamento de estado do servidor
- [Formik](https://formik.org/) pelo gerenciamento de formulários
- [Yup](https://github.com/jquense/yup) pela validação de esquemas
