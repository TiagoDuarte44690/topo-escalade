// routes.js
const wall = document.getElementById("wall");

function addRoute(v, container) {
    const div = document.createElement("div");
    div.className = "route";
    div.style.background = v.couleur;
    div.innerHTML = `<span>${v.nom} ${median(v.cotation, v.votes)}</span>`;
    div.onclick = () => openPopup({ ...v, element: div, container });
    container.appendChild(div);
}