# Zak's Throne — Crónicas de los Aromos

Una aventura de acción y exploración en pixel art, vista desde arriba. Elegí a uno de seis amigos, preparate en la aldea y salí a explorar la cueva y los Yuyos.

## Jugar

1. Hacé doble clic en `Jugar.bat`, o abrí `index.html` con Chrome o Microsoft Edge.
2. Elegí **Juego nuevo**, seleccioná un personaje y empezá la aventura.
3. Recogé el arco y el hacha de la aldea con **E**. Equipá el hacha con **5** y golpeá árboles para juntar madera.
4. Buscá la piedra arrojadiza en la cueva. Con ella en la mochila y 8 de madera, abrí **B** y fabricá un pico.

El juego funciona directamente desde sus archivos: no requiere servidor, instalación, conexión, cuenta ni dependencias. Conservá la carpeta `src` junto a `index.html`.

**Juego nuevo** empieza una partida independiente sin borrar las tres ranuras. **Cargar juego** solo permite elegir ranuras con una partida válida. **Salir** detiene el juego; si el navegador no permite cerrar una pestaña abierta manualmente, podés cerrarla con su botón habitual.

## Controles

| Acción | Control |
| --- | --- |
| Moverse | WASD o flechas |
| Correr | Mantener Shift mientras te movés |
| Atacar / talar / picar | Espacio o clic en el mundo |
| Habilidad activa | Q |
| Recoger / consumir especial / recuperar mochila / usar pozo | E |
| Puños / arco / espada / piedra / hacha / pico | 1 / 2 / 3 / 4 / 5 / 6 |
| Mochila, materiales y fabricación | B o I |
| Ficha y mejoras | C |
| Diario, bestiario e historial de avisos | J |
| Mapa | M |
| Pausa y guardado | Esc |
| Sonido | Botón musical de la esquina superior |

La dirección de movimiento orienta al personaje; el ratón permite dirigir ataques a un punto del mundo. En pantallas táctiles aparecen una cruceta y botones para correr, atacar e interactuar. Los botones de la interfaz también permiten acceder a habilidades, armas, ficha, mapa y pausa.

El juego se adapta al tamaño de pantalla; en teléfonos conviene usar orientación horizontal. Los indicadores combinan texto, iconos y color. Las opciones permiten ajustar sonido y efectos visuales.

## Guardar y recuperar partidas

Hay **tres ranuras de guardado manual** accesibles desde la pausa. Cada una muestra el personaje y el progreso de esa partida. Al comenzar una aventura nueva las ranuras existentes quedan intactas.

Los guardados se conservan en el almacenamiento local del navegador usado para jugar. Para trasladarlos a otro navegador o equipo, usá **Exportar** y **Importar**: se descarga o carga un archivo JSON de respaldo. Conservá una copia antes de borrar los datos del navegador.

Las partidas de la **versión 1 son compatibles**: al cargarlas se adaptan al balance nuevo conservando nivel, experiencia, mejoras compradas y proporción de vida. Reciben el punto adicional pendiente por cada nivel ya ganado. El próximo guardado usa la versión 2 y no vuelve a aplicar la conversión. La vida de los enemigos también conserva su proporción durante la adaptación.

Los guardados nuevos incluyen materiales, procedencia del equipo, mochilas perdidas, recursos agotados, reapariciones y efectos temporales. Sus relojes usan **tiempo de juego**: la pausa y tener el juego cerrado no consumen el tiempo que te queda para recuperar una mochila ni los efectos guardados.

## El mundo

- **Aldea de los Aromos:** zona segura, con casas, árboles, flores y vecinos que caminan y tienen colisión. Los enemigos no pueden entrar. El pozo recupera vida y energía y cura el veneno. Acá encontrás el arco y el hacha.
- **Cueva del Eco:** zona oscura habitada por chorros y perros callejeros. Contiene la piedra arrojadiza y vetas de piedra y metal para extraer con el pico.
- **Yuyos:** pastos altos, serpientes y ratas. Acá se encuentra la espada y Paco recibe su bonificación de Campesino.

El mapa marca equipo disponible, especiales y mochilas perdidas. El diario registra objetivos, enemigos y los **últimos 40 avisos de la sesión**, agrupando repeticiones. En pantalla aparece **un solo aviso compacto a la vez**, con una cola corta; los avisos urgentes tienen prioridad. Si llegan varios eventos juntos, podés consultar su información en **J**.

Las flores medicinales recuperan **25 de vida**, curan el veneno y reaparecen en su lugar **10 segundos** después de recogerlas. Los enemigos pueden reaparecer tras **35 segundos**, cuando estás suficientemente lejos de su punto de origen. Hay ciclo de día y noche, sonido sintetizado, efectos de combate y animación ambiental.

Al quedar noqueado volvés a la aldea. Si te vence un chorro aparece «Uhh... este gil me sacó guita»; si te vence un perro, «¿Por qué Firulais? :c». No hay todavía un sistema de dinero.

## Noqueo y pérdida de inventario

Al quedar sin vida volvés a la aldea con la salud y la energía recuperadas, pero **tus armas, herramientas y materiales quedan en una mochila donde caíste**. Conservás el personaje, nivel, experiencia y mejoras; volvés a pelear con los puños.

Tenés **300 segundos —5 minutos de juego—** para regresar y recuperar todo con **E**. El mapa **M**, el indicador de mochila y el panel **B / I** muestran su ubicación o tiempo restante. Cada caída puede dejar una mochila independiente. La pausa detiene estos relojes.

Si una mochila vence, su contenido se pierde. Las armas y herramientas originales del mapa vuelven a estar disponibles en sus lugares iniciales cuando ya no las llevás ni quedan en otra mochila. **No reaparecen mientras todavía podés recuperarlas.** El equipo fabricado se pierde y hay que volver a fabricarlo; los materiales perdidos deben recolectarse otra vez.

## Personajes

| Personaje | Vida | Fuerza | Velocidad | Resistencia | Inteligencia |
| --- | ---: | ---: | ---: | ---: | ---: |
| Gero | 110 | 8 | 22 | 22 | 5 |
| Paco | 115 | 9 | 22 | 28 | 10 |
| Fede | 90 | 7 | 35 | 8 | 15 |
| Pepe | 110 | 9 | 24 | 22 | 15 |
| Tena | 115 | 6 | 30 | 45 | 10 |
| Dante | 130 | 12 | 12 | 32 | 15 |

Tena es el segundo más rápido, tiene la menor fuerza y la mayor resistencia inicial: puede correr **7 segundos**. Fede sigue siendo el más rápido y se cansa primero; Dante conserva la mayor fuerza y vida y el movimiento más lento.

- **Gero — Fé Judía:** recupera 5 de vida por segundo y gana 25 de velocidad durante 5 segundos. Puede alcanzar 125 de velocidad. Las ratas lo ignoran hasta que las golpea. Su experiencia parte de ×0,75.
- **Paco — Afecto animal:** encanta animales cercanos durante 10 segundos; se apartan y le dan 2 de fuerza por animal. En los Yuyos sus estadísticas aumentan 15%. Obtiene 10% menos de los beneficios de resistencia.
- **Fede — Último aliento, pasiva:** con 30% de vida o menos gana 15% de velocidad y resistencia. Las serpientes tienen solo 15% de probabilidad de envenenarlo. Obtiene 20% menos de los beneficios de resistencia.
- **Pepe — DeboraMundos, pasiva:** derrotar un enemigo recupera 5 de vida y da 15% de velocidad por 3 segundos. Gana 50% más de experiencia. Los perros le hacen 10% más de daño y lo ralentizan 20%.
- **Tena — Baile del 7-0:** aturde a los enemigos cercanos durante 7 segundos. Las ratas huyen de él. Con tres o más perseguidores pierde 10% de todas las estadísticas salvo vida.
- **Dante — Tobi:** golpea el suelo tres veces con un enorme bastón de carne; cada onda inflige 10 de daño a los enemigos cercanos. Gana 2 de fuerza automática por nivel además de los 2 puntos a elección. Se mueve 10% más lento.

**Nombre y apariencia:** la lista de habilidades nombra a Pepe y la descripción física nombra a Martín. Para mantener los seis personajes, Pepe usa el disfraz de pollo atribuido a Martín.

Las habilidades activas tienen enfriamiento: Gero **25 s**, Paco **30 s**, Tena **26 s** y Dante **28 s**. Las habilidades de Fede y Pepe se activan automáticamente al cumplir su condición. Las bonificaciones temporales se calculan sobre los valores base: no se acumulan de forma permanente.

## Estadísticas y progresión

La vida máxima tiene un límite de **500**. Fuerza, velocidad y resistencia base tienen límite de **100**. Inteligencia y nivel del personaje no tienen un máximo.

El nivel 2 requiere **100 XP**. Cada nivel siguiente requiere 50 adicionales: **150, 200, 250…**. La experiencia sobrante se conserva, incluso si una recompensa permite subir varios niveles.

Cada nivel concede **2 de vida máxima, 1 de fuerza automática y 2 puntos de mejora**. Dante obtiene **2 de fuerza automática**, además de los mismos 2 puntos. Así podés mejorar energía, velocidad o inteligencia sin quedarte atrás en daño. Cada punto elegido suma **5 a vida, 1 a fuerza, 2 a velocidad, 2 a resistencia o 1 a inteligencia**. Las mejoras que ya están al máximo no consumen puntos.

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
| Más de 100 por efectos temporales | 0,25 s | Extraordinario |

El movimiento base mejora con cada punto: **60 + 1,5 × velocidad** píxeles por segundo, antes de bonificaciones y penalizaciones. Así se distingue la velocidad 30 de Tena de la velocidad 35 de Fede. Los cambios porcentuales temporales afectan directamente al movimiento; el intervalo de ataque sigue la banda de velocidad efectiva. Los especiales pueden superar temporalmente los topes de fuerza y velocidad sin alterar las estadísticas permanentes.

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

Todos comparten un radio de detección de **195 píxeles**, salvo cuando el humo reduce su visión. Su nivel es `1 + floor((nivel del jugador - 1) / 3)`: niveles 1–3 del jugador enfrentan nivel 1; niveles 4–6, nivel 2; y así sucesivamente. No corren ni gastan energía.

| Enemigo | Vida | Fuerza | Velocidad | Resistencia | Aumento por nivel: V / F / Vel / R |
| --- | ---: | ---: | ---: | ---: | --- |
| Chorro | 42 | 5 | 18 | 5 | +2,8 / +0,32 / +0,35 / +0,4 |
| Perro | 30 | 3 | 32 | 5 | +1,8 / +0,28 / +0,2 / +0,35 |
| Serpiente | 24 | 4 | 25 | 3 | +1,2 / +0,22 / +0,25 / +0,2 |
| Rata | 12 | 2 | 36 | 0 | +0,8 / +0,2 / +0,22 / +0,15 |

Sus topes de vida son **180 / 130 / 100 / 70** y de fuerza **20 / 16 / 14 / 12**, respectivamente. La vida inicial más baja, el crecimiento gradual y los topes propios evitan que se vuelvan imposibles en partidas largas. La explicación completa y comparaciones antes/después están en [docs/BALANCE.md](docs/BALANCE.md).

- Los **chorros** atacan con cuchillo y no retroceden al recibir golpes.
- Los **perros** reducen el movimiento un 15% durante 4 segundos; contra Pepe, un 20%.
- Las **serpientes** tienen 40% de probabilidad de envenenar, salvo el 15% contra Fede. El veneno empieza en 2 de daño por segundo durante 5 segundos; aumenta 0,1 por nivel enemigo hasta un máximo de 6. Una nueva aplicación reinicia los 5 segundos.
- Las **ratas** se prenden del cuerpo por 3 segundos, atacan con su intervalo correspondiente y luego saltan hacia atrás antes de intentar prenderse otra vez.

Los ataques empujan a perros, serpientes y ratas. Los golpes normales no alcanzan a las ratas prendidas; los efectos de área y el Puff sí pueden dañarlas. Los aumentos propios de vida de cada enemigo se aplican según la tabla, sin sumarles los 2 de vida automáticos del jugador.

## Armas

| Arma | Dónde | Funcionamiento |
| --- | --- | --- |
| Puños | Desde el comienzo | Daño igual a fuerza, corto alcance |
| Espada | Yuyos o fabricación | Fuerza ×1,5 y mayor alcance |
| Arco | Aldea | Proyectil a distancia; necesita 0,7 s de carga y respeta el intervalo de ataque |
| Piedra | Cueva | Proyectil a distancia; caminar 2 s recarga la munición |
| Hacha | Aldea | Fuerza ×2; tarda 35% más entre golpes; tala árboles |
| Pico | Fabricación | Fuerza ×1,25; cadencia normal; extrae piedra y metal |

Se interpretó «aumenta el daño en un ×0,5» como **50% adicional**, por lo que la espada multiplica por **1,5**.

## Recolección y fabricación

Equipá la herramienta, acercate al recurso y golpeá mirando hacia él. La recolección cuenta impactos, independientemente del daño de combate:

| Recurso | Lugar y herramienta | Golpes | Cantidad obtenida |
| --- | --- | ---: | ---: |
| Madera | Árboles del mundo, con hacha | 3 | 4 |
| Piedra | Vetas de la cueva, con pico | 4 | 4 |
| Metal | Vetas de la cueva, con pico | 7 | 3 |

Los recursos agotados se recuperan después de **30 segundos**, cuando su espacio está libre. La **piedra material** del inventario es distinta de la **piedra arrojadiza** que equipás como arma.

Abrí **B o I** para consultar materiales y fabricar:

| Receta | Requisito que debés llevar | Materiales que consume |
| --- | --- | --- |
| Pico | Piedra arrojadiza | 8 de madera |
| Espada | Pico | 4 de madera + 6 de metal |

La piedra arrojadiza y el pico usados como requisitos **no se consumen**. No podés fabricar otra copia del equipo que ya llevás o que todavía está en una mochila recuperable. El equipo original del mapa no reaparece por esperar: vuelve cuando se pierde definitivamente el que recogiste.

## Especiales de cada personaje

En cada partida aparecen **8 objetos especiales del personaje elegido**, distribuidos al azar en puntos accesibles: 2 en la aldea, 2 en la cueva y 4 en los Yuyos. Acercate y presioná **E** para consumirlos. Tras **10 segundos**, cada objeto consumido reaparece en una posición aleatoria de su bioma.

Todos sus beneficios duran **5 segundos**. Consumir otro renueva el reloj y repite la curación o recarga instantánea correspondiente, pero **no suma multiplicadores de daño o velocidad**.

| Personaje y objeto | Efecto |
| --- | --- |
| **Gero — Capuchón** | +4 de defensa y escudo igual al 40% de su vida máxima. El escudo recibe el daño completo antes de aplicar armadura al sobrante; también intercepta veneno, cuyo sobrante sigue ignorando armadura. Otro Capuchón restaura el escudo y renueva el tiempo. |
| **Paco — Leche de ¿Vaca?** | Cura toda la vida y duplica el daño. Cada consumo deja un charco durante 5 s que reduce a la mitad la velocidad enemiga. Cada charco tiene su propio reloj. |
| **Fede — Puff** | Rellena energía, elimina el agotamiento y permite correr sin gastarla. Duplica su velocidad; al correr sobre enemigos hace daño igual a su fuerza, con 0,5 s entre impactos al mismo enemigo. |
| **Pepe — Puchito** | Cura 35% de la vida máxima y aumenta velocidad 50%. Al moverse deja humo: cada tramo dura 2 s, hace 2 de daño cada 0,2 s y reduce la visión de los enemigos dentro. Las nubes superpuestas no multiplican el daño. |
| **Tena — Arroz Chufa Picante** | Duplica daño y velocidad durante 5 s. Después queda inmóvil 1 s con retorcijones y emite una onda de fuego: 15 de daño cercano y quemadura de 3 por segundo durante 3 s. La explosión le cuesta 10 de vida. |
| **Dante — Caramelo Media-Hora** | Congela durante 5 s a enemigos cercanos y duplica su velocidad. Al terminar recibe 3 de daño por intoxicación; renovar el efecto no acumula este costo. |

Las curaciones nunca superan la vida máxima. Los daños finales del arroz y del caramelo ignoran la armadura y también se aplican en la aldea. Los efectos visuales y el indicador de estado muestran los beneficios activos y su duración restante.

## Desarrollo y pruebas

Implementado con **HTML, CSS y JavaScript**, sin paquetes externos. El mundo se dibuja en Canvas 2D con gráficos pixel art creados por código; no requiere imágenes, tipografías ni sonidos descargados.

- `src/data.js`: personajes, enemigos, equipo, recetas y reglas puras de estadísticas, experiencia y mejoras.
- `src/world.js`: mapa, biomas, objetos, colisiones y vecinos.
- `src/render.js`: sprites, terreno, cámara y efectos visuales.
- `src/game.js`: simulación, movimiento, combate, habilidades y compatibilidad de guardados.
- `src/survival.js`: recolección, fabricación, mochilas, reapariciones y especiales.
- `src/ui.js`: menús, HUD, historial de avisos, inventario y guardados.
- `tests/rules.test.js`, `tests/engine.test.js`, `tests/survival.test.js`: reglas, combate, migración y nuevas mecánicas.
- `tests/ui.test.js`: interacción con menús y flujos del juego en el navegador.

Si ya tenés Node instalado:

```sh
node tests/rules.test.js
```

Abrí **`tests/index.html`** para ejecutar las pruebas de reglas, motor e inventario en el navegador. La página detalla cada caso aprobado o fallido.

Con **Chrome y Python 3**, el verificador automatiza las pruebas de navegador sin librerías adicionales. Usa un perfil temporal aislado y no toca tus guardados personales. Ejecutá desde la carpeta del proyecto:

```sh
python tests/browser_check.py tests/index.html
python tests/browser_check.py index.html --script tests/ui.test.js
python tests/browser_check.py index.html --screenshot .screenshots/menu.png
```

El primer comando obtiene el informe de todas las pruebas de `tests/index.html`; el segundo ejecuta las pruebas de interfaz sobre el juego. El verificador informa los fallos y termina con código de error si una prueba falla. Está preparado para la ubicación estándar de Chrome en Windows. El juego también funciona en otros sistemas con un navegador moderno.
