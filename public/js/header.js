// FONT SIZE CONTROL
const govText = document.getElementById("govText");
const govTextMobile = document.getElementById("govTextMobile");
const fontBtns = document.querySelectorAll(".font-btn");

fontBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    const sizeChange = parseInt(btn.dataset.size);
    const currentSize = parseInt(window.getComputedStyle(govText).fontSize);
    const newSize = currentSize + sizeChange * 2;
    govText.style.fontSize = newSize + "px";
    govTextMobile.style.fontSize = newSize * 0.7 + "px";
  });
});

// LANGUAGE TOGGLE
const langToggle = document.getElementById("langToggle");
let isEnglish = true;
langToggle.addEventListener("click", () => {
  if(isEnglish){
    langToggle.textContent = "हिंदी";
    govText.textContent = "भारत सरकार";
    govTextMobile.textContent = "भारत सरकार";
  } else {
    langToggle.textContent = "English";
    govText.textContent = "भारत सरकार / Government Of India";
    govTextMobile.textContent = "भारत सरकार / Government Of India";
  }
  isEnglish = !isEnglish;
});

// SCREEN READER BUTTON
const screenReaderBtn = document.getElementById("screenReader");
screenReaderBtn.addEventListener("click", () => {
  alert("Screen reader mode activated!");
});
