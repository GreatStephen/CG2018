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

let mixer;

function drawDancer(modelUrl, gui) {
    let dance = new THREE.FBXLoader();
    let obj = new THREE.Object3D();
    dance.load(modelUrl, function (object) {

        let meshHelper = new THREE.SkeletonHelper(object);
        scene.add(meshHelper);
        gui.add({skeleton: true}, "skeleton").onChange(
            function (e) {
                meshHelper.visible = e;
            }
        );

        mixer = object.mixer = new THREE.AnimationMixer(object);

        object.traverse(function (child) {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
        let actions = [];
        let animationControl = {};
        let animations = gui.addFolder("animations");
        actions[0] = mixer.clipAction(object.animations[0]);
        actions[1] = mixer.clipAction(object.animations[1]);

        for (let i = 0; i < object.animations.length; i++) {
            createAction(i);
        }


        function createAction(i) {
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
        obj.add(object);
    });
    return obj;
}