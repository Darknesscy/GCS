
import React, { useEffect, useRef, useMemo } from 'react';
import * as THREE from 'three';
import { CategoriesData, SelectedZoneInfo, Category } from '../types';

interface GlobeProps {
  categories: CategoriesData;
  activeCategories: Record<string, boolean>;
  onMarkerClick: (zoneInfo: SelectedZoneInfo) => void;
  rotating: boolean;
  intensityFilter: number;
  globeTarget: { lat: number; lon: number } | null;
}

const Globe: React.FC<GlobeProps> = ({ categories, activeCategories, onMarkerClick, rotating, intensityFilter, globeTarget }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const globeGroupRef = useRef<THREE.Group | null>(null);
  const markersRef = useRef<any[]>([]);

  useEffect(() => {
    if (!mountRef.current) return;
    const currentMount = mountRef.current;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, currentMount.clientWidth / currentMount.clientHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
    currentMount.appendChild(renderer.domElement);

    const globeGroup = new THREE.Group();
    globeGroupRef.current = globeGroup;
    scene.add(globeGroup);

    // Starfield
    const stars = new THREE.Points(
      new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(Array.from({length: 3000}, () => (Math.random()-0.5)*1000), 3)),
      new THREE.PointsMaterial({ color: 0x4488ff, size: 0.8, transparent: true, opacity: 0.5 })
    );
    scene.add(stars);

    // Globe
    const sphere = new THREE.Mesh(
      new THREE.SphereGeometry(5, 64, 64),
      new THREE.MeshPhongMaterial({ color: 0x021a2e, emissive: 0x000a1a, specular: 0x4488ff, shininess: 30, transparent: true, opacity: 0.8 })
    );
    globeGroup.add(sphere);

    // Grid Overlay
    globeGroup.add(new THREE.Mesh(
      new THREE.SphereGeometry(5.02, 40, 40),
      new THREE.MeshBasicMaterial({ color: 0x06b6d4, wireframe: true, transparent: true, opacity: 0.15 })
    ));

    // Atmosphere Halo
    const atmosphere = new THREE.Mesh(
      new THREE.SphereGeometry(6, 64, 64),
      new THREE.ShaderMaterial({
        uniforms: { 'c': { value: 0.1 }, 'p': { value: 4.0 }, glowColor: { value: new THREE.Color(0x06b6d4) }, viewVector: { value: camera.position } },
        vertexShader: `varying float intensity; void main() { vec3 vNormal = normalize( normalMatrix * normal ); intensity = pow( 0.6 - dot( vNormal, vec3( 0, 0, 1.0 ) ), 4.0 ); gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 ); }`,
        fragmentShader: `varying float intensity; uniform vec3 glowColor; void main() { gl_FragColor = vec4( glowColor, intensity ); }`,
        side: THREE.BackSide, blending: THREE.AdditiveBlending, transparent: true
      })
    );
    scene.add(atmosphere);

    // Add Markers
    markersRef.current = [];
    // Cast Object.entries to correct type to fix property 'zones' and 'color' unknown errors
    (Object.entries(categories) as [string, Category][]).forEach(([key, cat]) => {
      cat.zones.forEach(zone => {
        const phi = (90 - zone.lat) * (Math.PI / 180);
        const theta = (zone.lon + 180) * (Math.PI / 180);
        const radius = 5.05;
        const pos = new THREE.Vector3(-(radius * Math.sin(phi) * Math.cos(theta)), radius * Math.cos(phi), radius * Math.sin(phi) * Math.sin(theta));

        const group = new THREE.Group();
        group.position.copy(pos);
        group.lookAt(0,0,0);

        const marker = new THREE.Mesh(new THREE.SphereGeometry(0.06 * zone.intensity, 16, 16), new THREE.MeshBasicMaterial({ color: cat.color }));
        const ring = new THREE.Mesh(new THREE.RingGeometry(0.1, 0.15, 32), new THREE.MeshBasicMaterial({ color: cat.color, transparent: true, opacity: 0.4, side: THREE.DoubleSide }));
        
        group.add(marker, ring);
        globeGroup.add(group);
        markersRef.current.push({ group, marker, ring, zone, category: key, color: cat.color });
      });
    });

    scene.add(new THREE.AmbientLight(0x404040, 2));
    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(5, 3, 5);
    scene.add(light);
    camera.position.z = 13;

    let time = 0;
    const animate = () => {
      requestAnimationFrame(animate);
      time += 0.02;
      if (rotating && !globeGroup.userData.targetRotation) globeGroup.rotation.y += 0.0015;
      
      if (globeGroup.userData.targetRotation) {
        globeGroup.rotation.y += (globeGroup.userData.targetRotation.y - globeGroup.rotation.y) * 0.05;
        globeGroup.rotation.x += (globeGroup.userData.targetRotation.x - globeGroup.rotation.x) * 0.05;
      }

      markersRef.current.forEach(m => {
        const visible = activeCategories[m.category] && m.zone.intensity >= intensityFilter;
        m.group.visible = visible;
        if (visible) {
            const s = 1 + Math.sin(time * 4) * 0.3;
            m.ring.scale.set(s, s, s);
            m.ring.material.opacity = 0.5 - (Math.sin(time * 4) * 0.2);
        }
      });
      renderer.render(scene, camera);
    };
    animate();

    const onClick = (e: MouseEvent) => {
        const rect = currentMount.getBoundingClientRect();
        const mouse = new THREE.Vector2(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(markersRef.current.filter(m => m.group.visible).map(m => m.marker));
        if (intersects.length > 0) {
            const data = markersRef.current.find(m => m.marker === intersects[0].object);
            if (data) onMarkerClick({ zone: data.zone, categoryName: categories[data.category].name, categoryColor: data.color });
        }
    };
    currentMount.addEventListener('click', onClick);

    return () => {
      currentMount.removeEventListener('click', onClick);
      currentMount.removeChild(renderer.domElement);
    };
  }, [categories, activeCategories, intensityFilter]);

  useEffect(() => {
    if (globeTarget && globeGroupRef.current) {
      globeGroupRef.current.userData.targetRotation = { x: (globeTarget.lat * Math.PI)/180, y: (-globeTarget.lon * Math.PI)/180 };
    }
  }, [globeTarget]);

  return <div ref={mountRef} className="w-full h-full" />;
};

export default Globe;
