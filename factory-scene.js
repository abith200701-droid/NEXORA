import * as THREE from "/node_modules/three/build/three.module.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

const canvas = document.querySelector("#factoryCanvas");
const stage = document.querySelector("#sceneStage");
if (!canvas || !stage) throw new Error("Factory scene mount is missing");

const scene = new THREE.Scene();
scene.background = null;
scene.fog = new THREE.FogExp2(0x08131c, 0.009);

const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 180);
const cameraFocus = new THREE.Vector3(0, 3.2, -1);
const cameraBase = new THREE.Vector3(23, 16, 30);
camera.position.copy(cameraBase);
camera.lookAt(cameraFocus);

const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: window.innerWidth > 700, powerPreference: "high-performance" });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.28;
renderer.outputColorSpace = THREE.SRGBColorSpace;
const environmentGenerator = new THREE.PMREMGenerator(renderer);
scene.environment = environmentGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
environmentGenerator.dispose();

const world = new THREE.Group();
scene.add(world);
scene.add(new THREE.HemisphereLight(0xa6d8db, 0x11171c, 1.65));

const moonLight = new THREE.DirectionalLight(0x91d8e8, 2.8);
moonLight.position.set(-16, 24, 13);
moonLight.castShadow = true;
moonLight.shadow.mapSize.set(2048, 2048);
moonLight.shadow.camera.left = -34;
moonLight.shadow.camera.right = 34;
moonLight.shadow.camera.top = 30;
moonLight.shadow.camera.bottom = -30;
moonLight.shadow.bias = -0.00025;
scene.add(moonLight);

const warmKey = new THREE.DirectionalLight(0xffaa68, 1.25);
warmKey.position.set(15, 11, -8);
scene.add(warmKey);
const emeraldFill = new THREE.PointLight(0x19d6a0, 32, 42, 1.7);
emeraldFill.position.set(-8, 4, 8);
scene.add(emeraldFill);
const cyanFill = new THREE.PointLight(0x3abfe9, 25, 48, 1.8);
cyanFill.position.set(13, 7, -7);
scene.add(cyanFill);

function material(color, options = {}) {
    return new THREE.MeshStandardMaterial({ color, roughness: 0.72, metalness: 0.12, ...options });
}

const steel = material(0x37464d, { metalness: 0.78, roughness: 0.3 });
const darkSteel = material(0x1c2a30, { metalness: 0.72, roughness: 0.36 });
const panelSteel = material(0x526168, { metalness: 0.64, roughness: 0.42 });
const roofMaterial = material(0x29383d, { metalness: 0.43, roughness: 0.61 });
const solarMaterial = material(0x1c4d61, { metalness: 0.56, roughness: 0.24, emissive: 0x062130, emissiveIntensity: 0.32 });
const amber = new THREE.MeshStandardMaterial({ color: 0xffad68, emissive: 0xf36b27, emissiveIntensity: 2.5, roughness: 0.35 });
const windowGlass = new THREE.MeshStandardMaterial({ color: 0x80d8df, emissive: 0x1a8c9c, emissiveIntensity: 0.9, metalness: 0.24, roughness: 0.2 });
const pipeMetal = material(0x78888b, { metalness: 0.85, roughness: 0.23 });

function addBox(parent, size, position, mat, castShadow = true) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), mat);
    mesh.position.set(...position);
    mesh.castShadow = castShadow;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
}

function addCylinder(parent, radiusTop, radiusBottom, height, position, mat, radialSegments = 20) {
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radiusTop, radiusBottom, height, radialSegments), mat);
    mesh.position.set(...position);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
}

const ground = new THREE.Mesh(new THREE.PlaneGeometry(120, 105), material(0x172326, { roughness: 0.96 }));
ground.rotation.x = -Math.PI / 2;
ground.position.y = -0.08;
ground.receiveShadow = true;
world.add(ground);

const yard = new THREE.Mesh(new THREE.PlaneGeometry(48, 33), material(0x313b3d, { roughness: 0.94 }));
yard.rotation.x = -Math.PI / 2;
yard.position.set(0, -0.025, -2.8);
yard.receiveShadow = true;
world.add(yard);

function buildSolarArray(parent, x, z, columns, rows, roofY) {
    const array = new THREE.Group();
    array.position.set(x, roofY, z);
    array.rotation.x = -0.13;
    parent.add(array);
    const gap = 0.12;
    const panelWidth = 1.05;
    const panelDepth = 0.78;
    for (let row = 0; row < rows; row++) {
        for (let column = 0; column < columns; column++) {
            const px = column * (panelWidth + gap);
            const pz = row * (panelDepth + gap);
            addBox(array, [panelWidth, 0.055, panelDepth], [px, 0, pz], solarMaterial, false);
            for (let line = 1; line < 4; line++) {
                addBox(array, [0.012, 0.012, panelDepth - 0.08], [px - panelWidth / 2 + line * panelWidth / 4, 0.034, pz], steel, false);
            }
            addBox(array, [panelWidth - 0.07, 0.012, 0.012], [px, 0.035, pz], panelSteel, false);
        }
    }
    const centerX = ((columns - 1) * (panelWidth + gap)) / 2;
    const centerZ = ((rows - 1) * (panelDepth + gap)) / 2;
    array.position.x -= centerX;
    array.position.z -= centerZ;
    for (const dx of [-centerX - 0.37, centerX + 0.37]) {
        addBox(array, [0.1, 0.2, rows * (panelDepth + gap) + 0.1], [dx, -0.12, 0], steel, false);
    }
}

function buildFactory({ x, z, width, depth, height, color, panels = 5 }) {
    const building = new THREE.Group();
    building.position.set(x, 0, z);
    world.add(building);

    const walls = material(color, { metalness: 0.48, roughness: 0.68 });
    addBox(building, [width, height, depth], [0, height / 2, 0], walls);
    addBox(building, [width + 0.34, 0.24, depth + 0.34], [0, height + 0.12, 0], roofMaterial);

    const frontZ = depth / 2 + 0.025;
    for (let xPos = -width / 2 + 0.38; xPos < width / 2; xPos += 0.64) {
        addBox(building, [0.028, height - 0.25, 0.035], [xPos, height / 2, frontZ], panelSteel, false);
    }
    addBox(building, [width - 0.4, 0.11, 0.12], [0, 0.47, frontZ + 0.07], darkSteel);
    for (let door = -1; door <= 1; door++) {
        if (door === 0 && width < 9) continue;
        const doorWidth = width > 9 ? 1.7 : 1.35;
        const doorHeight = Math.min(2.45, height * 0.61);
        const dx = door * width * 0.28;
        addBox(building, [doorWidth, doorHeight, 0.07], [dx, doorHeight / 2 + 0.12, frontZ + 0.09], darkSteel);
        addBox(building, [doorWidth - 0.18, 0.11, 0.09], [dx, doorHeight + 0.1, frontZ + 0.14], amber, false);
        for (let slat = 1; slat < 7; slat++) {
            addBox(building, [doorWidth - 0.18, 0.018, 0.025], [dx, 0.17 + slat * (doorHeight - 0.1) / 7, frontZ + 0.15], panelSteel, false);
        }
        addBox(building, [0.12, 0.09, 0.05], [dx - doorWidth / 2 - 0.25, doorHeight - 0.12, frontZ + 0.12], amber, false);
    }

    for (let i = 0; i < 4; i++) {
        const window = addBox(building, [0.58, 0.24, 0.035], [-width / 2 + 1.1 + i * 1.02, height - 0.58, frontZ + 0.045], windowGlass, false);
        window.material = windowGlass;
    }
    for (const lampX of [-width * 0.37, 0, width * 0.37]) {
        addBox(building, [0.4, 0.06, 0.22], [lampX, height - 0.18, frontZ + 0.22], amber, false);
        const glow = new THREE.PointLight(0xffa464, 2.1, 6, 2);
        glow.position.set(x + lampX, height - 0.2, z + frontZ + 0.52);
        world.add(glow);
    }

    const ventCount = Math.max(2, Math.floor(width / 3));
    for (let i = 0; i < ventCount; i++) {
        const vx = -width / 2 + 1.4 + i * ((width - 2.8) / Math.max(1, ventCount - 1));
        addBox(building, [0.72, 0.19, 0.64], [vx, height + 0.34, -depth * 0.22], darkSteel);
        for (let fin = 0; fin < 4; fin++) addBox(building, [0.7, 0.025, 0.055], [vx, height + 0.39 + fin * 0.035, -depth * 0.22], panelSteel, false);
    }

    buildSolarArray(building, -width * 0.31, -depth * 0.27, panels, 2, height + 0.28);
    buildSolarArray(building, width * 0.22, depth * 0.15, Math.max(2, panels - 2), 2, height + 0.28);
    return building;
}

buildFactory({ x: -6.4, z: -5.1, width: 12.5, depth: 9.2, height: 4.7, color: 0x46585b, panels: 5 });
buildFactory({ x: 4.4, z: -7.3, width: 8.2, depth: 8.1, height: 6.15, color: 0x3b4e54, panels: 4 });
buildFactory({ x: 12.7, z: -3.9, width: 6.7, depth: 7.4, height: 3.6, color: 0x4c5858, panels: 3 });

function addPipe(points, radius = 0.14, mat = pipeMetal) {
    const curve = new THREE.CatmullRomCurve3(points.map(point => new THREE.Vector3(...point)));
    const pipe = new THREE.Mesh(new THREE.TubeGeometry(curve, 48, radius, 10, false), mat);
    pipe.castShadow = true;
    pipe.receiveShadow = true;
    world.add(pipe);
    return pipe;
}

addPipe([[-13, 1.1, 0.1], [-13, 4.6, 0.1], [-10.8, 4.6, 0.1], [-10.8, 5.5, -0.1]], 0.17);
addPipe([[0.8, 1.2, -3.05], [0.8, 5.8, -3.05], [2.6, 5.8, -3.05], [2.6, 6.35, -3.05]], 0.16);
addPipe([[8.2, 0.8, -0.25], [8.2, 3.1, -0.25], [10.7, 3.1, -0.25]], 0.12);

for (const [x, z, radius, height] of [[-12.4, -4.6, 1.05, 3.5], [8.3, -8.4, 0.85, 4.2]]) {
    const tank = addCylinder(world, radius, radius, height, [x, height / 2, z], material(0x45555a, { metalness: 0.64, roughness: 0.34 }), 32);
    tank.rotation.z = Math.PI / 2;
    addCylinder(world, 0.08, 0.08, 2.2, [x, height / 2, z + radius + 0.11], pipeMetal, 12);
}

const chimneyStarts = [];
function buildChimney(x, z, height, radius) {
    const chimney = new THREE.Group();
    chimney.position.set(x, 0, z);
    world.add(chimney);
    const shaft = addCylinder(chimney, radius * 0.73, radius, height, [0, height / 2, 0], steel, 32);
    shaft.material = material(0x49585d, { metalness: 0.83, roughness: 0.26 });
    addCylinder(chimney, radius * 1.12, radius * 1.12, 0.24, [0, height - 0.13, 0], darkSteel, 32);
    addCylinder(chimney, radius * 0.9, radius * 0.9, 0.06, [0, height - 0.02, 0], panelSteel, 32);
    for (const y of [height * 0.26, height * 0.53, height * 0.8]) {
        const band = addCylinder(chimney, radius * 1.015, radius * 1.015, 0.09, [0, y, 0], panelSteel, 32);
        band.material = material(0x718084, { metalness: 0.9, roughness: 0.24 });
    }
    for (let i = 0; i < 3; i++) {
        addBox(chimney, [0.09, height * 0.73, 0.09], [Math.cos(i * 2.094) * radius * 0.82, height * 0.48, Math.sin(i * 2.094) * radius * 0.82], darkSteel, false);
    }
    const warning = new THREE.PointLight(0xff6e43, 3.2, 8, 2);
    warning.position.set(x, height - 0.18, z);
    world.add(warning);
    chimneyStarts.push([x, height + 0.16, z]);
}

buildChimney(-10.5, -5.4, 10.2, 0.58);
buildChimney(0.6, -7.9, 12.4, 0.64);
buildChimney(10.2, -4.3, 8.5, 0.48);

function createSmoke() {
    const count = window.innerWidth < 700 ? 330 : 560;
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const phases = new Float32Array(count);
    const seeds = new Float32Array(count);
    for (let i = 0; i < count; i++) {
        const stack = chimneyStarts[i % chimneyStarts.length];
        positions[i * 3] = stack[0] + (Math.random() - 0.5) * 0.24;
        positions[i * 3 + 1] = stack[1] + Math.random() * 0.7;
        positions[i * 3 + 2] = stack[2] + (Math.random() - 0.5) * 0.24;
        sizes[i] = 9 + Math.random() * 17;
        phases[i] = Math.random();
        seeds[i] = Math.random() * 100;
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute("aPhase", new THREE.BufferAttribute(phases, 1));
    geometry.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));

    const smokeMaterial = new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.NormalBlending,
        uniforms: { uTime: { value: 0 }, uPixelRatio: { value: Math.min(window.devicePixelRatio || 1, 1.6) } },
        vertexShader: `
            uniform float uTime;
            uniform float uPixelRatio;
            attribute float aSize;
            attribute float aPhase;
            attribute float aSeed;
            varying float vAlpha;
            varying float vSeed;
            void main() {
                float progress = fract(aPhase + uTime * 0.072);
                vec3 drift = position;
                drift.x += sin(progress * 8.2 + aSeed) * (0.08 + progress * 0.72) + sin(progress * 23.0 + aSeed) * 0.08;
                drift.z += cos(progress * 6.4 + aSeed * 1.7) * (0.08 + progress * 0.58) + cos(progress * 19.0 + aSeed) * 0.07;
                drift.y += progress * (5.7 + mod(aSeed, 1.8));
                vec4 mvPosition = modelViewMatrix * vec4(drift, 1.0);
                gl_Position = projectionMatrix * mvPosition;
                gl_PointSize = aSize * (0.48 + progress * 2.2) * uPixelRatio * (300.0 / max(16.0, -mvPosition.z));
                gl_PointSize = min(gl_PointSize, 62.0);
                vAlpha = smoothstep(0.0, 0.12, progress) * (1.0 - smoothstep(0.72, 1.0, progress));
                vSeed = aSeed;
            }
        `,
        fragmentShader: `
            precision highp float;
            varying float vAlpha;
            varying float vSeed;
            float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7)) + vSeed) * 43758.5453); }
            float noise(vec2 p) {
                vec2 i = floor(p);
                vec2 f = fract(p);
                f = f * f * (3.0 - 2.0 * f);
                return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
            }
            void main() {
                vec2 uv = gl_PointCoord - 0.5;
                float n = noise(uv * 8.0 + vec2(vSeed, vSeed * 0.37));
                float n2 = noise(uv * 15.0 - vec2(vSeed * 0.16, vSeed));
                float radius = length(uv + (n - 0.5) * 0.13);
                float billow = 1.0 - smoothstep(0.18 + n * 0.12, 0.49, radius);
                float density = billow * (0.52 + n2 * 0.48) * vAlpha;
                vec3 smoke = mix(vec3(0.24, 0.37, 0.39), vec3(0.61, 0.71, 0.69), n);
                gl_FragColor = vec4(smoke, density * 0.25);
                #include <tonemapping_fragment>
                #include <colorspace_fragment>
            }
        `,
    });
    const smoke = new THREE.Points(geometry, smokeMaterial);
    smoke.frustumCulled = false;
    scene.add(smoke);
    return smokeMaterial;
}

const smokeMaterial = createSmoke();

const roadCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-21, 0.015, 13), new THREE.Vector3(-20, 0.015, 19),
    new THREE.Vector3(-14, 0.015, 21), new THREE.Vector3(10, 0.015, 21),
    new THREE.Vector3(19, 0.015, 17), new THREE.Vector3(21, 0.015, 7),
    new THREE.Vector3(18, 0.015, -15), new THREE.Vector3(10, 0.015, -21),
    new THREE.Vector3(-12, 0.015, -21), new THREE.Vector3(-20, 0.015, -15),
], true, "centripetal");

function createRoad(curve, width) {
    const segments = 300;
    const vertices = [];
    const indices = [];
    for (let i = 0; i <= segments; i++) {
        const point = curve.getPointAt(i / segments);
        const tangent = curve.getTangentAt(i / segments).normalize();
        const side = new THREE.Vector3(-tangent.z, 0, tangent.x).multiplyScalar(width / 2);
        vertices.push(point.x - side.x, point.y, point.z - side.z, point.x + side.x, point.y, point.z + side.z);
        if (i < segments) {
            const offset = i * 2;
            indices.push(offset, offset + 1, offset + 2, offset + 1, offset + 3, offset + 2);
        }
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    const road = new THREE.Mesh(geometry, material(0x171e20, { roughness: 0.91 }));
    road.receiveShadow = true;
    world.add(road);

    const laneMaterial = new THREE.MeshStandardMaterial({ color: 0xb4a47d, emissive: 0x574524, emissiveIntensity: 0.28, roughness: 0.8 });
    for (let i = 0; i < 64; i++) {
        const t = i / 64;
        const point = curve.getPointAt(t);
        const tangent = curve.getTangentAt(t).normalize();
        const dash = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.018, 0.72), laneMaterial);
        dash.position.set(point.x, 0.035, point.z);
        dash.rotation.y = Math.atan2(tangent.x, tangent.z);
        world.add(dash);
    }
}
createRoad(roadCurve, 3.6);

function makeTruck() {
    const truck = new THREE.Group();
    const chassis = material(0x252c2e, { metalness: 0.52, roughness: 0.45 });
    const paint = material(0xbcc9c8, { metalness: 0.46, roughness: 0.26 });
    const greenPaint = material(0x55dba9, { metalness: 0.32, roughness: 0.32, emissive: 0x0a4735, emissiveIntensity: 0.35 });
    const glass = new THREE.MeshStandardMaterial({ color: 0x16343b, metalness: 0.48, roughness: 0.16, emissive: 0x071c22, emissiveIntensity: 0.4 });
    addBox(truck, [2.15, 0.34, 4.75], [0, 0.7, 0], chassis);
    addBox(truck, [2.08, 2.18, 3.05], [0, 2.02, -0.6], paint);
    addBox(truck, [2.1, 0.1, 2.92], [0, 3.12, -0.6], greenPaint, false);
    addBox(truck, [1.82, 0.06, 2.83], [0, 0.93, -0.6], greenPaint, false);
    addBox(truck, [1.94, 1.5, 1.42], [0, 1.65, 1.58], paint);
    addBox(truck, [1.7, 0.82, 0.07], [0, 2.08, 2.31], glass, false);
    addBox(truck, [2.12, 0.2, 0.16], [0, 1.04, 2.38], steel);
    addBox(truck, [2.06, 0.22, 0.13], [0, 1.34, 2.38], darkSteel);
    for (let i = 0; i < 5; i++) addBox(truck, [0.07, 0.15, 0.035], [-0.42 + i * 0.21, 1.34, 2.46], panelSteel, false);
    for (const side of [-1, 1]) {
        addBox(truck, [0.24, 0.16, 0.42], [side * 1.05, 1.8, 2.0], paint, false);
        addBox(truck, [0.11, 0.34, 0.13], [side * 1.13, 2.18, 1.64], darkSteel, false);
        for (const z of [-1.96, 1.72]) {
            const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.49, 0.49, 0.27, 24), material(0x101416, { roughness: 0.88 }));
            wheel.rotation.z = Math.PI / 2;
            wheel.position.set(side * 1.03, 0.51, z);
            wheel.castShadow = true;
            truck.add(wheel);
            const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.29, 20), material(0x97a5a5, { metalness: 0.86, roughness: 0.26 }));
            hub.rotation.z = Math.PI / 2;
            hub.position.set(side * 1.04, 0.51, z);
            truck.add(hub);
        }
    }
    const headlamp = new THREE.PointLight(0x9ce8d0, 3.4, 8, 2);
    headlamp.position.set(0, 1.55, 2.55);
    truck.add(headlamp);
    return truck;
}

const truck = makeTruck();
world.add(truck);

function addTree(x, z, scale = 1, type = 0) {
    const tree = new THREE.Group();
    tree.position.set(x, 0, z);
    tree.scale.setScalar(scale);
    world.add(tree);
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.2, 1.9, 8), material(0x3c3930, { roughness: 0.95 }));
    trunk.position.y = 0.92;
    trunk.castShadow = true;
    tree.add(trunk);
    const foliage = [0x254d40, 0x2d5b47, 0x315641, 0x496b4c];
    if (type === 0) {
        for (let i = 0; i < 4; i++) {
            const crown = new THREE.Mesh(new THREE.IcosahedronGeometry(0.92 - i * 0.08, 1), material(foliage[(i + Math.floor(x * 2)) % foliage.length], { roughness: 0.88 }));
            crown.position.set(Math.sin(i * 5) * 0.27, 1.8 + (i % 2) * 0.48, Math.cos(i * 3) * 0.25);
            crown.scale.set(1 + (i % 2) * 0.2, 0.88 + (i % 3) * 0.12, 0.95);
            crown.castShadow = true;
            tree.add(crown);
        }
    } else {
        for (let i = 0; i < 3; i++) {
            const tier = new THREE.Mesh(new THREE.ConeGeometry(0.96 - i * 0.2, 1.45, 9, 2), material(foliage[(i + 1) % foliage.length], { roughness: 0.9 }));
            tier.position.y = 1.35 + i * 0.72;
            tier.castShadow = true;
            tree.add(tier);
        }
    }
}

[
    [-24, 5, 1.4, 0], [-23, 11, 1.1, 1], [-24, -4, 1.3, 0], [-21, -10, 1.05, 1],
    [24, 7, 1.4, 0], [25, 13, 1.1, 1], [24, -2, 1.25, 0], [22, -11, 1.15, 1],
    [-17, 1, 0.86, 0], [20, 1, 0.9, 0], [-16, 20, 0.8, 1], [16, 20, 0.85, 0],
].forEach(([x, z, scale, type]) => addTree(x, z, scale, type));

function buildTurbine(x, z, height, scale = 1) {
    const turbine = new THREE.Group();
    turbine.position.set(x, 0, z);
    turbine.scale.setScalar(scale);
    world.add(turbine);
    addCylinder(turbine, 0.22, 0.46, height, [0, height / 2, 0], material(0x64777b, { metalness: 0.64, roughness: 0.34 }), 18);
    const rotor = new THREE.Group();
    rotor.position.set(0, height + 0.13, 0.49);
    turbine.add(rotor);
    rotor.add(new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 12), material(0xd3dbd6, { metalness: 0.64, roughness: 0.25 })));
    for (let blade = 0; blade < 3; blade++) {
        const angle = blade * Math.PI * 2 / 3;
        const bladeMesh = new THREE.Mesh(new THREE.BoxGeometry(0.16, 3.3, 0.08), material(0xc5d1ce, { metalness: 0.5, roughness: 0.36 }));
        bladeMesh.position.set(Math.sin(angle) * 1.55, Math.cos(angle) * 1.55, 0);
        bladeMesh.rotation.z = -angle;
        bladeMesh.scale.x = 1 - Math.abs(Math.sin(angle)) * 0.25;
        bladeMesh.castShadow = true;
        rotor.add(bladeMesh);
    }
    return rotor;
}

const turbines = [buildTurbine(-17, -27, 9.2, 0.85), buildTurbine(-7, -31, 11.2), buildTurbine(6, -30, 10, 0.92), buildTurbine(17, -27, 8.8, 0.8)];

const earth = new THREE.Group();
earth.position.set(15.5, 11.3, -13.8);
scene.add(earth);
const earthMaterial = new THREE.MeshStandardMaterial({ color: 0x245b65, emissive: 0x0b3b4b, emissiveIntensity: 0.34, metalness: 0.26, roughness: 0.63 });
const earthMesh = new THREE.Mesh(new THREE.SphereGeometry(3.1, 48, 32), earthMaterial);
earth.add(earthMesh);
earth.add(new THREE.Mesh(new THREE.SphereGeometry(3.22, 48, 32), new THREE.MeshBasicMaterial({ color: 0x31c9d4, side: THREE.BackSide, transparent: true, opacity: 0.12 })));
const earthRing = new THREE.Mesh(new THREE.TorusGeometry(4.05, 0.018, 4, 128), new THREE.MeshBasicMaterial({ color: 0x63e7c5, transparent: true, opacity: 0.36 }));
earthRing.rotation.x = Math.PI / 2.65;
earth.add(earthRing);
new THREE.TextureLoader().load("https://threejs.org/examples/textures/planets/earth_atmos_2048.jpg", texture => {
    texture.colorSpace = THREE.SRGBColorSpace;
    earthMaterial.map = texture;
    earthMaterial.color.set(0x8ca9ad);
    earthMaterial.needsUpdate = true;
}, undefined, () => {});

const starsGeometry = new THREE.BufferGeometry();
const starPositions = new Float32Array(240 * 3);
for (let i = 0; i < 240; i++) {
    starPositions[i * 3] = (Math.random() - 0.5) * 100;
    starPositions[i * 3 + 1] = 12 + Math.random() * 35;
    starPositions[i * 3 + 2] = -30 - Math.random() * 45;
}
starsGeometry.setAttribute("position", new THREE.BufferAttribute(starPositions, 3));
scene.add(new THREE.Points(starsGeometry, new THREE.PointsMaterial({ color: 0x9fd8d1, size: 0.1, transparent: true, opacity: 0.36 })));

const zoomIn = document.querySelector("#zoomIn");
const zoomOut = document.querySelector("#zoomOut");
let zoom = 1;
zoomIn?.addEventListener("click", () => { zoom = Math.min(1.28, zoom + 0.08); });
zoomOut?.addEventListener("click", () => { zoom = Math.max(0.78, zoom - 0.08); });
let pointerX = 0;
let pointerY = 0;
let smoothX = 0;
let smoothY = 0;
stage.addEventListener("pointermove", event => {
    const rect = stage.getBoundingClientRect();
    pointerX = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
    pointerY = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
});
stage.addEventListener("pointerleave", () => { pointerX = 0; pointerY = 0; });
stage.addEventListener("wheel", event => {
    if (event.deltaY) zoom = THREE.MathUtils.clamp(zoom + (event.deltaY < 0 ? 0.025 : -0.025), 0.78, 1.28);
}, { passive: true });

function resize() {
    const width = stage.clientWidth;
    const height = stage.clientHeight;
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
}
const resizeObserver = new ResizeObserver(resize);
resizeObserver.observe(stage);
window.addEventListener("resize", resize, { passive: true });
resize();

const clock = new THREE.Clock();
let previousTime = 0;
const cameraOffset = new THREE.Vector3();
function animate() {
    requestAnimationFrame(animate);
    const elapsed = clock.getElapsedTime();
    const delta = Math.min(elapsed - previousTime, 0.05);
    previousTime = elapsed;
    smokeMaterial.uniforms.uTime.value = elapsed;
    truck.userData.progress = ((truck.userData.progress ?? 0.035) + delta * 0.007) % 1;
    const truckT = truck.userData.progress;
    const truckPosition = roadCurve.getPointAt(truckT);
    const truckDirection = roadCurve.getTangentAt(truckT).normalize();
    truck.position.set(truckPosition.x, 0.05, truckPosition.z);
    truck.rotation.y = Math.atan2(truckDirection.x, truckDirection.z);
    turbines.forEach((rotor, index) => { rotor.rotation.z = elapsed * (0.18 + index * 0.012); });
    earthMesh.rotation.y = elapsed * 0.045;
    earthRing.rotation.z = elapsed * 0.025;
    smoothX += (pointerX - smoothX) * 0.035;
    smoothY += (pointerY - smoothY) * 0.035;
    const orbitX = Math.sin(elapsed * 0.075) * 0.65;
    const orbitZ = Math.cos(elapsed * 0.075) * 0.35;
    cameraOffset.set((cameraBase.x + orbitX + smoothX * 2.2) / zoom, (cameraBase.y - smoothY * 1.05) / zoom, (cameraBase.z + orbitZ) / zoom);
    camera.position.lerp(cameraOffset, 0.035);
    camera.lookAt(cameraFocus.x + smoothX * 0.6, cameraFocus.y - smoothY * 0.35, cameraFocus.z);
    renderer.render(scene, camera);
}
animate();

window.addEventListener("pagehide", () => {
    resizeObserver.disconnect();
    renderer.dispose();
}, { once: true });
