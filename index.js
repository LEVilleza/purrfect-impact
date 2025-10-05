import * as THREE from "three";
import { OrbitControls } from 'jsm/controls/OrbitControls.js';

import getStarfield from "./src/getStarfield.js";
import { getFresnelMat } from "./src/getFresnelMat.js";

const w = window.innerWidth;
const h = window.innerHeight;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, w / h, 0.1, 1000);
camera.position.z = 5;
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(w, h);
document.body.appendChild(renderer.domElement);
// THREE.ColorManagement.enabled = true;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.outputColorSpace = THREE.LinearSRGBColorSpace;

const earthGroup = new THREE.Group();
earthGroup.rotation.z = -23.4 * Math.PI / 180;
scene.add(earthGroup);
const controls = new OrbitControls(camera, renderer.domElement);
// Restrict zooming so the camera doesn't go inside Earth or too far away
controls.minDistance = 2.0;  // just outside the Earth (~1.1 radius with effects)
controls.maxDistance = 20.0; // cap how far the user can zoom out
const detail = 12;
const loader = new THREE.TextureLoader();
const geometry = new THREE.IcosahedronGeometry(1, detail);
const material = new THREE.MeshPhongMaterial({
  map: loader.load("./textures/00_earthmap1k.jpg"),
  specularMap: loader.load("./textures/02_earthspec1k.jpg"),
  bumpMap: loader.load("./textures/01_earthbump1k.jpg"),
  bumpScale: 0.04,
});
// material.map.colorSpace = THREE.SRGBColorSpace;
const earthMesh = new THREE.Mesh(geometry, material);
earthGroup.add(earthMesh);

const lightsMat = new THREE.MeshBasicMaterial({
  map: loader.load("./textures/03_earthlights1k.jpg"),
  blending: THREE.AdditiveBlending,
});
const lightsMesh = new THREE.Mesh(geometry, lightsMat);
earthGroup.add(lightsMesh);

const cloudsMat = new THREE.MeshStandardMaterial({
  map: loader.load("./textures/04_earthcloudmap.jpg"),
  transparent: true,
  opacity: 0.8,
  blending: THREE.AdditiveBlending,
  alphaMap: loader.load('./textures/05_earthcloudmaptrans.jpg'),
  // alphaTest: 0.3,
});
const cloudsMesh = new THREE.Mesh(geometry, cloudsMat);
cloudsMesh.scale.setScalar(1.003);
earthGroup.add(cloudsMesh);

const fresnelMat = getFresnelMat();
const glowMesh = new THREE.Mesh(geometry, fresnelMat);
glowMesh.scale.setScalar(1.01);
earthGroup.add(glowMesh);

const stars = getStarfield({numStars: 2000});
scene.add(stars);

const sunLight = new THREE.DirectionalLight(0xffffff, 2.0);
sunLight.position.set(-2, 0.5, 1.5);
scene.add(sunLight);

// --- UI wiring and basic simulation placeholders ---
const ui = {
  diameterKm: document.getElementById('diameterKm'),
  density: document.getElementById('density'),
  velocity: document.getElementById('velocity'),
  latitude: document.getElementById('latitude'),
  longitude: document.getElementById('longitude'),
  impactAngle: document.getElementById('impactAngle'),
  meteorSelect: document.getElementById('meteorSelect'),
  retryNASA: document.getElementById('retryNASA'),
  showWaves: document.getElementById('showWaves'),
  deltaV: document.getElementById('deltaV'),
  leadTimeDays: document.getElementById('leadTimeDays'),
  bearingDeg: document.getElementById('bearingDeg'),
  resetBtn: document.getElementById('resetBtn'),
  toggleUI: document.getElementById('toggleUI'),
  massOut: document.getElementById('massOut'),
  energyOut: document.getElementById('energyOut'),
  tntOut: document.getElementById('tntOut'),
  craterOut: document.getElementById('craterOut'),
  craterDepthOut: document.getElementById('craterDepthOut'),
  deflectShiftOut: document.getElementById('deflectShiftOut'),
  missStatusOut: document.getElementById('missStatusOut'),
  dvReqOut: document.getElementById('dvReqOut'),
  impactLocationOut: document.getElementById('impactLocationOut'),
  waveTypeOut: document.getElementById('waveTypeOut'),
  // New UI elements
  playButton: document.getElementById('playButton'),
  playBtnLegacy: document.getElementById('playBtn'),
  visualNovelOverlay: document.getElementById('visualNovelOverlay'),
  closeVisualNovel: document.getElementById('closeVisualNovel'),
  meteorInfo: document.getElementById('meteorInfo'),
  meteorName: document.getElementById('meteorName'),
  meteorDiameter: document.getElementById('meteorDiameter'),
  meteorDensity: document.getElementById('meteorDensity'),
  meteorVelocity: document.getElementById('meteorVelocity'),
  meteorHazard: document.getElementById('meteorHazard'),
  questionBox: document.getElementById('questionBox'),
  questionText: document.getElementById('questionText'),
  optionsContainer: document.getElementById('optionsContainer'),
  explosionContainer: document.getElementById('explosionContainer'),
  // Game elements
  gameTimer: document.getElementById('gameTimer'),
  timerText: document.getElementById('timerText'),
  gameFeedback: document.getElementById('gameFeedback'),
  feedbackText: document.getElementById('feedbackText'),
  feedbackClose: document.getElementById('feedbackClose'),
  gameOverlay: document.getElementById('gameOverlay'),
  approachDialog: document.getElementById('approachDialog'),
  approachOptions: document.getElementById('approachOptions'),
};
// Resizable left panel
const uiPanel = document.getElementById('ui');
const uiResizer = document.getElementById('uiResizer');
let isResizing = false;
let startX = 0;
let startW = 0;

function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }

function onResizePointerDown(e) {
  // Do not allow resizing when collapsed
  if (uiPanel.classList.contains('collapsed')) return;
  isResizing = true;
  uiPanel.classList.add('resizing');
  const rect = uiPanel.getBoundingClientRect();
  startX = e.clientX;
  startW = rect.width;
  // Prevent text selection while resizing
  e.preventDefault();
}

function onResizePointerMove(e) {
  if (!isResizing) return;
  // Guard against mid-drag collapse
  if (uiPanel.classList.contains('collapsed')) {
    isResizing = false;
    uiPanel.classList.remove('resizing');
    return;
  }
  const dx = e.clientX - startX;
  const minW = 220;
  const maxW = Math.min(window.innerWidth * 0.5, 640);
  const newW = clamp(startW + dx, minW, maxW);
  uiPanel.style.width = newW + 'px';
  // Keep outside toggle aligned as we resize
  positionOutsideToggle();
	// Update responsive layout based on current width
	updateUIPanelResponsive();
}

function onResizePointerUp() {
  if (!isResizing) return;
  isResizing = false;
  uiPanel.classList.remove('resizing');
	updateUIPanelResponsive();
}

if (uiResizer && uiPanel) {
  uiResizer.addEventListener('pointerdown', onResizePointerDown);
  window.addEventListener('pointermove', onResizePointerMove);
  window.addEventListener('pointerup', onResizePointerUp);
}


function kmToMeters(km) { return km * 1000; }
function metersToKm(m) { return m / 1000; }
function joulesToMegatons(joules) { return joules / 4.184e15; }

function estimateMass(diameterKm, densityKgPerM3) {
  const radiusM = kmToMeters(diameterKm) / 2;
  const volume = (4 / 3) * Math.PI * Math.pow(radiusM, 3);
  return volume * densityKgPerM3;
}

function estimateImpactEnergy(massKg, velocityKmPerS) {
  const v = kmToMeters(velocityKmPerS);
  return 0.5 * massKg * v * v;
}

// Simplified transient crater diameter scaling (first-order):
// D_km ≈ 1.8 * (E_Mt)^(1/3.4) for stony impactor at ~45° (very approximate)
function estimateCraterDiameterKm(energyJoules) {
  const mt = joulesToMegatons(energyJoules);
  if (!isFinite(mt) || mt <= 0) return 0;
  const d = 1.8 * Math.pow(mt, 1 / 3.4);
  return d;
}

// Estimate crater depth based on diameter and impact angle
function estimateCraterDepthKm(diameterKm, impactAngleDeg) {
  // Crater depth is typically 1/5 to 1/3 of diameter for simple craters
  // Shallow angles create shallower craters
  const angleFactor = Math.sin(THREE.MathUtils.degToRad(impactAngleDeg));
  const baseDepth = diameterKm * 0.2; // 1/5 of diameter
  const depth = baseDepth * angleFactor;
  return Math.max(0.1, depth); // Minimum depth of 0.1 km
}

// Impact marker
const impactMarker = new THREE.Mesh(
  new THREE.SphereGeometry(0.012, 16, 16),
  new THREE.MeshBasicMaterial({ color: 0xff5533 })
);
impactMarker.visible = false;
earthGroup.add(impactMarker);

// Impact radius visualization (geodesic circle)
let impactCircle;

// Wave direction arrows
let waveArrows = [];
let waveArrowsGroup;

// Geographic wave system
const EARTH_RADIUS_KM = 6371;
const LAND_THRESHOLD = 0.1; // Threshold for land detection (simplified)

// NASA NEO API configuration
const NASA_API_KEY = 'Xw8nRcQkjx8eHGVLFbd5Kv7x9jg5gKxKwqgjMfqD';
const NASA_API_URL = 'https://api.nasa.gov/neo/rest/v1/neo/browse';

// Meteor database - will be populated from NASA API
let METEOR_DATABASE = {
  'custom': { name: 'Custom Meteor', diameter: 0.3, density: 3000, velocity: 17, description: 'User-defined parameters' }
};

// Loading state
let isLoadingMeteors = false;

// Fetch asteroids from NASA NEO API
async function fetchAsteroidsFromNASA() {
  if (isLoadingMeteors) return;
  
  isLoadingMeteors = true;
  updateMeteorSelectorLoading(true);
  
  try {
    console.log('Fetching asteroids from NASA NEO API...');
    const requestUrl = `${NASA_API_URL}?api_key=${NASA_API_KEY}`;
    const requestOptions = {
      method: 'GET',
      // Avoid custom headers to prevent CORS preflight
      // mode defaults to 'cors' for cross-origin; no need to set explicitly
    };
    console.log('[NASA API] Request attempt', {
      url: requestUrl,
      options: requestOptions,
      time: new Date().toISOString()
    });
    
    const response = await fetch(requestUrl, requestOptions);
    
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('NASA API error response:', errorText);
      
      if (response.status === 429) {
        throw new Error('NASA API rate limit exceeded. DEMO_KEY has strict limits. Please try again later or get a personal API key from api.nasa.gov');
      } else if (response.status === 403) {
        throw new Error('NASA API access forbidden. The API key may be invalid or expired.');
      } else {
        throw new Error(`NASA API error: ${response.status} ${response.statusText} - ${errorText}`);
      }
    }
    
    const data = await response.json();
    console.log('NASA API response structure:', {
      hasNearEarthObjects: !!data.near_earth_objects,
      nearEarthObjectsLength: data.near_earth_objects?.length || 0,
      keys: Object.keys(data)
    });
    
    // Process the asteroid data
    const asteroids = data.near_earth_objects || [];
    console.log('Raw asteroids data (first 3):', asteroids.slice(0, 3));
    
    if (asteroids.length === 0) {
      throw new Error('No asteroids found in NASA API response');
    }
    
    const processedAsteroids = processAsteroidData(asteroids);
    
    // Update the meteor database
    METEOR_DATABASE = {
      'custom': { name: 'Custom Meteor', diameter: 0.3, density: 3000, velocity: 17, description: 'User-defined parameters' },
      ...processedAsteroids
    };
    
  // Update the UI
  updateMeteorSelector();
  console.log('Successfully loaded', Object.keys(processedAsteroids).length, 'asteroids from NASA');
  
  // Hide retry button on success
  const retryRow = document.getElementById('retryRow');
  if (retryRow) {
    retryRow.style.display = 'none';
  }
  
  // Update description to show success
  const descriptionElement = document.getElementById('meteorDescription');
  if (descriptionElement) {
    descriptionElement.textContent = `Loaded ${Object.keys(processedAsteroids).length} asteroids from NASA`;
  }
    
  } catch (error) {
    console.error('Error fetching asteroids from NASA:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    // Show error message instead of fallback data
    loadFallbackAsteroids();
    
    // Update description to show error
    const descriptionElement = document.getElementById('meteorDescription');
    if (descriptionElement) {
      descriptionElement.textContent = `NASA API Error: ${error.message}`;
    }
  } finally {
    isLoadingMeteors = false;
    updateMeteorSelectorLoading(false);
  }
}

// Process raw NASA asteroid data into our format
function processAsteroidData(asteroids) {
  const processed = {};
  
  console.log('Processing', asteroids.length, 'asteroids from NASA');
  
  // Take first 10 asteroids for the selector
  const selectedAsteroids = asteroids.slice(0, 10);
  
  selectedAsteroids.forEach((asteroid, index) => {
    const id = `asteroid-${index}`;
    const name = asteroid.name || `Asteroid ${index + 1}`;
    
    console.log(`Processing asteroid ${index + 1}:`, name);
    
    // Extract diameter from estimated_diameter (use average of min/max)
    let diameter = 0.1; // Default fallback
    if (asteroid.estimated_diameter && asteroid.estimated_diameter.kilometers) {
      const min = asteroid.estimated_diameter.kilometers.estimated_diameter_min;
      const max = asteroid.estimated_diameter.kilometers.estimated_diameter_max;
      diameter = (min + max) / 2;
      console.log(`  Diameter: ${min}-${max} km, average: ${diameter} km`);
    }
    
    // Estimate density based on orbit class hint (simplified) — handle NASA schema where orbit_class is an object
    let density = 3000; // Default stony
    let orbitClassReadable = '';
    if (asteroid.orbital_data && asteroid.orbital_data.orbit_class) {
      const oc = asteroid.orbital_data.orbit_class;
      const ocString = typeof oc === 'string' ? oc : (oc.orbit_class_type || oc.orbit_class_description || '');
      const orbitClass = (ocString || '').toLowerCase();
      if (orbitClass.includes('metal') || orbitClass.includes('m-type')) density = 5000;
      else if (orbitClass.includes('carbon') || orbitClass.includes('c-type')) density = 2000;
      else if (orbitClass.includes('comet')) density = 1000;
      orbitClassReadable = ocString || '';
      console.log(`  Orbit class: ${ocString}, density: ${density}`);
    }
    
    // Calculate velocity from orbital data (simplified)
    let velocity = 17; // Default km/s
    if (asteroid.close_approach_data && asteroid.close_approach_data.length > 0) {
      const approach = asteroid.close_approach_data[0];
      if (approach.relative_velocity && approach.relative_velocity.kilometers_per_second) {
        velocity = parseFloat(approach.relative_velocity.kilometers_per_second);
        console.log(`  Velocity: ${velocity} km/s`);
      }
    }
    
    // Create description
    let description = `NASA NEO ID: ${asteroid.id}`;
    if (orbitClassReadable) {
      description += `, Class: ${orbitClassReadable}`;
    }
    if (asteroid.is_potentially_hazardous_asteroid) {
      description += ', Potentially Hazardous';
    }
    
    const processedAsteroid = {
      name: name,
      diameter: Math.max(0.001, diameter), // Ensure minimum size
      density: Math.max(1000, Math.min(8000, density)), // Reasonable range
      velocity: Math.max(5, Math.min(50, velocity)), // Reasonable range
      description: description,
      nasaId: asteroid.id,
      isHazardous: asteroid.is_potentially_hazardous_asteroid || false
    };
    
    processed[id] = processedAsteroid;
    console.log(`  Final processed data:`, processedAsteroid);
  });
  
  console.log('Processed asteroids:', Object.keys(processed));
  return processed;
}

// Fallback asteroids if NASA API fails
function loadFallbackAsteroids() {
  console.log('NASA API failed, loading sample asteroids...');
  
  // Load sample asteroids when NASA API fails
  METEOR_DATABASE = {
    'custom': { name: 'Custom Meteor', diameter: 0.3, density: 3000, velocity: 17, description: 'User-defined parameters' },
    'apophis': { name: 'Apophis (99942)', diameter: 0.33, density: 2600, velocity: 12.6, description: 'Potentially hazardous asteroid, 2029 close approach', isHazardous: true },
    'bennu': { name: 'Bennu (101955)', diameter: 0.5, density: 1200, velocity: 12.4, description: 'OSIRIS-REx target, carbonaceous asteroid' },
    'ryugu': { name: 'Ryugu (162173)', diameter: 0.9, density: 1200, velocity: 11.8, description: 'Hayabusa2 target, diamond-shaped asteroid' },
    'itokawa': { name: 'Itokawa (25143)', diameter: 0.3, density: 1900, velocity: 13.2, description: 'Hayabusa target, rubble pile asteroid' },
    'eros': { name: 'Eros (433)', diameter: 16.8, density: 2700, velocity: 5.3, description: 'First asteroid orbited by spacecraft' },
    'ceres': { name: 'Ceres (1)', diameter: 950, density: 2100, velocity: 17.9, description: 'Largest asteroid, dwarf planet' },
    'vesta': { name: 'Vesta (4)', diameter: 525, density: 3400, velocity: 19.3, description: 'Second largest asteroid, metallic' },
    'chicxulub': { name: 'Chicxulub Impactor', diameter: 10, density: 3000, velocity: 20, description: 'Dinosaur extinction event (estimated)' },
    'tunguska': { name: 'Tunguska Event', diameter: 0.05, density: 2000, velocity: 15, description: '1908 Siberian airburst (estimated)' }
  };
  
  // Update selector with sample data
  updateMeteorSelector();
  
  // Show retry button
  const retryRow = document.getElementById('retryRow');
  if (retryRow) {
    retryRow.style.display = 'block';
  }
}

// Update meteor selector dropdown
function updateMeteorSelector() {
  const selector = document.getElementById('meteorSelect');
  if (!selector) return;
  
  console.log('Updating meteor selector with', Object.keys(METEOR_DATABASE).length, 'asteroids');
  
  // Clear existing options except custom
  selector.innerHTML = '<option value="custom">Custom</option>';
  
  // Add asteroids from database
  Object.entries(METEOR_DATABASE).forEach(([id, asteroid]) => {
    if (id === 'custom') return; // Skip custom as it's already added
    
    const option = document.createElement('option');
    option.value = id;
    // Show only the asteroid name per request
    option.textContent = `${asteroid.name}`;
    selector.appendChild(option);
    console.log(`Added option: ${option.textContent}`);
  });
  
  console.log('Meteor selector updated with', selector.options.length, 'options');
}

// Update loading state of meteor selector
function updateMeteorSelectorLoading(loading) {
  const selector = document.getElementById('meteorSelect');
  if (!selector) return;
  
  if (loading) {
    selector.disabled = true;
    selector.innerHTML = '<option value="">Loading asteroids...</option>';
  } else {
    selector.disabled = false;
  }
}

// Retry NASA API call with delay to avoid rate limits
function retryNASAAPI() {
  console.log('Retrying NASA API call in 5 seconds to avoid rate limits...');
  
  // Disable retry button temporarily
  const retryBtn = document.getElementById('retryNASA');
  if (retryBtn) {
    retryBtn.disabled = true;
    retryBtn.textContent = '⏳ Retrying in 5s...';
  }
  
  // Wait 5 seconds before retrying
  setTimeout(() => {
    console.log('[NASA API] Retrying request now...', { time: new Date().toISOString() });
    fetchAsteroidsFromNASA();
    
    // Re-enable retry button
    if (retryBtn) {
      retryBtn.disabled = false;
      retryBtn.textContent = '🔄 Retry NASA API';
    }
  }, 5000);
}

// Simplified land/sea detection based on latitude and longitude
function isLand(lat, lon) {
  // This is a simplified model - in reality you'd use actual elevation data
  // For now, we'll use a basic pattern that roughly matches Earth's land distribution
  
  // Major landmasses (very simplified)
  const landPatterns = [
    // North America
    { latMin: 15, latMax: 70, lonMin: -170, lonMax: -50 },
    // South America  
    { latMin: -55, latMax: 15, lonMin: -85, lonMax: -30 },
    // Europe/Asia
    { latMin: 35, latMax: 75, lonMin: -25, lonMax: 180 },
    // Africa
    { latMin: -35, latMax: 35, lonMin: -20, lonMax: 55 },
    // Australia
    { latMin: -45, latMax: -10, lonMin: 110, lonMax: 155 },
    // Antarctica
    { latMin: -90, latMax: -60, lonMin: -180, lonMax: 180 }
  ];
  
  return landPatterns.some(pattern => 
    lat >= pattern.latMin && lat <= pattern.latMax && 
    lon >= pattern.lonMin && lon <= pattern.lonMax
  );
}

// Calculate wave propagation considering geography
function calculateGeographicWaveDirection(impactLat, impactLon, direction, distance, isLandImpact) {
  const steps = 8; // Number of steps to check along the wave path
  const stepDistance = distance / steps;
  
  let currentLat = impactLat;
  let currentLon = impactLon;
  let totalRefraction = 0;
  let landSeaTransitions = 0;
  
  for (let i = 0; i < steps; i++) {
    // Move along the wave direction
    const bearing = Math.atan2(direction.z, direction.x) * 180 / Math.PI;
    const nextPoint = destinationPoint(currentLat, currentLon, bearing, stepDistance);
    
    const wasLand = isLand(currentLat, currentLon);
    const isLandNow = isLand(nextPoint.lat, nextPoint.lon);
    
    // Count land-sea transitions (affects wave behavior)
    if (wasLand !== isLandNow) {
      landSeaTransitions++;
    }
    
    // Apply refraction at boundaries
    if (wasLand !== isLandNow) {
      // Waves slow down in shallow water near land
      totalRefraction += isLandNow ? 0.1 : -0.05;
    }
    
    currentLat = nextPoint.lat;
    currentLon = nextPoint.lon;
  }
  
  // Adjust wave properties based on geography
  const geographicFactor = {
    landSeaTransitions: landSeaTransitions,
    refraction: totalRefraction,
    isLandImpact: isLandImpact,
    finalIsLand: isLand(currentLat, currentLon)
  };
  
  return geographicFactor;
}

// Enhanced wave direction calculation with geography
function calculateGeographicWaveDirections(impactLat, impactLon, impactAngle, waveCount, waveLength) {
  const isLandImpact = isLand(impactLat, impactLon);
  const impactPos = latLonToVector3(impactLat, impactLon, 1.003);
  const impactAngleRad = THREE.MathUtils.degToRad(impactAngle);
  
  const waveDirections = [];
  
  for (let i = 0; i < waveCount; i++) {
    const angle = (i / waveCount) * Math.PI * 2;
    
    // Basic radial direction
    const baseDirection = new THREE.Vector3(
      Math.cos(angle),
      0,
      Math.sin(angle)
    );
    
    // Project onto Earth surface
    const impactNormal = impactPos.clone().normalize();
    const waveDirection = baseDirection.clone().sub(
      impactNormal.clone().multiplyScalar(baseDirection.dot(impactNormal))
    ).normalize();
    
    // Calculate geographic effects
    const geoEffects = calculateGeographicWaveDirection(
      impactLat, impactLon, waveDirection, waveLength, isLandImpact
    );
    
    // Adjust wave properties based on geography
    let adjustedLength = waveLength;
    let waveIntensity = 1.0;
    let waveColor = 0xff0000; // Base red color
    
    // Land impacts create different wave patterns
    if (isLandImpact) {
      // Land impacts: more focused, less spread
      adjustedLength *= 0.8;
      waveIntensity *= 1.2;
      waveColor = 0xff4400; // Orange-red for land
    } else {
      // Ocean impacts: more spread, tsunami effects
      adjustedLength *= 1.2;
      waveIntensity *= 0.9;
      waveColor = 0xff0000; // Bright red for ocean
    }
    
    // Land-sea transitions affect wave behavior
    if (geoEffects.landSeaTransitions > 0) {
      adjustedLength *= (1 + geoEffects.landSeaTransitions * 0.1);
      waveColor = 0xff2200; // Darker red for complex terrain
    }
    
    // Impact angle influence
    const angleInfluence = Math.sin(impactAngleRad) * 0.3 + 0.7;
    adjustedLength *= angleInfluence;
    
    // Directional bias based on impact angle
    const impactInfluence = Math.cos(angle - impactAngleRad) * 0.4 + 0.6;
    adjustedLength *= impactInfluence;
    
    waveDirections.push({
      direction: waveDirection,
      length: adjustedLength,
      intensity: waveIntensity,
      color: waveColor,
      geographicEffects: geoEffects
    });
  }
  
  return waveDirections;
}

function greatCirclePoints(latDeg, lonDeg, radiusKm, segments = 256) {
  const R = 6371; // km
  const d = radiusKm / R; // angular distance in radians
  const lat = THREE.MathUtils.degToRad(latDeg);
  const lon = THREE.MathUtils.degToRad(lonDeg);
  const verts = [];
  for (let i = 0; i <= segments; i++) {
    const brg = (i / segments) * Math.PI * 2.0; // bearing
    const lat2 = Math.asin(Math.sin(lat) * Math.cos(d) + Math.cos(lat) * Math.sin(d) * Math.cos(brg));
    const lon2 = lon + Math.atan2(Math.sin(brg) * Math.sin(d) * Math.cos(lat), Math.cos(d) - Math.sin(lat) * Math.sin(lat2));
    const x = Math.cos(lat2) * Math.cos(lon2);
    const y = Math.sin(lat2);
    const z = Math.cos(lat2) * Math.sin(lon2);
    verts.push(x, y, z);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
  return geo;
}

function updateImpactCircle(craterKm) {
  const lat = parseFloat(ui.latitude.value);
  const lon = parseFloat(ui.longitude.value);
  
  // Constrain crater size to reasonable limits
  const constrainedCraterKm = Math.max(0.1, Math.min(1000, craterKm));
  
  // Calculate damage radius with constraints
  const radiusKm = Math.max(1, Math.min(5000, constrainedCraterKm * 15)); // Constrained damage radius
  
  const geo = greatCirclePoints(lat, lon, radiusKm);
  if (impactCircle) earthGroup.remove(impactCircle);
  impactCircle = new THREE.LineLoop(
    geo,
    new THREE.LineBasicMaterial({ color: 0xffaa33, linewidth: 2 })
  );
  impactCircle.scale.setScalar(1.003);
  earthGroup.add(impactCircle);
}

// Create a 3D arrow for wave direction visualization
function createWaveArrow(startPos, direction, length, color = 0xff0000) {
  const arrowGeometry = new THREE.ConeGeometry(0.008, 0.03, 8);
  const arrowMaterial = new THREE.MeshBasicMaterial({ color: color, transparent: true, opacity: 0.8 });
  const arrow = new THREE.Mesh(arrowGeometry, arrowMaterial);
  
  // Position arrow at start point
  arrow.position.copy(startPos);
  
  // Orient arrow in the direction of wave propagation
  const targetPos = startPos.clone().add(direction.clone().multiplyScalar(length));
  arrow.lookAt(targetPos);
  
  // Create a line to show the wave direction
  const lineGeometry = new THREE.BufferGeometry().setFromPoints([startPos, targetPos]);
  const lineMaterial = new THREE.LineBasicMaterial({ color: color, transparent: true, opacity: 0.6, linewidth: 2 });
  const line = new THREE.Line(lineGeometry, lineMaterial);
  
  return { arrow, line };
}

// Update wave direction arrows based on impact parameters with geography
function updateWaveArrows() {
  // Clear existing wave arrows
  if (waveArrowsGroup) {
    earthGroup.remove(waveArrowsGroup);
  }
  
  if (!ui.showWaves.checked) {
    waveArrowsGroup = null;
    return;
  }
  
  const lat = parseFloat(ui.latitude.value);
  const lon = parseFloat(ui.longitude.value);
  const impactAngle = parseFloat(ui.impactAngle.value);
  const waveCount = 16; // Fixed number of arrows
  const waveLength = 0.08; // Fixed wave length in Earth radius units (~500 km)
  
  // Calculate impact point on Earth surface
  const impactPos = latLonToVector3(lat, lon, 1.003);
  
  // Create group for all wave arrows
  waveArrowsGroup = new THREE.Group();
  waveArrows = [];
  
  // Use the new geographic wave calculation system
  const waveDirections = calculateGeographicWaveDirections(lat, lon, impactAngle, waveCount, waveLength);
  
  // Create arrows based on geographic analysis
  waveDirections.forEach((waveData, index) => {
    // Create arrow slightly offset from Earth surface
    const arrowStartPos = impactPos.clone().add(waveData.direction.clone().multiplyScalar(0.02));
    
    // Create the wave arrow with geographic-aware properties
    const waveArrow = createWaveArrow(
      arrowStartPos, 
      waveData.direction, 
      waveData.length, 
      waveData.color
    );
    
    // Apply intensity scaling to the arrow
    waveArrow.arrow.scale.multiplyScalar(waveData.intensity);
    waveArrow.arrow.material.opacity *= waveData.intensity;
    waveArrow.line.material.opacity *= waveData.intensity * 0.6;
    
    waveArrowsGroup.add(waveArrow.arrow);
    waveArrowsGroup.add(waveArrow.line);
    waveArrows.push(waveArrow);
  });
  
  earthGroup.add(waveArrowsGroup);
}

// Deflected impact visuals
const deflectedMarker = new THREE.Mesh(
  new THREE.SphereGeometry(0.012, 16, 16),
  new THREE.MeshBasicMaterial({ color: 0x33dd66 })
);
deflectedMarker.visible = false;
earthGroup.add(deflectedMarker);

let deflectedCircle;
let corridorLine;

function destinationPoint(latDeg, lonDeg, bearingDeg, distanceKm) {
  const R = 6371; // km
  const brg = THREE.MathUtils.degToRad(bearingDeg);
  const dR = distanceKm / R;
  const lat1 = THREE.MathUtils.degToRad(latDeg);
  const lon1 = THREE.MathUtils.degToRad(lonDeg);
  const lat2 = Math.asin(Math.sin(lat1) * Math.cos(dR) + Math.cos(lat1) * Math.sin(dR) * Math.cos(brg));
  const lon2 = lon1 + Math.atan2(Math.sin(brg) * Math.sin(dR) * Math.cos(lat1), Math.cos(dR) - Math.sin(lat1) * Math.sin(lat2));
  return { lat: THREE.MathUtils.radToDeg(lat2), lon: THREE.MathUtils.radToDeg(lon2) };
}

function drawCorridor(lat1, lon1, lat2, lon2, segments = 256) {
  // Great-circle line between two points
  const φ1 = THREE.MathUtils.degToRad(lat1);
  const λ1 = THREE.MathUtils.degToRad(lon1);
  const φ2 = THREE.MathUtils.degToRad(lat2);
  const λ2 = THREE.MathUtils.degToRad(lon2);
  const Δ = 2 * Math.asin(Math.sqrt(Math.sin((φ2 - φ1) / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin((λ2 - λ1) / 2) ** 2));
  const verts = [];
  if (Δ === 0) return null;
  for (let i = 0; i <= segments; i++) {
    const f = i / segments;
    const A = Math.sin((1 - f) * Δ) / Math.sin(Δ);
    const B = Math.sin(f * Δ) / Math.sin(Δ);
    const x = A * Math.cos(φ1) * Math.cos(λ1) + B * Math.cos(φ2) * Math.cos(λ2);
    const y = A * Math.sin(φ1) + B * Math.sin(φ2);
    const z = A * Math.cos(φ1) * Math.sin(λ1) + B * Math.cos(φ2) * Math.sin(λ2);
    verts.push(x, y, z);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
  return new THREE.Line(
    geo,
    new THREE.LineBasicMaterial({ color: 0x66ccff, linewidth: 2 })
  );
}

function latLonToVector3(latDeg, lonDeg, radius = 1.0) {
  const lat = THREE.MathUtils.degToRad(latDeg);
  const lon = THREE.MathUtils.degToRad(lonDeg);
  const x = radius * Math.cos(lat) * Math.cos(lon);
  const y = radius * Math.sin(lat);
  const z = radius * Math.cos(lat) * Math.sin(lon);
  return new THREE.Vector3(x, y, z);
}

function updateImpactMarker() {
  const lat = parseFloat(ui.latitude.value);
  const lon = parseFloat(ui.longitude.value);
  const pos = latLonToVector3(lat, lon, 1.003);
  impactMarker.position.copy(pos);
  impactMarker.visible = true;
}

function runSimulation() {
  const diameterKm = parseFloat(ui.diameterKm.value);
  const density = parseFloat(ui.density.value);
  const velocity = parseFloat(ui.velocity.value);
  const deltaVms = parseFloat(ui.deltaV.value);
  const leadTimeDays = parseFloat(ui.leadTimeDays.value || '0');
  const bearingDeg = parseFloat(ui.bearingDeg.value || '0');
  const lat = parseFloat(ui.latitude.value);
  const lon = parseFloat(ui.longitude.value);
  const mass = estimateMass(diameterKm, density);
  const energy = estimateImpactEnergy(mass, velocity);
  const craterKm = estimateCraterDiameterKm(energy);
  const craterDepthKm = estimateCraterDepthKm(craterKm, impactAngle);

  ui.massOut.textContent = Math.round(mass).toLocaleString();
  ui.energyOut.textContent = energy.toExponential(3);
  ui.tntOut.textContent = joulesToMegatons(energy).toFixed(2);
  ui.craterOut.textContent = craterKm.toFixed(2);
  ui.craterDepthOut.textContent = craterDepthKm.toFixed(2);

  updateImpactMarker();
  updateImpactCircle(craterKm);
  updateWaveArrows();
  updateAsteroidSize();
  
  // Create crater if impact energy is sufficient
  console.log(`Crater check: diameter=${craterKm}km, depth=${craterDepthKm}km, lat=${lat}, lon=${lon}`);
  if (craterKm > 0.01) { // Lower threshold for testing - create crater for any significant impact
    console.log('Creating crater...');
    createCrater(craterKm, craterDepthKm, lat, lon);
  } else {
    console.log('Crater too small, not creating');
  }
  
  // Update geographic information display
  const isLandImpact = isLand(lat, lon);
  
  ui.impactLocationOut.textContent = isLandImpact ? 'Land Impact' : 'Ocean Impact';
  ui.waveTypeOut.textContent = isLandImpact ? 'Seismic Waves' : 'Tsunami Waves';

  // Improved deflection model
  const seconds = Math.max(0, leadTimeDays) * 86400;
  
  // Calculate deflection based on orbital mechanics
  // For a simple model: deflection = Δv * time * sin(angle)
  const impactAngleRad = THREE.MathUtils.degToRad(impactAngle);
  const deflectionFactor = Math.sin(impactAngleRad); // Shallow angles deflect more
  
  // More realistic deflection calculation
  const shiftKm = (deltaVms * seconds * deflectionFactor) / 1000; // km
  ui.deflectShiftOut.textContent = shiftKm.toFixed(1);

  // Determine if miss: need significant deflection
  const requiredMissKm = 1000; // More realistic threshold (1000 km)
  const missProbability = Math.min(1, shiftKm / requiredMissKm);
  
  let outcomeText;
  if (missProbability >= 1) {
    outcomeText = 'MISS - Deflection Successful';
  } else if (missProbability >= 0.7) {
    outcomeText = 'Likely Miss';
  } else if (missProbability >= 0.3) {
    outcomeText = 'Partial Deflection';
  } else {
    outcomeText = 'Impact Likely';
  }
  
  ui.missStatusOut.textContent = outcomeText;

  // Required Δv for specified miss distance at given lead time
  const dvReq = seconds > 0 ? (requiredMissKm * 1000) / (seconds * deflectionFactor) : Infinity;
  ui.dvReqOut.textContent = isFinite(dvReq) ? dvReq.toFixed(1) : '—';

  // Deflected impact point visualization (bearing from original)
  const baseLat = parseFloat(ui.latitude.value);
  const baseLon = parseFloat(ui.longitude.value);
  if (shiftKm > 0) {
    const dest = destinationPoint(baseLat, baseLon, bearingDeg, shiftKm);
    const defPos = latLonToVector3(dest.lat, dest.lon, 1.003);
    deflectedMarker.position.copy(defPos);
    deflectedMarker.visible = true;
    // circle
    const defGeo = greatCirclePoints(dest.lat, dest.lon, Math.max(5, craterKm * 15));
    if (deflectedCircle) earthGroup.remove(deflectedCircle);
    deflectedCircle = new THREE.LineLoop(
      defGeo,
      new THREE.LineBasicMaterial({ color: 0x55ff88, linewidth: 2 })
    );
    deflectedCircle.scale.setScalar(1.003);
    earthGroup.add(deflectedCircle);
    // corridor
    if (corridorLine) earthGroup.remove(corridorLine);
    corridorLine = drawCorridor(baseLat, baseLon, dest.lat, dest.lon);
    if (corridorLine) {
      corridorLine.scale.setScalar(1.003);
      earthGroup.add(corridorLine);
    }
  } else {
    deflectedMarker.visible = false;
    if (deflectedCircle) { earthGroup.remove(deflectedCircle); deflectedCircle = null; }
    if (corridorLine) { earthGroup.remove(corridorLine); corridorLine = null; }
  }
}

// Asteroid size visualization
let asteroidSizeMarker;

function updateAsteroidSize() {
  const diameterKm = parseFloat(ui.diameterKm.value);
  const lat = parseFloat(ui.latitude.value);
  const lon = parseFloat(ui.longitude.value);
  
  // Remove existing size marker
  if (asteroidSizeMarker) {
    earthGroup.remove(asteroidSizeMarker);
  }
  
  // Create size marker based on diameter
  const sizeScale = Math.max(0.01, Math.min(0.1, diameterKm / 10)); // Scale between 0.01 and 0.1
  const asteroidGeometry = new THREE.IcosahedronGeometry(sizeScale, 2);
  const asteroidMaterial = new THREE.MeshBasicMaterial({ 
    color: 0xffaa44, 
    transparent: true, 
    opacity: 0.8,
    wireframe: true
  });
  
  asteroidSizeMarker = new THREE.Mesh(asteroidGeometry, asteroidMaterial);
  
  // Position near the impact point
  const impactPos = latLonToVector3(lat, lon, 1.1); // Slightly above surface
  asteroidSizeMarker.position.copy(impactPos);
  
  earthGroup.add(asteroidSizeMarker);
}

// Crater visualization system
let craterMesh;
let craterGroup;

function createCrater(craterDiameterKm, craterDepthKm, lat, lon) {
  // Remove existing crater
  if (craterGroup) {
    earthGroup.remove(craterGroup);
  }
  
  craterGroup = new THREE.Group();
  
  // Convert km to Earth radius units - make crater more visible
  const craterRadius = Math.max(0.01, (craterDiameterKm / 2) / 6371); // Minimum visible size
  const craterDepth = Math.max(0.005, craterDepthKm / 6371); // Minimum visible depth
  
  console.log(`Creating crater: diameter=${craterDiameterKm}km, depth=${craterDepthKm}km, radius=${craterRadius}, depth=${craterDepth}`);
  
  // Create crater geometry - a depression in the sphere
  const segments = 32;
  const craterGeometry = new THREE.CylinderGeometry(
    craterRadius * 0.3, // Bottom radius (smaller)
    craterRadius,       // Top radius
    craterDepth,        // Height (depth)
    segments
  );
  
  // Create crater material - make it more visible
  const craterMaterial = new THREE.MeshLambertMaterial({
    color: 0x8B4513, // Brown/dark color for crater
    transparent: true,
    opacity: 0.95,
    side: THREE.DoubleSide
  });
  
  craterMesh = new THREE.Mesh(craterGeometry, craterMaterial);
  
  // Position crater at impact location - slightly above surface
  const impactPos = latLonToVector3(lat, lon, 1.01);
  craterMesh.position.copy(impactPos);
  
  // Orient crater to be perpendicular to Earth's surface
  craterMesh.lookAt(impactPos.clone().multiplyScalar(2));
  craterMesh.rotation.x += Math.PI / 2; // Rotate to be perpendicular
  
  // Create crater rim (elevated ring around crater)
  const rimGeometry = new THREE.TorusGeometry(
    craterRadius * 1.5, // Outer radius
    craterRadius * 0.2, // Tube radius
    8, 16
  );
  
  const rimMaterial = new THREE.MeshLambertMaterial({
    color: 0x654321, // Darker brown for rim
    transparent: true,
    opacity: 0.9
  });
  
  const craterRim = new THREE.Mesh(rimGeometry, rimMaterial);
  craterRim.position.copy(impactPos);
  craterRim.lookAt(impactPos.clone().multiplyScalar(2));
  craterRim.rotation.x += Math.PI / 2;
  
  // Add debris field around crater
  const debrisCount = Math.min(20, Math.floor(craterDiameterKm / 5));
  for (let i = 0; i < debrisCount; i++) {
    const debrisGeometry = new THREE.SphereGeometry(
      Math.random() * craterRadius * 0.1 + craterRadius * 0.02,
      4, 4
    );
    
    const debrisMaterial = new THREE.MeshLambertMaterial({
      color: new THREE.Color().setHSL(0.1, 0.3, 0.2 + Math.random() * 0.3),
      transparent: true,
      opacity: 0.8
    });
    
    const debris = new THREE.Mesh(debrisGeometry, debrisMaterial);
    
    // Random position around crater
    const angle = Math.random() * Math.PI * 2;
    const distance = craterRadius * (0.8 + Math.random() * 2);
    const debrisPos = new THREE.Vector3(
      Math.cos(angle) * distance,
      Math.random() * craterRadius * 0.2,
      Math.sin(angle) * distance
    );
    
    debris.position.copy(impactPos.clone().add(debrisPos));
    craterGroup.add(debris);
  }
  
  craterGroup.add(craterMesh);
  craterGroup.add(craterRim);
  earthGroup.add(craterGroup);
  
  console.log('Crater created and added to scene');
}


// Load meteor data from database
function loadMeteorData(meteorId) {
  // If user selected custom, leave fields blank and skip simulation
  if (meteorId === 'custom') {
    const descriptionElement = document.getElementById('meteorDescription');
    if (descriptionElement) {
      descriptionElement.textContent = 'User-defined parameters';
    }
    ui.diameterKm.value = '';
    ui.density.value = '';
    ui.velocity.value = '';
    return;
  }

  const meteor = METEOR_DATABASE[meteorId];
  if (!meteor) return;

  console.log(`Loading meteor: ${meteor.name}`);

  // Update UI with meteor data
  ui.diameterKm.value = meteor.diameter;
  ui.density.value = meteor.density;
  ui.velocity.value = meteor.velocity;

  // Update meteor description in UI (we'll add this to HTML)
  const descriptionElement = document.getElementById('meteorDescription');
  if (descriptionElement) {
    descriptionElement.textContent = meteor.description;
  }

  // Run simulation with new data
  runSimulation();
}

function resetEarth() {
  // Remove all impact-related visuals
  if (craterGroup) {
    earthGroup.remove(craterGroup);
    craterGroup = null;
  }
  
  if (impactCircle) {
    earthGroup.remove(impactCircle);
    impactCircle = null;
  }
  
  if (waveArrowsGroup) {
    earthGroup.remove(waveArrowsGroup);
    waveArrowsGroup = null;
    waveArrows = [];
  }
  
  if (deflectedMarker) {
    deflectedMarker.visible = false;
  }
  
  if (deflectedCircle) {
    earthGroup.remove(deflectedCircle);
    deflectedCircle = null;
  }
  
  if (corridorLine) {
    earthGroup.remove(corridorLine);
    corridorLine = null;
  }
  
  // Reset impact marker
  impactMarker.visible = false;
  
  // Reset asteroid size marker
  if (asteroidSizeMarker) {
    earthGroup.remove(asteroidSizeMarker);
    asteroidSizeMarker = null;
  }
}

if (ui.resetBtn) {
  ui.resetBtn.addEventListener('click', resetEarth);
}

if (ui.meteorSelect) {
  ui.meteorSelect.addEventListener('change', (e) => {
    loadMeteorData(e.target.value);
  });
}

if (ui.retryNASA) {
  ui.retryNASA.addEventListener('click', retryNASAAPI);
}

// Collapsible UI functionality
if (ui.toggleUI) {
  ui.toggleUI.addEventListener('click', () => {
    const ui = document.getElementById('ui');
    const toggleBtn = document.getElementById('toggleUI');
    
    ui.classList.toggle('collapsed');
    
    if (ui.classList.contains('collapsed')) {
      toggleBtn.textContent = '>';
      toggleBtn.title = 'Expand UI';
    } else {
      toggleBtn.textContent = '<';
      toggleBtn.title = 'Collapse UI';
    }
    // Reposition toggle alongside sidebar width
    positionOutsideToggle();
  });
}

// Position the outside toggle button so it hugs the sidebar edge
function positionOutsideToggle() {
  const panel = document.getElementById('ui');
  const btn = document.getElementById('toggleUI');
  if (!panel || !btn) return;
  const rect = panel.getBoundingClientRect();
  const gap = 12; // spacing between sidebar and toggle button
  btn.style.left = (rect.left + rect.width + gap) + 'px';
  btn.style.top = rect.top + 'px';
}

// Toggle responsive classes on the UI panel based on its width
function updateUIPanelResponsive() {
	const panel = document.getElementById('ui');
	if (!panel) return;
	const rect = panel.getBoundingClientRect();
	const w = rect.width;
	// Compact at very narrow widths; otherwise default layout
	if (w <= 280) {
		panel.classList.add('compact');
	} else {
		panel.classList.remove('compact');
	}
}

// Initialize outside toggle position and arrow state
positionOutsideToggle();
if (ui.toggleUI) {
  const panel = document.getElementById('ui');
  ui.toggleUI.textContent = panel.classList.contains('collapsed') ? '>' : '<';
}
// Initialize responsive class based on initial width
updateUIPanelResponsive();

// Input validation function
function validateInputs() {
  // Validate diameter
  const diameter = parseFloat(ui.diameterKm.value);
  if (diameter < 0.001) ui.diameterKm.value = 0.001;
  if (diameter > 100) ui.diameterKm.value = 100;
  
  // Validate density
  const density = parseFloat(ui.density.value);
  if (density < 100) ui.density.value = 100;
  if (density > 20000) ui.density.value = 20000;
  
  // Validate velocity
  const velocity = parseFloat(ui.velocity.value);
  if (velocity < 1) ui.velocity.value = 1;
  if (velocity > 100) ui.velocity.value = 100;
  
  // Validate impact angle
  const impactAngle = parseFloat(ui.impactAngle.value);
  if (impactAngle < 1) ui.impactAngle.value = 1;
  if (impactAngle > 89) ui.impactAngle.value = 89;
  
  
  // Validate delta V
  const deltaV = parseFloat(ui.deltaV.value);
  if (deltaV < 0) ui.deltaV.value = 0;
  if (deltaV > 10000) ui.deltaV.value = 10000;
  
  // Validate lead time
  const leadTime = parseInt(ui.leadTimeDays.value);
  if (leadTime < 1) ui.leadTimeDays.value = 1;
  if (leadTime > 10000) ui.leadTimeDays.value = 10000;
  
  // Validate bearing
  const bearing = parseInt(ui.bearingDeg.value);
  if (bearing < 0) ui.bearingDeg.value = 0;
  if (bearing > 359) ui.bearingDeg.value = 359;
}

// Make inputs reactive for immediate feedback
['diameterKm','density','velocity','latitude','longitude','impactAngle','showWaves','deltaV','leadTimeDays','bearingDeg']
  .forEach(id => {
    const el = ui[id];
    if (el) {
      el.addEventListener('input', () => {
        // Reset meteor selector to custom when user changes parameters
        if (ui.meteorSelect && ui.meteorSelect.value !== 'custom') {
          ui.meteorSelect.value = 'custom';
        }
        validateInputs();
        runSimulation();
      });
    }
  });

// Click-to-set impact location
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
function onPointerDown(event) {
  const rect = renderer.domElement.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  const intersects = raycaster.intersectObject(earthMesh, true);
  if (intersects && intersects.length) {
    const hit = intersects[0].point.clone(); // world space
    // convert to local earthGroup space
    const local = earthGroup.worldToLocal(hit);
    const v = local.clone().normalize();
    const lat = THREE.MathUtils.radToDeg(Math.asin(v.y));
    const lon = THREE.MathUtils.radToDeg(Math.atan2(v.z, v.x));
    ui.latitude.value = lat.toFixed(2);
    ui.longitude.value = lon.toFixed(2);
    runSimulation();
  }
}
renderer.domElement.addEventListener('pointerdown', onPointerDown);

// Animated approach visualization
const asteroid = new THREE.Mesh(
  new THREE.IcosahedronGeometry(0.02, 1),
  new THREE.MeshStandardMaterial({ color: 0xffcc66, roughness: 0.7, metalness: 0.1 })
);
asteroid.visible = false;
earthGroup.add(asteroid);

// New explosion effect system
function createNewExplosionEffect(impactX, impactY) {
  const container = ui.explosionContainer;
  container.innerHTML = '';
  
  // Create multiple expanding rings
  for (let i = 0; i < 3; i++) {
    const ring = document.createElement('div');
    ring.className = 'explosion-ring';
    ring.style.left = impactX + 'px';
    ring.style.top = impactY + 'px';
    ring.style.animationDelay = (i * 0.3) + 's';
    ring.style.borderColor = i === 0 ? '#ff6b6b' : i === 1 ? '#ffa500' : '#ffff00';
    container.appendChild(ring);
  }
  
  // Create particle burst
  for (let i = 0; i < 50; i++) {
    const particle = document.createElement('div');
    particle.className = 'explosion-particles';
    particle.style.left = impactX + 'px';
    particle.style.top = impactY + 'px';
    
    const angle = (Math.PI * 2 * i) / 50;
    const distance = 100 + Math.random() * 200;
    const dx = Math.cos(angle) * distance;
    const dy = Math.sin(angle) * distance;
    
    particle.style.setProperty('--dx', dx + 'px');
    particle.style.setProperty('--dy', dy + 'px');
    particle.style.animationDelay = (Math.random() * 0.5) + 's';
    
    container.appendChild(particle);
  }
  
  // Clean up after animation
  setTimeout(() => {
    container.innerHTML = '';
  }, 3000);
}

// Game state management
let gameState = {
  isPlaying: false,
  selectedMeteor: null,
  currentQuestion: null,
  selectedOption: null,
  timer: null,
  timeRemaining: 15,
  correctAnswer: null,
  gameActive: false,
	approachShouldMiss: false,
	// When true, skip showing end-of-game popup after approach animation
	suppressApproachOutcome: false
};

// Timer management
let gameTimerInterval = null;

// Correct answers for each meteor type (simplified scoring system)
const correctAnswers = {
  kinetic_impactor: ['small', 'medium'],
  gravity_tractor: ['large', 'hazardous'],
  nuclear_deflection: ['hazardous', 'large', 'urgent'],
  laser_ablation: ['small', 'medium'],
  solar_sail: ['small', 'non-hazardous'],
  mass_driver: ['medium', 'large']
};

// Randomize impact location
function randomizeImpactLocation() {
  // Generate random latitude and longitude
  const lat = (Math.random() - 0.5) * 180; // -90 to 90
  const lon = (Math.random() - 0.5) * 360; // -180 to 180
  
  ui.latitude.value = lat.toFixed(2);
  ui.longitude.value = lon.toFixed(2);
  
  console.log(`Randomized impact location: ${lat.toFixed(2)}°N, ${lon.toFixed(2)}°E`);
}

// Start game timer
function startGameTimer() {
  gameState.timeRemaining = 15;
  ui.gameTimer.style.display = 'block';
  ui.timerText.textContent = gameState.timeRemaining;
  
  gameTimerInterval = setInterval(() => {
    gameState.timeRemaining--;
    ui.timerText.textContent = gameState.timeRemaining;
    
    // Update timer appearance based on time remaining
    if (gameState.timeRemaining <= 5) {
      ui.gameTimer.className = 'game-timer critical';
    } else if (gameState.timeRemaining <= 10) {
      ui.gameTimer.className = 'game-timer warning';
    } else {
      ui.gameTimer.className = 'game-timer';
    }
    
    if (gameState.timeRemaining <= 0) {
      endGame(false); // Time's up - failed
    }
  }, 1000);
}

// Stop game timer
function stopGameTimer() {
  if (gameTimerInterval) {
    clearInterval(gameTimerInterval);
    gameTimerInterval = null;
  }
  ui.gameTimer.style.display = 'none';
}

// End game with result
function endGame(success) {
  stopGameTimer();
  gameState.gameActive = false;
  
  // Disable play button temporarily
  ui.playButton.classList.add('disabled');
  
  // Show feedback
  ui.gameFeedback.style.display = 'block';
  ui.feedbackText.textContent = success ? 'SAVED EARTH!' : 'FAILED!';
  ui.gameFeedback.className = `game-feedback ${success ? 'success' : 'failure'}`;
  if (ui.feedbackClose) {
    ui.feedbackClose.style.display = 'block';
  }
  
  // Hide visual novel overlay
  ui.visualNovelOverlay.style.display = 'none';
  
  // Show game overlay
  ui.gameOverlay.style.display = 'block';
  
  // Wait for user to close
}

// Reset game state
function resetGame() {
  // Hide all game elements
  ui.gameFeedback.style.display = 'none';
  if (ui.feedbackClose) ui.feedbackClose.style.display = 'none';
  ui.gameOverlay.style.display = 'none';
  ui.gameTimer.style.display = 'none';
  
  // Reset play button
  ui.playButton.classList.remove('disabled', 'playing');
  ui.playButton.textContent = 'Start ▶';
  ui.playButton.style.display = '';
  
  // Show left panel again
  const uiPanel = document.getElementById('ui');
  uiPanel.style.display = 'block';
  // Show the outside collapse toggle again
  if (ui.toggleUI) ui.toggleUI.style.display = '';
  
  // Re-enable inputs
  enableInputs(true);
  
  // Reset game state
  gameState.isPlaying = false;
  gameState.gameActive = false;
  gameState.selectedMeteor = null;
  gameState.currentQuestion = null;
  gameState.selectedOption = null;
  gameState.correctAnswer = null;
  
  // Reset meteor info and question
  ui.meteorInfo.style.display = 'none';
  ui.questionBox.style.display = 'none';
  ui.optionsContainer.style.display = 'grid';
  ui.optionsContainer.innerHTML = '';
  if (ui.approachDialog) ui.approachDialog.style.display = 'none';
}

// Enable/disable inputs
function enableInputs(enabled) {
  const inputs = ['diameterKm', 'density', 'velocity', 'latitude', 'longitude', 'impactAngle', 'meteorSelect'];
  inputs.forEach(id => {
    const element = ui[id];
    if (element) {
      element.disabled = !enabled;
    }
  });
}

// Determine if answer is correct based on meteor characteristics
function isAnswerCorrect(strategy, meteor) {
  const strategyId = strategy.id;
  const meteorSize = meteor.diameter < 0.5 ? 'small' : meteor.diameter < 2 ? 'medium' : 'large';
  const isHazardous = meteor.isHazardous;
  
  // Simple scoring system
  let score = 0;
  
  if (strategyId === 'kinetic_impactor' && (meteorSize === 'small' || meteorSize === 'medium')) {
    score += 2;
  }
  if (strategyId === 'gravity_tractor' && (meteorSize === 'large' || isHazardous)) {
    score += 2;
  }
  if (strategyId === 'nuclear_deflection' && (isHazardous || meteorSize === 'large')) {
    score += 2;
  }
  if (strategyId === 'laser_ablation' && (meteorSize === 'small' || meteorSize === 'medium')) {
    score += 2;
  }
  if (strategyId === 'solar_sail' && (meteorSize === 'small' && !isHazardous)) {
    score += 2;
  }
  if (strategyId === 'mass_driver' && (meteorSize === 'medium' || meteorSize === 'large')) {
    score += 2;
  }
  
  // Additional points for good combinations
  if (isHazardous && (strategyId === 'nuclear_deflection' || strategyId === 'gravity_tractor')) {
    score += 1;
  }
  if (meteorSize === 'small' && (strategyId === 'kinetic_impactor' || strategyId === 'solar_sail')) {
    score += 1;
  }
  
  return score >= 2; // Need at least 2 points to be considered correct
}

// Mitigation strategies database
const mitigationStrategies = [
  {
    id: 'kinetic_impactor',
    title: 'Kinetic Impactor Mission',
    description: 'Launch a spacecraft to collide with the asteroid and change its velocity',
    effectiveness: 'High for small to medium asteroids',
    cost: 'Moderate',
    timeframe: '2-5 years'
  },
  {
    id: 'gravity_tractor',
    title: 'Gravity Tractor',
    description: 'Use a spacecraft to gravitationally pull the asteroid off course',
    effectiveness: 'High for large asteroids',
    cost: 'High',
    timeframe: '5-10 years'
  },
  {
    id: 'nuclear_deflection',
    title: 'Nuclear Deflection',
    description: 'Detonate nuclear devices near the asteroid to alter its trajectory',
    effectiveness: 'Very High',
    cost: 'Very High',
    timeframe: '1-3 years'
  },
  {
    id: 'laser_ablation',
    title: 'Laser Ablation',
    description: 'Use focused lasers to vaporize material and create thrust',
    effectiveness: 'Medium',
    cost: 'High',
    timeframe: '3-7 years'
  },
  {
    id: 'solar_sail',
    title: 'Solar Sail Attachment',
    description: 'Attach reflective sails to use solar radiation pressure',
    effectiveness: 'Low to Medium',
    cost: 'Low',
    timeframe: '2-4 years'
  },
  {
    id: 'mass_driver',
    title: 'Mass Driver Installation',
    description: 'Install a device to eject material and create reaction force',
    effectiveness: 'Medium to High',
    cost: 'High',
    timeframe: '4-8 years'
  }
];

// Approach dialog options (normalized titles and concise descriptions)
const approachOptionMeta = {
  kinetic_impactor: {
    title: 'Kinetic Impactor',
    description: 'A spacecraft collides with the asteroid to change its velocity.',
    isCorrect: true
  },
  gravitational_tractor: {
    title: 'Gravitational Tractor',
    description: 'A nearby spacecraft uses gravity to gently tug it off course.',
    isCorrect: true
  },
  laser_ablation_correct: {
    title: 'Laser Ablation',
    description: 'Focused lasers vaporize material, creating continuous thrust over time.',
    isCorrect: true
  },
  nuclear_explosions: {
    title: 'Nuclear Explosions',
    description: 'Detonations near the surface impart a large, rapid trajectory change.',
    isCorrect: true
  },
  bombing_asteroid: {
    title: 'Bombing the Asteroid',
    description: 'Fragmentation increases risk; debris can still impact Earth.',
    isCorrect: false
  },
  attaching_rocket: {
    title: 'Attaching a Rocket',
    description: 'Impractical anchoring and control; insufficient thrust at scale.',
    isCorrect: false
  },
  teleport_to_sun: {
    title: 'Teleport It to the Sun',
    description: 'Teleportation does not exist; orbital mechanics are non-trivial.',
    isCorrect: false
  },
  global_fireworks_confuse: {
    title: "Global Fireworks to 'Confuse' It",
    description: 'Fireworks have negligible impulse and do not work in space.',
    isCorrect: false
  },
  backyard_slingshots: {
    title: 'Backyard Slingshots',
    description: 'Momentum is many orders of magnitude too small.',
    isCorrect: false
  },
  reflective_foil: {
    title: 'Cover It in Reflective Foil',
    description: 'Radiation pressure is far too weak for urgent deflection.',
    isCorrect: false
  },
  shoot_with_gun: {
    title: 'Shoot It with a Gun',
    description: 'Projectiles are trivial compared to asteroid mass and momentum.',
    isCorrect: false
  },
  ask_goku: {
    title: 'Ask Goku to Deflect It',
    description: 'Fictional character; not an actionable mitigation strategy.',
    isCorrect: false
  }
};

const correctApproachOptionKeys = [
  'kinetic_impactor',
  'gravitational_tractor',
  'laser_ablation_correct',
  'nuclear_explosions'
];
const wrongApproachOptionKeys = [
  'bombing_asteroid',
  'attaching_rocket',
  'teleport_to_sun',
  'global_fireworks_confuse',
  'backyard_slingshots',
  'reflective_foil',
  'shoot_with_gun',
  'ask_goku'
];

let approachSelectedOption = null;
let approachSelectedIsCorrect = false;

function shuffleArray(arr) {
  return arr
    .map(v => ({ v, r: Math.random() }))
    .sort((a, b) => a.r - b.r)
    .map(o => o.v);
}

function showApproachDialog() {
  if (!ui.approachDialog || !ui.approachOptions) {
    console.warn('Approach dialog elements not found:', {
      hasDialog: !!ui.approachDialog,
      hasOptions: !!ui.approachOptions
    });
    return;
  }
  // Build 1 correct + 3 wrong options
  const correctKey = correctApproachOptionKeys[Math.floor(Math.random() * correctApproachOptionKeys.length)];
  const wrongShuffled = shuffleArray([...wrongApproachOptionKeys]);
  const wrongKeys = wrongShuffled.slice(0, 3);
  const optionKeys = shuffleArray([correctKey, ...wrongKeys]);
  ui.approachOptions.innerHTML = '';
  approachSelectedOption = null;
  approachSelectedIsCorrect = false;
  gameState.approachShouldMiss = false;
	// If we are showing the dialog, we want the normal outcome popup behavior
	gameState.suppressApproachOutcome = false;
  optionKeys.forEach(key => {
    const meta = approachOptionMeta[key];
    const btn = document.createElement('button');
    btn.className = 'approach-option';
    btn.innerHTML = `
      <strong>${meta.title}</strong><br>
      <small style="opacity:0.8;">${meta.description}</small>
    `;
    btn.addEventListener('click', () => {
      // select
      Array.from(ui.approachOptions.children).forEach(el => el.classList.remove('selected'));
      btn.classList.add('selected');
      approachSelectedOption = meta.title;
      approachSelectedIsCorrect = !!meta.isCorrect;
      gameState.approachShouldMiss = approachSelectedIsCorrect;
      // Start the approach animation now that the user selected an option
      if (!playState.playing) {
        startApproachAnimation();
      }
    });
    ui.approachOptions.appendChild(btn);
  });
  ui.approachDialog.style.display = 'block';
  console.log('Approach dialog shown');
}

function resolveApproachOutcome() {
  if (!ui.approachDialog) return;
	ui.approachDialog.style.display = 'none';
	// When the approach was triggered via the simple "play approach" button,
	// skip showing the Saved/Failed popup altogether
	if (gameState.suppressApproachOutcome) {
		gameState.suppressApproachOutcome = false;
		return;
	}
	// If nothing chosen, treat as failure
	const success = !!approachSelectedOption && approachSelectedIsCorrect;
	endGame(success);
}

// AI-powered question generation (simulated)
async function generateMitigationQuestion(meteor) {
  // Simulate AI API call with enhanced question generation
  const questionTemplates = [
    {
      template: `Given that ${meteor.name} is ${meteor.diameter.toFixed(2)}km in diameter and traveling at ${meteor.velocity}km/s, which mitigation strategy would be most effective?`,
      context: 'size_velocity'
    },
    {
      template: `This ${meteor.isHazardous ? 'potentially hazardous' : 'near-Earth'} asteroid has a density of ${meteor.density}kg/m³. What approach would you recommend?`,
      context: 'hazard_density'
    },
    {
      template: `With ${meteor.name}'s current trajectory and properties, how would you prioritize our planetary defense options?`,
      context: 'trajectory_analysis'
    },
    {
      template: `Considering the size and velocity of this asteroid, which method would provide the best chance of deflection?`,
      context: 'deflection_probability'
    },
    {
      template: `The asteroid ${meteor.name} presents a ${meteor.isHazardous ? 'significant' : 'moderate'} threat level. Which mitigation approach balances effectiveness with feasibility?`,
      context: 'threat_assessment'
    },
    {
      template: `Given ${meteor.name}'s physical properties (${meteor.diameter.toFixed(2)}km, ${meteor.density}kg/m³, ${meteor.velocity}km/s), what's your recommended planetary defense strategy?`,
      context: 'comprehensive_analysis'
    }
  ];
  
  // Simulate AI processing delay
  await new Promise(resolve => setTimeout(resolve, 100));
  
  // Select question based on meteor characteristics
  let selectedTemplate;
  if (meteor.isHazardous) {
    selectedTemplate = questionTemplates.find(q => q.context === 'threat_assessment') || questionTemplates[0];
  } else if (meteor.diameter > 1) {
    selectedTemplate = questionTemplates.find(q => q.context === 'size_velocity') || questionTemplates[0];
  } else {
    selectedTemplate = questionTemplates[Math.floor(Math.random() * questionTemplates.length)];
  }
  
  return selectedTemplate.template;
}

// Enhanced feedback generation with AI-like responses
async function generateEnhancedFeedback(strategy, meteor) {
  // Simulate AI processing
  await new Promise(resolve => setTimeout(resolve, 50));
  
  const baseFeedbacks = {
    kinetic_impactor: {
      excellent: `Outstanding choice! A kinetic impactor is perfectly suited for ${meteor.name}. Given its ${meteor.diameter.toFixed(2)}km diameter and ${meteor.velocity}km/s velocity, the collision would create a velocity change of approximately ${(meteor.velocity * 0.01).toFixed(2)} km/s. This could deflect the asteroid by thousands of kilometers over time, making it the most cost-effective solution for this scenario.`,
      good: `Good choice! A kinetic impactor would be effective for ${meteor.name}. The direct collision approach provides immediate results and is well-suited for asteroids of this size range.`,
      poor: `While kinetic impactors can work, ${meteor.name}'s size might make this approach less efficient. Consider the asteroid's composition and structure.`
    },
    gravity_tractor: {
      excellent: `Excellent strategic thinking! A gravity tractor is ideal for ${meteor.name}. This method provides precise control over the deflection, which is crucial for a ${meteor.isHazardous ? 'potentially hazardous' : 'near-Earth'} asteroid. The gravitational force would gradually pull the asteroid off course with minimal risk.`,
      good: `A gravity tractor is a sophisticated approach. For ${meteor.name}, this method would provide precise control, though it requires more time and fuel than other options.`,
      poor: `A gravity tractor might be overkill for ${meteor.name}. Consider the asteroid's size and the time constraints for deflection.`
    },
    nuclear_deflection: {
      excellent: `Bold but potentially necessary choice! Nuclear deflection could be the only viable option for ${meteor.name} given its ${meteor.diameter.toFixed(2)}km size. The massive impulse from nuclear devices could provide the necessary velocity change, though international cooperation and careful planning would be essential.`,
      good: `Nuclear deflection is the most powerful option. For an asteroid of ${meteor.name}'s size, nuclear devices could provide the necessary impulse, though this approach requires careful consideration of political and environmental factors.`,
      poor: `Nuclear deflection might be excessive for ${meteor.name}. Consider the asteroid's size and the potential for less extreme alternatives.`
    },
    laser_ablation: {
      excellent: `Innovative approach! Laser ablation could work well for ${meteor.name}. The continuous thrust from vaporized material would gradually change the asteroid's orbit, and the precision targeting would be effective for this size asteroid.`,
      good: `Laser ablation is an innovative approach. While it would work for ${meteor.name}, it requires significant power and precise targeting capabilities.`,
      poor: `Laser ablation might not provide enough thrust for ${meteor.name}. Consider the asteroid's size and the power requirements.`
    },
    solar_sail: {
      excellent: `Elegant solution! Solar sails offer a sustainable approach for ${meteor.name}. With minimal fuel requirements and long-term operation capability, this method would be cost-effective and environmentally friendly for this asteroid.`,
      good: `Solar sails offer an elegant solution with minimal fuel requirements. For ${meteor.name}, this method would be cost-effective but might require more time than other approaches.`,
      poor: `Solar sails might not provide enough force for ${meteor.name}. Consider the asteroid's size and the time available for deflection.`
    },
    mass_driver: {
      excellent: `Brilliant engineering solution! A mass driver would be highly effective for ${meteor.name}. By ejecting material from the asteroid's surface, this approach provides continuous thrust and could be very effective, especially if we can establish a base on the asteroid.`,
      good: `A mass driver would provide continuous thrust by ejecting material from the asteroid's surface. This approach could be very effective for ${meteor.name}, especially if we can establish a base on the asteroid.`,
      poor: `A mass driver might be too complex for ${meteor.name}. Consider the asteroid's composition and the feasibility of installation.`
    }
  };
  
  // Determine feedback quality based on meteor characteristics
  let quality = 'good';
  if (strategy.id === 'kinetic_impactor' && meteor.diameter < 1) quality = 'excellent';
  else if (strategy.id === 'gravity_tractor' && meteor.diameter > 0.5) quality = 'excellent';
  else if (strategy.id === 'nuclear_deflection' && meteor.isHazardous && meteor.diameter > 1) quality = 'excellent';
  else if (strategy.id === 'laser_ablation' && meteor.diameter < 2) quality = 'excellent';
  else if (strategy.id === 'solar_sail' && !meteor.isHazardous) quality = 'excellent';
  else if (strategy.id === 'mass_driver' && meteor.diameter > 0.3) quality = 'excellent';
  
  return baseFeedbacks[strategy.id]?.[quality] || 'Interesting choice! This strategy could be effective depending on the specific circumstances and available resources.';
}

// Display meteor information
function displayMeteorInfo(meteor) {
  ui.meteorName.textContent = meteor.name;
  ui.meteorDiameter.textContent = `${meteor.diameter.toFixed(2)} km`;
  ui.meteorDensity.textContent = `${meteor.density.toLocaleString()} kg/m³`;
  ui.meteorVelocity.textContent = `${meteor.velocity} km/s`;
  ui.meteorHazard.textContent = meteor.isHazardous ? '⚠️ Potentially Hazardous' : '✅ Low Risk';
  
  ui.meteorInfo.style.display = 'block';
}

// Generate question and options
async function generateQuestionAndOptions(meteor) {
  const question = await generateMitigationQuestion(meteor);
  ui.questionText.textContent = question;
  
  // Shuffle and select 4 random strategies
  const shuffled = [...mitigationStrategies].sort(() => Math.random() - 0.5);
  const selectedStrategies = shuffled.slice(0, 4);
  
  ui.optionsContainer.innerHTML = '';
  
  selectedStrategies.forEach((strategy, index) => {
    const option = document.createElement('button');
    option.className = 'option-button';
    option.innerHTML = `
      <strong>${strategy.title}</strong><br>
      <small>${strategy.description}</small><br>
      <small style="opacity: 0.7;">Effectiveness: ${strategy.effectiveness} | Cost: ${strategy.cost} | Time: ${strategy.timeframe}</small>
    `;
    
    option.addEventListener('click', () => {
      if (!gameState.gameActive) return; // Don't allow selection if game is not active
      
      // Remove previous selection
      document.querySelectorAll('.option-button').forEach(btn => btn.classList.remove('selected'));
      option.classList.add('selected');
      gameState.selectedOption = strategy;
      
      // Check if answer is correct
      const isCorrect = isAnswerCorrect(strategy, meteor);
      
      // End game immediately with result
      endGame(isCorrect);
    });
    
    ui.optionsContainer.appendChild(option);
  });
  
  ui.questionBox.style.display = 'block';
}

// Show feedback for selected option
async function showOptionFeedback(strategy, meteor) {
  const feedback = await generateEnhancedFeedback(strategy, meteor);
  ui.questionText.innerHTML = `
    <strong>You selected: ${strategy.title}</strong><br><br>
    ${feedback}
  `;
  
  // Hide options after selection
  ui.optionsContainer.style.display = 'none';
  
  // Add restart option
  setTimeout(() => {
    const restartBtn = document.createElement('button');
    restartBtn.className = 'option-button';
    restartBtn.textContent = 'Try Another Meteor Scenario';
    restartBtn.style.marginTop = '20px';
    restartBtn.addEventListener('click', () => {
      startNewScenario();
    });
    ui.questionBox.appendChild(restartBtn);
  }, 2000);
}


// Start new scenario (legacy function - now uses resetGame)
function startNewScenario() {
  resetGame();
}

// Asteroid VFX: glow sprite, trail, and light
const spriteTex = new THREE.TextureLoader().load('./textures/stars/circle.png');
const asteroidGlow = new THREE.Sprite(new THREE.SpriteMaterial({
  map: spriteTex,
  color: 0xffbb66,
  blending: THREE.AdditiveBlending,
  transparent: true,
  opacity: 0.9,
}));
asteroidGlow.scale.set(0.18, 0.18, 0.18);
asteroidGlow.visible = false;
earthGroup.add(asteroidGlow);

const trailMax = 120;
const trailPositions = new Float32Array(trailMax * 3);
const trailGeo = new THREE.BufferGeometry();
trailGeo.setAttribute('position', new THREE.BufferAttribute(trailPositions, 3));
const trail = new THREE.Line(
  trailGeo,
  new THREE.LineBasicMaterial({ color: 0xffaa66, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending })
);
trail.visible = false;
earthGroup.add(trail);

const headLight = new THREE.PointLight(0xffaa77, 1.6, 1.5, 2.0);
headLight.visible = false;
earthGroup.add(headLight);

let playState = { playing: false, t: 0, path: null };

function buildApproachPath() {
  const baseLat = parseFloat(ui.latitude.value);
  const baseLon = parseFloat(ui.longitude.value);
  const deltaVms = parseFloat(ui.deltaV.value);
  const leadTimeDays = parseFloat(ui.leadTimeDays.value || '0');
  const bearingDeg = parseFloat(ui.bearingDeg.value || '0');
  const seconds = Math.max(0, leadTimeDays) * 86400;
  const shiftKm = (deltaVms * seconds) / 1000;
  const target = shiftKm > 0 ? destinationPoint(baseLat, baseLon, bearingDeg, shiftKm) : { lat: baseLat, lon: baseLon };

  // Compute world-space target on unit sphere
  // If we should miss, bias the path to pass tangent above the surface
  const missRadius = gameState.approachShouldMiss ? 1.3 : 1.05; // higher radius => miss
  const targetVec = latLonToVector3(target.lat, target.lon, missRadius);

  // Define a straight-line approach from far space towards target direction
  const approachDir = targetVec.clone().normalize();
  const startVec = approachDir.clone().multiplyScalar(8.0); // far away in space (~8x Earth radius)
  const segments = 256;
  const verts = [];
  for (let i = 0; i <= segments; i++) {
    const f = i / segments;
    const p = startVec.clone().lerp(targetVec, f);
    const v = p.clone().normalize();
    // keep just outside the atmosphere until late
    const endRadius = gameState.approachShouldMiss ? 1.25 : 1.02;
    const r = THREE.MathUtils.lerp(8.0, endRadius, Math.pow(f, 1.4));
    verts.push(v.x * r, v.y * r, v.z * r);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
  const line = new THREE.Line(geo, new THREE.LineDashedMaterial({ color: 0x66ccff, dashSize: 0.05, gapSize: 0.03 }));
  line.computeLineDistances();
  return { line, startVec, targetVec };
}

function startApproachAnimation() {
  if (playState.playing) return;
  const path = buildApproachPath();
  if (!path.line) return;
  if (corridorLine) earthGroup.remove(corridorLine);
  corridorLine = path.line;
  corridorLine.scale.setScalar(1.003);
  earthGroup.add(corridorLine);
  playState = { playing: true, t: 0, path };
  asteroid.visible = true;
  asteroidGlow.visible = true;
  headLight.visible = true;
  trail.visible = true;
  for (let i = 0; i < trailPositions.length; i++) trailPositions[i] = 0;
  trailGeo.attributes.position.needsUpdate = true;
}

function updateAsteroidPosition() {
  if (!playState.playing || !playState.path) return;
  const positions = playState.path.line.geometry.attributes.position.array;
  const count = positions.length / 3;
  const idx = Math.min(count - 1, Math.floor(playState.t * (count - 1)));
  const x = positions[idx * 3 + 0];
  const y = positions[idx * 3 + 1];
  const z = positions[idx * 3 + 2];
  const pos = new THREE.Vector3(x, y, z).multiplyScalar(1.02);
  asteroid.position.copy(pos);
  asteroidGlow.position.copy(pos.clone().multiplyScalar(1.01));
  headLight.position.copy(pos.clone().multiplyScalar(1.01));
  // update trail buffer (simple FIFO)
  for (let i = trailPositions.length - 3; i >= 3; i -= 3) {
    trailPositions[i] = trailPositions[i - 3];
    trailPositions[i + 1] = trailPositions[i - 2];
    trailPositions[i + 2] = trailPositions[i - 1];
  }
  trailPositions[0] = pos.x;
  trailPositions[1] = pos.y;
  trailPositions[2] = pos.z;
  trailGeo.attributes.position.needsUpdate = true;
}

function pulseRings(time) {
  const s = 1.003 + Math.sin(time * 2.0) * 0.001;
  if (impactCircle) impactCircle.scale.setScalar(s);
  if (deflectedCircle) deflectedCircle.scale.setScalar(s);
}

// Animate wave arrows with geographic-aware effects
function animateWaveArrows(time) {
  if (!waveArrowsGroup || waveArrows.length === 0) return;
  
  const lat = parseFloat(ui.latitude.value);
  const lon = parseFloat(ui.longitude.value);
  const isLandImpact = isLand(lat, lon);
  
  // Different animation patterns for land vs ocean impacts
  const pulseIntensity = isLandImpact ? 
    0.2 + 0.15 * Math.sin(time * 4.0) : // Faster, more intense for land
    0.3 + 0.2 * Math.sin(time * 2.0);   // Slower, more spread for ocean
  
  const rotationSpeed = isLandImpact ? 0.8 : 0.3; // Faster rotation for land
  
  waveArrows.forEach((waveArrow, index) => {
    // Pulse the arrow size with geographic influence
    const baseScale = isLandImpact ? 0.9 : 0.8;
    const scale = baseScale + pulseIntensity;
    waveArrow.arrow.scale.setScalar(scale);
    
    // Different rotation patterns
    const rotationAmount = isLandImpact ? 
      rotationSpeed * 0.015 : // More dramatic for land
      rotationSpeed * 0.008;  // Gentler for ocean
    waveArrow.arrow.rotation.y += rotationAmount;
    
    // Different fade patterns
    const fadeBase = isLandImpact ? 0.7 : 0.6;
    const fadeVariation = isLandImpact ? 0.3 : 0.4;
    const fade = fadeBase + fadeVariation * Math.sin(time * 2.0 + index * 0.5);
    waveArrow.arrow.material.opacity = fade;
    waveArrow.line.material.opacity = fade * 0.6;
    
    // Add slight position oscillation for ocean waves
    if (!isLandImpact) {
      const oscillation = Math.sin(time * 1.5 + index * 0.3) * 0.001;
      waveArrow.arrow.position.add(waveArrow.arrow.position.clone().normalize().multiplyScalar(oscillation));
    }
  });
}

if (document.getElementById('playBtn')) {
  document.getElementById('playBtn').addEventListener('click', () => {
		// Start approach animation directly without showing end-of-game popup
		if (!playState.playing) {
			gameState.suppressApproachOutcome = true;
			startApproachAnimation();
		}
  });
}

function animate() {
  requestAnimationFrame(animate);

  // Earth rotation stopped for clearer impact visualization
  // earthMesh.rotation.y += 0.002;
  // lightsMesh.rotation.y += 0.002;
  // cloudsMesh.rotation.y += 0.0023;
  // glowMesh.rotation.y += 0.002;
  // stars.rotation.y -= 0.0002;
  if (playState.playing) {
    playState.t = Math.min(1, playState.t + 0.0025);
    updateAsteroidPosition();
    if (playState.t >= 1) {
      if (!gameState.approachShouldMiss) {
        // Impact visuals (only if we did not intend to miss)
        const impactX = (pointer.x + 1) * window.innerWidth / 2;
        const impactY = (-pointer.y + 1) * window.innerHeight / 2;
        createNewExplosionEffect(impactX, impactY);
        
        const flash = new THREE.PointLight(0xffeeaa, 3.5, 0.8, 2.0);
        flash.position.copy(asteroid.position);
        earthGroup.add(flash);
        const overlay = document.getElementById('overlayFlash');
        if (overlay) {
          overlay.style.opacity = '1';
          setTimeout(() => { overlay.style.opacity = '0'; }, 180);
        }
        const lat = parseFloat(ui.latitude.value);
        const lon = parseFloat(ui.longitude.value);
        const shockGeo = greatCirclePoints(lat, lon, 50);
        const shock = new THREE.LineLoop(
          shockGeo,
          new THREE.LineBasicMaterial({ color: 0xffdd99, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending })
        );
        shock.scale.setScalar(1.003);
        earthGroup.add(shock);
        let shockR = 50;
        const shockId = setInterval(() => {
          shockR += 120;
          const g = greatCirclePoints(lat, lon, shockR);
          shock.geometry.dispose();
          shock.geometry = g;
          shock.material.opacity *= 0.92;
          if (shock.material.opacity < 0.05 || shockR > 4000) {
            clearInterval(shockId);
            earthGroup.remove(shock);
          }
        }, 32);

        const debrisCount = 80;
        const dverts = [];
        for (let i = 0; i < debrisCount; i++) {
          const theta = Math.random() * Math.PI * 2;
          const phi = Math.acos(2 * Math.random() - 1);
          const r = 0.02 + Math.random() * 0.05;
          dverts.push(Math.sin(phi) * Math.cos(theta) * r, Math.sin(phi) * Math.sin(theta) * r, Math.cos(phi) * r);
        }
        const dgeo = new THREE.BufferGeometry();
        dgeo.setAttribute('position', new THREE.Float32BufferAttribute(dverts, 3));
        const dmat = new THREE.PointsMaterial({ size: 0.02, color: 0xffbb66, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending });
        const debris = new THREE.Points(dgeo, dmat);
        debris.position.copy(asteroid.position.clone().multiplyScalar(1));
        earthGroup.add(debris);
        setTimeout(() => {
          const fadeId = setInterval(() => {
            dmat.opacity *= 0.9;
            debris.scale.multiplyScalar(1.04);
            if (dmat.opacity < 0.05) {
              clearInterval(fadeId);
              earthGroup.remove(debris);
              dgeo.dispose();
            }
          }, 32);
        }, 50);
        const camBase = camera.position.clone();
        let shakes = 24;
        const shakeId = setInterval(() => {
          shakes--;
          const mag = shakes / 300;
          camera.position.set(
            camBase.x + (Math.random() - 0.5) * mag,
            camBase.y + (Math.random() - 0.5) * mag,
            camBase.z
          );
          if (shakes <= 0) {
            clearInterval(shakeId);
            camera.position.copy(camBase);
            earthGroup.remove(flash);
          }
        }, 16);
      }
      playState.playing = false;
      asteroid.visible = false;
      asteroidGlow.visible = false;
      headLight.visible = false;
      trail.visible = false;
      // After animation finishes, decide outcome if an approach option was chosen
      resolveApproachOutcome();
    }
  }
  pulseRings(performance.now() / 1000);
  animateWaveArrows(performance.now() / 1000);
  renderer.render(scene, camera);
}

animate();

function handleWindowResize () {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
window.addEventListener('resize', handleWindowResize, false);
// Reposition toggle on resize to keep alignment with sidebar
window.addEventListener('resize', () => {
  positionOutsideToggle();
	updateUIPanelResponsive();
});

// Initialize the application
async function initializeApp() {
  // Load asteroids from NASA API
  await fetchAsteroidsFromNASA();
  
  // Run initial simulation
  try { 
    runSimulation(); 
  } catch (e) {
    console.error('Error in initial simulation:', e);
  }
}

// Play button functionality
if (ui.playButton) {
  ui.playButton.addEventListener('click', () => {
    if (!gameState.isPlaying) {
      startMeteorScenario();
    }
  });
}

// Close feedback popup
if (ui.feedbackClose) {
  ui.feedbackClose.addEventListener('click', () => {
    resetGame();
  });
}

// Close visual novel functionality
if (ui.closeVisualNovel) {
  ui.closeVisualNovel.addEventListener('click', () => {
    startNewScenario();
  });
}

// Start meteor scenario
async function startMeteorScenario() {
  try {
    // Update play button state
    ui.playButton.classList.add('playing');
    ui.playButton.style.display = 'none';
    gameState.isPlaying = true;
    gameState.gameActive = true;
    
    // Hide left panel
    const uiPanel = document.getElementById('ui');
    uiPanel.style.display = 'none';
    // Hide the outside collapse toggle as well
    if (ui.toggleUI) ui.toggleUI.style.display = 'none';
    
    // Disable inputs to prevent changes during game
    enableInputs(false);
    
    // Randomize impact location
    randomizeImpactLocation();
    
    // Select random meteor from database
    const meteorIds = Object.keys(METEOR_DATABASE).filter(id => id !== 'custom');
    if (meteorIds.length === 0) {
      // Fallback to custom meteor if no NASA data
      gameState.selectedMeteor = METEOR_DATABASE['custom'];
    } else {
      const randomId = meteorIds[Math.floor(Math.random() * meteorIds.length)];
      gameState.selectedMeteor = METEOR_DATABASE[randomId];
    }
    
    // Update simulation with selected meteor
    if (gameState.selectedMeteor) {
      ui.diameterKm.value = gameState.selectedMeteor.diameter;
      ui.density.value = gameState.selectedMeteor.density;
      ui.velocity.value = gameState.selectedMeteor.velocity;
      
      // Run simulation with new data
      runSimulation();
      
      // Show approach dialog; animation will start after user selects an option
      showApproachDialog();
      
      // Show meteor details panel while the bottom approach dialog is visible
      if (ui.visualNovelOverlay) ui.visualNovelOverlay.style.display = 'block';
      if (ui.questionBox) ui.questionBox.style.display = 'none';
      displayMeteorInfo(gameState.selectedMeteor);
    }
    
  } catch (error) {
    console.error('Error starting meteor scenario:', error);
    // Reset on error
    resetGame();
  }
}

// Start the application
initializeApp();