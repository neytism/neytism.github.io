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

function populatePortfolio() {
    const portfolioDiv = document.querySelector(".art-section");

    const categories = {};

    artworks.forEach(art => {
        if (!categories[art.category]) {
            categories[art.category] = [];
        }
        categories[art.category].push(art);
    });

    for (const category in categories) {
        
        const categoryTitle = document.createElement('div');
        categoryTitle.className = 'art-container title';
        categoryTitle.textContent = category;
        setParent(portfolioDiv, categoryTitle);
        
        
        categories[category].forEach(art => {
            const artworkDiv = document.createElement('div');
            artworkDiv.className = 'art-container';
            
            const imageContainer = document.createElement('div');
            imageContainer.classList.add("img-hover-zoom");
            imageContainer.classList.add("hoverable");
        
            imageContainer.addEventListener('click', (e) => {
                loadArtwork(art.id);
            });
            
            const image = document.createElement('img');
            image.src = `${art.image[0]}`;
            
            setParent(imageContainer, image);
            setParent(artworkDiv, imageContainer);
            
            const title = document.createElement('h1');
            title.textContent = art.title;
            setParent(artworkDiv, title);
            
            // const description = document.createElement('h3');
            // description.textContent = art.description;
            // setParent(artworkDiv, description);
            
            // for (i = 0; i < art.additional.length; i++) {
            //     const additionalInfo = document.createElement('h3');
            //     additionalInfo.innerHTML = `•&nbsp;&nbsp;${art.additional[i]}`;
            //     setParent(artworkDiv, additionalInfo);
            // }
            
            let guide = `
                        <h3>${art.title}</h3>
                        <p>${art.description}</p>
                        <p><strong>Progress:</strong> ${art.progress}</p>
                        <img src="${art.image[0]}" alt="${art.title}" onclick="loadArtwork(${art.id})">
                    `;
            
            setParent(portfolioDiv, artworkDiv);
        });
        
    }
}

function loadArtwork(id) {
    const artwork = artworks.find(a => a.id === id);
    if (artwork) {
        window.location.href = `artwork.html?id=${id}`;
    }
}

function setParent(parent, child){
    parent.appendChild(child);
}

