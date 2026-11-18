// Démo de l'accueil : la vraie interface de Pilote (dossier demo/, fabriqué
// par build/demo/fabriquer_demo.py dans le dépôt de Pilote) dans un cadre.
// Pilote est pensé pour un écran d'ordinateur d'au moins 1366 px de large :
// la page est affichée à cette taille puis réduite pour tenir dans le cadre.
// Sur un téléphone, ou sans JS, la capture de l'accueil reste à la place.
document.addEventListener("DOMContentLoaded", function () {
  var cadre = document.querySelector("[data-demo]");
  if (!cadre) return;
  var iframe = cadre.querySelector("iframe");
  var LARGEUR = 1366, HAUTEUR = 740;
  var ordinateur = window.matchMedia("(min-width: 760px)");

  function ajuster() {
    var s = Math.min(1, cadre.clientWidth / LARGEUR);
    iframe.style.transform = "scale(" + s + ")";
    cadre.style.height = Math.round(HAUTEUR * s) + "px";
  }
  function mettreEnPlace() {
    if (!ordinateur.matches) {
      cadre.classList.remove("demo-active");
      cadre.style.height = "";
      return;
    }
    if (!iframe.getAttribute("src")) iframe.setAttribute("src", iframe.dataset.src);
    cadre.classList.add("demo-active");
    ajuster();
  }
  mettreEnPlace();
  window.addEventListener("resize", mettreEnPlace);
  if (ordinateur.addEventListener) ordinateur.addEventListener("change", mettreEnPlace);

  // « Installer Pilote » dans la démo : on descend jusqu'aux boutons
  window.addEventListener("message", function (e) {
    if (e.origin !== location.origin || !e.data || e.data.pilote !== "installer") return;
    var bloc = document.getElementById("installer");
    if (!bloc) return;
    var doux = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    bloc.scrollIntoView({ behavior: doux ? "smooth" : "auto", block: "center" });
    var b = bloc.querySelector(".btn");
    if (b) b.focus({ preventScroll: true });
  });
});
