import spotipy
from spotipy.oauth2 import SpotifyOAuth
import time

# Configurações
CLIENT_ID = '9504025adfbb4f949f5b9a2c79a1ba61'
CLIENT_SECRET = 'cc8963906ac943e1a4f0b73926851669'
REDIRECT_URI = 'https://investigation-appreciate-those-embedded.trycloudflare.com/callback'
ORIGINAL_PLAYLIST_ID = '4l83kPP4fTK7uQZ585i6IC'

# Escopos necessários
SCOPE = 'playlist-read-private playlist-modify-public playlist-modify-private'

def main():
    print("🎵 Conectando ao Spotify...")
    
    # Autenticação padrão do spotipy
    sp = spotipy.Spotify(auth_manager=SpotifyOAuth(
        client_id=CLIENT_ID,
        client_secret=CLIENT_SECRET,
        redirect_uri=REDIRECT_URI,
        scope=SCOPE
    ))
    
    print("✅ Autenticado com sucesso")
    
    # Extrair músicas da playlist original
    print(f"\n📋 Extraindo músicas da playlist original...")
    tracks = []
    results = sp.playlist_items(ORIGINAL_PLAYLIST_ID)
    
    while results:
        for item in results['items']:
            track = item['track']
            if track:
                tracks.append(track['uri'])
                print(f"   - {track['name']} - {track['artists'][0]['name']}")
        
        if results['next']:
            results = sp.next(results)
        else:
            break
    
    print(f"\n🎶 Total de {len(tracks)} músicas encontradas")
    
    # Obter informações da playlist original para pegar o owner ID
    playlist_info = sp.playlist(ORIGINAL_PLAYLIST_ID)
    user_id = playlist_info['owner']['id']
    print(f"✅ Usando ID do usuário: {user_id}")
    
    # Criar nova playlist
    print(f"\n📝 Criando nova playlist...")
    playlist_name = "Golden's Epoc"
    playlist_description = "Cópia da playlist original: My Mother's Best by Vitória Paiva"
    
    playlist = sp.user_playlist_create(
        user=user_id,
        name=playlist_name,
        description=playlist_description,
        public=False
    )
    
    print(f"✅ Playlist criada: {playlist['name']}")
    print(f"   Link: {playlist['external_urls']['spotify']}")
    
    # Adicionar músicas à nova playlist (em lotes de 100)
    print(f"\n➕ Adicionando músicas à nova playlist...")
    
    for i in range(0, len(tracks), 100):
        batch = tracks[i:i+100]
        sp.playlist_add_items(playlist['id'], batch)
        print(f"   Adicionadas {len(batch)} músicas ({min(i+100, len(tracks))}/{len(tracks)})")
        time.sleep(0.5)  # Pequena pausa para evitar rate limiting
    
    print(f"\n🎉 Playlist criada com sucesso!")
    print(f"🔗 Acesse sua playlist: {playlist['external_urls']['spotify']}")

if __name__ == '__main__':
    main()
