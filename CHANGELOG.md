# Registro de cambios

Cada versión lista sus cambios agrupados por tipo:

- **Feature:** algo nuevo.
- **Change:** algo que ya existía y ahora funciona distinto.
- **Fix:** un error corregido.

## v2.37 — 2026-11-18
* Feature
    - **Contragolpe:** si un enemigo te pega mientras rodás, además de esquivarlo le devolvés un golpe al instante que hace 2,5 veces el daño de tu arma. A los enemigos comunes también los empuja; a los jefes, no. Tu personaje brilla dorado. Sale una vez por rodada y contra el que te atacó, si está al alcance de tu arma.
* Change
    - **Esqueletos arqueros más lentos:** caminan un 30% más despacio y recién se alejan cuando estás a menos de 110 píxeles (antes, 150). Disparan igual que antes.
* Fix
    - **Pruebas del navegador:** el verificador esperaba como mucho 10 s una respuesta de Chrome y en una máquina cargada cortaba las pruebas del motor. Ahora espera hasta 60 s.

## v2.36 — 2026-11-18
* Change
    - **Se sacó la pista del diario:** ya no aparece la flechita al lado del personaje, ni la dirección y los metros en el recuadro del diario. La opción también se fue.

## v2.35 — 2026-11-18
* Feature
    - **Pista del diario:** una flechita alrededor de tu personaje apunta al próximo objetivo sin cumplir: el arco, la cueva, el herrero, cada jefe, el altar, la puerta del trono… Es dorada si el objetivo está donde estás y lila si primero hay que tomar una bajada, una subida, un portal o una puerta (apunta a eso). En la computadora, el recuadro del diario dice además hacia dónde queda y a cuántos metros. Se esconde al llegar y mientras peleás contra un jefe, y se apaga en Opciones.
* Change
    - **Enemigos más duros:** los comunes tienen un 45% más de vida que su ficha (antes, un 20%) y los jefes, un 30% más (antes, un 10%). Pegan apenas más: el 75% de su fuerza los comunes (antes, el 72%) y el 71% los jefes (antes, el 68%).
    - **Zak no cambia:** sigue con un 10% más de vida y el 68% de daño.

## v2.34 — 2026-11-17
* Fix
    - **El juego se trababa cuando salía un esqueleto entre la niebla:** el oscurecimiento del susto armaba en cada cuadro un círculo gigante nuevo y no lo tiraba. Ahora cada forma se calcula una sola vez. Pasaba lo mismo, más leve, mientras la niebla aparecía o se iba.
    - **Las sombras de pantalla tienen un límite de memoria:** el juego guarda como mucho 24. Si alguna vez hiciera falta una nueva en cada cuadro, se tiran las más viejas en vez de llenar la memoria.

## v2.33 — 2026-11-17
* Fix
    - **Carteles de los corrales de La guardería:** el nombre se veía borroso y corrido hacia abajo. Ahora el cartel se hace a la medida del nombre, con la letra normal, centrada y sin sombra. Si el nombre es muy largo, usa la letra chiquita y se recorta para no salirse.

## v2.32 — 2026-11-17
* Feature
    - **Se puede entrar a La guardería:** adentro hay seis corrales separados por vallas, con cartel y tranquera. Los compañeros que no llevás esperan cada uno en el suyo, con su decoración: el murciélago tiene un rincón oscuro, una percha y frutas; el perro, cucha, camita, platos, hueso y pelota; la serpiente, arena, piedra, tronco, lámpara de calor y cactus; el Golemsín, piedritas, mineral, una zorra de mina y un yunque. Dos corrales quedan libres.
    - **Doña Herminia atiende adentro:** está detrás de su mostrador, en el rincón, y sale a recorrer los corrales. La campanita del mostrador la hace volver. Hay estantes con frascos, ventanas que muestran si es de día o de noche, alfombras, plantas y un banco.
    - **Salida de la dimensión de Zak:** en el Santuario hay un portal verde («A CASA») que te lleva a la plaza de Palihue City. El portal del altar sigue abierto para volver.
* Change
    - **El vendedor ambulante cambia lo que vende:** las curas y el Dado cargado son fijos, y las tres cosas raras cambian cada 70 segundos mientras está (tres tandas por visita, sin repetir la anterior). El surtido es más grande: comida, vendas, petardos, bagre, hierro, carbón, cristal arcano y más amuletos. Su menú dice cuándo cambia y te avisa cuando saca cosas nuevas.
    - **La noche es más oscura:** un azul profundo, y se ve bien solo alrededor tuyo. Los faroles y las ventanas alumbran más.
    - **El nido de la Yarará, rediseñado:** es un nido de ramas tejidas, con su hueco de pasto seco y huevos moteados de violeta. Cuando nace la viborita, queda un cascarón roto.
* Fix
    - **Las partículas seguían a la pantalla:** el polvo, las hojas, las mariposas, las luciérnagas, la bruma del cementerio, las chispas de la dimensión, la niebla y la lluvia ahora quedan en su lugar del mundo.

## v2.31 — 2026-11-17
* Change
    - **Subir de nivel a los compañeros depende de tu nivel:** la experiencia que necesitan crece un 6% por cada nivel de tu personaje, lo mismo que crece la experiencia que dan los enemigos comunes. A cualquier altura hacen falta más o menos los mismos enemigos: con un personaje de nivel 90 ya no alcanzan cuatro o cinco para llegar al nivel 10. Con el nivel 1 no cambia nada. Los que ya subieron no pierden niveles, y lo que Doña Herminia entrena también va según tu nivel.
    - **Talar y picar, rediseñado:** guardás el arma y solo se ve la herramienta, con la cabeza del color de su material: madera, piedra, hierro, oro o diamante. Sube despacio, baja de golpe y pega justo con el sonido, con un destellito. Arriba de todo pasa por detrás de la cabeza.
    - **Astillas y pedacitos de mineral:** en cada golpe saltan astillas de madera o pedacitos del color de lo que picás: piedra, carbón, hierro, oro, diamante o cristal arcano.
* Fix
    - **Al talar o picar parecía que pegabas con el arma:** se veía el golpe de la espada, el arco o los puños, y el pico era gris para todos.

## v2.30 — 2026-11-17
* Feature
    - **Campanitas de Don Anselmo:** cuando el vendedor ambulante llega a la zona donde estás, o entrás a la zona donde está él, suenan unas campanitas y aparece un aviso.
* Change
    - **El perro inmoviliza menos seguido:** cada 22 s (antes, cada 13 s). Con el nivel sigue saliendo un 3% más seguido por nivel.
    - **Inmovilizar corta el ataque:** si el perro (o el abrazo de la serpiente, la avalancha del Golemsín o la danza de Tena) inmoviliza a un enemigo en medio de un ataque, se lo cancela, también a los jefes. El jefe tarda 4 s en volver a intentar ese ataque. Antes los jefes se quedaban congelados a mitad del ataque y lo terminaban después.
* Fix
    - **Los efectos tocaban a enemigos inmunes:** durante el Refuerzo del Gólem (y los otros momentos en que un jefe no recibe golpes) los compañeros lo podían inmovilizar, desangrar o envenenar, y Tena lo podía paralizar. Ahora no le hace nada ningún efecto, y el compañero se guarda el especial para después.
    - **El primer aviso del vendedor ambulante:** después de empezar o cargar una partida, su primera visita no se avisaba.

## v2.29 — 2026-11-17
* Feature
    - **🎲 Dado cargado:** un amuleto nuevo que suma 10 puntos a cada probabilidad del juego, buena o mala (un 5% pasa a 15%): luna roja, dorado, huevos y escombros de los jefes, clima, vendedor ambulante, mimics y premios de las carpas, revancha del truco, bloqueos y venenos de los enemigos, rayos y más. Lo vende siempre Don Anselmo, el vendedor ambulante, a ◉ 4000.
* Change
    - **Menú principal:** dice «Siete aventureros» en vez de «Seis amigos», que eran siete desde que llegó Mer.
* Fix
    - **Los compañeros pegaban de más:** el perro, la serpiente y el Golemsín sumaban entre el 64 y el 120% de tu daño. Ahora, como el murciélago, suman entre un 5 y un 25%. La serpiente se come un enemigo de un bocado el 4% de las veces (antes, el 15%). Sus efectos (inmovilizar, envenenar, el escudo de piedra y las habilidades del nivel 5) no cambian.

## v2.28 — 2026-11-17
* Change
    - **Menú principal:** el título y los botones van en un panel con el mismo marco dorado que los menús. Los íconos tienen su cajita y los botones, relieve.
    - **Elección de personaje:** las tarjetas tienen el retrato en un marco de madera, y la elegida brilla en dorado. Abajo hay un panel con el retrato grande del elegido y cómo es, sus estadísticas y su habilidad, ventaja y desventaja en tarjetas.
* Fix
    - **El murciélago pegaba y curaba de más:** contra el Gólem Minero llegaba a sumar el 75% de tu daño y a curarte 4 de vida por segundo. Ahora la mordida es más chica (8% de tu golpe), el desangrado respeta la armadura y la **Sangre compartida** cura el 30% de lo que saca de verdad, hasta un 2% de tu vida máxima por segundo. Queda en un 5 a 20% de tu daño.

## v2.27 — 2026-11-17
* Change
    - **Todos los menús con el estilo de la ficha:** marco con doble filete dorado, títulos con adorno, secciones con su título, tarjetas con relieve y botones con sombra. Abarca la pausa, las opciones, las ranuras, el ranking, El Almacén, El Taller, los vecinos, el vendedor ambulante, la guardería, el medallero, el truco y las confirmaciones.
    - **Pausa:** arriba, una tarjeta con tu personaje, la ranura, el tiempo de aventura y tu guita. Los botones van en dos columnas, con íconos.
    - **Opciones:** separadas en «Pantalla y sonido», «Pantalla táctil» y «Teclas». Cada opción tiene un interruptor que muestra si está activada.
    - **Pedidos de los vecinos:** se muestran en un papelito, como el del diario.
    - **Ranking:** la tabla va en un panel y los tres primeros puestos se destacan en oro, plata y bronce.
    - **Medallero:** primero las medallas que ganaste, que brillan, y una barra con cuántas llevás.

## v2.26 — 2026-11-17
* Feature
    - **Ficha en dos páginas:** «Tu personaje» y «Tu compañero». La del personaje tiene su retrato en un recuadro; la del compañero, su retrato, su nivel, sus números (daño, cada cuánto pega y saca su especial, cuánto le duran los efectos), su habilidad y un campo para cambiarle el nombre. Los que todavía no tenés se ven como silueta, con la pista de cómo se consiguen.
    - **Misiones en el diario:** un bloque nuevo, al lado del medallero y el bestiario, con los pedidos de los vecinos en curso y cumplidos. Avisa cuando hay alguno listo para entregar.
* Change
    - **Ficha más linda y solo con lo del personaje:** estadísticas con barras y botón para mejorar, cómo peleás ahora, y la habilidad, ventaja y desventaja. Ya no muestra la guita, los objetos, los materiales ni las reliquias.
    - **Bolsa más linda:** objetos y amuletos en tarjetas, y casillas para armas, equipo y herramientas, materiales y reliquias (llaves del trono y ofrendas). No muestra la guita, ni los pedidos (están en el diario) ni los compañeros (están en la ficha).
    - **Diario más lindo:** arriba, tus enemigos y jefes vencidos y tu récord contra Zak; después, los bloques de medallero, bestiario y misiones; abajo, el desafío semanal y los objetivos. La lista de enemigos se fue: está completa en el bestiario.
    - **Sin mapa:** se sacaron el botón y la tecla M.

## v2.25 — 2026-11-17
* Feature
    - **Niveles de los compañeros:** suben hasta el nivel 10 con los enemigos que vencés mientras te acompañan. El daño casi no crece (+13,5% al 10): lo que mejora son sus efectos, que duran más y salen más seguido.
    - **Habilidades del nivel 5**, que no hacen daño (o casi): el perro **aúlla** y asusta a los enemigos comunes 3 s; el murciélago te **cura con lo que desangra**; la serpiente da un **abrazo** que inmoviliza; el Golemsín tira una **avalancha** que aturde a los de alrededor.
    - **Doña Herminia entrena** a los compañeros que esperan en la guardería: medio nivel por ◉ 150 por su nivel.
    - Al nivel 10 brillan con destellos dorados y dan la medalla **«Uña y carne»**.
* Change
    - La bolsa y la guardería muestran el nivel, la experiencia y la habilidad de cada compañero.
    - Las partidas guardadas cargan igual: los compañeros que ya tenías arrancan en el nivel 1.

## v2.24 — 2026-11-17
* Feature
    - **Tormenta eléctrica:** caen rayos en toda la superficie. Antes de cada uno titila una marca en el piso; si te pega, te saca un tercio de la vida y te paraliza 2,5 s. En Los Yuyos, donde cae un rayo se prende fuego el pasto y, si lo pisás, te quemás.
    - **Niebla:** en toda la superficie se ve solo cerca tuyo. En el cementerio, de vez en cuando un esqueleto sale de la tierra pegado a vos, con un susto en la pantalla.
    - **Vendedor ambulante:** Don Anselmo aparece cada tanto en alguna zona peligrosa (nunca en las aldeas), se queda unos minutos y se va. Vende curas y cosas raras, carísimas.
    - **Desafío semanal:** el mismo para todos los amigos, de lunes a domingo, y difícil (lleva más de un día). Paga ◉ 2500 y 4000 de experiencia; el primero en cumplirlo cobra x1,5. Se ve en el diario y tiene su pestaña **Desafío** en el ranking.
    - **Bestiario (K):** una página por enemigo con su mini historia y sus estadísticas de base y de ahora. Sin vencerlo, solo su silueta. En el borde, una luna roja muestra su forma de la noche sangrienta, que se completa al vencerlo durante una luna roja.
    - **Medallas nuevas:** «Elegido del cielo», «Se me heló la sangre», «Olor a asado», «Me siento estafado...», «Siete días», «Madrugador» y «Conocé a tu enemigo».
* Change
    - **Medallas secretas:** el medallero muestra el nombre de las que faltan, pero no cómo se consiguen. Algunos nombres cambiaron para no dar pistas: «Mano dura», «Día de pique» y «Familia numerosa».
    - **La luna roja llega a la dimensión de Zak:** sus enemigos y jefes, el Rey Mago y Zak incluidos, se ponen más fuertes y con los ojos rojos. El portal del altar se ve violeta con un contorno rojo oscuro y rayos rojos, y la dimensión se tiñe de rojo.
    - La lluvia sale un poco menos para hacerle lugar a la tormenta y la niebla, que son las menos probables.
    - **Ranking online:** para la pestaña Desafío y el x1,5 del primero hay que correr una vez el SQL de [docs/RANKING.md](docs/RANKING.md#desafío-semanal-v224) en Supabase.
    - Las partidas guardadas cargan igual: el bestiario ya trae las páginas de lo que venciste y el desafío arranca cuando hace falta.
* Fix
    - El aviso de la luna roja aparecía una sola vez por sesión: si empezabas otra partida, no te avisaba.

## v2.23 — 2026-11-17
* Change
    - **Lluvia:** los charcos y el pasto brilloso aparecen solo mientras llueve. Cuando para, todo se seca en unos segundos (antes quedaban 3 minutos).
    - **Truco:** el alma ya no juega todo de golpe. Piensa cada jugada un segundo (un poco más cuando tiene que contestar un canto) y lo que canta aparece en un globito.
    - **Truco:** la mesa es nueva: paño verde con borde de madera, tantos anotados con fósforos de a cinco, las cartas entran deslizándose, la baza ganada brilla y la perdida se apaga, y tu mano se ve en abanico.
    - El historial de la mesa ya no dice «Vos: Ganaste la primera»: el «Vos:» y el «El alma:» quedan solo para lo que se canta.
* Fix
    - En el celular, la mesa de truco ya no vuelve arriba de todo cada vez que juega el alma.

## v2.22 — 2026-11-16
* Fix
    - Empezar una partida nueva con otro apodo ya no le cambia el nombre en el ranking a tus otras partidas: cada partida guarda el suyo.
    - Las partidas de antes conservan el apodo con el que figuraban en el ranking de este dispositivo.
* Feature
    - **Nombre en el ranking**, en la pausa: cambia el apodo de la partida que estás jugando.

## v2.21 — 2026-11-16
* Feature
    - **Truco a 15 en la Feria de las Almas:** Truco y Retruco, las almas de la mesa, juegan con envido, real envido, falta envido, truco, retruco, vale cuatro y al mazo (sin flor). Se apuesta guita (◉ 50 a 1000) y, si ganás, te llevás el doble.
        - Si el alma pierde, un 30% de las veces te pide la **revancha**: si gana ella, te saca el doble; si ganás vos, te da un objeto al azar.
    - **Revancha contra Zak furioso:** quien ya venció a Zak elige, en la puerta del trono, entre la pelea de siempre y la revancha. Zak furioso tiene 50% más de vida, hace todo un 30% más rápido y suelta más guita. Su tiempo va a la pestaña nueva **Revancha Zak** del ranking.
    - **Medallas:** 25 logros, cada uno con una medalla dibujada que lo cuenta (una noche roja, un gólem roto, una corona partida…). Se ven con L o desde el diario, y la cantidad tiene su pestaña en el ranking.
    - **Lluvia:** cada tanto llueve en la superficie. Quedan charcos que salpican, el pasto brilla mojado y los peces pican más rápido.
    - **Compañeros:** cuatro bichos para domesticar, que te siguen y pelean con vos. Al domesticarlos les ponés nombre.
        - **Perro:** el del plato vacío de La guardería. Cinco platos de comida para perro (El Almacén), con 2 minutos entre uno y otro, y te lame. Cada 13 s inmoviliza 3 s.
        - **Murciélago:** el murcielaguito de la Cueva Profunda. Tres veces de tu sangre, con la vida llena, y cada vez te deja con 1. Cada 15 s desangra 5 s.
        - **Serpiente:** 5% de que nazca de un huevo al caer la Yarará. Se lleva en brazos (sin poder atacar) hasta Doña Herminia, que la cría en 10 minutos por ◉ 2000. Cada 15 s envenena, y a veces se come de un bocado a un enemigo común.
        - **Golemsín:** 5% de que aparezca al caer el Gólem en Las Entrañas. Te tira piedras hasta que le das 2 de piedra, hierro, oro, diamante y Piedra Elemental. Tira piedras de lejos, cada 20 s te protege 3 s de todo y te da +1 de cada material.
    - **La guardería:** casa nueva al noreste de la plaza, con Doña Herminia. Ahí esperan los compañeros que no llevás, y se cambian hablándoles.
* Change
    - El Almacén vende comida para perro.
    - La bolsa muestra tus compañeros y cómo se consiguen los que faltan.
    - **Ranking online:** para las pestañas Revancha Zak y Medallas hay que correr una vez el SQL de [docs/RANKING.md](docs/RANKING.md#revancha-zak-y-medallas-v221) en Supabase. Sin eso, el resto del ranking sigue andando.
    - Las partidas guardadas cargan igual: arrancan sin compañeros y reciben solas las medallas que ya les correspondían.

## v2.20 — 2026-11-06
* Feature
    - **Armaduras:** el herrero las fabrica en orden, y cada una protege más que la anterior: madera (2), hierro (4), oro (6), diamante (9) y piedra elemental (13, lleva 3 Piedras Elementales). Se ven en el personaje: hombreras y cinturón del color del material.
* Change
    - **La resistencia es solo la energía:** sigue marcando cuánto corrés, pero ya no resta daño. Lo único que protege de los golpes es la armadura (y el vino de la abuela).
    - Paco y Fede: su desventaja ahora solo achica la carrera.
    - Los enemigos no cambian: su armadura sigue saliendo de su resistencia.
    - Las partidas guardadas cargan igual y arrancan sin armadura. Los puntos que pusiste en resistencia se quedan y siguen alargando la carrera.

## v2.19 — 2026-11-06
* Feature
    - **Bolsa de consumibles (B):** hasta 10 de cada uno. F usa el objeto elegido y G cambia cuál; en el celular, el botón 🎒 nuevo de la derecha.
        - El Almacén vende **agua bendita** (inmune al fuego 10 s y apaga fogatas), **vendas** (cortan el desangrado), **choripán** (+20% de fuerza 45 s), **vino de la abuela** (+3 de armadura y −10% de paso 40 s) y **pergamino de regreso** (vuelve a la plaza, salvo en la dimensión de Zak).
        - El Gaucho vende **mate con yuyos**: energía al máximo y 40% de la vida en 10 s.
        - El herrero hace **petardos**: aturden 1,5 s a los enemigos comunes cercanos.
    - **Amuletos:** Medallita de la Virgen (regenera vida si no te pegan), Herradura de Zaino (+8% de paso), Diente de la Yarará (inmune al veneno), Anillo del Capo (+25% de monedas) y Ojo de Cerbero (ves en las cuevas oscuras y bajás sin antorcha). Un engarce para empezar; el segundo se compra.
    - **Pesca:** Don Chiche vende la caña. E al lado de una laguna, quieto, y E otra vez cuando pica. Mojarras, pejerreyes, bagres y, con un 5%, el **Dorado**: cura todo, 3 s sin recibir daño y 5 s de energía infinita.
    - **Pedidos de los vecinos:** Sor Inés, Cabo Funes, Tito, Clara, el Gaucho, Don Chiche y Doña Rosa en la aldea; Ánima, la Bruja Pocha y Merlín en la dimensión. Se aceptan después de la charla y pagan guita, consumibles o amuletos.
    - **Dimensión de Zak más grande:**
        - **Feria de las Almas** (segura): vecinos de la dimensión, dos almas jugando al truco y el **Mercader del Vacío**, que vende elixires, polvo de estrellas (+1 punto de mejora), el segundo engarce y arma amuletos.
        - **Biblioteca del Rey Mago:** libros voladores y duendes ilusionistas que se dividen en tres.
        - **Patio de las Gárgolas:** gárgolas que parecen estatuas, sombras de Zak que copian tu último ataque y vetas de **cristal arcano** (pico de diamante).
        - **Runas en el piso:** prendidas explotan; apagadas dan +15% de daño 8 s.
        - **Carpas del Pueblo Mágico:** se revisan con E. Pueden tener guita, consumibles, cristal arcano o un **mimic**.
        - **Fogatas:** se apagan con agua bendita, y los magos las vuelven a prender.
* Change
    - Los vecinos con pedido o tienda abren su menú cuando termina la charla.
    - La fuente del Santuario también llena botellas de agua bendita, hasta tener dos.
    - El mapa de la dimensión muestra las cinco zonas y el puesto del Mercader.
    - Las partidas guardadas siguen cargando: las de antes arrancan con la bolsa vacía, sin amuletos, sin caña y sin pedidos. Las vetas, árboles y enemigos de antes conservan su identificador.

## v2.18 — 2026-11-06
* Feature
    - **Mer, la cuidadora del bosque:** personaje jugable nuevo, con cuernos de ciervo, orejas puntiagudas, flores en el pelo largo y vestido de hojas. Tiene poca vida (85), es veloz (30), con fuerza normal (5) y buena resistencia (20).
    - **Madre tierra (Q, cada 45 s):** invoca 3 espíritus del bosque durante 7 s.
        - La siguen a todos lados y les pegan 2 veces por segundo a los enemigos cercanos, cada golpe con el 150% de su daño.
        - Son inmortales: los enemigos ni los ven. Cada uno toma un enemigo distinto mientras alcancen.
        - Sus golpes no empujan al enemigo, para que no se les escape.
    - **Hija del monte:** las serpientes la ignoran hasta que ella o sus espíritus las golpean.
    - **Hoja seca:** las quemaduras le hacen 50% más de daño.
* Change
    - La pantalla de personajes muestra a los siete: en el celular, en dos filas de 4 y 3.
    - Las partidas guardadas no cambian: los espíritus no se guardan, y si guardás con Madre tierra en espera, la espera se conserva.
    - **Ranking online:** para que entren las partidas de Mer hay que correr una vez el SQL de [docs/RANKING.md](docs/RANKING.md#mer-v218) en Supabase.

## v2.17 — 2026-11-05
* Feature
    - **Más vecinos en Palihue City:** ahora son 17, cada uno con su propia ropa: la seño Clara, Doña Rosa, Tito el almacenero, Rulo el cartero, Cacho el intendente, Mirta la chusma, el Tano Carmelo, Facu, Sor Inés, el Cabo Funes, Don Chiche el pescador y los de siempre.
    - **Animales:** 3 caballos, 5 gallinas, 3 gatos y 3 perros, con nombre y su forma de moverse. Las gallinas picotean, los gatos se sientan y los caballos pastan. Zaino y Moro están en un corral nuevo, al sur de la calle a Los Yuyos.
    - **El Gaucho:** toma mate sentado en un tronco, con su pava y con Malacara, su caballo ensillado, al costado de la calle a Los Yuyos.
    - **Diálogos:** acercate a cualquier vecino o animal y apretá **E** (en el celular, el botón **E**). Cada uno dice sus frases por turno, y algunas traen consejos que sirven. Mientras dura la charla, el mundo se queda quieto y el reloj no corre.
        - Los animales reciben una mimada, con corazón y su propio sonido.
        - Si jugás con Pepe, las gallinas te tratan distinto.
* Change
    - Los vecinos ya no usan el aspecto de los personajes jugables.
    - Los diálogos no se cortan a mitad de una acotación corta, y la frase ya no salta de renglón mientras se escribe. También en las escenas de Zak.
    - Los cuadros de diálogo muestran **E** cuando el texto termina.
    - Las partidas guardadas no cambian: vetas y árboles conservan su identificador y las charlas no se guardan. Si guardaste justo donde ahora vive un vecino, aparecés en la plaza.

## v2.16 — 2026-11-05
* Feature
    - **Día, tarde y noche:** el reloj de arriba a la derecha ahora dice en qué parte del día estás. El día completo dura 24 minutos reales: **día** de 07:00 a 14:00, **tarde** de 14:00 a 19:00 con una luz dorada que crece hasta el atardecer, y **noche** de 19:00 a 07:00.
    - **Luna roja:** cada noche hay un 5% de que salga, y dura hasta que amanece. Se ve una luna roja en el cielo, el mundo se tiñe de rojo y un aviso te lo dice. En las cuevas no se ve el cielo, pero sus enemigos cambian igual.
        - Los enemigos, incluidos los jefes, tienen 50% más de vida y de fuerza, 2 más de armadura y se mueven 25% más rápido. Los comunes también atacan más seguido.
        - A cambio, cada enemigo da **el doble de experiencia y de monedas**.
        - **Ojos rojos brillantes:** todos los enemigos los tienen durante esa noche, hasta el Capo, que los deja ver a través de los anteojos.
        - Si guardás durante la luna roja, sigue al cargar la partida.
    - **Dimensión de Zak:** allá siempre es de noche (el reloj dice «Noche eterna») y la luna roja no llega: sus enemigos no cambian. Si salió mientras estabas adentro, te enterás al volver.

## v2.15 — 2026-11-05
* Feature
    - **Partidas en la nube:** con una cuenta (mail y contraseña), las tres ranuras se sincronizan solas entre todos tus dispositivos, sin exportar ni importar. Se entra desde **Cuenta y nube**, en el menú o la pausa. Hay que preparar Supabase una vez ([docs/CLOUD.md](docs/CLOUD.md)).
        - Cada persona solo puede ver y cambiar sus propias partidas.
        - Primero se guarda en el dispositivo: sin conexión el juego sigue normal y sincroniza cuando vuelve.
        - Si una ranura cambió en dos dispositivos, el juego pregunta cuál dejar en vez de pisarla. Borrar una ranura la borra en todos tus dispositivos.
        - Se puede recuperar la contraseña por mail. Sin cuenta, todo sigue funcionando como antes, con exportar e importar.
        - El apodo del ranking viaja con la partida, para que en un dispositivo nuevo no figures como «Anónimo».
* Change
    - El menú principal se compacta en ventanas bajas, para que entren todas las opciones.

## v2.14 — 2026-11-04
* Feature
    - **Animación al cruzar el portal:** el portal te chupa girando mientras se agranda y caen chispas en espiral, la pantalla se va a blanco y salís en el Santuario de otro portal que se cierra atrás tuyo. Dura 2,7 s y se puede saltear.
* Change
    - **Arco:** su alcance sube a 330 (antes 165), el doble. La piedra se queda en 165.
    - **El portal no se apaga más:** antes se apagaba al cruzarlo y cada visita gastaba las cinco ofrendas. Ahora se gastan una sola vez y el portal queda prendido para siempre.
    - **Cerbero custodia el portal:** mientras esté vivo se ve rojo y no deja pasar, y un aviso te lo dice cuando lo pisás. Antes solo custodiaba el altar. Como reaparece a los 10 minutos, puede que tengas que volver a vencerlo o esperar.
    - **Partidas existentes:** si ya abriste el portal alguna vez, vuelve a estar prendido, y las ofrendas que habías dejado de nuevo en el altar vuelven a tu bolsa.

## v2.13 — 2026-11-04
* Feature 
    - **Sobrecarga (El Rey Mago):** se queda quieto 8 s, sin teletransportarse y sin protección, para que puedas pegarle cuerpo a cuerpo. Después explota en hielo: 250% de su fuerza en un área 1,5 veces mayor que el terremoto del Gólem.
        - **Aviso:** un círculo marca el área, un anillo crece hasta el borde, hay cuenta regresiva y a su alrededor crecen cristales de hielo.
        - Se esquiva saliendo del círculo o rodando justo a tiempo. Pegarle no la interrumpe.
    - **Congelado:** nuevo estado de 5 s. Quedás dentro de un bloque de hielo sin poder moverte, atacar, rodar ni usar tu habilidad, y los enemigos te pueden seguir pegando. Las hierbas se pueden usar.

## v2.12 — 2026-11-04
* Change
    - **Zak, nuevo diseño:** armadura de acero oscuro con placas en capas y gemas rojas, cuernos curvos, ojos rojos, bufanda y capa rojas rotas. Ahora se ve distinto de frente, de costado y de espaldas.
    - **Espada violeta:** guarda curva con gema, empuñadura trenzada y una hoja oscura con filos encendidos que chispean.
    - **Ataques de Zak en violeta:** el tajo tiene capas de luz y chispas, y cubre el área real del daño. La ejecución ahora destella en violeta.
    - **Zak se desploma:** al perder una vida se arrodilla, cae al piso y se vuelve a levantar envuelto en un aura violeta. Al correr se inclina con la capa al viento, y al clavar la espada queda hundida en el piso.
    - **Cerbero, ahora un perro de verdad:** cuerpo de perro con pecho hondo y cintura fina, patas traseras con su articulación, cola peluda y pelo a mechones. Sus tres cabezas tienen hocico largo, orejas paradas, nariz, colmillos y collares con púas, y jadean con la lengua afuera.

## v2.11 — 2026-11-04
* Feature
    - **Lluvia de cuchillos (El Capo del Eco):** se planta en su lugar, sin perseguirte ni huir, avisa con los cuchillos en alto y durante 5 s tira 3 por segundo (200% de su fuerza), cada uno hacia donde estés en ese momento.
        - Los cuchillos atraviesan cualquier estructura y llegan a toda la cueva, pero no salen de ella.
        - **Cinco cuchillazos en una misma lluvia te noquean.** Sobre tu cabeza y en la barra del jefe se ve cuántos llevás.
        - Se esquivan rodando. Aturdirlo o salir de la zona la corta. La copia que invoca Zak no la usa.
* Change
    - **Jefes redibujados:** los siete ahora están dibujados a su tamaño real, píxel por píxel, en lugar de ser sprites chicos agrandados.
        - **El Capo:** traje a rayas, sombrero, anteojos negros, bigote, cigarrillo y faca.
        - **La Yarará:** cuerpo por segmentos con su dibujo de rombos.
        - **El Chupasangre:** capa que se abre como alas de murciélago, garras y colmillos.
        - **El Gólem:** bloques de roca con vetas de mineral, puños enormes y casco de minero con linterna.
        - **Cerbero:** tres cabezas separadas sobre sus cuellos, grietas de lava y crin encendida.
        - **Zak:** armadura con runas, cuernos, capa rota y una espada del tamaño de un hombre.
        - **El Rey Mago:** túnica con estrellas, barba larga, corona y báculo.
    - **Animaciones de ataque de los jefes:** cada ataque tiene preparación y golpe, sincronizados con el momento real del daño.
        - **El Capo:** carga la faca, embiste con estela y lanza los cuchillos alternando las manos.
        - **La Yarará:** se yergue y abre la boca con veneno para escupir, y azota la cola en círculo.
        - **El Chupasangre:** zarpazos con marcas de garras, capa abierta antes de la embestida y gotas de sangre cuando te chupa.
        - **El Gólem:** levanta los puños y al caer abre grietas y hace saltar piedras; arranca la roca del piso antes de tirarla.
        - **Cerbero:** las cabezas se retraen y muerden, encoge las patas al saltar y tira tierra al escarbar.
        - **Zak:** levanta la espada y baja un tajo que cubre el área real del daño; la clava en el piso en la Tormenta y ruge alzando los brazos.
        - **El Rey Mago:** alza el báculo y su orbe crece al conjurar, flota durante el láser y se arrodilla al curarse.
    - **Espada:** su alcance sube a 45 (antes 36).
    - **Puños:** su alcance sube a 45 (antes 36), igual que la espada, y su área recta es más angosta: 24 de ancho (antes 36).

## v2.10 — 2026-11-04
* Change
    - **Indicadores de ataque más transparentes:** la línea de los tiros y el área de los golpes tapan menos el juego.
    - **Puños:** ahora golpean en un área recta, en lugar de en abanico. El alcance sigue igual.
    - **Espada:** su alcance baja al de los puños (de 55 a 36). Sigue golpeando en abanico, así que cubre más hacia los costados.
    - **Arco:** su alcance baja a 165 (antes 350), el triple de lo que tenía la espada.
    - **Piedra:** su alcance baja a 165 (antes 220), el mismo que el arco.

## v2.9 — 2026-11-04
* Change
    - **Apuntar y soltar (celular):** mantener el analógico de ataque ya no ataca: muestra hacia dónde va a salir el golpe, y el ataque se hace al soltarlo.
        - **A distancia (arco y piedra):** una línea marca el recorrido real del tiro y termina donde va a pegar: una mira sobre el primer enemigo, una barra si choca con un obstáculo o una flecha si llega al máximo alcance.
        - **Cuerpo a cuerpo (puños y espadas):** un área muestra el rango exacto del golpe, con el mismo alcance y ángulo que usa el daño.
        - Si el ataque todavía no está listo, el indicador se ve apagado. Si soltás cuando le falta poco (hasta 0,35 s), el golpe sale apenas esté listo en vez de perderse.
        - Sin arrastrar, mantenerlo muestra el indicador hacia el enemigo más cercano; un toque corto ataca directo. Volver al centro antes de soltar sigue cancelando.

## v2.8 — 2026-11-04
* Feature
    - **Analógico de ataque (celular):** el botón ⚔ ahora es un analógico como el de movimiento. Arrastralo para elegir la dirección exacta del golpe o del disparo; ataca sin parar mientras esté inclinado y podés caminar para un lado y pegar para el otro.
        - Mientras apuntás, una guía en pantalla marca el alcance real: la línea del tiro con arco y piedra, la zona que barre el golpe con puños y espadas.
        - Un toque, o dejarlo apretado sin moverlo, sigue apuntando solo al enemigo más cercano. Volver al centro antes de soltar cancela el golpe.
    - **Animaciones de ataque:** la espada se balancea con una estela en la dirección real del golpe, alternando el lado en cada golpe; el puño sale desde el hombro; el arco se tensa; la piedra se arroja. También se ven el hacha y el pico al juntar materiales.
    - **Muerte de los enemigos:** destello blanco, el cuerpo se encoge y salta en pedazos del color de cada uno.
    - **Vida de fondo:** mariposas y hojas que vuelan de día, luciérnagas de noche y polvo en las cuevas.
* Change
    - **Gráficos más nítidos, siempre en pixel art:** ya no hay bordes borrosos en jefes, polígonos, círculos ni avisos de ataque, y cada sprite lleva contorno. En la mayoría de las pantallas, cada píxel del juego mide un número entero de píxeles reales, así que todos quedan iguales; a cambio, la vista puede ser hasta un 12,5% más grande o más chica según la pantalla.
    - **Personajes:** caminata de 4 cuadros con vistas de frente, espalda y costado, respiración y parpadeo. La voltereta gira de a cuartos, con estela. Al recibir un golpe, destello blanco.
    - **Enemigos:** nuevas animaciones de aleteo (murciélago), reptar (víbora), galope y cola (perro), y patas que se mueven más rápido cuando te persiguen. Quietos, respiran. La barra de vida cambia de color según cuánta les queda.
    - **Terreno:** pasto, tierra y roca con textura natural en lugar de la grilla de cuadrados; caminos de borde irregular; biomas que se funden entre sí; plaza con adoquines; alfombra del trono con rombos.
    - **Árboles, arbustos y laguna redibujados:** follaje en racimos con luz y sombra que se mueve con el viento; la laguna tiene orilla, profundidad, ondas, destellos y juncos.
    - **Luz y oscuridad con tramado:** antorcha, faroles, fogatas y penumbra de las cuevas sin degradados lisos.
    - **Letra de píxeles propia:** carteles, nombres, números de daño y diálogos se leen claros. Los críticos saltan más grandes.
    - **Tiros:** la flecha vuela en su ángulo real, con estela; la bola de fuego y el veneno dejan rastro; las piedras giran cuadro a cuadro.
    - El terreno se reutiliza al empezar una partida nueva, así que arranca sin trabarse.
* Fix
    - El polvo al correr podía no dibujarse si todavía no habías rodado; ahora aparece siempre, también en la aldea.

## v2.7 — 2026-11-03
* Change
    - **Respiro de Zak:** después de cada ataque se queda quieto 2 s, sin perseguirte ni atacar, para que puedas pegarle cuerpo a cuerpo. Los tres espadazos ahora tardan 3,5 s en volver a estar listos (antes 2 s).

## v2.6 — 2026-11-01
* Feature
    - **Dimensión de Zak:** el portal del altar ya no lleva directo al trono, sino a una dimensión de la que no se sale hasta vencer o perder contra Zak. Tiene el estilo oscuro y violeta del trono.
        - **Santuario:** zona segura con una fuente que cura vida y energía, como el pozo de la aldea.
        - **Pueblo Mágico:** al norte, con carpas y fogatas. Pisar una fogata quema: 2 de vida por segundo durante 5 s.
        - **Puerta del trono:** al fondo del pueblo; se abre con la Llave del trono y lleva a Zak.
    - **Magos:** se quedan quietos 2 s conjurando y tiran bolas de fuego que lastiman mucho y queman. Siempre buscan distancia y son algo lentos.
    - **Armaduras vivientes:** mucha vida y mucho daño, extremadamente lentas; levantan la espada y giran, pegando todo a su alrededor.
    - **El Rey Mago (jefe):** se teletransporta antes de casi cada ataque; bolas de fuego en estrella, zona de curación de 150 por segundo durante 10 s (pegale para cortarla), invocación de cinco armaduras y el Láser reloj, que termina en una onda de alcance infinito que solo se esquiva rodando. Suelta la **Esfera mágica** (se vende por ◉ 3000) y la **Llave del trono**. Nueva misión en el diario (◉ 150).
    - **Quemadura:** nuevo estado (🔥 Quemado) que, como el veneno, ignora la armadura. La fuente y entrar a una zona segura lo apagan.
    - **Récord contra Zak:** se guarda el tiempo más rápido de cada partida (desde que termina su presentación hasta vaciarle la última vida) y el ranking tiene la pestaña **Récord Zak**. Se ve también en la ficha (C).

* Change
    - **Rodar con Ctrl:** en teclado se rueda con **Ctrl** (antes F). Shift sigue siendo correr.
    - **Rodar hacia donde vas:** con Ctrl o con clic derecho, la voltereta sale siempre en la dirección en que te movés; si estás quieto, hacia donde mirás. Antes el clic derecho rodaba hacia el puntero.
    - Mientras jugás, los atajos del navegador con Ctrl (buscar, recargar, guardar…) no se activan. En pantalla completa tampoco Ctrl+W, Ctrl+T ni Ctrl+N.

## v2.5 — 2026-11-01

* Feature
    - **Escenas con diálogo:** franjas de cine, cuadro de diálogo con texto que se va escribiendo y voz, la cámara enfocada en Zak o en el altar, y el jugador quieto. E, Espacio, Enter o tocar la pantalla completan el texto o pasan al siguiente.
    - **Presentación de Zak:** al entrar al trono pregunta «¿Y vos quién sos?», «¿Qué hacés acá?» y «No importa… ahora vas a ser mi juguete por un rato.», levanta la espada entre rayos y recién ahí empieza la pelea.
    - **Apertura épica del portal:** las cinco ofrendas suben de a una con su color, giran sobre el altar, chocan entre rayos y temblores, estallan con un destello y el portal violeta crece desde la nada.
* Change
    - **Ejecución de Zak:** si no cruzás el portal de salida a tiempo, dice «¿Sabés lo que le pasa al que no sigue mis órdenes?», cierra el portal, se levanta del trono con un «Muere...», corre hacia vos y te mata de un espadazo (antes era instantáneo).

## v2.4 — 2026-11-01

* Feature
    - **Bumeranes de energía de Zak:** si estás lejos, golpea el piso y lanza tres bumeranes violetas en abanico que vuelven a su mano. Pegan a la ida y a la vuelta (31% de tu vida máxima cada uno). La barra del jefe avisa «¡BUMERANES! RODÁ (F)».
    - **Aviso de rebalanceo:** al abrir el juego, las partidas guardadas bajan a la mitad de nivel (una sola vez) y reciben ◉ 10.000 de compensación. Un mensaje en el menú lo explica. Las estadísticas y los puntos no cambian. Lo mismo pasa al importar un respaldo viejo.
* Change
    - **Zak con muchísima más vida:** 22000 por vida en nivel 1 (antes 11000), +440 por nivel (antes +198) y ahora también gana la vida extra de veteranía desde el nivel 8. En nivel 40: unos 89 000 por vida (antes unos 18 700).
    - **Poder de golpe:** la fuerza cuenta entera hasta 10 y después rinde cada vez menos (raíz cuadrada). 100 de fuerza pegan como 40,8.
    - **Subir de nivel cuesta mucho más:** `(100 + 50·n + 5·n²)` XP, y desde el nivel 50, ×1,03 por nivel. Nivel 10: 955 XP (antes 550); nivel 50: 14 555 (antes 2550); nivel 100: unos 237 000 (antes 5050).
    - **Jefes con mucha más experiencia:** base ×2,5 y crecen 12% por nivel; los enemigos comunes, 6% (antes 7,5% para todos).
    - **Esqueletos más peligrosos:** el de escudo pasa a 18 de fuerza (+1 por nivel); el arquero, a 18 (+1 por nivel) y sus flechas pegan ×1,75, incluso por encima del tope.
    - **Jefes más rápidos:** todo lo hacen a un ritmo 20% mayor (avisos, ataques, recargas y movimiento) y caminan al 75% de su banda (antes 70%).

## v2.3 — 2026-10-30

* Change
    - **Jefes con más vida:** todos, Zak incluido, tienen un 10% más de vida que la base de su ficha (antes, 15% menos). El Capo pasa de 442 a 572 en nivel 1 y de unos 3300 a 4240 en nivel 40; Zak, de 10000 a 11000 por vida en nivel 1.
    - **Enemigos comunes con más vida:** tienen un 20% más de vida que la base de su ficha. Un chorro pasa de 100 a 120 en nivel 1 y de unos 360 a 430 en nivel 40.
    - **Un poco menos de tiempo para esquivar** (Zak no cambia):
        - Embestida del Capo: de 1,1 a 1 s.
        - Colazo de la Yarará: de 0,85 a 0,75 s. Su veneno: de 0,8 a 0,7 s.
        - Embestida del Chupasangre: de 1 a 0,9 s. Su manotazo: de 0,5 a 0,42 s.
        - Cada golpe del Terremoto del Gólem: de 1 a 0,9 s. Su piedrazo: de 0,9 a 0,8 s.
        - Mordida de Cerbero: de 0,55 a 0,47 s. En su salto, el círculo queda quieto 0,6 s antes de caer (antes, 0,7 s).

## v2.2 — 2026-10-30

* Feature
    - **Veteranía:** desde el nivel 8, tu personaje crece al mismo ritmo que los enemigos. Tu daño sube un 4% por nivel (lo mismo que su vida extra) y tu vida máxima, un 0,5% por nivel (lo mismo que su fuerza extra). En nivel 20 pegás ×1,48 y tenés ×1,06 de vida. La ficha (C) lo muestra.
* Change
    - **Sin topes para el personaje:** la vida ya no se frena en 500; la fuerza, la velocidad y la resistencia ya no se frenan en 100. Los botones de mejora nunca se bloquean por llegar a un máximo.
    - **Velocidad más allá de 100:** sigue mejorando, cada vez menos. El golpe se acerca a 0,25 s y el paso a 178 px/s sin llegar nunca (con 200: 0,375 s y 163 px/s). La Fé Judía de Gero sigue saltando directo a la banda Extraordinaria (0,25 s y 178 px/s) cuando supera 100.
    - **Resistencia más allá de 100:** cada 10 puntos suman 1 de armadura (con 150: 13 de armadura). La carrera sigue llegando a un máximo de 12 s.
    - La ficha muestra la banda de velocidad y el movimiento.

## v2.1 — 2026-10-30

* Change
    - **Jefes más lentos:** todos caminan un 30% más despacio. La embestida del Capo y la del Chupasangre son más lentas, el Chupasangre se aleja más despacio antes de invocar y el salto de Cerbero tarda más en caer, así hay más tiempo para esquivar.
    - **Más tiempo para esquivar:** los jefes esperan más entre el aviso y el golpe. La embestida del Capo pasa de 0,8 a 1,1 s; el colazo de la Yarará, de 0,6 a 0,85 s y su veneno, de 0,55 a 0,8 s. La embestida del Chupasangre pasa de 0,7 a 1 s y su manotazo, de 0,3 a 0,5 s. Cada golpe del Terremoto del Gólem pasa de 0,75 a 1 s y el piedrazo, de 0,6 a 0,9 s. La mordida de Cerbero pasa de 0,35 a 0,55 s y su salto deja quieto el círculo 0,7 s antes de caer. Zak no cambia.
    - **Enemigos comunes más blandos:** pegan un 28% menos (hacen el 72% de su fuerza como daño).
    - **Final del juego más llevadero:** desde el nivel 8, la vida extra por nivel baja de 6% a 4% y la fuerza extra, de 2% a 0,5%. En nivel 40, un chorro pasa de unos 460 a 360 de vida.
    - **Arañas:** tienen la misma vida que una serpiente (35, +0,5 por nivel) y pegan menos: 6 de fuerza, +0,4 por nivel.
    - **Jefes más blandos (menos Zak):** tienen un 15% menos de vida y pegan un 32% menos (hacen el 68% de su fuerza como daño). En nivel 40, por ejemplo, el Capo pasa de unos 4900 a 3300 de vida.
    - **Zak:** cada nivel le suma 180 de vida por vida en vez de 200, y cada golpe saca el 52% de tu vida máxima en vez del 55%. Dos golpes siguen alcanzando.
    - **Más visión en las minas:** la antorcha ilumina un círculo más grande en la Cueva Profunda y Las Entrañas, y la Cueva del Eco es un poco menos oscura.

## v2.0 — 2026-10-30

* Feature
    - **El Chupasangre:** vampiro que custodia la bajada de la Cueva Profunda a Las Entrañas. Mientras esté vivo no se baja. Tiene tres ataques: la *Embestida sangrienta*, que si te agarra te chupa la sangre y lo cura; el *Manotazo*, dos golpes rápidos de corto alcance; y la *Invocación*, en la que se aleja y llama a cinco murciélagos. Suelta la **Garra Sangrienta**.
    - **El Gólem Minero:** gigante de Las Entrañas con cuatro vidas: piedra, hierro, oro y diamante. Cada vida es más fuerte y se rearma con una animación del material nuevo. Usa el *Terremoto* (cuatro golpes al piso, cada uno avisado con un anillo), el *Piedrazo* (aturde 3 s) y el *Refuerzo* (invencible 5 s, cada 15 s, y al instante al bajar del 30% de vida). Suelta la **Piedra Elemental**.
    - **Cerbero:** perro de tres cabezas, con mucha vida y velocidad. La *Mordida* desangra (5 de vida por segundo durante 5 s). En el *Jugueteo* salta, cae encima tuyo y te deja muy lento 5 s. Si lo dejás *Escarbar* 3 s sin pegarle, se cura entero. Tarda 10 minutos en volver y, mientras no está, el altar queda abierto. Suelta el **Ojo del alma**.
    - **Zak:** el gobernante. Tiene tres vidas, una enorme cantidad de vida, y dos golpes suyos alcanzan para tumbarte. Ataca con el *Espadazo* (tres golpes en un abanico de 60°), la *Invocación* (dos esqueletos con espada y escudo y dos arqueros) y la *Invocación mayor*: trae a un jefe al azar con su nivel actual y se sienta en el trono a curarse 3 por segundo hasta que lo vencés. La repite cada 40 a 80 segundos. En la *Tormenta de agonía* caen rayos violetas que matan de un toque durante 10 s, y en ese tiempo solo la piedra le hace daño. En su última vida suma la *Ira del gobernante* (20 s de visión reducida) y el *Terremoto morado* (solo un círculo del mapa queda a salvo).
    - **El final de Zak:** cuando lo vencés no muere. Vuelve al trono, dice «Dejémoslo acá y volvé a tu dimensión, mortal.» y abre un portal a la aldea. Si no lo cruzás en 40 segundos, te ejecuta: perdés toda la guita, los materiales y las ofrendas, y conservás armas y herramientas. Al morir aparece «Eso por querer hacerle el poronga...».
    - **Altar del gobernante:** cementerio al oeste de Palihue City, con entrada por la calle principal. Lo pueblan esqueletos con espada y escudo (lentos, pegan fuerte y a veces bloquean) y esqueletos arqueros (disparan de lejos, mantienen la distancia y se rompen de un golpe).
    - **El altar de ofrendas:** recibe una ofrenda de cada jefe. Las que dejás quedan guardadas aunque te vayas. Con las cinco, se rompen y se abre un portal violeta al **Trono de Zak**: una sala gótica de ladrillo negro, siempre de noche pero con buena visibilidad.
    - **Ofrendas:** el Colmillo Tóxico (Yarará), el Anillo de la mafia (Capo), la Garra Sangrienta, la Piedra Elemental y el Ojo del alma. Además de servir para el altar, El Almacén las compra por 500, 1000, 1000, 2000 y 2000 de guita.
    - **Espada Elemental:** se forja en El Taller con 5 Piedras Elementales, 10 de diamante, 15 de oro, 20 de hierro, 25 de piedra y 10 de madera. Hace ×4,5 de daño, contra ×3 de la espada al nivel máximo. Se equipa con la tecla 5.
    - El diario suma seis objetivos con recompensa: el Chupasangre, el Gólem, la Espada Elemental, Cerbero, las cinco ofrendas y Zak.
    - Nuevos estados en el HUD: aturdido, agarrado, desangrado, muy lento e Ira del gobernante. La barra de jefe muestra las vidas y avisa qué ataque viene.
* Change
    - **Jefes más difíciles:** el Capo pasa de 340 a 520 de vida y de 9 a 12 de fuerza; la Yarará, de 320 a 480 de vida y de 7 a 10 de fuerza. Los dos crecen más con el nivel.
    - **El Capo del Eco** ahora custodia la bajada a la Cueva Profunda, con su trono al lado, y hasta vencerlo no se baja. Subir desde la Cueva Profunda siempre se puede, aunque haya vuelto a aparecer.
    - **La Yarará Madre** ya no se alcanza directamente: la valla de la entrada de Los Yuyos sigue hasta arriba de todo y hay que pasar por el camino de los yuyos.
    - **Final del juego más exigente:** los enemigos tienen el mismo nivel que tu personaje, y desde el nivel 8 ganan 6% de vida y 2% de fuerza extra por nivel. La vida de los enemigos ya no tiene tope de 500.
    - **Ratas:** su fuerza crece mucho menos con el nivel, y prendidas muerden al 60% y como mucho una vez cada 0,9 s.
* Fix
    - Ya no se puede llegar caminando a las cuevas profundas por los huecos del borde sur del mapa (eso permitía saltear las bajadas).

## v1.5 — 2026-10-29

* Feature
    - **Recompensas del diario:** cada objetivo cumplido da guita, que se reclama en el diario (J) con «Reclamar» o «Reclamar todo». Los objetivos más difíciles pagan más: de 5 (arco, cueva, piedras, Yuyos) a 50 (llegar a Las Entrañas), 260 en total.
    - Las partidas que ya tenían objetivos cumplidos pueden reclamar sus recompensas: no se pierde nada.
    - El botón del diario muestra ◉ cuando hay recompensas sin cobrar, y el aviso de objetivo cumplido dice cuánto podés reclamar.
    - **Opción «Tips»:** muestra u oculta el cartel con la tecla para interactuar («E · Hablar con el herrero»).
    - **Opción «Avisos durante el juego»:** oculta los carteles de zona, jefes y diario. Los errores y las confirmaciones de guardado se siguen mostrando.
* Fix
    - Los avisos ya no se apilan hasta tapar la pantalla: cada aviso nuevo reemplaza al anterior.

## v1.4 — 2026-10-29

* Feature
    - **El Herrero:** atiende en su mesa de trabajo junto a El Taller, al sur de la aldea. Va sin remera, musculoso, barbudo y con el martillo en la mano derecha. Al hablarle aparece su dibujo a la izquierda con el diálogo «Acá todo con verdes, pa.».
    - **Taller:** fabrica la antorcha (1 madera + 3 carbón), los picos y las hachas de madera a diamante (siempre en orden) y las mejoras de armas. Todo se paga con materiales y guita.
    - **Recolección:** madera de cualquier árbol (con hacha); piedra y carbón en la Cueva del Eco; hierro y oro en la Cueva Profunda; diamante en Las Entrañas. Cada veta necesita un pico de cierto nivel.
    - Se trabaja quieto, con una barra de progreso. Moverse, atacar, rodar o recibir un golpe lo interrumpe.
    - Los árboles quedan como tocón y vuelven a crecer en 1 minuto. Las vetas se hacen añicos y vuelven en 3, 5, 7 o 10 minutos según el material.
    - Herramientas mejores trabajan más rápido: madera ×1, piedra ×1,3, hierro ×1,6, oro ×1,95 y diamante ×2,4.
    - **Mejoras de armas:** puños, arco, espada y piedra suben del nivel 2 al 6, de a uno, con 15 de madera, piedra, hierro, oro o diamante más 30, 45, 60, 75 o 90 de guita. Cada nivel suma 20% de daño a esa arma.
    - **Cueva Profunda (Nvl 2):** se baja desde el fondo de la Cueva del Eco con antorcha. Está a oscuras salvo por la luz de la antorcha. Tiene murciélagos que vuelan en zigzag, arañas que envenenan con 15% de probabilidad, hierro y oro, y no crecen hierbas medicinales.
    - **Las Entrañas (Nvl 3):** pocos gusanos de tierra (100 de vida, 10 de ataque, mucha armadura) que esperan enterrados y salen cuando te acercás. Ahí están las únicas vetas de diamante.
    - El mapa muestra el nivel de cueva en el que estás, las vetas, las bajadas (▼ ▲) y el herrero (⚒).
    - La ficha del personaje muestra materiales, herramientas y nivel de cada arma.
    - El diario suma tres objetivos: fabricar la primera herramienta, llegar al Nvl 2 y llegar al Nvl 3.
    - Materiales, herramientas, mejoras y vetas picadas se guardan con la partida.
* Change
    - Los botones táctiles de acción son un poco más grandes. El joystick queda igual.
    - Las ventanas siempre se abren desde arriba, así se ve el diálogo del herrero.
    - Cambió levemente la distribución de árboles y rocas de la Cueva del Eco para hacer lugar a las vetas.
* Fix
    - Quedar noqueado por un enemigo nuevo ya no muestra la frase de las ratas.

## v1.3 — 2026-10-29

* Feature
    - **Borrar partidas:** botón 🗑 en cada ranura. Antes de borrar avisa que la partida también sale del ranking de amigos. Sin conexión, el borrado online se reintenta más tarde.
    - El apodo para el ranking es obligatorio al elegir personaje.
    - **Tamaño de controles táctiles** en Opciones: chicos, medianos o grandes.
    - **Pantalla completa** automática al empezar o cargar en el celular (se puede desactivar) y botón ⛶ en el menú principal.
    - El juego se puede instalar como app desde el navegador, con ícono propio, y se abre en pantalla completa y horizontal.
    - **La Yarará Madre** tiene un ataque nuevo, el **colazo**. Marca un anillo rosado a su alrededor y golpea a todo lo que quede adentro. Se esquiva alejándose o rodando.
* Change
    - Los controles táctiles son más chicos y semitransparentes para ver mejor el juego.
    - **La Yarará Madre** ahora te persigue. Solo retrocede un poco antes de escupir el veneno. Su vida subió de 260 a 320.
    - Los perros de la cueva tienen menos vida: 60 en vez de 90.
    - La aldea se llama **Palihue City**.
* Fix
    - Al crear una partida nueva, ya queda vinculada a su fila del ranking desde el primer guardado.
    - Las pruebas automáticas ya no publican puntajes en el ranking real.

## v1.2 — 2026-10-29

* Feature
    - **Ranking de amigos:** compartido entre dispositivos con Supabase, con pestañas por nivel, enemigos y jefes derrotados. Sin conexión muestra las partidas del dispositivo.
    - **Controles para celular:** joystick analógico, botones de ataque con apuntado automático, rodar, habilidad, interactuar, hierbas, correr y cambiar arma.
    - Vibración al recibir daño en el celular.
* Change
    - Menús, ficha y paneles adaptados a pantallas de celular en horizontal y vertical.

## v1.1 — 2026-10-28

* Feature
    - **Jefes:** El Capo del Eco, en el trono de la cueva, avisa con una línea roja y embiste. La Yarará Madre, en Los Yuyos, escupe un abanico de veneno.
    - **Rodar** para esquivar golpes y proyectiles, con un instante de invulnerabilidad.
    - **Combos:** el cuarto golpe seguido es crítico (×1,75).
    - **Guita:** los enemigos sueltan monedas al caer.
    - **El Almacén:** vende hierbas, mate cebado, afilado de armas y clases con Beto.
    - Bolsa de hasta 5 hierbas medicinales, que se usan con R.
    - Sacudida de cámara, destellos al recibir daño y nuevos efectos y sonidos.
* Change
    - Al quedar noqueado se pierde parte de la guita: más si te vence un chorro o el Capo.
