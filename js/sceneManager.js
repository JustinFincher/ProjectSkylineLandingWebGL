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
    render();
}

var terrainSize = 3;

var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 0.1, 2000000 );
var renderer = new THREE.WebGLRenderer();
var containerForTerrains = new THREE.Object3D();
var sky,sunSphere;
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

    camera.position.z = 10;

    // camera.rotation.x = 1.4;
    // camera.position.y = -25;

    engineUpdate();


    flyToCoordinate( -118.243683,34.052235,8,2);
}

function flyToCoordinate(lon,lat,zoom,boundSize)
{
    var tilex = long2tile(lon,zoom);
    var tiley = lat2tile(lat,zoom);
    return flyToZXY(zoom,tilex,tiley,boundSize);
}
function flyToZXY(z,x,y,boundSize)
{
    return new Promise(function (resolve, reject) {
        scene.remove(containerForTerrains);
        scene.add(containerForTerrains);
        containerForTerrains.position.copy(new THREE.Vector3(-x * terrainSize, y * terrainSize, 0));
        containerForTerrains.origin
        for (var i = x - boundSize; i <= x + boundSize; i++) {
            for (var k = y - boundSize; k <= y + boundSize; k++) {
                new TerrainTile().loadzxy(z, i, k, containerForTerrains);
            }
        }
    });
}