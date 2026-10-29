# Zak's Throne — Crónicas de los Aromos

Una aventura de acción y exploración en pixel art, vista desde arriba. Elegí a uno de seis amigos, preparate en la aldea y salí a explorar la cueva y los Yuyos.

## Jugar

1. Hacé doble clic en `Jugar.bat`, o abrí `index.html` con Chrome o Microsoft Edge.
2. Elegí **Juego nuevo**, seleccioná un personaje y empezá la aventura.
3. El arco está en la aldea. Buscá el brillo y acercate para recogerlo.

El juego funciona directamente desde sus archivos: no requiere servidor, instalación, conexión, cuenta ni dependencias. Conservá la carpeta `src` junto a `index.html`.

**Juego nuevo** empieza una partida independiente sin borrar las tres ranuras. **Cargar juego** solo permite elegir ranuras con una partida válida. **Salir** detiene el juego; si el navegador no permite cerrar una pestaña abierta manualmente, podés cerrarla con su botón habitual.

## Controles

| Acción | Control |
| --- | --- |
| Moverse | WASD o flechas |
| Correr | Mantener Shift mientras te movés |
| Atacar | Espacio o clic en el mundo |
| Rodar y esquivar | F o clic derecho (hacia el puntero) |
| Habilidad activa | Q |
| Recoger / usar el pozo / comprar | E |
| Usar hierba de la bolsa | R |
| Cambiar arma | 1, 2, 3 y 4; también sus botones |
| Ficha y mejoras | C |
| Diario de viaje | J |
| Mapa | M |
| Pausa y guardado | Esc |
| Sonido | Botón musical de la esquina superior |

La dirección de movimiento orienta al personaje; el ratón permite dirigir ataques a un punto del mundo.

### En el celular

- **Joystick analógico:** apoyá el pulgar en cualquier parte de la mitad izquierda y arrastrá. Inclinarlo poco camina más despacio.
- **Botones para el pulgar derecho:** ⚔ ataca y apunta solo al enemigo más cercano, ⟲ rueda, ✦ usa la habilidad, E se ilumina cuando hay algo para usar cerca, ❦ usa una hierba, » activa o desactiva la carrera y el botón de arma rota entre las conseguidas.
- **Arriba:** ficha, diario, mapa, pausa y ⛶ para pantalla completa, que también intenta fijar la orientación horizontal.
- El teléfono vibra al recibir daño (se desactiva junto con la sacudida de pantalla). Se juega en horizontal o en vertical, aunque en horizontal se ve más mundo. Los botones de la interfaz también permiten acceder a habilidades, armas, ficha, mapa y pausa.

El juego se adapta al tamaño de pantalla; en teléfonos conviene usar orientación horizontal. Los indicadores combinan texto, iconos y color. Las opciones permiten ajustar sonido, efectos visuales y la sacudida de pantalla.

## Ranking de amigos

Desde el menú principal o la pausa, **Ranking de amigos** muestra nivel, enemigos derrotados y jefes vencidos de cada partida, con pestañas para ordenar por cada uno. El nombre se elige al seleccionar el personaje.

Sin configuración, el ranking muestra las partidas de cada dispositivo. Para compartirlo entre todos los dispositivos, seguí [docs/RANKING.md](docs/RANKING.md): se conecta un proyecto gratuito de Supabase pegando dos valores en `src/config.js`.

## Guardar y recuperar partidas

Hay **tres ranuras de guardado manual** accesibles desde la pausa. Cada una muestra el personaje y el progreso de esa partida. Al comenzar una aventura nueva las ranuras existentes quedan intactas.

Los guardados se conservan en el almacenamiento local del navegador usado para jugar. Para trasladarlos a otro navegador o equipo, usá **Exportar** y **Importar**: se descarga o carga un archivo JSON de respaldo. Conservá una copia antes de borrar los datos del navegador.

## El mundo

- **Aldea de los Aromos:** zona completamente segura, con casas, árboles, flores y vecinos que caminan y tienen colisión. Los enemigos no pueden entrar. El pozo permite recuperar vida y el puesto de **El Almacén** vende provisiones. Acá se encuentra el arco.
- **Cueva:** zona oscura habitada por chorros y perros callejeros. La piedra se encuentra en su interior. En el fondo oeste, sentado en un trono, espera **El Capo del Eco**.
- **Yuyos:** pastos altos, serpientes y ratas. Acá se encuentra la espada y Paco recibe su bonificación de Campesino. En el rincón noreste anida **La Yarará Madre**.

El mapa marca el almacén ($) y las guaridas de los jefes (☠). El diario de exploración, los avisos de interacción y las pistas iniciales ayudan a orientarte. Los enemigos vuelven a aparecer después de **35 segundos**; los jefes, después de **3 minutos**.

Al quedar noqueado volvés a la aldea. Si te vence un chorro aparece «Uhh... este gil me sacó guita»… y es literal: un chorro o el Capo se llevan el **30%** de tus monedas. Cualquier otra derrota cuesta el **10%**.

## Combate

- **Rodar (F o clic derecho):** una voltereta rápida que gasta 20% de energía. Mientras dura (0,3 s) ningún golpe ni proyectil te hace daño; el veneno que ya tenés sigue actuando. Rodar también te saca de encima una rata prendida. No se puede rodar agotado.
- **Combos:** cada golpe que conecta suma al combo si no dejás pasar mucho tiempo. El **cuarto golpe seguido es crítico** e inflige ×1,75. El HUD muestra el combo y avisa con ✦ cuando el próximo golpe es crítico.
- Los golpes producen chispas, la cámara se sacude con críticos y daño fuerte, y la pantalla destella al recibir daño.

## Guita, hierbas y El Almacén

Los enemigos sueltan monedas al caer: ratas 1–2, perros 2–4, serpientes 2–5, chorros 5–9 y jefes 40–60, más un extra según su nivel. Se recogen solas al pasar cerca y desaparecen a los 30 segundos.

Las hierbas medicinales ahora van a una **bolsa de 5**. R usa una: cura **25 de vida o el 20% de la vida máxima**, lo que sea mayor, y quita el veneno. Si la bolsa está llena y estás herido, la hierba se come en el momento. Las hierbas del campo vuelven a crecer a los **90 segundos**.

El puesto de El Almacén está al oeste de la plaza (E para comprar):

| Artículo | Precio | Efecto |
| --- | ---: | --- |
| Hierba medicinal | 10 | Una hierba para la bolsa |
| Mate cebado | 6 | Energía al máximo y +10% de movimiento durante 30 s |
| Afilar y tensar | 30, 60, 90… | +10% de daño con todas las armas, hasta 5 veces |
| Clase con Beto | 60, 100, 140… | +1 punto de mejora |

## Jefes

Ambos escalan con tu nivel como el resto de los enemigos, no retroceden con los golpes, no se pueden encantar y el Baile del 7-0 solo los frena 2,5 s. La primera victoria contra cada uno otorga **un punto de mejora** de trofeo. Si te noquean, recuperan toda su vida.

| Jefe | Vida | Fuerza | Velocidad | Resistencia | Ataque especial |
| --- | ---: | ---: | ---: | ---: | --- |
| El Capo del Eco | 340 | 9 | 20 | 30 | Marca una línea roja y embiste: 160% de su fuerza y frena 1,5 s |
| La Yarará Madre | 320 | 7 | 25 | 15 | Te persigue. Colazo en anillo alrededor suyo (marca un círculo rosado: rodá o alejate). Antes de escupir el abanico de veneno retrocede un poco y marca tres líneas (50% de envenenar; 15% contra Fede) |

Mientras peleás aparece una barra de vida del jefe que avisa cuándo viene el ataque especial. Se recomienda llegar al nivel 4.

## Personajes

| Personaje | Vida | Fuerza | Velocidad | Resistencia | Inteligencia |
| --- | ---: | ---: | ---: | ---: | ---: |
| Gero | 105 | 5 | 15 | 15 | 5 |
| Paco | 100 | 6 | 15 | 20 | 10 |
| Fede | 90 | 4 | 30 | 5 | 15 |
| Pepe | 100 | 6 | 15 | 15 | 15 |
| Tena | 100 | 2 | 20 | 5 | 5 |
| Dante | 110 | 8 | 5 | 20 | 15 |

- **Gero — Fé Judía:** recupera 5 de vida por segundo y gana 25 de velocidad durante 5 segundos. Puede alcanzar 125 de velocidad. Las ratas lo ignoran hasta que las golpea. Su experiencia parte de ×0,75.
- **Paco — Afecto animal:** encanta animales cercanos durante 10 segundos; se apartan y le dan 2 de fuerza por animal. En los Yuyos sus estadísticas aumentan 15%. Obtiene 10% menos de los beneficios de resistencia.
- **Fede — Último aliento, pasiva:** con 30% de vida o menos gana 15% de velocidad y resistencia. Las serpientes tienen solo 15% de probabilidad de envenenarlo. Obtiene 20% menos de los beneficios de resistencia.
- **Pepe — DeboraMundos, pasiva:** derrotar un enemigo recupera 5 de vida y da 15% de velocidad por 3 segundos. Gana 50% más de experiencia. Los perros le hacen 10% más de daño y lo ralentizan 20%.
- **Tena — Baile del 7-0:** aturde a los enemigos cercanos durante 7 segundos. Las ratas huyen de él. Con tres o más perseguidores pierde 10% de todas las estadísticas salvo vida.
- **Dante — Tobi:** golpea el suelo tres veces con un enorme bastón de carne; cada onda inflige 10 de daño a los enemigos cercanos. Gana 1 de fuerza automática por nivel además del punto a elección. Se mueve 10% más lento.

**Nombre y apariencia:** la lista de habilidades nombra a Pepe y la descripción física nombra a Martín. Para mantener los seis personajes, Pepe usa el disfraz de pollo atribuido a Martín.

Las habilidades activas tienen enfriamiento: Gero **25 s**, Paco **30 s**, Tena **26 s** y Dante **28 s**. Las habilidades de Fede y Pepe se activan automáticamente al cumplir su condición. Las bonificaciones temporales se calculan sobre los valores base: no se acumulan de forma permanente.

## Estadísticas y progresión

La vida máxima tiene un límite de **500**. Fuerza, velocidad y resistencia base tienen límite de **100**. Inteligencia y nivel del personaje no tienen un máximo.

El nivel 2 requiere **100 XP**. Cada nivel siguiente requiere 50 adicionales: **150, 200, 250…**. La experiencia sobrante se conserva, incluso si una recompensa permite subir varios niveles.

Cada nivel concede **2 de vida máxima** y **un punto de mejora**. Un punto suma 1 a fuerza, velocidad, resistencia o inteligencia, o 5 a vida. Dante gana además 1 de fuerza automático; si elige fuerza también, obtiene 2 en total. Las mejoras que ya están al máximo no consumen puntos.

La inteligencia aporta un escalón cada 10 puntos:

`multiplicador = 1 + 0,20 × floor(inteligencia / 10)`

Gero reemplaza la base 1 por 0,75. Pepe multiplica el resultado completo por 1,5. Por ejemplo, con 15 de inteligencia, un personaje común recibe ×1,20 y Pepe ×1,80.

### Velocidad

| Velocidad efectiva | Tiempo entre golpes | Movimiento base |
| --- | ---: | --- |
| Menor que 15 | 3 s | Lento |
| 15 a menos de 30 | 2 s | Moderado |
| 30 a menos de 60 | 1 s | Normal |
| 60 a 100 | 0,5 s | Rápido |
| Más de 100, durante Fé Judía | 0,25 s | Extraordinario |

Las bandas establecen pasos base de 72, 92, 118 y 148 píxeles por segundo. La banda extraordinaria de Gero suma la misma diferencia que la anterior: **178 píxeles por segundo**. Los cambios porcentuales temporales afectan directamente al movimiento para que se sientan incluso dentro de una banda; el intervalo de ataque sigue la banda de velocidad efectiva.

Correr aumenta el movimiento **25%**. Tras dejar de correr durante **2 segundos**, la energía comienza a recuperarse. Agotarla por completo bloquea la carrera por **10 segundos**, mientras la barra vuelve a llenarse.

### Resistencia

| Resistencia efectiva | Carrera hasta agotarse | Daño físico absorbido |
| --- | ---: | ---: |
| Menor que 15 | 3 s | 0 |
| 15 a menos de 30 | 5 s | 2 |
| 30 a menos de 60 | 7 s | 4 |
| 60 a menos de 80 | 10 s | 6 |
| 80 a 100 | 12 s | 8 |

Paco recibe el **90%** de la duración y protección de su banda; Fede, el **80%**. La armadura conserva un mínimo de **1 de daño por golpe**. El veneno ignora por completo esta protección.

## Enemigos

Todos comparten un radio de detección de **195 píxeles**. Su nivel es `1 + floor((nivel del jugador - 1) / 2)`: niveles 1 y 2 del jugador enfrentan nivel 1; niveles 3 y 4, nivel 2; y así sucesivamente. No corren ni gastan energía.

| Enemigo | Vida | Fuerza | Velocidad | Resistencia | Aumento por nivel: V / F / Vel / R |
| --- | ---: | ---: | ---: | ---: | --- |
| Chorro | 100 | 5 | 15 | 10 | +3 / +1 / +2 / +2 |
| Perro | 60 | 3 | 30 | 20 | +1,5 / +0,5 / +3 / +2 |
| Serpiente | 35 | 5 | 25 | 5 | +1 / +2 / +2 / +0,5 |
| Rata | 10 | 1 | 40 | 0 | +0,5 / +2 / +2 / +0,5 |

- Los **chorros** atacan con cuchillo y no retroceden al recibir golpes.
- Los **perros** reducen el movimiento un 15% durante 4 segundos; contra Pepe, un 20%.
- Las **serpientes** tienen 40% de probabilidad de envenenar, salvo el 15% contra Fede. El veneno causa 2 de daño por segundo durante 5 segundos; aumenta 1 por nivel de serpiente. Una nueva aplicación reinicia los 5 segundos.
- Las **ratas** se prenden del cuerpo por 3 segundos, atacan con su intervalo correspondiente y luego saltan hacia atrás antes de intentar prenderse otra vez.

Los ataques empujan a perros, serpientes y ratas; las ratas prendidas deben terminar su agarre. Los aumentos propios de vida de cada enemigo se aplican según la tabla, sin sumarles los 2 de vida automáticos del jugador. El daño de veneno también respeta el límite de fuerza de 100.

## Armas

| Arma | Dónde | Funcionamiento |
| --- | --- | --- |
| Puños | Desde el comienzo | Daño igual a fuerza, corto alcance |
| Espada | Yuyos | Fuerza ×1,5 y mayor alcance |
| Arco | Aldea | Proyectil a distancia; necesita 0,7 s de carga y respeta el intervalo de ataque |
| Piedra | Cueva | Proyectil a distancia; caminar 2 s recarga la munición |

Se interpretó «aumenta el daño en un ×0,5» como **50% adicional**, por lo que la espada multiplica por **1,5**.

## Desarrollo y pruebas

Implementado con **HTML, CSS y JavaScript**, sin paquetes externos. El mundo se dibuja en Canvas 2D con gráficos pixel art creados por código; no requiere imágenes, tipografías ni sonidos descargados.

- `src/data.js`: personajes, enemigos, jefes, artículos del almacén y reglas puras de estadísticas, experiencia y mejoras.
- `src/world.js`: mapa, biomas, objetos, colisiones y vecinos.
- `src/render.js`: sprites, terreno, cámara y efectos visuales.
- `src/game.js`: simulación, movimiento, combate, esquiva, combos, monedas, tienda, jefes y habilidades.
- `src/ui.js`: menús, HUD, tienda, ranking, guardados y controles táctiles.
- `src/ranking.js` y `src/config.js`: ranking local u online (Supabase).
- `tests/rules.test.js`: 30 pruebas de reglas y casos límite.

Si ya tenés Node instalado:

```sh
node tests/rules.test.js
```

Abrí `tests/index.html` para ejecutar las 30 pruebas de reglas y las 37 pruebas de integración del motor en el navegador. El resultado detalla cada caso aprobado o fallido.

También se incluyen 16 pruebas de interfaz, 11 del ranking (con un servidor simulado) y 9 de controles táctiles con Chrome y Python 3, sin librerías adicionales. El verificador abre un perfil temporal aislado; nunca usa tus guardados personales:

```sh
python tests/browser_check.py tests/index.html --script tests/engine.test.js
python tests/browser_check.py index.html --script tests/ui.test.js
python tests/browser_check.py index.html --script tests/ranking.test.js
python tests/browser_check.py index.html --touch --width 844 --height 390 --script tests/touch.test.js
python tests/browser_check.py index.html --screenshot .screenshots/menu.png
```

El verificador está preparado para la ubicación estándar de Chrome en Windows. El juego también funciona en otros sistemas con un navegador moderno.
