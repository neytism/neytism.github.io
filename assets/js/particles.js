
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
  
  // Helper function
  function getRandom(min, max) {
      return Math.random() * (max - min) + min;
  }
  
  // Global variables
  let total = 60;
  let initialForce = 0.1;
  let friction = 0.92;
  let springForce = 1;
  let k = 0.1;
  let mouseThreshold = 150;
  let mouseRepelForce = 0.05;
  let forceToCenter = 0.05;
  let minDist = 60;
  let circleSize = 50;

  let lastMouseMoveTime = Date.now();
  let autoMovePosition = new Vector(window.innerWidth / 2, window.innerHeight / 2);
  let autoMoveVelocity = new Vector(getRandom(-2, 2), getRandom(-2, 2));
  let autiMoveMultiplier = 1.25;
  let mouseTimeOut = 0; 
  const AUTO_MOVE_SPEED = 5;
  
  const AUTO_MOVE_BOUNDARY_PADDING = 150;
  
  let minDistSQ = minDist * minDist;
  let centerVec, mouseVec;
  let count = 0;
  let particles = [];

  function init() {
    centerVec = new Vector(window.innerWidth / 2, window.innerHeight / 2);
    mouseVec = new Vector();
    window.addEventListener("mousemove", inputMove);
    window.addEventListener("touchmove", inputMove, { passive: true });
    if (window.innerWidth <= 768) {
    
        mouseThreshold /= 1.5;
        circleSize /= 1.5;
        minDist /= 1.5;
        autiMoveMultiplier = 1;
    }
    
    update();
  
  }
  
  
  class Particle {
    constructor(color = "#000000", x = 0, y = 0, friction = 1) {
      this.position = new Vector(x, y);
      this.velocity = new Vector();
      this.acceleration = new Vector();
      this.friction = friction;
      this.k = 0.1;
      this.randomMultiplier = getRandom(0.3, 1);
      
      this.el = document.createElement("div");
      document.querySelector(".particles-holder").appendChild(this.el);
      this.el.className = "particle-circle";
      
      this.el.style.background = "#00000000";
      this.el.style.border = "1px solid #FFF";
      this.el.style.width = `${circleSize}px`
      this.el.style.height = `${circleSize}px`
      this.el.style.zIndex = 2;
      this.size = this.el.offsetWidth;
      this.sizeHalf = this.size / 2;
      
      this.update();
    }
  
    update() {
      this.velocity.mult(this.friction);
      this.position.add(this.velocity);
  
      this.acceleration.mult(0);
  
      this.el.style.transform = `translate(${
        this.position.x - this.sizeHalf
      }px, ${this.position.y - this.sizeHalf}px)`;
    }
  }
  
 
  function inputMove(e) {
    if (e.type == "touchmove") e.preventDefault();

    mouseTimeOut = 30000;
    
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
    
    lastMouseMoveTime = Date.now();
    
    autoMovePosition.x = x;
    autoMovePosition.y = y;

    mouseVec.x = x;
  mouseVec.y = y;
  
  centerVec.x = x;
  centerVec.y = y;
  }
  
  function create() {
    const colorStr = "radial-gradient(circle at 20px 20px, #fff, #808080)";
    
    const randomX = Math.random() * (window.innerWidth);
    const randomY = Math.random() * (window.innerHeight);
  
    const particle = new Particle(colorStr, randomX, randomY, friction);
    
    particle.velocity.x = Math.random() * initialForce - initialForce * 0.5;
    particle.velocity.y = Math.random() * initialForce - initialForce * 0.5;
    
    particles.push(particle);
    count = particles.length;
  }
  
  function updateAutoMove() {
    autoMoveVelocity.x += getRandom(-0.1, 0.1);
    autoMoveVelocity.y += getRandom(-0.1, 0.1);
    
    autoMoveVelocity.limit(AUTO_MOVE_SPEED);
    autoMoveVelocity.mult(autiMoveMultiplier);
    
    autoMovePosition.add(autoMoveVelocity);
    
    if (autoMovePosition.x < AUTO_MOVE_BOUNDARY_PADDING) {
      autoMovePosition.x = AUTO_MOVE_BOUNDARY_PADDING;
      autoMoveVelocity.x *= -1;
    }
    if (autoMovePosition.x > window.innerWidth - AUTO_MOVE_BOUNDARY_PADDING) {
      autoMovePosition.x = window.innerWidth - AUTO_MOVE_BOUNDARY_PADDING;
      autoMoveVelocity.x *= -1;
    }
    if (autoMovePosition.y < AUTO_MOVE_BOUNDARY_PADDING) {
      autoMovePosition.y = AUTO_MOVE_BOUNDARY_PADDING;
      autoMoveVelocity.y *= -1;
    }
    if (autoMovePosition.y > window.innerHeight - AUTO_MOVE_BOUNDARY_PADDING) {
      autoMovePosition.y = window.innerHeight - AUTO_MOVE_BOUNDARY_PADDING;
      autoMoveVelocity.y *= -1;
    }
  }
  
  function update() {
    requestAnimationFrame(update);
    if (count < total) create();
  
    const currentTime = Date.now();
    if (currentTime - lastMouseMoveTime > mouseTimeOut) {
      updateAutoMove();
      mouseVec.x = autoMovePosition.x;
      mouseVec.y = autoMovePosition.y;
      centerVec.x = autoMovePosition.x;
      centerVec.y = autoMovePosition.y;
    }
  
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
  
  function repelToMouse(particle) {
    const force = Vector.sub(mouseVec, particle.position);
    const dist = force.mag();
    if (dist < (mouseThreshold)) {
      const x = dist - mouseThreshold;
      force.mult(-1 * k * x);
      force.mult(mouseRepelForce * particle.randomMultiplier);
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
      force.mult(forceToCenter * particle.randomMultiplier);
  
      particle.velocity.sub(force);

      TweenMax.to(particle, .1, {
        x: centerVec.x,
        y: centerVec.y
      })

    }
  }
  
  function repel2(particleA, particleB) {
      const force = Vector.sub(particleA.position, particleB.position);
      const dist = force.mag();
    
      if (dist > 0 && dist < minDist) {
        const overlap = minDist - dist;
        const correction = force.normalize().mult(overlap * 0.5);
        
        particleA.position.add(correction);
        particleB.position.sub(correction);
        
        const strength = -10;
        const f = strength * (1 - dist/minDist) / dist;
        force.mult(f);
        
        particleA.velocity.sub(force);
        particleB.velocity.add(force);
      }
  }
  
  
  init();