document.addEventListener('DOMContentLoaded', () => {

    const TWITCH_CLIENT_ID = 'hn3bv315fm9y27waq2b448v3l6veau';
    const TWITCH_ACCESS_TOKEN = 'ws24sgpirt10yhi0mcklr98idk9n1v';
    const TWITCH_API_BASE_URL = 'https://api.twitch.tv/helix';

    const UNOESC_ACCESS_TOKEN = '448028';
    const UNOESC_API_BASE_URL = 'https://www.piway.com.br/unoesc/api';

    const contentDisplay = document.getElementById('content-display');
    const searchInput = document.getElementById('search-input');
    const searchButton = document.getElementById('search-button');
    const btnTopGames = document.getElementById('btn-top-games');

    const logsModal = new bootstrap.Modal(document.getElementById('logsModal'));
    const modalLogsBody = document.getElementById('modal-logs-body');
    const logsModalElement = document.getElementById('logsModal');

    async function registerLog(action, details = '') {
        const logEndpoint = `${UNOESC_API_BASE_URL}/logs`;
        try {
            await fetch(logEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'token': UNOESC_ACCESS_TOKEN
                },
                body: JSON.stringify({
                    action: action,
                    details: details,
                    timestamp: new Date().toISOString()
                })
            });
            console.log('Log registrado com sucesso na API da Unoesc.');
        } catch (error) {
            console.error('Erro no registro de log (API Unoesc):', error);
        }
    }

    async function fetchAndDisplayLogs() {
        modalLogsBody.innerHTML = `<div class="d-flex justify-content-center"><div class="spinner-border" role="status"><span class="visually-hidden">Carregando...</span></div></div>`;
        try {
            const response = await fetch(`${UNOESC_API_BASE_URL}/logs`, {
                headers: { 'token': UNOESC_ACCESS_TOKEN }
            });
            if (!response.ok) throw new Error('Não foi possível carregar os logs.');
            const logs = await response.json();
            renderLogs(logs);
        } catch (error) {
            modalLogsBody.innerHTML = `<div class="alert alert-danger">${error.message}</div>`;
        }
    }
    
    async function deleteLog(logId) {
        try {
            const response = await fetch(`${UNOESC_API_BASE_URL}/logs/${logId}`, {
                method: 'DELETE',
                headers: { 'token': UNOESC_ACCESS_TOKEN }
            });
            if (!response.ok) throw new Error('Falha ao excluir o log.');
            fetchAndDisplayLogs();
        } catch (error) {
            console.error('Erro ao excluir log:', error);
        }
    }

    function renderLogs(logs) {
        if (!logs || logs.length === 0) {
            modalLogsBody.innerHTML = '<p class="text-center">Nenhum log registrado ainda.</p>';
            return;
        }
        logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        let logsHtml = '<ul class="list-group">';
        logs.forEach(log => {
            logsHtml += `
                <li class="list-group-item d-flex justify-content-between align-items-center">
                    <div>
                        <strong>${log.action}</strong>: ${log.details}
                        <br>
                        <small class="text-muted">${new Date(log.timestamp).toLocaleString('pt-BR')}</small>
                    </div>
                    <button class="btn btn-danger btn-sm btn-delete-log" data-log-id="${log.id}">
                        <i class="bi bi-trash"></i>
                    </button>
                </li>
            `;
        });
        logsHtml += '</ul>';
        modalLogsBody.innerHTML = logsHtml;
    }

    function fetchTopGames() {
        showLoader();
        const endpoint = '/games/top?first=20';

        fetch(TWITCH_API_BASE_URL + endpoint, {
            headers: {
                'Client-ID': TWITCH_CLIENT_ID,
                'Authorization': `Bearer ${TWITCH_ACCESS_TOKEN}`
            }
        })
        .then(response => {
            if (response.status === 401) throw new Error('Token de acesso da Twitch inválido!');
            if (!response.ok) throw new Error('Falha na resposta da rede (Twitch).');
            return response.json();
        })
        .then(data => {
            console.log('Reposta da API (Twitch - Top Games):', data);
            
            renderGames(data.data); 
            registerLog('Busca de Top Jogos (Twitch)', `Retornados ${data.data.length} jogos.`);
        })
        .catch(error => {
            console.error('Erro ao buscar top jogos:', error);
            showError(`Erro: ${error.message}`);
        });
    }

    function searchGames() {
        const query = searchInput.value.trim();
        if (!query) {
            showError("Por favor, digite o nome de um jogo para buscar.");
            return;
        }
        showLoader();
        const endpoint = `/search/categories?query=${encodeURIComponent(query)}&first=20`; // Endpoint da Twitch

        fetch(TWITCH_API_BASE_URL + endpoint, {
            headers: {
                // Credenciais da Twitch
                'Client-ID': TWITCH_CLIENT_ID,
                'Authorization': `Bearer ${TWITCH_ACCESS_TOKEN}`
            }
        })
        .then(response => response.json())
        .then(data => {
            console.log('Reposta da API (Twitch - Busca):', data);
            
            renderGames(data.data);

            registerLog('Pesquisa de Jogo (Twitch)', `Busca por: '${query}'. Retornados ${data.data.length} jogos.`);
        })
        .catch(error => {
            console.error('Erro ao buscar jogos:', error);
            showError("Não foi possível realizar a busca.");
        });
    }

    function fetchStreamsForGame(gameId, gameName) {
        showLoader();
        const endpoint = `/streams?game_id=${gameId}&first=21`;

        fetch(TWITCH_API_BASE_URL + endpoint, {
            headers: {
                'Client-ID': TWITCH_CLIENT_ID,
                'Authorization': `Bearer ${TWITCH_ACCESS_TOKEN}`
            }
        })
        .then(response => response.json())
        .then(data => {
            console.log('Reposta da API (Twitch - Streams):', data);
            
            renderStreams(data.data, gameName);

            registerLog('Busca de Streams por Jogo (Twitch)', `Jogo: '${gameName}'. Retornadas ${data.data.length} streams.`);
        })
        .catch(error => {
            console.error('Erro ao buscar streams:', error);
            showError("Não foi possível carregar as transmissões.");
        });
    }

    const showLoader = () => {
        contentDisplay.innerHTML = `<div class="d-flex justify-content-center mt-5"><div class="spinner-border text-primary" style="width: 3rem; height: 3rem;" role="status"><span class="visually-hidden">Carregando...</span></div></div>`;
    };

    const showError = (message) => {
        contentDisplay.innerHTML = `<div class="alert alert-danger">${message}</div>`;
    };

    const renderGames = (games) => {
        if (!games || games.length === 0) {
            showError('Nenhuma categoria (jogo) encontrada.');
            return;
        }
        let galleryHtml = '<div class="row g-4">';
        games.forEach(game => {
            const imageUrl = game.box_art_url.replace('{width}', '285').replace('{height}', '380');
            galleryHtml += `
                <div class="col-6 col-md-4 col-lg-3">
                    <div class="card h-100 shadow-sm game-card" style="cursor: pointer;" data-game-id="${game.id}" data-game-name="${game.name}">
                        <img src="${imageUrl}" class="card-img-top" alt="${game.name}">
                        <div class="card-body"><h6 class="card-title text-truncate">${game.name}</h6></div>
                    </div>
                </div>`;
        });
        galleryHtml += '</div>';
        contentDisplay.innerHTML = galleryHtml;
    };

    const renderStreams = (streams, gameName) => {
        if (!streams || streams.length === 0) {
            showError(`Ninguém está ao vivo em "${gameName}" no momento.`);
            return;
        }
        let galleryHtml = `<h2 class="mb-4">Transmitindo Agora: ${gameName}</h2><div class="row g-4">`;
        streams.forEach(stream => {
            const thumbnailUrl = stream.thumbnail_url.replace('{width}', '440').replace('{height}', '248');
            galleryHtml += `
                <div class="col-12 col-md-6 col-lg-4">
                    <div class="card h-100 shadow-sm">
                        <a href="https://twitch.tv/${stream.user_login}" target="_blank"><img src="${thumbnailUrl}" class="card-img-top" alt="Thumbnail de ${stream.user_name}"></a>
                        <div class="card-body">
                            <h5 class="card-title text-truncate">${stream.title}</h5>
                            <p class="card-text"><a href="https://twitch.tv/${stream.user_login}" target="_blank" class="text-decoration-none">${stream.user_name}</a></p>
                        </div>
                        <div class="card-footer text-muted"><i class="bi bi-eye-fill"></i> ${stream.viewer_count.toLocaleString('pt-BR')} espectadores</div>
                    </div>
                </div>`;
        });
        galleryHtml += '</div>';
        contentDisplay.innerHTML = galleryHtml;
    };

    https://www.piway.com.br/unoesc/api/excluir/log/IDLOG/aluno/$'ACCES_TOKEN2'
    btnTopGames.addEventListener('click', fetchTopGames);
    searchButton.addEventListener('click', searchGames);
    searchInput.addEventListener('keyup', (event) => {
        if (event.key === 'Enter') searchGames();
    });
    contentDisplay.addEventListener('click', (event) => {
        const card = event.target.closest('.game-card');
        if (card) {
            fetchStreamsForGame(card.dataset.gameId, card.dataset.gameName);
        }
    });

    logsModalElement.addEventListener('show.bs.modal', () => {
        fetchAndDisplayLogs();
    });

    modalLogsBody.addEventListener('click', (event) => {
        const deleteButton = event.target.closest('.btn-delete-log');
        if (deleteButton) {
            const logId = deleteButton.dataset.logId;
            if (confirm('Tem certeza que deseja excluir este log?')) {
                deleteLog(logId);
            }
        }
    });

    fetchTopGames();

});
