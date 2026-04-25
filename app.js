const phones = [...document.querySelectorAll("[data-screen]")];
const prototypeShell = document.querySelector(".prototype-shell");
const viewModeButtons = [...document.querySelectorAll("[data-view-mode-button]")];
const screenCounter = document.querySelector("[data-screen-counter]");
const previousScreenButton = document.querySelector("[data-screen-prev]");
const nextScreenButton = document.querySelector("[data-screen-next]");
const totalNumberedScreens = 30;
let currentScreen = "01";
const screenHistory = [];

function focusScreen(id) {
  phones.forEach((phone) => {
    phone.classList.toggle("is-focus", phone.dataset.screen === id);
  });
  currentScreen = id;
  updateScreenCounter();
}

function getCurrentScreenIndex() {
  return Math.max(0, phones.findIndex((phone) => phone.dataset.screen === currentScreen));
}

function updateScreenCounter() {
  if (!screenCounter) return;

  const index = getCurrentScreenIndex();
  const currentLabel = phones[index]?.dataset.screen?.match(/\d+/)?.[0] || currentScreen.match(/\d+/)?.[0] || currentScreen;
  screenCounter.textContent = `${currentLabel.padStart(2, "0")}\n/ ${totalNumberedScreens}`;
}

function setViewMode(mode, options = {}) {
  if (!prototypeShell) return;

  const previousMode = prototypeShell.dataset.viewMode;
  const shouldScroll = options.scroll ?? (mode === "single" && previousMode !== "single");
  prototypeShell.classList.add("is-changing-view");

  prototypeShell.dataset.viewMode = mode;
  viewModeButtons.forEach((button) => {
    const isActive = button.dataset.viewModeButton === mode;
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });

  if (shouldScroll || (mode === "grid" && previousMode === "single")) {
    const targetPhone = document.querySelector(`[data-screen="${currentScreen}"]`);
    const behavior = mode === "grid" ? "auto" : "smooth";
    const block = mode === "grid" ? "center" : "start";

    requestAnimationFrame(() => {
      targetPhone?.scrollIntoView({
        behavior,
        block,
        inline: "center",
      });
    });
  }

  window.setTimeout(() => {
    prototypeShell.classList.remove("is-changing-view");
  }, 180);
}

function scrollToScreen(id, behavior = "smooth") {
  if (prototypeShell?.dataset.viewMode === "single") return;

  document.querySelector(`[data-screen="${id}"]`)?.scrollIntoView({
    behavior,
    block: "center",
    inline: "center",
  });
}

function stepScreen(direction) {
  const index = getCurrentScreenIndex();
  const nextIndex = (index + direction + phones.length) % phones.length;
  const target = phones[nextIndex]?.dataset.screen;
  if (!target) return;

  if (target !== currentScreen) {
    screenHistory.push(currentScreen);
  }

  focusScreen(target);
  setViewMode("single", { scroll: false });
}

document.querySelectorAll("[data-go]").forEach((button) => {
  button.addEventListener("click", () => {
    let target = button.dataset.go;
    const sourceScreen = button.closest("[data-screen]")?.dataset.screen || currentScreen;

    if (button.classList.contains("back")) {
      target = screenHistory.length > 0 ? screenHistory.pop() : target;
    } else if (target !== sourceScreen) {
      screenHistory.push(sourceScreen);
    }

    focusScreen(target);
    scrollToScreen(target);

    if (button.dataset.register === "true") {
      const registerTab = document.querySelector('[data-tab="register"]');
      registerTab?.click();
    }
  });
});

viewModeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    setViewMode(button.dataset.viewModeButton, { scroll: button.dataset.viewModeButton === "single" });
  });
});

previousScreenButton?.addEventListener("click", () => {
  stepScreen(-1);
});

nextScreenButton?.addEventListener("click", () => {
  stepScreen(1);
});

document.querySelectorAll("[data-go]:not(button):not(a):not(input):not(select):not(textarea)").forEach((item) => {
  item.setAttribute("role", "button");
  item.setAttribute("tabindex", "0");
  item.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      item.click();
    }
  });
});

document.querySelectorAll("[data-tab]").forEach((tab) => {
  tab.addEventListener("click", () => {
    const panel = tab.dataset.tab;

    document.querySelectorAll("[data-tab]").forEach((item) => {
      item.classList.toggle("active", item === tab);
    });

    document.querySelectorAll("[data-panel]").forEach((form) => {
      form.classList.toggle("active", form.dataset.panel === panel);
    });
  });
});

document.querySelectorAll("[data-device-filter]").forEach((filterButton) => {
  filterButton.addEventListener("click", () => {
    const filterGroup = filterButton.closest(".filter-tabs");
    if (!filterGroup) return;

    filterGroup.querySelectorAll("[data-device-filter]").forEach((button) => {
      button.classList.toggle("active", button === filterButton);
    });

    updateDeviceRows(filterButton.closest(".devices-screen"));
  });
});

const toggleGroups = [
  ...[...document.querySelectorAll(".filter-tabs")].filter((group) => !group.querySelector("[data-device-filter]")),
  ...document.querySelectorAll(".format-grid, .automation-card, .tariff-options, .share-card"),
];

toggleGroups.forEach((group) => {
  group.querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", () => {
      group.querySelectorAll("button").forEach((item) => {
        item.classList.toggle("active", item === button);
      });
    });
  });
});

document.querySelectorAll(".day-picker button").forEach((button) => {
  button.addEventListener("click", () => {
    button.classList.toggle("active");
  });
});

document.querySelectorAll(".notification-list button, .notification-list div").forEach((row) => {
  row.addEventListener("click", () => {
    row.querySelector(".switch")?.classList.toggle("on");
  });
});

function updateDeviceRows(screen) {
  if (!screen) return;

  const activeFilter = screen.querySelector("[data-device-filter].active")?.dataset.deviceFilter || "all";
  const query = screen.querySelector("[data-device-search]")?.value.trim().toLowerCase() || "";
  const rows = [...screen.querySelectorAll("[data-device-status]")];
  const emptyState = screen.querySelector("[data-empty-devices]");
  let visibleRows = 0;

  rows.forEach((row) => {
    const matchesFilter = activeFilter === "all" || row.dataset.deviceStatus === activeFilter;
    const matchesSearch = query === "" || row.textContent.toLowerCase().includes(query);
    const isVisible = matchesFilter && matchesSearch;
    row.hidden = !isVisible;
    if (isVisible) visibleRows += 1;
  });

  if (emptyState) {
    emptyState.hidden = visibleRows !== 0;
  }
}

const deviceSearch = document.querySelector("[data-device-search]");
if (deviceSearch) {
  deviceSearch.addEventListener("input", () => {
    updateDeviceRows(deviceSearch.closest(".devices-screen"));
  });
}

focusScreen("01");
setViewMode("grid");
