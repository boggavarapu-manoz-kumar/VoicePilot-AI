import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface VoiceSphereProps {
  className?: string;
  isLive?: boolean;
}

export const VoiceSphere: React.FC<VoiceSphereProps> = ({ className = '', isLive = true }) => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const currentMount = mountRef.current;
    if (!currentMount) return;

    const width = currentMount.clientWidth || 320;
    const height = currentMount.clientHeight || 240;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.z = 4.8;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    currentMount.appendChild(renderer.domElement);

    // 2. Wireframe / Particle Mesh Sphere
    const geometry = new THREE.IcosahedronGeometry(1.6, 12);
    
    // Save original vertex positions for audio wave displacement
    const originalPositions = geometry.attributes.position.clone();

    // Material with custom gradient depth feel
    const material = new THREE.MeshStandardMaterial({
      color: 0x3b82f6,
      wireframe: true,
      roughness: 0.2,
      metalness: 0.8,
      emissive: 0x1d4ed8,
      emissiveIntensity: 0.4,
      transparent: true,
      opacity: 0.85,
    });

    const sphere = new THREE.Mesh(geometry, material);
    scene.add(sphere);

    // Outer particle ring for celestial audio aura
    const particlesCount = 350;
    const particlePositions = new Float32Array(particlesCount * 3);
    for (let i = 0; i < particlesCount * 3; i += 3) {
      const radius = 2.1 + Math.random() * 0.7;
      const theta = Math.random() * Math.PI * 2;
      const phi = (Math.random() - 0.5) * Math.PI;
      particlePositions[i] = radius * Math.cos(phi) * Math.cos(theta);
      particlePositions[i + 1] = radius * Math.sin(phi);
      particlePositions[i + 2] = radius * Math.cos(phi) * Math.sin(theta);
    }
    const particlesGeometry = new THREE.BufferGeometry();
    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    const particlesMaterial = new THREE.PointsMaterial({
      size: 0.025,
      color: 0x60a5fa,
      transparent: true,
      opacity: 0.6,
    });
    const particles = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particles);

    // 3. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0x38bdf8, 3, 50);
    pointLight.position.set(5, 5, 5);
    scene.add(pointLight);

    const purpleLight = new THREE.PointLight(0x818cf8, 2, 50);
    purpleLight.position.set(-5, -3, 3);
    scene.add(purpleLight);

    // 4. Animation loop with organic voice pulsing
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Slow elegant orbital rotation
      sphere.rotation.y = elapsedTime * 0.35;
      sphere.rotation.x = Math.sin(elapsedTime * 0.2) * 0.25;
      particles.rotation.y = -elapsedTime * 0.15;

      // Realistic audio frequency wave simulation
      const positionAttribute = geometry.attributes.position;
      const origPos = originalPositions.array as Float32Array;
      const pos = positionAttribute.array as Float32Array;

      const intensity = isLive ? 0.14 : 0.04;
      const freq = isLive ? 3.5 : 1.5;

      for (let i = 0; i < positionAttribute.count; i++) {
        const i3 = i * 3;
        const ox = origPos[i3];
        const oy = origPos[i3 + 1];
        const oz = origPos[i3 + 2];

        // Harmonic sine wave displacement simulating acoustic vibration
        const wave = Math.sin(ox * freq + elapsedTime * 2.8) *
                     Math.cos(oy * freq + elapsedTime * 2.2) *
                     Math.sin(oz * freq + elapsedTime * 2.5);

        const scale = 1 + wave * intensity;
        pos[i3] = ox * scale;
        pos[i3 + 1] = oy * scale;
        pos[i3 + 2] = oz * scale;
      }
      positionAttribute.needsUpdate = true;

      renderer.render(scene, camera);
    };

    animate();

    // 5. Responsive Resize
    const handleResize = () => {
      if (!currentMount) return;
      const w = currentMount.clientWidth;
      const h = currentMount.clientHeight;
      if (w && h) {
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      if (currentMount && renderer.domElement) {
        currentMount.removeChild(renderer.domElement);
      }
      geometry.dispose();
      material.dispose();
      particlesGeometry.dispose();
      particlesMaterial.dispose();
      renderer.dispose();
    };
  }, [isLive]);

  return (
    <div className={`relative flex items-center justify-center overflow-hidden ${className}`}>
      <div ref={mountRef} className="w-full h-full min-h-[260px] flex items-center justify-center cursor-grab active:cursor-grabbing" />
      <div className="absolute bottom-3 left-4 flex items-center gap-2 bg-slate-900/80 backdrop-blur-md px-3 py-1 rounded-full border border-slate-700/60 shadow-lg text-xs">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
        <span className="text-slate-200 font-medium">Neural Acoustic Engine (Three.js 3D)</span>
      </div>
    </div>
  );
};
