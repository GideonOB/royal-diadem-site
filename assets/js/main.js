/* =========================================
   ROYAL DIADEM — UI JS
   - Mobile nav toggle
   - Accordions
   - Header depth on scroll
   - Footer year
   - Active nav highlighting
   ========================================= */

async function includePartials() {
    const includeTargets = document.querySelectorAll("[data-include]");

    for (const target of includeTargets) {
        const part = target.getAttribute("data-include");
        if (!part) continue;

        try {
            const response = await fetch(`${part}.html`, { cache: "no-cache" });
            if (!response.ok) throw new Error(`Failed to load ${part}.html`);
            target.outerHTML = await response.text();
        } catch (error) {
            console.error(error);
        }
    }
}

function initializeUi() {
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

    // Mobile read-more modal for Founder tab panels
    const founderModal = document.querySelector("[data-founder-modal]");
    const founderModalBody = document.querySelector("[data-founder-modal-body]");
    const founderModalTitle = document.querySelector("#founder-modal-title");
    let lastFocusedReadMore = null;

    const closeFounderModal = () => {
        if (!founderModal) return;
        founderModal.hidden = true;
        document.body.classList.remove("modal-open");
        if (founderModalBody) founderModalBody.innerHTML = "";
        if (lastFocusedReadMore) {
            lastFocusedReadMore.focus();
            lastFocusedReadMore = null;
        }
    };

    if (founderModal) {
        founderModal.querySelectorAll("[data-founder-modal-close]").forEach((el) => {
            el.addEventListener("click", closeFounderModal);
        });
    }

    const readMoreButtons = document.querySelectorAll("[data-read-more]");
    readMoreButtons.forEach((button) => {
        const panel = button.closest("[data-tab-panel]");
        if (!panel) return;

        button.addEventListener("click", () => {
            const preview = panel.querySelector("[data-tab-preview]");
            if (!preview || !founderModal || !founderModalBody) return;

            const tabId = panel.getAttribute("aria-labelledby");
            const tabButton = tabId ? document.getElementById(tabId) : null;
            const title = tabButton ? tabButton.textContent.trim() : "Read more";

            if (founderModalTitle) founderModalTitle.textContent = title;
            founderModalBody.innerHTML = preview.innerHTML;

            founderModal.hidden = false;
            document.body.classList.add("modal-open");
            lastFocusedReadMore = button;
        });
    });

    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && founderModal && !founderModal.hidden) {
            closeFounderModal();
        }
    });

    // Active nav highlighting
    const current = window.location.pathname.split("/").pop() || "index.html";
    document.querySelectorAll("nav a").forEach((a) => {
        const href = (a.getAttribute("href") || "").trim();
        if (href === current) a.setAttribute("aria-current", "page");
    });
}

function initializeQuoteOfDay() {
    const verseTargets = document.querySelectorAll("[data-qotd-verse]");
    const refTargets = document.querySelectorAll("[data-qotd-ref]");
    if (!verseTargets.length || !refTargets.length) return;

    const verses = [
        {
            text: "Trust in the Lord with all your heart and lean not on your own understanding.",
            ref: "Proverbs 3:5",
        },
        {
            text: "The Lord will fight for you; you need only to be still.",
            ref: "Exodus 14:14",
        },
        {
            text: "She is clothed with strength and dignity; she can laugh at the days to come.",
            ref: "Proverbs 31:25",
        },
        {
            text: "I can do all things through Christ who strengthens me.",
            ref: "Philippians 4:13",
        },
        {
            text: "Those who hope in the Lord will renew their strength.",
            ref: "Isaiah 40:31",
        },
    ];

    const selection = verses[Math.floor(Math.random() * verses.length)];
    verseTargets.forEach((el) => {
        el.textContent = `“${selection.text}”`;
    });
    refTargets.forEach((el) => {
        el.textContent = selection.ref;
    });

    const sticky = document.querySelector("[data-qotd-sticky]");
    if (!sticky) return;

    document.body.classList.add("has-qotd-sticky");
    const footer = document.querySelector(".footer");

    const setStickyHidden = (isHidden) => {
        sticky.classList.toggle("is-hidden", isHidden);
    };

    if ("IntersectionObserver" in window && footer) {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => setStickyHidden(entry.isIntersecting));
            },
            { threshold: 0.08 }
        );
        observer.observe(footer);
        return;
    }

    const fallbackToggle = () => {
        const fromBottom = document.documentElement.scrollHeight - (window.scrollY + window.innerHeight);
        setStickyHidden(fromBottom < 140);
    };
    fallbackToggle();
    window.addEventListener("scroll", fallbackToggle, { passive: true });
}

(async function () {
    await includePartials();
    initializeUi();
    initializeQuoteOfDay();
})();
