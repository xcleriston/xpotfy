export default async function handler(req, res) {
  const { q, token } = req.query;

  if (!token) {
    return res.status(401).json({ error: 'Não autorizado' });
  }

  if (!q) {
    return res.status(400).json({ error: 'Faltando consulta' });
  }

  try {
    // Search for tracks by artist (composer/co-composer)
    // Limite alterado para 10 devido a restrição da API. Usando loop para buscar até 300.
    let tracks = [];
    for (let offset = 0; offset < 300; offset += 10) {
      const response = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(q)}&type=track&limit=10&offset=${offset}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        if (offset === 0) {
          console.error('Spotify API error:', errorData);
          return res.status(response.status).json({ 
            error: errorData.error?.message || response.statusText,
            status: response.status
          });
        }
        break; // ignora se lotes subsequentes falharem
      }
      
      const data = await response.json();
      if (data.tracks?.items) {
        tracks.push(...data.tracks.items);
      }
      
      if (!data.tracks?.next) break;
    }
    
    return res.status(200).json({ tracks: tracks });
  } catch (error) {
    console.error('Erro na busca por compositor:', error);
    res.status(500).json({ error: `Erro interno do servidor: ${error.message}` });
  }
}
