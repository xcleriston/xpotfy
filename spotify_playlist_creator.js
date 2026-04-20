// Configurações
const CLIENT_ID = '9504025adfbb4f949f5b9a2c79a1ba61';
const CLIENT_SECRET = 'cc8963906ac943e1a4f0b73926851669';
const REDIRECT_URI = 'https://investigation-appreciate-those-embedded.trycloudflare.com/callback';
const ORIGINAL_PLAYLIST_ID = '4l83kPP4fTK7uQZ585i6IC';

let accessToken = null;

async function fetchWebApi(endpoint, method, body) {
  const res = await fetch(`https://api.spotify.com/${endpoint}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    method,
    body: body ? JSON.stringify(body) : null
  });
  
  if (!res.ok) {
    const error = await res.text();
    throw new Error(`API Error ${res.status}: ${error}`);
  }
  
  return await res.json();
}

async function getAccessToken() {
  // Abre o navegador para autorização
  const authUrl = `https://accounts.spotify.com/authorize?client_id=${CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=playlist-read-private%20playlist-modify-public%20playlist-modify-private`;
  
  console.log('🔗 Abra este URL no navegador para autorizar:');
  console.log(authUrl);
  console.log('\nApós autorizar, você será redirecionado para uma URL com um parâmetro "code".');
  console.log('Copie esse código e cole abaixo:');
  
  // Em um ambiente real, isso seria feito via servidor HTTP
  const code = prompt('Cole o código de autorização aqui:');
  
  // Troca o código por token
  const tokenRes = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: REDIRECT_URI,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
    }),
  });
  
  const tokenData = await tokenRes.json();
  accessToken = tokenData.access_token;
  console.log('✅ Token obtido com sucesso');
}

async function getPlaylistTracks(playlistId) {
  const tracks = [];
  let url = `v1/playlists/${playlistId}/tracks?limit=100`;
  
  while (url) {
    const response = await fetchWebApi(url, 'GET');
    tracks.push(...response.items.map(item => item.track.uri));
    
    for (const item of response.items) {
      if (item.track) {
        console.log(`   - ${item.track.name} - ${item.track.artists[0].name}`);
      }
    }
    
    url = response.next;
  }
  
  return tracks;
}

async function createPlaylist(tracksUri) {
  const playlist = await fetchWebApi('v1/me/playlists', 'POST', {
    name: "Golden's Epoc",
    description: "Cópia da playlist original: My Mother's Best by Vitória Paiva",
    public: false
  });
  
  console.log(`✅ Playlist criada: ${playlist.name}`);
  console.log(`   Link: ${playlist.external_urls.spotify}`);
  
  // Adiciona tracks em lotes de 100
  for (let i = 0; i < tracksUri.length; i += 100) {
    const batch = tracksUri.slice(i, i + 100);
    await fetchWebApi(`v1/playlists/${playlist.id}/items?uris=${batch.join(',')}`, 'POST');
    console.log(`   Adicionadas ${batch.length} músicas (${Math.min(i + 100, tracksUri.length)}/${tracksUri.length})`);
  }
  
  return playlist;
}

async function main() {
  console.log('🎵 Conectando ao Spotify...');
  
  await getAccessToken();
  
  console.log('\n📋 Extraindo músicas da playlist original...');
  const tracks = await getPlaylistTracks(ORIGINAL_PLAYLIST_ID);
  console.log(`\n🎶 Total de ${tracks.length} músicas encontradas`);
  
  console.log('\n📝 Criando nova playlist...');
  const playlist = await createPlaylist(tracks);
  
  console.log('\n🎉 Playlist criada com sucesso!');
  console.log(`🔗 Acesse sua playlist: ${playlist.external_urls.spotify}`);
}

main().catch(console.error);
