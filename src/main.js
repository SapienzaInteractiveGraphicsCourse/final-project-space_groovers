import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import TWEEN from '@tweenjs/tween.js';

import { SpaceProbe } from './components/SpaceProbe.js';
import { CargoShip } from './components/CargoShip.js';
import { DataGalaxy } from './components/DataGalaxy.js';
import { Lights } from './components/Lights.js';
import { UserInterface } from './ui/UserInterface.js';

// UI Element References
const startOverlay = document.getElementById('start-overlay');
const startBtn = document.getElementById('start-btn');

const gameoverOverlay = document.getElementById('gameover-overlay');
const restartBtn = document.getElementById('restart-btn');

const victoryOverlay = document.getElementById('victory-overlay');
const victoryRestartBtn = document.getElementById('victory-restart-btn');
const victoryContinueBtn = document.getElementById('victory-continue-btn');

const dangerOverlay = document.getElementById('danger-overlay');

const scoreEl = document.getElementById('score');
const totalRocksEl = document.getElementById('total-rocks');
const statusMsgEl = document.getElementById('status-msg');
const energyTextEl = document.getElementById('energy-text');
const energyBarEl = document.getElementById('energy-bar');
const solarEffEl = document.getElementById('solar-efficiency');

// Game State Variables
let isMissionStarted = false;
let isSolarPanelsDeployed = false;
let isGameOver = false;
let isVictory = false;
let isFreeNavigationMode = false;
let shakeIntensity = 0.0;

function triggerCameraShake(intensity = 0.4) {
  shakeIntensity = intensity;
}

// Dynamic Themes Configuration
const crystalTheme = {
  color: 0x00ffff,
  emissive: 0x0055aa
};

const shipTheme = {
  color: 0xaaaaaa,
  roughness: 0.3
};

// Scene and Camera Setup
//const scene = new THREE.Scene();
scene.background = new THREE.Color(0x020208);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 3000);
camera.position.set(0, 3, 10);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.minDistance = 2.5;
controls.maxDistance = 100;

const cameraSettings = { 
  isFixed: false,
  isFirstPerson: false 
};

// Scene Elements
const lights = new Lights(scene);
const starField = new DataGalaxy(scene);
const cargoShip = new CargoShip(scene);
const spaceProbe = new SpaceProbe(scene);

function updateShipTexture() {
  spaceProbe.probeGroup.traverse((child) => {
    if (child.isMesh && child.material) {
      const materialName = (child.material.name || '').toLowerCase();
      const meshName = (child.name || '').toLowerCase();

      const isThrusterOrFlame = 
        materialName.includes('flame') || 
        materialName.includes('thruster') || 
        materialName.includes('engine') ||
        meshName.includes('flame') || 
        meshName.includes('thruster') ||
        child.material.type === 'MeshBasicMaterial';

      if (!isThrusterOrFlame) {
        child.material.color.setHex(shipTheme.color);
        child.material.roughness = shipTheme.roughness;
        child.material.needsUpdate = true;
      }
    }
  });
}

// Event Listeners - Texture Selection
document.querySelectorAll('.crystal-card').forEach(card => {
  card.addEventListener('click', (e) => {
    document.querySelectorAll('.crystal-card').forEach(c => c.classList.remove('active'));
    const target = e.currentTarget;
    target.classList.add('active');

    crystalTheme.color = parseInt(target.getAttribute('data-color'));
    crystalTheme.emissive = parseInt(target.getAttribute('data-emissive'));

    if (!isMissionStarted) spawnAllEntities();
  });
});

document.querySelectorAll('.ship-card').forEach(card => {
  card.addEventListener('click', (e) => {
    document.querySelectorAll('.ship-card').forEach(c => c.classList.remove('active'));
    const target = e.currentTarget;
    target.classList.add('active');

    shipTheme.color = parseInt(target.getAttribute('data-color'));
    shipTheme.roughness = parseFloat(target.getAttribute('data-roughness'));

    updateShipTexture();
  });
});

startBtn.addEventListener('click', () => {
  startOverlay.classList.add('hidden');
  document.getElementById('hud').classList.remove('hidden');
  document.body.classList.add('lil-gui-visible');
  isMissionStarted = true;

  spawnAllEntities();
});

restartBtn.addEventListener('click', () => resetGame());
victoryRestartBtn.addEventListener('click', () => resetGame());
victoryContinueBtn.addEventListener('click', () => {
  victoryOverlay.style.display = 'none';
  isFreeNavigationMode = true;
});

// Energy Management System
let energy = 100.0;
const MAX_ENERGY = 100.0;

function updateEnergyUI() {
  const percentage = Math.max(0, Math.min(100, Math.round(energy)));
  energyTextEl.textContent = `${percentage}%`;
  energyBarEl.style.width = `${percentage}%`;

  if (percentage > 50) {
    energyBarEl.style.background = 'linear-gradient(90deg, #00ff88, #00ffff)';
  } else if (percentage > 20) {
    energyBarEl.style.background = 'linear-gradient(90deg, #ffcc00, #ff8800)';
  } else {
    energyBarEl.style.background = 'linear-gradient(90deg, #ff3300, #ff0055)';
  }

  if (dangerOverlay) {
    if (percentage <= 10 && percentage > 0 && isMissionStarted) {
      dangerOverlay.classList.add('active');
    } else {
      dangerOverlay.classList.remove('active');
    }
  }
}

//  Entities, Active Orbit Satellites & Micro-Asteroids
const rocks = [];
const TOTAL_ROCKS = 6;
totalRocksEl.textContent = TOTAL_ROCKS;
let score = 0;

const satellites = [];
const asteroids = [];

function createSatelliteMesh(radius, speed, height, angleOffset) {
  const satGroup = new THREE.Group();

  const bodyGeo = new THREE.BoxGeometry(1.4, 1.8, 1.4);
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0x667788, metalness: 0.85, roughness: 0.2 });
  satGroup.add(new THREE.Mesh(bodyGeo, bodyMat));

  const panelGeo = new THREE.BoxGeometry(3.6, 0.05, 0.9);
  const panelMat = new THREE.MeshStandardMaterial({ color: 0x001133, emissive: 0x002266, metalness: 0.9, roughness: 0.1 });
  satGroup.add(new THREE.Mesh(panelGeo, panelMat));

  const dishGeo = new THREE.ConeGeometry(0.6, 0.4, 16, 1, true);
  const dishMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.9, roughness: 0.1 });
  const dish = new THREE.Mesh(dishGeo, dishMat);
  dish.position.set(0, 1.1, 0);
  dish.rotation.x = Math.PI;
  satGroup.add(dish);

  const beaconGeo = new THREE.SphereGeometry(0.15, 8, 8);
  const beaconMat = new THREE.MeshBasicMaterial({ color: 0xff0033 });
  const beacon = new THREE.Mesh(beaconGeo, beaconMat);
  beacon.position.set(0, -1.0, 0);
  satGroup.add(beacon);

  satGroup.userData = {
    orbitRadius: radius,
    orbitSpeed: speed,
    orbitHeight: height,
    angle: angleOffset
  };

  satGroup.position.set(
    Math.cos(angleOffset) * radius,
    height,
    Math.sin(angleOffset) * radius
  );

  scene.add(satGroup);
  satellites.push(satGroup);
}

function createMicroAsteroid(pos) {
  const asteroidGeo = new THREE.DodecahedronGeometry(0.7 + Math.random() * 0.5, 0);
  const asteroidMat = new THREE.MeshStandardMaterial({ color: 0x554433, roughness: 0.9, metalness: 0.1 });
  const asteroid = new THREE.Mesh(asteroidGeo, asteroidMat);
  asteroid.position.copy(pos);
  asteroid.userData = {
    rotSpeedX: (Math.random() - 0.5) * 1.5,
    rotSpeedY: (Math.random() - 0.5) * 1.5
  };
  scene.add(asteroid);
  asteroids.push(asteroid);
}

function createPreciousRock(pos) {
  const rockGroup = new THREE.Group();

  const rockGeo = new THREE.DodecahedronGeometry(0.45, 1);
  const rockMat = new THREE.MeshStandardMaterial({
    color: crystalTheme.color,
    emissive: crystalTheme.emissive,
    emissiveIntensity: 0.6,
    roughness: 0.2,
    metalness: 0.8
  });
  rockGroup.add(new THREE.Mesh(rockGeo, rockMat));

  const glowGeo = new THREE.SphereGeometry(0.6, 12, 12);
  const glowMat = new THREE.MeshBasicMaterial({
    color: crystalTheme.color,
    transparent: true,
    opacity: 0.25,
    blending: THREE.AdditiveBlending
  });
  rockGroup.add(new THREE.Mesh(glowGeo, glowMat));

  rockGroup.position.copy(pos);
  scene.add(rockGroup);
  rocks.push(rockGroup);
}

function spawnSatellites() {
  satellites.forEach(sat => scene.remove(sat));
  satellites.length = 0;

  if (window.gameMode === 'beginner') return;

  const count = window.gameMode === 'spinning' ? 8 : 6;

  for (let i = 0; i < count; i++) {
    const radius = 25 + i * 6;
    const speed = (0.2 + Math.random() * 0.3) * (i % 2 === 0 ? 1 : -1);
    const height = (Math.random() - 0.5) * 25;
    const angleOffset = (i / count) * Math.PI * 2;
    createSatelliteMesh(radius, speed, height, angleOffset);
  }
}

function spawnAsteroids() {
  asteroids.forEach(ast => scene.remove(ast));
  asteroids.length = 0;

  if (window.gameMode !== 'spinning') return;

  for (let i = 0; i < 10; i++) {
    const randomPos = new THREE.Vector3(
      (Math.random() - 0.5) * 75,
      (Math.random() - 0.5) * 30,
      (Math.random() - 0.5) * 75
    );
    if (randomPos.distanceTo(spaceProbe.probeGroup.position) < 15) randomPos.x += 20;
    createMicroAsteroid(randomPos);
  }
}

function spawnAllRocks() {
  rocks.forEach(rock => scene.remove(rock));
  rocks.length = 0;

  for (let i = 0; i < TOTAL_ROCKS; i++) {
    let validPosition = false;
    let randomPos = new THREE.Vector3();
    let attempts = 0;

    while (!validPosition && attempts < 100) {
      attempts++;
      randomPos.set(
        (Math.random() - 0.5) * 65,
        (Math.random() - 0.5) * 25,
        (Math.random() - 0.5) * 65
      );

      const distProbe = randomPos.distanceTo(spaceProbe.probeGroup.position);
      if (distProbe < 12.0) continue;

      const overlapsRock = rocks.some(r => r.position.distanceTo(randomPos) < 6.0);
      if (overlapsRock) continue;

      validPosition = true;
    }

    createPreciousRock(randomPos);
  }
}

function spawnAllEntities() {
  spawnSatellites();
  spawnAsteroids();
  spawnAllRocks();
}

spawnAllEntities();

function checkHazardCollisions() {
  if (!isMissionStarted || !window.isMissionStarted || isGameOver || (isVictory && !isFreeNavigationMode)) return;

  const probePos = spaceProbe.probeGroup.position;

  for (const sat of satellites) {
    if (probePos.distanceTo(sat.position) < 2.4) {
      triggerCameraShake(2.0); 
      energy = 0;
      updateEnergyUI();
      statusMsgEl.style.color = '#ff0033';
      statusMsgEl.textContent = 'CRITICAL IMPACT WITH SATELLITE!';
      triggerGameOver();
      return;
    }
  }

  for (const ast of asteroids) {
    if (probePos.distanceTo(ast.position) < 1.6) {
      triggerCameraShake(1.2); 
      energy = Math.max(0, energy - 20);
      updateEnergyUI();
      statusMsgEl.style.color = '#ff4400';
      statusMsgEl.textContent = 'COLLISION WITH ASTEROID! HULL DAMAGED (-20% POWER)';
      if (energy <= 0) triggerGameOver();
      return;
    }
  }
}

// User Interface
const gui = new UserInterface(lights, spaceProbe, cameraSettings, handleGrabDropAction);

// Robotic Arm Interaction & Delivery Bonus
function handleGrabDropAction() {
  if (!isMissionStarted || isGameOver || (isVictory && !isFreeNavigationMode)) return;

  if (energy <= 0) {
    statusMsgEl.style.color = '#ff3300';
    statusMsgEl.textContent = 'NO POWER!';
    return;
  }

  if (isSolarPanelsDeployed) {
    statusMsgEl.style.color = '#ffaa00';
    statusMsgEl.textContent = 'Close solar panels [P] before operating arm!';
    return;
  }

  if (!spaceProbe.isArmExtended) {
    statusMsgEl.style.color = '#ffaa00';
    statusMsgEl.textContent = 'Arm is folded! Press [R] to extend arm before grabbing or dropping.';
    return;
  }

  energy = Math.max(0, energy - 1.5);
  updateEnergyUI();

  const gripperPos = spaceProbe.getGripperWorldPosition();

  if (spaceProbe.carriedObject) {
    const distToDockingBay = spaceProbe.probeGroup.position.distanceTo(cargoShip.getDockingBayWorldPosition());

    if (distToDockingBay < 6.0) {
      const deliveredObj = spaceProbe.detachObject();
      scene.remove(deliveredObj);

      score++;
      scoreEl.textContent = score;
      statusMsgEl.style.color = '#00ff88';

      if (window.addTimeBonus) {
        window.addTimeBonus(20);
      }

      if (score >= TOTAL_ROCKS) {
        triggerVictory();
      } else {
        statusMsgEl.textContent = `Crystal Delivered! (+20s Bonus). Retract arm [R] to fly fast.`;
      }
    } else {
      const droppedRock = spaceProbe.detachObject();
      if (droppedRock) rocks.push(droppedRock);
      statusMsgEl.style.color = '#ffcc00';
      statusMsgEl.textContent = 'Crystal released into space.';
    }
  } else {
    let closestRock = null;
    let minDistance = 1.8;

    rocks.forEach(rock => {
      const dist = gripperPos.distanceTo(rock.position);
      if (dist < minDistance) {
        minDistance = dist;
        closestRock = rock;
      }
    });

    if (closestRock) {
      const index = rocks.indexOf(closestRock);
      if (index > -1) rocks.splice(index, 1);

      spaceProbe.attachObject(closestRock);
      statusMsgEl.style.color = '#00ffff';
      statusMsgEl.textContent = 'Crystal secured! Transport to Mothership Cargo Bay.';
    } else {
      statusMsgEl.style.color = '#ff6666';
      statusMsgEl.textContent = 'No crystal in range of extended arm!';
    }
  }
}

// Keyboard Controls
const keys = {
  KeyW: false, KeyS: false, KeyA: false, KeyD: false,
  KeyQ: false, KeyE: false, ArrowUp: false, ArrowDown: false,
  ArrowLeft: false, ArrowRight: false
};

window.addEventListener('keydown', (e) => { 
  if (!isMissionStarted || isGameOver || (isVictory && !isFreeNavigationMode)) return;

  if (e.code in keys) {
    keys[e.code] = true; 
    if (e.code.startsWith('Arrow')) e.preventDefault();
  }

  if (e.code === 'KeyG') handleGrabDropAction();
  if (e.code === 'KeyR') {
    if (!isSolarPanelsDeployed) spaceProbe.toggleRoboticArm();
  }
  if (e.code === 'KeyP') {
    isSolarPanelsDeployed = !isSolarPanelsDeployed;
    spaceProbe.toggleSolarPanels();
  }
  if (e.code === 'KeyC') {
    cameraSettings.isFirstPerson = !cameraSettings.isFirstPerson;
  }
});

window.addEventListener('keyup', (e) => { 
  if (e.code in keys) keys[e.code] = false; 
});

const MAX_PROBE_DISTANCE = 100;

function triggerGameOver() {
  isGameOver = true;
  gameoverOverlay.classList.remove('hidden');
  if (dangerOverlay) dangerOverlay.classList.remove('active');
}

function triggerVictory() {
  isVictory = true;
  victoryOverlay.classList.remove('hidden');
  statusMsgEl.style.color = '#00ff88';
  statusMsgEl.textContent = 'MISSION ACCOMPLISHED! ALL CRYSTALS DELIVERED!';
  if (dangerOverlay) dangerOverlay.classList.remove('active');
}

function resetGame() {
  isGameOver = false;
  isVictory = false;
  isFreeNavigationMode = false;
  isMissionStarted = false;

  gameoverOverlay.classList.add('hidden');
  victoryOverlay.classList.add('hidden');
  startOverlay.classList.remove('hidden');

  energy = MAX_ENERGY;
  score = 0;
  scoreEl.textContent = '0';
  updateEnergyUI();

  spaceProbe.probeGroup.position.set(0, 0, 0);
  spaceProbe.probeGroup.rotation.set(0, 0, 0);

  if (spaceProbe.carriedObject) {
    const obj = spaceProbe.detachObject();
    scene.remove(obj);
  }

  if (spaceProbe.isArmExtended) spaceProbe.toggleRoboticArm();
  if (isSolarPanelsDeployed) {
    isSolarPanelsDeployed = false;
    spaceProbe.toggleSolarPanels();
  }

  spawnAllEntities();
  updateShipTexture();

  statusMsgEl.style.color = '#ffcc00';
  statusMsgEl.textContent = 'Fly near a crystal, extend arm [R] and press [G] to grab';
}

function handleMovement(deltaTime) {
  if (!isMissionStarted || isGameOver || (isVictory && !isFreeNavigationMode)) return;

  const speedFactor = spaceProbe.isArmExtended ? 0.15 : 1.0;
  const moveSpeed = 10.0 * deltaTime * speedFactor;
  const turnSpeed = 1.8 * deltaTime * speedFactor;

  const oldPosition = spaceProbe.probeGroup.position.clone();

  if (keys.ArrowLeft) spaceProbe.probeGroup.rotateY(turnSpeed);
  if (keys.ArrowRight) spaceProbe.probeGroup.rotateY(-turnSpeed);

  if (keys.ArrowUp || keys.KeyQ) spaceProbe.probeGroup.rotateX(turnSpeed);
  if (keys.ArrowDown || keys.KeyE) spaceProbe.probeGroup.rotateX(-turnSpeed);

  if (keys.KeyA) spaceProbe.probeGroup.rotateZ(turnSpeed);
  if (keys.KeyD) spaceProbe.probeGroup.rotateZ(-turnSpeed);

  const canTranslate = !isSolarPanelsDeployed && energy > 0;

  if (canTranslate) {
    if (keys.KeyW) spaceProbe.probeGroup.translateZ(-moveSpeed);
    if (keys.KeyS) spaceProbe.probeGroup.translateZ(moveSpeed);

    spaceProbe.probeGroup.position.clampLength(0, MAX_PROBE_DISTANCE);

    if (spaceProbe.updateBoundingBox) {
      spaceProbe.updateBoundingBox();
      if (spaceProbe.boundingBox && spaceProbe.boundingBox.intersectsSphere(cargoShip.boundingSphere)) {
        spaceProbe.probeGroup.position.copy(oldPosition);
        if (spaceProbe.updateBoundingBox) spaceProbe.updateBoundingBox();
      }
    }

    const probePos = spaceProbe.probeGroup.position;
    for (let i = 0; i < rocks.length; i++) {
      if (probePos.distanceTo(rocks[i].position) < 1.25) {
        spaceProbe.probeGroup.position.copy(oldPosition);
        if (spaceProbe.updateBoundingBox) spaceProbe.updateBoundingBox();
        break;
      }
    }
  }

  const isMovingKey = keys.KeyW || keys.KeyS || keys.KeyA || keys.KeyD ||
                      keys.ArrowLeft || keys.ArrowRight || keys.ArrowUp || keys.ArrowDown ||
                      keys.KeyQ || keys.KeyE;

  if (energy > 0) {
    const drainRate = (canTranslate && isMovingKey) ? 1.2 : 0.15;
    energy = Math.max(0, energy - drainRate * deltaTime);
    updateEnergyUI();
  }

  if (energy <= 0) triggerGameOver();

  if (cameraSettings.isFirstPerson) {
    controls.enabled = false;
    camera.fov = 85;
    camera.updateProjectionMatrix();

    const cockpitOffset = new THREE.Vector3(0, 0.8, -0.2);
    cockpitOffset.applyQuaternion(spaceProbe.probeGroup.quaternion);
    camera.position.copy(spaceProbe.probeGroup.position).add(cockpitOffset);

    const forwardTarget = new THREE.Vector3(0, -0.1, -10);
    forwardTarget.applyQuaternion(spaceProbe.probeGroup.quaternion);
    forwardTarget.add(spaceProbe.probeGroup.position);
    camera.lookAt(forwardTarget);
  } else {
    controls.enabled = true;
    if (camera.fov !== 60) {
      camera.fov = 60;
      camera.updateProjectionMatrix();
    }

    if (!cameraSettings.isFixed) {
      const currentProbePos = spaceProbe.probeGroup.position;
      const deltaMove = new THREE.Vector3().subVectors(currentProbePos, controls.target);
      camera.position.add(deltaMove);
      controls.target.copy(currentProbePos);
    }
  }
}

// Solar Charging System
function handleSolarRecharge(deltaTime) {
  if (!isMissionStarted || isGameOver || (isVictory && !isFreeNavigationMode)) return;

  if (!isSolarPanelsDeployed) {
    solarEffEl.style.display = 'none';
    return;
  }

  solarEffEl.style.display = 'block';

  const sunPos = lights.sunLight.position;
  const probePos = spaceProbe.probeGroup.position;
  const sunDir = new THREE.Vector3().subVectors(sunPos, probePos).normalize();

  const topNormalLocal = new THREE.Vector3(0, 1, 0);
  const topNormalWorld = topNormalLocal.applyQuaternion(spaceProbe.probeGroup.quaternion).normalize();

  const alignmentFactor = topNormalWorld.dot(sunDir);
  const MIN_ALIGNMENT_THRESHOLD = 0.82; 

  if (alignmentFactor > MIN_ALIGNMENT_THRESHOLD) {
    const rechargeEfficiency = (alignmentFactor - MIN_ALIGNMENT_THRESHOLD) / (1.0 - MIN_ALIGNMENT_THRESHOLD);
    const MAX_RECHARGE_RATE = 20.0; 
    const actualRecharge = MAX_RECHARGE_RATE * (0.4 + 0.6 * rechargeEfficiency) * deltaTime;

    if (energy < MAX_ENERGY) {
      energy = Math.min(MAX_ENERGY, energy + actualRecharge);
      updateEnergyUI();
    }

    solarEffEl.style.color = '#00ff88';
    solarEffEl.textContent = '☀️ ALIGNMENT OK - CHARGING ACTIVE';

    if (energy >= MAX_ENERGY) {
      statusMsgEl.style.color = '#00ff88';
      statusMsgEl.textContent = 'BATTERY FULLY CHARGED! Retract panels [P] to fly.';
    } else {
      statusMsgEl.style.color = '#00ff88';
      statusMsgEl.textContent = 'Solar panels locked on Sun. Recharging batteries...';
    }
  } else {
    solarEffEl.style.color = '#ffaa00';
    if (alignmentFactor <= 0) {
      solarEffEl.textContent = '⚠️ SUN BEHIND PANELS - ROTATE TO FACE SUN';
      statusMsgEl.style.color = '#ff4444';
      statusMsgEl.textContent = 'No sun exposure! Rotate probe so top solar panels face the Sun.';
    } else {
      const currentAnglePct = Math.round((alignmentFactor / MIN_ALIGNMENT_THRESHOLD) * 100);
      solarEffEl.textContent = `⚠️ ALIGNING... (${currentAnglePct}%)`;
      statusMsgEl.style.color = '#ffaa00';
      statusMsgEl.textContent = 'Rotate probe on the spot to face top side directly towards the Sun!';
    }
  }
}

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Main Render Loop
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);

  const deltaTime = clock.getDelta();

  TWEEN.update();
  handleMovement(deltaTime);
  handleSolarRecharge(deltaTime);
  
  checkHazardCollisions();

  if (!cameraSettings.isFirstPerson) {
    controls.update();
  }

  const isMoving = keys.KeyW || keys.KeyS;
  spaceProbe.update(deltaTime, isMoving);
  cargoShip.update(deltaTime);
  starField.update(deltaTime);


  rocks.forEach(rock => {
    rock.rotation.x += 0.5 * deltaTime;
    rock.rotation.y += 0.8 * deltaTime;
  });


  satellites.forEach(sat => {
    if (window.gameMode === 'spinning') {
      sat.userData.angle += sat.userData.orbitSpeed * deltaTime;
      sat.position.x = Math.cos(sat.userData.angle) * sat.userData.orbitRadius;
      sat.position.z = Math.sin(sat.userData.angle) * sat.userData.orbitRadius;
      sat.position.y = sat.userData.orbitHeight;
    }
    sat.rotation.y += 0.4 * deltaTime;
    sat.rotation.z += 0.2 * deltaTime;
  });

  asteroids.forEach(ast => {
    ast.rotation.x += ast.userData.rotSpeedX * deltaTime;
    ast.rotation.y += ast.userData.rotSpeedY * deltaTime;
  });

  if (starField && starField.starField) {
    starField.starField.position.copy(camera.position);
  }
  // CAMERA & TARGET SHAKE UPDATE 
  if (shakeIntensity > 0) {
    const shakeOffsetX = (Math.random() - 0.5) * shakeIntensity;
    const shakeOffsetY = (Math.random() - 0.5) * shakeIntensity;
    const shakeOffsetZ = (Math.random() - 0.5) * shakeIntensity;

    camera.position.x += shakeOffsetX;
    camera.position.y += shakeOffsetY;
    camera.position.z += shakeOffsetZ;

    if (!cameraSettings.isFirstPerson) {
      controls.target.x += shakeOffsetX * 0.5;
      controls.target.y += shakeOffsetY * 0.5;
      controls.target.z += shakeOffsetZ * 0.5;
    }

    shakeIntensity = Math.max(0, shakeIntensity - deltaTime * 3.0);
  }
  // ------------------------------------
  renderer.render(scene, camera);
}

animate();