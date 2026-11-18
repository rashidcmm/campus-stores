(() => {
  // Demo portal: fixed accounts, data kept in this browser only.
  const KEY = "campus-stores.portal.v1";
  const SESSION = "campus-stores.portal.session";
  const root = document.querySelector("[data-portal]");
  const users = [
    { u: "admin", p: "admin123", role: "admin", name: "Desk admin" },
    { u: "isha", p: "film123", role: "club", club: "Film Society", name: "Isha Rao" },
    { u: "tara", p: "debate123", role: "club", club: "Debate Union", name: "Tara Shah" },
    { u: "dev", p: "photo123", role: "club", club: "Photo Circle", name: "Dev Menon" },
  ];
  const day = 864e5;
  const iso = (d) => new Date(d).toISOString().slice(0, 10);
  const today = iso(Date.now());
  const plus = (n, from = today) => iso(new Date(from).getTime() + n * day);
  const fmt = (d) =>
    new Date(d + "T12:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  const esc = (x) =>
    String(x ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const seed = () => ({
    v: 1,
    next: 10,
    assets: [
      { id: "PR-04", type: "HDMI projector", model: "BenQ MH550", bin: "A2" },
      { id: "PR-06", type: "HDMI projector", model: "Epson EB-X49", bin: "Workshop", repair: true },
      { id: "SP-02", type: "Portable speaker", model: "JBL Eon One", bin: "B1" },
      { id: "SP-05", type: "Portable speaker", model: "Bose S1", bin: "B2" },
      { id: "AD-12", type: "USB-C → HDMI adapter", model: "Belkin AVC002", bin: "C4" },
      { id: "AD-15", type: "USB-C → HDMI adapter", model: "Anker A8312", bin: "C4" },
      { id: "MI-09", type: "Wireless microphone", model: "Shure BLX", bin: "B3" },
      { id: "CA-03", type: "Digital camera", model: "Sony A6400", bin: "D2" },
      { id: "TR-01", type: "Tripod", model: "Manfrotto 190X", bin: "D3" },
    ],
    bookings: [
      { id: 1, club: "Photo Circle", type: "Digital camera", asset: "CA-03", from: plus(-1), to: plus(5), status: "out", note: "Street portrait walk" },
      { id: 2, club: "Debate Union", type: "Wireless microphone", asset: "MI-09", from: plus(-1), to: plus(1), status: "out", note: "Finals rehearsal" },
      { id: 3, club: "Film Society", type: "HDMI projector", asset: null, from: plus(4), to: plus(5), status: "pending", note: "Courtyard screening" },
    ],
    transfers: [],
    reports: [],
  });
  let db = load();
  let me = users.find((x) => x.u === safeGet(SESSION)) || null;
  let tab = "";
  let notice = "";
  function safeGet(k) {
    try { return localStorage.getItem(k); } catch { return null; }
  }
  function load() {
    try {
      const d = JSON.parse(localStorage.getItem(KEY));
      if (d && d.v === 1 && Array.isArray(d.bookings)) return d;
    } catch {}
    return seed();
  }
  function save(msg) {
    if (msg) notice = msg;
    try { localStorage.setItem(KEY, JSON.stringify(db)); } catch { notice += " Browser storage is full or blocked; changes last for this visit."; }
    paint();
  }
  const asset = (id) => db.assets.find((a) => a.id === id);
  const types = () => [...new Set(db.assets.map((a) => a.type))];
  const overlaps = (a, b) => a.from <= b.to && b.from <= a.to;
  const holderOf = (b) => {
    const t = db.transfers.find((t) => t.booking === b.id && t.status === "approved" && today >= t.from && today <= t.to);
    return t ? t.toClub : b.club;
  };
  const freeUnits = (type, from, to, except) =>
    db.assets.filter(
      (a) =>
        a.type === type &&
        !a.repair &&
        !db.bookings.some(
          (b) => b.id !== except && b.asset === a.id && ["approved", "out"].includes(b.status) && overlaps(b, { from, to }),
        ),
    );
  const tag = (t, k = "") => '<span class="tag ' + k + '">' + esc(t) + "</span>";
  const statusTag = (s) =>
    ({
      pending: tag("Waiting for approval", "warn"),
      approved: tag("Approved"),
      out: tag("With the club"),
      returned: tag("Returned", "good"),
      declined: tag("Declined", "alert"),
      cancelled: tag("Cancelled"),
    })[s] || tag(s);
  const btn = (label, act, val = "", cls = "") =>
    '<button type="button" data-act="' + act + '" data-val="' + esc(val) + '" class="' + cls + '">' + esc(label) + "</button>";
  const opts = (list, sel = "") =>
    list.map(([v, t]) => '<option value="' + esc(v) + '"' + (v === sel ? " selected" : "") + ">" + esc(t) + "</option>").join("");
  const head = (h, sub) => '<div class="sectionhead"><div><h2>' + esc(h) + "</h2><small>" + esc(sub) + "</small></div></div>";
  const photo = (src) => (src ? '<img class="proof" src="' + esc(src) + '" alt="Condition photo" />' : "");

  /* ---------- Login ---------- */
  function loginView() {
    return (
      '<header class="mast"><div class="masttop"><div class="brandblock"><div class="brandmark" aria-hidden="true"><svg class="store-icon"><use href="#icon-package-open"></use></svg></div><div><h1>Campus Stores</h1><div class="muted">Club and admin portal</div></div></div><a class="backlink" href="./index.html">Open the desk</a></div></header>' +
      '<section class="page login"><form data-form="login" class="panel"><h2>Sign in</h2><p class="muted">Demo accounts only. No email needed.</p><div class="form"><label><span>Username</span><input name="u" autocomplete="username" required /></label><label><span>Password</span><input name="p" type="password" autocomplete="current-password" required /></label></div><p class="formerror" role="alert" data-error></p><div class="buttons"><button type="submit" class="primary">Sign in</button></div></form>' +
      '<div class="demo"><h3>Demo accounts</h3><ul>' +
      users.map((x) => "<li><b>" + esc(x.u) + "</b> / " + esc(x.p) + " <small>" + esc(x.role === "admin" ? "Admin" : x.club + " member") + "</small></li>").join("") +
      "</ul></div></section>"
    );
  }

  /* ---------- Club member ---------- */
  const clubTabs = [["Request gear", "clipboard-list"], ["My bookings", "book-open"], ["Handovers", "package"], ["Report an issue", "messages-square"]];
  const adminTabs = [["Requests", "clipboard-list"], ["Inventory", "package"], ["Handovers", "book-open"], ["Issues", "messages-square"]];
  function shell(tabs, body) {
    const counts = me.role === "admin"
      ? {
          Requests: db.bookings.filter((b) => b.status === "pending" || (b.ext && b.ext.status === "pending")).length + " waiting",
          Inventory: db.assets.length + " units",
          Handovers: db.transfers.filter((t) => t.status === "holder-accepted").length + " to approve",
          Issues: db.reports.filter((r) => r.status === "open").length + " open",
        }
      : {
          "Request gear": "Up to 30 days ahead",
          "My bookings": db.bookings.filter((b) => b.club === me.club && !["returned", "declined", "cancelled"].includes(b.status)).length + " active",
          Handovers: db.transfers.filter((t) => t.fromClub === me.club && t.status === "requested").length + " asking you",
          "Report an issue": db.reports.filter((r) => r.club === me.club && r.status === "open").length + " open",
        };
    return (
      '<header class="mast"><div class="masttop"><div class="brandblock"><div class="brandmark" aria-hidden="true"><svg class="store-icon"><use href="#icon-package-open"></use></svg></div><div><h1>Campus Stores</h1><div class="muted">' +
      esc(me.role === "admin" ? "Admin dashboard" : me.club + " dashboard") +
      '</div></div></div><div class="mastside"><div class="clock"><small>Signed in</small><strong>' +
      esc(me.name) +
      "</strong></div>" +
      btn("Sign out", "logout", "", "ghost") +
      '</div></div><nav class="windows" aria-label="Dashboard sections">' +
      tabs
        .map(([n, icon]) =>
          '<button type="button" data-act="tab" data-val="' + esc(n) + '" aria-pressed="' + (tab === n) + '"><span class="wicon"><svg class="store-icon"><use href="#icon-' + icon + '"></use></svg></span><span class="wlabel">' + esc(n) + "</span><small>" + esc(counts[n]) + "</small></button>",
        )
        .join("") +
      '</nav></header><section class="page" data-page>' +
      body +
      '</section><div class="statusbar"><span role="status" aria-live="polite">' +
      esc(notice || "Demo data lives in this browser.") +
      "</span>" +
      btn("Reset demo data", "reset") +
      "</div>"
    );
  }
  function requestGear() {
    return (
      head("Request gear", "Requests open up to 30 days before pickup, for up to 14 days") +
      '<form data-form="request" class="panel"><div class="form"><label><span>Equipment</span><select name="type" required><option value="">Choose equipment</option>' +
      opts(types().map((t) => [t, t])) +
      '</select></label><label><span>What is it for?</span><input name="note" maxlength="80" placeholder="Event name" required /></label><label><span>Pickup date</span><input type="date" name="from" min="' + today + '" max="' + plus(30) + '" required /></label><label><span>Return date</span><input type="date" name="to" min="' + today + '" max="' + plus(44) + '" required /></label></div><p class="formerror" role="alert" data-error></p><div class="buttons"><button type="submit" class="primary">Send request</button></div></form>' +
      '<h3 class="sub">Availability today</h3>' +
      types().map((t) => {
        const n = freeUnits(t, today, today).length;
        return '<div class="row"><div><strong>' + esc(t) + "</strong><small>" + db.assets.filter((a) => a.type === t).length + " units in stock</small></div><div>" + (n ? tag(n + " free today", "good") : tag("All out today", "alert")) + "</div></div>";
      }).join("")
    );
  }
  function myBookings() {
    const mine = db.bookings.filter((b) => b.club === me.club).slice().reverse();
    return (
      head("My bookings", me.club + " · requests, loans and extensions") +
      (mine.length ? "" : '<p class="empty">No bookings yet. Request gear to get started.</p>') +
      mine.map((b) => {
        const a = b.asset && asset(b.asset);
        const holder = holderOf(b);
        let actions = "";
        if (b.status === "pending") actions += btn("Cancel request", "cancel", b.id);
        if (["approved", "out"].includes(b.status) && !(b.ext && b.ext.status === "pending"))
          actions += '<form data-form="extend" data-id="' + b.id + '" class="inline"><input type="date" name="to" min="' + plus(1, b.to) + '" max="' + plus(7, b.to) + '" required aria-label="New return date" /><button type="submit">Ask to extend</button></form>';
        return (
          '<section class="kit"><header><div><h3>' + esc(b.type) + " · " + esc(b.note) + "</h3><small>#" + b.id + " · " + fmt(b.from) + " to " + fmt(b.to) + (a ? " · " + esc(a.id + " " + a.model) : "") + "</small></div>" + statusTag(b.status) + '</header><ul><li class="unit"><div>' +
          (holder !== b.club ? '<p class="trail expect">Handed over to ' + esc(holder) + " for now</p>" : "") +
          (b.ext ? "<p class=\"trail\">Extension to " + fmt(b.ext.to) + ": " + esc(b.ext.status) + "</p>" : "") +
          (b.reason ? '<p class="trail">Admin note: ' + esc(b.reason) + "</p>" : "") +
          '</div><div class="buttons">' + actions + "</div></li></ul></section>"
        );
      }).join("")
    );
  }
  function clubHandovers() {
    const others = db.bookings.filter((b) => b.status === "out" && holderOf(b) !== me.club && b.club !== me.club);
    const incoming = db.transfers.filter((t) => t.fromClub === me.club && t.status === "requested");
    const outgoing = db.transfers.filter((t) => t.toClub === me.club || (t.fromClub === me.club && t.status !== "requested"));
    return (
      head("Handovers", "Borrow a unit another club already has, for part of their booking") +
      '<h3 class="sub">Asking you for your kit</h3>' +
      (incoming.length ? "" : '<p class="empty">No club is asking for your kit.</p>') +
      incoming.map((t) => {
        const a = asset(t.asset);
        return (
          '<form data-form="accept" data-id="' + t.id + '" class="panel"><h3>' + esc(t.toClub) + " wants " + esc(a.id + " · " + a.model) + "</h3><p class=\"muted\">" + fmt(t.from) + " to " + fmt(t.to) + " · " + esc(t.reason) + '</p><div class="form"><label><span>Condition right now</span><select name="cond" required>' + opts([["", "Choose…"], ["Good", "Good, no marks"], ["Minor wear", "Minor wear"], ["Damaged", "Damaged"]]) + '</select></label><label><span>Photo of the unit (proof)</span><input type="file" name="photo" accept="image/*" /></label><label class="full"><span>Note for the other club and the desk</span><textarea name="note" rows="2" maxlength="200" required placeholder="Battery at 80%, lens cap included"></textarea></label></div><p class="formerror" role="alert" data-error></p><div class="buttons"><button type="submit" class="primary">Accept and record condition</button>' +
          btn("Decline", "t-decline", t.id) + "</div></form>"
        );
      }).join("") +
      '<h3 class="sub">Ask another club</h3>' +
      (others.length ? "" : '<p class="empty">No other club has kit out right now.</p>') +
      others.map((b) => {
        const a = asset(b.asset);
        return (
          '<form data-form="handover" data-id="' + b.id + '" class="kit"><header><div><h3>' + esc(a.id + " · " + a.type) + "</h3><small>With " + esc(holderOf(b)) + " until " + fmt(b.to) + '</small></div></header><div class="form pad"><label><span>From</span><input type="date" name="from" min="' + (b.from > today ? b.from : today) + '" max="' + b.to + '" required /></label><label><span>Back to them by</span><input type="date" name="to" min="' + (b.from > today ? b.from : today) + '" max="' + b.to + '" required /></label><label class="full"><span>Why do you need it?</span><input name="reason" maxlength="120" required /></label><div class="buttons"><button type="submit">Request handover</button></div></div></form>'
        );
      }).join("") +
      '<h3 class="sub">Handover history</h3>' +
      (outgoing.length ? "" : '<p class="empty">Nothing yet.</p>') +
      outgoing.map((t) => transferRow(t)).join("")
    );
  }
  const transferLabel = { requested: "Waiting for the holding club", "holder-accepted": "Waiting for the desk", approved: "Approved", declined: "Declined" };
  function transferRow(t, admin = false) {
    const a = asset(t.asset);
    return (
      '<section class="kit"><header><div><h3>' + esc(a.id + " · " + a.model) + ": " + esc(t.fromClub) + " → " + esc(t.toClub) + "</h3><small>" + fmt(t.from) + " to " + fmt(t.to) + " · " + esc(t.reason) + "</small></div>" +
      tag(transferLabel[t.status] || t.status, t.status === "approved" ? "good" : t.status === "declined" ? "alert" : "warn") +
      '</header><ul><li class="unit"><div>' +
      (t.proof ? '<p class="trail">Condition at handover: <b>' + esc(t.proof.cond) + "</b>. " + esc(t.proof.note) + "</p>" + photo(t.proof.photo) : "") +
      "</div><div class=\"buttons\">" +
      (admin && t.status === "holder-accepted" ? btn("Approve handover", "t-approve", t.id, "primary") + btn("Decline", "t-decline", t.id) : "") +
      "</div></li></ul></section>"
    );
  }
  function clubReport() {
    const mine = db.bookings.filter((b) => b.club === me.club && ["approved", "out", "pending"].includes(b.status));
    return (
      head("Report an issue", "Report a fault before pickup, or anything that happens while you have it") +
      (mine.length
        ? '<form data-form="report" class="panel"><div class="form"><label><span>Which booking?</span><select name="booking" required><option value="">Choose…</option>' +
          opts(mine.map((b) => [String(b.id), "#" + b.id + " · " + b.type + (b.asset ? " (" + b.asset + ")" : "") + " · " + b.note])) +
          '</select></label><label><span>When did you notice it?</span><select name="when" required>' +
          opts([["", "Choose…"], ["before", "Before pickup / at pickup"], ["during", "While we had it"]]) +
          '</select></label><label class="full"><span>What is wrong?</span><textarea name="text" rows="3" maxlength="300" required></textarea></label><label><span>Photo (optional)</span><input type="file" name="photo" accept="image/*" /></label></div><p class="formerror" role="alert" data-error></p><div class="buttons"><button type="submit" class="primary">Send report</button></div></form>'
        : '<p class="empty">You have no active bookings to report on.</p>') +
      '<h3 class="sub">Your reports</h3>' +
      reportsList(db.reports.filter((r) => r.club === me.club), false)
    );
  }
  function reportsList(list, admin) {
    if (!list.length) return '<p class="empty">No reports.</p>';
    return list.slice().reverse().map((r) =>
      '<section class="kit"><header><div><h3>' + esc(r.asset || "Unit not allocated yet") + " · " + esc(r.club) + "</h3><small>" + (r.when === "before" ? "Before pickup" : r.when === "during" ? "During the loan" : "Logged by the desk") + " · " + esc(r.date) + " · by " + esc(r.by) + "</small></div>" +
      (r.status === "open" ? tag("Open", "alert") : tag("Resolved", "good")) +
      '</header><ul><li class="unit"><div><p>' + esc(r.text) + "</p>" + photo(r.photo) + '</div><div class="buttons">' +
      (admin && r.status === "open" ? btn("Mark resolved", "r-resolve", r.id) + (r.asset ? btn("Send unit to repair", "r-repair", r.id) : "") : "") +
      "</div></li></ul></section>",
    ).join("");
  }

  /* ---------- Admin ---------- */
  function adminRequests() {
    const pending = db.bookings.filter((b) => b.status === "pending");
    const ext = db.bookings.filter((b) => b.ext && b.ext.status === "pending");
    const live = db.bookings.filter((b) => ["approved", "out"].includes(b.status));
    return (
      head("Requests", "Approve, allocate a unit, or decline with a reason") +
      (pending.length ? "" : '<p class="empty">No requests waiting.</p>') +
      pending.map((b) => {
        const free = freeUnits(b.type, b.from, b.to, b.id);
        return (
          '<form data-form="approve" data-id="' + b.id + '" class="panel"><h3>' + esc(b.club) + " · " + esc(b.type) + '</h3><p class="muted">#' + b.id + " · " + esc(b.note) + " · " + fmt(b.from) + " to " + fmt(b.to) + '</p><div class="form"><label><span>Allocate unit</span><select name="asset" required>' +
          (free.length ? opts(free.map((a) => [a.id, a.id + " · " + a.model + " · shelf " + a.bin])) : '<option value="">No unit free for these dates</option>') +
          '</select></label><label><span>Reason (if declining)</span><input name="reason" maxlength="120" /></label></div><div class="buttons"><button type="submit" class="primary"' + (free.length ? "" : " disabled") + ">Approve</button>" +
          btn("Decline", "decline", b.id) + "</div></form>"
        );
      }).join("") +
      (ext.length ? '<h3 class="sub">Extension requests</h3>' : "") +
      ext.map((b) => {
        const clash = db.bookings.some((o) => o.id !== b.id && o.asset === b.asset && ["approved", "out", "pending"].includes(o.status) && overlaps(o, { from: plus(1, b.to), to: b.ext.to }));
        return '<div class="row"><div><strong>' + esc(b.club + " · " + b.asset) + "</strong><small>Return " + fmt(b.to) + " → " + fmt(b.ext.to) + (clash ? " · clashes with another booking" : "") + '</small></div><div>' + btn("Approve", "x-approve", b.id, "primary") + btn("Decline", "x-decline", b.id) + "</div></div>";
      }).join("") +
      '<h3 class="sub">Approved and out</h3>' +
      (live.length ? "" : '<p class="empty">Nothing approved or out.</p>') +
      live.map((b) =>
        '<div class="row"><div><strong>' + esc(b.asset + " · " + b.type) + "</strong><small>" + esc(b.club) + (holderOf(b) !== b.club ? " (with " + esc(holderOf(b)) + " now)" : "") + " · " + fmt(b.from) + " to " + fmt(b.to) + "</small></div><div>" + statusTag(b.status) +
        (b.status === "approved" ? btn("Mark picked up", "pickup", b.id) : btn("Mark returned", "returned", b.id, "primary")) + "</div></div>",
      ).join("")
    );
  }
  function adminInventory() {
    return (
      head("Inventory", "Add, remove or send units to repair") +
      db.assets.map((a) => {
        const live = db.bookings.find((b) => b.asset === a.id && b.status === "out");
        return '<div class="row"><div><strong>' + esc(a.id + " · " + a.type) + "</strong><small>" + esc(a.model + " · shelf " + a.bin) + (live ? " · with " + esc(holderOf(live)) : "") + "</small></div><div>" +
          (a.repair ? tag("In repair", "warn") : live ? tag("Out") : tag("On shelf", "good")) +
          btn(a.repair ? "Back in service" : "Send to repair", "repair", a.id) +
          (live ? "" : btn("Remove", "remove", a.id)) + "</div></div>";
      }).join("") +
      '<form data-form="add" class="panel"><h3>Add a unit</h3><div class="form"><label><span>Tag</span><input name="id" maxlength="8" placeholder="CA-04" required /></label><label><span>Type</span><input name="type" list="types" maxlength="40" required /><datalist id="types">' + opts(types().map((t) => [t, t])) + '</datalist></label><label><span>Model</span><input name="model" maxlength="40" required /></label><label><span>Shelf</span><input name="bin" maxlength="10" required /></label></div><p class="formerror" role="alert" data-error></p><div class="buttons"><button type="submit" class="primary">Add unit</button></div></form>'
    );
  }
  function adminHandovers() {
    return head("Handovers", "Approve handovers once the holding club has recorded the unit's condition") +
      (db.transfers.length ? db.transfers.slice().reverse().map((t) => transferRow(t, true)).join("") : '<p class="empty">No handovers yet.</p>');
  }
  function adminIssues() {
    const out = db.bookings.filter((b) => b.asset && ["approved", "out"].includes(b.status));
    return head("Issues", "Reports from clubs, and faults the desk finds on return") +
      '<form data-form="report" class="panel"><h3>Log an issue as the desk</h3><div class="form"><label><span>Booking</span><select name="booking" required><option value="">Choose…</option>' +
      opts(out.map((b) => [String(b.id), "#" + b.id + " · " + b.asset + " · " + b.club])) +
      '</select></label><label><span>Photo (optional)</span><input type="file" name="photo" accept="image/*" /></label><label class="full"><span>What is wrong?</span><textarea name="text" rows="2" maxlength="300" required></textarea></label></div><input type="hidden" name="when" value="desk" /><p class="formerror" role="alert" data-error></p><div class="buttons"><button type="submit" class="primary">Log issue</button></div></form>' +
      reportsList(db.reports, true);
  }

  /* ---------- Paint and events ---------- */
  function paint() {
    if (!me) { root.innerHTML = loginView(); return; }
    const tabs = me.role === "admin" ? adminTabs : clubTabs;
    if (!tabs.some(([n]) => n === tab)) tab = tabs[0][0];
    const views = me.role === "admin"
      ? { Requests: adminRequests, Inventory: adminInventory, Handovers: adminHandovers, Issues: adminIssues }
      : { "Request gear": requestGear, "My bookings": myBookings, Handovers: clubHandovers, "Report an issue": clubReport };
    root.innerHTML = shell(tabs, views[tab]());
  }
  const find = (id) => db.bookings.find((b) => b.id === Number(id));
  const findT = (id) => db.transfers.find((t) => t.id === Number(id));
  root.addEventListener("click", (e) => {
    const b = e.target.closest("[data-act]");
    if (!b) return;
    const v = b.dataset.val;
    const bk = find(v), tr = findT(v);
    switch (b.dataset.act) {
      case "tab": tab = v; notice = ""; root.querySelector("[data-page]").classList.add("enter"); return paint();
      case "logout": me = null; try { localStorage.removeItem(SESSION); } catch {} notice = ""; return paint();
      case "reset": db = seed(); return save("Demo data reset.");
      case "cancel": if (bk) bk.status = "cancelled"; return save("Request cancelled.");
      case "decline": {
        if (!bk) return;
        const reason = b.closest("form")?.querySelector("[name=reason]")?.value.trim();
        bk.status = "declined"; bk.reason = reason || "Declined by the desk";
        return save("Request #" + bk.id + " declined.");
      }
      case "pickup": if (bk) bk.status = "out"; return save("Marked as picked up.");
      case "returned": if (bk) bk.status = "returned"; return save(bk.asset + " is back on the shelf.");
      case "x-approve": if (bk) { bk.to = bk.ext.to; bk.ext.status = "approved"; } return save("Extension approved.");
      case "x-decline": if (bk) bk.ext.status = "declined"; return save("Extension declined.");
      case "t-decline": if (tr) tr.status = "declined"; return save("Handover declined.");
      case "t-approve": if (tr) tr.status = "approved"; return save("Handover approved. " + tr.toClub + " holds " + tr.asset + " until " + fmt(tr.to) + ".");
      case "repair": { const a = asset(v); if (a) a.repair = !a.repair; return save(a.id + (a.repair ? " sent to repair." : " is back in service.")); }
      case "remove": db.assets = db.assets.filter((a) => a.id !== v); return save(v + " removed from inventory.");
      case "r-resolve": { const r = db.reports.find((x) => x.id === Number(v)); if (r) r.status = "resolved"; return save("Report resolved."); }
      case "r-repair": { const r = db.reports.find((x) => x.id === Number(v)); const a = r && asset(r.asset); if (a) a.repair = true; if (r) r.status = "resolved"; return save((a ? a.id : "Unit") + " sent to repair."); }
    }
  });
  function readPhoto(file) {
    return new Promise((resolve) => {
      if (!file || !file.size) return resolve("");
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        const scale = Math.min(1, 480 / Math.max(img.width, img.height));
        const c = document.createElement("canvas");
        c.width = Math.round(img.width * scale);
        c.height = Math.round(img.height * scale);
        c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        resolve(c.toDataURL("image/jpeg", 0.7));
      };
      img.onerror = () => resolve("");
      img.src = url;
    });
  }
  root.addEventListener("submit", async (e) => {
    e.preventDefault();
    const f = e.target, d = new FormData(f);
    const fail = (m) => { const x = f.querySelector("[data-error]"); if (x) x.textContent = m; };
    const id = Number(f.dataset.id);
    switch (f.dataset.form) {
      case "login": {
        const u = users.find((x) => x.u === String(d.get("u")).trim().toLowerCase() && x.p === d.get("p"));
        if (!u) return fail("That username and password don’t match a demo account.");
        me = u; tab = ""; notice = "Signed in as " + u.name + ".";
        try { localStorage.setItem(SESSION, u.u); } catch {}
        return paint();
      }
      case "request": {
        const from = d.get("from"), to = d.get("to");
        if (from < today || from > plus(30)) return fail("Pickup must be between today and " + fmt(plus(30)) + ". Requests open 30 days ahead.");
        if (to < from) return fail("Return date must be on or after pickup.");
        if (to > plus(14, from)) return fail("Bookings can run for up to 14 days. Ask for an extension later if you need more.");
        db.bookings.push({ id: db.next++, club: me.club, type: d.get("type"), asset: null, from, to, status: "pending", note: String(d.get("note")).trim() });
        tab = "My bookings";
        return save("Request sent. The desk will approve it and allocate a unit.");
      }
      case "extend": {
        const b = find(id), to = d.get("to");
        if (!b || to <= b.to || to > plus(7, b.to)) return;
        b.ext = { to, status: "pending" };
        return save("Extension requested to " + fmt(to) + ".");
      }
      case "approve": {
        const b = find(id), a = d.get("asset");
        if (!b || !freeUnits(b.type, b.from, b.to, b.id).some((x) => x.id === a)) return;
        b.asset = a; b.status = "approved";
        return save("Approved #" + b.id + " with " + a + ".");
      }
      case "handover": {
        const b = find(id), from = d.get("from"), to = d.get("to");
        if (!b || to < from) return fail("Back-by date must be after the start date.");
        db.transfers.push({ id: db.next++, booking: b.id, asset: b.asset, fromClub: holderOf(b), toClub: me.club, from, to, reason: String(d.get("reason")).trim(), status: "requested" });
        return save("Handover requested from " + holderOf(b) + ".");
      }
      case "accept": {
        const t = findT(id);
        if (!t) return;
        const pic = await readPhoto(d.get("photo"));
        t.proof = { cond: d.get("cond"), note: String(d.get("note")).trim(), photo: pic };
        t.status = "holder-accepted";
        return save("Condition recorded. The desk will approve the handover.");
      }
      case "report": {
        const b = find(d.get("booking"));
        if (!b) return fail("Choose a booking.");
        const pic = await readPhoto(d.get("photo"));
        db.reports.push({ id: db.next++, booking: b.id, asset: b.asset, club: b.club, when: d.get("when"), text: String(d.get("text")).trim(), photo: pic, status: "open", by: me.name, date: fmt(today) });
        return save("Issue reported.");
      }
      case "add": {
        const tagId = String(d.get("id")).trim().toUpperCase();
        if (asset(tagId)) return fail(tagId + " already exists.");
        db.assets.push({ id: tagId, type: String(d.get("type")).trim(), model: String(d.get("model")).trim(), bin: String(d.get("bin")).trim() });
        return save(tagId + " added.");
      }
    }
  });
  paint();
  setTimeout(() => root.classList.remove("booting"), 1600);
})();
