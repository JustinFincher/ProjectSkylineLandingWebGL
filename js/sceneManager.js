THREE.DefaultLoadingManager.onStart = function ( url, itemsLoaded, itemsTotal )
{
    // console.log( 'Started loading file: ' + url + '.\nLoaded ' + itemsLoaded + ' of ' + itemsTotal + ' files.' );
};

THREE.DefaultLoadingManager.onLoad = function ( ) {
    // console.log( 'Loading Complete!');
};


THREE.DefaultLoadingManager.onProgress = function ( url, itemsLoaded, itemsTotal ) {
    // console.log( 'Loading file: ' + url + '.\nLoaded ' + itemsLoaded + ' of ' + itemsTotal + ' files.' );
};

THREE.DefaultLoadingManager.onError = function ( url ) {
    // console.log( 'There was an error loading ' + url );
};

if ( ! Detector.webgl ) Detector.addGetWebGLMessage();

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );
    // renderer.render( scene, camera );
}

var terrainSize = 10;

var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera( 30, window.innerWidth / window.innerHeight, 0.1, 2000000 );
var renderer = new THREE.WebGLRenderer();
var containerForTerrains = new THREE.Object3D();
var containerPivot;
var sky,sunSphere,sunLight;
var controls;

function engineUpdate()
{
    requestAnimationFrame( engineUpdate );
    renderer.render( scene, camera );
}

window.onload = function()
{
    renderer.setSize( window.innerWidth, window.innerHeight );
    window.addEventListener( 'resize', onWindowResize, false );
    document.body.appendChild(renderer.domElement);

    camera.position.z = 20;

    // renderer.setClearColor(0x000000,1);
    // renderer.clear();

    // var worker = new Worker('terrainWorker.js');
    // worker.addEventListener('message', function(e)
    // {
    //     engineUpdate();
    // }, false);
    // worker.postMessage({'scene':scene,
    //     'containerForTerrains':containerForTerrains,
    //     'containerPivot':containerPivot,
    //     'camera':camera,
    //     'renderer':renderer,
    //     'sky':sky,
    //     'sunSphere':sunSphere,
    //     'sunLight':sunLight,
    //     'controls':controls
    // }); // Start the worker.


    engineUpdate();

    flyToCoordinate( 10.7927,47.4467,10,1).then(function () {
        initSky();
    });
}



function flyToCoordinate(lon,lat,zoom,boundSize)
{
    var tilex = long2tile(lon,zoom);
    var tiley = lat2tile(lat,zoom);
    return flyToZXY(zoom,tilex,tiley,boundSize);
}
function flyToZXY(z,x,y,boundSize)
{
    return new Promise( (resolve, reject) =>
    {
        containerForTerrains.position.copy(new THREE.Vector3(-x * terrainSize, y * terrainSize, 0));

        var loadingGridArray = [];

        for (var i = x - boundSize; i <= x + boundSize; i++) {
            for (var k = y - boundSize; k <= y + boundSize; k++)
            {
                console.log(i,k);
                console.log(i - x + boundSize, k - y + boundSize);
                loadingGridArray[(i - x + boundSize) * (1+ boundSize * 2) + (k - y + boundSize)] = {'x':i,'y':k};
            }
        }
        console.log(loadingGridArray);
        Promise.each(loadingGridArray, (vec) =>
        {
            var t = new TerrainTile();
            return t.loadzxy(z, vec.x, vec.y, containerForTerrains);
        }).then( () =>
        {
            console.log("Loading Terrain Grid Done");
            containerPivot = new THREE.Object3D();
            containerPivot.position=new THREE.Vector3(0,0,0);
            containerPivot.add(containerForTerrains);
            scene.add(containerPivot);
            containerPivot.rotation.x = - Math.PI / 2;

            // self.postMessage();
            resolve();
        });
    });
}

function initSky() {
    // var ambientLight = new THREE.AmbientLight( 0x101010 ); // soft white light
    // scene.add( ambientLight );

    // Add Sky
    sky = new THREE.Sky();
    sky.scale.setScalar( 450000 );
    scene.add( sky );
    // Add Sun Helper
    sunSphere = new THREE.Mesh(
        new THREE.SphereBufferGeometry( 20, 16, 8 ),
        new THREE.MeshBasicMaterial( { color: 0xffffff } )
    );
    sunSphere.position.y = - 700000;
    sunSphere.visible = true;
    scene.add( sunSphere );


    sunLight = new THREE.DirectionalLight( 0xffffff, 1.2 );
    sunSphere.add( sunLight );
    sunLight.target = containerPivot;

    /// GUI
    var effectController  = {
        turbidity: 12.7,
        rayleigh: 2.9,
        mieCoefficient: 0.005,
        mieDirectionalG: 0.8,
        luminance: 1,
        inclination: 0.49, // elevation / inclination
        azimuth: 0.25, // Facing front,
        sun: true
    };
    var distance = 400000;
    function guiChanged() {
        var uniforms = sky.material.uniforms;
        uniforms.turbidity.value = effectController.turbidity;
        uniforms.rayleigh.value = effectController.rayleigh;
        uniforms.luminance.value = effectController.luminance;
        uniforms.mieCoefficient.value = effectController.mieCoefficient;
        uniforms.mieDirectionalG.value = effectController.mieDirectionalG;
        var theta = Math.PI * ( effectController.inclination - 0.5 );
        var phi = 2 * Math.PI * ( effectController.azimuth - 0.5 );
        sunSphere.position.x = distance * Math.cos( phi );
        sunSphere.position.y = distance * Math.sin( phi ) * Math.sin( theta );
        sunSphere.position.z = distance * Math.sin( phi ) * Math.cos( theta );
        sunSphere.visible = effectController.sun;
        uniforms.sunPosition.value.copy( sunSphere.position );
        // renderer.render( scene, camera );
    }
    var gui = new dat.GUI();
    gui.add( effectController, "turbidity", 1.0, 20.0, 0.1 ).onChange( guiChanged );
    gui.add( effectController, "rayleigh", 0.0, 4, 0.001 ).onChange( guiChanged );
    gui.add( effectController, "mieCoefficient", 0.0, 0.1, 0.001 ).onChange( guiChanged );
    gui.add( effectController, "mieDirectionalG", 0.0, 1, 0.001 ).onChange( guiChanged );
    gui.add( effectController, "luminance", 0.0, 2 ).onChange( guiChanged );
    gui.add( effectController, "inclination", 0, 1, 0.0001 ).onChange( guiChanged );
    gui.add( effectController, "azimuth", 0, 1, 0.0001 ).onChange( guiChanged );
    gui.add( effectController, "sun" ).onChange( guiChanged );
    guiChanged();

    controls = new THREE.OrbitControls( camera, renderer.domElement );
    controls.addEventListener( 'change', renderer );
    //controls.maxPolarAngle = Math.PI / 2;
    controls.enableZoom = true;
    controls.enablePan = true;

    // var helper = new THREE.GridHelper( 100, 10, 0xffffff, 0xffffff );
    // scene.add( helper );
}
