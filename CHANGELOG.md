# Registro de cambios

Cada versión lista sus cambios agrupados por tipo:

- **Feature:** algo nuevo.
- **Change:** algo que ya existía y ahora funciona distinto.
- **Fix:** un error corregido.

## v1.5 — 2026-10-29

* Feature
    - **Recompensas del diario:** cada objetivo cumplido da guita, que se reclama en el diario (J) con «Reclamar» o «Reclamar todo». Los objetivos más difíciles pagan más: de 5 (arco, cueva, piedras, Yuyos) a 50 (llegar a Las Entrañas), 260 en total.
    - Las partidas que ya tenían objetivos cumplidos pueden reclamar sus recompensas: no se pierde nada.
    - El botón del diario muestra ◉ cuando hay recompensas sin cobrar, y el aviso de objetivo cumplido dice cuánto podés reclamar.
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
