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

// popup
function openPopup(v = {}) {
    const isEdit = !!v.element;
    const overlay = document.createElement("div");
    overlay.className = "popup-overlay";
    const popup = document.createElement("div");
    popup.className = "popup";

    const inputNom = createInput(v.nom, "Nom");
    const selectGrade = createSelect(grades, v.cotation);
    const color = createColorPalette(v.couleur || "#888");
    const ouvreur = createOuvreurSelect(v.ouvreur || "");
    const votes = v.votes || [];
    const votesDiv = document.createElement("div");

    if (isEdit) {
        votesDiv.innerHTML = votes.map((vote, i) => `<div>${vote} <button data-i="${i}">×</button></div>`).join("") || "<i>Aucun vote</i>";
        votesDiv.onclick = e => {
            if (e.target.tagName === "BUTTON") votes.splice(e.target.dataset.i, 1), e.target.parentElement.remove();
        };
    }

    const save = document.createElement("button");
    save.innerText = "Enregistrer";
    save.onclick = () => {
        const newV = {
            nom: inputNom.value || "?",
            cotation: selectGrade.value,
            couleur: color.getValue(),
            colonne: v.colonne,
            ouvreur: ouvreur.input.value || "?",
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

    if (isEdit) {
        const del = document.createElement("button");
        del.innerText = "Supprimer";
        del.onclick = () => {
            jsonData.voies = jsonData.voies.filter(x => x !== v);
            v.element.remove();
            saveData();
            overlay.remove();
        };
        popup.appendChild(del);
    }

    const close = document.createElement("button");
    close.innerText = "Fermer";
    close.onclick = () => overlay.remove();

    popup.append(inputNom, selectGrade, color.container, ouvreur.container, votesDiv, save, close);
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