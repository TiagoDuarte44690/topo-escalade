// --- DATA ---
const grades = [
  "4a","4a+","4b","4b+","4c","4c+","5a","5a+","5b","5b+","5c","5c+",
  "6a","6a+","6b","6b+","6c","6c+","7a","7a+","7b","7b+","7c","7c+",
  "8a","8a+","8b","8b+","8c","8c+","9a","9a+","9b","9b+","9c","9c+"
];

// --- JSON COMMUN ---
let jsonData = JSON.parse(localStorage.getItem("topoData")) || { voies: [], ouvreurs: [] };
function saveData() { localStorage.setItem("topoData", JSON.stringify(jsonData)); }

// --- UTILITAIRES ---
function median(cotation, votes = []) {
  if(!votes.length) return cotation;
  const all = [cotation, ...votes].map(x => grades.indexOf(x)).sort((a,b)=>a-b);
  return grades[all[Math.floor(all.length/2)]];
}

function createInput(val="", ph="") {
  const i = document.createElement("input");
  i.value = val; i.placeholder = ph; return i;
}

function createSelect(arr, val) {
  const s = document.createElement("select");
  arr.forEach(g=>{
    const o = document.createElement("option");
    o.value = o.text = g;
    if(g===val) o.selected = true;
    s.appendChild(o);
  });
  return s;
}

// --- ROUTES ---
const wall = document.getElementById("wall");

function addRoute(v, container) {
  const div = document.createElement("div");
  div.className = "route";
  div.style.background = v.couleur;
  div.innerHTML = `<span>${v.nom} ${median(v.cotation, v.votes)}</span>`;
  div.onclick = () => openPopup({...v, element: div, container});
  container.appendChild(div);
}

// --- POPUP ---
function openPopup(v={}) {
  const isEdit = !!v.element;
  const overlay = document.createElement("div"); overlay.className="popup-overlay";
  const popup = document.createElement("div"); popup.className="popup";

  // Form row : champs + couleur
  const formRow = document.createElement("div"); formRow.className="form-row";
  const fields = document.createElement("div"); fields.className="fields";

  const inputNom = createInput(v.nom||"","Nom");
  const selectGrade = createSelect(grades, v.cotation);
  const ouvreurInput = createInput(v.ouvreur||"","Ouvreur");

  fields.append(inputNom, selectGrade, ouvreurInput);

  const colorDiv = document.createElement("div"); colorDiv.className="color-picker";
  colorDiv.style.backgroundColor = v.couleur||"#888";

  const colorInput = document.createElement("input");
  colorInput.type = "color"; colorInput.value = v.couleur||"#888";
  colorInput.addEventListener("input", ()=> colorDiv.style.backgroundColor=colorInput.value);
  colorDiv.appendChild(colorInput);

  formRow.append(fields, colorDiv);

  // Votes
  const votes = v.votes||[];
  const votesDiv = document.createElement("div"); votesDiv.className="votes-list";
  function renderVotes(){
    votesDiv.innerHTML = votes.length
      ? votes.map((vote,i)=>`<div>${vote} <button data-i="${i}">×</button></div>`).join("")
      : "<i>Aucun vote</i>";
  }
  renderVotes();
  votesDiv.addEventListener("click", e=>{
    if(e.target.tagName==="BUTTON"){ votes.splice(e.target.dataset.i,1); renderVotes(); }
  });

  // Buttons
  const buttonsRow = document.createElement("div"); buttonsRow.className="buttons-row";

  const saveBtn = document.createElement("button"); saveBtn.className="save"; saveBtn.textContent="Enregistrer";
  saveBtn.onclick = ()=>{
    const newV = {
      nom: inputNom.value||"?",
      cotation: selectGrade.value,
      couleur: colorInput.value,
      colonne: v.colonne,
      ouvreur: ouvreurInput.value||"?",
      dateCreation: v.dateCreation||new Date().toISOString(),
      votes
    };
    if(isEdit){
      Object.assign(v,newV);
      v.element.style.background=newV.couleur;
      v.element.querySelector("span").innerText=`${newV.nom} ${median(newV.cotation,votes)}`;
    } else {
      jsonData.voies.push(newV);
      addRoute(newV,v.container);
    }
    if(!jsonData.ouvreurs.includes(newV.ouvreur)) jsonData.ouvreurs.push(newV.ouvreur);
    saveData();
    overlay.remove();
  };

  const delBtn = document.createElement("button"); delBtn.className="delete"; delBtn.textContent="Supprimer";
  delBtn.onclick = ()=>{
    jsonData.voies = jsonData.voies.filter(x=>x!==v);
    v.element?.remove();
    saveData();
    overlay.remove();
  };

  const closeBtn = document.createElement("button"); closeBtn.className="close"; closeBtn.textContent="Fermer";
  closeBtn.onclick = ()=> overlay.remove();

  buttonsRow.append(saveBtn); if(isEdit) buttonsRow.append(delBtn); buttonsRow.append(closeBtn);

  // Assemble popup
  popup.append(formRow,votesDiv,buttonsRow);
  overlay.appendChild(popup);
  document.body.appendChild(overlay);
}

// --- INIT ---
document.querySelectorAll(".column").forEach(col=>{
  const routesDiv = col.querySelector(".routes");
  col.querySelector(".add-voie-btn").onclick = ()=> openPopup({colonne:+col.dataset.colonne, container:routesDiv});
});

// Reload existing data
jsonData.voies.forEach(v=>{
  const col = wall.querySelector(`.column[data-colonne='${v.colonne}'] .routes`);
  if(col) addRoute(v,col);
});