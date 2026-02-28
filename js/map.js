// Interactive health map using Leaflet + Firestore data (modular v12.10.0)

import { db } from "./firebase-config.js";
import {
  collection,
  getDocs,
} from "https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js";

const mapContainer = document.getElementById("health-map");
if (mapContainer && typeof L !== "undefined") {
  // Initialize map (set to a generic barangay location; update as needed)
  const map = L.map("health-map").setView([14.5995, 120.9842], 14);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "&copy; OpenStreetMap contributors",
  }).addTo(map);

  const markers = [];

  function colorForDisease(diseaseRaw) {
    const disease = (diseaseRaw || "").toLowerCase();
    if (disease.includes("diab")) return "#FF6500";
    if (disease.includes("cardio")) return "#CC561E";
    if (disease.includes("resp")) return "#F6CE71";
    return "#C40C0C"; // default: hypertension / other
  }

  function popupContent(data) {
    const disease = data.disease || "N/A";
    const cases = data.cases ?? "N/A";
    const risk = data.riskLevel || "Unspecified";
    const label = data.label || "";
    const lastUpdated = data.lastUpdated || "";

    return `
      <div class="popup-title">${label || "Household / Location"}</div>
      <div class="popup-row">
        <span class="popup-label">Disease:</span> ${disease}
      </div>
      <div class="popup-row">
        <span class="popup-label">Cases:</span> ${cases}
      </div>
      <div class="popup-row">
        <span class="popup-label">Risk Level:</span>
        <span class="risk-pill ${riskPillClass(risk)}">${risk}</span>
      </div>
      ${
        lastUpdated
          ? `<div class="popup-row"><span class="popup-label">Last Updated:</span> ${lastUpdated}</div>`
          : ""
      }
    `;
  }

  function riskPillClass(riskRaw) {
    const risk = (riskRaw || "").toLowerCase();
    if (risk === "high") return "risk-high";
    if (risk === "medium") return "risk-medium";
    if (risk === "low") return "risk-low";
    return "";
  }

  async function loadMarkers() {
    try {
      const snapshot = await getDocs(collection(db, "ncd_cases"));

      snapshot.forEach((doc) => {
        const data = doc.data();

        if (typeof data.latitude !== "number" || typeof data.longitude !== "number") {
          return;
        }

        const markerColor = colorForDisease(data.disease);

        const marker = L.circleMarker([data.latitude, data.longitude], {
          radius: 8,
          color: markerColor,
          weight: 2,
          fillColor: markerColor,
          fillOpacity: 0.85,
        }).addTo(map);

        marker.bindPopup(popupContent(data));

        markers.push({
          id: doc.id,
          marker,
          disease: (data.disease || "").toLowerCase(),
          risk: (data.riskLevel || "").toLowerCase(),
          label: (data.label || "").toLowerCase(),
        });
      });
    } catch (err) {
      // If Firestore is locked down or offline, fail silently for now
      // eslint-disable-next-line no-console
      console.error("Error loading map data from Firestore:", err);
    }
  }

  // Filtering by disease type
  function applyFilter(filter) {
    markers.forEach((item) => {
      const { marker, disease } = item;
      const matches =
        filter === "all"
          ? true
          : disease.includes(filter.toLowerCase());

      if (matches) {
        marker.addTo(map);
      } else {
        map.removeLayer(marker);
      }
    });
  }

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

  // Search by label (e.g., street / house label)
  const searchInput = document.getElementById("map-search-input");
  const searchButton = document.getElementById("map-search-btn");
  const searchFeedback = document.getElementById("map-search-feedback");

  function focusOnMatch(query) {
    const q = query.trim().toLowerCase();
    if (!q) {
      if (searchFeedback) searchFeedback.textContent = "Please enter a search term.";
      return;
    }

    const match = markers.find(
      (item) =>
        item.label.includes(q) ||
        item.id.toLowerCase().includes(q) ||
        item.disease.includes(q)
    );

    if (!match) {
      if (searchFeedback) searchFeedback.textContent = "No matching locations found.";
      return;
    }

    const latLng = match.marker.getLatLng();
    map.setView(latLng, 18);

    const el = match.marker.getElement();
    if (el) {
      el.classList.add("marker-pulse");
      window.setTimeout(() => el.classList.remove("marker-pulse"), 1600);
    }

    if (searchFeedback) searchFeedback.textContent = "Location highlighted on the map.";
  }

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

  // Initial load
  loadMarkers();
}

