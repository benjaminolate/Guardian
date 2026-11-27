(function () {
  var ENDPOINT = window.GUARDIAN_ENDPOINT || "";
  var params = new URLSearchParams(location.search);
  var source = params.get("src") || "directo"; // ej: ?src=feria, ?src=grupo-barrio
  var session = getSession();
  var chosenPlan = "";

  function getSession() {
    try {
      var s = sessionStorage.getItem("g_session");
      if (!s) {
        s = Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
        sessionStorage.setItem("g_session", s);
      }
      return s;
    } catch (e) {
      return "sin-sesion";
    }
  }

  function track(event, extra) {
    var data = Object.assign({
      evento: event,
      fuente: source,
      sesion: session,
      pantalla: window.innerWidth < 700 ? "celular" : "computador",
      fecha: new Date().toISOString()
    }, extra || {});

    if (!ENDPOINT) {
      try {
        var log = JSON.parse(localStorage.getItem("g_log") || "[]");
        log.push(data);
        localStorage.setItem("g_log", JSON.stringify(log));
      } catch (e) {}
      console.log("[Guardián] evento (sin endpoint):", data);
      return Promise.resolve();
    }
    return fetch(ENDPOINT, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(data)
    }).catch(function () {});
  }

  track("visita");

  // Clics en botones que llevan a los planes
  document.querySelectorAll("[data-cta]").forEach(function (el) {
    el.addEventListener("click", function () {
      track("clic_cta", { boton: el.getAttribute("data-cta") });
    });
  });

  // Video demostrativo
  var video = document.getElementById("demo");
  var playBtn = document.querySelector(".video-play");
  if (video) {
    var fig = video.closest(".video");
    var sentPlay = false, sentHalf = false, sentEnd = false;
    if (playBtn) playBtn.addEventListener("click", function () { video.play(); });
    video.addEventListener("click", function () { if (!video.controls) video.play(); });
    video.addEventListener("play", function () {
      fig.classList.add("playing");
      video.controls = true;
      if (!sentPlay) { sentPlay = true; track("video_play"); }
    });
    video.addEventListener("timeupdate", function () {
      if (!sentHalf && video.duration && video.currentTime / video.duration >= 0.5) { sentHalf = true; track("video_mitad"); }
    });
    video.addEventListener("ended", function () {
      if (!sentEnd) { sentEnd = true; track("video_fin"); }
    });
  }

  // Modal
  var modal = document.getElementById("modal");
  var stepForm = document.getElementById("step-form");
  var stepThanks = document.getElementById("step-thanks");
  var planName = document.getElementById("plan-name");
  var lastFocus = null;

  function openModal() {
    lastFocus = document.activeElement;
    stepForm.hidden = false;
    stepThanks.hidden = true;
    modal.hidden = false;
    document.body.style.overflow = "hidden";
    var first = modal.querySelector("input");
    if (first) first.focus();
  }
  function closeModal() {
    modal.hidden = true;
    document.body.style.overflow = "";
    if (lastFocus) lastFocus.focus();
  }

  document.querySelectorAll("[data-plan]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      chosenPlan = btn.getAttribute("data-plan");
      planName.textContent = chosenPlan === "familia" ? "del plan Familia" : "del plan Personal";
      track("elige_plan", { plan: chosenPlan });
      openModal();
    });
  });

  modal.querySelector(".modal-close").addEventListener("click", closeModal);
  modal.querySelector(".modal-done").addEventListener("click", closeModal);
  modal.addEventListener("click", function (e) { if (e.target === modal) closeModal(); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !modal.hidden) closeModal(); });

  document.getElementById("lead-form").addEventListener("submit", function (e) {
    e.preventDefault();
    var f = e.target;
    var btn = f.querySelector("button[type=submit]");
    btn.disabled = true;
    btn.textContent = "Enviando…";
    track("registro", {
      plan: chosenPlan,
      nombre: f.nombre.value.trim(),
      contacto: f.contacto.value.trim(),
      perfil: f.perfil.value
    }).then(function () {
      f.reset();
      btn.disabled = false;
      btn.textContent = "Avísenme cuando esté lista";
      stepForm.hidden = true;
      stepThanks.hidden = false;
    });
  });
})();
