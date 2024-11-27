const clientId = 'dffeedbb13b043b68229622be9e93b2b';
const clientSecret = 'e6673bfb83594f488483e4580c11d1f1';
let accessToken = "";
async function getAccessToken() {
    console.log("Requesting access token...");
    const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `grant_type=client_credentials&client_id=${clientId}&client_secret=${clientSecret}`
    });
    const data = await response.json();
    console.log("Access token received:", data.access_token);
    return data.access_token;
}

async function fetchArtistTracks(artistId) {
    console.log(`Fetching tracks for artist ID: ${artistId}`);
    const response = await fetch(`https://api.spotify.com/v1/artists/${artistId}/albums?include_groups=album,single&market=PL`, {
        headers: {
            'Authorization': `Bearer ${accessToken}`
        }
    });
    const albums = await response.json();
    console.log("Albums fetched:", albums);
    return albums.items;
}

async function fetchTracksFromAlbum(albumId) {
    console.log(`Fetching tracks from album ID: ${albumId}`);
    const response = await fetch(`https://api.spotify.com/v1/albums/${albumId}/tracks`, {
        headers: {
            'Authorization': `Bearer ${accessToken}`
        }
    });
    const tracks = await response.json();
    console.log("Tracks fetched:", tracks);
    return tracks.items;
}

async function getArtistId(artistInput) {
    console.log(`Getting artist ID for input: ${artistInput}`);
    let artistId = null;

    if (artistInput.includes('open.spotify.com/artist/')) {
        artistId = artistInput.split('artist/')[1];
        console.log("Artist ID extracted from link:", artistId);
    } else {
        const response = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(artistInput)}&type=artist`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });
        const data = await response.json();
        artistId = data.artists.items[0]?.id;
        console.log("Artist ID found:", artistId);
    }
    return artistId;
}

async function displayTracks() {
    accessToken = await getAccessToken();
    const artistInput = document.getElementById('artistInput').value;
    console.log("Displaying tracks for artist input:", artistInput);
    const artistId = await getArtistId(artistInput);
    
    if (!artistId) {
        console.log('Nie znaleziono wykonawcy.');
        document.getElementById('results').innerHTML = 'Nie znaleziono wykonawcy.';
        return;
    }

    const albums = await fetchArtistTracks(artistId);
    let totalTracks = 0;
    let totalDuration = 0;
    let resultsHTML = '';

    for (const album of albums) {
        const tracks = await fetchTracksFromAlbum(album.id);
        resultsHTML += `<div id='h2Parent'onclick="if(document.getElementById('ListOf.${album.name.replace(/[^a-zA-Z0-9-_]/g, '')}').style.display === 'none'){document.getElementById('ListOf.${album.name.replace(/[^a-zA-Z0-9-_]/g, '')}').style.display = 'flex';}else{document.getElementById('ListOf.${album.name.replace(/[^a-zA-Z0-9-_]/g, '')}').style.display = 'none'}"><img src='${album.images[2].url}'></img><h2>${album.name}</h2></div><ul id="ListOf.${album.name.replace(/[^a-zA-Z0-9-_]/g, '')}" style='display:none'>`;
        for (const track of tracks) {
            resultsHTML += `<li>${track.name} - ${Math.floor(track.duration_ms / 60000)}:${((track.duration_ms % 60000) / 1000).toFixed(0).padStart(2, '0')}</li>`;
            totalTracks++;
            totalDuration += track.duration_ms;
        }
        resultsHTML += `</ul>`;
    }

    const totalDurationMinutes = Math.floor(totalDuration / 60000);
    const totalDurationSeconds = ((totalDuration % 60000) / 1000).toFixed(0).padStart(2, '0');
    resultsHTML += `<h3>Łącznie utworów: ${totalTracks}</h3>`;
    resultsHTML += `<h3>Łączny czas trwania: ${totalDurationMinutes}:${totalDurationSeconds}</h3>`;
    document.getElementById('results').innerHTML = resultsHTML;

    console.log(`Total tracks: ${totalTracks}, Total duration: ${totalDurationMinutes}:${totalDurationSeconds}`);

}

document.getElementById('searchButton').addEventListener('click', displayTracks);