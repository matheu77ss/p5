p5.disableFriendlyErrors = true;

let img;
function preload() {
  img = createVideo('../addons/p5.dom/fingers.mov');
  img.loop();
  img.hide();
}

function setup() {
  // put setup code here
  createCanvas(windowWidth, windowHeight);
  background(0);
  noStroke();
  rectMode(CENTER);

  translate((width - img.width) / 2, (height - img.height) / 2);
}

function draw() {
  translate((width - img.width) / 2, (height - img.height) / 2);

  img.loadPixels();

  for (let i = 0; i < 3000; i++) {
    const px = random(img.width);
    const py = random(img.height);

    fill(img.get(px, py));
    ellipse(px, py, 3, 3);
  }
}
