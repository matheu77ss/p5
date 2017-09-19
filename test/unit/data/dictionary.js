suite('Dictionary Objects', function() {
  var myp5 = new p5(function( p ) {
    p.setup = function() {};
    p.draw = function() {};
  });

  teardown(function(){
    myp5.clear();
  });

  var stringDict = myp5.createStringDict('happy', 'coding');
  var numberDict = myp5.createNumberDict(1, 2);

  suite('p5.prototype.stringDict', function() {
    test('should be created', function() {
      assert.isTrue(stringDict instanceof p5.StringDict);
    });

    test('has correct structure', function() {
      assert.deepEqual(JSON.stringify(stringDict),
      JSON.stringify({data:{'happy':'coding'}}));
    });

    test('should have correct size', function() {
      var amt = stringDict.size();
      assert.isTrue(amt === Object.keys(stringDict.data).length);
    });

    test('should add new key-value pairs', function() {
      stringDict.create('fun', 'coding');
      assert.deepEqual(stringDict.get('fun'), 'coding');
    });

    test('should add objects', function() {
      stringDict.create({'p5': 'js', 'open': 'source'});
      assert.deepEqual(stringDict.get('open'), 'source');
    });

    test('should change existing values', function() {
      stringDict.set('fun', 'times');
      assert.deepEqual(stringDict.get('fun'),'times');
    });

    test('should clear', function() {
      stringDict.clear();
      assert.deepEqual(stringDict.data, {});
    });
  });

  suite('p5.prototype.numberDict', function() {
    test('should be created', function() {
      assert.isTrue(numberDict instanceof p5.NumberDict);
    });

    test('has correct structure', function() {
      assert.deepEqual(JSON.stringify(numberDict),
       JSON.stringify({data:{1:2}}));
    });


    test('should have correct size', function() {
      var amt = numberDict.size();
      assert.isTrue(amt === Object.keys(numberDict.data).length);
    });


    test('should add new key-value pairs', function() {
      numberDict.create(3, 4);
      assert.deepEqual(numberDict.get(3), 4);
    });


    test('should change existing values', function() {
      numberDict.set(1, 5);
      assert.deepEqual(numberDict.get(1),5);
    });


    test('should add values together', function() {
      numberDict.add(1, 4);
      assert.deepEqual(numberDict.get(1), 9);
    });

    test('should subtract from value', function() {
      numberDict.sub(1, 3);
      assert.deepEqual(numberDict.get(1), 6);
    });

    test('should divide from value', function() {
      numberDict.div(1, 3);
      assert.deepEqual(numberDict.get(1), 2);
    });

    test('should multiply value', function() {
      numberDict.mult(1, 3);
      assert.deepEqual(numberDict.get(1), 6);
    });

    test('should find minimum value', function() {
      assert.deepEqual(numberDict.minValue(), 4);
    });

    test('should find maximum value', function() {
      assert.deepEqual(numberDict.maxValue(), 6);
    });

    test('should clear', function() {
      numberDict.clear();
      assert.deepEqual(numberDict.data, {});
    });
  });
});
