// JavaScript Document
//buttons
//Dispense Button
const dispenseButton = document.querySelector("#dispense-Button");
const homeButton = document.querySelector("#home-Button");

dispenseButton.addEventListener("click", () => {
  window.location.href = "dispense.html";
});

homeButton.addEventListener("click", () => {
  window.location.href = "index.html";
});