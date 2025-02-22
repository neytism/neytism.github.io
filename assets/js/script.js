class GameGallery {
    constructor(gallery, isInsideParent){
        this.gallery = gallery;
        this.isInsideParent = isInsideParent;
    }
}

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
const hoverables = document.querySelectorAll('.hoverable, a, button');
let cursorVisible = false;

//game image sliders
var tempGameGalleries = document.querySelectorAll('.game-gallery-container');
const thumbnailContainers = document.querySelectorAll('.thumbnails');
var gameGalleries = [];
var cardSize = { width: 0, height: 0 };
var SCALE_X = 1.5;
var SCALE_Y = SCALE_X * 1.25;
var isInsideParent = false;
let mouseGalleryPosX = 0;
let mouseGalleryPosY = 0;


Awake();

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


function changeImage(element) {
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
    mainImage.setAttribute("currentindex", index);

    // Scroll thumbnail into view
    scrollThumbnailIntoView(element);
}

function navigateImage(element, direction) {
    const mainImage = element.parentElement.firstElementChild;
    const currentIndex = parseInt(mainImage.getAttribute('currentindex'));
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
    changeImage(targetThumbnail);
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

// Function to reset transformations for all galleries
function resetGalleryTransformations(gallery) {
    gallery.gallery.style.transform = 'perspective(600px) rotateX(0deg) rotateY(0deg) translateZ(0px)';
}



function Awake(){
    bigBall.style.opacity = 0;
    smallBall.style.opacity = 0;

    
    if(slides.length > 0){
        setInterval(showNextSlide, 5000);
        
        slides[currentSlide].classList.add('active');
    }
    
    thumbnailContainers.forEach(thumbnails => {
        thumbnails.addEventListener('wheel', function (event) {
            event.preventDefault();
            thumbnails.scrollLeft += event.deltaY;
        });
    });
    

    addHoverEventToLinks();
        
    tempGameGalleries.forEach(gallery => {
        let newGallery = new GameGallery(gallery,false);
        gameGalleries.push(newGallery);
    });
    
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
        
        gameGalleries.forEach(gallery => {
            var parentContainer = gallery.gallery.parentElement.parentElement; 
            
            parentContainer.addEventListener('mousemove', function (e) {
                var rect = parentContainer.getBoundingClientRect();
                mouseGalleryPosX = e.clientX - rect.left;
                mouseGalleryPosY = e.clientY - rect.top;
            });
            
            parentContainer.addEventListener('mouseenter', () => {
                gallery.isInsideParent = true; 
            });
            
            parentContainer.addEventListener('mouseleave', () => {
                gallery.isInsideParent = false; 
                resetGalleryTransformations(gallery); 
            });
        });
        
    }
    
}
