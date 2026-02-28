// Interactive health map using Leaflet (OpenStreetMap) + Firestore data (modular v12.10.0)

import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-auth.js";
import {
  collection,
  getDocs,
  addDoc,
} from "https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js";

const MAP_CENTER = [13.359186270361304, 123.7280872178295];

let map;
let markerItems = [];
let selectedLat = null;
let selectedLng = null;
let tempMarker = null;

function getDisease(data) {
  // Be tolerant of different field names or casing from Firestore
  return (
    data.disease ||
    data.diseaseType ||
    data.Disease ||
    data.disease_type ||
    ""
  );
}

function colorForDisease(diseaseRaw) {
  const disease = (diseaseRaw || "").toLowerCase();
  if (disease.includes("diab")) return "#FF6500";
  if (disease.includes("cardio")) return "#CC561E";
  if (disease.includes("resp")) return "#F6CE71";
  return "#C40C0C"; // default: hypertension / other
}

function riskPillClass(riskRaw) {
  const risk = (riskRaw || "").toLowerCase();
  if (risk === "high") return "risk-high";
  if (risk === "medium") return "risk-medium";
  if (risk === "low") return "risk-low";
  return "";
}

function popupHtml(data) {
  const disease = getDisease(data);
  return `
    <div class="gm-health-info">
      <div class="popup-title">${data.householdId || "Household / Location"}</div>
      <div class="popup-row">
        <span class="popup-label">Disease:</span> ${disease || "N/A"}
      </div>
      <div class="popup-row">
        <span class="popup-label">Total Cases:</span> ${data.cases ?? "N/A"}
      </div>
      <div class="popup-row">
        <span class="popup-label">Risk Level:</span>
        <span class="risk-pill ${riskPillClass(data.riskLevel)}">${data.riskLevel || "Unspecified"}</span>
      </div>
      ${
        data.lastUpdated
          ? `<div class="popup-row"><span class="popup-label">Last Monitoring Date:</span> ${data.lastUpdated}</div>`
          : ""
      }
      ${
        data.bhwAssigned
          ? `<div class="popup-row"><span class="popup-label">Assigned BHW:</span> ${data.bhwAssigned}</div>`
          : ""
      }
      ${
        data.label
          ? `<div class="popup-row"><span class="popup-label">Label:</span> ${data.label}</div>`
          : ""
      }
      ${
        data.street
          ? `<div class="popup-row"><span class="popup-label">Street:</span> ${data.street}</div>`
          : ""
      }
    </div>
  `;
}

async function initMap() {
  const container = document.getElementById("health-map");
  if (!container) return;

  map = L.map("health-map").setView(MAP_CENTER, 18);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "&copy; OpenStreetMap contributors",
  }).addTo(map);

  await loadHouseholdMarkers();
  setupFiltersAndSearch();
}

async function loadHouseholdMarkers() {
  try {
    const snapshot = await getDocs(collection(db, "households"));
    markerItems = [];

    snapshot.forEach((doc) => {
      const data = doc.data();
      if (typeof data.latitude !== "number" || typeof data.longitude !== "number") {
        return;
      }

      const position = [data.latitude, data.longitude];
      const disease = getDisease(data);
      const color = colorForDisease(data.disease);

      addMarkerToMap(doc.id, { ...data, disease }, color, position);
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Error loading household data from Firestore:", err);
    showSearchFeedback("Failed to load household data.");
  }
}

function showSearchFeedback(message) {
  const el = document.getElementById("map-search-feedback");
  if (el) el.textContent = message;
}

function showMapToast(message) {
  const toast = document.getElementById("map-toast");
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("map-toast-visible");
  window.clearTimeout(window._mapToastTimer);
  window._mapToastTimer = window.setTimeout(() => {
    toast.classList.remove("map-toast-visible");
  }, 3500);
}

function applyFilter(filter) {
  const normalized = (filter || "all").toLowerCase();

  markerItems.forEach((item) => {
    const matches =
      normalized === "all"
        ? true
        : item.diseaseLower.includes(normalized);

    if (matches) {
      if (!map.hasLayer(item.marker)) {
        item.marker.addTo(map);
      }
    } else {
      if (map.hasLayer(item.marker)) {
        map.removeLayer(item.marker);
      }
    }
  });
}

function focusOnMatch(query) {
  const q = query.trim().toLowerCase();
  if (!q) {
    showSearchFeedback("Please enter a search term.");
    return;
  }

  const match = markerItems.find(
    (item) =>
      item.householdIdLower.includes(q) ||
      item.labelLower.includes(q) ||
      item.streetLower.includes(q) ||
      item.diseaseLower.includes(q)
  );

  if (!match) {
    showSearchFeedback("No matching households found.");
    return;
  }

  const latLng = match.marker.getLatLng();
  map.setView(latLng, 19);

  const el = match.marker.getElement();
  if (el) {
    el.classList.add("marker-pulse");
    window.setTimeout(() => el.classList.remove("marker-pulse"), 1400);
  }

  match.marker.openPopup();
  showSearchFeedback("Household highlighted on the map.");
}

function setupFiltersAndSearch() {
  // Filters
  document.querySelectorAll(".filter-chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      const filter = chip.getAttribute("data-filter") || "all";
      document
        .querySelectorAll(".filter-chip")
        .forEach((c) => c.classList.remove("active"));
      chip.classList.add("active");
      applyFilter(filter);
    });
  });

  // Search
  const searchInput = document.getElementById("map-search-input");
  const searchButton = document.getElementById("map-search-btn");

  if (searchButton && searchInput) {
    searchButton.addEventListener("click", () => {
      focusOnMatch(searchInput.value);
    });
    searchInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        focusOnMatch(searchInput.value);
      }
    });
  }
}

function openHouseholdForm() {
  document.body.classList.add("adding-household");
}

function closeHouseholdForm() {
  document.body.classList.remove("adding-household");
}

async function setupAddHouseholdFlow() {
  const addBtn = document.getElementById("addHouseholdBtn");
  const saveBtn = document.getElementById("saveHousehold");
  const cancelBtn = document.getElementById("cancelHousehold");

  if (!addBtn || !saveBtn || !cancelBtn) return;

  addBtn.addEventListener("click", () => {
    showMapToast("Click on the map to select household location.");
    map.on("click", (e) => {
      selectedLat = e.latlng.lat;
      selectedLng = e.latlng.lng;

      if (tempMarker) {
        map.removeLayer(tempMarker);
      }

      tempMarker = L.marker([selectedLat, selectedLng]).addTo(map);
      openHouseholdForm();
    });
  });

  cancelBtn.addEventListener("click", () => {
    if (tempMarker) {
      map.removeLayer(tempMarker);
      tempMarker = null;
    }
    selectedLat = null;
    selectedLng = null;
    closeHouseholdForm();
  });

  saveBtn.addEventListener("click", async () => {
    if (selectedLat === null || selectedLng === null) {
      alert("Please select a location on the map first.");
      return;
    }

    const householdIdInput = document.getElementById("householdId");
    const diseaseSelect = document.getElementById("disease");
    const casesInput = document.getElementById("cases");
    const riskLevelSelect = document.getElementById("riskLevel");
    const bhwInput = document.getElementById("bhwAssigned");
    const lastUpdatedInput = document.getElementById("lastUpdated");

    const newData = {
      householdId: householdIdInput?.value?.trim() || "",
      disease: diseaseSelect?.value || "",
      cases: casesInput?.value ? Number(casesInput.value) : 0,
      riskLevel: riskLevelSelect?.value || "Low",
      bhwAssigned: bhwInput?.value?.trim() || "",
      lastUpdated: lastUpdatedInput?.value || "",
      latitude: selectedLat,
      longitude: selectedLng,
    };

    if (!newData.householdId) {
      alert("Household ID is required.");
      return;
    }

    try {
      const docRef = await addDoc(collection(db, "households"), newData);
      alert("Household added successfully.");

      // Remove temp pin, reset form
      if (tempMarker) {
        map.removeLayer(tempMarker);
        tempMarker = null;
      }
      householdIdInput.value = "";
      casesInput.value = "";
      bhwInput.value = "";
      lastUpdatedInput.value = "";
      selectedLat = null;
      selectedLng = null;

      closeHouseholdForm();

      const disease = getDisease(newData);
      const position = [newData.latitude, newData.longitude];
      const color = colorForDisease(disease);
      addMarkerToMap(docRef.id, { ...newData, disease }, color, position);
    } catch (err) {
      // eslint-disable-next-line no-alert
      alert("Error saving data: " + (err?.message || String(err)));
    }
  });
}

function addMarkerToMap(id, data, colorOverride, positionOverride) {
  const position = positionOverride || [data.latitude, data.longitude];
  const disease = getDisease(data);
  const color = colorOverride || colorForDisease(disease);

  const marker = L.circleMarker(position, {
    radius: 8,
    color,
    weight: 2,
    fillColor: color,
    fillOpacity: 0.85,
  }).addTo(map);

  marker.bindPopup(popupHtml(data));

  markerItems.push({
    id,
    marker,
    data,
    diseaseLower: (disease || "").toLowerCase(),
    householdIdLower: (data.householdId || id || "").toLowerCase(),
    labelLower: (data.label || "").toLowerCase(),
    streetLower: (data.street || "").toLowerCase(),
  });
}

// Require authentication before showing the map
onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }
  initMap().then(() => {
    setupAddHouseholdFlow();
  });
});

