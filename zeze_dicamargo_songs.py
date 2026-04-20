import spotipy
from spotipy.oauth2 import SpotifyOAuth

# Configurações
CLIENT_ID = '9504025adfbb4f949f5b9a2c79a1ba61'
CLIENT_SECRET = 'cc8963906ac943e1a4f0b73926851669'
REDIRECT_URI = 'https://investigation-appreciate-those-embedded.trycloudflare.com/callback'

def main():
    print("🎵 Conectando ao Spotify...")
    
    # Autenticação
    sp = spotipy.Spotify(auth_manager=SpotifyOAuth(
        client_id=CLIENT_ID,
        client_secret=CLIENT_SECRET,
        redirect_uri=REDIRECT_URI,
        scope='user-library-read'
    ))
    
    print("✅ Autenticado com sucesso")
    
    # Buscar artista Zezé Di Camargo
    print("\n🔍 Buscando artista Zezé Di Camargo...")
    results = sp.search(q='artist:"Zezé Di Camargo"', type='artist', limit=1)
    
    if not results['artists']['items']:
        print("❌ Artista não encontrado")
        return
    
    artist = results['artists']['items'][0]
    artist_id = artist['id']
    artist_name = artist['name']
    print(f"✅ Artista encontrado: {artist_name}")
    print(f"   ID: {artist_id}")
    print(f"   Gêneros: {', '.join(artist['genres'])}")
    
    # Obter álbuns do artista
    print(f"\n📀 Buscando álbuns de {artist_name}...")
    albums = []
    results = sp.artist_albums(artist_id, album_type='album', limit=50)
    albums.extend(results['items'])
    
    while results['next']:
        results = sp.next(results)
        albums.extend(results['items'])
    
    print(f"✅ Encontrados {len(albums)} álbuns")
    
    # Extrair músicas de cada álbum
    print(f"\n🎶 Extraindo músicas...")
    all_tracks = []
    
    for album in albums:
        album_name = album['name']
        album_id = album['id']
        print(f"   Álbum: {album_name}")
        
        results = sp.album_tracks(album_id)
        tracks = results['items']
        
        for track in tracks:
            track_info = {
                'name': track['name'],
                'album': album_name,
                'album_year': album['release_date'][:4],
                'artists': [a['name'] for a in track['artists']],
                'duration_ms': track['duration_ms']
            }
            all_tracks.append(track_info)
        
        while results['next']:
            results = sp.next(results)
            for track in results['items']:
                track_info = {
                    'name': track['name'],
                    'album': album_name,
                    'album_year': album['release_date'][:4],
                    'artists': [a['name'] for a in track['artists']],
                    'duration_ms': track['duration_ms']
                }
                all_tracks.append(track_info)
    
    print(f"\n✅ Total de {len(all_tracks)} músicas encontradas")
    
    # Filtrar músicas onde Zezé Di Camargo é autor ou co-autor
    # Nota: A API do Spotify não fornece informações de autoria/composição
    # Vamos listar todas as músicas onde Zezé Di Camargo aparece como artista
    print(f"\n📝 Filtrando músicas onde {artist_name} aparece como artista...")
    
    zeze_tracks = [t for t in all_tracks if artist_name in t['artists']]
    print(f"✅ Encontradas {len(zeze_tracks)} músicas")
    
    # Salvar em arquivo
    with open('zeze_dicamargo_songs.txt', 'w', encoding='utf-8') as f:
        f.write(f"Músicas de {artist_name}\n")
        f.write(f"Total: {len(zeze_tracks)} músicas\n")
        f.write("=" * 80 + "\n\n")
        
        for track in zeze_tracks:
            f.write(f"Nome: {track['name']}\n")
            f.write(f"Álbum: {track['album']} ({track['album_year']})\n")
            f.write(f"Artistas: {', '.join(track['artists'])}\n")
            f.write(f"Duração: {track['duration_ms'] // 1000 // 60}:{(track['duration_ms'] // 1000 % 60):02d}\n")
            f.write("-" * 80 + "\n")
    
    print(f"\n✅ Lista salva em 'zeze_dicamargo_songs.txt'")
    
    # Exibir resumo
    print(f"\n📊 Resumo:")
    print(f"   Artista: {artist_name}")
    print(f"   Álbuns: {len(albums)}")
    print(f"   Músicas totais: {len(all_tracks)}")
    print(f"   Músicas com {artist_name}: {len(zeze_tracks)}")

if __name__ == '__main__':
    main()
