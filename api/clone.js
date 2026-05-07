export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { sourceId, token, name, description, deduplicate } = req.body;

  if (!sourceId || !token) {
    return res.status(400).json({ error: 'ID da playlist e Token são obrigatórios' });
  }

  try {
    // 1. Get user profile to get User ID
    const userRes = await fetch('https://api.spotify.com/v1/me', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!userRes.ok) {
      const errorData = await userRes.json();
      console.error('Error fetching user:', errorData);
      return res.status(userRes.status).json({ error: `Erro ao obter usuário: ${errorData.error?.message || userRes.statusText}` });
    }
    
    const user = await userRes.json();
    const userId = user.id;

    // 2. Get tracks from source playlist (handle pagination)
    let tracks = [];
    
    // Buscamos a playlist completa primeiro. Isso evita o 403 direto no endpoint /items e já traz até 100 músicas.
    const playlistRes = await fetch(`https://api.spotify.com/v1/playlists/${sourceId}?market=from_token&additional_types=track`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!playlistRes.ok) {
      const errorData = await playlistRes.json();
      console.error('Error fetching playlist for clone:', errorData);
      return res.status(playlistRes.status).json({ error: `Erro ao obter playlist original: ${errorData.error?.message || playlistRes.statusText}` });
    }
    
    const playlistData = await playlistRes.json();
    if (playlistData.tracks && playlistData.tracks.items) {
      tracks.push(...playlistData.tracks.items.filter(item => item.track).map(item => item.track.uri));
    }
    
    let nextUrl = playlistData.tracks?.next;

    while (nextUrl) {
      // Adiciona parâmetros para evitar erro 403 de restrição de mercado na paginação
      const fetchUrl = nextUrl.includes('?') ? `${nextUrl}&market=from_token&additional_types=track` : `${nextUrl}?market=from_token&additional_types=track`;
      
      const tracksRes = await fetch(fetchUrl, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!tracksRes.ok) {
        const errorData = await tracksRes.json();
        console.error('Error fetching tracks pagination:', errorData);
        // Se a paginação falhar com 403, quebra o loop e clona o que já conseguiu (as primeiras 100)
        if (tracksRes.status === 403) break;
        return res.status(tracksRes.status).json({ error: `Erro ao obter músicas (página 2+): ${errorData.error?.message || tracksRes.statusText}` });
      }
      
      const data = await tracksRes.json();
      tracks.push(...data.items.filter(item => item.track).map(item => item.track.uri));
      nextUrl = data.next;
    }

    if (deduplicate) {
      tracks = [...new Set(tracks)];
    }

    // 3. Create NEW playlist
    const createRes = await fetch(`https://api.spotify.com/v1/users/${userId}/playlists`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: name || "Playlist Clonada",
        description: description || "Criada via Xpotfy",
        public: false
      })
    });
    
    if (!createRes.ok) {
      const errorData = await createRes.json();
      console.error('Error creating playlist:', errorData);
      return res.status(createRes.status).json({ error: `Erro ao criar playlist: ${errorData.error?.message || createRes.statusText}` });
    }
    
    const newPlaylist = await createRes.json();

    // 4. Add tracks in batches of 100
    for (let i = 0; i < tracks.length; i += 100) {
      const batch = tracks.slice(i, i + 100);
      const addRes = await fetch(`https://api.spotify.com/v1/playlists/${newPlaylist.id}/items`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ uris: batch })
      });
      
      if (!addRes.ok) {
        const errorData = await addRes.json();
        console.error('Error adding tracks:', errorData);
        return res.status(addRes.status).json({ error: `Erro ao adicionar músicas: ${errorData.error?.message || addRes.statusText}` });
      }
    }

    res.status(200).json({ 
      success: true, 
      playlist: newPlaylist,
      trackCount: tracks.length
    });

  } catch (error) {
    console.error('Erro na clonagem:', error);
    res.status(500).json({ error: `Falha ao clonar a playlist: ${error.message}` });
  }
}
