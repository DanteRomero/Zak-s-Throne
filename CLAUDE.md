# Zak's Throne

Juego de navegador en JavaScript puro, sin dependencias ni paso de compilación: `index.html` carga los archivos de `src/`. Todo lo que ve el jugador y la documentación van en castellano rioplatense.

## Al terminar un pedido

1. **Corré los tests** (ver abajo). Si alguno falla, no hagas push: arreglalo o avisá qué falló.
2. **Sumá la versión nueva** en estos tres lugares:
   - `CHANGELOG.md`: entrada arriba de todo con `## vX.Y — AAAA-MM-DD`, seguida de `* Feature`, `* Change` o `* Fix`, cada uno con líneas `- cambio concreto`.
   - `index.html`: la versión del pie de página.
   - `README.md`: la línea «Versión actual».
3. **Hacé commit y push directo a `main`**, salvo que se pida una rama o un pull request. El mensaje del commit es la versión, por ejemplo `v2.17`.

## Tests

```
node tests/rules.test.js
python tests/browser_check.py tests/index.html --script tests/engine.test.js
python tests/browser_check.py index.html --script tests/ui.test.js
python tests/browser_check.py index.html --script tests/ranking.test.js
python tests/browser_check.py index.html --script tests/cloud.test.js
python tests/browser_check.py index.html --touch --width 844 --height 390 --script tests/touch.test.js
```

Los tests de navegador imprimen un JSON con `passed` y `failed`. Usan Chrome: toman la ruta de `CHROME_PATH` y, si no está definida, la de Windows. Si agregás pruebas, actualizá los totales de la sección de tests del `README.md`.

## No ensuciar el ranking

Las pruebas no deben dejar perfiles en el ranking de los amigos.

- Probá siempre con `tests/browser_check.py` o su clase `Browser`, también en los scripts sueltos y las capturas. Bloquean Supabase, así que nada llega al ranking ni a la nube reales.
- Si tenés que usar otra herramienta sobre el juego real, poné el apodo `Test` y, al terminar, borrá esa fila por su `run_id`. Si no se puede borrar, avisá; el apodo `Test` la deja identificada.
- Nunca borres filas de otros nombres sin que te lo pidan: pueden ser partidas reales.

## Partidas guardadas

Hay amigos jugando partidas reales, guardadas en su navegador con claves que empiezan con `zak.throne.save.`. Un cambio no debe hacerles perder progreso:

- No cambies ese prefijo.
- Las partidas viejas tienen que seguir cargando. Si cambia el formato, agregá valores por defecto o una migración, con un test que cargue un guardado viejo.
- Tené cuidado con `src/cloud.js`: borrar una ranura en la nube también la borra en los otros dispositivos de esa cuenta.
