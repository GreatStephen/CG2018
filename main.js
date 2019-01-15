"use strict";

// global
let scene = new THREE.Scene(),
    FPCamera = new THREE.PerspectiveCamera(50, 1, 0.01, 10000),    // first-person camera
    TPCamera = new THREE.PerspectiveCamera(75, 1, 0.01, 10000),   // third-person camera
    renderer = new THREE.WebGLRenderer({antialias: true, alpha: true}),
    TPControl = new THREE.OrbitControls(TPCamera, document.getElementById("canvas-frame")),     // third-person camera is controlled with orbit control
    FPControl = new THREE.PointerLockControls(FPCamera),   // controlled with first-person control
    camera = TPCamera;    // camera to be displayed

let stats;
let objectToPlace = null; // the object selected on the sidebar
let objectSelected = null;

let clock = new THREE.Clock();

let reflectionCube, refractionCube;

let pointlight;
let pointlightx=-100, pointlightz=-50;

function main() {
    init();
    buildScene();
    addSidebar();
    registerEvents();

    // start display
    animate();
}

function init() {
    // append canvas element to DOM tree
    document.getElementById('canvas-frame').appendChild(renderer.domElement);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    // adjust canvas
    onResize();

    // parameters for third-person camera control
    TPControl.screenSpacePanning = true;
    TPControl.minDistance = 0.1;
    TPControl.maxDistance = 10000;
    TPControl.target.set(0, 0, 0);
    TPControl.enableKeys = false;
    TPCamera.position.set(0, 20, 40);
    TPCamera.name = "Third-Person Camera";
    TPControl.update();
    // parameters for first-person camera control
    FPControl.getObject().position.z = 10;
    FPCamera.name = "First-Person Camera";
    scene.add(FPControl.getObject());
    // background color
    drawSky();
    scene.background = reflectionCube;

    // FPS counter
    stats = new Stats();
    stats.domElement.style.position = 'absolute';
    stats.domElement.style.left = '0px';
    stats.domElement.style.top = '0px';
    document.getElementById('canvas-frame').appendChild(stats.domElement);
}

function buildScene() {

    let gridHelper = new THREE.GridHelper(1000, 20);
    scene.add(gridHelper);

    let floor = drawFloor();
    scene.add(floor);

    // cube
    let cube = drawBox(1, 1, 1, 0x00ff00);
    cube.position.set(0, 5, 0);
    cube.animate = function () {
        this.rotation.x += 0.01;
        this.rotation.y += 0.01;
        this.rotation.z += 0.01;
    };
    scene.add(cube);
    collision_items.push(cube);
    pick_items.push(cube);

    // bed
    let bed1 = drawBed();
    bed1.position.set(20, 0, 0);
    bed1.scale.set(0.2, 0.2, 0.2);
    scene.add(bed1);
    collision_items.push(bed1);
    pick_items.push(bed1);

    // the man to be controlled
    man = loadMesh("resources/model/Male02/male02.obj",
        "resources/model/Male02/male02.mtl", "man");
    man.scale.set(0.06, 0.06, 0.06);
    man.rotateY(Math.PI);
    man.translateY(-10);
    man.translateZ(-0.5);
    FPControl.getObject().add(man);

    // door
    let door = loadMesh("resources/model/Room-Door/Door_Component_BI3.obj",
        "resources/model/Room-Door/Door_Component_BI3.mtl", "door");
    door.translateY(0);
    door.translateZ(-10);
    door.scale.set(8, 8, 8);
    scene.add(door);
    collision_items.push(door);
    pick_items.push(door);

    let fan = new Fan();
    fan.threegroup.position.y = 5;
    fan.threegroup.position.x = -10;
    fan.threegroup.scale.set(0.05, 0.05, 0.05);
    fan.threegroup.animate = function () {
        fan.update();
    };
    scene.add(fan.threegroup);
    collision_items.push(fan.threegroup);
    pick_items.push(fan.threegroup);

    let gui = new dat.GUI();
    gui.add(speedControl, 'speed', 0, 0.5).name("Speed");

    // model
    let dancer = drawDancer("resources/model/Dancing/Dancing.fbx", gui);
    dancer.scale.set(0.05, 0.05, 0.05);
    dancer.position.set(-10, 0, -10);
    scene.add(dancer);
    collision_items.push(dancer);

    // reflection boxes
    var cubeMaterial3 = new THREE.MeshLambertMaterial({
        color: 0xffffff,
        envMap: reflectionCube,
        combine: THREE.MixOperation,
        reflectivity: 0.3
    });
    var cubeMaterial2 = new THREE.MeshLambertMaterial({color: 0xffffff, envMap: refractionCube, refractionRatio: 0.95});
    var cubeMaterial1 = new THREE.MeshLambertMaterial({color: 0xffffff, envMap: reflectionCube});

    let box1 = drawBox(6, 6, 6, cubeMaterial1);
    box1.position.set(-20, 3, 10);
    scene.add(box1);
    collision_items.push(box1);
    pick_items.push(box1);

    let box2 = drawBox(6, 6, 6, cubeMaterial2);
    box2.position.set(-20, 3, -10);
    scene.add(box2);
    collision_items.push(box2);
    pick_items.push(box2);

    let box3 = drawBox(6, 6, 6, cubeMaterial3);
    box3.position.set(-20, 3, 0);
    scene.add(box3);
    collision_items.push(box3);
    pick_items.push(box3);

    // point light
    pointlight = newPointLight(1, 0xffffff);
    pointlight.position.set(pointlightx, 50, pointlightz);
    scene.add(pointlight);

    // ambient light
    let light = newAmbientLight(0.2, 0xffffff);
    scene.add(light);
}

function registerEvents() {
    // keyboard and mouse events
    renderer.domElement.addEventListener('dblclick', onDoubleClick, false);
    document.addEventListener("webkitfullscreenchange", onFullscreenChange, false);
    window.addEventListener("onResize", onResize, false);
    window.addEventListener('mousemove', onMouseMove, false);
    renderer.domElement.addEventListener("click", onMouseClick, false);
    document.addEventListener("keydown", onKeyDown, false);
    document.addEventListener("keyup", onKeyUp, false);
}

function animate() {
    scene.traverse(function (obj) {
        if (obj.animate) {
            obj.animate();
        }
    });
    moveCamera();
    renderer.render(scene, camera);
    let time = clock.getDelta();

    if (mixer) {
        mixer.update(time);
    }
    renderer.render(scene, camera);
    stats.update();

    requestAnimationFrame(animate);
}

function onResize() {
    if (!document.webkitIsFullScreen) {
        // camera
        camera.aspect = 0.75 * window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        // renderer
        renderer.setSize(0.75 * window.innerWidth, window.innerHeight);
    } else {
        // camera
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        // renderer
        renderer.setSize(window.innerWidth, window.innerHeight);
    }
}

// calculate the mouse's coordinates
function onMouseMove(event) {
    event.preventDefault();
    mouse.x = ((event.clientX - window.innerWidth / 4.0) / (window.innerWidth * 3.0 / 4.0)) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
}

// return intersects4
function onMouseClick(event) {
    if (intersects4.length !== 0) {
        selectObject(intersects4[0].object);
    }
    else{
        selectObject(null);
    }
}

// respond to keyboard and mouse
function onKeyDown(event) {
    switch (event.keyCode) {
        case 38: // up
            pointlightx +=0.1;
            pointlight.position.set(pointlightx, 50, pointlightz);
            break;
        case 87: // w
            moveForward = true;
            break;
        case 37: // left
            pointlightz +=0.1;
            pointlight.position.set(pointlightx, 50, pointlightz);
            break;
        case 65: // a
            moveLeft = true;
            break;
        case 40: // down
            pointlightx -=0.1;
            pointlight.position.set(pointlightx, 50, pointlightz);
            break;
        case 83: // s
            moveBackward = true;
            break;
        case 39: // right
            pointlightz -=0.1;
            pointlight.position.set(pointlightx, 50, pointlightz);
            break;
        case 68: // d
            moveRight = true;
            break;
        case 32: // space
            if (canJump === true) agentVelocity.y += 35;
            canJump = false;
            break;
        case 81: // q
            if (!FPControl.isLocked) turnleft = true;
            break;
        case 69: // e
            if (!FPControl.isLocked) turnright = true;
            break;
        case 90: // z
            zoomToFit(collision_items);
            break;
        case 80: // p
            renderer.render(scene, camera);
            document.getElementById('screenshoot').setAttribute('src', renderer.domElement.toDataURL());
            $('#screenshootModal').modal('show');
            break;
        case 73: // i
            pointlight.intensity += 0.2;
            break;
        case 75: // k
            pointlight.intensity -= 0.2;
            break;
        default:
            break;
    }
}

function base64Img2Blob(code){
    var parts = code.split(';base64,');
    var contentType = parts[0].split(':')[1];
    var raw = window.atob(parts[1]);
    var rawLength = raw.length;

    var uInt8Array = new Uint8Array(rawLength);

    for (var i = 0; i < rawLength; ++i) {
        uInt8Array[i] = raw.charCodeAt(i);
    }

    return new Blob([uInt8Array], {type: contentType});
}

function downloadFile(fileName, content){

    var aLink = document.createElement('a');
    var blob = base64Img2Blob(content); //new Blob([content]);

    var evt = document.createEvent("HTMLEvents");
    evt.initEvent("click", false, false);//initEvent 不加后两个参数在FF下会报错
    aLink.download = fileName;
    aLink.href = URL.createObjectURL(blob);

    aLink.dispatchEvent(evt);
}

function onKeyUp(event) {
    switch (event.keyCode) {
        case 38: // up
        case 87: // w
            moveForward = false;
            break;
        case 37: // left
        case 65: // a
            moveLeft = false;
            break;
        case 40: // down
        case 83: // s
            moveBackward = false;
            break;
        case 39: // right
        case 68: // d
            moveRight = false;
            break;
        case 81:
            turnleft = false;
            break;
        case 69:
            turnright = false;
            break;
        default:
            break;
    }
}

function onDoubleClick(event) {
    FPControl.lock();
    event.currentTarget.webkitRequestFullscreen();
}

function onFullscreenChange(event) {
    if (!document.webkitIsFullScreen) {
        document.exitPointerLock();
        camera = TPCamera;
        TPControl.enabled = true;
        TPControl.update();
    } else {
        camera = FPCamera;
        TPControl.enabled = false;
        TPControl.update();
    }
    onResize();
}






