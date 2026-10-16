// Module TizenBrew « Maison » : affiche Home Assistant et le rend utilisable à la télécommande.
// Flèches haut/bas : passer au champ ou bouton précédent/suivant (y compris dans les composants de Home Assistant).
// Retour : revenir en arrière dans Home Assistant.
(function () {
    var SELECTEUR = "input:not([type=hidden]), textarea, select, button, a[href], [role=button], [role=checkbox], [tabindex]:not([tabindex='-1'])";

    function collecter(racine, liste) {
        var enfants = racine.children || [];
        for (var i = 0; i < enfants.length; i++) {
            var el = enfants[i];
            if (el.matches && el.matches(SELECTEUR) && !el.disabled) {
                var r = el.getBoundingClientRect();
                if (r.width > 0 && r.height > 0) liste.push(el);
            }
            if (el.shadowRoot) collecter(el.shadowRoot, liste);
            collecter(el, liste);
        }
        return liste;
    }

    function actif() {
        var el = document.activeElement;
        while (el && el.shadowRoot && el.shadowRoot.activeElement) el = el.shadowRoot.activeElement;
        return el;
    }

    document.addEventListener("keydown", function (e) {
        if (e.keyCode === 10009) {
            if (history.length > 1) { e.preventDefault(); history.back(); }
            return;
        }
        if (e.keyCode !== 38 && e.keyCode !== 40) return;
        var liste = collecter(document, []);
        if (!liste.length) return;
        var i = liste.indexOf(actif());
        var j = i < 0 ? 0 : i + (e.keyCode === 40 ? 1 : -1);
        if (j < 0 || j >= liste.length) return;
        e.preventDefault();
        e.stopPropagation();
        liste[j].focus();
        if (liste[j].scrollIntoView) liste[j].scrollIntoView({ block: "center" });
    }, true);
})();
