// popup.js
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