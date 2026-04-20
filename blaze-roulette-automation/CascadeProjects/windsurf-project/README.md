# Servidor de Proxy Local com IPs Brasileiros

Este é um servidor de proxy local que redireciona requisições HTTP/HTTPS através de proxies brasileiros.

## Instalação

1. Instale as dependências:
```bash
pip install -r requirements.txt
```

## Uso

1. Execute o servidor:
```bash
python proxy_server.py
```

2. O servidor estará disponível em `http://localhost:5000`

3. Para fazer uma requisição através do proxy, use:
```
http://localhost:5000/proxy?url=URL_DESEJADA
```

Exemplo:
```
http://localhost:5000/proxy?url=https://www.google.com
```

## Notas Importantes

- Este exemplo usa proxies estáticos. Em um ambiente de produção, você deve:
  - Usar um serviço de proxies profissional com IPs brasileiros
  - Implementar rotação automática de proxies
  - Adicionar tratamento de erros mais robusto
  - Implementar cache para melhorar performance
  - Adicionar autenticação se necessário

- Os proxies listados são apenas exemplos. Você deve obter proxies reais de um provedor confiável.
