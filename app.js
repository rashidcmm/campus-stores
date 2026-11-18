(() => {
  const storageKey = "campus-stores.shift.v2";
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
      title: "Pickup at the counter",
      text: "Kabir is here for the Film Society screening. The film starts at four. Can he leave with everything he needs?",
      next: "Move to return time",
    },
    {
      time: "Friday · 7:30 pm",
      title: "The kit comes back in pieces",
      text: "Kabir has brought back the projector and speaker. “Leela still has the adapter. She’ll drop it off tomorrow at nine.” Take the return and hand over to the morning shift.",
      next: "Move to next morning",
    },
    {
      time: "Saturday · 9:00 am",
      title: "Morning shift",
      text: "You’ve just taken over. Leela walks in with an adapter. Work out what was outstanding from the screening and close the loan for the right item.",
    },
  ];
  const pages = [
    ["Requests", "clipboard-list"],
    ["Inventory", "package"],
    ["Loan register", "book-open"],
    ["Desk book", "messages-square"],
  ];
  // Hours from Friday midnight, so the desk can tell what is late.
  const phaseAt = [15.75, 19.5, 33];
  const dueAt = { "Fri 8 pm": 20, "Sat 9 am": 33, "Sat 10 am": 34, "Sat noon": 36 };
  const backBy = ["Sat 9 am", "Sat 10 am", "Sat noon"];
  const messages = [
    {
      phase: 0,
      time: "Friday · 3:20 pm",
      author: "Isha Rao · Film Society",
      req: "RQ-214",
      text: "Kabir Sen is picking up our whole screening kit. Please issue it in his name. I’m setting up in the courtyard.",
    },
    {
      phase: 0,
      time: "Friday · 3:30 pm",
      author: "Tara Shah · Debate Union",
      req: "RQ-209",
      text: "Our microphone stays with me overnight. I’ll return it by 10 am Saturday.",
    },
    {
      phase: 1,
      time: "Friday · 7:30 pm",
      author: "Kabir Sen · Film Society",
      req: "RQ-214",
      text: "I brought the projector and speaker. Leela Das has our adapter. She’ll be at the counter at 9 am tomorrow.",
    },
  ];
  const original = () => ({
    version: 2,
    mode: "proposed",
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
        expect: null,
      },
    ],
    notes: [],
    editing: false,
    issuing: "",
    checkin: "",
    query: "",
    onlyOpen: true,
    notice: "Sample shift · All records are fictional.",
  });
  let s = original();
  let undo = null;
  const proposed = () => s.mode === "proposed";
  const getAsset = (id) => assets.find((x) => x.id === id);
  const getReq = (id) => requests.find((x) => x.id === id);
  const out = (id) => s.loans.find((l) => l.asset === id && !l.back);
  const openFor = (reqId) => s.loans.filter((l) => l.req === reqId && !l.back);
  const kitLoan = (reqId, type) =>
    s.loans.find(
      (l) => l.req === reqId && !l.back && getAsset(l.asset).type === type,
    );
  const where = (a) => (a.bin === "Workshop" ? "in the workshop" : "shelf " + a.bin);
  const clone = (x) => JSON.parse(JSON.stringify(x));
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
  const opts = (list, selected = "") =>
    list
      .map(
        ([v, t]) =>
          '<option value="' +
          esc(v) +
          '"' +
          (v === selected ? " selected" : "") +
          ">" +
          esc(t) +
          "</option>",
      )
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
  const badge = (t, good = false) =>
    '<span class="tag' + (good ? " good" : "") + '">' + esc(t) + "</span>";
  const tag = (t, kind = "") =>
    '<span class="tag ' + kind + '">' + esc(t) + "</span>";
  const typeIcon = {
    "HDMI projector": "projector",
    "Portable speaker": "speaker",
    "USB-C → HDMI adapter": "cable",
    "Wireless microphone": "mic",
    "Digital camera": "camera",
  };
  const gear = (type) =>
    '<span class="gear" aria-hidden="true"><svg class="store-icon"><use href="#icon-' +
    (typeIcon[type] || "package") +
    '"></use></svg></span>';
  const gearRow = (type, label, sub, right) =>
    '<div class="row has-gear" data-reveal>' +
    gear(type) +
    "<div><strong>" +
    esc(label) +
    "</strong><small>" +
    esc(sub) +
    "</small></div><div>" +
    right +
    "</div></div>";
  const timing = (l) => {
    if (l.back || !(l.due in dueAt)) return "";
    const left = dueAt[l.due] - phaseAt[s.phase];
    if (left < 0) return "overdue";
    if (left <= 1) return "soon";
    return "";
  };

  /* ---------- Current desk (unchanged from the original exercise) ---------- */

  function requestPage() {
    let html = head(
      "Approved requests",
      "Student Activities Office · 3 approved forms",
    );
    if (s.selected) {
      const r = getReq(s.selected);
      html += btn("Back to list", "close") + requestRecord(r);
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
  function requestRecord(r) {
    return (
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
      "</p></div>"
    );
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
      let sub = a.model + " · " + a.bin;
      if (proposed() && loan)
        sub +=
          " · with " +
          (loan.expect ? loan.expect.who : loan.who) +
          " on L-" +
          loan.num;
      html += (proposed() ? (...x) => gearRow(a.type, ...x) : row)(
        a.id + " · " + a.type,
        sub,
        proposed() && loan && timing(loan) === "overdue"
          ? tag("Overdue", "alert")
          : badge(status, status === "On shelf"),
      );
    }
    return html;
  }
  function slipForm() {
    const available = assets.filter((a) => !a.repair && !out(a.id));
    const select = (label, key, options) =>
      "<label><span>" +
      label +
      '</span><select name="' +
      key +
      '" required><option value="">Select…</option>' +
      opts(options) +
      "</select></label>";
    return (
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
        ["Fri 8 pm", "Sat 9 am", "Sat 10 am", "Sat noon"].map((d) => [d, d]),
      ) +
      '</div><button type="submit" class="primary">Save issue slip</button></form>'
    );
  }
  const scopeButtons = () =>
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
  function register() {
    let html = head(
      "Loan register",
      "One slip per physical unit",
      s.editing
        ? btn("Cancel", "cancel")
        : btn("New issue slip", "new", "", "primary"),
    );
    if (s.editing) return html + slipForm();
    html += scopeButtons();
    const shown = s.loans
      .filter((l) => !s.onlyOpen || !l.back)
      .slice()
      .reverse();
    if (!shown.length) html += "<p>No outstanding slips.</p>";
    for (const l of shown)
      html += row(
        "L-" + l.num + " · " + l.asset,
        l.req + " · " + l.who + " · Due " + l.due,
        l.back
          ? badge("Returned")
          : btn("Record return", "return", String(l.num)),
      );
    return html;
  }
  function deskbook() {
    let html = head(
      "Desk book",
      "Messages from clubs and notes for the next shift",
    );
    const entries = messages
      .filter((m) => m.phase <= s.phase)
      .map((m) => [m.time, m.author, m.text]);
    for (const n of s.notes)
      entries.push([
        shifts[n.phase].time,
        n.auto ? "Loan register · check-in" : "Counter handover",
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

  /* ---------- Proposed desk: work the counter by kit, keep the register by unit ---------- */

  function requestPageNew() {
    let html = head(
      "Approved requests",
      "Student Activities Office · 3 approved forms",
    );
    if (!s.selected)
      return (
        html +
        requests
          .map((r) => {
            const n = r.items.filter((t) => kitLoan(r.id, t)).length;
            const ever = s.loans.some((l) => l.req === r.id);
            const state =
              n === 0
                ? ever
                  ? tag("Kit returned", "good")
                  : tag("Not issued")
                : n === r.items.length
                  ? tag("Kit out")
                  : tag(n + " of " + r.items.length + " still out", "warn");
            return row(
              r.event,
              r.id + " · " + r.club + " · due " + r.due,
              state + btn("View form", "request", r.id),
            );
          })
          .join("")
      );
    const r = getReq(s.selected);
    html += btn("Back to list", "close") + requestRecord(r);
    const msgs = messages
      .filter((m) => m.req === r.id && m.phase <= s.phase)
      .concat(
        s.notes
          .filter((n) => n.req === r.id)
          .map((n) => ({
            time: shifts[n.phase].time,
            author: "Loan register · check-in",
            text: n.text,
          })),
      );
    if (msgs.length)
      html +=
        '<div class="msgs"><h3>Messages about this request</h3>' +
        msgs
          .map(
            (m) =>
              "<blockquote><small>" +
              esc(m.time + " · " + m.author) +
              "</small><p>" +
              esc(m.text) +
              "</p></blockquote>",
          )
          .join("") +
        "</div>";
    html +=
      '<div class="kitstatus"><h3>This kit at the desk</h3><ul>' +
      r.items
        .map((t) => {
          const l = kitLoan(r.id, t);
          const last = s.loans
            .filter(
              (x) => x.req === r.id && x.back && getAsset(x.asset).type === t,
            )
            .pop();
          return (
            "<li><span>" +
            esc(t) +
            "</span>" +
            (l
              ? tag("Out on L-" + l.num + " · " + l.asset)
              : last
                ? tag("Returned · " + last.asset, "good")
                : tag("Not issued")) +
            "</li>"
          );
        })
        .join("") +
      "</ul></div>";
    const missing = r.items.filter((t) => !kitLoan(r.id, t));
    if (s.issuing === r.id) html += kitForm(r, missing);
    else if (missing.length)
      html +=
        '<div class="buttons">' +
        btn(
          missing.length === r.items.length
            ? "Issue kit"
            : "Issue the remaining " + missing.length,
          "issue",
          r.id,
          "primary",
        ) +
        "</div>";
    if (openFor(r.id).length)
      html +=
        '<div class="buttons">' +
        btn("Check in this kit", "checkin", r.id) +
        "</div>";
    return html;
  }
  function kitForm(r, types) {
    let count = 0;
    const lines = types
      .map((t) => {
        const units = assets.filter(
          (a) => a.type === t && !a.repair && !out(a.id),
        );
        const away = assets.filter(
          (a) => a.type === t && (a.repair || out(a.id)),
        );
        const note = away.length
          ? "<small>" +
            away
              .map(
                (a) =>
                  esc(a.id) +
                  (a.repair ? " is in the workshop" : " is already on loan"),
              )
              .join(". ") +
            ".</small>"
          : "";
        if (!units.length)
          return (
            '<li><span class="picktype">' +
            esc(t) +
            "</span>" +
            tag("None on the shelf", "alert") +
            note +
            "</li>"
          );
        count++;
        return (
          '<li><label><span class="picktype">' +
          esc(t) +
          '</span><select name="unit" required>' +
          opts(units.map((a) => [a.id, a.id + " · " + a.model + " · " + where(a)])) +
          "</select></label>" +
          note +
          "</li>"
        );
      })
      .join("");
    return (
      '<form data-kit="' +
      esc(r.id) +
      '" class="panel"><h3>Issue the ' +
      esc(r.club) +
      ' kit</h3><p class="muted">Pick each unit off the shelf. Every unit still gets its own slip, due ' +
      esc(r.due) +
      ' as approved.</p><div class="form"><label><span>Collected by</span><select name="who" required><option value="">Who is at the counter?</option>' +
      opts(people.map((p) => [p, p])) +
      '</select></label><div class="fixed"><span>Return by</span><strong>' +
      esc(r.due) +
      '</strong><small>From the approved form</small></div></div><ul class="picklist">' +
      lines +
      '</ul><p class="formerror" role="alert" data-error></p><div class="buttons"><button type="submit" class="primary"' +
      (count ? "" : " disabled") +
      ">Issue " +
      count +
      " slip" +
      (count === 1 ? "" : "s") +
      "</button>" +
      btn("Cancel", "cancel-kit") +
      "</div></form>"
    );
  }
  function registerNew() {
    let html = head(
      "Loan register",
      "One slip per physical unit, grouped by request",
      s.editing
        ? btn("Cancel", "cancel")
        : s.checkin
          ? ""
          : btn("New issue slip", "new"),
    );
    if (s.editing) return html + slipForm();
    if (s.checkin) return html + checkinForm(getReq(s.checkin));
    const open = s.loans.filter((l) => !l.back);
    const late = open.filter((l) => timing(l) === "overdue").length;
    const soon = open.filter((l) => timing(l) === "soon").length;
    const away = open.filter((l) => l.expect).length;
    const stat = (n, label, kind) =>
      '<span class="stat ' + (n ? kind : "") + '"><b>' + n + "</b> " + label + "</span>";
    html +=
      '<div class="stats">' +
      stat(open.length, open.length === 1 ? "unit out" : "units out", "") +
      stat(late, "overdue", "alert") +
      stat(soon, "due within the hour", "warn") +
      stat(away, "coming back with someone else", "warn") +
      "</div>";
    html +=
      '<div class="lookup"><label><span>Who’s at the counter?</span><input type="search" data-query placeholder="Name, club, slip or unit tag" autocomplete="off" value="' +
      esc(s.query) +
      '" /></label>' +
      scopeButtons() +
      "</div>";
    return html + '<div data-results aria-live="polite">' + results() + "</div>";
  }
  function haystack(l) {
    const a = getAsset(l.asset),
      r = getReq(l.req);
    return [
      l.who,
      l.expect && l.expect.who,
      l.returnedBy,
      l.asset,
      a.model,
      a.type,
      l.req,
      r.club,
      r.event,
      "L-" + l.num,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
  }
  function results() {
    const term = s.query.trim().toLowerCase();
    const shown = s.loans
      .filter((l) => (!s.onlyOpen || !l.back) && (!term || haystack(l).includes(term)))
      .sort((a, b) => b.num - a.num);
    if (!shown.length)
      return term
        ? '<p class="empty">No ' +
            (s.onlyOpen ? "open " : "") +
            "slip mentions “" +
            esc(s.query.trim()) +
            "”. Try the tag on the item or the club name" +
            (s.onlyOpen ? ", or switch to All slips." : ".") +
            "</p>"
        : '<p class="empty">Nothing is out right now. Issue a kit from Requests.</p>';
    const groups = [];
    for (const l of shown) {
      let g = groups.find((x) => x.req === l.req);
      if (!g) groups.push((g = { req: l.req, loans: [] }));
      g.loans.push(l);
    }
    const rank = (g) =>
      g.loans.some((l) => timing(l) === "overdue")
        ? 2
        : g.loans.some((l) => timing(l) === "soon")
          ? 1
          : 0;
    groups.sort((a, b) => rank(b) - rank(a));
    return groups.map(kitCard).join("");
  }
  function kitCard(g) {
    const r = getReq(g.req);
    const whos = [...new Set(g.loans.map((l) => l.who))].join(", ");
    const units = g.loans
      .map((l) => {
        const a = getAsset(l.asset);
        const t = timing(l);
        const state = l.back
          ? tag("Returned", "good")
          : t === "overdue"
            ? tag("Overdue · was due " + l.due, "alert")
            : t === "soon"
              ? tag("Due " + l.due, "warn")
              : tag("Due " + l.due);
        const trail = l.back
          ? l.returnedAt
            ? '<p class="trail">Back ' +
              esc(l.returnedAt) +
              (l.returnedBy ? " from " + esc(l.returnedBy) : "") +
              "</p>"
            : ""
          : l.expect
            ? '<p class="trail expect">With ' +
              esc(l.expect.who) +
              ", bringing it back " +
              esc(l.expect.when) +
              "</p>"
            : "";
        return (
          '<li class="unit has-gear">' +
          gear(a.type) +
          "<div><strong>L-" +
          l.num +
          " · " +
          esc(a.id + " " + a.type) +
          "</strong><small>" +
          esc(a.model + " · " + where(a)) +
          "</small>" +
          trail +
          "</div><div>" +
          state +
          "</div></li>"
        );
      })
      .join("");
    return (
      '<section class="kit" data-reveal><header><div><h3>' +
      esc(r.club + " · " + r.event) +
      "</h3><small>" +
      esc(r.id + " · collected by " + whos) +
      "</small></div>" +
      (openFor(r.id).length ? btn("Check in", "checkin", r.id, "primary") : "") +
      "</header><ul>" +
      units +
      "</ul></section>"
    );
  }
  function checkinForm(r) {
    const open = r ? openFor(r.id) : [];
    if (!open.length)
      return (
        '<p class="empty">Everything on this request is already back.</p>' +
        btn("Back to the register", "cancel-checkin")
      );
    const expected = open.map((l) => l.expect && l.expect.who).filter(Boolean);
    const guess =
      expected.length === open.length && new Set(expected).size === 1
        ? expected[0]
        : open[0].who;
    const items = open
      .map((l) => {
        const a = getAsset(l.asset);
        // Only warn where a mix-up is likely: a unit of the same type on the same shelf.
        const twins = assets.filter(
          (x) => x.type === a.type && x.id !== a.id && x.bin === a.bin,
        );
        const look = twins.length
          ? '<p class="tagcheck">Check the tag. This slip is for <b>' +
            esc(a.id) +
            "</b>, the " +
            esc(a.model) +
            ". " +
            twins.map((x) => esc(x.id + " (" + x.model + ")")).join(" and ") +
            " looks alike and lives on the same shelf.</p>"
          : "";
        const ex = l.expect || {};
        return (
          '<li data-unit><label class="check"><input type="checkbox" name="back" value="' +
          l.num +
          '" /><span><strong>' +
          esc(a.id + " · " + a.type) +
          "</strong><small>" +
          esc(
            a.model +
              " · L-" +
              l.num +
              " · " +
              (l.expect ? "expected from " + l.expect.who : "issued to " + l.who),
          ) +
          "</small></span></label>" +
          look +
          '<fieldset class="still"><legend>Not on the counter? Note who has it.</legend><label><span>Who has it</span><select name="has-' +
          l.num +
          '" required><option value="">Select…</option>' +
          opts(
            people.map((p) => [p, p]),
            ex.who,
          ) +
          '</select></label><label><span>Bringing it back</span><select name="when-' +
          l.num +
          '" required><option value="">Select…</option>' +
          opts(
            backBy.map((d) => [d, d]),
            ex.when,
          ) +
          "</select></label></fieldset></li>"
        );
      })
      .join("");
    return (
      '<form data-checkin="' +
      esc(r.id) +
      '" class="panel"><h3>Check in the ' +
      esc(r.club) +
      ' kit</h3><p class="muted">Tick each unit you can see on the counter. Anything left unticked stays on loan with a name and a time.</p><div class="form"><label><span>Who is at the counter?</span><select name="by" required>' +
      opts(
        people.map((p) => [p, p]),
        guess,
      ) +
      '</select></label></div><ul class="checklist">' +
      items +
      '</ul><p class="formerror" role="alert" data-error></p><div class="buttons"><button type="submit" class="primary" data-checkin-submit>Save check-in</button>' +
      btn("Cancel", "cancel-checkin") +
      "</div></form>"
    );
  }
  function syncCheckin(form) {
    let closing = 0,
      keeping = 0;
    for (const li of form.querySelectorAll("[data-unit]")) {
      const ticked = li.querySelector('input[name="back"]').checked;
      const still = li.querySelector("fieldset");
      still.disabled = ticked;
      still.hidden = ticked;
      li.classList.toggle("ticked", ticked);
      if (ticked) closing++;
      else keeping++;
    }
    form.querySelector("[data-checkin-submit]").textContent = closing
      ? "Close " +
        closing +
        " slip" +
        (closing > 1 ? "s" : "") +
        (keeping ? ", keep " + keeping + " open" : "")
      : "Keep " + keeping + " open with a note";
  }

  const screens = {
    Requests: () => (proposed() ? requestPageNew() : requestPage()),
    Inventory: inventory,
    "Loan register": () => (proposed() ? registerNew() : register()),
    "Desk book": deskbook,
  };
  function paint() {
    const phase = shifts[s.phase];
    q("[data-clock]").textContent = phase.time;
    q("[data-step]").textContent = "Step " + (s.phase + 1) + " of " + shifts.length;
    q("[data-shift-title]").textContent = phase.title;
    q("[data-shift]").textContent = phase.text;
    const advance = q('[data-action="advance"]');
    advance.hidden = !phase.next;
    advance.textContent = phase.next || "";
    for (const b of root.querySelectorAll('[data-action="mode"]'))
      b.setAttribute("aria-pressed", String(s.mode === b.dataset.val));
    q("[data-progress]").style.width =
      ((s.phase + 1) / shifts.length) * 100 + "%";
    const openCount = s.loans.filter((l) => !l.back).length;
    const counts = {
      Requests: requests.length + " approved forms",
      Inventory:
        assets.filter((a) => !a.repair && !out(a.id)).length + " on the shelf",
      "Loan register": openCount + (openCount === 1 ? " unit out" : " units out"),
      "Desk book":
        messages.filter((m) => m.phase <= s.phase).length +
        s.notes.length +
        " entries",
    };
    q("[data-nav]").innerHTML = pages
      .map(
        ([n, icon]) =>
          '<button type="button" data-action="tab" data-val="' +
          n +
          '" aria-pressed="' +
          (s.tab === n) +
          '"><span class="wicon"><svg aria-hidden="true" class="store-icon"><use href="#icon-' +
          icon +
          '"></use></svg></span><span class="wlabel">' +
          n +
          "</span><small>" +
          counts[n] +
          "</small></button>",
      )
      .join("");
    const pageEl = q("[data-page]");
    pageEl.innerHTML = screens[s.tab]();
    // Animate only when the screen changes, not on every click inside it.
    const view = s.mode + "/" + s.tab;
    if (view !== lastView && lastView) {
      pageEl.classList.remove("enter");
      void pageEl.offsetWidth;
      pageEl.classList.add("enter");
    }
    reveal(view !== lastView);
    lastView = view;
    if (q("[data-filter]")) q("[data-filter]").value = s.filter;
    const checkin = q("[data-checkin]");
    if (checkin) syncCheckin(checkin);
    q("[data-status]").textContent = s.notice;
    q("[data-undo]").hidden = !undo;
  }
  let lastView = "";
  let observer = null;
  function reveal(animate) {
    const items = root.querySelectorAll("[data-reveal]:not(.in)");
    if (observer) observer.disconnect();
    if (
      !animate ||
      !("IntersectionObserver" in window) ||
      matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      items.forEach((el) => el.classList.add("in"));
      return;
    }
    observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries)
          if (e.isIntersecting) {
            e.target.classList.add("in");
            observer.unobserve(e.target);
          }
      },
      { rootMargin: "0px 0px -6% 0px" },
    );
    items.forEach((el, i) => {
      el.style.setProperty("--i", String(i % 6));
      observer.observe(el);
    });
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
  const closeForms = () => {
    s.editing = false;
    s.issuing = "";
    s.checkin = "";
  };
  root.addEventListener("click", (e) => {
    const b = e.target.closest("[data-action]");
    if (!b) return;
    const v = b.dataset.val;
    switch (b.dataset.action) {
      case "restart":
        s = original();
        undo = null;
        break;
      case "mode":
        s.mode = v === "current" ? "current" : "proposed";
        closeForms();
        s.notice =
          s.mode === "current"
            ? "Showing the current desk, as it was handed to me."
            : "Showing the proposed desk.";
        break;
      case "advance":
        if (s.phase < 2) s.phase++;
        closeForms();
        undo = null;
        s.notice = "Shift time updated.";
        break;
      case "tab":
        s.tab = v;
        closeForms();
        break;
      case "close":
        s.selected = "";
        s.issuing = "";
        break;
      case "request":
        s.selected = v;
        break;
      case "new":
        s.editing = true;
        break;
      case "cancel":
        s.editing = false;
        break;
      case "issue":
        s.issuing = v;
        break;
      case "cancel-kit":
        s.issuing = "";
        break;
      case "checkin":
        closeForms();
        s.checkin = v;
        s.tab = "Loan register";
        break;
      case "cancel-checkin":
        s.checkin = "";
        break;
      case "scope":
        s.onlyOpen = v === "0";
        break;
      case "undo":
        if (!undo) return;
        s.loans = undo.loans;
        s.notes = undo.notes;
        undo = null;
        s.notice = "Check-in undone. Those slips are open again.";
        break;
      case "return": {
        const l = s.loans.find((l) => l.num === Number(v));
        if (!l || l.back) return;
        l.back = true;
        undo = null;
        s.notice = l.asset + " returned to stock. Slip L-" + l.num + " closed.";
        break;
      }
    }
    commit();
  });
  root.addEventListener("change", (e) => {
    if (e.target.matches("[data-filter]")) {
      s.filter = e.target.value;
      commit();
      return;
    }
    const checkin = e.target.closest("[data-checkin]");
    if (checkin) syncCheckin(checkin);
  });
  root.addEventListener("input", (e) => {
    if (!e.target.matches("[data-query]")) return;
    s.query = e.target.value;
    q("[data-results]").innerHTML = results();
    reveal(false);
  });
  root.addEventListener("submit", (e) => {
    e.preventDefault();
    const f = e.target;
    const form = new FormData(f);
    const fail = (msg) => {
      const box = f.querySelector("[data-error]");
      if (box) box.textContent = msg;
      else q("[data-status]").textContent = msg;
    };
    if (f.matches("[data-note]")) {
      const text = String(form.get("note")).trim();
      if (!text) return;
      s.notes.push({ phase: s.phase, text });
      undo = null;
      commit("Handover note saved.");
      return;
    }
    if (f.matches("[data-kit]")) {
      const r = getReq(f.dataset.kit);
      const who = form.get("who");
      const units = form.getAll("unit").map(getAsset);
      if (!r || !people.includes(who))
        return fail("Choose who is collecting the kit.");
      if (
        !units.length ||
        units.some(
          (a) =>
            !a ||
            a.repair ||
            out(a.id) ||
            !r.items.includes(a.type) ||
            kitLoan(r.id, a.type),
        )
      )
        return fail("One of these units is no longer on the shelf. Cancel and pick again.");
      let num = Math.max(...s.loans.map((l) => l.num));
      const made = units.map((a) => {
        num++;
        s.loans.push({
          num,
          req: r.id,
          asset: a.id,
          who,
          due: r.due,
          back: false,
          expect: null,
        });
        return "L-" + num + " " + a.id;
      });
      s.issuing = "";
      undo = null;
      commit(
        "Issued " +
          made.length +
          " slip" +
          (made.length > 1 ? "s" : "") +
          " to " +
          who +
          ": " +
          made.join(", ") +
          ". Due " +
          r.due +
          ".",
      );
      return;
    }
    if (f.matches("[data-checkin]")) {
      const r = getReq(f.dataset.checkin);
      const open = r ? openFor(r.id) : [];
      const by = form.get("by");
      if (!open.length || !people.includes(by)) return;
      const ticked = new Set(form.getAll("back").map(Number));
      const plan = open.map((l) => ({
        l,
        back: ticked.has(l.num),
        who: form.get("has-" + l.num),
        when: form.get("when-" + l.num),
      }));
      if (plan.some((p) => !p.back && (!people.includes(p.who) || !backBy.includes(p.when))))
        return fail("For each unit that isn’t on the counter, say who has it and when it’s coming back.");
      const before = { loans: clone(s.loans), notes: clone(s.notes) };
      const closed = [],
        kept = [];
      for (const p of plan) {
        if (p.back) {
          p.l.back = true;
          p.l.returnedBy = by;
          p.l.returnedAt = shifts[s.phase].time;
          closed.push(p.l);
        } else {
          p.l.expect = { who: p.who, when: p.when };
          kept.push(p.l);
        }
      }
      const parts = [];
      if (closed.length)
        parts.push(by + " returned " + closed.map((l) => l.asset).join(" and ") + ".");
      for (const l of kept)
        parts.push(
          l.asset +
            " (" +
            getAsset(l.asset).model +
            ", slip L-" +
            l.num +
            ") is still out with " +
            l.expect.who +
            ", expected " +
            l.expect.when +
            ".",
        );
      s.notes.push({
        phase: s.phase,
        text: r.club + " kit: " + parts.join(" "),
        auto: true,
        req: r.id,
      });
      s.checkin = "";
      s.query = "";
      undo = before;
      commit(
        (closed.length
          ? "Closed " + closed.map((l) => "L-" + l.num + " (" + l.asset + ")").join(", ") + ". "
          : "") +
          kept
            .map(
              (l) =>
                "L-" + l.num + " stays open with " + l.expect.who + " until " + l.expect.when + ".",
            )
            .join(" "),
      );
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
      q("[data-status]").textContent =
        "This equipment type is outside the approved request. Choose an approved unit.";
      return;
    }
    if (
      s.loans.some(
        (l) => l.req === req && !l.back && getAsset(l.asset).type === unit.type,
      )
    ) {
      q("[data-status]").textContent =
        "The approved quantity of this equipment type is already on loan.";
      return;
    }
    const num = Math.max(...s.loans.map((l) => l.num)) + 1;
    s.loans.push({ num, req, asset, who, due, back: false, expect: null });
    s.editing = false;
    undo = null;
    commit("Issued " + asset + " to " + who + " on slip L-" + num + ".");
  });
  function restore(d) {
    if (
      !d ||
      d.version !== 2 ||
      !["current", "proposed"].includes(d.mode) ||
      !Object.hasOwn(screens, d.tab) ||
      !shifts[d.phase] ||
      (d.selected && !getReq(d.selected)) ||
      !Array.isArray(d.notes) ||
      !d.notes.every(
        (n) => n && shifts[n.phase] && typeof n.text === "string",
      ) ||
      !Array.isArray(d.loans) ||
      !d.loans.length ||
      !d.loans.every(
        (l) =>
          l &&
          getReq(l.req) &&
          getAsset(l.asset) &&
          Number.isInteger(l.num) &&
          (!l.expect ||
            (people.includes(l.expect.who) && backBy.includes(l.expect.when))),
      )
    )
      return;
    s = {
      ...original(),
      ...d,
      editing: false,
      issuing: "",
      checkin: "",
      query: typeof d.query === "string" ? d.query : "",
      loans: d.loans.map((l) => ({
        ...l,
        expect: l.expect ? { ...l.expect } : null,
      })),
      notes: d.notes.map((n) => ({ ...n })),
    };
    paint();
  }
  paint();
  setTimeout(() => root.classList.remove("booting"), 1600);
  try {
    restore(JSON.parse(localStorage.getItem(storageKey)));
  } catch {
    // Keep the fresh shift when storage is unavailable or the saved data is invalid.
  }
})();
