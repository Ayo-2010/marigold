(function () {
  "use strict";

  var STORE_KEY = "marigold.v1";
  var TAX_RATE = 0.0825;
  var $ = function (id) { return document.getElementById(id); };

  var MENU = [
    { id: "stack", name: "Buttermilk Stack", price: 750, cat: "griddle", desc: "Three tall cakes, whipped butter, warm syrup" },
    { id: "eggs", name: "Two Eggs Any Style", price: 825, cat: "griddle", desc: "With grits or hash browns and toast" },
    { id: "hash", name: "Corned Beef Hash", price: 1050, cat: "griddle", desc: "Crisp-edged, two eggs on top" },
    { id: "french", name: "French Toast", price: 875, cat: "griddle", desc: "Thick-cut egg bread, cinnamon sugar" },
    { id: "meatloaf", name: "Blue Plate Meatloaf", price: 1395, cat: "plates", desc: "Mashed potatoes, green beans, pan gravy" },
    { id: "cfs", name: "Chicken Fried Steak", price: 1550, cat: "plates", desc: "Cream gravy, fries, Texas toast" },
    { id: "turkey", name: "Open-Face Turkey", price: 1275, cat: "plates", desc: "Roast turkey, dressing, cranberry" },
    { id: "ham", name: "Ham Steak & Red-Eye", price: 1325, cat: "plates", desc: "Griddled ham, red-eye gravy, eggs" },
    { id: "patty", name: "Patty Melt", price: 1125, cat: "sandwiches", desc: "Rye, caramelized onion, Swiss" },
    { id: "tuna", name: "Tuna Salad on Rye", price: 895, cat: "sandwiches", desc: "House tuna, lettuce, pickle spear" },
    { id: "club", name: "Club Sandwich", price: 1250, cat: "sandwiches", desc: "Turkey, bacon, tomato, three decks" },
    { id: "bacon", name: "Bacon & Egg", price: 795, cat: "sandwiches", desc: "Fried egg, bacon, white toast" },
    { id: "coffee", name: "Bottomless Coffee", price: 225, cat: "fountain", desc: "Fresh pot, refilled until you say when" },
    { id: "malt", name: "Chocolate Malt", price: 450, cat: "fountain", desc: "Thick, with a chocolate cookie" },
    { id: "float", name: "Root Beer Float", price: 425, cat: "fountain", desc: "Frosted mug, vanilla scoop" },
    { id: "pie", name: "Pie of the Day", price: 375, cat: "fountain", desc: "Ask Pearl. Warm, with ice cream for a quarter" }
  ];

  var CATEGORIES = [
    { id: "all", label: "Everything" },
    { id: "griddle", label: "Griddle" },
    { id: "plates", label: "Plates" },
    { id: "sandwiches", label: "Sandwiches" },
    { id: "fountain", label: "Fountain" }
  ];

  var SEATS = [
    { id: 1, label: "Seat 1" },
    { id: 2, label: "Seat 2" },
    { id: 3, label: "Seat 3" },
    { id: 4, label: "Counter" }
  ];

  var SPECIALS = [
    { name: "Sunday Chicken & Dumplings", price: 1425, desc: "Stewed hen, dropped dumplings, sweet peas." },
    { name: "Monday Liver & Onions", price: 1295, desc: "Smothered onions, mashed potatoes, pan gravy." },
    { name: "Tuesday Meatloaf Plate", price: 1350, desc: "Two slices, gravy, buttered carrots." },
    { name: "Wednesday Pot Roast", price: 1450, desc: "Fork-tender beef, potatoes, pearl onions." },
    { name: "Thursday Turkey & Dressing", price: 1375, desc: "Roast turkey, sage dressing, giblet gravy." },
    { name: "Friday Fried Catfish", price: 1525, desc: "Cornmeal crust, hushpuppies, cool slaw." },
    { name: "Saturday Ribeye & Eggs", price: 1895, desc: "Eight-ounce ribeye, two eggs, fries." }
  ];

  var DAYS_LONG = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  var DAYS_SHORT = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
  var MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
  var STATUSES = ["ordered", "cooking", "served"];

  var today = new Date();
  var special = SPECIALS[today.getDay()];
  var state = loadState();
  var voidArmed = false;
  var toastTimer = 0;
  var announceTimer = 0;
  var lineCounter = 0;

  var menuList = $("menuList");
  var menuCategories = $("menuCategories");
  var seatTabs = $("seatTabs");
  var orderLines = $("orderLines");
  var tableInput = $("tableInput");
  var serverSelect = $("serverSelect");
  var specialAdd = $("specialAdd");
  var specialBadge = $("specialBadge");
  var closeDialog = $("closeDialog");
  var closeBtn = $("closeCheck");
  var live = $("live");

  function pad(value) {
    return String(value).padStart(2, "0");
  }

  function money(cents) {
    return (cents / 100).toLocaleString("en-US", { style: "currency", currency: "USD" });
  }

  function dateKey(date) {
    return date.getFullYear() + "-" + pad(date.getMonth() + 1) + "-" + pad(date.getDate());
  }

  function clockText(date) {
    return pad(date.getHours()) + ":" + pad(date.getMinutes());
  }

  function shortDate(date) {
    return DAYS_SHORT[date.getDay()] + " · " + pad(date.getDate()) + " " + MONTHS[date.getMonth()];
  }

  function ticketLabel(number) {
    return "#" + String(number).padStart(3, "0");
  }

  function seatById(id) {
    return SEATS.find(function (seat) { return seat.id === Number(id); }) || SEATS[0];
  }

  function seatLabel() {
    return seatById(state.seat).label;
  }

  function makeId() {
    lineCounter += 1;
    return "line-" + Date.now().toString(36) + "-" + lineCounter;
  }

  function clampQty(value) {
    return Math.min(20, Math.max(1, Math.round(Number(value) || 1)));
  }

  function normaliseItem(raw) {
    if (!raw || typeof raw !== "object") return null;
    var name = typeof raw.name === "string" ? raw.name.trim().slice(0, 60) : "";
    var price = Number(raw.price);
    var seat = Number(raw.seat);
    if (!name || !Number.isFinite(price) || price < 0) return null;
    if (!SEATS.some(function (s) { return s.id === seat; })) return null;
    return {
      id: typeof raw.id === "string" && raw.id ? raw.id : makeId(),
      menuId: typeof raw.menuId === "string" ? raw.menuId : "custom",
      name: name,
      price: Math.round(price),
      qty: clampQty(raw.qty),
      seat: seat,
      status: STATUSES.indexOf(raw.status) >= 0 ? raw.status : "ordered"
    };
  }

  function seedState() {
    return {
      items: [
        { id: "seed-eggs", menuId: "eggs", name: "Two Eggs Any Style", price: 825, qty: 1, seat: 1, status: "served" },
        { id: "seed-coffee", menuId: "coffee", name: "Bottomless Coffee", price: 225, qty: 2, seat: 1, status: "served" },
        { id: "seed-patty", menuId: "patty", name: "Patty Melt", price: 1125, qty: 1, seat: 2, status: "cooking" },
        { id: "seed-stack", menuId: "stack", name: "Buttermilk Stack", price: 750, qty: 1, seat: 3, status: "ordered" }
      ],
      seat: 1,
      tipRate: 0.15,
      table: "4",
      server: "Dot",
      ticket: 14,
      category: "all",
      sales: { date: dateKey(new Date()), total: 0, checks: 0 }
    };
  }

  function loadState() {
    try {
      var raw = localStorage.getItem(STORE_KEY);
      if (!raw) return seedState();
      var parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object") return seedState();
      var items = Array.isArray(parsed.items) ? parsed.items.map(normaliseItem).filter(Boolean) : [];
      var seat = SEATS.some(function (s) { return s.id === Number(parsed.seat); }) ? Number(parsed.seat) : 1;
      var tipRate = [0, 0.1, 0.15, 0.18, 0.2].indexOf(Number(parsed.tipRate)) >= 0 ? Number(parsed.tipRate) : 0.15;
      var table = String(parsed.table || "4").replace(/[^0-9]/g, "").slice(0, 2) || "4";
      var server = ["Dot", "Marge", "Hank", "Pearl"].indexOf(parsed.server) >= 0 ? parsed.server : "Dot";
      var ticket = Number.isFinite(Number(parsed.ticket)) ? Math.max(1, Math.floor(Number(parsed.ticket))) : 14;
      var category = CATEGORIES.some(function (cat) { return cat.id === parsed.category; }) ? parsed.category : "all";
      var sales = parsed.sales && typeof parsed.sales === "object" ? parsed.sales : {};
      var todayKey = dateKey(new Date());
      var salesTotal = Number(sales.total);
      var salesChecks = Number(sales.checks);
      return {
        items: items,
        seat: seat,
        tipRate: tipRate,
        table: table,
        server: server,
        ticket: ticket,
        category: category,
        sales: {
          date: todayKey,
          total: sales.date === todayKey && Number.isFinite(salesTotal) ? Math.max(0, Math.round(salesTotal)) : 0,
          checks: sales.date === todayKey && Number.isFinite(salesChecks) ? Math.max(0, Math.floor(salesChecks)) : 0
        }
      };
    } catch (error) {
      return seedState();
    }
  }

  function saveNow() {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(state));
    } catch (error) {
      return;
    }
  }

  function announce(message) {
    window.clearTimeout(announceTimer);
    live.textContent = message;
    announceTimer = window.setTimeout(function () {
      live.textContent = "";
    }, 5000);
  }

  function showToast(message) {
    var toast = $("toast");
    $("toastText").textContent = message;
    toast.hidden = false;
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(function () {
      toast.hidden = true;
    }, 4600);
    announce(message);
  }

  function setPadMessage(message) {
    $("padMessage").textContent = message;
  }

  function seatItems(seatId) {
    return state.items.filter(function (item) { return item.seat === seatId; });
  }

  function subtotalFor(items) {
    return items.reduce(function (sum, item) { return sum + item.price * item.qty; }, 0);
  }

  function totals() {
    var subtotal = subtotalFor(state.items);
    var tax = Math.round(subtotal * TAX_RATE);
    var tip = Math.round(subtotal * state.tipRate);
    return { subtotal: subtotal, tax: tax, tip: tip, total: subtotal + tax + tip };
  }

  function statusCounts() {
    var counts = { ordered: 0, cooking: 0, served: 0 };
    state.items.forEach(function (item) {
      counts[item.status] += 1;
    });
    return counts;
  }

  function nextStatus(status) {
    var index = STATUSES.indexOf(status);
    return STATUSES[(index + 1) % STATUSES.length];
  }

  function syncSalesDay() {
    var key = dateKey(new Date());
    if (state.sales.date !== key) {
      state.sales = { date: key, total: 0, checks: 0 };
      saveNow();
    }
  }

  function renderHeader() {
    var now = new Date();
    $("dayName").textContent = DAYS_LONG[now.getDay()];
    $("dinerClock").textContent = clockText(now);
    $("todayTake").textContent = money(state.sales.total);
    $("todayChecks").textContent = String(state.sales.checks);
    $("checkNo").textContent = String(state.ticket).padStart(3, "0");
    $("padDate").textContent = shortDate(now);
    if (document.activeElement !== tableInput) tableInput.value = state.table;
    if (document.activeElement !== serverSelect) serverSelect.value = state.server;
  }

  function renderSpecial() {
    $("specialDay").textContent = DAYS_LONG[new Date().getDay()];
    $("specialName").textContent = special.name;
    $("specialDesc").textContent = special.desc;
    $("specialPrice").textContent = money(special.price);
    $("specialSeat").textContent = state.seat === 4 ? "counter" : "seat " + state.seat;
    specialAdd.setAttribute("aria-label", "Add the " + special.name + ", " + money(special.price) + ", to " + seatLabel());
  }

  function renderMenuTabs() {
    menuCategories.innerHTML = "";
    CATEGORIES.forEach(function (cat) {
      var button = document.createElement("button");
      button.type = "button";
      button.className = "cat-tab";
      button.dataset.category = cat.id;
      button.setAttribute("aria-pressed", state.category === cat.id ? "true" : "false");
      button.textContent = cat.label;
      menuCategories.appendChild(button);
    });
  }

  function renderMenu() {
    var items = MENU.filter(function (item) {
      return state.category === "all" || item.cat === state.category;
    });
    menuList.innerHTML = "";
    items.forEach(function (item) {
      var li = document.createElement("li");
      var button = document.createElement("button");
      button.type = "button";
      button.className = "menu-item";
      button.dataset.menuId = item.id;
      button.setAttribute("aria-label", "Add " + item.name + ", " + money(item.price) + ", to " + seatLabel());

      var top = document.createElement("span");
      top.className = "menu-topline";
      var name = document.createElement("span");
      name.className = "menu-name";
      name.textContent = item.name;
      var dots = document.createElement("span");
      dots.className = "menu-dots";
      var price = document.createElement("span");
      price.className = "menu-price";
      price.textContent = money(item.price);
      top.append(name, dots, price);

      var desc = document.createElement("span");
      desc.className = "menu-desc";
      desc.textContent = item.desc;

      var side = document.createElement("span");
      side.className = "menu-side";
      var plus = document.createElement("span");
      plus.className = "menu-plus";
      plus.textContent = "+";
      var count = document.createElement("span");
      count.className = "menu-count";
      count.dataset.menuCount = item.id;
      count.hidden = true;
      side.append(plus, count);

      button.append(top, desc, side);
      li.appendChild(button);
      menuList.appendChild(li);
    });
    updateMenuBadges();
  }

  function updateMenuBadges() {
    MENU.forEach(function (item) {
      var badge = menuList.querySelector('[data-menu-count="' + item.id + '"]');
      var button = menuList.querySelector('[data-menu-id="' + item.id + '"]');
      var qty = state.items.filter(function (line) {
        return line.menuId === item.id && line.seat === state.seat;
      }).reduce(function (sum, line) { return sum + line.qty; }, 0);
      if (badge) {
        badge.textContent = "×" + qty;
        badge.hidden = qty === 0;
      }
      if (button) {
        button.setAttribute("aria-label", "Add " + item.name + ", " + money(item.price) + ", to " + seatLabel());
      }
    });
    var specialQty = state.items.filter(function (line) {
      return line.menuId === "daily-special" && line.seat === state.seat;
    }).reduce(function (sum, line) { return sum + line.qty; }, 0);
    specialBadge.textContent = "×" + specialQty;
    specialBadge.hidden = specialQty === 0;
    $("specialSeat").textContent = state.seat === 4 ? "counter" : "seat " + state.seat;
  }

  function renderSeatTabs() {
    seatTabs.innerHTML = "";
    SEATS.forEach(function (seat) {
      var items = seatItems(seat.id);
      var seatTotal = subtotalFor(items);
      var count = items.reduce(function (sum, item) { return sum + item.qty; }, 0);
      var button = document.createElement("button");
      button.type = "button";
      button.className = "seat-tab";
      button.dataset.seat = String(seat.id);
      button.dataset.count = String(count);
      button.setAttribute("aria-pressed", state.seat === seat.id ? "true" : "false");
      button.setAttribute("aria-label", seat.label + ", " + count + " items, " + money(seatTotal));
      var name = document.createElement("span");
      name.className = "seat-name";
      name.textContent = seat.label;
      var cash = document.createElement("span");
      cash.className = "seat-money";
      cash.textContent = money(seatTotal) + " · " + count;
      button.append(name, cash);
      seatTabs.appendChild(button);
    });
  }

  function renderOrder() {
    var current = seatById(state.seat);
    var items = seatItems(state.seat);
    var currentTotal = subtotalFor(items);
    var count = items.reduce(function (sum, item) { return sum + item.qty; }, 0);
    $("seatHeading").textContent = current.label;
    $("seatSubtotal").textContent = money(currentTotal);
    $("itemCount").textContent = count + (count === 1 ? " item" : " items");
    orderLines.innerHTML = "";
    if (!items.length) {
      var empty = document.createElement("li");
      empty.className = "empty-order";
      var title = document.createElement("strong");
      title.textContent = "A clean placemat";
      var copy = document.createElement("span");
      copy.textContent = "Nothing written for " + current.label + " yet. Tap a dish from the bill of fare and it lands here.";
      empty.append(title, copy);
      orderLines.appendChild(empty);
      return;
    }
    items.forEach(function (item) {
      var li = document.createElement("li");
      li.className = "order-line";

      var name = document.createElement("span");
      name.className = "line-name";
      name.textContent = item.name;
      var each = document.createElement("span");
      each.className = "line-each";
      each.textContent = " " + money(item.price) + " ea";
      name.appendChild(each);

      var total = document.createElement("span");
      total.className = "line-total";
      total.textContent = money(item.price * item.qty);

      var controls = document.createElement("div");
      controls.className = "line-controls";

      var qtyBox = document.createElement("span");
      qtyBox.className = "qty-box";
      var minus = document.createElement("button");
      minus.type = "button";
      minus.dataset.action = "minus";
      minus.dataset.id = item.id;
      minus.setAttribute("aria-label", "Decrease quantity of " + item.name);
      minus.textContent = "−";
      var qty = document.createElement("span");
      qty.textContent = String(item.qty);
      var plus = document.createElement("button");
      plus.type = "button";
      plus.dataset.action = "plus";
      plus.dataset.id = item.id;
      plus.setAttribute("aria-label", "Increase quantity of " + item.name);
      plus.textContent = "+";
      qtyBox.append(minus, qty, plus);

      var status = document.createElement("button");
      status.type = "button";
      status.className = "status-btn is-" + item.status;
      status.dataset.action = "status";
      status.dataset.id = item.id;
      status.textContent = item.status;
      status.setAttribute("aria-label", item.name + " is " + item.status + ". Mark as " + nextStatus(item.status) + ".");

      var remove = document.createElement("button");
      remove.type = "button";
      remove.className = "line-remove";
      remove.dataset.action = "remove";
      remove.dataset.id = item.id;
      remove.setAttribute("aria-label", "Remove " + item.name + " from this check");
      remove.textContent = "×";

      controls.append(qtyBox, status, remove);
      li.append(name, total, controls);
      orderLines.appendChild(li);
    });
  }

  function renderTotals() {
    var t = totals();
    $("subtotalOut").textContent = money(t.subtotal);
    $("taxOut").textContent = money(t.tax);
    $("tipAmount").textContent = money(t.tip);
    $("totalOut").textContent = money(t.total);
    $("tipRateLabel").textContent = Math.round(state.tipRate * 100) + "%";
    Array.prototype.forEach.call($("tipButtons").querySelectorAll("button"), function (button) {
      var active = Number(button.dataset.tip) === state.tipRate;
      button.setAttribute("aria-pressed", active ? "true" : "false");
      button.setAttribute("aria-label", Number(button.dataset.tip) === 0 ? "No tip" : Math.round(Number(button.dataset.tip) * 100) + " percent tip");
    });
  }

  function renderKitchen() {
    $("kitchenNo").textContent = ticketLabel(state.ticket);
    $("kitchenTable").textContent = state.table;
    $("kitchenServer").textContent = state.server.toUpperCase();
    $("kitchenTime").textContent = clockText(new Date());
    var open = state.items.filter(function (item) { return item.status !== "served"; });
    var ordered = state.items.filter(function (item) { return item.status === "ordered"; }).length;
    kitchenListReset();
    if (!open.length) {
      $("kitchenEmpty").hidden = false;
    } else {
      $("kitchenEmpty").hidden = true;
      open.sort(function (a, b) {
        if (a.status !== b.status) return a.status === "ordered" ? -1 : 1;
        return a.seat - b.seat;
      });
      open.forEach(function (item) {
        var li = document.createElement("li");
        li.className = "kitchen-item";
        var qty = document.createElement("span");
        qty.className = "kitchen-qty";
        qty.textContent = item.qty + "×";
        var name = document.createElement("span");
        name.className = "kitchen-name";
        name.textContent = item.name;
        var sub = document.createElement("span");
        sub.className = "kitchen-sub";
        var seat = document.createElement("span");
        seat.textContent = seatById(item.seat).label;
        var status = document.createElement("span");
        status.className = "kitchen-status status-" + item.status;
        status.textContent = item.status;
        sub.append(seat, status);
        li.append(qty, name, sub);
        $("kitchenList").appendChild(li);
      });
    }
    $("fireAll").disabled = ordered === 0;
    $("serveAll").disabled = open.length === 0;
  }

  function kitchenListReset() {
    $("kitchenList").innerHTML = "";
  }

  function renderReceipt() {
    $("receiptNo").textContent = ticketLabel(state.ticket);
    $("receiptTable").textContent = state.table;
    $("receiptServer").textContent = state.server.toUpperCase();
    $("receiptTime").textContent = clockText(new Date());
    var list = $("receiptList");
    list.innerHTML = "";
    if (!state.items.length) {
      var empty = document.createElement("li");
      empty.className = "receipt-empty";
      empty.textContent = "No items on check";
      list.appendChild(empty);
    } else {
      state.items.slice().sort(function (a, b) { return a.seat - b.seat; }).forEach(function (item) {
        var li = document.createElement("li");
        li.className = "receipt-item";
        var label = document.createElement("span");
        var qty = document.createElement("span");
        qty.className = "receipt-qty";
        qty.textContent = item.qty + "× ";
        label.append(qty, document.createTextNode(item.name));
        var amount = document.createElement("span");
        amount.textContent = money(item.price * item.qty);
        li.append(label, amount);
        list.appendChild(li);
      });
    }
    var t = totals();
    $("receiptSubtotal").textContent = money(t.subtotal);
    $("receiptTax").textContent = money(t.tax);
    $("receiptTip").textContent = money(t.tip);
    $("receiptTotal").textContent = money(t.total);
    var counts = statusCounts();
    if (!state.items.length) {
      $("receiptStatus").textContent = "No open check";
    } else {
      $("receiptStatus").textContent = counts.ordered + " ordered · " + counts.cooking + " cooking · " + counts.served + " served";
    }
  }

  function renderAll() {
    syncSalesDay();
    renderHeader();
    renderSpecial();
    renderSeatTabs();
    renderOrder();
    renderTotals();
    renderKitchen();
    renderReceipt();
    updateMenuBadges();
  }

  function afterOrderChange(message) {
    saveNow();
    renderAll();
    setPadMessage(message);
    announce(message);
  }

  function addLine(name, price, menuId) {
    var existing = state.items.find(function (item) {
      return item.menuId === menuId && item.seat === state.seat && item.status !== "served";
    });
    if (existing) {
      existing.qty = clampQty(existing.qty + 1);
    } else {
      state.items.push({
        id: makeId(),
        menuId: menuId,
        name: name,
        price: price,
        qty: 1,
        seat: state.seat,
        status: "ordered"
      });
    }
    afterOrderChange("Added " + name + " to " + seatLabel() + ".");
  }

  function setSeat(seatId) {
    state.seat = Number(seatId);
    saveNow();
    renderSeatTabs();
    renderOrder();
    renderSpecial();
    updateMenuBadges();
    setPadMessage("Writing on " + seatLabel() + ".");
    announce("Now writing on " + seatLabel() + ".");
    var tab = seatTabs.querySelector('[data-seat="' + state.seat + '"]');
    if (tab) tab.focus();
  }

  function focusOrderControl(action, id) {
    var target = orderLines.querySelector('button[data-action="' + action + '"][data-id="' + id + '"]');
    if (target) {
      target.focus();
      return;
    }
    var tab = seatTabs.querySelector('.seat-tab[aria-pressed="true"]');
    if (tab) tab.focus();
  }

  menuCategories.addEventListener("click", function (event) {
    var button = event.target.closest("button[data-category]");
    if (!button) return;
    state.category = button.dataset.category;
    saveNow();
    renderMenuTabs();
    renderMenu();
    var focusTarget = menuCategories.querySelector('[data-category="' + state.category + '"]');
    if (focusTarget) focusTarget.focus();
    announce("Menu filtered to " + button.textContent + ".");
  });

  menuList.addEventListener("click", function (event) {
    var button = event.target.closest("button[data-menu-id]");
    if (!button) return;
    var item = MENU.find(function (entry) { return entry.id === button.dataset.menuId; });
    if (!item) return;
    addLine(item.name, item.price, item.id);
  });

  specialAdd.addEventListener("click", function () {
    addLine(special.name, special.price, "daily-special");
  });

  seatTabs.addEventListener("click", function (event) {
    var button = event.target.closest("button[data-seat]");
    if (!button) return;
    setSeat(button.dataset.seat);
  });

  orderLines.addEventListener("click", function (event) {
    var button = event.target.closest("button[data-action]");
    if (!button) return;
    var item = state.items.find(function (entry) { return entry.id === button.dataset.id; });
    if (!item) return;
    var action = button.dataset.action;
    if (action === "plus") {
      item.qty = clampQty(item.qty + 1);
      afterOrderChange("One more " + item.name + " for " + seatById(item.seat).label + ".");
      focusOrderControl("plus", item.id);
    } else if (action === "minus") {
      if (item.qty <= 1) {
        state.items = state.items.filter(function (entry) { return entry.id !== item.id; });
        afterOrderChange(item.name + " crossed off " + seatById(item.seat).label + ".");
        focusOrderControl("remove", item.id);
      } else {
        item.qty -= 1;
        afterOrderChange("One less " + item.name + " for " + seatById(item.seat).label + ".");
        focusOrderControl("minus", item.id);
      }
    } else if (action === "status") {
      item.status = nextStatus(item.status);
      afterOrderChange(item.name + " marked " + item.status + ".");
      focusOrderControl("status", item.id);
    } else if (action === "remove") {
      state.items = state.items.filter(function (entry) { return entry.id !== item.id; });
      afterOrderChange(item.name + " removed from " + seatById(item.seat).label + ".");
      focusOrderControl("remove", item.id);
    }
  });

  $("tipButtons").addEventListener("click", function (event) {
    var button = event.target.closest("button[data-tip]");
    if (!button) return;
    state.tipRate = Number(button.dataset.tip);
    saveNow();
    renderTotals();
    renderReceipt();
    announce("Tip set to " + Math.round(state.tipRate * 100) + " percent.");
  });

  tableInput.addEventListener("change", function () {
    var value = Math.round(Number(tableInput.value));
    if (!Number.isFinite(value) || value < 1 || value > 99) {
      tableInput.value = state.table;
      announce("Table must be between 1 and 99.");
      return;
    }
    state.table = String(value);
    tableInput.value = state.table;
    saveNow();
    renderKitchen();
    renderReceipt();
    announce("Table set to " + state.table + ".");
  });

  serverSelect.addEventListener("change", function () {
    state.server = serverSelect.value;
    saveNow();
    renderKitchen();
    renderReceipt();
    announce("Server set to " + state.server + ".");
  });

  $("fireAll").addEventListener("click", function () {
    var fired = 0;
    state.items.forEach(function (item) {
      if (item.status === "ordered") {
        item.status = "cooking";
        fired += 1;
      }
    });
    if (!fired) {
      setPadMessage("Nothing waiting on the pass.");
      return;
    }
    afterOrderChange(fired + (fired === 1 ? " dish" : " dishes") + " fired for the grill.");
  });

  $("serveAll").addEventListener("click", function () {
    var served = 0;
    state.items.forEach(function (item) {
      if (item.status !== "served") {
        item.status = "served";
        served += 1;
      }
    });
    if (!served) {
      setPadMessage("Every plate is already on the table.");
      return;
    }
    afterOrderChange(served + (served === 1 ? " plate" : " plates") + " marked served.");
  });

  function openCloseDialog() {
    if (!state.items.length) {
      setPadMessage("There is nothing on the check to settle.");
      showToast("The pad is empty. Add a dish first.");
      return;
    }
    voidArmed = false;
    var t = totals();
    var counts = statusCounts();
    $("dialogTitle").textContent = "Close check " + ticketLabel(state.ticket);
    $("dialogMeta").textContent = "Table " + state.table + " · " + state.server + " · " + seatItems(state.seat).length + " lines on " + seatLabel();
    $("dialogSubtotal").textContent = money(t.subtotal);
    $("dialogTax").textContent = money(t.tax);
    $("dialogTip").textContent = money(t.tip) + " (" + Math.round(state.tipRate * 100) + "%)";
    $("dialogTotal").textContent = money(t.total);
    $("dialogOpen").textContent = counts.cooking + counts.ordered > 0
      ? (counts.cooking + counts.ordered) + " item(s) still open. Settling will mark them served."
      : "All items served. Ready for the register.";
    $("voidBtn").textContent = "Void check";
    $("voidBtn").classList.remove("is-armed");
    $("dialogError").hidden = true;
    closeDialog.showModal();
  }

  function clearCheck() {
    state.items = [];
    state.ticket += 1;
    state.seat = 1;
    state.tipRate = 0.15;
    saveNow();
    closeDialog.close();
    renderAll();
  }

  closeBtn.addEventListener("click", openCloseDialog);

  $("settleBtn").addEventListener("click", function () {
    var t = totals();
    var oldTicket = state.ticket;
    state.sales.total += t.total;
    state.sales.checks += 1;
    clearCheck();
    showToast("Check " + ticketLabel(oldTicket) + " settled for " + money(t.total) + ". New check " + ticketLabel(state.ticket) + " started.");
    setPadMessage("The register is closed out. A fresh page is on the pad.");
  });

  $("voidBtn").addEventListener("click", function () {
    if (!voidArmed) {
      voidArmed = true;
      $("voidBtn").textContent = "Tap again to void this check";
      $("voidBtn").classList.add("is-armed");
      $("dialogError").textContent = "Voiding discards every item without recording a sale.";
      $("dialogError").hidden = false;
      return;
    }
    var oldTicket = state.ticket;
    clearCheck();
    showToast("Check " + ticketLabel(oldTicket) + " voided. No sale recorded.");
    setPadMessage("That check is torn off the pad.");
  });

  $("keepBtn").addEventListener("click", function () {
    closeDialog.close();
  });

  closeDialog.addEventListener("click", function (event) {
    if (event.target === closeDialog) closeDialog.close();
  });

  closeDialog.addEventListener("close", function () {
    voidArmed = false;
    $("voidBtn").textContent = "Void check";
    $("voidBtn").classList.remove("is-armed");
    $("dialogError").hidden = true;
  });

  $("receiptPrint").addEventListener("click", function () {
    window.print();
  });

  renderMenuTabs();
  renderMenu();
  renderAll();
  saveNow();

  window.setInterval(function () {
    syncSalesDay();
    renderHeader();
  }, 30000);
})();
