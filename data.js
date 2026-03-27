// data.js
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