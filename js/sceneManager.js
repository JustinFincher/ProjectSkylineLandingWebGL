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

// var container = document.getElementById( 'stats' );
stats = new Stats();
// container.appendChild( stats.dom );

function onWindowResize() {
    phoneCamera.aspect = window.innerWidth / window.innerHeight;
    terrainCamera.aspect = 1.0/2.0;
    terrainCamera.updateProjectionMatrix();
    phoneCamera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );
}

var terrainSize = 10;

var locationsToGo =
    [
        {lon:10.7927,lat:47.4467,zoom:10},
        {lon:98.3947,lat:27.2578,zoom:10},
        {lon:-122.7838,lat:37.9832,zoom:12},
        {lon:131.0366,lat:-25.3454,zoom:14},
        {lon:114.1802,lat:22.2572,zoom:10},
        {lon:-7.7748,lat:31.1323,zoom:10},
        {lon:40.2548,lat:43.3103,zoom:11},
        {lon:-71.4981,lat:10.8865,zoom:10}
    ]

var terrainScene = new THREE.Scene();
var phoneScene = new THREE.Scene();
var phoneCamera = new THREE.PerspectiveCamera( 30, window.innerWidth / window.innerHeight, 0.1, 2000000 );
var terrainCamera = new THREE.PerspectiveCamera( 30,1.0/2.0, 0.1, 2000000 );
var renderer = new THREE.WebGLRenderer();
var containerForTerrains = new THREE.Object3D();
var containerPivot;
var sky,sunSphere,sunLight;

var sunEffectValue = {
    turbidity: 20,
    rayleigh: 1.769,
    mieCoefficient: 0.001,
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

if (bowser.osname == 'ios' || bowser.osname =='android')
{
    var renderTarget = new THREE.WebGLRenderTarget( 512, 1024, { format: THREE.RGBFormat, minFilter: THREE.LinearFilter, magFilter: THREE.NearestFilter} );
}else
{
    var renderTarget = new THREE.WebGLRenderTarget( 1024, 2048, { format: THREE.RGBFormat, minFilter: THREE.LinearFilter, magFilter: THREE.NearestFilter} );
}

var hidden, state, visibilityChange;
if (typeof document.hidden !== "undefined") {
    hidden = "hidden";
    visibilityChange = "visibilitychange";
    state = "visibilityState";
} else if (typeof document.mozHidden !== "undefined") {
    hidden = "mozHidden";
    visibilityChange = "mozvisibilitychange";
    state = "mozVisibilityState";
} else if (typeof document.msHidden !== "undefined") {
    hidden = "msHidden";
    visibilityChange = "msvisibilitychange";
    state = "msVisibilityState";
} else if (typeof document.webkitHidden !== "undefined") {
    hidden = "webkitHidden";
    visibilityChange = "webkitvisibilitychange";
    state = "webkitVisibilityState";
}
document.addEventListener(visibilityChange, function()
{
    if (!document.hidden)
    {
        renderGraphic();
    }
}, false);

function engineUpdate(time)
{
    requestAnimationFrame( engineUpdate );
    stats.update();
    renderGraphic();

    TWEEN.update(time);
}
function renderGraphic()
{
    renderer.render( terrainScene, terrainCamera, renderTarget ,false);
    renderer.render( phoneScene, phoneCamera );
    //
    // renderer.render( terrainScene, phoneCamera );
}

window.onload = function()
{
    renderer.setSize( window.innerWidth, window.innerHeight );
    window.addEventListener( 'resize', onWindowResize, false );
    document.body.appendChild(renderer.domElement);

    terrainCamera.position.copy(new THREE.Vector3(0, 10 ,50));
    terrainCamera.lookAt(new THREE.Vector3(0,12,0));

    phoneCamera.position.z = 5;
    phoneCamera.position.y = 3.6;

    $('#loadingBar')
        .progress(
            {
                percent: 0,
                text: {
                    active  : 'Loading'
                }
            });

   var loc = locationsToGo[Math.floor(Math.random() * locationsToGo.length)];
   console.log(loc);
    flyToCoordinate( loc.lon,loc.lat,loc.zoom,1).then(function ()
    {
        $('#loadingBar')
            .progress(
                {
                    percent: 80,
                    text: {
                        active  : 'Loading Phone Model'
                    }
                });
        return initPhone();
    }).then(function ()
    {
        $('#loadingBar')
            .progress(
                {
                    percent: 90,
                    text: {
                        active  : 'Loading Environment'
                    }
                });
        return initENV();
    }).then(function ()
    {
        $('#loadingBar')
            .progress(
                {
                    percent: 100,
                    text: {
                        active  : 'Done'
                    }
                });
        engineUpdate();
        $( "#loading" ).fadeOut();
        playSequence();
    });
}



function flyToCoordinate(lon,lat,zoom,boundSize)
{
    var tilex = long2tile(lon,zoom);
    var tiley = lat2tile(lat,zoom);

    console.log(tilex,tiley);
    return flyToZXY(zoom,tilex,tiley,boundSize);
}
function flyToZXY(z,x,y,boundSize)
{
    return new Promise( (resolve, reject) =>
    {
        $('#loadingBar')
            .progress(
                {
                    percent: 10,
                    text: {
                        active  : 'Loading terrains'
                    }
                });

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
        this.gridTileCount = 0;
        var loadingGridPromiseArray = [];
        for (var i = 0; i < loadingGridArray.length; i++)
        {
            loadingGridPromiseArray[i] = new Promise((resolve, reject) =>
            {
                this.gridTileCount++;
                console.log("Doing Loading ZXY with Grid Tile Count = " + this.gridTileCount);
                var t = new TerrainTile();
                $('#loadingBar')
                    .progress(
                        {
                            percent: this.gridTileCount/loadingGridArray.length * 80 / 2,
                            text: {
                                active  : 'Loaded terrain ' + this.gridTileCount / 2 + " / " + loadingGridArray.length
                            }
                        });

                t.loadzxy(z, loadingGridArray[i].x, loadingGridArray[i].y, containerForTerrains).then(() =>
                {
                    console.log("Done Loading ZXY with Grid Tile Count = " + this.gridTileCount);
                    this.gridTileCount++;
                    $('#loadingBar')
                        .progress(
                            {
                                percent: this.gridTileCount/loadingGridArray.length * 80 / 2,
                                text: {
                                    active  : 'Loaded terrain ' + this.gridTileCount / 2 + " / " + loadingGridArray.length
                                }
                            });
                    resolve();
                });
            });
        }

        var gridTileCount = 0;
        Promise.all(loadingGridPromiseArray).then( () =>
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
            var ambientLight = new THREE.AmbientLight( 0x404040 ); // soft white light
            phoneScene.add( ambientLight );
            var phoneStudioLight = new THREE.DirectionalLight( 0xffffff, 1.0 );
            phoneScene.add( phoneStudioLight );
            phoneStudioLight.position.copy(new THREE.Vector3(5,10,7.5));
            phoneStudioLight.target = phone;

            sky = new THREE.Sky();
            sky.scale.setScalar( 20000 );
            terrainScene.add( sky );
            // Add Sun Helper
            sunSphere = new THREE.Mesh(
                new THREE.SphereBufferGeometry( 2, 16, 8 ),
                new THREE.MeshBasicMaterial( { color: 0xffffff } )
            );
            sunSphere.position.y = - 30000;
            sunSphere.visible = true;
            terrainScene.add( sunSphere );


            sunLight = new THREE.DirectionalLight( 0xffffff, 0.9 );
            sunSphere.add( sunLight );
            sunLight.target = containerPivot;

            initSun();

            // controls = new THREE.OrbitControls( terrainCamera, renderer.domElement );
            // controls.enabled = false;
            // controls.addEventListener( 'change', renderer );
            // controls.enableZoom = false;
            // controls.enablePan = true;
            // controls.enableRotate = true;

            resolve();
        }
    );
}

function initSun()
{
    var distance = 18000;
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
    return new Promise((gResolve, reject) =>
    {
        new Promise((resolve,reject) =>
        {
            var imageLoader = new THREE.TextureLoader();
            imageLoader.load(
                'obj/galaxy-s8/tex/flashthing.png',
                ( texture ) =>
                {
                    this.phoneFlashTex = texture;
                    console.log('flashTex');
                    resolve();
                },
                // Function called when download progresses
                function ( xhr ) {
                    $('#loadingBar')
                        .progress(
                            {
                                percent: 80 + (xhr.loaded / xhr.total * 10),
                                text: {
                                    active  : 'Loading Phone Model '  +  (xhr.loaded / xhr.total * 100) + " %"
                                }
                            });
                    console.log( (xhr.loaded / xhr.total * 100) + '% loaded' );
                },
                // Function called when download errors
                function ( xhr ) {
                    reject();
                }
            );
        }).then(function ()
        {
            return new Promise((resolve,reject) =>
                {
                    var imageLoader = new THREE.TextureLoader();
                    imageLoader.load(
                        'obj/galaxy-s8/tex/12_camera_lens_icons.jpg',
                        ( texture ) =>
                        {
                            this.phoneLensTex = texture;
                            console.log('lensTex');
                            resolve();
                        },
                        // Function called when download progresses
                        function ( xhr ) {
                            console.log( (xhr.loaded / xhr.total * 100) + '% loaded' );
                        },
                        // Function called when download errors
                        function ( xhr ) {
                            reject();
                        }
                    );
                }
            )}).then(function ()
        {
            return new Promise((resolve,reject) =>
            {
                var loader = new THREE.OBMLoader();

                loader.load(
                    'obj/galaxy-s8/s8.obm',
                    function ( object )
                    {
                        phone = object;
                        console.log('phone');
                        phoneScene.add( phone );

                        //必要的材质 -。- C4D => THREE
                        //三星 Logo

                        phone.children[0].material.find(x => x.name == 'lens').map = this.phoneLensTex;
                        phone.children[0].material.find(x => x.name == 'lens').color = new THREE.Color(100,100,100);
                        phone.children[0].material.find(x => x.name == 'front').color = new THREE.Color(0,0,0);
                        phone.children[0].material.find(x => x.name == 'screen').map = renderTarget.texture;
                        phone.children[0].material.find(x => x.name == 'screen').emissiveMap = renderTarget.texture;
                        phone.children[0].material.find(x => x.name == 'screen').emissive = new THREE.Color(0xffffff );
                        phone.children[0].material.find(x => x.name == 'flash').map = this.phoneFlashTex;
                        phone.children[0].material.find(x => x.name == 'default').color = new THREE.Color(0,0,0);

                        resolve();
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
        }).then(function ()
        {
            gResolve();
        });
    });

}