const switchButtons = document.querySelectorAll(".switch-btn");
const userBlocks = document.querySelectorAll("[data-user]");

function setUserView(userType) {
    switchButtons.forEach((button) => {
        const active = button.dataset.userTarget === userType;
        button.classList.toggle("active", active);
        button.setAttribute("aria-selected", active ? "true" : "false");
    });

    userBlocks.forEach((block) => {
        const match = block.dataset.user === userType;
        block.classList.toggle("is-hidden", !match);
    });
}

switchButtons.forEach((button) => {
    button.addEventListener("click", () => {
        setUserView(button.dataset.userTarget);
    });
});

setUserView("empresa");

const vacanciesList = document.getElementById("vacancies-list");
const modal = document.getElementById("vacancy-modal");
const modalTitle = document.getElementById("vacancy-modal-title");
const modalCompany = document.getElementById("vacancy-modal-company");
const modalLocation = document.getElementById("vacancy-modal-location");
const modalSalary = document.getElementById("vacancy-modal-salary");
const modalRequirements = document.getElementById("vacancy-modal-requirements");
const modalBenefits = document.getElementById("vacancy-modal-benefits");
const modalApply = document.getElementById("vacancy-modal-apply");

function isActiveVacancy(value) {
    if (typeof value === "boolean") return value;
    if (typeof value === "number") return value === 1;
    const normalized = String(value || "").trim().toLowerCase();
    return ["1", "true", "si", "sí", "activo"].includes(normalized);
}

function buildWhatsAppLink(linkWa, puesto, empresa) {
    const message = `Hola, me interesa la vacante de ${puesto} en ${empresa}`;
    const encodedMessage = encodeURIComponent(message);
    const raw = String(linkWa || "").trim();
    if (raw.startsWith("http://") || raw.startsWith("https://")) {
        return `${raw}${raw.includes("?") ? "&" : "?"}text=${encodedMessage}`;
    }
    const digits = raw.replace(/\D/g, "");
    const phone = digits || "528132581198";
    return `https://wa.me/${phone}?text=${encodedMessage}`;
}

function openVacancyModal(vacancy) {
    const puesto = vacancy["Puesto"] || "";
    const empresa = vacancy["Empresa"] || "";
    modalTitle.textContent = puesto;
    modalCompany.textContent = empresa;
    modalLocation.textContent = vacancy["Ubicación"] || "No especificada";
    modalSalary.textContent = vacancy["Sueldo"] || "No especificado";
    modalRequirements.textContent = vacancy["Requisitos"] || "No especificados";
    modalBenefits.textContent = vacancy["Beneficios"] || "No especificados";
    modalApply.href = buildWhatsAppLink(vacancy["Link_WA"], puesto, empresa);

    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
}

function closeVacancyModal() {
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
}

function renderVacancies(vacanciesData) {
    if (!vacanciesList) return;

    const activeVacancies = (vacanciesData || []).filter((item) => isActiveVacancy(item["ACTIVO"]));
    if (!activeVacancies.length) {
        vacanciesList.innerHTML = "<p>No hay vacantes activas por el momento.</p>";
        return;
    }

    vacanciesList.innerHTML = "";
    activeVacancies.forEach((vacancy) => {
        const card = document.createElement("article");
        card.className = "vacancy-card";
        card.innerHTML = `
            <h3>${vacancy["Puesto"] || ""}</h3>
            <p class="vacancy-company">${vacancy["Empresa"] || ""}</p>
            <p class="vacancy-meta">${vacancy["Ubicación"] || "Ubicación no especificada"}</p>
            <p class="vacancy-meta">${vacancy["Sueldo"] || "Sueldo no especificado"}</p>
        `;
        card.addEventListener("click", () => openVacancyModal(vacancy));
        vacanciesList.appendChild(card);
    });
}

modal?.addEventListener("click", (event) => {
    if (event.target instanceof HTMLElement && event.target.hasAttribute("data-modal-close")) {
        closeVacancyModal();
    }
});

document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && modal?.getAttribute("aria-hidden") === "false") {
        closeVacancyModal();
    }
});

window.renderVacancies = renderVacancies;

async function loadVacanciesAutomatically() {
    if (!vacanciesList) return;

    const endpoint = window.VACANCIES_API_URL || "https://script.google.com/macros/s/AKfycbwgPCyHqpesEatfsbi44Y0H3PNRbd3DIt3Mg6oL69IZabDXFij0Kw297gdIOIDn5ACy/exec";
    vacanciesList.innerHTML = "<p>Cargando vacantes...</p>";

    try {
        const response = await fetch(endpoint, {
            method: "GET",
            headers: { "Accept": "application/json" }
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const payload = await response.json();
        const vacanciesData = Array.isArray(payload) ? payload : (payload?.data || []);
        renderVacancies(vacanciesData);
    } catch (error) {
        vacanciesList.innerHTML = "<p>No se pudieron cargar las vacantes en este momento.</p>";
        console.error("Error cargando vacantes:", error);
    }
}

loadVacanciesAutomatically();
