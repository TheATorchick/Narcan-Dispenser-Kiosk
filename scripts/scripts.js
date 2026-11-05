// JavaScript Document
// Shared page behavior and animation settings.
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

// Keep a reusable pool of falling background images.
const fallingBackground = document.createElement("div");
fallingBackground.className = "fallingBackground";
fallingBackground.setAttribute("aria-hidden", "true");

let magnifierSpeed = 1;
let magnifierBaseSize = 2.5;
let magnifierOpacity = 14;

function applyMagnifierSettings(magnifier) {
  const size = magnifierBaseSize * Number(magnifier.dataset.sizeFactor);
  const duration = 40 * Number(magnifier.dataset.speedFactor) / magnifierSpeed;
  magnifier.style.setProperty("--fall-size", `${size}rem`);
  magnifier.style.setProperty("--fall-duration", `${duration}s`);
  magnifier.style.setProperty("--fall-opacity", String(magnifierOpacity / 100));
}

function createFallingMagnifier() {
  const magnifier = document.createElement("img");
  magnifier.src = "images/magnifier.svg";
  magnifier.alt = "";
  magnifier.className = "fallingMagnifier";
  magnifier.dataset.sizeFactor = 0.6 + Math.random() * 0.8;
  magnifier.dataset.speedFactor = 0.7 + Math.random() * 0.6;
  magnifier.style.setProperty("--fall-left", `${Math.random() * 100}%`);
  magnifier.style.setProperty("--fall-delay", `${-Math.random() * 50}s`);
  applyMagnifierSettings(magnifier);
  fallingBackground.appendChild(magnifier);
}

function setFallingMagnifierCount(count) {
  while (fallingBackground.children.length > count) {
    fallingBackground.lastElementChild.remove();
  }
  while (fallingBackground.children.length < count) {
    createFallingMagnifier();
  }
}

document.body.prepend(fallingBackground);
setFallingMagnifierCount(40);

const magnifierCount = document.querySelector("#magnifierCount");
const magnifierCountValue = document.querySelector("#magnifierCountValue");
if (magnifierCount && magnifierCountValue) {
  magnifierCount.addEventListener("input", () => {
    const count = Number(magnifierCount.value);
    magnifierCountValue.value = count;
    magnifierCountValue.textContent = count;
    setFallingMagnifierCount(count);
  });
}

const magnifierSpeedInput = document.querySelector("#magnifierSpeed");
const magnifierSizeInput = document.querySelector("#magnifierSize");
const magnifierOpacityInput = document.querySelector("#magnifierOpacity");

function refreshMagnifierSettings() {
  fallingBackground.querySelectorAll(".fallingMagnifier").forEach(applyMagnifierSettings);
}

if (magnifierSpeedInput) {
  magnifierSpeedInput.addEventListener("input", () => {
    magnifierSpeed = Number(magnifierSpeedInput.value);
    document.querySelector("#magnifierSpeedValue").textContent = `${magnifierSpeed}×`;
    refreshMagnifierSettings();
  });
}

if (magnifierSizeInput) {
  magnifierSizeInput.addEventListener("input", () => {
    magnifierBaseSize = Number(magnifierSizeInput.value);
    document.querySelector("#magnifierSizeValue").textContent = `${magnifierBaseSize}rem`;
    refreshMagnifierSettings();
  });
}

if (magnifierOpacityInput) {
  magnifierOpacityInput.addEventListener("input", () => {
    magnifierOpacity = Number(magnifierOpacityInput.value);
    document.querySelector("#magnifierOpacityValue").textContent = `${magnifierOpacity}%`;
    refreshMagnifierSettings();
  });
}

const backgroundDefaults = document.querySelector("#backgroundDefaults");
if (backgroundDefaults) {
  backgroundDefaults.addEventListener("click", () => {
    const defaultValues = [40, 1, 2.5, 14];
    [magnifierCount, magnifierSpeedInput, magnifierSizeInput, magnifierOpacityInput]
      .forEach((input, index) => {
        input.value = defaultValues[index];
        input.dispatchEvent(new Event("input", { bubbles: true }));
      });
  });
}

const backgroundControls = document.querySelector(".backgroundControls");
const hideBackgroundSettings = document.querySelector("#hideBackgroundSettings");
const showBackgroundSettings = document.querySelector("#showBackgroundSettings");
if (backgroundControls && hideBackgroundSettings && showBackgroundSettings) {
  hideBackgroundSettings.addEventListener("click", () => {
    backgroundControls.classList.remove("is-opening");
    const reducedMotion =
      document.documentElement.classList.contains("reduced-motion") ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) {
      backgroundControls.hidden = true;
      showBackgroundSettings.hidden = false;
    } else {
      backgroundControls.classList.add("is-closing");
    }
  });
  showBackgroundSettings.addEventListener("click", () => {
    backgroundControls.hidden = false;
    backgroundControls.classList.remove("is-closing");
    showBackgroundSettings.hidden = true;
    backgroundControls.classList.add("is-opening");
  });
  backgroundControls.addEventListener("animationend", (event) => {
    if (event.animationName === "backgroundPanelExpand") {
      backgroundControls.classList.remove("is-opening");
    } else if (event.animationName === "backgroundPanelCollapse") {
      backgroundControls.classList.remove("is-closing");
      backgroundControls.hidden = true;
      showBackgroundSettings.hidden = false;
    }
  });
}

fallingBackground.addEventListener("animationiteration", (event) => {
  if (event.target.classList.contains("fallingMagnifier")) {
    event.target.style.setProperty("--fall-left", `${Math.random() * 100}%`);
  }
});

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
