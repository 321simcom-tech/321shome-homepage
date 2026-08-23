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

  function render(data) {
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
    if (data.hero.photoImage) heroPhoto.src = data.hero.photoImage;
    var chips = document.getElementById("hero-chips");
    chips.innerHTML = "";
    data.hero.chips.forEach(function (c) {
      chips.appendChild(el("span", "chip", c));
    });

    // problem cards
    var problemCards = document.getElementById("problem-cards");
    problemCards.innerHTML = "";
    problemCards.classList.add("grid-auto");
    data.problem.cards.forEach(function (c) {
      var card = el("article", "card");
      card.innerHTML = "<h3>" + c.title + "</h3><p>" + c.body + "</p>";
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
        "<div class=\"compare-b\"><span>강진형 복지관광 (삼이일심)</span><p>" + row.b + "</p></div>";
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
      fig.innerHTML = "<img src=\"" + t.image + "\" alt=\"" + t.name + "\"><figcaption>" + t.name + "</figcaption>";
      tiles.appendChild(fig);
    });

    // results
    var resultsMainImg = document.getElementById("results-main-img");
    if (data.results.mainImage) resultsMainImg.src = data.results.mainImage;
    var resultsGrid = document.getElementById("results-grid");
    resultsGrid.innerHTML = "";
    data.results.gridImages.forEach(function (g) {
      var fig = el("figure");
      fig.innerHTML = "<img src=\"" + g.image + "\" alt=\"" + g.caption + "\"><figcaption>" + g.caption + "</figcaption>";
      resultsGrid.appendChild(fig);
    });

    var statGrid = document.getElementById("stat-grid");
    statGrid.className = "grid stat-grid";
    statGrid.innerHTML = "";
    data.results.stats.forEach(function (s) {
      var d = el("div", "stat");
      d.innerHTML = "<div class=\"value\">" + s.value + "</div><p class=\"label\">" + s.label + "</p>";
      statGrid.appendChild(d);
    });

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
    data.footer.links.forEach(function (l) {
      var a = el("a", null, l.label);
      a.href = l.href;
      footerLinks.appendChild(a);
    });
    var footerProgramsList = document.getElementById("footer-programs-list");
    footerProgramsList.innerHTML = "";
    data.footer.programs.forEach(function (p) {
      footerProgramsList.appendChild(el("span", "pill", p));
    });
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

  fetch("content.json", { cache: "no-store" })
    .then(function (res) { return res.json(); })
    .then(render)
    .catch(function (err) { console.error("콘텐츠를 불러오지 못했습니다.", err); });
})();
