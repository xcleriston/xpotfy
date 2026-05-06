let accessToken = null;
let currentSourcePlaylist = null;

const loginBtn = document.getElementById('login-btn');
const authSection = document.getElementById('auth-section');
const appSection = document.getElementById('app-section');
const searchBtn = document.getElementById('search-btn');
const composerSearchBtn = document.getElementById('composer-search-btn');
const createComposerPlaylistBtn = document.getElementById('create-composer-playlist-btn');
const composerActions = document.getElementById('composer-actions');
const useTokenBtn = document.getElementById('use-token-btn');
const manualTokenInput = document.getElementById('manual-token');
const queryInput = document.getElementById('playlist-query');
const composerQueryInput = document.getElementById('composer-query');
const composerPlaylistNameInput = document.getElementById('composer-playlist-name');
const resultsGrid = document.getElementById('results');
const previewSection = document.getElementById('preview-section');
const cloneBtn = document.getElementById('clone-btn');
const statusSection = document.getElementById('status-section');
const successSection = document.getElementById('success-section');

// --- Auth Handling ---

useTokenBtn.addEventListener('click', () => {
    const manualToken = manualTokenInput.value.trim();
    if (manualToken) {
        accessToken = manualToken;
        authSection.classList.add('hidden');
        appSection.classList.remove('hidden');
    } else {
        alert('Por favor, insira um token válido');
    }
});

loginBtn.addEventListener('click', () => {
    const width = 450, height = 730;
    const left = (screen.width / 2) - (width / 2);
    const top = (screen.height / 2) - (height / 2);
    
    window.open(
        '/api/login', 
        'Spotify Login', 
        `menubar=no,location=no,resizable=no,scrollbars=no,status=no,width=${width},height=${height},top=${top},left=${left}`
    );
});

window.addEventListener('message', async (event) => {
    if (event.data.code) {
        // Exchange code for token
        try {
            const res = await fetch('/api/token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: event.data.code })
            });
            const data = await res.json();
            
            if (data.access_token) {
                accessToken = data.access_token;
                showApp();
            }
        } catch (err) {
            console.error('Token error:', err);
            alert('Erro ao autenticar. Tente novamente.');
        }
    }
});

function showApp() {
    authSection.classList.add('hidden');
    appSection.classList.remove('hidden');
    document.querySelector('.hero').classList.add('hidden');
}

// --- Search Handling ---

searchBtn.addEventListener('click', async () => {
    const query = queryInput.value.trim();
    if (!query) return;

    // Check if it's a URL or ID
    const playlistIdMatch = query.match(/playlist\/([a-zA-Z0-9]+)/) || query.match(/^([a-zA-Z0-9]{22})$/);
    
    resultsGrid.innerHTML = '<div class="loader"></div>';
    previewSection.classList.add('hidden');

    try {
        if (playlistIdMatch) {
            const id = playlistIdMatch[1];
            const res = await fetch(`/api/search?id=${id}&token=${accessToken}`);
            const playlist = await res.json();
            if (!res.ok) throw new Error(playlist.error || 'Erro na API');
            showPreview(playlist);
        } else {
            const res = await fetch(`/api/search?q=${encodeURIComponent(query)}&token=${accessToken}`);
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Erro na API');
            showResults(data.playlists.items);
        }
    } catch (err) {
        console.error('Search error:', err);
        resultsGrid.innerHTML = `<p class="error">Falha ao buscar: ${err.message}</p>`;
    }
});

composerSearchBtn.addEventListener('click', async () => {
    const query = composerQueryInput.value.trim();
    if (!query) return;

    resultsGrid.innerHTML = '<div class="loader"></div>';
    previewSection.classList.add('hidden');

    try {
        const res = await fetch(`/api/composer?q=${encodeURIComponent(query)}&token=${accessToken}`);
        const data = await res.json();
        if (!res.ok) {
            throw new Error(data.error || 'Erro na API');
        }
        showComposerResults(data.tracks);
    } catch (err) {
        console.error('Composer search error:', err);
        resultsGrid.innerHTML = `<p class="error">Erro ao buscar: ${err.message}</p>`;
    }
});

createComposerPlaylistBtn.addEventListener('click', async () => {
    const name = composerPlaylistNameInput.value.trim();
    if (!name) {
        alert('Por favor, insira um nome para a playlist');
        return;
    }

    appSection.classList.add('hidden');
    statusSection.classList.remove('hidden');
    
    const progressFill = document.getElementById('progress-fill');
    progressFill.style.width = '30%';

    try {
        const res = await fetch('/api/create-from-composer', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                query: composerQueryInput.value.trim(),
                token: accessToken,
                name: name
            })
        });
        
        const data = await res.json();
        
        if (!res.ok) {
            throw new Error(data.error || 'Falha ao criar playlist');
        }

        progressFill.style.width = '100%';
        
        document.getElementById('status-msg').innerText = 'Playlist criada com sucesso!';
        
        setTimeout(() => {
            statusSection.classList.add('hidden');
            successSection.classList.remove('hidden');
            document.getElementById('playlist-link').href = data.playlist.external_urls.spotify;
        }, 500);
        
    } catch (err) {
        console.error('Error creating playlist:', err);
        document.getElementById('status-msg').innerText = 'Erro: ' + err.message;
        document.getElementById('progress-fill').style.backgroundColor = '#e91429';
        
        setTimeout(() => {
            appSection.classList.remove('hidden');
            statusSection.classList.add('hidden');
        }, 2000);
    }
});

function showResults(items) {
    resultsGrid.innerHTML = items.map(item => `
        <div class="playlist-card" onclick="loadPlaylist('${item.id}')">
            <img src="${item.images[0]?.url || 'https://via.placeholder.com/150'}" alt="${item.name}">
            <h4>${item.name}</h4>
            <p>${item.tracks.total} músicas</p>
        </div>
    `).join('');
}

function showComposerResults(tracks) {
    if (!tracks || !Array.isArray(tracks)) {
        resultsGrid.innerHTML = '<p class="error">Nenhuma música encontrada</p>';
        composerActions.classList.add('hidden');
        return;
    }
    
    composerActions.classList.remove('hidden');
    composerPlaylistNameInput.value = composerQueryInput.value + ' - Playlist';
    
    resultsGrid.innerHTML = tracks.map(track => `
        <div class="playlist-card">
            <img src="${track.album?.images[0]?.url || 'https://via.placeholder.com/150'}" alt="${track.name}">
            <h4>${track.name}</h4>
            <p>${track.artists.map(a => a.name).join(', ')}</p>
        </div>
    `).join('');
}

window.loadPlaylist = async (id) => {
    const res = await fetch(`/api/search?id=${id}&token=${accessToken}`);
    const playlist = await res.json();
    showPreview(playlist);
};

function showPreview(playlist) {
    currentSourcePlaylist = playlist;
    previewSection.classList.remove('hidden');
    resultsGrid.innerHTML = '';
    
    document.getElementById('preview-img').src = playlist.images[0]?.url || '';
    document.getElementById('preview-name').innerText = playlist.name;
    document.getElementById('preview-owner').querySelector('span').innerText = playlist.owner.display_name;
    
    if (playlist.tracks && playlist.tracks.total !== undefined) {
        document.getElementById('preview-tracks').querySelector('span').innerText = playlist.tracks.total;
    } else if (playlist.error) {
        document.getElementById('preview-tracks').querySelector('span').innerText = 'Erro: ' + playlist.error;
    } else {
        document.getElementById('preview-tracks').querySelector('span').innerText = 'Dados não disponíveis (erro Spotify API)';
    }
    
    document.getElementById('clone-name').value = `Cópia de ${playlist.name}`;
}

// --- Clone Handling ---

cloneBtn.addEventListener('click', async () => {
    if (!currentSourcePlaylist) return;

    const name = document.getElementById('clone-name').value;
    const deduplicate = document.getElementById('deduplicate').checked;

    appSection.classList.add('hidden');
    statusSection.classList.remove('hidden');
    
    const progressFill = document.getElementById('progress-fill');
    progressFill.style.width = '30%';

    try {
        const res = await fetch('/api/clone', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                sourceId: currentSourcePlaylist.id,
                token: accessToken,
                name: name,
                deduplicate: deduplicate
            })
        });

        const data = await res.json();
        progressFill.style.width = '100%';

        if (data.success) {
            setTimeout(() => {
                showSuccess(data.playlist.external_urls.spotify);
            }, 1000);
        } else {
            throw new Error(data.error);
        }
    } catch (err) {
        console.error('Clone error:', err);
        alert('Erro ao clonar: ' + err.message);
        statusSection.classList.add('hidden');
        appSection.classList.remove('hidden');
    }
});

function showSuccess(link) {
    statusSection.classList.add('hidden');
    successSection.classList.remove('hidden');
    document.getElementById('playlist-link').href = link;
}

document.getElementById('reset-btn').addEventListener('click', () => {
    successSection.classList.add('hidden');
    appSection.classList.remove('hidden');
    queryInput.value = '';
    previewSection.classList.add('hidden');
});
