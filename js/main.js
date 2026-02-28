// Main shared interactions: nav, preloader, scroll animations, simple forms

document.addEventListener("DOMContentLoaded", () => {
  const body = document.body;

  // Preloader
  const preloader = document.getElementById("preloader");
  if (preloader) {
    window.setTimeout(() => {
      preloader.classList.add("hidden");
      window.setTimeout(() => preloader.remove(), 600);
    }, 700);
  }

  // Dynamic year in footer
  const yearSpan = document.getElementById("year");
  if (yearSpan) {
    yearSpan.textContent = String(new Date().getFullYear());
  }

  // Mobile nav toggle
  const navToggle = document.querySelector(".nav-toggle");
  const navLinks = document.querySelector(".nav-links");
  if (navToggle && navLinks) {
    navToggle.addEventListener("click", () => {
      navLinks.classList.toggle("open");
    });
  }

  // Scroll-triggered animations
  const animatedEls = document.querySelectorAll("[data-animate]");
  if ("IntersectionObserver" in window && animatedEls.length) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in-view");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );
    animatedEls.forEach((el) => observer.observe(el));
  } else {
    animatedEls.forEach((el) => el.classList.add("in-view"));
  }

  // Accordion behavior (About page)
  document.querySelectorAll(".accordion-header").forEach((header) => {
    header.addEventListener("click", () => {
      const item = header.closest(".accordion-item");
      const bodyEl = item.querySelector(".accordion-body");
      const expanded = header.getAttribute("aria-expanded") === "true";

      header.setAttribute("aria-expanded", String(!expanded));
      bodyEl.setAttribute("aria-hidden", String(expanded));
    });
  });

  // Simple contact form validation (front-end only)
  const contactForm = document.getElementById("contact-form");
  if (contactForm) {
    contactForm.addEventListener("submit", (e) => {
      e.preventDefault();

      const nameInput = document.getElementById("contact-name");
      const emailInput = document.getElementById("contact-email");
      const roleSelect = document.getElementById("contact-role");
      const messageTextarea = document.getElementById("contact-message");
      const successEl = document.getElementById("contact-success");

      const fields = [
        { el: nameInput, key: "contact-name", label: "Full Name" },
        { el: emailInput, key: "contact-email", label: "Email Address" },
        { el: roleSelect, key: "contact-role", label: "Role" },
        { el: messageTextarea, key: "contact-message", label: "Message" },
      ];

      let hasError = false;
      fields.forEach(({ el, key, label }) => {
        const errorEl = document.querySelector(`.form-error[data-for="${key}"]`);
        if (!el.value.trim()) {
          hasError = true;
          if (errorEl) errorEl.textContent = `${label} is required.`;
        } else {
          if (key === "contact-email" && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(el.value)) {
            hasError = true;
            if (errorEl) errorEl.textContent = "Please enter a valid email address.";
          } else {
            if (errorEl) errorEl.textContent = "";
          }
        }
      });

      if (hasError) {
        if (successEl) successEl.textContent = "";
        return;
      }

      // Simulated success (no backend submission here)
      if (successEl) {
        successEl.textContent =
          "Thank you for reaching out. Your message has been recorded locally for this demo.";
      }
      contactForm.reset();
    });
  }
});

