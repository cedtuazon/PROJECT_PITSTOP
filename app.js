/* PitStop — EV Site Scoring demo (rebuilt from project notes, 2026-07-21) */

const API_KEY_STORAGE = "pitstop_gmaps_api_key";

/* ---------------------------------------------------------------------- */
/* Dummy data: 36 Metro Manila stations                                   */
/*   - 4 existing EV-ready stations                                       */
/*   - 10 EV scoring candidates (gas-only today, being evaluated)         */
/*   - 22 gas-only network stations (not under evaluation)                */
/* ---------------------------------------------------------------------- */

const FIRST_NAMES = ["Maria", "Jose", "Ana", "Carlos", "Liza", "Ramon", "Grace", "Paolo", "Ivy", "Noel"];
const LAST_NAMES = ["Santos", "Reyes", "Cruz", "Bautista", "Garcia", "Torres", "Mendoza", "Flores", "Ramos", "Aquino"];
function dummyManager(seed) {
  const f = FIRST_NAMES[seed % FIRST_NAMES.length];
  const l = LAST_NAMES[(seed * 7) % LAST_NAMES.length];
  const phone = `+63 9${String(100000000 + (seed * 9137) % 800000000)}`;
  return { name: `${f} ${l}`, phone };
}

const TERRITORY_MANAGERS = [
  { name: "Ferdinand Villanueva", phone: "+63 917 200 1042", territory: "North Metro Manila" },
  { name: "Corazon Dimaculangan", phone: "+63 918 331 5567", territory: "South Metro Manila" },
  { name: "Ramil Espiritu", phone: "+63 919 445 2298", territory: "East Metro Manila" },
  { name: "Beatriz Aguinaldo", phone: "+63 920 556 8871", territory: "West Metro Manila / Bay Area" },
  { name: "Teodoro Lacson", phone: "+63 921 667 3345", territory: "Central Manila" },
];
function dummyTerritoryManager(seed) {
  return TERRITORY_MANAGERS[seed % TERRITORY_MANAGERS.length];
}

/* Fabricated operational status for the "status at a glance" ops view —
   no real monitoring feed behind this, just a stand-in for the concept.
   Roughly 70% normal / 20% needs attention / 10% down, deterministic per seed. */
const STATUS_LEVELS = {
  normal: { label: "Operational", color: "#22c55e" },
  attention: { label: "Needs Attention", color: "#f59e0b" },
  down: { label: "Down", color: "#ef4444" },
};
function dummyStatus(seed) {
  const r = (seed * 13) % 10;
  if (r < 7) return "normal";
  if (r < 9) return "attention";
  return "down";
}

const RAW_STATIONS = [
  // --- 4 existing EV-ready stations ---
  { name: "EDSA Guadalupe", lat: 14.5642, lng: 121.0405, type: "ev" },
  { name: "Commonwealth Ave", lat: 14.6889, lng: 121.0799, type: "ev" },
  { name: "Macapagal Blvd", lat: 14.5043, lng: 120.9866, type: "ev" },
  { name: "C5 Libis", lat: 14.6101, lng: 121.0789, type: "ev" },

  // --- 10 EV scoring candidates (gas-only, being evaluated) ---
  { name: "Quezon Ave cor. Timog", lat: 14.632, lng: 121.0337, type: "candidate" },
  { name: "Ortigas Ave Ext", lat: 14.5832, lng: 121.0741, type: "candidate" },
  { name: "Roxas Blvd Pasay", lat: 14.5468, lng: 120.9915, type: "candidate" },
  { name: "Marcos Highway Marikina", lat: 14.6409, lng: 121.1083, type: "candidate" },
  { name: "Alabang-Zapote Rd", lat: 14.4194, lng: 121.0203, type: "candidate" },
  { name: "Congressional Ave", lat: 14.6577, lng: 121.0219, type: "candidate" },
  { name: "Shaw Blvd Mandaluyong", lat: 14.5802, lng: 121.0424, type: "candidate" },
  { name: "Taft Ave cor. Vito Cruz", lat: 14.5632, lng: 120.9926, type: "candidate" },
  { name: "Katipunan Ave", lat: 14.6337, lng: 121.0721, type: "candidate" },
  { name: "Sucat Rd Parañaque", lat: 14.4784, lng: 121.0162, type: "candidate" },

  // --- 22 gas-only network stations ---
  { name: "Aurora Blvd Cubao", lat: 14.6199, lng: 121.0548, type: "gas" },
  { name: "España Blvd", lat: 14.6108, lng: 120.9945, type: "gas" },
  { name: "Recto Ave", lat: 14.6072, lng: 120.9849, type: "gas" },
  { name: "Pasong Tamo", lat: 14.5565, lng: 121.0178, type: "gas" },
  { name: "Buendia Ave", lat: 14.5557, lng: 121.0285, type: "gas" },
  { name: "Kalayaan Ave", lat: 14.5637, lng: 121.0505, type: "gas" },
  { name: "Visayas Ave", lat: 14.6699, lng: 121.0474, type: "gas" },
  { name: "Mindanao Ave", lat: 14.6811, lng: 121.0257, type: "gas" },
  { name: "Rizal Ave Caloocan", lat: 14.6539, lng: 120.983, type: "gas" },
  { name: "Malabon Poblacion", lat: 14.6612, lng: 120.9618, type: "gas" },
  { name: "Navotas Boulevard", lat: 14.6639, lng: 120.9439, type: "gas" },
  { name: "Valenzuela McArthur Hwy", lat: 14.6973, lng: 120.9836, type: "gas" },
  { name: "Fairview", lat: 14.7316, lng: 121.0624, type: "gas" },
  { name: "Novaliches", lat: 14.7175, lng: 121.0395, type: "gas" },
  { name: "Marikina Riverbanks", lat: 14.6382, lng: 121.1001, type: "gas" },
  { name: "Pasig Kapasigan", lat: 14.5758, lng: 121.0855, type: "gas" },
  { name: "Taguig McKinley Rd", lat: 14.5469, lng: 121.0523, type: "gas" },
  { name: "BGC 5th Ave", lat: 14.5514, lng: 121.0488, type: "gas" },
  { name: "Muntinlupa National Rd", lat: 14.4077, lng: 121.0439, type: "gas" },
  { name: "Las Piñas Zapote", lat: 14.4502, lng: 120.9843, type: "gas" },
  { name: "San Juan Greenhills", lat: 14.6011, lng: 121.0351, type: "gas" },
  { name: "Pandacan", lat: 14.5889, lng: 121.0025, type: "gas" },
];

const STATIONS = RAW_STATIONS.map((s, i) => {
  const seed = i + 1;
  return {
    id: `st${seed}`,
    ...s,
    address: `${s.name}, Metro Manila, Philippines`,
    manager: dummyManager(seed),
    territoryManager: dummyTerritoryManager(seed),
    status: dummyStatus(seed),
    score: null,
    subscores: null,
  };
});

const POI_CATEGORIES = [
  { key: "restaurant", label: "Restaurants", color: "#f59e0b" },
  { key: "cafe", label: "Cafes", color: "#a78bfa" },
  { key: "shopping_mall", label: "Malls", color: "#f472b6" },
  { key: "convenience_store", label: "Convenience", color: "#60a5fa" },
  { key: "bank", label: "Banks", color: "#34d399" },
];

/* ---------------------------------------------------------------------- */
/* State                                                                  */
/* ---------------------------------------------------------------------- */

let map;
let markers = {};
let infoWindow;
let activePoiMarkers = [];
let selectedSite = null;
let poiToggleEl = null;
let statusFilter = null; // null = all statuses; otherwise one of STATUS_LEVELS keys

/* ---------------------------------------------------------------------- */
/* API key bootstrap                                                      */
/* ---------------------------------------------------------------------- */

function getStoredKey() {
  return localStorage.getItem(API_KEY_STORAGE) || "";
}

function showKeyModal() {
  document.getElementById("key-modal").classList.remove("hidden");
  document.getElementById("key-input").value = getStoredKey();
}

function hideKeyModal() {
  document.getElementById("key-modal").classList.add("hidden");
}

function loadGoogleMaps(key) {
  return new Promise((resolve, reject) => {
    const existing = document.getElementById("gmaps-script");
    if (existing) existing.remove();
    window.__pitstopMapsReady = () => resolve();
    const script = document.createElement("script");
    script.id = "gmaps-script";
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&libraries=places&callback=__pitstopMapsReady`;
    script.onerror = () => reject(new Error("Failed to load Google Maps JS API — check the API key and enabled APIs."));
    document.head.appendChild(script);
  });
}

async function boot() {
  const key = getStoredKey();
  if (!key) {
    showKeyModal();
    return;
  }
  try {
    await loadGoogleMaps(key);
    initMap();
  } catch (e) {
    alert(e.message);
    showKeyModal();
  }
}

document.getElementById("key-save-btn").addEventListener("click", async () => {
  const key = document.getElementById("key-input").value.trim();
  if (!key) return;
  localStorage.setItem(API_KEY_STORAGE, key);
  hideKeyModal();
  try {
    await loadGoogleMaps(key);
    initMap();
  } catch (e) {
    alert(e.message);
    showKeyModal();
  }
});

document.getElementById("change-key-btn").addEventListener("click", showKeyModal);

/* ---------------------------------------------------------------------- */
/* Marker icons — drawn on a canvas, no external image asset needed       */
/* ---------------------------------------------------------------------- */

/* Station pins are drawn noticeably larger than POI pins (see poiIcon, 18px)
   so the network's own stations stand out once nearby POIs are toggled on. */
function pinIcon(color, badgeColor) {
  const size = 46;
  const scale = size / 34; // original design was tuned at 34px
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");

  // Pin body (teardrop)
  ctx.beginPath();
  ctx.arc(size / 2, size / 2 - 3 * scale, 10 * scale, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(size / 2 - 7 * scale, size / 2 + 3 * scale);
  ctx.lineTo(size / 2 + 7 * scale, size / 2 + 3 * scale);
  ctx.lineTo(size / 2, size / 2 + 15 * scale);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();

  // Fuel-pump glyph
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 1.6 * scale;
  ctx.strokeRect(size / 2 - 4 * scale, size / 2 - 8 * scale, 6 * scale, 8 * scale);
  ctx.beginPath();
  ctx.moveTo(size / 2 + 2 * scale, size / 2 - 6 * scale);
  ctx.lineTo(size / 2 + 5 * scale, size / 2 - 6 * scale);
  ctx.lineTo(size / 2 + 5 * scale, size / 2);
  ctx.stroke();

  // Corner badge
  if (badgeColor) {
    ctx.beginPath();
    ctx.arc(size - 7 * scale, 8 * scale, 5 * scale, 0, Math.PI * 2);
    ctx.fillStyle = badgeColor;
    ctx.fill();
    ctx.strokeStyle = "#0f1115";
    ctx.lineWidth = 1 * scale;
    ctx.stroke();
  }

  return {
    url: canvas.toDataURL(),
    scaledSize: new google.maps.Size(size, size),
    anchor: new google.maps.Point(size / 2, size / 2 + 15 * scale),
  };
}

function iconForStation(s) {
  const color = s.type === "ev" ? "#0f9d68" : "#c0392b";
  const badge = STATUS_LEVELS[s.status].color; // corner badge = operational status, for every pin
  return pinIcon(color, badge);
}

/* ---------------------------------------------------------------------- */
/* Map init                                                                */
/* ---------------------------------------------------------------------- */

function initMap() {
  map = new google.maps.Map(document.getElementById("map"), {
    center: { lat: 14.5995, lng: 120.9842 },
    zoom: 11,
    disableDefaultUI: false,
  });
  infoWindow = new google.maps.InfoWindow();
  buildPoiMapControl();

  STATIONS.forEach((s) => {
    const marker = new google.maps.Marker({
      position: { lat: s.lat, lng: s.lng },
      map,
      icon: iconForStation(s),
      title: s.name,
    });
    marker.addListener("click", () => {
      openInfoWindow(s);
      showSiteDetail(s);
    });
    markers[s.id] = marker;
  });

  renderStatusSummary();
  renderRankedList();
  applyVisibilityFilters(); // also does the initial renderStationList()
}

function renderStatusSummary() {
  const el = document.getElementById("status-summary");
  const counts = { normal: 0, attention: 0, down: 0 };
  STATIONS.forEach((s) => counts[s.status]++);
  el.innerHTML = Object.keys(STATUS_LEVELS)
    .map((key) => {
      const level = STATUS_LEVELS[key];
      const active = statusFilter === key ? " active" : "";
      return `<div class="status-chip${active}" data-status="${key}"><span class="dot" style="background:${level.color}"></span>${counts[key]} ${level.label}</div>`;
    })
    .join("");
}

document.getElementById("status-summary").addEventListener("click", (e) => {
  const chip = e.target.closest(".status-chip");
  if (!chip) return;
  const key = chip.dataset.status;
  statusFilter = statusFilter === key ? null : key; // clicking the active chip again clears the filter
  renderStatusSummary();
  applyVisibilityFilters();
});

/* Floating "Show nearby POIs" switch, docked onto the map itself (via the
   Maps JS control-array API) so it stays visible regardless of which
   sidebar tab or panel is open. Applies to whichever site was last clicked. */
function buildPoiMapControl() {
  const wrap = document.createElement("div");
  wrap.id = "poi-map-control";
  wrap.innerHTML = `
    <label class="switch-row map-switch-row" title="Toggle nearby POI pins for the selected site">
      <span>Show nearby POIs</span>
      <span class="switch">
        <input type="checkbox" id="poi-toggle-map" />
        <span class="switch-slider"></span>
      </span>
    </label>
  `;
  map.controls[google.maps.ControlPosition.TOP_RIGHT].push(wrap);
  poiToggleEl = wrap.querySelector("#poi-toggle-map");
  poiToggleEl.addEventListener("change", (e) => {
    if (!selectedSite) {
      e.target.checked = false;
      return;
    }
    togglePoiExplorer(selectedSite, e.target.checked);
  });
}

function openInfoWindow(s) {
  const pinColor = s.type === "ev" ? "#0f9d68" : "#c0392b"; // same colors as iconForStation's pins
  const status = STATUS_LEVELS[s.status];
  const scoreRow =
    s.type === "candidate"
      ? `<div class="iw-row"><span class="iw-label">Site score</span><span class="iw-score${s.score === null ? " iw-score-pending" : ""}">${s.score !== null ? s.score : "Not scored yet"}</span></div>`
      : "";
  infoWindow.setContent(`
    <div class="iw-title" style="color:${pinColor}">${escapeHtml(s.name)}</div>
    <div class="iw-address">${escapeHtml(s.address)}</div>
    <div class="iw-row"><span class="iw-label">Status</span><span style="color:${status.color};font-weight:600;">● ${status.label}</span></div>
    ${scoreRow}
    <div class="iw-row"><span class="iw-label">Branch contact person</span>${escapeHtml(s.manager.name)} · ${escapeHtml(s.manager.phone)}</div>
    <div class="iw-row"><span class="iw-label">Site territory manager</span>${escapeHtml(s.territoryManager.name)} · ${escapeHtml(s.territoryManager.phone)}</div>
  `);
  infoWindow.open(map, markers[s.id]);
  map.panTo({ lat: s.lat, lng: s.lng });
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

/* ---------------------------------------------------------------------- */
/* Status filter + Network tab list                                       */
/* ---------------------------------------------------------------------- */

function isVisible(s) {
  return !statusFilter || s.status === statusFilter;
}

function applyVisibilityFilters() {
  STATIONS.forEach((s) => {
    markers[s.id].setMap(isVisible(s) ? map : null);
  });
  renderStationList();
}

function renderStationList() {
  const el = document.getElementById("station-list");
  el.innerHTML = "";
  STATIONS.filter(isVisible).forEach((s) => {
    const row = document.createElement("div");
    row.className = "station-row";
    const status = STATUS_LEVELS[s.status];
    row.innerHTML = `
      <span class="dot" style="background:${status.color}"></span>
      <span class="name">${escapeHtml(s.name)}</span>
      <span class="badge" style="color:${status.color}">${status.label}</span>
    `;
    row.addEventListener("click", () => {
      // Pan + open the on-pin popup only — keep this tab/list in view instead
      // of covering it with the full detail panel (that stays a marker-click action).
      openInfoWindow(s);
    });
    el.appendChild(row);
  });
}

/* ---------------------------------------------------------------------- */
/* Tabs                                                                    */
/* ---------------------------------------------------------------------- */

document.querySelectorAll(".tab-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"));
    document.querySelectorAll(".tab-panel").forEach((p) => p.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById(`tab-${btn.dataset.tab}`).classList.add("active");
  });
});

/* ---------------------------------------------------------------------- */
/* Site Selection: weights + Places-API scoring                           */
/* ---------------------------------------------------------------------- */

function currentWeights() {
  const w = {};
  document.querySelectorAll("#weights input[type=range]").forEach((input) => {
    w[input.dataset.weight] = Number(input.value);
  });
  return w;
}

/* Uses Places API (New) via the JS SDK's Place.searchNearby — this project's
   GCP key only has "Places API (New)" enabled, not the legacy Places API that
   the older PlacesService.nearbySearch() call depends on. */
async function nearbySearchPlaces(location, includedType, maxResultCount = 20) {
  try {
    const { Place } = await google.maps.importLibrary("places");
    const { places } = await Place.searchNearby({
      fields: ["id", "location"],
      locationRestriction: { center: location, radius: 500 },
      includedPrimaryTypes: [includedType],
      maxResultCount,
    });
    return places || [];
  } catch (e) {
    console.error(`Places search failed for type "${includedType}":`, e);
    return [];
  }
}

async function nearbySearch(location, type) {
  const places = await nearbySearchPlaces(location, type);
  return places.length;
}

async function scoreCandidate(s, weights) {
  const loc = { lat: s.lat, lng: s.lng };

  const [demandPois, competitorGas] = await Promise.all([
    Promise.all(["shopping_mall", "restaurant", "cafe"].map((t) => nearbySearch(loc, t))).then(
      (arr) => arr.reduce((a, b) => a + b, 0)
    ),
    nearbySearch(loc, "gas_station"),
  ]);

  // Deterministic pseudo-random components to stand in for traffic/highway data
  const seedNum = s.id.replace(/\D/g, "") || "1";
  const seed = parseInt(seedNum, 10);
  const trafficScore = 40 + ((seed * 37) % 60); // 40-99
  const highwayScore = 30 + ((seed * 53) % 70); // 30-99

  const demandScore = Math.min(100, demandPois * 8);
  const competitionScore = Math.max(0, 100 - competitorGas * 20);

  const totalWeight = weights.traffic + weights.competition + weights.highway + weights.demand || 1;
  const weighted =
    (trafficScore * weights.traffic +
      competitionScore * weights.competition +
      highwayScore * weights.highway +
      demandScore * weights.demand) /
    totalWeight;

  s.subscores = {
    traffic: trafficScore,
    competition: competitionScore,
    highway: highwayScore,
    demand: demandScore,
  };
  s.score = Math.round(weighted);
}

document.getElementById("score-btn").addEventListener("click", async () => {
  const btn = document.getElementById("score-btn");
  btn.disabled = true;
  btn.textContent = "Scoring...";
  const weights = currentWeights();
  const candidates = STATIONS.filter((s) => s.type === "candidate");
  try {
    for (const s of candidates) {
      await scoreCandidate(s, weights);
      markers[s.id].setIcon(iconForStation(s));
    }
  } finally {
    btn.disabled = false;
    btn.textContent = "Score candidate sites (Places API)";
  }
  renderRankedList();
});

function renderRankedList() {
  const el = document.getElementById("ranked-list");
  const candidates = STATIONS.filter((s) => s.type === "candidate").slice();
  const scored = candidates.some((s) => s.score !== null);
  if (scored) {
    candidates.sort((a, b) => (b.score ?? -1) - (a.score ?? -1));
  }
  el.innerHTML = "";
  candidates.forEach((s, idx) => {
    const row = document.createElement("div");
    row.className = "ranked-row";
    row.innerHTML = `
      <span class="rank">${idx + 1}</span>
      <span class="name">${escapeHtml(s.name)}</span>
      <span class="score">${s.score !== null ? s.score : "—"}</span>
    `;
    row.addEventListener("click", () => {
      // Pan + open the on-pin popup only — keep the weights/ranked list in view.
      openInfoWindow(s);
    });
    el.appendChild(row);
  });
}

/* ---------------------------------------------------------------------- */
/* Site detail panel + POI explorer                                       */
/* ---------------------------------------------------------------------- */

function clearPoiMarkers() {
  activePoiMarkers.forEach((m) => m.setMap(null));
  activePoiMarkers = [];
}

function poiIcon(color) {
  const size = 18;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, 6, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.strokeStyle = "#0f1115";
  ctx.lineWidth = 1.5;
  ctx.stroke();
  return {
    url: canvas.toDataURL(),
    scaledSize: new google.maps.Size(size, size),
    anchor: new google.maps.Point(size / 2, size / 2),
  };
}

async function togglePoiExplorer(s, show) {
  clearPoiMarkers();
  if (!show) return;
  const loc = { lat: s.lat, lng: s.lng };
  for (const cat of POI_CATEGORIES) {
    const { Place } = await google.maps.importLibrary("places");
    let places = [];
    try {
      ({ places } = await Place.searchNearby({
        fields: ["id", "displayName", "location"],
        locationRestriction: { center: loc, radius: 500 },
        includedPrimaryTypes: [cat.key],
        maxResultCount: 8,
      }));
    } catch (e) {
      console.error(`POI search failed for "${cat.label}":`, e);
      continue;
    }
    (places || []).forEach((place) => {
      if (!place.location) return;
      const m = new google.maps.Marker({
        position: place.location,
        map,
        icon: poiIcon(cat.color),
        title: place.displayName || cat.label,
      });
      activePoiMarkers.push(m);
    });
  }
}

function showSiteDetail(s) {
  const panel = document.getElementById("site-detail");
  const content = document.getElementById("site-detail-content");
  panel.classList.remove("hidden");
  clearPoiMarkers();
  selectedSite = s;

  const poiRows = POI_CATEGORIES.map(
    (c) => `<div class="poi-category"><span class="dot" style="background:${c.color};width:8px;height:8px;border-radius:50%;display:inline-block;"></span> ${c.label}</div>`
  ).join("");

  const scoreBlock =
    s.type === "candidate"
      ? `<div class="detail-section">
          <h4>Site score</h4>
          <div style="font-size:22px;font-weight:700;color:${s.score !== null ? "var(--green)" : "var(--text-dim)"}">
            ${s.score !== null ? s.score : "Not scored yet"}
          </div>
          ${s.subscores ? `
            <div class="detail-row"><span>Traffic / footfall</span><span>${s.subscores.traffic}</span></div>
            <div class="detail-row"><span>Competitor EV density</span><span>${s.subscores.competition}</span></div>
            <div class="detail-row"><span>Highway proximity</span><span>${s.subscores.highway}</span></div>
            <div class="detail-row"><span>Nearby demand</span><span>${s.subscores.demand}</span></div>
          ` : ""}
        </div>`
      : "";

  const status = STATUS_LEVELS[s.status];
  content.innerHTML = `
    <div class="detail-title">${escapeHtml(s.name)}</div>
    <div class="detail-address">${escapeHtml(s.address)}</div>

    <div class="detail-section">
      <h4>Status</h4>
      <div style="color:${status.color};font-weight:600;">● ${status.label}</div>
    </div>

    ${scoreBlock}

    <div class="detail-section">
      <h4>Branch contact person</h4>
      <div>${escapeHtml(s.manager.name)}</div>
      <div style="color:var(--text-dim);font-size:12px;">${escapeHtml(s.manager.phone)}</div>
    </div>

    <div class="detail-section">
      <h4>Site territory manager</h4>
      <div>${escapeHtml(s.territoryManager.name)}</div>
      <div style="color:var(--text-dim);font-size:12px;">${escapeHtml(s.territoryManager.phone)} · ${escapeHtml(s.territoryManager.territory)}</div>
    </div>

    <div class="detail-section">
      <h4>Nearby POIs (500m)</h4>
      <div style="font-size:12px;color:var(--text-dim);margin-bottom:6px;">Use the "Show nearby POIs" switch on the map to toggle these on/off.</div>
      ${poiRows}
    </div>
  `;

  // If the map's POI switch is already on, refresh pins for the newly selected site.
  if (poiToggleEl && poiToggleEl.checked) {
    togglePoiExplorer(s, true);
  }
}

document.getElementById("close-detail").addEventListener("click", () => {
  document.getElementById("site-detail").classList.add("hidden");
  clearPoiMarkers();
  selectedSite = null;
  if (poiToggleEl) poiToggleEl.checked = false;
});

/* ---------------------------------------------------------------------- */

boot();
