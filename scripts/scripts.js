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
const fallingImageSources = [
  "images/SVG/Narcan.svg",
  "images/SVG/Pill%201.svg",
  "images/SVG/Pill%202.svg",
  "images/SVG/Syringe.svg",
  "images/SVG/Test%20Strip.svg"
];

function applyMagnifierSettings(magnifier) {
  const size = magnifierBaseSize * Number(magnifier.dataset.sizeFactor);
  const duration = 40 * Number(magnifier.dataset.speedFactor) / magnifierSpeed;
  magnifier.style.setProperty("--fall-size", `${size}rem`);
  magnifier.style.setProperty("--fall-duration", `${duration}s`);
  magnifier.style.setProperty("--fall-opacity", String(magnifierOpacity / 100));
}

function createFallingMagnifier() {
  const magnifier = document.createElement("img");
  magnifier.src = fallingImageSources[Math.floor(Math.random() * fallingImageSources.length)];
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
    event.target.src = fallingImageSources[Math.floor(Math.random() * fallingImageSources.length)];
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

// Dispensing panel shared by the dispenser and item information pages.
const dispensingOverlay = document.querySelector("#dispensingOverlay");
if (dispensingOverlay instanceof HTMLDialogElement) {
  const dispensingPanel = dispensingOverlay.querySelector(".dispensingPanel");
  const dispensingSpinner = dispensingOverlay.querySelector(".dispensingSpinner");
  const dispensingCancel = dispensingOverlay.querySelector(".dispensingCancel");
  const dispensedNames = dispensingOverlay.querySelectorAll("[data-dispensed-item]");
  let standaloneDispenseTimer;
  let standaloneConfirmationTimer;
  let standaloneCloseTimer;
  let dispenseOpener;

  function closeDispensingOverlay() {
    window.clearTimeout(standaloneDispenseTimer);
    window.clearTimeout(standaloneConfirmationTimer);
    if (document.documentElement.classList.contains("reduced-motion") || reducedMotionPreference.matches) {
      dispensingOverlay.close();
      if (dispenseOpener?.isConnected) dispenseOpener.focus();
      return;
    }
    dispensingOverlay.classList.add("is-closing");
    standaloneCloseTimer = window.setTimeout(() => {
      dispensingOverlay.classList.remove("is-closing");
      dispensingOverlay.close();
      if (dispenseOpener?.isConnected) dispenseOpener.focus();
    }, 280);
  }

  window.startDispensingOverlay = (itemName, opener) => {
    window.clearTimeout(standaloneDispenseTimer);
    window.clearTimeout(standaloneConfirmationTimer);
    window.clearTimeout(standaloneCloseTimer);
    dispenseOpener = opener;
    dispensingOverlay.classList.remove("is-closing");
    dispensingSpinner.hidden = false;
    dispensingCancel.hidden = false;
    dispensedNames.forEach((node) => { node.textContent = itemName; });
    if (!dispensingOverlay.open) dispensingOverlay.showModal();
    dispensingCancel.focus();

    standaloneDispenseTimer = window.setTimeout(() => {
      dispensingSpinner.hidden = true;
      dispensingCancel.hidden = true;
      standaloneConfirmationTimer = window.setTimeout(() => {
        window.alert(`${itemName} has been dispensed. Thank you for using the kiosk`);
        window.location.href = "home.html";
      }, 150);
    }, 4000);
  };

  dispensingCancel.addEventListener("click", closeDispensingOverlay);
  dispensingOverlay.addEventListener("cancel", (event) => {
    event.preventDefault();
    closeDispensingOverlay();
  });
  dispensingOverlay.addEventListener("click", (event) => {
    if (event.target === dispensingOverlay) closeDispensingOverlay();
  });
}

const homeContactDialog = document.querySelector("#homeContactDialog");
if (homeContactDialog instanceof HTMLDialogElement) {
  const homeContactSheet = homeContactDialog.querySelector(".itemSheetBubble");
  const homeContactForm = document.querySelector("#homeContactForm");
  let homeContactCloseTimer;

  function closeHomeContact() {
    if (!homeContactDialog.open) return;
    if (document.documentElement.classList.contains("reduced-motion") || reducedMotionPreference.matches) {
      homeContactDialog.close();
      return;
    }
    homeContactSheet.classList.add("is-closing");
    homeContactCloseTimer = window.setTimeout(() => {
      homeContactSheet.classList.remove("is-closing");
      homeContactDialog.close();
    }, 320);
  }

  document.querySelector("#contact").addEventListener("click", (event) => {
    event.preventDefault();
    window.clearTimeout(homeContactCloseTimer);
    homeContactSheet.classList.remove("is-closing");
    homeContactDialog.showModal();
  });
  document.querySelector("#closeHomeContact").addEventListener("click", closeHomeContact);
  homeContactDialog.addEventListener("click", (event) => {
    if (event.target === homeContactDialog) closeHomeContact();
  });
  homeContactDialog.addEventListener("cancel", (event) => {
    event.preventDefault();
    closeHomeContact();
  });
  homeContactForm.addEventListener("submit", (event) => {
    event.preventDefault();
    window.alert("Form submitted");
    homeContactForm.reset();
    closeHomeContact();
  });
}

// Animate all navigation controls before allowing the selected action to run.
const clickFallReplay = new WeakSet();
const navigationControlSelector = "a, #home-Button, #dispense-Button, .learnMoreItemButton, .dispenseItemButton, #cancelDispensing, #defaultSettings";
document.addEventListener("click", (event) => {
  const control = event.target.closest(navigationControlSelector);
  if (!control) return;
  if (clickFallReplay.has(control)) {
    clickFallReplay.delete(control);
    return;
  }
  if (control.matches("#contact")) return;
  if (control.disabled || document.documentElement.classList.contains("reduced-motion")) return;
  const isHomePage = Boolean(document.querySelector("body > main .body"));
  const isTitleNavigation = control.matches(".title .home .bubble, .title .dispense .bubble");
  if (!isHomePage && !isTitleNavigation) return;

  event.preventDefault();
  event.stopImmediatePropagation();
  const controlsToAnimate = isHomePage
    ? document.querySelectorAll(navigationControlSelector)
    : document.querySelectorAll(".title .home .bubble, .title .dispense .bubble");
  const navigationControls = [...controlsToAnimate]
    .filter((candidate) => !candidate.hidden && !candidate.closest("[hidden]"));
  navigationControls.forEach((candidate) => candidate.classList.add("clickFall"));
  let finished = false;
  const finish = () => {
    if (finished) return;
    finished = true;
    if (control.isConnected) {
      clickFallReplay.add(control);
      control.click();
    }
  };
  control.addEventListener("animationend", (animationEvent) => {
    if (animationEvent.target === control && animationEvent.animationName === "homeNavigationFadeAway") finish();
  });
  window.setTimeout(finish, 800);
}, true);

document.addEventListener("click", (event) => {
  if (event.target.closest("#home-Button")) {
    window.location.href = "home.html";
  } else if (event.target.closest("#dispense-Button")) {
    window.location.href = "dispense.html";
  }
});

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

  if (typeof window.startDispensingOverlay === "function" && document.querySelector("#dispensingOverlay")) {
    window.startDispensingOverlay(button.dataset.item, button);
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
  if (typeof window.openLearnMoreItem === "function") {
    window.openLearnMoreItem(item);
    return;
  }
  if (document.querySelector("#dispenseList")) {
    window.location.href = `learnMore.html?item=${encodeURIComponent(item)}`;
    return;
  }
  const query = new URLSearchParams({ item });
  window.location.href = `item.html?${query.toString()}`;
});
