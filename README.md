# Zak's Throne — Crónicas de los Aromos

Una aventura de acción y exploración en pixel art, vista desde arriba. Elegí a uno de seis amigos, preparate en la aldea y salí a explorar la cueva y los Yuyos.

Versión actual: **v2.2**. Los cambios de cada versión están en [CHANGELOG.md](CHANGELOG.md).

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
| Recoger / usar el pozo / comprar / hablar con el herrero / bajar y subir / dejar ofrendas en el altar | E |
| Talar o picar | E cerca del árbol o la veta, y quedarse quieto |
| Usar hierba de la bolsa | R |
| Cambiar arma | 1 a 5; también sus botones |
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

- **Palihue City:** zona completamente segura, con casas, árboles, flores y vecinos que caminan y tienen colisión. Los enemigos no pueden entrar. El pozo permite recuperar vida y el puesto de **El Almacén** vende provisiones. Acá se encuentra el arco.
- **Cueva:** zona oscura habitada por chorros y perros callejeros. La piedra se encuentra en su interior. En el fondo noroeste, sentado en su trono junto a la bajada, **El Capo del Eco** no deja pasar a nadie.
- **Yuyos:** pastos altos, serpientes y ratas. Acá se encuentra la espada y Paco recibe su bonificación de Campesino. En el rincón noreste anida **La Yarará Madre**. La valla del límite con la aldea llega hasta arriba de todo: al nido se llega por el camino de los yuyos.
- **Cueva Profunda (Nvl 2):** se baja por la escalera del fondo noroeste de la Cueva del Eco; **hace falta una antorcha y haber vencido al Capo**. Está a oscuras: ves lo que alumbra la antorcha. Hay murciélagos, arañas, hierro y oro, y **no crecen hierbas medicinales**. En su extremo sureste baja otra escalera, custodiada por **El Chupasangre**.
- **Las Entrañas (Nvl 3):** pocos gusanos de tierra, enterrados hasta que te acercás, las únicas vetas de diamante y **El Gólem Minero**.
- **Altar del gobernante:** un cementerio al oeste de la aldea; se entra por el portón al final de la calle principal. Lo pueblan esqueletos con escudo y esqueletos arqueros. **Cerbero** custodia el altar de ofrendas.
- **Trono de Zak:** sala gótica de ladrillo negro, siempre de noche pero bien visible. Se llega solo por el portal del altar. No hay enemigos: solo **Zak** y su trono.

Las bajadas custodiadas no se abren mientras su jefe esté vivo; si reaparece mientras estás abajo, subir siempre se puede. El mapa marca el almacén ($), el herrero (⚒), las bajadas (▼ ▲), el altar (✝) y las guaridas de los jefes (☠). Dentro de una cueva profunda o del trono, el mapa muestra esa zona. Los enemigos vuelven a aparecer después de **35 segundos**; el Capo y la Yarará, después de **3 minutos**; el Chupasangre, de 4; el Gólem, de 5; y Cerbero, de 10.

Al quedar noqueado volvés a la aldea. Si te vence un chorro aparece «Uhh... este gil me sacó guita»… y es literal: un chorro o el Capo se llevan el **30%** de tus monedas. Cualquier otra derrota cuesta el **10%**. Si Zak te ejecuta, perdés toda la guita, los materiales y las ofrendas (ver [El Trono de Zak](#el-trono-de-zak)).

## Combate

- **Rodar (F o clic derecho):** una voltereta rápida que gasta 20% de energía. Mientras dura (0,3 s) ningún golpe ni proyectil te hace daño; el veneno que ya tenés sigue actuando. Rodar también te saca de encima una rata prendida. No se puede rodar agotado.
- **Combos:** cada golpe que conecta suma al combo si no dejás pasar mucho tiempo. El **cuarto golpe seguido es crítico** e inflige ×1,75. El HUD muestra el combo y avisa con ✦ cuando el próximo golpe es crítico.
- Los golpes producen chispas, la cámara se sacude con críticos y daño fuerte, y la pantalla destella al recibir daño.

## Guita, hierbas y El Almacén

Los enemigos sueltan monedas al caer: ratas 1–2, perros 2–4, serpientes 2–5, chorros 5–9 y jefes 40–60, más un extra según su nivel. Se recogen solas al pasar cerca y desaparecen a los 30 segundos.

Las hierbas medicinales ahora van a una **bolsa de 5**. R usa una: cura **25 de vida o el 20% de la vida máxima**, lo que sea mayor, y quita el veneno. Si la bolsa está llena y estás herido, la hierba se come en el momento. Las hierbas del campo vuelven a crecer a los **90 segundos**.

Cada objetivo del diario también da guita, una sola vez. Se reclama en el diario (J), y el botón del diario muestra ◉ cuando hay algo para cobrar. Si cumpliste objetivos antes de que existieran las recompensas, igual las podés reclamar.

| Objetivo | Guita |
| --- | ---: |
| Arco, Cueva del Eco, piedras, Los Yuyos | 5 cada uno |
| Espada, primera compra en El Almacén | 10 cada uno |
| Primera herramienta del herrero | 15 |
| Bestiario (los cuatro enemigos de la superficie) | 20 |
| Nivel 5 | 25 |
| Llegar a la Cueva Profunda | 30 |
| Derrotar al Capo o a la Yarará | 40 cada uno |
| Llegar a Las Entrañas | 50 |
| Derrotar al Chupasangre | 60 |
| Dejar las cinco ofrendas en el altar | 60 |
| Derrotar al Gólem Minero | 80 |
| Forjar la Espada Elemental | 100 |
| Derrotar a Cerbero | 100 |
| Vencer a Zak | 300 |

El puesto de El Almacén está al oeste de la plaza (E para comprar):

| Artículo | Precio | Efecto |
| --- | ---: | --- |
| Hierba medicinal | 10 | Una hierba para la bolsa |
| Mate cebado | 6 | Energía al máximo y +10% de movimiento durante 30 s |
| Afilar y tensar | 30, 60, 90… | +10% de daño con todas las armas, hasta 5 veces |
| Clase con Beto | 60, 100, 140… | +1 punto de mejora |

El Almacén también **compra las ofrendas** de los jefes, una por vez:

| Ofrenda | La suelta | Te pagan |
| --- | --- | ---: |
| 🦷 Colmillo Tóxico | La Yarará Madre | 500 |
| 💍 Anillo de la mafia | El Capo del Eco | 1000 |
| 🩸 Garra Sangrienta | El Chupasangre | 1000 |
| 🔮 Piedra Elemental | El Gólem Minero | 2000 |
| 👁 Ojo del alma | Cerbero | 2000 |

## Materiales, herramientas y El Taller

Al sur de la aldea, junto a **El Taller**, atiende **El Herrero**: E en su mesa de trabajo abre su taller. Él te recibe con un «Acá todo con verdes, pa.». Fabrica herramientas y mejora armas a cambio de materiales y guita.

**Recolección.** Acercate a un árbol o a una veta, tocá E y quedate quieto: aparece una barra de progreso. Moverte, atacar, rodar o recibir un golpe interrumpe el trabajo. Las vetas son piedras grandes que se hacen añicos al terminar.

| Material | Dónde | Herramienta mínima | Botín | Vuelve a aparecer |
| --- | --- | --- | ---: | ---: |
| Madera | Cualquier árbol (queda el tocón) | Cualquier hacha | 2 | 1 min |
| Piedra | Cueva del Eco (gris rocosa) | Pico de madera | 2 | 3 min |
| Carbón | Cueva del Eco (gris con manchas negras) | Pico de madera | 2 | 3 min |
| Hierro | Cueva Profunda (gris metálica) | Pico de piedra | 2 | 5 min |
| Oro | Cueva Profunda (amarilla, hay menos) | Pico de hierro | 2 | 7 min |
| Diamante | Las Entrañas (pedazos celestes, muy pocas) | Pico de oro | 2 | 10 min |

Hay 8 vetas de piedra, 6 de carbón, 9 de hierro, 5 de oro y 4 de diamante. Cada nivel de herramienta trabaja más rápido que el anterior: madera ×1, piedra ×1,3, hierro ×1,6, oro ×1,95 y diamante ×2,4.

**Herramientas.** Cada pico y cada hacha requiere el nivel anterior. Las hachas solo aceleran la tala.

| Herramienta | Pico | Hacha |
| --- | --- | --- |
| Madera | 10 madera + 30 de guita | 30 de guita |
| Piedra | 10 piedra + 45 | 5 piedra + 45 |
| Hierro | 10 hierro + 60 | 5 hierro + 60 |
| Oro | 10 oro + 75 | 5 oro + 75 |
| Diamante | 10 diamante + 90 | 5 diamante + 90 |

La **antorcha** cuesta 1 de madera y 3 de carbón. Se fabrica una sola vez y habilita las bajadas.

**Mejoras de armas.** Puños, arco, espada y piedra se mejoran por separado, siempre de a un nivel y solo si ya tenés el arma. Cada nivel suma **20% de daño** a esa arma (nivel 6: ×2). Se combina con «Afilar y tensar» de El Almacén.

| Nivel | Costo |
| --- | --- |
| 2 | 15 madera + 30 de guita |
| 3 | 15 piedra + 45 |
| 4 | 15 hierro + 60 |
| 5 | 15 oro + 75 |
| 6 | 15 diamante + 90 |

**Espada Elemental.** Se forja con **5 Piedras Elementales, 10 de diamante, 15 de oro, 20 de hierro, 25 de piedra y 10 de madera**. Multiplica la fuerza por **4,5**, contra ×3 de la espada al nivel 6, y no se mejora. Se equipa con la tecla 5.

Los materiales, las herramientas, las mejoras, las ofrendas y las vetas recién picadas se guardan con la partida. La ficha del personaje (C) muestra tu bolsa de materiales.

## Jefes

Escalan con tu nivel como el resto de los enemigos, no retroceden con los golpes, no se pueden encantar y el Baile del 7-0 solo los frena 2,5 s. La primera victoria contra cada uno otorga **un punto de mejora** de trofeo, y cada vez que caen sueltan su ofrenda. Si te noquean, recuperan toda su vida (y todas sus vidas). La barra de vida del jefe muestra sus vidas y avisa qué ataque viene.

| Jefe | Dónde | Vida | Fuerza | Velocidad | Resistencia |
| --- | --- | ---: | ---: | ---: | ---: |
| El Capo del Eco | Junto a la bajada al Nvl 2 | 442 | 12 | 22 | 35 |
| La Yarará Madre | Rincón noreste de Los Yuyos | 408 | 10 | 28 | 20 |
| El Chupasangre | Junto a la bajada al Nvl 3 | 765 | 15 | 35 | 40 |
| El Gólem Minero | Las Entrañas | 357 por vida (×1; ×1,15; ×1,3; ×1,5) | 22 | 10 | 65 |
| Cerbero | Altar del gobernante | 1360 | 20 | 62 | 50 |
| Zak | Trono de Zak | 10000 por vida (+180 por nivel), 3 vidas | — | 22 | 85 |

Son los valores en nivel 1; todos crecen con tu nivel. Hacen el **68%** de su fuerza como daño (los enemigos comunes, el 72%) y, salvo Zak, tienen un **15% menos de vida** que la base de su ficha. Desde el nivel 8 ganan **4%** de vida extra por nivel, como el resto. Entre el aviso y el golpe hay tiempo de reaccionar: alrededor de un segundo para embestidas, saltos y golpes al piso, y medio segundo para los golpes cortos. Caminan un **30% más lento** que lo que indica su velocidad (embestidas y saltos incluidos, también son más lentos).

- **El Capo del Eco:** marca una línea roja y embiste: 160% de su fuerza y frena 1,5 s.
- **La Yarará Madre:** te persigue. Colazo en anillo alrededor suyo (marca un círculo rosado: rodá o alejate). Antes de escupir el abanico de veneno retrocede un poco y marca tres líneas (50% de envenenar; 15% contra Fede).
- **El Chupasangre:** *Embestida sangrienta* (línea roja; si te alcanza te agarra 1,7 s, te chupa la sangre tres veces y se cura 4% de su vida por mordida), *Manotazo* (dos golpes rápidos de corto alcance) e *Invocación* (se aleja y llama a cinco murciélagos).
- **El Gólem Minero:** cuatro vidas, de piedra, hierro, oro y diamante; cada una tiene más vida y fuerza y se rearma con una animación del material. *Terremoto*: cuatro golpes al piso, cada uno avisado con un anillo naranja 1 s antes, con mucho daño en área. *Piedrazo*: aturde 3 s. *Refuerzo*: invencible 5 s cada 15 s, y al instante al bajar del 30% de vida (una vez por vida).
- **Cerbero:** *Mordida* que desangra (5 de vida por segundo durante 5 s, ignora la armadura). *Jugueteo*: salta, sigue tu posición y aterriza en el círculo rojo; si te alcanza vas a la mitad de velocidad 5 s. Mientras está en el aire no se le puede pegar. *Escarbar*: si en 3 s no le pegás, se cura entero.

### El Trono de Zak

En el altar del cementerio se deja **una ofrenda de cada jefe** (E). Si tenés varias del mismo tipo, toma una sola; las que dejás quedan guardadas aunque te vayas. Mientras Cerbero esté vivo, el altar está cerrado. Con las cinco, se rompen y se abre un **portal violeta**: tocalo para entrar al Trono de Zak. Cada visita gasta un juego completo de ofrendas.

Cualquier golpe de Zak se lleva el **52%** de tu vida máxima, sin importar la armadura: dos golpes alcanzan.

- **Espadazo:** tres golpes hacia adelante en un abanico de 60°.
- **Invocación:** dos esqueletos con espada y escudo y dos arqueros.
- **Invocación mayor:** trae a uno de los cinco jefes al azar, con el mismo nivel que tiene ese jefe en tu partida. Mientras siga en pie, Zak se sienta en el trono y se cura 3 por segundo (con el Gólem, hasta que pierda sus cuatro vidas). La repite entre 40 y 80 segundos después de que cae el invocado.
- **Tormenta de agonía:** durante 10 s caen rayos violetas alrededor tuyo; cada uno se marca antes de caer y **mata de un toque**. Mientras dura, **solo la piedra** le hace daño.
- **En su tercera vida** suma la **Ira del gobernante** (20 s en los que solo ves a tu alrededor, mientras sigue atacando) y el **Terremoto morado**: todo el mapa tiembla menos un círculo claro; si no estás adentro cuando clava la espada, perdés mucha vida.

Al vencerlo, Zak no muere: vuelve al trono, dice «Dejémoslo acá y volvé a tu dimensión, mortal.», golpea dos veces el piso y abre un portal a la aldea. **Tenés 40 segundos para cruzarlo.** Si no, dice «¿Sabés lo que le pasa al que no sigue mis órdenes? Muere...» y te ejecuta: perdés toda la guita, los materiales y las ofrendas; las armas y herramientas se quedan. El mensaje de la derrota es «Eso por querer hacerle el poronga...».

## Personajes

| Personaje | Vida | Fuerza | Velocidad | Resistencia | Inteligencia |
| --- | ---: | ---: | ---: | ---: | ---: |
| Gero | 105 | 5 | 15 | 15 | 5 |
| Paco | 100 | 6 | 15 | 20 | 10 |
| Fede | 90 | 4 | 30 | 5 | 15 |
| Pepe | 100 | 6 | 15 | 15 | 15 |
| Tena | 100 | 2 | 20 | 5 | 5 |
| Dante | 110 | 8 | 5 | 20 | 15 |

- **Gero — Fé Judía:** recupera 5 de vida por segundo y gana 25 de velocidad durante 5 segundos. Si con el bono supera 100 de velocidad, salta a la banda Extraordinaria. Las ratas lo ignoran hasta que las golpea. Su experiencia parte de ×0,75.
- **Paco — Afecto animal:** encanta animales cercanos durante 10 segundos; se apartan y le dan 2 de fuerza por animal. En los Yuyos sus estadísticas aumentan 15%. Obtiene 10% menos de los beneficios de resistencia.
- **Fede — Último aliento, pasiva:** con 30% de vida o menos gana 15% de velocidad y resistencia. Las serpientes tienen solo 15% de probabilidad de envenenarlo. Obtiene 20% menos de los beneficios de resistencia.
- **Pepe — DeboraMundos, pasiva:** derrotar un enemigo recupera 5 de vida y da 15% de velocidad por 3 segundos. Gana 50% más de experiencia. Los perros le hacen 10% más de daño y lo ralentizan 20%.
- **Tena — Baile del 7-0:** aturde a los enemigos cercanos durante 7 segundos. Las ratas huyen de él. Con tres o más perseguidores pierde 10% de todas las estadísticas salvo vida.
- **Dante — Tobi:** golpea el suelo tres veces con un enorme bastón de carne; cada onda inflige 10 de daño a los enemigos cercanos. Gana 1 de fuerza automática por nivel además del punto a elección. Se mueve 10% más lento.

**Nombre y apariencia:** la lista de habilidades nombra a Pepe y la descripción física nombra a Martín. Para mantener los seis personajes, Pepe usa el disfraz de pollo atribuido a Martín.

Las habilidades activas tienen enfriamiento: Gero **25 s**, Paco **30 s**, Tena **26 s** y Dante **28 s**. Las habilidades de Fede y Pepe se activan automáticamente al cumplir su condición. Las bonificaciones temporales se calculan sobre los valores base: no se acumulan de forma permanente.

## Estadísticas y progresión

**Ninguna estadística del personaje tiene tope**: vida, fuerza, velocidad, resistencia, inteligencia y nivel pueden crecer sin límite. La velocidad y la resistencia rinden cada vez menos pasado 100 (ver sus tablas).

**Veteranía.** Desde el nivel 8, los enemigos ganan vida y fuerza extra por nivel; tu personaje crece al mismo ritmo para que el juego nunca se vuelva imposible:

- Tu **daño** se multiplica por `1 + 0,04 × (nivel − 8)`, lo mismo que la vida extra de los enemigos.
- Tu **vida máxima** se multiplica por `1 + 0,005 × (nivel − 8)`, lo mismo que su fuerza extra.

En nivel 20 pegás ×1,48 y tenés ×1,06 de vida; en nivel 40, ×2,28 y ×1,16. La ficha (C) muestra tu veteranía.

El nivel 2 requiere **100 XP**. Cada nivel siguiente requiere 50 adicionales: **150, 200, 250…**. La experiencia sobrante se conserva, incluso si una recompensa permite subir varios niveles.

Cada nivel concede **2 de vida máxima** y **un punto de mejora**. Un punto suma 1 a fuerza, velocidad, resistencia o inteligencia, o 5 a vida. Dante gana además 1 de fuerza automático; si elige fuerza también, obtiene 2 en total.

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
| Más de 100 | `0,25 + 25 / velocidad` s (200: 0,375 s) | Veloz: `178 − 3000 / velocidad` px/s (200: 163) |
| Más de 100, durante Fé Judía | 0,25 s | Extraordinario |

Las bandas establecen pasos base de 72, 92, 118 y 148 píxeles por segundo. Pasado 100, cada punto sigue sumando pero cada vez menos: el golpe se acerca a 0,25 s y el paso a 178 sin llegar nunca. La banda extraordinaria de Gero llega directo a **178 píxeles por segundo** y 0,25 s. Los cambios porcentuales temporales afectan directamente al movimiento para que se sientan incluso dentro de una banda; el intervalo de ataque sigue la banda de velocidad efectiva.

Correr aumenta el movimiento **25%**. Tras dejar de correr durante **2 segundos**, la energía comienza a recuperarse. Agotarla por completo bloquea la carrera por **10 segundos**, mientras la barra vuelve a llenarse.

### Resistencia

| Resistencia efectiva | Carrera hasta agotarse | Daño físico absorbido |
| --- | ---: | ---: |
| Menor que 15 | 3 s | 0 |
| 15 a menos de 30 | 5 s | 2 |
| 30 a menos de 60 | 7 s | 4 |
| 60 a menos de 80 | 10 s | 6 |
| 80 a 100 | 12 s | 8 |
| Más de 100 | 12 s | 8 + 1 cada 10 puntos (150: 13) |

Paco recibe el **90%** de la duración y protección de su banda; Fede, el **80%**. La armadura conserva un mínimo de **1 de daño por golpe**. El veneno ignora por completo esta protección.

## Enemigos

Casi todos comparten un radio de detección de **195 píxeles**. Tienen **el mismo nivel que tu personaje** y no corren ni gastan energía. Desde el nivel 8, además, cada nivel les suma **4% de vida y 0,5% de fuerza** (`vida × (1 + 0,04 × (nivel − 8))`, `fuerza × (1 + 0,005 × (nivel − 8))`). El daño de los enemigos comunes es el **72%** de su fuerza final; el de los jefes, el **68%**. Así el final del juego sigue siendo exigente. La vida de los enemigos no tiene tope; fuerza, velocidad y resistencia sí (100 antes del extra).

| Enemigo | Vida | Fuerza | Velocidad | Resistencia | Aumento por nivel: V / F / Vel / R |
| --- | ---: | ---: | ---: | ---: | --- |
| Chorro | 100 | 5 | 15 | 10 | +1,5 / +0,5 / +1 / +1 |
| Perro | 60 | 3 | 30 | 20 | +0,75 / +0,25 / +1,5 / +1 |
| Serpiente | 35 | 5 | 25 | 5 | +0,5 / +1 / +1 / +0,25 |
| Rata | 10 | 1 | 40 | 0 | +0,25 / +0,4 / +1 / +0,25 |
| Murciélago | 40 | 6 | 45 | 15 | +1,5 / +0,5 / +1 / +0,5 |
| Araña | 35 | 6 | 26 | 35 | +0,5 / +0,4 / +0,5 / +1 |
| Gusano de tierra | 100 | 10 | 18 | 62 | +4 / +0,75 / +0,5 / +1 |
| Esqueleto con escudo | 100 | 14 | 8 | 35 | +1,5 / +0,8 / +0,2 / +1 |
| Esqueleto arquero | 1 | 7 | 30 | 0 | +0 / +0,5 / +0,5 / +0 |

- Los **chorros** atacan con cuchillo y no retroceden al recibir golpes.
- Los **perros** reducen el movimiento un 15% durante 4 segundos; contra Pepe, un 20%.
- Las **serpientes** tienen 40% de probabilidad de envenenar, salvo el 15% contra Fede. El veneno causa 2 de daño por segundo durante 5 segundos; aumenta 1 por nivel de serpiente. Una nueva aplicación reinicia los 5 segundos.
- Las **ratas** se prenden del cuerpo por 3 segundos y luego saltan hacia atrás antes de intentar prenderse otra vez. Prendidas muerden al 60% de su fuerza y como mucho una vez cada 0,9 s.
- Los **murciélagos** (Cueva Profunda) vuelan en zigzag y muerden rápido.
- Las **arañas** (Cueva Profunda) tienen 15% de probabilidad de envenenar como las serpientes (5% contra Fede). Su caparazón absorbe 4 de daño por golpe.
- Los **gusanos de tierra** (Las Entrañas) esperan enterrados, salen cuando te acercás a unos 120 píxeles y absorben 6 de daño por golpe. Reaparecen a los 90 segundos. Para pelear cómodo en los niveles profundos conviene llevar armas mejoradas.
- Los **esqueletos con escudo** (cementerio) son lentos, pegan fuerte y tienen 15% de probabilidad de bloquear cada golpe.
- Los **esqueletos arqueros** (cementerio) te ven desde 260 píxeles, disparan flechas cada 1,7 s y se alejan si te acercás. Se rompen de un golpe.

Los ataques empujan a perros, serpientes y ratas; las ratas prendidas deben terminar su agarre. Los aumentos propios de vida de cada enemigo se aplican según la tabla, sin sumarles los 2 de vida automáticos del jugador. El daño de veneno también respeta el límite de fuerza de 100.

## Armas

| Arma | Dónde | Funcionamiento |
| --- | --- | --- |
| Puños | Desde el comienzo | Daño igual a fuerza, corto alcance |
| Espada | Yuyos | Fuerza ×1,5 y mayor alcance |
| Arco | Aldea | Proyectil a distancia; necesita 0,7 s de carga y respeta el intervalo de ataque |
| Piedra | Cueva | Proyectil a distancia; caminar 2 s recarga la munición. Es lo único que lastima a Zak durante la Tormenta de agonía |
| Espada Elemental | El Taller | Fuerza ×4,5 y alcance de espada; se forja con 5 Piedras Elementales y materiales |

Se interpretó «aumenta el daño en un ×0,5» como **50% adicional**, por lo que la espada multiplica por **1,5**.

## Desarrollo y pruebas

Implementado con **HTML, CSS y JavaScript**, sin paquetes externos. El mundo se dibuja en Canvas 2D con gráficos pixel art creados por código; no requiere imágenes, tipografías ni sonidos descargados.

- `src/data.js`: personajes, enemigos, jefes, artículos del almacén y reglas puras de estadísticas, experiencia y mejoras.
- `src/world.js`: mapa, biomas, objetos, colisiones y vecinos.
- `src/render.js`: sprites, terreno, cámara y efectos visuales.
- `src/game.js`: simulación, movimiento, combate, esquiva, combos, monedas, tienda, jefes y habilidades.
- `src/bosses.js`: el Chupasangre, el Gólem Minero, Cerbero y Zak; altar de ofrendas, portales e invocaciones.
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
