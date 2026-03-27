// init.js
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