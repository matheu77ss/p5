suite('p5.RendererGL', function() {
  var myp5;

  if (!window.Modernizr.webgl) {
    return;
  }

  setup(function() {
    myp5 = new p5(function(p) {
      p.setup = function() {};
      p.draw = function() {};
    });
  });

  teardown(function() {
    myp5.remove();
  });

  suite('createCanvas(w, h, WEBGL)', function() {
    test('creates a p5.RendererGL renderer', function() {
      myp5.createCanvas(100, 100, myp5.WEBGL);
      assert.instanceOf(myp5._renderer, p5.RendererGL);
    });
  });

  suite('webglVersion', function() {
    test('should return WEBGL2 by default', function() {
      myp5.createCanvas(10, 10, myp5.WEBGL);
      assert.equal(myp5.webglVersion, myp5.WEBGL2);
    });

    test('should return WEBGL1 after setAttributes', function() {
      myp5.createCanvas(10, 10, myp5.WEBGL);
      myp5.setAttributes({ version: 1 });
      assert.equal(myp5.webglVersion, myp5.WEBGL);
    });

    test('works on p5.Graphics', function() {
      myp5.createCanvas(10, 10, myp5.WEBGL);
      myp5.setAttributes({ version: 1 });
      const g = myp5.createGraphics(10, 10, myp5.WEBGL);
      assert.equal(myp5.webglVersion, myp5.WEBGL);
      assert.equal(g.webglVersion, myp5.WEBGL2);
    });

    suite('when WebGL2 is unavailable', function() {
      let prevGetContext;
      setup(function() {
        prevGetContext = HTMLCanvasElement.prototype.getContext;
        // Mock WebGL2 being unavailable
        HTMLCanvasElement.prototype.getContext = function(type, attrs) {
          if (type === 'webgl2') {
            return undefined;
          } else {
            return prevGetContext.call(this, type, attrs);
          }
        };
      });

      teardown(function() {
        // Put back the actual implementation
        HTMLCanvasElement.prototype.getContext = prevGetContext;
      });

      test('should return WEBGL1', function() {
        myp5.createCanvas(10, 10, myp5.WEBGL);
        assert.equal(myp5.webglVersion, myp5.WEBGL);
      });
    });
  });

  suite('default stroke shader', function() {
    test('check activate and deactivating fill and stroke', function(done) {
      myp5.noStroke();
      assert(
        !myp5._renderer._doStroke,
        'stroke shader still active after noStroke()'
      );
      assert.isTrue(
        myp5._renderer._doFill,
        'fill shader deactivated by noStroke()'
      );
      myp5.stroke(0);
      myp5.noFill();
      assert(
        myp5._renderer._doStroke,
        'stroke shader not active after stroke()'
      );
      assert.isTrue(
        !myp5._renderer._doFill,
        'fill shader still active after noFill()'
      );
      done();
    });

    test('coplanar strokes match 2D', function(done) {
      const getColors = function(mode) {
        myp5.createCanvas(20, 20, mode);
        myp5.pixelDensity(1);
        myp5.background(255);
        myp5.strokeCap(myp5.SQUARE);
        myp5.strokeJoin(myp5.MITER);
        if (mode === myp5.WEBGL) {
          myp5.translate(-myp5.width/2, -myp5.height/2);
        }
        myp5.stroke('black');
        myp5.strokeWeight(4);
        myp5.fill('red');
        myp5.rect(10, 10, 15, 15);
        myp5.fill('blue');
        myp5.rect(0, 0, 15, 15);
        myp5.loadPixels();
        return [...myp5.pixels];
      };

      assert.deepEqual(getColors(myp5.P2D), getColors(myp5.WEBGL));
      done();
    });
  });

  suite('text shader', function() {
    test('rendering looks the same in WebGL1 and 2', function(done) {
      myp5.loadFont('manual-test-examples/p5.Font/Inconsolata-Bold.ttf', function(font) {
        const webgl2 = myp5.createGraphics(100, 20, myp5.WEBGL);
        const webgl1 = myp5.createGraphics(100, 20, myp5.WEBGL);
        webgl1.setAttributes({ version: 1 });

        for (const graphic of [webgl1, webgl2]) {
          graphic.background(255);
          graphic.fill(0);
          graphic.textFont(font);
          graphic.textAlign(myp5.CENTER, myp5.CENTER);
          graphic.text(
            'Hello!',
            -graphic.width / 2,
            -graphic.height / 2,
            graphic.width,
            graphic.height
          );
          graphic.loadPixels();
        }

        assert.deepEqual(webgl1.pixels, webgl2.pixels);
        done();
      });
    });
  });

  suite('push() and pop() work in WEBGL Mode', function() {
    test('push/pop and translation works as expected in WEBGL Mode', function(done) {
      myp5.createCanvas(100, 100, myp5.WEBGL);
      var modelView = myp5._renderer.uMVMatrix.copy();
      myp5.push();
      myp5.rotateX(Math.random(0, 100));
      myp5.translate(20, 100, 5);
      assert.notEqual(modelView.mat4, myp5._renderer.uMVMatrix.mat4);
      myp5.pop();
      assert.deepEqual(modelView.mat4, myp5._renderer.uMVMatrix.mat4);
      done();
    });

    test('push/pop and directionalLight() works', function(done) {
      myp5.createCanvas(100, 100, myp5.WEBGL);
      myp5.directionalLight(255, 0, 0, 0, 0, 0);
      var dirDiffuseColors =
        myp5._renderer.directionalLightDiffuseColors.slice();
      var dirSpecularColors =
        myp5._renderer.directionalLightSpecularColors.slice();
      var dirLightDirections =
        myp5._renderer.directionalLightDirections.slice();
      myp5.push();
      myp5.directionalLight(0, 0, 255, 0, 10, 5);
      assert.notEqual(
        dirDiffuseColors,
        myp5._renderer.directionalLightDiffuseColors
      );
      assert.notEqual(
        dirSpecularColors,
        myp5._renderer.directionalLightSpecularColors
      );
      assert.notEqual(
        dirLightDirections,
        myp5._renderer.directionalLightDirections
      );
      myp5.pop();
      assert.deepEqual(
        dirDiffuseColors,
        myp5._renderer.directionalLightDiffuseColors
      );
      assert.deepEqual(
        dirSpecularColors,
        myp5._renderer.directionalLightSpecularColors
      );
      assert.deepEqual(
        dirLightDirections,
        myp5._renderer.directionalLightDirections
      );
      done();
    });

    test('push/pop and ambientLight() works', function(done) {
      myp5.createCanvas(100, 100, myp5.WEBGL);
      myp5.ambientLight(100, 0, 100);
      myp5.ambientLight(0, 0, 200);
      var ambColors = myp5._renderer.ambientLightColors.slice();
      myp5.push();
      myp5.ambientLight(0, 0, 0);
      assert.notEqual(ambColors, myp5._renderer.ambientLightColors);
      myp5.pop();
      assert.deepEqual(ambColors, myp5._renderer.ambientLightColors);
      done();
    });

    test('push/pop and pointLight() works', function(done) {
      myp5.createCanvas(100, 100, myp5.WEBGL);
      myp5.pointLight(255, 0, 0, 0, 0, 0);
      var pointDiffuseColors = myp5._renderer.pointLightDiffuseColors.slice();
      var pointSpecularColors = myp5._renderer.pointLightSpecularColors.slice();
      var pointLocs = myp5._renderer.pointLightPositions.slice();
      myp5.push();
      myp5.pointLight(0, 0, 255, 0, 10, 5);
      assert.notEqual(
        pointDiffuseColors,
        myp5._renderer.pointLightDiffuseColors
      );
      assert.notEqual(
        pointSpecularColors,
        myp5._renderer.pointLightSpecularColors
      );
      assert.notEqual(pointLocs, myp5._renderer.pointLightPositions);
      myp5.pop();
      assert.deepEqual(
        pointDiffuseColors,
        myp5._renderer.pointLightDiffuseColors
      );
      assert.deepEqual(
        pointSpecularColors,
        myp5._renderer.pointLightSpecularColors
      );
      assert.deepEqual(pointLocs, myp5._renderer.pointLightPositions);
      done();
    });

    test('push/pop and specularColor() works', function(done) {
      myp5.createCanvas(100, 100, myp5.WEBGL);
      myp5.specularColor(255, 0, 0);
      var specularColors = myp5._renderer.specularColors.slice();
      myp5.push();
      myp5.specularColor(0, 0, 255);
      assert.notEqual(specularColors, myp5._renderer.specularColors);
      myp5.pop();
      assert.deepEqual(specularColors, myp5._renderer.specularColors);
      done();
    });

    test('push/pop and spotLight() works', function(done) {
      myp5.createCanvas(100, 100, myp5.WEBGL);
      myp5.spotLight(255, 0, 255, 1, 2, 3, 0, 1, 0, Math.PI / 4, 7);
      let spotLightDiffuseColors =
        myp5._renderer.spotLightDiffuseColors.slice();
      let spotLightSpecularColors =
        myp5._renderer.spotLightSpecularColors.slice();
      let spotLightPositions = myp5._renderer.spotLightPositions.slice();
      let spotLightDirections = myp5._renderer.spotLightDirections.slice();
      let spotLightAngle = myp5._renderer.spotLightAngle.slice();
      let spotLightConc = myp5._renderer.spotLightConc.slice();
      myp5.push();
      myp5.spotLight(255, 0, 0, 2, 2, 3, 1, 0, 0, Math.PI / 3, 8);
      assert.notEqual(
        spotLightDiffuseColors,
        myp5._renderer.spotLightDiffuseColors
      );
      assert.notEqual(
        spotLightSpecularColors,
        myp5._renderer.spotLightSpecularColors
      );
      assert.notEqual(spotLightPositions, myp5._renderer.spotLightPositions);
      assert.notEqual(spotLightDirections, myp5._renderer.spotLightDirections);
      assert.notEqual(spotLightAngle, myp5._renderer.spotLightAngle);
      assert.notEqual(spotLightConc, myp5._renderer.spotLightConc);
      myp5.pop();
      assert.deepEqual(
        spotLightDiffuseColors,
        myp5._renderer.spotLightDiffuseColors
      );
      assert.deepEqual(
        spotLightSpecularColors,
        myp5._renderer.spotLightSpecularColors
      );
      assert.deepEqual(spotLightPositions, myp5._renderer.spotLightPositions);
      assert.deepEqual(spotLightDirections, myp5._renderer.spotLightDirections);
      assert.deepEqual(spotLightAngle, myp5._renderer.spotLightAngle);
      assert.deepEqual(spotLightConc, myp5._renderer.spotLightConc);
      done();
    });

    test('push/pop and noLights() works', function(done) {
      myp5.createCanvas(100, 100, myp5.WEBGL);
      myp5.ambientLight(0, 0, 200);
      var ambColors = myp5._renderer.ambientLightColors.slice();
      myp5.push();
      myp5.ambientLight(0, 200, 0);
      var ambPopColors = myp5._renderer.ambientLightColors.slice();
      myp5.noLights();
      assert.notEqual(ambColors, myp5._renderer.ambientLightColors);
      assert.notEqual(ambPopColors, myp5._renderer.ambientLightColors);
      myp5.pop();
      assert.deepEqual(ambColors, myp5._renderer.ambientLightColors);
      done();
    });

    test('push/pop and texture() works', function(done) {
      myp5.createCanvas(100, 100, myp5.WEBGL);
      var tex1 = myp5.createGraphics(1, 1);
      myp5.texture(tex1);
      assert.equal(tex1, myp5._renderer._tex);
      myp5.push();
      var tex2 = myp5.createGraphics(2, 2);
      myp5.texture(tex2);
      assert.equal(tex2, myp5._renderer._tex);
      assert.notEqual(tex1, myp5._renderer._tex);
      myp5.pop();
      assert.equal(tex1, myp5._renderer._tex);
      done();
    });

    test('push/pop and shader() works with fill', function(done) {
      myp5.createCanvas(100, 100, myp5.WEBGL);
      var fillShader1 = myp5._renderer._getLightShader();
      var fillShader2 = myp5._renderer._getColorShader();
      myp5.shader(fillShader1);
      assert.equal(fillShader1, myp5._renderer.userFillShader);
      myp5.push();
      myp5.shader(fillShader2);
      assert.equal(fillShader2, myp5._renderer.userFillShader);
      assert.notEqual(fillShader1, myp5._renderer.userFillShader);
      myp5.pop();
      assert.equal(fillShader1, myp5._renderer.userFillShader);
      done();
    });

    test('push/pop builds/unbuilds stack properly', function(done) {
      myp5.createCanvas(100, 100, myp5.WEBGL);
      var col1 = myp5.color(255, 0, 0);
      var col2 = myp5.color(0, 255, 0);
      for (var i = 0; i < 10; i++) {
        myp5.push();
        if (i % 2 === 0) {
          myp5.fill(col1);
        } else {
          myp5.fill(col2);
        }
      }
      for (var j = i; j > 0; j--) {
        if (j % 2 === 0) {
          assert.deepEqual(col2._array, myp5._renderer.curFillColor);
        } else {
          assert.deepEqual(col1._array, myp5._renderer.curFillColor);
        }
        myp5.pop();
      }
      assert.isTrue(myp5._styles.length === 0);
      done();
    });
  });

  suite('materials', function() {
    test('ambient color defaults to the fill color', function() {
      myp5.createCanvas(100, 100, myp5.WEBGL);
      myp5.noStroke();
      myp5.lights();
      myp5.fill('red');
      myp5.sphere(25);
      const pixel = myp5.get(50, 50);
      expect(pixel[0]).to.equal(221);
      expect(pixel[1]).to.equal(0);
      expect(pixel[2]).to.equal(0);
    });

    test('ambient color can be set manually', function() {
      myp5.createCanvas(100, 100, myp5.WEBGL);
      myp5.noStroke();
      myp5.lights();
      myp5.fill('red');
      myp5.ambientMaterial(255, 255, 255);
      myp5.sphere(25);
      const pixel = myp5.get(50, 50);
      expect(pixel[0]).to.equal(221);
      expect(pixel[1]).to.equal(128);
      expect(pixel[2]).to.equal(128);
    });

    test('fill() sets _hasSetAmbient to false', function() {
      myp5.createCanvas(100, 100, myp5.WEBGL);
      myp5.noStroke();
      myp5.lights();
      myp5.ambientMaterial(255, 255, 255);
      myp5.fill(255, 0, 0);
      myp5.plane(100);
      const pixel = myp5.get(50, 50);
      expect(pixel[0]).to.equal(221);
      expect(pixel[1]).to.equal(0);
      expect(pixel[2]).to.equal(0);
    });

    test('texture() sets _hasSetAmbient to false', function() {
      myp5.createCanvas(100, 100, myp5.WEBGL);
      const tex = myp5.createGraphics(256, 256);
      tex.noStroke();
      for (let i=0; i<256; i++) {
        tex.fill(i, i, 255);
        tex.rect(0, i, 256, 1);
      }
      myp5.noStroke();
      myp5.lights();
      myp5.ambientMaterial(128, 128, 128);
      myp5.texture(tex);
      myp5.plane(100);
      const pixel = myp5.get(50, 50);
      expect(pixel[0]).to.equal(110);
      expect(pixel[1]).to.equal(110);
      expect(pixel[2]).to.equal(221);
    });

    test('texture() does not set _useSpecularMaterial to false',
      function() {
        myp5.createCanvas(100, 100, myp5.WEBGL);
        const tex = myp5.createGraphics(256, 256);
        tex.noStroke();
        for (let i=0; i<256; i++) {
          tex.fill(i, i, 255);
          tex.rect(0, i, 256, 1);
        }
        myp5.noStroke();
        myp5.lights();
        myp5.specularMaterial(128, 128, 128);
        myp5.texture(tex);
        myp5.plane(100);
        const pixel = myp5.get(50, 50);
        expect(pixel[0]).to.equal(238);
        expect(pixel[1]).to.equal(238);
        expect(pixel[2]).to.equal(255);
      }
    );

    test('ambientMaterial() does not null texture', function() {
      myp5.createCanvas(100, 100, myp5.WEBGL);
      const tex = myp5.createGraphics(256, 256);
      tex.noStroke();
      for (let i=0; i<256; i++) {
        tex.fill(i, i, 255);
        tex.rect(0, i, 256, 1);
      }
      myp5.noStroke();
      myp5.lights();
      myp5.texture(tex);
      myp5.ambientMaterial(128, 128, 128);
      myp5.plane(100);
      const pixel = myp5.get(50, 50);
      expect(pixel[0]).to.equal(111);
      expect(pixel[1]).to.equal(111);
      expect(pixel[2]).to.equal(158);
    });
    test('specularMaterial() does not null texture', function() {
      myp5.createCanvas(100, 100, myp5.WEBGL);
      const tex = myp5.createGraphics(256, 256);
      tex.noStroke();
      for (let i=0; i<256; i++) {
        tex.fill(i, i, 255);
        tex.rect(0, i, 256, 1);
      }
      myp5.noStroke();
      myp5.lights();
      myp5.texture(tex);
      myp5.specularMaterial(128, 128, 128);
      myp5.plane(100);
      const pixel = myp5.get(50, 50);
      expect(pixel[0]).to.equal(238);
      expect(pixel[1]).to.equal(238);
      expect(pixel[2]).to.equal(255);
    });
    test('emissiveMaterial() does not null texture', function() {
      myp5.createCanvas(100, 100, myp5.WEBGL);
      const tex = myp5.createGraphics(256, 256);
      tex.noStroke();
      for (let i=0; i<256; i++) {
        tex.fill(i, i, 255);
        tex.rect(0, i, 256, 1);
      }
      myp5.noStroke();
      myp5.lights();
      myp5.texture(tex);
      myp5.emissiveMaterial(128, 128, 128);
      myp5.plane(100);
      const pixel = myp5.get(50, 50);
      expect(pixel[0]).to.equal(238);
      expect(pixel[1]).to.equal(238);
      expect(pixel[2]).to.equal(255);
    });
  });

  suite('loadpixels()', function() {
    test('loadPixels color check', function(done) {
      myp5.createCanvas(100, 100, myp5.WEBGL);
      myp5.background(0, 100, 0);
      myp5.loadPixels();
      var pixels = myp5.pixels;
      assert.deepEqual(pixels[1], 100);
      assert.deepEqual(pixels[3], 255);
      done();
    });

    test('get() singlePixel color and size, with loadPixels', function(done) {
      myp5.createCanvas(100, 100, myp5.WEBGL);
      myp5.background(100, 115, 100);
      myp5.loadPixels();
      var img = myp5.get(0, 0);
      assert.isTrue(img[1] === 115);
      assert.isTrue(img.length === 4);
      done();
    });

    test('updatePixels() matches 2D mode', function() {
      myp5.createCanvas(20, 20);
      myp5.pixelDensity(1);
      const getColors = function(mode) {
        const g = myp5.createGraphics(20, 20, mode);
        g.pixelDensity(1);
        g.background(255);
        g.loadPixels();
        for (let y = 0; y < g.height; y++) {
          for (let x = 0; x < g.width; x++) {
            const idx = (y * g.width + x) * 4;
            g.pixels[idx] = (x / g.width) * 255;
            g.pixels[idx + 1] = (y / g.height) * 255;
            g.pixels[idx + 2] = 255;
            g.pixels[idx + 3] = 255;
          }
        }
        g.updatePixels();
        return g;
      };

      const p2d = getColors(myp5.P2D);
      const webgl = getColors(myp5.WEBGL);
      myp5.image(p2d, 0, 0);
      myp5.blendMode(myp5.DIFFERENCE);
      myp5.image(webgl, 0, 0);
      myp5.loadPixels();

      // There should be no difference, so the result should be all black
      // at 100% opacity. We add +/- 1 for wiggle room to account for precision
      // loss.
      for (let i = 0; i < myp5.pixels.length; i++) {
        expect(myp5.pixels[i]).to.be.closeTo(i % 4 === 3 ? 255 : 0, 1);
      }
    });
  });

  suite('get()', function() {
    var img;
    test('get() size check', function(done) {
      myp5.createCanvas(100, 100, myp5.WEBGL);
      img = myp5.get();
      assert.deepEqual(img.width, myp5.width);
      done();
    });

    test('get() can create p5.Image', function(done) {
      myp5.createCanvas(100, 100, myp5.WEBGL);
      assert.isTrue(img instanceof p5.Image);
      done();
    });

    test('get() singlePixel color and size', function(done) {
      myp5.createCanvas(100, 100, myp5.WEBGL);
      myp5.background(100, 115, 100);
      img = myp5.get(0, 0);
      assert.isTrue(img[1] === 115);
      assert.isTrue(img.length === 4);
      myp5.loadPixels();
      img = myp5.get(0, 0);
      assert.isTrue(img[1] === 115);
      assert.isTrue(img.length === 4);
      done();
    });
  });

  suite('GL Renderer clear()', function() {
    var pg;
    var pixel;
    test('webgl graphics background draws into webgl canvas', function(done) {
      myp5.createCanvas(50, 50, myp5.WEBGL);
      myp5.background(0, 255, 255, 255);
      pg = myp5.createGraphics(25, 50, myp5.WEBGL);
      pg.background(0);
      myp5.image(pg, -myp5.width / 2, -myp5.height / 2);
      pixel = myp5.get(0, 0);
      assert.deepEqual(pixel, [0, 0, 0, 255]);
      done();
    });

    test('transparent GL graphics with GL canvas', function(done) {
      myp5.createCanvas(50, 50, myp5.WEBGL);
      pg = myp5.createGraphics(25, 50, myp5.WEBGL);
      myp5.background(0, 255, 255);
      pg.clear();
      myp5.image(pg, -myp5.width / 2, -myp5.height / 2);
      pixel = myp5.get(0, 0);
      assert.deepEqual(pixel, [0, 255, 255, 255]);
      done();
    });

    test('clear color with rgba arguments', function(done) {
      myp5.createCanvas(50, 50, myp5.WEBGL);
      myp5.clear(1, 0, 0, 1);
      pixel = myp5.get(0, 0);
      assert.deepEqual(pixel, [255, 0, 0, 255]);
      pg = myp5.createGraphics(50, 50, myp5.WEBGL);
      pg.clear(1, 0, 0, 1);
      pixel = pg.get(0, 0);
      assert.deepEqual(pixel, [255, 0, 0, 255]);
      done();
    });

    test('semi-transparent GL graphics with GL canvas', function(done) {
      myp5.createCanvas(50, 50, myp5.WEBGL);
      pg = myp5.createGraphics(25, 50, myp5.WEBGL);
      myp5.background(0, 255, 255);
      pg.background(100, 100, 100, 100);
      myp5.image(pg, -myp5.width / 2, -myp5.height / 2);
      pixel = myp5.get(0, 0);
      assert.deepEqual(pixel, [39, 194, 194, 255]);
      done();
    });

    test('webgl graphics background draws into 2D canvas', function(done) {
      myp5.createCanvas(50, 50);
      myp5.background(0, 255, 255, 255);
      pg = myp5.createGraphics(25, 50, myp5.WEBGL);
      pg.background(0);
      myp5.image(pg, 0, 0);
      pixel = myp5.get(0, 0);
      assert.deepEqual(pixel, [0, 0, 0, 255]);
      done();
    });

    test('transparent GL graphics with 2D canvas', function(done) {
      myp5.createCanvas(50, 50);
      pg = myp5.createGraphics(25, 50, myp5.WEBGL);
      myp5.background(0, 255, 255);
      pg.clear();
      myp5.image(pg, 0, 0);
      pixel = myp5.get(0, 0);
      assert.deepEqual(pixel, [0, 255, 255, 255]);
      done();
    });

    test('semi-transparent GL graphics with 2D canvas', function(done) {
      myp5.createCanvas(50, 50);
      pg = myp5.createGraphics(25, 50, myp5.WEBGL);
      myp5.background(0, 255, 255);
      pg.background(100, 100, 100, 100);
      myp5.image(pg, 0, 0);
      pixel = myp5.get(0, 0);
      assert.deepEqual(pixel, [39, 194, 194, 255]);
      done();
    });
  });

  suite('background()', function() {
    function assertAllPixelsAreColor(target, r, g, b, a) {
      target.loadPixels();
      const expectedPixels = [];
      for (let i = 0; i < target.width * target.height; i++) {
        expectedPixels.push(r, g, b, a);
      }
      assert.deepEqual([ ...target.pixels ], expectedPixels);
    }

    function testDepthGetsCleared(target) {
      target.pixelDensity(1);
      target.noStroke();
      target.fill(255, 0, 0);
      target.plane(target.width, target.height);
      assertAllPixelsAreColor(target, 255, 0, 0, 255);

      target.background(255);
      target.push();
      target.translate(0, 0, -10); // Move farther away
      target.fill(0, 0, 255);
      // expanded to fill the screen
      target.plane(target.width * 4, target.height * 4);
      target.pop();
      // The farther-away plane should not be occluded because we cleared
      // the screen with background()
      assertAllPixelsAreColor(target, 0, 0, 255, 255);
    }

    test('background() resets the depth buffer of the main canvas', function() {
      myp5.createCanvas(10, 10, myp5.WEBGL);
      testDepthGetsCleared(myp5);
    });

    test('background() resets the depth buffer of p5.Graphics', function() {
      const graphics = myp5.createGraphics(10, 10, myp5.WEBGL);
      testDepthGetsCleared(graphics);
    });
  });

  suite('blendMode()', function() {
    var testBlend = function(mode, intended) {
      myp5.blendMode(mode);
      assert.deepEqual(intended, myp5._renderer.curBlendMode);
    };

    test('blendMode sets _curBlendMode correctly', function(done) {
      myp5.createCanvas(100, 100, myp5.WEBGL);
      testBlend(myp5.ADD, myp5.ADD);
      testBlend(myp5.REPLACE, myp5.REPLACE);
      testBlend(myp5.SUBTRACT, myp5.SUBTRACT);
      testBlend(myp5.SCREEN, myp5.SCREEN);
      testBlend(myp5.EXCLUSION, myp5.EXCLUSION);
      testBlend(myp5.MULTIPLY, myp5.MULTIPLY);
      testBlend(myp5.LIGHTEST, myp5.LIGHTEST);
      testBlend(myp5.DARKEST, myp5.DARKEST);
      done();
    });

    test('blendMode doesnt change when mode unavailable in 3D', function(done) {
      myp5.createCanvas(100, 100, myp5.WEBGL);
      myp5.blendMode(myp5.DARKEST);
      testBlend(myp5.BURN, myp5.DARKEST);
      testBlend(myp5.DODGE, myp5.DARKEST);
      testBlend(myp5.SOFT_LIGHT, myp5.DARKEST);
      testBlend(myp5.HARD_LIGHT, myp5.DARKEST);
      testBlend(myp5.OVERLAY, myp5.DARKEST);
      done();
    });

    var mixAndReturn = function(mode, bgCol) {
      myp5.background(bgCol);
      myp5.blendMode(mode);
      myp5.fill(255, 0, 0, 122);
      myp5.plane(10);
      myp5.fill(0, 0, 255, 122);
      myp5.plane(10);
      return myp5.get(5, 5);
    };

    test('blendModes change pixel colors as expected', function(done) {
      myp5.createCanvas(10, 10, myp5.WEBGL);
      myp5.noStroke();
      assert.deepEqual([122, 0, 122, 255], mixAndReturn(myp5.ADD, 0));
      assert.deepEqual([0, 0, 122, 122], mixAndReturn(myp5.REPLACE, 255));
      assert.deepEqual([133, 255, 133, 255], mixAndReturn(myp5.SUBTRACT, 255));
      assert.deepEqual([122, 0, 122, 255], mixAndReturn(myp5.SCREEN, 0));
      assert.deepEqual([133, 255, 133, 255], mixAndReturn(myp5.EXCLUSION, 255));
      // Note that in 2D mode, this would just return black, because 2D mode
      // ignores alpha in this case.
      assert.deepEqual([133, 69, 133, 255], mixAndReturn(myp5.MULTIPLY, 255));
      assert.deepEqual([122, 0, 122, 255], mixAndReturn(myp5.LIGHTEST, 0));
      assert.deepEqual([0, 0, 0, 255], mixAndReturn(myp5.DARKEST, 255));
      done();
    });

    test('blendModes match 2D mode', function(done) {
      myp5.createCanvas(10, 10, myp5.WEBGL);
      myp5.setAttributes({ alpha: true });
      const ref = myp5.createGraphics(myp5.width, myp5.height);
      ref.translate(ref.width / 2, ref.height / 2); // Match WebGL mode

      const testBlend = function(target, colorA, colorB, mode) {
        target.clear();
        target.push();
        target.background(colorA);
        target.blendMode(mode);
        target.noStroke();
        target.fill(colorB);
        target.rectMode(target.CENTER);
        target.rect(0, 0, target.width, target.height);
        target.pop();
        return target.get(0, 0);
      };

      const assertSameIn2D = function(colorA, colorB, mode) {
        const refColor = testBlend(myp5, colorA, colorB, mode);
        const webglColor = testBlend(ref, colorA, colorB, mode);
        assert.deepEqual(
          refColor,
          webglColor,
          `Blending ${colorA} with ${colorB} using ${mode}`
        );
      };

      for (const alpha of [255, 200]) {
        const red = myp5.color('#F53');
        const blue = myp5.color('#13F');
        red.setAlpha(alpha);
        blue.setAlpha(alpha);
        assertSameIn2D(red, blue, myp5.BLEND);
        assertSameIn2D(red, blue, myp5.ADD);
        assertSameIn2D(red, blue, myp5.DARKEST);
        assertSameIn2D(red, blue, myp5.LIGHTEST);
        assertSameIn2D(red, blue, myp5.EXCLUSION);
        assertSameIn2D(red, blue, myp5.MULTIPLY);
        assertSameIn2D(red, blue, myp5.SCREEN);
        assertSameIn2D(red, blue, myp5.REPLACE);
        assertSameIn2D(red, blue, myp5.REMOVE);
        done();
      }
    });

    test('blendModes are included in push/pop', function(done) {
      myp5.createCanvas(10, 10, myp5.WEBGL);
      myp5.blendMode(myp5.MULTIPLY);
      myp5.push();
      myp5.blendMode(myp5.ADD);
      assert.equal(myp5._renderer.curBlendMode, myp5.ADD, 'Changed to ADD');
      myp5.pop();
      assert.equal(
        myp5._renderer.curBlendMode,
        myp5.MULTIPLY,
        'Resets to MULTIPLY'
      );
      done();
    });

    test('blendModes are applied to point drawing', function(done) {
      myp5.createCanvas(32, 32, myp5.WEBGL);
      myp5.background(0);
      myp5.blendMode(myp5.ADD);
      myp5.strokeWeight(32);
      myp5.stroke(255, 0, 0);
      myp5.point(0, 0, 0);
      myp5.stroke(0, 0, 255);
      myp5.point(0, 0, 0);
      assert.deepEqual(myp5.get(16, 16), [255, 0, 255, 255]);
      done();
    });
  });

  suite('BufferDef', function() {
    test('render buffer properties are correctly set', function(done) {
      var renderer = myp5.createCanvas(10, 10, myp5.WEBGL);

      myp5.fill(255);
      myp5.stroke(255);
      myp5.triangle(0, 0, 1, 0, 0, 1);

      var buffers = renderer.retainedMode.geometry['tri'];

      assert.isObject(buffers);
      assert.isDefined(buffers.indexBuffer);
      assert.isDefined(buffers.indexBufferType);
      assert.isDefined(buffers.vertexBuffer);
      assert.isDefined(buffers.lineVerticesBuffer);
      assert.isDefined(buffers.lineSidesBuffer);
      assert.isDefined(buffers.lineTangentsInBuffer);
      assert.isDefined(buffers.lineTangentsOutBuffer);
      assert.isDefined(buffers.vertexBuffer);

      assert.equal(buffers.vertexCount, 3);

      //   6 verts per line segment x3 (each is a quad made of 2 triangles)
      // + 12 verts per join x3 (2 quads each, 1 is discarded in the shader)
      // + 6 verts per line cap x0 (1 quad each)
      // = 54
      assert.equal(buffers.lineVertexCount, 54);

      done();
    });
  });

  suite('tint() in WEBGL mode', function() {
    test('default tint value is set and not null', function() {
      myp5.createCanvas(100, 100, myp5.WEBGL);
      assert.deepEqual(myp5._renderer._tint, [255, 255, 255, 255]);
    });

    test('tint value is modified correctly when tint() is called', function() {
      myp5.createCanvas(100, 100, myp5.WEBGL);
      myp5.tint(0, 153, 204, 126);
      assert.deepEqual(myp5._renderer._tint, [0, 153, 204, 126]);
      myp5.tint(100, 120, 140);
      assert.deepEqual(myp5._renderer._tint, [100, 120, 140, 255]);
      myp5.tint('violet');
      assert.deepEqual(myp5._renderer._tint, [238, 130, 238, 255]);
      myp5.tint(100);
      assert.deepEqual(myp5._renderer._tint, [100, 100, 100, 255]);
      myp5.tint(100, 126);
      assert.deepEqual(myp5._renderer._tint, [100, 100, 100, 126]);
      myp5.tint([100, 126, 0, 200]);
      assert.deepEqual(myp5._renderer._tint, [100, 126, 0, 200]);
      myp5.tint([100, 126, 0]);
      assert.deepEqual(myp5._renderer._tint, [100, 126, 0, 255]);
      myp5.tint([100]);
      assert.deepEqual(myp5._renderer._tint, [100, 100, 100, 255]);
      myp5.tint([100, 126]);
      assert.deepEqual(myp5._renderer._tint, [100, 100, 100, 126]);
      myp5.tint(myp5.color(255, 204, 0));
      assert.deepEqual(myp5._renderer._tint, [255, 204, 0, 255]);
    });

    test('tint should be reset after draw loop', function() {
      return new Promise(function(resolve, reject) {
        new p5(function(p) {
          p.setup = function() {
            p.createCanvas(100, 100, myp5.WEBGL);
          };
          p.draw = function() {
            if (p.frameCount === 2) {
              resolve(p._renderer._tint);
            }
            p.tint(0, 153, 204, 126);
          };
        });
      }).then(function(_tint) {
        assert.deepEqual(_tint, [255, 255, 255, 255]);
      });
    });
  });

  suite('beginShape() in WEBGL mode', function() {
    test('QUADS mode converts into triangles', function(done) {
      var renderer = myp5.createCanvas(10, 10, myp5.WEBGL);
      myp5.textureMode(myp5.NORMAL);
      renderer.beginShape(myp5.QUADS);
      renderer.fill(255, 0, 0);
      renderer.normal(0, 1, 2);
      renderer.vertex(0, 0, 0, 0, 0);
      renderer.fill(0, 255, 0);
      renderer.normal(3, 4, 5);
      renderer.vertex(0, 1, 1, 0, 1);
      renderer.fill(0, 0, 255);
      renderer.normal(6, 7, 8);
      renderer.vertex(1, 0, 2, 1, 0);
      renderer.fill(255, 0, 255);
      renderer.normal(9, 10, 11);
      renderer.vertex(1, 1, 3, 1, 1);

      renderer.fill(255, 0, 0);
      renderer.normal(12, 13, 14);
      renderer.vertex(2, 0, 4, 0, 0);
      renderer.fill(0, 255, 0);
      renderer.normal(15, 16, 17);
      renderer.vertex(2, 1, 5, 0, 1);
      renderer.fill(0, 0, 255);
      renderer.normal(18, 19, 20);
      renderer.vertex(3, 0, 6, 1, 0);
      renderer.fill(255, 0, 255);
      renderer.normal(21, 22, 23);
      renderer.vertex(3, 1, 7, 1, 1);
      renderer.endShape();

      const expectedVerts = [
        [0, 0, 0],
        [0, 1, 1],
        [1, 0, 2],

        [0, 0, 0],
        [1, 0, 2],
        [1, 1, 3],

        [2, 0, 4],
        [2, 1, 5],
        [3, 0, 6],

        [2, 0, 4],
        [3, 0, 6],
        [3, 1, 7]
      ];
      assert.equal(
        renderer.immediateMode.geometry.vertices.length,
        expectedVerts.length
      );
      expectedVerts.forEach(function([x, y, z], i) {
        assert.equal(renderer.immediateMode.geometry.vertices[i].x, x);
        assert.equal(renderer.immediateMode.geometry.vertices[i].y, y);
        assert.equal(renderer.immediateMode.geometry.vertices[i].z, z);
      });

      const expectedUVs = [
        [0, 0],
        [0, 1],
        [1, 0],

        [0, 0],
        [1, 0],
        [1, 1],

        [0, 0],
        [0, 1],
        [1, 0],

        [0, 0],
        [1, 0],
        [1, 1]
      ].flat();
      assert.deepEqual(renderer.immediateMode.geometry.uvs, expectedUVs);

      const expectedColors = [
        [1, 0, 0, 1],
        [0, 1, 0, 1],
        [0, 0, 1, 1],

        [1, 0, 0, 1],
        [0, 0, 1, 1],
        [1, 0, 1, 1],

        [1, 0, 0, 1],
        [0, 1, 0, 1],
        [0, 0, 1, 1],

        [1, 0, 0, 1],
        [0, 0, 1, 1],
        [1, 0, 1, 1]
      ].flat();
      assert.deepEqual(
        renderer.immediateMode.geometry.vertexColors,
        expectedColors
      );

      const expectedNormals = [
        [0, 1, 2],
        [3, 4, 5],
        [6, 7, 8],

        [0, 1, 2],
        [6, 7, 8],
        [9, 10, 11],

        [12, 13, 14],
        [15, 16, 17],
        [18, 19, 20],

        [12, 13, 14],
        [18, 19, 20],
        [21, 22, 23]
      ];
      assert.equal(
        renderer.immediateMode.geometry.vertexNormals.length,
        expectedNormals.length
      );
      expectedNormals.forEach(function([x, y, z], i) {
        assert.equal(renderer.immediateMode.geometry.vertexNormals[i].x, x);
        assert.equal(renderer.immediateMode.geometry.vertexNormals[i].y, y);
        assert.equal(renderer.immediateMode.geometry.vertexNormals[i].z, z);
      });

      done();
    });

    test('QUADS mode makes edges for quad outlines', function(done) {
      var renderer = myp5.createCanvas(10, 10, myp5.WEBGL);
      renderer.beginShape(myp5.QUADS);
      renderer.vertex(0, 0);
      renderer.vertex(0, 1);
      renderer.vertex(1, 0);
      renderer.vertex(1, 1);

      renderer.vertex(2, 0);
      renderer.vertex(2, 1);
      renderer.vertex(3, 0);
      renderer.vertex(3, 1);
      renderer.endShape();

      assert.equal(renderer.immediateMode.geometry.edges.length, 8);
      done();
    });

    test('QUAD_STRIP mode makes edges for strip outlines', function(done) {
      var renderer = myp5.createCanvas(10, 10, myp5.WEBGL);
      renderer.beginShape(myp5.QUAD_STRIP);
      renderer.vertex(0, 0);
      renderer.vertex(0, 1);
      renderer.vertex(1, 0);
      renderer.vertex(1, 1);
      renderer.vertex(2, 0);
      renderer.vertex(2, 1);
      renderer.vertex(3, 0);
      renderer.vertex(3, 1);
      renderer.endShape();

      // Two full quads (2 * 4) plus two edges connecting them
      assert.equal(renderer.immediateMode.geometry.edges.length, 10);
      done();
    });

    test('TRIANGLE_FAN mode makes edges for each triangle', function(done) {
      var renderer = myp5.createCanvas(10, 10, myp5.WEBGL);
      //    x
      //    | \
      // x--x--x
      //  \ | /
      //    x
      renderer.beginShape(myp5.TRIANGLE_FAN);
      renderer.vertex(0, 0);
      renderer.vertex(0, -5);
      renderer.vertex(5, 0);
      renderer.vertex(0, 5);
      renderer.vertex(-5, 0);
      renderer.endShape();

      assert.equal(renderer.immediateMode.geometry.edges.length, 7);
      done();
    });

    test('TESS preserves vertex data', function(done) {
      var renderer = myp5.createCanvas(10, 10, myp5.WEBGL);

      myp5.textureMode(myp5.NORMAL);
      renderer.beginShape(myp5.TESS);
      renderer.fill(255, 255, 255);
      renderer.normal(-1, -1, 1);
      renderer.vertex(-10, -10, 0, 0);
      renderer.fill(255, 0, 0);
      renderer.normal(1, -1, 1);
      renderer.vertex(10, -10, 1, 0);
      renderer.fill(0, 255, 0);
      renderer.normal(1, 1, 1);
      renderer.vertex(10, 10, 1, 1);
      renderer.fill(0, 0, 255);
      renderer.normal(-1, 1, 1);
      renderer.vertex(-10, 10, 0, 1);
      renderer.endShape(myp5.CLOSE);

      assert.equal(renderer.immediateMode.geometry.vertices.length, 6);
      assert.deepEqual(
        renderer.immediateMode.geometry.vertices[0].array(),
        [10, -10, 0]
      );
      assert.deepEqual(
        renderer.immediateMode.geometry.vertices[1].array(),
        [-10, 10, 0]
      );
      assert.deepEqual(
        renderer.immediateMode.geometry.vertices[2].array(),
        [-10, -10, 0]
      );
      assert.deepEqual(
        renderer.immediateMode.geometry.vertices[3].array(),
        [-10, 10, 0]
      );
      assert.deepEqual(
        renderer.immediateMode.geometry.vertices[4].array(),
        [10, -10, 0]
      );
      assert.deepEqual(
        renderer.immediateMode.geometry.vertices[5].array(),
        [10, 10, 0]
      );

      assert.equal(renderer.immediateMode.geometry.vertexNormals.length, 6);
      assert.deepEqual(
        renderer.immediateMode.geometry.vertexNormals[0].array(),
        [1, -1, 1]
      );
      assert.deepEqual(
        renderer.immediateMode.geometry.vertexNormals[1].array(),
        [-1, 1, 1]
      );
      assert.deepEqual(
        renderer.immediateMode.geometry.vertexNormals[2].array(),
        [-1, -1, 1]
      );
      assert.deepEqual(
        renderer.immediateMode.geometry.vertexNormals[3].array(),
        [-1, 1, 1]
      );
      assert.deepEqual(
        renderer.immediateMode.geometry.vertexNormals[4].array(),
        [1, -1, 1]
      );
      assert.deepEqual(
        renderer.immediateMode.geometry.vertexNormals[5].array(),
        [1, 1, 1]
      );

      assert.deepEqual(renderer.immediateMode.geometry.vertexColors, [
        1, 0, 0, 1,
        0, 0, 1, 1,
        1, 1, 1, 1,
        0, 0, 1, 1,
        1, 0, 0, 1,
        0, 1, 0, 1
      ]);

      assert.deepEqual(renderer.immediateMode.geometry.uvs, [
        1, 0,
        0, 1,
        0, 0,
        0, 1,
        1, 0,
        1, 1
      ]);

      done();
    });

    test('TESS does not affect stroke colors', function(done) {
      var renderer = myp5.createCanvas(10, 10, myp5.WEBGL);

      myp5.textureMode(myp5.NORMAL);
      renderer.beginShape(myp5.TESS);
      myp5.noFill();
      renderer.stroke(255, 255, 255);
      renderer.vertex(-10, -10, 0, 0);
      renderer.stroke(255, 0, 0);
      renderer.vertex(10, -10, 1, 0);
      renderer.stroke(0, 255, 0);
      renderer.vertex(10, 10, 1, 1);
      renderer.stroke(0, 0, 255);
      renderer.vertex(-10, 10, 0, 1);
      renderer.endShape(myp5.CLOSE);

      // Vertex colors are not run through tessy
      assert.deepEqual(renderer.immediateMode.geometry.vertexStrokeColors, [
        1, 1, 1, 1,
        1, 0, 0, 1,
        0, 1, 0, 1,
        0, 0, 1, 1
      ]);

      done();
    });

    test('TESS interpolates vertex data at intersections', function(done) {
      var renderer = myp5.createCanvas(10, 10, myp5.WEBGL);

      // Hourglass shape:
      //
      // 1     3
      // o     o
      // | \ / |
      // | / \ |
      // o     o
      // 4     2
      //
      // Tessy will add a vertex in the middle
      myp5.textureMode(myp5.NORMAL);
      renderer.beginShape(myp5.TESS);
      renderer.fill(255, 255, 255);
      renderer.normal(-1, -1, 1);
      renderer.vertex(-10, -10, 0, 0);
      renderer.fill(0, 255, 0);
      renderer.normal(1, 1, 1);
      renderer.vertex(10, 10, 1, 1);
      renderer.fill(255, 0, 0);
      renderer.normal(1, -1, 1);
      renderer.vertex(10, -10, 1, 0);
      renderer.fill(0, 0, 255);
      renderer.normal(-1, 1, 1);
      renderer.vertex(-10, 10, 0, 1);
      renderer.endShape(myp5.CLOSE);

      assert.equal(renderer.immediateMode.geometry.vertices.length, 6);
      assert.deepEqual(
        renderer.immediateMode.geometry.vertices[0].array(),
        [0, 0, 0]
      );
      assert.deepEqual(
        renderer.immediateMode.geometry.vertices[1].array(),
        [-10, 10, 0]
      );
      assert.deepEqual(
        renderer.immediateMode.geometry.vertices[2].array(),
        [-10, -10, 0]
      );
      assert.deepEqual(
        renderer.immediateMode.geometry.vertices[3].array(),
        [10, 10, 0]
      );
      assert.deepEqual(
        renderer.immediateMode.geometry.vertices[4].array(),
        [0, 0, 0]
      );
      assert.deepEqual(
        renderer.immediateMode.geometry.vertices[5].array(),
        [10, -10, 0]
      );

      assert.equal(renderer.immediateMode.geometry.vertexNormals.length, 6);
      assert.deepEqual(
        renderer.immediateMode.geometry.vertexNormals[0].array(),
        [0, 0, 1]
      );
      assert.deepEqual(
        renderer.immediateMode.geometry.vertexNormals[1].array(),
        [-1, 1, 1]
      );
      assert.deepEqual(
        renderer.immediateMode.geometry.vertexNormals[2].array(),
        [-1, -1, 1]
      );
      assert.deepEqual(
        renderer.immediateMode.geometry.vertexNormals[3].array(),
        [1, 1, 1]
      );
      assert.deepEqual(
        renderer.immediateMode.geometry.vertexNormals[4].array(),
        [0, 0, 1]
      );
      assert.deepEqual(
        renderer.immediateMode.geometry.vertexNormals[5].array(),
        [1, -1, 1]
      );

      assert.deepEqual(renderer.immediateMode.geometry.vertexColors, [
        0.5, 0.5, 0.5, 1,
        0, 0, 1, 1,
        1, 1, 1, 1,
        0, 1, 0, 1,
        0.5, 0.5, 0.5, 1,
        1, 0, 0, 1
      ]);

      assert.deepEqual(renderer.immediateMode.geometry.uvs, [
        0.5, 0.5,
        0, 1,
        0, 0,
        1, 1,
        0.5, 0.5,
        1, 0
      ]);

      done();
    });

    test('TESS handles vertex data perpendicular to the camera', function(done) {
      var renderer = myp5.createCanvas(10, 10, myp5.WEBGL);

      myp5.textureMode(myp5.NORMAL);
      renderer.beginShape(myp5.TESS);
      renderer.vertex(-10, 0, -10);
      renderer.vertex(10, 0, -10);
      renderer.vertex(10, 0, 10);
      renderer.vertex(-10, 0, 10);
      renderer.endShape(myp5.CLOSE);

      assert.equal(renderer.immediateMode.geometry.vertices.length, 6);
      assert.deepEqual(
        renderer.immediateMode.geometry.vertices[0].array(),
        [10, 0, 10]
      );
      assert.deepEqual(
        renderer.immediateMode.geometry.vertices[1].array(),
        [-10, 0, -10]
      );
      assert.deepEqual(
        renderer.immediateMode.geometry.vertices[2].array(),
        [10, 0, -10]
      );
      assert.deepEqual(
        renderer.immediateMode.geometry.vertices[3].array(),
        [-10, 0, -10]
      );
      assert.deepEqual(
        renderer.immediateMode.geometry.vertices[4].array(),
        [10, 0, 10]
      );
      assert.deepEqual(
        renderer.immediateMode.geometry.vertices[5].array(),
        [-10, 0, 10]
      );

      done();
    });
  });

  suite('color interpolation', function() {
    test('strokes should interpolate colors between vertices', function(done) {
      const renderer = myp5.createCanvas(512, 4, myp5.WEBGL);

      // far left color: (242, 236, 40)
      // far right color: (42, 36, 240)
      // expected middle color: (142, 136, 140)

      renderer.strokeWeight(4);
      renderer.beginShape();
      renderer.stroke(242, 236, 40);
      renderer.vertex(-256, 0);
      renderer.stroke(42, 36, 240);
      renderer.vertex(256, 0);
      renderer.endShape();

      assert.deepEqual(myp5.get(0, 2), [242, 236, 40, 255]);
      assert.deepEqual(myp5.get(256, 2), [142, 136, 140, 255]);
      assert.deepEqual(myp5.get(511, 2), [42, 36, 240, 255]);

      done();
    });

    test('bezierVertex() should interpolate curFillColor', function(done) {
      const renderer = myp5.createCanvas(256, 256, myp5.WEBGL);

      // start color: (255, 255, 255)
      // end color: (255, 0, 0)
      // Intermediate values are expected to be approximately half the value.

      renderer.beginShape();
      renderer.fill(255);
      renderer.vertex(-128, -128);
      renderer.fill(255, 0, 0);
      renderer.bezierVertex(128, -128, 128, 128, -128, 128);
      renderer.endShape();

      assert.deepEqual(myp5.get(128, 127), [255, 129, 129, 255]);

      done();
    });

    test('bezierVertex() should interpolate curStrokeColor', function(done) {
      const renderer = myp5.createCanvas(256, 256, myp5.WEBGL);

      // start color: (255, 255, 255)
      // end color: (255, 0, 0)
      // Intermediate values are expected to be approximately half the value.

      renderer.strokeWeight(5);
      renderer.beginShape();
      myp5.noFill();
      renderer.stroke(255);
      renderer.vertex(-128, -128);
      renderer.stroke(255, 0, 0);
      renderer.bezierVertex(128, -128, 128, 128, -128, 128);
      renderer.endShape();

      assert.deepEqual(myp5.get(190, 127), [255, 128, 128, 255]);

      done();
    });

    test('quadraticVertex() should interpolate curFillColor', function(done) {
      const renderer = myp5.createCanvas(256, 256, myp5.WEBGL);

      // start color: (255, 255, 255)
      // end color: (255, 0, 0)
      // Intermediate values are expected to be approximately half the value.

      renderer.beginShape();
      renderer.fill(255);
      renderer.vertex(-128, -128);
      renderer.fill(255, 0, 0);
      renderer.quadraticVertex(256, 0, -128, 128);
      renderer.endShape();

      assert.deepEqual(myp5.get(128, 127), [255, 128, 128, 255]);

      done();
    });

    test('quadraticVertex() should interpolate curStrokeColor', function(done) {
      const renderer = myp5.createCanvas(256, 256, myp5.WEBGL);

      // start color: (255, 255, 255)
      // end color: (255, 0, 0)
      // Intermediate values are expected to be approximately half the value.

      renderer.strokeWeight(5);
      renderer.beginShape();
      myp5.noFill();
      renderer.stroke(255);
      renderer.vertex(-128, -128);
      renderer.stroke(255, 0, 0);
      renderer.quadraticVertex(256, 0, -128, 128);
      renderer.endShape();

      assert.deepEqual(myp5.get(190, 127), [255, 128, 128, 255]);

      done();
    });

    test('geometry without stroke colors use curStrokeColor', function(done) {
      const renderer = myp5.createCanvas(256, 256, myp5.WEBGL);
      myp5.background(255);
      myp5.fill(255);
      myp5.stroke(0);
      myp5.strokeWeight(4);
      myp5.rectMode(myp5.CENTER);
      myp5.rect(0, 0, myp5.width, myp5.height);

      assert.equal(renderer._useLineColor, false);
      assert.deepEqual(myp5.get(128, 0), [0, 0, 0, 255]);
      done();
    });

    test('geometry with stroke colors use their colors', function(done) {
      const renderer = myp5.createCanvas(256, 256, myp5.WEBGL);
      const myGeom = new p5.Geometry(1, 1, function() {
        this.gid = 'strokeColorTest';
        this.vertices.push(myp5.createVector(-128, -128));
        this.vertices.push(myp5.createVector(-128, 128));
        this.vertices.push(myp5.createVector(128, 128));
        this.vertices.push(myp5.createVector(128, -128));
        this.faces.push([0, 1, 2]);
        this.faces.push([0, 2, 3]);
        this.edges.push([0, 1]);
        this.edges.push([1, 2]);
        this.edges.push([2, 3]);
        this.edges.push([3, 0]);
        this.vertexStrokeColors.push(
          0, 0, 0, 1,
          1, 0, 0, 1,
          0, 0, 1, 1,
          0, 1, 0, 1
        );
        this._edgesToVertices();
      });
      myp5.background(255);
      myp5.fill(255);
      myp5.strokeWeight(4);
      myp5.stroke(0);
      myp5.model(myGeom);

      assert.equal(renderer._useLineColor, true);
      assert.deepEqual(myp5.get(128, 255), [127, 0, 128, 255]);
      done();
    });

    test('immediate mode uses stroke colors', function(done) {
      const renderer = myp5.createCanvas(256, 256, myp5.WEBGL);
      myp5.background(255);
      myp5.fill(255);
      myp5.strokeWeight(4);
      myp5.beginShape();
      myp5.stroke(0);
      myp5.vertex(-128, -128);
      myp5.stroke(255, 0, 0);
      myp5.vertex(-128, 128);
      myp5.stroke(0, 0, 255);
      myp5.vertex(128, 128);
      myp5.stroke(0, 255, 0);
      myp5.vertex(128, -128);
      myp5.endShape(myp5.CLOSE);

      assert.equal(renderer._useLineColor, true);
      assert.deepEqual(myp5.get(128, 255), [127, 0, 128, 255]);
      done();
    });
  });

  suite('interpolation of vertex colors', function(){
    test('immediate mode uses vertex colors (noLight)', function(done) {
      const renderer = myp5.createCanvas(256, 256, myp5.WEBGL);

      // upper color: (200, 0, 0, 255);
      // lower color: (0, 0, 200, 255);
      // expected center color: (100, 0, 100, 255);

      myp5.beginShape();
      myp5.fill(200, 0, 0);
      myp5.vertex(-128, -128);
      myp5.fill(200, 0, 0);
      myp5.vertex(128, -128);
      myp5.fill(0, 0, 200);
      myp5.vertex(128, 128);
      myp5.fill(0, 0, 200);
      myp5.vertex(-128, 128);
      myp5.endShape(myp5.CLOSE);

      assert.equal(renderer._useVertexColor, true);
      assert.deepEqual(myp5.get(128, 128), [100, 0, 100, 255]);
      done();
    });

    test('immediate mode uses vertex colors (light)', function(done) {
      const renderer = myp5.createCanvas(256, 256, myp5.WEBGL);

      myp5.directionalLight(255, 255, 255, 0, 0, -1);
      // diffuseFactor:0.73
      // so, expected color is (73, 0, 73, 255).

      myp5.beginShape();
      myp5.fill(200, 0, 0);
      myp5.vertex(-128, -128);
      myp5.fill(200, 0, 0);
      myp5.vertex(128, -128);
      myp5.fill(0, 0, 200);
      myp5.vertex(128, 128);
      myp5.fill(0, 0, 200);
      myp5.vertex(-128, 128);
      myp5.endShape(myp5.CLOSE);

      assert.equal(renderer._useVertexColor, true);
      assert.deepEqual(myp5.get(128, 128), [73, 0, 73, 255]);
      done();
    });

    test('geom without vertex colors use curFillCol (noLight)', function(done) {
      const renderer = myp5.createCanvas(256, 256, myp5.WEBGL);

      // expected center color is curFillColor.

      myp5.fill(200, 0, 200);
      myp5.rectMode(myp5.CENTER);
      myp5.rect(0, 0, myp5.width, myp5.height);

      assert.equal(renderer._useVertexColor, false);
      assert.deepEqual(myp5.get(128, 128), [200, 0, 200, 255]);
      done();
    });

    test('geom without vertex colors use curFillCol (light)', function(done) {
      const renderer = myp5.createCanvas(256, 256, myp5.WEBGL);

      myp5.directionalLight(255, 255, 255, 0, 0, -1);
      // diffuseFactor:0.73
      // so, expected color is (146, 0, 146, 255).

      myp5.fill(200, 0, 200);
      myp5.rectMode(myp5.CENTER);
      myp5.rect(0, 0, myp5.width, myp5.height);

      assert.equal(renderer._useVertexColor, false);
      assert.deepEqual(myp5.get(128, 128), [146, 0, 146, 255]);
      done();
    });

    test('geom with vertex colors use their color (noLight)', function(done) {
      const renderer = myp5.createCanvas(256, 256, myp5.WEBGL);

      // upper color: (200, 0, 0, 255);
      // lower color: (0, 0, 200, 255);
      // expected center color: (100, 0, 100, 255);

      const myGeom = new p5.Geometry(1, 1, function() {
        this.gid = 'vertexColorTestWithNoLights';
        this.vertices.push(myp5.createVector(-128, -128));
        this.vertices.push(myp5.createVector(128, -128));
        this.vertices.push(myp5.createVector(128, 128));
        this.vertices.push(myp5.createVector(-128, 128));
        this.faces.push([0, 1, 2]);
        this.faces.push([0, 2, 3]);
        this.vertexColors.push(
          200/255, 0, 0, 1,
          200/255, 0, 0, 1,
          0, 0, 200/255, 1,
          0, 0, 200/255, 1
        );
        this.computeNormals();
      });

      myp5.noStroke();
      myp5.model(myGeom);

      assert.equal(renderer._useVertexColor, true);
      assert.deepEqual(myp5.get(128, 128), [100, 0, 100, 255]);
      done();
    });

    test('geom with vertex colors use their color (light)', function(done) {
      const renderer = myp5.createCanvas(256, 256, myp5.WEBGL);

      const myGeom = new p5.Geometry(1, 1, function() {
        this.gid = 'vertexColorTestWithLighs';
        this.vertices.push(myp5.createVector(-128, -128));
        this.vertices.push(myp5.createVector(128, -128));
        this.vertices.push(myp5.createVector(128, 128));
        this.vertices.push(myp5.createVector(-128, 128));
        this.faces.push([0, 1, 2]);
        this.faces.push([0, 2, 3]);
        this.vertexColors.push(
          200/255, 0, 0, 1,
          200/255, 0, 0, 1,
          0, 0, 200/255, 1,
          0, 0, 200/255, 1
        );
        this.computeNormals();
      });

      myp5.directionalLight(255, 255, 255, 0, 0, -1);
      // diffuseFactor:0.73
      // so, expected color is (73, 0, 73, 255).
      myp5.noStroke();
      myp5.model(myGeom);

      assert.equal(renderer._useVertexColor, true);
      assert.deepEqual(myp5.get(128, 128), [73, 0, 73, 255]);
      done();
    });
  });

  suite('Test for register availability', function() {
    test('register enable/disable flag test', function(done) {
      const renderer = myp5.createCanvas(16, 16, myp5.WEBGL);

      // geometry without aTexCoord.
      const myGeom = new p5.Geometry(1, 1, function() {
        this.gid = 'registerEnabledTest';
        this.vertices.push(myp5.createVector(-8, -8));
        this.vertices.push(myp5.createVector(8, -8));
        this.vertices.push(myp5.createVector(8, 8));
        this.vertices.push(myp5.createVector(-8, 8));
        this.faces.push([0, 1, 2]);
        this.faces.push([0, 2, 3]);
        this.computeNormals();
      });

      myp5.fill(255);
      myp5.noStroke();
      myp5.directionalLight(255, 255, 255, 0, 0, -1);

      myp5.triangle(-8, -8, 8, -8, 8, 8);

      // get register location of
      // lightingShader's aTexCoord attribute.
      const attributes = renderer._curShader.attributes;
      const loc = attributes.aTexCoord.location;

      assert.equal(renderer.registerEnabled[loc], true);

      myp5.model(myGeom);
      assert.equal(renderer.registerEnabled[loc], false);

      myp5.triangle(-8, -8, 8, 8, -8, 8);
      assert.equal(renderer.registerEnabled[loc], true);

      done();
    });
  });

  suite('setAttributes', function() {
    test('It leaves a reference to the correct canvas', function(done) {
      const renderer = myp5.createCanvas(10, 10, myp5.WEBGL);
      assert.equal(myp5.canvas, renderer.canvas);

      myp5.setAttributes({ alpha: true });
      assert.equal(myp5.canvas, renderer.canvas);
      done();
    });
  });
});
