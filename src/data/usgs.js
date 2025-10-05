// Minimal USGS integration helpers with graceful fallbacks.

async function safeFetch(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (e) {
    return { error: String(e) };
  }
}

// USGS 3DEP Elevation point query (ArcGIS ImageServer getSamples)
// Note: CORS may block in some contexts; we provide fallback.
export async function getElevationMeters(lat, lon) {
  const url = `https://elevation.nationalmap.gov/arcgis/rest/services/3DEPElevation/ImageServer/getSamples?geometry=${lon},${lat}&geometryType=esriGeometryPoint&returnFirstValueOnly=true&f=json`;
  const data = await safeFetch(url);
  if (data.error || !data.samples || !data.samples.length) {
    return { elevation: null, source: 'fallback' };
  }
  const sample = data.samples[0];
  const z = typeof sample.value === 'number' ? sample.value : null;
  return { elevation: z, source: 'usgs-3dep' };
}

// Very coarse tsunami/coastal proxy: returns likely tsunami concern if elevation < 50 m and within 50 km of coastline
// (Real modeling would use NOAA/USGS coastal datasets; this is an educational placeholder.)
export function estimateTsunamiConcern({ elevationMeters }) {
  if (elevationMeters == null) return 'unknown';
  if (elevationMeters < 10) return 'high';
  if (elevationMeters < 50) return 'moderate';
  return 'low';
}

export default {
  getElevationMeters,
  estimateTsunamiConcern,
};


