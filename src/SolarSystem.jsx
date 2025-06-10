// File: src/SolarSystem.jsx
import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { TextureLoader } from 'three';
import './SolarSystem.css';

const texturePaths = {
  Mercury: '/textures/mercury.jpg',
  Venus: '/textures/venus.jpg',
  Earth: '/textures/earth.jpg',
  Mars: '/textures/mars.jpg',
  Jupiter: '/textures/jupiter.jpg',
  Saturn: '/textures/saturn.jpg',
  Uranus: '/textures/uranus.jpg',
  Neptune: '/textures/neptune.jpg',
  Sun: '/textures/sun.jpg'
};

const planetData = [
  { name: 'Mercury', size: 2, distance: 18, speed: 0.03 },
  { name: 'Venus', size: 2.5, distance: 24, speed: 0.02 },
  { name: 'Earth', size: 3, distance: 30, speed: 0.01 },
  { name: 'Mars', size: 2.7, distance: 36, speed: 0.016 },
  { name: 'Jupiter', size: 4.5, distance: 44, speed: 0.011 },
  { name: 'Saturn', size: 4.2, distance: 52, speed: 0.01 },
  { name: 'Uranus', size: 3.8, distance: 60, speed: 0.008 },
  { name: 'Neptune', size: 3.7, distance: 68, speed: 0.006 }
];

function SolarSystem() {
  const mountRef = useRef(null);
  const tooltipRef = useRef(null);
  const [planetSpeeds, setPlanetSpeeds] = useState(planetData.map(p => p.speed));
  const [theme, setTheme] = useState('dark');

  useEffect(() => {
    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(theme === 'dark' ? 0x000000 : 0xffffff);

    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 2000);
    camera.position.set(0, 50, 110);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.5;
    mountRef.current.appendChild(renderer.domElement);

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.4);
    directionalLight.position.set(0, 100, 100);
    scene.add(ambientLight);
    scene.add(directionalLight);

    const loader = new TextureLoader();

    // Stars
    const starGeometry = new THREE.BufferGeometry();
    const starCount = 3000;
    const starVertices = [];
    for (let i = 0; i < starCount; i++) {
      const x = (Math.random() - 0.5) * 3000;
      const y = (Math.random() - 0.5) * 3000;
      const z = (Math.random() - 0.5) * 3000;
      starVertices.push(x, y, z);
    }
    starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
    const starMaterial = new THREE.PointsMaterial({ color: 0xffffff });
    const starField = new THREE.Points(starGeometry, starMaterial);
    scene.add(starField);

    // Sun
    const sunTexture = loader.load(texturePaths['Sun']);
    const sunGeometry = new THREE.SphereGeometry(10, 32, 32);
    const sunMaterial = new THREE.MeshBasicMaterial({ map: sunTexture });
    const sun = new THREE.Mesh(sunGeometry, sunMaterial);
    scene.add(sun);

    const planets = planetData.map(p => {
      const texture = loader.load(texturePaths[p.name]);
      const material = new THREE.MeshStandardMaterial({ map: texture, emissive: 0x111111 });
      const mesh = new THREE.Mesh(new THREE.SphereGeometry(p.size, 32, 32), material);
      scene.add(mesh);

      // Orbit ring (thicker)
      const orbitGeo = new THREE.RingGeometry(p.distance - 1, p.distance + 1, 128);
      const orbitMat = new THREE.MeshBasicMaterial({ color: 0x888888, side: THREE.DoubleSide });
      const orbit = new THREE.Mesh(orbitGeo, orbitMat);
      orbit.rotation.x = Math.PI / 2;
      scene.add(orbit);

      // Saturn ring
      if (p.name === 'Saturn') {
        const ringGeo = new THREE.RingGeometry(p.size + 1, p.size + 2, 64);
        const ringMat = new THREE.MeshBasicMaterial({ color: 0xd2b48c, side: THREE.DoubleSide, transparent: true, opacity: 0.6 });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = Math.PI / 2;
        mesh.add(ring);
      }

      return { ...p, mesh, angle: Math.random() * Math.PI * 2 };
    });

    const animate = () => {
      planets.forEach((planet, i) => {
        planet.angle += planetSpeeds[i];
        const x = Math.cos(planet.angle) * planet.distance;
        const z = Math.sin(planet.angle) * planet.distance;
        planet.mesh.position.set(x, 0, z);
        planet.mesh.rotation.y += 0.01;
      });
      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    };
    animate();

    const handleMouseMove = (event) => {
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(planets.map(p => p.mesh));
      if (intersects.length > 0) {
        tooltipRef.current.style.display = 'block';
        tooltipRef.current.style.left = `${event.clientX + 10}px`;
        tooltipRef.current.style.top = `${event.clientY + 10}px`;
        const planetName = planets.find(p => p.mesh === intersects[0].object)?.name;
        tooltipRef.current.innerText = planetName;
      } else {
        tooltipRef.current.style.display = 'none';
      }
    };

    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
    };
  }, [planetSpeeds, theme]);

  const handleSpeedChange = (index, value) => {
    const newSpeeds = [...planetSpeeds];
    newSpeeds[index] = parseFloat(value);
    setPlanetSpeeds(newSpeeds);
  };

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  return (
    <div className={`solar-system-container ${theme}`}>
      <div ref={mountRef} className="three-canvas" />
      <div ref={tooltipRef} className="planet-tooltip" />
      <div className="control-panel">
        <button onClick={toggleTheme} className="theme-toggle">
          {theme === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode'}
        </button>
        <h2>🌌 Planet Speed Control</h2>
        {planetData.map((planet, i) => (
          <div key={planet.name} className="slider-group">
            <label>{planet.name}</label>
            <input
              type="range"
              min="0"
              max="0.1"
              step="0.001"
              value={planetSpeeds[i]}
              onChange={e => handleSpeedChange(i, e.target.value)}
            />
            <span>{planetSpeeds[i].toFixed(3)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default SolarSystem;
