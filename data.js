// data
const grades = ["4a", "4a+", "4b", "4b+", "4c", "4c+", "5a", "5a+", "5b", "5b+", "5c", "5c+",
    "6a", "6a+", "6b", "6b+", "6c", "6c+", "7a", "7a+", "7b", "7b+", "7c", "7c+",
    "8a", "8a+", "8b", "8b+", "8c", "8c+", "9a", "9a+", "9b", "9b+", "9c", "9c+"];

let jsonData = JSON.parse(localStorage.getItem("topoData")) || { voies: [], ouvreurs: [] };

function saveData() {
    localStorage.setItem("topoData", JSON.stringify(jsonData));
}

function median(g, votes = []) {
    if (!votes.length) return g;
    const all = [g, ...votes].map(x => grades.indexOf(x)).sort((a, b) => a - b);
    return grades[all[Math.floor(all.length / 2)]];
}

// elements
function createInput(val = "", ph = "") {
    const i = document.createElement("input");
    i.value = val;
    i.placeholder = ph;
    return i;
}

function createSelect(arr, val) {
    const s = document.createElement("select");
    arr.forEach(g => {
        const o = document.createElement("option");
        o.value = o.innerText = g;
        if (g === val) o.selected = true;
        s.appendChild(o);
    });
    return s;
}

function createColorPalette(val = "#888") {
    const container = document.createElement("div");
    const input = document.createElement("input");
    input.type = "color";
    input.value = val;
    container.appendChild(input);
    return {
        container,
        getValue: () => input.value
    };
}

function createOuvreurSelect(val = "") {
    const container = document.createElement("div");
    const input = document.createElement("input");
    input.placeholder = "Ouvreur";
    input.value = val;
    container.appendChild(input);
    return { container, input };
}

// routes
const wall = document.getElementById("wall");

function addRoute(v, container) {
    const div = document.createElement("div");
    div.className = "route";
    div.style.background = v.couleur;
    div.innerHTML = `<span>${v.nom} ${median(v.cotation, v.votes)}</span>`;
    div.onclick = () => openPopup({ ...v, element: div, container });
    container.appendChild(div);
}


function openPopup(v = {}) {
  const isEdit = !!v.element;

  // overlay
  const overlay = document.createElement("div");
  overlay.className = "popup-overlay";

  // popup
  const popup = document.createElement("div");
  popup.className = "popup";

  // inputs
  const inputNom = document.createElement("input");
  inputNom.placeholder = "Nom";
  inputNom.value = v.nom || "";

  const selectGrade = document.createElement("select");
  grades.forEach(g => {
    const option = document.createElement("option");
    option.value = option.text = g;
    if (g === v.cotation) option.selected = true;
    selectGrade.appendChild(option);
  });

  const colorInput = document.createElement("input");
  colorInput.type = "color";
  colorInput.value = v.couleur || "#888";

  const ouvreurInput = document.createElement("input");
  ouvreurInput.placeholder = "Ouvreur";
  ouvreurInput.value = v.ouvreur || "";

  // votes
  const votes = v.votes || [];
  const votesDiv = document.createElement("div");
  votesDiv.className = "votes-list";
  function renderVotes() {
    votesDiv.innerHTML = votes.length
      ? votes.map((vote, i) => `<div>${vote} <button data-i="${i}">×</button></div>`).join("")
      : "<i>Aucun vote</i>";
  }
  renderVotes();

  votesDiv.addEventListener("click", e => {
    if (e.target.tagName === "BUTTON") {
      votes.splice(e.target.dataset.i, 1);
      renderVotes();
    }
  });

  // buttons
  const saveBtn = document.createElement("button");
  saveBtn.className = "save";
  saveBtn.textContent = "Enregistrer";
  saveBtn.onclick = () => {
    const newV = {
      nom: inputNom.value || "?",
      cotation: selectGrade.value,
      couleur: colorInput.value,
      colonne: v.colonne,
      ouvreur: ouvreurInput.value || "?",
      dateCreation: v.dateCreation || new Date().toISOString(),
      votes
    };

    if (isEdit) {
      Object.assign(v, newV);
      v.element.style.background = newV.couleur;
      v.element.querySelector("span").innerText = `${newV.nom} ${median(newV.cotation, votes)}`;
    } else {
      jsonData.voies.push(newV);
      addRoute(newV, v.container);
    }

    if (!jsonData.ouvreurs.includes(newV.ouvreur)) jsonData.ouvreurs.push(newV.ouvreur);
    saveData();
    overlay.remove();
  };

  const delBtn = document.createElement("button");
  delBtn.className = "delete";
  delBtn.textContent = "Supprimer";
  delBtn.onclick = () => {
    jsonData.voies = jsonData.voies.filter(x => x !== v);
    v.element?.remove();
    saveData();
    overlay.remove();
  };

  const closeBtn = document.createElement("button");
  closeBtn.className = "close";
  closeBtn.textContent = "Fermer";
  closeBtn.onclick = () => overlay.remove();

  // assemble popup
  popup.append(inputNom, selectGrade, colorInput, ouvreurInput, votesDiv, saveBtn);
  if (isEdit) popup.appendChild(delBtn);
  popup.appendChild(closeBtn);

  overlay.appendChild(popup);
  document.body.appendChild(overlay);
}

// init
document.querySelectorAll(".column").forEach(col => {
    const routesDiv = col.querySelector(".routes");
    col.querySelector(".add-voie-btn").onclick = () =>
        openPopup({ colonne: +col.dataset.colonne, container: routesDiv });
});

// reload existing data
jsonData.voies.forEach(v => {
    const col = wall.querySelector(`.column[data-colonne='${v.colonne}'] .routes`);
    if (col) addRoute(v, col);
});