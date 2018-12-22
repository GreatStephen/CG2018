// global
let scene = new THREE.Scene(),
    FPCamera = new THREE.PerspectiveCamera(50, 1, 0.01, 1000),    // first-person camera
    TPCamera = new THREE.PerspectiveCamera(75, 1, 0.01, 1000),   // third-person camera
    renderer = new THREE.WebGLRenderer({ antialias: true }),
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

var speedControl = new function () {
    this.speed = 0;
};

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
}

function buildScene() {

    var gridHelper = new THREE.GridHelper( 1000, 20 );
    scene.add( gridHelper );

    var shadowMaterial = new THREE.ShadowMaterial( { color: 0x000000 } );
    shadowMaterial.opacity = 0.5;
    var groundMesh = new THREE.Mesh(
        new THREE.BoxGeometry( 100, .1, 100 ),
        shadowMaterial
    );
    groundMesh.receiveShadow = true;
    groundMesh.layers.mask = 0xffffffff;
    scene.add( groundMesh );

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


    let bed1 = Draw_Bed();
    bed1.position.set (20, 0, 0);
    bed1.scale.x = 0.2;
    bed1.scale.y = 0.2;
    bed1.scale.z = 0.2;
    bed1.layers.mask = 0xffffffff;
    bed1.layers.set(1);
    scene.add(bed1);

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

    var fan = new Fan();
    fan.threegroup.layers.mask = 0xffffffff;
    fan.threegroup.scale.x = 0.1;
    fan.threegroup.scale.y = 0.1;
    fan.threegroup.scale.z = 0.1;
    fan.threegroup.position.y = 10;
    fan.threegroup.position.x = -20;
    fan.threegroup.animate = function(){
        fan.update();
    };
    scene.add(fan.threegroup);

    // point light
    light = newPointLight();
    light.position.set(-50, 20, 100);
    light.layers.mask = 0xffffffff;
    light.castShadow = true;        //Set up shadow properties for the light
    light.shadow.mapSize.width = 2048;
    light.shadow.mapSize.height = 2048;
    light.shadow.camera.near = 0.5;
    light.shadow.camera.far = 500;
    scene.add(light);

    // ambient light
    light = newAmbientLight();
    scene.add(light);

    var gui = new dat.GUI();
    gui.add(speedControl, 'speed',0, 0.5).name("Speed");
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
        FPControl.getObject().rotateY((Number(turnleft)-Number(turnright))*deltaT*5);
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
            if(!FPControl.isLocked) turnleft = true;
            break;
        case 69:
            if(!FPControl.isLocked) turnright = true;
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
    const mat = new THREE.MeshLambertMaterial({color: color});
    const cube = new THREE.Mesh(geom, mat);
    cube.name = "cube";
    return cube;
}


function newPointLight() {
    const light =  new THREE.PointLight(0xffffff, 1, 0, 2);
    light.name = "point_light";
    return light;
}

function newAmbientLight() {
    const light =  new THREE.AmbientLight(0xffffff, 0.2);
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
        function onLoadMtl (materials) {
            Loader.setMaterials(materials);
            Loader.setModelName( 'door' );
            Loader.load('model/Room-Door/Door_Component_BI3.obj',
                function onLoad(event) {
                    event.detail.loaderRootNode.traverse((child) => {child.layers.mask = 0xffffffff;});
                    door.add(event.detail.loaderRootNode);
                });
        });
    door.name = "door";
    return door;
}

function Draw_Pillar (ball_size, cylinder_height) {
    const ball = new THREE.Mesh(
        new THREE.OctahedronGeometry(ball_size,2),
        new THREE.MeshStandardMaterial( {
            color: 0x72bdbf,
            shading: THREE.FlatShading ,
            metalness: 0,
            roughness: 0.8,
            refractionRatio: 0.25
        } )
    );
    ball.position.y += cylinder_height;
    ball.castShadow = true;
    ball.receiveShadow = true;
    ball.rotateZ(Math.random()*Math.PI*2);
    ball.rotateY(Math.random()*Math.PI*2);

    const cylinder = new THREE.Mesh(
        new THREE.CylinderGeometry( 5, 5, cylinder_height, 32 ),
        new THREE.MeshStandardMaterial( {
            color: 0xf8db08,
            shading: THREE.FlatShading ,
            metalness: 0,
            roughness: 0.8,
            refractionRatio: 0.25
        } )
    );
    cylinder.position.y = cylinder_height/2;
    cylinder.castShadow = true;
    cylinder.receiveShadow = true;

    const pillar = new THREE.Group();
    pillar.add(ball);
    pillar.add(cylinder);

    return pillar;
}

function Draw_Box(x,y,z) {
    const box = new THREE.Mesh(
        new THREE.BoxGeometry( x,y,z ),
        new THREE.MeshStandardMaterial( {
            color: 0x3CB371,
            shading: THREE.FlatShading ,
            metalness: 0,
            roughness: 0.8,
            refractionRatio: 0.25
        } )
    );
    box.castShadow = true;
    box.receiveShadow = true;

    return box;
}

function Draw_Bed() {
    const pillar1 = Draw_Pillar(6,50);
    pillar1.position.x -= 30;

    const pillar2 = Draw_Pillar(6,50);
    pillar2.position.x += 30;

    const pillar3 = Draw_Pillar(6,30);
    pillar3.position.x += 30;
    pillar3.position.z += 100;

    const pillar4 = Draw_Pillar(6,30);
    pillar4.position.x -= 30;
    pillar4.position.z += 100;

    const board1 = Draw_Box(60,40,5);
    board1.position.y += 20;

    const box1 = Draw_Box(60,20,100);
    box1.position.y += 15;
    box1.position.z += 50;

    const bed = new THREE.Group();
    bed.add(pillar1);
    bed.add(pillar2);
    bed.add(pillar3);
    bed.add(pillar4);
    bed.add(board1);
    bed.add(box1);

    return bed;
}

Fan = function(){
    this.speed = 0;
    this.acc = 0;
    this.wind=false;
    this.amp=0;
    this.greenMat = new THREE.MeshLambertMaterial({
        color: 0x698B22,
        shading:THREE.FlatShading
    });

    this.redMat = new THREE.MeshLambertMaterial ({
        color: 0xad3525,
        shading:THREE.FlatShading
    });
    this.greyMat = new THREE.MeshLambertMaterial ({
        color: 0x653f4c,
        shading:THREE.FlatShading
    });

    this.yellowMat = new THREE.MeshLambertMaterial ({
        color: 0xfdd276,
        shading:THREE.FlatShading
    });

    this.blueMat = new THREE.MeshLambertMaterial ({
        color: 0x1E90FF,
        shading:THREE.FlatShading,
        transparent: true,
        opacity: 0.5
    });

    var torusGeom = new THREE.TorusGeometry(11,1.5,6,15,6.3);
    var coneGeom = new THREE.ConeGeometry(10,100,7);
    var coreGeom = new THREE.CylinderGeometry( 10, 10, 20, 32 );
    var sphereGeom = new THREE.BoxGeometry(10, 10, 3);
    var propGeom = new THREE.BoxGeometry(10,30,2);
    propGeom.applyMatrix( new THREE.Matrix4().makeTranslation( 0,25,0) );
    var scripGeom = new THREE.BoxGeometry(30,5,2);
    scripGeom.applyMatrix( new THREE.Matrix4().makeTranslation( 15, 0, 0 ) );

    this.torus = new THREE.Mesh(torusGeom, this.greenMat);
    this.torus.castShadow = true;
    this.torus.receiveShadow = true;
    this.core = new THREE.Mesh(coreGeom,this.greyMat);
    this.core.castShadow = true;
    this.core.receiveShadow = true;
    this.cone = new THREE.Mesh(coneGeom, this.yellowMat);
    this.cone.castShadow = true;
    this.cone.receiveShadow = true;

    // propellers
    var prop1 = new THREE.Mesh(propGeom, this.redMat);
    prop1.castShadow = true;
    prop1.receiveShadow = true;
    prop1.position.z = 15;
    var prop2 = prop1.clone();
    prop2.rotation.z = Math.PI/2;
    var prop3 = prop1.clone();
    prop3.rotation.z = Math.PI;
    var prop4 = prop1.clone();
    prop4.rotation.z = -Math.PI/2;

    this.scrip = [];

    this.scrip1 = new THREE.Mesh(scripGeom, this.blueMat);
    this.scrip1.position.x = -19;
    this.scrip1.position.y = 50;
    this.scrip1.position.z = 22;
    this.scrip1.rotation.z = -Math.PI/2;
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
    this.core.rotation.x =  Math.PI/2;
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
}

Fan.prototype.update = function(){


    this.threegroup.position.z=0;

    if (this.speed<speedControl.speed) {
        this.acc += 0.0001;
        this.speed += this.acc;
    }
    else if (this.speed>speedControl.speed){
        this.acc = 0;
        this.amp = 0;
        this.speed *= .98;
    }
    this.propeller.rotation.z += this.speed;


    for (var i = 0; i < this.scrip.length; i++) {
        this.scrip[i].rotation.x = -Math.PI*this.speed+Math.random()*this.speed;
    }
}

main();