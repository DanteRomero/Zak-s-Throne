# Balance de combate — versión 2

El problema estaba en la relación entre el daño del jugador y la vida y armadura enemigas. Por ejemplo, Tena empezaba con 2 de fuerza contra perros de 90 de vida y 2 de armadura: cada golpe hacía solamente 1 de daño. Además, los enemigos ganaban todas sus estadísticas y podían llegar a 500 de vida y 100 de fuerza, mientras que el jugador tenía que elegir una sola mejora.

## Personajes iniciales

| Personaje | Vida | Fuerza | Velocidad | Resistencia | Inteligencia | Carrera sostenida |
|---|---:|---:|---:|---:|---:|---:|
| Gero | 110 | 8 | 22 | 22 | 5 | 5 s |
| Paco | 115 | 9 | 22 | 28 | 10 | 4,5 s |
| Fede | 90 | 7 | 35 | 8 | 15 | 2,4 s |
| Pepe | 110 | 9 | 24 | 22 | 15 | 5 s |
| Tena | 115 | 6 | 30 | 45 | 10 | 7 s |
| Dante | 130 | 12 | 12 | 32 | 15 | 7 s |

Las duraciones incluyen las desventajas pulmonares de Paco y Fede y corresponden a estadísticas sin bonificaciones temporales ni de bioma. Tena conserva el menor daño, tiene la mayor resistencia inicial y camina más rápido que todos salvo Fede. Dante conserva el mayor daño, la mayor vida y el movimiento más lento. Fede sigue siendo el más rápido y se cansa primero.

El movimiento ahora mejora con cada punto de velocidad: `60 + 1,5 × velocidad` píxeles por segundo, antes de bonificaciones y penalizaciones. Así se distingue, por ejemplo, la velocidad 30 de Tena de la velocidad 35 de Fede. Las bandas de ataques continúan en 3, 2, 1 y 0,5 segundos; por encima de 100 por efectos temporales, 0,25 segundos. Correr continúa multiplicando el movimiento por 1,25.

## Progresión

Cada nivel concede **2 puntos de mejora**, **2 de vida máxima** y **1 de fuerza automática**. Dante gana **2 de fuerza automática**. Esto permite invertir en resistencia o inteligencia y seguir haciendo daño suficiente. Cada punto comprado aporta:

| Estadística | Mejora por punto | Límite permanente |
|---|---:|---:|
| Vida | +5 | 500 |
| Fuerza | +1 | 100 |
| Velocidad | +2 | 100 |
| Resistencia | +2 | 100 |
| Inteligencia | +1 | Sin límite |

La curva de experiencia permanece en 100, 150, 200… y se mantienen los modificadores de inteligencia, Gero y Pepe. Los efectos temporales de los nuevos consumibles pueden superar los topes de fuerza y velocidad mientras duran y no alteran las mejoras permanentes.

## Enemigos

Los enemigos suben un nivel cada **3 niveles ganados por el jugador**: tienen nivel 1 cuando el jugador está en 1–3, nivel 2 en 4–6, etcétera. Su crecimiento tiene topes propios para impedir que los niveles ilimitados del jugador produzcan enemigos invencibles.

| Enemigo | Vida inicial → máxima | Fuerza inicial → máxima | Velocidad inicial → máxima | Resistencia inicial → máxima |
|---|---:|---:|---:|---:|
| Chorro | 42 → 180 | 5 → 20 | 18 → 40 | 5 → 28 |
| Perro | 30 → 130 | 3 → 16 | 32 → 48 | 5 → 24 |
| Serpiente | 24 → 100 | 4 → 14 | 25 → 42 | 3 → 18 |
| Rata | 12 → 70 | 2 → 12 | 36 → 50 | 0 → 15 |

| Enemigo | Vida por nivel | Fuerza por nivel | Velocidad por nivel | Resistencia por nivel |
|---|---:|---:|---:|---:|
| Chorro | +2,8 | +0,32 | +0,35 | +0,4 |
| Perro | +1,8 | +0,28 | +0,2 | +0,35 |
| Serpiente | +1,2 | +0,22 | +0,25 | +0,2 |
| Rata | +0,8 | +0,2 | +0,22 | +0,15 |

El veneno de serpiente comienza en 2 por segundo, gana 0,1 por nivel enemigo y llega como máximo a 6 por segundo. Se conservan persecución, mordedura, ralentización, veneno, agarre de ratas y resistencia del chorro al empuje.

## Comparación de combate

Segundos necesarios para derrotar un enemigo de nivel 1 con puños, atacando siempre que termina la recarga, con el primer golpe en el segundo 0. Es una medición de daño y cadencia: no incluye tiempo para acercarse, esquivar, golpes fallidos, habilidades ni el miedo de Tena ante grupos.

| Personaje | Chorro antes | Chorro ahora | Perro antes | Perro ahora |
|---|---:|---:|---:|---:|
| Gero | 38 s | 10 s | 58 s | 6 s |
| Paco | 32 s | 8 s | 44 s | 6 s |
| Fede | 24 s | 5 s | 44 s | 4 s |
| Pepe | 32 s | 8 s | 44 s | 6 s |
| Tena | 98 s | 6 s | 178 s | 4 s |
| Dante | 36 s | 9 s | 42 s | 6 s |

Con el hacha, un chorro inicial requiere entre 2 y 4 golpes según el personaje. Su daño es ×2 y el tiempo entre golpes es ×1,35. El pico hace ×1,25 de daño y conserva la cadencia normal.

Se verificó también el escenario de invertir **cero puntos en fuerza y velocidad**: la fuerza automática alcanza para que un chorro requiera entre 4–7 golpes a nivel 1, 2–4 a nivel 10, 1–2 a nivel 50 y 2 a niveles 100 y 500. Los enemigos siguen creciendo hasta sus límites, pero dejan de convertir una partida avanzada en un bloqueo de progresión.

## Nuevos consumibles y fabricación

Los seis especiales duran 5 segundos. Reutilizarlos renueva su duración y los beneficios instantáneos correspondientes, sin sumar multiplicadores repetidos. La leche de Paco duplica únicamente su daño; no le aumenta la velocidad. El Capuchón aporta +4 de defensa y un escudo del 40% de vida máxima, que recibe el daño completo antes de la armadura. Los multiplicadores de movimiento de Puff, Puchito, arroz y caramelo se aplican al desplazamiento real, además de la estadística indicada.

El pico requiere llevar la piedra arrojadiza y gasta 8 de madera. La piedra arrojadiza se conserva. Fabricar una espada requiere un pico y gasta 4 de madera y 6 de metal. Las herramientas y armas fabricadas forman parte del equipo que puede perderse al quedar noqueado.

## Validación

`tests/rules.test.js` cubre los límites de estadísticas, experiencia, puntos, perfiles de personajes, escalado enemigo en niveles 1/10/50/100/500, cadencias, daño y efectos de estadísticas temporales. `tests/engine.test.js` verifica combate, conservación de proporciones de vida y migración de las partidas anteriores; `tests/survival.test.js` cubre recolección, mochilas y consumibles. Se ejecutan juntas al abrir `tests/index.html` en el navegador. Las instrucciones del verificador automático y de las pruebas de interfaz están en [README.md](../README.md#desarrollo-y-pruebas).

## Partidas anteriores

Las partidas de versión 1 se adaptan al cargarlas: se sustituyen las bases iniciales, se conservan las mejoras compradas y se convierten las antiguas inversiones en velocidad y resistencia al nuevo aumento de 2 por punto. Cada nivel ya ganado aporta la fuerza automática que faltaba y un punto de mejora adicional. Se conserva la proporción de vida tanto del personaje como de los enemigos. El nuevo guardado es versión 2 y no vuelve a aplicar estos aumentos al cargarlo.
