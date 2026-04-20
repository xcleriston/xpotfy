# Instruções - Sincronização com Participantes

## 📋 Dados da Planilha

Criada planilha com 12 semanas de estágio baseada na imagem fornecida:

- **Período**: 13/03/2026 a 29/05/2026
- **Local**: Hospital Regional
- **Duração**: 8 horas (480 minutos) por semana
- **Participantes**: 
  - Fabricioluiz518@gmail.com
  - eliasdmngs@gmail.com

## 🚀 Como Executar

### 1. Configurar Credenciais Google

Antes de executar, você precisa:

1. Acessar [Google Cloud Console](https://console.cloud.google.com/)
2. Criar um novo projeto ou usar existente
3. Ativar **Google Calendar API**
4. Criar credenciais OAuth 2.0
5. Baixar o arquivo `credentials.json`
6. Colocar na pasta raiz do projeto
7. Se você criou uma chave de API, adicione-a ao seu arquivo `config.json`:

```json
{
  "google_api_key": "AQ.Ab8RN6JPgJNSpD3r-SrTI2F6hcX1sfJjS32pZukvEsN6qtqi6A"
}
```

### 2. Instalar Dependências

```bash
pip install -r requirements.txt
```

### 3. Executar Sincronização

**Opção A - Script dedicado:**
```bash
python executar_sincronizacao.py
```

**Opção B - Script principal:**
```bash
python main.py --file data/eventos_com_participantes.csv
```

**Opção C - Com confirmação automática:**
```bash
python main.py --file data/eventos_com_participantes.csv --auto-confirm
```

## 📊 O Que Será Criado

### Eventos Principais (12 eventos)
- Cada evento: 8 horas (08:00 - 16:00)
- Dias: Quintas-feiras
- Participantes incluídos nos convites

### Eventos de Deslocamento
- Tempo: 30 minutos entre eventos
- Título: "🚗 Deslocamento: Hospital Regional → Hospital Regional"

### Dias de Folga
- Marcados automaticamente nos gaps entre eventos
- Cor verde na agenda

## 🔧 Personalização

### Alterar Participantes
Edite o arquivo `data/eventos_com_participantes.csv`:
```csv
Data,Hora,Título,Descrição,Local,Duração,Participantes
13/03/2026,08:00,Semana 1 - Início do Estágio,Primeira semana,Hospital Regional,480,novo@email.com;outro@email.com
```

### Configurações
Edite `config.json`:
```json
{
  "sync_options": {
    "travel_time_minutes": 45,  // Tempo de deslocamento
    "mark_off_days": false      // Desativar dias de folga
  }
}
```

## 📧 Convites por Email

Os participantes receberão automaticamente:
- Convite para cada evento
- Opção de Aceitar/Recusar/Talvez
- Lembretes configurados no Google Calendar

## 🚨 Antes de Executar

1. **Verifique os emails** dos participantes
2. **Teste com 1 evento primeiro** para confirmar
3. **Verifique o fuso horário** (America/Sao_Paulo)
4. **Confirme se tem permissão** para adicionar participantes

## 🆘 Problemas Comuns

### "Arquivo credentials.json não encontrado"
- Baixe as credenciais do Google Cloud Console
- Coloque na pasta raiz do projeto

### "Permissão negada"
- Verifique se a Google Calendar API está ativada
- Confirme as permissões OAuth

### "Eventos duplicados"
- Use a opção `--auto-confirm` com cuidado
- Verifique se `skip_existing: true` está ativo

## 📞 Suporte

Se precisar ajuda:
1. Verifique o log de erros no terminal
2. Confirme as credenciais do Google
3. Teste com a planilha de exemplo primeiro
