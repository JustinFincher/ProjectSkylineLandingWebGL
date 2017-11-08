onmessage = function(message)
{
    flyToCoordinate(86.925026, 27.987850,10,1).then(function ()
    {
        var data=message.data;
        data.msg = '';
        postMessage(data);
    });
}