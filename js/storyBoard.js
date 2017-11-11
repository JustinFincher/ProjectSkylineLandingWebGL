function playSequence()
{
    phoneCamera.position.z = 30;
    sunEffectParameter.inclination = 0.53;
    phone.children[0].material.find(x => x.name == 'base').color = new THREE.Color(0,0,0);

    console.log(terrainCamera.position);

    return new Promise((resolve,reject) =>
    {
        var tweenSun = new TWEEN.Tween(sunEffectParameter)
            .to({ inclination:0 }, 20000)
            .easing(TWEEN.Easing.Quartic.Out)
            .onUpdate(function()
            {

            }).delay(100)
            .start();

        var tweenPhoneCamera = new TWEEN.Tween(phoneCamera.position)
            .to({z : 27},6000)
            .easing(TWEEN.Easing.Cubic.Out)
            .delay(2000)
            .start();

        var phoneColor = {r:0,g:0,b:0};
        var tweenPhoneColor = new TWEEN.Tween(phoneColor)
            .to({r:80/255,g:80/255,b:80/255},3000)
            .onUpdate(function () {
                phone.children[0].material.find(x => x.name == 'base').color = new THREE.Color(phoneColor.r,phoneColor.g,phoneColor.b);
            })
            .delay(6000)
            .start();

        var terrainCameraPosValue = { x:terrainCamera.position.x, y: terrainCamera.position.y, z: terrainCamera.position.z};
        var tweenTerrainCameraPos = new TWEEN.Tween(terrainCameraPosValue)
            .to({ x:0, y: 40, z: 0},8000)
            .easing(TWEEN.Easing.Cubic.InOut)
            .onUpdate(function ()
            {
                terrainCamera.position.copy(new THREE.Vector3(terrainCameraPosValue.x,terrainCameraPosValue.y,terrainCameraPosValue.z));
                terrainCamera.lookAt(new THREE.Vector3(0,-2.5,0));
            })
            .delay(1000)
            .start();
    })
};