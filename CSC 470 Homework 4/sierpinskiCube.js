var canvas;
var gl;

var points = [];
var colors = [];

var numTimesToSubdivide = 0;

var theta = [0, 0, 0];
var axis;

var thetaLoc;
var frame;

var weirdRightSide = 0;

var modeToRepeat = 0;    // 0 for render and 1 for animate
var rotateDirection = 0; // 0 for clockwise and 1 for counterclockwise

var xbuttonPressed = 0;
var ybuttonPressed = 0;
var zbuttonPressed = 0;

var modelViewMatrix, projectionMatrix;
var modelViewMatrixLoc, projectionMatrixLoc;
var eye;

var near    = 0.00;
var far     = 12;
var radius  = 2.5;
var cameraTheta = 0.0;
var phi     = 0.0;
var fovy    = 45.0;              
var aspect  = 1.0;

function init(){

    // Prepare the WebGL canvas
    canvas = document.getElementById("gl-canvas");
    gl = WebGLUtils.setupWebGL( canvas );
    if(!gl)
        alert( "WebGL isn't available" );

    // Configure WebGL
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(1.0, 1.0, 1.0, 1.0);

    var vertices = [
        vec3( -0.5, -0.5,  0.5), // A
        vec3( -0.5,  0.5,  0.5), // B
        vec3(  0.5, -0.5,  0.5), // C
        vec3(  0.5,  0.5,  0.5), // D
        vec3( -0.5, -0.5, -0.5), // E
        vec3( -0.5,  0.5, -0.5), // F
        vec3(  0.5, -0.5, -0.5), // G
        vec3(  0.5,  0.5, -0.5)  // H
    ];
    
    var vertexColors = [
        [ 0.0, 0.0, 0.0, 1.0 ],  // black
        [ 1.0, 0.0, 0.0, 1.0 ],  // red
        [ 1.0, 1.0, 0.0, 1.0 ],  // yellow
        [ 0.0, 1.0, 0.0, 1.0 ],  // green
        [ 0.0, 0.0, 1.0, 1.0 ],  // blue
        [ 1.0, 0.0, 1.0, 1.0 ],  // magenta
        [ 0.0, 1.0, 1.0, 1.0 ],  // cyan
        [ 1.0, 1.0, 1.0, 1.0 ]   // white
    ];

    divideCube(vertices[3], vertices[7], vertices[1], vertices[5], numTimesToSubdivide);
    divideCube(vertices[1], vertices[0], vertices[5], vertices[4], numTimesToSubdivide);
    divideCube(vertices[2], vertices[6], vertices[0], vertices[4], numTimesToSubdivide);
    weirdRightSide++;
    divideCube(vertices[2], vertices[3], vertices[6], vertices[7], numTimesToSubdivide);
    weirdRightSide--;
    divideCube(vertices[3], vertices[2], vertices[1], vertices[0], numTimesToSubdivide);
    divideCube(vertices[5], vertices[4], vertices[7], vertices[6], numTimesToSubdivide);
    
    for(var i = 0; i < points.length; i++){
        var rand = Math.floor(Math.random() * vertexColors.length);
        colors.push(vertexColors[rand]);
    }

    gl.enable(gl.DEPTH_TEST);
    
    // Load shaders and initialize attribute buffers
    var program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    var cBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW );

    var vColor = gl.getAttribLocation( program, "vColor" );
    gl.vertexAttribPointer( vColor, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vColor );

    // Load the data into the GPU
    var bufferId = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferId);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW);
    //gl.bufferSubData(gl.ARRAY_BUFFER, 0, flatten(points));

    // Associate out shader variables with our data buffer
    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    // Get the location of the uniform variables
    thetaLoc = gl.getUniformLocation(program, "theta");
    modelViewMatrixLoc = gl.getUniformLocation( program, "modelViewMatrix" );
    projectionMatrixLoc = gl.getUniformLocation( program, "projectionMatrix" );

    // Event Listener for Rotate Buttons
    document.getElementById("rotateXBtn").onclick = function () {
        if(ybuttonPressed == 1 || zbuttonPressed == 1){
            xbuttonPressed = 1;
            ybuttonPressed = 0;
            zbuttonPressed = 0;
            axis = 0;
        }
        else if(xbuttonPressed == 0){
            xbuttonPressed = 1;
            ybuttonPressed = 0;
            zbuttonPressed = 0;
            axis = 0;
            changeMode();    
        }
        else{
            xbuttonPressed = 0;
            ybuttonPressed = 0;
            zbuttonPressed = 0;
            changeMode();
        }
    };

    document.getElementById("rotateYBtn").onclick = function () {
        if(xbuttonPressed == 1 || zbuttonPressed == 1){
            xbuttonPressed = 0;
            ybuttonPressed = 1;
            zbuttonPressed = 0;
            axis = 1;
        }
        else if(ybuttonPressed == 0){
            xbuttonPressed = 0;
            ybuttonPressed = 1;
            zbuttonPressed = 0;
            axis = 1;
            changeMode();    
        }
        else{
            xbuttonPressed = 0;
            ybuttonPressed = 0;
            zbuttonPressed = 0;
            changeMode();
        }
    };

    document.getElementById("rotateZBtn").onclick = function () {
        if(xbuttonPressed == 1 || ybuttonPressed == 1){
            xbuttonPressed = 0;
            ybuttonPressed = 0;
            zbuttonPressed = 1;
            axis = 2;
        }
        else if(zbuttonPressed == 0){
            xbuttonPressed = 0;
            ybuttonPressed = 0;
            zbuttonPressed = 1;
            axis = 2;
            changeMode();    
        }
        else{
            xbuttonPressed = 0;
            ybuttonPressed = 0;
            zbuttonPressed = 0;
            changeMode();
        }
    };
    
    // Onchange function for Subdivision Slider
    document.getElementById("slider").onchange = function(event){
        numTimesToSubdivide = parseInt(event.target.value);
    };

    document.getElementById("radiusSlider").onchange = function(event) {
       radius = event.target.value;
       init();
    };
    document.getElementById("thetaSlider").onchange = function(event) {
        cameraTheta = event.target.value * Math.PI/180.0;
        init();
    };
    document.getElementById("phiSlider").onchange = function(event) {
        phi = event.target.value * Math.PI/180.0;
        init();
    };

    // Start rendering
    render();

};

function square(a, b, c, d){
    if(weirdRightSide == 0)
        points.push(a, b, c, c, b, d);
    else
        points.push(a, b, c, c, d, b);
};

function divideCube(a, b, c, d, count){

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

        divideCube(b, bd, ba, bdac, count);
        divideCube(bd, db, bdac, dbca, count);
        divideCube(db, d, dbca, dc, count);
        divideCube(ba, bdac, ab, acbd, count);
        divideCube(dbca, dc, cadb, cd, count);
        divideCube(ab, acbd, a, ac, count);
        divideCube(acbd, cadb, ac, ca, count);
        divideCube(cadb, cd, ca, c, count);
    }

};

window.onload = init;

function render(){

    // Changing the subdivision value is the only reason to call
    // init() again
    document.getElementById("slider").onchange = function(event){
        numTimesToSubdivide = parseInt(event.target.value);
        // Remove the previous vertices, otherwise the 
        // subdivisions will not work
        points = [];
        //colors = [];
        init();
    };

    const at = vec3(0.0, 0.0, 0.0);
    const up = vec3(0.0, 1.0, 0.0);

    // Draw the resulting Sierpinski Gasket
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    eye = vec3(radius * Math.sin(cameraTheta) * Math.cos(phi), radius * Math.sin(cameraTheta) * Math.sin(phi), radius * Math.cos(cameraTheta));
    modelViewMatrix = lookAt(eye, at , up);
    projectionMatrix = perspective(fovy, aspect, near, far);

    gl.uniformMatrix4fv( modelViewMatrixLoc, false, flatten(modelViewMatrix) );
    gl.uniformMatrix4fv( projectionMatrixLoc, false, flatten(projectionMatrix) );

    gl.uniform3fv(thetaLoc, theta);
    gl.drawArrays(gl.TRIANGLES, 0, points.length);
};

function animate(){

    // Make it possible to change the rotation direction by clicking on the canvas
    canvas.addEventListener("click", changeDirection);
    
    // Changing the subdivision value is the only reason to call
    // init() again
    document.getElementById("slider").onchange = function(event){
        numTimesToSubdivide = parseInt(event.target.value);
        // Remove the previous vertices, otherwise the 
        // subdivisions will not work
        points = [];
        //colors = [];
        init();
    };

    // Every 10 milliseconds, get the next frame with the updated theta value.
    // Once the button is pressed again, stop getting frames by clearing the interval.
    var interval = setInterval(function(){
        if(modeToRepeat == 1){
            if(rotateDirection == 0)
                theta[axis] -= 0.50;
            else
                theta[axis] += 0.50;
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
