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
    const setAccordionState = (item, isOpen) => {
        item.classList.toggle("open", isOpen);
        const button = item.querySelector("[data-acc-btn]");
        const panel = item.querySelector(".acc-panel");
        if (button) button.setAttribute("aria-expanded", String(isOpen));
        if (panel) panel.hidden = !isOpen;
    };

    accordionButtons.forEach((btn) => {
        const item = btn.closest(".acc-item");
        if (!item) return;

        const panel = item.querySelector(".acc-panel");
        if (panel) panel.hidden = !item.classList.contains("open");
        btn.setAttribute("aria-expanded", String(item.classList.contains("open")));

        btn.addEventListener("click", () => {
            const group = item.closest(".accordion");
            const allowMultiple = group?.getAttribute("data-multi") === "true";
            const willOpen = !item.classList.contains("open");

            if (!allowMultiple && group) {
                group.querySelectorAll(".acc-item.open").forEach((openItem) => {
                    if (openItem !== item) setAccordionState(openItem, false);
                });
            }

            setAccordionState(item, willOpen);
        });
    });

    // Tabs
    const tabGroups = document.querySelectorAll("[data-tabs]");
    tabGroups.forEach((group) => {
        const tabs = Array.from(group.querySelectorAll("[data-tab-trigger]"));
        const panels = Array.from(group.querySelectorAll("[data-tab-panel]"));
        if (!tabs.length || !panels.length) return;

        const activateTab = (tab) => {
            tabs.forEach((btn) => {
                const selected = btn === tab;
                const panelId = btn.getAttribute("aria-controls");
                const panel = panelId ? group.querySelector(`#${panelId}`) : null;
                btn.setAttribute("aria-selected", String(selected));
                btn.tabIndex = selected ? 0 : -1;
                if (panel) panel.hidden = !selected;
            });
        };

        tabs.forEach((tab, index) => {
            tab.addEventListener("click", () => activateTab(tab));
            tab.addEventListener("keydown", (e) => {
                if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)) return;
                e.preventDefault();
                let nextIndex = index;
                if (e.key === "ArrowRight") nextIndex = (index + 1) % tabs.length;
                if (e.key === "ArrowLeft") nextIndex = (index - 1 + tabs.length) % tabs.length;
                if (e.key === "Home") nextIndex = 0;
                if (e.key === "End") nextIndex = tabs.length - 1;
                tabs[nextIndex].focus();
                activateTab(tabs[nextIndex]);
            });
        });

        const selectedTab = tabs.find((tab) => tab.getAttribute("aria-selected") === "true") || tabs[0];
        activateTab(selectedTab);
    });

    // Mobile read-more toggles for Founder tab panels
    const readMoreButtons = document.querySelectorAll("[data-read-more]");
    readMoreButtons.forEach((button) => {
        const panel = button.closest("[data-tab-panel]");
        if (!panel) return;

        const updateButton = () => {
            const expanded = panel.classList.contains("expanded");
            button.setAttribute("aria-expanded", String(expanded));
            button.textContent = expanded ? "Show less" : "Read more";
        };

        updateButton();

        button.addEventListener("click", () => {
            panel.classList.toggle("expanded");
            updateButton();
        });
    });

    // Active nav highlighting
    const current = window.location.pathname.split("/").pop() || "index.html";
    document.querySelectorAll("nav a").forEach((a) => {
        const href = (a.getAttribute("href") || "").trim();
        if (href === current) a.setAttribute("aria-current", "page");
    });
})();
