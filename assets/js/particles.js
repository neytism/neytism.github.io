

/* --- System Parameters (Recommended)--- */
let total           = 60;
let initialForce    = 0.1;
let friction        = 0.92;
let springForce     = 1;
let k               = 0.1;
let mouseThreshold  = 150;
let mouseRepelForce = 0.05;
let forceToCenter   = 0.05;
let minDist         = 60;
let circleSize     = 50;


/* --- Main Program: DO NOT EDIT BELOW --- */
let minDistSQ = minDist * minDist;
let centerVec, mouseVec;
let count = 0;
let particles = [];

function init() {
  centerVec = new Vector(window.innerWidth / 2, window.innerHeight / 2);
  mouseVec = new Vector();
  window.addEventListener("mousemove", inputMove);
  window.addEventListener("touchmove", inputMove, { passive: false });
  update();
}

function inputMove(e) {
  if (e.type == "touchmove") e.preventDefault();
  
  var x, y;
  if (e.type.indexOf("mouse") >= 0) {
    x = e.clientX;
    y = e.clientY;
  } else {
    x = e.changedTouches[0].clientX;
    y = e.changedTouches[0].clientY;
  }
  
  mouseVec.x = x;
  mouseVec.y = y;
  
  centerVec.x = x;
  centerVec.y = y;
}

function create() {
  const colorStr = "radial-gradient(circle at 20px 20px, #fff, #808080)";
  
  const randomX = Math.random() * (window.innerWidth);
  const randomY = Math.random() * (window.innerHeight);

  const particle = new Particle(colorStr, randomX, randomY, friction);;
  
  particle.velocity.x = Math.random() * initialForce - initialForce * 0.5;
  particle.velocity.y = Math.random() * initialForce - initialForce * 0.5;
  
  particles.push(particle);
  count = particles.length;
}

function update() {
  requestAnimationFrame(update);
  if (count < total) create();

  for (let i = 0; i < count; i++) {
    particles[i].update();
    repelToMouse(particles[i]);
    attactToCenter(particles[i]);
  }

  for (let i = 0; i < count; i++) {
    const particleA = particles[i];

    for (let j = 0; j < count; j++) {
      const particleB = particles[j];
      repel2(particleA, particleB);
    }
  }
}

function repel(particleA, particleB) {
  const force = Vector.sub(particleB.position, particleA.position);
  const dist = force.mag();

  if (dist < minDist) {
    const x = dist - minDist;
    force.normalize();
    force.mult(-1 * k * x);

    particleA.velocity.sub(force);
    particleB.velocity.add(force);
  }
}


function repel2(particleA, particleB) {
    const force = Vector.sub(particleA.position, particleB.position);
    const dist = force.mag();
  
    if (dist > 0 && dist < minDist) {
      // Immediate position correction
      const overlap = minDist - dist;
      const correction = force.normalize().mult(overlap * 0.5);
      
      particleA.position.add(correction);
      particleB.position.sub(correction);
      
      // Regular velocity-based repulsion
      const strength = -10;
      const f = strength * (1 - dist/minDist) / dist;
      force.mult(f);
      
      particleA.velocity.sub(force);
      particleB.velocity.add(force);
    }
  }

function repelToMouse(particle) {
  const force = Vector.sub(mouseVec, particle.position);
  const dist = force.mag();
  if (dist < mouseThreshold) {
    const x = dist - mouseThreshold;
    //force.normalize()
    force.mult(-1 * k * x);
    force.mult(mouseRepelForce);
    particle.velocity.sub(force);
  }
}

function attactToCenter(particle) {
  const force = Vector.sub(centerVec, particle.position);
  const dist = force.mag();

  if (dist > minDist) {
    const x = dist - minDist;
    force.normalize();
    force.mult(-1 * k * x);
    force.mult(forceToCenter);

    particle.velocity.sub(force);
  }
}

class Vector {
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;

    return this;
  }

  add(v) {
    this.x += v.x;
    this.y += v.y;
    return this;
  }

  sub(v) {
    this.x -= v.x;
    this.y -= v.y;
    return this;
  }

  mult(n) {
    this.x *= n;
    this.y *= n;
    return this;
  }

  div(n) {
    this.x /= n;
    this.y /= n;
    return this;
  }

  magSQ() {
    return this.x * this.x + this.y * this.y;
  }

  mag() {
    return Math.sqrt(this.magSQ());
  }

  normalize() {
    let m = this.mag();
    if (m != 0) this.div(m);

    return this;
  }

  limit(n) {
    let m = this.mag();
    if (m > n) {
      this.normalize();
      this.mult(n);
    }

    return this;
  }

  static add(v1, v2) {
    return new Vector(v1.x, v1.y).add(v2);
  }

  static sub(v1, v2) {
    return new Vector(v1.x, v1.y).sub(v2);
  }

  static mult(v1, n) {
    return new Vector(v1.x, v1.y).mult(n);
  }

  static div(v1, n) {
    return new Vector(v1.x, v1.y).div(n);
  }
}

class Particle {
  constructor(color = "#000000", x = 0, y = 0, friction = 1) {
    this.position = new Vector(x, y);
    this.velocity = new Vector();
    this.acceleration = new Vector();
    this.friction = friction;
    this.k = 0.1;
    
    this.el = document.createElement("div");
    document.querySelector(".particles-holder").appendChild(this.el);
    this.el.className = "particle-circle";
    
    /* this.el.style.backgroundColor = color; */
    this.el.style.background = "#00000000";
    this.el.style.border = "1px solid #FFF";
    this.el.style.width = `${circleSize}px`
    this.el.style.height = `${circleSize}px`
    this.size = this.el.offsetWidth;
    this.sizeHalf = this.size / 2;
    
    this.update();
  }

  applyForce(forceVector) {
    this.acceleration.add(forceVector);
  }

  update() {
    this.velocity.add(this.acceleration);
    this.velocity.mult(this.friction);
    this.position.add(this.velocity);

    this.acceleration.mult(0);

    this.el.style.transform = `translate(${
      this.position.x - this.sizeHalf
    }px, ${this.position.y - this.sizeHalf}px)`;
  }
}

init();
