# Registro de cambios

Cada versión lista sus cambios agrupados por tipo:

- **Feature:** algo nuevo.
- **Change:** algo que ya existía y ahora funciona distinto.
- **Fix:** un error corregido.

## v2.1 — 2026-10-30

* Change
    - **Jefes más lentos:** todos caminan un 30% más despacio. La embestida del Capo y la del Chupasangre son más lentas, el Chupasangre se aleja más despacio antes de invocar y el salto de Cerbero tarda más en caer, así hay más tiempo para esquivar.
    - **Enemigos comunes más blandos:** pegan un 28% menos (hacen el 72% de su fuerza como daño). Desde el nivel 8 la fuerza extra por nivel baja de 2% a 1% y la vida extra, de 6% a 5%. En nivel 40, un chorro pasa de unos 460 a 410 de vida.
    - **Jefes un poco más blandos:** pegan un 32% menos (hacen el 68% de su fuerza como daño). Desde el nivel 8 ganan 5% de vida extra por nivel en vez de 6%. En nivel 40, por ejemplo, el Capo pasa de unos 4900 a 4400 de vida.
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
