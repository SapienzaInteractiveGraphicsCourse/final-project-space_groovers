import * as THREE from 'three';
import TWEEN from '@tweenjs/tween.js';

export class SpaceProbe {
  constructor(scene) {
    this.scene = scene;
    this.probeGroup = new THREE.Group();
    this.boundingBox = new THREE.Box3();

    // Riferimento al mesh per il cambio skin dinamico
    this.bodyMesh = null;

    this.leftArmGroup = null;
    this.rightArmGroup = null;
    
    // Componenti Braccio Robotico
    this.armBaseGroup = null;
    this.upperArmGroup = null;
    this.forearmGroup = null;
    this.leftClaw = null;
    this.rightClaw = null;
    
    this.isArmExtended = false;
    this.isGripperClosed = false;
    this.carriedObject = null;

    this.thrusterFlame = null;
    this.isDeployed = false;

    this.maxParticles = 120;
    this.particlesData = [];

    this._buildHierarchicalModel();
    this._setupParticleSystem();

    this.scene.add(this.probeGroup);
    this.updateBoundingBox();
  }

  updateBoundingBox() {
    this.boundingBox.setFromObject(this.probeGroup);
  }

  _buildHierarchicalModel() {
    const textureLoader = new THREE.TextureLoader();
    const colorMap = textureLoader.load('/assets/textures/probe_color.jpg');
    const normalMap = textureLoader.load('/assets/textures/probe_normal.jpg');
    const specularMap = textureLoader.load('/assets/textures/probe_specular.jpg');

    const goldFoilMaterial = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      metalness: 0.85,
      roughness: 0.2,
      map: colorMap || null,
      normalMap: normalMap || null,
      roughnessMap: specularMap || null
    });

    const solarPanelMaterial = new THREE.MeshStandardMaterial({
      color: 0x0a2255,
      metalness: 0.9,
      roughness: 0.1,
    });

    const metalMaterial = new THREE.MeshStandardMaterial({
      color: 0xaaaaaa,
      metalness: 0.8,
      roughness: 0.3
    });

    const darkMetalMaterial = new THREE.MeshStandardMaterial({
      color: 0x333333,
      metalness: 0.9,
      roughness: 0.2
    });

    const glowMaterial = new THREE.MeshStandardMaterial({
      color: 0x00ffff,
      emissive: 0x00aaaa,
      emissiveIntensity: 0.8
    });

    // 1. CORPO CENTRALE
    const bodyGeometry = new THREE.CylinderGeometry(1, 1, 2.2, 16);
    this.bodyMesh = new THREE.Mesh(bodyGeometry, goldFoilMaterial);
    this.bodyMesh.rotation.x = Math.PI / 2;
    this.probeGroup.add(this.bodyMesh);

    const ringGeo = new THREE.TorusGeometry(1.02, 0.04, 8, 32);
    const ring1 = new THREE.Mesh(ringGeo, metalMaterial);
    const ring2 = new THREE.Mesh(ringGeo, metalMaterial);
    ring1.position.z = -0.6;
    ring2.position.z = 0.6;
    this.probeGroup.add(ring1, ring2);

    // 2. BRACCIO ROBOTICO GERARCHICO
    this.armBaseGroup = new THREE.Group();
    this.armBaseGroup.position.set(0, 0, -1.1);
    this.probeGroup.add(this.armBaseGroup);

    const baseJointGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.2, 16);
    const baseJointMesh = new THREE.Mesh(baseJointGeo, darkMetalMaterial);
    baseJointMesh.rotation.x = Math.PI / 2;
    this.armBaseGroup.add(baseJointMesh);

    this.upperArmGroup = new THREE.Group();
    this.upperArmGroup.position.set(0, 0, -0.1);
    this.armBaseGroup.add(this.upperArmGroup);

    const upperArmGeo = new THREE.CylinderGeometry(0.12, 0.12, 1.0, 12);
    const upperArmMesh = new THREE.Mesh(upperArmGeo, metalMaterial);
    upperArmMesh.position.set(0, 0, -0.5);
    upperArmMesh.rotation.x = Math.PI / 2;
    this.upperArmGroup.add(upperArmMesh);

    const elbowJointGeo = new THREE.SphereGeometry(0.18, 16, 16);
    const elbowJointMesh = new THREE.Mesh(elbowJointGeo, darkMetalMaterial);
    elbowJointMesh.position.set(0, 0, -1.0);
    this.upperArmGroup.add(elbowJointMesh);

    this.forearmGroup = new THREE.Group();
    this.forearmGroup.position.set(0, 0, -1.0);
    this.upperArmGroup.add(this.forearmGroup);

    const forearmGeo = new THREE.CylinderGeometry(0.09, 0.09, 0.9, 12);
    const forearmMesh = new THREE.Mesh(forearmGeo, metalMaterial);
    forearmMesh.position.set(0, 0, -0.45);
    forearmMesh.rotation.x = Math.PI / 2;
    this.forearmGroup.add(forearmMesh);

    const wristSensorGeo = new THREE.SphereGeometry(0.08, 12, 12);
    const wristSensorMesh = new THREE.Mesh(wristSensorGeo, glowMaterial);
    wristSensorMesh.position.set(0, 0, -0.9);
    this.forearmGroup.add(wristSensorMesh);

    // PINZE
    const clawGeo = new THREE.BoxGeometry(0.05, 0.2, 0.3);
    this.leftClaw = new THREE.Mesh(clawGeo, darkMetalMaterial);
    this.leftClaw.position.set(-0.1, 0, -1.05);
    this.forearmGroup.add(this.leftClaw);

    this.rightClaw = new THREE.Mesh(clawGeo, darkMetalMaterial);
    this.rightClaw.position.set(0.1, 0, -1.05);
    this.forearmGroup.add(this.rightClaw);

    this.upperArmGroup.rotation.x = Math.PI / 3;
    this.forearmGroup.rotation.x = -Math.PI / 2.2;

    // 3. PROPULSORE
    const nozzleGeo = new THREE.CylinderGeometry(0.4, 0.6, 0.5, 16);
    const nozzleMesh = new THREE.Mesh(nozzleGeo, metalMaterial);
    nozzleMesh.position.set(0, 0, 1.2);
    nozzleMesh.rotation.x = Math.PI / 2;
    this.probeGroup.add(nozzleMesh);

    const flameGeo = new THREE.ConeGeometry(0.45, 1.2, 16);
    const flameMat = new THREE.MeshBasicMaterial({
      color: 0xffaa00,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending
    });
    this.thrusterFlame = new THREE.Mesh(flameGeo, flameMat);
    this.thrusterFlame.position.set(0, 0, 1.8);
    this.thrusterFlame.rotation.x = -Math.PI / 2;
    this.thrusterFlame.scale.set(0.001, 0.001, 0.001);
    this.probeGroup.add(this.thrusterFlame);

    // 4. PANNELLI SOLARI
    this.leftArmGroup = new THREE.Group();
    this.leftArmGroup.position.set(-1, 0, 0);
    this.probeGroup.add(this.leftArmGroup);

    const panelGeometry = new THREE.BoxGeometry(2.2, 0.05, 0.9);
    const leftPanelMesh = new THREE.Mesh(panelGeometry, solarPanelMaterial);
    leftPanelMesh.position.set(-1.1, 0, 0);
    this.leftArmGroup.add(leftPanelMesh);

    this.rightArmGroup = new THREE.Group();
    this.rightArmGroup.position.set(1, 0, 0);
    this.probeGroup.add(this.rightArmGroup);

    const rightPanelMesh = new THREE.Mesh(panelGeometry, solarPanelMaterial);
    rightPanelMesh.position.set(1.1, 0, 0);
    this.rightArmGroup.add(rightPanelMesh);

    this.leftArmGroup.rotation.z = Math.PI / 2;
    this.rightArmGroup.rotation.z = -Math.PI / 2;
  }

  _setupParticleSystem() {
    const particleGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(this.maxParticles * 3);

    for (let i = 0; i < this.maxParticles; i++) {
      this.particlesData.push({
        x: 0, y: 0, z: 0,
        vx: 0, vy: 0, vz: 0,
        life: 0,
        maxLife: 1.0
      });
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const particleMat = new THREE.PointsMaterial({
      color: 0xff6600,
      size: 0.35,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending
    });

    this.particleSystem = new THREE.Points(particleGeo, particleMat);
    this.scene.add(this.particleSystem);
  }

  // Metodo aggiunto per cambiare dinamicamente la skin
  applySkin(skinKey) {
    if (!this.bodyMesh) return;

    const mat = this.bodyMesh.material;
    switch (skinKey) {
      case 'stealth':
        mat.color.setHex(0x1a1a1a);
        mat.metalness = 0.95;
        mat.roughness = 0.15;
        break;
      case 'titanium':
        mat.color.setHex(0x2b4c7e);
        mat.metalness = 0.7;
        mat.roughness = 0.3;
        break;
      case 'gold':
      default:
        mat.color.setHex(0xd4af37);
        mat.metalness = 0.85;
        mat.roughness = 0.2;
        break;
    }
    mat.needsUpdate = true;
  }

  // Restituisce la posizione nello spazio 3D della pinza
  getGripperWorldPosition() {
    const pos = new THREE.Vector3(0, 0, -1.2);
    return this.forearmGroup.localToWorld(pos);
  }

  // Aggancia l'oggetto specificato alle pinze
  attachObject(objMesh) {
    this.carriedObject = objMesh;
    this.forearmGroup.add(objMesh);
    objMesh.position.set(0, 0, -1.25);
    this.isGripperClosed = true;

    this.leftClaw.position.x = -0.025;
    this.rightClaw.position.x = 0.025;
  }

  // Rilascia l'oggetto trasportato nello spazio
  detachObject() {
    if (!this.carriedObject) return null;

    const releasedObj = this.carriedObject;
    const worldPos = new THREE.Vector3();
    releasedObj.getWorldPosition(worldPos);

    this.scene.add(releasedObj);
    releasedObj.position.copy(worldPos);

    this.carriedObject = null;
    this.isGripperClosed = false;

    this.leftClaw.position.x = -0.1;
    this.rightClaw.position.x = 0.1;

    return releasedObj;
  }

  toggleRoboticArm() {
    const targetUpperRotX = this.isArmExtended ? Math.PI / 3 : 0;
    const targetForearmRotX = this.isArmExtended ? -Math.PI / 2.2 : 0;

    new TWEEN.Tween(this.upperArmGroup.rotation)
      .to({ x: targetUpperRotX }, 1800)
      .easing(TWEEN.Easing.Cubic.Out)
      .start();

    new TWEEN.Tween(this.forearmGroup.rotation)
      .to({ x: targetForearmRotX }, 1800)
      .easing(TWEEN.Easing.Cubic.Out)
      .start();

    this.isArmExtended = !this.isArmExtended;
  }

  toggleSolarPanels() {
    const targetLeftRot = this.isDeployed ? Math.PI / 2 : 0;
    const targetRightRot = this.isDeployed ? -Math.PI / 2 : 0;

    new TWEEN.Tween(this.leftArmGroup.rotation)
      .to({ z: targetLeftRot }, 2500)
      .easing(TWEEN.Easing.Back.Out)
      .start();

    new TWEEN.Tween(this.rightArmGroup.rotation)
      .to({ z: targetRightRot }, 2500)
      .easing(TWEEN.Easing.Back.Out)
      .start();

    this.isDeployed = !this.isDeployed;
  }

  update(deltaTime, isThrusting = false) {
    if (isThrusting) {
      const flicker = 0.8 + Math.random() * 0.4;
      this.thrusterFlame.scale.set(flicker, flicker * 1.3, flicker);
    } else {
      this.thrusterFlame.scale.lerp(new THREE.Vector3(0.001, 0.001, 0.001), 0.2);
    }

    const positions = this.particleSystem.geometry.attributes.position.array;

    const nozzleWorldPos = new THREE.Vector3(0, 0, 1.8);
    nozzleWorldPos.applyMatrix4(this.probeGroup.matrixWorld);

    const backDirection = new THREE.Vector3(0, 0, 1);
    backDirection.applyQuaternion(this.probeGroup.quaternion).normalize();

    if (isThrusting) {
      for (let i = 0; i < 3; i++) {
        const p = this.particlesData.find(pt => pt.life <= 0);
        if (p) {
          p.x = nozzleWorldPos.x + (Math.random() - 0.5) * 0.2;
          p.y = nozzleWorldPos.y + (Math.random() - 0.5) * 0.2;
          p.z = nozzleWorldPos.z + (Math.random() - 0.5) * 0.2;

          const speed = 4.0 + Math.random() * 3.0;
          p.vx = backDirection.x * speed + (Math.random() - 0.5) * 0.5;
          p.vy = backDirection.y * speed + (Math.random() - 0.5) * 0.5;
          p.vz = backDirection.z * speed + (Math.random() - 0.5) * 0.5;

          p.maxLife = 0.4 + Math.random() * 0.4;
          p.life = p.maxLife;
        }
      }
    }

    for (let i = 0; i < this.maxParticles; i++) {
      const p = this.particlesData[i];
      if (p.life > 0) {
        p.life -= deltaTime;
        p.x += p.vx * deltaTime;
        p.y += p.vy * deltaTime;
        p.z += p.vz * deltaTime;

        positions[i * 3] = p.x;
        positions[i * 3 + 1] = p.y;
        positions[i * 3 + 2] = p.z;
      } else {
        positions[i * 3] = 0;
        positions[i * 3 + 1] = -9999;
        positions[i * 3 + 2] = 0;
      }
    }

    this.particleSystem.geometry.attributes.position.needsUpdate = true;
    this.updateBoundingBox();
  }
}