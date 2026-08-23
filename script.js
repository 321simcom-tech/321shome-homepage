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

  // 섹션 배경 톤: a=밝은 종이+무늬, b=밝은 종이(무늬 없음), dark=어두운 강조.
  // 섹션이 꺼지면 앞뒤로 남은 섹션끼리 같은 톤이 맞붙지 않도록 자동으로 재배정한다.
  var SECTION_ORDER = ["problem", "solution", "compare", "schedule", "care", "gangjin", "results", "partners", "about"];
  var SECTION_TONE = { problem: "b", solution: "a", compare: "dark", schedule: "b", care: "a", gangjin: "b", results: "a", partners: "dark", about: "b" };
  var TONE_CLASSES = {
    a: ["bg-paper", "textured"],
    b: ["bg-paper2"],
    dark: ["bg-inv"]
  };
  var ALL_TONE_CLASSES = ["bg-paper", "bg-paper2", "bg-inv", "textured"];

  function applySectionVisibility(data) {
    var visibility = data.sectionVisibility || {};
    var prevTone = "a"; // 히어로 섹션 기준(밝은 톤)에서 시작

    SECTION_ORDER.forEach(function (key) {
      var section = document.querySelector('[data-section="' + key + '"]');
      if (!section) return;
      var visible = visibility[key] !== false;
      section.style.display = visible ? "" : "none";
      section.classList.remove("tone-divider");
      ALL_TONE_CLASSES.forEach(function (c) { section.classList.remove(c); });
      if (!visible) return;

      var tone = SECTION_TONE[key];
      if (tone !== "dark" && tone === prevTone) {
        tone = tone === "a" ? "b" : "a"; // 밝은 톤끼리 연속되면 서로 바꿔서 리듬 유지
      } else if (tone === "dark" && prevTone === "dark") {
        section.classList.add("tone-divider"); // 어두운 섹션끼리 연속되면 구분선만 추가(색은 유지)
      }
      TONE_CLASSES[tone].forEach(function (c) { section.classList.add(c); });
      prevTone = tone;
    });

    // apply 섹션은 항상 고정 강조색(주황)이라 톤 로테이션에서 제외, 노출 여부만 반영
    var applySection = document.querySelector('[data-section="apply"]');
    if (applySection) {
      applySection.style.display = (visibility.apply !== false) ? "" : "none";
    }
  }

  function render(data) {
    applySectionVisibility(data);
    hydrateSimpleFields(data);

    // header nav
    var nav = document.getElementById("main-nav");
    nav.innerHTML = "";
    data.nav.items.forEach(function (item) {
      var a = el("a", null, item.label);
      a.href = item.href;
      nav.appendChild(a);
    });

    // hero photo + chips
    var heroPhoto = document.getElementById("hero-photo");
    applyResponsiveImage(heroPhoto, data.hero.photoImage, [480, 800, 1200], "(max-width:860px) 100vw, 560px", 800);
    var chips = document.getElementById("hero-chips");
    chips.innerHTML = "";
    data.hero.chips.forEach(function (c) {
      chips.appendChild(el("span", "chip", c));
    });

    // problem cards
    var problemCards = document.getElementById("problem-cards");
    problemCards.innerHTML = "";
    problemCards.classList.add("grid-auto");
    var problemAccents = ["accent-deep", "accent-sage", "accent-plum"];
    data.problem.cards.forEach(function (c, i) {
      var card = el("article", "card");
      card.innerHTML =
        "<span class=\"card-accent-bar " + (problemAccents[i % problemAccents.length]) + "\"></span>" +
        "<h3>" + c.title + "</h3><p>" + c.body + "</p>";
      problemCards.appendChild(card);
    });

    // solution role cards
    var roleCards = document.getElementById("role-cards");
    var roleClasses = ["child", "sibling", "parent"];
    roleCards.innerHTML = "";
    data.solution.roles.forEach(function (r, i) {
      var card = el("article", "role-card " + (roleClasses[i] || ""));
      card.innerHTML = "<span class=\"tag\">" + r.tag + "</span><h3>" + r.title + "</h3><p>" + r.body + "</p>";
      roleCards.appendChild(card);
    });

    var diagramLabels = document.getElementById("diagram-labels");
    diagramLabels.innerHTML = "";
    data.solution.diagramLabels.forEach(function (l) {
      diagramLabels.appendChild(el("span", null, l.replace("\n", "<br>")));
    });

    var timelineItems = document.getElementById("timeline-items");
    timelineItems.innerHTML = "";
    data.solution.timelineItems.forEach(function (t) {
      var row = el("div", "timeline-item");
      row.innerHTML = "<span class=\"timeline-time\">" + t.time + "</span><span class=\"timeline-text\">" + t.text + "</span>";
      timelineItems.appendChild(row);
    });

    // compare
    var compareRows = document.getElementById("compare-rows");
    compareRows.innerHTML = "";
    data.compare.rows.forEach(function (row) {
      var wrap = el("div", "compare-row");
      wrap.innerHTML =
        "<div class=\"compare-label\">" + row.label + "</div>" +
        "<div class=\"compare-a\"><span>일반 가족 여행 / 기존 복지 캠프</span><p>" + row.a + "</p></div>" +
        "<div class=\"compare-b\"><span>강진형 복지관광 (삼이일심)</span><p><span class=\"compare-check\">" +
        "<svg viewBox=\"0 0 16 16\" fill=\"none\" aria-hidden=\"true\"><path d=\"M3.5 8.5L6.5 11.5L12.5 4.5\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/></svg>" +
        "</span><span>" + row.b + "</span></p></div>";
      compareRows.appendChild(wrap);
    });

    // schedule days
    var dayCards = document.getElementById("day-cards");
    dayCards.className = "grid day-cards";
    dayCards.innerHTML = "";
    var SF = 10, ST = 20, SC = ST - SF;
    data.schedule.days.forEach(function (d) {
      var left = ((d.barFrom - SF) / SC) * 100;
      var width = ((d.barTo - d.barFrom) / SC) * 100;
      var card = el("article", "card day-card");
      var itemsHtml = d.items.map(function (it) { return "<li>" + it + "</li>"; }).join("");
      card.innerHTML =
        "<span class=\"day-tag\">" + d.n + "</span>" +
        "<h3>" + d.title + "</h3>" +
        "<div class=\"day-bar-track\"><div class=\"day-bar-fill\" style=\"left:" + left.toFixed(2) + "%;width:" + width.toFixed(2) + "%\"></div></div>" +
        "<div class=\"day-bar-labels\"><span>" + d.start + "</span><span class=\"mid\">" + d.mid + "</span><span>" + d.end + "</span></div>" +
        "<ul class=\"day-items\">" + itemsHtml + "</ul>";
      dayCards.appendChild(card);
    });

    // care roles
    var careRoles = document.getElementById("care-roles");
    careRoles.className = "grid care-roles";
    careRoles.innerHTML = "";
    data.care.roles.forEach(function (r) {
      var card = el("article", "card");
      var badgeHtml = "";
      if (r.badge) {
        var badgeClass = r.badge === "1:1" ? "strong" : "soft";
        badgeHtml = "<span class=\"care-badge " + badgeClass + "\">" + r.badge + "</span>";
      }
      card.innerHTML =
        "<div class=\"care-count\"><b>" + r.count + "</b><span>" + r.unit + "</span></div>" +
        "<h3>" + r.title + "</h3><p>" + r.body + "</p>" + badgeHtml;
      careRoles.appendChild(card);
    });
    var operatorCard = el("article", "card");
    operatorCard.innerHTML =
      "<div class=\"care-operator-title\">" + data.care.operatorTitle + "</div>" +
      "<p style=\"margin:8px 0 0;font-size:var(--fs-body);line-height:1.8;color:var(--body-c)\">" + data.care.operatorBody + "</p>";
    careRoles.appendChild(operatorCard);

    var expertList = document.getElementById("expert-list");
    expertList.innerHTML = "";
    data.care.expertGroups.forEach(function (g) {
      expertList.appendChild(el("span", "pill", g));
    });

    // gangjin tiles
    var tiles = document.getElementById("tiles");
    tiles.className = "grid tiles";
    tiles.innerHTML = "";
    data.gangjin.tiles.forEach(function (t) {
      var fig = el("figure", "tile");
      var imgTag = responsiveImgTag(t.image, t.name, [320, 480, 640], "(max-width:860px) 50vw, 33vw", 480, " loading=\"lazy\"");
      fig.innerHTML = imgTag + "<figcaption>" + t.name + "</figcaption>";
      tiles.appendChild(fig);
    });

    // results
    var resultsMainImg = document.getElementById("results-main-img");
    applyResponsiveImage(resultsMainImg, data.results.mainImage, [480, 900, 1400], "(max-width:860px) 100vw, 700px", 900);
    var resultsGrid = document.getElementById("results-grid");
    resultsGrid.innerHTML = "";
    data.results.gridImages.forEach(function (g) {
      var fig = el("figure");
      var imgTag = responsiveImgTag(g.image, g.caption, [240, 360, 480], "(max-width:860px) 50vw, 25vw", 360, " loading=\"lazy\"");
      fig.innerHTML = imgTag + "<figcaption>" + g.caption + "</figcaption>";
      resultsGrid.appendChild(fig);
    });

    var statGrid = document.getElementById("stat-grid");
    statGrid.className = "grid stat-grid";
    statGrid.innerHTML = "";
    data.results.stats.forEach(function (s) {
      var d = el("div", "stat");
      d.innerHTML = "<div class=\"value\" data-final=\"" + s.value.replace(/"/g, "&quot;") + "\">" + s.value + "</div><p class=\"label\">" + s.label + "</p>";
      statGrid.appendChild(d);
    });
    setupStatCountUp(statGrid);

    var goalsGrid = document.getElementById("goals-grid");
    goalsGrid.className = "grid goals-grid";
    goalsGrid.innerHTML = "";
    data.results.goals.forEach(function (g) {
      goalsGrid.appendChild(el("p", null, g));
    });

    var resultsPartnersList = document.getElementById("results-partners-list");
    resultsPartnersList.innerHTML = "";
    data.results.partners.forEach(function (p) {
      resultsPartnersList.appendChild(el("span", "pill", p));
    });

    // partners section
    var partnerCards = document.getElementById("partner-cards");
    partnerCards.className = "grid partner-cards";
    partnerCards.innerHTML = "";
    data.partners.cards.forEach(function (c) {
      var card = el("article", "card partner-card");
      card.innerHTML = "<h3>" + c.title + "</h3><p>" + c.body + "</p>";
      partnerCards.appendChild(card);
    });

    // about
    var aboutLead = document.getElementById("about-lead");
    var leadHtml = data.about.lead;
    if (data.about.leadHighlight && leadHtml.indexOf(data.about.leadHighlight) !== -1) {
      leadHtml = leadHtml.replace(data.about.leadHighlight, "<strong>" + data.about.leadHighlight + "</strong>");
    }
    aboutLead.innerHTML = leadHtml;

    var aboutInfo = document.getElementById("about-info");
    aboutInfo.innerHTML = "";
    data.about.info.forEach(function (row) {
      aboutInfo.appendChild(el("dt", null, row.term));
      aboutInfo.appendChild(el("dd", null, row.value));
    });

    var esgGrid = document.getElementById("esg-grid");
    esgGrid.className = "grid esg-grid";
    esgGrid.innerHTML = "";
    data.about.esg.forEach(function (e) {
      var card = el("article", "esg-card");
      card.innerHTML = "<span class=\"tag\">" + e.tag + "</span><p>" + e.body + "</p>";
      esgGrid.appendChild(card);
    });

    // apply ctas
    var applyCtas = document.getElementById("apply-ctas");
    applyCtas.innerHTML = "";
    var mailA = el("a", "btn btn-dark", data.apply.ctaEmail);
    mailA.href = "mailto:" + data.apply.email;
    var partnerA = el("a", "btn btn-light", data.apply.ctaPartner);
    partnerA.href = "#partners";
    var phoneA = el("a", "btn btn-outline-dark", data.apply.ctaPhone);
    phoneA.href = "tel:" + data.apply.phone;
    applyCtas.appendChild(mailA);
    applyCtas.appendChild(partnerA);
    applyCtas.appendChild(phoneA);

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

    var showPrograms = data.footer.showPrograms !== false;
    var footerProgramsCol = document.getElementById("footer-programs");
    footerProgramsCol.style.display = showPrograms ? "" : "none";
    var footerProgramsList = document.getElementById("footer-programs-list");
    footerProgramsList.innerHTML = "";
    if (showPrograms) {
      data.footer.programs.forEach(function (p) {
        footerProgramsList.appendChild(el("span", "pill", p));
      });
    }

    var footerGrid = document.querySelector(".footer-grid");
    if (footerGrid) {
      footerGrid.classList.toggle("centered", !visibleLinks.length && !showPrograms);
    }
  }

  var prefersReducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function animateCountUp(node, finalText, duration) {
    var re = /\d+/g;
    var matches = finalText.match(re);
    if (!matches) { node.textContent = finalText; return; }
    var start = null;
    function frame(ts) {
      if (start === null) start = ts;
      var progress = Math.min((ts - start) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
      var i = 0;
      node.textContent = finalText.replace(re, function (m) {
        var target = parseInt(m, 10);
        var current = Math.round(target * eased);
        i++;
        var str = String(current);
        while (str.length < m.length) str = "0" + str;
        return str;
      });
      if (progress < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  function setupStatCountUp(statGrid) {
    var values = statGrid.querySelectorAll(".value[data-final]");
    if (!values.length) return;
    if (prefersReducedMotion || !("IntersectionObserver" in window)) return;
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          animateCountUp(entry.target, entry.target.getAttribute("data-final"), 1200);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.4 });
    values.forEach(function (v) { observer.observe(v); });
  }

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
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
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

  fetch("content.json", { cache: "no-store" })
    .then(function (res) { return res.json(); })
    .then(render)
    .catch(function (err) { console.error("콘텐츠를 불러오지 못했습니다.", err); });
})();
