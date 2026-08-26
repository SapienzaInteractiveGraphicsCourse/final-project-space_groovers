import * as THREE from 'three';

export class DataGalaxy {
  constructor(scene) {
    this.scene = scene;
    this.starField = null;
    this.backgroundPlanets = [];

    this._createStarField();
    this._createBackgroundPlanets();
  }

  _createStarField() {
    const starCount = 6000;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);

    const colorPalette = [
      new THREE.Color(0xffffff),
      new THREE.Color(0x88ccff),
      new THREE.Color(0xffddaa),
      new THREE.Color(0xaa88ff)
    ];

    for (let i = 0; i < starCount; i++) {
      const radius = 400 + Math.random() * 800;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);

      const color = colorPalette[Math.floor(Math.random() * colorPalette.length)];
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 1.8,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      sizeAttenuation: true
    });

    this.starField = new THREE.Points(geometry, material);
    this.scene.add(this.starField);
  }

  _createBackgroundPlanets() {
    const gasGiant = new THREE.Group();
    const bodyGeo = new THREE.SphereGeometry(30, 64, 64);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0xcc9955,
      roughness: 0.6,
      metalness: 0.1
    });
    const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
    gasGiant.add(bodyMesh);

    // Rings
    const ringGeo = new THREE.RingGeometry(38, 65, 64);
    const ringMat = new THREE.MeshStandardMaterial({
      color: 0xaa8855,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.75,
      roughness: 0.5
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.rotation.x = Math.PI / 2.3;
    gasGiant.add(ringMesh);

    gasGiant.position.set(-450, 120, -500);
    this.scene.add(gasGiant);
    this.backgroundPlanets.push({ mesh: gasGiant, rotSpeed: 0.02 });

    // Planet
    const icePlanetGeo = new THREE.SphereGeometry(22, 48, 48);
    const icePlanetMat = new THREE.MeshStandardMaterial({
      color: 0x22aaff,
      emissive: 0x003366,
      emissiveIntensity: 0.3,
      roughness: 0.3,
      metalness: 0.2
    });
    const icePlanet = new THREE.Mesh(icePlanetGeo, icePlanetMat);
    icePlanet.position.set(500, -80, -400);
    this.scene.add(icePlanet);
    this.backgroundPlanets.push({ mesh: icePlanet, rotSpeed: 0.015 });

    const lavaPlanetGeo = new THREE.SphereGeometry(18, 32, 32);
    const lavaPlanetMat = new THREE.MeshStandardMaterial({
      color: 0xaa2200,
      emissive: 0x551100,
      emissiveIntensity: 0.5,
      roughness: 0.8
    });
    const lavaPlanet = new THREE.Mesh(lavaPlanetGeo, lavaPlanetMat);
    lavaPlanet.position.set(-300, -180, 450);
    this.scene.add(lavaPlanet);
    this.backgroundPlanets.push({ mesh: lavaPlanet, rotSpeed: 0.03 });

    const purpleGroup = new THREE.Group();
    const purpleGeo = new THREE.SphereGeometry(26, 48, 48);
    const purpleMat = new THREE.MeshStandardMaterial({
      color: 0x6622aa,
      roughness: 0.5,
      metalness: 0.3
    });
    purpleGroup.add(new THREE.Mesh(purpleGeo, purpleMat));

    // Glow Atmosferico
    const atmosGeo = new THREE.SphereGeometry(28, 32, 32);
    const atmosMat = new THREE.MeshBasicMaterial({
      color: 0xaa44ff,
      transparent: true,
      opacity: 0.25,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide
    });
    purpleGroup.add(new THREE.Mesh(atmosGeo, atmosMat));

    purpleGroup.position.set(380, 220, 400);
    this.scene.add(purpleGroup);
    this.backgroundPlanets.push({ mesh: purpleGroup, rotSpeed: 0.01 });
  }

  update(deltaTime) {
    // Slow rotation of planet
    this.backgroundPlanets.forEach(p => {
      p.mesh.rotation.y += p.rotSpeed * deltaTime;
    });
  }
}