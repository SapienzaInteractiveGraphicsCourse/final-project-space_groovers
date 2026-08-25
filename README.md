# Deep Space Cargo Recovery

A 3D space simulation and precision recovery game developed with Three.js and Vite. Pilot an exploration probe, manage solar battery levels, navigate orbital hazards, and recover precious energy crystals to transport them safely back to the mothership cargo bay.

🎮 **[Play the game directly here!](https://sapienzainteractivegraphicscourse.github.io/final-project-space_groovers/)**

---

## Features & Highlights

### Game Modes
* **Testing the Probe (Standard):** Free exploration with standard battery drain, unlimited time, and clear flight corridors.
* **Time Attack:** 3-minute mission countdown with static orbital satellite debris functioning as destructive hazards.
* **Spinning out of Space:** Hardcore mode featuring 8 actively orbiting satellites, floating micro-asteroid fields, a 90-second base timer, and a +20s Time Bonus per delivered crystal.

---

## Controls Reference

| Input Key / Action | Function |
| :--- | :--- |
| **W** / **S** | Forward / Backward Thrust |
| **A** / **D** | Roll Left / Right |
| **Left** / **Right** Arrows | Yaw Left / Right |
| **Up** / **Down** Arrows (or **Q** / **E**) | Pitch Up / Down |
| **R** | Extend / Retract Robotic Arm |
| **G** | Grab / Release Crystal |
| **P** | Deploy / Fold Solar Panels (Recharge) |
| **C** | Toggle Cockpit (First-Person) / Third-Person Camera |
| **Left Click + Drag** | Orbit Camera View |
| **Mouse Wheel** | Zoom In / Out |

---

## Tech Stack

* **Core Engine:** Three.js (WebGL 3D Rendering)
* **Animation & Interpolation:** `@tweenjs/tween.js`
* **Build Tool & Dev Server:** Vite
* **Debug Interface:** `lil-gui`

---

## Getting Started

### Prerequisites
Ensure you have **Node.js** (v16 or newer) installed on your system.

### Installation & Run
If you want to run the game locally, follow these steps:

1. Clone the repository and navigate into the project directory:
   ```bash
   git clone [https://github.com/samueleCostantinopoli/IG-Project.git](https://github.com/samueleCostantinopoli/IG-Project.git)
   cd IG-Project

2. Install all required dependencies:
    ```bash
    npm install

3. Launch the local development server:
    ```bash
    npm run dev

4. Open the displayed local address (usually http://localhost:5173) in any WebGL-compatible modern browser.


Project Structure
```plaintext
├── public/
│   ├── background-music.mp3
│   └── textures/
├── src/
│   ├── components/
│   │   ├── CargoShip.js
│   │   ├── DataGalaxy.js
│   │   ├── Lights.js
│   │   └── SpaceProbe.js
│   ├── ui/
│   │   └── UserInterface.js
│   └── main.js
├── index.html
├── package.json
└── README.md
```