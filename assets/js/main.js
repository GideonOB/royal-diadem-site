/* =========================================
   ROYAL DIADEM — UI JS
   - Mobile nav toggle
   - Accordions
   - Header depth on scroll
   - Footer year
   - Active nav highlighting
   ========================================= */

(function () {
    const navToggle = document.querySelector("[data-nav-toggle]");
    const nav = document.querySelector("[data-nav]");
    const header = document.querySelector("[data-header]");
    const year = document.querySelector("[data-year]");

    // Footer year
    if (year) year.textContent = new Date().getFullYear();

    // Header shadow on scroll (subtle depth)
    const setHeaderDepth = () => {
        if (!header) return;
        const scrolled = window.scrollY > 6;
        header.style.boxShadow = scrolled ? "0 14px 50px rgba(31,26,36,.10)" : "none";
    };
    setHeaderDepth();
    window.addEventListener("scroll", setHeaderDepth, { passive: true });

    // Mobile nav toggle
    if (navToggle && nav) {
        navToggle.addEventListener("click", () => {
            const isOpen = nav.classList.toggle("open");
            navToggle.setAttribute("aria-expanded", String(isOpen));
        });

        nav.addEventListener("click", (e) => {
            const target = e.target;
            if (target && target.matches("a") && nav.classList.contains("open")) {
                nav.classList.remove("open");
                navToggle.setAttribute("aria-expanded", "false");
            }
        });

        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape" && nav.classList.contains("open")) {
                nav.classList.remove("open");
                navToggle.setAttribute("aria-expanded", "false");
                navToggle.focus();
            }
        });
    }

    // Accordions
    const accordionButtons = document.querySelectorAll("[data-acc-btn]");
    accordionButtons.forEach((btn) => {
        btn.addEventListener("click", () => {
            const item = btn.closest(".acc-item");
            if (!item) return;

            const group = item.closest(".accordion");
            const allowMultiple = group?.getAttribute("data-multi") === "true";

            if (!allowMultiple && group) {
                group.querySelectorAll(".acc-item.open").forEach((openItem) => {
                    if (openItem !== item) openItem.classList.remove("open");
                });
            }

            item.classList.toggle("open");
        });
    });

    // Active nav highlighting
    const current = window.location.pathname.split("/").pop() || "index.html";
    document.querySelectorAll("nav a").forEach((a) => {
        const href = (a.getAttribute("href") || "").trim();
        if (href === current) a.setAttribute("aria-current", "page");
    });
})();
