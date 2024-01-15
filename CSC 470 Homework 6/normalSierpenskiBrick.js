var canvas;
var gl;

var points = [];
var uvPoints = [];
var normalPoints = [];

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

var normalMatrix;
var normalMatrixLoc;

var normalMapLoc;

var near    = 0.0001;
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

    gl.enable(gl.DEPTH_TEST);
    gl.clearDepth(0.0);
    gl.depthFunc(gl.GREATER);
    
    // Load shaders and initialize attribute buffers
    var program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    const vertices = [
        vec3( -0.5, -0.5,  0.5), // A
        vec3( -0.5,  0.5,  0.5), // B 
        vec3(  0.5, -0.5,  0.5), // C
        vec3(  0.5,  0.5,  0.5), // D
        vec3( -0.5, -0.5, -0.5), // E
        vec3( -0.5,  0.5, -0.5), // F
        vec3(  0.5, -0.5, -0.5), // G
        vec3(  0.5,  0.5, -0.5)  // H
    ];

    // Construct an Array by repeating `pattern` n times
    function repeat(n, pattern) {
        return [...Array(n)].reduce(sum => sum.concat(pattern), []);
    }

    var normalData = [
        ...repeat(6 * Math.pow(8, numTimesToSubdivide), vec3(0, 1, 0)),  //   +Y
        ...repeat(6 * Math.pow(8, numTimesToSubdivide), vec3(-1, 0, 0)), //   -X
        ...repeat(6 * Math.pow(8, numTimesToSubdivide), vec3(0, -1, 0)), //   -Y
        ...repeat(6 * Math.pow(8, numTimesToSubdivide), vec3(1, 0, 0)),  //   +X
        ...repeat(6 * Math.pow(8, numTimesToSubdivide), vec3(0, 0, 1)),  //   +Z
        ...repeat(6 * Math.pow(8, numTimesToSubdivide), vec3(0, 0, -1))  //   -Z
    ]
    normalPoints.push(normalData);

    divideCube(vertices[3], vertices[7], vertices[1], vertices[5], numTimesToSubdivide);
    divideCube(vertices[1], vertices[0], vertices[5], vertices[4], numTimesToSubdivide);
    divideCube(vertices[2], vertices[6], vertices[0], vertices[4], numTimesToSubdivide);
    weirdRightSide++;
    divideCube(vertices[2], vertices[3], vertices[6], vertices[7], numTimesToSubdivide);
    weirdRightSide--;
    divideCube(vertices[3], vertices[2], vertices[1], vertices[0], numTimesToSubdivide);
    divideCube(vertices[5], vertices[4], vertices[7], vertices[6], numTimesToSubdivide);
    
    // Load the data into the GPU
    var bufferId = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferId);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW);

    // Associate out shader variables with our data buffer
    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    var uvBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(uvPoints), gl.STATIC_DRAW);

    var uvLocation = gl.getAttribLocation(program, 'uv');
    gl.vertexAttribPointer(uvLocation, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(uvLocation);

    var normalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(normalPoints), gl.STATIC_DRAW);
    
    var normalLocation = gl.getAttribLocation(program, 'normal');
    gl.vertexAttribPointer(normalLocation, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(normalLocation);
    
    // Resource Loading
    //const brick = loadTexture("default_brick.png");
    const diffuseMap = loadTexture("brickwork_texture.png");
    const normalMap = loadTexture("brickwork_normal_map.png");

    function loadTexture(url){
        const texture = gl.createTexture();
        const image = new Image();
    
        image.onload = e => {
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
            gl.generateMipmap(gl.TEXTURE_2D);
        };
    
        image.src = url;
        return texture;
    }

    // Get the location of the uniform variables
    thetaLoc = gl.getUniformLocation(program, "theta");
    modelViewMatrixLoc = gl.getUniformLocation( program, "modelViewMatrix" );
    projectionMatrixLoc = gl.getUniformLocation( program, "projectionMatrix" );
    textureID = gl.getUniformLocation(program, 'textureID');
    normalMapLoc = gl.getUniformLocation(program, 'normalMap'); 
    normalMatrixLoc = gl.getUniformLocation(program, 'normalMatrix');

    gl.uniform1i(textureID, 0);
    gl.uniform1i(normalMapLoc, 1);

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

    // Setup a ui
    webglLessonsUI.setupSlider("#Radius", {value: radius, slide: updateRadius, min: 0.1, max: 10, step: 0.1, precision: 1});
    webglLessonsUI.setupSlider("#ThetaInRadians", {value: cameraTheta, slide: updateTheta, min: -3.14, max: 3.14, step: 0.01, precision: 2});
    webglLessonsUI.setupSlider("#PhiInRadians", {value: phi, slide: updatePhi, min: -3.14, max: 3.14, step: 0.01, precision: 2});

    function updateRadius(event, ui){
        radius = ui.value;
        render();
    }

    function updateTheta(event, ui){
        cameraTheta = ui.value;
        render();
    }

    function updatePhi(event, ui){
        phi = ui.value;
        render();
    }

    modelViewMatrix = glMatrix.mat4.create();
    normalMatrix = glMatrix.mat4.create();
    
    // Start rendering
    startTexture(textureID, normalMapLoc, diffuseMap, normalMap);

};

function square(a, b, c, d){
    if(weirdRightSide == 0){
        points.push(a, b, c, c, b, d);
        uvPoints.push(vec2(0, 0), vec2(0, 1), vec2(1, 0), vec2(1, 0), vec2(0, 1), vec2(1, 1));
    }
    else{
        points.push(a, b, c, c, d, b);
        uvPoints.push(vec2(1, 1), vec2(1, 0), vec2(0, 1), vec2(0, 1), vec2(0, 0), vec2(1, 0));
    }
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
        uvPoints = [];
        normalPoints = [];
        init();
    };

    const at = vec3(0.0, 0.0, 0.0);
    const up = vec3(0.0, 1.0, 0.0);

    // Draw the resulting Sierpinski Gasket
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    eye = vec3(radius * Math.sin(cameraTheta) * Math.cos(phi), radius * Math.sin(cameraTheta) * Math.sin(phi), radius * Math.cos(cameraTheta));
    glMatrix.mat4.lookAt(modelViewMatrix, eye, at , up);
    projectionMatrix = perspective(fovy, aspect, near, far);

    glMatrix.mat4.invert(normalMatrix, modelViewMatrix);
    glMatrix.mat4.transpose(normalMatrix, normalMatrix);
    
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));
    gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix));
    gl.uniformMatrix4fv(normalMatrixLoc, false, normalMatrix);

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
        uvPoints = [];
        normalPoints = [];
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

function startTexture(textureID, normalMapLoc, diffuseMap, normalMap){
    var interval = setInterval(function(){
        if(modeToRepeat == 0){
            /*  I used the loaded texture & normal map info here rather
                than in the init function to fix a bug where the resulting
                project would sometimes appear black and white and look
                like something from a 1920s horror film.
                
                This interval was needed for Homeworks 5 & 6.
            */
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, diffuseMap);
            gl.activeTexture(gl.TEXTURE1);
            gl.bindTexture(gl.TEXTURE_2D, normalMap);
            frame = requestAnimationFrame(render);   
        }    
        else
            clearInterval(interval);
    }, 5);
}
