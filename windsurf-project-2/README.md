# YouTube 5 Seconds Transcriber

Script automatizado para extrair transcrições dos primeiros 5 segundos de vídeos de um canal do YouTube diretamente no browser, sem necessidade de download.

## Funcionalidades

- Acessa vídeos de um canal do YouTube automaticamente
- **Suporte para vídeos privados com login automático**
- Reproduz os primeiros 5 segundos de cada vídeo
- Extrai transcrição usando legendas do YouTube
- Gera arquivos JSON e TXT com resultados
- Interface amigável via linha de comando

## Instalação

1. Instale Python 3.7+ se ainda não tiver
2. Instale as dependências:
```bash
pip install -r requirements.txt
```

3. Instale o Chrome browser (necessário para Selenium)

## Como Usar

### Versão Interativa (padrão)
```bash
python youtube_transcriber.py
```

### Versão Automática (com credenciais pré-configuradas)
```bash
python youtube_transcriber_auto.py
```

## Funcionalidades para Vídeos Privados

O script agora suporta:
- **Login automático** no YouTube/Google
- **Acesso a vídeos privados** após autenticação
- **Verificação em duas etapas** (com intervenção manual se necessário)
- **Sessão mantida** durante todo o processamento

## Formatos de URL Aceitos

- Canais: `https://www.youtube.com/c/NOME_DO_CANAL`
- Canais: `https://www.youtube.com/@NOME_DO_CANAL`
- Canais: `https://www.youtube.com/channel/CHANNEL_ID`

## Arquivos Gerados

- `transcricoes.json`: Dados estruturados em formato JSON
- `transcricoes.txt`: Relatório formatado em texto

## Observações

- O script abre o Chrome para acessar os vídeos
- Alguns vídeos podem não ter legendas disponíveis
- O processamento pode levar alguns minutos dependendo da quantidade de vídeos
- Use internet estável para melhores resultados
- Para vídeos privados, o script fará login automaticamente

## Troubleshooting

- Se o Chrome não abrir, verifique se está instalado corretamente
- Se as legendas não funcionarem, tente executar sem modo headless (altere `headless=False`)
- Para canais muito grandes, limite o número de vídeos para evitar timeouts
- Se o login falhar, verifique as credenciais ou complete a verificação em duas etapas manualmente

## Segurança

- As credenciais são usadas apenas para login no YouTube/Google
- Não são armazenadas em arquivos
- Use a versão interativa se preferir digitar as credenciais a cada execução
