# 🎵 Xpotfy - Spotify Playlist Cloner

Xpotfy é uma aplicação web premium projetada para clonar qualquer playlist do Spotify instantaneamente. Agora com interface moderna, busca de playlists e remoção de duplicatas.

## ✨ Funcionalidades

- **Busca Integrada**: Encontre playlists por nome ou link direto.
- **Preview de Playlist**: Veja detalhes (capa, faixas, dono) antes de clonar.
- **Clonagem Inteligente**: Cria uma nova playlist na sua conta e copia todas as músicas.
- **Deduplicação Pro**: Opção para remover músicas repetidas automaticamente.
- **Interface Premium**: Design responsivo com estética "Glassmorphism".

## 🚀 Como fazer o Deploy no Vercel

1. **Clone este repositório:**
   ```bash
   git clone https://github.com/xcleriston/xpotfy
   cd xpotfy
   ```

2. **Configure o Spotify Developer Dashboard:**
   - Vá para [Spotify Dashboard](https://developer.spotify.com/dashboard).
   - Crie um novo App.
   - Em **Settings**, adicione a seguinte **Redirect URI**: `https://seu-projeto.vercel.app/api/callback`.

3. **Deploy no Vercel:**
   - Linke seu repositório no Vercel.
   - Configure as seguintes **Environment Variables**:
     - `SPOTIFY_CLIENT_ID`: Seu Client ID do Spotify.
     - `SPOTIFY_CLIENT_SECRET`: Seu Client Secret do Spotify.
     - `SPOTIFY_REDIRECT_URI`: `https://seu-projeto.vercel.app/api/callback`.

4. **Pronto!** Sua aplicação estará rodando em sua URL do Vercel.

## 🛠️ Tecnologias

- **Backend**: Vercel Serverless Functions (Node.js)
- **Frontend**: Vanila HTML, CSS (Aesthetics-first) & JavaScript
- **API**: Spotify Web API

---
Criado para ser simples, rápido e elegante.
