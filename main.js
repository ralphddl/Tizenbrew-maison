// Module TizenBrew « Maison » : Home Assistant à la télécommande.
// Flèches : déplacent un pointeur (plus vite si on reste appuyé ; au bord de l'écran, la page défile).
// OK : clique sous le pointeur (menus, équipements, plan…). Retour : ferme la fenêtre ouverte, sinon page précédente.
(function () {
    if (window.__maisonPointeur) return;
    window.__maisonPointeur = true;

    // Agrandissement pour la télé (1,5 = 150 %) : on réduit la largeur virtuelle de la page,
    // ce qui garde les clics justes ; à défaut, zoom CSS.
    var ECHELLE = 1.5;
    function agrandir() {
        var largeur = Math.round(screen.width / ECHELLE);
        var m = document.querySelector('meta[name="viewport"]');
        if (!m) { m = document.createElement("meta"); m.name = "viewport"; (document.head || document.documentElement).appendChild(m); }
        m.content = "width=" + largeur + ", user-scalable=no";
        setTimeout(function () {
            if (window.innerWidth > largeur + 50) document.documentElement.style.zoom = ECHELLE;
            x = window.innerWidth / 2; y = window.innerHeight / 2; placer();
        }, 800);
    }

    var x = window.innerWidth / 2, y = window.innerHeight / 2, vitesse = 0, dernier = 0;
    var p = document.createElement("div");
    p.style.cssText = "position:fixed;left:0;top:0;width:34px;height:34px;margin:-4px 0 0 -4px;z-index:2147483647;" +
        "pointer-events:none;transition:transform 60ms linear;";
    p.innerHTML = '<svg width="34" height="34" viewBox="0 0 24 24"><path d="M4 2l15 11-7 1 4 8-3 1-4-8-5 5z" ' +
        'fill="#fff" stroke="#000" stroke-width="1.5" stroke-linejoin="round"/></svg>';

    function placer() { p.style.transform = "translate(" + x + "px," + y + "px)"; }
    function installer() {
        if (!document.body) return setTimeout(installer, 200);
        document.documentElement.appendChild(p); placer(); agrandir();
    }
    installer();

    // Élément réel sous le pointeur, en descendant dans les composants de Home Assistant.
    function sous(px, py) {
        var el = document.elementFromPoint(px, py);
        while (el && el.shadowRoot) {
            var d = el.shadowRoot.elementFromPoint(px, py);
            if (!d || d === el) break;
            el = d;
        }
        return el;
    }
    function parent(el) { return el.parentNode && el.parentNode.host ? el.parentNode.host : el.parentNode; }
    function defilable(el, vertical) {
        while (el && el.nodeType === 1) {
            var s = getComputedStyle(el);
            var o = vertical ? s.overflowY : s.overflowX;
            if ((o === "auto" || o === "scroll") &&
                (vertical ? el.scrollHeight > el.clientHeight : el.scrollWidth > el.clientWidth)) return el;
            el = parent(el);
        }
        return null;
    }
    function defiler(dx, dy) {
        var el = defilable(sous(x, y), dy !== 0);
        if (el) { el.scrollTop += dy; el.scrollLeft += dx; } else window.scrollBy(dx, dy);
    }
    function actifProfond() {
        var el = document.activeElement;
        while (el && el.shadowRoot && el.shadowRoot.activeElement) el = el.shadowRoot.activeElement;
        return el;
    }
    function cliquer() {
        var el = sous(x, y);
        if (!el) return;
        var o = { bubbles: true, cancelable: true, composed: true, clientX: x, clientY: y, button: 0, view: window };
        try { el.dispatchEvent(new PointerEvent("pointerdown", o)); } catch (e) {}
        el.dispatchEvent(new MouseEvent("mousedown", o));
        if (el.focus) el.focus();
        try { el.dispatchEvent(new PointerEvent("pointerup", o)); } catch (e) {}
        el.dispatchEvent(new MouseEvent("mouseup", o));
        el.dispatchEvent(new MouseEvent("click", o));
    }
    function fermerDialogue() {
        var el = actifProfond() || document.body;
        var o = { key: "Escape", code: "Escape", keyCode: 27, which: 27, bubbles: true, composed: true, cancelable: true };
        el.dispatchEvent(new KeyboardEvent("keydown", o));
        // Fenêtres de Home Assistant (more-info, menus) : présentes dans <home-assistant>
        var ha = document.querySelector("home-assistant");
        var racine = ha && ha.shadowRoot;
        return !!(racine && racine.querySelector("ha-more-info-dialog, ha-dialog, dialog-box"));
    }

    document.addEventListener("keydown", function (e) {
        var k = e.keyCode;
        var saisie = (function (a) { return a && /^(INPUT|TEXTAREA)$/.test(a.tagName); })(actifProfond());
        if (k === 10009) {
            e.preventDefault(); e.stopPropagation();
            if (!fermerDialogue() && history.length > 1) history.back();
            return;
        }
        if (k === 13) {
            if (saisie) return;            // OK dans un champ : comportement normal (clavier de la télé)
            e.preventDefault(); e.stopPropagation(); cliquer(); return;
        }
        if (k < 37 || k > 40) return;
        if (saisie && (k === 37 || k === 39)) return;   // gauche/droite dans un champ : déplacer le curseur du texte
        e.preventDefault(); e.stopPropagation();
        var t = Date.now();
        vitesse = t - dernier < 180 ? Math.min(vitesse + 6, 60) : 14;
        dernier = t;
        var dx = k === 37 ? -vitesse : k === 39 ? vitesse : 0;
        var dy = k === 38 ? -vitesse : k === 40 ? vitesse : 0;
        var W = window.innerWidth, H = window.innerHeight, M = 30;
        x = Math.max(0, Math.min(W - 1, x + dx));
        y = Math.max(0, Math.min(H - 1, y + dy));
        if (y <= M && dy < 0 || y >= H - M && dy > 0) defiler(0, dy * 4);
        if (x <= M && dx < 0 || x >= W - M && dx > 0) defiler(dx * 4, 0);
        placer();
    }, true);
})();
