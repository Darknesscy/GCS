
import React, { useEffect, useRef, useMemo } from 'react';
import * as THREE from 'three';
import { CategoriesData, SelectedZoneInfo, Category, WeatherPoint, StrategicAsset } from '../types';
import { playPingSound, playHoverSound } from '../utils/soundEffects';

interface GlobeProps {
  categories: CategoriesData;
  activeCategories: Record<string, boolean>;
  onMarkerClick: (zoneInfo: SelectedZoneInfo) => void;
  rotationSpeed: number;
  intensityFilter: number;
  globeTarget: { lat: number; lon: number } | null;
  weatherData: WeatherPoint[];
  showWeather: boolean;
  assets?: StrategicAsset[];
  year?: number;
}

// --- Procedural Texture Generators ---

const createWeatherSprite = (type: 'THUNDER' | 'RAIN' | 'SNOW') => {
  const canvas = document.createElement('canvas');
  canvas.width = 128; canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.Texture();

  ctx.clearRect(0,0,128,128);
  if (type === 'THUNDER') {
      ctx.fillStyle = '#fbbf24'; ctx.shadowColor = '#fbbf24'; ctx.shadowBlur = 15;
      ctx.beginPath(); ctx.moveTo(70, 10); ctx.lineTo(30, 70); ctx.lineTo(60, 70); ctx.lineTo(40, 120); ctx.lineTo(90, 50); ctx.lineTo(60, 50); ctx.fill();
  } else if (type === 'RAIN') {
      ctx.fillStyle = '#38bdf8'; ctx.shadowColor = '#38bdf8'; ctx.shadowBlur = 10;
      ctx.beginPath(); ctx.arc(64, 100, 20, 0, Math.PI, false); ctx.lineTo(64, 20); ctx.fill();
  } else if (type === 'SNOW') {
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 8; ctx.shadowColor = '#fff'; ctx.shadowBlur = 10;
      ctx.beginPath(); ctx.moveTo(64, 10); ctx.lineTo(64, 118); ctx.moveTo(10, 64); ctx.lineTo(118, 64); ctx.moveTo(26, 26); ctx.lineTo(102, 102); ctx.moveTo(102, 26); ctx.lineTo(26, 102); ctx.stroke();
  }
  return new THREE.CanvasTexture(canvas);
};

const createCloudTexture = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 1024; canvas.height = 512;
    const ctx = canvas.getContext('2d');
    if (!ctx) return new THREE.Texture();
    ctx.fillStyle = 'rgba(0,0,0,0)'; ctx.fillRect(0, 0, 1024, 512);
    for (let i = 0; i < 200; i++) {
        const x = Math.random() * 1024; const y = Math.random() * 512; const r = Math.random() * 80 + 20;
        const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
        grad.addColorStop(0, `rgba(255, 255, 255, ${Math.random() * 0.1})`);
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = grad; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    }
    return new THREE.CanvasTexture(canvas);
};

const createHexTexture = () => {
  const canvas = document.createElement('canvas');
  canvas.width = 512; canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.Texture();
  ctx.fillStyle = '#000000'; ctx.fillRect(0, 0, 512, 512);
  const size = 32; const h = size * Math.sqrt(3);
  ctx.strokeStyle = '#06b6d4'; ctx.lineWidth = 1;
  for (let y = -h; y < 512 + h; y += h) {
    for (let x = -size; x < 512 + size * 3; x += size * 3) {
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i;
        ctx.lineTo(x + size * Math.cos(angle), y + size * Math.sin(angle));
      }
      ctx.closePath(); ctx.stroke();
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(4, 2); 
  return tex;
};

// --- Utils ---

const getVectorFromLatLon = (lat: number, lon: number, radius: number) => {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -(radius * Math.sin(phi) * Math.cos(theta)),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
};

// --- Shaders ---

const glowVertexShader = `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const glowFragmentShader = `uniform vec3 color; uniform float time; uniform float hover; varying vec2 vUv; void main() { float dist = distance(vUv, vec2(0.5)); float alpha = smoothstep(0.5, 0.0, dist); float pulse = 0.5 + 0.5 * sin(time * 3.0); float intensity = 0.3 + (0.2 * pulse) + (hover * 0.8); vec3 finalColor = mix(color, vec3(1.0), hover * 0.5); gl_FragColor = vec4(finalColor, alpha * intensity); }`;
const scannerVertexShader = `varying vec3 vPos; void main() { vPos = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const scannerFragmentShader = `uniform float scanHeight; uniform vec3 color; varying vec3 vPos; void main() { float dist = abs(vPos.y - scanHeight); float intensity = smoothstep(0.5, 0.0, dist); float grid = sin(vPos.x * 20.0) * sin(vPos.z * 20.0); intensity *= (0.5 + 0.5 * grid); if (intensity < 0.01) discard; gl_FragColor = vec4(color, intensity * 0.4); }`;

const Globe: React.FC<GlobeProps> = ({ categories, activeCategories, onMarkerClick, rotationSpeed, intensityFilter, globeTarget, weatherData, showWeather, assets = [] }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const globeGroupRef = useRef<THREE.Group | null>(null);
  const markersRef = useRef<any[]>([]);
  const hoveredMarkerRef = useRef<string | null>(null);
  const resourcesRef = useRef<Set<any>>(new Set());

  const textures = useMemo(() => ({
    hex: createHexTexture(),
    clouds: createCloudTexture(),
    thunder: createWeatherSprite('THUNDER'),
    rain: createWeatherSprite('RAIN'),
    snow: createWeatherSprite('SNOW')
  }), []);

  useEffect(() => {
    if (!mountRef.current || !categories) return;
    const currentMount = mountRef.current;
    
    while(currentMount.firstChild) currentMount.removeChild(currentMount.firstChild);

    let renderer: THREE.WebGLRenderer | null = null;
    try {
        renderer = new THREE.WebGLRenderer({ 
            antialias: true, 
            alpha: true, 
            powerPreference: "high-performance"
        });
    } catch (e) {
        console.error("WebGL Initialization failed", e);
        return;
    }

    renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    currentMount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, currentMount.clientWidth / currentMount.clientHeight, 0.1, 2000);
    camera.position.z = 17;

    const globeGroup = new THREE.Group();
    globeGroupRef.current = globeGroup;
    scene.add(globeGroup);

    const track = (res: any) => { if (res) resourcesRef.current.add(res); return res; };

    // Starfield
    const starGeo = track(new THREE.BufferGeometry());
    const starPos = new Float32Array(3000 * 3);
    for(let i = 0; i < 3000 * 3; i+=3) {
        const r = 400 + Math.random() * 400; const theta = Math.random() * Math.PI * 2; const phi = Math.acos(2 * Math.random() - 1);
        starPos[i] = r * Math.sin(phi) * Math.cos(theta); starPos[i+1] = r * Math.sin(phi) * Math.sin(theta); starPos[i+2] = r * Math.cos(phi);
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    const starMat = track(new THREE.PointsMaterial({ size: 1.2, color: 0x88ccff, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending }));
    scene.add(new THREE.Points(starGeo, starMat));

    // Core Globe
    const globeGeo = track(new THREE.SphereGeometry(5, 64, 64));
    const globeMat = track(new THREE.MeshStandardMaterial({ color: 0x001a33, emissive: 0x000510, emissiveIntensity: 0.2 }));
    globeGroup.add(new THREE.Mesh(globeGeo, globeMat));

    // Atmospheric Shells
    const cloudMat = track(new THREE.MeshStandardMaterial({ map: textures.clouds, transparent: true, opacity: 0.4, blending: THREE.AdditiveBlending }));
    globeGroup.add(new THREE.Mesh(track(new THREE.SphereGeometry(5.1, 64, 64)), cloudMat));

    const hexMat = track(new THREE.MeshBasicMaterial({ map: textures.hex, transparent: true, opacity: 0.08, blending: THREE.AdditiveBlending, depthWrite: false }));
    globeGroup.add(new THREE.Mesh(track(new THREE.SphereGeometry(5.35, 64, 64)), hexMat));

    const scannerMat = track(new THREE.ShaderMaterial({
        uniforms: { scanHeight: { value: 0 }, color: { value: new THREE.Color(0x00ff88) } },
        vertexShader: scannerVertexShader, fragmentShader: scannerFragmentShader, transparent: true, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, depthWrite: false
    }));
    globeGroup.add(new THREE.Mesh(track(new THREE.SphereGeometry(5.2, 64, 64)), scannerMat));

    const ambient = track(new THREE.AmbientLight(0x404040, 0.5)); scene.add(ambient);
    const sunLight = track(new THREE.DirectionalLight(0xffffff, 2.5)); globeGroup.add(sunLight);

    // Satellites
    const satGeo = track(new THREE.BoxGeometry(0.05, 0.05, 0.1));
    const satMat = track(new THREE.MeshBasicMaterial({ color: 0xffffff }));
    const satellites = Array.from({ length: 40 }, () => {
        const mesh = new THREE.Mesh(satGeo, satMat);
        globeGroup.add(mesh);
        return { mesh, speed: 0.1 + Math.random() * 0.2, radius: 6 + Math.random() * 2, inclination: Math.random() * Math.PI, phase: Math.random() * Math.PI * 2 };
    });

    // Markers
    markersRef.current = [];
    const markerPlane = track(new THREE.PlaneGeometry(0.6, 0.6));

    // DEFENSIVE CHECK: Ensure categories is an object
    if (categories && typeof categories === 'object') {
      Object.entries(categories).forEach(([key, rawCat]) => {
        const cat = rawCat as Category;
        // DEFENSIVE CHECK: Ensure category and zones array exist
        if (!cat || !cat.zones || !Array.isArray(cat.zones)) return;

        const color = key === 'phenomena' ? 0xffffff : cat.color;
        cat.zones.forEach((zone, idx) => {
          if (!zone) return;
          const pos = getVectorFromLatLon(zone.lat, zone.lon, 5.1);
          const g = new THREE.Group(); g.position.copy(pos); g.lookAt(0,0,0);
          const glow = track(new THREE.ShaderMaterial({
              uniforms: { color: { value: new THREE.Color(color) }, time: { value: 0 }, hover: { value: 0 } },
              vertexShader: glowVertexShader, fragmentShader: glowFragmentShader, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending
          }));
          const m = new THREE.Mesh(markerPlane, glow); m.position.z = 0.05; g.add(m);
          globeGroup.add(g);
          markersRef.current.push({ group: g, glowMat: glow, zone, category: key, id: `${key}-${idx}` });
        });
      });
    }

    const physics = { isDragging: false, velocityX: 0, velocityY: 0, zoom: 17, lastX: 0, lastY: 0 };
    let frameId: number;
    let scanY = 0; let scanDir = 1;

    const animate = () => {
      frameId = requestAnimationFrame(animate);
      const time = performance.now() * 0.001;

      scanY += scanDir * 0.03; if (Math.abs(scanY) > 5.5) scanDir *= -1;
      scannerMat.uniforms.scanHeight.value = scanY;

      satellites.forEach(s => {
          s.phase += s.speed * 0.01;
          const x = s.radius * Math.cos(s.phase); const z = s.radius * Math.sin(s.phase);
          s.mesh.position.set(x * Math.cos(s.inclination), x * Math.sin(s.inclination), z);
          s.mesh.lookAt(0,0,0);
      });

      if (!physics.isDragging) {
          globeGroup.rotation.y += physics.velocityX; globeGroup.rotation.x += physics.velocityY;
          physics.velocityX *= 0.95; physics.velocityY *= 0.95;
          if (rotationSpeed > 0 && Math.abs(physics.velocityX) < 0.001) globeGroup.rotation.y += rotationSpeed;
      }

      markersRef.current.forEach(m => {
          m.group.visible = activeCategories[m.category] && m.zone.intensity >= intensityFilter;
          if (m.group.visible) {
              m.glowMat.uniforms.time.value = time;
              const isH = hoveredMarkerRef.current === m.id;
              m.glowMat.uniforms.hover.value += ((isH ? 1.0 : 0.0) - m.glowMat.uniforms.hover.value) * 0.1;
          }
      });

      camera.position.z += (physics.zoom - camera.position.z) * 0.1;
      if (renderer) renderer.render(scene, camera);
    };
    animate();

    const onMouseDown = (e: MouseEvent) => { physics.isDragging = true; physics.lastX = e.clientX; physics.lastY = e.clientY; };
    const onMouseMove = (e: MouseEvent) => {
        if (physics.isDragging) {
            physics.velocityX = (e.clientX - physics.lastX) * 0.005; physics.velocityY = (e.clientY - physics.lastY) * 0.005;
            globeGroup.rotation.y += physics.velocityX; globeGroup.rotation.x += physics.velocityY;
            physics.lastX = e.clientX; physics.lastY = e.clientY;
        } else {
            const rect = currentMount.getBoundingClientRect();
            const mouse = new THREE.Vector2(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
            const raycaster = new THREE.Raycaster(); raycaster.setFromCamera(mouse, camera);
            const intersects = raycaster.intersectObjects(markersRef.current.filter(m => m.group.visible).map(m => m.group), true);
            if (intersects.length > 0) {
                let hit = intersects[0].object; while(hit.parent && !hit.userData?.id) { if (markersRef.current.find(m => m.group === hit)) break; hit = hit.parent; }
                const data = markersRef.current.find(m => m.group === hit);
                if (data && hoveredMarkerRef.current !== data.id) { hoveredMarkerRef.current = data.id; playHoverSound(); currentMount.style.cursor = 'pointer'; }
            } else { hoveredMarkerRef.current = null; currentMount.style.cursor = 'grab'; }
        }
    };
    const onMouseUp = () => { physics.isDragging = false; };
    const onWheel = (e: WheelEvent) => { e.preventDefault(); physics.zoom = Math.max(7, Math.min(40, physics.zoom + e.deltaY * 0.02)); };
    const onClick = (e: MouseEvent) => {
        if (Math.abs(physics.velocityX) > 0.01) return;
        const rect = currentMount.getBoundingClientRect();
        const mouse = new THREE.Vector2(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
        const raycaster = new THREE.Raycaster(); raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(markersRef.current.filter(m => m.group.visible).map(m => m.group), true);
        if (intersects.length > 0) {
            let hit = intersects[0].object; while(hit.parent && !markersRef.current.find(m => m.group === hit)) hit = hit.parent;
            const data = markersRef.current.find(m => m.group === hit);
            if (data) { playPingSound(); onMarkerClick({ zone: data.zone, categoryName: categories[data.category].name, categoryColor: data.glowMat.uniforms.color.value.getHex() }); }
        }
    };

    currentMount.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    currentMount.addEventListener('wheel', onWheel, { passive: false });
    currentMount.addEventListener('click', onClick);

    return () => {
        cancelAnimationFrame(frameId);
        currentMount.removeEventListener('mousedown', onMouseDown);
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
        currentMount.removeEventListener('wheel', onWheel);
        currentMount.removeEventListener('click', onClick);
        
        if (renderer) {
            renderer.dispose();
            if (currentMount.contains(renderer.domElement)) currentMount.removeChild(renderer.domElement);
        }
        
        resourcesRef.current.forEach(res => {
            if (res.dispose) res.dispose();
            if (res.geometry) res.geometry.dispose();
            if (res.material) {
                if (Array.isArray(res.material)) res.material.forEach((m: any) => m.dispose());
                else res.material.dispose();
            }
        });
        resourcesRef.current.clear();
    };
  }, [categories, activeCategories, intensityFilter, textures, rotationSpeed, onMarkerClick]);

  return <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />;
};

export default Globe;
