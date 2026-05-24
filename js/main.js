(function () {
  const nav = document.getElementById("site-nav");
  const navToggle = document.getElementById("nav-toggle");
  const navLinks = nav ? Array.from(nav.querySelectorAll("a")) : [];
  const NAV_HREF_BY_FRAGMENT = {
    live: "#live",
    "audio-samples": "#audio-samples",
    contact: "#contact",
    tour: "#tour",
    home: "#home",
  };

  const yearEl = document.getElementById("year");
  if (yearEl) {
    yearEl.textContent = String(new Date().getFullYear());
  }

  /** @param {string} path */
  async function fetchJson(path) {
    const response = await fetch(path, { cache: "no-store" });
    if (!response.ok) {
      throw new Error("Failed to load " + path);
    }
    const text = await response.text();
    const json = text.replace(/^\s*\/\/.*$/gm, "");
    return JSON.parse(json);
  }

  function setCurrentNav() {
    const fragment = window.location.hash.replace(/^#/, "");
    const activeHref =
      NAV_HREF_BY_FRAGMENT[fragment in NAV_HREF_BY_FRAGMENT ? fragment : "home"];
    navLinks.forEach(function (a) {
      if ((a.getAttribute("href") || "") === activeHref) {
        a.setAttribute("aria-current", "page");
      } else {
        a.removeAttribute("aria-current");
      }
    });
  }

  /** Main content collapsibles; closers assigned in each init. */
  const mainAccordionClose = {
    live: null,
    "audio-samples": null,
    tour: null,
  };

  function collapseAllMainAccordions() {
    if (mainAccordionClose.live) mainAccordionClose.live();
    if (mainAccordionClose["audio-samples"]) mainAccordionClose["audio-samples"]();
    if (mainAccordionClose.tour) mainAccordionClose.tour();
  }

  /** Open collapsible content when navigating via main nav hashes (in-page anchors). */
  function openCollapsiblePanel(toggleId, panelId) {
    const btn = document.getElementById(toggleId);
    const panel = document.getElementById(panelId);
    if (!btn || !panel) return;
    btn.setAttribute("aria-expanded", "true");
    panel.removeAttribute("hidden");
  }

  function openAllMainSections() {
    openCollapsiblePanel("tour-toggle", "tour-panel");
    openCollapsiblePanel("live-videos-toggle", "video-links");
    openCollapsiblePanel("audio-samples-toggle", "audio-samples-panel");
  }

  function openSectionForNavFragment(fragment) {
    if (!fragment) return;
    if (fragment === "live") {
      openCollapsiblePanel("live-videos-toggle", "video-links");
    } else if (fragment === "audio-samples") {
      openCollapsiblePanel("audio-samples-toggle", "audio-samples-panel");
    } else if (fragment === "tour") {
      openCollapsiblePanel("tour-toggle", "tour-panel");
    } else if (fragment === "contact" || fragment === "main-content") {
      collapseAllMainAccordions();
    }
  }

  function scheduleScrollToNavFragment(fragment) {
    if (!fragment) return;
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        scrollToNavFragment(fragment);
        window.setTimeout(function () {
          scrollToNavFragment(fragment);
        }, 0);
      });
    });
  }

  function scrollToNavFragment(fragment) {
    if (!fragment) return;
    const el = document.getElementById(fragment);
    if (!el) return;
    const margin =
      parseFloat(window.getComputedStyle(el).scrollMarginTop) || 0;
    const top = el.getBoundingClientRect().top + window.scrollY - margin;
    window.scrollTo({ top: Math.max(0, top), behavior: "auto" });
  }

  function syncHashCollapsibles() {
    const h = window.location.hash.replace(/^#/, "");
    openSectionForNavFragment(h);
    if (h) {
      scheduleScrollToNavFragment(h);
    }
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
    function setNavOpen(open) {
      nav.classList.toggle("is-open", open);
      navToggle.setAttribute("aria-expanded", open ? "true" : "false");
      navToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    }
    navToggle.addEventListener("click", function () {
      setNavOpen(!nav.classList.contains("is-open"));
    });
  }

  navLinks.forEach(function (a) {
    a.addEventListener("click", function () {
      const href = a.getAttribute("href") || "";
      if (href.charAt(0) === "#") {
        const fragment = href.slice(1);
        openSectionForNavFragment(fragment);
        scheduleScrollToNavFragment(fragment);
      }
      if (nav && nav.classList.contains("is-open") && navToggle) {
        nav.classList.remove("is-open");
        navToggle.setAttribute("aria-expanded", "false");
        navToggle.setAttribute("aria-label", "Open menu");
      }
    });
  });

  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape" || !nav || !nav.classList.contains("is-open") || !navToggle) return;
    nav.classList.remove("is-open");
    navToggle.setAttribute("aria-expanded", "false");
    navToggle.setAttribute("aria-label", "Open menu");
    navToggle.focus();
  });

  function onHashOrLoadNav() {
    setCurrentNav();
    syncHashCollapsibles();
  }

  window.addEventListener("hashchange", onHashOrLoadNav);
  window.addEventListener("load", onHashOrLoadNav);

  const MUSICIAN_SCHEMA_ID = "https://jasonprattmusic.com/#musician";
  const SITE_SCHEMA_URL = "https://jasonprattmusic.com/";

  /** Inject MusicEvent JSON-LD from upcoming shows for local concert discovery. */
  function updateLocalEventSchema(shows) {
    let el = document.getElementById("event-schema");
    if (!el) {
      el = document.createElement("script");
      el.type = "application/ld+json";
      el.id = "event-schema";
      document.body.appendChild(el);
    }

    const events = shows
      .filter(function (show) {
        return show.dateKey;
      })
      .map(function (show) {
        const city = String(show.city || "").trim();
        const locality = city.replace(/,?\s*MA$/i, "").trim();
        const location = {
          "@type": "Place",
          name: show.venue || "Venue TBA",
        };
        const address = {
          "@type": "PostalAddress",
          addressCountry: "US",
          addressRegion: "MA",
        };
        if (locality) {
          address.addressLocality = locality;
        }
        if (show.address) {
          address.streetAddress = String(show.address).trim();
        }
        if (locality || show.address) {
          location.address = address;
        }

        const eventUrl = show.website
          ? String(show.website).trim()
          : SITE_SCHEMA_URL + "#tour";

        return {
          "@type": "MusicEvent",
          name: (show.venue || "Live music") + " — Jason Pratt",
          startDate: show.dateKey,
          eventStatus: "https://schema.org/EventScheduled",
          eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
          location: location,
          performer: { "@id": MUSICIAN_SCHEMA_ID },
          organizer: { "@id": MUSICIAN_SCHEMA_ID },
          url: eventUrl,
        };
      });

    el.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@graph": events,
    });
  }

  /** Populate upcoming shows from a JSON file, rendered chronologically. */
  async function loadShows() {
    const showList = document.getElementById("show-list");
    if (!showList) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    function parseShowDate(show) {
      const parts = String(show.displayDate || "").split("/");
      if (parts.length !== 3) return null;

      const month = Number(parts[0]);
      const day = Number(parts[1]);
      const year = Number(parts[2]);
      const date = new Date(year, month - 1, day);

      if (
        !month ||
        !day ||
        !year ||
        date.getFullYear() !== year ||
        date.getMonth() !== month - 1 ||
        date.getDate() !== day
      ) {
        return null;
      }

      return date;
    }

    function getDateKey(date) {
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return date.getFullYear() + "-" + month + "-" + day;
    }

    function decodeHtmlEntities(value) {
      const el = document.createElement("textarea");
      el.innerHTML = String(value || "");
      return el.value;
    }

    function normalizeExternalUrl(value) {
      const url = String(value || "").trim();
      if (!url) return null;
      try {
        const parsed = new URL(url);
        if (parsed.protocol === "http:" || parsed.protocol === "https:") {
          return parsed.href;
        }
      } catch (_) { }
      return null;
    }

    function createShowActionIcon(pathD) {
      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.setAttribute("class", "show-list__action-icon");
      svg.setAttribute("viewBox", "0 0 24 24");
      svg.setAttribute("aria-hidden", "true");
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("d", pathD);
      path.setAttribute("fill", "currentColor");
      svg.appendChild(path);
      return svg;
    }

    function createShowActionLink(href, label, iconPath) {
      const link = document.createElement("a");
      link.className = "show-list__action";
      link.href = href;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.title = label;
      link.setAttribute("aria-label", label);
      link.appendChild(createShowActionIcon(iconPath));
      return link;
    }

    const SHOW_ICON_MAP =
      "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z";

    function formatShowDateLabel(show) {
      if (show.date) {
        return show.date.toLocaleDateString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
          year: "numeric",
        });
      }
      const fallback = String(show.displayDate || "").trim();
      return fallback || "TBD";
    }

    function getShowMonthKey(show) {
      if (!show.date) return "";
      const month = String(show.date.getMonth() + 1).padStart(2, "0");
      return show.date.getFullYear() + "-" + month;
    }

    function formatShowMonthLabel(show) {
      if (!show.date) return "";
      return show.date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    }

    function appendShowListHeader() {
      const header = document.createElement("li");
      header.className = "show-list__header";
      header.setAttribute("aria-hidden", "true");

      const dateHeading = document.createElement("span");
      dateHeading.className = "show-list__header-date";
      dateHeading.textContent = "Date";

      const detailsHeading = document.createElement("span");
      detailsHeading.className = "show-list__header-details";
      detailsHeading.textContent = "Show";

      const linksHeading = document.createElement("span");
      linksHeading.className = "show-list__header-links";
      linksHeading.textContent = "Map";

      header.appendChild(dateHeading);
      header.appendChild(detailsHeading);
      header.appendChild(linksHeading);
      showList.appendChild(header);
    }

    function renderShowList(showsToRender) {
      showList.innerHTML = "";

      if (showsToRender.length === 0) {
        showList.innerHTML = '<li class="show-list__row">No upcoming shows posted yet.</li>';
        return;
      }

      appendShowListHeader();

      let lastMonthKey = "";

      showsToRender.forEach(function (show) {
        const monthKey = getShowMonthKey(show);
        if (monthKey && monthKey !== lastMonthKey) {
          const monthRow = document.createElement("li");
          monthRow.className = "show-list__month";
          monthRow.textContent = formatShowMonthLabel(show);
          showList.appendChild(monthRow);
          lastMonthKey = monthKey;
        }

        const row = document.createElement("li");
        row.className = "show-list__row";
        if (show.dateKey) row.setAttribute("data-show-date", show.dateKey);

        const dateCell = document.createElement("div");
        dateCell.className = "show-list__date-cell";

        const date = document.createElement("time");
        date.className = "show-list__date";
        date.textContent = formatShowDateLabel(show);
        if (show.dateKey) date.setAttribute("datetime", show.dateKey);
        dateCell.appendChild(date);

        const commentsText = (show.comments && String(show.comments).trim()) || "";
        if (commentsText) {
          const comments = document.createElement("p");
          comments.className = "show-list__note";
          comments.textContent = decodeHtmlEntities(commentsText);
          dateCell.appendChild(comments);
        }

        const info = document.createElement("div");
        info.className = "show-list__info";

        const websiteUrl = normalizeExternalUrl(show.website);
        const mapUrl = normalizeExternalUrl(show.map);
        const venueLabel = show.venue || "Venue TBA";
        let venue;
        if (websiteUrl) {
          venue = document.createElement("a");
          venue.className = "show-list__venue show-list__venue--link";
          venue.href = websiteUrl;
          venue.target = "_blank";
          venue.rel = "noopener noreferrer";
          venue.textContent = venueLabel;
        } else {
          venue = document.createElement("span");
          venue.className = "show-list__venue";
          venue.textContent = venueLabel;
        }

        const meta = document.createElement("span");
        meta.className = "show-list__meta";
        meta.textContent = show.city || "";

        info.appendChild(venue);
        if (show.city) {
          info.appendChild(meta);
        }
        row.appendChild(dateCell);
        row.appendChild(info);

        if (mapUrl) {
          const actions = document.createElement("div");
          actions.className = "show-list__actions";
          actions.appendChild(
            createShowActionLink(mapUrl, "Get directions on Google Maps", SHOW_ICON_MAP)
          );
          row.appendChild(actions);
        }

        showList.appendChild(row);
      });
    }

    try {
      const shows = await fetchJson("data/shows.json");

      if (!Array.isArray(shows) || shows.length === 0) {
        renderShowList([]);
        return;
      }

      const visibleShows = shows
        .filter(function (show) {
          return String(show.visible || "").toLowerCase() === "true";
        })
        .map(function (show) {
          const parsedDate = parseShowDate(show);
          const normalized = Object.assign({}, show, {
            date: parsedDate,
            dateKey: parsedDate ? getDateKey(parsedDate) : "",
          });
          return normalized;
        })
        .filter(function (show) {
          return !show.date || show.date.getTime() >= today.getTime();
        })
        .sort(function (a, b) {
          const aTime = a.date ? a.date.getTime() : Number.MAX_SAFE_INTEGER;
          const bTime = b.date ? b.date.getTime() : Number.MAX_SAFE_INTEGER;
          return aTime - bTime;
        });

      const seenShowKeys = new Set();
      const dedupedShows = visibleShows.filter(function (show) {
        const key =
          (show.dateKey || "nodate") +
          "|" +
          String(show.venue || "")
            .trim()
            .toLowerCase();
        if (seenShowKeys.has(key)) {
          return false;
        }
        seenShowKeys.add(key);
        return true;
      });

      renderShowList(dedupedShows);
      updateLocalEventSchema(dedupedShows);
    } catch (_) {
      showList.innerHTML = '<li class="show-list__row">Could not load shows right now.</li>';
    } finally {
      const h = window.location.hash.replace(/^#/, "");
      if (h) {
        scheduleScrollToNavFragment(h);
      }
    }
  }

  loadShows();

  /** @returns {string|null} */
  function getYoutubeEmbedUrl(urlString) {
    if (!urlString || typeof urlString !== "string") return null;
    try {
      const u = new URL(urlString.trim());
      const host = u.hostname.replace(/^www\./, "");
      if (host === "youtu.be") {
        const id = u.pathname.split("/").filter(Boolean)[0];
        return id ? "https://www.youtube.com/embed/" + encodeURIComponent(id) : null;
      }
      if (host === "youtube.com" || host === "m.youtube.com") {
        if (u.pathname.indexOf("/embed/") === 0) {
          const id = u.pathname.split("/embed/")[1].split("/")[0];
          return id ? "https://www.youtube.com/embed/" + encodeURIComponent(id) : null;
        }
        if (u.pathname.indexOf("/shorts/") === 0) {
          const id = u.pathname.split("/shorts/")[1].split("/")[0];
          return id ? "https://www.youtube.com/embed/" + encodeURIComponent(id) : null;
        }
        const v = u.searchParams.get("v");
        return v ? "https://www.youtube.com/embed/" + encodeURIComponent(v) : null;
      }
    } catch (_) {
      return null;
    }
    return null;
  }

  /** @param {string} embedBase */
  function getYoutubeIdFromEmbedUrl(embedBase) {
    if (!embedBase) return null;
    const m = /\/embed\/([^/?#]+)/.exec(embedBase);
    if (!m) return null;
    try {
      return decodeURIComponent(m[1]);
    } catch (_) {
      return m[1];
    }
  }

  /** Stops in-page audio samples when video playback starts. Set by initAudioSamples. */
  let audioSamplesStopPlayback = function () { };

  /** Stops the large YouTube player and clears any selected thumb. Default until loadVideoLinks sets the real handler. */
  let liveVideosStopPlayback = function () {
    const el = document.getElementById("video-focus");
    if (el) {
      el.innerHTML = "";
      el.setAttribute("hidden", "");
    }
    const th = document.getElementById("video-thumbs");
    if (th) {
      th.querySelectorAll(".video-thumb[aria-pressed='true']").forEach(function (b) {
        b.setAttribute("aria-pressed", "false");
      });
    }
  };

  /**
   * Live performance videos: small thumbnails in a row; click plays one large embed (others never load iframes).
   */
  async function loadVideoLinks() {
    const layout = document.getElementById("video-links");
    const focus = document.getElementById("video-focus");
    const thumbs = document.getElementById("video-thumbs");
    if (!layout || !focus || !thumbs) return;

    try {
      const items = await fetchJson("data/links.json");

      if (!Array.isArray(items) || items.length === 0) {
        focus.setAttribute("hidden", "");
        focus.innerHTML = "";
        thumbs.innerHTML = '<p class="video-row--message">No videos posted yet.</p>';
        return;
      }

      thumbs.innerHTML = "";
      focus.setAttribute("hidden", "");
      focus.innerHTML = "";

      let activeThumb = null;

      function clearPlayer() {
        focus.innerHTML = "";
        focus.setAttribute("hidden", "");
        if (activeThumb) {
          activeThumb.setAttribute("aria-pressed", "false");
          activeThumb = null;
        }
      }

      liveVideosStopPlayback = clearPlayer;

      function openEmbedded(embedBase, label) {
        const sep = embedBase.indexOf("?") > -1 ? "&" : "?";
        const src = embedBase + sep + "autoplay=1&rel=0";
        const wrap = document.createElement("div");
        wrap.className = "embed-block embed-block--video embed-block--focus";
        wrap.setAttribute("role", "region");
        wrap.setAttribute("aria-label", label);

        const iframe = document.createElement("iframe");
        iframe.setAttribute("src", src);
        iframe.setAttribute("title", label);
        iframe.setAttribute(
          "allow",
          "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        );
        iframe.setAttribute("referrerpolicy", "strict-origin-when-cross-origin");
        iframe.setAttribute("allowfullscreen", "");
        iframe.setAttribute("loading", "lazy");
        wrap.appendChild(iframe);
        focus.innerHTML = "";
        focus.appendChild(wrap);
        focus.removeAttribute("hidden");
        const smoothScroll = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        focus.scrollIntoView({ block: "nearest", behavior: smoothScroll ? "smooth" : "auto" });
      }

      items.forEach(function (item) {
        const url = (item && item.url && String(item.url).trim()) || "";
        const commentsText = (item && item.comments && String(item.comments).trim()) || "";
        const embedBase = getYoutubeEmbedUrl(url);
        const shortLabel = commentsText || "Video";

        const block = document.createElement("article");
        block.className = "video-item";

        if (embedBase) {
          const yid = getYoutubeIdFromEmbedUrl(embedBase);
          const btn = document.createElement("button");
          btn.className = "video-thumb";
          btn.type = "button";
          btn.setAttribute("aria-pressed", "false");
          btn.setAttribute("aria-label", "Play: " + shortLabel);

          const img = document.createElement("img");
          img.className = "video-thumb__img";
          img.alt = "";
          img.decoding = "async";
          img.loading = "lazy";
          if (yid) {
            img.src = "https://i.ytimg.com/vi/" + encodeURIComponent(yid) + "/hqdefault.jpg";
            img.width = 320;
            img.height = 180;
          }

          const play = document.createElement("span");
          play.className = "video-thumb__play";
          play.setAttribute("aria-hidden", "true");

          btn.appendChild(img);
          btn.appendChild(play);
          block.appendChild(btn);

          btn.addEventListener("click", function () {
            if (activeThumb === btn) {
              clearPlayer();
              return;
            }
            if (activeThumb) {
              activeThumb.setAttribute("aria-pressed", "false");
            }
            activeThumb = btn;
            activeThumb.setAttribute("aria-pressed", "true");
            audioSamplesStopPlayback();
            openEmbedded(embedBase, shortLabel);
          });
        } else if (url) {
          const p = document.createElement("p");
          p.className = "video-item__fallback";
          const a = document.createElement("a");
          a.href = url;
          a.textContent = "Open";
          p.appendChild(a);
          block.appendChild(p);
        } else {
          const err = document.createElement("p");
          err.className = "video-row--message";
          err.textContent = "Missing URL.";
          block.appendChild(err);
        }

        if (commentsText) {
          const cap = document.createElement("p");
          cap.className = "video-item__comment";
          cap.textContent = commentsText;
          block.appendChild(cap);
        }

        thumbs.appendChild(block);
      });

      initExternalLinksInNewTab();
    } catch (_) {
      focus.setAttribute("hidden", "");
      focus.innerHTML = "";
      thumbs.innerHTML = '<p class="video-row--message">Could not load videos right now.</p>';
    } finally {
      const h = window.location.hash.replace(/^#/, "");
      if (h) {
        scheduleScrollToNavFragment(h);
      }
    }
  }

  loadVideoLinks();

  (function initLiveVideosCollapsible() {
    const btn = document.getElementById("live-videos-toggle");
    const panel = document.getElementById("video-links");
    if (!btn || !panel) return;

    mainAccordionClose.live = function () {
      if (btn.getAttribute("aria-expanded") !== "true") return;
      btn.setAttribute("aria-expanded", "false");
      liveVideosStopPlayback();
      panel.setAttribute("hidden", "");
    };

    function sync() {
      const open = btn.getAttribute("aria-expanded") === "true";
      if (open) {
        panel.removeAttribute("hidden");
      } else {
        liveVideosStopPlayback();
        panel.setAttribute("hidden", "");
      }
    }
    btn.addEventListener("click", function () {
      const wasOpen = btn.getAttribute("aria-expanded") === "true";
      btn.setAttribute("aria-expanded", wasOpen ? "false" : "true");
      sync();
    });
    sync();
  })();

  /** Audio sample list (data/audio-files.json); in-page play with dancing notes to the right when playing. */
  (function initAudioSamples() {
    const listEl = document.getElementById("audio-list");
    const errEl = document.getElementById("audio-list-err");
    if (!listEl) return;

    const player = new Audio();
    player.preload = "metadata";
    let activeBtn = null;

    function srcForFile(filename) {
      return "assets/audio-files/" + encodeURIComponent(filename);
    }

    function titleFromFilename(name) {
      return name
        .replace(/\.mp3$/i, "")
        .replace(/_/g, " ")
        .trim();
    }

    /** Splits "Artist - Title" for two-line display; otherwise single line. */
    function parseTrackFromStripped(stripped) {
      const i = stripped.indexOf(" - ");
      if (i > 0) {
        const artist = stripped.slice(0, i).trim();
        const title = stripped.slice(i + 3).trim();
        if (artist && title) {
          return { title: title, artist: artist };
        }
      }
      return { single: stripped };
    }

    function clearButtonPlayingState(btn) {
      if (!btn) return;
      btn.classList.remove("is-playing");
      btn.setAttribute("aria-pressed", "false");
    }

    function setButtonPlayingState(btn) {
      btn.classList.add("is-playing");
      btn.setAttribute("aria-pressed", "true");
    }

    audioSamplesStopPlayback = function () {
      player.pause();
      clearButtonPlayingState(activeBtn);
    };

    function resolveUrl(path) {
      return new URL(path, window.location.href).href;
    }

    player.addEventListener("ended", function () {
      clearButtonPlayingState(activeBtn);
      activeBtn = null;
    });

    async function load() {
      if (errEl) {
        errEl.hidden = true;
        errEl.textContent = "";
      }
      try {
        const raw = await fetchJson("data/audio-files.json");
        if (!Array.isArray(raw) || raw.length === 0) {
          listEl.innerHTML =
            '<li class="audio-list__item audio-list__item--message" role="presentation"><p class="body-text audio-list__empty-text">No audio files listed.</p></li>';
          return;
        }
        const files = raw
          .filter(function (filename) {
            return typeof filename === "string" && filename.trim();
          })
          .map(function (f) {
            return f.trim();
          });
        listEl.innerHTML = "";
        files.forEach(function (name) {
          const li = document.createElement("li");
          li.className = "audio-list__item";
          const btn = document.createElement("button");
          btn.type = "button";
          btn.className = "audio-list__btn";
          const displayTitle = titleFromFilename(name);
          const meta = parseTrackFromStripped(displayTitle);
          btn.setAttribute("data-filename", name);
          btn.setAttribute("aria-label", "Play " + displayTitle);
          btn.setAttribute("aria-pressed", "false");
          const textBlock = document.createElement("span");
          textBlock.className = "audio-list__text-block";
          if (meta.title && meta.artist) {
            const tEl = document.createElement("span");
            tEl.className = "audio-list__track";
            tEl.textContent = meta.title;
            const aEl = document.createElement("span");
            aEl.className = "audio-list__artist";
            aEl.textContent = meta.artist;
            textBlock.appendChild(tEl);
            textBlock.appendChild(aEl);
          } else {
            const tEl = document.createElement("span");
            tEl.className = "audio-list__track audio-list__track--only";
            tEl.textContent = meta.single;
            textBlock.appendChild(tEl);
          }
          const dance = document.createElement("span");
          dance.className = "audio-list__dancing-notes";
          dance.setAttribute("aria-hidden", "true");
          ["\u266a", "\u266b", "\u2669"].forEach(function (ch) {
            const c = document.createElement("span");
            c.className = "audio-list__dance-char";
            c.textContent = ch;
            dance.appendChild(c);
          });
          btn.appendChild(textBlock);
          btn.appendChild(dance);
          btn.addEventListener("click", function () {
            if (errEl) {
              errEl.hidden = true;
              errEl.textContent = "";
            }
            const want = resolveUrl(srcForFile(name));
            if (activeBtn === btn) {
              if (player.paused) {
                liveVideosStopPlayback();
                player
                  .play()
                  .then(function () {
                    setButtonPlayingState(btn);
                  })
                  .catch(function () {
                    if (errEl) {
                      errEl.hidden = false;
                      errEl.textContent = "Could not play this track.";
                    }
                  });
              } else {
                player.pause();
                clearButtonPlayingState(btn);
              }
              return;
            }
            liveVideosStopPlayback();
            clearButtonPlayingState(activeBtn);
            activeBtn = btn;
            if (player.src !== want) {
              player.src = want;
            }
            player
              .play()
              .then(function () {
                setButtonPlayingState(btn);
              })
              .catch(function () {
                if (errEl) {
                  errEl.hidden = false;
                  errEl.textContent = "Could not play this track.";
                }
                clearButtonPlayingState(btn);
                activeBtn = null;
                try {
                  player.removeAttribute("src");
                } catch (_) { }
              });
          });
          li.appendChild(btn);
          listEl.appendChild(li);
        });
      } catch (_) {
        listEl.innerHTML = "";
        if (errEl) {
          errEl.hidden = false;
          errEl.textContent = "Could not load the audio list.";
        }
      }
    }

    load();

    (function initAudioSamplesCollapsible() {
      const btn = document.getElementById("audio-samples-toggle");
      const panel = document.getElementById("audio-samples-panel");
      if (!btn || !panel) return;

      mainAccordionClose["audio-samples"] = function () {
        if (btn.getAttribute("aria-expanded") !== "true") return;
        btn.setAttribute("aria-expanded", "false");
        player.pause();
        clearButtonPlayingState(activeBtn);
        panel.setAttribute("hidden", "");
      };

      function sync() {
        const open = btn.getAttribute("aria-expanded") === "true";
        if (open) {
          panel.removeAttribute("hidden");
        } else {
          player.pause();
          clearButtonPlayingState(activeBtn);
          panel.setAttribute("hidden", "");
        }
      }
      btn.addEventListener("click", function () {
        const wasOpen = btn.getAttribute("aria-expanded") === "true";
        btn.setAttribute("aria-expanded", wasOpen ? "false" : "true");
        sync();
      });
      sync();
    })();
  })();

  (function initTourDatesCollapsible() {
    const btn = document.getElementById("tour-toggle");
    const panel = document.getElementById("tour-panel");
    if (!btn || !panel) return;

    mainAccordionClose.tour = function () {
      if (btn.getAttribute("aria-expanded") !== "true") return;
      btn.setAttribute("aria-expanded", "false");
      panel.setAttribute("hidden", "");
    };

    function sync() {
      const open = btn.getAttribute("aria-expanded") === "true";
      if (open) {
        panel.removeAttribute("hidden");
      } else {
        panel.setAttribute("hidden", "");
      }
    }
    btn.addEventListener("click", function () {
      const wasOpen = btn.getAttribute("aria-expanded") === "true";
      btn.setAttribute("aria-expanded", wasOpen ? "false" : "true");
      sync();
    });
    sync();
    const hash = window.location.hash.replace(/^#/, "");
    if (hash) {
      syncHashCollapsibles();
    } else {
      openAllMainSections();
    }
  })();

  onHashOrLoadNav();

  /* Hero banner: fixed at top; negative translateY rises slowly as user scrolls down.
     lagRate 0.78 → banner moves up at (1 - lagRate) ≈ 22% of scroll speed, then off screen.
     Opacity eases from 1 → 0 over several banner heights so it stays visible longer. */
  const heroBlock = document.querySelector(".page-hero");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (heroBlock) {
    // 0–1: how much the banner lags behind scroll (higher = slower upward drift).
    // 0.78 → banner rises at ~22% of scroll speed (1 - lag).
    const heroParallaxLag = 0.78;
    // Multiplier on banner height for fade length; higher = stays visible longer.
    // Also capped by at least 2× viewport height in fadeDistance below.
    const heroFadeScrollFactor = 1;
    // Cached scrollY; skip work when unchanged between animation frames.
    let lastScrollY = -1;

    function updateHeroParallax() {
      if (reduceMotion.matches) {
        heroBlock.style.transform = "";
        heroBlock.style.opacity = "";
        lastScrollY = -1;
        return;
      }
      const scrollY = Math.max(0, window.scrollY);
      if (scrollY === lastScrollY) {
        return;
      }
      lastScrollY = scrollY;
      const rise = scrollY * (1 - heroParallaxLag);
      heroBlock.style.transform = "translate3d(0,-" + rise + "px,0)";
      const fadeDistance = Math.max(
        heroBlock.offsetHeight * heroFadeScrollFactor,
        window.innerHeight * 2,
        1
      );
      const opacity = Math.max(0, 1 - scrollY / fadeDistance);
      heroBlock.style.opacity = String(opacity);
    }

    let parallaxTicking = false;

    function scheduleHeroParallax() {
      if (parallaxTicking) {
        return;
      }
      parallaxTicking = true;
      requestAnimationFrame(function () {
        updateHeroParallax();
        parallaxTicking = false;
      });
    }

    reduceMotion.addEventListener("change", updateHeroParallax);
    window.addEventListener("scroll", scheduleHeroParallax, { passive: true });
    window.addEventListener("resize", updateHeroParallax, { passive: true });
    updateHeroParallax();
  }
})();
