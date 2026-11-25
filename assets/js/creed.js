(() => {
    const host = document.querySelector("[data-unveiling]");
    const template = document.querySelector("#unveiling-template");
    host.append(template.content.cloneNode(true));

    const stage = host.querySelector(".unveiling");
    const introduction = document.querySelector(".creed-introduction");
    const overview = document.querySelector(".creed-overview");
    const controlArea = stage.querySelector("[data-trigger]");
    const status = stage.querySelector("[data-scroll-status]");
    const scroll = stage.querySelector(".royal-scroll");
    const paper = stage.querySelector(".royal-scroll__paper");
    const artwork = paper.querySelector("img");
    const seal = stage.querySelector(".royal-scroll__seal");
    const diadem = stage.querySelector(".unveiling__diadem");
    const ribbons = stage.querySelectorAll(".royal-scroll__ribbon");
    const rollers = stage.querySelectorAll(".royal-scroll__roller");
    const lowerControl = stage.querySelector("[data-closing-control]");
    const controls = stage.querySelectorAll("[data-scroll-toggle]");
    const primaryControl = controls[0];
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let activeAnimations = [];
    let autoAvailable = true;
    let intentUntil = 0;
    let lastScrollY = window.scrollY;
    let touchY;

    motion.addEventListener("change", () => {
        if (motion.matches) activeAnimations.forEach(animation => animation.finish());
    });

    function setState(state, message) {
        stage.dataset.state = state;
        if (message) status.textContent = message;
        const open = state === "open";
        if (!open && overview.contains(document.activeElement)) primaryControl.focus({ preventScroll: true });
        overview.inert = !open;
        overview.toggleAttribute("data-revealed", open);
        overview.toggleAttribute("data-concealing", state === "closing");
        const busy = !open && state !== "sealed";
        primaryControl.textContent = open || state === "closing" || state === "resealing"
            ? "Seal Away from Prying Eyes" : "Unseal the Royal Scroll";
        primaryControl.setAttribute("aria-expanded", String(open));
        lowerControl.hidden = !open;
        controls.forEach(control => control.setAttribute("aria-disabled", String(busy)));
    }

    function resetScroll(allowAuto) {
        const previous = activeAnimations;
        activeAnimations = [];
        previous.forEach(animation => animation.cancel());
        delete scroll.dataset.paperOpen;
        delete scroll.dataset.released;
        autoAvailable = allowAuto;
        intentUntil = 0;
        lastScrollY = window.scrollY;
        setState("sealed", "A precious declaration awaits.");
    }

    async function animate(tracks, duration, apply = () => {}, options = {}) {
        if (motion.matches || !Element.prototype.animate) {
            apply();
            return true;
        }

        const animations = tracks.map(([element, frames]) => element.animate(frames, {
            duration, fill: "both", easing: "cubic-bezier(.36,.14,.64,.86)", ...options
        }));

        activeAnimations = animations;
        const results = await Promise.allSettled(animations.map(animation => animation.finished));
        if (activeAnimations !== animations) return false;
        if (results.some(result => result.status === "rejected")) {
            resetScroll(false);
            return false;
        }

        apply();
        activeAnimations = [];
        animations.forEach(animation => animation.cancel());
        return true;
    }

    const lightTracks = [
        [diadem, [
            { filter: "drop-shadow(0 2px 8px #fddc5c55)" },
            { filter: "drop-shadow(0 2px 17px #fddc5caa)", offset: .55 },
            { filter: "drop-shadow(0 2px 8px #fddc5c55)" }
        ]]
    ];

    function bindingTracks() {
        return [
            [seal, [
                { transform: "translateY(0) rotateX(0)", opacity: 1 },
                { transform: "translateY(-9px) translateZ(28px) rotateX(-18deg)", opacity: 1, offset: .38 },
                { transform: "translateY(-30px) translateZ(38px) rotateX(-42deg) rotate(-13deg)", opacity: 0 }
            ]],
            ...Array.from(ribbons, (ribbon, index) => {
                const sign = index === 0 ? -1 : 1;
                return [ribbon, [
                    { transform: `translateX(${sign * 32}%) rotate(${sign * -17}deg)`, opacity: 1 },
                    { transform: `translateX(${sign * 42}%) rotate(${sign * -22}deg)`, opacity: 1, offset: .38 },
                    { transform: `translate(${sign * 130}%, -19px) rotate(${sign * -37}deg) scaleY(.5)`, opacity: 0 }
                ]];
            })
        ];
    }

    async function rollPaper(opening) {
        const paperFrames = () => [{ height: "0px" }, { height: `${artwork.getBoundingClientRect().height}px` }];
        const rolling = animate([
            [paper, paperFrames()],
            [rollers[0], [{ opacity: 1 }, { opacity: 1, offset: .055 }, { opacity: 0, offset: .22 }, { opacity: 0 }]],
            [rollers[1], [
                { opacity: 1, filter: "brightness(.93)" },
                { opacity: 1, filter: "brightness(1.12)", offset: .55 },
                { opacity: 1, filter: "brightness(1)", offset: .96 },
                { opacity: 0, filter: "brightness(.96)" }
            ]]
        ], opening ? 6500 : 5000, () => {
            scroll.toggleAttribute("data-paper-open", opening);
        }, {
            direction: opening ? "normal" : "reverse",
            easing: "cubic-bezier(.4,.15,.6,.85)"
        });

        // The artwork retains its intrinsic aspect ratio while the visible edge moves.
        // Retarget the pixel height at the current animation time when the artwork resizes.
        const paperAnimation = activeAnimations[0];
        if (!paperAnimation) return rolling;
        const resize = () => paperAnimation.effect.setKeyframes(paperFrames());
        const observer = "ResizeObserver" in window ? new ResizeObserver(resize) : null;
        observer?.observe(artwork);
        if (!observer) window.addEventListener("resize", resize);
        try {
            return await rolling;
        } finally {
            observer?.disconnect();
            window.removeEventListener("resize", resize);
        }
    }

    setState("sealed");
    async function openScroll() {
        if (stage.dataset.state !== "sealed") return;
        autoAvailable = false;
        setState("unsealing");
        if (!await animate([...lightTracks, [seal, [
            { filter: "brightness(1)" },
            { filter: "brightness(1.22)", offset: .62 },
            { filter: "brightness(1)" }
        ]]], 600)) return;
        status.textContent = "The royal seal is lifted…";
        if (!await animate(bindingTracks(), 1100, () => { scroll.dataset.released = ""; })) return;

        setState("unfolding");
        if (!await rollPaper(true)) return;
        if (!await animate([...lightTracks, [paper, [
            { filter: "brightness(1)" },
            { filter: "brightness(1.045)", offset: .4 },
            { filter: "brightness(1)" }
        ]]], 800)) return;
        setState("open", "A royal treasure, revealed.");
    }

    async function closeScroll(fromBottom) {
        if (fromBottom) {
            primaryControl.focus({ preventScroll: true });
            controlArea.scrollIntoView({ block: "center", behavior: motion.matches ? "instant" : "smooth" });
        }

        setState("closing", "Concealing the royal treasure…");
        if (!await rollPaper(false)) return;

        setState("resealing");
        // Hold the released pose before making the binding visible again.
        const reseal = animate(bindingTracks(), 1100, undefined, { direction: "reverse" });
        delete scroll.dataset.released;
        if (!await reseal || !await animate(lightTracks, 500)) return;
        setState("sealed", "Safely sealed until the next unveiling.");
    }

    controls.forEach((control, index) => {
        control.addEventListener("click", () => {
            if (stage.dataset.state === "open") closeScroll(index === 1);
            else if (stage.dataset.state === "sealed") openScroll();
        });
    });

    // Layout shifts and native history restoration can produce scroll events without user input.
    const noteScrollIntent = () => {
        if (autoAvailable) intentUntil = performance.now() + 1200;
    };
    window.addEventListener("wheel", event => {
        if (event.isTrusted && event.deltaY > 0 && !event.ctrlKey) noteScrollIntent();
    }, { passive: true });
    window.addEventListener("touchstart", event => {
        touchY = event.touches.length === 1 ? event.touches[0].clientY : undefined;
    }, { passive: true });
    window.addEventListener("touchmove", event => {
        const y = event.touches.length === 1 ? event.touches[0].clientY : undefined;
        if (event.isTrusted && y < touchY) noteScrollIntent();
        touchY = y;
    }, { passive: true });
    window.addEventListener("keydown", event => {
        if (!event.isTrusted || event.defaultPrevented || event.ctrlKey || event.altKey || event.metaKey) return;
        if (event.target.matches?.("input, textarea, select, [contenteditable]")) return;
        if (["ArrowDown", "PageDown", "End"].includes(event.key) ||
            (event.key === " " && !event.shiftKey && !event.target.closest?.("button, a, summary"))) noteScrollIntent();
    });
    window.addEventListener("pointerdown", event => {
        if (event.isTrusted && event.clientX >= document.documentElement.clientWidth) noteScrollIntent();
    }, { passive: true });
    window.addEventListener("scroll", () => {
        const currentY = window.scrollY;
        const movingDown = currentY > lastScrollY;
        lastScrollY = currentY;
        if (!autoAvailable || !movingDown || performance.now() >= intentUntil) return;
        if (introduction.getBoundingClientRect().bottom > 0) return;

        const sealBounds = seal.getBoundingClientRect();
        const visible = Math.min(innerHeight, sealBounds.bottom) - Math.max(0, sealBounds.top);
        if (sealBounds.height > 0 && visible >= sealBounds.height * .6) openScroll();
    }, { passive: true });
    window.addEventListener("pageshow", event => {
        if (event.persisted) resetScroll(true);
    });

    const enlarge = document.querySelector("[data-enlarge-creed]");
    const dialog = document.querySelector(".creed-dialog");
    const artPane = dialog.querySelector(".creed-dialog__art");
    const enlargedArt = dialog.querySelector("img");
    const fitControl = dialog.querySelector("[data-fit-creed]");
    if (typeof dialog.showModal === "function") {
        enlarge.setAttribute("aria-haspopup", "dialog");
        enlarge.addEventListener("click", event => {
            if (event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return;
            event.preventDefault();
            dialog.removeAttribute("data-fit");
            fitControl.textContent = "Fit to window";
            enlargedArt.src = enlarge.href;
            dialog.showModal();
            artPane.scrollTo(0, 0);
        });
        fitControl.addEventListener("click", () => {
            const fit = dialog.toggleAttribute("data-fit");
            fitControl.textContent = fit ? "Reading size" : "Fit to window";
            artPane.scrollTo(0, 0);
        });
        dialog.addEventListener("close", () => enlarge.focus({ preventScroll: true }));
    }
})();
