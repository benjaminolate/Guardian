/**
 * Recibe los eventos de la landing de Guardián y los guarda en esta planilla.
 * Hojas que crea solo:
 *   - "eventos": todo lo que pasa (visita, video_play, clic_cta, elige_plan, registro...)
 *   - "registros": solo las personas que dejaron sus datos
 *   - "resumen": conteos para el control, recalculados en cada evento
 * Las visitas cuya fuente empieza con "prueba" no se cuentan en el resumen.
 */
function doPost(e) {
  var data = JSON.parse(e.postData.contents);
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  var ev = getSheet(ss, "eventos", ["fecha", "evento", "fuente", "sesion", "pantalla", "boton", "plan"]);
  ev.appendRow([data.fecha, data.evento, data.fuente, data.sesion, data.pantalla, data.boton || "", data.plan || ""]);

  if (data.evento === "registro") {
    var reg = getSheet(ss, "registros", ["fecha", "nombre", "contacto", "perfil", "plan", "fuente", "sesion"]);
    // El apóstrofo guarda el contacto como texto (así no se pierde el "+")
    reg.appendRow([data.fecha, data.nombre, "'" + data.contacto, data.perfil, data.plan, data.fuente, data.sesion]);
  }

  updateSummary(ss);
  return ContentService.createTextOutput("ok");
}

function getSheet(ss, name, headers) {
  var sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    sh.appendRow(headers);
    sh.setFrozenRows(1);
  }
  return sh;
}

function isTest(fuente) {
  return String(fuente || "").toLowerCase().indexOf("prueba") === 0;
}

function updateSummary(ss) {
  var evSheet = ss.getSheetByName("eventos");
  var regSheet = ss.getSheetByName("registros");
  var ev = evSheet ? evSheet.getDataRange().getValues().slice(1) : [];
  var rg = regSheet ? regSheet.getDataRange().getValues().slice(1) : [];

  var uniq = { visita: {}, video_play: {}, video_fin: {}, elige_plan: {} };
  var clics = 0, porFuente = {};
  ev.forEach(function (r) {
    var evento = r[1], fuente = r[2], sesion = r[3];
    if (isTest(fuente)) return;
    if (uniq[evento]) uniq[evento][sesion] = true;
    if (evento === "clic_cta") clics++;
    if (evento === "visita") {
      porFuente[fuente] = porFuente[fuente] || { visitas: {}, registros: 0 };
      porFuente[fuente].visitas[sesion] = true;
    }
  });

  var registros = 0, objetivo = 0;
  rg.forEach(function (r) {
    var perfil = r[3], fuente = r[5];
    if (isTest(fuente)) return;
    registros++;
    if (perfil === "para-mi-55-70" || perfil === "para-mis-padres") objetivo++;
    porFuente[fuente] = porFuente[fuente] || { visitas: {}, registros: 0 };
    porFuente[fuente].registros++;
  });

  var n = function (o) { return Object.keys(o).length; };
  var visitas = n(uniq.visita);
  var pct = function (x) { return visitas ? x / visitas : 0; };

  var rows = [
    ["Métrica", "Valor"],
    ["Visitas (personas únicas)", visitas],
    ["Le dieron play al video", n(uniq.video_play)],
    ["Vieron el video completo", n(uniq.video_fin)],
    ["Clics en 'Quiero protegerme'", clics],
    ["Eligieron un plan (personas únicas)", n(uniq.elige_plan)],
    ["Dejaron sus datos", registros],
    ["  de ellos, 55-70 años o para sus papás", objetivo],
    ["% de visitas que eligen plan", pct(n(uniq.elige_plan))],
    ["% de visitas que dejan sus datos", pct(registros)],
    ["", ""],
    ["Fuente", "Visitas / Registros"]
  ];
  Object.keys(porFuente).sort().forEach(function (f) {
    rows.push([f, n(porFuente[f].visitas) + " / " + porFuente[f].registros]);
  });

  var sh = ss.getSheetByName("resumen") || ss.insertSheet("resumen");
  sh.clear();
  sh.getRange(1, 1, rows.length, 2).setValues(rows);
  sh.getRange("B2:B8").setNumberFormat("0");
  sh.getRange("B9:B10").setNumberFormat("0%");
  sh.getRange("A1:B1").setFontWeight("bold");
  sh.getRange(12, 1, 1, 2).setFontWeight("bold");
  sh.setFrozenRows(1);
  sh.autoResizeColumns(1, 2);
}
