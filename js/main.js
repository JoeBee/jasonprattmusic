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
    const id =
      h === "live"
        ? "live"
        : h === "audio-samples"
          ? "audio-samples"
          : h === "contact"
            ? "contact"
            : h === "tour"
              ? "tour"
              : "home";
    navLinks.forEach(function (a) {
      const href = a.getAttribute("href") || "";
      if (id === "live" && href === "#live") {
        a.setAttribute("aria-current", "true");
      } else if (id === "audio-samples" && href === "#audio-samples") {
        a.setAttribute("aria-current", "true");
      } else if (id === "contact" && href === "#contact") {
        a.setAttribute("aria-current", "true");
      } else if (id === "tour" && href === "#tour") {
        a.setAttribute("aria-current", "true");
      } else if (id === "home" && href === "#home") {
        a.setAttribute("aria-current", "true");
      } else {
        a.removeAttribute("aria-current");
      }
    });
  }

  /** Main content accordions: only one open at a time; closers assigned in each init. */
  const mainAccordionClose = {
    live: null,
    "audio-samples": null,
    tour: null,
  };

  function collapseMainAccordionsExcept(keep) {
    if (mainAccordionClose.live && keep !== "live") mainAccordionClose.live();
    if (mainAccordionClose["audio-samples"] && keep !== "audio-samples") {
      mainAccordionClose["audio-samples"]();
    }
    if (mainAccordionClose.tour && keep !== "tour") mainAccordionClose.tour();
  }

  /** Open collapsible content when navigating via main nav hashes (in-page anchors). */
  function openCollapsiblePanel(keepKey, toggleId, panelId) {
    const btn = document.getElementById(toggleId);
    const panel = document.getElementById(panelId);
    if (!btn || !panel) return;
    collapseMainAccordionsExcept(keepKey);
    btn.setAttribute("aria-expanded", "true");
    panel.removeAttribute("hidden");
  }

  function openSectionForNavFragment(fragment) {
    if (!fragment || onPitch) return;
    if (fragment === "live") {
      openCollapsiblePanel("live", "live-videos-toggle", "video-links");
    } else if (fragment === "audio-samples") {
      openCollapsiblePanel("audio-samples", "audio-samples-toggle", "audio-samples-panel");
    } else if (fragment === "tour") {
      openCollapsiblePanel("tour", "tour-toggle", "tour-panel");
    }
  }

  function syncHashCollapsibles() {
    const h = window.location.hash.replace(/^#/, "");
    openSectionForNavFragment(h);
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
        openSectionForNavFragment(href.slice(1));
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
  onHashOrLoadNav();

  /**
   * Populate upcoming shows from a JSON file and mirror them into a small month calendar.
   * Events are rendered chronologically, with the calendar acting as a visual filter.
   */
  async function loadShows() {
    const showList = document.getElementById("show-list");
    const showCalendar = document.getElementById("show-calendar");
    if (!showList) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    function parseShowDate(show) {
      const iso = String(show.date || "").trim();
      const isoMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
      if (isoMatch) {
        const isoYear = Number(isoMatch[1]);
        const isoMonth = Number(isoMatch[2]);
        const isoDay = Number(isoMatch[3]);
        const isoDate = new Date(isoYear, isoMonth - 1, isoDay);
        if (
          isoDate.getFullYear() === isoYear &&
          isoDate.getMonth() === isoMonth - 1 &&
          isoDate.getDate() === isoDay
        ) {
          return isoDate;
        }
      }

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

    function getMonthKey(date) {
      return date.getFullYear() + "-" + String(date.getMonth() + 1).padStart(2, "0");
    }

    function formatMonthLabel(year, monthIndex) {
      return new Date(year, monthIndex, 1).toLocaleDateString(undefined, {
        month: "long",
        year: "numeric",
      });
    }

    function formatCalendarLabel(show) {
      const place = show.city ? show.venue + ", " + show.city : show.venue;
      return place || "Show details";
    }

    function startOfMonth(date) {
      return new Date(date.getFullYear(), date.getMonth(), 1);
    }

    function renderShowList(showsToRender, selectedDateKey) {
      showList.innerHTML = "";

      if (selectedDateKey) {
        const clearRow = document.createElement("li");
        clearRow.className = "show-list__row show-list__row--filter";
        const clearButton = document.createElement("button");
        clearButton.className = "show-list__clear-filter";
        clearButton.type = "button";
        clearButton.textContent = "Show all dates";
        clearButton.addEventListener("click", function () {
          selectedCalendarDateKey = "";
          renderShowList(visibleShows, "");
          renderCalendar(currentCalendarMonth);
        });
        clearRow.appendChild(clearButton);
        showList.appendChild(clearRow);
      }

      if (showsToRender.length === 0) {
        showList.innerHTML = '<li class="show-list__row">No shows posted for this date.</li>';
        return;
      }

      showsToRender.forEach(function (show) {
        const row = document.createElement("li");
        row.className = "show-list__row";
        if (show.dateKey) row.setAttribute("data-show-date", show.dateKey);

        const date = document.createElement("time");
        date.className = "show-list__date";
        date.textContent = show.displayDate || (show.date ? show.date.toLocaleDateString() : "TBD");
        if (show.dateKey) date.setAttribute("datetime", show.dateKey);

        const details = document.createElement("div");
        details.className = "show-list__details";
        const venue = document.createElement("span");
        venue.className = "show-list__venue";
        venue.textContent = show.venue || "Venue TBA";

        const meta = document.createElement("span");
        meta.className = "show-list__meta";
        meta.textContent = show.city || "Location TBA";

        details.appendChild(venue);
        details.appendChild(meta);

        const commentsText = (show.comments && String(show.comments).trim()) || "";
        if (commentsText) {
          const comments = document.createElement("p");
          comments.className = "show-list__comments";
          comments.textContent = commentsText;
          details.appendChild(comments);
        }

        row.appendChild(date);
        row.appendChild(details);
        showList.appendChild(row);
      });
    }

    function renderCalendar(monthDate) {
      if (!showCalendar) return;

      const year = monthDate.getFullYear();
      const month = monthDate.getMonth();
      const monthKey = getMonthKey(monthDate);
      const firstDay = new Date(year, month, 1);
      const startOffset = firstDay.getDay();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const eventsThisMonth = visibleShows.filter(function (show) {
        return show.date && getMonthKey(show.date) === monthKey;
      });
      const eventsByDate = eventsThisMonth.reduce(function (map, show) {
        if (!map[show.dateKey]) map[show.dateKey] = [];
        map[show.dateKey].push(show);
        return map;
      }, {});

      showCalendar.innerHTML = "";

      const header = document.createElement("div");
      header.className = "show-calendar__header";

      const prev = document.createElement("button");
      prev.className = "show-calendar__nav";
      prev.type = "button";
      prev.setAttribute("aria-label", "Previous month");
      prev.textContent = "<";

      const title = document.createElement("h3");
      title.className = "show-calendar__title";
      title.textContent = formatMonthLabel(year, month);

      const next = document.createElement("button");
      next.className = "show-calendar__nav";
      next.type = "button";
      next.setAttribute("aria-label", "Next month");
      next.textContent = ">";

      prev.addEventListener("click", function () {
        selectedCalendarDateKey = "";
        currentCalendarMonth = startOfMonth(new Date(year, month - 1, 1));
        renderShowList(visibleShows, "");
        renderCalendar(currentCalendarMonth);
      });
      next.addEventListener("click", function () {
        selectedCalendarDateKey = "";
        currentCalendarMonth = startOfMonth(new Date(year, month + 1, 1));
        renderShowList(visibleShows, "");
        renderCalendar(currentCalendarMonth);
      });

      header.appendChild(prev);
      header.appendChild(title);
      header.appendChild(next);
      showCalendar.appendChild(header);

      const weekdays = document.createElement("div");
      weekdays.className = "show-calendar__weekdays";
      ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].forEach(function (dayName) {
        const weekday = document.createElement("span");
        weekday.textContent = dayName;
        weekdays.appendChild(weekday);
      });
      showCalendar.appendChild(weekdays);

      const grid = document.createElement("div");
      grid.className = "show-calendar__grid";

      for (let i = 0; i < startOffset; i += 1) {
        const empty = document.createElement("span");
        empty.className = "show-calendar__day show-calendar__day--empty";
        empty.setAttribute("aria-hidden", "true");
        grid.appendChild(empty);
      }

      for (let day = 1; day <= daysInMonth; day += 1) {
        const date = new Date(year, month, day);
        const dateKey = getDateKey(date);
        const dayEvents = eventsByDate[dateKey] || [];
        const dayHasEvents = dayEvents.length > 0;
        const isToday = dateKey === getDateKey(today);
        const isSelected = dateKey === selectedCalendarDateKey;
        const dayEl = document.createElement(dayHasEvents ? "button" : "span");
        dayEl.className = "show-calendar__day";
        if (dayHasEvents) dayEl.className += " show-calendar__day--event";
        if (isToday) dayEl.className += " show-calendar__day--today";
        if (isSelected) dayEl.className += " is-selected";
        dayEl.textContent = String(day);

        if (dayHasEvents) {
          dayEl.type = "button";
          dayEl.setAttribute(
            "aria-label",
            date.toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" }) +
              ": " +
              dayEvents.map(formatCalendarLabel).join("; ")
          );
          dayEl.addEventListener("click", function () {
            selectedCalendarDateKey = dateKey;
            renderShowList(dayEvents, selectedCalendarDateKey);
            renderCalendar(currentCalendarMonth);
            showList.scrollIntoView({
              block: "nearest",
              behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
            });
          });
        } else {
          dayEl.setAttribute("aria-label", "No shows on " + date.toLocaleDateString());
        }

        grid.appendChild(dayEl);
      }

      showCalendar.appendChild(grid);

      const hint = document.createElement("p");
      hint.className = "show-calendar__hint";
      hint.textContent =
        eventsThisMonth.length > 0 ? "Tap a highlighted date to focus the list." : "No posted shows this month.";
      showCalendar.appendChild(hint);
    }

    let visibleShows = [];
    let currentCalendarMonth = startOfMonth(today);
    let selectedCalendarDateKey = "";

    try {
      const response = await fetch("data/shows.json", { cache: "no-store" });
      if (!response.ok) throw new Error("Failed to load show data.");
      const shows = await response.json();

      if (!Array.isArray(shows) || shows.length === 0) {
        showList.innerHTML = '<li class="show-list__row">No upcoming shows posted yet.</li>';
        if (showCalendar) showCalendar.innerHTML = '<p class="show-calendar__hint">No upcoming shows posted yet.</p>';
        return;
      }

      visibleShows = shows
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

      if (visibleShows.length === 0) {
        showList.innerHTML = '<li class="show-list__row">No upcoming shows posted yet.</li>';
        if (showCalendar) showCalendar.innerHTML = '<p class="show-calendar__hint">No upcoming shows posted yet.</p>';
        return;
      }

      const firstDatedShow = visibleShows.find(function (show) {
        return show.date;
      });
      if (firstDatedShow) currentCalendarMonth = startOfMonth(firstDatedShow.date);

      renderShowList(visibleShows, "");
      renderCalendar(currentCalendarMonth);
    } catch (_) {
      showList.innerHTML = '<li class="show-list__row">Could not load shows right now.</li>';
      if (showCalendar) showCalendar.innerHTML = '<p class="show-calendar__hint">Could not load shows right now.</p>';
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
  let audioSamplesStopPlayback = function () {};

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
      const response = await fetch("data/links.json", { cache: "no-store" });
      if (!response.ok) throw new Error("Failed to load video links.");
      const items = await response.json();

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
      if (!wasOpen) {
        collapseMainAccordionsExcept("live");
        btn.setAttribute("aria-expanded", "true");
      } else {
        btn.setAttribute("aria-expanded", "false");
      }
      sync();
    });
    sync();
  })();

  (function initCoverArtCollapsible() {
    const btn = document.getElementById("cover-art-toggle");
    const panel = document.getElementById("cover-art-panel");
    if (!btn || !panel) return;
    function sync() {
      const open = btn.getAttribute("aria-expanded") === "true";
      if (open) {
        panel.removeAttribute("hidden");
      } else {
        panel.setAttribute("hidden", "");
      }
    }
    btn.addEventListener("click", function () {
      const open = btn.getAttribute("aria-expanded") === "true";
      btn.setAttribute("aria-expanded", open ? "false" : "true");
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
        const res = await fetch("data/audio-files.json", { cache: "no-store" });
        if (!res.ok) throw new Error("load failed");
        const raw = await res.json();
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
                } catch (_) {}
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
        if (!wasOpen) {
          collapseMainAccordionsExcept("audio-samples");
          btn.setAttribute("aria-expanded", "true");
        } else {
          btn.setAttribute("aria-expanded", "false");
        }
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
      if (!wasOpen) {
        collapseMainAccordionsExcept("tour");
        btn.setAttribute("aria-expanded", "true");
      } else {
        btn.setAttribute("aria-expanded", "false");
      }
      sync();
    });
    sync();
  })();

  /* Hero banner: moves much slower than the page (parallax), disabled when reduced motion is preferred.
     The text overlay (.page-hero__copy-wrap) is NOT translated, so it scrolls with the page while the
     banner image lags far behind. Rate is the fraction of scrollY translated *down* on the image:
       effective image scroll speed in viewport = (1 - rate) * page speed
       0.0  -> image scrolls with page (no parallax)
       0.85 -> image scrolls at 15% of page speed (much slower than overlay text) */
  const heroImg = document.querySelector(".page-hero__img");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (heroImg) {
    let heroParallaxTicking = false;
    const heroParallaxRate = 0.85;

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
