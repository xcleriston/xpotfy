# Spotify Playlist Creator

Script para criar uma cópia de playlist do Spotify.

## Deploy no Vercel

1. **Instale o Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Faça login no Vercel:**
   ```bash
   vercel login
   ```

3. **Deploy do projeto:**
   ```bash
   vercel
   ```
   - Pressione Enter para aceitar as configurações padrão
   - Anote a URL gerada (ex: `https://seu-projeto.vercel.app`)

4. **Atualize o script Python:**
   - Abra `spotify_playlist_creator.py`
   - Substitua `https://seu-projeto.vercel.app/api/callback` pela sua URL real do Vercel

5. **Configure o Spotify Dashboard:**
   - Vá em https://developer.spotify.com/dashboard
   - Abra seu app
   - Clique em "Edit Settings"
   - Em "Redirect URIs", adicione: `https://sua-url-vercel.app/api/callback`
   - Salve

6. **Execute o script:**
   ```bash
   python spotify_playlist_creator.py
   ```

## Estrutura do Projeto

- `api/callback.js` - API route do Vercel para receber o callback do Spotify
- `spotify_playlist_creator.py` - Script principal para criar a playlist
- `requirements.txt` - Dependências Python
