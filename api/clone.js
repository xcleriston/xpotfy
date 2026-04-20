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
    let nextUrl = `https://api.spotify.com/v1/playlists/${sourceId}/tracks?limit=100`;

    while (nextUrl) {
      const tracksRes = await fetch(nextUrl, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!tracksRes.ok) {
        const errorData = await tracksRes.json();
        console.error('Error fetching tracks:', errorData);
        return res.status(tracksRes.status).json({ error: `Erro ao obter músicas: ${errorData.error?.message || tracksRes.statusText}` });
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
