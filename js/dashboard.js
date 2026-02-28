// Dashboard charts + auth gate (modular Firebase v12.10.0)

import { auth } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-auth.js";

// Protect dashboard route – redirect unauthenticated users
onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.href = "login.html";
  }
});

// Chart.js setup
document.addEventListener("DOMContentLoaded", () => {
  if (typeof Chart === "undefined") return;

  const barCtx = document.getElementById("barChartCases");
  const pieCtx = document.getElementById("pieChartDistribution");
  const lineCtx = document.getElementById("lineChartTrend");

  if (barCtx) {
    new Chart(barCtx, {
      type: "bar",
      data: {
        labels: ["Hypertension", "Diabetes", "Cardiovascular", "Respiratory", "Other"],
        datasets: [
          {
            label: "Cases",
            data: [140, 60, 30, 10, 8],
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
    new Chart(pieCtx, {
      type: "pie",
      data: {
        labels: ["Hypertension", "Diabetes", "Cardiovascular", "Respiratory"],
        datasets: [
          {
            data: [56, 24, 12, 8],
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
    new Chart(lineCtx, {
      type: "line",
      data: {
        labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
        datasets: [
          {
            label: "Total NCD Cases",
            data: [180, 190, 205, 220, 235, 248],
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

  // Simple counter animation for summary stats
  document.querySelectorAll("[data-counter]").forEach((el) => {
    const target = Number(el.getAttribute("data-counter") || "0");
    let current = 0;
    const steps = 40;
    const increment = target / steps;

    const timer = window.setInterval(() => {
      current += increment;
      if (current >= target) {
        current = target;
        window.clearInterval(timer);
      }
      el.textContent = Math.round(current);
    }, 28);
  });
});

