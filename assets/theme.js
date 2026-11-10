// Thème : sombre par défaut, clair si le visiteur l'a choisi (gardé dans ce
// navigateur seulement). Chargé dans <head> pour éviter un éclair de l'autre thème.
(function () {
  var cle = "pilote-theme";
  var racine = document.documentElement;
  try {
    var choix = localStorage.getItem(cle);
    if (choix === "light" || choix === "dark") racine.setAttribute("data-theme", choix);
  } catch (e) { /* stockage indisponible : thème sombre */ }

  document.addEventListener("DOMContentLoaded", function () {
    var bouton = document.querySelector(".theme-btn");
    if (!bouton) return;
    var majLibelle = function () {
      var clair = racine.getAttribute("data-theme") === "light";
      bouton.setAttribute("aria-label", clair ? "Passer en thème sombre" : "Passer en thème clair");
      bouton.title = bouton.getAttribute("aria-label");
    };
    majLibelle();
    bouton.addEventListener("click", function () {
      var suivant = racine.getAttribute("data-theme") === "light" ? "dark" : "light";
      racine.setAttribute("data-theme", suivant);
      try { localStorage.setItem(cle, suivant); } catch (e) { /* rien */ }
      majLibelle();
    });
  });
})();
