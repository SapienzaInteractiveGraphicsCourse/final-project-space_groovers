import TWEEN from '@tweenjs/tween.js';

export class AnimationManager {
  static deployPanels(spaceProbe) {
    // Animazione di rotazione dei pannelli solari
    new TWEEN.Tween(spaceProbe.leftPanelPivot.rotation)
      .to({ z: Math.PI / 2 }, 2000)
      .easing(TWEEN.Easing.Cubic.Out)
      .start();

    new TWEEN.Tween(spaceProbe.rightPanelPivot.rotation)
      .to({ z: -Math.PI / 2 }, 2000)
      .easing(TWEEN.Easing.Cubic.Out)
      .start();
  }

  static foldPanels(spaceProbe) {
    new TWEEN.Tween(spaceProbe.leftPanelPivot.rotation)
      .to({ z: 0 }, 2000)
      .easing(TWEEN.Easing.Cubic.In)
      .start();

    new TWEEN.Tween(spaceProbe.rightPanelPivot.rotation)
      .to({ z: 0 }, 2000)
      .easing(TWEEN.Easing.Cubic.In)
      .start();
  }

  static moveArm(spaceProbe, baseAngle, elbowAngle) {
    // Animazione della gerarchia del braccio robotico
    new TWEEN.Tween(spaceProbe.armBasePivot.rotation)
      .to({ x: baseAngle }, 1500)
      .easing(TWEEN.Easing.Quadratic.Out)
      .start();

    new TWEEN.Tween(spaceProbe.armElbowPivot.rotation)
      .to({ x: elbowAngle }, 1500)
      .easing(TWEEN.Easing.Quadratic.Out)
      .start();
  }
}