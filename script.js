// Elementi DOM e variabili globali
const slider = document.getElementById("Slider");
const sliderPill = document.getElementById("Slider-pill");
const modeButton = document.getElementById("Mode-button");
const copyDiv = document.getElementById("Copy");

let currentLevel = 0;
let isDragging = false;
let dragAxis = window.innerWidth < 576 ? "vertical" : "horizontal";
let startPointerPos = 0;
let startSliderPos = 0;
let initialLevel = 0;
let hasCrossedBoundary = false;

// Funzione per animare l'icona di copia: mostra la spunta verde e aggiunge un bordo 8px solid #28A745
function animateCopyIcon() {
    copyDiv.innerHTML = '<i class="fa-solid fa-check"></i>';
    copyDiv.classList.add("scale-80");

    setTimeout(() => {
        copyDiv.classList.remove("scale-80");
        copyDiv.innerHTML = '<i class="fa-regular fa-copy"></i>';
    }, 2000);
}

// Aggiorna il colore di sfondo del "pill" in base al livello e al tema
function updatePillBackground(level, darkmode) {
    const colors = [
        "#1D1941", // 0 dark
        "#CAC7FE", // 0 light
        "#FF4848", // livello 1
        "#FDFD5F", // livello 2
        "#85FF7D", // livello 3
        "#5DFF54", // livello 4
        "#10FF03"  // livello 5
    ];

    let color;

    if (level === 0) {
        color = darkmode ? colors[0] : colors[1];
    } else {
        color = colors[level + 1];
    }

    sliderPill.style.backgroundColor = color;
    slider.style.borderColor = color;
}

// Aggiorna lo stato del pulsante "Copy" in base al livello corrente
function copyButtonHandler() {
  if (currentLevel === 0) {
    copyDiv.classList.remove("scale-100");
    copyDiv.classList.add("scale-0");
  } else {
    copyDiv.classList.remove("scale-0");
    copyDiv.classList.add("scale-100");
  }
}

// Crea le tacche (ticks) nello slider
function createTicks() {
  const ticksContainer = document.getElementById("Ticks-container");
  ticksContainer.innerHTML = "";
  const snaps = getSnapPositions();
  const isHorizontal = dragAxis === "horizontal";
  let i = 0;

    snaps.forEach((pos) => {
        const tick1 = document.createElement("div");
        const tick2 = document.createElement("div");
        tick1.className = tick2.className = "tick";

        if (isHorizontal) {
            tick1.style.cssText = `left: ${pos + 33}px; top: 0;`;
            tick2.style.cssText = `left: ${pos + 33}px; bottom: 0;`;
        } else {
            tick1.style.cssText = `top: ${pos + 33}px; left: 0;`;
            tick2.style.cssText = `top: ${pos + 33}px; right: 0;`;
        }
        if (i !== 0) {
            ticksContainer.appendChild(tick1);
            ticksContainer.appendChild(tick2);
        }

        i++;
    });
}

// Funzione per generare un indice casuale
function genRandomIndex(len) {
  const arr = new Uint32Array(1);
  window.crypto.getRandomValues(arr);
  return arr[0] % len;
}

// Genera la password in base al livello
function generatePw(level) {
    const ABC = "ABCDEFGHJKLMNPQRSTUVWXYZ".split("");
    const abc = "abcdefghijkmnopqrstuvwxyz".split("");
    const nums = "0123456789".split("");
    const chars = "!@#$%&*?.".split("");
    let password, checkCap, checkLow, checkNum, checkSC;
    do {
        password = "";
        checkCap = checkLow = checkNum = checkSC = false;
        for (let i = 0; i < 4 * level; i++) {
            const boundary = i % 4 === 0 || i % 4 === 3;
            const options = boundary
                ? [
                    ABC[genRandomIndex(ABC.length)],
                    abc[genRandomIndex(abc.length)],
                    nums[genRandomIndex(nums.length)]
                ]
                : [
                    ABC[genRandomIndex(ABC.length)],
                    abc[genRandomIndex(abc.length)],
                    nums[genRandomIndex(nums.length)],
                    chars[genRandomIndex(chars.length)]
                ];
            const chosen = options[genRandomIndex(options.length)];
            password += chosen;
            if (ABC.includes(chosen)) checkCap = true;
            if (abc.includes(chosen)) checkLow = true;
            if (nums.includes(chosen)) checkNum = true;
            if (chars.includes(chosen)) checkSC = true;
        }
    } while (!(checkCap && checkLow && checkNum && checkSC));

    return password.match(/.{1,4}/g).join("-");
}

// Aggiorna la visualizzazione della password e dello slider
function updatePasswordDisplay(level) {
    updatePillBackground(level, document.body.classList.contains("dark-mode"));
    const pwDisplay = document.getElementById("Pw-display");
    const blocks = pwDisplay.querySelectorAll(".Block");
    blocks.forEach((block) => {
        block.textContent = "";
        block.classList.remove("has-next");
    });
    if (level === 0) {
        updateSliderIcon();
        copyButtonHandler();
        return;
    }
    const password = generatePw(level);
    const groups = password.split("-");
    blocks.forEach((block, index) => {
        if (index < groups.length) {
            block.textContent = groups[index];
            if (blocks[index + 1] && groups[index + 1]) {
                block.classList.add("has-next");
            }
        }
    });

    updateSliderIcon();
    copyButtonHandler();
}

// Aggiorna l'icona dello slider in base al livello corrente
function updateSliderIcon() {
    let iconClass = "", iconClassI = "", iconClassII = "";
    if (currentLevel === 0 || currentLevel === 5) {
        if (window.innerWidth < 576) {
            iconClass = currentLevel === 0 ? "fa-arrow-down-long" : "fa-arrow-up-long";
        } else {
            iconClass = currentLevel === 0 ? "fa-arrow-right-long" : "fa-arrow-left-long";
        }
        slider.innerHTML = `<i class="fa-solid ${iconClass} position-absolute"></i>`;
    } else {
        if (window.innerWidth < 576) {
            iconClassI = "fa-arrow-down-long";
            iconClassII = "fa-arrow-up-long";
        } else {
            iconClassI = "fa-arrow-right-long";
            iconClassII = "fa-arrow-left-long";
        }
        slider.innerHTML = `<i class="fa-solid ${iconClassI} position-absolute"></i><i class="fa-solid ${iconClassII} position-absolute"></i>`;
    }
}

// Imposta la posizione iniziale dello slider
function setInitialPosition() {
    dragAxis = window.innerWidth < 576 ? "vertical" : "horizontal";
    slider.style.top = "0px";
    slider.style.left = "0px";
    currentLevel = 0;
    updatePasswordDisplay(0);
}

// Restituisce la posizione del puntatore (mouse o touch)
function getPointerPosition(e) {
    return e.touches
        ? { x: e.touches[0].clientX, y: e.touches[0].clientY }
        : { x: e.clientX, y: e.clientY };
}

// Calcola le posizioni di snap per lo slider
function getSnapPositions() {
    const pillRect = sliderPill.getBoundingClientRect();
    const blocks = document.querySelectorAll("#Pw-display .Block");
    let snaps = [0];
    blocks.forEach((block) => {
        const blockRect = block.getBoundingClientRect();
        snaps.push(
            dragAxis === "vertical"
            ? blockRect.bottom - pillRect.top - 2
            : blockRect.right - pillRect.left - 2
        );
    });
    return snaps;
}

// Determina il livello corrente in base alla posizione dello slider
function calculateCurrentLevel(currentPos, snaps) {
    let level = 0;
    for (let i = snaps.length - 1; i >= 0; i--) {
        if (snaps[i] <= currentPos) {
            level = i;
            break;
        }
    }
    return level;
}

// Inizio del drag dello slider
function dragStart(e) {
    slider.classList.add("scale-80");
    e.preventDefault();
    isDragging = true;
    initialLevel = currentLevel;
    hasCrossedBoundary = false;
    dragAxis = window.innerWidth < 576 ? "vertical" : "horizontal";
    const pointerPos = getPointerPosition(e);
    const sliderPos =
        dragAxis === "vertical"
            ? parseInt(slider.style.top) || 0
            : parseInt(slider.style.left) || 0;
    startPointerPos = dragAxis === "vertical" ? pointerPos.y : pointerPos.x;
    startSliderPos = sliderPos;

    document.addEventListener("mousemove", dragMove);
    document.addEventListener("mouseup", dragEnd);
    document.addEventListener("touchmove", dragMove, { passive: false });
    document.addEventListener("touchend", dragEnd);
}

// Durante il drag dello slider
function dragMove(e) {
    if (!isDragging) return;
    e.preventDefault();
    const pointerPos = getPointerPosition(e);
    const delta =
        dragAxis === "vertical"
            ? pointerPos.y - startPointerPos
            : pointerPos.x - startPointerPos;
    let newPos = startSliderPos + delta;
    const snaps = getSnapPositions();
    newPos = Math.max(snaps[0], Math.min(snaps[snaps.length - 1], newPos));
    const targetLevel = calculateCurrentLevel(newPos, snaps);
    if (targetLevel !== currentLevel) {
        hasCrossedBoundary = true;
        currentLevel = targetLevel;
        updatePasswordDisplay(currentLevel);
    }
    if (dragAxis === "vertical") {
        slider.style.top = newPos + "px";
    } else {
        slider.style.left = newPos + "px";
    }
}

// Fine del drag dello slider
function dragEnd(e) {
    slider.classList.remove("scale-80");
    isDragging = false;
    ["mousemove", "mouseup", "touchmove", "touchend"].forEach((event) =>
        document.removeEventListener(event, dragEnd)
    );
    const snaps = getSnapPositions();
    const currentPos =
        dragAxis === "vertical"
            ? parseInt(slider.style.top) || 0
            : parseInt(slider.style.left) || 0;
    let closestIndex = 0;
    snaps.forEach((snap, index) => {
        if (Math.abs(snap - currentPos) < Math.abs(snaps[closestIndex] - currentPos)) {
            closestIndex = index;
        }
    });
    if (closestIndex !== currentLevel || (closestIndex === initialLevel && hasCrossedBoundary)) {
        currentLevel = closestIndex;
        updatePasswordDisplay(currentLevel);
    }
    if (dragAxis === "vertical") {
        slider.style.top = snaps[closestIndex] + "px";
    } else {
        slider.style.left = snaps[closestIndex] + "px";
    }
}

// Sposta lo slider ad un livello specifico
function moveSliderToLevel(newLevel) {
    const snaps = getSnapPositions();
    newLevel = Math.max(0, Math.min(snaps.length - 1, newLevel));
    if (dragAxis === "vertical") {
        slider.style.top = snaps[newLevel] + "px";
    } else {
        slider.style.left = snaps[newLevel] + "px";
    }
    currentLevel = newLevel;
    updatePasswordDisplay(newLevel);
}

// Copia la password negli appunti e anima l'icona
function copyPassword() {
    const password = Array.from(document.querySelectorAll("#Pw-display .Block"))
        .map((block) => block.textContent)
        .filter((text) => text)
        .join("-");
    if (!password) return;
    if (navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(password)
            .then(animateCopyIcon)
            .catch(() => {});
    } else {
        const textArea = document.createElement("textarea");
        textArea.value = password;
        textArea.style.position = "fixed";
        document.body.appendChild(textArea);
        textArea.select();
        try {
            document.execCommand("copy") && animateCopyIcon();
        } catch (e) {}
        document.body.removeChild(textArea);
    }
}

// Gestione del tema dark/light
function modeLogic() {
    document.body.classList.toggle("dark-mode", modeButton.checked);
    updatePillBackground(currentLevel, modeButton.checked);
}

// Funzioni per il resize
function setPosition(level) {
    dragAxis = window.innerWidth < 576 ? "vertical" : "horizontal";
    const snaps = getSnapPositions();
    level = Math.max(0, Math.min(snaps.length - 1, level));
    if (dragAxis === "vertical") {
        slider.style.top = snaps[level] + "px";
        slider.style.left = "0px";
        slider.style.right = "0px";
    } else {
        slider.style.left = snaps[level] + "px";
        slider.style.top = "0px";
        slider.style.bottom = "0px";
    }
    currentLevel = level;
    updateSliderIcon();
}

function setPassword(password) {
    if (!password) return;
    const pwDisplay = document.getElementById("Pw-display");
    const blocks = pwDisplay.querySelectorAll(".Block");
    const groups = password.split("-");
    blocks.forEach((block, index) => {
        if (index < groups.length) {
            block.textContent = groups[index];
        if (index < groups.length - 1) {
            block.classList.add("has-next");
        } else {
            block.classList.remove("has-next");
        }
        } else {
            block.textContent = "";
            block.classList.remove("has-next");
        }
    });
}

function handleResize() {
    const saveCurrentLevel = currentLevel;
    const saveCurrentPassword = Array.from(document.querySelectorAll("#Pw-display .Block"))
        .map((block) => block.textContent)
        .filter((text) => text)
        .join("-");
    return {
        savedLevel: saveCurrentLevel,
        savedPassword: saveCurrentPassword
    };
}

// Gestione dei tasti per cambiare livello o copiare
document.addEventListener("keydown", (e) => {
    const isDesktop = !("ontouchstart" in window);
    let newLevel = currentLevel;
    switch (e.key) {
        case "ArrowUp":
        case "Up":
            newLevel = window.innerWidth < 576 ? currentLevel - 1 : currentLevel + 1;
            break;
        case "ArrowDown":
        case "Down":
            newLevel = window.innerWidth < 576 ? currentLevel + 1 : currentLevel - 1;
            break;
        case "ArrowRight":
        case "Right":
            newLevel++;
            break;
        case "ArrowLeft":
        case "Left":
            newLevel--;
            break;
        case "Enter":
            if (isDesktop) copyPassword();
            break;
    }
    if (newLevel !== currentLevel) moveSliderToLevel(newLevel);
});

document.addEventListener("keydown", (e) => {
    const possibleKeys = ["ArrowUp", "Up", "ArrowDown", "Down", "ArrowRight", "Right", "ArrowLeft", "Left"];
    possibleKeys.forEach(key => {
        if (key === e.key) slider.classList.add("scale-80");
    });
});

document.addEventListener("keyup", (e) => {
    const possibleKeys = ["ArrowUp", "Up", "ArrowDown", "Down", "ArrowRight", "Right", "ArrowLeft", "Left"];
    possibleKeys.forEach(key => {
        if (key === e.key) slider.classList.remove("scale-80");
    });
});

document.addEventListener("keydown", (e) => {
    if (e.key === "Enter") copyDiv.classList.add("active");
});

document.addEventListener("keyup", (e) => {
    if (e.key === "Enter") copyDiv.classList.remove("active");
});

copyDiv.addEventListener("pointerdown", () => { copyDiv.classList.add("scale-80"); });
copyDiv.addEventListener("pointerup", () => { copyDiv.classList.add("scale-100"); });
copyDiv.addEventListener("pointerup", copyPassword);
copyDiv.addEventListener("click", copyPassword);

copyDiv.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        copyDiv.classList.add("active");
        copyPassword();
    }
});

copyDiv.addEventListener("keyup", (e) => {
    if (e.key === "Enter") {
        copyDiv.classList.remove("active");
    }
});

modeButton.addEventListener("change", modeLogic);

window.addEventListener("resize", () => {
    if (currentLevel != 0) {
        const savedState = handleResize();
        setPosition(savedState.savedLevel);
        setPassword(savedState.savedPassword);
    } else {
        setInitialPosition();
    }
});

window.addEventListener("resize", createTicks);

slider.addEventListener("mousedown", dragStart);
slider.addEventListener("touchstart", dragStart, { passive: false });

document.addEventListener("DOMContentLoaded", () => {
    modeLogic();
    setInitialPosition();
    createTicks();
});