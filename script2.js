document.addEventListener('DOMContentLoaded', () => {

    const CLIENT_ID = 'hn3bv315fm9y27waq2b448v3l6veau';
    const ACCESS_TOKEN = 'ws24sgpirt10yhi0mcklr98idk9n1v';
    const API_BASE_URL = 'https://api.twitch.tv/helix';

    const contentDisplay = document.getElementById('content-display');
    const searchInput = document.getElementById('search-input');
    const searchButton = document.getElementById('search-button');
    const btnTopGames = document.getElementById('btn-top-games');

    function fetchTopGames() {
        showLoader();
        const endpoint = '/games/top?first=20';

        fetch(API_BASE_URL + endpoint, {
            headers: {
                'Client-ID': CLIENT_ID,
                'Authorization': `Bearer ${ACCESS_TOKEN}`
            }
        })
        .then(response => {
            if (response.status === 401) throw new Error('Token de acesso inválido ou expirado!');
            if (!response.ok) throw new Error('Falha na resposta da rede.');
            return response.json();
        })
        .then(data => {
            renderGames(data.data);
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
        const endpoint = `/search/categories?query=${encodeURIComponent(query)}&first=20`;

        fetch(API_BASE_URL + endpoint, {
            headers: {
                'Client-ID': CLIENT_ID,
                'Authorization': `Bearer ${ACCESS_TOKEN}`
            }
        })
        .then(response => response.json())
        .then(data => {
            renderGames(data.data);
        })
        .catch(error => {
            console.error('Erro ao buscar jogos:', error);
            showError("Não foi possível realizar a busca.");
        });
    }

    function fetchStreamsForGame(gameId, gameName) {
        showLoader();
        const endpoint = `/streams?game_id=${gameId}&first=21`;

        fetch(API_BASE_URL + endpoint, {
            headers: {
                'Client-ID': CLIENT_ID,
                'Authorization': `Bearer ${ACCESS_TOKEN}`
            }
        })
        .then(response => response.json())
        .then(data => {
            renderStreams(data.data, gameName);
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
                        <div class="card-body">
                            <h6 class="card-title text-truncate">${game.name}</h6>
                        </div>
                    </div>
                </div>
            `;
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
                        <a href="https://twitch.tv/${stream.user_login}" target="_blank">
                             <img src="${thumbnailUrl}" class="card-img-top" alt="Thumbnail de ${stream.user_name}">
                        </a>
                        <div class="card-body">
                            <h5 class="card-title text-truncate">${stream.title}</h5>
                            <p class="card-text">
                                <a href="https://twitch.tv/${stream.user_login}" target="_blank" class="text-decoration-none">${stream.user_name}</a>
                            </p>
                        </div>
                        <div class="card-footer text-muted">
                            <i class="bi bi-eye-fill"></i> ${stream.viewer_count.toLocaleString('pt-BR')} espectadores
                        </div>
                    </div>
                </div>
            `;
        });

        galleryHtml += '</div>';
        contentDisplay.innerHTML = galleryHtml;
    };

    btnTopGames.addEventListener('click', fetchTopGames);

    searchButton.addEventListener('click', searchGames);

    searchInput.addEventListener('keyup', (event) => {
        if (event.key === 'Enter') {
            searchGames();
        }
    });

    contentDisplay.addEventListener('click', (event) => {
        const card = event.target.closest('.game-card');
        if (card) {
            const gameId = card.dataset.gameId;
            const gameName = card.dataset.gameName;
            fetchStreamsForGame(gameId, gameName);
        }
    });

    fetchTopGames();
});