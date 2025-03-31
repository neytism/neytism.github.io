class GameGallery {
    constructor(gallery, isInsideParent){
        this.gallery = gallery;
        this.isInsideParent = isInsideParent;
    }
}

//redirect
const debugMode = false;

//general
const creditText = 'Designed & Developed by Nate Florendo'
let currentSelectedContentType = "";
let currentSelectedID = "";
let currentSelectedIndex = "";
let lastScrollY = window.scrollY;

//spotlight
const spotlight = document.querySelector('.spotlight-mask');
const smoothFollow = 0.1; 
let mouseWindowPosX = 0;
let mouseWindowPosY = 0;
let smoothMouseWindowPosX = mouseWindowPosX;
let smoothMouseWindowPosY = mouseWindowPosY;

//tabs
let currentTabId = "tab-1";

//cursor
var bigCursor = null;
var smallCursor = null;
let hideOnHover = [];
let cursorVisible = false;

//game image sliders
var tempCardsTilt = [];
var CardsTilt = [];
var cardSize = { width: 0, height: 0 };
var SCALE_X = 1.5;
var SCALE_Y = SCALE_X * 1.25;
var isInsideParent = false;

//image enlarge
const selectedImageContainer = document.querySelector('.selected-image-container');
const selectedArtContainer = document.querySelector('.selected-grid-item-container');
let clickableImages = [];

var spans = [];
let spanIndex = -1;

//json
const artworks = [];
const games = [];
const webs = [];
let lastGameID = 0;
let lastArtID = 0;
let lastWebID = 0;

function updateMousePositionValues() {
    smoothMouseWindowPosX += (mouseWindowPosX - smoothMouseWindowPosX) * smoothFollow;
    smoothMouseWindowPosY += (mouseWindowPosY - smoothMouseWindowPosY) * smoothFollow;
    
    const rect = spotlight.getBoundingClientRect();
    const xPos = ((smoothMouseWindowPosX - rect.left) / rect.width) * 100;
    const yPos = ((smoothMouseWindowPosY - rect.top) / rect.height) * 100;
    
    const roundedXPos = Math.round(xPos * 100) / 100;
    const roundedYPos = Math.round(yPos * 100) / 100;

    document.documentElement.style.setProperty('--xPos', `${roundedXPos}%`);
    document.documentElement.style.setProperty('--yPos', `${roundedYPos}%`);
}


function animateSpotlight() {
    updateMousePositionValues();
    requestAnimationFrame(animateSpotlight);
}

function startSlideShow(){
    const slideshows = document.querySelectorAll('.slideshow');
    slideshows.forEach(slideshow => {
        if(slideshow.childNodes.length > 0){
            slideshow.setAttribute('totalSlides', slideshow.childNodes.length);
            slideshow.setAttribute('currentSlide', '0');
            
            setInterval(()=> showNextSlide(slideshow), 5000);
            slideshow.children[0].classList.add('active');
        }    
    });
    
}

function showNextSlide(slideshow) {
    var currentSlide = parseInt(slideshow.getAttribute('currentSlide'));
    var totalSlides = parseInt(slideshow.getAttribute('totalSlides'));
    var slides = slideshow.children;
    slides[currentSlide].classList.remove('active');
    currentSlide = (currentSlide + 1) % totalSlides;
    slideshow.setAttribute('currentSlide', currentSlide);
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
    
    const mainImage = findSiblingById(parent, "mainImage");
    const mainYoutube = findSiblingById(parent, "mainYoutube");
    
    if(element.hasAttribute('youtube')){
        mainImage.classList.add('hide');
        mainYoutube.classList.remove('hide');
        const segments = element.src.split('/');
        const extractedId = segments[4];

        mainYoutube.firstElementChild.src = `https://www.youtube.com/embed/${extractedId}`;

    } else{
        mainYoutube.classList.add('hide');
        mainImage.classList.remove('hide');
        mainImage.src = element.src;
        mainImage.alt = element.alt;
        mainYoutube.firstElementChild.src = mainYoutube.firstElementChild.src;
        
    }
    
    mainYoutube.setAttribute("index", index);
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
    } else if (currentSelectedContentType == "web") {
        content = webs.find(w => w.id == currentSelectedID);
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
function onMouseMove() {
    
    if (!cursorVisible) {
        bigCursor.style.opacity = 1;
        smallCursor.style.opacity = 1;
        cursorVisible = true; 
    }
    
    
    TweenMax.to(bigCursor, .4, {
        x: mouseWindowPosX - 15,
        y: mouseWindowPosY - 15
    })
    
    TweenMax.to(smallCursor, .1, {
        x: mouseWindowPosX - 5,
        y: mouseWindowPosY - 5
    })

}

function onMouseHover() {
  TweenMax.to(bigCursor, .3, {
    scale: 3
  })
}

function onMouseHoverOut() {
  TweenMax.to(bigCursor, .3, {
    scale: 1
  })
}

function addDropdownEvents() {
    const links = document.querySelectorAll('.dropdown-parent');
    
    links.forEach(link => {
        const dropDownContentID = link.getAttribute('dropDownContentID');
        
        if (dropDownContentID) {
            const dropdownElement = document.getElementById(dropDownContentID);
            
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

function addCardTiltEvents(){
    tempCardsTilt = document.querySelectorAll('.card-tilt');
        
    tempCardsTilt.forEach(gallery => {
        let newGallery = new GameGallery(gallery,false);
        CardsTilt.push(newGallery);
    });

    CardsTilt.forEach(gal => {
        var parentContainer = gal.gallery.parentElement; 
        
        parentContainer.addEventListener('mouseenter', () => {
            gal.isInsideParent = true; 
        });
        
        parentContainer.addEventListener('mouseleave', () => {
            gal.isInsideParent = false; 
            gal.gallery.style.setProperty('--rotationX', '0deg');
            gal.gallery.style.setProperty('--rotationY', '0deg');
        });
    });
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

function addClickToEnlargeImageEvents(){
    clickableImages = document.querySelectorAll('.enlargeable');
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
}


function updateCardRotations() {
    CardsTilt.forEach(gallery => {
        if (gallery.isInsideParent) {
            var parentContainer = gallery.gallery.parentElement;
            var rect = parentContainer.getBoundingClientRect();
            
            var mouseGalleryPosX = mouseWindowPosX - rect.left;
            var mouseGalleryPosY = mouseWindowPosY - rect.top;

            cardSize = {
                width: gallery.gallery.offsetWidth || 0,
                height: gallery.gallery.offsetHeight || 0,
            };

            var rotationX = (mouseGalleryPosY / cardSize.height) * -(SCALE_Y * 2) + SCALE_Y;
            var rotationY = (mouseGalleryPosX / cardSize.width) * (SCALE_X * 2) - SCALE_X;

            gallery.gallery.style.setProperty('--rotationX', `${rotationX}deg`);
            gallery.gallery.style.setProperty('--rotationY', `${rotationY}deg`);
        }
    });
    
    requestAnimationFrame(updateCardRotations);
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
    
    lastScrollY = window.scrollY;
    const upwardScrollThreshold = 200;   
    let accumulatedUpwardScroll = 0;
    
    window.addEventListener("scroll", () => {
        const currentScrollY = window.scrollY;
    
        if (currentScrollY > window.innerHeight) {
            if (currentScrollY < lastScrollY) { // Scrolling upward
                accumulatedUpwardScroll += lastScrollY - currentScrollY;
    
                if (accumulatedUpwardScroll >= upwardScrollThreshold) {
                    navBar.classList.remove("no-click");
                    navBar.classList.remove("navbar-hide");
                    accumulatedUpwardScroll = 0; // Reset
                }
            } else { // Scrolling downward
                navBar.classList.add("no-click");
                navBar.classList.add("navbar-hide");
                accumulatedUpwardScroll = 0; // Reset 
            }
        } else {
            navBar.classList.remove("no-click");
            navBar.classList.remove("navbar-hide");
            accumulatedUpwardScroll = 0; // Reset
        }
    
        lastScrollY = currentScrollY;
    });
    

     //link
     const homeNavLink = document.createElement('a');
     homeNavLink.classList.add('navbar-link');
     homeNavLink.classList.add('hoverable');
     homeNavLink.classList.add('shuffle');
     homeNavLink.textContent = 'HOME';
     if (pageName == 'home') {
         homeNavLink.classList.add('active');
     } else{
         homeNavLink.addEventListener('click', () =>{ goToPage('index');});
     }
     setParent(navBar,homeNavLink);

    //link
    const portfolioNavLink = document.createElement('a');
    portfolioNavLink.classList.add('navbar-link');
    portfolioNavLink.classList.add('dropdown-parent');
    portfolioNavLink.classList.add('hoverable');
    portfolioNavLink.classList.add('shuffle');
    portfolioNavLink.textContent = 'PORTFOLIO';
    const portfolioDropdownID = 'portfolio-dropdown';
    portfolioNavLink.setAttribute('dropDownContentID', portfolioDropdownID);
    
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
    } else if(pageName == 'game'){
        gamesNavLink.classList.add('active');
        gamesNavLink.addEventListener('click', () =>{ goToPage('game-gallery');});
    }else{
        gamesNavLink.addEventListener('click', () =>{ goToPage('game-gallery');});
    }
    setParent(portfolioDropdown, gamesNavLink);

    
    
    const artsNavLink = document.createElement('a');
    artsNavLink.classList.add('shuffle');
    artsNavLink.textContent = 'Artworks';
    if(pageName == 'art-category'){
        artsNavLink.classList.add('active');
    } else if(pageName == 'art'){
        artsNavLink.classList.add('active');
        artsNavLink.addEventListener('click', () =>{ goToPage('art-category');});
    } else{
        artsNavLink.addEventListener('click', () =>{ goToPage('art-category');});
    }
    setParent(portfolioDropdown, artsNavLink);

    const websitesNavLink = document.createElement('a');
    websitesNavLink.classList.add('shuffle');
    websitesNavLink.textContent = 'Websites';
    if(pageName == 'webs'){
        websitesNavLink.classList.add('active');
    } else if(pageName == 'web'){
        websitesNavLink.classList.add('active');
        websitesNavLink.addEventListener('click', () =>{ goToPage('web-gallery');});
    } else{
        websitesNavLink.addEventListener('click', () =>{ goToPage('web-gallery');});
    }
    setParent(portfolioDropdown, websitesNavLink);

    //link
    const aboutNavLink = document.createElement('a');
    aboutNavLink.classList.add('navbar-link');
    aboutNavLink.classList.add('hoverable');
    aboutNavLink.classList.add('shuffle');
    aboutNavLink.textContent = 'ABOUT';
    if (pageName == 'about') {
        aboutNavLink.classList.add('active');
    } else{
        aboutNavLink.addEventListener('click', () =>{ goToPage('about');});
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
        contactNavLink.addEventListener('click', () =>{ goToPage('contact');});
    }
    setParent(navBar,contactNavLink);

}

function generateScrollToTopButton(){
    var scrollToTopButton = document.createElement('div');
    scrollToTopButton.innerText = '[ TOP ]'
    scrollToTopButton.classList.add('hoverable');
    scrollToTopButton.classList.add('scroll-to-top');
    scrollToTopButton.classList.add('floating-button');
    scrollToTopButton.classList.add('shuffle');
    document.body.insertBefore(scrollToTopButton, document.body.firstChild);
    
    scrollToTopButton.addEventListener("click", scrollToTop);
    
    window.addEventListener("scroll", () => {
        if (window.scrollY > (window.innerHeight)) { 
          scrollToTopButton.classList.remove("no-click");
          scrollToTopButton.classList.add("show");
        } else {
            scrollToTopButton.classList.add("no-click");
            scrollToTopButton.classList.remove("show");
        }
    });
}

function generateFixedBottomText(isDebug){
    var credits = document.createElement('div');
    credits.classList.add('credits');
    credits.classList.add('bot-r');
    credits.innerHTML = creditText;
    
    document.body.insertBefore(credits, document.body.firstChild);
    
    if(isDebug){
        const fpsCounterDiv = document.createElement('div');
        fpsCounterDiv.className = 'credits bot-l'
        document.body.insertBefore(fpsCounterDiv, document.body.firstChild);
        
        const fps = document.createElement('div');
        fps.setAttribute('id','fps');
        setParent(fpsCounterDiv, fps);
        
        var startTime = Date.now();
        var frame = 0;

        function tick() {
            var time = Date.now();
            frame++;
            if (time - startTime > 1000) {
                fps.innerHTML = (frame / ((time - startTime) / 1000)).toFixed(1) + " fps";
                startTime = time;
                frame = 0;
              }
            window.requestAnimationFrame(tick);
          }
          tick();
    }
}

function generateCustomCursor(){
    const cursorContainer = document.createElement('div');
    cursorContainer.className = 'cursor';
    document.body.insertBefore(cursorContainer, document.body.firstChild);

    const bigCursorContainer = document.createElement('div');
    bigCursorContainer.className = 'cursor-ball cursor-ball-big-container';
    setParent(cursorContainer, bigCursorContainer);

    const bigCursorElement = document.createElement('div');
    bigCursorElement.className = 'cursor-ball-big';
    setParent(bigCursorContainer, bigCursorElement) 

    const smallCursorContainer = document.createElement('div');
    smallCursorContainer.className = 'cursor-ball cursor-ball-small-container';
    setParent(cursorContainer, smallCursorContainer);

    const smallCursorElement = document.createElement('div');
    smallCursorElement.className = 'cursor-ball-small';
    setParent(smallCursorContainer, smallCursorElement);

    bigCursor = bigCursorContainer;
    smallCursor = smallCursorContainer;

    bigCursor.style.opacity = 0;
    smallCursor.style.opacity = 0;

    document.body.addEventListener('mousemove', onMouseMove);
        
    const hoverables =  document.querySelectorAll('.hoverable, a, button');

    hoverables.forEach(hoverable =>{
        hoverable.addEventListener('mouseenter', onMouseHover);
        hoverable.addEventListener('mouseleave', onMouseHoverOut);
    })
    
    document.body.addEventListener('mouseleave', () =>{
        bigCursor.style.opacity = 0;
        smallCursor.style.opacity = 0;
    });

    document.body.addEventListener('mouseenter', () =>{
        bigCursor.style.opacity = 1;
        smallCursor.style.opacity = 1;
    });
    
    hideOnHover =  document.querySelectorAll('.youtube-embed');

    hideOnHover.forEach(unhoverable =>{
        unhoverable.addEventListener('mouseenter', () =>{
            bigCursor.style.opacity = 0;
            smallCursor.style.opacity = 0;
        });
        unhoverable.addEventListener('mouseleave', () =>{
            bigCursor.style.opacity = 1;
            smallCursor.style.opacity = 1;
        });
    });
    
}

function generateGrainOverlay(){
    const grainEffect = document.createElement('div');
    grainEffect.className = 'grain-overlay';
    document.body.insertBefore(grainEffect, document.body.firstChild);
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

function loadWebJson() {
    return fetch('/assets/json/web.json')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok ' + response.statusText);
            }
            return response.json();
        })
        .then(data => {
            data.forEach(web => {
                let id = lastWebID + 1;
                web.id = id;
                webs.push(web);
                lastWebID = id;
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
        gameGalleryContainer.classList.add('game-card-container');
        gameGalleryContainer.classList.add('card-tilt');
        if(x % 2 == 0){
            gameGalleryContainer.classList.add('reverse');
        }
        gameGalleryContainer.classList.add('featured');
        setParent(sectionContent, gameGalleryContainer);

        const galleryLeft = document.createElement('div');
        galleryLeft.classList.add('game-images-container');
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

        const youtubeContainer = document.createElement('div');
        youtubeContainer.className = 'youtube-embed hide';
        youtubeContainer.setAttribute("id", "mainYoutube");
        setParent(mainImageContainer, youtubeContainer);
        
        const youtubeVideo = document.createElement('iframe');
        youtubeVideo.src = `https://www.youtube.com/embed/tgbNymZ7vqY`;
        youtubeVideo.setAttribute('width','1080');
        youtubeVideo.setAttribute('height','1920');
        youtubeVideo.setAttribute('frameborder','0');
        youtubeVideo.setAttribute('allowfullscreen','');
        youtubeVideo.setAttribute('index',"0");
        setParent(youtubeContainer, youtubeVideo);
        
        const isAutoPlayYTVid = false;

        if(hasFileExtension(game.media[0])){
            mainImage.src = `${game.filePath}/${game.media[0]}`;
            youtubeContainer.classList.add('hide');
            mainImage.classList.remove('hide');
        } else{
            youtubeVideo.src = `https://www.youtube.com/embed/${game.media[0]}`;

            if(isAutoPlayYTVid){
                youtubeVideo.setAttribute("allow","autoplay; encrypted-media;");
                youtubeVideo.src = youtubeVideo.src + `?autoplay=1&mute=1`;
            }
            
            mainImage.classList.add('hide');
            youtubeContainer.classList.remove('hide');
        }
        
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
        thumbnailsContainer.addEventListener('wheel', function (event) {
            event.preventDefault();
            thumbnailsContainer.scrollLeft += event.deltaY;
        });
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
                thumbnail.setAttribute("youtube",'');
            }
            thumbnail.setAttribute("index", i);
            thumbnail.addEventListener('click', (e) => {changeImageGameGallery(thumbnail)});
            setParent(thumbnailsContainer, thumbnail);
        }
        
        const galleryRight = document.createElement('div');
        galleryRight.classList.add('game-details-container');
        setParent(gameGalleryContainer, galleryRight);
        
        const gameTitle = document.createElement('h2');
        gameTitle.classList.add('details-title');
        gameTitle.classList.add('hoverable');
        gameTitle.textContent = game.title.toUpperCase();
        gameTitle.style.textDecoration = 'underline';
        gameTitle.addEventListener('click', (e)=> {
            loadGame(game.id);
        });
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
        artworkDiv.className = 'grid-item-container art';
        artworkDiv.setAttribute("contentID", art.id);
        artworkDiv.setAttribute("contentType", "art");

        const imageContainer = document.createElement('div');
        imageContainer.classList.add("grid-content");
        // imageContainer.classList.add("force-square");
        imageContainer.classList.add("hoverable");
        if (art.media.length !== 1 || !hasFileExtension(art.media[0])) {
            imageContainer.addEventListener('click', (e) => {
                loadArtwork(art.id);
            });
        }

        setParent(artworkDiv, imageContainer);

        const image = document.createElement('img');
        image.classList.add("hover-zoom");
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

function populateGamePortfolioTest(){
    
    const portfolioDiv = document.querySelector(".art-section");
    
    const categoryTitle = document.createElement('div');
    categoryTitle.className = 'grid-item-container title';
    setParent(portfolioDiv, categoryTitle)
    
    const videoObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            const videoHolder = entry.target.querySelector('.video-preview');
            if (entry.isIntersecting) {
                videoHolder.play();
            } else {
                videoHolder.pause();
            }
        });
    }, {
        //when at least 10% of the video is visible
        threshold: 0.2
    });
    
    games.forEach(game => {

        if (game.remarks.includes("hide")) {
            return;
        }

        const gameDiv = document.createElement('div');
        gameDiv.className = 'grid-item-container game'
        setParent(portfolioDiv, gameDiv)
        
        const imageContainer = document.createElement('div'); 
        imageContainer.className = 'grid-content game hoverable';
        imageContainer.addEventListener('click', (e) => {
            loadGame(game.id);
        });
        setParent(gameDiv, imageContainer)
        
        const videoHolder = document.createElement('video'); 
        videoHolder.muted = true;
        videoHolder.autoplay = true;
        videoHolder.loop = true;
        videoHolder.className = 'game-preview video-preview';
        setParent(imageContainer, videoHolder);

        imageContainer.addEventListener('mouseover', (e) => {
            videoHolder.pause();
        });

        imageContainer.addEventListener('mouseout', (e) => {
            videoHolder.play();
        });

        const video = document.createElement('source'); 
        video.src = `${game.filePath}/preview.mp4`;
        video.setAttribute('type', 'video/mp4');
        setParent(videoHolder, video);
        
        const image = document.createElement('img'); 
        image.className = 'game-preview image-preview';
        image.src = `${game.filePath}/${game.media[0]}`;
        setParent(imageContainer, image);

        const clickIndicator = document.createElement('div'); 
        clickIndicator.className = 'game-preview click-indicator';
        setParent(imageContainer, clickIndicator);

        const arrowSymbol = document.createElement('div'); 
        arrowSymbol.innerHTML = '&#x2197; ';
        setParent(clickIndicator, arrowSymbol);
        
        const seeMore = document.createElement('div'); 
        seeMore.innerHTML = `MORE INFO`;
        setParent(clickIndicator, seeMore);

        const gameTitle = document.createElement('h1'); 
        gameTitle.className = 'hoverable';
        gameTitle.innerHTML = `<u>${game.title.toUpperCase()}`;
        gameTitle.addEventListener('click', (e) => {
            loadGame(game.id);
        });
        setParent(gameDiv, gameTitle)
        
        const tagsList = document.createElement('div');
        tagsList.className = 'word-list game';
        setParent(gameDiv, tagsList);

        game.tools.forEach(tool => {
            const toolText = document.createElement('p');
            toolText.className = 'shuffle';
            toolText.textContent = tool;
            setParent(tagsList, toolText)
        });
        
        if(game.remarks.includes("solo")){
            const projectType = document.createElement('p');
            projectType.className = 'shuffle';
            projectType.textContent = "Solo Project";
            setParent(tagsList, projectType)
        } else{
            game.roles.forEach(role => {
                const roleText = document.createElement('p');
                roleText.className = 'shuffle';
                roleText.textContent = role;
                setParent(tagsList, roleText)
            });
        }
        
        //game.additional.length
        var maxInfo = 0;
        for (let i = 0; i < maxInfo; i++) {
            const additionalInfo = document.createElement('h3');
            additionalInfo.innerHTML = `•&nbsp;&nbsp;${game.additional[i]}`;
            setParent(gameDiv, additionalInfo);
        }   
        
        videoObserver.observe(gameDiv);
    
    });

}

function populateGameInfo(){
    const gameId = getQueryParam('id');
    const game = games.find(a => a.id == gameId);
    
    document.title = game.title;

    const portfolioDiv = document.getElementById("games");

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
    gameGalleryContainer.classList.add('game-card-container');
    gameGalleryContainer.classList.add('game-info');
    // gameGalleryContainer.classList.add('card-tilt');
    setParent(sectionContent, gameGalleryContainer);

    const galleryLeft = document.createElement('div');
    galleryLeft.classList.add('game-images-container');
    galleryLeft.classList.add('game-info');
    galleryLeft.classList.add('card-tilt');
    setParent(gameGalleryContainer, galleryLeft);
    
    const mainImageContainer = document.createElement('div');
    mainImageContainer.classList.add('main-image-container');
    setParent(galleryLeft, mainImageContainer);

    const mainImage = document.createElement('img');
    mainImage.addEventListener('error', (e) => {replaceNullImage(mainImage)});
    mainImage.classList.add('main-image');
    if(game.remarks.includes("mobile")){mainImage.classList.add('mobile');};
    mainImage.classList.add('hoverable');
    mainImage.classList.add('enlargeable');
    mainImage.setAttribute("id", "mainImage");
    mainImage.setAttribute("index", "0");
    mainImage.src = `${game.filePath}/${game.media[0]}`;
    setParent(mainImageContainer, mainImage);

    const youtubeContainer = document.createElement('div');
    youtubeContainer.className = 'youtube-embed hide';
    youtubeContainer.setAttribute("id", "mainYoutube");
    setParent(mainImageContainer, youtubeContainer);
    
    const youtubeVideo = document.createElement('iframe');
    youtubeVideo.src = `https://www.youtube.com/embed/tgbNymZ7vqY`;
    youtubeVideo.setAttribute('width','1080');
    youtubeVideo.setAttribute('height','1920');
    youtubeVideo.setAttribute('frameborder','0');
    youtubeVideo.setAttribute('allowfullscreen','');
    youtubeVideo.setAttribute('index',"0");
    setParent(youtubeContainer, youtubeVideo);
    
    const isAutoPlayYTVid = false;
    
    if(hasFileExtension(game.media[0])){
        mainImage.src = `${game.filePath}/${game.media[0]}`;
        youtubeContainer.classList.add('hide');
        mainImage.classList.remove('hide');
    } else{
        youtubeVideo.src = `https://www.youtube.com/embed/${game.media[0]}`;
        
        if(isAutoPlayYTVid){
            youtubeVideo.setAttribute("allow","autoplay; encrypted-media;");
            youtubeVideo.src = youtubeVideo.src + `?autoplay=1&mute=1`;
        }
        
        mainImage.classList.add('hide');
        youtubeContainer.classList.remove('hide');
    }
        
    
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
    thumbnailsContainer.addEventListener('wheel', function (event) {
        event.preventDefault();
        thumbnailsContainer.scrollLeft += event.deltaY;
    });
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
            thumbnail.setAttribute("youtube",'');
        }
        thumbnail.setAttribute("index", i);
        thumbnail.addEventListener('click', (e) => {changeImageGameGallery(thumbnail)});
        setParent(thumbnailsContainer, thumbnail);
    }
    
    const galleryRight = document.createElement('div');
    galleryRight.classList.add('game-details-container');
    galleryRight.classList.add('game-info');
    setParent(gameGalleryContainer, galleryRight);

    const mainDetails = document.createElement('div');
    mainDetails.className = 'game-details-main game-info';
    setParent(galleryRight, mainDetails);
    
    const gameTitle = document.createElement('h2');
    gameTitle.classList.add('details-title');
    gameTitle.textContent = game.title.toUpperCase();
    setParent(mainDetails, gameTitle);
    
    const gameDescription = document.createElement('p');
    gameDescription.classList.add('details-description');
    gameDescription.innerHTML = `${game.description}<br><br>`;
    setParent(mainDetails, gameDescription);

    // const gameBullets = document.createElement('p');
    // gameBullets.classList.add('details-description');
    // gameBullets.innerHTML = `<b>•&nbsp;&nbsp;Duration: ${game.duration}`;
    // setParent(galleryRight, gameBullets);

    game.additional.forEach(additionalInfo =>{
        const gameBullets = document.createElement('p');
        gameBullets.classList.add('details-description');
        gameBullets.innerHTML = `<b>•&nbsp;&nbsp;${additionalInfo}`;
        setParent(mainDetails, gameBullets);
    });
    
    const primaryDetails = document.createElement('div');
    primaryDetails.className = 'game-details-primary game-info';
    setParent(galleryRight, primaryDetails);

    const year = document.createElement('p');
    year.classList.add('details-description');
    year.innerHTML = `<b>YEAR</b><br>${game.year}<br><br>`;
    setParent(primaryDetails, year);

    const tools = document.createElement('p');
    tools.classList.add('details-description');
    var toolsStr = "";
    
    for (i = 0; i < game.tools.length; i++) {
        toolsStr = toolsStr + game.tools[i];
        if (i < game.tools.length - 1) {
            toolsStr = toolsStr + ', ';
        }
    }
    
    tools.innerHTML = `<b>TOOL</b><br>${toolsStr}<br><br>`;
    setParent(primaryDetails, tools);

    const roles = document.createElement('p');
    roles.classList.add('details-description');
    var rolesStr = "";
    
    for (i = 0; i < game.roles.length; i++) {
        rolesStr = rolesStr + game.roles[i];
        if (i < game.roles.length - 1) {
            rolesStr = rolesStr + ', ';
        }
    }
    
    roles.innerHTML = `<b>ROLE</b><br>${rolesStr}<br><br>`;
    setParent(primaryDetails, roles);

    const platforms = document.createElement('p');
    platforms.classList.add('details-description');
    var platformsStr = "";
    
    for (i = 0; i < game.platforms.length; i++) {
        platformsStr = platformsStr + game.platforms[i];
        if (i < game.platforms.length - 1) {
            platformsStr = platformsStr + ', ';
        }
    }
    
    platforms.innerHTML = `<b>PLATFORM</b><br>${platformsStr}<br><br>`;
    setParent(primaryDetails, platforms);

    if(game.videoLink != ""){

        const youtubeLinkDiv = document.createElement('div');
        youtubeLinkDiv.classList.add('game-details-container');
        youtubeLinkDiv.classList.add('game-info');
        youtubeLinkDiv.style.flexDirection = 'column';
        setParent(gameGalleryContainer, youtubeLinkDiv);

        const youtubeTitle = document.createElement('p');
        youtubeTitle.classList.add('details-description');
        youtubeTitle.innerHTML = `<b>${"GAMEPLAY VIDEO"}`;
        setParent(youtubeLinkDiv, youtubeTitle);

        const youtubeContainerInfo = document.createElement('div');
        youtubeContainerInfo.className = 'youtube-embed';
        setParent(youtubeLinkDiv, youtubeContainerInfo);

        const youtubeVideoInfo = document.createElement('iframe');
        youtubeVideoInfo.src = `https://www.youtube.com/embed/${game.videoLink}`;
        youtubeVideoInfo.setAttribute('width','1080');
        youtubeVideoInfo.setAttribute('height','1920');
        youtubeVideoInfo.setAttribute('frameborder','0');
        youtubeVideoInfo.setAttribute('allowfullscreen','');
        setParent(youtubeContainerInfo, youtubeVideoInfo);

    }

    if(!game.remarks.includes("solo")){
        const collaboratorsDiv = document.createElement('div');
        collaboratorsDiv.classList.add('game-details-container');
        collaboratorsDiv.classList.add('game-info');
        collaboratorsDiv.style.flexDirection = 'column';
        setParent(gameGalleryContainer, collaboratorsDiv);
        
        const collaboratorsTitle = document.createElement('p');
        collaboratorsTitle.classList.add('details-description');
        collaboratorsTitle.innerHTML = `<b><br><br>${"COLLABORATORS"}`;
        setParent(collaboratorsDiv, collaboratorsTitle);
    
        const collaboratorList = document.createElement('div');
        collaboratorList.className = 'word-list';
        collaboratorList.style.justifyContent = 'left';
        setParent(collaboratorsDiv, collaboratorList);
        
        const collaborators = game.collaborators;

        Object.entries(collaborators).forEach(([name, url]) => {
            const collaboratorText = document.createElement('p');
            collaboratorText.className = 'shuffle';
            if(url != ""){
                collaboratorText.classList.add('hoverable');
                collaboratorText.innerHTML = `<u>${name}</u>`;
                collaboratorText.addEventListener('click', (e) =>{
                    window.open(url, '_blank');
                });
            }else{
                collaboratorText.textContent = name;
            }
            
            setParent(collaboratorList, collaboratorText);
        });
                
        
    }
    
    const pageNavDiv = document.createElement('div');
    pageNavDiv.classList.add('game-details-container');
    pageNavDiv.classList.add('game-info');
    pageNavDiv.style.flexDirection = 'column';
    setParent(gameGalleryContainer, pageNavDiv);
    
    const spacer = document.createElement('p');
    spacer.classList.add('details-description');
    spacer.innerHTML = ``;
    setParent(pageNavDiv, spacer);
    
    const pageNavButtonHolder = document.createElement('div');
    pageNavButtonHolder.style.flex = '1';
    pageNavButtonHolder.style.position = 'relative';
    pageNavButtonHolder.style.minHeight = '40px';
    setParent(pageNavDiv, pageNavButtonHolder);

    const moreGameButton = document.createElement('div');
    moreGameButton.innerText = '[ BACK TO GALLERY ]'
    moreGameButton.classList.add('hoverable');
    moreGameButton.classList.add('page-nav-button');
    moreGameButton.classList.add('more');
    moreGameButton.classList.add('floating-button');
    moreGameButton.classList.add('shuffle');
    setParent(pageNavButtonHolder, moreGameButton);

    moreGameButton.addEventListener('click', (e) => {
        goToPage('game-gallery');
    });
    
    if(gameId != 1){
        const prevGameButton = document.createElement('div');
        prevGameButton.innerText = '[ PREV ]'
        prevGameButton.classList.add('hoverable');
        prevGameButton.classList.add('page-nav-button');
        prevGameButton.classList.add('prev');
        prevGameButton.classList.add('floating-button');
        prevGameButton.classList.add('shuffle');
        setParent(pageNavButtonHolder, prevGameButton);
        
        prevGameButton.addEventListener('click', (e) => {
            loadGame(game.id - 1);
        });

        prevGameButton.title = games.find(a => a.id == game.id - 1).title;
    }

    if(gameId != games.length){
        const nextGameButton = document.createElement('div');
        nextGameButton.innerText = '[ NEXT ]'
        nextGameButton.classList.add('hoverable');
        nextGameButton.classList.add('page-nav-button');
        nextGameButton.classList.add('next');
        nextGameButton.classList.add('floating-button');
        nextGameButton.classList.add('shuffle');
        setParent(pageNavButtonHolder, nextGameButton);
        
        nextGameButton.addEventListener('click', (e) => {
            loadGame(game.id + 1);
        });

        nextGameButton.title = games.find(a => a.id == game.id + 1).title;
    }
    
    const background = document.createElement('div');
    background.classList.add('background');
    background.classList.add('game-info');
    background.style.backgroundImage = `url('${game.filePath}/${game.backgroundImage}')`
    setParent(section, background);

    
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
        gameGalleryContainer.classList.add('game-card-container');
        gameGalleryContainer.classList.add('card-tilt');
        if(x % 2 == 0){
            gameGalleryContainer.classList.add('reverse');
        }
        setParent(sectionContent, gameGalleryContainer);

        const galleryLeft = document.createElement('div');
        galleryLeft.classList.add('game-images-container');
        setParent(gameGalleryContainer, galleryLeft);
        
        const mainImageContainer = document.createElement('div');
        mainImageContainer.classList.add('main-image-container');
        setParent(galleryLeft, mainImageContainer);
    
        const mainImage = document.createElement('img');
        mainImage.addEventListener('error', (e) => {replaceNullImage(mainImage)});
        mainImage.classList.add('main-image');
        if(game.remarks.includes("mobile")){mainImage.classList.add('mobile');};
        mainImage.classList.add('hoverable');
        mainImage.classList.add('enlargeable');
        mainImage.classList.add('hide');
        mainImage.setAttribute("id", "mainImage");
        mainImage.setAttribute("index", "0");
        setParent(mainImageContainer, mainImage);

        const youtubeContainer = document.createElement('div');
        youtubeContainer.className = 'youtube-embed hide';
        youtubeContainer.setAttribute("id", "mainYoutube");
        setParent(mainImageContainer, youtubeContainer);

        const youtubeVideo = document.createElement('iframe');
        youtubeVideo.src = `https://www.youtube.com/embed/tgbNymZ7vqY`;
        youtubeVideo.setAttribute('width','1080');
        youtubeVideo.setAttribute('height','1920');
        youtubeVideo.setAttribute('frameborder','0');
        youtubeVideo.setAttribute('allowfullscreen','');
        youtubeVideo.setAttribute('index',"0");
        setParent(youtubeContainer, youtubeVideo);
        
        const isAutoPlayYTVid = false;

        if(hasFileExtension(game.media[0])){
            mainImage.src = `${game.filePath}/${game.media[0]}`;
            youtubeContainer.classList.add('hide');
            mainImage.classList.remove('hide');
        } else{
            youtubeVideo.src = `https://www.youtube.com/embed/${game.media[0]}`;

            if(isAutoPlayYTVid){
                youtubeVideo.setAttribute("allow","autoplay; encrypted-media;");
                youtubeVideo.src = youtubeVideo.src + `?autoplay=1&mute=1`;
            }
            
            mainImage.classList.add('hide');
            youtubeContainer.classList.remove('hide');
        }
        
        
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
        thumbnailsContainer.addEventListener('wheel', function (event) {
            event.preventDefault();
            thumbnailsContainer.scrollLeft += event.deltaY;
        });
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
                thumbnail.setAttribute("youtube",'');
            }
            thumbnail.setAttribute("index", i);
            thumbnail.addEventListener('click', (e) => {changeImageGameGallery(thumbnail)});
            setParent(thumbnailsContainer, thumbnail);
        }
        
        const galleryRight = document.createElement('div');
        galleryRight.classList.add('game-details-container');
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
        artContainer.className = 'grid-item-container banner';
        artContainer.addEventListener('click', (e) => {
            loadArtCategory(category);
        });
        setParent(portfolioDiv, artContainer);

        const imgHoverZoom = document.createElement('div');
        imgHoverZoom.className = 'grid-content banner hoverable';
        
        setParent(artContainer, imgHoverZoom);
        
        const img = document.createElement('img');
        img.classList.add("hover-zoom");
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
        categoryTitle.className = 'grid-item-container title';
        categoryTitle.textContent = category;
        setParent(portfolioDiv, categoryTitle);
        
        
        categories[category].forEach(art => {
            const artworkDiv = document.createElement('div');
            artworkDiv.className = 'grid-item-container art';
            artworkDiv.setAttribute('contentID', art.id);
            
            const imageContainer = document.createElement('div');
            imageContainer.classList.add("grid-content");
            //imageContainer.classList.add("force-square");
            imageContainer.classList.add("hoverable");
            if(art.media.length !== 1 || !hasFileExtension(art.media[0])){
                imageContainer.addEventListener('click', (e) => {
                    loadArtwork(art.id);
                });
            } 
           
            setParent(artworkDiv, imageContainer);
            
            const image = document.createElement('img');
            image.classList.add("hover-zoom");
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
            
            if(art.tools.length > 0){
                const tagsList = document.createElement('div');
                tagsList.className = 'word-list game';
                setParent(artworkDiv, tagsList);
                
                art.tools.forEach(tool => {
                    const toolText = document.createElement('p');
                    toolText.className = 'shuffle';
                    toolText.textContent = tool;
                    setParent(tagsList, toolText)
                });
            }
            
            // const description = document.createElement('h3');
            // description.textContent = art.description;
            // setParent(artworkDiv, description);
            
            // art.additional.forEach(additional => {
            //     const additionalInfo = document.createElement('h3');
            //     additionalInfo.innerHTML = `•&nbsp;&nbsp;${additional}`;
            //     setParent(artworkDiv, additionalInfo);
            // });
            
            setParent(portfolioDiv, artworkDiv);
        });
        
    }
}


function populateArtInfo() {
    const artworkId = getQueryParam('id');
    const artwork = artworks.find(a => a.id == artworkId);

    document.title = artwork.title;
    
    const portfolioDiv = document.querySelector('.art-section');
    portfolioDiv.setAttribute("contentID", artwork.id);
    portfolioDiv.setAttribute("contentType", "art");
    
    const artworkTitle = document.createElement('div');
    artworkTitle.className = 'grid-item-container title';
    const t = artwork.title.toUpperCase();
    if (artwork.remarks.includes("quoted")) {
        artworkTitle.textContent = `"${t}"`;
    } else{
        artworkTitle.textContent = t;
    }
    setParent(portfolioDiv, artworkTitle);
    
    // const description = document.createElement('div');
    // description.className = 'grid-item-container description';
    // description.textContent = `${artwork.description}`;
    // setParent(portfolioDiv, description);
    
    for (i = 0; i < artwork.additional.length; i++) {
        const additionalInfo = document.createElement('div');
        additionalInfo.className = 'grid-item-container description';
        additionalInfo.innerHTML = `•&nbsp;&nbsp;${artwork.additional[i]}<br>`;
        
        if(i+1 == artwork.additional.length){
            additionalInfo.classList.add('last-description');
        }
        setParent(portfolioDiv, additionalInfo);
    }
    
    artwork.media.forEach(img => {
            const artworkDiv = document.createElement('div');
            artworkDiv.className = 'grid-item-container artwork';
            setParent(portfolioDiv, artworkDiv);
            
            const imageContainer = document.createElement('div');
            imageContainer.classList.add("grid-content");
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

function populateWebPortfolio(){
    
    const portfolioDiv = document.querySelector(".art-section");
    
    const categoryTitle = document.createElement('div');
    categoryTitle.className = 'grid-item-container title';
    setParent(portfolioDiv, categoryTitle);
    
    webs.forEach(web => {

        if (web.remarks.includes("hide")) {
            return;
        }

        const webDiv = document.createElement('div');
        webDiv.className = 'grid-item-container web'
        setParent(portfolioDiv, webDiv)
        
        const imageContainer = document.createElement('div');
        imageContainer.classList.add("grid-content");
        imageContainer.classList.add("hoverable");
        if(web.media.length !== 1 || !hasFileExtension(web.media[0])){
            imageContainer.addEventListener('click', (e) => {
                loadWeb(web.id);
            });
        } 
        
        setParent(webDiv, imageContainer);
        
        const image = document.createElement('img');
        image.classList.add("hover-zoom");
        image.addEventListener('error', (e) => {replaceNullImage(image)});

        if(hasFileExtension(web.media[0])){
            image.src = `${web.filePath}/${web.media[0]}`;
        }else{
            image.src = `https://img.youtube.com/vi/${web.media[0]}/maxresdefault.jpg`
        }

        if(web.media.length === 1){
            image.classList.add("enlargeable");
        } else{
            
        }

        setParent(imageContainer, image);

        const webTitle = document.createElement('h1'); 
        webTitle.className = 'hoverable';
        webTitle.innerHTML = `<u>${web.title.toUpperCase()}`;
        webTitle.addEventListener('click', (e) => {
            loadWeb(web.id);
        });
        setParent(webDiv, webTitle)
        
        const tagsList = document.createElement('div');
        tagsList.className = 'word-list game';
        setParent(webDiv, tagsList);

        web.tools.forEach(tool => {
            const toolText = document.createElement('p');
            toolText.className = 'shuffle';
            toolText.textContent = tool;
            setParent(tagsList, toolText)
        });
        
        if(web.remarks.includes("solo")){
            const projectType = document.createElement('p');
            projectType.className = 'shuffle';
            projectType.textContent = "Solo Project";
            setParent(tagsList, projectType)
        } else{
            web.roles.forEach(role => {
                const roleText = document.createElement('p');
                roleText.className = 'shuffle';
                roleText.textContent = role;
                setParent(tagsList, roleText)
            });
        }
        
    
    });

}

function populateWebInfo(){
    const webID = getQueryParam('id');
    const web = webs.find(a => a.id == webID);
    
    document.title = web.title;

    const portfolioDiv = document.getElementById("games");

    if(web.remarks.includes("hide")){
        return;
    }

    const section = document.createElement('div');
    section.classList.add('section');
    section.setAttribute("id", "projects");
    section.setAttribute("contentID", web.id);
    section.setAttribute("contentType", "web");
    setParent(portfolioDiv, section);

    const sectionContent = document.createElement('div');
    sectionContent.classList.add('section-content');
    setParent(section, sectionContent);
    
    const webGalleryContainer = document.createElement('div');
    webGalleryContainer.classList.add('game-card-container');
    webGalleryContainer.classList.add('game-info');
    // gameGalleryContainer.classList.add('card-tilt');
    setParent(sectionContent, webGalleryContainer);

    const galleryLeft = document.createElement('div');
    galleryLeft.classList.add('game-images-container');
    galleryLeft.classList.add('game-info');
    galleryLeft.classList.add('card-tilt');
    setParent(webGalleryContainer, galleryLeft);
    
    const mainImageContainer = document.createElement('div');
    mainImageContainer.classList.add('main-image-container');
    setParent(galleryLeft, mainImageContainer);
    
    const mainImage = document.createElement('img');
    mainImage.addEventListener('error', (e) => {replaceNullImage(mainImage)});
    mainImage.classList.add('main-image');
    if(web.remarks.includes("mobile")){mainImage.classList.add('mobile');};
    mainImage.classList.add('hoverable');
    mainImage.classList.add('enlargeable');
    mainImage.setAttribute("id", "mainImage");
    mainImage.setAttribute("index", "0");
    mainImage.src = `${web.filePath}/${web.media[0]}`;
    setParent(mainImageContainer, mainImage);  
    
    const youtubeContainer = document.createElement('div');
    youtubeContainer.className = 'youtube-embed hide';
    youtubeContainer.setAttribute("id", "mainYoutube");
    setParent(mainImageContainer, youtubeContainer);
    
    const youtubeVideo = document.createElement('iframe');
    youtubeVideo.src = `https://www.youtube.com/embed/tgbNymZ7vqY`;
    youtubeVideo.setAttribute('width','1080');
    youtubeVideo.setAttribute('height','1920');
    youtubeVideo.setAttribute('frameborder','0');
    youtubeVideo.setAttribute('allowfullscreen','');
    youtubeVideo.setAttribute('index',"0");
    setParent(youtubeContainer, youtubeVideo);
    
    const isAutoPlayYTVid = false;
    
    if(hasFileExtension(web.media[0])){
        mainImage.src = `${web.filePath}/${web.media[0]}`;
        youtubeContainer.classList.add('hide');
        mainImage.classList.remove('hide');
    } else{
        youtubeVideo.src = `https://www.youtube.com/embed/${web.media[0]}`;
        
        if(isAutoPlayYTVid){
            youtubeVideo.setAttribute("allow","autoplay; encrypted-media;");
            youtubeVideo.src = youtubeVideo.src + `?autoplay=1&mute=1`;
        }
        
        mainImage.classList.add('hide');
        youtubeContainer.classList.remove('hide');
    }
    
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
    thumbnailsContainer.addEventListener('wheel', function (event) {
        event.preventDefault();
        thumbnailsContainer.scrollLeft += event.deltaY;
    });
    setParent(galleryLeft, thumbnailsContainer);
    
    for (i = 0; i < web.media.length; i++) {
        const thumbnail = document.createElement('img');
        thumbnail.addEventListener('error', (e) => {replaceNullImage(thumbnail)});
        thumbnail.classList.add('thumbnail');
        thumbnail.classList.add('hoverable');
        if ( i == 0) { thumbnail.classList.add('active'); };
        if (web.isMobile == true) {thumbnail.classList.add('mobile');};
        if(hasFileExtension(web.media[i])){
            thumbnail.src = `${web.filePath}/${web.media[i]}`;
        }else{
            thumbnail.src = `https://img.youtube.com/vi/${web.media[i]}/maxresdefault.jpg`
            thumbnail.setAttribute("youtube",'');
        }
        thumbnail.setAttribute("index", i);
        thumbnail.addEventListener('click', (e) => {changeImageGameGallery(thumbnail)});
        setParent(thumbnailsContainer, thumbnail);
    }
    
    const galleryRight = document.createElement('div');
    galleryRight.classList.add('game-details-container');
    galleryRight.classList.add('game-info');
    setParent(webGalleryContainer, galleryRight);

    const mainDetails = document.createElement('div');
    mainDetails.className = 'game-details-main game-info';
    setParent(galleryRight, mainDetails);
    
    const webTitle = document.createElement('h2');
    webTitle.classList.add('details-title');
    webTitle.textContent = web.title.toUpperCase();
    setParent(mainDetails, webTitle);
    
    const webDescription = document.createElement('p');
    webDescription.classList.add('details-description');
    webDescription.innerHTML = `${web.description}<br><br>`;
    setParent(mainDetails, webDescription);

    web.additional.forEach(additionalInfo =>{
        const webBullets = document.createElement('p');
        webBullets.classList.add('details-description');
        webBullets.innerHTML = `<b>•&nbsp;&nbsp;${additionalInfo}`;
        setParent(mainDetails, webBullets);
    });
    
    const primaryDetails = document.createElement('div');
    primaryDetails.className = 'game-details-primary game-info';
    setParent(galleryRight, primaryDetails);

    const year = document.createElement('p');
    year.classList.add('details-description');
    year.innerHTML = `<b>YEAR</b><br>${web.year}<br><br>`;
    setParent(primaryDetails, year);

    const tools = document.createElement('p');
    tools.classList.add('details-description');
    var toolsStr = "";
    
    for (i = 0; i < web.tools.length; i++) {
        toolsStr = toolsStr + web.tools[i];
        if (i < web.tools.length - 1) {
            toolsStr = toolsStr + ', ';
        }
    }
    
    tools.innerHTML = `<b>TOOL</b><br>${toolsStr}<br><br>`;
    setParent(primaryDetails, tools);

    const roles = document.createElement('p');
    roles.classList.add('details-description');
    var rolesStr = "";
    
    for (i = 0; i < web.roles.length; i++) {
        rolesStr = rolesStr + web.roles[i];
        if (i < web.roles.length - 1) {
            rolesStr = rolesStr + ', ';
        }
    }
    
    roles.innerHTML = `<b>ROLE</b><br>${rolesStr}<br><br>`;
    setParent(primaryDetails, roles);
    
    const additionalMedia = web.additionalMedia;

    Object.entries(additionalMedia).forEach(([title, mediaUrls]) => {
        const additionalMediaTitleDiv = document.createElement('div');
        additionalMediaTitleDiv.classList.add('game-details-container');
        additionalMediaTitleDiv.classList.add('game-info');
        additionalMediaTitleDiv.style.flexDirection = 'column';
        setParent(webGalleryContainer, additionalMediaTitleDiv);

        const collaboratorsTitle = document.createElement('p');
        collaboratorsTitle.classList.add('details-description');
        collaboratorsTitle.innerHTML = `<b><br><br>${title}`;
        setParent(additionalMediaTitleDiv, collaboratorsTitle);

        const gridGalleryDiv = document.createElement('div');
        gridGalleryDiv.classList.add('game-details-container');
        gridGalleryDiv.classList.add('game-info');
        gridGalleryDiv.style.flexDirection = 'row';
        gridGalleryDiv.style.flexWrap = 'wrap';
        setParent(webGalleryContainer, gridGalleryDiv);

        mediaUrls.forEach(img => {
        
            const artworkDiv = document.createElement('div');
            if(mediaUrls.length > 1){
                artworkDiv.className = 'grid-item-container web';
            } 
            
            setParent(gridGalleryDiv, artworkDiv);
            
            const imageContainer = document.createElement('div');
            imageContainer.classList.add("grid-content");
            imageContainer.classList.add("artworks");
            //imageContainer.classList.add("hoverable");
            setParent(artworkDiv, imageContainer);
    
            if (hasFileExtension(img)) {
                const image = document.createElement('img');
                image.addEventListener('error', (e) => { replaceNullImage(image) });
                //image.className = 'enlargeable';
                image.src = `${web.filePath}/${img}`;
    
                image.setAttribute('index', web.media.indexOf(img));
                setParent(imageContainer, image);
    
            } else {
    
                const youtubeContainer = document.createElement('div');
                youtubeContainer.className = 'youtube-embed';
                setParent(imageContainer, youtubeContainer);
    
                const youtubeVideo = document.createElement('iframe');
                youtubeVideo.src = `https://www.youtube.com/embed/${img}`;
                youtubeVideo.setAttribute('width', '1080');
                youtubeVideo.setAttribute('height', '1920');
                youtubeVideo.setAttribute('frameborder', '0');
                youtubeVideo.setAttribute('allowfullscreen', '');
                youtubeVideo.setAttribute('index', web.media.indexOf(img));
                setParent(youtubeContainer, youtubeVideo);
    
            }
        
        });
    });
    
   

    if(!web.remarks.includes("solo")){
        const collaboratorsDiv = document.createElement('div');
        collaboratorsDiv.classList.add('game-details-container');
        collaboratorsDiv.classList.add('game-info');
        collaboratorsDiv.style.flexDirection = 'column';
        setParent(webGalleryContainer, collaboratorsDiv);
        
        const collaboratorsTitle = document.createElement('p');
        collaboratorsTitle.classList.add('details-description');
        collaboratorsTitle.innerHTML = `<b><br><br>${"COLLABORATORS"}`;
        setParent(collaboratorsDiv, collaboratorsTitle);
    
        const collaboratorList = document.createElement('div');
        collaboratorList.className = 'word-list';
        collaboratorList.style.justifyContent = 'left';
        setParent(collaboratorsDiv, collaboratorList);
        
        const collaborators = web.collaborators;

        Object.entries(collaborators).forEach(([name, url]) => {
            const collaboratorText = document.createElement('p');
            collaboratorText.className = 'shuffle';
            if(url != ""){
                collaboratorText.classList.add('hoverable');
                collaboratorText.innerHTML = `<u>${name}</u>`;
                collaboratorText.addEventListener('click', (e) =>{
                    window.open(url, '_blank');
                });
            }else{
                collaboratorText.textContent = name;
            }
            
            setParent(collaboratorList, collaboratorText);
        });
                
        
    }


    
    const pageNavDiv = document.createElement('div');
    pageNavDiv.classList.add('game-details-container');
    pageNavDiv.classList.add('game-info');
    pageNavDiv.style.flexDirection = 'column';
    setParent(webGalleryContainer, pageNavDiv);
    
    const spacer = document.createElement('p');
    spacer.classList.add('details-description');
    spacer.innerHTML = ``;
    setParent(pageNavDiv, spacer);
    
    const pageNavButtonHolder = document.createElement('div');
    pageNavButtonHolder.style.flex = '1';
    pageNavButtonHolder.style.position = 'relative';
    pageNavButtonHolder.style.minHeight = '40px';
    setParent(pageNavDiv, pageNavButtonHolder);

    const moreGameButton = document.createElement('div');
    moreGameButton.innerText = '[ BACK TO GALLERY ]'
    moreGameButton.classList.add('hoverable');
    moreGameButton.classList.add('page-nav-button');
    moreGameButton.classList.add('more');
    moreGameButton.classList.add('floating-button');
    moreGameButton.classList.add('shuffle');
    setParent(pageNavButtonHolder, moreGameButton);

    moreGameButton.addEventListener('click', (e) => {
        goToPage('web-gallery');
    });
    
    if(webID != 1){
        const prevGameButton = document.createElement('div');
        prevGameButton.innerText = '[ PREV ]'
        prevGameButton.classList.add('hoverable');
        prevGameButton.classList.add('page-nav-button');
        prevGameButton.classList.add('prev');
        prevGameButton.classList.add('floating-button');
        prevGameButton.classList.add('shuffle');
        setParent(pageNavButtonHolder, prevGameButton);
        
        prevGameButton.addEventListener('click', (e) => {
            loadWeb(web.id - 1);
        });
        
        prevGameButton.title = webs.find(a => a.id == web.id - 1).title;
    }
    
    if(webID != webs.length){
        const nextGameButton = document.createElement('div');
        nextGameButton.innerText = '[ NEXT ]'
        nextGameButton.classList.add('hoverable');
        nextGameButton.classList.add('page-nav-button');
        nextGameButton.classList.add('next');
        nextGameButton.classList.add('floating-button');
        nextGameButton.classList.add('shuffle');
        setParent(pageNavButtonHolder, nextGameButton);
        
        nextGameButton.addEventListener('click', (e) => {
            loadWeb(web.id + 1);
        });

        nextGameButton.title = webs.find(a => a.id == web.id + 1).title;
    }
    
    const background = document.createElement('div');
    background.classList.add('background');
    setParent(section, background);

    
}

function loadArtwork(id) {
    const artwork = artworks.find(a => a.id === id);
    if (artwork) {
        goToPage('artwork', 'id', id);
    }
}

function loadGame(id) {
    const game = games.find(a => a.id === id);
    if (game) {
        goToPage('game', 'id', id);
    }
}

function loadWeb(id) {
    const web = webs.find(a => a.id === id);
    if (web) {
        goToPage('web', 'id', id);
    }
}

function loadArtCategory(category) {
    goToPage('art-gallery', 'category', category.toLowerCase().replace(/\s+/g, ''));
}

function goToPage(pageName, key, value){
    let url = pageName
    
    if(debugMode && url != 'index'){
        url = `${url}.html`
    }
    
    if(url == 'index'){
        url = `/`;
    }
    
    if(key){url = `${url}?${key}=${value}`;}
    
    window.location.href = url;
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

function scrollToTop(){
    window.scrollTo({
        top: 0,
        behavior: "smooth"
      });
}

function disableAllContextMenu(){
    const images = document.querySelectorAll('img');
    const divs = document.querySelectorAll('div');
    
    images.forEach(image => {
        image.addEventListener('contextmenu', disableContextMenu);
    });
    
    divs.forEach(div => {
        div.addEventListener('contextmenu', disableContextMenu);
    });
}

function Awake(){
    const pageName = document.body.getAttribute("pageName");
    
    if (pageName == 'about'){
        spans = document.querySelectorAll('.fade-text span');
        showNextSpan();
    }
    
    generateNavBar(pageName);
    generateScrollToTopButton();
    generateFixedBottomText(debugMode);
       
    startSlideShow();
    
    addDropdownEvents();
    addClickToEnlargeImageEvents();
    generateGrainOverlay();
    
    disableAllContextMenu();
    
    //thing only to do if on desktop
    if (window.innerWidth >= 820) {
    
        window.addEventListener('mousemove', function (e) {
            mouseWindowPosX = e.pageX;
            mouseWindowPosY = e.pageY - window.scrollY;
        });

        generateCustomCursor();
        animateSpotlight();
        addShuffleEventToLinks();
        addCardTiltEvents();
        requestAnimationFrame(updateCardRotations);
    }
    
}

