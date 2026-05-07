(() => {
  const STORAGE_KEY = "portfolio-theme";
  const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

  const dom = {
    html: document.documentElement,
    body: document.body,
    navbar: document.getElementById("navbar"),
    navLinks: document.getElementById("navLinks"),
    navAnchors: [...document.querySelectorAll('a[href^="#"]')],
    sectionAnchors: [...document.querySelectorAll('.nav-link[href^="#"]')],
    sections: [...document.querySelectorAll("section[id]")],
    themeToggle: document.getElementById("themeToggle"),
    hamburger: document.getElementById("hamburger"),
    backToTop: document.getElementById("backToTop"),
    animatedItems: [...document.querySelectorAll("[data-animate]")],
    statNumbers: [...document.querySelectorAll(".stat-number[data-count]")],
    skillBars: [...document.querySelectorAll(".skill-bar-fill[data-width]")],
    filterButtons: [...document.querySelectorAll(".filter-btn[data-filter]")],
    portfolioCards: [...document.querySelectorAll(".portfolio-card[data-category]")],
    contactForm: document.getElementById("contactForm"),
  };

  const state = {
    statsAnimated: false,
    skillBarsAnimated: false,
  };

  const prefersReducedMotion = window.matchMedia(REDUCED_MOTION_QUERY);

  function init() {
    applyAnimationDelays();
    initThemeToggle();
    initMobileMenu();
    initSmoothScrolling();
    initScrollUI();
    initScrollAnimations();
    initSectionSpy();
    initPortfolioFilters();
    initExperienceOrbit();
    initContactForm();
  }

  function getStoredTheme() {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch (error) {
      return null;
    }
  }

  function setStoredTheme(theme) {
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch (error) {
      return;
    }
  }

  function getPreferredTheme() {
    const storedTheme = getStoredTheme();

    if (storedTheme === "light" || storedTheme === "dark") {
      return storedTheme;
    }

    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }

  function applyTheme(theme, { persist = true } = {}) {
    dom.html.setAttribute("data-theme", theme);
    dom.body.classList.remove("theme-light", "theme-dark");
    dom.body.classList.add(`theme-${theme}`);

    if (dom.themeToggle) {
      const isDark = theme === "dark";
      dom.themeToggle.setAttribute("aria-pressed", String(isDark));
      dom.themeToggle.setAttribute("aria-label", isDark ? "Switch to light mode" : "Switch to dark mode");
    }

    if (persist) {
      setStoredTheme(theme);
    }
  }

  function initThemeToggle() {
    if (!dom.themeToggle) {
      return;
    }

    applyTheme(getPreferredTheme(), { persist: false });

    dom.themeToggle.addEventListener("click", () => {
      const nextTheme = dom.html.getAttribute("data-theme") === "dark" ? "light" : "dark";
      applyTheme(nextTheme);
    });

    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (event) => {
      if (getStoredTheme()) {
        return;
      }

      applyTheme(event.matches ? "dark" : "light", { persist: false });
    });
  }

  function initMobileMenu() {
    if (!dom.hamburger || !dom.navLinks) {
      return;
    }

    dom.hamburger.addEventListener("click", () => {
      const isOpen = dom.navLinks.classList.toggle("open");
      dom.hamburger.classList.toggle("open", isOpen);
      dom.hamburger.setAttribute("aria-expanded", String(isOpen));
    });

    document.addEventListener("click", (event) => {
      if (!dom.navLinks.classList.contains("open")) {
        return;
      }

      const clickedInsideMenu = dom.navLinks.contains(event.target);
      const clickedHamburger = dom.hamburger.contains(event.target);

      if (!clickedInsideMenu && !clickedHamburger) {
        closeMobileMenu();
      }
    });

    window.addEventListener("resize", () => {
      if (window.innerWidth > 768) {
        closeMobileMenu();
      }
    });
  }

  function closeMobileMenu() {
    if (!dom.hamburger || !dom.navLinks) {
      return;
    }

    dom.navLinks.classList.remove("open");
    dom.hamburger.classList.remove("open");
    dom.hamburger.setAttribute("aria-expanded", "false");
  }

  function initSmoothScrolling() {
    dom.navAnchors.forEach((anchor) => {
      const targetSelector = anchor.getAttribute("href");

      if (!targetSelector || targetSelector === "#") {
        return;
      }

      const target = document.querySelector(targetSelector);

      if (!target) {
        return;
      }

      anchor.addEventListener("click", (event) => {
        event.preventDefault();
        closeMobileMenu();
        scrollToTarget(target);
      });
    });
  }

  function scrollToTarget(target) {
    const navbarHeight = dom.navbar ? dom.navbar.offsetHeight : 0;
    const top = target.getBoundingClientRect().top + window.scrollY - navbarHeight - 12;

    window.scrollTo({
      top: Math.max(top, 0),
      behavior: prefersReducedMotion.matches ? "auto" : "smooth",
    });
  }

  function initScrollUI() {
    const updateOnScroll = () => {
      const scrolled = window.scrollY > 16;

      if (dom.navbar) {
        dom.navbar.classList.toggle("scrolled", scrolled);
      }

      if (dom.backToTop) {
        dom.backToTop.classList.toggle("visible", window.scrollY > 420);
      }
    };

    updateOnScroll();
    window.addEventListener("scroll", updateOnScroll, { passive: true });

    if (dom.backToTop) {
      dom.backToTop.addEventListener("click", () => {
        window.scrollTo({
          top: 0,
          behavior: prefersReducedMotion.matches ? "auto" : "smooth",
        });
      });
    }
  }

  function applyAnimationDelays() {
    dom.animatedItems.forEach((item) => {
      const delay = Number(item.dataset.delay || 0);
      item.style.transitionDelay = `${delay}ms`;
    });
  }

  function initScrollAnimations() {
    if (!dom.animatedItems.length) {
      return;
    }

    if (prefersReducedMotion.matches || !("IntersectionObserver" in window)) {
      dom.animatedItems.forEach((item) => item.classList.add("in-view"));
      animateStats();
      animateSkillBars();
      return;
    }

    const observer = new IntersectionObserver(
      (entries, animationObserver) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            return;
          }

          entry.target.classList.add("in-view");

          if (entry.target.closest("#about")) {
            animateStats();
          }

          if (entry.target.closest("#skills")) {
            animateSkillBars();
          }

          animationObserver.unobserve(entry.target);
        });
      },
      {
        threshold: 0.18,
        rootMargin: "0px 0px -10% 0px",
      }
    );

    dom.animatedItems.forEach((item) => observer.observe(item));
  }

  function animateStats() {
    if (state.statsAnimated) {
      return;
    }

    state.statsAnimated = true;

    dom.statNumbers.forEach((element) => {
      const target = Number(element.dataset.count);

      if (!target) {
        return;
      }

      if (prefersReducedMotion.matches) {
        element.textContent = String(target);
        return;
      }

      const duration = 1400;
      const startTime = performance.now();

      const tick = (now) => {
        const progress = Math.min((now - startTime) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        element.textContent = String(Math.round(target * eased));

        if (progress < 1) {
          window.requestAnimationFrame(tick);
        } else {
          element.textContent = String(target);
        }
      };

      window.requestAnimationFrame(tick);
    });
  }

  function animateSkillBars() {
    if (state.skillBarsAnimated) {
      return;
    }

    state.skillBarsAnimated = true;

    dom.skillBars.forEach((bar) => {
      const width = Number(bar.dataset.width || 0);
      bar.style.width = `${width}%`;
    });
  }

  function initSectionSpy() {
    if (!dom.sections.length || !dom.sectionAnchors.length) {
      return;
    }

    const linkMap = new Map(
      dom.sectionAnchors.map((link) => [link.getAttribute("href"), link])
    );

    const updateActiveSection = () => {
      const navbarHeight = dom.navbar ? dom.navbar.offsetHeight : 0;
      const scrollMarker = window.scrollY + navbarHeight + 80;

      let activeSectionId = `#${dom.sections[0].id}`;

      dom.sections.forEach((section) => {
        if (section.offsetTop <= scrollMarker) {
          activeSectionId = `#${section.id}`;
        }
      });

      linkMap.forEach((link, href) => {
        link.classList.toggle("active", href === activeSectionId);
      });
    };

    updateActiveSection();
    window.addEventListener("scroll", updateActiveSection, { passive: true });
    window.addEventListener("resize", updateActiveSection);
  }

  function initPortfolioFilters() {
    if (!dom.filterButtons.length || !dom.portfolioCards.length) {
      return;
    }

    dom.filterButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const filter = button.dataset.filter || "all";

        dom.filterButtons.forEach((item) => item.classList.toggle("active", item === button));

        dom.portfolioCards.forEach((card) => {
          const shouldShow = filter === "all" || card.dataset.category === filter;
          card.classList.toggle("hidden", !shouldShow);
        });
      });
    });
  }

  function initExperienceOrbit() {
    const orbit = document.querySelector(".experience-orbit");
    const value = document.querySelector(".experience-orbit-value");
    const label = document.querySelector(".experience-orbit-label");
    const list = document.querySelector(".experience-summary-list");
    const rings = [...document.querySelectorAll(".experience-orbit-progress[data-skill][data-percentage]")];
    const items = [...document.querySelectorAll(".experience-summary-item[data-skill][data-percentage]")];

    if (!orbit || !value || !label || !list || !rings.length || !items.length) {
      return;
    }

    const setActiveState = (skill, percentage) => {
      orbit.classList.add("is-hovering");
      list.classList.add("is-hovering");
      value.textContent = percentage;
      label.textContent = "";

      rings.forEach((ring) => {
        ring.classList.toggle("is-active", ring.dataset.skill === skill);
      });

      items.forEach((item) => {
        item.classList.toggle("is-active", item.dataset.skill === skill);
      });
    };

    const clearActiveState = () => {
      orbit.classList.remove("is-hovering");
      list.classList.remove("is-hovering");
      value.textContent = "";
      label.textContent = "";
      rings.forEach((ring) => ring.classList.remove("is-active"));
      items.forEach((item) => item.classList.remove("is-active"));
    };

    [...rings, ...items].forEach((element) => {
      element.addEventListener("mouseenter", () => {
        setActiveState(element.dataset.skill, element.dataset.percentage);
      });

      element.addEventListener("focus", () => {
        setActiveState(element.dataset.skill, element.dataset.percentage);
      });

      element.addEventListener("mouseleave", clearActiveState);
      element.addEventListener("blur", clearActiveState);
    });

    orbit.addEventListener("mouseleave", clearActiveState);
  }

  function initContactForm() {
    if (!dom.contactForm) {
      return;
    }

    dom.contactForm.addEventListener("submit", (event) => {
      event.preventDefault();

      const formData = new FormData(dom.contactForm);
      const name = String(formData.get("name") || "").trim();
      const email = String(formData.get("email") || "").trim();
      const subject = String(formData.get("subject") || "").trim();
      const message = String(formData.get("message") || "").trim();

      if (!name || !email || !subject || !message) {
        dom.contactForm.reportValidity();
        return;
      }

      const mailSubject = encodeURIComponent(subject);
      const mailBody = encodeURIComponent(
        `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`
      );

      window.location.href = `mailto:basitajaz04@gmail.com?subject=${mailSubject}&body=${mailBody}`;
    });
  }

  document.addEventListener("DOMContentLoaded", init);
})();
