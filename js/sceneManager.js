var globalLoaderProgress = 0;

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

var container = document.getElementById( 'container' );
stats = new Stats();
container.appendChild( stats.dom );

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );
}

var terrainSize = 30;

var terrainScene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera( 30, window.innerWidth / window.innerHeight, 0.1, 2000000 );
var renderer = new THREE.WebGLRenderer();
var containerForTerrains = new THREE.Object3D();
var containerPivot;
var sky,sunSphere,sunLight;

var sunEffectValue = {
    turbidity: 12.7,
    rayleigh: 2.9,
    mieCoefficient: 0.005,
    mieDirectionalG: 0.8,
    luminance: 1,
    inclination: 0.49, // elevation / inclination
    azimuth: 0.25, // Facing front,
    sun: true
};
var sunEffectParameter = new Proxy(sunEffectValue, {
    set: function(ob, prop, value)
    {
        ob[prop] = value;
        initSun();

        return true;
    }
});
var controls;
var phone;


function engineUpdate()
{
    requestAnimationFrame( engineUpdate );
    stats.update();
    renderer.render( terrainScene, camera );
}

window.onload = function()
{
    renderer.setSize( window.innerWidth, window.innerHeight );
    window.addEventListener( 'resize', onWindowResize, false );
    document.body.appendChild(renderer.domElement);

    camera.position.z = 100;

    flyToCoordinate( 10.7927,47.4467,10,1).then(function ()
    {
        return initENV();
    }).then(function ()
    {
        return initPhone();
    }).then(function ()
    {
        engineUpdate();
        $( "#spinner" ).fadeOut();
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
            terrainScene.add(containerPivot);
            containerPivot.rotation.x = - Math.PI / 2;

            resolve();
        });
    });
}

function initENV()
{
    return new Promise( (resolve, reject) =>
        {
            sky = new THREE.Sky();
            sky.scale.setScalar( 450000 );
            terrainScene.add( sky );
            // Add Sun Helper
            sunSphere = new THREE.Mesh(
                new THREE.SphereBufferGeometry( 20, 16, 8 ),
                new THREE.MeshBasicMaterial( { color: 0xffffff } )
            );
            sunSphere.position.y = - 700000;
            sunSphere.visible = true;
            terrainScene.add( sunSphere );


            sunLight = new THREE.DirectionalLight( 0xffffff, 1.2 );
            sunSphere.add( sunLight );
            sunLight.target = containerPivot;

            initSun();

            controls = new THREE.OrbitControls( camera, renderer.domElement );
            controls.addEventListener( 'change', renderer );
            //controls.maxPolarAngle = Math.PI / 2;
            controls.enableZoom = true;
            controls.enablePan = true;

            resolve();
        }
    );
}

function initSun()
{
    var distance = 400000;
    var uniforms = sky.material.uniforms;
    uniforms.turbidity.value = sunEffectParameter.turbidity;
    uniforms.rayleigh.value = sunEffectParameter.rayleigh;
    uniforms.luminance.value = sunEffectParameter.luminance;
    uniforms.mieCoefficient.value = sunEffectParameter.mieCoefficient;
    uniforms.mieDirectionalG.value = sunEffectParameter.mieDirectionalG;
    var theta = Math.PI * ( sunEffectParameter.inclination - 0.5 );
    var phi = 2 * Math.PI * ( sunEffectParameter.azimuth - 0.5 );
    sunSphere.position.x = distance * Math.cos( phi );
    sunSphere.position.y = distance * Math.sin( phi ) * Math.sin( theta );
    sunSphere.position.z = distance * Math.sin( phi ) * Math.cos( theta );
    sunSphere.visible = sunEffectParameter.sun;
    uniforms.sunPosition.value.copy( sunSphere.position );
}

function initPhone()
{
    return new Promise((resolve, reject) =>
    {
        var loader = new THREE.OBJLoader();

        loader.load(
            'obj/s7/s7.obj',
            function ( object )
            {
                phone = object;
                terrainScene.add( object );
                phone.rotation.x = Math.PI/2;

                //必要的材质 -。- C4D => THREE
                //三星 Logo
                phone.children.find(x => x.name == 'sideAndBack').material.find(x => x.name == 'default').color = new THREE.Color("rgb(181, 181, 181)");
                phone.children.find(x => x.name == 'frontAndScreen').material.find(x => x.name == 'fundo').color = new THREE.Color("rgb(0, 0, 0)");
                phone.children.find(x => x.name == 'frontAndScreen').material.find(x => x.name == 'Borda').color = new THREE.Color("rgb(200, 200, 200)");
                phone.children.find(x => x.name == 'frontAndScreen').material.find(x => x.name == 'preto').color = new THREE.Color("rgb(255, 255, 255)");
                phone.children.find(x => x.name == 'frontAndScreen').material.find(x => x.name == 'screenMat').color = new THREE.Color("rgb(0, 0, 0)");
                phone.children.find(x => x.name == 'frontAndScreen').material.find(x => x.name == 'default').color = new THREE.Color("rgb(100, 100, 100)");
                phone.children.find(x => x.name == 'sensor').material.color = new THREE.Color("rgb(100, 100, 100)");



                resolve(object);
            },
            // called when loading is in progresses
            function ( xhr ) {
                console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );
            },
            // called when loading has errors
            function ( error ) {
                console.log( 'An error happened' );
                reject();
            }
        );
    });

}