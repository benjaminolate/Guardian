# Landing de validación · Guardián

Landing page para validar el interés en **Guardián**, una app que funcionaría en segundo plano y avisaría si un mensaje, llamada o enlace parece estafa. Proyecto del Grupo 3 (Ciberseguridad), Taller de Creatividad e Innovación, UGM.

La app todavía no existe. La página la muestra como producto terminado, con planes y precios, para medir cuántas personas la quieren de verdad. Cuando alguien elige un plan se le dice que la app está en desarrollo, que no se le cobra nada y se le invita a dejar sus datos para la lista de espera.

## Qué mide

| Evento | Cuándo pasa |
|---|---|
| `visita` | Alguien abre la página |
| `video_play` / `video_mitad` / `video_fin` | Le da play al video, llega a la mitad o lo termina |
| `clic_cta` | Toca un botón "Quiero protegerme" |
| `elige_plan` | Toca "Quiero este plan" (Personal o Familia) |
| `registro` | Deja nombre, contacto y para quién es |

La hoja `resumen` calcula sola las visitas, los registros y el porcentaje de conversión.

## Puesta en marcha

### 1. Publicar la página (GitHub Pages)
1. En el repositorio, ve a **Settings → Pages**.
2. En *Source* elige **Deploy from a branch**, rama `main` y carpeta `/ (root)`. Guarda.
3. En un par de minutos queda en `https://benjaminolate.github.io/landin-page-ciberseguridad/`.

### 2. Conectar la planilla de Google
1. Crea una planilla nueva en Google Sheets.
2. Ve a **Extensiones → Apps Script**, borra lo que haya y pega el contenido de `apps-script/Code.gs`. Guarda.
3. **Implementar → Nueva implementación → Tipo: Aplicación web.**
   - Ejecutar como: *Yo*.
   - Quién tiene acceso: *Cualquier persona*.
4. Autoriza los permisos y copia la URL que termina en `/exec`.
5. Pégala en `config.js`:
   ```js
   window.GUARDIAN_ENDPOINT = "https://script.google.com/macros/s/XXXX/exec";
   ```
6. Haz commit y push. Las hojas `eventos`, `registros` y `resumen` se crean solas con la primera visita.

### 3. Saber de dónde viene cada persona
Agrega `?src=` al link según el canal, así la planilla separa los resultados:

- `.../?src=feria` para el QR impreso que se muestra en la calle, la feria o el mall
- `.../?src=grupo-barrio` para el link que se comparte en grupos de Facebook o WhatsApp
- `.../?src=video` para el link que va debajo del video demostrativo

## Cambiar textos o precios
Todo está en `index.html`. Los precios están en la sección `id="precios"`.
