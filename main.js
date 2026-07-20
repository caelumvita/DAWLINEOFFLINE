import * as THREE from "three";
import { EXRLoader } from "three/addons/loaders/EXRLoader.js";
import { OBJLoader } from "three/addons/loaders/OBJLoader.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { SAOPass } from "three/addons/postprocessing/SAOPass.js";
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { FXAAShader } from "three/addons/shaders/FXAAShader.js";

/* =========================================================
   FILES
========================================================= */

const FILES = {
  sky: "./textures/qwantani_dusk_2_puresky_1k.exr",

  grass: [
    "./textures/aerial_grass_rock_diff_1k.jpg",
    "./textures/aerial_grass_rock_diff_1k.png",
    "./textures/aerial_grass_rock_diff_1k.jpeg",
    "./textures/aerial_grass_rock_diff_1k.webp"
  ],

  concrete: [
    "./textures/concrete_floor_worn_001_diff_1k.jpg",
    "./textures/concrete_floor_worn_001_diff_1k.png",
    "./textures/concrete_floor_worn_001_diff_1k.jpeg",
    "./textures/concrete_floor_worn_001_diff_1k.webp"
  ],

  house: "./models/Bambo_House.obj",

  bottle: "./models/Corona.obj",
  bottleTexture: "./textures/BotellaText.jpg",

  footsteps:
    "./sound/soundreality-footsteps-walking-boots-parquet-1-420135.mp3",

  drink:
    "./sound/nahtt-drink-323882.mp3"
};

/* =========================================================
   SETTINGS
========================================================= */

const PLAYER_HEIGHT = 2.3;
const PLAYER_RADIUS = 0.48;

const BASE_WIDTH = 72;
const BASE_LENGTH = 96;

const WALK_SPEED = 5.2;
const ACCELERATION = 12;
const DECELERATION = 15;

const MOUSE_SENSITIVITY = 0.002;
const TOUCH_SENSITIVITY = 0.0043;

const HOUSE_LEFT_X = -23;
const HOUSE_RIGHT_X = 23;

const HOUSE_Z_POSITIONS = [-30, 0, 30];

const HOUSE_LEFT_ROTATION = Math.PI / 2;
const HOUSE_RIGHT_ROTATION = -Math.PI / 2;

const SIDEWALK_LEFT_X = -8;
const SIDEWALK_RIGHT_X = 8;
const SIDEWALK_WIDTH = 4.3;

const DRINK_DURATION = 4;

const STREET_LIGHT_Z = [-36, -12, 12, 36];
const CINEMATIC_AO_ENABLED =
  !window.matchMedia("(pointer: coarse)").matches &&
  (navigator.deviceMemory ?? 8) >= 4;

/* =========================================================
   HTML
========================================================= */

const loadingScreen = document.getElementById("loadingScreen");
const loadingText = document.getElementById("loadingText");

const desktopHint = document.getElementById("desktopHint");
const mobileHint = document.getElementById("mobileHint");

const joystick = document.getElementById("joystick");
const joystickStick = document.getElementById("joystickStick");
const lookZone = document.getElementById("lookZone");
const drinkButton = document.getElementById("drinkButton");
const graphicsButton = document.getElementById("graphicsButton");

const isMobile =
  window.matchMedia("(pointer: coarse)").matches ||
  navigator.maxTouchPoints > 0;

let loadingHidden = false;

function setLoadingText(text) {
  if (loadingText) {
    loadingText.textContent = text;
  }
}

function hideLoadingScreen() {
  if (loadingHidden) {
    return;
  }

  loadingHidden = true;
  setLoadingText("Готово!");

  setTimeout(() => {
    loadingScreen?.classList.add("hidden");
  }, 200);

  setTimeout(() => {
    if (desktopHint) {
      desktopHint.style.opacity = "0";
    }

    if (mobileHint) {
      mobileHint.style.opacity = "0";
    }
  }, 6500);
}

window.addEventListener("error", (event) => {
  console.error("Global error:", event.error);
  hideLoadingScreen();
});

window.addEventListener("unhandledrejection", (event) => {
  console.error("Unhandled promise rejection:", event.reason);
  hideLoadingScreen();
});

/* =========================================================
   SCENE
========================================================= */

const scene = new THREE.Scene();

scene.background = new THREE.Color(0x657c8c);
scene.fog = new THREE.FogExp2(0x657887, 0.0065);

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  powerPreference: "high-performance"
});

renderer.setSize(window.innerWidth, window.innerHeight);

renderer.setPixelRatio(
  Math.min(window.devicePixelRatio, isMobile ? 1.2 : 1.5)
);

renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.04;

document.body.appendChild(renderer.domElement);

const CINEMATIC_AO_AVAILABLE =
  CINEMATIC_AO_ENABLED &&
  renderer.capabilities.isWebGL2;

/* =========================================================
   PLAYER AND CAMERA
========================================================= */

const player = new THREE.Group();
player.position.set(0, 0, 40);
scene.add(player);

const eyePivot = new THREE.Group();
eyePivot.position.set(0, PLAYER_HEIGHT, 0);
player.add(eyePivot);

const camera = new THREE.PerspectiveCamera(
  72,
  window.innerWidth / window.innerHeight,
  0.06,
  500
);

camera.position.set(0, 0, 0);
eyePivot.add(camera);

let yaw = 0;
let pitch = 0;

/* =========================================================
   CINEMATIC POST-PROCESSING
========================================================= */

const composer = new EffectComposer(renderer);

composer.setPixelRatio(
  Math.min(window.devicePixelRatio, isMobile ? 1.1 : 1.35)
);

composer.setSize(window.innerWidth, window.innerHeight);
composer.addPass(new RenderPass(scene, camera));

const saoPass = new SAOPass(
  scene,
  camera,
  new THREE.Vector2(
    window.innerWidth,
    window.innerHeight
  )
);

saoPass.params.saoBias = 0.35;
saoPass.params.saoIntensity = 0.055;
saoPass.params.saoScale = 18;
saoPass.params.saoKernelRadius = 26;
saoPass.params.saoMinResolution = 0.001;
saoPass.params.saoBlur = true;
saoPass.params.saoBlurRadius = 5;
saoPass.params.saoBlurStdDev = 2.4;
saoPass.params.saoBlurDepthCutoff = 0.012;
saoPass.enabled = CINEMATIC_AO_AVAILABLE;

composer.addPass(saoPass);

const cinematicShader = {
  uniforms: {
    tDiffuse: { value: null },
    uTime: { value: 0 },
    uResolution: {
      value: new THREE.Vector2(
        window.innerWidth,
        window.innerHeight
      )
    },
    uStrength: { value: isMobile ? 0.68 : 1 }
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;

    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform float uTime;
    uniform vec2 uResolution;
    uniform float uStrength;

    varying vec2 vUv;

    float luminance(vec3 color) {
      return dot(color, vec3(0.2126, 0.7152, 0.0722));
    }

    float hash(vec2 point) {
      return fract(sin(dot(point, vec2(12.9898, 78.233))) * 43758.5453);
    }

    void main() {
      vec3 color = texture2D(tDiffuse, vUv).rgb;
      vec2 texel = 1.0 / max(uResolution, vec2(1.0));

      vec3 glow = vec3(0.0);
      glow += texture2D(tDiffuse, vUv + vec2(texel.x * 2.0, 0.0)).rgb;
      glow += texture2D(tDiffuse, vUv - vec2(texel.x * 2.0, 0.0)).rgb;
      glow += texture2D(tDiffuse, vUv + vec2(0.0, texel.y * 2.0)).rgb;
      glow += texture2D(tDiffuse, vUv - vec2(0.0, texel.y * 2.0)).rgb;
      glow *= 0.25;

      float glowMask = smoothstep(0.68, 1.35, luminance(glow));
      color += glow * glowMask * 0.045 * uStrength;

      float lightness = luminance(color);
      color = mix(vec3(lightness), color, 1.055);
      color = (color - 0.5) * 1.035 + 0.5;

      vec3 coolShadow = vec3(-0.018, -0.006, 0.028);
      vec3 warmLight = vec3(0.027, 0.012, -0.010);
      color += mix(coolShadow, warmLight, smoothstep(0.12, 0.82, lightness)) * uStrength;

      vec2 centered = vUv - 0.5;
      float vignette = smoothstep(0.78, 0.27, dot(centered, centered));
      color *= mix(0.86, 1.0, mix(1.0, vignette, uStrength));

      float grain = hash(vUv * uResolution + fract(uTime) * 91.7) - 0.5;
      color += grain * 0.008 * uStrength;

      gl_FragColor = vec4(max(color, 0.0), 1.0);
    }
  `
};

const cinematicPass = new ShaderPass(cinematicShader);
composer.addPass(cinematicPass);

const fxaaPass = new ShaderPass(FXAAShader);

function updatePostProcessingSize() {
  const pixelRatio = Math.min(
    window.devicePixelRatio,
    isMobile ? 1.1 : 1.35
  );

  composer.setPixelRatio(pixelRatio);
  composer.setSize(window.innerWidth, window.innerHeight);

  fxaaPass.material.uniforms.resolution.value.set(
    1 / (window.innerWidth * pixelRatio),
    1 / (window.innerHeight * pixelRatio)
  );

  cinematicPass.uniforms.uResolution.value.set(
    window.innerWidth * pixelRatio,
    window.innerHeight * pixelRatio
  );
}

updatePostProcessingSize();
composer.addPass(fxaaPass);
composer.addPass(new OutputPass());

let cinematicEffectsEnabled = true;

function updateGraphicsButton() {
  if (!graphicsButton) {
    return;
  }

  graphicsButton.textContent = cinematicEffectsEnabled
    ? "✨ Кіно"
    : "⚡ Швидко";

  graphicsButton.setAttribute(
    "aria-pressed",
    String(cinematicEffectsEnabled)
  );
}

function toggleCinematicEffects() {
  cinematicEffectsEnabled = !cinematicEffectsEnabled;
  cinematicPass.enabled = cinematicEffectsEnabled;
  saoPass.enabled =
    cinematicEffectsEnabled && CINEMATIC_AO_AVAILABLE;
  updateGraphicsButton();
}

graphicsButton?.addEventListener("click", (event) => {
  event.preventDefault();
  event.stopPropagation();
  toggleCinematicEffects();
});

updateGraphicsButton();

/* =========================================================
   LIGHTING
========================================================= */

const hemisphereLight = new THREE.HemisphereLight(
  0xbfd8ee,
  0x25291f,
  0.52
);

scene.add(hemisphereLight);

const sun = new THREE.DirectionalLight(
  0xffc98e,
  3.15
);

sun.position.set(-48, 54, 28);
sun.castShadow = true;

sun.shadow.mapSize.set(
  isMobile ? 2048 : 4096,
  isMobile ? 2048 : 4096
);
sun.shadow.camera.near = 1;
sun.shadow.camera.far = 150;
sun.shadow.camera.left = -48;
sun.shadow.camera.right = 48;
sun.shadow.camera.top = 58;
sun.shadow.camera.bottom = -58;
sun.shadow.bias = -0.00008;
sun.shadow.normalBias = 0.03;
sun.shadow.radius = 3;

sun.target.position.set(0, 0, 0);

scene.add(sun);
scene.add(sun.target);

const ambientLight = new THREE.AmbientLight(
  0x6d8190,
  0.08
);

scene.add(ambientLight);

const coolFillLight = new THREE.DirectionalLight(
  0x7899bd,
  0.22
);

coolFillLight.position.set(36, 22, -32);
scene.add(coolFillLight);

/* =========================================================
   TEXTURE HELPERS
========================================================= */

const textureLoader = new THREE.TextureLoader();

async function loadFirstTexture(candidates) {
  for (const file of candidates) {
    try {
      const texture = await textureLoader.loadAsync(file);

      console.log("Texture loaded:", file);
      return texture;
    } catch (error) {
      console.warn("Texture not found:", file);
    }
  }

  throw new Error("No matching texture was found");
}

function prepareRepeatingTexture(
  texture,
  repeatX,
  repeatY
) {
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(repeatX, repeatY);
  texture.anisotropy =
    renderer.capabilities.getMaxAnisotropy();
  texture.needsUpdate = true;
  return texture;
}

function createReliefTexture(texture) {
  const reliefTexture = texture.clone();

  reliefTexture.colorSpace = THREE.NoColorSpace;
  reliefTexture.wrapS = texture.wrapS;
  reliefTexture.wrapT = texture.wrapT;
  reliefTexture.repeat.copy(texture.repeat);
  reliefTexture.anisotropy = texture.anisotropy;
  reliefTexture.needsUpdate = true;

  return reliefTexture;
}

/* =========================================================
   SKY
========================================================= */

async function loadSky() {
  const generator = new THREE.PMREMGenerator(renderer);

  generator.compileEquirectangularShader();

  try {
    const texture =
      await new EXRLoader().loadAsync(FILES.sky);

    texture.mapping =
      THREE.EquirectangularReflectionMapping;

    scene.background = texture;
    scene.environment =
      generator.fromEquirectangular(texture).texture;

    scene.backgroundIntensity = 0.78;
    scene.environmentIntensity = 0.52;

    console.log("Sky loaded");
  } catch (error) {
    console.error("Sky error:", error);
    scene.background = new THREE.Color(0x7895a8);
  } finally {
    generator.dispose();
  }
}

/* =========================================================
   BASEPLATE
========================================================= */

const grassMaterial =
  new THREE.MeshStandardMaterial({
    color: 0x68875b,
    roughness: 1,
    metalness: 0
  });

const baseplate = new THREE.Mesh(
  new THREE.BoxGeometry(
    BASE_WIDTH,
    1,
    BASE_LENGTH
  ),
  grassMaterial
);

baseplate.position.y = -0.5;
baseplate.receiveShadow = true;
baseplate.castShadow = false;

scene.add(baseplate);

async function loadGrass() {
  try {
    const texture = await loadFirstTexture(FILES.grass);

    prepareRepeatingTexture(texture, 10, 14);

    grassMaterial.map = texture;
    grassMaterial.bumpMap = createReliefTexture(texture);
    grassMaterial.bumpScale = 0.16;
    grassMaterial.color.set(0xffffff);
    grassMaterial.needsUpdate = true;

    console.log("Grass loaded");
  } catch (error) {
    console.error("Grass error:", error);
  }
}

/* =========================================================
   SIDEWALKS
========================================================= */

const concreteMaterial =
  new THREE.MeshStandardMaterial({
    color: 0xb9b9b9,
    roughness: 0.97,
    metalness: 0
  });

function createSidewalk(x) {
  const sidewalk = new THREE.Mesh(
    new THREE.BoxGeometry(
      SIDEWALK_WIDTH,
      0.18,
      BASE_LENGTH - 5
    ),
    concreteMaterial
  );

  sidewalk.position.set(x, 0.09, 0);
  sidewalk.castShadow = true;
  sidewalk.receiveShadow = true;

  scene.add(sidewalk);
}

createSidewalk(SIDEWALK_LEFT_X);
createSidewalk(SIDEWALK_RIGHT_X);

async function loadConcrete() {
  try {
    const texture = await loadFirstTexture(FILES.concrete);

    prepareRepeatingTexture(texture, 1.4, 20);

    concreteMaterial.map = texture;
    concreteMaterial.bumpMap = createReliefTexture(texture);
    concreteMaterial.bumpScale = 0.055;
    concreteMaterial.color.set(0xffffff);
    concreteMaterial.needsUpdate = true;

    console.log("Concrete loaded");
  } catch (error) {
    console.error("Concrete error:", error);
  }
}

/* =========================================================
   STREET, CURBS AND WARM LANTERNS
========================================================= */

const roadMaterial = new THREE.MeshStandardMaterial({
  color: 0x252a2d,
  roughness: 0.86,
  metalness: 0.04
});

const road = new THREE.Mesh(
  new THREE.BoxGeometry(
    11.45,
    0.08,
    BASE_LENGTH - 2
  ),
  roadMaterial
);

road.position.set(0, 0.01, 0);
road.receiveShadow = true;
scene.add(road);

const curbMaterial = new THREE.MeshStandardMaterial({
  color: 0x8d9190,
  roughness: 0.84,
  metalness: 0.02
});

for (const x of [-5.82, 5.82]) {
  const curb = new THREE.Mesh(
    new THREE.BoxGeometry(
      0.26,
      0.22,
      BASE_LENGTH - 3
    ),
    curbMaterial
  );

  curb.position.set(x, 0.11, 0);
  curb.castShadow = true;
  curb.receiveShadow = true;
  scene.add(curb);
}

const markingMaterial = new THREE.MeshStandardMaterial({
  color: 0xc6b986,
  emissive: 0x4a3b17,
  emissiveIntensity: 0.12,
  roughness: 0.78
});

for (let z = -43; z <= 43; z += 9) {
  const marking = new THREE.Mesh(
    new THREE.BoxGeometry(0.14, 0.025, 4.2),
    markingMaterial
  );

  marking.position.set(0, 0.07, z);
  marking.receiveShadow = true;
  scene.add(marking);
}

const lampPoleMaterial = new THREE.MeshStandardMaterial({
  color: 0x22282b,
  roughness: 0.46,
  metalness: 0.72
});

const lampGlassMaterial = new THREE.MeshStandardMaterial({
  color: 0xffd89a,
  emissive: 0xffa63b,
  emissiveIntensity: 4.2,
  roughness: 0.18,
  metalness: 0.02
});

const lampPoolMaterial = new THREE.MeshBasicMaterial({
  color: 0xffc56c,
  transparent: true,
  opacity: 0.105,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
  side: THREE.DoubleSide
});

const streetLightBulbs = [];

function createStreetLight(side, z) {
  const group = new THREE.Group();
  const x = side * 6.55;

  const pole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.075, 0.11, 4.65, 10),
    lampPoleMaterial
  );

  pole.position.y = 2.42;
  pole.castShadow = true;
  pole.receiveShadow = true;
  group.add(pole);

  const arm = new THREE.Mesh(
    new THREE.CylinderGeometry(0.06, 0.06, 0.78, 10),
    lampPoleMaterial
  );

  arm.position.set(-side * 0.34, 4.7, 0);
  arm.rotation.z = Math.PI / 2;
  arm.castShadow = true;
  group.add(arm);

  const shade = new THREE.Mesh(
    new THREE.CylinderGeometry(0.22, 0.34, 0.2, 16),
    lampPoleMaterial
  );

  shade.position.set(-side * 0.72, 4.57, 0);
  shade.castShadow = true;
  group.add(shade);

  const bulb = new THREE.Mesh(
    new THREE.SphereGeometry(0.145, 16, 10),
    lampGlassMaterial
  );

  bulb.position.set(-side * 0.72, 4.43, 0);
  group.add(bulb);
  streetLightBulbs.push(bulb);

  const light = new THREE.PointLight(
    0xffb45c,
    isMobile ? 34 : 48,
    13,
    2
  );

  light.position.copy(bulb.position);
  group.add(light);

  const pool = new THREE.Mesh(
    new THREE.CircleGeometry(3.35, 32),
    lampPoolMaterial
  );

  pool.rotation.x = -Math.PI / 2;
  pool.position.set(-side * 0.42, 0.205, 0);
  group.add(pool);

  group.position.set(x, 0, z);
  scene.add(group);

  addColliderFromObject(pole);
}

const atmosphereGeometry = new THREE.BufferGeometry();
const atmospherePositions = [];

for (let index = 0; index < (isMobile ? 55 : 110); index++) {
  const onLeft = Math.random() < 0.5;
  const x = THREE.MathUtils.randFloat(7, 33) * (onLeft ? -1 : 1);

  atmospherePositions.push(
    x,
    THREE.MathUtils.randFloat(0.35, 3.4),
    THREE.MathUtils.randFloatSpread(BASE_LENGTH - 8)
  );
}

atmosphereGeometry.setAttribute(
  "position",
  new THREE.Float32BufferAttribute(atmospherePositions, 3)
);

const atmosphere = new THREE.Points(
  atmosphereGeometry,
  new THREE.PointsMaterial({
    color: 0xffd293,
    size: isMobile ? 0.035 : 0.045,
    transparent: true,
    opacity: 0.32,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true
  })
);

scene.add(atmosphere);

/* =========================================================
   COLLISION
========================================================= */

const staticColliders = [];

function addColliderFromObject(object) {
  object.updateMatrixWorld(true);

  const box = new THREE.Box3().setFromObject(
    object,
    true
  );

  const shrink = 0.45;

  if (box.max.x - box.min.x > shrink * 2) {
    box.min.x += shrink;
    box.max.x -= shrink;
  }

  if (box.max.z - box.min.z > shrink * 2) {
    box.min.z += shrink;
    box.max.z -= shrink;
  }

  staticColliders.push(box.clone());
}

function playerCollidesAt(x, z) {
  for (const box of staticColliders) {
    const closestX = THREE.MathUtils.clamp(
      x,
      box.min.x,
      box.max.x
    );

    const closestZ = THREE.MathUtils.clamp(
      z,
      box.min.z,
      box.max.z
    );

    const dx = x - closestX;
    const dz = z - closestZ;

    if (
      dx * dx + dz * dz <
      PLAYER_RADIUS * PLAYER_RADIUS
    ) {
      return true;
    }
  }

  return false;
}

for (const z of STREET_LIGHT_Z) {
  createStreetLight(-1, z);
  createStreetLight(1, z);
}

/* =========================================================
   MODEL HELPERS
========================================================= */

function enableShadows(
  object,
  material = null
) {
  object.traverse((child) => {
    if (!child.isMesh) {
      return;
    }

    if (material) {
      child.material = material;
    }

    child.castShadow = true;
    child.receiveShadow = true;
  });
}

function scaleHorizontal(
  object,
  targetSize
) {
  object.updateMatrixWorld(true);

  const box = new THREE.Box3().setFromObject(
    object,
    true
  );

  const size = new THREE.Vector3();
  box.getSize(size);

  const currentSize = Math.max(
    size.x,
    size.z
  );

  if (currentSize > 0) {
    object.scale.multiplyScalar(
      targetSize / currentSize
    );
  }

  object.updateMatrixWorld(true);
}

function centerAndGround(object) {
  object.updateMatrixWorld(true);

  const box = new THREE.Box3().setFromObject(
    object,
    true
  );

  const center = new THREE.Vector3();
  box.getCenter(center);

  object.position.x -= center.x;
  object.position.z -= center.z;
  object.position.y -= box.min.y;

  object.updateMatrixWorld(true);
}

/* =========================================================
   HOUSES
========================================================= */

const houseMaterial =
  new THREE.MeshStandardMaterial({
    color: 0xa69c8c,
    roughness: 0.76,
    metalness: 0.025,
    envMapIntensity: 0.48
  });

async function createHouses() {
  try {
    const loadedHouse =
      await new OBJLoader().loadAsync(FILES.house);

    enableShadows(loadedHouse, houseMaterial);
    scaleHorizontal(loadedHouse, 15);
    centerAndGround(loadedHouse);

    const template = new THREE.Group();
    template.add(loadedHouse);

    function placeHouse(x, z, rotationY) {
      const copy = template.clone(true);

      copy.position.set(x, 0, z);
      copy.rotation.y = rotationY;

      scene.add(copy);

      copy.updateMatrixWorld(true);
      addColliderFromObject(copy);
    }

    for (const z of HOUSE_Z_POSITIONS) {
      placeHouse(
        HOUSE_LEFT_X,
        z,
        HOUSE_LEFT_ROTATION
      );

      placeHouse(
        HOUSE_RIGHT_X,
        z,
        HOUSE_RIGHT_ROTATION
      );
    }

    console.log("Houses loaded");
  } catch (error) {
    console.error("House error:", error);
  }
}

/* =========================================================
   CORONA BOTTLE
========================================================= */

const bottleRoot = new THREE.Group();
camera.add(bottleRoot);

const bottleModelPivot = new THREE.Group();
bottleRoot.add(bottleModelPivot);

/*
  ЗВИЧАЙНЕ ПОЛОЖЕННЯ В РУЦІ

  Пляшка стоїть праворуч, нижче центру.
  Вона має виглядати як предмет у руці,
  а не як автомат.
*/

const bottleBasePosition = new THREE.Vector3(
  0.42,
  -0.58,
  -0.78
);

const bottleBaseEuler = new THREE.Euler(
  0.02,
  -0.10,
  0.08,
  "XYZ"
);

/*
  ПОЛОЖЕННЯ ПІД ЧАС ПИТТЯ

  Тут пляшка підіймається ближче до обличчя
  і нахиляється так, щоб пити через відкривачку.
*/

const bottleDrinkPosition = new THREE.Vector3(
  0.06,
  -0.10,
  -0.30
);

const bottleDrinkEuler = new THREE.Euler(
  1.08,
  -0.08,
  0.10,
  "XYZ"
);

const bottleBaseQuaternion =
  new THREE.Quaternion().setFromEuler(
    bottleBaseEuler
  );

const bottleDrinkQuaternion =
  new THREE.Quaternion().setFromEuler(
    bottleDrinkEuler
  );

bottleRoot.position.copy(bottleBasePosition);
bottleRoot.quaternion.copy(bottleBaseQuaternion);
bottleRoot.visible = false;

let bottleLoaded = false;

async function loadBottle() {
  try {
    let bottleMaterial =
      new THREE.MeshStandardMaterial({
        color: 0xd7a644,
        roughness: 0.38,
        metalness: 0.03,
        transparent: true,
        opacity: 0.96,
        side: THREE.DoubleSide
      });

    try {
      const texture =
        await textureLoader.loadAsync(
          FILES.bottleTexture
        );

      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy =
        renderer.capabilities.getMaxAnisotropy();

      bottleMaterial =
        new THREE.MeshStandardMaterial({
          map: texture,
          color: 0xffffff,
          roughness: 0.38,
          metalness: 0.03,
          transparent: true,
          opacity: 0.96,
          side: THREE.DoubleSide
        });
    } catch (error) {
      console.warn(
        "Bottle texture error:",
        error
      );
    }

    const bottle =
      await new OBJLoader().loadAsync(
        FILES.bottle
      );

    bottle.traverse((child) => {
      if (!child.isMesh) {
        return;
      }

      child.material = bottleMaterial;
      child.castShadow = false;
      child.receiveShadow = false;
    });

    /*
      Масштабуємо пляшку.
    */

    bottle.updateMatrixWorld(true);

    let box = new THREE.Box3().setFromObject(
      bottle,
      true
    );

    const size = new THREE.Vector3();
    box.getSize(size);

    const largestSide = Math.max(
      size.x,
      size.y,
      size.z
    );

    if (largestSide > 0) {
      bottle.scale.setScalar(
        0.58 / largestSide
      );
    }

    bottle.updateMatrixWorld(true);

    /*
      Центруємо пляшку в pivot.
    */

    box = new THREE.Box3().setFromObject(
      bottle,
      true
    );

    const center = new THREE.Vector3();
    box.getCenter(center);

    bottle.position.set(
      -center.x,
      -center.y,
      -center.z
    );

    /*
      ГОЛОВНИЙ ФІКС.

      Corona.obj у твоєму файлі лежить вздовж Z.
      Цей поворот ставить її вертикально.

      Якщо раптом після тесту відкривачка буде знизу,
      зміни Math.PI / 2 на -Math.PI / 2.
    */

    bottleModelPivot.rotation.set(
      Math.PI / 2,
      Math.PI,
      0,
      "XYZ"
    );

    bottleModelPivot.add(bottle);

    bottleRoot.position.copy(bottleBasePosition);
    bottleRoot.quaternion.copy(bottleBaseQuaternion);

    bottleRoot.visible = true;
    bottleLoaded = true;

    console.log("Corona bottle loaded");
  } catch (error) {
    console.error("Bottle error:", error);
  }
}

/* =========================================================
   AUDIO
========================================================= */

const footsteps = new Audio(FILES.footsteps);

footsteps.loop = true;
footsteps.volume = 0.22;
footsteps.playbackRate = 0.96;
footsteps.preload = "auto";

const drinkSoundTemplate = new Audio(FILES.drink);

drinkSoundTemplate.volume = 0.65;
drinkSoundTemplate.preload = "auto";

let audioUnlocked = false;

async function primeAudio(audio) {
  const oldVolume = audio.volume;

  audio.volume = 0;

  try {
    await audio.play();
    audio.pause();
    audio.currentTime = 0;
  } catch (error) {
    console.log("Audio waits for interaction");
  }

  audio.volume = oldVolume;
}

async function unlockAudio() {
  if (audioUnlocked) {
    return;
  }

  await Promise.allSettled([
    primeAudio(footsteps),
    primeAudio(drinkSoundTemplate)
  ]);

  audioUnlocked = true;
}

window.addEventListener(
  "pointerdown",
  unlockAudio,
  { once: true }
);

window.addEventListener(
  "keydown",
  unlockAudio,
  { once: true }
);

function playDrinkSound() {
  const sound =
    drinkSoundTemplate.cloneNode(true);

  sound.volume = 0.65;
  sound.currentTime = 0;

  sound.play().catch((error) => {
    console.warn("Drink sound error:", error);
  });
}

function updateFootsteps(speed) {
  if (speed > 0.35 && audioUnlocked) {
    footsteps.playbackRate =
      0.9 +
      Math.min(speed / WALK_SPEED, 1) * 0.12;

    if (footsteps.paused) {
      footsteps.play().catch(() => {});
    }
  } else if (!footsteps.paused) {
    footsteps.pause();
  }
}

/* =========================================================
   DRINK ANIMATION
========================================================= */

let drinking = false;
let drinkStart = 0;

const drinkTimers = [];

function smoothStep(value) {
  const x = THREE.MathUtils.clamp(
    value,
    0,
    1
  );

  return x * x * (3 - 2 * x);
}

function clearDrinkTimers() {
  while (drinkTimers.length > 0) {
    clearTimeout(drinkTimers.pop());
  }
}

function startDrinking() {
  if (drinking || !bottleLoaded) {
    return;
  }

  unlockAudio();

  drinking = true;
  drinkStart = performance.now() / 1000;

  clearDrinkTimers();

  for (let i = 0; i < 4; i++) {
    const timer =
      setTimeout(playDrinkSound, i * 1000);

    drinkTimers.push(timer);
  }
}

function updateDrinking() {
  if (!drinking) {
    return;
  }

  const now = performance.now() / 1000;
  const elapsed = now - drinkStart;

  let blend = 0;

  if (elapsed < 0.65) {
    blend = smoothStep(elapsed / 0.65);
  } else if (elapsed < 3.35) {
    blend = 1;
  } else if (elapsed < DRINK_DURATION) {
    blend =
      1 -
      smoothStep((elapsed - 3.35) / 0.65);
  } else {
    drinking = false;

    bottleRoot.position.copy(
      bottleBasePosition
    );

    bottleRoot.quaternion.copy(
      bottleBaseQuaternion
    );

    return;
  }

  bottleRoot.position.lerpVectors(
    bottleBasePosition,
    bottleDrinkPosition,
    blend
  );

  bottleRoot.quaternion.slerpQuaternions(
    bottleBaseQuaternion,
    bottleDrinkQuaternion,
    blend
  );

  if (elapsed >= 0.65 && elapsed < 3.35) {
    bottleRoot.position.y +=
      Math.sin(elapsed * 6) * 0.003;

    bottleRoot.position.x +=
      Math.sin(elapsed * 4) * 0.002;
  }
}

/* =========================================================
   DESKTOP INPUT
========================================================= */

const keys = new Set();

document.addEventListener("keydown", (event) => {
  keys.add(event.code);

  if (event.code === "KeyG" && !event.repeat) {
    toggleCinematicEffects();
  }
});

document.addEventListener("keyup", (event) => {
  keys.delete(event.code);
});

renderer.domElement.addEventListener("click", () => {
  if (isMobile) {
    return;
  }

  if (
    document.pointerLockElement !==
    renderer.domElement
  ) {
    renderer.domElement.requestPointerLock();
  }
});

document.addEventListener("mousemove", (event) => {
  if (isMobile) {
    return;
  }

  if (
    document.pointerLockElement !==
    renderer.domElement
  ) {
    return;
  }

  yaw -=
    event.movementX * MOUSE_SENSITIVITY;

  pitch -=
    event.movementY * MOUSE_SENSITIVITY;

  pitch = THREE.MathUtils.clamp(
    pitch,
    -Math.PI * 0.47,
    Math.PI * 0.47
  );
});

document.addEventListener("mousedown", (event) => {
  if (event.button !== 0 || isMobile) {
    return;
  }

  if (
    document.pointerLockElement ===
    renderer.domElement
  ) {
    startDrinking();
  }
});

/* =========================================================
   MOBILE JOYSTICK
========================================================= */

const joystickInput = new THREE.Vector2();
let joystickPointerId = null;

function updateJoystick(clientX, clientY) {
  if (!joystick || !joystickStick) {
    return;
  }

  const rect =
    joystick.getBoundingClientRect();

  const centerX =
    rect.left + rect.width / 2;

  const centerY =
    rect.top + rect.height / 2;

  let dx = clientX - centerX;
  let dy = clientY - centerY;

  const maxDistance = 38;
  const distance = Math.hypot(dx, dy);

  if (distance > maxDistance) {
    dx =
      (dx / distance) * maxDistance;

    dy =
      (dy / distance) * maxDistance;
  }

  joystickStick.style.transform =
    `translate(${dx}px, ${dy}px)`;

  joystickInput.x = dx / maxDistance;
  joystickInput.y = -dy / maxDistance;

  const deadZone = 0.08;

  if (Math.abs(joystickInput.x) < deadZone) {
    joystickInput.x = 0;
  }

  if (Math.abs(joystickInput.y) < deadZone) {
    joystickInput.y = 0;
  }
}

function resetJoystick() {
  joystickPointerId = null;
  joystickInput.set(0, 0);

  if (joystickStick) {
    joystickStick.style.transform =
      "translate(0, 0)";
  }
}

joystick?.addEventListener("pointerdown", (event) => {
  if (joystickPointerId !== null) {
    return;
  }

  event.preventDefault();

  joystickPointerId = event.pointerId;
  joystick.setPointerCapture(event.pointerId);

  updateJoystick(
    event.clientX,
    event.clientY
  );
});

joystick?.addEventListener("pointermove", (event) => {
  if (
    event.pointerId !== joystickPointerId
  ) {
    return;
  }

  event.preventDefault();

  updateJoystick(
    event.clientX,
    event.clientY
  );
});

joystick?.addEventListener("pointerup", (event) => {
  if (
    event.pointerId === joystickPointerId
  ) {
    resetJoystick();
  }
});

joystick?.addEventListener(
  "pointercancel",
  resetJoystick
);

/* =========================================================
   MOBILE CAMERA
========================================================= */

let lookPointerId = null;
let previousLookX = 0;
let previousLookY = 0;

function stopLooking() {
  lookPointerId = null;
}

lookZone?.addEventListener("pointerdown", (event) => {
  if (lookPointerId !== null) {
    return;
  }

  event.preventDefault();

  lookPointerId = event.pointerId;
  previousLookX = event.clientX;
  previousLookY = event.clientY;

  lookZone.setPointerCapture(event.pointerId);
});

lookZone?.addEventListener("pointermove", (event) => {
  if (
    event.pointerId !== lookPointerId
  ) {
    return;
  }

  event.preventDefault();

  const dx =
    event.clientX - previousLookX;

  const dy =
    event.clientY - previousLookY;

  previousLookX = event.clientX;
  previousLookY = event.clientY;

  yaw -= dx * TOUCH_SENSITIVITY;
  pitch -= dy * TOUCH_SENSITIVITY;

  pitch = THREE.MathUtils.clamp(
    pitch,
    -Math.PI * 0.47,
    Math.PI * 0.47
  );
});

lookZone?.addEventListener("pointerup", (event) => {
  if (
    event.pointerId === lookPointerId
  ) {
    stopLooking();
  }
});

lookZone?.addEventListener(
  "pointercancel",
  stopLooking
);

drinkButton?.addEventListener("pointerdown", (event) => {
  event.preventDefault();
  event.stopPropagation();

  unlockAudio();
  startDrinking();
});

/* =========================================================
   MOVEMENT
========================================================= */

const velocity = new THREE.Vector3();
const targetVelocity = new THREE.Vector3();
const movementDirection = new THREE.Vector3();
const forward = new THREE.Vector3();
const right = new THREE.Vector3();

let currentMovementSpeed = 0;

function getMovementInput() {
  let inputX = joystickInput.x;
  let inputY = joystickInput.y;

  if (
    keys.has("KeyW") ||
    keys.has("ArrowUp")
  ) {
    inputY += 1;
  }

  if (
    keys.has("KeyS") ||
    keys.has("ArrowDown")
  ) {
    inputY -= 1;
  }

  if (
    keys.has("KeyD") ||
    keys.has("ArrowRight")
  ) {
    inputX += 1;
  }

  if (
    keys.has("KeyA") ||
    keys.has("ArrowLeft")
  ) {
    inputX -= 1;
  }

  const length =
    Math.hypot(inputX, inputY);

  if (length > 1) {
    inputX /= length;
    inputY /= length;
  }

  return {
    inputX,
    inputY
  };
}

function movePlayerWithCollision(movement) {
  const movementLength = Math.hypot(
    movement.x,
    movement.z
  );

  const steps = Math.max(
    1,
    Math.ceil(movementLength / 0.12)
  );

  const stepX = movement.x / steps;
  const stepZ = movement.z / steps;

  const limitX =
    BASE_WIDTH / 2 - PLAYER_RADIUS;

  const limitZ =
    BASE_LENGTH / 2 - PLAYER_RADIUS;

  for (let index = 0; index < steps; index++) {
    const nextX =
      THREE.MathUtils.clamp(
        player.position.x + stepX,
        -limitX,
        limitX
      );

    if (
      !playerCollidesAt(
        nextX,
        player.position.z
      )
    ) {
      player.position.x = nextX;
    } else {
      velocity.x = 0;
    }

    const nextZ =
      THREE.MathUtils.clamp(
        player.position.z + stepZ,
        -limitZ,
        limitZ
      );

    if (
      !playerCollidesAt(
        player.position.x,
        nextZ
      )
    ) {
      player.position.z = nextZ;
    } else {
      velocity.z = 0;
    }
  }

  player.position.y = 0;
}

function updateMovement(deltaTime) {
  const {
    inputX,
    inputY
  } = getMovementInput();

  forward.set(
    -Math.sin(yaw),
    0,
    -Math.cos(yaw)
  );

  right.set(
    Math.cos(yaw),
    0,
    -Math.sin(yaw)
  );

  movementDirection.set(0, 0, 0);

  movementDirection.addScaledVector(
    forward,
    inputY
  );

  movementDirection.addScaledVector(
    right,
    inputX
  );

  if (movementDirection.lengthSq() > 1) {
    movementDirection.normalize();
  }

  const speedMultiplier =
    drinking ? 0.65 : 1;

  targetVelocity
    .copy(movementDirection)
    .multiplyScalar(
      WALK_SPEED * speedMultiplier
    );

  const hasInput =
    movementDirection.lengthSq() > 0.001;

  const smoothing =
    hasInput ? ACCELERATION : DECELERATION;

  const blend =
    1 - Math.exp(-smoothing * deltaTime);

  velocity.lerp(
    targetVelocity,
    blend
  );

  const previousPosition =
    player.position.clone();

  const movement =
    velocity
      .clone()
      .multiplyScalar(deltaTime);

  movePlayerWithCollision(movement);

  const movedDistance =
    player.position.distanceTo(
      previousPosition
    );

  currentMovementSpeed =
    deltaTime > 0
      ? movedDistance / deltaTime
      : 0;

  updateFootsteps(currentMovementSpeed);
}

/* =========================================================
   WALKING BOB
========================================================= */

let walkingTime = 0;

function updateWalkingBob(deltaTime) {
  const amount =
    THREE.MathUtils.clamp(
      currentMovementSpeed / WALK_SPEED,
      0,
      1
    );

  walkingTime +=
    deltaTime *
    currentMovementSpeed *
    2.1;

  const targetY =
    PLAYER_HEIGHT +
    Math.sin(walkingTime * 2) *
      0.025 *
      amount;

  const targetX =
    Math.cos(walkingTime) *
    0.014 *
    amount;

  const blend =
    1 - Math.exp(-12 * deltaTime);

  eyePivot.position.y =
    THREE.MathUtils.lerp(
      eyePivot.position.y,
      targetY,
      blend
    );

  eyePivot.position.x =
    THREE.MathUtils.lerp(
      eyePivot.position.x,
      targetX,
      blend
    );
}

/* =========================================================
   SAFE LOADING
========================================================= */

async function safeLoad(name, task) {
  try {
    await task();
    console.log(`${name}: loaded`);
  } catch (error) {
    console.error(`${name}: failed`, error);
  }
}

function loadWorld() {
  setLoadingText("Завантаження SoftStreet…");

  safeLoad("Sky", loadSky);
  safeLoad("Grass", loadGrass);
  safeLoad("Concrete", loadConcrete);
  safeLoad("Houses", createHouses);
  safeLoad("Bottle", loadBottle);

  setTimeout(hideLoadingScreen, 1200);
}

loadWorld();

setTimeout(hideLoadingScreen, 3000);

/* =========================================================
   LOOP
========================================================= */

const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);

  const deltaTime = Math.min(
    clock.getDelta(),
    0.033
  );

  const elapsedTime = clock.elapsedTime;

  player.rotation.y = yaw;
  eyePivot.rotation.x = pitch;

  updateMovement(deltaTime);
  updateWalkingBob(deltaTime);
  updateDrinking();

  atmosphere.rotation.y += deltaTime * 0.0025;
  atmosphere.position.y =
    Math.sin(elapsedTime * 0.28) * 0.025;

  lampGlassMaterial.emissiveIntensity =
    4.15 + Math.sin(elapsedTime * 1.7) * 0.12;

  cinematicPass.uniforms.uTime.value = elapsedTime;

  composer.render(deltaTime);
}

animate();

/* =========================================================
   RESIZE
========================================================= */

window.addEventListener("resize", () => {
  camera.aspect =
    window.innerWidth / window.innerHeight;

  camera.updateProjectionMatrix();

  renderer.setSize(
    window.innerWidth,
    window.innerHeight
  );

  updatePostProcessingSize();
});

/*
  Service worker поки не реєструємо.
*/
