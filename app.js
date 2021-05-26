var xDown = null;                                                        
var yDown = null;

function getTouches(evt) {
  return evt.touches ||             // browser API
         evt.originalEvent.touches; // jQuery
}                                                     

function handleTouchStart(evt) {
    const firstTouch = getTouches(evt)[0];                                      
    xDown = firstTouch.clientX;                                      
    yDown = firstTouch.clientY;                                      
}

function handleTouchMove(evt) {
    if ( ! xDown || ! yDown ) {
        return;
    }

    var xUp = evt.touches[0].clientX;                                    
    var yUp = evt.touches[0].clientY;

    var xDiff = xDown - xUp;
    var yDiff = yDown - yUp;

    if ( Math.abs( xDiff ) > Math.abs( yDiff ) ) {/*most significant*/
        if ( xDiff > 0 ) {
            /* left swipe */
            onWindowKeyDown({ keyCode: 39 })
        } else {
            /* right swipe */
            onWindowKeyDown({ keyCode: 37 })
        }                       
    }
    /* reset values */
    xDown = null;
    yDown = null;                                             
}

let camera, scene, renderer, cameraVelocity = 0, rotations = [
    0,
    -0.7,
    -1.2,
    -1.54,
    -1.0,
    -0.35,
    0.35
], rotationIndex = 0, dir=0;
const CAMERA_VELOCITY_THRESHOLD = 0.005;
const CAMERA_VELOCITY = 0.5;

init();
render();

function init() {

    const container = document.createElement('div');
    document.body.appendChild(container);

    scene = new THREE.Scene();

    new THREE.RGBELoader()
        .setDataType(THREE.UnsignedByteType)
        .load('venice_sunset_1k.hdr', function (texture) {

            const envMap = pmremGenerator.fromEquirectangular(texture).texture;

            scene.background = envMap;
            scene.environment = envMap;

            texture.dispose();
            pmremGenerator.dispose();

            render();

            // model

            const loader = new THREE.GLTFLoader();
            loader.load('mimo.glb', function (model) {

                scene.add(model.scene);

                camera = model.cameras[0];

                camera.aspect = window.innerWidth / window.innerHeight;
                camera.zoom = (16/9) * camera.aspect / 4;
                camera.updateProjectionMatrix();

                render();

            });

        });

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1;
    renderer.outputEncoding = THREE.sRGBEncoding;
    container.appendChild(renderer.domElement);

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    pmremGenerator.compileEquirectangularShader();

    window.addEventListener('resize', onWindowResize);
    window.addEventListener('keydown', onWindowKeyDown);

    window.addEventListener('touchstart', handleTouchStart, false);        
    window.addEventListener('touchmove', handleTouchMove, false);

    window.onload = function() {
        let audio = document.getElementById("music");
        console.log(audio.volume);
        audio.volume = 0.5;
        audio.play();
    }
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.zoom = (16/9) * camera.aspect / 4;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    render();
}

function onWindowKeyDown(event) {
    if (!camera) return

    if (event.keyCode == 37 && rotationIndex > 0) {
        // right arrow
        rotationIndex -= 1;
        dir = 1;
        render();
    }

    if (event.keyCode == 39 && rotationIndex < rotations.length) {
        // right arrow
        rotationIndex += 1;
        dir = -1;
        render();
    }
}

//

function render() {
    if (!scene || !camera) return;
    if (camera.rotation.y !== rotations[rotationIndex]) {
        camera.rotateOnAxis(new THREE.Vector3( 0, 1, 0 ), dir * CAMERA_VELOCITY * Math.PI / 180);
        if (rotations[rotationIndex] - camera.rotation.y <  0.005 && rotations[rotationIndex] - camera.rotation.y > -0.005 )
            camera.rotation.y = rotations[rotationIndex]
        window.requestAnimationFrame(render)
    }
    renderer.render(scene, camera);
}
