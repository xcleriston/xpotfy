export default function handler(req, res) {
  const client_id = process.env.SPOTIFY_CLIENT_ID;
  const redirect_uri = process.env.SPOTIFY_REDIRECT_URI;
  const scope = 'playlist-read-private playlist-modify-public playlist-modify-private user-library-read';
  const state = Math.random().toString(36).substring(7);

  const authUrl = new URL('https://accounts.spotify.com/authorize');
  authUrl.searchParams.append('response_type', 'code');
  authUrl.searchParams.append('client_id', client_id);
  authUrl.searchParams.append('scope', scope);
  authUrl.searchParams.append('redirect_uri', redirect_uri);
  authUrl.searchParams.append('state', state);

  res.redirect(authUrl.toString());
}
