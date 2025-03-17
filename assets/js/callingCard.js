var callingCard = document.getElementById('callingCard');
var front = document.getElementById('front');
var mousePosition = { x: 0, y: 0 };
var cardSize = { width: 0, height: 0 };
var SCALE_X = 10;
var SCALE_Y = 10;
var isFlipped = false;
var cursorInDocument = true;

function updateCardRotation() {
    
    cardSize = {
        width: callingCard.offsetWidth || 0,
        height: callingCard.offsetHeight || 0,
    };
    
    
    if(cursorInDocument){

        const maxRotationX = 45;
        const maxRotationY = 45;

        var rotationX = (mousePosition.y / cardSize.height) * -(SCALE_Y * 2) + SCALE_Y;
        var rotationY = ((mousePosition.x / cardSize.width) * (SCALE_X * 2) - SCALE_X);

        rotationX = Math.max(-maxRotationX, Math.min(rotationX, maxRotationX));
        rotationY = Math.max(-maxRotationY, Math.min(rotationY, maxRotationY));
        
        if (isFlipped) {
            rotationY += 180;
        }
        
        callingCard.style.transform = `perspective(1000px) rotateX(${rotationX}deg) rotateY(${rotationY}deg) translateZ(10px)`;
    } else{
        
        if(isFlipped){
            callingCard.style.transform = 'perspective(1000px) rotateY(180deg)';
        } else{
            callingCard.style.transform = 'perspective(1000px) rotateY(0deg)';
        }
    }
    
    
    requestAnimationFrame(updateCardRotation);
    
}



document.onmousemove = function (e) {
    var rect = callingCard.getBoundingClientRect();
    mousePosition.x = e.clientX - rect.left;
    mousePosition.y = e.clientY - rect.top;
};


function flipCard() {
    isFlipped = !isFlipped;
    front.classList.toggle('back');
}

document.body.addEventListener('mouseleave', () => {
    cursorInDocument = false;
});

document.body.addEventListener('mouseenter', () => {
    cursorInDocument = true;
});

callingCard.addEventListener('mouseenter', () => {
    cursorInDocument = true;
});

requestAnimationFrame(updateCardRotation);
