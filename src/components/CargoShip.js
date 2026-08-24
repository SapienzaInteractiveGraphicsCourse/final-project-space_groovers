import * as THREE from 'three';

export class CargoShip {
  constructor(scene, position = new THREE.Vector3(15, -2, -20)) {
    this.scene = scene;
    this.mesh = new THREE.Group();
    this.mesh.position.copy(position);

    // Raggio esteso per un rilascio agevole dei cristalli (zona docking)
    this.dockingZoneRadius = 12.0;

    // Bounding sphere per le collisioni con la sonda
    this.boundingSphere = new THREE.Sphere(this.mesh.position, 6.5);

    this._buildCargoShip();
    this.scene.add(this.mesh);
  }

  // Restituisce la posizione precisa del portellone/baia di carico
  getDockingBayWorldPosition() {
    const bayLocalPos = new THREE.Vector3(0, 0, -6.1);
    return this.mesh.localToWorld(bayLocalPos);
  }

  _buildCargoShip() {
    const metalMat = new THREE.MeshStandardMaterial({
      color: 0x445566,
      metalness: 0.8,
      roughness: 0.3
    });

    const darkMetalMat = new THREE.MeshStandardMaterial({
      color: 0x1f242e,
      metalness: 0.9,
      roughness: 0.2
    });

    const glowDockMat = new THREE.MeshStandardMaterial({
      color: 0x00ff88,
      emissive: 0x00aa55,
      emissiveIntensity: 0.8,
      side: THREE.DoubleSide
    });

    const engineGlowMat = new THREE.MeshStandardMaterial({
      color: 0xff3300,
      emissive: 0xff1100,
      emissiveIntensity: 0.9
    });

    // Scafo Principale
    const hullGeo = new THREE.BoxGeometry(6, 4, 12);
    const hullMesh = new THREE.Mesh(hullGeo, metalMat);
    this.mesh.add(hullMesh);

    // Baia di Carico (Docking Ring)
    const bayRingGeo = new THREE.TorusGeometry(2.5, 0.25, 16, 32);
    const bayRing = new THREE.Mesh(bayRingGeo, glowDockMat);
    bayRing.position.set(0, 0, -6.1);
    this.mesh.add(bayRing);

    // Interno Baia
    const bayInteriorGeo = new THREE.CylinderGeometry(2.3, 2.3, 3, 16);
    const bayInterior = new THREE.Mesh(bayInteriorGeo, darkMetalMat);
    bayInterior.rotation.x = Math.PI / 2;
    bayInterior.position.set(0, 0, -4.6);
    this.mesh.add(bayInterior);

    // Moduli Laterali
    const podGeo = new THREE.CylinderGeometry(1.5, 1.5, 8, 16);
    const leftPod = new THREE.Mesh(podGeo, darkMetalMat);
    leftPod.rotation.x = Math.PI / 2;
    leftPod.position.set(-4, 0, 0);

    const rightPod = new THREE.Mesh(podGeo, darkMetalMat);
    rightPod.rotation.x = Math.PI / 2;
    rightPod.position.set(4, 0, 0);

    this.mesh.add(leftPod, rightPod);

    // Propulsori
    const engineGeo = new THREE.CylinderGeometry(1.0, 1.2, 2, 16);
    const engine1 = new THREE.Mesh(engineGeo, metalMat);
    engine1.rotation.x = Math.PI / 2;
    engine1.position.set(-2, 0, 6.5);

    const engine2 = new THREE.Mesh(engineGeo, metalMat);
    engine2.rotation.x = Math.PI / 2;
    engine2.position.set(2, 0, 6.5);

    const glow1 = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 0.2, 16), engineGlowMat);
    glow1.rotation.x = Math.PI / 2;
    glow1.position.set(-2, 0, 7.5);

    const glow2 = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 0.2, 16), engineGlowMat);
    glow2.rotation.x = Math.PI / 2;
    glow2.position.set(2, 0, 7.5);

    this.mesh.add(engine1, engine2, glow1, glow2);
  }

  update(deltaTime) {
    this.mesh.rotation.y += 0.03 * deltaTime;
    this.boundingSphere.center.copy(this.mesh.position);
  }
}