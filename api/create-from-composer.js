export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { query, token, name } = req.body;

  if (!query || !token || !name) {
    return res.status(400).json({ error: 'Query, token e nome são obrigatórios' });
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

    // 2. Search for tracks by artist/composer
    const searchRes = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=50`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!searchRes.ok) {
      const errorData = await searchRes.json();
      console.error('Error searching tracks:', errorData);
      return res.status(searchRes.status).json({ error: `Erro ao buscar músicas: ${errorData.error?.message || searchRes.statusText}` });
    }
    
    const searchData = await searchRes.json();
    const tracks = searchData.tracks?.items?.map(item => item.uri) || [];
    
    if (tracks.length === 0) {
      return res.status(400).json({ error: 'Nenhuma música encontrada' });
    }

    // 3. Create NEW playlist
    const createRes = await fetch(`https://api.spotify.com/v1/users/${userId}/playlists`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: name,
        description: `Criada via Xpotfy - Músicas de ${query}`,
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
    console.error('Erro na criação de playlist:', error);
    res.status(500).json({ error: `Falha ao criar playlist: ${error.message}` });
  }
}
