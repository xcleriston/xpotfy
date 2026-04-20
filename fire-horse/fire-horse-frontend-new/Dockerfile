# Etapa de construção
FROM node:18-alpine AS builder

# Define o diretório de trabalho
WORKDIR /app

# Copia os arquivos de definição de dependências
COPY package*.json ./
COPY yarn.lock ./

# Instala as dependências
RUN yarn install --frozen-lockfile

# Copia o restante dos arquivos do projeto
COPY . .

# Constrói a aplicação
RUN yarn build

# Etapa de produção
FROM nginx:alpine

# Copia os arquivos de build da etapa anterior
COPY --from=builder /app/dist /usr/share/nginx/html

# Copia a configuração personalizada do Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expõe a porta 80
EXPOSE 80

# Inicia o Nginx
CMD ["nginx", "-g", "daemon off;"]
