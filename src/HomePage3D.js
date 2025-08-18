import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

// --- Icon Imports ---


import { motion } from 'framer-motion';

// --- Icon Imports ---
const User = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
);
const CheckCircle = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
);
const Shield = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
);

// --- Helper to create text sprites ---
function makeTextSprite(message, opts) {
    const parameters = opts || {};
    const fontface = parameters.fontface || 'Arial';
    const fontsize = parameters.fontsize || 18;
    const borderThickness = parameters.borderThickness || 4;
    const borderColor = parameters.borderColor || { r: 0, g: 0, b: 0, a: 1.0 };
    const backgroundColor = parameters.backgroundColor || { r: 255, g: 255, b: 255, a: 1.0 };
    const textColor = parameters.textColor || { r: 0, g: 0, b: 0, a: 1.0 };

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    context.font = `Bold ${fontsize}px ${fontface}`;

    const metrics = context.measureText(message);
    const textWidth = metrics.width;

    context.fillStyle = `rgba(${backgroundColor.r}, ${backgroundColor.g}, ${backgroundColor.b}, ${backgroundColor.a})`;
    context.strokeStyle = `rgba(${borderColor.r}, ${borderColor.g}, ${borderColor.b}, ${borderColor.a})`;
    context.lineWidth = borderThickness;
    roundRect(context, borderThickness / 2, borderThickness / 2, textWidth + borderThickness, fontsize * 1.4 + borderThickness, 6);

    context.fillStyle = `rgba(${textColor.r}, ${textColor.g}, ${textColor.b}, 1.0)`;
    context.fillText(message, borderThickness, fontsize + borderThickness);

    const texture = new THREE.Texture(canvas);
    texture.needsUpdate = true;

    const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.scale.set(0.5 * fontsize, 0.25 * fontsize, 0.75 * fontsize);
    return sprite;
}

function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
}


export default function HomePage3D({ setPage }) {
    const mountRef = useRef(null);

    useEffect(() => {
        const currentMount = mountRef.current;
        let animationFrameId;

        // Scene setup
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, currentMount.clientWidth / currentMount.clientHeight, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        currentMount.appendChild(renderer.domElement);

        // Lighting
        const ambientLight = new THREE.AmbientLight(0x404040, 2);
        scene.add(ambientLight);
        const pointLight = new THREE.PointLight(0xffffff, 1.5);
        pointLight.position.set(10, 10, 10);
        scene.add(pointLight);

        // Constellation points
        const wellbeingConcepts = [
            { name: 'Clarity', position: new THREE.Vector3(-5, 3, -2) },
            { name: 'Focus', position: new THREE.Vector3(5, 2, -3) },
            { name: 'Calm', position: new THREE.Vector3(0, -4, 0) },
            { name: 'Resilience', position: new THREE.Vector3(3, 5, 2) },
            { name: 'Connection', position: new THREE.Vector3(-4, -2, 4) },
            { name: 'Growth', position: new THREE.Vector3(6, -1, -5) },
        ];

        const points = new THREE.Group();
        const labels = new THREE.Group();
        const pointGeometry = new THREE.SphereGeometry(0.2, 32, 32);

        wellbeingConcepts.forEach(concept => {
            const material = new THREE.MeshStandardMaterial({
                color: 0x29B6F6,
                metalness: 0.3,
                roughness: 0.4,
            });
            const point = new THREE.Mesh(pointGeometry, material);
            point.position.copy(concept.position);
            point.name = concept.name;
            points.add(point);

            const sprite = makeTextSprite(concept.name, { fontsize: 24, textColor: { r: 255, g: 255, b: 255 }, backgroundColor: { r: 20, g: 20, b: 20, a: 0.7 } });
            sprite.position.copy(concept.position).add(new THREE.Vector3(0, 0.5, 0));
            labels.add(sprite);
        });
        scene.add(points);
        scene.add(labels);

        // Lines connecting points
        const lineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.3 });
        const lines = new THREE.Group();
        for (let i = 0; i < points.children.length; i++) {
            for (let j = i + 1; j < points.children.length; j++) {
                const geometry = new THREE.BufferGeometry().setFromPoints([points.children[i].position, points.children[j].position]);
                const line = new THREE.Line(geometry, lineMaterial);
                lines.add(line);
            }
        }
        scene.add(lines);

        // Particle System
        const particleCount = 5000;
        const particles = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        for (let i = 0; i < particleCount * 3; i++) {
            positions[i] = (Math.random() - 0.5) * 30;
        }
        particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        const particleMaterial = new THREE.PointsMaterial({
            color: 0xaaaaaa,
            size: 0.02,
            transparent: true,
            opacity: 0.5
        });
        const particleSystem = new THREE.Points(particles, particleMaterial);
        scene.add(particleSystem);

        camera.position.z = 15;

        // Mouse interaction
        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2(-100, -100); // Initialize off-screen
        let intersected;

        const onMouseMove = (event) => {
            const rect = renderer.domElement.getBoundingClientRect();
            mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        };
        currentMount.addEventListener('mousemove', onMouseMove);

        // Animation loop
        const animate = () => {
            animationFrameId = requestAnimationFrame(animate);

            particleSystem.rotation.y += 0.0005;

            // Raycasting for hover effects
            raycaster.setFromCamera(mouse, camera);
            const intersects = raycaster.intersectObjects(points.children);

            if (intersects.length > 0) {
                if (intersected !== intersects[0].object) {
                    if (intersected) {
                        intersected.material.emissive.setHex(0x000000);
                        intersected.scale.set(1, 1, 1);
                    }
                    intersected = intersects[0].object;
                    intersected.material.emissive.setHex(0x00ff00);
                    intersected.scale.set(1.5, 1.5, 1.5);
                }
            } else {
                if (intersected) {
                    intersected.material.emissive.setHex(0x000000);
                    intersected.scale.set(1, 1, 1);
                }
                intersected = null;
            }

            // Make camera gently follow the mouse
            camera.position.x += (mouse.x * 5 - camera.position.x) * 0.02;
            camera.position.y += (mouse.y * 3 - camera.position.y) * 0.02;
            camera.lookAt(scene.position);

            renderer.render(scene, camera);
        };
        animate();

        // Handle window resize
        const onResize = () => {
            camera.aspect = currentMount.clientWidth / currentMount.clientHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
        };
        window.addEventListener('resize', onResize);

        // Cleanup
        return () => {
            window.removeEventListener('resize', onResize);
            currentMount.removeEventListener('mousemove', onMouseMove);
            cancelAnimationFrame(animationFrameId);
            if (renderer.domElement && currentMount.contains(renderer.domElement)) {
                currentMount.removeChild(renderer.domElement);
            }
        };
    }, []);

    return (
        <div className="relative h-screen w-screen overflow-hidden bg-gradient-to-br from-gray-900 via-blue-900 to-gray-800">
            <div ref={mountRef} className="absolute top-0 left-0 h-full w-full z-0 opacity-50"></div>
            <div className="absolute top-0 left-0 h-full w-full z-10 flex flex-col items-center justify-center text-center p-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="bg-white bg-opacity-10 backdrop-blur-lg p-8 rounded-2xl shadow-2xl max-w-4xl border border-white border-opacity-20"
                >
                    <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 tracking-tight">
                        Welcome to MindSerenity
                    </h1>
                    <p className="text-lg text-gray-300 mb-8 max-w-3xl mx-auto">
                        A confidential platform to help you understand and track your mental well-being through a combination of standard assessments and modern biometric analysis.
                    </p>
                    <div className="grid md:grid-cols-3 gap-6 my-10 text-left">
                        <div className="flex items-start p-4 bg-white bg-opacity-10 rounded-lg border border-white border-opacity-10">
                            <User className="w-8 h-8 text-cyan-400 mr-3 flex-shrink-0 mt-1" />
                            <div>
                                <h3 className="text-lg font-semibold text-white mb-1">Confidential & Anonymous</h3>
                                <p className="text-sm text-gray-400">Your personal data is private. Anonymized data is used for research.</p>
                            </div>
                        </div>
                        <div className="flex items-start p-4 bg-white bg-opacity-10 rounded-lg border border-white border-opacity-10">
                            <CheckCircle className="w-8 h-8 text-green-400 mr-3 flex-shrink-0 mt-1" />
                            <div>
                                <h3 className="text-lg font-semibold text-white mb-1">Evidence-Based</h3>
                                <p className="text-sm text-gray-400">Using clinically validated screening tools like PHQ-9 and GAD-7.</p>
                            </div>
                        </div>
                        <div className="flex items-start p-4 bg-white bg-opacity-10 rounded-lg border border-white border-opacity-10">
                            <Shield className="w-8 h-8 text-yellow-400 mr-3 flex-shrink-0 mt-1" />
                            <div>
                                <h3 className="text-lg font-semibold text-white mb-1">Secure & Private</h3>
                                <p className="text-sm text-gray-400">Biometric analysis is processed on your device and never stored.</p>
                            </div>
                        </div>
                    </div>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setPage('survey')}
                        className="bg-cyan-500 text-white font-bold py-3 px-12 rounded-lg text-lg hover:bg-cyan-600 transition-colors shadow-lg shadow-cyan-500/50"
                    >
                        Take the Assessment
                    </motion.button>
                </motion.div>
            </div>
        </div>
    );
}




