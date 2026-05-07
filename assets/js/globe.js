/**
 * Three.js Globe Visualization
 * Military/Advanced Warfare style globe with visitor location markers
 */

// Constants
const MAX_DISPLAYED_VISITORS = 10;

// Check if Three.js is loaded - exit early if not available
if (typeof THREE === 'undefined') {
  console.error('Three.js library not loaded');
  document.addEventListener('DOMContentLoaded', () => {
    const loading = document.querySelector('.loading-overlay');
    if (loading) {
      loading.innerHTML = '<span class="loading-text">Error: Unable to load 3D engine. Please refresh or check your connection.</span>';
    }
  });
} else {

class GlobeVisualization {
  constructor() {
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.globe = null;
    this.markers = [];
    this.pulseRings = []; // Store pulse rings for consolidated animation
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.isRotating = true;
    this.rotationSpeed = 0.001;
    
    this.init();
  }

  init() {
    // Scene setup
    this.scene = new THREE.Scene();
    
    // Camera setup
    this.camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.z = 3;

    // Renderer setup
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0x000000, 0);
    
    document.getElementById('globe-canvas').appendChild(this.renderer.domElement);

    // Create globe
    this.createGlobe();
    
    // Create atmosphere
    this.createAtmosphere();
    
    // Create grid lines
    this.createGridLines();
    
    // Add stars background
    this.createStars();

    // Add markers from visitor data
    this.loadVisitorMarkers();

    // Event listeners
    window.addEventListener('resize', () => this.onWindowResize());
    window.addEventListener('mousemove', (e) => this.onMouseMove(e));
    window.addEventListener('click', () => this.toggleRotation());

    // Start animation loop
    this.animate();
    
    // Hide loading overlay
    setTimeout(() => {
      document.querySelector('.loading-overlay').classList.add('hidden');
    }, 1500);
  }

  createGlobe() {
    const geometry = new THREE.SphereGeometry(1, 64, 64);
    
    // Create wireframe material with military green color
    const material = new THREE.MeshBasicMaterial({
      color: 0x00ff41,
      wireframe: true,
      transparent: true,
      opacity: 0.15
    });

    this.globe = new THREE.Mesh(geometry, material);
    this.scene.add(this.globe);

    // Add solid inner globe
    const innerGeometry = new THREE.SphereGeometry(0.99, 64, 64);
    const innerMaterial = new THREE.MeshBasicMaterial({
      color: 0x0a0a0a,
      transparent: true,
      opacity: 0.9
    });
    const innerGlobe = new THREE.Mesh(innerGeometry, innerMaterial);
    this.scene.add(innerGlobe);

    // Add continents outline effect
    this.createContinentLines();
  }

  createContinentLines() {
    // Simplified continent outlines using lines
    const material = new THREE.LineBasicMaterial({
      color: 0x00ff41,
      transparent: true,
      opacity: 0.4
    });

    // Create latitude lines
    for (let lat = -80; lat <= 80; lat += 20) {
      const points = [];
      for (let lon = 0; lon <= 360; lon += 5) {
        const pos = this.latLonToVector3(lat, lon, 1.001);
        points.push(pos);
      }
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const line = new THREE.Line(geometry, material);
      this.globe.add(line);
    }

    // Create longitude lines
    for (let lon = 0; lon < 360; lon += 30) {
      const points = [];
      for (let lat = -90; lat <= 90; lat += 5) {
        const pos = this.latLonToVector3(lat, lon, 1.001);
        points.push(pos);
      }
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const line = new THREE.Line(geometry, material);
      this.globe.add(line);
    }
  }

  createAtmosphere() {
    // Outer glow
    const geometry = new THREE.SphereGeometry(1.1, 64, 64);
    const material = new THREE.ShaderMaterial({
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        void main() {
          float intensity = pow(0.6 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
          gl_FragColor = vec4(0.0, 1.0, 0.25, 1.0) * intensity * 0.5;
        }
      `,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      transparent: true
    });

    const atmosphere = new THREE.Mesh(geometry, material);
    this.scene.add(atmosphere);
  }

  createGridLines() {
    // Create targeting grid overlay
    const gridHelper = new THREE.PolarGridHelper(2, 8, 8, 64, 0x00ff41, 0x00ff41);
    gridHelper.material.transparent = true;
    gridHelper.material.opacity = 0.1;
    gridHelper.rotation.x = Math.PI / 2;
    this.scene.add(gridHelper);
  }

  createStars() {
    const starsGeometry = new THREE.BufferGeometry();
    const starsMaterial = new THREE.PointsMaterial({
      color: 0x00ff41,
      size: 0.02,
      transparent: true,
      opacity: 0.6
    });

    const starsVertices = [];
    for (let i = 0; i < 2000; i++) {
      const x = (Math.random() - 0.5) * 100;
      const y = (Math.random() - 0.5) * 100;
      const z = (Math.random() - 0.5) * 100;
      
      // Ensure stars are outside globe area
      const distance = Math.sqrt(x*x + y*y + z*z);
      if (distance > 5) {
        starsVertices.push(x, y, z);
      }
    }

    starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starsVertices, 3));
    const stars = new THREE.Points(starsGeometry, starsMaterial);
    this.scene.add(stars);
  }

  loadVisitorMarkers() {
    // Get visitor data from tracker
    let visitors = [];
    
    try {
      if (typeof VisitorTracker !== 'undefined') {
        visitors = VisitorTracker.getVisitorLocations();
      }
    } catch (e) {
      console.log('Tracker not available, using sample data');
    }

    // If no real visitors, add some demo markers
    if (visitors.length === 0) {
      visitors = [
        { lat: 40.7128, lon: -74.0060, city: 'New York', country: 'USA' },
        { lat: 51.5074, lon: -0.1278, city: 'London', country: 'UK' },
        { lat: 35.6762, lon: 139.6503, city: 'Tokyo', country: 'Japan' },
        { lat: -33.8688, lon: 151.2093, city: 'Sydney', country: 'Australia' },
        { lat: 48.8566, lon: 2.3522, city: 'Paris', country: 'France' },
        { lat: 37.7749, lon: -122.4194, city: 'San Francisco', country: 'USA' },
        { lat: 55.7558, lon: 37.6173, city: 'Moscow', country: 'Russia' },
        { lat: -23.5505, lon: -46.6333, city: 'São Paulo', country: 'Brazil' }
      ];
    }

    // Add markers for each visitor
    visitors.forEach((visitor, index) => {
      this.addMarker(visitor.lat, visitor.lon, visitor.city, visitor.country, index);
    });

    // Update stats display
    this.updateStats(visitors.length);
    
    // Populate visitor list
    this.populateVisitorList(visitors);
  }

  addMarker(lat, lon, city, country, index) {
    const position = this.latLonToVector3(lat, lon, 1.02);
    
    // Create marker geometry
    const geometry = new THREE.SphereGeometry(0.015, 16, 16);
    const material = new THREE.MeshBasicMaterial({
      color: 0x00ff41,
      transparent: true,
      opacity: 0.9
    });
    
    const marker = new THREE.Mesh(geometry, material);
    marker.position.copy(position);
    marker.userData = { city, country, lat, lon };
    
    this.globe.add(marker);
    this.markers.push(marker);

    // Add pulsing ring effect
    this.addPulseRing(position, index);

    // Add beam to marker
    this.addMarkerBeam(position);
  }

  addPulseRing(position, delay) {
    const geometry = new THREE.RingGeometry(0.02, 0.025, 32);
    const material = new THREE.MeshBasicMaterial({
      color: 0x00ff41,
      transparent: true,
      opacity: 0.5,
      side: THREE.DoubleSide
    });

    const ring = new THREE.Mesh(geometry, material);
    ring.position.copy(position);
    ring.lookAt(new THREE.Vector3(0, 0, 0));
    
    this.globe.add(ring);

    // Store ring data for consolidated animation in main animate loop
    this.pulseRings.push({ ring, material, delay });
  }

  addMarkerBeam(position) {
    const points = [
      position.clone(),
      position.clone().multiplyScalar(1.15)
    ];
    
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({
      color: 0x00ff41,
      transparent: true,
      opacity: 0.3
    });
    
    const beam = new THREE.Line(geometry, material);
    this.globe.add(beam);
  }

  latLonToVector3(lat, lon, radius) {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lon + 180) * (Math.PI / 180);

    const x = -(radius * Math.sin(phi) * Math.cos(theta));
    const y = radius * Math.cos(phi);
    const z = radius * Math.sin(phi) * Math.sin(theta);

    return new THREE.Vector3(x, y, z);
  }

  updateStats(visitorCount) {
    const statsElement = document.getElementById('visitor-count');
    if (statsElement) {
      statsElement.textContent = visitorCount;
    }
    
    const locationsElement = document.getElementById('locations-tracked');
    if (locationsElement) {
      locationsElement.textContent = visitorCount;
    }
  }

  populateVisitorList(visitors) {
    const listElement = document.getElementById('visitor-list');
    if (!listElement) return;

    listElement.innerHTML = '';
    
    const displayVisitors = visitors.slice(-MAX_DISPLAYED_VISITORS).reverse();
    
    displayVisitors.forEach(visitor => {
      const entry = document.createElement('div');
      entry.className = 'visitor-entry';
      
      const time = visitor.timestamp 
        ? this.formatTime(new Date(visitor.timestamp))
        : 'Demo';
      
      entry.innerHTML = `
        <div class="visitor-marker"></div>
        <div class="visitor-location">${visitor.city}, ${visitor.country}</div>
        <div class="visitor-time">${time}</div>
      `;
      
      listElement.appendChild(entry);
    });
  }

  formatTime(date) {
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  onMouseMove(event) {
    this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    
    // Subtle camera movement based on mouse position
    const targetX = this.mouse.x * 0.2;
    const targetY = this.mouse.y * 0.2;
    
    this.camera.position.x += (targetX - this.camera.position.x) * 0.02;
    this.camera.position.y += (targetY - this.camera.position.y) * 0.02;
    this.camera.lookAt(this.scene.position);
  }

  toggleRotation() {
    this.isRotating = !this.isRotating;
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    // Rotate globe
    if (this.isRotating && this.globe) {
      this.globe.rotation.y += this.rotationSpeed;
    }

    // Animate pulse rings (consolidated animation)
    const time = Date.now();
    this.pulseRings.forEach(({ ring, material, delay }) => {
      const scale = 1 + Math.sin(time * 0.003 + delay) * 0.5;
      ring.scale.set(scale, scale, scale);
      material.opacity = 0.5 - (scale - 1) * 0.8;
    });

    // Render scene
    this.renderer.render(this.scene, this.camera);
  }
}

// Initialize globe when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new GlobeVisualization();
});

} // End of else block for THREE check
