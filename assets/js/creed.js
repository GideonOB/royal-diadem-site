(() => {
    const host = document.querySelector("[data-unveiling]");
    const template = document.querySelector("#unveiling-template");
    host.append(template.content.cloneNode(true));

    const stage = host.querySelector(".unveiling");
    const controlArea = stage.querySelector("[data-trigger]");
    const status = stage.querySelector("[data-scroll-status]");
    const scroll = stage.querySelector(".royal-scroll");
    const paper = stage.querySelector(".royal-scroll__paper");
    const seal = stage.querySelector(".royal-scroll__seal");
    const diadem = stage.querySelector(".unveiling__diadem");
    const ribbons = stage.querySelectorAll(".royal-scroll__ribbon");
    const rollers = stage.querySelectorAll(".royal-scroll__roller");
    const lowerControl = stage.querySelector("[data-closing-control]");
    const controls = stage.querySelectorAll("[data-scroll-toggle]");
    const primaryControl = controls[0];
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let activeAnimations = [];

    motion.addEventListener("change", () => {
        if (motion.matches) activeAnimations.forEach(animation => animation.finish());
    });

    function setState(state, message) {
        stage.dataset.state = state;
        if (message) status.textContent = message;
        const open = state === "open";
        const busy = !open && state !== "sealed";
        primaryControl.textContent = open || state === "closing" || state === "resealing"
            ? "Seal Away from Prying Eyes" : "Unseal the Royal Scroll";
        primaryControl.setAttribute("aria-expanded", String(open));
        lowerControl.hidden = !open;
        controls.forEach(control => control.setAttribute("aria-disabled", String(busy)));
    }

    async function animate(tracks, duration, apply = () => {}, direction = "normal") {
        if (motion.matches || !Element.prototype.animate) {
            apply();
            return;
        }

        const animations = tracks.map(([element, frames]) => element.animate(frames, {
            duration, direction, fill: "both", easing: "cubic-bezier(.36,.04,.27,1)"
        }));

        activeAnimations = animations;
        await Promise.allSettled(animations.map(animation => animation.finished));
        apply();
        animations.forEach(animation => animation.cancel());
        activeAnimations = [];
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

    function rollTracks() {
        return [
            [paper, [{ height: "0px" }, { height: "150cqw" }]],
            [rollers[0], [{ opacity: 1 }, { opacity: 1, offset: .035 }, { opacity: 0, offset: .1 }, { opacity: 0 }]],
            [rollers[1], [
                { opacity: 1, filter: "brightness(.93)" },
                { opacity: 1, filter: "brightness(1.16)", offset: .55 },
                { opacity: 1, filter: "brightness(1)", offset: .91 },
                { opacity: 0, filter: "brightness(.96)" }
            ]]
        ];
    }

    let observer;
    setState("sealed");
    async function openScroll() {
        if (stage.dataset.state !== "sealed") return;
        observer?.disconnect();
        setState("unsealing");
        await animate([...lightTracks, [seal, [
            { filter: "brightness(1)" },
            { filter: "brightness(1.22)", offset: .62 },
            { filter: "brightness(1)" }
        ]]], 480);
        status.textContent = "The royal seal is lifted…";
        await animate(bindingTracks(), 760, () => { scroll.dataset.released = ""; });

        setState("unfolding");
        await animate(rollTracks(), 2800, () => { scroll.dataset.paperOpen = ""; });
        await animate([...lightTracks, [paper, [
            { filter: "brightness(1)" },
            { filter: "brightness(1.045)", offset: .4 },
            { filter: "brightness(1)" }
        ]]], 480);
        setState("open", "A royal treasure, revealed.");
    }

    async function closeScroll(fromBottom) {
        if (fromBottom) {
            primaryControl.focus({ preventScroll: true });
            controlArea.scrollIntoView({ block: "center", behavior: motion.matches ? "instant" : "smooth" });
        }

        setState("closing", "Concealing the royal treasure…");
        await animate(rollTracks(), 2400, () => { delete scroll.dataset.paperOpen; }, "reverse");

        setState("resealing");
        const tracks = bindingTracks();
        // Hold the released pose before making the binding visible again.
        const reseal = animate(tracks, 760, undefined, "reverse");
        delete scroll.dataset.released;
        await reseal;
        await animate(lightTracks, 440);
        setState("sealed", "Safely sealed until the next unveiling.");
    }

    controls.forEach((control, index) => {
        control.addEventListener("click", () => {
            if (stage.dataset.state === "open") closeScroll(index === 1);
            else if (stage.dataset.state === "sealed") openScroll();
        });
    });

    if ("IntersectionObserver" in window) {
        observer = new IntersectionObserver(([entry]) => {
            if (entry.intersectionRatio >= .6) openScroll();
        }, { threshold: .6 });
        observer.observe(seal);
    } else {
        openScroll();
    }

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
            enlargedArt.src = enlarge.href;
            dialog.showModal();
            artPane.scrollTo(0, 0);
        });
        fitControl.addEventListener("click", () => {
            const fit = dialog.toggleAttribute("data-fit");
            fitControl.textContent = fit ? "Actual size" : "Fit to window";
            artPane.scrollTo(0, 0);
        });
        dialog.addEventListener("close", () => enlarge.focus({ preventScroll: true }));
    }
})();
