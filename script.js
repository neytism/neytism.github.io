const spotlight = document.querySelector('.spotlight-mask');

let mouseX = 0;
let mouseY = 0;

// Smoothing factor
const smoothFollow = 0.1; 

// Variables to hold smoothed positions
let smoothedX = mouseX;
let smoothedY = mouseY;

// Function to update spotlight positions
function updateSpotlights() {
    // Smoothly interpolate the spotlight positions
    smoothedX += (mouseX - smoothedX) * smoothFollow;
    smoothedY += (mouseY - smoothedY) * smoothFollow;

    const rect = spotlight.getBoundingClientRect();
    const xPos = ((smoothedX - rect.left) / rect.width) * 100;
    const yPos = ((smoothedY - rect.top) / rect.height) * 100;
    document.documentElement.style.setProperty('--xPos', `${xPos}%`);
    document.documentElement.style.setProperty('--yPos', `${yPos}%`);

}

function animate() {
    updateSpotlights();
    requestAnimationFrame(animate);
}

// dont do if mobile
if (window.innerWidth >= 768) {
    
    window.addEventListener('mousemove', function (e) {
        mouseX = e.pageX;
        mouseY = e.pageY - window.scrollY;
    });
    
    animate()
}

const slides = document.querySelectorAll('.slide');
let currentSlide = 0;

function showNextSlide() {
    slides[currentSlide].classList.remove('active');
    currentSlide = (currentSlide + 1) % slides.length;
    slides[currentSlide].classList.add('active');
}

setInterval(showNextSlide, 7500);

slides[currentSlide].classList.add('active');

let currentTabId = "tab-1";

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
    

const thumbnailContainers = document.querySelectorAll('.thumbnails');

// Loop through each thumbnail container
thumbnailContainers.forEach(thumbnails => {
    // Add mouse wheel event listener
    thumbnails.addEventListener('wheel', function(event) {
        // Prevent default vertical scroll
        event.preventDefault();
        
        // Scroll horizontally based on the vertical scroll delta
        thumbnails.scrollLeft += event.deltaY; // Use deltaY for vertical scroll input
    });
});
