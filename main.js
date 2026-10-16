// Module TizenBrew « Maison » : affiche Home Assistant tel quel.
// Touche Retour de la télécommande : revenir en arrière dans Home Assistant.
document.addEventListener("keydown", function (e) {
    if (e.keyCode === 10009 && history.length > 1) { e.preventDefault(); history.back(); }
});
