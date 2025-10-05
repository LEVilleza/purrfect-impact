// Simple NASA data helpers using public DEMO_KEY. Graceful fallbacks provided.

// Injected NEO API key provided by user
const NASA_API_KEY = 'ZuiqFSlvnSB59YlObKSKKQE37iSFzJYtpFCP7enM';

async function safeFetch(url, options) {
  try {
    const res = await fetch(url, options);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (e) {
    return { error: String(e) };
  }
}

// Fetch a list of Near-Earth Objects via browse (paginated). Returns first page.
export async function fetchNEOBrowse() {
  const url = `https://api.nasa.gov/neo/rest/v1/neo/browse?size=20&api_key=${NASA_API_KEY}`;
  return await safeFetch(url);
}

// Fetch close-approach data via NASA JPL CAD API for a given designation (des) or name.
// See: https://ssd-api.jpl.nasa.gov/doc/cad.html
export async function fetchCloseApproach({ des, dateMin, dateMax } = {}) {
  const params = new URLSearchParams();
  if (des) params.set('des', des);
  if (dateMin) params.set('date-min', dateMin);
  if (dateMax) params.set('date-max', dateMax);
  params.set('dist-max', '0.1'); // au
  params.set('sort', 'date');
  params.set('limit', '20');
  const url = `https://ssd-api.jpl.nasa.gov/cad.api?${params.toString()}`;
  return await safeFetch(url);
}

// Offline sample: fallback to embedded JSON if network fails
export async function getSampleNEO() {
  try {
    const res = await fetch('./src/data/sample_neo.json');
    return await res.json();
  } catch (e) {
    return { error: String(e) };
  }
}

export default {
  fetchNEOBrowse,
  fetchCloseApproach,
  getSampleNEO,
};


