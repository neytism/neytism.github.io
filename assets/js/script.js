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

//mouse pos
let mouseWindowPosX = 0;
let mouseWindowPosY = 0;
let smoothMouseWindowPosX = mouseWindowPosX;
let smoothMouseWindowPosY = mouseWindowPosY;

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
let lastJsonID = 0;
const randomString = 'Da5Ef1q7Oe'; //https://www.random.org/strings/

function loadJson(type) {
    const typeMap = {
        artworks: { jsonUrl: "/assets/json/artworks.json"},
        games: { jsonUrl: "/assets/json/games.json"},
        websites: { jsonUrl: "/assets/json/websites.json"}
    };
    
    const changeChecker = localStorage.getItem('changeChecker');
    let isDataChanged = false;
    if (changeChecker) {
        if(changeChecker != randomString){
            isDataChanged = true;
            if (debugMode) console.log('updating data');
        } else{
            if (debugMode) console.log('no change found in data.');
        }
    } else{
        if (debugMode) console.log('no data found');
        localStorage.setItem('changeChecker', randomString)
        isDataChanged = true;
    }

    const { jsonUrl } = typeMap[type];
    
    const cachedData = localStorage.getItem(type);
    if (cachedData && !isDataChanged) {
        console.log(`using cached json ${type}...`);
        const portfolioList = JSON.parse(cachedData);
        return Promise.resolve(portfolioList);
    }
    
    return fetch(jsonUrl)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok ' + response.statusText);
            }
            return response.json();
        })
        .then(data => {

            console.log(`loading new data`);

            let lastJsonID = 0;
            let portfolio = [];
            data.forEach(item => {
                item.id = ++lastJsonID;
                portfolio.push(item);
            });

            if(type == "artworks"){
                portfolio = sortByCategory(portfolio);
            }
            
            localStorage.setItem(type, JSON.stringify(portfolio));
            return portfolio;
        })
        .catch(error => {
            console.error('Fetch error:', error);
        });
}

function sortByCategory(data) {
    return data.sort((a, b) => {
        if (a.category < b.category) return -1;
        if (a.category > b.category) return 1;
        return 0; 
    });
}



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
    if (slideshows === 0) return;
    slideshows.forEach(slideshow => {
        if(slideshow.childNodes.length > 0){
            const slides = slideshow.children;
            slideshow.setAttribute('totalSlides', slides.length);
            slideshow.setAttribute('currentSlide', '0');
            
            setInterval(()=> showNextSlide(slideshow), 5000);
            slides[0].classList.add('active');
        }    
    });
    
}

function showNextSlide(slideshow) {
    var currentSlide = parseInt(slideshow.getAttribute('currentSlide'));
    var totalSlides = parseInt(slideshow.getAttribute('totalSlides'));
    var slides = slideshow.children;
    
    slides[currentSlide].classList.remove('active');
    currentSlide = (currentSlide + 1) % totalSlides;
    slideshow.setAttribute('currentSlide', `${currentSlide}`);
    slides[currentSlide].classList.add('active');
    
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

function addShuffleEventToLinks() {
    const links = document.querySelectorAll('.shuffle');
    if (links === 0) return;
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

function addClickToEnlargeImageEvents() {
    clickableImages = document.querySelectorAll('.enlargeable');
    if (clickableImages === 0) return;
    clickableImages.forEach(img => {
        img.addEventListener("click", event => {
            currentSelectedID = img.closest('[contentID]').getAttribute('contentID');
            currentSelectedContentType = img.closest('[contentType]').getAttribute('contentType');
            currentSelectedIndex = img.getAttribute('index');
            selectedImageContainer.classList.remove('hide');
            selectedImageContainer.firstElementChild.firstElementChild.src = img.getAttribute('src');
            document.body.classList.add('noscroll');
            
            const groupCount = img.closest('[totalImages]').getAttribute('totalImages');
            const arrows = selectedImageContainer.querySelectorAll('.arrow-container');
            if(parseInt(groupCount) > 1){
                arrows.forEach(arrow => {
                    arrow.classList.remove('hide');
                })
            } else{
                arrows.forEach(arrow => {
                    arrow.classList.add('hide');
                })
            }
        });
    });
}

function navigateSelectedImage(event, direction) {
    event.stopPropagation();
    let content = null;
    if (currentSelectedContentType == "artwork") {
        content = JSON.parse(localStorage.getItem('artworks')).find(a => a.id == currentSelectedID);
    } else if (currentSelectedContentType == "game") {
        content = JSON.parse(localStorage.getItem('games')).find(a => a.id == currentSelectedID);
    } else if (currentSelectedContentType == "website") {
        content = JSON.parse(localStorage.getItem('websites')).find(a => a.id == currentSelectedID);
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

function closeSelectedImageContainer(event){
    event.stopPropagation();
    selectedImageContainer.classList.add('hide');
    document.body.classList.remove('noscroll');
}


function addCardTiltEvents(){
    tempCardsTilt = document.querySelectorAll('.card-tilt');
    if (tempCardsTilt === 0) return;
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

function updateCardRotations() {
    if (CardsTilt === 0) return;
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
    
    createNavBarPrimaryButton(navBar, 'index', 'HOME', 'home', pageName);
    
    const portfolioNavButton = createNavBarPrimaryButton(navBar, '', 'PORTFOLIO', '', pageName, 'portfolio-dropdown');
    createNavBarDropdownButtons(portfolioNavButton, 'game-gallery', 'Games', 'games', 'game', pageName);
    createNavBarDropdownButtons(portfolioNavButton, 'art-category', 'Artworks', 'art-category', 'art', pageName);
    createNavBarDropdownButtons(portfolioNavButton, 'web-gallery', 'Websites', 'webs', 'web', pageName);

    createNavBarPrimaryButton(navBar, 'about', 'ABOUT', 'about', pageName);
    createNavBarPrimaryButton(navBar, 'contact', 'CONTACT', 'contact', pageName);

}

function createNavBarPrimaryButton(parentElement, pageFileName, buttonTextContent, pageIdentifierName, currentPageIdentifierName, dropDownID) {
    const primaryNavLink = document.createElement('a');
    primaryNavLink.classList.add('navbar-link');
    primaryNavLink.classList.add('hoverable');
    primaryNavLink.classList.add('shuffle');
    primaryNavLink.textContent = buttonTextContent;
    if (currentPageIdentifierName == pageIdentifierName) {
        primaryNavLink.classList.add('active');
    } else {
        if(pageFileName != ""){
            primaryNavLink.addEventListener('click', () => { goToPage(pageFileName); });
        }  
    }
    setParent(parentElement, primaryNavLink);

    if(dropDownID || dropDownID != ""){
        primaryNavLink.classList.add('dropdown-parent');
        primaryNavLink.setAttribute('dropDownContentID', dropDownID);
        
        const dropDownContentContainer = document.createElement('div');
        dropDownContentContainer.classList.add('dropdown-content');
        dropDownContentContainer.setAttribute('id', dropDownID);
        setParent(parentElement, dropDownContentContainer);
        return dropDownContentContainer;
    } else{
        return primaryNavLink;
    }
}

function createNavBarDropdownButtons(parentElement, pageFileName, buttonTextContent, primaryPageIdentifierName, secondaryPageIdentifierName, currentPageIdentifierName){
    const dropdownNavLink = document.createElement('a');
    dropdownNavLink.classList.add('shuffle');
    dropdownNavLink.textContent = buttonTextContent;
    if(currentPageIdentifierName == primaryPageIdentifierName){
        dropdownNavLink.classList.add('active');
    } else if(currentPageIdentifierName == secondaryPageIdentifierName){
        dropdownNavLink.classList.add('active');
        dropdownNavLink.addEventListener('click', () =>{ goToPage(pageFileName);});
    }else{
        dropdownNavLink.addEventListener('click', () =>{ goToPage(pageFileName);});
    }
    setParent(parentElement, dropdownNavLink);
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
    
    // bigCursor.style.opacity = 0;
    // smallCursor.style.opacity = 0;

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
    const scanEffect = document.createElement('div');
    scanEffect.className = 'scan-overlay';
    document.body.insertBefore(scanEffect, document.body.firstChild);

    const grainEffect = document.createElement('div');
    grainEffect.className = 'grain-overlay';
    document.body.insertBefore(grainEffect, document.body.firstChild);
}

function getQueryParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}

function populateFeaturedWorks(games, artworks, websites){
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
        section.setAttribute("totalImages", game.media.length);
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
        mainImageContainer.classList.add('hoverable');
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
        gameTitle.classList.add('shuffle');
        gameTitle.textContent = game.title.toUpperCase();
        gameTitle.style.textDecoration = 'underline';

        gameTitle.addEventListener('click', (e)=> {
            loadItem('games', game.id);
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
        if(!art.remarks.includes("featured")){
            return;
        }

        createGridIcon(featuredArtParent, "artwork", art);
    });

    var featuredWebParent = document.getElementById("featured-websites");
    
    websites.forEach(web => {
        if(!web.remarks.includes("featured")){
            return;
        }

        createGridIcon(featuredWebParent, "website", web);
    });
}

function populateGamePortfolio(data){
    
    const portfolioDiv = document.getElementById("games");
    
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
        //when at least 20% of the video is visible
        threshold: 0.2
    });
    
    data.forEach(game => {
        const gameDiv = createGridIcon(portfolioDiv, "game", game);
        videoObserver.observe(gameDiv);
    });
}

function populateGameInfo(data){
    const gameId = getQueryParam('id');
    const game = data.find(a => a.id == gameId);
    document.title = game.title;
    const portfolioDiv = document.getElementById("games");
    if(game.remarks.includes("hide")) return;
    
    const section = createSection(portfolioDiv, game.id,  "game", `${game.filePath}/${game.backgroundImage}`, true);
    section.setAttribute('totalImages', game.media.length);
    createItemInfoSection('game', section, game, data.length);
}

function populateArtCategory(data) {
    const portfolioDiv = document.querySelector(".art-section");
    portfolioDiv.setAttribute('contentType','artwork');
    let currentCat = "";
    
    data.forEach(artwork => {
        if(currentCat != artwork.category){
            const artContainer = document.createElement('div');
            artContainer.className = 'grid-item-container banner';
            artContainer.addEventListener('click', (e) => {
                loadArtCategory(artwork.category);
            });
            setParent(portfolioDiv, artContainer);
    
            const imgHoverZoom = document.createElement('div');
            imgHoverZoom.className = 'grid-content banner hoverable';
            setParent(artContainer, imgHoverZoom);
            
            const img = document.createElement('img');
            img.classList.add("hover-zoom");
            if(hasFileExtension(artwork.media[0])){
                img.src = `${artwork.filePath}/${artwork.media[0]}`;
            }else{
                img.src = `https://img.youtube.com/vi/${artwork.media[0]}/maxresdefault.jpg`
            }
            setParent(imgHoverZoom, img);
            
            const title = document.createElement('div');
            title.classList.add('shuffle');
            title.textContent = artwork.category;
            setParent(imgHoverZoom, title);
        }
        currentCat = artwork.category;
    });
    
}

function populateArtPortfolio(data) {
    const categoryIdentifier = getQueryParam('category');
    
    const portfolioDiv = document.querySelector(".art-section");
    portfolioDiv.setAttribute('contentType','artwork');
    let currentCat = "";
    
    data.forEach(artwork => {
        if(categoryIdentifier && categoryIdentifier != artwork.category.toLowerCase().replace(/\s+/g, '')) return;
        
        if(currentCat != artwork.category){
            const categoryTitle = document.createElement('div');
            categoryTitle.className = 'grid-item-container title';
            categoryTitle.textContent = artwork.category;
            setParent(portfolioDiv, categoryTitle);
        }
        currentCat = artwork.category;
        
        createGridIcon(portfolioDiv, "artwork", artwork);
    });
}

function populateArtInfoTest(data){
    const artworkId = getQueryParam('id');
    const artwork = data.find(a => a.id == artworkId);
    
    document.title = artwork.title;
    
    const portfolioDiv = document.getElementById("artworks");
    
    if(artwork.remarks.includes("hide")) return;
    
    const section = createSection(portfolioDiv, artwork.id,  "artwork", ``, false);
    section.setAttribute('totalImages', artwork.media.length);
    section.classList.add('screen-height');
    createItemInfoSection('artwork', section, artwork, data.length);
}

function populateWebPortfolio(data){
    const portfolioDiv = document.getElementById("websites");
    const categoryTitle = document.createElement('div');
    categoryTitle.className = 'grid-item-container title';
    setParent(portfolioDiv, categoryTitle);
    data.forEach(web => {
        createGridIcon(portfolioDiv, "website", web);
    });

}

function populateWebInfo(data){
    const webID = getQueryParam('id');
    const web = data.find(a => a.id == webID);
    document.title = web.title;
    const portfolioDiv = document.getElementById("websites");
    if(web.remarks.includes("hide")) return;
    const section = createSection(portfolioDiv, web.id, "website");
    section.setAttribute('totalImages', web.media.length);
    createItemInfoSection('website', section, web, data.length);
}

function createGridIcon(parentElement, type, item){

    if (item.remarks.includes("hide")) return;
    const gridItemDiv = document.createElement('div');
    gridItemDiv.classList.add('grid-item-container');
    if(type == "game") gridItemDiv.classList.add('game');
    if(type == "website") gridItemDiv.classList.add('web');
    if(type == "artwork"){
        gridItemDiv.classList.add('art');
        gridItemDiv.setAttribute('contentID', item.id);
    }
    setParent(parentElement, gridItemDiv)
    
    const imageContainer = document.createElement('div'); 
    imageContainer.classList.add('grid-content');
    imageContainer.classList.add('hoverable');
    if(type == "game") imageContainer.classList.add('game');
    if(item.media.length !== 0 || !hasFileExtension(item.media[0])){
        imageContainer.addEventListener('click', (e) => {
            if(type == "game") loadItem('games', item.id);
            if(type == "website")  loadItem('websites', item.id);
            if(type == "artwork")  loadItem('artworks', item.id);
        });
    } 

    setParent(gridItemDiv, imageContainer)
    
    if(type == "game") {
        const videoHolder = document.createElement('video'); 
        videoHolder.muted = true;
        videoHolder.autoplay = true;
        videoHolder.loop = true;
        videoHolder.className = 'game-preview video-preview';
        setParent(imageContainer, videoHolder);

        imageContainer.addEventListener('mouseover', (e) => {videoHolder.pause();});
        imageContainer.addEventListener('mouseout', (e) => {videoHolder.play();});
    
        const video = document.createElement('source'); 
        video.src = `${item.filePath}/preview.mp4`;
        video.setAttribute('type', 'video/mp4');
        setParent(videoHolder, video);
    }
    
    const image = document.createElement('img'); 
    if(type == "game") image.classList.add('game-preview');
    if(type == "website") image.classList.add('web-preview');
    if(type == "game") image.classList.add('image-preview');
    if(type != "game") image.classList.add('hover-zoom');
    image.addEventListener('error', (e) => {replaceNullImage(image)});

    if(hasFileExtension(item.media[0])){
        image.src = `${item.filePath}/${item.media[0]}`;
    }else{
        image.src = `https://img.youtube.com/vi/${item.media[0]}/maxresdefault.jpg`
    }

    setParent(imageContainer, image);
    
    if(type == "game" ) {
        const clickIndicator = document.createElement('div'); 
        clickIndicator.classList.add('game-preview');
        clickIndicator.classList.add('click-indicator');
        setParent(imageContainer, clickIndicator);
        
        const arrowSymbol = document.createElement('div'); 
        arrowSymbol.innerHTML = '&#x2197; ';
        setParent(clickIndicator, arrowSymbol);
        
        const seeMore = document.createElement('div'); 
        seeMore.innerHTML = `MORE INFO`;
        setParent(clickIndicator, seeMore);
    }
    
    const title = document.createElement('h1'); 
    title.className = 'hoverable';
    title.className = 'shuffle';
    if (item.remarks.includes("quoted")) {
        title.innerHTML = `<u>"${item.title.toUpperCase()}"`;
    } else{
        title.innerHTML = `<u>${item.title.toUpperCase()}`;
    }
    title.addEventListener('click', (e) => {
        if(type == "game") loadItem('games', item.id);
        if(type == "website")  loadItem('websites', web.id);
        if(type == "artwork")  loadItem('artworks', item.id);
    });

    setParent(gridItemDiv, title)
    
    const tagsList = document.createElement('div');
    tagsList.classList.add('word-list');
    tagsList.classList.add('game');
    setParent(gridItemDiv, tagsList);
    
    item.tools.forEach(tool => {
        const toolText = document.createElement('p');
        toolText.className = 'shuffle';
        toolText.textContent = tool;
        setParent(tagsList, toolText)
    });
    
    if(type == "game" || type == "website" ){
        if(item.remarks.includes("solo")){
            const projectType = document.createElement('p');
            projectType.className = 'shuffle';
            projectType.textContent = "Solo Project";
            setParent(tagsList, projectType)
        } else{
            item.roles.forEach(role => {
                const roleText = document.createElement('p');
                roleText.className = 'shuffle';
                roleText.textContent = role;
                setParent(tagsList, roleText)
            });
        }
    }

    return gridItemDiv;
}

function createSection(parentElement, contentId,  contentType, backgroundImage, isItemInfo){
    const section = document.createElement('div');
    section.classList.add('section');
    section.setAttribute("id", "projects");
    section.setAttribute("contentID", contentId);
    section.setAttribute("contentType", contentType);
    setParent(parentElement, section);
        
    const background = document.createElement('div');
    background.classList.add('background');
    if(isItemInfo) background.classList.add('game-info');
    if(backgroundImage) background.style.backgroundImage = `url('${backgroundImage}')`
    setParent(section, background);

    return section;
}

function createItemInfoSection(type, parentElement, item, maxId, monoPage){
    
    const sectionContent = document.createElement('div');
    sectionContent.classList.add('section-content');
    setParent(parentElement, sectionContent);
    
    const galleryContainer = document.createElement('div');
    galleryContainer.classList.add('game-card-container');
    if(monoPage && item.id % 2 == 0){
        galleryContainer.classList.add('reverse');
    }
    if(!monoPage) galleryContainer.classList.add('game-info');
    if(monoPage) galleryContainer.classList.add('card-tilt');
    setParent(sectionContent, galleryContainer);
    
    const galleryLeft = document.createElement('div');
    galleryLeft.classList.add('game-images-container');
    if(!monoPage) galleryLeft.classList.add('game-info');
    if(!monoPage) galleryLeft.classList.add('card-tilt');
    setParent(galleryContainer, galleryLeft);
    
    if(!monoPage && type == "artwork"){
        const bigTitle = document.createElement('div');
        bigTitle.className = 'game-images-container title';
        if(!monoPage) bigTitle.classList.add('game-info');
        const t = item.title.toUpperCase();
        if (item.remarks.includes("quoted")) {
            bigTitle.textContent = `"${t}"`;
        } else{
            bigTitle.textContent = t;
        }
        setParent(galleryContainer, bigTitle);
        galleryContainer.classList.add("artworks");
    }

    const mainImageContainer = document.createElement('div');
    mainImageContainer.classList.add('main-image-container');
    setParent(galleryLeft, mainImageContainer);
    
    if(type == "game" || type == "website"){
        const mainImage = document.createElement('img');
        mainImage.addEventListener('error', (e) => {replaceNullImage(mainImage)});
        mainImage.classList.add('main-image');
        if(item.remarks.includes("mobile")){mainImage.classList.add('mobile');};
        mainImage.classList.add('hoverable');
        mainImage.classList.add('enlargeable');
        mainImage.setAttribute("id", "mainImage");
        mainImage.setAttribute("index", "0");
        mainImage.src = `${item.filePath}/${item.media[0]}`;
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
        
        if(hasFileExtension(item.media[0])){
            mainImage.src = `${item.filePath}/${item.media[0]}`;
            youtubeContainer.classList.add('hide');
            mainImage.classList.remove('hide');
        } else{
            youtubeVideo.src = `https://www.youtube.com/embed/${item.media[0]}`;
            
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
        
        for (i = 0; i < item.media.length; i++) {
            const thumbnail = document.createElement('img');
            thumbnail.addEventListener('error', (e) => {replaceNullImage(thumbnail)});
            thumbnail.classList.add('thumbnail');
            thumbnail.classList.add('hoverable');
            if ( i == 0) { thumbnail.classList.add('active'); };
            if (item.isMobile == true) {thumbnail.classList.add('mobile');};
            if(hasFileExtension(item.media[i])){
                thumbnail.src = `${item.filePath}/${item.media[i]}`;
            }else{
                thumbnail.src = `https://img.youtube.com/vi/${item.media[i]}/maxresdefault.jpg`
                thumbnail.setAttribute("youtube",'');
            }
            thumbnail.setAttribute("index", i);
            thumbnail.addEventListener('click', (e) => {changeImageGameGallery(thumbnail)});
            setParent(thumbnailsContainer, thumbnail);
        }
    }
    
    
    const galleryRight = document.createElement('div');
    galleryRight.classList.add('game-details-container');
    if(!monoPage) galleryRight.classList.add('game-info');
    setParent(galleryContainer, galleryRight);
    
    const mainDetails = document.createElement('div');
    mainDetails.className = 'game-details-main';
    if(!monoPage) mainDetails.classList.add('game-info');
    setParent(galleryRight, mainDetails);
    
    if(type != "artwork"){
        const projectTitle = document.createElement('h2');
        projectTitle.classList.add('details-title');
        projectTitle.textContent = item.title.toUpperCase();
        setParent(mainDetails, projectTitle);

        const gameDescription = document.createElement('p');
        gameDescription.classList.add('details-description');
        gameDescription.innerHTML = `${item.description}<br><br>`;
        setParent(mainDetails, gameDescription);
    }
    
    item.additional.forEach(additionalInfo =>{
        const infoBullets = document.createElement('p');
        infoBullets.classList.add('details-description');
        infoBullets.innerHTML = `<b>•&nbsp;&nbsp;${additionalInfo}`;
        setParent(mainDetails, infoBullets);
    });
    
    if(monoPage) return; 

    const primaryDetails = document.createElement('div');
    primaryDetails.className = 'game-details-primary game-info';
    setParent(galleryRight, primaryDetails);
    
    if(item.year){
        const year = document.createElement('p');
        year.classList.add('details-description');
        year.innerHTML = `<b>YEAR</b><br>${item.year}<br><br>`;
        setParent(primaryDetails, year);
    }

    if(item.tools && item.tools.length > 0){
        const tools = document.createElement('p');
        tools.classList.add('details-description');
        var toolsStr = "";

        for (i = 0; i < item.tools.length; i++) {
            toolsStr = toolsStr + item.tools[i];
            if (i < item.tools.length - 1) {
                toolsStr = toolsStr + ', ';
            }
        }
        
        if(item.tools.length > 1) tools.innerHTML = `<b>TOOLS</b><br>${toolsStr}<br><br>`;
        if(item.tools.length == 1) tools.innerHTML = `<b>TOOL</b><br>${toolsStr}<br><br>`;
        setParent(primaryDetails, tools);
    }
    
    if(item.roles && item.roles.length > 0){
        const roles = document.createElement('p');
        roles.classList.add('details-description');
        var rolesStr = "";
        
        for (i = 0; i < item.roles.length; i++) {
            rolesStr = rolesStr + item.roles[i];
            if (i < item.roles.length - 1) {
                rolesStr = rolesStr + ', ';
            }
        }
        
        if(item.roles.length > 1) roles.innerHTML = `<b>ROLES</b><br>${rolesStr}<br><br>`;
        if(item.roles.length == 1) roles.innerHTML = `<b>ROLE</b><br>${rolesStr}<br><br>`;
        setParent(primaryDetails, roles);
    }
    
    if(item.platforms){
        const platforms = document.createElement('p');
        platforms.classList.add('details-description');
        var platformsStr = "";
        
        for (i = 0; i < item.platforms.length; i++) {
            platformsStr = platformsStr + item.platforms[i];
            if (i < item.platforms.length - 1) {
                platformsStr = platformsStr + ', ';
            }
        }
        
        platforms.innerHTML = `<b>PLATFORM</b><br>${platformsStr}<br><br>`;
        setParent(primaryDetails, platforms);
    }

    if (type == "artwork") {
        const gridGalleryDiv = document.createElement('div');
        gridGalleryDiv.classList.add('game-details-container');
        gridGalleryDiv.classList.add('game-info');
        gridGalleryDiv.style.flexDirection = 'row';
        gridGalleryDiv.style.flexWrap = 'wrap';
        gridGalleryDiv.style.paddingBottom = '75px';
        setParent(galleryContainer, gridGalleryDiv);

        item.media.forEach(img => {
            const artworkDiv = document.createElement('div');
            if (item.media.length > 1) {
                artworkDiv.className = 'grid-item-container artworks';
            } else{
                artworkDiv.className = 'grid-item-container singleArtwork';
            }
            
            setParent(gridGalleryDiv, artworkDiv);
            
            const imageContainer = document.createElement('div');
            imageContainer.classList.add("grid-content");
            imageContainer.classList.add("artworks");
            imageContainer.classList.add("hoverable");
            setParent(artworkDiv, imageContainer);


            if (hasFileExtension(img)) {
                const image = document.createElement('img');
                image.addEventListener('error', (e) => { replaceNullImage(image) });
                image.className = 'enlargeable';
                image.src = `${item.filePath}/${img}`;
                image.setAttribute('index', item.media.indexOf(img));
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
                youtubeVideo.setAttribute('index', item.media.indexOf(img));
                setParent(youtubeContainer, youtubeVideo);
            }

        });
    }

    if(item.videoLink && item.videoLink != ""){

        const youtubeLinkDiv = document.createElement('div');
        youtubeLinkDiv.classList.add('game-details-container');
        youtubeLinkDiv.classList.add('game-info');
        youtubeLinkDiv.style.flexDirection = 'column';
        setParent(galleryContainer, youtubeLinkDiv);
        
        const youtubeTitle = document.createElement('p');
        youtubeTitle.classList.add('details-description');
        youtubeTitle.innerHTML = `<b>${"GAMEPLAY VIDEO"}`;
        setParent(youtubeLinkDiv, youtubeTitle);

        const youtubeContainerInfo = document.createElement('div');
        youtubeContainerInfo.className = 'youtube-embed';
        setParent(youtubeLinkDiv, youtubeContainerInfo);

        const youtubeVideoInfo = document.createElement('iframe');
        youtubeVideoInfo.src = `https://www.youtube.com/embed/${item.videoLink}`;
        youtubeVideoInfo.setAttribute('width','1080');
        youtubeVideoInfo.setAttribute('height','1920');
        youtubeVideoInfo.setAttribute('frameborder','0');
        youtubeVideoInfo.setAttribute('allowfullscreen','');
        setParent(youtubeContainerInfo, youtubeVideoInfo);

    }

    if(item.additionalMedia){
        const additionalMedia = item.additionalMedia;
    
        Object.entries(additionalMedia).forEach(([title, mediaUrls]) => {
            const additionalMediaTitleDiv = document.createElement('div');
            additionalMediaTitleDiv.classList.add('game-details-container');
            additionalMediaTitleDiv.classList.add('game-info');
            additionalMediaTitleDiv.style.flexDirection = 'column';
            setParent(galleryContainer, additionalMediaTitleDiv);
            
            const collaboratorsTitle = document.createElement('p');
            collaboratorsTitle.classList.add('details-description');
            collaboratorsTitle.innerHTML = `<b><br><br>${title}`;
            setParent(additionalMediaTitleDiv, collaboratorsTitle);
            
            const gridGalleryDiv = document.createElement('div');
            gridGalleryDiv.classList.add('game-details-container');
            gridGalleryDiv.classList.add('game-info');
            gridGalleryDiv.style.flexDirection = 'row';
            gridGalleryDiv.style.flexWrap = 'wrap';
            gridGalleryDiv.setAttribute('totalImages', 1);
            setParent(galleryContainer, gridGalleryDiv);

            mediaUrls.forEach(img => {
            
                const artworkDiv = document.createElement('div');
                if(mediaUrls.length > 1){
                    artworkDiv.className = 'grid-item-container additional-media';
                } 
                
                setParent(gridGalleryDiv, artworkDiv);
                
                const imageContainer = document.createElement('div');
                imageContainer.classList.add("grid-content");
                imageContainer.classList.add("artworks");
                setParent(artworkDiv, imageContainer);
        
                if (hasFileExtension(img)) {
                    const image = document.createElement('img');
                    image.addEventListener('error', (e) => { replaceNullImage(image) });
                    image.src = `${item.filePath}/${img}`;
                    image.classList.add('enlargeable');
                    image.classList.add('hoverable');
                    image.setAttribute('index', item.media.indexOf(img));
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
                    youtubeVideo.setAttribute('index', item.media.indexOf(img));
                    setParent(youtubeContainer, youtubeVideo);
                }
            });
        });
    }
    
    if(item.collaborators && !item.remarks.includes("solo")){
        const collaborators = item.collaborators;

        const collaboratorsDiv = document.createElement('div');
        collaboratorsDiv.classList.add('game-details-container');
        collaboratorsDiv.classList.add('game-info');
        collaboratorsDiv.style.flexDirection = 'column';
        setParent(galleryContainer, collaboratorsDiv);
        
        const collaboratorsTitle = document.createElement('p');
        collaboratorsTitle.classList.add('details-description');
        if (Object.keys(collaborators).length > 1) collaboratorsTitle.innerHTML = `<b><br><br>${"COLLABORATORS"}`;
        if (Object.keys(collaborators).length == 1) collaboratorsTitle.innerHTML = `<b><br><br>${"COLLABORATOR"}`;
        setParent(collaboratorsDiv, collaboratorsTitle);
    
        const collaboratorList = document.createElement('div');
        collaboratorList.className = 'word-list';
        collaboratorList.style.justifyContent = 'left';
        setParent(collaboratorsDiv, collaboratorList);
        
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
    createPageItemNavigator(type, galleryContainer, item.id, maxId);
}

function createPageItemNavigator(type, parentElement, currentItemId, maxId){
    
    const pageNavDiv = document.createElement('div');
    pageNavDiv.classList.add('game-details-container');
    pageNavDiv.classList.add('game-info');
    pageNavDiv.style.flex = 'column';
    setParent(parentElement, pageNavDiv);

    const pageNavButtonHolder = document.createElement('div');
    pageNavButtonHolder.style.flex = '1';
    pageNavButtonHolder.style.position = 'relative';
    pageNavButtonHolder.style.minHeight = '40px';
    setParent(pageNavDiv, pageNavButtonHolder);

    const moreButton = document.createElement('div');
    moreButton.innerText = '[ BACK TO GALLERY ]'
    moreButton.classList.add('hoverable');
    moreButton.classList.add('page-nav-button');
    moreButton.classList.add('more');
    moreButton.classList.add('floating-button');
    moreButton.classList.add('shuffle');
    setParent(pageNavButtonHolder, moreButton);
    
    moreButton.addEventListener('click', (e) => {
        var pageFileName = "";
        if(type == 'game') pageFileName = 'game-gallery';
        if(type == 'artwork') pageFileName = 'art-category';
        if(type == 'website') pageFileName = 'web-gallery';
        goToPage(pageFileName);
    });

    var itemCategory = "";
    if(type == 'game') itemCategory = 'games';
    if(type == 'artwork') itemCategory = 'artworks';
    if(type == 'website') itemCategory = 'websites';
    
    if(currentItemId != 1){
        const prevGameButton = document.createElement('div');
        prevGameButton.innerText = '[ PREV ]'
        prevGameButton.classList.add('hoverable');
        prevGameButton.classList.add('page-nav-button');
        prevGameButton.classList.add('prev');
        prevGameButton.classList.add('floating-button');
        prevGameButton.classList.add('shuffle');
        setParent(pageNavButtonHolder, prevGameButton);
        
        prevGameButton.addEventListener('click', (e) => {
            loadItem(itemCategory, currentItemId - 1);
        });
    }
    
    if(currentItemId != maxId){
        const nextGameButton = document.createElement('div');
        nextGameButton.innerText = '[ NEXT ]'
        nextGameButton.classList.add('hoverable');
        nextGameButton.classList.add('page-nav-button');
        nextGameButton.classList.add('next');
        nextGameButton.classList.add('floating-button');
        nextGameButton.classList.add('shuffle');
        setParent(pageNavButtonHolder, nextGameButton);
        
        nextGameButton.addEventListener('click', (e) => {
            loadItem(itemCategory, currentItemId + 1);
        });
    }
}

function loadItem(category, id) {
    loadJson(category).then((data) => {
        const item = data?.find(a => a.id === id);
    
        if (item) {
            goToPage(category.slice(0, -1), 'id', id); //remove 's'
        }
    });
    
}

function loadArtCategory(category) {
    goToPage('art-gallery', 'category', category.toLowerCase().replace(/\s+/g, ''));
}

function goToPage(pageName, key, value){
    let url = pageName;
    localStorage.setItem('x', mouseWindowPosX);
    localStorage.setItem('y', mouseWindowPosY);
    if(debugMode && url != 'index') url = `${url}.html` 
    if(url == 'index') url = `/`; //remove 'index' in url
    if(key){url = `${url}?${key}=${value}`;}

    var fadeEffect = document.querySelector('.fade-overlay');
    fadeEffect.classList.remove('fadeOut');
    fadeEffect.classList.add('fadeIn');

    setTimeout(() => {
 
        window.location.href = url;
 
    }, 400);
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

function disableContextMenu(event) {
    event.preventDefault();
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

function updateMousePositionFromLocalStorage() {
    if (window.innerWidth < 820) return;
    const storedX = parseFloat(localStorage.getItem('x'));
    const storedY = parseFloat(localStorage.getItem('y'));
    
    if (!isNaN(storedX) && !isNaN(storedY)) {
        smoothMouseWindowPosX = storedX;
        smoothMouseWindowPosY = storedY;
        
        const rect = spotlight.getBoundingClientRect();
        const xPos = ((smoothMouseWindowPosX - rect.left) / rect.width) * 100;
        const yPos = ((smoothMouseWindowPosY - rect.top) / rect.height) * 100;

        const roundedXPos = Math.round(xPos * 100) / 100;
        const roundedYPos = Math.round(yPos * 100) / 100;

        document.documentElement.style.setProperty('--xPos', `${roundedXPos}%`);
        document.documentElement.style.setProperty('--yPos', `${roundedYPos}%`);
        
        mouseWindowPosX = storedX;
        mouseWindowPosY = storedY;
            
        TweenMax.to(bigCursor, 0, {
            x: mouseWindowPosX - 15,
            y: mouseWindowPosY - 15
        })
        
        TweenMax.to(smallCursor, 0, {
            x: mouseWindowPosX - 5,
            y: mouseWindowPosY - 5
        })
    } 
}

function fadeOutOverlay(){
    const checker = localStorage.getItem('newPage');

    if (!isNaN(checker) && checker) {
        const fadeOverlay = document.querySelector('.fade-overlay');
        fadeOverlay.classList.add('fadeOut');
        localStorage.setItem('newPage', false);
    }
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
    fadeOutOverlay();
    disableAllContextMenu();
    
    //thing only to do if on desktop
    if (window.innerWidth >= 820) {
    
        window.addEventListener('mousemove', function (e) {
            mouseWindowPosX = e.pageX;
            mouseWindowPosY = e.pageY - window.scrollY;
        });
        
        generateCustomCursor();
        animateSpotlight();
        window.addEventListener("beforeunload", () => {
            localStorage.setItem('x', mouseWindowPosX);
            localStorage.setItem('y', mouseWindowPosY);
            localStorage.setItem('newPage', true);
        });
        updateMousePositionFromLocalStorage();
        addShuffleEventToLinks();
        addCardTiltEvents();
        requestAnimationFrame(updateCardRotations);
    }
    
}