# Coletor de Dados da Roleta

Este é um coletor de dados para a roleta da Blaze, projetado para capturar resultados em tempo real e armazená-los em um banco de dados SQLite.

## Requisitos

- Node.js 14.x ou superior
- npm ou yarn
- Google Chrome ou Chromium instalado (para o Puppeteer)

## Instalação

1. Clone o repositório
2. Instale as dependências:

```bash
cd backend_js
npm install
```

## Configuração

1. Copie o arquivo de exemplo de configuração:

```bash
cp ../../.env.example ../../.env
```

2. Edite o arquivo `.env` conforme necessário para ajustar as configurações do coletor.

## Uso

### Iniciar o Coletor

```bash
node simple_roulette_collector.js
```

### Opções de Linha de Comando

- `--debug`: Habilita o modo de depuração (mais logs)
- `--headless=false`: Executa o navegador em modo visível (útil para depuração)
- `--log-level=debug`: Define o nível de log (error, warn, info, debug)

### Monitoramento

Se habilitado nas configurações, um servidor HTTP será iniciado para monitoramento:

```
http://localhost:3001/status
```

## Estrutura do Banco de Dados

O coletor armazena os dados na tabela `roulette_history` com a seguinte estrutura:

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | INTEGER | Chave primária |
| provider | TEXT | Provedor da roleta (ex: 'blaze') |
| game_id | TEXT | ID do jogo (ex: 'roleta-brasileira') |
| game_name | TEXT | Nome do jogo |
| result_number | INTEGER | Número sorteado |
| result_color | TEXT | Cor do resultado (red, black, white) |
| round_id | TEXT | ID da rodada |
| timestamp | DATETIME | Data e hora do sorteio |
| raw_data | TEXT | Dados brutos da API em JSON |
| created_at | DATETIME | Data e hora de criação do registro |

## Solução de Problemas

### Erros Comuns

1. **Erro ao iniciar o navegador**: Verifique se o Chrome/Chromium está instalado e acessível.
2. **Erros de conexão**: Verifique sua conexão com a internet e se o site da Blaze está acessível.
3. **Erros de banco de dados**: Verifique as permissões de escrita no diretório de dados.

### Logs

Os logs são armazenados em `logs/roulette_collector.log` por padrão. Verifique este arquivo para obter mais informações sobre erros.

## Desenvolvimento

### Estrutura do Código

- `simple_roulette_collector.js`: Ponto de entrada do coletor
- `collector.config.js`: Configurações do coletor
- `utils/logger.js`: Utilitário de log
- `database/`: Código relacionado ao banco de dados

### Testes

Para executar os testes:

```bash
npm test
```

## Licença

MIT
