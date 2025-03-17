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
const customCursor = document.querySelector('.cursor');
const bigBall = document.querySelector('.cursor-ball-big-container');
const smallBall = document.querySelector('.cursor-ball-small-container');
let hideOnHover = [];
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

var spans = [];
let spanIndex = -1;

//json
const artworks = [];
const games = [];
let lastGameID = 0;
let lastArtID = 0;


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
    const listOfImages = content.media;
    const maxIndex = listOfImages.length - 1;
    let newIndex;
    
    if (direction === 'next') {
        newIndex = parseInt(currentSelectedIndex) + 1 > maxIndex ? 0 : parseInt(currentSelectedIndex) + 1;
        
    } else {
        newIndex = parseInt(currentSelectedIndex) - 1 < 0 ? maxIndex : parseInt(currentSelectedIndex) - 1;
    }
    
    currentSelectedIndex = newIndex;
    if(!hasFileExtension(listOfImages[currentSelectedIndex])){
        navigateSelectedImage(event, direction);
    }
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

function hideCustomCursor(){
    bigBall.style.opacity = 0;
        smallBall.style.opacity = 0;
}


function addHoverEventToLinks() {
    const links = document.querySelectorAll('a');
    
    
    
    links.forEach(link => {
        const ddcid = link.getAttribute('ddcid');
        
        if (ddcid) {
            const dropdownElement = document.getElementById(ddcid);
            
            if (dropdownElement) {
                link.addEventListener('mouseover', () => {
                    showDropdown(link, dropdownElement);
                });
                
                dropdownElement.addEventListener('mouseover', () => {
                    showDropdown(link, dropdownElement);
                });
                
                link.addEventListener('mouseout', (e) => {
                    hideDropdown(e, link, dropdownElement);
                });
                
                dropdownElement.addEventListener('mouseout', (e) => {
                    hideDropdown(e, link, dropdownElement);
                });
            }
        }
    });
    

    function showDropdown(link, dropdownElement) {
        dropdownElement.classList.add('open-dropdown');
        
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

function addShuffleEventToLinks() {
    const links = document.querySelectorAll('.shuffle');
    
    function getTextNodes(element) {
        const walker = document.createTreeWalker(
            element, 
            NodeFilter.SHOW_TEXT, 
            null, 
            false
        );
        const textNodes = [];
        let node;
        while ((node = walker.nextNode())) {
            textNodes.push(node);
        }
        return textNodes;
    }

    links.forEach(link => {
        link.setAttribute('data-original-html', link.innerHTML);
        
        link.addEventListener('mouseenter', () => {
            shuffleLetters(link);
        });
        
        link.addEventListener('mouseout', () => {
            if (link.shuffleTimeout) clearTimeout(link.shuffleTimeout);
            link.innerHTML = link.getAttribute('data-original-html');
        });
    });

    function shuffleLetters(linkElement) {
        const shuffleIterations = 5;
        const delay = 50;
        let iteration = 0;
        
        const textNodes = getTextNodes(linkElement);
        const originalSegments = textNodes.map(tn => tn.nodeValue);
        const fullText = originalSegments.join('');

        function shuffle() {
            const shuffled = [...fullText].sort(() => Math.random() - 0.5).join('');
            
            let charIndex = 0;
            textNodes.forEach((node, i) => {
                const segmentLength = originalSegments[i].length;
                node.nodeValue = shuffled.substr(charIndex, segmentLength);
                charIndex += segmentLength;
            });

            iteration++;
            
            if (iteration < shuffleIterations) {
                linkElement.shuffleTimeout = setTimeout(shuffle, delay);
            } else {
                textNodes.forEach((node, i) => {
                    node.nodeValue = originalSegments[i];
                });
            }
        }
        
        shuffle();
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

function showNextSpan() {
    ++spanIndex;
    const currentSpan = spans[spanIndex % spans.length];
    
    spans.forEach(span => span.classList.remove('show'));
    
    currentSpan.classList.add('show');
    
    setTimeout(() => {
      currentSpan.classList.remove('show');
      setTimeout(showNextSpan, 1000);
    }, 2000);
  }
  


function generateNavBar(pageName){
    if(!pageName) return; 

    const navBar = document.createElement('div');
    navBar.classList.add('navbar');
    document.body.insertBefore(navBar, document.body.firstChild);

     //link
     const homeNavLink = document.createElement('a');
     homeNavLink.classList.add('navbar-link');
     homeNavLink.classList.add('hoverable');
     homeNavLink.classList.add('shuffle');
     homeNavLink.textContent = 'HOME';
     if (pageName == 'home') {
         homeNavLink.classList.add('active');
     } else{
         homeNavLink.href = './index.html';
     }
     setParent(navBar,homeNavLink);

    //link
    const portfolioNavLink = document.createElement('a');
    portfolioNavLink.classList.add('navbar-link');
    portfolioNavLink.classList.add('hoverable');
    portfolioNavLink.classList.add('shuffle');
    portfolioNavLink.textContent = 'PORTFOLIO';
    const portfolioDropdownID = 'portfolio-dropdown';
    portfolioNavLink.setAttribute('ddcid', portfolioDropdownID);
    
    setParent(navBar,portfolioNavLink);

    //dropdown
    const portfolioDropdown = document.createElement('div');
    portfolioDropdown.classList.add('dropdown-content');
    portfolioDropdown.setAttribute('id', portfolioDropdownID);
    setParent(navBar, portfolioDropdown);

    //dropdown contents
    const gamesNavLink = document.createElement('a');
    gamesNavLink.classList.add('shuffle');
    gamesNavLink.textContent = 'Games';
    if(pageName == 'games'){
        gamesNavLink.classList.add('active');
    } else{
        gamesNavLink.href ='./games.html';
    }
    setParent(portfolioDropdown, gamesNavLink);

    const artsNavLink = document.createElement('a');
    artsNavLink.classList.add('shuffle');
    artsNavLink.textContent = 'Arts';
    if(pageName == 'art-category'){
        artsNavLink.classList.add('active');
    } else if(pageName == 'art'){
        artsNavLink.classList.add('active');
        artsNavLink.href = './art-category.html'; 
    } else{
        artsNavLink.href = './art-category.html'; 
    }
    setParent(portfolioDropdown, artsNavLink);

    //link
    const aboutNavLink = document.createElement('a');
    aboutNavLink.classList.add('navbar-link');
    aboutNavLink.classList.add('hoverable');
    aboutNavLink.classList.add('shuffle');
    aboutNavLink.textContent = 'ABOUT';
    if (pageName == 'about') {
        aboutNavLink.classList.add('active');
    } else{
        aboutNavLink.href = './about.html';
    }
    setParent(navBar,aboutNavLink);

    //link
    const contactNavLink = document.createElement('a');
    contactNavLink.classList.add('navbar-link');
    contactNavLink.classList.add('hoverable');
    contactNavLink.classList.add('shuffle');
    contactNavLink.textContent = 'CONTACT';
    if (pageName == 'contact') {
        contactNavLink.classList.add('active');
    } else{
        contactNavLink.href = './contact.html';
    }
    setParent(navBar,contactNavLink);

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
                let id = lastArtID + 1;
                art.id = id;
                artworks.push(art);
                lastArtID = id;
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
                let id = lastGameID + 1;
                game.id = id;
                games.push(game);
                lastGameID = id;
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

function populateFeaturedWorks(){
    let x = 1;
    
    var lastGameDiv = document.getElementById("featured-games");
    
    games.forEach(game => {

        if(game.remarks.includes("hide")){
            return;
        }

        if(!game.remarks.includes("featured")){
            return;
        }

        const section = document.createElement('div');
        section.classList.add('section');
        section.setAttribute("id", "projects");
        section.setAttribute("contentID", game.id);
        section.setAttribute("contentType", "game");
        section.style.minHeight = 'fit-content';
        lastGameDiv.insertAdjacentElement('afterend', section);
        lastGameDiv = section;

        const sectionContent = document.createElement('div');
        sectionContent.classList.add('section-content');
        sectionContent.classList.add('half-screen');
        setParent(section, sectionContent);
        
        const gameGalleryContainer = document.createElement('div');
        gameGalleryContainer.classList.add('game-gallery-container');
        if(x % 2 == 0){
            gameGalleryContainer.classList.add('reverse');
        }
        gameGalleryContainer.classList.add('featured');
        setParent(sectionContent, gameGalleryContainer);

        const galleryLeft = document.createElement('div');
        galleryLeft.classList.add('gallery-left');
        setParent(gameGalleryContainer, galleryLeft);
        
        const mainImageContainer = document.createElement('div');
        mainImageContainer.classList.add('main-image-container');
        setParent(galleryLeft, mainImageContainer);
    
        const mainImage = document.createElement('img');
        mainImage.addEventListener('error', (e) => {replaceNullImage(mainImage)});
        mainImage.classList.add('main-image');
        if(game.remarks.includes("mobile")){mainImage.classList.add('mobile');};
        mainImage.classList.add('enlargeable');
        mainImage.setAttribute("id", "mainImage");
        mainImage.setAttribute("index", "0");
        mainImage.src = `${game.filePath}/${game.media[0]}`;
        setParent(mainImageContainer, mainImage);
        
        const prevButton = document.createElement('button');
        prevButton.classList.add('gallery-nav-button');
        prevButton.classList.add('prev-button');
        prevButton.addEventListener('click', (e) => {navigateImage(prevButton, 'prev')});
        prevButton.innerHTML = `←`;
        setParent(mainImageContainer, prevButton);

        const nextButton = document.createElement('button');
        nextButton.classList.add('gallery-nav-button');
        nextButton.classList.add('next-button');
        nextButton.addEventListener('click', (e) => {navigateImage(nextButton, 'next')});
        nextButton.innerHTML = `→`;
        setParent(mainImageContainer, nextButton);

        const thumbnailsContainer = document.createElement('div');
        thumbnailsContainer.classList.add('thumbnails');
        setParent(galleryLeft, thumbnailsContainer);
        
        for (i = 0; i < game.media.length; i++) {
            const thumbnail = document.createElement('img');
            thumbnail.addEventListener('error', (e) => {replaceNullImage(thumbnail)});
            thumbnail.classList.add('thumbnail');
            thumbnail.classList.add('hoverable');
            if ( i == 0) { thumbnail.classList.add('active'); };
            if (game.isMobile == true) {thumbnail.classList.add('mobile');};
            if(hasFileExtension(game.media[i])){
                thumbnail.src = `${game.filePath}/${game.media[i]}`;
            }else{
                thumbnail.src = `https://img.youtube.com/vi/${game.media[i]}/maxresdefault.jpg`
            }
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
        setParent(section, background);

        x++;
    });

    var featuredArtParent = document.getElementById("featured-artworks");

    artworks.forEach(art => {

        if(art.remarks.includes("hide")){
            return;
        }

        if(!art.remarks.includes("featured")){
            return;
        }

        const artworkDiv = document.createElement('div');
        artworkDiv.className = 'art-container';
        artworkDiv.setAttribute("contentID", art.id);
        artworkDiv.setAttribute("contentType", "art");

        const imageContainer = document.createElement('div');
        imageContainer.classList.add("img-hover-zoom");
        // imageContainer.classList.add("force-square");
        imageContainer.classList.add("hoverable");
        if (art.media.length !== 1 || !hasFileExtension(art.media[0])) {
            imageContainer.addEventListener('click', (e) => {
                loadArtwork(art.id);
            });
        }

        setParent(artworkDiv, imageContainer);

        const image = document.createElement('img');
        image.addEventListener('error', (e) => { replaceNullImage(image) });

        if (hasFileExtension(art.media[0])) {
            image.src = `${art.filePath}/${art.media[0]}`;
        } else {
            image.src = `https://img.youtube.com/vi/${art.media[0]}/maxresdefault.jpg`
        }

        if (art.media.length === 1) {
            image.classList.add("enlargeable");
        } else {

        }
        setParent(imageContainer, image);

        const title = document.createElement('h1');
        if (art.remarks.includes("quoted")) {
            title.textContent = `"${art.title}"`;
        } else {
            title.textContent = art.title;
        }

        setParent(artworkDiv, title);

        // const description = document.createElement('h3');
        // description.textContent = art.description;
        // setParent(artworkDiv, description);

        art.additional.forEach(additional => {
            const additionalInfo = document.createElement('h3');
            additionalInfo.innerHTML = `•&nbsp;&nbsp;${additional}`;
            setParent(artworkDiv, additionalInfo);
        });

        setParent(featuredArtParent, artworkDiv);
    });
}

function populateGamePortfolio(){
    let x = 1;
    
    const portfolioDiv = document.getElementById("games");
    
    games.forEach(game => {

        if(game.remarks.includes("hide")){
            return;
        }

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
        mainImage.addEventListener('error', (e) => {replaceNullImage(mainImage)});
        mainImage.classList.add('main-image');
        if(game.remarks.includes("mobile")){mainImage.classList.add('mobile');};
        mainImage.classList.add('enlargeable');
        mainImage.setAttribute("id", "mainImage");
        mainImage.setAttribute("index", "0");
        mainImage.src = `${game.filePath}/${game.media[0]}`;
        setParent(mainImageContainer, mainImage);
        
        const prevButton = document.createElement('button');
        prevButton.classList.add('gallery-nav-button');
        prevButton.classList.add('prev-button');
        prevButton.addEventListener('click', (e) => {navigateImage(prevButton, 'prev')});
        prevButton.innerHTML = `←`;
        setParent(mainImageContainer, prevButton);

        const nextButton = document.createElement('button');
        nextButton.classList.add('gallery-nav-button');
        nextButton.classList.add('next-button');
        nextButton.addEventListener('click', (e) => {navigateImage(nextButton, 'next')});
        nextButton.innerHTML = `→`;
        setParent(mainImageContainer, nextButton);

        const thumbnailsContainer = document.createElement('div');
        thumbnailsContainer.classList.add('thumbnails');
        setParent(galleryLeft, thumbnailsContainer);
        
        for (i = 0; i < game.media.length; i++) {
            const thumbnail = document.createElement('img');
            thumbnail.addEventListener('error', (e) => {replaceNullImage(thumbnail)});
            thumbnail.classList.add('thumbnail');
            thumbnail.classList.add('hoverable');
            if ( i == 0) { thumbnail.classList.add('active'); };
            if (game.isMobile == true) {thumbnail.classList.add('mobile');};
            if(hasFileExtension(game.media[i])){
                thumbnail.src = `${game.filePath}/${game.media[i]}`;
            }else{
                thumbnail.src = `https://img.youtube.com/vi/${game.media[i]}/maxresdefault.jpg`
            }
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

        // const gameBullets = document.createElement('p');
        // gameBullets.classList.add('details-description');
        // gameBullets.innerHTML = `<b>•&nbsp;&nbsp;Duration: ${game.duration}`;
        // setParent(galleryRight, gameBullets);

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
        if(hasFileExtension(firstArtwork.media[0])){
            img.src = `${firstArtwork.filePath}/${firstArtwork.media[0]}`;
        }else{
            img.src = `https://img.youtube.com/vi/${firstArtwork.media[0]}/maxresdefault.jpg`
        }
        setParent(imgHoverZoom, img);
        
        const title = document.createElement('div');
        title.classList.add('shuffle');
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
            if(art.media.length !== 1 || !hasFileExtension(art.media[0])){
                imageContainer.addEventListener('click', (e) => {
                    loadArtwork(art.id);
                });
            } 
           
            setParent(artworkDiv, imageContainer);
            
            const image = document.createElement('img');
            image.addEventListener('error', (e) => {replaceNullImage(image)});

            if(hasFileExtension(art.media[0])){
                image.src = `${art.filePath}/${art.media[0]}`;
            }else{
                image.src = `https://img.youtube.com/vi/${art.media[0]}/maxresdefault.jpg`
            }

            if(art.media.length === 1){
                image.classList.add("enlargeable");
            } else{
                
            }
            setParent(imageContainer, image);
            
            const title = document.createElement('h1');
            if (art.remarks.includes("quoted")) {
                title.textContent = `"${art.title}"`;
            } else{
                title.textContent = art.title;
            }
            
            setParent(artworkDiv, title);
            
            // const description = document.createElement('h3');
            // description.textContent = art.description;
            // setParent(artworkDiv, description);
            
            art.additional.forEach(additional => {
                const additionalInfo = document.createElement('h3');
                additionalInfo.innerHTML = `•&nbsp;&nbsp;${additional}`;
                setParent(artworkDiv, additionalInfo);
            });
            
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
    const t = artwork.title.toUpperCase();
    if (artwork.remarks.includes("quoted")) {
        artworkTitle.textContent = `"${t}"`;
    } else{
        artworkTitle.textContent = t;
    }
    setParent(portfolioDiv, artworkTitle);
    
    // const description = document.createElement('div');
    // description.className = 'art-container description';
    // description.textContent = `${artwork.description}`;
    // setParent(portfolioDiv, description);
    
    for (i = 0; i < artwork.additional.length; i++) {
        const additionalInfo = document.createElement('div');
        additionalInfo.className = 'art-container description';
        additionalInfo.innerHTML = `•&nbsp;&nbsp;${artwork.additional[i]}<br>`;
        
        if(i+1 == artwork.additional.length){
            additionalInfo.classList.add('last-description');
        }
        setParent(portfolioDiv, additionalInfo);
    }
    
    artwork.media.forEach(img => {
            const artworkDiv = document.createElement('div');
            artworkDiv.className = 'art-container artworks';
            setParent(portfolioDiv, artworkDiv);
            
            const imageContainer = document.createElement('div');
            imageContainer.classList.add("img-hover-zoom");
            imageContainer.classList.add("artworks");
            imageContainer.classList.add("hoverable");
            setParent(artworkDiv, imageContainer);

        if(hasFileExtension(img)){
            const image = document.createElement('img');
            image.addEventListener('error', (e) => {replaceNullImage(image)});
            image.className = 'enlargeable';
            image.src = `${artwork.filePath}/${img}`;
            
            image.setAttribute('index',artwork.media.indexOf(img));
            setParent(imageContainer, image);
            
        } else{
            
            const youtubeContainer = document.createElement('div');
            youtubeContainer.className = 'youtube-embed';
            setParent(imageContainer, youtubeContainer);

            const youtubeVideo = document.createElement('iframe');
            youtubeVideo.src = `https://www.youtube.com/embed/${img}`;
            youtubeVideo.setAttribute('width','1080');
            youtubeVideo.setAttribute('height','1920');
            youtubeVideo.setAttribute('frameborder','0');
            youtubeVideo.setAttribute('allowfullscreen','');
            youtubeVideo.setAttribute('index',artwork.media.indexOf(img));
            setParent(youtubeContainer, youtubeVideo);
            
        }
       
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

function replaceNullImage(img){
    img.src = `./assets/img/null.png`;
}

function hasFileExtension(filename) {
    const regex = /\.[^/.]+$/;
    return regex.test(filename);
}



function Awake(){
    
    const pageName = document.body.getAttribute("pageName");
    
    if (pageName == 'about'){
        spans = document.querySelectorAll('.fade-text span');
        showNextSpan();
    }
    
    generateNavBar(pageName);
    
    var today = new Date();
    var dd = String(today.getDate()).padStart(2, '0');
    var mm = String(today.getMonth() + 1).padStart(2, '0');
    var yyyy = today.getFullYear();
    
    today = mm + ' / ' + dd + ' / ' + yyyy;
    
    var extraText = document.createElement('div');
    extraText.classList.add('credits');
    extraText.classList.add('bot-l');
    extraText.innerHTML = today;

    document.body.insertBefore(extraText, document.body.firstChild);

    var credits = document.createElement('div');
    credits.classList.add('credits');
    credits.classList.add('bot-r');
    credits.innerHTML = 'Designed & Developed by Nate Florendo';

    document.body.insertBefore(credits, document.body.firstChild);

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
        });
    });

    const onEscapePressed = (event) => {
        if (event.key === 'Escape') {
            closeSelectedImageContainer();
        }
    };

    document.addEventListener('keydown', onEscapePressed);
    
    
    
    
    //thing only to do if on desktop
    if (window.innerWidth >= 820) {
    
        window.addEventListener('mousemove', function (e) {
            mouseWindowPosX = e.pageX;
            mouseWindowPosY = e.pageY - window.scrollY;
        });
        
        animateSpotlight();
        
        addShuffleEventToLinks();
        
        document.body.addEventListener('mousemove', onMouseMove);

        for (let i = 0; i < hoverables.length; i++) {
          hoverables[i].addEventListener('mouseenter', onMouseHover);
          hoverables[i].addEventListener('mouseleave', onMouseHoverOut);
        }
        
        document.body.addEventListener('mouseleave', () =>{
            bigBall.style.opacity = 0;
            smallBall.style.opacity = 0;
        });

        document.body.addEventListener('mouseenter', () =>{
            bigBall.style.opacity = 1;
            smallBall.style.opacity = 1;
        });
        
        hideOnHover =  document.querySelectorAll('.youtube-embed');

        hideOnHover.forEach(unhoverable =>{
            unhoverable.addEventListener('mouseenter', () =>{
                bigBall.style.opacity = 0;
                smallBall.style.opacity = 0;
            });
            unhoverable.addEventListener('mouseleave', () =>{
                bigBall.style.opacity = 1;
                smallBall.style.opacity = 1;
            });
        });
        
        customCursor.classList.remove("hide");
        
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
