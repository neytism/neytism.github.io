class GameGallery {
    constructor(gallery, isInsideParent){
        this.gallery = gallery;
        this.isInsideParent = isInsideParent;
    }
}

//general
const images = document.querySelectorAll('img');
const divs = document.querySelectorAll('div');
let currentSelectedContentType = "";
let currentSelectedID = "";
let currentSelectedIndex = "";

//spotlight
const spotlight = document.querySelector('.spotlight-mask');
const smoothFollow = 0.1; 
let mouseWindowPosX = 0;
let mouseWindowPosY = 0;
let smoothMouseWindowPosX = mouseWindowPosX;
let smoothMouseWindowPosY = mouseWindowPosY;

//slideshow
const slides = document.querySelectorAll('.slide');
let currentSlide = 0;

//tabs
let currentTabId = "tab-1";

//cursor
const bigBall = document.querySelector('.cursor-ball-big-container');
const smallBall = document.querySelector('.cursor-ball-small-container');
let hoverables = [];
let cursorVisible = false;

//game image sliders
var tempGameGalleries = [];
var thumbnailContainers = [];
var gameGalleries = [];
var cardSize = { width: 0, height: 0 };
var SCALE_X = 1.5;
var SCALE_Y = SCALE_X * 1.25;
var isInsideParent = false;
let mouseGalleryPosX = 0;
let mouseGalleryPosY = 0;

//image enlarge
const selectedImageContainer = document.querySelector('.selected-image-container');
const selectedArtContainer = document.querySelector('.selected-art-container');
let clickableImages = [];

//json
const artworks = [];
const games = [];
let lastID = 0;

function updateSpotlight() {
    smoothMouseWindowPosX += (mouseWindowPosX - smoothMouseWindowPosX) * smoothFollow;
    smoothMouseWindowPosY += (mouseWindowPosY - smoothMouseWindowPosY) * smoothFollow;

    const rect = spotlight.getBoundingClientRect();
    const xPos = ((smoothMouseWindowPosX - rect.left) / rect.width) * 100;
    const yPos = ((smoothMouseWindowPosY - rect.top) / rect.height) * 100;
    document.documentElement.style.setProperty('--xPos', `${xPos}%`);
    document.documentElement.style.setProperty('--yPos', `${yPos}%`);

}

function animateSpotlight() {
    updateSpotlight();
    requestAnimationFrame(animateSpotlight);
}


function showNextSlide() {
    slides[currentSlide].classList.remove('active');
    currentSlide = (currentSlide + 1) % slides.length;
    slides[currentSlide].classList.add('active');
}

function selectTab(event, tabId) {
    
    event.preventDefault();
    
    if (tabId === currentTabId) {
        document.getElementById(currentTabId).scrollIntoView({ behavior: 'smooth', block: 'start' });
        return; // Exit early
    }
    
    const currentTab = document.getElementById(currentTabId);
    
    currentTab.classList.remove('active');
    
    setTimeout(() => {
        currentTab.style.display = 'none';
        
        currentTabId = tabId;
        const newTab = document.getElementById(currentTabId);
        
        newTab.style.display = 'block';
        setTimeout(() => {
            newTab.classList.add('active');
            newTab.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 10); // Small timeout to ensure display is set before adding active class
    }, 300);
}


function changeImageGameGallery(element) {
    const index = element.getAttribute("index");
    const parent = element.parentNode;
    const children = getChildList(parent);
    
    // Remove active class from all thumbnails
    for (let i = 0; i < children.length; i++) {
        children[i].classList.remove('active');
    }

    // Add active class to clicked thumbnail
    element.classList.add('active');
    
    // Update main image
    const mainImage = findSiblingById(parent, "mainImage");
    mainImage.src = element.src;
    mainImage.alt = element.alt;
    mainImage.setAttribute("index", index);

    // Scroll thumbnail into view
    scrollThumbnailIntoView(element);
}

function navigateImage(element, direction) {
    const mainImage = element.parentElement.firstElementChild;
    const currentIndex = parseInt(mainImage.getAttribute('index'));
    const thumbnails = element.parentElement.nextElementSibling;
    const thumbnailsList = getChildList(thumbnails);
    const maxIndex = thumbnailsList.length - 1;

    let newIndex;
    if (direction === 'next') {
        newIndex = currentIndex + 1 > maxIndex ? 0 : currentIndex + 1;
    } else {
        newIndex = currentIndex - 1 < 0 ? maxIndex : currentIndex - 1;
    }

    // Find and click the thumbnail at the new index
    const targetThumbnail = thumbnailsList[newIndex];
    changeImageGameGallery(targetThumbnail);
}

function navigateSelectedImage(event, direction) {
    event.stopPropagation();
    let content = null;

    if (currentSelectedContentType == "art") {
        content = artworks.find(a => a.id == currentSelectedID);
    } else if (currentSelectedContentType == "game") {
        content = games.find(g => g.id == currentSelectedID);
    }

    const fp = content.filePath;
    const listOfImages = content.image;
    const maxIndex = listOfImages.length - 1;
    let newIndex;
    
    if (direction === 'next') {
        newIndex = parseInt(currentSelectedIndex) + 1 > maxIndex ? 0 : parseInt(currentSelectedIndex) + 1;
    } else {
        newIndex = parseInt(currentSelectedIndex) - 1 < 0 ? maxIndex : parseInt(currentSelectedIndex) - 1;
    }
    
    currentSelectedIndex = newIndex;
    selectedImageContainer.firstElementChild.firstElementChild.src = `${fp}/${listOfImages[currentSelectedIndex]}`;
}


function scrollThumbnailIntoView(thumbnail) {
    const thumbnailsContainer = thumbnail.parentNode;
    const thumbnailRect = thumbnail.getBoundingClientRect();
    const containerRect = thumbnailsContainer.getBoundingClientRect();

    // Calculate if the thumbnail is outside the visible area
    const isOutsideLeft = thumbnailRect.left < containerRect.left;
    const isOutsideRight = thumbnailRect.right > containerRect.right;

    if (isOutsideLeft) {
        thumbnailsContainer.scrollLeft += thumbnailRect.left - containerRect.left - 10;
    } else if (isOutsideRight) {
        thumbnailsContainer.scrollLeft += thumbnailRect.right - containerRect.right + 10;
    }
}

function findSiblingById(element, id) {
    const parent = element.parentElement.parentElement;
    return parent.querySelector('#' + id);
}

function getChildList(parent) {
    return Array.from(parent.children);
}
    


// Move the cursor
function onMouseMove(e) {

    if (!cursorVisible) {
        bigBall.style.opacity = 1;
        smallBall.style.opacity = 1;
        cursorVisible = true; 
    }

    TweenMax.to(bigBall, .4, {
        x: e.clientX - 15,
        y: e.clientY - 15
    })

    TweenMax.to(smallBall, .1, {
        x: e.clientX - 5,
        y: e.clientY - 5
    })

}

function onMouseHover() {
  TweenMax.to(bigBall, .3, {
    scale: 3
  })
}

function onMouseHoverOut() {
  TweenMax.to(bigBall, .3, {
    scale: 1
  })
}


function addHoverEventToLinks() {
    // Select all <a> elements on the page
    const links = document.querySelectorAll('a');

    links.forEach(link => {
        // Get the ddcid attribute value
        const ddcid = link.getAttribute('ddcid');

        if (ddcid) {
            const dropdownElement = document.getElementById(ddcid);

            if (dropdownElement) {
                // Add mouseover event listener to <a>
                link.addEventListener('mouseover', () => {
                    showDropdown(link, dropdownElement);
                });

                // Add mouseover event listener to dropdown content
                dropdownElement.addEventListener('mouseover', () => {
                    showDropdown(link, dropdownElement);
                });
                
                // Add mouseout event listener to <a>
                link.addEventListener('mouseout', (e) => {
                    hideDropdown(e, link, dropdownElement);
                });

                // Add mouseout event listener to dropdown content
                dropdownElement.addEventListener('mouseout', (e) => {
                    hideDropdown(e, link, dropdownElement);
                });
            }
        }
    });

    function showDropdown(link, dropdownElement) {
        // Add the "open-dropdown" class
        dropdownElement.classList.add('open-dropdown');
        
        // Position the dropdown element just below the <a>
        const rect = link.getBoundingClientRect();
        dropdownElement.style.top = `${rect.bottom}px`;
        dropdownElement.style.left = `${rect.left}px`;
    }

    function hideDropdown(event, link, dropdownElement) {
        const relatedTarget = event.relatedTarget;
        if (!link.contains(relatedTarget) && !dropdownElement.contains(relatedTarget)) {
            dropdownElement.classList.remove('open-dropdown');
        }
    }
}

function updateCardRotations() {
    gameGalleries.forEach(gallery => {
        if (gallery.isInsideParent) {
            cardSize = {
                width: gallery.gallery.offsetWidth || 0,
                height: gallery.gallery.offsetHeight || 0,
            };
            
            var rotationX = (mouseGalleryPosY / cardSize.height) * -(SCALE_Y * 2) + SCALE_Y;
            var rotationY = (mouseGalleryPosX / cardSize.width) * (SCALE_X * 2) - SCALE_X;
            
            gallery.gallery.style.transform = `perspective(1000px) rotateX(${rotationX}deg) rotateY(${rotationY}deg) translateZ(10px)`;
        }
    });

    requestAnimationFrame(updateCardRotations);
}

function resetGalleryTransformations(gallery) {
    gallery.gallery.style.transform = 'perspective(600px) rotateX(0deg) rotateY(0deg) translateZ(0px)';
}

function closeSelectedImageContainer(event){
    event.stopPropagation();
    selectedImageContainer.classList.add('hide');
    document.body.classList.remove('noscroll');
}

function closeSelectedArtContainer(){
    selectedArtContainer.classList.add('hide');
    document.body.classList.remove('noscroll');
}


function disableContextMenu(event) {
    event.preventDefault();
}


function loadArtJson() {
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

function loadGameJson() {
    return fetch('/assets/json/games.json')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok ' + response.statusText);
            }
            return response.json();
        })
        .then(data => {
            data.forEach(game => {
                let id = lastID + 1;
                game.id = id;
                games.push(game);
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

function populateGamePortfolio(){
    let x = 1;
    
    const portfolioDiv = document.getElementById("games");
    
    games.forEach(game => {
        const section = document.createElement('div');
        section.classList.add('section');
        section.setAttribute("id", "projects");
        section.setAttribute("contentID", game.id);
        section.setAttribute("contentType", "game");
        setParent(portfolioDiv, section);

        const sectionContent = document.createElement('div');
        sectionContent.classList.add('section-content');
        setParent(section, sectionContent);
        
        const gameGalleryContainer = document.createElement('div');
        gameGalleryContainer.classList.add('game-gallery-container');
        if(x % 2 == 0){
            gameGalleryContainer.classList.add('reverse');
        }
        setParent(sectionContent, gameGalleryContainer);

        const galleryLeft = document.createElement('div');
        galleryLeft.classList.add('gallery-left');
        setParent(gameGalleryContainer, galleryLeft);
        
        const mainImageContainer = document.createElement('div');
        mainImageContainer.classList.add('main-image-container');
        setParent(galleryLeft, mainImageContainer);
    
        const mainImage = document.createElement('img');
        mainImage.classList.add('main-image');
        if (game.isMobile == true) {mainImage.classList.add('mobile');};
        mainImage.classList.add('enlargeable');
        mainImage.setAttribute("id", "mainImage");
        mainImage.setAttribute("index", "0");
        mainImage.src = `${game.filePath}/${game.image[0]}`;
        setParent(mainImageContainer, mainImage);
        
        const prevButton = document.createElement('button');
        prevButton.classList.add('gallery-nav-button');
        prevButton.classList.add('prev-button');
        prevButton.addEventListener('click', (e) => {navigateImage(prevButton, 'prev')});
        prevButton.innerHTML = `&#11164`;
        setParent(mainImageContainer, prevButton);

        const nextButton = document.createElement('button');
        nextButton.classList.add('gallery-nav-button');
        nextButton.classList.add('next-button');
        nextButton.addEventListener('click', (e) => {navigateImage(nextButton, 'next')});
        nextButton.innerHTML = `&#11166`;
        setParent(mainImageContainer, nextButton);

        const thumbnailsContainer = document.createElement('div');
        thumbnailsContainer.classList.add('thumbnails');
        setParent(galleryLeft, thumbnailsContainer);
        
        for (i = 0; i < game.image.length; i++) {
            const thumbnail = document.createElement('img');
            thumbnail.classList.add('thumbnail');
            thumbnail.classList.add('hoverable');
            if ( i == 0) { thumbnail.classList.add('active'); };
            if (game.isMobile == true) {thumbnail.classList.add('mobile');};
            thumbnail.src = `${game.filePath}/${game.image[i]}`;
            thumbnail.setAttribute("index", i);
            thumbnail.addEventListener('click', (e) => {changeImageGameGallery(thumbnail)});
            setParent(thumbnailsContainer, thumbnail);
        }
        
        const galleryRight = document.createElement('div');
        galleryRight.classList.add('gallery-right');
        setParent(gameGalleryContainer, galleryRight);
        
        const gameTitle = document.createElement('h2');
        gameTitle.classList.add('details-title');
        gameTitle.textContent = game.title.toUpperCase();
        setParent(galleryRight, gameTitle);
        
        const gameDescription = document.createElement('p');
        gameDescription.classList.add('details-description');
        gameDescription.innerHTML = `${game.description}<br><br>`;
        setParent(galleryRight, gameDescription);

        game.additional.forEach(additionalInfo =>{
            const gameBullets = document.createElement('p');
            gameBullets.classList.add('details-description');
            gameBullets.innerHTML = `<b>•&nbsp;&nbsp;${additionalInfo}`;
            setParent(galleryRight, gameBullets);
        });
        
        const background = document.createElement('div');
        background.classList.add('background');
        background.style.backgroundImage = `url('${game.filePath}/${game.backgroundImage}')`
        setParent(section, background);

        x++;
    });
}

function populateArtCategory() {
    const portfolioDiv = document.querySelector(".art-section");
    portfolioDiv.setAttribute('contentType','art');
    
    const categories = {};
    
    artworks.forEach(art => {
        if(art.remarks.includes("hide")){
            return;
        }
        if (!categories[art.category]) {
            categories[art.category] = [art];
        }
    });

    for (const category in categories) {
        const firstArtwork = categories[category][0];

        const artContainer = document.createElement('div');
        artContainer.className = 'art-container banner';
        artContainer.addEventListener('click', (e) => {
            loadArtCategory(category);
        });
        setParent(portfolioDiv, artContainer);

        const imgHoverZoom = document.createElement('div');
        imgHoverZoom.className = 'img-hover-zoom banner hoverable';
        setParent(artContainer, imgHoverZoom);

        const img = document.createElement('img');
        img.src = `${firstArtwork.filePath}/${firstArtwork.image[0]}`;
        setParent(imgHoverZoom, img);
        
        const title = document.createElement('div');
        title.textContent = category;
        setParent(imgHoverZoom, title);
        
    }
    
    
}

function populateArtPortfolio() {
    const categoryIdentifier = getQueryParam('category');

    const portfolioDiv = document.querySelector(".art-section");
    portfolioDiv.setAttribute('contentType','art');
    
    const categories = {};
    
    artworks.forEach(art => {
        if (art.remarks.includes("hide")) {
            return;
        }

        if (!categoryIdentifier || art.category.toLowerCase().replace(/\s+/g, '') === categoryIdentifier) {
            
            if (!categories[art.category]) {
                categories[art.category] = [];
            }
            
            categories[art.category].push(art);
        }
    });
    
    for (const category in categories) {
        
        const categoryTitle = document.createElement('div');
        categoryTitle.className = 'art-container title';
        categoryTitle.textContent = category;
        setParent(portfolioDiv, categoryTitle);
        
        
        categories[category].forEach(art => {
            const artworkDiv = document.createElement('div');
            artworkDiv.className = 'art-container';
            portfolioDiv.setAttribute('contentID', art.id);
            
            const imageContainer = document.createElement('div');
            imageContainer.classList.add("img-hover-zoom");
            //imageContainer.classList.add("force-square");
            imageContainer.classList.add("hoverable");
            if(art.image.length === 1){
                
            } else{
                imageContainer.addEventListener('click', (e) => {
                    loadArtwork(art.id);
                });
            }
           
            
            setParent(artworkDiv, imageContainer);
            
            const image = document.createElement('img');
            image.src = `${art.filePath}/${art.image[0]}`;
            if(art.image.length === 1){
                image.classList.add("enlargeable");
            } else{
                
            }
            setParent(imageContainer, image);
            
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
            
            setParent(portfolioDiv, artworkDiv);
        });
        
    }
}


function pupulateArtInfo() {
    const artworkId = getQueryParam('id');
    const artwork = artworks.find(a => a.id == artworkId);
    
    const portfolioDiv = document.querySelector('.art-section');
    portfolioDiv.setAttribute("contentID", artwork.id);
    portfolioDiv.setAttribute("contentType", "art");
    
    const artworkTitle = document.createElement('div');
    artworkTitle.className = 'art-container title';
    artworkTitle.textContent = artwork.title.toUpperCase();
    setParent(portfolioDiv, artworkTitle);
    
    // const description = document.createElement('div');
    // description.className = 'art-container description';
    // description.textContent = `${artwork.description}`;
    // setParent(portfolioDiv, description);
    
    // for (i = 0; i < artwork.additional.length; i++) {
    //     const additionalInfo = document.createElement('div');
    //     additionalInfo.className = 'art-container description';
    //     additionalInfo.innerHTML = `•&nbsp;&nbsp;${artwork.additional[i]}<br>`;
        
    //     if(i+1 == artwork.additional.length){
    //         additionalInfo.classList.add('last-description');
    //     }
    //     setParent(portfolioDiv, additionalInfo);
    // }
    
    artwork.image.forEach(img => {
        const artworkDiv = document.createElement('div');
        artworkDiv.className = 'art-container artworks';
        
        const imageContainer = document.createElement('div');
        imageContainer.classList.add("img-hover-zoom");
        imageContainer.classList.add("artworks");
        imageContainer.classList.add("hoverable");
        setParent(artworkDiv, imageContainer);
    
        const image = document.createElement('img');
        image.className = 'enlargeable';
        image.src = `${artwork.filePath}/${img}`;
        image.setAttribute('index',artwork.image.indexOf(img));
        setParent(imageContainer, image);
        
        
        setParent(portfolioDiv, artworkDiv);
    });
    
}


function loadArtwork(id) {
    const artwork = artworks.find(a => a.id === id);
    if (artwork) {
        window.location.href = `artwork.html?id=${id}`;
    }
}

function loadArtCategory(category) {
    window.location.href = `art.html?category=${category.toLowerCase().replace(/\s+/g, '')}`;
}


function setParent(parent, child){
    parent.appendChild(child);
}


function Awake(){
    
    images.forEach(image => {
        image.addEventListener('contextmenu', disableContextMenu);
    });
    
    divs.forEach(div => {
        div.addEventListener('contextmenu', disableContextMenu);
    });

    bigBall.style.opacity = 0;
    smallBall.style.opacity = 0;
    
    hoverables =  document.querySelectorAll('.hoverable, a, button');
    clickableImages = document.querySelectorAll('.enlargeable');
    
    if(slides.length > 0){
        setInterval(showNextSlide, 5000);
        
        slides[currentSlide].classList.add('active');
    }

    thumbnailContainers = document.querySelectorAll('.thumbnails');
    
    thumbnailContainers.forEach(thumbnails => {
        thumbnails.addEventListener('wheel', function (event) {
            event.preventDefault();
            thumbnails.scrollLeft += event.deltaY;
        });
    });
    

    addHoverEventToLinks();

    tempGameGalleries = document.querySelectorAll('.game-gallery-container');
        
    tempGameGalleries.forEach(gallery => {
        let newGallery = new GameGallery(gallery,false);
        gameGalleries.push(newGallery);
    });

    clickableImages.forEach(img => {
        img.addEventListener("click", event => {
            
            currentSelectedID = img.closest('[contentID]').getAttribute('contentID');
            currentSelectedContentType = img.closest('[contentType]').getAttribute('contentType');
            currentSelectedIndex = img.getAttribute('index');
            selectedImageContainer.classList.remove('hide');
            selectedImageContainer.firstElementChild.firstElementChild.src = img.getAttribute('src');
            document.body.classList.add('noscroll');
            console.log(img.getAttribute('src'));
        });
    });

    const onEscapePressed = (event) => {
        if (event.key === 'Escape') {
            closeSelectedImageContainer();
        }
    };

    document.addEventListener('keydown', onEscapePressed);
    
    
    //thing only to do if on desktop
    if (window.innerWidth >= 768) {
    
        window.addEventListener('mousemove', function (e) {
            mouseWindowPosX = e.pageX;
            mouseWindowPosY = e.pageY - window.scrollY;
        });
        
        animateSpotlight();
        
        document.body.addEventListener('mousemove', onMouseMove);
        for (let i = 0; i < hoverables.length; i++) {
          hoverables[i].addEventListener('mouseenter', onMouseHover);
          hoverables[i].addEventListener('mouseleave', onMouseHoverOut);
        }
        
        document.querySelector('.cursor').classList.remove("hide");
        
        requestAnimationFrame(updateCardRotations);
        
        gameGalleries.forEach(gal => {
            var parentContainer = gal.gallery.parentElement; 
            //parentContainer.style.backgroundColor = "blue";
            
            parentContainer.addEventListener('mousemove', function (e) {
                var rect = parentContainer.getBoundingClientRect();
                mouseGalleryPosX = e.clientX - rect.left;
                mouseGalleryPosY = e.clientY - rect.top;
            });
            
            parentContainer.addEventListener('mouseenter', () => {
                gal.isInsideParent = true; 
            });
            
            parentContainer.addEventListener('mouseleave', () => {
                gal.isInsideParent = false; 
                resetGalleryTransformations(gal); 
            });
        });
        
    }
    
}




