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
const randomString = 'Da5Ef1q7Oje'; //https://www.random.org/strings/

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
        if (debugMode) console.log(`using cached json ${type}...`);
        const portfolioList = JSON.parse(cachedData);
        return Promise.resolve(portfolioList);
    }
    
    return fetch(jsonUrl)
        .then(response => {
            if (!response.ok) throw new Error('Network response was not ok ' + response.statusText);
            return response.json();
        })
        .then(data => {
            if (debugMode) console.log(`loading new data`);

            let lastJsonID = 0;
            let portfolio = [];
            data.forEach(item => {
                if (!item.remarks.includes("hide")) {
                    item.id = ++lastJsonID;
                    portfolio.push(item);
                  }
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
    
    for (let i = 0; i < children.length; i++) { children[i].classList.remove('active'); }

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
    
    // scroll thumbnail into view
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

function onMouseMove() {
    if (!cursorVisible) {
        bigCursor.style.opacity = 1;
        smallCursor.style.opacity = 1;
        cursorVisible = true; 
    }
    
    TweenMax.to(bigCursor, .4, {
        x: mouseWindowPosX - 15, y: mouseWindowPosY - 15
    })
    
    TweenMax.to(smallCursor, .1, {
        x: mouseWindowPosX - 5, y: mouseWindowPosY - 5
    })
}

function onMouseHover() {
  TweenMax.to(bigCursor, .3, { scale: 3})
}

function onMouseHoverOut() {
  TweenMax.to(bigCursor, .3, { scale: 1 })
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
    
    const navBar = createNewElement('div', 'first', document.body, 'navbar', "", "");
    
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
    const primaryNavLink =  createNewElement('a', "", parentElement, "navbar-link hoverable shuffle", "", buttonTextContent);
    
    if (currentPageIdentifierName == pageIdentifierName) {
        primaryNavLink.classList.add('active');
    } else {
        if(pageFileName != ""){
            primaryNavLink.addEventListener('click', () => { goToPage(pageFileName); });
        }  
    }

    if(dropDownID || dropDownID != ""){
        primaryNavLink.classList.add('dropdown-parent');
        primaryNavLink.setAttribute('dropDownContentID', dropDownID);
        return createNewElement('div', "", parentElement, "dropdown-content", {id: dropDownID}, "");
    } else{
        return primaryNavLink;
    }
}

function createNavBarDropdownButtons(parentElement, pageFileName, buttonTextContent, primaryPageIdentifierName, secondaryPageIdentifierName, currentPageIdentifierName){
    const dropdownNavLink = createNewElement('a', "", parentElement, "shuffle", "", buttonTextContent);
    if(currentPageIdentifierName == primaryPageIdentifierName){
        dropdownNavLink.classList.add('active');
    } else if(currentPageIdentifierName == secondaryPageIdentifierName){
        dropdownNavLink.classList.add('active');
        dropdownNavLink.addEventListener('click', () =>{ goToPage(pageFileName);});
    }else{
        dropdownNavLink.addEventListener('click', () =>{ goToPage(pageFileName);});
    }
}

function generateScrollToTopButton(){
    var scrollToTopButton = createNewElement('div', "first", document.body, "hoverable scroll-to-top floating-button shuffle", "", '[ TOP ]');
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
    createNewElement('div', "first", document.body, "credits bot-r", "", creditText);
    
    if(isDebug){
        const fpsCounterDiv = createNewElement('div', "first", document.body, "credits bot-l", "", "");
        
        const fps = createNewElement('div', "", fpsCounterDiv, "", {id: "fps"}, "");
        
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
    const cursorContainer = createNewElement('div', "first", document.body, 'cursor',"", "");
    const bigCursorContainer = createNewElement('div', "", cursorContainer, 'cursor-ball cursor-ball-big-container',"", "");
    createNewElement('div', "", bigCursorContainer, 'cursor-ball-big',"", "");
    const smallCursorContainer = createNewElement('div', "", cursorContainer, 'cursor-ball cursor-ball-small-container',"", "");
    createNewElement('div', "", smallCursorContainer, 'cursor-ball-small',"", "");

    bigCursor = bigCursorContainer;
    smallCursor = smallCursorContainer;

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
    createNewElement('div', "first", document.body, 'scan-overlay',"", "");
    createNewElement('div', "first", document.body, 'grain-overlay',"", "");
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
        
        const section = createNewElement('div', "after", lastGameDiv, 'section',{id: 'projects', contentID: game.id, contentType: "game", totalImages: game.media.length}, "");
        section.style.minHeight = 'fit-content';
        lastGameDiv = section;
        
        const sectionContent = createNewElement('div', "", section, 'section-content half-screen',"", "");
     
        const gameGalleryContainer = createNewElement('div', "", sectionContent, 'game-card-container card-tilt featured',"", "");
        if(x % 2 == 0) gameGalleryContainer.classList.add('reverse');
        
        const galleryLeft = createNewElement('div', "", gameGalleryContainer, 'game-images-container',"", "");
        const mainImageContainer = createNewElement('div', "", galleryLeft, 'main-image-container hoverable',"", "");
        
        const mainImage = createNewElement('img', "", mainImageContainer, 'main-image enlargeable',{id:'mainImage', index: '0',src: `${game.filePath}/${game.media[0]}`}, "");
        mainImage.addEventListener('error', (e) => {replaceNullImage(mainImage)});
        if(game.remarks.includes("mobile")){mainImage.classList.add('mobile');};
        
        const youtubeContainer = createNewElement('div', "", mainImageContainer, 'youtube-embed hide',{id:'mainYoutube'}, "");
        const youtubeVideo = createNewElement('iframe', "", youtubeContainer, 'youtube-embed hide',{src:'https://www.youtube.com/embed/tgbNymZ7vqY', width: '1080', height: '1920', frameborder: '0', allowfullscreen: '', index: '0'}, "");
        
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
        
        const prevButton = createNewElement('button', "", mainImageContainer, 'gallery-nav-button prev-button',"", `←`);
        prevButton.addEventListener('click', (e) => {navigateImage(prevButton, 'prev')});
        
        const nextButton = createNewElement('button', "", mainImageContainer, 'gallery-nav-button next-button',"", `→`);
        nextButton.addEventListener('click', (e) => {navigateImage(nextButton, 'next')});
        
        const thumbnailsContainer = createNewElement('div', "", galleryLeft, 'thumbnails','', '');
        thumbnailsContainer.addEventListener('wheel', function (event) {
            event.preventDefault();
            thumbnailsContainer.scrollLeft += event.deltaY;
        });
        
        for (i = 0; i < game.media.length; i++) {
            const thumbnail = createNewElement('img', "", thumbnailsContainer, 'thumbnail hoverable', {index: i}, '');
            thumbnail.addEventListener('error', (e) => {replaceNullImage(thumbnail)});
            if ( i == 0) { thumbnail.classList.add('active'); };
            if (game.isMobile == true) {thumbnail.classList.add('mobile');};
            if(hasFileExtension(game.media[i])){
                thumbnail.src = `${game.filePath}/${game.media[i]}`;
            }else{
                thumbnail.src = `https://img.youtube.com/vi/${game.media[i]}/maxresdefault.jpg`
                thumbnail.setAttribute("youtube",'');
            }
            thumbnail.addEventListener('click', (e) => {changeImageGameGallery(thumbnail)});
        }
        
        const galleryRight = createNewElement('div', "", gameGalleryContainer, 'game-details-container','', '');
        const gameTitle = createNewElement('h2', "", galleryRight, 'details-title hoverable shuffle','', game.title.toUpperCase());
        gameTitle.style.textDecoration = 'underline';
        gameTitle.addEventListener('click', () => loadItem('games', game.id));
        createNewElement('p', "", galleryRight, 'details-description','', `${game.description}<br><br>`);
        
        game.additional.forEach(additionalInfo =>{
            createNewElement('p', "", galleryRight, 'details-description','', `<b>•&nbsp;&nbsp;${additionalInfo}`);
        });
        
        createNewElement('div', "", section, 'background','', '');        
        x++;
    });

    var featuredArtParent = document.getElementById("featured-artworks");
    
    artworks.forEach(art => {
        if(!art.remarks.includes("featured")) return;
        createGridIcon(featuredArtParent, "artwork", art);
    });

    var featuredWebParent = document.getElementById("featured-websites");
    
    websites.forEach(web => {
        if(!web.remarks.includes("featured")) return;
        createGridIcon(featuredWebParent, "website", web);
    });
}

function populateGamePortfolio(data){
    
    const portfolioDiv = document.getElementById("games");
    
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
            const artContainer = createNewElement('div', "", portfolioDiv, 'grid-item-container banner','','');
            artContainer.addEventListener('click', (e) => {
                loadArtCategory(artwork.category);
            });

            const imgHoverZoom = createNewElement('div', "", artContainer, 'grid-content banner hoverable','','');
            
            const img = createNewElement('img', "", imgHoverZoom, 'hover-zoom','','');
            if(hasFileExtension(artwork.media[0])){
                img.src = `${artwork.filePath}/${artwork.media[0]}`;
            }else{
                img.src = `https://img.youtube.com/vi/${artwork.media[0]}/maxresdefault.jpg`
            }

            createNewElement('div', "", imgHoverZoom, 'shuffle','',artwork.category);
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
            createNewElement('div', "", portfolioDiv, 'grid-item-container title','', artwork.category);
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
    const gridItemDiv = createNewElement('div', "", parentElement, 'grid-item-container','', '');
    if(type == "game") gridItemDiv.classList.add('game');
    if(type == "website") gridItemDiv.classList.add('web');
    if(type == "artwork"){
        gridItemDiv.classList.add('art');
        gridItemDiv.setAttribute('contentID', item.id);
    }
    
    const imageContainer = createNewElement('div', "", gridItemDiv, 'grid-content hoverable','', '');
    if(type == "game") imageContainer.classList.add('game');
    if(item.media.length !== 0 || !hasFileExtension(item.media[0])){
        imageContainer.addEventListener('click', (e) => {
            if(type == "game") loadItem('games', item.id);
            if(type == "website")  loadItem('websites', item.id);
            if(type == "artwork")  loadItem('artworks', item.id);
        });
    } 
    
    if(type == "game") {
        const videoHolder = createNewElement('video', "", imageContainer, 'game-preview video-preview','', '');
        videoHolder.muted = true;
        videoHolder.autoplay = true;
        videoHolder.loop = true;

        imageContainer.addEventListener('mouseover', (e) => {videoHolder.pause();});
        imageContainer.addEventListener('mouseout', (e) => {videoHolder.play();});
    
        createNewElement('source', "", videoHolder, 'game-preview video-preview',{src:`${item.filePath}/preview.mp4`, type:'video/mp4'}, '');
    }
    
    
    const image = createNewElement('img', "", imageContainer, '','', '');
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
    
    
    if(type == "game" ) {
        const clickIndicator = createNewElement('div', "", imageContainer, 'game-preview click-indicator','', '');
        createNewElement('div', "", clickIndicator, '','', '&#x2197; ');
        createNewElement('div', "", clickIndicator, '','', 'MORE INFO');
    }
    
    const title = createNewElement('h1', "", gridItemDiv, 'hoverable shuffle','', 'MORE INFO');
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

    const tagsList = createNewElement('div', "", gridItemDiv, 'word-list game','', '');
    
    item.tools.forEach(tool => {
        createNewElement('p', "", tagsList, 'shuffle','', tool);
    });
    
    if(item.remarks.includes("solo")){
        createNewElement('p', "", tagsList, 'shuffle','', 'Solo Project');
    } else{
        item.roles.forEach(role => {
            createNewElement('p', "", tagsList, 'shuffle','', role);
        });
    }

    return gridItemDiv;
}

function createSection(parentElement, contentId,  contentType, backgroundImage, isItemInfo){
    const section = createNewElement('div', "", parentElement, 'section',{id:'projects',contentID: contentId, contentType: contentType}, '');
    const background = createNewElement('div', "", section, 'background','', '');
    if(isItemInfo) background.classList.add('game-info');
    if(backgroundImage) background.style.backgroundImage = `url('${backgroundImage}')`;
    return section;
}

function createItemInfoSection(type, parentElement, item, maxId, monoPage){
    const sectionContent = createNewElement('div', "", parentElement, 'section-content','', '');

    const galleryContainer = createNewElement('div', "", sectionContent, 'game-card-container','', '');
    if(monoPage && item.id % 2 == 0){
        galleryContainer.classList.add('reverse');
    }
    if(!monoPage) galleryContainer.classList.add('game-info');
    if(monoPage) galleryContainer.classList.add('card-tilt');
    
    const galleryLeft = createNewElement('div', "", galleryContainer, 'game-images-container','', '');
    if(!monoPage) galleryLeft.classList.add('game-info');
    if(!monoPage) galleryLeft.classList.add('card-tilt');
    
    if(!monoPage && type == "artwork"){
        const bigTitle = createNewElement('div', "", galleryContainer, 'game-images-container title artworks','', '');
        if(!monoPage) bigTitle.classList.add('game-info');
        const t = item.title.toUpperCase();
        bigTitle.textContent = item.remarks.includes("quoted") ? `"${t}"` : t;
    }
    
    const mainImageContainer = createNewElement('div', "", galleryLeft, 'main-image-container','', '');
    
    if(type == "game" || type == "website"){
        const mainImage = createNewElement('img', "", mainImageContainer, 'main-image hoverable enlargeable',{id: 'mainImage', index: '0', src: `${item.filePath}/${item.media[0]}`}, '');
        mainImage.addEventListener('error', (e) => {replaceNullImage(mainImage)});
        if(item.remarks.includes("mobile")){mainImage.classList.add('mobile');};
    
        const youtubeContainer = createNewElement('div', "", mainImageContainer, 'youtube-embed hide',{id: 'mainYoutube'}, '');
        
        const youtubeVideo = createNewElement('iframe', "", youtubeContainer, 'youtube-embed hide',{src:'https://www.youtube.com/embed/tgbNymZ7vqY', width: '1080', height: '1920', frameborder: '0', allowfullscreen: '', index: '0'}, "");
        
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
            
        const prevButton = createNewElement('button', "", mainImageContainer, 'gallery-nav-button prev-button', '', `←`);
        prevButton.addEventListener('click', (e) => {navigateImage(prevButton, 'prev')});
        
        const nextButton = createNewElement('button', "", mainImageContainer, 'gallery-nav-button next-button', '', `→`);
        nextButton.addEventListener('click', (e) => {navigateImage(nextButton, 'next')});
    
        const thumbnailsContainer = createNewElement('div', "", galleryLeft, 'thumbnails', '', '');
        thumbnailsContainer.addEventListener('wheel', function (event) {
            event.preventDefault();
            thumbnailsContainer.scrollLeft += event.deltaY;
        });
        
        for (i = 0; i < item.media.length; i++) {
            const thumbnail = createNewElement('img', "", thumbnailsContainer, 'thumbnail hoverable', {index: i}, '');
            thumbnail.addEventListener('error', (e) => {replaceNullImage(thumbnail)});
            if ( i == 0) { thumbnail.classList.add('active'); };
            if (item.isMobile == true) {thumbnail.classList.add('mobile');};
            if(hasFileExtension(item.media[i])){
                thumbnail.src = `${item.filePath}/${item.media[i]}`;
            }else{
                thumbnail.src = `https://img.youtube.com/vi/${item.media[i]}/maxresdefault.jpg`
                thumbnail.setAttribute("youtube",'');
            }
            thumbnail.addEventListener('click', (e) => {changeImageGameGallery(thumbnail)});
        }
    }
    
    const galleryRight = createNewElement('div', "", galleryContainer, 'game-details-container', '', '');
    if(!monoPage) galleryRight.classList.add('game-info');

    const mainDetails = createNewElement('div', "", galleryRight, 'game-details-main', '', '');
    if(!monoPage) mainDetails.classList.add('game-info');
    
    if(type != "artwork"){
        createNewElement('h2', "", mainDetails, 'details-title', '', item.title.toUpperCase());
        createNewElement('p', "", mainDetails, 'details-description', '', `${item.description}<br><br>`);
    }
    
    item.additional.forEach(additionalInfo =>{
        createNewElement('p', "", mainDetails, 'details-description', '', `<b>•&nbsp;&nbsp;${additionalInfo}`);
    });
    
    if(monoPage) return; 
    
    const primaryDetails = createNewElement('div', "", galleryRight, 'game-details-primary game-info', '', '');
    
    if(item.year){
        createNewElement('p', "", primaryDetails, 'details-description', '', `<b>YEAR</b><br>${item.year}<br><br>`);
    }

    if(item.tools && item.tools.length > 0){
        const tools = createNewElement('p', "", primaryDetails, 'details-description', '','');
        var toolsStr = "";

        for (i = 0; i < item.tools.length; i++) {
            toolsStr = toolsStr + item.tools[i];
            if (i < item.tools.length - 1) {
                toolsStr = toolsStr + ', ';
            }
        }
        
        if(item.tools.length > 1) tools.innerHTML = `<b>TOOLS</b><br>${toolsStr}<br><br>`;
        if(item.tools.length == 1) tools.innerHTML = `<b>TOOL</b><br>${toolsStr}<br><br>`;
    }
    
    if(item.roles && item.roles.length > 0){
        const roles = createNewElement('p', "", primaryDetails, 'details-description', '','');
        var rolesStr = "";
        
        for (i = 0; i < item.roles.length; i++) {
            rolesStr = rolesStr + item.roles[i];
            if (i < item.roles.length - 1) {
                rolesStr = rolesStr + ', ';
            }
        }
        
        if(item.roles.length > 1) roles.innerHTML = `<b>ROLES</b><br>${rolesStr}<br><br>`;
        if(item.roles.length == 1) roles.innerHTML = `<b>ROLE</b><br>${rolesStr}<br><br>`;
    }
    
    if(item.platforms){
        const platforms = createNewElement('p', "", primaryDetails, 'details-description', '','');
        var platformsStr = "";
        
        for (i = 0; i < item.platforms.length; i++) {
            platformsStr = platformsStr + item.platforms[i];
            if (i < item.platforms.length - 1) {
                platformsStr = platformsStr + ', ';
            }
        }
        
        platforms.innerHTML = `<b>PLATFORM</b><br>${platformsStr}<br><br>`;
    }

    if (type == "artwork") {
        const gridGalleryDiv = createNewElement('div', "", galleryContainer, 'game-details-container game-info', '','');
        gridGalleryDiv.style.flexDirection = 'row';
        gridGalleryDiv.style.flexWrap = 'wrap';
        gridGalleryDiv.style.paddingBottom = '75px';

        item.media.forEach(img => {
            const artworkDiv = createNewElement('div', "", gridGalleryDiv, '', '', '');
            if (item.media.length > 1) {
                artworkDiv.className = 'grid-item-container artworks';
            } else {
                artworkDiv.className = 'grid-item-container singleArtwork';
            }

            const imageContainer = createNewElement('div', "", artworkDiv, 'grid-content artworks hoverable', '', '');

            if (hasFileExtension(img)) {
                const image = createNewElement('img', "", imageContainer, 'enlargeable', { src: `${item.filePath}/${img}`, index: item.media.indexOf(img) }, '');
                image.addEventListener('error', (e) => { replaceNullImage(image) });
            } else {
                const youtubeContainer = createNewElement('div', "", imageContainer, 'youtube-embed', '', '');
                createNewElement('iframe', "", youtubeContainer, '', { src: `https://www.youtube.com/embed/${img}`, width: '1080', height: '1920', frameborder: '0', allowfullscreen: '', index: item.media.indexOf(img) }, "");
            }

        });
    }

    if(item.videoLink && item.videoLink != ""){
        const youtubeLinkDiv = createNewElement('div', "", galleryContainer, 'game-details-container game-info', '', '');
        youtubeLinkDiv.style.flexDirection = 'column';
        createNewElement('p', "", youtubeLinkDiv, 'details-description', '', `<b>${"GAMEPLAY VIDEO"}`);
        const youtubeContainerInfo = createNewElement('div', "", youtubeLinkDiv, 'youtube-embed', '', '');
        createNewElement('iframe', "", youtubeContainerInfo, '', { src: `https://www.youtube.com/embed/${item.videoLink}`, width: '1080', height: '1920', frameborder: '0', allowfullscreen: ''}, "");
    }

    if(item.additionalMedia){
        const additionalMedia = item.additionalMedia;
    
        Object.entries(additionalMedia).forEach(([title, mediaUrls]) => {
            const additionalMediaTitleDiv = createNewElement('div', "", galleryContainer, 'game-details-container game-info', '', '');
            additionalMediaTitleDiv.style.flexDirection = 'column';
            
            createNewElement('p', "", additionalMediaTitleDiv, 'details-description', '', `<b><br><br>${title}`);
            
            const gridGalleryDiv = createNewElement('div', "", galleryContainer, 'game-details-container game-info', {totalImages: '1'}, '');
            gridGalleryDiv.style.flexDirection = 'row';
            gridGalleryDiv.style.flexWrap = 'wrap';

            mediaUrls.forEach(img => {
                const artworkDiv = createNewElement('div', "", gridGalleryDiv, '', '', '');
                if(mediaUrls.length > 1){
                    artworkDiv.className = 'grid-item-container additional-media';
                } 
                
                const imageContainer = createNewElement('div', "", artworkDiv, 'grid-content artworks hoverable', '', '');

                if (hasFileExtension(img)) {
                    const image = createNewElement('img', "", imageContainer, 'enlargeable', { src: `${item.filePath}/${img}`, index: item.media.indexOf(img) }, '');
                    image.addEventListener('error', (e) => { replaceNullImage(image) });
                } else {
                    const youtubeContainer = createNewElement('div', "", imageContainer, 'youtube-embed', '', '');
                    createNewElement('iframe', "", youtubeContainer, '', { src: `https://www.youtube.com/embed/${img}`, width: '1080', height: '1920', frameborder: '0', allowfullscreen: '', index: item.media.indexOf(img) }, "");
                }
            });
        });
    }
    
    if(item.collaborators && !item.remarks.includes("solo")){
        const collaborators = item.collaborators;
        
        const collaboratorsDiv = createNewElement('div', "", galleryContainer, 'game-details-container game-info', '', '');
        collaboratorsDiv.style.flexDirection = 'column';
        
        const collaboratorsTitle = createNewElement('p', "", collaboratorsDiv, 'details-description', '', '');
        if (Object.keys(collaborators).length > 1) collaboratorsTitle.innerHTML = `<b><br><br>${"COLLABORATORS"}`;
        if (Object.keys(collaborators).length == 1) collaboratorsTitle.innerHTML = `<b><br><br>${"COLLABORATOR"}`;
    
        const collaboratorList = createNewElement('div', "", collaboratorsDiv, 'word-list', '', '');
        collaboratorList.style.justifyContent = 'left';
        
        Object.entries(collaborators).forEach(([name, url]) => {
            const collaboratorText = createNewElement('p', "", collaboratorList, 'shuffle', '', '');
            if(url != ""){
                collaboratorText.classList.add('hoverable');
                collaboratorText.innerHTML = `<u>${name}</u>`;
                collaboratorText.addEventListener('click', (e) =>{
                    window.open(url, '_blank');
                });
            }else{
                collaboratorText.textContent = name;
            }
        });
    }
    createPageItemNavigator(type, galleryContainer, item.id, maxId);
}

function createPageItemNavigator(type, parentElement, currentItemId, maxId){
    
    const pageNavDiv = createNewElement('div', "", parentElement, 'game-details-container game-info', '', '');
    pageNavDiv.style.flex = 'column';
    
    const pageNavButtonHolder = createNewElement('div', "", pageNavDiv, '', '', '');
    pageNavButtonHolder.style.flex = '1';
    pageNavButtonHolder.style.position = 'relative';
    pageNavButtonHolder.style.minHeight = '40px';
    
    const moreButton = createNewElement('div', "", pageNavButtonHolder, 'hoverable page-nav-button more floating-button shuffle', '', '[ BACK TO GALLERY ]');
    
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
        const prevGameButton = createNewElement('div', "", pageNavButtonHolder, 'hoverable page-nav-button prev floating-button shuffle', '', '[ PREV ]');     
        prevGameButton.addEventListener('click', (e) => {
            loadItem(itemCategory, currentItemId - 1);
        });
    }
    
    if(currentItemId != maxId){
        const nextGameButton = createNewElement('div', "", pageNavButtonHolder, 'hoverable page-nav-button next floating-button shuffle', '', '[ NEXT ]');
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

function createNewElement(tag, parentMethod, parentElement, classNames, attributes, textContent){
    const element = document.createElement(tag);
    
    if(classNames != ""){
        element.className = classNames
    }
    
    if(attributes && attributes != ""){
        for(const [key, value] of Object.entries(attributes)){
            element.setAttribute(key, value);
        }
    }

    if(textContent != "") element.innerHTML = textContent;
    
    if(parentMethod == ""){
        setParent(parentElement, element);
    } else if(parentMethod == "first"){
        document.body.insertBefore(element,parentElement.firstChild);
    }else if(parentMethod == "after"){
        parentElement.insertAdjacentElement('afterend', element);
    }
    
    return element;
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
        window.addEventListener("beforeunload", () => {
            localStorage.setItem('x', mouseWindowPosX);
            localStorage.setItem('y', mouseWindowPosY);
        });
        updateMousePositionFromLocalStorage();
        addShuffleEventToLinks();
        addCardTiltEvents();
        requestAnimationFrame(updateCardRotations);
    }
    
}
