function playSequence()
{
    sunEffectParameter.inclination = 0.5507;
    return new Promise((resolve,reject) =>
    {
        var tween = new TWEEN.Tween(sunEffectParameter)
            .to({ inclination: 0.1 }, 8000)
            .easing(TWEEN.Easing.Quadratic.Out)
            .onUpdate(function()
            {
            }).delay(1000)
            .start();
    })
};