import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export class ModelLoader {
  constructor() {
    this.textureLoader = new THREE.TextureLoader();
    this.gltfLoader = new GLTFLoader();
  }

  loadProbeTextures() {
    return {
      map: this.textureLoader.load('/assets/textures/probe_color.jpg'),
      normalMap: this.textureLoader.load('/assets/textures/probe_normal.jpg'),
      roughnessMap: this.textureLoader.load('/assets/textures/probe_specular.jpg')
    };
  }

  loadGLTF(path) {
    return new Promise((resolve, reject) => {
      this.gltfLoader.load(path, (gltf) => resolve(gltf), undefined, reject);
    });
  }
}