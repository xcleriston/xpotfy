# Integrador de Planilha com Google Agenda

Sistema para automatizar a inserção de eventos de uma planilha para o Google Agenda, com planejamento de deslocamento e sinalização de dias de folga.

## Funcionalidades

- ✅ Leitura de planilhas Excel/CSV
- ✅ Integração com Google Calendar API
- ✅ Inserção automática de eventos
- ✅ Planejamento de tempo de deslocamento
- ✅ Sinalização de dias de folga
- ✅ Interface de configuração

## Configuração Inicial

1. Instale as dependências:
```bash
pip install -r requirements.txt
```

2. Configure as credenciais do Google:
- Crie um projeto no Google Cloud Console
- Ative a Google Calendar API
- Baixe o arquivo `credentials.json`
- Coloque-o na pasta raiz do projeto

3. Execute o sistema:
```bash
python main.py
```

## Estrutura da Planilha

A planilha deve conter as seguintes colunas:
- `Data`: Data do evento (formato DD/MM/YYYY)
- `Hora`: Hora do evento (formato HH:MM)
- `Título`: Título do evento
- `Descrição`: Descrição do evento
- `Local`: Local do evento
- `Duração`: Duração em minutos

## Uso

1. Coloque sua planilha na pasta `data/`
2. Configure as opções no arquivo `config.json`
3. Execute o script para sincronizar os eventos
