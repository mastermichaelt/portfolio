(function () {
  "use strict";

  // Mobile nav
  var toggle = document.querySelector("[data-nav-toggle]");
  var mobile = document.querySelector("[data-mobile-nav]");
  if (toggle && mobile) {
    toggle.addEventListener("click", function () {
      var open = mobile.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }

  // Project / article filter
  function applyFilter(root) {
    var q = (root.querySelector("[data-filter-q]") || {}).value || "";
    q = String(q).trim().toLowerCase();
    var activeTag = root.getAttribute("data-active-tag") || "all";
    root.querySelectorAll("[data-filter-item]").forEach(function (item) {
      var tags = (item.getAttribute("data-tags") || "").toLowerCase();
      var hay = ((item.textContent || "") + " " + tags).toLowerCase();
      var tagOk =
        activeTag === "all" || tags.split(/\s+/).indexOf(activeTag) !== -1;
      var qOk = !q || hay.indexOf(q) !== -1;
      item.hidden = !(tagOk && qOk);
    });
    var empty = root.querySelector("[data-filter-empty]");
    if (empty) {
      var visible = root.querySelectorAll(
        "[data-filter-item]:not([hidden])",
      ).length;
      empty.hidden = visible > 0;
    }
  }

  document.querySelectorAll("[data-filter-root]").forEach(function (root) {
    root.setAttribute("data-active-tag", "all");
    var q = root.querySelector("[data-filter-q]");
    if (q)
      q.addEventListener("input", function () {
        applyFilter(root);
      });
    root.querySelectorAll("[data-filter-tag]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        root.querySelectorAll("[data-filter-tag]").forEach(function (b) {
          b.classList.remove("tag-active");
          b.setAttribute("aria-pressed", "false");
        });
        btn.classList.add("tag-active");
        btn.setAttribute("aria-pressed", "true");
        root.setAttribute(
          "data-active-tag",
          btn.getAttribute("data-filter-tag") || "all",
        );
        applyFilter(root);
      });
    });
  });

  // Detail page TOC active state
  var tocLinks = document.querySelectorAll('[data-toc] a[href^="#"]');
  if (tocLinks.length) {
    var sections = [];
    tocLinks.forEach(function (link) {
      var id = link.getAttribute("href").slice(1);
      var el = document.getElementById(id);
      if (el) sections.push({ id: id, el: el, link: link });
    });
    var onScroll = function () {
      var y = window.scrollY + 120;
      var current = sections[0];
      sections.forEach(function (s) {
        if (s.el.offsetTop <= y) current = s;
      });
      tocLinks.forEach(function (l) {
        l.classList.remove("active");
      });
      if (current) current.link.classList.add("active");
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  // Contact form (prototype validation)
  var form = document.querySelector("[data-contact-form]");
  if (form) {
    var status = form.querySelector("[data-form-status]");
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var name = form.querySelector('[name="name"]');
      var email = form.querySelector('[name="email"]');
      var topic = form.querySelector('[name="topic"]');
      var ok = true;
      [name, email, topic].forEach(function (field) {
        if (!field) return;
        var valid = field.value && String(field.value).trim().length > 0;
        if (field.type === "email")
          valid = valid && /.+@.+\..+/.test(field.value);
        field.style.borderColor = valid ? "" : "var(--accent)";
        if (!valid) ok = false;
      });
      if (!status) return;
      if (!ok) {
        status.hidden = false;
        status.textContent =
          "Add a name, valid email, and topic so I can reply with the right context.";
        return;
      }
      status.hidden = false;
      status.textContent =
        "Prototype only — message captured locally. Replace with your form endpoint when shipping.";
      form.reset();
    });
  }

  // System map interactions
  var map = document.querySelector("[data-system-map]");
  if (!map) return;

  var nodes = Array.prototype.slice.call(map.querySelectorAll("[data-node]"));
  var edges = Array.prototype.slice.call(map.querySelectorAll("[data-edge]"));
  var inspector = document.querySelector("[data-inspector]");
  var legendBtns = document.querySelectorAll("[data-legend]");

  var GRAPH = window.SYSTEM_GRAPH || {};

  function setInspector(id) {
    if (!inspector || !GRAPH[id]) return;
    var n = GRAPH[id];
    inspector.innerHTML =
      '<div class="card">' +
      '<p class="eyebrow" style="margin-bottom:10px">' +
      n.kind +
      "</p>" +
      '<h3 style="margin-bottom:8px">' +
      n.title +
      "</h3>" +
      '<p style="margin:0;color:var(--muted);font-size:15px">' +
      n.summary +
      "</p>" +
      (n.href
        ? '<p style="margin:16px 0 0"><a class="btn btn-ghost btn-arrow" href="' +
          n.href +
          '">Open detail</a></p>'
        : "") +
      "</div>" +
      '<div class="card">' +
      '<h3 style="margin-bottom:8px">Connected</h3>' +
      '<div class="chip-row">' +
      (n.links || [])
        .map(function (l) {
          return (
            '<button type="button" class="tag" data-jump="' +
            l +
            '">' +
            (GRAPH[l] ? GRAPH[l].title : l) +
            "</button>"
          );
        })
        .join("") +
      "</div>" +
      '<div style="margin-top:16px">' +
      (n.related || [])
        .map(function (r) {
          return (
            '<a class="related-link" href="' +
            r.href +
            '"><strong>' +
            r.label +
            "</strong>" +
            '<p class="meta" style="margin:4px 0 0">' +
            r.meta +
            "</p></a>"
          );
        })
        .join("") +
      "</div>" +
      "</div>";
    inspector.querySelectorAll("[data-jump]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        activate(btn.getAttribute("data-jump"));
      });
    });
  }

  function activate(id) {
    var active = GRAPH[id];
    var hot = {};
    if (active) {
      hot[id] = true;
      (active.links || []).forEach(function (l) {
        hot[l] = true;
      });
    }
    nodes.forEach(function (node) {
      var nid = node.getAttribute("data-node");
      node.classList.toggle("is-active", nid === id);
      node.classList.toggle("is-dim", id && !hot[nid]);
    });
    edges.forEach(function (edge) {
      var a = edge.getAttribute("data-from");
      var b = edge.getAttribute("data-to");
      var on = id && ((a === id && hot[b]) || (b === id && hot[a]));
      edge.classList.toggle("is-hot", !!on);
    });
    legendBtns.forEach(function (btn) {
      btn.setAttribute(
        "aria-pressed",
        btn.getAttribute("data-legend") === id ? "true" : "false",
      );
    });
    if (id) setInspector(id);
  }

  nodes.forEach(function (node) {
    node.addEventListener("click", function () {
      var id = node.getAttribute("data-node");
      activate(node.classList.contains("is-active") ? "" : id);
    });
  });
  legendBtns.forEach(function (btn) {
    btn.addEventListener("click", function () {
      var id = btn.getAttribute("data-legend");
      activate(btn.getAttribute("aria-pressed") === "true" ? "" : id);
    });
  });

  // Default select first project node
  activate("codenames");
})();
