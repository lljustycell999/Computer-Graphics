var canvas;
var gl;

var points = [];
var numTimesToSubdivide = 0;

var theta = [0, 0, 0];
var thetaLoc;
var frame;

var modeToRepeat = 0;    // 0 for render and 1 for animate
var rotateDirection = 0; // 0 for clockwise and 1 for counterclockwise

function init(){

    // Prepare the WebGL canvas
    canvas = document.getElementById("gl-canvas");
    gl = WebGLUtils.setupWebGL( canvas );
    if(!gl)
        alert( "WebGL isn't available" );

    // Configure WebGL
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(1.0, 1.0, 1.0, 1.0);

    // Load shaders and initialize attribute buffers
    var program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    // Initialize the corners of our gasket with four points.
    var vertices = [
        vec2(-0.6, -0.6),   //A
        vec2(-0.6, 0.6),    //B
        vec2(0.6, -0.6),    //C
        vec2(0.6, 0.6)      //D
    ];

    // Perform the subdivisions
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

    // Get the location of the uniform variables
    thetaLoc = gl.getUniformLocation(program, "theta");

    // Event Listener for Rotate Button
    var rotateBtn = document.querySelector("#rotateBtn");
    rotateBtn.addEventListener("click", changeMode);
    
    // Onchange function for Subdivision Slider
    document.getElementById("slider").onchange = function(event){
        numTimesToSubdivide = parseInt(event.target.value);
    };

    // Start rendering
    render();

};

function square(a, b, c, d){
    points.push(a, b, c, c, b, d);
};

function divideSquare(a, b, c, d, count){

    // Check for end of recursion
    if(count === 0)
        square(a, b, c, d);
    else {
        // Bisect the sides
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
        divideSquare(dbca, dc, cadb, cd, count);
        divideSquare(ab, acbd, a, ac, count);
        divideSquare(acbd, cadb, ac, ca, count);
        divideSquare(cadb, cd, ca, c, count);
    }

};
window.onload = init;

function render(){
    var rotateBtnTwo = document.querySelector("#rotateBtn");
    rotateBtnTwo.addEventListener("click", changeMode);

    // Changing the subdivision value is the only reason to call
    // init() again
    document.getElementById("slider").onchange = function(event){
        numTimesToSubdivide = parseInt(event.target.value);
        // Remove the previous vertices, otherwise the 
        // subdivisions will not work
        points = [];
        init();
    };

    // Draw the resulting Sierpinski Gasket
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform3fv(thetaLoc, theta);
    gl.drawArrays(gl.TRIANGLES, 0, points.length);
};

function animate(){
    var rotateBtnThree = document.querySelector("#rotateBtn");
    rotateBtnThree.addEventListener("click", changeMode);
    
    // Make it possible to change the rotation direction by clicking on the canvas
    canvas.addEventListener("click", changeDirection);
    
    // Changing the subdivision value is the only reason to call
    // init() again
    document.getElementById("slider").onchange = function(event){
        numTimesToSubdivide = parseInt(event.target.value);
        // Remove the previous vertices, otherwise the 
        // subdivisions will not work
        points = [];
        init();
    };

    // Every 10 milliseconds, get the next frame with the updated theta value.
    // Once the button is pressed again, stop getting frames by clearing the interval.
    var interval = setInterval(function(){
        if(modeToRepeat == 1){
            if(rotateDirection == 0)
                theta[2] -= 0.50;
            else
                theta[2] += 0.50;
            frame = requestAnimationFrame(render);       
        }
        else
            clearInterval(interval);
    }, 10);
};

// Used to properly change from render() to animate() and vice versa
function changeMode(){
    if(modeToRepeat == 0){
        modeToRepeat = 1;
        animate();
    }
    else{
        modeToRepeat = 0;
        // When we are not animating, remove the ability to click on the canvas to change the
        // rotation direction
        canvas.removeEventListener("click", changeDirection);
        render();
    }
};

// Used to notify animate() to go from incrementing theta to decrementing 
// theta and vice versa
function changeDirection(){
    if(rotateDirection == 0)
        rotateDirection = 1;
    else
        rotateDirection = 0;
};
