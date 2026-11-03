// JavaScript Document
//buttons
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
    window.location.href = "index.html";
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
