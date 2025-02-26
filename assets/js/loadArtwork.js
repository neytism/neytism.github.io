const artworks = [];
let lastID = 0;

function loadJson() {
    return fetch('/assets/json/artworks.json')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok ' + response.statusText);
            }
            return response.json();
        })
        .then(data => {
            data.forEach(art => {
                let id = lastID + 1;
                art.id = id;
                artworks.push(art);
                lastID = id;
            });
        })
        .catch(error => {
            console.error('There was a problem with the fetch operation:', error);
        });
}

function getQueryParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}

function loadArtwork() {
    const artworkId = getQueryParam('id');
    const artwork = artworks.find(a => a.id == artworkId);
    
    const portfolioDiv = document.querySelector('.art-section');

    const artworkTitle = document.createElement('div');
    artworkTitle.className = 'art-container title';
    artworkTitle.textContent = artwork.title;
    setParent(portfolioDiv, artworkTitle);
    
    artwork.image.forEach(img => {
        const artworkDiv = document.createElement('div');
        artworkDiv.className = 'art-container';
        
        const imageContainer = document.createElement('div');
        imageContainer.classList.add("img-hover-zoom");
        imageContainer.classList.add("hoverable");
    
        const image = document.createElement('img');
        image.className = 'enlargeable';
        image.src = `${img}`;
        
        setParent(imageContainer, image);
        setParent(artworkDiv, imageContainer);
        
        setParent(portfolioDiv, artworkDiv);
    });

    // let imagesHTML = "";
    // for (i = 0; i < artwork.image.length; i++) {
    //     imagesHTML += `<img src="${artwork.image[i]}" alt="${artwork.title}" style="width:300px;">`
    // }
    // if (artwork) {
    //     document.getElementById('artwork-details').innerHTML = `
    //             <h1>${artwork.title}</h1>
    //             ${imagesHTML}
    //             <p>${artwork.description}</p>
    //         `;
    // } else {
    //     document.getElementById('artwork-details').innerHTML = '<p>Artwork not found.</p>';
    // }
}

function setParent(parent, child){
    parent.appendChild(child);
}
