import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

// A function to create a procedurally generated plant
const createPlant = (historyItem) => {
    const { phq9_score, gad7_score } = historyItem;
    const plant = new THREE.Group();

    // Stem
    const stemHeight = 2 + (10 - phq9_score) / 5; // Taller stem for lower depression
    const stemGeometry = new THREE.CylinderGeometry(0.1, 0.15, stemHeight, 8);
    const stemMaterial = new THREE.MeshStandardMaterial({ color: 0x66bb6a }); // Green stem
    const stem = new THREE.Mesh(stemGeometry, stemMaterial);
    stem.position.y = stemHeight / 2;
    plant.add(stem);

    // Flower
    const flowerSize = 0.5 + (10 - gad7_score) / 10; // Larger flower for lower anxiety
    const flowerColor = new THREE.Color().setHSL(gad7_score / 21, 0.8, 0.6);
    const flowerGeometry = new THREE.IcosahedronGeometry(flowerSize, 0);
    const flowerMaterial = new THREE.MeshStandardMaterial({ color: flowerColor, emissive: flowerColor, emissiveIntensity: 0.3 });
    const flower = new THREE.Mesh(flowerGeometry, flowerMaterial);
    flower.position.y = stemHeight + flowerSize / 2;
    plant.add(flower);

    // Leaves
    const leafCount = Math.max(1, 5 - Math.floor(phq9_score / 5));
    for (let i = 0; i < leafCount; i++) {
        const leafGeometry = new THREE.SphereGeometry(0.4, 8, 8);
        const leafMaterial = new THREE.MeshStandardMaterial({ color: 0x4caf50 });
        const leaf = new THREE.Mesh(leafGeometry, leafMaterial);
        const angle = (i / leafCount) * Math.PI * 2;
        leaf.position.set(Math.cos(angle) * 0.5, i * 0.8 + 1, Math.sin(angle) * 0.5);
        leaf.scale.y = 0.2;
        plant.add(leaf);
    }

    return plant;
};

const MindfulnessGarden = ({ history }) => {
    const mountRef = useRef(null);

    useEffect(() => {
        const currentMount = mountRef.current;
        let animationFrameId;

        // Scene
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0xe0f7fa); // Light blue background
        scene.fog = new THREE.Fog(0xe0f7fa, 10, 50);

        // Camera
        const camera = new THREE.PerspectiveCamera(75, currentMount.clientWidth / currentMount.clientHeight, 0.1, 1000);
        camera.position.set(0, 5, 15);
        camera.lookAt(0, 0, 0);

        // Renderer
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.shadowMap.enabled = true;
        currentMount.appendChild(renderer.domElement);

        // Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
        scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(10, 15, 5);
        directionalLight.castShadow = true;
        scene.add(directionalLight);

        // Ground
        const groundGeometry = new THREE.PlaneGeometry(100, 100);
        const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x8d6e63 });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        scene.add(ground);

        // Add plants to the scene
        history.forEach((item, index) => {
            const plant = createPlant(item);
            const x = (index % 5 - 2) * 4; // Arrange in a grid
            const z = (Math.floor(index / 5) - 2) * 4;
            plant.position.set(x, 0, z);
            scene.add(plant);
        });

        // Animation loop
        const animate = () => {
            animationFrameId = requestAnimationFrame(animate);
            renderer.render(scene, camera);
        };
        animate();

        // Handle Resize
        const onResize = () => {
            camera.aspect = currentMount.clientWidth / currentMount.clientHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
        };
        window.addEventListener('resize', onResize);

        // Cleanup
        return () => {
            window.removeEventListener('resize', onResize);
            cancelAnimationFrame(animationFrameId);
            if (renderer.domElement && currentMount.contains(renderer.domElement)) {
                currentMount.removeChild(renderer.domElement);
            }
        };
    }, [history]);

    return <div ref={mountRef} style={{ width: '100%', height: '400px' }} />;
};

export default MindfulnessGarden;
