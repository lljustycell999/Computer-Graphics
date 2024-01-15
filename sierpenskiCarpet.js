var canvas;
var gl;

var points = [];
var numTimesToSubdivide = 0;

//var theta = 0.0;
//var thetaLoc;

function init(){

    //const rotateBtn = document.querySelector("#rotateBtn");
    //rotateBtn.addEventListener("click", animate);
    
    canvas = document.getElementById("gl-canvas");
    gl = WebGLUtils.setupWebGL( canvas );
    if (!gl){ 
        alert( "WebGL isn't available" ); 
    }

    //  Configure WebGL

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(1.0, 1.0, 1.0, 1.0);

    //Load shaders and initialize attribute buffers

    var program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    // Initialize the corners of our gasket with four points.

    var vertices = [
        vec2(-0.6, -0.6),   //A
        vec2(-0.6, 0.6),    //B
        vec2(0.6, -0.6),    //C
        vec2(0.6, 0.6)      //D
    ];
    divideSquare(vertices[0], vertices[1], vertices[2], vertices[3], numTimesToSubdivide);

    // Load the data into the GPU

    var bufferId = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferId);
    gl.bufferData(gl.ARRAY_BUFFER, 50000000, gl.STATIC_DRAW);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, flatten(points));

    // Associate out shader variables with our data buffer

    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    //thetaLoc = gl.getUniformLocation(program, "theta");
    
    document.getElementById("slider").onchange = function(event){
        numTimesToSubdivide = parseInt(event.target.value);
    };
    render();
    //animate();
    
};

function square(a, b, c, d){
    points.push(a, b, c, c, b, d);
};

function divideSquare(a, b, c, d, count){

    // check for end of recursion

    if(count === 0) {
        square(a, b, c, d);
    }
    else {

        //bisect the sides
        var ab = mix(a, b, 0.333); 
        var ba = mix(b, a, 0.333);
        var bd = mix(b, d, 0.333);
        var db = mix(d, b, 0.333);
        var dc = mix(d, c, 0.333);
        var cd = mix(c, d, 0.333);
        var ca = mix(c, a, 0.333);
        var ac = mix(a, c, 0.333);

        var bdac = mix(bd, ac, 0.333);
        var dbca = mix(db, ca, 0.333);
        var acbd = mix(ac, bd, 0.333);
        var cadb = mix(ca, db, 0.333);

        count--;

        divideSquare(b, bd, ba, bdac, count);
        divideSquare(bd, db, bdac, dbca, count);
        divideSquare(db, d, dbca, dc, count);
        divideSquare(ba, bdac, ab, acbd, count);
        //square(bdac, dbca, acbd, cadb); DO NOT DRAW CENTER SQUARE
        divideSquare(dbca, dc, cadb, cd, count);
        divideSquare(ab, acbd, a, ac, count);
        divideSquare(acbd, cadb, ac, ca, count);
        divideSquare(cadb, cd, ca, c, count);
    }
};

window.onload = init;

function render(){
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, points.length);
    points = [];
    requestAnimFrame(init);
};

/*
function animate(){

    gl.clear(gl.COLOR_BUFFER_BIT);

    theta += 0.03;
    gl.uniform1f(thetaLoc, theta);
  
    gl.drawArrays(gl.TRIANGLES, 0, points.length);

    points = [];
    requestAnimFrame(init);
    
};
*/