var callingCard = document.getElementById('callingCard');
var front = document.getElementById('front');
var mousePosition = { x: 0, y: 0 };
var cardSize = { width: 0, height: 0 };
var SCALE_X = 10;
var SCALE_Y = 10;
var isFlipped = false;
var cursorInDocument = true;

function updateCardRotation() {
    var rect = callingCard.getBoundingClientRect();
    
    cardSize = {
        width: callingCard.offsetWidth || 0,
        height: callingCard.offsetHeight || 0,
    };
    
    if (mousePosition.x === 0 && mousePosition.y === 0) {
        mousePosition.x = rect.width / 2;
        mousePosition.y = rect.height / 2;
    }
    
    if(cursorInDocument){
        var rotationX = (mousePosition.y / cardSize.height) * -(SCALE_Y * 2) + SCALE_Y;
        var rotationY = ((mousePosition.x / cardSize.width) * (SCALE_X * 2) - SCALE_X);
        
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

requestAnimationFrame(updateCardRotation);
