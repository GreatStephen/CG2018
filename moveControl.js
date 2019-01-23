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

// mouse detection
let raycaster4 = new THREE.Raycaster();
let mouse = new THREE.Vector2();
let pick_items = [];
let intersects4;


function moveCamera() {
    let deltaT = clock.getDelta();

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

    //if(intersects1.length!=0) console.log(intersects1);
    if (intersects1.length !== 0 && intersects1[0].distance < COLLOSION_DIST) {
        isCollision = true;
        agentVelocity.x = 0;
        agentVelocity.z = 0;
        agentVelocity.y -= 9.8 * deltaT * 10.0;
    }
    if (intersects2.length !== 0 && intersects2[0].distance < COLLOSION_DIST) {
        isCollision = true;
        agentVelocity.x = 0;
        agentVelocity.z = 0;
        agentVelocity.y -= 9.8 * deltaT * 10.0;
    }
    if (intersects3.length !== 0 && intersects3[0].distance < COLLOSION_DIST) {
        isCollision = true;
        agentVelocity.x = 0;
        agentVelocity.z = 0;
        agentVelocity.y -= 9.8 * deltaT * 10.0;
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

    }

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

    //mouse
    TPCamera.updateMatrixWorld();
    raycaster4.setFromCamera(mouse, TPCamera);

    intersects4 = raycaster4.intersectObjects(pick_items, true);
    // if (intersects4.length != 0) console.log(intersects4[0]);

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