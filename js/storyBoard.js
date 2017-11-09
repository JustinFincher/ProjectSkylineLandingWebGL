function playSequence()
{
    phoneCamera.position.z = 30;
    sunEffectParameter.inclination = 0.6;
    phone.children[0].material.find(x => x.name == 'base').color = new THREE.Color(0,0,0);

    return new Promise((resolve,reject) =>
    {
        var tweenSun = new TWEEN.Tween(sunEffectParameter)
            .to({ inclination:0.2 }, 20000)
            .easing(TWEEN.Easing.Quintic.Out)
            .onUpdate(function()
            {
            }).delay(1000)
            .start();

        var tweenPhoneCamera = new TWEEN.Tween(phoneCamera.position)
            .to({z : 27},5000)
            .easing(TWEEN.Easing.Cubic.InOut)
            .delay(3000)
            .start();

        var phoneColor = {r:0,g:0,b:0};
        var tweenPhoneColor = new TWEEN.Tween(phoneColor)
            .to({r:60/255,g:60/255,b:60/255},6000)
            .onUpdate(function () {
                phone.children[0].material.find(x => x.name == 'base').color = new THREE.Color(phoneColor.r,phoneColor.g,phoneColor.b);
            })
            .delay(3000)
            .start();

        var terrainCameraPosValue = { x:terrainCamera.position.x, y: terrainCamera.position.y, z: terrainCamera.position.z};
        var tweenTerrainCameraPos = new TWEEN.Tween(terrainCameraPosValue)
            .to({ x:0, y: 40, z: 0},4000)
            .easing(TWEEN.Easing.Cubic.InOut)
            .onUpdate(function () {
                terrainCamera.lookAt(new THREE.Vector3(0,0,0));
                terrainCamera.position.copy(new THREE.Vector3(terrainCameraPosValue.x,terrainCameraPosValue.y,terrainCameraPosValue.z));
            })
            .delay(4000)
            .start();
        //
        // var currentTerrainCameraRotEuler = new THREE.Euler(0,0,0,'XYZ');
        // currentTerrainCameraRotEuler.setFromQuaternion(terrainCamera.quaternion);
        // var currentTerrainCameraRot = {x:currentTerrainCameraRotEuler.x,y:currentTerrainCameraRotEuler.y,z:currentTerrainCameraRotEuler.z};
        // console.log(currentTerrainCameraRotEuler);
        //
        // var tweenTerrainCameraRot = new TWEEN.Tween(currentTerrainCameraRot)
        //     .to({x:-Math.PI/2,y:0,z:0},4000)
        //     .easing(TWEEN.Easing.Cubic.In)
        //     .delay(4000)
        //     .onUpdate(function()
        //     {
        //         terrainCamera.quaternion.setFromEuler( new THREE.Euler(currentTerrainCameraRot.x, currentTerrainCameraRot.y,currentTerrainCameraRot.z,'XYZ'))
        //         console.log(currentTerrainCameraRot.x, currentTerrainCameraRot.y,currentTerrainCameraRot.z);
        //         console.log(terrainCamera.rotation);
        //     })
        //     .start();
    })
};