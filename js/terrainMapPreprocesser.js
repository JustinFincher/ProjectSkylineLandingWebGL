function downloadZXY(z,x,y,boundSize)
{
    return new Promise( (resolve, reject) =>
    {
        var combineDisplaceAndColor = false;

        var toBeSavedDisplacementCanvas = document.createElement('canvas');
        toBeSavedDisplacementCanvas.width = (boundSize * 2 + 1) * singleTileSize;
        toBeSavedDisplacementCanvas.height = (boundSize * 2 + 1) * singleTileSize;
        var toBeSavedDisplacementCanvasContext = toBeSavedDisplacementCanvas.getContext('2d');

        var toBeSavedColorCanvas = document.createElement('canvas');
        toBeSavedColorCanvas.width = (boundSize * 2 + 1) * singleTileSize;
        toBeSavedColorCanvas.height = (boundSize * 2 + 1) * singleTileSize;
        var toBeSavedColorCanvasContext = toBeSavedColorCanvas.getContext('2d');

        var preLoadingGridArray = [];

        for (var i = x - boundSize; i <= x + boundSize; i++)
        {
            for (var k = y - boundSize; k <= y + boundSize; k++)
            {
                console.log(i,k);
                console.log(i - x + boundSize, k - y + boundSize);
                preLoadingGridArray[(i - x + boundSize) * (1+ boundSize * 2) + (k - y + boundSize)] =
                    {   'x':i,
                        'y':k,
                        'indexX':i - x + boundSize,
                        'indexY': k - y + boundSize
                    };
            }
        }
        console.log(preLoadingGridArray);
        var preLoadingGridPromiseArray = [];

        var preLoadingIndex = -1;

        for (var i = 0; i < preLoadingGridArray.length; i++)
        {
            console.log("i = " + i);

            preLoadingGridPromiseArray[preLoadingIndex] = new Promise((resolve, reject) =>
            {
                preLoadingIndex ++;
                var index = preLoadingIndex;
                console.log("index = " + index);

                Promise.join(asyncHeightImage(z, preLoadingGridArray[index].x, preLoadingGridArray[index].y), asyncColorImage(z, preLoadingGridArray[index].x, preLoadingGridArray[index].y),
                    function(heightImage, colorImage)
                    {
                        return Promise.join(imageToCanvasContext(heightImage),imageToCanvasContext(colorImage),
                            function(heightCanvasContext,colorCanvasContext)
                            {
                                return new Promise((resolve,reject) =>
                                {
                                    console.log("index = " + index);
                                    var heightImgd = heightCanvasContext.getImageData(0, 0, singleTileSize,singleTileSize);
                                    var heightData = heightImgd.data;

                                    var colorImgd = colorCanvasContext.getImageData(0, 0, singleTileSize,singleTileSize);
                                    var colorData = colorImgd.data;

                                    for (var pixelIndex = 0, n = heightData.length / 4; pixelIndex < n; pixelIndex += 1)
                                    {
                                        var height = ((heightData[pixelIndex * 4] * 256 * 256 + heightData[pixelIndex * 4 +1] * 256 + heightData[pixelIndex * 4 + 2]) / (256*256/128) - 196) * (256/(256-196));

                                        heightData[pixelIndex * 4] = height;
                                        heightData[pixelIndex * 4+1] = height;
                                        heightData[pixelIndex * 4+2] = height;
                                    }
                                    heightCanvasContext.putImageData(heightImgd, 0,0);

                                    console.log(heightData);
                                    console.log(colorData);

                                    console.log("toBeSavedDisplacementCanvasContext.drawImage(heightCanvasContext.canvas," + preLoadingGridArray[index].indexX * singleTileSize +", " + preLoadingGridArray[index].indexY * singleTileSize + ")");
                                    console.log("toBeSavedColorCanvasContext.drawImage(colorCanvasContext.canvas," + preLoadingGridArray[index].indexX * singleTileSize +", " + preLoadingGridArray[index].indexY * singleTileSize + ")");

                                    toBeSavedDisplacementCanvasContext.drawImage(heightCanvasContext.canvas, preLoadingGridArray[index].indexX * singleTileSize, preLoadingGridArray[index].indexY * singleTileSize);
                                    toBeSavedColorCanvasContext.drawImage(colorCanvasContext.canvas, preLoadingGridArray[index].indexX * singleTileSize, preLoadingGridArray[index].indexY * singleTileSize);

                                    resolve();
                                });
                            }).then(() =>
                        {
                            console.log("drawImage tile done");
                            resolve();
                        });
                    });
            });
        }

        Promise.all(preLoadingGridPromiseArray).then( () =>
        {
            console.log(z);
            var displacementURL = toBeSavedDisplacementCanvasContext.canvas.toDataURL("image/jpeg");
            var colorURL = toBeSavedColorCanvasContext.canvas.toDataURL("image/jpeg");
            console.log(displacementURL);
            console.log(colorURL);

            var toBeSavedDisplacementImageName = z + "-" + x + "-" + y + "-" + boundSize +"-d.jpeg";
            var toBeSavedColorImageName = z + "-" + x + "-" + y + "-" + boundSize +"-c.jpeg";
            console.log(toBeSavedDisplacementImageName);
            console.log(toBeSavedColorImageName);
            saveAs(dataURItoBlob(displacementURL), toBeSavedDisplacementImageName);
            saveAs(dataURItoBlob(colorURL), toBeSavedColorImageName);

            resolve();
        });
    });
}

function dataURItoBlob(dataURI) {
    // convert base64 to raw binary data held in a string
    // doesn't handle URLEncoded DataURIs - see SO answer #6850276 for code that does this
    var byteString = atob(dataURI.split(',')[1]);

    // separate out the mime component
    var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0]

    // write the bytes of the string to an ArrayBuffer
    var ab = new ArrayBuffer(byteString.length);

    // create a view into the buffer
    var ia = new Uint8Array(ab);

    // set the bytes of the buffer to the correct values
    for (var i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }

    // write the ArrayBuffer to a blob, and you're done
    var blob = new Blob([ab], {type: mimeString});
    return blob;

}