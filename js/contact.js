// Contact form validation and success animation
(function () {
  const form = document.getElementById("contactForm");
  const overlay = document.getElementById("contactSuccessOverlay");
  const submitBtn = document.getElementById("contactSubmitBtn");

  const fields = {
    name: { el: document.getElementById("contactName"), err: document.getElementById("errorName") },
    email: { el: document.getElementById("contactEmail"), err: document.getElementById("errorEmail") },
    phone: { el: document.getElementById("contactPhone"), err: document.getElementById("errorPhone") },
    subject: { el: document.getElementById("contactSubject"), err: document.getElementById("errorSubject") },
    message: { el: document.getElementById("contactMessage"), err: document.getElementById("errorMessage") },
  };

  const validators = {
    name: (v) => (v.trim().length >= 2 ? null : "Please enter your full name (at least 2 characters)."),
    email: (v) => {
      const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return re.test(v.trim()) ? null : "Please enter a valid email address.";
    },
    phone: (v) => {
      if (!v.trim()) return null;
      const digits = v.replace(/\D/g, "");
      return digits.length >= 10 ? null : "Please enter a valid 10–11 digit phone number.";
    },
    subject: (v) => (v ? null : "Please select a subject."),
    message: (v) => (v.trim().length >= 10 ? null : "Please enter a message (at least 10 characters)."),
  };

  function showError(fieldKey, message) {
    const f = fields[fieldKey];
    if (!f) return;
    f.err.textContent = message || "";
    f.err.style.display = message ? "block" : "none";
    if (f.el) {
      f.el.setAttribute("aria-invalid", message ? "true" : "false");
      f.el.classList.toggle("input-error", !!message);
    }
  }

  function validateField(key) {
    const f = fields[key];
    if (!f || !f.el) return true;
    const value = f.el.value || "";
    const msg = validators[key](value);
    showError(key, msg);
    return !msg;
  }

  function validateForm() {
    let valid = true;
    Object.keys(validators).forEach((key) => {
      if (!validateField(key)) valid = false;
    });
    return valid;
  }

  function showSuccessAnimation() {
    if (!overlay) return;
    overlay.setAttribute("aria-hidden", "false");
    overlay.classList.add("contact-success-visible");
  }

  function resetForm() {
    if (form) form.reset();
    Object.keys(fields).forEach((key) => showError(key, ""));
    if (overlay) {
      overlay.setAttribute("aria-hidden", "true");
      overlay.classList.remove("contact-success-visible");
    }
  }

  if (form) {
    Object.keys(fields).forEach((key) => {
      const f = fields[key];
      if (f && f.el) {
        f.el.addEventListener("blur", () => validateField(key));
        f.el.addEventListener("input", () => showError(key, ""));
      }
    });

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!validateForm()) return;

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "Sending...";
      }

      // Simulate submit (replace with actual API/email service later)
      setTimeout(() => {
        showSuccessAnimation();
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = "Send Message";
        }
        // Reset form and hide overlay after animation
        setTimeout(() => {
          resetForm();
        }, 2500);
      }, 600);
    });
  }
})();
