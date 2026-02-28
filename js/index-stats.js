// Index page: load hero stats from Firebase when user is logged in
import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-auth.js";
import {
  collection,
  getDocs,
} from "https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js";

const DISEASE_ORDER = ["Hypertension", "Diabetes", "Cardiovascular", "Respiratory", "Other"];

function setPlaceholder() {
  const totalEl = document.querySelector("[data-index-total-cases]");
  const highRiskEl = document.querySelector("[data-index-high-risk]");
  const mostCommonEl = document.querySelector("[data-index-most-common]");
  if (totalEl) totalEl.textContent = "—";
  if (highRiskEl) highRiskEl.textContent = "—";
  if (mostCommonEl) mostCommonEl.textContent = "—";
}

async function fetchAndUpdateIndexStats() {
  const totalEl = document.querySelector("[data-index-total-cases]");
  const highRiskEl = document.querySelector("[data-index-high-risk]");
  const mostCommonEl = document.querySelector("[data-index-most-common]");
  if (!totalEl && !highRiskEl && !mostCommonEl) return;

  try {
    const snapshot = await getDocs(collection(db, "households"));
    const casesPerDisease = {};
    DISEASE_ORDER.forEach((d) => { casesPerDisease[d] = 0; });
    let totalCases = 0;
    let highRiskHouseholds = 0;

    snapshot.forEach((doc) => {
      const data = doc.data() || {};
      const rawDisease = String(data.disease || data.diseaseType || "").trim();
      const cases = typeof data.cases === "number" ? data.cases : Number(data.cases || 0);
      const risk = String(data.riskLevel || "").toLowerCase();
      if (Number.isNaN(cases) || cases < 0) return;
      totalCases += cases;
      if (risk === "high") highRiskHouseholds += 1;
      const diseaseKey =
        DISEASE_ORDER.find((n) => n.toLowerCase() === rawDisease.toLowerCase()) || "Other";
      casesPerDisease[diseaseKey] = (casesPerDisease[diseaseKey] || 0) + cases;
    });

    const mostCommon = Object.entries(casesPerDisease).reduce(
      (best, [name, value]) => (value > best.count ? { name, count: value } : best),
      { name: "—", count: 0 }
    );

    if (totalEl) totalEl.textContent = String(totalCases);
    if (highRiskEl) highRiskEl.textContent = String(highRiskHouseholds);
    if (mostCommonEl) mostCommonEl.textContent = mostCommon.name;
  } catch (err) {
    setPlaceholder();
  }
}

document.addEventListener("DOMContentLoaded", () => {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      fetchAndUpdateIndexStats();
    } else {
      setPlaceholder();
    }
  });
});
