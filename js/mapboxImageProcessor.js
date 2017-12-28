var apiKey = "pk.eyJ1IjoibWF0dCIsImEiOiJTUHZkajU0In0.oB-OGTMFtpkga8vC48HjIg";

function long2tile(lon,zoom)
{
    return (Math.floor((lon+180)/360*Math.pow(2,zoom)));
}
function lat2tile(lat,zoom)
{
    return (Math.floor((1-Math.log(Math.tan(lat*Math.PI/180) + 1/Math.cos(lat*Math.PI/180))/Math.PI)/2 *Math.pow(2,zoom)));
}
function tile2long(x,z) {
    return (x/Math.pow(2,z)*360-180);
}
function tile2lat(y,z) {
    var n=Math.PI-2*Math.PI*y/Math.pow(2,z);
    return (180/Math.PI*Math.atan(0.5*(Math.exp(n)-Math.exp(-n))));
}

function asyncHeightImage(z,x,y)
{
    var attribute = useRetinaMap ? "@2x" : "";
    var imageURL = `https://api.mapbox.com/v4/mapbox.terrain-rgb/${z}/${x}/${y}` + attribute +`.png?access_token=${apiKey}`;
    console.log(imageURL);
    return new Promise(function (resolve, reject)
    {
        var img = new Image();

        img.setAttribute('crossOrigin', 'anonymous');

        img.onload = function ()
        {
            resolve(this);
        };
        img.src = imageURL;
    });
}
function asyncColorImage(z,x,y)
{
    var attribute = useRetinaMap ? "@2x" : "";
    var imageURL = `https://api.mapbox.com/v4/mapbox.satellite/${z}/${x}/${y}` + attribute +`.jpg80?access_token=${apiKey}`;
    return new Promise(function (resolve, reject)
    {
        var img = new Image();
        img.setAttribute('crossOrigin', 'anonymous');
        img.onload = function ()
        {
            resolve(this);
        };
        img.src = imageURL;
    });
}
function imageToCanvasContext(img)
{
    return new Promise(function (resolve, reject)
    {
        var canvas = document.createElement("canvas");
        canvas.width =img.width;
        canvas.height =img.height;
        var context = canvas.getContext("2d");
        context.drawImage(img, 0, 0);
        resolve(context);
    });
}

function imageToHeightData(img)
{
    return new Promise(function (resolve, reject)
    {
        var canvas = document.createElement("canvas");
        canvas.width =img.width;
        canvas.height =img.height;
        var context = canvas.getContext("2d");
        context.drawImage(img, 0, 0);

        var imgd = context.getImageData(0, 0, img.width,img.height);
        var pix = imgd.data;
        resolve(pix);
    });
}
function asyncHeightMap(z,x,y)
{
    var attribute = useRetinaMap ? "@2x" : "";
    var imageURL = `https://api.mapbox.com/v4/mapbox.terrain-rgb/${z}/${x}/${y}` + attribute +`.png?access_token=${apiKey}`;
    return new Promise(function (resolve, reject)
    {
        var img = new Image();

        img.setAttribute('crossOrigin', 'anonymous');

        img.onload = function ()
        {
            var canvas = document.createElement("canvas");
            canvas.width =this.width;
            canvas.height =this.height;
            var context = canvas.getContext("2d");
            context.drawImage(this, 0, 0);

            var imgd = context.getImageData(0, 0, this.width,this.height);
            var pix = imgd.data;

            for (var i = 0, n = pix.length; i < n; i += 4)
            {
                height = -10000 + ((pix[i] * 256 * 256 + pix[i+1] * 256 + pix[i+2]) * 0.1) + 1;
                height = height /   600;

                pix[i  ] = height * 256;
                pix[i+1] = height * 256;
                pix[i+2] = height * 256;
            }

            context.putImageData(imgd, 0, 0);

            var dataURL = canvas.toDataURL("image/png");
            resolve(dataURL);
        };

        img.src = imageURL;
    });
}
function asyncColorMap(z,x,y)
{

    var attribute = useRetinaMap ? "@2x" : "";
    var imageURL = `https://api.mapbox.com/v4/mapbox.satellite/${z}/${x}/${y}` + attribute +`.jpg80?access_token=${apiKey}`;
    return new Promise(function (resolve, reject)
    {
        var img = new Image();
        img.setAttribute('crossOrigin', 'anonymous');
        img.onload = function ()
        {
            var canvas = document.createElement("canvas");
            canvas.width =this.width;
            canvas.height =this.height;
            var context = canvas.getContext("2d");
            context.drawImage(this, 0, 0);
            var dataURL = canvas.toDataURL("image/jpg");
            resolve(dataURL);
        };
        img.src = imageURL;
    });
}

// window.onload = function()
// {
//    asyncHeightMap(4,4,3).then(function(url){
//        console.log(url);
//    });
//
// }