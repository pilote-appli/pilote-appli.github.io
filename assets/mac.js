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

    // Liste d'attente : l'adresse part vers le script Google de pilote.appli,
    // qui l'ajoute à un tableur. En cas d'échec, on renvoie vers le mail.
    var form = document.getElementById("liste-form");
    if (form) {
      var champ = document.getElementById("liste-email");
      var message = document.getElementById("liste-message");
      var bouton = form.querySelector('button[type="submit"]');
      var dire = function (texte, classe) { message.textContent = texte; message.className = "liste-message " + classe; };
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        var adresse = champ.value.trim();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adresse)) {
          dire("Cette adresse ne semble pas complète.", "err");
          champ.focus();
          return;
        }
        bouton.disabled = true;
        dire("Envoi…", "");
        var corps = new URLSearchParams();
        corps.append("email", adresse);
        corps.append("site", form.elements.site.value);
        fetch(form.getAttribute("data-adresse"), { method: "POST", body: corps })
          .then(function (r) { return r.json(); })
          .then(function (rep) {
            if (rep && rep.ok) {
              dire("C'est noté ! Vous serez prévenu à la sortie.", "ok");
              champ.value = "";
            } else {
              dire("Cette adresse ne semble pas valide.", "err");
            }
          })
          .catch(function () {
            dire("L'envoi n'a pas marché. Écrivez-nous plutôt à l'adresse ci-dessous.", "err");
          })
          .then(function () { bouton.disabled = false; });
      });
    }

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
