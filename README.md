# Zak's Throne — Crónicas de los Aromos

Una aventura de acción y exploración en pixel art, vista desde arriba. Elegí a uno de siete amigos, preparate en la aldea y salí a explorar la cueva y los Yuyos.

Versión actual: **v2.20**. Los cambios de cada versión están en [CHANGELOG.md](CHANGELOG.md).

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
| Rodar y esquivar | Ctrl o clic derecho (hacia donde te movés; quieto, hacia donde mirás) |
| Habilidad activa | Q |
| Recoger / usar el pozo / comprar / hablar con el herrero / bajar y subir / dejar ofrendas en el altar | E |
| Talar o picar | E cerca del árbol o la veta, y quedarse quieto |
| Usar hierba de la bolsa | R |
| Usar el objeto elegido / cambiar de objeto | F / G |
| Bolsa y amuletos | B |
| Pescar (con la caña) | E al lado de una laguna; E otra vez cuando pica |
| Cambiar arma | 1 a 5; también sus botones |
| Ficha y mejoras | C |
| Diario de viaje | J |
| Mapa | M |
| Pausa y guardado | Esc |
| Sonido | Botón musical de la esquina superior |

La dirección de movimiento orienta al personaje; el ratón permite dirigir ataques a un punto del mundo.

### En el celular

- **Joystick analógico:** apoyá el pulgar en cualquier parte de la mitad izquierda y arrastrá. Inclinarlo poco camina más despacio.
- **Analógico de ataque:** mantené ⚔ y arrastralo para apuntar; al soltarlo se hace el ataque. Mientras apuntás se ve el indicador: con arco y piedra, una línea con el recorrido del tiro hasta donde va a pegar; con puños, el área recta del golpe; con espadas, su abanico. Podés caminar para un lado y atacar para el otro. Sin arrastrar, apunta solo al enemigo más cercano. Volver al centro antes de soltar cancela el golpe.
- **Botones para el pulgar derecho:** ⟲ rueda, ✦ usa la habilidad, E se ilumina cuando hay algo para usar cerca, ❦ usa una hierba, 🎒 usa el objeto elegido de la bolsa, » activa o desactiva la carrera y el botón de arma rota entre las conseguidas.
- **Arriba:** ficha, bolsa y amuletos (🎒), diario, mapa, pausa y ⛶ para pantalla completa, que también intenta fijar la orientación horizontal.
- El teléfono vibra al recibir daño (se desactiva junto con la sacudida de pantalla). Se juega en horizontal o en vertical, aunque en horizontal se ve más mundo. Los botones de la interfaz también permiten acceder a habilidades, armas, ficha, mapa y pausa.

El juego se adapta al tamaño de pantalla; en teléfonos conviene usar orientación horizontal. Los indicadores combinan texto, iconos y color. Las opciones permiten ajustar sonido, efectos visuales y la sacudida de pantalla.

## Ranking de amigos

Desde el menú principal o la pausa, **Ranking de amigos** muestra nivel, enemigos derrotados y jefes vencidos de cada partida, con pestañas para ordenar por cada uno. La pestaña **Récord Zak** muestra a quienes vencieron a Zak, del más rápido al más lento: cuenta el tiempo de la pelea, desde que termina su presentación hasta vaciarle la última vida, y guarda el mejor de cada partida. El nombre se elige al seleccionar el personaje.

Sin configuración, el ranking muestra las partidas de cada dispositivo. Para compartirlo entre todos los dispositivos, seguí [docs/RANKING.md](docs/RANKING.md): se conecta un proyecto gratuito de Supabase pegando dos valores en `src/config.js`.

## Guardar y recuperar partidas

Hay **tres ranuras de guardado manual** accesibles desde la pausa. Con una cuenta (**Cuenta y nube**, en el menú o la pausa), se sincronizan solas entre tus dispositivos; prepararlo lleva unos minutos ([docs/CLOUD.md](docs/CLOUD.md)). Cada una muestra el personaje y el progreso de esa partida. Al comenzar una aventura nueva las ranuras existentes quedan intactas.

Los guardados se conservan en el almacenamiento local del navegador usado para jugar. Sin cuenta, para trasladarlos a otro navegador o equipo, usá **Exportar** y **Importar**: se descarga o carga un archivo JSON de respaldo. Conservá una copia antes de borrar los datos del navegador.

## El mundo

- **Palihue City:** zona completamente segura, con casas, árboles, flores, vecinos y animales que caminan y tienen colisión (ver **Vecinos y animales**). Los enemigos no pueden entrar. El pozo permite recuperar vida y el puesto de **El Almacén** vende provisiones. Acá se encuentra el arco.
- **Cueva:** zona oscura habitada por chorros y perros callejeros. La piedra se encuentra en su interior. En el fondo noroeste, sentado en su trono junto a la bajada, **El Capo del Eco** no deja pasar a nadie.
- **Yuyos:** pastos altos, serpientes y ratas. Acá se encuentra la espada y Paco recibe su bonificación de Campesino. En el rincón noreste anida **La Yarará Madre**. La valla del límite con la aldea llega hasta arriba de todo: al nido se llega por el camino de los yuyos.
- **Cueva Profunda (Nvl 2):** se baja por la escalera del fondo noroeste de la Cueva del Eco; **hace falta una antorcha y haber vencido al Capo**. Está a oscuras: ves lo que alumbra la antorcha. Hay murciélagos, arañas, hierro y oro, y **no crecen hierbas medicinales**. En su extremo sureste baja otra escalera, custodiada por **El Chupasangre**.
- **Las Entrañas (Nvl 3):** pocos gusanos de tierra, enterrados hasta que te acercás, las únicas vetas de diamante y **El Gólem Minero**.
- **Altar del gobernante:** un cementerio al oeste de la aldea; se entra por el portón al final de la calle principal. Lo pueblan esqueletos con escudo y esqueletos arqueros. **Cerbero** custodia el altar de ofrendas.
- **Dimensión de Zak:** el portal del altar lleva acá, y **no se sale** hasta vencer o perder contra Zak. Las ofrendas se gastan una sola vez: **el portal queda prendido para siempre** y lo podés volver a cruzar, salvo mientras **Cerbero** esté vivo (se ve rojo y no deja pasar). Tiene cinco partes, con el mismo estilo oscuro y violeta del trono:
  - **Santuario** (zona segura): una fuente que, como el pozo de la aldea, devuelve la vida y la energía y apaga las quemaduras, y además te llena botellas de **agua bendita** hasta tener 2. Ahí vaga **Ánima**, un alma que tiene un pedido.
  - **Pueblo Mágico** (al norte): carpas, fogatas, magos y armaduras vivientes. **Pisar una fogata quema**: 2 de vida por segundo durante 5 s, ignorando la armadura (rodar no te salva). Con **agua bendita** (E cerca) la apagás durante 45 s; si un mago anda cerca, la vuelve a prender cuatro veces más rápido. Las **carpas** se revisan con E (cada una, cada 5 minutos): guita, agua bendita, vendas, petardos, cristal arcano, un elixir… o un **mimic** (15%). Al fondo, el **Rey Mago** custodia la **puerta del trono**, que se abre con su **Llave del trono** (se gasta al usarla).
  - **Feria de las Almas** (zona segura, al este del Santuario): vecinos de la dimensión, una mesa de truco eterna y el **Mercader del Vacío**.
  - **Biblioteca del Rey Mago** (al norte de la Feria): estantes sueltos, atriles, **libros voladores** y **duendes ilusionistas**.
  - **Patio de las Gárgolas** (al norte de la Biblioteca, y con un paso al Pueblo Mágico): **gárgolas** que parecen estatuas, **sombras de Zak** y las únicas vetas de **cristal arcano**.
  - **Runas en el piso** (Pueblo Mágico, Biblioteca y Patio): se prenden 2 s de cada 6. Pisar una **prendida** explota y te saca el 15% de la vida (rodando la esquivás). Pisar una **apagada** te da **+15% de daño durante 8 s**. Después de pisarla, cada runa descansa 12 s.
- **Trono de Zak:** sala gótica de ladrillo negro, siempre de noche pero bien visible. Se llega solo por la puerta del Pueblo Mágico. No hay enemigos: solo **Zak** y su trono.

Las bajadas custodiadas no se abren mientras su jefe esté vivo; si reaparece mientras estás abajo, subir siempre se puede. El mapa marca el almacén ($), el herrero (⚒), las bajadas (▼ ▲), el altar (✝) y las guaridas de los jefes (☠). Dentro de una cueva profunda o del trono, el mapa muestra esa zona. Los enemigos vuelven a aparecer después de **35 segundos**; el Capo y la Yarará, después de **3 minutos**; el Chupasangre, de 4; el Gólem, de 5; y Cerbero, de 10.

Al quedar noqueado volvés a la aldea. Si te vence un chorro aparece «Uhh... este gil me sacó guita»… y es literal: un chorro o el Capo se llevan el **30%** de tus monedas. Cualquier otra derrota cuesta el **10%**. Si Zak te ejecuta, perdés toda la guita, los materiales y las ofrendas (ver [El Trono de Zak](#el-trono-de-zak)).

### Vecinos y animales

En Palihue City viven 17 vecinos, cada uno con su ropa, y 14 animales: 3 caballos, 5 gallinas, 3 gatos y 3 perros. Acercate y apretá **E** (en el celular, el botón **E**) para hablar o hacer una mimada; cada uno va diciendo sus frases por turno. Con **E**, **Espacio**, **Enter** o tocando la pantalla seguís la charla. Mientras dura, el mundo se queda quieto y el reloj no corre.

- **El Gaucho:** toma mate sentado en un tronco, al costado de la calle que va a Los Yuyos, con Malacara, su caballo.
- **Caballos:** Zaino y Moro pastan en el corral que está al sur de esa calle. Tiene una entrada del lado del camino.
- **Gallinas:** dan vueltas al lado de El Almacén y de La Querencia. Si jugás con Pepe, te tratan distinto.
- **Los que más ayudan:** Clara, Beto, Tito, Mirta y Sor Inés tiran consejos que sirven de verdad.

### Día, tarde y noche

El día completo dura **24 minutos reales** (cada hora del juego es un minuto) y el reloj de la pantalla indica en qué parte estás:

- **Día:** de 07:00 a 14:00.
- **Tarde:** de 14:00 a 19:00, con una luz dorada que crece hasta el atardecer.
- **Noche:** de 19:00 a 07:00.

**Luna roja:** cada noche hay un **5%** de que salga, y dura hasta que amanece. Durante esa noche, todos los enemigos de la dimensión normal, jefes incluidos, tienen los **ojos rojos brillantes**, **50%** más de vida y de fuerza, **2** más de armadura y se mueven un **25%** más rápido (los comunes también atacan más seguido). A cambio dan **el doble de experiencia y de monedas**.

En la **dimensión de Zak** siempre es de noche y la luna roja no llega: sus enemigos no cambian. El reloj sigue corriendo afuera, así que al volver puede ser otra hora.

## Combate

- **Rodar (Ctrl o clic derecho):** una voltereta rápida hacia donde te movés (quieto, hacia donde mirás) que gasta 20% de energía. Mientras dura (0,3 s) ningún golpe ni proyectil te hace daño; el veneno que ya tenés sigue actuando. Rodar también te saca de encima una rata prendida. No se puede rodar agotado.
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
| Derrotar al Rey Mago | 150 |
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
| 🌀 Esfera mágica | El Rey Mago | 3000 |

La Esfera mágica no va al altar: es un trofeo que solo sirve para vender. El Rey Mago también suelta siempre una **🗝 Llave del trono**.

## Bolsa, consumibles y amuletos

Los consumibles van a la **bolsa** (B, o 🎒): hasta **10 de cada uno**. **F** usa el objeto elegido y **G** cambia cuál; en el celular, el botón 🎒 de la derecha usa el elegido. Desde la bolsa también podés usarlos o elegirlos.

| Objeto | Dónde | Precio | Efecto |
| --- | --- | ---: | --- |
| 💧 Agua bendita | El Almacén, la fuente del Santuario y las carpas | 15 | Apaga la quemadura y te hace inmune al fuego 10 s. También apaga fogatas |
| 🩹 Vendas | El Almacén y las carpas | 12 | Cortan el desangrado y curan 10 de vida |
| 🧉 Mate con yuyos | El Gaucho | 20 | Energía al máximo y cura el 40% de tu vida de a poco, en 10 s |
| 🌭 Choripán | El Almacén | 25 | +20% de fuerza durante 45 s |
| 🍷 Vino de la abuela | El Almacén | 20 | +3 de armadura, pero −10% de movimiento, durante 40 s |
| 🧨 Petardo | El herrero (2 de carbón + 15) y las carpas | — | Se tira hacia adelante y a los 0,7 s explota: aturde 1,5 s a los enemigos cercanos (a los jefes, no) y les saca un poco de vida |
| 📜 Pergamino de regreso | El Almacén | 80 | Te lleva a la plaza. No anda en la dimensión de Zak |
| ⚗ Elixir del vacío | El Mercader del Vacío y las carpas | 150 | Vida y energía al máximo, y te saca todos los males |

**Amuletos.** Se ponen y se sacan desde la bolsa. Empezás con **un engarce**; el Mercader del Vacío vende el segundo.

| Amuleto | Efecto | Cómo se consigue |
| --- | --- | --- |
| 🏅 Medallita de la Virgen | Si pasás 5 s sin recibir daño, recuperás 1 de vida por segundo | El pedido de Sor Inés |
| 🐴 Herradura de Zaino | +8% de movimiento | Mimar a los caballos de la aldea 10 veces |
| 🐍 Diente de la Yarará | Inmune al veneno | El herrero: 3 Colmillos Tóxicos, 5 de oro y ◉ 100 |
| 💰 Anillo del Capo | +25% de monedas de los enemigos | El Mercader del Vacío: 2 Anillos de la mafia, 6 cristales arcanos y ◉ 300 |
| 🧿 Ojo de Cerbero | Ves en la oscuridad de las cuevas profundas y podés bajar sin antorcha | El Mercader del Vacío: 1 Ojo del alma, 8 cristales arcanos y ◉ 500 |

### Pesca

**Don Chiche**, en la Laguna de las Libélulas, vende una **caña de pescar** (◉ 30) y te compra lo que saques. Con la caña, E al lado de cualquiera de las tres lagunas de la aldea tira la línea. Quedate quieto: a los pocos segundos **pica** (sale «¡PICA!» sobre el corcho) y tenés 1,3 s para apretar E otra vez. Si te movés, rodás o atacás, levantás la línea.

| Pescado | Probabilidad | Efecto | Don Chiche paga |
| --- | ---: | --- | ---: |
| 🐟 Mojarra | 40% | Cura 15 de vida | 4 |
| 🐟 Pejerrey | 35% | Cura 30 de vida | 10 |
| 🐡 Bagre | 20% | Cura 60 de vida y quita el veneno | 20 |
| 🐠 **Dorado** | **5%** | Te cura **todo**: vida y energía al máximo y sin ningún mal (veneno, desangrado, quemadura, lentitud, aturdimiento, congelamiento, agotamiento). Además, **3 s sin recibir daño** y **5 s de energía infinita** (correr y rodar no gastan) | 300 |

### Pedidos de los vecinos

Algunos vecinos tienen un pedido: después de hablar con ellos (E) se abre su menú para aceptarlo. Los enemigos cuentan **desde que lo aceptás**; las entregas se llevan lo que piden. La bolsa muestra los pedidos en curso.

| Vecino | Pedido | Recompensa |
| --- | --- | --- |
| Sor Inés | Derrotar 8 esqueletos (con escudo o arqueros) | 🏅 Medallita de la Virgen |
| Cabo Funes | Derrotar 10 chorros | ◉ 150 y 3 petardos |
| Tito | Traer 20 de madera | ◉ 90 y 3 choripanes |
| Clara | Traer 5 hierbas medicinales | ◉ 50 y 2 aguas benditas |
| El Gaucho | Traer 15 de carbón | ◉ 60 y 3 mates con yuyos |
| Don Chiche | Traer 3 pejerreyes | ◉ 80 y un bagre |
| Doña Rosa | Traer 2 bagres | ◉ 60 y 3 vinos de la abuela |
| Ánima (Santuario) | Derrotar 6 sombras de Zak | ◉ 300 y 4 cristales arcanos |
| La Bruja Pocha (Feria) | Traer 4 cristales arcanos | ◉ 150 y 2 elixires |
| Merlín de Quilmes (Feria) | Derrotar 12 libros voladores | ◉ 350 y 3 petardos |

### El Mercader del Vacío

Atiende su puesto en la Feria de las Almas (E en el puesto o hablándole). Vende **⚗ Elixir del vacío** (◉ 150), **✨ Polvo de estrellas** (+1 punto de mejora: ◉ 500, y cada uno sale ◉ 250 más), el **◈ Segundo engarce** para amuletos (◉ 4000) y arma el **Anillo del Capo** y el **Ojo de Cerbero** con ofrendas y cristal arcano. En la Feria también viven la Bruja Pocha, Merlín de Quilmes, Tía Eulalia la vidente, Ramiro el gnomo, Ernesto (un alma en pena) y Truco y Retruco, dos almas que juegan al truco desde hace trescientos años.

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
| Cristal arcano | Patio de las Gárgolas (violeta, brilla) | Pico de diamante | 2 | 10 min |

Hay 8 vetas de piedra, 6 de carbón, 9 de hierro, 5 de oro, 4 de diamante y 5 de cristal arcano. El herrero también hace **petardos** y talla el **Diente de la Yarará** (ver [Bolsa, consumibles y amuletos](#bolsa-consumibles-y-amuletos)). Cada nivel de herramienta trabaja más rápido que el anterior: madera ×1, piedra ×1,3, hierro ×1,6, oro ×1,95 y diamante ×2,4.

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
| El Capo del Eco | Junto a la bajada al Nvl 2 | 572 | 12 | 22 | 35 |
| La Yarará Madre | Rincón noreste de Los Yuyos | 528 | 10 | 28 | 20 |
| El Chupasangre | Junto a la bajada al Nvl 3 | 990 | 15 | 35 | 40 |
| El Gólem Minero | Las Entrañas | 462 por vida (×1; ×1,15; ×1,3; ×1,5) | 22 | 10 | 65 |
| Cerbero | Altar del gobernante | 1760 | 20 | 62 | 50 |
| El Rey Mago | Pueblo Mágico, frente a la puerta del trono | 2860 | 30 | 55 | 55 |
| Zak | Trono de Zak | 22000 por vida (+440 por nivel, y la vida extra desde el nivel 8), 3 vidas | — | 22 | 85 |

Son los valores en nivel 1; todos crecen con tu nivel. Hacen el **68%** de su fuerza como daño (los enemigos comunes, el 72%) y tienen un **10% más de vida** que la base de su ficha (los enemigos comunes, un 20% más). La tabla ya incluye ese extra. Desde el nivel 8 ganan **4%** de vida extra por nivel, como el resto. Entre el aviso y el golpe hay tiempo de reaccionar: entre 0,6 y 1 s para embestidas, saltos y golpes al piso, y menos de medio segundo para los golpes cortos. Caminan un **25% más lento** que lo que indica su velocidad, pero hacen todo a un **ritmo 20% mayor**: preparan, atacan, se mueven y recargan sus ataques antes (los tiempos de aviso de esta sección ya son más cortos en la práctica).

- **El Capo del Eco:** marca una línea roja y embiste: 160% de su fuerza y frena 1,5 s. *Lluvia de cuchillos*: se planta sin perseguirte ni huir y durante 5 s tira 3 cuchillos por segundo, cada uno hacia donde estés en ese momento (200% de su fuerza). Atraviesan cualquier estructura, llegan a toda la cueva y no salen de ella. **Si te dan 5 en una misma lluvia, te noquea.** Se esquivan rodando, y aturdirlo o salir de la zona la corta.
- **La Yarará Madre:** te persigue. Colazo en anillo alrededor suyo (marca un círculo rosado: rodá o alejate). Antes de escupir el abanico de veneno retrocede un poco y marca tres líneas (50% de envenenar; 15% contra Fede).
- **El Chupasangre:** *Embestida sangrienta* (línea roja; si te alcanza te agarra 1,7 s, te chupa la sangre tres veces y se cura 4% de su vida por mordida), *Manotazo* (dos golpes rápidos de corto alcance) e *Invocación* (se aleja y llama a cinco murciélagos).
- **El Gólem Minero:** cuatro vidas, de piedra, hierro, oro y diamante; cada una tiene más vida y fuerza y se rearma con una animación del material. *Terremoto*: cuatro golpes al piso, cada uno avisado con un anillo naranja 0,9 s antes, con mucho daño en área. *Piedrazo*: aturde 3 s. *Refuerzo*: invencible 5 s cada 15 s, y al instante al bajar del 30% de vida (una vez por vida).
- **El Rey Mago:** casi siempre se **teletransporta** lejos tuyo antes de atacar (mientras se esfuma no se le puede pegar). *Bolas de fuego*: cinco en estrella, 130% de su fuerza, y queman. *Zona de curación*: un círculo verde donde se cura 150 de vida por segundo durante 10 s y que te lastima si entrás; **pegale para cortarla**. *Invocación*: cinco armaduras vivientes. *Sobrecarga*: se queda quieto 8 s, sin teletransportarse y sin protección, mientras un círculo marca el área (1,5 veces el terremoto del Gólem): es el momento de pegarle cuerpo a cuerpo. Después explota en hielo, 250% de su fuerza, y si te alcanza te **congela 5 s**: no podés moverte, atacar, rodar ni usar tu habilidad, y los enemigos te pueden seguir pegando. Se esquiva saliendo del círculo o rodando. *Láser reloj*: cuatro rayos que giran como aspas cada vez más rápido durante 5 s y terminan en una **onda expansiva de alcance infinito** que solo se esquiva **rodando** justo cuando te llega (180% de su fuerza). Suelta la Esfera mágica y la Llave del trono.
- **Cerbero:** *Mordida* que desangra (5 de vida por segundo durante 5 s, ignora la armadura). *Jugueteo*: salta, sigue tu posición y aterriza en el círculo rojo; si te alcanza vas a la mitad de velocidad 5 s. Mientras está en el aire no se le puede pegar. *Escarbar*: si en 3 s no le pegás, se cura entero.

### El Trono de Zak

En el altar del cementerio se deja **una ofrenda de cada jefe** (E). Si tenés varias del mismo tipo, toma una sola; las que dejás quedan guardadas aunque te vayas. Mientras Cerbero esté vivo, el altar está cerrado. Con las cinco, una escena muestra cómo las ofrendas suben, giran, chocan entre rayos y abren un **portal violeta**: tocalo para entrar a la dimensión de Zak. Al entrar, Zak te recibe con una escena («¿Y vos quién sos?»…) y recién después empieza la pelea. Cada visita gasta un juego completo de ofrendas.

Cualquier golpe de Zak se lleva el **52%** de tu vida máxima, sin importar la armadura: dos golpes alcanzan.

- **Espadazo:** tres golpes hacia adelante en un abanico de 60°.
- **Bumeranes de energía:** si estás lejos, levanta la espada, golpea el piso y lanza tres bumeranes violetas en abanico (marca tres líneas). Atraviesan paredes, van unos 300 píxeles y vuelven a su mano; pueden pegarte a la ida y a la vuelta. Cada uno se lleva el 31% de tu vida máxima.
- **Invocación:** dos esqueletos con espada y escudo y dos arqueros.
- **Invocación mayor:** trae a uno de los cinco jefes al azar, con el mismo nivel que tiene ese jefe en tu partida. Mientras siga en pie, Zak se sienta en el trono y se cura 3 por segundo (con el Gólem, hasta que pierda sus cuatro vidas). La repite entre 40 y 80 segundos después de que cae el invocado.
- **Tormenta de agonía:** durante 10 s caen rayos violetas alrededor tuyo; cada uno se marca antes de caer y **mata de un toque**. Mientras dura, **solo la piedra** le hace daño.
- **En su tercera vida** suma la **Ira del gobernante** (20 s en los que solo ves a tu alrededor, mientras sigue atacando) y el **Terremoto morado**: todo el mapa tiembla menos un círculo claro; si no estás adentro cuando clava la espada, perdés mucha vida.

**Escenas.** Durante las escenas no te podés mover ni atacar, los enemigos se quedan quietos y la cámara mira a Zak (o al altar). **E**, **Espacio**, **Enter** o tocar la pantalla completa el texto o pasa al siguiente diálogo.

Al vencerlo, Zak no muere: vuelve al trono, dice «Dejémoslo acá y volvé a tu dimensión, mortal.», golpea dos veces el piso y abre un portal a la aldea. **Tenés 40 segundos para cruzarlo.** Si no, dice «¿Sabés lo que le pasa al que no sigue mis órdenes? Muere...» y, en una escena, cierra el portal, se levanta del trono y te ejecuta: perdés toda la guita, los materiales y las ofrendas; las armas y herramientas se quedan. El mensaje de la derrota es «Eso por querer hacerle el poronga...».

## Personajes

| Personaje | Vida | Fuerza | Velocidad | Resistencia | Inteligencia |
| --- | ---: | ---: | ---: | ---: | ---: |
| Gero | 105 | 5 | 15 | 15 | 5 |
| Paco | 100 | 6 | 15 | 20 | 10 |
| Fede | 90 | 4 | 30 | 5 | 15 |
| Pepe | 100 | 6 | 15 | 15 | 15 |
| Tena | 100 | 2 | 20 | 5 | 5 |
| Dante | 110 | 8 | 5 | 20 | 15 |
| Mer | 85 | 5 | 30 | 20 | 10 |

- **Gero — Fé Judía:** recupera 5 de vida por segundo y gana 25 de velocidad durante 5 segundos. Si con el bono supera 100 de velocidad, salta a la banda Extraordinaria. Las ratas lo ignoran hasta que las golpea. Su experiencia parte de ×0,75.
- **Paco — Afecto animal:** encanta animales cercanos durante 10 segundos; se apartan y le dan 2 de fuerza por animal. En los Yuyos sus estadísticas aumentan 15%. La resistencia le rinde 10% menos para correr.
- **Fede — Último aliento, pasiva:** con 30% de vida o menos gana 15% de velocidad y resistencia. Las serpientes tienen solo 15% de probabilidad de envenenarlo. La resistencia le rinde 20% menos para correr.
- **Pepe — DeboraMundos, pasiva:** derrotar un enemigo recupera 5 de vida y da 15% de velocidad por 3 segundos. Gana 50% más de experiencia. Los perros le hacen 10% más de daño y lo ralentizan 20%.
- **Tena — Baile del 7-0:** aturde a los enemigos cercanos durante 7 segundos. Las ratas huyen de él. Con tres o más perseguidores pierde 10% de todas las estadísticas salvo vida.
- **Dante — Tobi:** golpea el suelo tres veces con un enorme bastón de carne; cada onda inflige 10 de daño a los enemigos cercanos. Gana 1 de fuerza automática por nivel además del punto a elección. Se mueve 10% más lento.
- **Mer — Madre tierra:** invoca 3 espíritus del bosque durante 7 segundos. La siguen y les pegan 2 veces por segundo a los enemigos que estén a 150 píxeles o menos de ella, con el 150% de su daño (el de su arma, contando armadura del enemigo y bloqueos). Cada espíritu toma un enemigo distinto mientras alcancen. Son inmortales: los enemigos no los ven ni los pueden atacar. Las serpientes la ignoran hasta que ella o sus espíritus las golpean. Las quemaduras le hacen 50% más de daño.

**Nombre y apariencia:** la lista de habilidades nombra a Pepe y la descripción física nombra a Martín. Para mantener los seis personajes, Pepe usa el disfraz de pollo atribuido a Martín.

Las habilidades activas tienen enfriamiento: Gero **25 s**, Paco **30 s**, Tena **26 s**, Dante **28 s** y Mer **45 s**. Las habilidades de Fede y Pepe se activan automáticamente al cumplir su condición. Las bonificaciones temporales se calculan sobre los valores base: no se acumulan de forma permanente.

## Estadísticas y progresión

**Ninguna estadística del personaje tiene tope**: vida, fuerza, velocidad, resistencia, inteligencia y nivel pueden crecer sin límite. La velocidad rinde cada vez menos pasado 100 y la resistencia deja de alargar la carrera en 80 (ver sus tablas).

**Veteranía.** Desde el nivel 8, los enemigos ganan vida y fuerza extra por nivel; tu personaje crece al mismo ritmo para que el juego nunca se vuelva imposible:

- Tu **daño** se multiplica por `1 + 0,04 × (nivel − 8)`, lo mismo que la vida extra de los enemigos.
- Tu **vida máxima** se multiplica por `1 + 0,005 × (nivel − 8)`, lo mismo que su fuerza extra.

En nivel 20 pegás ×1,48 y tenés ×1,06 de vida; en nivel 40, ×2,28 y ×1,16. La ficha (C) muestra tu veteranía.

**Poder de golpe.** La fuerza cuenta entera hasta 10; después rinde cada vez menos: `10 + 4 × (√(fuerza − 6) − 2)`. Con 20 de fuerza pegás como con 17; con 50, como con 28,5; con 100, como con 40,8. Todas las armas parten del poder de golpe. La ficha (C) lo muestra.

Cada nivel cuesta más que el anterior: `(100 + 50·n + 5·n²)` XP, con `n = nivel − 1`, y desde el nivel 50 además ×1,03 por nivel. El nivel 2 requiere **100 XP**, el 3 **155**, el 10 **955**, el 50 **14 555** y el 100 unas **237 000**. La experiencia sobrante se conserva, incluso si una recompensa permite subir varios niveles.

Los enemigos comunes suman un 6% de su experiencia base por nivel; los jefes, un 12%, y su base es mucho mayor (Capo 650, Yarará 600, Chupasangre 1100, Gólem 1500, Cerbero 2000, Zak 8000).

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

La resistencia es **solo la energía**: cuánto podés correr antes de agotarte. Ya no protege de los golpes; eso lo hace la [armadura](#armaduras).

| Resistencia efectiva | Carrera hasta agotarse |
| --- | ---: |
| Menor que 15 | 3 s |
| 15 a menos de 30 | 5 s |
| 30 a menos de 60 | 7 s |
| 60 a menos de 80 | 10 s |
| 80 o más | 12 s |

Paco corre el **90%** de lo que marca su banda; Fede, el **80%**.

### Armaduras

La armadura resta su valor a cada golpe, con un mínimo de **1 de daño por golpe**. El veneno, el desangrado, las quemaduras y los golpes de Zak la ignoran. Se fabrican en El Taller, **en orden**: cada una necesita la anterior y protege más.

| Armadura | Armadura | Costo |
| --- | ---: | --- |
| 🪵 Madera | 2 | 20 madera + 40 de guita |
| ⛓ Hierro | 4 | 20 hierro + 5 madera + 80 |
| 🟨 Oro | 6 | 20 oro + 5 hierro + 120 |
| 💎 Diamante | 9 | 20 diamante + 5 oro + 160 |
| 🔮 Piedra elemental | 13 | 3 Piedras Elementales + 10 diamante + 10 oro + 250 |

La que tenés puesta se ve en el personaje: hombreras y cinturón del color del material. El vino de la abuela suma 3 más mientras dura. Los enemigos no cambian: su armadura sigue saliendo de su resistencia.

## Enemigos

Casi todos comparten un radio de detección de **195 píxeles**. Tienen **el mismo nivel que tu personaje** y no corren ni gastan energía. Su vida final es un **20% más** que la de esta tabla. Desde el nivel 8, además, cada nivel les suma **4% de vida y 0,5% de fuerza** (`vida × (1 + 0,04 × (nivel − 8))`, `fuerza × (1 + 0,005 × (nivel − 8))`). El daño de los enemigos comunes es el **72%** de su fuerza final; el de los jefes, el **68%**. Así el final del juego sigue siendo exigente. La vida de los enemigos no tiene tope; fuerza, velocidad y resistencia sí (100 antes del extra).

| Enemigo | Vida | Fuerza | Velocidad | Resistencia | Aumento por nivel: V / F / Vel / R |
| --- | ---: | ---: | ---: | ---: | --- |
| Chorro | 100 | 5 | 15 | 10 | +1,5 / +0,5 / +1 / +1 |
| Perro | 60 | 3 | 30 | 20 | +0,75 / +0,25 / +1,5 / +1 |
| Serpiente | 35 | 5 | 25 | 5 | +0,5 / +1 / +1 / +0,25 |
| Rata | 10 | 1 | 40 | 0 | +0,25 / +0,4 / +1 / +0,25 |
| Murciélago | 40 | 6 | 45 | 15 | +1,5 / +0,5 / +1 / +0,5 |
| Araña | 35 | 6 | 26 | 35 | +0,5 / +0,4 / +0,5 / +1 |
| Gusano de tierra | 100 | 10 | 18 | 62 | +4 / +0,75 / +0,5 / +1 |
| Esqueleto con escudo | 100 | 18 | 8 | 35 | +1,5 / +1 / +0,2 / +1 |
| Esqueleto arquero | 1 | 18 | 30 | 0 | +0 / +1 / +0,5 / +0 |
| Mago | 90 | 18 | 14 | 20 | +2,5 / +1 / +0,3 / +0,8 |
| Armadura viviente | 420 | 30 | 5 | 75 | +12 / +1,4 / +0,1 / +1 |
| Libro volador | 32 | 14 | 40 | 5 | +1 / +0,8 / +0,5 / +0,3 |
| Duende ilusionista | 110 | 20 | 32 | 20 | +2 / +1 / +0,5 / +0,8 |
| Gárgola | 300 | 28 | 26 | 70 | +8 / +1,2 / +0,3 / +1 |
| Sombra de Zak | 160 | 24 | 30 | 30 | +3 / +1 / +0,4 / +0,8 |
| Mimic | 240 | 30 | 22 | 55 | +6 / +1,2 / +0,3 / +1 |

- Los **chorros** atacan con cuchillo y no retroceden al recibir golpes.
- Los **perros** reducen el movimiento un 15% durante 4 segundos; contra Pepe, un 20%.
- Las **serpientes** tienen 40% de probabilidad de envenenar, salvo el 15% contra Fede. El veneno causa 2 de daño por segundo durante 5 segundos; aumenta 1 por nivel de serpiente. Una nueva aplicación reinicia los 5 segundos.
- Las **ratas** se prenden del cuerpo por 3 segundos y luego saltan hacia atrás antes de intentar prenderse otra vez. Prendidas muerden al 60% de su fuerza y como mucho una vez cada 0,9 s.
- Los **murciélagos** (Cueva Profunda) vuelan en zigzag y muerden rápido.
- Las **arañas** (Cueva Profunda) tienen 15% de probabilidad de envenenar como las serpientes (5% contra Fede). Su caparazón absorbe 4 de daño por golpe.
- Los **gusanos de tierra** (Las Entrañas) esperan enterrados, salen cuando te acercás a unos 120 píxeles y absorben 6 de daño por golpe. Reaparecen a los 90 segundos. Para pelear cómodo en los niveles profundos conviene llevar armas mejoradas.
- Los **esqueletos con escudo** (cementerio) son lentos, pegan fuerte y tienen 15% de probabilidad de bloquear cada golpe.
- Los **esqueletos arqueros** (cementerio) te ven desde 260 píxeles, disparan flechas cada 1,7 s y se alejan si te acercás. Sus flechas pegan un **75% más** que su fuerza (también por encima del tope de 100). Se rompen de un golpe.
- Los **magos** (Pueblo Mágico) se quedan quietos **2 s conjurando** (un anillo naranja se va llenando) y tiran una **bola de fuego** que pega un 50% más que su fuerza y **quema**. Caminan algo lento y siempre buscan distancia.
- Las **armaduras vivientes** (Pueblo Mágico) tienen mucha vida y armadura, caminan muy despacio y tardan en pegar: levantan la espada 1,1 s (círculo rojo) y **giran**, golpeando todo a su alrededor con el 150% de su fuerza.
- Los **libros voladores** (Biblioteca) andan de a cuatro: te rodean volando y se tiran en picada a picarte. Tienen poca vida.
- Los **duendes ilusionistas** (Biblioteca) se dividen en tres y saltan de costado cuando te acercás. Dos son **copias** idénticas: pegan la mitad, se deshacen de un golpe y no dan nada. Las copias desaparecen con el duende real, y cada 14 s se vuelve a dividir.
- Las **gárgolas** (Patio) parecen estatuas: mientras son de piedra no les entra ningún golpe. Se despiertan si pasás a menos de 90 píxeles o si les pegás; vuelan, apuntan 0,6 s (línea roja) y se tiran en picada con el 140% de su fuerza. Si te alejás, vuelven a su pedestal y se hacen piedra otra vez, con la vida llena.
- Las **sombras de Zak** (Patio) atraviesan las paredes y **copian tu último ataque** con 0,55 s de demora: si pegás cuerpo a cuerpo, te devuelven un zarpazo; si tirás con arco o piedra, te tiran un proyectil de sombra. Si no atacás, igual cada tanto te tantean.
- Los **mimics** salen de algunas carpas del Pueblo Mágico. Son lentos, muerden fuerte (130% de su fuerza), te frenan 2 s y sueltan buena guita.

Los ataques empujan a perros, serpientes y ratas; las ratas prendidas deben terminar su agarre. Los aumentos propios de vida de cada enemigo se aplican según la tabla, sin sumarles los 2 de vida automáticos del jugador. El daño de veneno también respeta el límite de fuerza de 100.

## Armas

| Arma | Dónde | Funcionamiento |
| --- | --- | --- |
| Puños | Desde el comienzo | Daño igual a fuerza, corto alcance; golpea en un área recta |
| Espada | Yuyos | Fuerza ×1,5, mismo alcance que los puños; golpea en abanico |
| Arco | Aldea | Proyectil de largo alcance; necesita 0,7 s de carga y respeta el intervalo de ataque |
| Piedra | Cueva | Proyectil con la mitad del alcance del arco; caminar 2 s recarga la munición. Es lo único que lastima a Zak durante la Tormenta de agonía |
| Espada Elemental | El Taller | Fuerza ×4,5, el mayor alcance cuerpo a cuerpo; golpea en abanico; se forja con 5 Piedras Elementales y materiales |

Se interpretó «aumenta el daño en un ×0,5» como **50% adicional**, por lo que la espada multiplica por **1,5**.

## Desarrollo y pruebas

Implementado con **HTML, CSS y JavaScript**, sin paquetes externos. El mundo se dibuja en Canvas 2D con gráficos pixel art creados por código; no requiere imágenes, tipografías ni sonidos descargados.

- `src/data.js`: personajes, enemigos, jefes, artículos del almacén y reglas puras de estadísticas, experiencia y mejoras.
- `src/world.js`: mapa, biomas, objetos y colisiones.
- `src/npcs.js`: vecinos y animales: dónde andan, cómo se ven y qué dicen.
- `src/pixel.js`: herramientas de pixel art: dibujo sin suavizado, contornos y destellos de sprites, fuente de píxeles propia, luces con tramado y ruido para el terreno.
- `src/render.js`: sprites, terreno, cámara y efectos visuales.
- `src/game.js`: simulación, movimiento, combate, esquiva, combos, monedas, tienda, jefes y habilidades.
- `src/items.js`: consumibles, amuletos, pedidos de los vecinos, pesca y las tiendas del Gaucho, Don Chiche y el Mercader del Vacío.
- `src/realm.js`: Patio de las Gárgolas, Biblioteca del Rey Mago y Feria de las Almas; sus enemigos, las runas, las carpas y las fogatas.
- `src/bosses.js`: el Chupasangre, el Gólem Minero, Cerbero y Zak; altar de ofrendas, portales e invocaciones.
- `src/ui.js`: menús, HUD, tienda, ranking, guardados y controles táctiles.
- `src/ranking.js` y `src/config.js`: ranking local u online (Supabase).
- `src/cloud.js`: cuentas y partidas en la nube (Supabase).
- `tests/rules.test.js`: 41 pruebas de reglas y casos límite.

Si ya tenés Node instalado:

```sh
node tests/rules.test.js
```

Abrí `tests/index.html` para ejecutar las 41 pruebas de reglas y las 143 pruebas de integración del motor en el navegador. El resultado detalla cada caso aprobado o fallido.

También se incluyen 47 pruebas de interfaz y de pixel art, 18 del ranking (con un servidor simulado) 36 de controles táctiles y 42 de la nube (también con un servidor simulado) con Chrome y Python 3, sin librerías adicionales. El verificador abre un perfil temporal aislado; nunca usa tus guardados personales:

```sh
python tests/browser_check.py tests/index.html --script tests/engine.test.js
python tests/browser_check.py index.html --script tests/ui.test.js
python tests/browser_check.py index.html --script tests/ranking.test.js
python tests/browser_check.py index.html --script tests/cloud.test.js
python tests/browser_check.py index.html --touch --width 844 --height 390 --script tests/touch.test.js
python tests/browser_check.py index.html --screenshot .screenshots/menu.png
```

El verificador está preparado para la ubicación estándar de Chrome en Windows. El juego también funciona en otros sistemas con un navegador moderno.
