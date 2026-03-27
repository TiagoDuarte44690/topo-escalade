const wall = document.getElementById("wall");
const grades = ["5a","5b","5c","6a","6a+","6b","6b+","6c","6c+","7a","7a+","7b","7b+","7c","7c+","8a","8a+","8b","8b+","8c","8c+","9a"];
let jsonData = { voies: [], ouvreurs: [] };

// --- Récupération depuis localStorage ---
const savedData = localStorage.getItem("topoData");
if(savedData) {
  jsonData = JSON.parse(savedData);
  // Migration des données existantes
  jsonData.voies = jsonData.voies.map(v => ({
    ...v,
    dateCreation: v.dateCreation || new Date().toISOString(),
    votes: v.votes || []
  }));
}

// --- créer 21 colonnes sur une seule ligne ---
for(let i=0;i<21;i++){
  const col = document.createElement("div");
  col.className="column";
  col.dataset.colonne=i+1;

  const title = document.createElement("h3");
  title.innerText = `Voie ${i+1}`;
  col.appendChild(title);

  const routesDiv = document.createElement("div");
  routesDiv.className="routes";
  col.appendChild(routesDiv);

  const addBtn = document.createElement("button");
  addBtn.type = "button";
  addBtn.className="add-voie-btn";
  addBtn.innerText="Ajouter Voie";
  addBtn.onclick = () => openPopupAjout(routesDiv, i+1);
  col.appendChild(addBtn);

  wall.appendChild(col);
}

// --- Recréer les voies depuis jsonData ---
jsonData.voies.forEach(v=>{
  const col = wall.querySelector(`.column[data-colonne='${v.colonne}'] .routes`);
  if(col) addRoute(col, v.nom, v.cotation, v.couleur, v.colonne, v.ouvreur, v.dateCreation, v.votes);
});

// --- Ajouter une route ---
function addRoute(container, nom, grade, couleur, colonne, ouvreur, dateCreation, votes = []){
  const route = document.createElement("div");
  route.className = "route";
  route.style.backgroundColor = couleur;
  route.dataset.nom = nom;
  route.dataset.colonne = colonne;

  const text = document.createElement("span");
  text.innerText = `${nom} ${getAverageGrade(grade, votes)}`;

  // Clic sur la voie pour voir les détails
  route.onclick = () => openPopupDetails(route, nom, grade, couleur, colonne, ouvreur, dateCreation, votes);

  route.appendChild(text);
  container.appendChild(route);
}

// --- Popup détails d'une voie ---
function openPopupDetails(routeDiv, nom, grade, couleur, colonne, ouvreur, dateCreation, votes, isEditMode = false) {
  const overlay = document.createElement("div");
  overlay.className = "popup-overlay";

  const popup = document.createElement("div");
  popup.className = "popup popup-details";

  // Header avec titre et bouton édition
  const header = document.createElement("div");
  header.className = "popup-header";
  
  const title = document.createElement("h3");
  title.innerText = nom;
  title.style.margin = "0";
  title.style.color = couleur;
  title.style.flex = "1";
  
  const editBtn = document.createElement("button");
  editBtn.className = "edit-mode-btn";
  editBtn.innerHTML = "✏️";
  editBtn.title = "Mode édition";
  editBtn.onclick = () => {
    overlay.remove();
    openPopupDetails(routeDiv, nom, grade, couleur, colonne, ouvreur, dateCreation, votes, true);
  };
  
  header.appendChild(title);
  header.appendChild(editBtn);

  // Informations
  const infoDiv = document.createElement("div");
  infoDiv.style.marginBottom = "15px";

  const ouvreurInfo = document.createElement("p");
  ouvreurInfo.innerHTML = `<strong>Ouvreur:</strong> ${ouvreur}`;
  
  const dateInfo = document.createElement("p");
  const date = new Date(dateCreation).toLocaleDateString('fr-FR');
  dateInfo.innerHTML = `<strong>Date de création:</strong> ${date}`;
  
  const originalGradeInfo = document.createElement("p");
  originalGradeInfo.innerHTML = `<strong>Cotation originale:</strong> ${grade}`;
  
  const averageGradeInfo = document.createElement("p");
  const averageGrade = getAverageGrade(grade, votes);
  averageGradeInfo.innerHTML = `<strong>Cotation moyenne:</strong> ${averageGrade} ${votes.length > 0 ? `(sur ${votes.length + 1} vote${votes.length > 0 ? 's' : ''})` : '(aucun vote)'}`;

  infoDiv.appendChild(ouvreurInfo);
  infoDiv.appendChild(dateInfo);
  infoDiv.appendChild(originalGradeInfo);
  infoDiv.appendChild(averageGradeInfo);

  // Section édition (si en mode édition)
  let editSection = null;
  if (isEditMode) {
    editSection = createEditSection(routeDiv, nom, grade, couleur, colonne, ouvreur, dateCreation, votes, overlay);
  }

  // Section vote (si pas en mode édition)
  let voteDiv = null;
  if (!isEditMode) {
    voteDiv = document.createElement("div");
    voteDiv.style.marginBottom = "15px";
    
    const voteTitle = document.createElement("h4");
    voteTitle.innerText = "Donner votre avis sur la cotation";
    voteTitle.style.marginBottom = "10px";
    
    const voteSelect = document.createElement("select");
    voteSelect.style.width = "100%";
    voteSelect.style.marginBottom = "10px";
    const defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.innerText = "Sélectionnez une cotation";
    voteSelect.appendChild(defaultOption);
    grades.forEach(g => {
      const opt = document.createElement("option");
      opt.value = g;
      opt.innerText = g;
      voteSelect.appendChild(opt);
    });

    const voteBtn = document.createElement("button");
    voteBtn.type = "button";
    voteBtn.innerText = "Voter";
    voteBtn.style.width = "100%";
    voteBtn.onclick = () => {
      const selectedVote = voteSelect.value.trim();
      if (!selectedVote) return;

      const routeName = routeDiv.dataset.nom || nom;
      const voie = jsonData.voies.find(v => String(v.colonne) === String(colonne) && String(v.nom) === String(routeName));
      if (!voie) {
        alert("Impossible de trouver la voie pour enregistrer votre vote.");
        return;
      }
      voie.votes = Array.isArray(voie.votes) ? voie.votes : [];
      voie.votes.push(selectedVote);
      saveData();

      // Mettre à jour l'affichage
      const textSpan = routeDiv.querySelector("span");
      textSpan.innerText = `${routeName} ${getAverageGrade(grade, voie.votes)}`;
      overlay.remove();
      openPopupDetails(routeDiv, routeName, grade, couleur, colonne, ouvreur, dateCreation, voie.votes);
    };

    voteDiv.appendChild(voteTitle);
    voteDiv.appendChild(voteSelect);
    voteDiv.appendChild(voteBtn);
  }

  // Bouton fermer
  const closeBtn = document.createElement("button");
  closeBtn.type = "button";
  closeBtn.innerText = isEditMode ? "Annuler" : "Fermer";
  closeBtn.onclick = () => overlay.remove();

  popup.appendChild(header);
  popup.appendChild(infoDiv);
  if (editSection) popup.appendChild(editSection);
  if (voteDiv) popup.appendChild(voteDiv);
  popup.appendChild(closeBtn);

  overlay.appendChild(popup);
  document.body.appendChild(overlay);
}

// --- Fonction pour créer la section d'édition ---
function createEditSection(routeDiv, nom, grade, couleur, colonne, ouvreur, dateCreation, votes, overlay) {
  const editDiv = document.createElement("div");
  editDiv.className = "edit-section";
  editDiv.style.marginBottom = "15px";
  editDiv.style.border = "1px solid #ddd";
  editDiv.style.borderRadius = "8px";
  editDiv.style.padding = "15px";
  editDiv.style.background = "#f9f9f9";

  const editTitle = document.createElement("h4");
  editTitle.innerText = "Mode édition";
  editTitle.style.marginTop = "0";
  editTitle.style.color = "#333";
  editDiv.appendChild(editTitle);

  // Nom
  const nomLabel = document.createElement("label");
  nomLabel.innerText = "Nom de la voie:";
  nomLabel.style.display = "block";
  nomLabel.style.marginBottom = "5px";
  const inputNom = document.createElement("input");
  inputNom.type = "text";
  inputNom.value = nom;
  inputNom.style.width = "100%";
  inputNom.style.marginBottom = "10px";

  // Cotation originale
  const gradeLabel = document.createElement("label");
  gradeLabel.innerText = "Cotation originale:";
  gradeLabel.style.display = "block";
  gradeLabel.style.marginBottom = "5px";
  const selectGrade = document.createElement("select");
  selectGrade.style.width = "100%";
  selectGrade.style.marginBottom = "10px";
  grades.forEach(g => {
    const opt = document.createElement("option");
    opt.value = g;
    opt.innerText = g;
    if (g === grade) opt.selected = true;
    selectGrade.appendChild(opt);
  });

  // Couleur
  const colorLabel = document.createElement("label");
  colorLabel.innerText = "Couleur:";
  colorLabel.style.display = "block";
  colorLabel.style.marginBottom = "5px";
  const colorPalette = createColorPalette(couleur);
  colorPalette.container.style.marginBottom = "10px";

  // Ouvreur
  const ouvreurLabel = document.createElement("label");
  ouvreurLabel.innerText = "Ouvreur:";
  ouvreurLabel.style.display = "block";
  ouvreurLabel.style.marginBottom = "5px";
  const ouvreurSelect = createOuvreurSelect(ouvreur);
  ouvreurSelect.container.style.marginBottom = "10px";

  // Gestion des votes
  const votesLabel = document.createElement("label");
  votesLabel.innerText = "Votes reçus:";
  votesLabel.style.display = "block";
  votesLabel.style.marginBottom = "5px";
  
  const votesDiv = document.createElement("div");
  votesDiv.style.marginBottom = "10px";
  votesDiv.style.maxHeight = "100px";
  votesDiv.style.overflowY = "auto";
  votesDiv.style.border = "1px solid #ccc";
  votesDiv.style.borderRadius = "4px";
  votesDiv.style.padding = "5px";
  
  if (votes.length === 0) {
    votesDiv.innerText = "Aucun vote";
    votesDiv.style.fontStyle = "italic";
    votesDiv.style.color = "#999";
  } else {
    votes.forEach((vote, index) => {
      const voteItem = document.createElement("div");
      voteItem.style.display = "flex";
      voteItem.style.justifyContent = "space-between";
      voteItem.style.alignItems = "center";
      voteItem.style.padding = "2px 0";
      
      const voteText = document.createElement("span");
      voteText.innerText = vote;
      
      const deleteBtn = document.createElement("button");
      deleteBtn.type = "button";
      deleteBtn.innerText = "×";
      deleteBtn.style.border = "none";
      deleteBtn.style.background = "#ff4444";
      deleteBtn.style.color = "white";
      deleteBtn.style.borderRadius = "50%";
      deleteBtn.style.width = "24px";
      deleteBtn.style.height = "24px";
      deleteBtn.style.cursor = "pointer";
      deleteBtn.style.fontSize = "14px";
      deleteBtn.style.display = "inline-flex";
      deleteBtn.style.justifyContent = "center";
      deleteBtn.style.alignItems = "center";
      deleteBtn.style.padding = "0";
      deleteBtn.style.lineHeight = "1";
      deleteBtn.style.flexShrink = "0";
      deleteBtn.onclick = () => {
        const voteIndex = votes.indexOf(vote);
        if (voteIndex !== -1) {
          votes.splice(voteIndex, 1);
        }
        voteItem.remove();
        if (votes.length === 0) {
          votesDiv.innerHTML = '<span style="font-style: italic; color: #999;">Aucun vote</span>';
        }
      };
      
      voteItem.appendChild(voteText);
      voteItem.appendChild(deleteBtn);
      votesDiv.appendChild(voteItem);
    });
  }

  // Boutons
  const btnDiv = document.createElement("div");
  btnDiv.style.display = "flex";
  btnDiv.style.gap = "10px";
  btnDiv.style.marginTop = "15px";

  const btnSave = document.createElement("button");
  btnSave.type = "button";
  btnSave.innerText = "Enregistrer";
  btnSave.style.flex = "1";
  btnSave.onclick = () => {
    const newNom = inputNom.value || "?";
    const newGrade = selectGrade.value;
    const newOuvreur = ouvreurSelect.input.value || "?";
    const newCouleur = colorPalette.getValue();

    // Mettre à jour les données
    const voie = jsonData.voies.find(v => v.colonne === colonne && v.nom === nom);
    if (voie) {
      voie.nom = newNom;
      voie.cotation = newGrade;
      voie.ouvreur = newOuvreur;
      voie.couleur = newCouleur;
      voie.votes = votes; // votes déjà modifiés par les suppressions

      // Ajouter l'ouvreur à la base s'il n'existe pas
      if (newOuvreur && newOuvreur !== "?" && !jsonData.ouvreurs.includes(newOuvreur)) {
        jsonData.ouvreurs.push(newOuvreur);
      }
    }

    // Mettre à jour l'affichage
    routeDiv.style.backgroundColor = newCouleur;
    routeDiv.dataset.nom = newNom;
    const textSpan = routeDiv.querySelector("span");
    textSpan.innerText = `${newNom} ${getAverageGrade(newGrade, votes)}`;

    saveData();
    overlay.remove();
  };

  const btnDelete = document.createElement("button");
  btnDelete.type = "button";
  btnDelete.innerText = "Supprimer";
  btnDelete.style.background = "#ff4444";
  btnDelete.style.color = "white";
  btnDelete.onclick = () => {
    if (confirm("Êtes-vous sûr de vouloir supprimer cette voie ?")) {
      // Supprimer de jsonData
      jsonData.voies = jsonData.voies.filter(v => !(v.colonne === colonne && v.nom === nom));
      // Supprimer de l'affichage
      routeDiv.remove();
      saveData();
      overlay.remove();
    }
  };

  btnDiv.appendChild(btnSave);
  btnDiv.appendChild(btnDelete);

  // Assembler
  editDiv.appendChild(nomLabel);
  editDiv.appendChild(inputNom);
  editDiv.appendChild(gradeLabel);
  editDiv.appendChild(selectGrade);
  editDiv.appendChild(colorLabel);
  editDiv.appendChild(colorPalette.container);
  editDiv.appendChild(ouvreurLabel);
  editDiv.appendChild(ouvreurSelect.container);
  editDiv.appendChild(votesLabel);
  editDiv.appendChild(votesDiv);
  editDiv.appendChild(btnDiv);

  return editDiv;
}
function openPopupAjout(routesDiv, colonne){
  const overlay = document.createElement("div");
  overlay.className = "popup-overlay";

  const popup = document.createElement("div");
  popup.className = "popup";

  // Nom de la voie
  const inputNom = document.createElement("input");
  inputNom.placeholder = "Nom de la voie";

  // Cotation
  const selectGrade = document.createElement("select");
  grades.forEach(g => {
    const opt = document.createElement("option");
    opt.value = g; opt.innerText = g;
    selectGrade.appendChild(opt);
  });

  // Couleur
  const colorLabel = document.createElement("label");
  colorLabel.innerText = "Couleur:";
  colorLabel.style.display = "block";
  colorLabel.style.marginBottom = "5px";
  const colorPalette = createColorPalette("#888888");
  colorPalette.container.style.marginBottom = "10px";

  // Ouvreur - custom select
  const ouvreurSelect = createOuvreurSelect("");

  // Boutons
  const btnAdd = document.createElement("button");
  btnAdd.type="button";
  btnAdd.innerText="Ajouter";
  btnAdd.onclick = () => {
    const nom = inputNom.value || "?";
    const grade = selectGrade.value;
    const ouvreur = ouvreurSelect.input.value || "?";
    const dateCreation = new Date().toISOString();

    if(routesDiv.children.length >= 6){ alert("Max 6 voies !"); return; }

    addRoute(routesDiv, nom, grade, colorPalette.getValue(), colonne, ouvreur, dateCreation);

    // Ajouter l'ouvreur à la base s'il n'existe pas
    if(ouvreur && ouvreur !== "?" && !jsonData.ouvreurs.includes(ouvreur)){
      jsonData.ouvreurs.push(ouvreur);
    }

    jsonData.voies.push({
      nom, 
      cotation: grade, 
      couleur: colorPalette.getValue(), 
      colonne, 
      ouvreur,
      dateCreation,
      votes: []
    });
    saveData();
    overlay.remove();
  };

  const btnCancel = document.createElement("button");
  btnCancel.type="button";
  btnCancel.innerText="Cancel";
  btnCancel.onclick = () => overlay.remove();

  const btnDiv = document.createElement("div");
  btnDiv.className = "popup-buttons";
  btnDiv.appendChild(btnAdd);
  btnDiv.appendChild(btnCancel);

  // Ajouter tout au popup
  popup.appendChild(inputNom);
  popup.appendChild(selectGrade);
  popup.appendChild(colorLabel);
  popup.appendChild(colorPalette.container);
  popup.appendChild(ouvreurSelect.container);
  popup.appendChild(btnDiv);

  overlay.appendChild(popup);
  document.body.appendChild(overlay);
}

// --- Utils ---
function getAverageGrade(originalGrade, votes) {
  if (votes.length === 0) return originalGrade;

  const allGrades = [originalGrade, ...votes];
  const gradeValues = allGrades
    .map(g => grades.indexOf(g))
    .filter(i => i !== -1)
    .sort((a, b) => a - b);

  if (gradeValues.length === 0) return originalGrade;

  const middle = Math.floor(gradeValues.length / 2);
  return grades[gradeValues[middle]] || originalGrade;
}

function createOuvreurSelect(initialValue = "") {
  const container = document.createElement("div");
  container.className = "custom-select-container";

  const input = document.createElement("input");
  input.type = "text";
  input.className = "custom-select-input";
  input.placeholder = "Nom de l'ouvreur";
  input.value = initialValue;

  const dropdown = document.createElement("div");
  dropdown.className = "custom-select-dropdown";
  dropdown.style.display = "none";

  function updateDropdown() {
    dropdown.innerHTML = "";
    const searchText = input.value.toLowerCase();
    
    const filtered = jsonData.ouvreurs
      .filter(o => o.toLowerCase().includes(searchText))
      .sort((a, b) => a.localeCompare(b));

    if (filtered.length === 0 && searchText) {
      const option = document.createElement("div");
      option.className = "custom-select-option";
      option.style.fontStyle = "italic";
      option.style.color = "#999";
      option.innerText = `Ajouter "${input.value}"`;
      option.onclick = () => {
        input.value = input.value;
        dropdown.style.display = "none";
      };
      dropdown.appendChild(option);
    } else {
      filtered.forEach(o => {
        const option = document.createElement("div");
        option.className = "custom-select-option";
        if (o === input.value) option.classList.add("selected");
        option.innerText = o;
        option.onclick = () => {
          input.value = o;
          dropdown.style.display = "none";
        };
        dropdown.appendChild(option);
      });
    }
  }

  input.addEventListener("focus", () => {
    dropdown.style.display = "block";
    updateDropdown();
  });

  input.addEventListener("input", () => {
    dropdown.style.display = "block";
    updateDropdown();
  });

  document.addEventListener("click", (e) => {
    if (!container.contains(e.target)) {
      dropdown.style.display = "none";
    }
  });

  container.appendChild(input);
  container.appendChild(dropdown);
  
  return { container, input, dropdown };
}
function hslToHex(h, s, l) {
  s /= 100;
  l /= 100;
  const k = n => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = n => {
    const color = l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

function hexToHsl(hex) {
  const fullHex = hex.replace('#', '');
  const r = parseInt(fullHex.slice(0,2), 16) / 255;
  const g = parseInt(fullHex.slice(2,4), 16) / 255;
  const b = parseInt(fullHex.slice(4,6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  const l = (max + min) / 2;
  const d = max - min;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  if (d !== 0) {
    switch (max) {
      case r: h = ((g - b) / d) % 6; break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h = Math.round(h * 60);
    if (h < 0) h += 360;
  }
  return [h, Math.round(s * 100), Math.round(l * 100)];
}

function createColorPalette(initialColor = "#888888") {
  const [initialHue, , initialIntensity] = hexToHsl(initialColor);
  let hue = initialHue;
  let saturation = 90;
  let intensity = initialIntensity;
  let selectedColor = hslToHex(hue, saturation, intensity);

  const container = document.createElement('div');
  container.className = 'color-palette';

  const preview = document.createElement('div');
  preview.className = 'color-preview';
  preview.style.background = selectedColor;
  container.appendChild(preview);

  const hueLabel = document.createElement('label');
  hueLabel.innerText = 'Couleur';
  hueLabel.className = 'color-label';
  container.appendChild(hueLabel);

  const hueSlider = document.createElement('input');
  hueSlider.type = 'range';
  hueSlider.min = 0;
  hueSlider.max = 360;
  hueSlider.value = hue;
  hueSlider.className = 'color-slider color-slider-hue';
  hueSlider.oninput = () => {
    hue = Number(hueSlider.value);
    selectedColor = hslToHex(hue, saturation, intensity);
    preview.style.background = selectedColor;
    intensitySlider.style.background = getIntensityGradient(hue, saturation);
  };
  container.appendChild(hueSlider);

  const intensityLabel = document.createElement('label');
  intensityLabel.innerText = 'Intensité';
  intensityLabel.className = 'color-label';
  container.appendChild(intensityLabel);

  const intensitySlider = document.createElement('input');
  intensitySlider.type = 'range';
  intensitySlider.min = 15;
  intensitySlider.max = 85;
  intensitySlider.value = intensity;
  intensitySlider.className = 'color-slider color-slider-intensity';
  intensitySlider.oninput = () => {
    intensity = Number(intensitySlider.value);
    selectedColor = hslToHex(hue, saturation, intensity);
    preview.style.background = selectedColor;
  };
  intensitySlider.style.background = getIntensityGradient(hue, saturation);
  container.appendChild(intensitySlider);

  function getIntensityGradient(hueValue, saturationValue) {
    return `linear-gradient(90deg, hsl(${hueValue}, ${saturationValue}%, 15%), hsl(${hueValue}, ${saturationValue}%, 50%), hsl(${hueValue}, ${saturationValue}%, 85%))`;
  }

  function updatePreview(color) {
    preview.style.background = color;
  }

  return {
    container,
    getValue: () => selectedColor,
    setValue: (color) => {
      const [newHue, , newIntensity] = hexToHsl(color);
      hue = newHue;
      intensity = newIntensity;
      selectedColor = color;
      hueSlider.value = hue;
      intensitySlider.value = intensity;
      hueSlider.style.background = 'linear-gradient(90deg, red, yellow, lime, aqua, blue, magenta, red)';
      intensitySlider.style.background = getIntensityGradient(hue, saturation);
      updatePreview(color);
    }
  };
}
function rgbToHex(rgb){
  if(!rgb) return "#888888";
  const result = rgb.match(/\d+/g);
  if(!result || result.length<3) return "#888888";
  return "#" + result.slice(0,3).map(x=>{ const h=parseInt(x).toString(16); return h.length===1?"0"+h:h }).join("");
}

// --- Sauvegarde JSON dans localStorage ---
function saveData(){
  localStorage.setItem("topoData", JSON.stringify(jsonData));
}