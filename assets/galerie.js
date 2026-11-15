// Galerie de l'accueil : une pilule par écran de Pilote. Sans ce script, tous
// les écrans restent affichés l'un sous l'autre (rien n'est caché d'avance).
// Flèches gauche et droite pour passer d'une pilule à l'autre (motif « onglets »).
document.addEventListener("DOMContentLoaded", function () {
  var galerie = document.querySelector(".galerie");
  if (!galerie) return;
  var boutons = Array.prototype.slice.call(galerie.querySelectorAll(".galerie-onglets button"));
  var ecrans = Array.prototype.slice.call(galerie.querySelectorAll(".galerie-ecran"));
  if (!boutons.length || boutons.length !== ecrans.length) return;

  function choisir(i, focus) {
    boutons.forEach(function (b, k) {
      var actif = k === i;
      b.setAttribute("aria-selected", actif ? "true" : "false");
      b.tabIndex = actif ? 0 : -1;
      ecrans[k].hidden = !actif;
    });
    if (focus) boutons[i].focus();
  }

  boutons.forEach(function (b, i) {
    b.addEventListener("click", function () { choisir(i, false); });
    b.addEventListener("keydown", function (e) {
      var n = boutons.length, j = null;
      if (e.key === "ArrowRight") j = (i + 1) % n;
      else if (e.key === "ArrowLeft") j = (i - 1 + n) % n;
      else if (e.key === "Home") j = 0;
      else if (e.key === "End") j = n - 1;
      if (j !== null) { e.preventDefault(); choisir(j, true); }
    });
  });

  galerie.classList.add("js-galerie");
  choisir(0, false);
});
