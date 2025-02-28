var canvas = document.getElementById("canvas");
var ctx = canvas.getContext("2d");

var grd,
    keys_down = [],
    letters = [];

var symbols = [
    { k: 81, s: "q" }, { k: 87, s: "w" }, { k: 69, s: "e" },
    { k: 82, s: "r" }, { k: 84, s: "t" }, { k: 89, s: "y" },
    { k: 85, s: "u" }, { k: 73, s: "i" }, { k: 79, s: "o" },
    { k: 80, s: "p" }, { k: 65, s: "a" }, { k: 83, s: "s" },
    { k: 68, s: "d" }, { k: 70, s: "f" }, { k: 71, s: "g" },
    { k: 72, s: "h" }, { k: 74, s: "j" }, { k: 75, s: "k" },
    { k: 76, s: "l" }, { k: 90, s: "z" }, { k: 88, s: "x" },
    { k: 67, s: "c" }, { k: 86, s: "v" }, { k: 66, s: "b" },
    { k: 78, s: "n" }, { k: 77, s: "m" }, { k: 48, s: "0" },
    { k: 49, s: "1" }, { k: 50, s: "2" }, { k: 51, s: "3" },
    { k: 52, s: "4" }, { k: 53, s: "5" }, { k: 54, s: "6" },
    { k: 55, s: "7" }, { k: 56, s: "8" }, { k: 57, s: "9" }
];

function Letter(key) {
    // Generate a random starting x position within canvas width
    this.x = Math.floor(Math.random() * canvas.width);
    
    this.symbol = findS(key);
    this.color = "rgba(255, 255, 255," + Math.random() + ")";
    this.size = Math.floor((Math.random() * 40) + 12);
    this.path = getRandomPath(this.x);
    this.rotate = Math.floor((Math.random() * Math.PI) + 1);
    this.percent = 0;
}

Letter.prototype.draw = function() {
    var percent = this.percent / 100;
    var xy = getQuadraticBezierXYatPercent(this.path[0], this.path[1], this.path[2], percent);
    
    ctx.save();
    ctx.translate(xy.x, xy.y);
    ctx.rotate(this.rotate);
    ctx.font = this.size + "px Arial";
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

function findS(key) {
    for (var i = 0; i < symbols.length; i++) {
        if (symbols[i].k == key) {
            return symbols[i].s;
        }
    }
    return false;
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
	var x = Math.pow(1 - percent,2) * startPt.x 
          + 2 * (1 - percent) * percent * controlPt.x 
          + Math.pow(percent ,2) * endPt.x; 
    
	var y = Math.pow(1 - percent ,2) * startPt.y 
          + 2 * (1 - percent) * percent * controlPt.y 
          + Math.pow(percent ,2) * endPt.y; 
    
	return( {x:x,y:y} );
}

function resize() {
	var box = canvas.getBoundingClientRect();
	canvas.width = box.width;
	canvas.height = box.height;
	grd = ctx.createRadialGradient(canvas.width / 2,
                                   canvas.height / 2,
                                   0,
                                   canvas.width / 2,
                                   canvas.height / 2,
                                   canvas.height);
}

function draw() {
	ctx.clearRect(0 ,0 ,canvas.width ,canvas.height);
	drawBackground();

	for (var i = letters.length -1; i >=0 ; i--) {
		letters[i].percent +=1 ;
		letters[i].draw();
		if(letters[i].percent >100){
			letters.splice(i ,1 );
		}
	}
	for (var i=0 ;i<keys_down.length;i++){
		if(keys_down[i]){
			letters.push(new Letter(i));
		}
	}
	requestAnimationFrame(draw);
}
var start_keys =[81 ,87 ,69 ,82 ,84 ,89 ,85];

function startAnimation(){
	setTimeout(function(){
		var key=start_keys.pop();
		keys_down[key]=true;
		setTimeout(function(){
			keys_down[key]=false;
		},180 );
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

inputs.forEach(input => {
    input.onkeyup = function (event) {
        keys_down[event.keyCode] = false;
    };

    input.onkeydown = function (event) {
        if (event.keyCode >= 65 && event.keyCode <= 90 || event.keyCode >= 48 && event.keyCode <= 57) {
            keys_down[event.keyCode] = true;
        }
    };
});

window.requestAnimationFrame=(function(){
	return window.requestAnimationFrame||
           window.webkitRequestAnimationFrame||
           window.mozRequestAnimationFrame||
           function(callback){
               window.setTimeout(callback ,1000/60 );
           };
})();
