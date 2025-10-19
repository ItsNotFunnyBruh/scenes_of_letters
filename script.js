import * as THREE from 'three';
import { CSS3DRenderer, CSS3DObject } from 'three/addons/renderers/CSS3DRenderer.js';
import { gsap } from "gsap";


const sizes = { width: window.innerWidth, height: window.innerHeight };
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100000); 

const scene = new THREE.Scene();
const renderer = new THREE.WebGLRenderer({ canvas: document.querySelector('canvas.webgl'), alpha: true });
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

const cssScene = new THREE.Scene();
const cssRenderer = new CSS3DRenderer();
cssRenderer.setSize(sizes.width, sizes.height);
document.getElementById('css-container').appendChild(cssRenderer.domElement);

const createParticleTexture = () => {
    const canvas = document.createElement('canvas'); canvas.width = 32; canvas.height = 32;
    const ctx = canvas.getContext('2d');
    const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    gradient.addColorStop(0.1, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = gradient; ctx.fillRect(0, 0, 32, 32);
    return new THREE.CanvasTexture(canvas);
};
const particleMaterial = new THREE.PointsMaterial({
    map: createParticleTexture(), size: 1.6, blending: THREE.AdditiveBlending,
    transparent: true, depthWrite: false
});
const particleGeometry = new THREE.BufferGeometry();
const particleCount = 100000; 
const positions = new Float32Array(particleCount * 3);
const velocities = new Float32Array(particleCount);
for (let i = 0; i < particleCount; i++) {
    positions[i * 3 + 0] = (Math.random() - 0.5) * 2500; // X
    positions[i * 3 + 1] = (Math.random() - 0.5) * 2000; // Y
    positions[i * 3 + 2] = (Math.random() - 0.5) * 5000; // Z 
    velocities[i] = Math.random() * 0.01 + 0.005;
}
particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
const particles = new THREE.Points(particleGeometry, particleMaterial);
scene.add(particles);


const sections = document.querySelectorAll('.section');
const cssObjects = [];
const objectPositions = [
    { pos: [0, 0, 0], rot: [0, 0, 0] },
    { pos: [-800, 200, -2000], rot: [0, 65, 0] },
    { pos: [900, -300, -4500], rot: [20, -50, 15] },
    { pos: [-50, 400, -6500], rot: [-30, 0, -10] },
    { pos: [0, 0, -8000], rot: [0, 0, 0] }
];

sections.forEach((section, index) => {
    const object = new CSS3DObject(section);
    const pos = objectPositions[index].pos;
    const rot = objectPositions[index].rot;
    object.position.set(pos[0], pos[1], pos[2]);
    object.rotation.set(
        THREE.MathUtils.degToRad(rot[0]),
        THREE.MathUtils.degToRad(rot[1]),
        THREE.MathUtils.degToRad(rot[2])
    );
    cssObjects.push(object);
    cssScene.add(object);
});

let currentSectionIndex = 0;
let isAnimating = false;
const CAMERA_DISTANCE = 550; 

const scrollToSection = (index) => {
    if (isAnimating || index < 0 || index >= sections.length) return;
    isAnimating = true;
    currentSectionIndex = index;

    sections.forEach((s, i) => s.classList.toggle('visible', i === index));

    const targetObject = cssObjects[index];
    
    const targetPosition = new THREE.Vector3();
    targetObject.getWorldPosition(targetPosition);
    
    const offset = new THREE.Vector3(0, 0, CAMERA_DISTANCE);
    offset.applyQuaternion(targetObject.quaternion);
    
    const cameraEndPosition = targetPosition.clone().add(offset);

    const tempCamera = camera.clone();
    tempCamera.position.copy(cameraEndPosition);
    tempCamera.lookAt(targetPosition);
    const cameraEndQuaternion = tempCamera.quaternion;

    const flightDuration = 4.0;

    gsap.to(camera.position, {
        ...cameraEndPosition,
        duration: flightDuration,
        ease: 'power3.inOut'
    });
    
    gsap.to(camera.quaternion, {
        _x: cameraEndQuaternion.x, _y: cameraEndQuaternion.y,
        _z: cameraEndQuaternion.z, _w: cameraEndQuaternion.w,
        duration: flightDuration, ease: 'power3.inOut',
        onComplete: () => { isAnimating = false; }
    });
};
scrollToSection(0);
setTimeout(() => { isAnimating = false; }, 4500);

window.addEventListener('wheel', (event) => {
    if (isAnimating) return;
    if (event.deltaY > 0 && currentSectionIndex < sections.length - 1) {
        scrollToSection(currentSectionIndex + 1);
    } else if (event.deltaY < 0 && currentSectionIndex > 0) {
        scrollToSection(currentSectionIndex - 1);
    }
});

const tick = () => {
    const particlePositions = particles.geometry.attributes.position.array;
    for (let i = 0; i < particleCount; i++) {
        particlePositions[i * 3 + 1] -= velocities[i];
        if (particlePositions[i * 3 + 1] < -300) particlePositions[i * 3 + 1] = 300;
    }
    particles.geometry.attributes.position.needsUpdate = true;
    
    particles.position.copy(camera.position);
    
    renderer.render(scene, camera);
    cssRenderer.render(cssScene, camera);
    
    window.requestAnimationFrame(tick);
};
tick();

window.addEventListener('resize', () => {
    sizes.width = window.innerWidth;
    sizes.height = window.innerHeight;
    camera.aspect = sizes.width / sizes.height;
    camera.updateProjectionMatrix();
    renderer.setSize(sizes.width, sizes.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    cssRenderer.setSize(sizes.width, sizes.height);
});