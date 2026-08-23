(function () {
  function get(obj, path) {
    return path.split(".").reduce(function (o, k) { return (o == null) ? undefined : o[k]; }, obj);
  }

  function el(tag, className, html) {
    var e = document.createElement(tag);
    if (className) e.className = className;
    if (html != null) e.innerHTML = html;
    return e;
  }

  // Netlify Image CDN: 업로드된 사진(jpg/png/webp/gif)을 요청 크기에 맞춰 자동 리사이즈·압축.
  // 배포 환경(Netlify)에서만 동작하며, 로컬 미리보기에서는 원본이 그대로 표시됨.
  function isRasterImage(path) {
    return /\.(jpe?g|png|webp|gif)(\?.*)?$/i.test(path || "");
  }
  function imgUrl(path, width, quality) {
    if (!path || !isRasterImage(path)) return path;
    var absPath = "/" + String(path).replace(/^\/+/, "");
    return "/.netlify/images?url=" + encodeURIComponent(absPath) + "&w=" + width + "&q=" + (quality || 75);
  }
  function imgSrcset(path, widths, quality) {
    if (!path || !isRasterImage(path)) return "";
    return widths.map(function (w) { return imgUrl(path, w, quality) + " " + w + "w"; }).join(", ");
  }
  function applyResponsiveImage(imgEl, path, widths, sizes, defaultWidth) {
    if (!imgEl || !path) return;
    imgEl.src = imgUrl(path, defaultWidth);
    var srcset = imgSrcset(path, widths);
    if (srcset) {
      imgEl.setAttribute("srcset", srcset);
      imgEl.setAttribute("sizes", sizes);
    } else {
      imgEl.removeAttribute("srcset");
      imgEl.removeAttribute("sizes");
    }
  }
  function responsiveImgTag(path, alt, widths, sizes, defaultWidth, extraAttrs) {
    var srcset = imgSrcset(path, widths);
    var srcsetAttr = srcset ? " srcset=\"" + srcset + "\" sizes=\"" + sizes + "\"" : "";
    return "<img src=\"" + imgUrl(path, defaultWidth) + "\" alt=\"" + (alt || "") + "\"" + srcsetAttr + (extraAttrs || "") + ">";
  }

  var ICONS = {
    parent: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="7.5" r="3.3"/><path d="M5 20c0-4.2 3.1-7 7-7s7 2.8 7 7"/></svg>',
    child: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.4 6.6L21 10l-5.4 4.2L17 21l-5-3.6L7 21l1.4-6.8L3 10l6.6-1.4z"/></svg>',
    sibling: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="8.5" cy="8" r="2.8"/><circle cx="16" cy="9" r="2.4"/><path d="M3 20c0-3.5 2.5-6 5.5-6s5.5 2.5 5.5 6M14 20c.3-2.8 2.3-5 4.5-5c2.4 0 4.3 2 4.5 5"/></svg>',
    family: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="7" cy="7.5" r="2.6"/><circle cx="17" cy="7.5" r="2.6"/><circle cx="12" cy="9.5" r="2.2"/><path d="M2 20c0-3.3 2.2-5.6 5-5.6M22 20c0-3.3-2.2-5.6-5-5.6M7.5 20c0-3 2-5 4.5-5s4.5 2 4.5 5"/></svg>'
  };

  function hydrateSimpleFields(data) {
    document.querySelectorAll("[data-key]").forEach(function (node) {
      var val = get(data, node.getAttribute("data-key"));
      if (val == null) return;
      node.textContent = val;
    });
    document.querySelectorAll("[data-href-key]").forEach(function (node) {
      var val = get(data, node.getAttribute("data-href-key"));
      if (val != null) node.setAttribute("href", val);
    });
    document.querySelectorAll("[data-key-alt]").forEach(function (node) {
      var val = get(data, node.getAttribute("data-key-alt"));
      if (val != null) node.setAttribute("alt", val);
    });
  }

  function fillPills(containerId, items) {
    var container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = "";
    items.forEach(function (item) { container.appendChild(el("span", "pill", item)); });
  }

  function render(data) {
    applySectionVisibility(data);
    hydrateSimpleFields(data);

    // 로고: 이미지가 등록되어 있으면 기본 아이콘 대신 표시
    var hasLogo = !!data.site.logoImage;
    ["brand", "footer"].forEach(function (prefix) {
      var mark = document.getElementById(prefix + "-mark");
      var logo = document.getElementById(prefix + "-logo");
      if (!mark || !logo) return;
      mark.style.display = hasLogo ? "none" : "";
      if (hasLogo) {
        applyResponsiveImage(logo, data.site.logoImage, [68, 136], "68px", 68);
        logo.alt = data.site.name || "";
        logo.style.display = "";
      } else {
        logo.style.display = "none";
      }
    });

    // header nav
    var nav = document.getElementById("main-nav");
    nav.innerHTML = "";
    data.nav.items.forEach(function (item) {
      var a = el("a", null, item.label);
      a.href = item.href;
      nav.appendChild(a);
    });

    // hero
    var heroPhoto = document.getElementById("hero-photo");
    applyResponsiveImage(heroPhoto, data.hero.photoImage, [480, 800, 1200], "(max-width:900px) 100vw, 560px", 800);
    var heroValues = document.getElementById("hero-values");
    heroValues.innerHTML = "";
    data.hero.values.forEach(function (v) {
      var item = el("div", "hero-value");
      item.innerHTML =
        "<span class=\"icon-badge\">" + (ICONS[v.icon] || "") + "</span>" +
        "<span class=\"value-label\">" + v.label + "</span>" +
        "<span class=\"value-sub\">" + v.sub + "</span>";
      heroValues.appendChild(item);
    });

    // problem
    var problemCards = document.getElementById("problem-cards");
    problemCards.innerHTML = "";
    data.problem.cards.forEach(function (c) {
      var card = el("article", "card");
      var imgTag = responsiveImgTag(c.image, "", [320, 480, 640], "(max-width:860px) 50vw, 33vw", 480, " loading=\"lazy\"");
      card.innerHTML = "<figure>" + imgTag + "</figure><p>" + c.body + "</p>";
      problemCards.appendChild(card);
    });

    // solution
    var roleCards = document.getElementById("role-cards");
    roleCards.innerHTML = "";
    data.solution.roles.forEach(function (r) {
      var card = el("article", "role-card");
      card.innerHTML = "<span class=\"tag\">" + r.tag + "</span><h3>" + r.title + "</h3><p>" + r.body + "</p>";
      roleCards.appendChild(card);
    });
    var reunionCard = document.getElementById("reunion-card");
    reunionCard.innerHTML =
      "<div><span class=\"tag\">" + data.solution.reunion.tag + "</span><h3>" + data.solution.reunion.title + "</h3></div>" +
      "<p>" + data.solution.reunion.body + "</p>";

    // program overview
    var programDays = document.getElementById("program-days");
    programDays.innerHTML = "";
    data.programOverview.days.forEach(function (d) {
      var card = el("article", "card day-card");
      var itemsHtml = d.flow.map(function (it) { return "<li>" + it + "</li>"; }).join("");
      card.innerHTML =
        "<span class=\"n\">" + d.n + "</span>" + (d.time ? "<span class=\"time\">" + d.time + "</span>" : "") +
        "<h3>" + d.title + "</h3><ul>" + itemsHtml + "</ul>";
      programDays.appendChild(card);
    });

    // day1
    var day1Steps = document.getElementById("day1-steps");
    day1Steps.innerHTML = "";
    data.day1.steps.forEach(function (s) {
      var row = el("div", "day-step");
      row.innerHTML = "<span class=\"time\">" + s.time + "</span><span class=\"body\"><b>" + s.title + "</b>" + s.body + "</span>";
      day1Steps.appendChild(row);
    });
    var day1Split = document.getElementById("day1-split");
    day1Split.innerHTML = "";
    data.day1.split.forEach(function (s) {
      var item = el("div", "split-item");
      item.innerHTML = "<div class=\"who\">" + s.who + "</div><div class=\"what\">" + s.what + "</div>";
      day1Split.appendChild(item);
    });

    // day2
    var day2Split = document.getElementById("day2-split");
    day2Split.innerHTML = "";
    data.day2.split.forEach(function (s) {
      var item = el("div", "split-item");
      item.innerHTML = "<div class=\"who\">" + s.who + "</div><div class=\"what\">" + s.what + "</div>";
      day2Split.appendChild(item);
    });
    fillPills("day2-parent-time", data.day2.parentTimeItems);

    // child care / sibling / parent free (feature sections)
    applyResponsiveImage(document.getElementById("childcare-image"), data.childCare.image, [480, 800, 1100], "(max-width:860px) 100vw, 540px", 800);
    fillPills("childcare-programs", data.childCare.programs);

    applyResponsiveImage(document.getElementById("sibling-image"), data.sibling.image, [480, 800, 1100], "(max-width:860px) 100vw, 540px", 800);
    fillPills("sibling-programs", data.sibling.programs);

    applyResponsiveImage(document.getElementById("parentfree-image"), data.parentFree.image, [480, 800, 1100], "(max-width:860px) 100vw, 540px", 800);
    fillPills("parentfree-activities", data.parentFree.activities);

    // day3 fullbleed
    applyResponsiveImage(document.getElementById("day3-image"), data.day3.image, [700, 1200, 1800], "100vw", 1200);
    var day3Flow = document.getElementById("day3-flow");
    day3Flow.innerHTML = "";
    data.day3.flow.forEach(function (f) { day3Flow.appendChild(el("span", null, f)); });

    // why
    var whyList = document.getElementById("why-list");
    whyList.innerHTML = "";
    data.why.items.forEach(function (w) {
      var item = el("article", "why-item");
      item.innerHTML =
        "<div class=\"why-item-head\"><div><span class=\"n\">" + w.n + "</span><h3>" + w.title + "</h3></div>" +
        "<span class=\"why-toggle-icon\">+</span></div>" +
        "<p>" + w.body + "</p>";
      whyList.appendChild(item);
    });

    // safety
    var safetySteps = document.getElementById("safety-steps");
    safetySteps.innerHTML = "";
    data.safety.steps.forEach(function (s) {
      var item = el("div", "safety-step");
      item.innerHTML = "<span class=\"n\">" + s.n + "</span><h4>" + s.title + "</h4><p>" + s.body + "</p>";
      safetySteps.appendChild(item);
    });

    // travel
    var travelRegions = document.getElementById("travel-regions");
    travelRegions.innerHTML = "";
    data.travel.regions.forEach(function (r) {
      var card = el("article", "card");
      card.innerHTML = "<h3>" + r.name + "</h3><p>" + r.body + "</p>";
      travelRegions.appendChild(card);
    });
    fillPills("travel-parent-items", data.travel.parentRecommendItems);
    document.getElementById("travel-cta").href = "#story";

    // story
    var storyTrack = document.getElementById("story-track");
    storyTrack.innerHTML = "";
    data.story.testimonials.forEach(function (t) {
      var card = el("article", "testimonial-card");
      card.innerHTML = "<span class=\"quote-mark\">&ldquo;</span><blockquote>" + t.quote + "</blockquote><figcaption>— " + t.author + "</figcaption>";
      storyTrack.appendChild(card);
    });
    fillPills("story-partners", data.story.partners);
    setupStoryCarousel(data.story.testimonials.length);

    // faq (그룹별 아코디언)
    var faqList = document.getElementById("faq-list");
    faqList.innerHTML = "";
    data.faq.groups.forEach(function (group) {
      faqList.appendChild(el("h3", "faq-group-label", group.label));
      group.items.forEach(function (f) {
        var item = el("div", "faq-item");
        item.innerHTML =
          "<button type=\"button\" class=\"faq-q\"><span>" + f.q + "</span><span class=\"plus\"></span></button>" +
          "<div class=\"faq-a\"><p>" + f.a + "</p></div>";
        faqList.appendChild(item);
      });
    });

    // final cta
    applyResponsiveImage(document.getElementById("finalcta-image"), data.finalCta.image, [700, 1200, 1800], "100vw", 1200);
    var finalLines = document.getElementById("finalcta-lines");
    finalLines.innerHTML = "";
    data.finalCta.lines.forEach(function (l) { finalLines.appendChild(el("span", null, l)); });

    // footer
    var footerLinks = document.getElementById("footer-links");
    footerLinks.innerHTML = "";
    var visibleLinks = data.footer.links.filter(function (l) { return l.visible !== false; });
    visibleLinks.forEach(function (l) {
      var a = el("a", null, l.label);
      a.href = l.href;
      footerLinks.appendChild(a);
    });
    footerLinks.style.display = visibleLinks.length ? "" : "none";
  }

  // 섹션 배경 톤: a=밝은 종이, b=밝은 종이(대체 톤). safety는 항상 고정 네이비.
  // day3/finalCta는 사진 배경 섹션이라 톤 로테이션에서 제외하고 노출 여부만 반영.
  var SECTION_ORDER = ["problem", "solution", "programOverview", "day1", "day2", "childCare", "sibling", "parentFree", "why", "safety", "travel", "story", "faq"];
  var SECTION_TONE = { problem: "b", solution: "a", programOverview: "b", day1: "a", day2: "b", childCare: "a", sibling: "b", parentFree: "a", why: "b", safety: "dark", travel: "a", story: "b", faq: "a" };
  var TONE_CLASSES = { a: ["bg-paper"], b: ["bg-paper2"], dark: ["bg-inv"] };
  var ALL_TONE_CLASSES = ["bg-paper", "bg-paper2", "bg-inv"];
  var FIXED_PHOTO_SECTIONS = ["day3", "finalCta"];

  function applySectionVisibility(data) {
    var visibility = data.sectionVisibility || {};
    var prevTone = "a"; // 히어로 기준(밝은 톤)에서 시작

    SECTION_ORDER.forEach(function (key) {
      var section = document.querySelector('[data-section="' + key + '"]');
      if (!section) return;
      var visible = visibility[key] !== false;
      section.style.display = visible ? "" : "none";
      ALL_TONE_CLASSES.forEach(function (c) { section.classList.remove(c); });
      if (!visible) return;

      var tone = SECTION_TONE[key];
      if (tone !== "dark" && tone === prevTone) {
        tone = tone === "a" ? "b" : "a";
      }
      TONE_CLASSES[tone].forEach(function (c) { section.classList.add(c); });
      prevTone = tone;
    });

    FIXED_PHOTO_SECTIONS.forEach(function (key) {
      var section = document.querySelector('[data-section="' + key + '"]');
      if (!section) return;
      section.style.display = (visibility[key] !== false) ? "" : "none";
    });
  }

  function setupWhyAccordion() {
    var list = document.getElementById("why-list");
    if (!list) return;
    list.addEventListener("click", function (e) {
      var item = e.target.closest(".why-item");
      if (!item) return;
      item.classList.toggle("open");
    });
  }

  function setupFaqAccordion() {
    var list = document.getElementById("faq-list");
    if (!list) return;
    list.addEventListener("click", function (e) {
      var btn = e.target.closest(".faq-q");
      if (!btn) return;
      var item = btn.closest(".faq-item");
      var wasOpen = item.classList.contains("open");
      list.querySelectorAll(".faq-item.open").forEach(function (i) { i.classList.remove("open"); });
      if (!wasOpen) item.classList.add("open");
    });
  }

  function setupStoryCarousel(count) {
    var track = document.getElementById("story-track");
    var dotsWrap = document.getElementById("story-dots");
    if (!track || !dotsWrap) return;
    dotsWrap.innerHTML = "";
    for (var i = 0; i < count; i++) {
      var dot = el("button", i === 0 ? "active" : "");
      dot.type = "button";
      dot.setAttribute("aria-label", (i + 1) + "번째 후기로 이동");
      dot.addEventListener("click", function (idx) {
        return function () {
          var card = track.children[idx];
          if (card) card.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
        };
      }(i));
      dotsWrap.appendChild(dot);
    }
    var ticking = false;
    track.addEventListener("scroll", function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        var trackCenter = track.scrollLeft + track.clientWidth / 2;
        var closest = 0, closestDist = Infinity;
        Array.from(track.children).forEach(function (card, idx) {
          var dist = Math.abs((card.offsetLeft + card.offsetWidth / 2) - trackCenter);
          if (dist < closestDist) { closestDist = dist; closest = idx; }
        });
        Array.from(dotsWrap.children).forEach(function (d, idx) { d.classList.toggle("active", idx === closest); });
        ticking = false;
      });
    }, { passive: true });
  }

  var prefersReducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function setupScrollReveal() {
    var targets = document.querySelectorAll(".reveal");
    if (!targets.length) return;
    if (prefersReducedMotion || !("IntersectionObserver" in window)) {
      targets.forEach(function (t) { t.classList.add("in-view"); });
      return;
    }
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("in-view");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: "0px 0px -40px 0px" });
    targets.forEach(function (t) { observer.observe(t); });
  }

  function setupNavToggle() {
    var toggle = document.getElementById("nav-toggle");
    var panel = document.getElementById("nav-panel");
    if (!toggle || !panel) return;
    toggle.addEventListener("click", function () {
      var isOpen = panel.classList.toggle("open");
      toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
    });
    panel.addEventListener("click", function (e) {
      if (e.target.tagName === "A") {
        panel.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  setupNavToggle();
  setupScrollReveal();
  setupWhyAccordion();
  setupFaqAccordion();

  fetch("content.json", { cache: "no-store" })
    .then(function (res) { return res.json(); })
    .then(render)
    .catch(function (err) { console.error("콘텐츠를 불러오지 못했습니다.", err); });
})();
