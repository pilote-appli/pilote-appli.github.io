// Page « Pilote sur Mac » : bouton Copier de la ligne du Terminal, bouton Ko-fi
// inactif tant que la page n'existe pas, apparition des blocs au défilement.
// Sans ce script, tout reste visible et utilisable.
(function () {
  document.documentElement.classList.add("js");

  document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll(".copier").forEach(function (bouton) {
      bouton.addEventListener("click", function () {
        var cible = document.getElementById(bouton.getAttribute("data-copie"));
        if (!cible || !navigator.clipboard) return;
        navigator.clipboard.writeText(cible.textContent.trim()).then(function () {
          bouton.innerHTML = '<i class="ph ph-check" aria-hidden="true"></i>';
          bouton.setAttribute("aria-label", "Ligne copiée");
          setTimeout(function () {
            bouton.innerHTML = '<i class="ph ph-copy" aria-hidden="true"></i>';
            bouton.setAttribute("aria-label", "Copier la ligne");
          }, 1600);
        }, function () { /* copie refusée : la ligne reste sélectionnable */ });
      });
    });

    document.querySelectorAll('a[aria-disabled="true"]').forEach(function (lien) {
      lien.addEventListener("click", function (e) { e.preventDefault(); });
    });

    var blocs = document.querySelectorAll(".apparait");
    if (!("IntersectionObserver" in window)) {
      blocs.forEach(function (b) { b.classList.add("vu"); });
      return;
    }
    var io = new IntersectionObserver(function (entrees) {
      entrees.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("vu"); io.unobserve(e.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px" });
    blocs.forEach(function (b) { io.observe(b); });
  });
})();
