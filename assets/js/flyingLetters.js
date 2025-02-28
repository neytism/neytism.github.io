var canvas = document.getElementById("canvas");
var ctx = canvas.getContext("2d");

var grd,
    keys_down = [],
    letters = [];

const letterPool = [];
const MAX_POOL_SIZE = 100;


function Letter(char) {
    this.x = Math.floor(Math.random() * canvas.width);
    this.symbol = char;
    this.color = "rgba(255, 255, 255," + Math.random() + ")";
    this.size = Math.floor((Math.random() * 40) + 12);
    this.path = getRandomPath(this.x);
    this.rotate = Math.floor((Math.random() * Math.PI) + 1);
    this.percent = 0;
    this.font = this.size + "px Arial";
}

Letter.prototype.draw = function() {
    var percent = this.percent / 100;
    var xy = getQuadraticBezierXYatPercent(this.path[0], this.path[1], this.path[2], percent);
    
    ctx.save();
    ctx.translate(xy.x, xy.y);
    ctx.rotate(this.rotate);
    ctx.font = this.font;
    ctx.fillStyle = this.color;
    ctx.fillText(this.symbol, -15, -15);
    ctx.restore();
};

Letter.prototype.drawPath = function() {
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(this.path[0].x, this.path[0].y);
    ctx.quadraticCurveTo(this.path[1].x, this.path[1].y, this.path[2].x, this.path[2].y);
    ctx.stroke();
}

Letter.prototype.reset = function(char) {
    this.x = Math.floor(Math.random() * canvas.width);
    this.symbol = char;
    this.color = "rgba(255, 255, 255," + Math.random() + ")";
    this.size = Math.floor((Math.random() * 40) + 12);
    this.font = this.size + "px Arial";
    this.path = getRandomPath(this.x);
    this.rotate = Math.floor((Math.random() * Math.PI) + 1);
    this.percent = 0;
};

function getLetterFromPool(char) {
    if (letterPool.length > 0) {
        const letter = letterPool.pop();
        letter.reset(char);
        return letter;
    }
    return new Letter(char);
}

function returnLetterToPool(letter) {
    if (letterPool.length < MAX_POOL_SIZE) {
        letterPool.push(letter);
    }
}


function getRandomPath(x) {
    var x_start = x;
    var x_end = x_start + Math.floor((Math.random() * 400) - 199);

    return [{
        x : x_start,
        y : canvas.height
    },{
        x : (x_start + x_end) / 2,
        y : Math.floor((Math.random() * canvas.height) - canvas.height)
    },{
        x : x_end,
        y : canvas.height 
    }];
}

function drawBackground() {
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function getQuadraticBezierXYatPercent(startPt, controlPt, endPt, percent) {
    var invPercent = 1 - percent;
    var invPercentSq = invPercent * invPercent;
    var percentSq = percent * percent;
    
    var x = invPercentSq * startPt.x + 
            2 * invPercent * percent * controlPt.x + 
            percentSq * endPt.x;
    
    var y = invPercentSq * startPt.y + 
            2 * invPercent * percent * controlPt.y + 
            percentSq * endPt.y;
    
    return {x: x, y: y};
}

function resize() {
	canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    
    grd = ctx.createRadialGradient(
        centerX, centerY, 0,
        centerX, centerY, canvas.height
    );
}

function draw() {
	ctx.clearRect(0 ,0 ,canvas.width ,canvas.height);
	drawBackground();
    
    for (var i = letters.length - 1; i >= 0; i--) {
        letters[i].percent += 1;
        
        if (letters[i].percent > 100) {
            returnLetterToPool(letters[i]);
            letters.splice(i, 1);
        } else {
            letters[i].draw();
        }
    }
	
	requestAnimationFrame(draw);
}

var start_keys =['A' ,'B' ,'C' ,'D','1','2','3','4'];

function startAnimation(){
	setTimeout(function(){
		var key= start_keys.pop();
        onType(key);
		if(start_keys.length>0){
			startAnimation();
		}
	},180 );
}

resize();
draw();
startAnimation();

window.onresize=resize;

const inputs = document.querySelectorAll('.text-input');
const iteration = 3; 
const rate = 15;

inputs.forEach(input => {
    let previousLength = input.value.length;
    input.addEventListener('input', function(evt) {
        const currentLength = this.value.length;
        if (currentLength > previousLength) {
            const lastChar = this.value.slice(-1);
            onType(lastChar); 
        }
        previousLength = currentLength;
    });
});

function onType(char){
    if (char) {
        let count = 0; 

        const intervalId = setInterval(() => {
            if (count < iteration) {
                letters.push(getLetterFromPool(char));
                count++;
            } else {
                clearInterval(intervalId); 
            }
        }, rate); 
    }
}

window.requestAnimationFrame=(function(){
	return window.requestAnimationFrame||
           window.webkitRequestAnimationFrame||
           window.mozRequestAnimationFrame||
           function(callback){
               window.setTimeout(callback ,1000/60 );
           };
})();
