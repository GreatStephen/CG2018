"use strict";

// global
let scene = new THREE.Scene(),
    FPCamera = new THREE.PerspectiveCamera(50, 1, 0.01, 10000),    // first-person camera
    TPCamera = new THREE.PerspectiveCamera(75, 1, 0.01, 10000),   // third-person camera
    renderer = new THREE.WebGLRenderer(),
    TPControl = new THREE.OrbitControls(TPCamera, document.getElementById("canvas-frame")),     // third-person camera is controlled with orbit control
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
    canJump = false,
    movedirection = new THREE.Vector3();// variables for movement control
let prevTime = performance.now();

let stats;
let objectToPlace = null; // the object selected on the sidebar
let objectSelected = null;

let speedControl = new function () {
    this.speed = 0;
};

let animationControl = {
    skeleton: true
};

// collision detection
let man;
let raycaster1 = new THREE.Raycaster(),
    raycaster2 = new THREE.Raycaster(),
    raycaster3 = new THREE.Raycaster();
let isCollision = false;
let target = new THREE.Vector3();
let quaternion_target = new THREE.Quaternion();
const COLLOSION_DIST = 5;
const RAYCASTER_DIST = 3;
let collision_items = [];

let Fan;
let clock = new THREE.Clock();
let meshHelper, mixer;
let reflectionCube, refractionCube;

function main() {
    init();
    buildScene();
    addSidebar();
    selectObject(collision_items[0]);
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
    resize();

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

    // bed
    let bed1 = drawBed();
    bed1.position.set(20, 0, 0);
    [bed1.scale.x, bed1.scale.y, bed1.scale.z] = [0.2, 0.2, 0.2];
    scene.add(bed1);
    collision_items.push(bed1);

    // the man to be controlled
    man = loadMesh("resources/model/Male02/male02.obj",
        "resources/model/Male02/male02.mtl", "man");
    [man.scale.x, man.scale.y, man.scale.z] = [0.06, 0.06, 0.06];
    man.rotateY(Math.PI);
    man.translateY(-10);
    man.translateZ(-0.5);
    FPControl.getObject().add(man);

    // door
    let door = loadMesh("resources/model/Room-Door/Door_Component_BI3.obj",
        "resources/model/Room-Door/Door_Component_BI3.mtl", "door");
    door.translateY(0);
    door.translateZ(-10);
    [door.scale.x, door.scale.y, door.scale.z] = [8, 8, 8];
    scene.add(door);
    collision_items.push(door);

    let fan = new Fan();
    fan.threegroup.position.y = 5;
    fan.threegroup.position.x = -10;
    [fan.threegroup.scale.x, fan.threegroup.scale.y, fan.threegroup.scale.z] = [0.05, 0.05, 0.05];
    fan.threegroup.animate = function () {
        fan.update();
    };
    scene.add(fan.threegroup);
    collision_items.push(fan.threegroup);

    let gui = new dat.GUI();
    gui.add(speedControl, 'speed', 0, 0.5).name("Speed");
    gui.add(animationControl, "skeleton").onChange(
        function (e) {
            meshHelper.visible = e;
        }
    );

    // model
    var dance = new THREE.FBXLoader();
    danceAnimate(dance, "resources/model/Dancing/Dancing.fbx", gui);

    // reflection boxes
    var cubeMaterial3 = new THREE.MeshLambertMaterial({
        color: 0xffffff,
        envMap: reflectionCube,
        combine: THREE.MixOperation,
        reflectivity: 0.3
    });
    var cubeMaterial2 = new THREE.MeshLambertMaterial({color: 0xffffff, envMap: refractionCube, refractionRatio: 0.95});
    var cubeMaterial1 = new THREE.MeshLambertMaterial({color: 0xffffff, envMap: reflectionCube});

    let box1 = new THREE.Mesh(
        new THREE.BoxGeometry(6, 6, 6),
        cubeMaterial1
    );
    box1.position.set(-20, 3, 10);
    scene.add(box1);
    collision_items.push(box1);

    let box2 = new THREE.Mesh(
        new THREE.BoxGeometry(6, 6, 6),
        cubeMaterial2
    );
    box2.position.set(-20, 3, -10);
    scene.add(box2);
    collision_items.push(box2);

    let box3 = new THREE.Mesh(
        new THREE.BoxGeometry(6, 6, 6),
        cubeMaterial3
    );
    box3.position.set(-20, 3, 0);
    scene.add(box3);
    collision_items.push(box3);


    // point light
    let light = newPointLight(1, 0xffffff);
    light.position.set(-20, 50, 100);
    scene.add(light);

    // ambient light
    light = newAmbientLight(0.2, 0xffffff);
    scene.add(light);
}

function addSidebar() {
    addCard2Sidebar(drawBed());
    addCard2Sidebar(drawBox(1, 1, 1));

    addProperty2SideBar('number', 'X', {'step': 0.01, 'placeholder': 'NaN'}, (event) => {
        if (objectSelected) {
            objectSelected.position.x = event.target.value;
        } else {
            alert('No object is selected now!');
            event.target.value = null;
        }
    });
    addProperty2SideBar('number', 'Y', {'step': 0.01, 'placeholder': 'NaN'}, (event) => {
        if (objectSelected) {
            objectSelected.position.y = event.target.value;
        } else {
            alert('No object is selected now!');
            event.target.value = null;
        }
    });
    addProperty2SideBar('number', 'Z', {'step': 0.01, 'placeholder': 'NaN'}, (event) => {
        if (objectSelected) {
            objectSelected.position.z = event.target.value;
        } else {
            alert('No object is selected now!');
            event.target.value = null;
        }
    });
    addProperty2SideBar('number', 'Roll', {'step': 0.01, 'placeholder': 'NaN'}, (event) => {
        if (objectSelected) {
            objectSelected.rotation.x = event.target.value;
        } else {
            alert('No object is selected now!');
            event.target.value = null;
        }
    });
    addProperty2SideBar('number', 'Pitch', {'step': 0.01, 'placeholder': 'NaN'}, (event) => {
        if (objectSelected) {
            objectSelected.rotation.y = event.target.value;
        } else {
            alert('No object is selected now!');
            event.target.value = null;
        }
    });
    addProperty2SideBar('number', 'Yaw', {'step': 0.01, 'placeholder': 'NaN'}, (event) => {
        if (objectSelected) {
            objectSelected.rotation.z = event.target.value;
        } else {
            alert('No object is selected now!');
            event.target.value = null;
        }
    });
    addProperty2SideBar('color', 'Color', null, (event) => {
        if (objectSelected) {
            objectSelected.material.color.setStyle(event.target.value);
        } else {
            alert('No object is selected now!');
            event.target.value = '#000000';
        }
    });
}

function registerEvents() {
    // keyboard and mouse events
    renderer.domElement.addEventListener('dblclick', onDoubleClick, false);
    document.addEventListener("webkitfullscreenchange", onFullscreenChange, false);
    window.addEventListener("resize", resize, false);
    document.addEventListener("keydown", onKeyDown, false);
    document.addEventListener("keyup", onKeyUp, false);
}

function resize() {
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

function animate() {
    scene.traverse(function (obj) {
        if (obj.animate) {
            obj.animate();
        }
    });
    moveCamera();
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
    let time = clock.getDelta();

    if (mixer) {
        mixer.update(time);
    }
    renderer.render(scene, camera);
    stats.update();
}

function moveCamera() {
    let time = performance.now();
    let deltaT = (time - prevTime) / 1000.0;
    prevTime = time;

    // collision detection
    movedirection.x = Number(moveRight) - Number(moveLeft);
    movedirection.y = 0;
    movedirection.z = Number(moveBackward) - Number(moveForward);
    isCollision = false;
    FPCamera.getWorldQuaternion(quaternion_target);

    movedirection.applyQuaternion(quaternion_target);
    man.getWorldPosition(target);
    raycaster1.set(target, movedirection.normalize());
    raycaster2.set(new THREE.Vector3(target.x, target.y - RAYCASTER_DIST, target.z), movedirection.normalize());
    raycaster3.set(new THREE.Vector3(target.x, target.y + RAYCASTER_DIST, target.z), movedirection.normalize());
    let intersects1 = raycaster1.intersectObjects(collision_items, true),
        intersects2 = raycaster2.intersectObjects(collision_items, true),
        intersects3 = raycaster3.intersectObjects(collision_items, true);

    if (intersects1.length !== 0 && intersects1[0].distance < COLLOSION_DIST) {
        isCollision = true;
        agentVelocity.x = 0;
        agentVelocity.z = 0;
        agentVelocity.y = 0;
    }
    if (intersects2.length !== 0 && intersects2[0].distance < COLLOSION_DIST) {
        isCollision = true;
        agentVelocity.x = 0;
        agentVelocity.z = 0;
        agentVelocity.y = 0;
    }
    if (intersects3.length !== 0 && intersects3[0].distance < COLLOSION_DIST) {
        isCollision = true;
        agentVelocity.x = 0;
        agentVelocity.z = 0;
        agentVelocity.y = 0;
    }

    if (isCollision === false) {
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
        case 81: // q
            if (!FPControl.isLocked) turnleft = true;
            break;
        case 69: // e
            if (!FPControl.isLocked) turnright = true;
            break;
        case 90: // z
            zoomToFit(collision_items);
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
function newPointLight(intensity = 1, color = 0xffffff, name = "pointLight") {
    let light = new THREE.PointLight(color, intensity, 0, 2);
    light.name = name;
    light.castShadow = true;
    light.shadow.mapSize.width = 2048;
    light.shadow.mapSize.height = 2048;
    light.shadow.camera.near = 0.5;
    light.shadow.camera.far = 500;
    return light;
}

function newAmbientLight(intensity = 0.2, color = 0xffffff, name = "ambientLight") {
    let light = new THREE.AmbientLight(color, intensity);
    light.name = name;
    return light;
}

function loadMesh(modelUrl, materialURL, name = "meshObject") {
    let obj = new THREE.Object3D();
    let loader = new THREE.OBJLoader2();
    if (materialURL) {
        loader.loadMtl(materialURL, null,
            function onLoadMtl(materials) {
                loader.setMaterials(materials);
                loader.load(modelUrl,
                    function onLoad(event) {
                        obj.add(event.detail.loaderRootNode);
                        for (let mesh of event.detail.loaderRootNode.children) {
                            mesh.receiveShadow = true;
                            mesh.castShadow = true;
                        }
                    });
            });
    } else {
        loader.load(modelUrl,
            function onLoad(event) {
                obj.add(event.detail.loaderRootNode);
                for (let mesh of event.detail.loaderRootNode.children) {
                    mesh.receiveShadow = true;
                    mesh.castShadow = true;
                }
            });
    }
    obj.name = name;
    obj.castShadow = true;
    obj.receiveShadow = true;
    return obj;
}

function importMesh() {
    let file = document.getElementById("file_path").files[0];
    let obj = loadMesh(URL.createObjectURL(file), null, "objectImported");
    scene.add(obj);
}

function drawFloor() {
    let shadowMaterial = new THREE.ShadowMaterial({color: 0x000000});
    shadowMaterial.opacity = 0.5;
    let groundMesh = new THREE.Mesh(
        new THREE.BoxGeometry(1000, .1, 1000),
        shadowMaterial
    );
    groundMesh.receiveShadow = true;
    groundMesh.name = "floor";
    return groundMesh;
}

function drawPillar(ball_size, cylinder_height) {
    let ball = new THREE.Mesh(
        new THREE.OctahedronGeometry(ball_size, 2),
        new THREE.MeshStandardMaterial({
            color: 0x72bdbf,
            flatShading: true,
            metalness: 0,
            roughness: 0.8,
            refractionRatio: 0.25
        })
    );
    ball.position.y += cylinder_height;
    ball.castShadow = true;
    ball.receiveShadow = true;
    ball.rotateZ(Math.random() * Math.PI * 2);
    ball.rotateY(Math.random() * Math.PI * 2);

    let cylinder = new THREE.Mesh(
        new THREE.CylinderGeometry(5, 5, cylinder_height, 32),
        new THREE.MeshStandardMaterial({
            color: 0xf8db08,
            flatShading: true,
            metalness: 0,
            roughness: 0.8,
            refractionRatio: 0.25
        })
    );
    cylinder.position.y = cylinder_height / 2;
    cylinder.castShadow = true;
    cylinder.receiveShadow = true;

    let pillar = new THREE.Group();
    pillar.add(ball);
    pillar.add(cylinder);

    return pillar;
}

function drawBox(x, y, z, color = 0x3CB371) {
    let box = new THREE.Mesh(
        new THREE.BoxGeometry(x, y, z),
        new THREE.MeshStandardMaterial({
            color: color,
            flatShading: true,
            metalness: 0,
            roughness: 0.8,
            refractionRatio: 0.25
        })
    );
    box.castShadow = true;
    box.receiveShadow = true;
    box.name = "box";
    return box;
}

function drawBed() {
    let pillar1 = drawPillar(6, 50);
    pillar1.position.x -= 30;

    let pillar2 = drawPillar(6, 50);
    pillar2.position.x += 30;

    let pillar3 = drawPillar(6, 30);
    pillar3.position.x += 30;
    pillar3.position.z += 100;

    let pillar4 = drawPillar(6, 30);
    pillar4.position.x -= 30;
    pillar4.position.z += 100;

    let board1 = drawBox(60, 40, 5);
    board1.position.y += 20;

    let box1 = drawBox(60, 20, 100);
    box1.position.y += 15;
    box1.position.z += 50;

    let bed = new THREE.Group();
    bed.add(pillar1);
    bed.add(pillar2);
    bed.add(pillar3);
    bed.add(pillar4);
    bed.add(board1);
    bed.add(box1);
    bed.name = "bed";
    return bed;
}

function drawSky() {
    let path = "resources/img/skybox/";
    let format = '.jpg';
    let urls = [
        path + 'left' + format, path + 'right' + format,
        path + 'top' + format, path + 'down' + format,
        path + 'front' + format, path + 'back' + format
    ];

    reflectionCube = new THREE.CubeTextureLoader().load(urls);
    reflectionCube.format = THREE.RGBFormat;
    refractionCube = new THREE.CubeTextureLoader().load(urls);
    refractionCube.mapping = THREE.CubeRefractionMapping;
    refractionCube.format = THREE.RGBFormat;
}

Fan = function () {
    this.speed = 0;
    this.acc = 0;
    this.wind = false;
    this.amp = 0;
    this.greenMat = new THREE.MeshLambertMaterial({
        color: 0x698B22,
        shading: THREE.FlatShading
    });

    this.redMat = new THREE.MeshLambertMaterial({
        color: 0xad3525,
        shading: THREE.FlatShading
    });
    this.greyMat = new THREE.MeshLambertMaterial({
        color: 0x653f4c,
        shading: THREE.FlatShading
    });

    this.yellowMat = new THREE.MeshLambertMaterial({
        color: 0xfdd276,
        shading: THREE.FlatShading
    });

    this.blueMat = new THREE.MeshLambertMaterial({
        color: 0x1E90FF,
        shading: THREE.FlatShading,
        transparent: true,
        opacity: 0.5
    });

    let torusGeom = new THREE.TorusGeometry(11, 1.5, 6, 15, 6.3);
    let coneGeom = new THREE.ConeGeometry(10, 100, 7);
    let coreGeom = new THREE.CylinderGeometry(10, 10, 20, 32);
    let sphereGeom = new THREE.BoxGeometry(10, 10, 3);
    let propGeom = new THREE.BoxGeometry(10, 30, 2);
    propGeom.applyMatrix(new THREE.Matrix4().makeTranslation(0, 25, 0));
    let scripGeom = new THREE.BoxGeometry(30, 5, 2);
    scripGeom.applyMatrix(new THREE.Matrix4().makeTranslation(15, 0, 0));

    this.torus = new THREE.Mesh(torusGeom, this.greenMat);
    this.torus.castShadow = true;
    this.torus.receiveShadow = true;
    this.core = new THREE.Mesh(coreGeom, this.greyMat);
    this.core.castShadow = true;
    this.core.receiveShadow = true;
    this.cone = new THREE.Mesh(coneGeom, this.yellowMat);
    this.cone.castShadow = true;
    this.cone.receiveShadow = true;

    // propellers
    let prop1 = new THREE.Mesh(propGeom, this.redMat);
    prop1.castShadow = true;
    prop1.receiveShadow = true;
    prop1.position.z = 15;
    let prop2 = prop1.clone();
    prop2.rotation.z = Math.PI / 2;
    let prop3 = prop1.clone();
    prop3.rotation.z = Math.PI;
    let prop4 = prop1.clone();
    prop4.rotation.z = -Math.PI / 2;

    this.scrip = [];

    this.scrip1 = new THREE.Mesh(scripGeom, this.blueMat);
    this.scrip1.position.x = -19;
    this.scrip1.position.y = 50;
    this.scrip1.position.z = 22;
    this.scrip1.rotation.z = -Math.PI / 2;
    this.scrip2 = this.scrip1.clone();
    this.scrip2.position.x = 0;
    this.scrip2.position.y = 53;
    this.scrip3 = this.scrip1.clone();
    this.scrip3.position.x = 19;
    this.scrip3.position.y = 50;

    this.scrip.push(this.scrip1);
    this.scrip.push(this.scrip2);
    this.scrip.push(this.scrip3);

    this.sphere = new THREE.Mesh(sphereGeom, this.yellowMat);
    this.sphere.castShadow = true;
    this.sphere.receiveShadow = true;
    this.sphere.position.z = 15;

    this.torus.position.z = 15;
    this.torus.scale.x = 5;
    this.torus.scale.y = 5;
    this.torus.scale.z = 5;
    this.core.rotation.x = Math.PI / 2;
    this.cone.position.y = -50;

    this.propeller = new THREE.Group();
    this.propeller.add(prop1);
    this.propeller.add(prop2);
    this.propeller.add(prop3);
    this.propeller.add(prop4);

    this.threescrips = new THREE.Group();
    this.threescrips.add(this.scrip1);
    this.threescrips.add(this.scrip2);
    this.threescrips.add(this.scrip3);

    this.threegroup = new THREE.Group();
    this.threegroup.add(this.torus);
    this.threegroup.add(this.core);
    this.threegroup.add(this.cone);
    this.threegroup.add(this.propeller);
    this.threegroup.add(this.sphere);
    this.threegroup.add(this.threescrips);

    this.threegroup.name = "fan";
};

Fan.prototype.update = function () {
    this.threegroup.position.z = 0;

    if (this.speed < speedControl.speed) {
        this.acc += 0.0001;
        this.speed += this.acc;
    } else if (this.speed > speedControl.speed) {
        this.acc = 0;
        this.amp = 0;
        this.speed *= .98;
    }
    this.propeller.rotation.z += this.speed;


    for (let i = 0; i < this.scrip.length; i++) {
        this.scrip[i].rotation.x = -Math.PI * this.speed + Math.random() * this.speed;
    }
};

function danceAnimate(dance, modelUrl, gui) {
    dance.load(modelUrl, function (object) {

        meshHelper = new THREE.SkeletonHelper(object);
        scene.add(meshHelper);

        mixer = object.mixer = new THREE.AnimationMixer(object);

        object.traverse(function (child) {

            if (child.isMesh) {

                child.castShadow = true;
                child.receiveShadow = true;

            }

        });
        let actions = [];
        let animations = gui.addFolder("animations");

        for (let i = 0; i < object.animations.length; i++) {
            createAction(i);
        }

        function createAction(i) {
            actions[i] = mixer.clipAction(object.animations[i]);
            let name = "dance";
            if (i === 1) {
                name = "stop";
            }
            animationControl[name] = function () {
                for (let j = 0; j < actions.length; j++) {
                    if (j === i) {
                        actions[j].play();
                    } else {
                        actions[j].stop();
                    }
                }
            };

            animations.add(animationControl, name);
        }

        object.scale.set(0.05, 0.05, 0.05);
        object.position.set(-10, 0, -10);
        scene.add(object);
        collision_items.push(object);

    });
}

function addCard2Sidebar(obj) {
    let card = document.createElement("button");
    card.setAttribute("class", "card col-12 col-md-6 btn");
    let img = document.createElement("img");
    img.setAttribute("src", getImage(obj));
    img.setAttribute("class", "img-fluid card-img");
    img.setAttribute("style", "height: 100%;");
    card.appendChild(img);
    card.setAttribute("onclick", "objectToPlace='" + obj.name + "'");
    document.getElementById("tray").appendChild(card);

}

function zoomToFit(objList, cam = TPCamera, con = TPControl) {
    let boundBox = new THREE.Box3();
    for (let object of objList) {
        if (object.visible) {
            boundBox.expandByObject(object);
        }
    }
    boundBox.applyMatrix4(cam.matrixWorldInverse);
    let center = boundBox.getCenter(new THREE.Vector3());
    let size = boundBox.getSize(new THREE.Vector3());
    let cameraP = center.clone();
    cameraP.z = 1 / 2.0 / Math.tan(cam.fov * Math.PI / 360.0);
    cameraP.z = Math.max(size.y * cameraP.z, size.x * cameraP.z / cam.aspect);
    cameraP.z = boundBox.max.z + cameraP.z;
    center.applyMatrix4(cam.matrixWorld);
    cameraP.applyMatrix4(cam.matrixWorld);
    cam.lookAt(center.x, center.y, center.z);
    cam.position.set(cameraP.x, cameraP.y, cameraP.z);
    if (con) {
        con.target.set(center.x, center.y, center.z);
        con.update();
    }
}

function getImage(obj) {
    let rendererTemp = new THREE.WebGLRenderer();
    rendererTemp.setSize("620", "400");

    let sceneTemp = new THREE.Scene();
    let light = newPointLight(1, 0xffffff);
    light.position.set(70, 100, 30);
    sceneTemp.add(light);
    light = newAmbientLight(0.2, 0xffffff);
    sceneTemp.add(light);
    sceneTemp.add(obj);
    sceneTemp.background = new THREE.Color(0xffffff);

    let cameraTemp = new THREE.PerspectiveCamera(75, 620.0 / 400.0, 0.1, 1000);
    cameraTemp.position.set(80, 80, 80);
    cameraTemp.lookAt(new THREE.Vector3(0, 0, 0));
    cameraTemp.updateMatrixWorld();

    let con = new THREE.OrbitControls(cameraTemp);
    con.screenSpacePanning = true;
    con.minDistance = 0.1;
    con.maxDistance = 10000;
    con.target.set(0, 0, 0);
    con.enableKeys = false;
    con.dispose();
    con.update();

    zoomToFit([obj], cameraTemp, con);
    rendererTemp.render(sceneTemp, cameraTemp);
    return rendererTemp.domElement.toDataURL();
}

function changeSidebar(isTray) {
    if (isTray) {
        $("#tray").collapse('show');
        $('#property-panel').collapse('hide');
        $('#switch-sidebar').attr('onclick', "changeSidebar(false);")
    } else {
        $("#tray").collapse('hide');
        $('#property-panel').collapse('show');
        $('#switch-sidebar').attr('onclick', "changeSidebar(true);")
    }
}

function selectObject(obj) {
    objectSelected = obj;
    $('#X').attr('value', obj.position.x);
    $('#Y').attr('value', obj.position.y);
    $('#Z').attr('value', obj.position.z);
    $('#Roll').attr('value', obj.rotation.x);
    $('#Pitch').attr('value', obj.rotation.y);
    $('#Yaw').attr('value', obj.rotation.z);
    $('#Color').attr('value', '#' + obj.material.color.getHexString());
    changeSidebar(false);
}

function addProperty2SideBar(type, name, setting = null, onChange = null) {
    let input = document.createElement('input');
    let label = document.createElement('label');
    label.setAttribute('for', name);
    label.setAttribute('class', 'col-form-label col-3');
    label.innerText = name;
    input.setAttribute('id', name);
    input.setAttribute('class', 'form-control col-9');
    input.setAttribute('type', type);
    if (setting) {
        for (let attr in setting) {
            input.setAttribute(attr, setting[attr]);
        }
    }
    if (onChange) {
        input.addEventListener('change', onChange);

    }
    let form_row = document.createElement('div');
    form_row.setAttribute('class', 'form-row');
    form_row.appendChild(label);
    form_row.appendChild(input);
    document.getElementById('property').appendChild(form_row);
}

function clearPropertyInSideBar() {
    $('#property').empty();
}