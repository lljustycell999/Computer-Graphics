// Disco Ball 
var vertexData;
var colors = [];
var projectionMatrix = glMatrix.mat4.create();
var modelMatrix = glMatrix.mat4.create();
var viewMatrix = glMatrix.mat4.create();
var mvMatrix = glMatrix.mat4.create();
var mvpMatrix = glMatrix.mat4.create();
var matrixLoc;
const canvas = document.querySelector('canvas');
const gl = canvas.getContext('webgl');

// Disco Floor
var squarePoints = [];
var colorPoints = [];
var normalPoints = [];
var lightPoints = [];
var squareMatrix = glMatrix.mat4.create();
var squareMatrixLoc;
var squareProgram;
var avoid = 0;
const canvasTwo = document.getElementById("danceTiles")
const gl2 = canvasTwo.getContext('webgl');

// Night Sky
var nightPoints = [];
var uvPoints = [];
var moreNormalPoints = [];
var normalMap;
var textureID;
var normalMapLoc;
var anotherSquareMatrixLoc;
var nightProgram;
const canvasThree = document.getElementById("nightSky")
const gl3 = canvasThree.getContext('webgl');

window.onload = init;
initTwo();
initThree();

function init(){
    if(!gl)
        throw new Error('WebGL not supported');

    vertexData = discoBall(80000);

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexData), gl.STATIC_DRAW);

    const colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

    const vertexShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertexShader, `
    precision mediump float;

    attribute vec3 position;
    attribute vec3 vColors;

    varying vec3 vColor;

    uniform mat4 matrix;

    void main() {
        vColor = vColors;
        gl_Position = matrix * vec4(position, 1);
    }
    `);
    gl.compileShader(vertexShader);

    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragmentShader, `
    precision mediump float;

    varying vec3 vColor;

    void main() {
        gl_FragColor = vec4(vColor, 1.0);
    }
    `); //Note: vec4(r, g, b, a) for the fragment shader. When a = 1, the image is not going to be transparent
    gl.compileShader(fragmentShader);

    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    const positionLocation = gl.getAttribLocation(program, `position`);
    gl.enableVertexAttribArray(positionLocation);
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0);

    const colorLocation = gl.getAttribLocation(program, `vColors`);
    gl.enableVertexAttribArray(colorLocation);
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.vertexAttribPointer(colorLocation, 3, gl.FLOAT, false, 0, 0);

    gl.useProgram(program);
    gl.enable(gl.DEPTH_TEST);

    matrixLoc = gl.getUniformLocation(program, `matrix`);

    glMatrix.mat4.perspective(projectionMatrix,
        50 * Math.PI / 180,             //Vertical field-of-view (angle, radians)
        canvas.width / canvas.height,   //Aspect Ratio (W/H)
        0.0001,                         // Near cull distance (How close can objects get to camera before they go out of camera & sight)
        10000                          //Far cull distance (How far away can objects get before they disapper)
    );

    glMatrix.mat4.translate(modelMatrix, modelMatrix, [-1.5, 0, -2]);
    glMatrix.mat4.translate(viewMatrix, viewMatrix, [-2, 0, 1]);
    glMatrix.mat4.invert(viewMatrix, viewMatrix);

    animateDiscoBall();
}

function initTwo(){

    if(!gl2){
        throw new Error('WebGL not supported');
    }

    danceFloor();

    const squarePositionBuffer = gl2.createBuffer();
    gl2.bindBuffer(gl.ARRAY_BUFFER, squarePositionBuffer);
    gl2.bufferData(gl.ARRAY_BUFFER, new Float32Array(squarePoints), gl2.STATIC_DRAW);

    var squareColorBuffer = gl2.createBuffer();
    gl2.bindBuffer(gl.ARRAY_BUFFER, squareColorBuffer);
    gl2.bufferData(gl.ARRAY_BUFFER, flatten(colorPoints), gl2.STATIC_DRAW);

    const squareNormalBuffer = gl2.createBuffer();
    gl2.bindBuffer(gl.ARRAY_BUFFER, squareNormalBuffer);
    gl2.bufferData(gl.ARRAY_BUFFER, flatten(normalPoints), gl2.STATIC_DRAW);

    const squareLightBuffer = gl2.createBuffer();
    gl2.bindBuffer(gl.ARRAY_BUFFER, squareLightBuffer);
    gl2.bufferData(gl.ARRAY_BUFFER, flatten(lightPoints), gl2.STATIC_DRAW);

    const squareVertexShader = gl2.createShader(gl2.VERTEX_SHADER);
    gl2.shaderSource(squareVertexShader, `
    precision mediump float;

    const float ambient = 0.1;

    attribute vec3 position;
    attribute vec3 normal;
    attribute vec3 vColors;
    attribute vec3 lightDirection;

    varying vec3 vColor;
    varying float vBrightness;
    varying vec3 vLightDirection;

    uniform mat4 normalMatrix;

    void main() {
        gl_Position = vec4(position, 1);

        vec3 worldNormal = (normalMatrix * vec4(normal, 1.0)).xyz;
        float diffuse = max(0.0, dot(worldNormal, lightDirection));

        vColor = vColors;
        vBrightness = diffuse + ambient;
        vLightDirection = lightDirection;

    }
    `);
    gl2.compileShader(squareVertexShader);

    const squareFragmentShader = gl2.createShader(gl2.FRAGMENT_SHADER);
    gl2.shaderSource(squareFragmentShader, `
    precision mediump float;

    varying float vBrightness;
    varying vec3 vColor;

    void main() {
        gl_FragColor = vBrightness * vec4(vColor, 1.0);
    }
    `);
    gl2.compileShader(squareFragmentShader);

    squareProgram = gl2.createProgram();
    gl2.attachShader(squareProgram, squareVertexShader);
    gl2.attachShader(squareProgram, squareFragmentShader);
    gl2.linkProgram(squareProgram);

    const squarePositionLocation = gl2.getAttribLocation(squareProgram, `position`);
    gl2.enableVertexAttribArray(squarePositionLocation);
    gl2.bindBuffer(gl2.ARRAY_BUFFER, squarePositionBuffer);
    gl2.vertexAttribPointer(squarePositionLocation, 3, gl2.FLOAT, false, 0, 0);

    var squareColorLocation = gl2.getAttribLocation(squareProgram, `vColors`);
    gl2.enableVertexAttribArray(squareColorLocation);
    gl2.bindBuffer(gl2.ARRAY_BUFFER, squareColorBuffer);
    gl2.vertexAttribPointer(squareColorLocation, 3, gl2.FLOAT, false, 0, 0);

    var squareNormalLocation = gl2.getAttribLocation(squareProgram, `normal`);
    gl2.enableVertexAttribArray(squareNormalLocation);
    gl2.bindBuffer(gl2.ARRAY_BUFFER, squareNormalBuffer);
    gl2.vertexAttribPointer(squareNormalLocation, 3, gl2.FLOAT, false, 0, 0);

    var squareLightLocation = gl2.getAttribLocation(squareProgram, `lightDirection`);
    gl2.enableVertexAttribArray(squareLightLocation);
    gl2.bindBuffer(gl2.ARRAY_BUFFER, squareLightBuffer);
    gl2.vertexAttribPointer(squareLightLocation, 3, gl2.FLOAT, false, 0, 0);

    gl2.useProgram(squareProgram);
    
    squareMatrixLoc = gl2.getUniformLocation(squareProgram, `normalMatrix`);

    gl2.uniformMatrix4fv(squareMatrixLoc, false, squareMatrix);

    if(avoid == 0)
        prepareFloorAnimation();
}

function initThree(){
    if(!gl3){
        throw new Error('WebGL not supported');
    }

    nightPoints.push(
        1, 1, 1, // top right 
        1, -1, 0, // bottom right
        -1, 1, 0, // top left
        -1, 1, 0, // top left
        1, -1, 0, // bottom right
        -1, -1, 0, // bottom left
    );
    uvPoints.push(
        0.1, 0.1,
        0.1, 1,
        1, 0.1,
        1, 0.1,
        0.1, 1,
        1, 1
    );
    moreNormalPoints.push(
        0, 0, 1,
        0, 0, 1,
        0, 0, 1,
        0, 0, 1,
        0, 0, 1,
        0, 0, 1
    );

    const nightPositionBuffer = gl3.createBuffer();
    gl3.bindBuffer(gl3.ARRAY_BUFFER, nightPositionBuffer);
    gl3.bufferData(gl3.ARRAY_BUFFER, new Float32Array(nightPoints), gl3.STATIC_DRAW);

    const nightUVBuffer = gl3.createBuffer();
    gl3.bindBuffer(gl3.ARRAY_BUFFER, nightUVBuffer);
    gl3.bufferData(gl3.ARRAY_BUFFER, new Float32Array(uvPoints), gl3.STATIC_DRAW);

    const nightNormalBuffer = gl3.createBuffer();
    gl3.bindBuffer(gl3.ARRAY_BUFFER, nightNormalBuffer);
    gl3.bufferData(gl3.ARRAY_BUFFER, new Float32Array(moreNormalPoints), gl3.STATIC_DRAW);

    const nightVertexShader = gl3.createShader(gl3.VERTEX_SHADER);
    gl3.shaderSource(nightVertexShader, `
    precision mediump float;

    const vec3 lightDirection = normalize(vec3(0, 0, 1.0));
    const float ambient = 0.1;
    
    attribute vec3 position;
    attribute vec2 uv;
    attribute vec3 normal;

    varying vec2 vUV;
    varying float vBrightness;
    varying vec3 vLightDirection;

    uniform mat4 normalMatrix;

    void main() {
        vec3 worldNormal = (normalMatrix * vec4(normal, 1.0)).xyz;
        float diffuse = max(0.0, dot(worldNormal, lightDirection));

        vBrightness = diffuse + ambient;
        vUV = uv;

        vLightDirection = lightDirection;

        gl_Position = vec4(position, 1.0);
    }
    `);
    gl3.compileShader(nightVertexShader);

    const nightFragmentShader = gl3.createShader(gl3.FRAGMENT_SHADER);
    gl3.shaderSource(nightFragmentShader, `
    precision mediump float;

    varying vec2 vUV;
    varying float vBrightness;
    varying vec3 vLightDirection;

    uniform sampler2D textureID;
    uniform sampler2D normalMap;

    void main() {
        vec3 normalVec = texture2D(normalMap, vUV).rgb;
        normalVec = normalVec * 2.0 - 1.0; // Convert from [0, 1]
        vec3 normalNormal = normalize(normalVec);

        float diffuse = max(dot(normalNormal, vLightDirection), 0.0);
        vec3 diffuseColor = diffuse * vec3(1.0, 1.0, 1.0);

        vec3 texel = texture2D(textureID, vUV).rgb;
        texel.xyz *= vBrightness;
        vec3 diffusedTexel = diffuseColor * texel;

        gl_FragColor = texture2D(textureID, vUV);
    }
    `);
    gl3.compileShader(nightFragmentShader);

    nightProgram = gl3.createProgram();
    gl3.attachShader(nightProgram, nightVertexShader);
    gl3.attachShader(nightProgram, nightFragmentShader);
    gl3.linkProgram(nightProgram);

    const nightPositionLocation = gl3.getAttribLocation(nightProgram, `position`);
    gl3.enableVertexAttribArray(nightPositionLocation);
    gl3.bindBuffer(gl3.ARRAY_BUFFER, nightPositionBuffer);
    gl3.vertexAttribPointer(nightPositionLocation, 3, gl3.FLOAT, false, 0, 0);

    const nightUVLocation = gl3.getAttribLocation(nightProgram, `uv`);
    gl3.enableVertexAttribArray(nightUVLocation);
    gl3.bindBuffer(gl3.ARRAY_BUFFER, nightUVBuffer);
    gl3.vertexAttribPointer(nightUVLocation, 2, gl3.FLOAT, false, 0, 0);

    const nightNormalLocation = gl3.getAttribLocation(nightProgram, `normal`);
    gl3.enableVertexAttribArray(nightNormalLocation);
    gl3.bindBuffer(gl3.ARRAY_BUFFER, nightNormalBuffer);
    gl3.vertexAttribPointer(nightNormalLocation, 3, gl3.FLOAT, false, 0, 0);

    gl3.useProgram(nightProgram);

    diffuseMap = loadTexture("starNightBackground.jpg");
    //normalMap = loadTexture("goldFoil.jpeg_normal.png");

    textureID = gl3.getUniformLocation(nightProgram, 'textureID');
    normalMapLoc = gl3.getUniformLocation(nightProgram, 'normalMap');
    
    gl3.uniform1i(textureID, 0);
    gl3.uniform1i(normalMapLoc, 1);

    gl3.activeTexture(gl3.TEXTURE0);
    gl3.bindTexture(gl3.TEXTURE_2D, diffuseMap);
    gl3.activeTexture(gl3.TEXTURE1);
    gl3.bindTexture(gl3.TEXTURE_2D, normalMap);

    anotherSquareMatrixLoc = gl3.getUniformLocation(nightProgram, `normalMatrix`);
    gl3.uniformMatrix4fv(anotherSquareMatrixLoc, false, squareMatrix);

    renderNightSky();



}

function animateDiscoBall(){
    requestAnimationFrame(animateDiscoBall);
    glMatrix.mat4.rotateY(modelMatrix, modelMatrix, 0.01);
    // P * M
    glMatrix.mat4.multiply(mvMatrix, viewMatrix, modelMatrix);
    glMatrix.mat4.multiply(mvpMatrix, projectionMatrix, mvMatrix);
    gl.uniformMatrix4fv(matrixLoc, false, mvpMatrix);
    gl.drawArrays(gl.TRIANGLES, 0, vertexData.length / 3);
}

function animateDiscoFloor(){
    gl2.drawArrays(gl.TRIANGLES, 0, squarePoints.length / 3);
}

function renderNightSky(){
    requestAnimationFrame(renderNightSky);
    gl3.drawArrays(gl.TRIANGLES, 0, nightPoints.length / 3);
}

function prepareFloorAnimation(){
    var interval = setInterval(function(){
        frame = requestAnimationFrame(animateDiscoFloor);
        clearInterval(interval);       
    }, 10);
    var intervalTwo = setInterval(function(){
        avoid = 1;
        initTwo();
        frame = requestAnimationFrame(animateDiscoFloor);   
    }, 1000);
}

function discoBall(pointCount){
    let points = [];
    for(let i = 0; i < pointCount; i++){

        const r = () =>  Math.random() - 0.5;

        const inputPoint = [r(), r(), r()];
        const outputPoint = glMatrix.vec3.normalize(glMatrix.vec3.create(), inputPoint);

        var greyColor = Math.random();

        points.push(...outputPoint);
        colors.push(greyColor, greyColor, greyColor);

    }

    // Little Bar to Hold Disco Ball
    var side1 = [-0.005, 10, 0.005];
    var side2 = [-0.005, 1, 0.005];
    var side3 = [0.005, 10, 0.005];
    var side4 = [0.005, 1, 0.005];

    var side5 = [-0.005, 10, -0.005];
    var side6 = [-0.005, 1, -0.005];
    var side7 = [0.005, 10, -0.005];
    var side8 = [0.005, 1, -0.005];

    var side9 = [-0.005, 10, -0.005];
    var side10 = [-0.005, 1, -0.005];
    var side11 = [-0.005, 10, 0.005];
    var side12 = [-0.005, 1, 0.005];

    var side13 = [0.005, 10, -0.005];
    var side14 = [0.005, 1, -0.005];
    var side15 = [0.005, 10, 0.005];
    var side16 = [0.005, 1, 0.005];

    points.push(

        ...side8,
        ...side7,
        ...side6,
        ...side8,
        ...side6,
        ...side5,

        ...side1,
        ...side2,
        ...side3,
        ...side1,
        ...side3,
        ...side4,

        ...side16,
        ...side15,
        ...side14,
        ...side16,
        ...side14,
        ...side13,

        ...side9,
        ...side10,
        ...side11,
        ...side9,
        ...side11,
        ...side12,
        

    );
    
    colors.push(
        1.0, 1.0, 1.0,
        1.0, 1.0, 1.0,
        1.0, 1.0, 1.0,
        1.0, 1.0, 1.0,
        1.0, 1.0, 1.0,
        1.0, 1.0, 1.0,

        1.0, 1.0, 1.0,
        1.0, 1.0, 1.0,
        1.0, 1.0, 1.0,
        1.0, 1.0, 1.0,
        1.0, 1.0, 1.0,
        1.0, 1.0, 1.0,

        1.0, 1.0, 1.0,
        1.0, 1.0, 1.0,
        1.0, 1.0, 1.0,
        1.0, 1.0, 1.0,
        1.0, 1.0, 1.0,
        1.0, 1.0, 1.0,

        1.0, 1.0, 1.0,
        1.0, 1.0, 1.0,
        1.0, 1.0, 1.0,
        1.0, 1.0, 1.0,
        1.0, 1.0, 1.0,
        1.0, 1.0, 1.0,
    
    );
    return points;
    
}

function danceFloor(){

    squarePoints = [];
    colorPoints = [];
    normalPoints = [];
    lightPoints = [];

    // Make 20 Dance Squares
    for(let i = 1; i > -1; i -= 0.2){

        // Black Outer Tiles
        squarePoints.push(

            // Top 10 Squares
            -i, 1, 0,
            -i, 0, 0,
            -(i-0.2), 0, 0,
            -i, 1, 0,
            -(i-0.2), 0, 0,
            -(i-0.2), 1, 0,

            // Bottom 10 Squares
            -i, 0, 0,
            -i, -1, 0,
            -(i-0.2), -1, 0,
            -i, 0, 0,
            -(i-0.2), -1, 0,
            -(i-0.2), 0, 0
        );
        colorPoints.push(
            repeat(12, [0.0, 0.0, 0.0])
        );

        normalPoints.push(
            repeat(12, [0, 0, 1])
        );

        // Colorful Inner Tiles
        squarePoints.push(

            // Top 10 Squares
            -i + 0.001, 1 - 0.001, 0,
            -i + 0.001, 0 + 0.001, 0,
            -(i-0.2) - 0.001, 0 + 0.001, 0,
            -i + 0.001, 1 - 0.001, 0,
            -(i-0.2) - 0.001, 0 + 0.001, 0,
            -(i-0.2) - 0.001, 1 - 0.001, 0,

            // Bottom 10 Squares
            -i + 0.001, 0 - 0.001, 0,
            -i + 0.001, -1 + 0.001, 0,
            -(i-0.2) - 0.001, -1 + 0.001, 0,
            -i + 0.001, 0 - 0.001, 0,
            -(i-0.2) - 0.001, -1 + 0.001, 0,
            -(i-0.2) - 0.001, 0 - 0.001, 0
        );


        // This next procedure is done to avoid white, black, or grey tiles
        var priorityColor = Math.floor(Math.random() * 3);
        var leastColor = Math.floor(Math.random() * 3);
        while(leastColor == priorityColor)
            leastColor = Math.floor(Math.random() * 3);

        // One of the rgb values will be very low (From 0.0 to 0.1), another will be pretty high (0.5 to 1.0), and the third
        // could be any value between 0.0 and 1.0.
        var priorityMin = 0.5;
        var priorityMax = 1.0;
        var leastMin = 0.0;
        var leastMax = 0.1;

        var rand1;
        var rand2;
        var rand3;
        if(priorityColor == 0){
            rand1 = priorityMin + (priorityMax - priorityMin) * Math.random();
            if(leastColor == 1){
                rand2 = leastMin + (leastMax - leastMin) * Math.random();
                rand3 = Math.random();
            }
            else{
                rand2 = Math.random();
                rand3 = leastMin + (leastMax - leastMin) * Math.random();
            }
        }
        else if(priorityColor == 1){
            rand2 = priorityMin + (priorityMax - priorityMin) * Math.random();
            if(leastColor == 0){
                rand1 = leastMin + (leastMax - leastMin) * Math.random();
                rand3 = Math.random();
            }
            else{
                rand1 = Math.random();
                rand3 = leastMin + (leastMax - leastMin) * Math.random();
            }
        }
        else{
            rand3 = priorityMin + (priorityMax - priorityMin) * Math.random();
            if(leastColor == 0){
                rand1 = leastMin + (leastMax - leastMin) * Math.random();
                rand2 = Math.random();
            }
            else{
                rand1 = Math.random();
                rand2 = leastMin + (leastMax - leastMin) * Math.random();
            }
        }

        var rand4;
        var rand5;
        var rand6;
        priorityColor = Math.floor(Math.random() * 3);
        leastColor = Math.floor(Math.random() * 3);
        while(leastColor == priorityColor)
            leastColor = Math.floor(Math.random() * 3);
        if(priorityColor == 0){
            rand4 = priorityMin + (priorityMax - priorityMin) * Math.random();
            if(leastColor == 1){
                rand5 = leastMin + (leastMax - leastMin) * Math.random();
                rand6 = Math.random();
            }
            else{
                rand5 = Math.random();
                rand6 = leastMin + (leastMax - leastMin) * Math.random();
            }
        }
        else if(priorityColor == 1){
            rand5 = priorityMin + (priorityMax - priorityMin) * Math.random();
            if(leastColor == 0){
                rand4 = leastMin + (leastMax - leastMin) * Math.random();
                rand6 = Math.random();
            }
            else{
                rand4 = Math.random();
                rand6 = leastMin + (leastMax - leastMin) * Math.random();
            }
        }
        else{
            rand6 = priorityMin + (priorityMax - priorityMin) * Math.random();
            if(leastColor == 0){
                rand4 = leastMin + (leastMax - leastMin) * Math.random();
                rand5 = Math.random();
            }
            else{
                rand4 = Math.random();
                rand5 = leastMin + (leastMax - leastMin) * Math.random();
            }
        }       
        colorPoints.push(
            repeat(6, [rand1, rand2, rand3]),
            repeat(6, [rand4, rand5, rand6])
        );
        normalPoints.push(
            repeat(12, [0, 0, 1])
        );
    }
    var lightValues = repeat(24, [1.0, 1.0, 0.2]);
    lightPoints.push(lightValues);

    lightValues = repeat(24, [1.0, 1.0, 0.4]);
    lightPoints.push(lightValues);

    lightValues = repeat(24, [1.0, 1.0, 0.6]);
    lightPoints.push(lightValues);

    lightValues = repeat(24, [1.0, 1.0, 0.8]);
    lightPoints.push(lightValues);

    lightValues = repeat(24, [1.0, 1.0, 1.0]);
    lightPoints.push(lightValues);

    lightValues = repeat(24, [1.0, 1.0, 1.0]);
    lightPoints.push(lightValues);

    lightValues = repeat(24, [1.0, 1.0, 0.8]);
    lightPoints.push(lightValues);

    lightValues = repeat(24, [1.0, 1.0, 0.6]);
    lightPoints.push(lightValues);

    lightValues = repeat(24, [1.0, 1.0, 0.4]);
    lightPoints.push(lightValues);

    lightValues = repeat(24, [1.0, 1.0, 0.2]);
    lightPoints.push(lightValues);
    
}

function repeat(n, pattern) {
    return [...Array(n)].reduce(sum => sum.concat(pattern), []);
}

function loadTexture(url){
    const texture = gl3.createTexture();
    const image = new Image();
    
    image.onload = e => {
        gl3.bindTexture(gl3.TEXTURE_2D, texture);
        gl3.texImage2D(gl3.TEXTURE_2D, 0, gl3.RGBA, gl3.RGBA, gl3.UNSIGNED_BYTE, image);
        gl3.generateMipmap(gl3.TEXTURE_2D);
    };
    
    image.src = url;
    return texture;
}
