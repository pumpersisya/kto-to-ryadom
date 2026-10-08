const cowsay = require("cowsay");

const appName = "Кто-то рядом";
const version = "1.0.0";
const windows = 4;

function showMessage(text) {
  console.log(cowsay.say({ text }));
}

function showThought(text) {
  console.log(cowsay.think({ text }));
}

showMessage(`${appName} v${version} запущено. В радиусе 500 м светится ${windows} окна.`);

showMessage("Welcome!");
showMessage("Loading...");

showThought("Сеанс завершён. Кто-то рядом — уже не рядом.");