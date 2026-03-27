// elements.js
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