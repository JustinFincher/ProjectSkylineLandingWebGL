
function TerrainTile()
{}

TerrainTile.prototype.loadzxyFromLocalImage = function(z,x,y,boundSize,parent)
{
    return new Promise((resolve, reject) =>
    {
        var toBeSavedDisplacementImageName = "tex/" + z + "-" + x + "-" + y + "-" + boundSize +"-d.jpeg";
        var toBeSavedColorImageName = "tex/" + z + "-" + x + "-" + y + "-" + boundSize +"-c.jpeg";

        return Promise.join(
            new Promise((resolve,reject) =>
            {
                new THREE.TextureLoader().load
                (
                    toBeSavedDisplacementImageName,
                    ( texture )=>
                    {
                        console.log("Displacement = " + texture);
                        resolve(texture);
                    },
                    ( xhr ) =>
                    {
                        console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );
                    },
                    function ( err )
                    {
                        console.error( 'An error happened' );
                        reject();
                    }
                );
            }),
            new Promise((resolve,reject) =>
            {
                new THREE.TextureLoader().load
                (
                    toBeSavedColorImageName,
                    ( texture )=>
                    {
                        console.log("Color = " + texture);
                        resolve(texture);
                    },
                    ( xhr ) =>
                    {
                        console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );
                    },
                    function ( err )
                    {
                        console.error( 'An error happened' );
                        reject();
                    }
                );
            }),
            function (displaceTex,colorTex)
            {
                return new Promise((resolve,reject) =>
                {
                    console.log("displaceTex = ");
                    console.log(displaceTex);

                    console.log("colorTex = ");
                    console.log(colorTex);

                    console.log("THREE.PlaneGeometry(" + terrainSize *  (boundSize * 2 + 1) + ", " + terrainSize *  (boundSize * 2 + 1) + ", 512, 512)");
                    this.terrainGeometry = new THREE.PlaneGeometry( terrainSize *  (boundSize * 2 + 1), terrainSize *  (boundSize * 2 + 1),512,512 );
                    // console.log("THREE.PlaneGeometry(" + terrainSize *  (boundSize * 2 + 1) + ", " + terrainSize *  (boundSize * 2 + 1) + ", " +(this.singleTileSize * (boundSize * 2 + 1) - 1) + ", " + (this.singleTileSize * (boundSize * 2 + 1) - 1) + ")");
                    // this.terrainGeometry = new THREE.PlaneGeometry( terrainSize *  (boundSize * 2 + 1), terrainSize *  (boundSize * 2 + 1),(this.singleTileSize * (boundSize * 2 + 1) - 1),(this.singleTileSize * (boundSize * 2 + 1) - 1) );
                    console.log("terrainGeometry = ");
                    console.log(this.terrainGeometry);
                    this.terrainMaterial = new THREE.MeshPhongMaterial(
                        {
                            map: colorTex,
                            bumpMap: displaceTex,
                            displacementMap: displaceTex,
                            displacementScale: 3,
                            reflectivity:0.2,
                            shininess:5
                        }
                    );
                    console.log("terrainMaterial = ");
                    console.log(this.terrainMaterial);
                    this.terrainPlane = new THREE.Mesh( this.terrainGeometry, this.terrainMaterial );
                    console.log("terrainPlane = ");
                    console.log(this.terrainPlane);

                    parent.add(this.terrainPlane);
                    this.terrainPlane.position.copy(getWorldPosFromZXY(z,x,y));
                    console.log( this.terrainPlane );
                    resolve(this.terrainPlane);
                });
            }
        ).then((plane) =>
        {
            console.log(plane);
            resolve();
        });
    });
}

TerrainTile.prototype.loadzxy = function (z,x,y,parent)
{
    return new Promise((resolve, reject) =>
    {
        asyncHeightImage(z,x,y).then((image) =>
        {
            this.size = image.width;
            // console.log('asyncHeightImage Size = ' + this.size);
            // console.log('this.terrainSize = ' + terrainSize);
            this.terrainGeometry = new THREE.PlaneGeometry( terrainSize, terrainSize, this.size-1,this.size-1 );
            // return imageToHeightData(image);

            return imageToCanvasContext(image);
        }).then((canvasContext) =>
        {

            var imgd = canvasContext.getImageData(0, 0, this.size,this.size);
            var heightData = imgd.data;

            // console.log('heightData length / 4 = ' + heightData.length / 4);
            // console.log('terrainGeometry vertices length = ' + this.terrainGeometry.vertices.length);
            for (var i = 0, n = heightData.length / 4; i < n; i += 1)
            {
                var height = -10000 + ((heightData[i * 4] * 256 * 256 + heightData[i * 4 +1] * 256 + heightData[i * 4 + 2]) * 0.1) + 1;
                height = height / 2000;
                this.terrainGeometry.vertices[i] = new THREE.Vector3( this.terrainGeometry.vertices[i].x, this.terrainGeometry.vertices[i].y,terrainSize * height / 4);

                // console.log(height);
                heightData[i * 4] = height * 256;
                heightData[i * 4+1] = height * 256;
                heightData[i * 4+2] = height * 256;
            }
            this.terrainGeometry.verticesNeedUpdate = true;
            this.terrainGeometry.computeFaceNormals();
            this.terrainGeometry.computeVertexNormals();

            canvasContext.putImageData(imgd, 0,0);
            var jpegUrl = canvasContext.canvas.toDataURL("image/jpeg");
            this.bumpMapURL = jpegUrl;

            image = null;
            return asyncColorMap(z,x,y);

        }).then((url) =>
        {
            return new Promise((resolve, reject) =>
            {
                new THREE.TextureLoader().load(
                    url,
                    ( texture )=>
                    {
                        this.colorMap = texture;
                        new THREE.TextureLoader().load(
                            this.bumpMapURL,
                            ( texture )=>
                            {
                                this.bumpMap = texture;
                                // console.log()
                                this.terrainMaterial = new THREE.MeshPhongMaterial(
                                    {
                                        map: this.colorMap,
                                        bumpMap: this.bumpMap,
                                        reflectivity:0.2,
                                        shininess:5
                                    }
                                );
                                resolve();
                            },
                            ( xhr ) =>
                            {
                                console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );
                            },
                            ( xhr )=>
                            {
                                console.error( 'An error happened' );
                                reject();
                            }
                        );
                    },
                    ( xhr ) =>
                    {
                        console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );
                    },
                    ( xhr )=>
                    {
                        console.error( 'An error happened' );
                        reject();
                    }
                );
            });
        }).then( () =>
        {
            this.terrainPlane = new THREE.Mesh( this.terrainGeometry, this.terrainMaterial );
            parent.add(this.terrainPlane);
            this.terrainPlane.position.copy(getWorldPosFromZXY(z,x,y));
            console.log("TerrainTile.prototype.loadzxy done");
            resolve();
        });

    });



}

function getWorldPosFromZXY(z,x,y)
{
    var v = new THREE.Vector3(x * terrainSize,- y * terrainSize,0);
    return v;
}
