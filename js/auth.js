// Authentication logic: register, login, logout using Firebase Auth (modular v12.10.0)

import { auth } from "./firebase-config.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/12.10.0/firebase-auth.js";

// Helper for setting feedback text
function setText(id, message) {
  const el = document.getElementById(id);
  if (el) el.textContent = message;
}

// Redirect logged-in users away from the login page
onAuthStateChanged(auth, (user) => {
  const isAuthPage = document.body.classList.contains("page-auth");
  if (user && isAuthPage) {
    window.location.href = "dashboard.html";
  }
});

// REGISTER
const registerForm = document.getElementById("registerForm");

if (registerForm) {
  registerForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const email = registerForm.email.value.trim();
    const password = registerForm.password.value.trim();

    if (!email || !password) {
      setText("register-feedback", "Email and password are required.");
      return;
    }

    createUserWithEmailAndPassword(auth, email, password)
      .then(() => {
        setText("register-feedback", "Account created successfully. You can now log in.");
        // Go back to login view
        showAuthView("login");
      })
      .catch((error) => {
        setText("register-feedback", error.message || "Unable to create account.");
      });
  });
}

// LOGIN
const loginForm = document.getElementById("loginForm");

if (loginForm) {
  const loginButton = document.getElementById("login-submit");

  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const email = loginForm.email.value.trim();
    const password = loginForm.password.value.trim();

    if (!email || !password) {
      setText("login-feedback", "Email and password are required.");
      return;
    }

    if (loginButton) {
      loginButton.classList.add("btn-loading");
    }
    setText("login-feedback", "");

    signInWithEmailAndPassword(auth, email, password)
      .then(() => {
        window.location.href = "dashboard.html";
      })
      .catch(() => {
        setText("login-feedback", "Invalid credentials. Please try again.");
      })
      .finally(() => {
        if (loginButton) {
          loginButton.classList.remove("btn-loading");
        }
      });
  });
}

// LOGOUT
const logoutBtn = document.getElementById("logout");

if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    signOut(auth)
      .then(() => {
        window.location.href = "login.html";
      })
      .catch(() => {
        // Silent failure; keep user on page
      });
  });
}

// FORGOT PASSWORD
const forgotForm = document.getElementById("forgotForm");
if (forgotForm) {
  forgotForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = forgotForm.email.value.trim();
    if (!email) {
      setText("forgot-feedback", "Please enter your email address.");
      return;
    }

    sendPasswordResetEmail(auth, email)
      .then(() => {
        setText("forgot-feedback", "Password reset email sent.");
      })
      .catch((error) => {
        setText("forgot-feedback", error.message || "Unable to send reset email.");
      });
  });
}

// Simple view switching between login / register / forgot
function showAuthView(view) {
  const loginSection = document.getElementById("loginForm");
  const registerSection = document.getElementById("registerForm");
  const forgotSection = document.getElementById("forgotForm");

  if (loginSection) loginSection.hidden = view !== "login";
  if (registerSection) registerSection.hidden = view !== "register";
  if (forgotSection) forgotSection.hidden = view !== "forgot";
}

const registerLink = document.getElementById("register-link");
const forgotLink = document.getElementById("forgot-password-link");

if (registerLink) {
  registerLink.addEventListener("click", (e) => {
    e.preventDefault();
    showAuthView("register");
  });
}

if (forgotLink) {
  forgotLink.addEventListener("click", (e) => {
    e.preventDefault();
    showAuthView("forgot");
  });
}

