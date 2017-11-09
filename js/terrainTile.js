
function TerrainTile()
{}

TerrainTile.prototype.loadzxy = function (z,x,y,scene)
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
                this.terrainGeometry.vertices[i] = new THREE.Vector3( this.terrainGeometry.vertices[i].x, this.terrainGeometry.vertices[i].y,terrainSize * height / 12);

                // console.log(height);
                heightData[i * 4] = height * 256;
                heightData[i * 4+1] = height * 256;
                heightData[i * 4+2] = height * 256;
            }
            this.terrainGeometry.verticesNeedUpdate = true;

            canvasContext.putImageData(imgd, 0,0);
            var jpegUrl = canvasContext.canvas.toDataURL("image/jpeg");
            this.bumpMapURL = jpegUrl;

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
            scene.add(this.terrainPlane);
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
