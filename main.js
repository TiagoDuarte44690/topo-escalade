// === CONFIGURATION GITHUB ===
const GITHUB_REPO = "TiagoDuarte44690/topo-escalade"; // ton repo
const FILE_PATH = "topoData.json"; // chemin JSON
const BRANCH = "main"; // branche
const TOKEN = "TON_NOUVEAU_TOKEN_ICI"; // ⚠️ à sécuriser (ne jamais publier !)

// === GRADES ===
const grades = ["4a","4a+","4b","4b+","4c","4c+",
"5a","5a+","5b","5b+","5c","5c+",
"6a","6a+","6b","6b+","6c","6c+",
"7a","7a+","7b","7b+","7c","7c+",
"8a","8a+","8b","8b+","8c","8c+",
"9a","9a+","9b","9b+","9c","9c+"];

// === VARIABLES ===
let jsonData = { voies: [], ouvreurs: [], sha: null };

// === FONCTIONS GITHUB ===

// Lire le JSON depuis GitHub
async function loadData() {
  const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/${FILE_PATH}?ref=${BRANCH}`, {
    headers: { "Authorization": `token ${TOKEN}` }
  });
  const data = await res.json();
  const content = atob(data.content);
  jsonData = JSON.parse(content);
  jsonData.sha = data.sha; // SHA nécessaire pour update
  return jsonData;
}

// Sauvegarder le JSON sur GitHub
async function saveData() {
  const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/${FILE_PATH}`, {
    method: "PUT",
    headers: {
      "Authorization": `token ${TOKEN}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      message: "Mise à jour topoData.json via le projet",
      content: btoa(JSON.stringify({ voies: jsonData.voies, ouvreurs: jsonData.ouvreurs }, null, 2)),
      sha: jsonData.sha,
      branch: BRANCH
    })
  });
  const updated = await res.json();
  jsonData.sha = updated.content.sha; // update SHA
}

// === UTILITAIRES ===
function median(cotation, votes = []) {
  if(!votes.length) return cotation;
  const all = [cotation, ...votes].map(x=>grades.indexOf(x)).sort((a,b)=>a-b);
  return grades[Math.floor(all.length/2)];
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

  // Formulaire : nom, cotation, ouvreur
  const inputNom = document.createElement("input");
  inputNom.placeholder = "Nom";
  inputNom.value = v.nom || "";

  const selectGrade = document.createElement("select");
  grades.forEach(g=>{
    const opt = document.createElement("option");
    opt.value = opt.text = g;
    if(g===v.cotation) opt.selected=true;
    selectGrade.appendChild(opt);
  });

  const ouvreurInput = document.createElement("input");
  ouvreurInput.placeholder="Ouvreur";
  ouvreurInput.value=v.ouvreur||"";

  // Couleur intégrée
  const colorInput = document.createElement("input");
  colorInput.type="color";
  colorInput.value=v.couleur||"#888";

  // Votes
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

  // Buttons
  const saveBtn = document.createElement("button");
  saveBtn.textContent="Enregistrer";
  saveBtn.onclick = async ()=>{
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
  delBtn.textContent="Supprimer";
  delBtn.onclick = async ()=>{
    jsonData.voies = jsonData.voies.filter(x=>x!==v);
    v.element?.remove();
    await saveData();
    overlay.remove();
  };

  const closeBtn = document.createElement("button");
  closeBtn.textContent="Fermer";
  closeBtn.onclick=()=>overlay.remove();

  popup.append(inputNom, selectGrade, ouvreurInput, colorInput, votesDiv, saveBtn);
  if(isEdit) popup.append(delBtn);
  popup.append(closeBtn);

  overlay.appendChild(popup);
  document.body.appendChild(overlay);
}

// === INIT ===
async function init() {
  await loadData();
  document.querySelectorAll(".column").forEach(col=>{
    const routesDiv = col.querySelector(".routes");
    col.querySelector(".add-voie-btn").onclick = ()=>openPopup({colonne:+col.dataset.colonne, container:routesDiv});
  });
  jsonData.voies.forEach(v=>{
    const col = wall.querySelector(`.column[data-colonne='${v.colonne}'] .routes`);
    if(col) addRoute(v,col);
  });
}

// Lancer
init();
