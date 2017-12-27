function downloadZXY(z,x,y,boundSize)
{
    return new Promise( (resolve, reject) =>
    {

        var singleTileSize = 256;
        var toBeSavedCanvas = document.createElement('canvas');
        toBeSavedCanvas.width = (boundSize * 2 + 1) * singleTileSize;
        toBeSavedCanvas.height = (boundSize * 2 + 1) * singleTileSize;
        var toBeSavedCanvasContext = toBeSavedCanvas.getContext('2d');

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

                        return  Promise.join(imageToCanvasContext(heightImage),imageToCanvasContext(colorImage),
                            function(heightCanvasContext,colorCanvasContext)
                            {
                                return new Promise((resolve,reject) =>
                                {
                                    console.log("index = " + index);
                                    var hieghtImgd = heightCanvasContext.getImageData(0, 0, singleTileSize,singleTileSize);
                                    var heightData = hieghtImgd.data;

                                    var colorImgd = colorCanvasContext.getImageData(0, 0, singleTileSize,singleTileSize);
                                    var colorData = colorImgd.data;

                                    for (var pixelIndex = 0, n = heightData.length / 4; pixelIndex < n; pixelIndex += 1)
                                    {
                                        var height = ((heightData[pixelIndex * 4] * 256 * 256 + heightData[pixelIndex * 4 +1] * 256 + heightData[pixelIndex * 4 + 2]) / (256*256/128) - 196) * (256/(256-196));
                                        heightData[pixelIndex * 4] = colorData[pixelIndex * 4];
                                        heightData[pixelIndex * 4+1] = colorData[pixelIndex * 4+1];
                                        heightData[pixelIndex * 4+2] = colorData[pixelIndex * 4+2];
                                        heightData[pixelIndex * 4+3] = height;
                                    }

                                    heightCanvasContext.putImageData(hieghtImgd, 0,0);

                                    console.log(hieghtImgd.data);
                                    resolve(heightCanvasContext);
                                });
                            });
                    })
                    .then((canvasContext) =>
                {
                    console.log(preLoadingGridArray);
                    console.log(preLoadingIndex);
                    console.log(preLoadingGridArray[preLoadingIndex]);
                    console.log("toBeSavedCanvasContext.drawImage(canvasContext.canvas," + preLoadingGridArray[index].indexX * singleTileSize +", " + preLoadingGridArray[index].indexY * singleTileSize + ")");

                    toBeSavedCanvasContext.drawImage(canvasContext.canvas, preLoadingGridArray[index].indexX * singleTileSize, preLoadingGridArray[index].indexY * singleTileSize);

                    resolve();
                });
            });
        }

        Promise.all(preLoadingGridPromiseArray).then( () =>
        {
            console.log(z);
            var pngUrl = toBeSavedCanvasContext.canvas.toDataURL("image/png");
            console.log("Height Map");
            console.log(pngUrl);

            var toBeSavedImageName = z + "-" + x + "-" + y + "-" + boundSize +"-height.png";
            console.log(toBeSavedImageName);
            saveAs(dataURItoBlob(pngUrl), toBeSavedImageName);

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