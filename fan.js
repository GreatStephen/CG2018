let speedControl = new function () {
    this.speed = 0;
};

let Fan = function () {
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