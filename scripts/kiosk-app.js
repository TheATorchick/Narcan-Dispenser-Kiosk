// Single-document kiosk app. Page views are stored in the HTML templates.
const app = document.querySelector("#app");
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
  const isHomePage = Boolean(app.querySelector(".body"));
  const isTitleNavigation = control.matches(".title .home .bubble, .title .dispense .bubble");
  if (!isHomePage && !isTitleNavigation) return;

  event.preventDefault();
  event.stopImmediatePropagation();
  const controlsToAnimate = isHomePage
    ? document.querySelectorAll(navigationControlSelector)
    : [control];
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
const reducedMotionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
const defaultSiteSettings = {
  mainColor: "#0097a5",
  backgroundColor: "#8cd0d7",
  accentColor: "#008080",
  textColor: "#2d2c33",
  reducedMotion: false
};

let siteSettings = { ...defaultSiteSettings };
let currentItems = {};
let dispenseTimer;
let confirmationTimer;
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

function updateReducedMotion() {
  document.documentElement.classList.toggle(
    "reduced-motion",
    siteSettings.reducedMotion || reducedMotionPreference.matches
  );
}

function applySiteSettings(settings) {
  siteSettings = { ...defaultSiteSettings, ...settings };
  const variables = {
    "--color-main": siteSettings.mainColor,
    "--color-background": siteSettings.backgroundColor,
    "--color-accent": siteSettings.accentColor,
    "--color-text": siteSettings.textColor
  };

  Object.entries(variables).forEach(([name, value]) => {
    if (value) document.documentElement.style.setProperty(name, value);
  });
  updateReducedMotion();
}

try {
  siteSettings = {
    ...defaultSiteSettings,
    ...(JSON.parse(localStorage.getItem("kioskSettings")) || {})
  };
} catch (_) {
  siteSettings = { ...defaultSiteSettings };
}
applySiteSettings(siteSettings);

if (reducedMotionPreference.addEventListener) {
  reducedMotionPreference.addEventListener("change", updateReducedMotion);
} else {
  reducedMotionPreference.addListener(updateReducedMotion);
}

const fallingBackground = document.createElement("div");
fallingBackground.className = "fallingBackground";
fallingBackground.setAttribute("aria-hidden", "true");

function applyMagnifierSettings(image) {
  const size = magnifierBaseSize * Number(image.dataset.sizeFactor);
  const duration = (40 * Number(image.dataset.speedFactor)) / magnifierSpeed;
  image.style.setProperty("--fall-size", `${size}rem`);
  image.style.setProperty("--fall-duration", `${duration}s`);
  image.style.setProperty("--fall-opacity", String(magnifierOpacity / 100));
}

function addFallingMagnifier() {
  const image = document.createElement("img");
  image.src = fallingImageSources[Math.floor(Math.random() * fallingImageSources.length)];
  image.alt = "";
  image.className = "fallingMagnifier";
  image.dataset.sizeFactor = 0.6 + Math.random() * 0.8;
  image.dataset.speedFactor = 0.7 + Math.random() * 0.6;
  image.style.setProperty("--fall-left", `${Math.random() * 100}%`);
  image.style.setProperty("--fall-delay", `${-Math.random() * 50}s`);
  applyMagnifierSettings(image);
  fallingBackground.appendChild(image);
}

function setMagnifierCount(count) {
  while (fallingBackground.children.length > count) {
    fallingBackground.lastElementChild.remove();
  }
  while (fallingBackground.children.length < count) {
    addFallingMagnifier();
  }
}

fallingBackground.addEventListener("animationiteration", (event) => {
  if (event.target.classList.contains("fallingMagnifier")) {
    event.target.style.setProperty("--fall-left", `${Math.random() * 100}%`);
    event.target.src = fallingImageSources[Math.floor(Math.random() * fallingImageSources.length)];
  }
});
document.body.prepend(fallingBackground);
setMagnifierCount(80);

const itemsPromise = fetch("itemInformation.json")
  .then((response) => {
    if (!response.ok) throw new Error("Could not load item information.");
    return response.json();
  })
  .then((items) => {
    currentItems = items;
    return items;
  })
  .catch(() => ({}));

const storedSettings = (() => {
  try {
    const local = localStorage.getItem("kioskSettings");
    if (local) return Promise.resolve(JSON.parse(local));
  } catch (_) {}

  return fetch("settings.json")
    .then((response) => (response.ok ? response.json() : defaultSiteSettings))
    .catch(() => defaultSiteSettings);
})();
storedSettings.then(applySiteSettings);

function currentLocation() {
  const [route = "home", query = ""] = window.location.hash.slice(1).split("?");
  return { route: route || "home", params: new URLSearchParams(query) };
}

function navigate(route, params = {}) {
  const query = new URLSearchParams(params).toString();
  window.location.hash = `#${route}${query ? `?${query}` : ""}`;
}

function useTemplate(name) {
  const template = document.querySelector(`#view-${name}`);
  if (!template) return;
  app.replaceChildren(template.content.cloneNode(true));
  app.classList.remove("pageEntering");
  void app.offsetWidth;
  app.classList.add("pageEntering");
}

function setDocumentTitle(title) {
  document.title = `${title} | Narcan Dispenser Kiosk`;
}

function renderHome() {
  useTemplate("home");
  setDocumentTitle("Home");
  const dialog = app.querySelector("#homeContactDialog");
  const sheet = dialog.querySelector(".itemSheetBubble");
  const form = app.querySelector("#homeContactForm");
  let closeTimer;

  function closeContact() {
    if (!dialog.open) return;
    if (document.documentElement.classList.contains("reduced-motion") || reducedMotionPreference.matches) {
      dialog.close();
      return;
    }
    sheet.classList.add("is-closing");
    closeTimer = window.setTimeout(() => {
      sheet.classList.remove("is-closing");
      dialog.close();
    }, 320);
  }

  app.querySelector("#contact").addEventListener("click", (event) => {
    event.preventDefault();
    window.clearTimeout(closeTimer);
    sheet.classList.remove("is-closing");
    dialog.showModal();
  });
  app.querySelector("#closeHomeContact").addEventListener("click", closeContact);
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) closeContact();
  });
  dialog.addEventListener("cancel", (event) => {
    event.preventDefault();
    closeContact();
  });
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    window.alert("Form submitted");
    form.reset();
    closeContact();
  });
}

function renderAdmin() {
  useTemplate("admin");
  setDocumentTitle("Admin");
}

function renderAbout() {
  useTemplate("about");
  setDocumentTitle("About");
}

function renderContact() {
  useTemplate("contact");
  setDocumentTitle("Contact");
  app.querySelector("#contactForm").addEventListener("submit", (event) => {
    event.preventDefault();
    window.alert("Form submitted");
    event.currentTarget.reset();
    navigate("home");
  });
}

let activeInlineDispensing = null;

function setupInlineDispensing(scope) {
  const overlay = scope.querySelector("#dispensingOverlay");
  if (!overlay) return;
  const spinner = overlay.querySelector(".dispensingSpinner");
  const cancelButton = overlay.querySelector(".dispensingCancel");
  const names = overlay.querySelectorAll("[data-dispensed-item]");
  let opener;
  let closeTimer;

  function closeOverlay() {
    window.clearTimeout(dispenseTimer);
    window.clearTimeout(confirmationTimer);
    if (reducedMotionPreference.matches || document.documentElement.classList.contains("reduced-motion")) {
      overlay.close();
      if (opener?.isConnected) opener.focus();
      return;
    }
    overlay.classList.add("is-closing");
    closeTimer = window.setTimeout(() => {
      overlay.classList.remove("is-closing");
      overlay.close();
      if (opener?.isConnected) opener.focus();
    }, 280);
  }

  cancelButton.addEventListener("click", closeOverlay);
  overlay.addEventListener("cancel", (event) => {
    event.preventDefault();
    closeOverlay();
  });
  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) closeOverlay();
  });

  activeInlineDispensing = (itemName, trigger) => {
    window.clearTimeout(dispenseTimer);
    window.clearTimeout(confirmationTimer);
    window.clearTimeout(closeTimer);
    opener = trigger;
    overlay.classList.remove("is-closing");
    overlay.classList.remove("is-opening");
    spinner.hidden = false;
    cancelButton.hidden = false;
    names.forEach((node) => { node.textContent = itemName; });
    if (!overlay.open) overlay.showModal();
    void overlay.offsetWidth;
    overlay.classList.add("is-opening");
    cancelButton.focus();

    dispenseTimer = window.setTimeout(() => {
      spinner.hidden = true;
      cancelButton.hidden = true;
      confirmationTimer = window.setTimeout(() => {
        window.alert(`${itemName} has been dispensed. Thank you for using the kiosk`);
        showWelcomeScreen();
      }, 150);
    }, 4000);
  };
}

function renderDispense() {
  useTemplate("dispense");
  setDocumentTitle("Dispense");
  const list = app.querySelector("#dispenseList");
  setupInlineDispensing(app);

  itemsPromise.then((items) => {
    if (!list.isConnected) return;
    const dispensables = Object.entries(items).filter(([, item]) => item.category === "Dispensable");
    if (!dispensables.length) {
      list.textContent = "Dispensables could not be loaded.";
      return;
    }

    dispensables.forEach(([key, item], index) => {
      const name = item.name || key;
      const row = document.createElement("div");
      const learnButton = document.createElement("button");
      const learnHeading = document.createElement("h3");
      const dispenseButton = document.createElement("button");
      const dispenseHeading = document.createElement("h3");

      row.className = "dispenseRow";
      row.style.setProperty("--row-fade-delay", `${index * 110}ms`);
      learnButton.className = "bubble learnMoreItemButton";
      learnButton.type = "button";
      learnButton.dataset.item = key;
      learnHeading.textContent = "Learn More";
      learnButton.appendChild(learnHeading);

      dispenseButton.className = "bubble dispenseItemButton";
      dispenseButton.type = "button";
      dispenseButton.dataset.item = name;
      dispenseHeading.textContent = `Dispense ${name}`;
      if (item.imagePath) {
        const image = document.createElement("img");
        image.className = "dispenseItemImage";
        image.alt = "";
        image.src = item.imagePath;
        dispenseButton.append(image, dispenseHeading);
      } else {
        dispenseButton.appendChild(dispenseHeading);
      }

      row.append(learnButton, dispenseButton);
      list.appendChild(row);
    });
  });
}

function renderLearnMore(params = new URLSearchParams()) {
  useTemplate("learn-more");
  setDocumentTitle("Learn More");
  setupInlineDispensing(app);
  const list = app.querySelector("#learnMoreList");
  const search = app.querySelector("#learnMoreSearch");
  const sort = app.querySelector("#learnMoreSort");
  const toggle = app.querySelector("#toggleLearnMoreSearch");
  const itemDialog = app.querySelector("#learnMoreItemDialog");
  const itemSheet = itemDialog.querySelector(".itemSheetBubble");
  const itemName = app.querySelector("#learnMoreItemName");
  const itemDescription = app.querySelector("#learnMoreItemDescription");
  const itemImage = app.querySelector("#learnMoreItemImage");
  const imageLightbox = app.querySelector("#learnMoreImageLightbox");
  const expandedItemImage = app.querySelector("#expandedLearnMoreImage");
  const itemDispensing = app.querySelector("#learnMoreItemDispensing");
  const relatedSection = app.querySelector("#learnMoreRelatedSection");
  const relatedList = app.querySelector("#learnMoreRelatedList");
  const contentDivider = app.querySelector("#learnMoreContentDivider");
  const dispenseDivider = app.querySelector("#learnMoreDispenseDivider");
  let itemCloseTimer;
  let itemIsClosing = false;

  function closeItemInfo() {
    if (!itemDialog.open || itemIsClosing) return;
    if (document.documentElement.classList.contains("reduced-motion") || reducedMotionPreference.matches) {
      itemDialog.close();
      return;
    }

    itemIsClosing = true;
    itemSheet.classList.add("is-closing");
    const finishClosing = (event) => {
      if (event && (event.target !== itemSheet || event.animationName !== "itemInfoSheetDrop")) return;
      window.clearTimeout(itemCloseTimer);
      itemSheet.removeEventListener("animationend", finishClosing);
      itemSheet.classList.remove("is-closing");
      itemIsClosing = false;
      itemDialog.close();
    };
    itemSheet.addEventListener("animationend", finishClosing);
    itemCloseTimer = window.setTimeout(() => finishClosing(), 360);
  }

  function openItemInfo(itemKey) {
    itemIsClosing = false;
    window.clearTimeout(itemCloseTimer);
    itemSheet.classList.remove("is-closing");
    window.scrollTo(0, 0);
    const item = currentItems[itemKey];
    const displayName = item?.name || itemKey;
    itemName.textContent = displayName;
    itemDescription.textContent = item?.description || `Information about ${displayName} will go here.`;
    itemImage.hidden = true;
    itemImage.removeAttribute("src");
    itemDispensing.replaceChildren();
    relatedList.replaceChildren();

    if (item?.imagePath) {
      itemImage.alt = displayName;
      itemImage.onload = () => { itemImage.hidden = false; };
      itemImage.onerror = () => { itemImage.hidden = true; };
      itemImage.src = item.imagePath;
    }

    (item?.dispenses || []).forEach((dispensedName, index) => {
      const button = document.createElement("button");
      const heading = document.createElement("h3");
      button.className = "bubble dispenseItemButton";
      button.type = "button";
      button.dataset.item = dispensedName;
      button.dataset.sourceItem = itemKey;
      button.dataset.dispenseIndex = index;
      heading.textContent = `Dispense ${dispensedName}`;
      button.appendChild(heading);
      itemDispensing.appendChild(button);
    });

    const relatedItems = item?.relatedItems || [];
    relatedItems.forEach((relatedKey) => {
      const relatedItem = currentItems[relatedKey];
      const card = document.createElement("button");
      const imageHolder = document.createElement("span");
      const heading = document.createElement("h3");
      card.className = "bubble relatedInfoCard learnMoreRelatedCard";
      card.type = "button";
      card.dataset.item = relatedKey;
      imageHolder.className = "relatedInfoImage";
      heading.textContent = relatedItem?.name || relatedKey;
      if (relatedItem?.imagePath) {
        const relatedImage = document.createElement("img");
        relatedImage.alt = relatedItem.name || relatedKey;
        relatedImage.onerror = () => { relatedImage.hidden = true; };
        imageHolder.appendChild(relatedImage);
        relatedImage.src = relatedItem.imagePath;
      }
      card.append(imageHolder, heading);
      relatedList.appendChild(card);
    });

    relatedSection.hidden = relatedItems.length === 0;
    const hasDispensing = itemDispensing.children.length > 0;
    const hasRelated = !relatedSection.hidden;
    contentDivider.hidden = !(hasDispensing || hasRelated);
    dispenseDivider.hidden = !(hasDispensing && hasRelated);
    itemSheet.scrollTop = 0;
    if (!itemDialog.open) itemDialog.showModal();
  }

  app.querySelector("#closeLearnMoreItem").addEventListener("click", closeItemInfo);
  itemImage.addEventListener("click", () => {
    if (itemImage.hidden) return;
    expandedItemImage.src = itemImage.src;
    expandedItemImage.alt = itemImage.alt;
    imageLightbox.showModal();
  });
  app.querySelector("#closeLearnMoreImageLightbox").addEventListener("click", () => imageLightbox.close());
  imageLightbox.addEventListener("click", (event) => {
    if (event.target === imageLightbox) imageLightbox.close();
  });
  itemDialog.addEventListener("cancel", (event) => {
    event.preventDefault();
    closeItemInfo();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && itemDialog.open) {
      event.preventDefault();
      closeItemInfo();
    }
  }, true);
  list.addEventListener("click", (event) => {
    const card = event.target.closest(".learnMoreItemButton");
    if (card) {
      event.stopPropagation();
      openItemInfo(card.dataset.item);
    }
  });
  relatedList.addEventListener("click", (event) => {
    const card = event.target.closest(".learnMoreRelatedCard");
    if (card) openItemInfo(card.dataset.item);
  });
  itemDialog.addEventListener("click", (event) => {
    if (event.target === itemDialog) closeItemInfo();
  });

  function renderCards() {
    const term = search.value.trim().toLowerCase();
    const items = Object.entries(currentItems).filter(([key, item]) =>
      [key, item.name, item.category, item.description]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(term)
    );

    items.sort(([keyA, itemA], [keyB, itemB]) => {
      if (sort.value === "category") {
        const categoryOrder = (itemA.category || "Dispensable").localeCompare(itemB.category || "Dispensable");
        if (categoryOrder) return categoryOrder;
      }
      const order = (itemA.name || keyA).localeCompare(itemB.name || keyB);
      return sort.value === "name-desc" ? -order : order;
    });

    list.replaceChildren();
    items.forEach(([key, item], index) => {
      const card = document.createElement("button");
      const name = document.createElement("h2");
      const imageHolder = document.createElement("span");
      const category = document.createElement("h3");
      card.className = "bubble learnMoreBubble learnMoreItemButton";
      card.style.setProperty("--row-fade-delay", `${index * 110}ms`);
      card.type = "button";
      card.dataset.item = key;
      name.textContent = item.name || key;
      imageHolder.className = "learnMoreImagePlaceholder";
      imageHolder.setAttribute("aria-hidden", "true");
      category.textContent = item.category || "Dispensable";
      if (item.imagePath) {
        const image = document.createElement("img");
        image.alt = "";
        image.addEventListener("error", () => { image.hidden = true; }, { once: true });
        imageHolder.appendChild(image);
        image.src = item.imagePath;
      }
      card.append(name, imageHolder, category);
      list.appendChild(card);
    });
  }

  itemsPromise.then(() => {
    if (!list.isConnected) return;
    renderCards();
    const requestedItem = params.get("item");
    if (requestedItem) openItemInfo(requestedItem);
  });
  search.addEventListener("input", renderCards);
  sort.addEventListener("change", renderCards);
  toggle.addEventListener("click", () => {
    const showSearch = search.hidden;
    search.hidden = !showSearch;
    toggle.setAttribute("aria-expanded", String(showSearch));
    toggle.setAttribute("aria-label", showSearch ? "Hide search" : "Show search");
    if (showSearch) search.focus();
    else {
      search.value = "";
      renderCards();
    }
  });
}

function renderItem(itemKey) {
  useTemplate("item");
  setupInlineDispensing(app);
  const itemName = app.querySelector("#itemName");
  const description = app.querySelector("#itemDescription");
  const image = app.querySelector("#itemImage");
  const dispensing = app.querySelector("#itemDispensing");
  const relatedSection = app.querySelector("#relatedItemsSection");
  const relatedList = app.querySelector("#relatedItemsList");
  const contentDivider = app.querySelector("#contentDivider");
  const dispenseDivider = app.querySelector("#dispenseDivider");

  itemsPromise.then((items) => {
    if (!itemName.isConnected) return;
    const item = items[itemKey];
    if (!item) {
      itemName.textContent = itemKey;
      description.textContent = `Information about ${itemKey} will go here.`;
      setDocumentTitle(`${itemKey} Information`);
      return;
    }

    const name = item.name || itemKey;
    itemName.textContent = name;
    description.textContent = item.description || "";
    setDocumentTitle(`${name} Information`);
    if (item.imagePath) {
      image.alt = name;
      image.addEventListener("load", () => { image.hidden = false; }, { once: true });
      image.addEventListener("error", () => { image.hidden = true; }, { once: true });
      image.src = item.imagePath;
    }

    (item.dispenses || []).forEach((dispensedName, index) => {
      const button = document.createElement("button");
      const heading = document.createElement("h3");
      button.className = "bubble dispenseItemButton";
      button.type = "button";
      button.dataset.item = dispensedName;
      button.dataset.sourceItem = itemKey;
      button.dataset.dispenseIndex = index;
      heading.textContent = `Dispense ${dispensedName}`;
      button.appendChild(heading);
      dispensing.appendChild(button);
    });

    if (Array.isArray(item.relatedItems) && item.relatedItems.length) {
      relatedSection.hidden = false;
      item.relatedItems.forEach((relatedName) => {
        const relatedItem = items[relatedName];
        const card = document.createElement("a");
        const imageHolder = document.createElement("span");
        const heading = document.createElement("h3");
        card.className = "bubble relatedInfoCard";
        card.href = `#item?name=${encodeURIComponent(relatedName)}`;
        imageHolder.className = "relatedInfoImage";
        heading.textContent = relatedItem?.name || relatedName;
        if (relatedItem?.imagePath) {
          const relatedImage = document.createElement("img");
          relatedImage.alt = relatedItem.name || relatedName;
          relatedImage.addEventListener("error", () => { relatedImage.hidden = true; }, { once: true });
          imageHolder.appendChild(relatedImage);
          relatedImage.src = relatedItem.imagePath;
        }
        card.append(imageHolder, heading);
        relatedList.appendChild(card);
      });
    }

    const hasDispensing = dispensing.children.length > 0;
    const hasRelated = !relatedSection.hidden;
    contentDivider.hidden = !(hasDispensing || hasRelated);
    dispenseDivider.hidden = !(hasDispensing && hasRelated);
  });

  const dialog = app.querySelector("#itemImageDialog");
  const expandedImage = app.querySelector("#expandedItemImage");
  image.addEventListener("click", () => {
    if (image.hidden) return;
    expandedImage.src = image.src;
    expandedImage.alt = image.alt;
    dialog.showModal();
  });
  app.querySelector("#closeItemImage").addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });
}

function renderDispensing(params) {
  useTemplate("dispensing");
  setDocumentTitle("Dispensing");
  const nameNode = app.querySelector("#dispensedItemName");
  const secondNameNode = app.querySelector("#dispensedItemNameAgain");
  const directItem = params.get("item");
  const source = params.get("source");
  const index = Number.parseInt(params.get("index") || "0", 10);
  const itemNamePromise = directItem
    ? Promise.resolve(directItem)
    : itemsPromise.then((items) => items[source]?.dispenses?.[index] || source || "selected product");
  let canceled = false;

  app.querySelector("#cancelDispensing").addEventListener("click", () => {
    canceled = true;
    window.clearTimeout(dispenseTimer);
    window.clearTimeout(confirmationTimer);
    app.querySelector(".dispensingPanel").classList.add("is-canceling");
    window.setTimeout(() => navigate("dispense"), 250);
  });

  itemNamePromise.then((itemName) => {
    if (canceled || !nameNode.isConnected) return;
    nameNode.textContent = itemName;
    secondNameNode.textContent = itemName;
    setDocumentTitle(`${itemName} Dispensed`);
    dispenseTimer = window.setTimeout(() => {
      app.querySelector(".dispensingSpinner")?.remove();
      confirmationTimer = window.setTimeout(() => {
        window.alert(`${itemName} has been dispensed. Thank you for using the kiosk`);
        showWelcomeScreen();
      }, 150);
    }, 4000);
  });
}

function renderSettings() {
  useTemplate("settings");
  setDocumentTitle("Settings");
  const form = app.querySelector("#settingsForm");
  const status = app.querySelector("#settingsStatus");
  const keys = ["mainColor", "backgroundColor", "accentColor", "textColor"];
  let settingsEdited = false;

  function fillSettings(settings) {
    keys.forEach((key) => {
      if (/^#[\da-f]{6}$/i.test(settings[key] || "")) {
        form.elements[key].value = settings[key];
        app.querySelector(`#${key}Hex`).value = settings[key];
      }
    });
    form.elements.reducedMotion.checked = settings.reducedMotion === true;
  }

  fillSettings(siteSettings);
  keys.forEach((key) => {
    const picker = form.elements[key];
    const hex = app.querySelector(`#${key}Hex`);
    picker.addEventListener("input", () => {
      hex.value = picker.value;
      hex.setCustomValidity("");
      previewSettings();
    });
    hex.addEventListener("input", () => {
      const value = hex.value.trim();
      if (/^#?[\da-f]{6}$/i.test(value)) {
        picker.value = value.startsWith("#") ? value : `#${value}`;
        hex.value = picker.value;
        hex.setCustomValidity("");
      } else {
        hex.setCustomValidity("Enter a six-digit hex color, such as #0097a5.");
      }
      previewSettings();
    });
  });

  function previewSettings() {
    settingsEdited = true;
    const preview = {
      mainColor: form.elements.mainColor.value,
      backgroundColor: form.elements.backgroundColor.value,
      accentColor: form.elements.accentColor.value,
      textColor: form.elements.textColor.value,
      reducedMotion: form.elements.reducedMotion.checked
    };
    applySiteSettings(preview);
  }

  form.addEventListener("input", previewSettings);
  app.querySelector("#defaultSettings").addEventListener("click", () => {
    fillSettings(defaultSiteSettings);
    previewSettings();
    localStorage.setItem("kioskSettings", JSON.stringify(defaultSiteSettings));
    window.location.href = "admin.html";
  });
  app.querySelector("#saveSettings").addEventListener("click", () => {
    const invalid = [...app.querySelectorAll(".hexInput")].find((input) => !input.checkValidity());
    if (invalid) {
      invalid.reportValidity();
      return;
    }
    siteSettings = {
      mainColor: form.elements.mainColor.value,
      backgroundColor: form.elements.backgroundColor.value,
      accentColor: form.elements.accentColor.value,
      textColor: form.elements.textColor.value,
      reducedMotion: form.elements.reducedMotion.checked
    };
    try {
      localStorage.setItem("kioskSettings", JSON.stringify(siteSettings));
      status.textContent = "Settings saved in this browser for this site.";
    } catch (_) {
      status.textContent = "Your browser could not save settings locally.";
    }
  });
  storedSettings.then((settings) => {
    if (form.isConnected && !settingsEdited) fillSettings(settings);
  });
}

function renderBackground() {
  useTemplate("background");
  setDocumentTitle("Background Test");
  const count = app.querySelector("#magnifierCount");
  const speed = app.querySelector("#magnifierSpeed");
  const size = app.querySelector("#magnifierSize");
  const opacity = app.querySelector("#magnifierOpacity");
  const controls = app.querySelector(".backgroundControls");
  const hide = app.querySelector("#hideBackgroundSettings");
  const show = app.querySelector("#showBackgroundSettings");

  count.addEventListener("input", () => {
    app.querySelector("#magnifierCountValue").textContent = count.value;
    setMagnifierCount(Number(count.value));
  });
  speed.addEventListener("input", () => {
    magnifierSpeed = Number(speed.value);
    app.querySelector("#magnifierSpeedValue").textContent = `${magnifierSpeed}×`;
    fallingBackground.querySelectorAll(".fallingMagnifier").forEach(applyMagnifierSettings);
  });
  size.addEventListener("input", () => {
    magnifierBaseSize = Number(size.value);
    app.querySelector("#magnifierSizeValue").textContent = `${magnifierBaseSize}rem`;
    fallingBackground.querySelectorAll(".fallingMagnifier").forEach(applyMagnifierSettings);
  });
  opacity.addEventListener("input", () => {
    magnifierOpacity = Number(opacity.value);
    app.querySelector("#magnifierOpacityValue").textContent = `${magnifierOpacity}%`;
    fallingBackground.querySelectorAll(".fallingMagnifier").forEach(applyMagnifierSettings);
  });
  app.querySelector("#backgroundDefaults").addEventListener("click", () => {
    [[count, 80], [speed, 1], [size, 2.5], [opacity, 14]].forEach(([input, value]) => {
      input.value = value;
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });
  });

  hide.addEventListener("click", () => {
    const reduced = document.documentElement.classList.contains("reduced-motion") || reducedMotionPreference.matches;
    if (reduced) {
      controls.hidden = true;
      show.hidden = false;
    } else {
      controls.classList.add("is-closing");
    }
  });
  show.addEventListener("click", () => {
    controls.hidden = false;
    controls.classList.remove("is-closing");
    show.hidden = true;
    controls.classList.add("is-opening");
  });
  controls.addEventListener("animationend", (event) => {
    if (event.animationName === "backgroundPanelExpand") {
      controls.classList.remove("is-opening");
    } else if (event.animationName === "backgroundPanelCollapse") {
      controls.classList.remove("is-closing");
      controls.hidden = true;
      show.hidden = false;
    }
  });
}

function renderRoute() {
  window.clearTimeout(dispenseTimer);
  window.clearTimeout(confirmationTimer);
  activeInlineDispensing = null;
  window.scrollTo(0, 0);
  const { route, params } = currentLocation();
  switch (route) {
    case "home": renderHome(); break;
    case "admin": renderAdmin(); break;
    case "about": renderAbout(); break;
    case "background": renderBackground(); break;
    case "settings": renderSettings(); break;
    case "contact": renderContact(); break;
    case "dispense": renderDispense(); break;
    case "learn-more": renderLearnMore(params); break;
    case "item": renderItem(params.get("name") || "Dispensable"); break;
    case "dispensing": renderDispensing(params); break;
    default: navigate("home"); return;
  }
}

app.addEventListener("click", (event) => {
  const footerToggle = event.target.closest(".footerReveal");
  if (footerToggle) {
    const links = app.querySelector("#footerLinks");
    const show = links.hidden;
    links.hidden = !show;
    footerToggle.setAttribute("aria-expanded", String(show));
    footerToggle.setAttribute("aria-label", show ? "Hide footer links" : "Show footer links");
    return;
  }

  const learnButton = event.target.closest(".learnMoreItemButton");
  if (learnButton) {
    if (app.querySelector("#dispenseList")) {
      navigate("learn-more", { item: learnButton.dataset.item });
    } else {
      navigate("item", { name: learnButton.dataset.item });
    }
    return;
  }

  const dispenseButton = event.target.closest(".dispenseItemButton");
  if (dispenseButton) {
    if (activeInlineDispensing) {
      activeInlineDispensing(dispenseButton.dataset.item, dispenseButton);
    } else if (dispenseButton.dataset.sourceItem) {
      navigate("dispensing", {
        source: dispenseButton.dataset.sourceItem,
        index: dispenseButton.dataset.dispenseIndex || "0"
      });
    } else {
      navigate("dispensing", { item: dispenseButton.dataset.item });
    }
  }
});

function showWelcomeScreen() {
  window.clearTimeout(dispenseTimer);
  window.clearTimeout(confirmationTimer);
  window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}#home`);
  renderHome();
  welcomeScreen.hidden = false;
  document.body.classList.add("welcome-active");
}

function dismissWelcome() {
  const welcome = document.querySelector("#welcomeScreen");
  if (!welcome || welcome.classList.contains("is-leaving")) return;
  let dismissed = false;
  let fallbackTimer;

  const finish = () => {
    if (dismissed) return;
    dismissed = true;
    window.clearTimeout(fallbackTimer);
    welcome.hidden = true;
    welcome.classList.remove("is-leaving");
    document.body.classList.remove("welcome-active");
    window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}#home`);
    renderRoute();
  };

  welcome.addEventListener("animationend", finish, { once: true });
  welcome.classList.add("is-leaving");
  if (document.documentElement.classList.contains("reduced-motion") || reducedMotionPreference.matches) {
    finish();
  } else {
    fallbackTimer = window.setTimeout(finish, 550);
  }
}

const welcomeScreen = document.querySelector("#welcomeScreen");
welcomeScreen.addEventListener("click", dismissWelcome);
welcomeScreen.addEventListener("keydown", (event) => {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    dismissWelcome();
  }
});

window.addEventListener("hashchange", renderRoute);
if (!window.location.hash) window.location.hash = "#home";
else renderRoute();
