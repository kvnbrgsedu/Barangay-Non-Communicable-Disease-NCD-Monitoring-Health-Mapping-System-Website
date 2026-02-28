// Dashboard charts + auth gate (modular Firebase v12.10.0)

import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-auth.js";
import {
  collection,
  getDocs,
} from "https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js";

const DISEASE_ORDER = ["Hypertension", "Diabetes", "Cardiovascular", "Respiratory", "Other"];
const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// Protect dashboard route – redirect unauthenticated users
onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.href = "login.html";
  }
});

// Chart.js + Firestore-driven data (no hardcoded data; all from Firebase)
document.addEventListener("DOMContentLoaded", async () => {
  if (typeof Chart === "undefined") return;

  const dashboardData = await loadDashboardDataFromFirestore();
  const data = dashboardData || getEmptyDashboardData();

  updateSummaryCards(data);
  renderChartsFromData(data);
  runSummaryCountersAnimation();
});

function getEmptyDashboardData() {
  const casesPerDisease = {};
  DISEASE_ORDER.forEach((d) => { casesPerDisease[d] = 0; });
  return {
    casesPerDisease,
    totalCases: 0,
    highRiskHouseholds: 0,
    trendLabels: ["Total"],
    trendData: [0],
    monthlyIncreasePercent: null,
    mostCommonDisease: "—",
  };
}

async function loadDashboardDataFromFirestore() {
  try {
    const snapshot = await getDocs(collection(db, "households"));

    const casesPerDisease = {};
    DISEASE_ORDER.forEach((d) => {
      casesPerDisease[d] = 0;
    });

    let totalCases = 0;
    let highRiskHouseholds = 0;

    const monthBuckets = new Map(); // key: YYYYMM number -> { label, totalCases }

    snapshot.forEach((doc) => {
      const data = doc.data() || {};

      const rawDisease = String(data.disease || data.diseaseType || "").trim();
      const cases = typeof data.cases === "number" ? data.cases : Number(data.cases || 0);
      const risk = String(data.riskLevel || "").toLowerCase();

      if (Number.isNaN(cases) || cases < 0) return;

      totalCases += cases;

      if (risk === "high") {
        highRiskHouseholds += 1;
      }

      let diseaseKey =
        DISEASE_ORDER.find(
          (name) => name.toLowerCase() === rawDisease.toLowerCase()
        ) || "Other";

      if (!(diseaseKey in casesPerDisease)) {
        casesPerDisease[diseaseKey] = 0;
      }
      casesPerDisease[diseaseKey] += cases;

      if (data.lastUpdated) {
        const d = new Date(data.lastUpdated);
        if (!Number.isNaN(d.getTime())) {
          const ymKey = d.getFullYear() * 100 + (d.getMonth() + 1);
          const label = `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
          const current = monthBuckets.get(ymKey) || { label, totalCases: 0 };
          current.totalCases += cases;
          monthBuckets.set(ymKey, current);
        }
      }
    });

    const sortedMonthKeys = Array.from(monthBuckets.keys()).sort((a, b) => a - b);
    let trendLabels = sortedMonthKeys.map((k) => monthBuckets.get(k).label);
    let trendData = sortedMonthKeys.map((k) => monthBuckets.get(k).totalCases);

    if (trendLabels.length === 0) {
      // Fallback: single point with total cases if there is no date info yet
      trendLabels = ["Total"];
      trendData = [totalCases];
    }

    let monthlyIncreasePercent = null;
    if (trendData.length >= 2) {
      const latest = trendData[trendData.length - 1];
      const prev = trendData[trendData.length - 2];
      if (prev > 0) {
        monthlyIncreasePercent = Math.round(((latest - prev) / prev) * 100);
      }
    }

    const mostCommon = Object.entries(casesPerDisease).reduce(
      (best, [name, value]) =>
        value > best.count ? { name, count: value } : best,
      { name: "N/A", count: 0 }
    );

    return {
      casesPerDisease,
      totalCases,
      highRiskHouseholds,
      trendLabels,
      trendData,
      monthlyIncreasePercent,
      mostCommonDisease: mostCommon.name,
    };
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Failed to load dashboard data from Firestore:", err);
    return null;
  }
}

function updateSummaryCards(data) {
  const counters = Array.from(document.querySelectorAll("[data-counter]"));

  const totalCasesEl = counters[0];
  const highRiskEl = counters[1];
  const monthlyIncreaseEl = counters[2];

  if (totalCasesEl) {
    totalCasesEl.setAttribute("data-counter", String(data.totalCases || 0));
    totalCasesEl.textContent = "0";
  }

  if (highRiskEl) {
    highRiskEl.setAttribute(
      "data-counter",
      String(data.highRiskHouseholds || 0)
    );
    highRiskEl.textContent = "0";
  }

  if (monthlyIncreaseEl) {
    const value =
      typeof data.monthlyIncreasePercent === "number"
        ? Math.abs(data.monthlyIncreasePercent)
        : 0;
    monthlyIncreaseEl.setAttribute("data-counter", String(value));
    monthlyIncreaseEl.textContent = "0";
  }

  const mostCommonEl = document.querySelector("[data-most-common]");
  if (mostCommonEl) {
    mostCommonEl.textContent = data.mostCommonDisease || "—";
  }
}

function renderChartsFromData(data) {
  const barCtx = document.getElementById("barChartCases");
  const pieCtx = document.getElementById("pieChartDistribution");
  const lineCtx = document.getElementById("lineChartTrend");

  const barLabels = DISEASE_ORDER;
  const barValues = barLabels.map((label) => data.casesPerDisease[label] || 0);

  if (barCtx) {
    // eslint-disable-next-line no-new
    new Chart(barCtx, {
      type: "bar",
      data: {
        labels: barLabels,
        datasets: [
          {
            label: "Cases",
            data: barValues,
            backgroundColor: [
              "#C40C0C",
              "#FF6500",
              "#CC561E",
              "#F6CE71",
              "rgba(0,0,0,0.12)",
            ],
            borderRadius: 6,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { precision: 0 },
          },
        },
      },
    });
  }

  if (pieCtx) {
    // Use the first four disease groups for percentage distribution
    const pieLabels = DISEASE_ORDER.slice(0, 4);
    const pieValues = pieLabels.map(
      (label) => data.casesPerDisease[label] || 0
    );

    // eslint-disable-next-line no-new
    new Chart(pieCtx, {
      type: "pie",
      data: {
        labels: pieLabels,
        datasets: [
          {
            data: pieValues,
            backgroundColor: ["#C40C0C", "#FF6500", "#CC561E", "#F6CE71"],
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: "bottom",
          },
        },
      },
    });
  }

  if (lineCtx) {
    // eslint-disable-next-line no-new
    new Chart(lineCtx, {
      type: "line",
      data: {
        labels: data.trendLabels,
        datasets: [
          {
            label: "Total NCD Cases",
            data: data.trendData,
            borderColor: "#C40C0C",
            backgroundColor: "rgba(196, 12, 12, 0.15)",
            tension: 0.35,
            fill: true,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            display: false,
          },
        },
        scales: {
          y: {
            beginAtZero: false,
          },
        },
      },
    });
  }
}

function runSummaryCountersAnimation() {
  document.querySelectorAll("[data-counter]").forEach((el) => {
    const target = Number(el.getAttribute("data-counter") || "0");
    const suffix = el.getAttribute("data-suffix") || "";
    let current = 0;
    const steps = 40;
    const increment = steps > 0 ? target / steps : 0;

    const timer = window.setInterval(() => {
      current += increment;
      if (current >= target) {
        current = target;
        window.clearInterval(timer);
      }
      el.textContent = String(Math.round(current)) + suffix;
    }, 28);
  });
}

