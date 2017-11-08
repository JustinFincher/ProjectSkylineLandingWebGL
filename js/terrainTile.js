
function TerrainTile()
{}

TerrainTile.prototype.loadzxy = function (z,x,y,scene)
{
    asyncHeightImage(z,x,y).then((image) =>
    {
        var size = image.width;
        console.log('asyncHeightImage Size = ' + size);
        console.log('this.terrainSize = ' + terrainSize);
        this.terrainGeometry = new THREE.PlaneGeometry( terrainSize, terrainSize, size-1,size-1 );
        return imageToHeightData(image);
    }).then((heightData) =>
    {
        var data = new Array(heightData.length / 4);

        console.log('heightData length / 4 = ' + heightData.length / 4);
        console.log('terrainGeometry vertices length = ' + this.terrainGeometry.vertices.length);

        for (var i = 0, n = heightData.length / 4; i < n; i += 1)
        {
            var height = -10000 + ((heightData[i * 4] * 256 * 256 + heightData[i * 4 +1] * 256 + heightData[i * 4 + 2]) * 0.1) + 1;
            height = height / 600;
            this.terrainGeometry.vertices[i] = new THREE.Vector3( this.terrainGeometry.vertices[i].x, this.terrainGeometry.vertices[i].y,height / 4);
        }
        this.terrainGeometry.verticesNeedUpdate = true;
        return asyncColorMap(z,x,y);

    }).then((url) =>
    {
        return new Promise((resolve, reject) =>
        {
            new THREE.TextureLoader().load(
                url,
                ( texture )=>
                {
                    console.log(texture);
                    console.log(this);
                    this.terrainMaterial = new THREE.MeshBasicMaterial(
                        {
                            map: texture
                        } );
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
        });
    }).then( () =>
    {
        this.terrainPlane = new THREE.Mesh( this.terrainGeometry, this.terrainMaterial );
        scene.add(this.terrainPlane);
        this.terrainPlane.position.copy(getWorldPosFromZXY(z,x,y));

    });

}

function getWorldPosFromZXY(z,x,y)
{
    var v = new THREE.Vector3(x * terrainSize,- y * terrainSize,0);
    return v;
}
