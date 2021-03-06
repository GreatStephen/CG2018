# Computer Graphic

Aim to finish a Minecraft-like game with 3.js. It is designed to have two modes. In the fullscreen mode, the agent uses a first-person perspective but cannot modify any blocks. In the window mode, the agent uses a third-person perspective and can add, delete and modify the blocks.

## Functions

The webpage begins with the third-person perspective. Keyboard and mouse control instructions are as follows.

* Mouse: control the view

    * drag (left button): rotate
    * drag (right button): translate
    * scroll: zoom
    * double click: enter full screen

* Keyboard: control the agent

    * WASD: move forward/left/backward/right
    * QE: turn left/right

Controls in fullscreen mode are listed below.

* Mouse: adjust view direction

* Keyboard: control the agent

    * WASD: move forward/left/backward/right
    * space: jump
    * esc: go back to window mode

## Change Log

### 2018/12/15 by Jiangeng Dong

* finish the basic movement control for the two modes

    One remaining problem is that the CG.html cannot be opened directly with Chrome because the **CORS** policy prevents the html from loading models locally. The solution I used this afternoon is to run the webpage in WebStorm, which can ignore the **CORS** policy. Another solution is to use a server or something like that and use a url like [http://127.0.0.1/modelResources](http://127.0.0.1/...).
    
### 2018/12/17 by Jiangeng Dong

* add a door to the scene

    There still exist a problem with texture.
    
* add texture to the door

    Instead of OBJLoader, we use OBJLoader2 which can load materials from *.mtl files
    
* add ambient light for better performance

### 2018/12/21 by Jiangeng Dong

* add a side bar

* realize the function of importing mesh locally

### 2018/12/23 by Jiangeng Dong

* add buttons to sidebar

    click on the button, and the value of 'objectToPlace' will change. Maybe we can attach an 'onchange' event to this variable.

## TODO

* shadows
* collision detection
* texture
* ...
