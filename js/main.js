(function () {
  const nav = document.getElementById("site-nav");
  const navToggle = document.getElementById("nav-toggle");
  const navLinks = nav ? Array.from(nav.querySelectorAll("a")) : [];
  const onPitch = /pitch\.html$/i.test(window.location.pathname);

  function setCurrentNav() {
    if (onPitch) {
      navLinks.forEach(function (a) {
        if (/pitch\.html/i.test(a.getAttribute("href") || "")) {
          a.setAttribute("aria-current", "true");
        } else {
          a.removeAttribute("aria-current");
        }
      });
      return;
    }
    const h = window.location.hash.replace(/^#/, "");
    const id = h === "live" ? "live" : "home";
    navLinks.forEach(function (a) {
      const href = a.getAttribute("href") || "";
      if (id === "live" && href === "#live") {
        a.setAttribute("aria-current", "true");
      } else if (id === "home" && href === "#home") {
        a.setAttribute("aria-current", "true");
      } else {
        a.removeAttribute("aria-current");
      }
    });
  }

  /** Off-site http(s) links open in a new browsing context with safe rel defaults */
  function initExternalLinksInNewTab() {
    const host = window.location.host;
    document.querySelectorAll("a[href]").forEach(function (a) {
      const raw = a.getAttribute("href");
      if (!raw || raw.trim().startsWith("#")) return;
      try {
        const u = new URL(raw, window.location.href);
        if ((u.protocol === "http:" || u.protocol === "https:") && u.host !== host) {
          a.setAttribute("target", "_blank");
          const parts = (a.getAttribute("rel") || "").split(/\s+/).filter(Boolean);
          ["noopener", "noreferrer"].forEach(function (token) {
            if (parts.indexOf(token) === -1) parts.push(token);
          });
          a.setAttribute("rel", parts.join(" "));
        }
      } catch (_) {
        /* ignore invalid href */
      }
    });
  }

  initExternalLinksInNewTab();

  if (navToggle && nav) {
    navToggle.addEventListener("click", function () {
      const open = !nav.classList.contains("is-open");
      nav.classList.toggle("is-open", open);
      navToggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }

  navLinks.forEach(function (a) {
    a.addEventListener("click", function () {
      if (nav) {
        nav.classList.remove("is-open");
        if (navToggle) navToggle.setAttribute("aria-expanded", "false");
      }
    });
  });

  window.addEventListener("hashchange", setCurrentNav);
  window.addEventListener("load", setCurrentNav);

  /**
   * Populate upcoming shows from a JSON file.
   * Events are rendered in the same order they appear in data/shows.json.
   */
  async function loadShows() {
    const showList = document.getElementById("show-list");
    if (!showList) return;

    try {
      const response = await fetch("data/shows.json", { cache: "no-store" });
      if (!response.ok) throw new Error("Failed to load show data.");
      const shows = await response.json();

      if (!Array.isArray(shows) || shows.length === 0) {
        showList.innerHTML = '<li class="show-list__row">No upcoming shows posted yet.</li>';
        return;
      }

      showList.innerHTML = "";

      shows.forEach(function (show) {
        const row = document.createElement("li");
        row.className = "show-list__row";

        const date = document.createElement("time");
        date.className = "show-list__date";
        date.dateTime = show.date || "";
        date.textContent = show.displayDate || show.date || "TBD";

        const details = document.createElement("div");
        const venue = document.createElement("span");
        venue.className = "show-list__venue";
        venue.textContent = show.venue || "Venue TBA";

        const meta = document.createElement("span");
        meta.className = "show-list__meta";
        meta.textContent = show.city || "Location TBA";

        details.appendChild(venue);
        details.appendChild(document.createTextNode(" — "));
        details.appendChild(meta);

        const cta = document.createElement("a");
        cta.className = "btn-g btn-g--dark";
        cta.href = show.ctaUrl || "#";
        cta.textContent = show.ctaLabel || "Details";

        row.appendChild(date);
        row.appendChild(details);
        row.appendChild(cta);
        showList.appendChild(row);
      });
    } catch (_) {
      showList.innerHTML = '<li class="show-list__row">Could not load shows right now.</li>';
    }
  }

  loadShows();

  /* Hero banner: moves slower than the page (parallax), disabled when reduced motion is preferred */
  const heroImg = document.querySelector(".page-hero__img");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (heroImg) {
    let heroParallaxTicking = false;
    const heroParallaxRate = 0.38;

    function updateHeroParallax() {
      heroParallaxTicking = false;
      if (reduceMotion.matches) {
        heroImg.style.removeProperty("--hero-parallax-y");
        return;
      }
      const y = Math.max(0, window.scrollY) * heroParallaxRate;
      heroImg.style.setProperty("--hero-parallax-y", y + "px");
    }

    function onHeroParallaxScroll() {
      if (!heroParallaxTicking) {
        heroParallaxTicking = true;
        requestAnimationFrame(updateHeroParallax);
      }
    }

    window.addEventListener("scroll", onHeroParallaxScroll, { passive: true });
    reduceMotion.addEventListener("change", updateHeroParallax);
    updateHeroParallax();
  }
})();
