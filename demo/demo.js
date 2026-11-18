/* Démo en ligne de Pilote (site pilote-appli.github.io/demo/).

   Chargé AVANT tout autre script de index.html. Dans l'app, l'interface lit
   par le serveur local (/data, /cours, /history…) et écrit par le pont
   pywebview (save_*). Ici, aucun des deux n'existe : ce fichier répond à leur
   place avec les réponses enregistrées sur les données de Brice par
   build/demo/fabriquer_demo.py (window.__DEMO, dans demo-donnees.js).

   Rien ne sort de la page : les écritures sont acceptées puis oubliées, les
   connexions (Gmail, iCloud, montres, clé USB, imports) répondent « dans
   l'app ». Un rechargement repart des données de Brice.

   Deux modes :
   - enregistrement (window.__enreg existe, posé par fabriquer_demo.py) : les
     lectures sûres passent au vrai pont, et chaque réponse du serveur local
     est notée ;
   - démo (sur le site) : tout vient de window.__DEMO. */
(function () {
  "use strict";
  var D = window.__DEMO || { fetch: {}, pont: {}, methodes: [] };
  var ENREG = typeof window.__enreg === "function";

  // Lectures sans effet de bord, appelées pour de vrai pendant l'enregistrement
  var LECTURES = /^(load_|get_users$|app_info$|nouveautes$|data_folder_path$|jeton$|sauvegarde_status$|sante_ocr_available$|expositions_status$|agenda_prochaines$|agenda_a_venir$)/;
  // Gestes de fenêtre et d'icône : rien à faire dans un navigateur
  var SANS_EFFET = /^(minimize|maximize_toggle|close|notify|app_ready|fermeture_prete|set_app_icon_color|apply_icon_to_shortcuts|check_update|recheck_update)$/;
  // Demandées toutes seules par l'app (surveillance de la clé USB, synchro de
  // l'agenda) : refusées en silence, sans message. sauvegarde_usb_state n'est
  // pas enregistrée exprès : elle donnerait les clés USB du PC qui fabrique la démo.
  var EN_SILENCE = /^(sauvegarde_usb_state|agenda_synchroniser|expositions_update)$/;

  function copie(v) { return v === undefined ? null : JSON.parse(JSON.stringify(v)); }

  // ── Clé d'une requête : chemin + paramètres triés, sans les anti-cache ──
  function cleRequete(url) {
    var u = new URL(url, location.href);
    var p = new URLSearchParams(u.search);
    p.delete("t"); p.delete("_"); p.delete("cb");
    p.sort();
    var q = p.toString();
    return u.pathname + (q ? "?" + q : "");
  }
  function estLocal(url) {
    var u;
    try { u = new URL(url, location.href); } catch (e) { return false; }
    if (u.pathname.indexOf("/vendor/") >= 0) return false;
    return u.origin === location.origin || u.hostname === "127.0.0.1" || u.hostname === "localhost";
  }

  // ── Messages « dans l'app seulement » ──
  var dernierAvis = 0;
  function avisApp() {
    if (Date.now() - dernierAvis < 1500) return;
    dernierAvis = Date.now();
    var msg = "Dans la démo, rien ne s'enregistre et rien ne se connecte : c'est pour l'app installée.";
    if (typeof window.showToastModern === "function") window.showToastModern(msg, "warn");
  }

  // ── Le pont pywebview ──
  function repondreDemo(nom, args) {
    var k = nom + JSON.stringify(args);
    if (Object.prototype.hasOwnProperty.call(D.pont, k)) return copie(D.pont[k]);
    if (Object.prototype.hasOwnProperty.call(D.pont, nom)) return copie(D.pont[nom]);
    if (nom === "save_ui_prefs") return { ok: true, uiPrefs: copie(args[0]) };
    if (nom === "save_patrimoine") {
      var p = D.pont.load_patrimoine || {};
      return { ok: true, net: copie(p.net), serie: copie(p.serie), moisSaisi: copie(p.moisSaisi) };
    }
    if (/^save_/.test(nom) && !/(connexion|synchro|deconnexion|essai)$/.test(nom)) return { ok: true };
    if (SANS_EFFET.test(nom)) return { ok: true };
    if (nom === "open_url") {
      var url = String(args[0] || "");
      if (/^(https?:|mailto:)/i.test(url)) window.open(url, "_blank", "noopener");
      return { ok: true };
    }
    console.info("[démo] pas dans la démo :", nom);
    if (!EN_SILENCE.test(nom)) avisApp();
    return { ok: false, error: "disponible dans l'app installée" };
  }

  var api = {};
  (D.methodes || []).forEach(function (nom) {
    api[nom] = function () {
      var args = Array.prototype.slice.call(arguments);
      if (ENREG && LECTURES.test(nom)) return window.__enreg(nom, JSON.stringify(args));
      return Promise.resolve(repondreDemo(nom, args));
    };
  });
  window.pywebview = { api: api };
  function pret() { window.dispatchEvent(new Event("pywebviewready")); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", pret);
  else pret();

  // ── Le serveur local ──
  var brut = window.fetch.bind(window);
  if (ENREG) {
    // Le bloc du jeton (posé par le vrai serveur) enveloppe ce fetch-ci : la
    // requête arrive ici avec son jeton, part au vrai serveur, et sa réponse
    // est notée sous sa clé.
    window.fetch = function (input, init) {
      var url = typeof input === "string" ? input : (input && input.url) || "";
      var p = brut(input, init);
      if (!estLocal(url)) return p;
      return p.then(function (r) {
        if (r.ok) r.clone().text().then(function (t) { window.__enregFetch(cleRequete(url), t); });
        return r;
      });
    };
    return;
  }

  function trouver(cle) {
    if (Object.prototype.hasOwnProperty.call(D.fetch, cle)) return D.fetch[cle];
    // Même route, autres paramètres (une autre période de la courbe, une
    // autre liste de titres) : la réponse enregistrée la plus proche
    var chemin = cle.split("?")[0];
    var voulus = new URLSearchParams(cle.split("?")[1] || "");
    var mieux = null, score = -1;
    var titres = function (p) { return (p.get("tickers") || "").split(",").filter(Boolean); };
    Object.keys(D.fetch).forEach(function (k) {
      if (k.split("?")[0] !== chemin) return;
      var leurs = new URLSearchParams(k.split("?")[1] || ""), s = 0;
      // Pas un seul titre en commun : ce n'est pas la bonne réponse
      var a = titres(voulus), b = titres(leurs);
      if (a.length && !a.some(function (x) { return b.indexOf(x) >= 0; })) return;
      voulus.forEach(function (v, n) { if (leurs.get(n) === v) s += 2; else if (leurs.has(n)) s += 1; });
      if (s > score) { score = s; mieux = k; }
    });
    return mieux === null ? null : D.fetch[mieux];
  }

  window.fetch = function (input, init) {
    var url = typeof input === "string" ? input : (input && input.url) || "";
    if (!estLocal(url)) {
      // Les fichiers de la démo elle-même (vendor/), rien d'autre
      var u;
      try { u = new URL(url, location.href); } catch (e) { return Promise.reject(new TypeError("adresse invalide")); }
      if (u.origin === location.origin) return brut(input, init);
      return Promise.reject(new TypeError("démo : pas d'accès à Internet"));
    }
    var corps = trouver(cleRequete(url));
    if (corps === null) corps = JSON.stringify({ ok: false, error: "pas dans la démo" });
    return Promise.resolve(new Response(corps, { status: 200, headers: { "Content-Type": "application/json" } }));
  };

  // ── Ce qui change par rapport à l'app (après le chargement de index.html) ──
  function installer() {
    try { if (window.parent !== window) { window.parent.postMessage({ pilote: "installer" }, location.origin); return; } } catch (e) {}
    location.href = "../#installer";
  }

  window.addEventListener("DOMContentLoaded", function () {
    document.documentElement.classList.add("demo-en-ligne");
    var style = document.createElement("style");
    style.textContent = ".demo-en-ligne .titlebar-btns { display: none !important; }";
    document.head.appendChild(style);

    // « Revenir à mon profil » n'a pas de sens ici : il devient « Installer Pilote »
    window.quitterExemple = function () { if (window._visiteEcrire) window._visiteEcrire(null); installer(); };

    window._renderBandeauExemple = async function () {
      var box = document.getElementById("ex-bandeau");
      if (!box) return;
      document.body.classList.add("mode-exemple");
      box.innerHTML = '<i class="ph ph-flask"></i>' +
        '<span class="ex-bandeau-txt"><b>Démo.</b> Tu es dans Pilote avec Brice, un profil fictif. ' +
        'Clique partout : rien de ce que tu fais ici ne quitte cette page.</span>' +
        '<button type="button" class="btn btn-primary btn-sm" onclick="quitterExemple()">' +
        '<i class="ph ph-download-simple"></i> Installer Pilote</button>';
      box.hidden = false;
    };
    window._renderBandeauExemple();

    // Fin de la visite : l'invitation à installer
    var arretsApp = window._visiteArrets;
    if (typeof arretsApp === "function") {
      window._visiteArrets = function (mods) {
        var a = arretsApp(mods), fin = a[a.length - 1];
        if (fin && fin.fin) {
          fin.t = "Voilà, tu as fait le tour&#8239;!";
          fin.x = "Si Pilote t'a plu, installe-le&nbsp;: c'est gratuit, et tes données resteront sur ton ordinateur. " +
                  "Tu peux aussi continuer à cliquer partout chez Brice.";
        }
        return a;
      };
    }
    var montrerApp = window._visiteMontrer;
    if (typeof montrerApp === "function") {
      window._visiteMontrer = async function () {
        await montrerApp.apply(this, arguments);
        var box = document.getElementById("pilou-visite");
        if (!box) return;
        var rester = box.querySelector('[data-vis="rester"]');
        var retour = box.querySelector('[data-vis="retour"]');
        if (rester) rester.textContent = "Continuer la démo";
        if (retour) retour.innerHTML = '<i class="ph ph-download-simple"></i> Installer Pilote';
      };
    }

    // Au démarrage : Pilou propose la visite, on peut aussi se débrouiller
    var essais = 0;
    var t = setInterval(function () {
      essais++;
      // _hydrationDone est un « let » de index.html : visible par son nom, pas sur window
      var lu = false;
      try { lu = _hydrationDone; } catch (e) {}   // eslint-disable-line no-undef
      var pretAccueil = lu && document.querySelector("#home-cards > *");
      if (!pretAccueil && essais < 100) return;
      clearInterval(t);
      if (!pretAccueil) return;
      var enCours = false;
      try { enCours = !!sessionStorage.getItem("pilote.visite"); } catch (e) {}
      if (enCours || document.getElementById("pilou-visite")) return;
      setTimeout(proposerVisite, 600);
    }, 100);
  });

  function proposerVisite() {
    if (document.getElementById("pilou-astuce") || typeof window.pilouSvg !== "function") return;
    var box = document.createElement("div");
    box.id = "pilou-astuce";
    box.className = "pl-flot";
    box.innerHTML = '<span class="pilou" aria-hidden="true">' + window.pilouSvg("salut") + '</span>' +
      '<div class="pp-bulle"><button type="button" class="pl-flot-x" aria-label="Fermer"><i class="ph ph-x"></i></button>' +
      '<div class="pl-flot-t">Salut, moi c’est Pilou&#8239;!</div>' +
      'Voici Pilote avec les données de Brice. Je te fais visiter écran par écran, ou tu te débrouilles&#8239;?' +
      '<div class="pl-flot-acts"><span class="sp"></span>' +
      '<button type="button" class="btn btn-ghost btn-sm" data-non>Je me débrouille</button>' +
      '<button type="button" class="btn btn-primary btn-sm" data-oui><i class="ph ph-compass"></i> Visiter avec Pilou</button>' +
      '</div></div>';
    document.body.appendChild(box);
    box.querySelector("[data-oui]").onclick = function () { box.remove(); window.pilouVisiterMesModules(); };
    box.querySelectorAll("[data-non], .pl-flot-x").forEach(function (b) { b.onclick = function () { box.remove(); }; });
  }
})();
