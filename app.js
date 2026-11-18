(() => {
  const storageKey = "campus-stores.shift.v2";
  const legacyKey = "campus-stores.shift.v1";
  const themeKey = "campus-stores.theme";
  const root = document.getElementById("campus-stores");
  const q = (selector) => root.querySelector(selector);
  const requests = [
    {
      id: "RQ-214",
      club: "Film Society",
      event: "Courtyard screening",
      owner: "Isha Rao",
      due: "Fri 8 pm",
      items: ["HDMI projector", "Portable speaker", "USB-C → HDMI adapter"],
      note: "Playback is from a USB-C-only laptop. The host will collect at 4 pm.",
    },
    {
      id: "RQ-209",
      club: "Debate Union",
      event: "Finals rehearsal",
      owner: "Tara Shah",
      due: "Sat 10 am",
      items: ["Wireless microphone"],
      note: "Rehearsal runs into the evening.",
    },
    {
      id: "RQ-217",
      club: "Photo Circle",
      event: "Street portrait walk",
      owner: "Dev Menon",
      due: "Sat noon",
      items: ["Digital camera"],
      note: "Collection on Saturday morning.",
    },
  ];
  const assets = [
    { id: "PR-04", type: "HDMI projector", model: "BenQ MH550", bin: "A2" },
    {
      id: "PR-06",
      type: "HDMI projector",
      model: "Epson EB-X49",
      bin: "Workshop",
      repair: true,
    },
    { id: "SP-02", type: "Portable speaker", model: "JBL Eon One", bin: "B1" },
    { id: "SP-05", type: "Portable speaker", model: "Bose S1", bin: "B2" },
    {
      id: "AD-12",
      type: "USB-C → HDMI adapter",
      model: "Belkin AVC002",
      bin: "C4",
    },
    {
      id: "AD-15",
      type: "USB-C → HDMI adapter",
      model: "Anker A8312",
      bin: "C4",
    },
    { id: "MI-09", type: "Wireless microphone", model: "Shure BLX", bin: "B3" },
    { id: "CA-03", type: "Digital camera", model: "Sony A6400", bin: "D2" },
  ];
  const people = [
    "Isha Rao",
    "Kabir Sen",
    "Leela Das",
    "Tara Shah",
    "Dev Menon",
  ];
  const shifts = [
    {
      time: "Friday · 3:45 pm",
      at: 945,
      title: "Pickup at the counter",
      text: "Kabir is here for the Film Society screening. The film starts at four. Can he leave with everything he needs?",
      next: "Move to return time",
    },
    {
      time: "Friday · 7:30 pm",
      at: 1170,
      title: "The kit comes back in pieces",
      text: "Kabir has brought back the projector and speaker. “Leela still has the adapter. She’ll drop it off tomorrow at nine.” Take the return and hand over to the morning shift.",
      next: "Move to next morning",
    },
    {
      time: "Saturday · 9:00 am",
      at: 1980,
      title: "Morning shift",
      text: "You’ve just taken over. Leela walks in with an adapter. Work out what was outstanding from the screening and close the loan for the right item.",
    },
  ];
  // Return-by times on the desk clock (minutes from Friday midnight).
  const dueTimes = {
    "Fri 8 pm": 1200,
    "Sat 9 am": 1980,
    "Sat 10 am": 2040,
    "Sat noon": 2160,
  };
  const pages = [
    ["Requests", "clipboard-list"],
    ["Inventory", "package"],
    ["Loan register", "book-open"],
    ["Desk book", "messages-square"],
  ];
  const original = () => ({
    version: 2,
    tab: "Requests",
    phase: 0,
    selected: "",
    filter: "All items",
    loans: [
      {
        num: 401,
        req: "RQ-209",
        asset: "MI-09",
        who: "Tara Shah",
        due: "Sat 10 am",
        back: false,
      },
    ],
    notes: [],
    editing: false,
    onlyOpen: true,
    act: null,
    undo: null,
    flash: "",
    notice: "Sample shift · All records are fictional.",
  });
  let s = original();
  const getAsset = (id) => assets.find((x) => x.id === id);
  const getReq = (id) => requests.find((x) => x.id === id);
  const out = (id) => s.loans.find((l) => l.asset === id && !l.back);
  const getLoan = (num) => s.loans.find((l) => l.num === Number(num));
  // Who physically has the unit now, and when the desk expects it back.
  const holder = (l) => (l.with ? l.with.who : l.who);
  const expected = (l) => (l.with ? l.with.until : l.due);
  function timing(l) {
    const now = shifts[s.phase].at;
    const due = dueTimes[expected(l)];
    if (now > due) return ["Overdue since " + expected(l), "warn"];
    if (now === due) return [l.with ? "Expected now" : "Due now", "warn"];
    if (l.with) return ["Expected " + l.with.until, "info"];
    return ["", ""];
  }
  const esc = (x) =>
    String(x).replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c],
    );
  const opts = (list) =>
    list
      .map(([v, t]) => '<option value="' + esc(v) + '">' + esc(t) + "</option>")
      .join("");
  const btn = (label, act, val = "", style = "") =>
    '<button type="button" data-action="' +
    act +
    '" data-val="' +
    esc(val) +
    '" class="' +
    style +
    '">' +
    esc(label) +
    "</button>";
  const head = (title, sub, control = "") =>
    '<div class="sectionhead"><div><h2>' +
    title +
    "</h2><small>" +
    sub +
    "</small></div>" +
    control +
    "</div>";
  const row = (label, sub, right) =>
    '<div class="row"><div><strong>' +
    esc(label) +
    "</strong><small>" +
    esc(sub) +
    "</small></div><div>" +
    right +
    "</div></div>";
  const badge = (t, tone = "") =>
    '<span class="tag' + (tone ? " " + tone : "") + '">' + esc(t) + "</span>";
  const select = (label, key, options, chosen = "", focus = false) =>
    "<label><span>" +
    label +
    '</span><select name="' +
    key +
    '" required' +
    (focus ? " data-autofocus" : "") +
    '><option value="">Select…</option>' +
    opts(options).replace(
      'value="' + esc(chosen) + '"',
      'value="' + esc(chosen) + '" selected',
    ) +
    "</select></label>";
  const formError = '<p class="flash error" data-form-error hidden></p>';
  function requestPage() {
    let html = head(
      "Approved requests",
      "Student Activities Office · 3 approved forms",
    );
    if (s.selected) {
      const r = getReq(s.selected);
      html +=
        btn("Back to list", "close") +
        '<div class="record"><small>' +
        r.id +
        " · Approved</small><h3>" +
        r.event +
        "</h3><p>" +
        r.club +
        " · Filed by " +
        r.owner +
        "</p><p><b>Return by</b> " +
        r.due +
        "</p><p><b>Approved equipment</b></p><ul>" +
        r.items.map((x) => "<li>" + x + "</li>").join("") +
        "</ul><p>" +
        r.note +
        "</p></div>";
    } else
      html += requests
        .map((r) =>
          row(
            r.event,
            r.id + " · " + r.club,
            btn("View form", "request", r.id),
          ),
        )
        .join("");
    return html;
  }
  function inventory() {
    let html = head(
      "Inventory",
      "Physical units · home shelf and current availability",
    );
    html +=
      '<div class="buttons"><label>Show <select data-filter>' +
      opts(
        ["All items", "On shelf", "On loan", "In repair"].map((f) => [f, f]),
      ) +
      "</select></label></div>";
    for (const a of assets) {
      const loan = out(a.id);
      const status = a.repair ? "In repair" : loan ? "On loan" : "On shelf";
      if (s.filter !== "All items" && s.filter !== status) continue;
      html += row(
        a.id + " · " + a.type,
        a.model + " · " + a.bin + (loan ? " · With " + holder(loan) : ""),
        badge(status, status === "On shelf" ? "good" : ""),
      );
    }
    return html;
  }
  function register() {
    let html = head(
      "Loan register",
      "One slip per physical unit",
      s.editing
        ? btn("Cancel", "cancel")
        : btn("New issue slip", "new", "", "primary"),
    );
    if (s.editing) {
      const available = assets.filter((a) => !a.repair && !out(a.id));
      return (
        html +
        '<form data-issue><div class="form">' +
        select(
          "Approved request",
          "req",
          requests.map((r) => [r.id, r.id + " · " + r.club]),
        ) +
        select(
          "Unit leaving the desk",
          "asset",
          available.map((a) => [a.id, a.id + " · " + a.type]),
        ) +
        select(
          "Collected by",
          "who",
          people.map((p) => [p, p]),
        ) +
        select(
          "Return by",
          "due",
          Object.keys(dueTimes).map((d) => [d, d]),
        ) +
        "</div>" +
        formError +
        '<button type="submit" class="primary">Save issue slip</button></form>'
      );
    }
    if (s.flash)
      html +=
        '<div class="flash">' +
        "<span>" +
        esc(s.flash) +
        "</span>" +
        (s.undo ? btn("Undo", "undo") : "") +
        "</div>";
    html +=
      '<div class="buttons">' +
      ["Outstanding", "All slips"]
        .map(
          (v, i) =>
            '<button type="button" data-action="scope" data-val="' +
            i +
            '" aria-pressed="' +
            (s.onlyOpen === (i === 0)) +
            '">' +
            v +
            "</button>",
        )
        .join("") +
      "</div>";
    const shown = s.loans
      .filter((l) => !s.onlyOpen || !l.back)
      .slice()
      .reverse();
    if (!shown.length) html += "<p>No outstanding slips.</p>";
    for (const l of shown) html += slip(l);
    return html;
  }
  // One loan slip: what the unit is, who has it now, and when it is due back.
  function slip(l) {
    const a = getAsset(l.asset);
    const r = getReq(l.req);
    const acting = s.act && s.act.num === l.num ? s.act.kind : "";
    let where;
    let history = "";
    if (l.back)
      where =
        "Returned" +
        (l.returnedBy ? " by " + l.returnedBy : "") +
        (l.backPhase !== undefined ? " · " + shifts[l.backPhase].time : "");
    else if (l.with) {
      where = "With " + l.with.who + " · Back " + l.with.until;
      history =
        "Issued to " +
        l.who +
        ", due " +
        l.due +
        " · Handed on by " +
        l.with.from +
        ", " +
        shifts[l.with.phase].time;
    } else where = "With " + l.who + " · Due " + l.due;
    const [when, tone] = l.back ? ["Returned", ""] : timing(l);
    let html =
      '<div class="slip' +
      (acting ? " acting" : "") +
      '"><div class="row"><div><strong>' +
      esc(a.type) +
      "</strong><small>L-" +
      l.num +
      " · " +
      esc(l.asset) +
      " " +
      esc(a.model) +
      " · " +
      esc(l.req + " " + r.club) +
      '</small><small class="where">' +
      esc(where) +
      "</small>" +
      (history ? "<small>" + esc(history) + "</small>" : "") +
      '</div><div class="slipside">' +
      (when ? badge(when, tone) : "") +
      (l.back
        ? ""
        : btn("Still out", "out", String(l.num)) +
          btn("Record return", "return", String(l.num))) +
      "</div></div>";
    if (acting === "out") {
      const later = Object.keys(dueTimes).filter(
        (d) => dueTimes[d] > shifts[s.phase].at,
      );
      html +=
        '<form class="actpanel" data-out><input type="hidden" name="num" value="' +
        l.num +
        '" /><p><b>Record who has ' +
        esc(l.asset) +
        " now.</b> It stays on slip L-" +
        l.num +
        " until it is back at the desk.</p>" +
        '<div class="form">' +
        select(
          "Who has it now",
          "who",
          people.filter((p) => p !== holder(l)).map((p) => [p, p]),
          "",
          true,
        ) +
        select(
          "Expected back",
          "until",
          later.map((d) => [d, d]),
        ) +
        "</div>" +
        formError +
        '<div class="buttons"><button type="submit" class="primary">Save on slip</button>' +
        btn("Cancel", "cancel") +
        "</div></form>";
    }
    if (acting === "return") {
      const sameType = assets.filter((x) => x.type === a.type);
      html +=
        '<form class="actpanel" data-return><input type="hidden" name="num" value="' +
        l.num +
        '" /><p><b>Check the label on the unit at the counter.</b> This slip is for ' +
        esc(l.asset) +
        " (" +
        esc(a.model) +
        ").</p>" +
        '<div class="form">' +
        select(
          "Returned by",
          "who",
          people.map((p) => [p, p]),
          holder(l),
          true,
        ) +
        "</div>" +
        '<div class="unitpick" role="group" aria-label="Unit on the counter"><span>Tap the unit on the counter to close the slip</span>' +
        sameType
          .map(
            (x) =>
              '<button type="submit" name="unit" value="' +
              esc(x.id) +
              '"><strong>' +
              esc(x.id) +
              "</strong><small>" +
              esc(x.model) +
              "</small></button>",
          )
          .join("") +
        "</div>" +
        formError +
        '<div class="buttons">' +
        btn("Cancel", "cancel") +
        "</div></form>";
    }
    return html + "</div>";
  }
  function deskbook() {
    let html = head(
      "Desk book",
      "Messages from clubs and notes for the next shift",
    );
    const entries = [
      [
        "Friday · 3:20 pm",
        "Isha Rao · Film Society",
        "Kabir Sen is picking up our whole screening kit. Please issue it in his name. I’m setting up in the courtyard.",
      ],
      [
        "Friday · 3:30 pm",
        "Tara Shah · Debate Union",
        "Our microphone stays with me overnight. I’ll return it by 10 am Saturday.",
      ],
    ];
    if (s.phase >= 1)
      entries.push([
        "Friday · 7:30 pm",
        "Kabir Sen · Film Society",
        "I brought the projector and speaker. Leela Das has our adapter. She’ll be at the counter at 9 am tomorrow.",
      ]);
    for (const n of s.notes)
      entries.push([
        shifts[n.phase].time,
        n.slip ? "Loan register · Slip L-" + n.slip : "Counter handover",
        n.text,
      ]);
    for (const [t, author, body] of entries.slice().reverse())
      html +=
        '<article class="record"><small>' +
        esc(t) +
        "</small><h3>" +
        esc(author) +
        "</h3><p>" +
        esc(body) +
        "</p></article>";
    return (
      html +
      '<form data-note><div class="form"><label class="full"><span>Note for the next shift</span><textarea name="note" rows="2" maxlength="400" required></textarea></label></div><button type="submit">Add handover note</button></form>'
    );
  }
  const screens = {
    Requests: requestPage,
    Inventory: inventory,
    "Loan register": register,
    "Desk book": deskbook,
  };
  function paint() {
    const phase = shifts[s.phase];
    q("[data-clock]").textContent = phase.time;
    q("[data-shift-title]").textContent = phase.title;
    q("[data-shift]").textContent = phase.text;
    const advance = q('[data-action="advance"]');
    advance.hidden = !phase.next;
    advance.textContent = phase.next || "";
    q("[data-nav]").innerHTML = pages
      .map(
        ([n, icon]) =>
          '<button type="button" data-action="tab" data-val="' +
          n +
          '" aria-pressed="' +
          (s.tab === n) +
          '"><svg aria-hidden="true" class="store-icon"><use href="#icon-' +
          icon +
          '"></use></svg>' +
          n +
          "</button>",
      )
      .join("");
    q("[data-page]").innerHTML = screens[s.tab]();
    if (q("[data-filter]")) q("[data-filter]").value = s.filter;
    q("[data-status]").textContent = s.notice;
    const focus = q("[data-autofocus]");
    if (focus) focus.focus();
  }
  function applyTheme(theme) {
    const scheme = theme === "light" || theme === "dark" ? theme : "";
    root.style.colorScheme = scheme;
    document.documentElement.style.colorScheme = scheme;
    root
      .querySelectorAll("[data-theme]")
      .forEach((b) =>
        b.setAttribute(
          "aria-pressed",
          String(b.dataset.theme === (scheme || "auto")),
        ),
      );
    try {
      localStorage.setItem(themeKey, scheme || "auto");
    } catch {
      // The theme still applies for this visit.
    }
  }
  function commit(msg) {
    if (msg) s.notice = msg;
    paint();
    try {
      localStorage.setItem(storageKey, JSON.stringify(s));
    } catch {
      q("[data-status]").textContent +=
        " Browser storage is unavailable. Progress lasts for this visit.";
    }
  }
  root.addEventListener("click", (e) => {
    const t = e.target.closest("[data-theme]");
    if (t) return applyTheme(t.dataset.theme);
    const b = e.target.closest("[data-action]");
    if (!b) return;
    const v = b.dataset.val;
    // A new action replaces the last confirmation and its undo.
    if (b.dataset.action !== "undo") {
      s.undo = null;
      s.flash = "";
    }
    switch (b.dataset.action) {
      case "restart":
        s = original();
        break;
      case "advance":
        if (s.phase < 2) s.phase++;
        s.act = null;
        s.notice = "Shift time updated.";
        break;
      case "tab":
        s.tab = v;
        s.editing = false;
        s.act = null;
        break;
      case "close":
        s.selected = "";
        break;
      case "request":
        s.selected = v;
        break;
      case "new":
        s.editing = true;
        s.act = null;
        break;
      case "cancel":
        s.editing = false;
        s.act = null;
        break;
      case "scope":
        s.onlyOpen = v === "0";
        break;
      case "out":
      case "return": {
        const l = getLoan(v);
        if (!l || l.back) return;
        s.act = { num: l.num, kind: b.dataset.action };
        break;
      }
      case "undo": {
        const l = getLoan(s.undo);
        if (!l) return;
        l.back = false;
        delete l.returnedBy;
        delete l.backPhase;
        s.undo = null;
        s.flash = "Return undone. Slip L-" + l.num + " is open again.";
        s.notice = s.flash;
        break;
      }
    }
    commit();
  });
  root.addEventListener("change", (e) => {
    if (e.target.matches("[data-filter]")) {
      s.filter = e.target.value;
      commit();
    }
  });
  root.addEventListener("submit", (e) => {
    e.preventDefault();
    const f = e.target;
    const form = new FormData(f);
    const fail = (msg) => {
      const p = f.querySelector("[data-form-error]");
      if (p) {
        p.textContent = msg;
        p.hidden = false;
      }
      q("[data-status]").textContent = msg;
    };
    if (f.matches("[data-out]")) {
      const l = getLoan(form.get("num"));
      const who = form.get("who");
      const until = form.get("until");
      if (!l || l.back || !people.includes(who) || !dueTimes[until]) return;
      const from = holder(l);
      l.with = { who, until, from, phase: s.phase };
      s.notes.push({
        phase: s.phase,
        slip: l.num,
        text:
          l.asset +
          " (" +
          getAsset(l.asset).type +
          ") is with " +
          who +
          ", handed on by " +
          from +
          ". Expected back " +
          until +
          ". Originally due " +
          l.due +
          ".",
      });
      s.act = null;
      s.flash =
        "Slip L-" +
        l.num +
        " updated: " +
        l.asset +
        " is with " +
        who +
        ", expected back " +
        until +
        ". Noted in the desk book.";
      commit(s.flash);
      return;
    }
    if (f.matches("[data-return]")) {
      const l = getLoan(form.get("num"));
      // The unit button that was tapped submits the form.
      const unit = e.submitter ? e.submitter.value : form.get("unit");
      const who = form.get("who");
      if (!l || l.back || !getAsset(unit) || !people.includes(who)) return;
      if (unit !== l.asset) {
        const other = out(unit);
        fail(
          other
            ? unit +
                " belongs to slip L-" +
                other.num +
                " (" +
                holder(other) +
                "). Close that slip instead."
            : unit +
                " is not out on any slip. This slip is for " +
                l.asset +
                " (" +
                getAsset(l.asset).model +
                "). Check the label again.",
        );
        return;
      }
      l.back = true;
      l.returnedBy = who;
      l.backPhase = s.phase;
      s.act = null;
      s.undo = l.num;
      s.flash =
        l.asset + " returned by " + who + ". Slip L-" + l.num + " closed.";
      commit(s.flash);
      return;
    }
    if (f.matches("[data-note]")) {
      const text = String(form.get("note")).trim();
      if (!text) return;
      s.notes.push({ phase: s.phase, text });
      commit("Handover note saved.");
      return;
    }
    if (!f.matches("[data-issue]")) return;
    const [req, asset, who, due] = ["req", "asset", "who", "due"].map((k) =>
      form.get(k),
    );
    const unit = getAsset(asset),
      r = getReq(req);
    if (!r || !unit || unit.repair || out(asset) || !people.includes(who))
      return;
    if (!r.items.includes(unit.type)) {
      fail(
        "This equipment type is outside the approved request. Choose an approved unit.",
      );
      return;
    }
    if (
      s.loans.some(
        (l) => l.req === req && !l.back && getAsset(l.asset).type === unit.type,
      )
    ) {
      fail("The approved quantity of this equipment type is already on loan.");
      return;
    }
    const num = Math.max(...s.loans.map((l) => l.num)) + 1;
    s.loans.push({ num, req, asset, who, due, back: false });
    s.editing = false;
    s.flash = "Issued " + asset + " to " + who + " on slip L-" + num + ".";
    commit(s.flash);
  });
  function restore(d) {
    if (
      !d ||
      (d.version !== 1 && d.version !== 2) ||
      !Object.hasOwn(screens, d.tab) ||
      !shifts[d.phase] ||
      (d.selected && !getReq(d.selected)) ||
      !Array.isArray(d.notes) ||
      !d.notes.every(
        (n) =>
          n &&
          shifts[n.phase] &&
          typeof n.text === "string" &&
          (n.slip === undefined || Number.isInteger(n.slip)),
      ) ||
      !Array.isArray(d.loans) ||
      !d.loans.length ||
      !d.loans.every(
        (l) =>
          l &&
          getReq(l.req) &&
          getAsset(l.asset) &&
          Number.isInteger(l.num) &&
          (l.with === undefined ||
            (l.with &&
              people.includes(l.with.who) &&
              people.includes(l.with.from) &&
              Object.hasOwn(dueTimes, l.with.until) &&
              shifts[l.with.phase])) &&
          (l.backPhase === undefined || shifts[l.backPhase]) &&
          (l.returnedBy === undefined || people.includes(l.returnedBy)),
      )
    )
      return;
    // Version 1 shifts load unchanged; on-screen panels start closed.
    s = {
      ...original(),
      ...d,
      version: 2,
      act: null,
      undo: null,
      flash: "",
      loans: d.loans.map((l) => ({ ...l })),
      notes: d.notes.map((n) => ({ ...n })),
    };
    paint();
  }
  paint();
  try {
    applyTheme(localStorage.getItem(themeKey));
  } catch {
    applyTheme("auto");
  }
  try {
    restore(
      JSON.parse(
        localStorage.getItem(storageKey) || localStorage.getItem(legacyKey),
      ),
    );
  } catch {
    // Keep the fresh shift when storage is unavailable or the saved data is invalid.
  }
})();
