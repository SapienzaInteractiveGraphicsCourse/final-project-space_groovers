import GUI from 'lil-gui';

export class UserInterface {
  constructor(lights, spaceProbe, cameraSettings, onGrabDropCallback) {
    this.lights = lights;
    this.spaceProbe = spaceProbe;
    this.cameraSettings = cameraSettings;
    this.onGrabDropCallback = onGrabDropCallback;

    this.gui = new GUI({ title: 'MISSION CONTROLS' });

    this._setupCameraControls();
    this._setupLightControls();
    this._setupProbeControls();
  }

  _setupCameraControls() {
    const cameraFolder = this.gui.addFolder('CAMERA');

    cameraFolder.add(this.cameraSettings, 'isFixed')
      .name('Fixed Camera');

    cameraFolder.add(this.cameraSettings, 'isFirstPerson')
      .name('First Person View [C]')
      .listen();

    cameraFolder.open();
  }

  _setupLightControls() {
    const lightFolder = this.gui.addFolder('SOLAR ILLUMINATION');

    lightFolder.add(this.lights.sunLight, 'intensity', 0, 4, 0.1)
      .name('Sun Intensity');

    const posFolder = lightFolder.addFolder('LIGHT POSITION');
    
    const updatePos = () => {
      this.lights.updateSunPosition(
        this.lights.sunLight.position.x,
        this.lights.sunLight.position.y,
        this.lights.sunLight.position.z
      );
    };

    posFolder.add(this.lights.sunLight.position, 'x', -1000, 1000, 10).name('Position X').onChange(updatePos);
    posFolder.add(this.lights.sunLight.position, 'y', -500, 1000, 10).name('Position Y').onChange(updatePos);
    posFolder.add(this.lights.sunLight.position, 'z', -1000, 1000, 10).name('Position Z').onChange(updatePos);

    const lightColor = { color: '#' + this.lights.sunLight.color.getHexString() };
    lightFolder.addColor(lightColor, 'color')
      .name('Light Color')
      .onChange((value) => {
        this.lights.sunLight.color.set(value);
      });

    lightFolder.open();
  }

  _setupProbeControls() {
    const probeFolder = this.gui.addFolder('SPACE PROBE');

    probeFolder.add(this.spaceProbe, 'toggleSolarPanels')
      .name('Open/Close Panels [P]');

    probeFolder.add(this.spaceProbe, 'toggleRoboticArm')
      .name('Extend/Retract Arm [R]');

    const clawActions = {
      action: () => {
        if (this.onGrabDropCallback) this.onGrabDropCallback();
      }
    };

    probeFolder.add(clawActions, 'action')
      .name('Grab / Release [G]');

    probeFolder.add(this.spaceProbe.probeGroup.rotation, 'y', 0, Math.PI * 2, 0.01)
      .name('Probe Rotation Y')
      .listen();

    probeFolder.open();
  }
}