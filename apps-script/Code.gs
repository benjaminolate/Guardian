/**
 * Recibe los eventos de la landing de Guardián y los guarda en esta planilla.
 * Hojas que crea solo:
 *   - "eventos": todo lo que pasa (visita, clic_cta, elige_plan, registro)
 *   - "registros": solo las personas que dejaron sus datos
 *   - "resumen": conteos para el control (visitas, clics, registros, % conversión)
 */
function doPost(e) {
  var data = JSON.parse(e.postData.contents);
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  var ev = getSheet(ss, "eventos", ["fecha", "evento", "fuente", "sesion", "pantalla", "boton", "plan"]);
  ev.appendRow([data.fecha, data.evento, data.fuente, data.sesion, data.pantalla, data.boton || "", data.plan || ""]);

  if (data.evento === "registro") {
    var reg = getSheet(ss, "registros", ["fecha", "nombre", "contacto", "perfil", "plan", "fuente", "sesion"]);
    reg.appendRow([data.fecha, data.nombre, data.contacto, data.perfil, data.plan, data.fuente, data.sesion]);
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

function updateSummary(ss) {
  var sh = ss.getSheetByName("resumen");
  if (sh) return; // ya tiene fórmulas
  sh = ss.insertSheet("resumen");
  sh.getRange("A1:B1").setValues([["Métrica", "Valor"]]);
  sh.getRange("A2:A8").setValues([
    ["Visitas (personas únicas)"],
    ["Clics en 'Quiero protegerme'"],
    ["Eligieron un plan (personas únicas)"],
    ["Dejaron sus datos"],
    ["  de ellos, 55-70 años o para sus papás"],
    ["% de visitas que eligen plan"],
    ["% de visitas que dejan sus datos"]
  ]);
  sh.getRange("B2:B8").setFormulas([
    ["=IFERROR(COUNTUNIQUE(FILTER(eventos!D:D, eventos!B:B=\"visita\")),0)"],
    ["=COUNTIF(eventos!B:B,\"clic_cta\")"],
    ["=IFERROR(COUNTUNIQUE(FILTER(eventos!D:D, eventos!B:B=\"elige_plan\")),0)"],
    ["=IFERROR(COUNTA(registros!B:B)-1,0)"],
    ["=IFERROR(COUNTIF(registros!D:D,\"para-mi-55-70\")+COUNTIF(registros!D:D,\"para-mis-padres\"),0)"],
    ["=IFERROR(B4/B2,0)"],
    ["=IFERROR(B5/B2,0)"]
  ]);
  sh.getRange("B7:B8").setNumberFormat("0%");
  sh.setFrozenRows(1);
  sh.autoResizeColumns(1, 2);
}
