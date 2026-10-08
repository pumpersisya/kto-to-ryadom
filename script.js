console.log("Radar app loaded");

const chips = document.querySelectorAll(".chip");
chips.forEach(chip => {
  chip.addEventListener("click", () => {
    chips.forEach(c => c.classList.remove("active"));
    chip.classList.add("active");
    console.log("Выбран режим:", chip.textContent.trim());
  });
});

const buttons = document.querySelectorAll(".btn");
buttons.forEach(btn => {
  btn.addEventListener("click", () => {
    const title = btn.closest(".card").querySelector("h3").textContent;
    alert(`Открываем: ${title}`);
  });
});

const navItems = document.querySelectorAll(".navbar .item");
navItems.forEach(item => {
  item.addEventListener("click", () => {
    navItems.forEach(i => i.classList.remove("active"));
    item.classList.add("active");
  });
});