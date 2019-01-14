function addSidebar() {
    addCard2Sidebar(drawBed);
    addCard2Sidebar(() => drawBox(1, 1, 1));

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
    addProperty2SideBar('number', 'ScaleX', {'step': 0.01, 'placeholder': 'NaN'}, (event) => {
        if (objectSelected) {
            objectSelected.scale.x = event.target.value;
        } else {
            alert('No object is selected now!');
            event.target.value = null;
        }
    });
    addProperty2SideBar('number', 'ScaleY', {'step': 0.01, 'placeholder': 'NaN'}, (event) => {
        if (objectSelected) {
            objectSelected.scale.y = event.target.value;
        } else {
            alert('No object is selected now!');
            event.target.value = null;
        }
    });
    addProperty2SideBar('number', 'ScaleZ', {'step': 0.01, 'placeholder': 'NaN'}, (event) => {
        if (objectSelected) {
            objectSelected.rotation.z = event.target.value;
        } else {
            alert('No object is selected now!');
            event.target.scale.z = null;
        }
    });
    addProperty2SideBar('color', 'Color', null, (event) => {
        if (objectSelected) {
            if (objectSelected.material.color !== undefined) {
                objectSelected.material.color.setStyle(event.target.value);
            } else {
                alert('You cannot change the color!');
                event.target.value = '#000000';
            }
        } else {
            alert('No object is selected now!');
            event.target.value = '#000000';
        }
    });
    let btn = document.createElement('button');
    //btn.setAttribute('id', 'Delete');
    btn.setAttribute('class', 'btn btn-primary');
    btn.innerText = 'Delete';
    btn.addEventListener('click', (event) => {
        objectSelected.parent.remove(objectSelected);
        selectObject(null)
    }, false);
    let form_row = document.createElement('div');
    form_row.setAttribute('class', 'form-row');
    form_row.appendChild(btn);
    document.getElementById('property-panel').appendChild(form_row);
}

function addCard2Sidebar(createObjFun) {
    let card = document.createElement("button");
    card.setAttribute("class", "card col-12 col-md-6 btn");
    let img = document.createElement("img");
    img.setAttribute("src", getImage(createObjFun()));
    img.setAttribute("class", "img-fluid card-img");
    img.setAttribute("style", "height: 100%;");
    card.appendChild(img);
    clickFun = (event) => {
        let obj = createObjFun();
        scene.add(obj);
        objectToPlace = obj;
        collision_items.push(obj);
        pick_items.push(obj);
    };
    card.addEventListener('click', clickFun);
    document.getElementById("tray").appendChild(card);
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
    } else {
        $("#tray").collapse('hide');
        $('#property-panel').collapse('show');
    }
}

function selectObject(obj) {
    objectSelected = obj;
    if (obj != null) {
        $('#X').attr('value', obj.position.x);
        $('#Y').attr('value', obj.position.y);
        $('#Z').attr('value', obj.position.z);
        $('#Roll').attr('value', obj.rotation.x);
        $('#Pitch').attr('value', obj.rotation.y);
        $('#Yaw').attr('value', obj.rotation.z);
        if (obj.material.color !== undefined) {
            document.getElementById('Color').value = '#'+obj.material.color.getHexString();
        } else {
            document.getElementById('Color').value = '#ffffff';
        }
        $('#ScaleX').attr('value', obj.scale.x);
        $('#ScaleY').attr('value', obj.scale.y);
        $('#ScaleZ').attr('value', obj.scale.z);
        changeSidebar(false);
    } else {
        changeSidebar(true);
    }
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