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

// 1. Dynamic Themes Configuration
const crystalTheme = {
  color: 0x00ffff,
  emissive: 0x0055aa
};

const shipTheme = {
  color: 0xaaaaaa,
  roughness: 0.3
};

// 2. Scene and Camera Setup
const scene = new THREE.Scene();
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

// 3. Scene Elements
const lights = new Lights(scene);
const starField = new DataGalaxy(scene);
const cargoShip = new CargoShip(scene);
const spaceProbe = new SpaceProbe(scene);

// Helper to update ship material/texture dynamically
function updateShipTexture() {
  spaceProbe.probeGroup.traverse((child) => {
    if (child.isMesh && child.material) {
      // Modifica il materiale primario della scocca della navicella
      if (child.material.name === 'hullMaterial' || !child.material.emissiveMap) {
        child.material.color.setHex(shipTheme.color);
        child.material.roughness = shipTheme.roughness;
        child.material.needsUpdate = true;
      }
    }
  });
}

// Event Listeners - Crystal Texture Selection
document.querySelectorAll('.crystal-card').forEach(card => {
  card.addEventListener('click', (e) => {
    document.querySelectorAll('.crystal-card').forEach(c => c.classList.remove('active'));
    
    const target = e.currentTarget;
    target.classList.add('active');

    crystalTheme.color = parseInt(target.getAttribute('data-color'));
    crystalTheme.emissive = parseInt(target.getAttribute('data-emissive'));

    if (!isMissionStarted) {
      spawnAllRocks();
    }
  });
});

// Event Listeners - Ship Hull Texture Selection
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

// Button Event Listeners
startBtn.addEventListener('click', () => {
  startOverlay.classList.add('hidden');
  document.getElementById('hud').classList.remove('hidden');
  document.body.classList.add('lil-gui-visible');
  isMissionStarted = true;
});

restartBtn.addEventListener('click', () => {
  resetGame();
});

victoryRestartBtn.addEventListener('click', () => {
  resetGame();
});

victoryContinueBtn.addEventListener('click', () => {
  victoryOverlay.style.display = 'none';
  isFreeNavigationMode = true;
});

// 4. Energy Management System
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

// 5. Crystal Spawning
const rocks = [];
const TOTAL_ROCKS = 6;
totalRocksEl.textContent = TOTAL_ROCKS;
let score = 0;

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

  const mesh = new THREE.Mesh(rockGeo, rockMat);
  rockGroup.add(mesh);

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

function spawnAllRocks() {
  rocks.forEach(rock => scene.remove(rock));
  rocks.length = 0;

  for (let i = 0; i < TOTAL_ROCKS; i++) {
    const randomPos = new THREE.Vector3(
      (Math.random() - 0.5) * 70,
      (Math.random() - 0.5) * 30,
      (Math.random() - 0.5) * 70
    );
    if (randomPos.distanceTo(spaceProbe.probeGroup.position) < 10) randomPos.x += 15;
    createPreciousRock(randomPos);
  }
}

spawnAllRocks();

// 6. User Interface
const gui = new UserInterface(lights, spaceProbe, cameraSettings, handleGrabDropAction);

// 7. Robotic Arm Interaction
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

      if (score >= TOTAL_ROCKS) {
        triggerVictory();
      } else {
        statusMsgEl.textContent = `Crystal Delivered! Retract arm [R] to resume full flight speed.`;
      }
    } else {
      const droppedRock = spaceProbe.detachObject();
      if (droppedRock) {
        rocks.push(droppedRock);
      }
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

// 8. Keyboard Controls
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

  if (spaceProbe.isArmExtended) {
    spaceProbe.toggleRoboticArm();
  }

  if (isSolarPanelsDeployed) {
    isSolarPanelsDeployed = false;
    spaceProbe.toggleSolarPanels();
  }

  spawnAllRocks();
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
    const ROCK_COLLISION_RADIUS = 1.25;

    for (let i = 0; i < rocks.length; i++) {
      if (probePos.distanceTo(rocks[i].position) < ROCK_COLLISION_RADIUS) {
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

  if (energy <= 0) {
    triggerGameOver();
  }

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

// 9. Solar Charging System
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

// 10. Window Resize Listener
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// 11. Main Render Loop
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);

  const deltaTime = clock.getDelta();

  TWEEN.update();
  handleMovement(deltaTime);
  handleSolarRecharge(deltaTime);
  
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

  if (starField && starField.starField) {
    starField.starField.position.copy(camera.position);
  }

  renderer.render(scene, camera);
}

animate();