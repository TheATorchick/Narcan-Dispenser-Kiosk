// JavaScript Document
//buttons
const reducedMotionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
let settingsReduceMotion = false;

function applyReducedMotionPreference() {
  document.documentElement.classList.toggle(
    "reduced-motion",
    settingsReduceMotion || reducedMotionPreference.matches
  );
}

applyReducedMotionPreference();

if (reducedMotionPreference.addEventListener) {
  reducedMotionPreference.addEventListener("change", applyReducedMotionPreference);
} else {
  reducedMotionPreference.addListener(applyReducedMotionPreference);
}

function applySiteSettings(settings) {
    settingsReduceMotion = settings.reducedMotion === true;
    applyReducedMotionPreference();

    const colorSettings = {
      "--color-main": settings.mainColor,
      "--color-background": settings.backgroundColor,
      "--color-accent": settings.accentColor,
      "--color-text": settings.textColor
    };

    Object.entries(colorSettings).forEach(([variable, value]) => {
      if (value) {
        document.documentElement.style.setProperty(variable, value);
      }
    });
}

let savedSettings = null;
try {
  savedSettings = JSON.parse(localStorage.getItem("kioskSettings"));
} catch (_) {}

if (savedSettings && typeof savedSettings === "object") {
  applySiteSettings(savedSettings);
} else {
  fetch("settings.json")
    .then((response) => {
      if (!response.ok) throw new Error("Could not load site settings.");
      return response.json();
    })
    .then(applySiteSettings)
    .catch(() => {});
}

//Dispense Button
const dispenseButton = document.querySelector("#dispense-Button");
const homeButton = document.querySelector("#home-Button");

if (dispenseButton) {
  dispenseButton.addEventListener("click", () => {
    window.location.href = "dispense.html";
  });
}

if (homeButton) {
  homeButton.addEventListener("click", () => {
    window.location.href = "home.html";
  });
}

const footerReveal = document.querySelector("#footerReveal");
const footerLinks = document.querySelector("#footerLinks");

if (footerReveal && footerLinks) {
  footerReveal.addEventListener("click", () => {
    const isExpanded = footerReveal.getAttribute("aria-expanded") === "true";
    footerReveal.setAttribute("aria-expanded", String(!isExpanded));
    footerReveal.setAttribute("aria-label", isExpanded ? "Show footer links" : "Hide footer links");
    footerLinks.hidden = isExpanded;
  });
}

document.addEventListener("click", (event) => {
  const button = event.target.closest(".dispenseItemButton");
  if (!button) {
    return;
  }

  if (button.dataset.sourceItem) {
    const query = new URLSearchParams({
      source: button.dataset.sourceItem,
      index: button.dataset.dispenseIndex || "0"
    });
    window.location.href = `itemDispensed.html?${query.toString()}`;
    return;
  }

  const item = button.dataset.item;
  window.location.href = `itemDispensed.html?item=${encodeURIComponent(item)}`;
});

document.addEventListener("click", (event) => {
  const button = event.target.closest(".learnMoreItemButton");
  if (!button) {
    return;
  }

  const item = button.dataset.item;
  const query = new URLSearchParams({ item });
  window.location.href = `item.html?${query.toString()}`;
});
