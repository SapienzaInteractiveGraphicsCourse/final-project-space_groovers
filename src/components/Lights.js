import * as THREE from 'three';

export class Lights {
  constructor(scene) {
    this.scene = scene;

    this.hemiLight = new THREE.HemisphereLight(0xffffff, 0x112244, 2.0);
    this.scene.add(this.hemiLight);

    this.sunLight = new THREE.DirectionalLight(0xffffff, 8.5);
    this.sunLight.position.set(250, 150, -300);
    this.sunLight.castShadow = true;
    this.scene.add(this.sunLight);

    this.sunPointLight = new THREE.PointLight(0xffeedd, 12.0, 2000, 0.5);
    this.sunPointLight.position.copy(this.sunLight.position);
    this.scene.add(this.sunPointLight);

    this.sunGroup = new THREE.Group();
    this.sunGroup.position.copy(this.sunLight.position);

    const sunGeo = new THREE.SphereGeometry(22, 32, 32);
    const sunMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const sunMesh = new THREE.Mesh(sunGeo, sunMat);
    this.sunGroup.add(sunMesh);

    const coronaGeo = new THREE.SphereGeometry(35, 32, 32);
    const coronaMat = new THREE.MeshBasicMaterial({
      color: 0xffcc33,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide
    });
    const coronaMesh = new THREE.Mesh(coronaGeo, coronaMat);
    this.sunGroup.add(coronaMesh);

    const outerGlowGeo = new THREE.SphereGeometry(60, 32, 32);
    const outerGlowMat = new THREE.MeshBasicMaterial({
      color: 0xff5500,
      transparent: true,
      opacity: 0.35,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide
    });
    const outerGlowMesh = new THREE.Mesh(outerGlowGeo, outerGlowMat);
    this.sunGroup.add(outerGlowMesh);

    this.scene.add(this.sunGroup);
  }

  updateSunPosition(x, y, z) {
    this.sunLight.position.set(x, y, z);
    this.sunPointLight.position.set(x, y, z);
    if (this.sunGroup) {
      this.sunGroup.position.set(x, y, z);
    }
  }
}