const spotlight = document.querySelector('.spotlight-mask');

let mouseX = 0;
let mouseY = 0;

// Smoothing factor
const smoothFollow = 0.1; // Adjust this value between 0 (no smoothing) and 1 (full smoothing)

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
