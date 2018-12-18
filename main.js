// global
let scene = new THREE.Scene(),
    FPCamera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.01, 1000),    // first-person camera
    TPCamera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.01, 1000),   // third-person camera
    renderer = new THREE.WebGLRenderer(),
    TPControl = new THREE.OrbitControls(TPCamera),     // third-person camera is controlled with orbit control
    FPControl = new THREE.PointerLockControls(FPCamera),   // controlled with first-person control
    camera = TPCamera;    // camera to be displayed
let agentVelocity = new THREE.Vector3(0, 0, 0),
    agentDirection = new THREE.Vector3(0, 0, 1);
let moveForward = false,
    moveBackward = false,
    moveLeft = false,
    moveRight = false,
    turnleft = false,
    turnright = false,
    canJump = false;    // variables for movement control
let prevTime = performance.now();

let stats;


main();

function main() {
    init();
    buildScene();
    // keyboard and mouse events
    renderer.domElement.addEventListener('dblclick', onDoubleClick, false);
    document.addEventListener("webkitfullscreenchange", onFullscreenChange, false);
    window.addEventListener("resize", resize, false);
    document.addEventListener("keydown", onKeyDown, false);
    document.addEventListener("keyup", onKeyUp, false);
    // start display
    animate();
}

function init() {
    // append canvas element to DOM tree
    document.getElementById('canvas-frame').appendChild(renderer.domElement);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    // adjust canvas
    resize();
    // parameters for camera control
    TPControl.screenSpacePanning = true;
    TPControl.minDistance = 5;
    TPControl.maxDistance = 100;
    TPControl.target.set(0, 0, 0);
    TPCamera.position.set(0, 20, 40);
    TPControl.update();
    FPControl.getObject().position.z = 10;
    scene.add(FPControl.getObject());
    // layers of camera
    TPCamera.layers.set(0);
    FPCamera.layers.set(1);
    // background color
    scene.background = new THREE.Color(0xffffff);
    // elements should have name for debug
    TPCamera.name = "Third-Person Camera";
    FPCamera.name = "First-Person Camera";

    // FPS counter
    stats = new Stats();
    stats.domElement.style.position = 'absolute';
    stats.domElement.style.left = '0px';
    stats.domElement.style.top = '0px';
    document.getElementById('canvas-frame').appendChild(stats.domElement);
}

function buildScene() {
    // floor
    let floor = newFloor();
    floor.receiveShadow = true;
    floor.layers.mask = 0xffffffff;
    scene.add(floor);

    // cube
    let cube = newCube(10, 10, 10, 0x00ff00);
    cube.animate = function () {
        this.rotation.x += 0.01;
        this.rotation.y += 0.01;
        this.rotation.z += 0.01;
    };
    cube.castShadow = true;
    cube.position.set(0, 5, 0);
    cube.layers.mask = 0xffffffff;
    scene.add(cube);

    // the man to be controlled
    let man = loadMan();
    man.scale.x = 0.1;
    man.scale.y = 0.1;
    man.scale.z = 0.1;
    man.rotateY(Math.PI);
    man.translateY(-8);
    man.layers.mask = 0xffffffff;
    man.layers.disable(1);
    FPControl.getObject().add(man);

    // door
    let door = loadDoor();
    door.layers.mask = 0xffffffff;
    door.translateY(0);
    door.translateZ(-10);
    door.scale.x = 10;
    door.scale.y = 10;
    door.scale.z = 10;
    scene.add(door);

    // point light
    light = newPointLight();
    light.position.set(1, 200, 1);
    light.layers.mask = 0xffffffff;
    light.castShadow = true;        //Set up shadow properties for the light
    light.shadow.mapSize.width = 512;
    light.shadow.mapSize.height = 512;
    light.shadow.camera.near = 0.5;
    light.shadow.camera.far = 500;
    scene.add(light);

    // ambient light
    light = newAmbientLight();
    scene.add(light);
}

function resize() {
    // camera
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    // renderer
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    scene.traverse(function (obj) {
        if (obj.animate) {
            obj.animate();
        }
    });

    moveCamera();
    renderer.render(scene, camera);
    requestAnimationFrame(animate);

    stats.update();
}

function moveCamera() {
    let time = performance.now();
    let deltaT = (time - prevTime) / 1000.0;
    prevTime = time;
    // damping
    agentVelocity.x *= 1 - deltaT * 10.0;
    agentVelocity.z *= 1 - deltaT * 10.0;
    agentVelocity.y -= 9.8 * deltaT * 10.0;
    // accelerate
    agentDirection.z = Number(moveForward) - Number(moveBackward);
    agentDirection.x = Number(moveLeft) - Number(moveRight);
    agentDirection.normalize();
    if (moveForward || moveBackward) agentVelocity.z -= agentDirection.z * 400.0 * deltaT;
    if (moveLeft || moveRight) agentVelocity.x -= agentDirection.x * 400.0 * deltaT;
    // apply movement
    FPControl.getObject().translateX(agentVelocity.x * deltaT);
    FPControl.getObject().translateY(agentVelocity.y * deltaT);
    FPControl.getObject().translateZ(agentVelocity.z * deltaT);
    // above ground
    if (FPControl.getObject().position.y < 10) {
        agentVelocity.y = 0;
        FPControl.getObject().position.y = 10;
        canJump = true;
    }
    if (!FPControl.isLocked) {
        FPControl.getObject().rotateY((Number(turnleft) - Number(turnright)) * deltaT * 5);
    }
}

// respond to keyboard and mouse
function onKeyDown(event) {
    switch (event.keyCode) {
        case 38: // up
        case 87: // w
            moveForward = true;
            break;
        case 37: // left
        case 65: // a
            moveLeft = true;
            break;
        case 40: // down
        case 83: // s
            moveBackward = true;
            break;
        case 39: // right
        case 68: // d
            moveRight = true;
            break;
        case 32: // space
            if (canJump === true) agentVelocity.y += 35;
            canJump = false;
            break;
        case 81:
            if (!FPControl.isLocked) turnleft = true;
            break;
        case 69:
            if (!FPControl.isLocked) turnright = true;
            break;
        default:
            break;
    }
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
    resize();
}

// basic function for adding objects
function newCube(width = 1, height = 1, depth = 1, color = 0x00ff00) {
    const geom = new THREE.CubeGeometry(width, height, depth);
    const mat = new THREE.MeshLambertMaterial({ color: color });
    const cube = new THREE.Mesh(geom, mat);
    cube.name = "cube";
    return cube;
}

function newFloor() {
    let vertex = new THREE.Vector3(),
        color = new THREE.Color(),
        i = 0;
    // floor
    let floorGeometry = new THREE.PlaneBufferGeometry(2000, 2000, 100, 100);
    floorGeometry.rotateX(-Math.PI / 2);
    // vertex displacement
    let position = floorGeometry.attributes.position;
    for (i = 0, l = position.count; i < l; i++) {
        vertex.fromBufferAttribute(position, i);
        vertex.x += Math.random() * 20 - 10;
        vertex.y += Math.random() * 2;
        vertex.z += Math.random() * 20 - 10;
        position.setXYZ(i, vertex.x, vertex.y, vertex.z);
    }
    floorGeometry = floorGeometry.toNonIndexed(); // ensure each face has unique vertices
    position = floorGeometry.attributes.position;
    let colors = [];
    for (i = 0, l = position.count; i < l; i++) {
        color.setHSL(Math.random() * 0.3 + 0.5, 0.75, Math.random() * 0.25 + 0.75);
        colors.push(color.r, color.g, color.b);
    }
    floorGeometry.addAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    let floorMaterial = new THREE.MeshBasicMaterial({ vertexColors: THREE.VertexColors });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.name = "floor";
    return floor;
}

function newPointLight() {
    const light = new THREE.PointLight(0xffffff, 1, 0, 2);
    light.name = "point_light";
    return light;
}

function newAmbientLight() {
    const light = new THREE.AmbientLight(0xffffff, 0.2);
    light.name = "ambient_light";
    return light;
}

function loadMan() {
    let man = new THREE.Object3D();
    let loader = new THREE.OBJLoader();
    loader.load("model/male02.obj",
        function onLoad(object) {
            man.add(object);
        });
    man.name = "man";
    return man;
}

function loadDoor() {
    let door = new THREE.Object3D();
    //scene.add(texture);
    let Loader = new THREE.OBJLoader2();
    Loader.loadMtl('model/Room-Door/Door_Component_BI3.mtl', null,
        function onLoadMtl(materials) {
            Loader.setMaterials(materials);
            Loader.setModelName('door');
            Loader.load('model/Room-Door/Door_Component_BI3.obj',
                function onLoad(event) {
                    event.detail.loaderRootNode.traverse((child) => { child.layers.mask = 0xffffffff; });
                    door.add(event.detail.loaderRootNode);
                });
        });
    door.name = "door";
    return door;
}