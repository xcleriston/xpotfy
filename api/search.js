export default async function handler(req, res) {
  const { q, id, token } = req.query;

  if (!token) {
    return res.status(401).json({ error: 'Não autorizado' });
  }

  try {
    if (id) {
      // Get specific playlist details
      const response = await fetch(`https://api.spotify.com/v1/playlists/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      return res.status(response.status).json(data);
    } else if (q) {
      // Search for playlists
      const response = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(q)}&type=playlist&limit=10`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      return res.status(response.status).json(data);
    } else {
      return res.status(400).json({ error: 'Faltando consulta ou ID' });
    }
  } catch (error) {
    console.error('Erro na busca:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}
