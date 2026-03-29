// === CONFIGURATION API ===
const API_URL = "/api/topoData"; // endpoint Vercel

// === GRADES ===
const grades = ["4a","4a+","4b","4b+","4c","4c+",
"5a","5a+","5b","5b+","5c","5c+",
"6a","6a+","6b","6b+","6c","6c+",
"7a","7a+","7b","7b+","7c","7c+",
"8a","8a+","8b","8b+","8c","8c+",
"9a","9a+","9b","9b+","9c","9c+"];

// === VARIABLES ===
let jsonData = { voies: [], ouvreurs: [] };

// === UTILITAIRES ===
function median(cotation, votes = []) {
  if(!votes.length) return cotation;
  const all = [cotation, ...votes].map(x=>grades.indexOf(x)).sort((a,b)=>a-b);
  return grades[Math.floor(all.length/2)];
}

// === FONCTIONS API ===
async function loadData() {
  const res = await fetch(API_URL);
  jsonData = await res.json();
  return jsonData;
}

async function saveData() {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(jsonData)
  });
  jsonData = await res.json();
}

// === ROUTES DOM ===
const wall = document.getElementById("wall");

function addRoute(v, container) {
  const div = document.createElement("div");
  div.className = "route";
  div.style.background = v.couleur;
  div.innerHTML = `<span>${v.nom} ${median(v.cotation,v.votes)}</span>`;
  div.onclick = () => openPopup({...v, element: div, container});
  container.appendChild(div);
}

// === POPUP ===
function openPopup(v = {}) {
  const isEdit = !!v.element;

  const overlay = document.createElement("div");
  overlay.className = "popup-overlay";

  const popup = document.createElement("div");
  popup.className = "popup";

  // --- Form fields ---
  const inputNom = document.createElement("input");
  inputNom.placeholder = "Nom";
  inputNom.value = v.nom || "";

  const selectGrade = document.createElement("select");
  grades.forEach(g => {
    const opt = document.createElement("option");
    opt.value = opt.text = g;
    if(g===v.cotation) opt.selected=true;
    selectGrade.appendChild(opt);
  });

  const ouvreurInput = document.createElement("input");
  ouvreurInput.placeholder = "Ouvreur";
  ouvreurInput.value = v.ouvreur || "";

  // Couleur intégrée dans le formulaire
  const colorInput = document.createElement("input");
  colorInput.type = "color";
  colorInput.value = v.couleur || "#888";

  // --- Votes ---
  const votes = v.votes||[];
  const votesDiv = document.createElement("div");
  votesDiv.className = "votes-list";

  function renderVotes() {
    votesDiv.innerHTML = votes.length
      ? votes.map((vote,i)=>`<div>${vote} <button data-i="${i}">×</button></div>`).join("")
      : "<i>Aucun vote</i>";
  }
  renderVotes();

  votesDiv.addEventListener("click", e=>{
    if(e.target.tagName==="BUTTON"){
      votes.splice(e.target.dataset.i,1);
      renderVotes();
    }
  });

  // --- Buttons ---
  const saveBtn = document.createElement("button");
  saveBtn.className = "save";
  saveBtn.textContent = "Enregistrer";
  saveBtn.onclick = async () => {
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
    await saveData();
    overlay.remove();
  };

  const delBtn = document.createElement("button");
  delBtn.className = "delete";
  delBtn.textContent = "Supprimer";
  delBtn.onclick = async () => {
    jsonData.voies = jsonData.voies.filter(x=>x!==v);
    v.element?.remove();
    await saveData();
    overlay.remove();
  };

  const closeBtn = document.createElement("button");
  closeBtn.className = "close";
  closeBtn.textContent = "Fermer";
  closeBtn.onclick = ()=>overlay.remove();

  // --- Assemble ---
  popup.append(inputNom, selectGrade, ouvreurInput, colorInput, votesDiv, saveBtn);
  if(isEdit) popup.append(delBtn);
  popup.append(closeBtn);

  overlay.appendChild(popup);
  document.body.appendChild(overlay);
}

// === INIT ===
document.addEventListener("DOMContentLoaded", async () => {
  await loadData();

  document.querySelectorAll(".column").forEach(col=>{
    const routesDiv = col.querySelector(".routes");
    col.querySelector(".add-voie-btn").onclick = ()=>openPopup({colonne:+col.dataset.colonne, container:routesDiv});
  });

  jsonData.voies.forEach(v=>{
    const col = wall.querySelector(`.column[data-colonne='${v.colonne}'] .routes`);
    if(col) addRoute(v,col);
  });
});