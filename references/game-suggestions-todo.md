# Sugerencias de juegos — To-Do

> Mantenido por el agente `game-planner`. No editar manualmente sin avisar al agente.

## 🟡 Sugeridos (pendientes de decisión)

| ID               | Título         | Categoría   | Color   | Descripción breve                                                                               | Justificación                                                                                                                                                          | Fecha      |
| ---------------- | -------------- | ----------- | ------- | ----------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| `frogger`        | FROGGER        | MAZE        | lime    | Cruza la autopista y el río sin que nada te aplaste.                                            | Cubre categoría MAZE (aún no existe en el catálogo) y es 100% factible en canvas 2D con grid simple y colisiones AABB; arcade clásico de reconocimiento instantáneo.   | 2026-07-14 |
| `pong`           | PONG           | SPORTS      | orange  | Devuelve la pelota o pierde el punto contra la CPU.                                             | Cubre categoría SPORTS (aún no existe) con la implementación más simple posible en canvas (dos rectángulos + un círculo); es el arcade más reconocible de la historia. | 2026-07-14 |
| `pac-runner`     | PAC-RUNNER     | MAZE        | yellow  | Devora puntos por el laberinto mientras esquivas fantasmas.                                     | Refuerza MAZE con un clon ligero de Pac-Man; factible con grid-based movement y pathfinding simple para fantasmas, alto reconocimiento clásico.                        | 2026-07-14 |
| `space-blasters` | SPACE BLASTERS | SHOOTER     | red     | Elimina oleadas de invasores alienígenas antes de que lleguen a tu base.                        | Shooter de disparo fijo/formación (estilo Space Invaders/Galaga), distinto al movimiento libre de asteroids; factible con sprites simples y colisiones AABB en grid.   | 2026-07-14 |
| `jump-runner`    | JUMP RUNNER    | PLATFORMER  | teal    | Salta entre plataformas y esquiva barriles para rescatar a la princesa.                         | Introduce el género plataformero (estilo Donkey Kong), ausente del catálogo; factible con gravedad simple y colisiones por rectángulos.                                | 2026-07-14 |
| `turbo-drift`    | TURBO DRIFT    | RACING      | sky     | Esquiva el tráfico y cruza la meta antes de que se acabe el tiempo.                             | Carreras estilo Out Run/Road Fighter, género inexistente en el catálogo; factible como scroll vertical 2D con carriles fijos, sin motor 3D.                            | 2026-07-14 |
| `beat-grid`      | BEAT GRID      | RHYTHM      | violet  | Pulsa las flechas al ritmo de la música antes de que lleguen a la zona de acierto.              | Cubre el género rítmico (estilo DDR arcade), nuevo en el catálogo; notas en carriles verticales con detección de timing, solo requiere audio HTML5.                    | 2026-07-14 |
| `trivia-dash`    | TRIVIA DASH    | CARD        | amber   | Responde preguntas de cultura arcade contrarreloj para acumular la racha más alta.              | Género de mesa/trivia (estilo cabinas de trivia de los 90), diversifica lejos de la acción en tiempo real; el más simple de implementar, solo texto y temporizador.    | 2026-07-14 |
| `gem-columns`    | GEM COLUMNS    | PUZZLE      | purple  | Encaja trillizos de gemas que caen y hazlos desaparecer en cadenas de tres o más.               | Match-3 en caída (estilo Columns/Bejeweled), distinto al encaje de piezas de Tetris; grilla simple y lógica de coincidencias, ideal para canvas 2D.                    | 2026-07-14 |
| `silo-defense`   | SILO DEFENSE   | STRATEGY    | indigo  | Traza trayectorias de contraataque para interceptar misiles antes de que arrasen tus ciudades.  | Género nuevo (STRATEGY) con gestión de recursos limitados, inspirado en Missile Command; solo líneas, explosiones circulares y sprites simples.                        | 2026-07-14 |
| `lunar-lander`   | LUNAR LANDER   | SIMULATION  | sky     | Controla el empuje y el combustible para posar tu nave suavemente sobre la plataforma lunar.    | Simulación ligera con física de gravedad/combustible sin motor externo; arcade icónico (Atari 1979) instantáneamente reconocible.                                      | 2026-07-14 |
| `bomber-maze`    | BOMBER MAZE    | BOARD       | amber   | Coloca bombas para destruir muros y rivales sin quedar atrapado en tu propia explosión.         | Introduce BOARD con tablero de celdas fijas, estilo Bomberman; grid discreto y sprites cuadrados, muy factible sin física continua.                                    | 2026-07-14 |
| `tunnel-digger`  | TUNNEL DIGGER  | ADVENTURE   | teal    | Excava túneles bajo tierra e infla a tus enemigos con la bomba de aire hasta hacerlos estallar. | Adventure con exploración y modificación del entorno (estilo Dig Dug), ausente del catálogo; excavación como "borrado" de tiles, manejable en canvas 2D.               | 2026-07-14 |
| `centi-crawl`    | CENTI-CRAWL    | ARCADE      | violet  | Dispara al ciempiés que serpentea por el jardín de hongos antes de que te alcance.              | Disparo fijo vertical (estilo Centipede), muy distinto al bloque-y-paleta de Arkanoid o la serpiente de Snake; grid simple de hongos y segmentos.                      | 2026-07-14 |
| `pixel-duel`     | PIXEL DUEL     | FIGHTING    | rose    | Golpea, esquiva y noquea a tu rival en un duelo 1v1 de sprites pixelados.                       | Primer género de lucha del catálogo; sprites estáticos simples (idle/golpe/bloqueo) y máquina de estados básica, sin motor de físicas.                                 | 2026-07-14 |
| `arcade-hoops`   | ARCADE HOOPS   | SPORTS      | amber   | Encesta la mayor cantidad de canastas antes de que se acabe el tiempo.                          | Deportivo con mecánica distinta al ida-y-vuelta de Pong, estilo máquinas de baloncesto arcade; parábola simple y colisión contra el aro.                               | 2026-07-14 |
| `missile-siege`  | MISSILE SIEGE  | ACTION      | red     | Defiende tus ciudades interceptando misiles enemigos antes del impacto.                         | Acción/defensa ausente en el catálogo, estilo Missile Command; trazado de líneas y explosiones circulares, nativo de canvas 2D.                                        | 2026-07-14 |
| `cube-hopper`    | CUBE HOPPER    | MAZE        | teal    | Salta por una pirámide de cubos isométricos cambiando su color sin caer al vacío.               | Variante de laberinto radicalmente distinta a Frogger/Pac-Runner, estilo Q*bert; cubos con polígonos simples en proyección isométrica fija.                            | 2026-07-14 |
| `word-blitz`     | WORD BLITZ     | WORD        | rose    | Forma palabras arrastrando letras antes de que se acabe el tiempo.                              | Género basado en texto, totalmente ausente del catálogo; grilla de letras y detección de clics/arrastre, sin sprites complejos.                                        | 2026-07-14 |
| `lucky-slots`    | LUCKY SLOTS    | CASINO      | amber   | Gira los rodillos y alinea tres símbolos para ganar fichas.                                     | Mecánica de azar/casino ausente en el catálogo; animación de scroll vertical de sprites y lógica de RNG simple, sin física real.                                       | 2026-07-14 |
| `sky-dash`       | SKY DASH       | RUNNER      | sky     | Esquiva obstáculos y salta sin parar mientras el escenario se acelera.                          | Endless runner, muy distinto a shooters/puzzle/arcade existentes; scroll horizontal y colisiones tipo caja, patrón muy probado (Chrome Dino).                          | 2026-07-14 |
| `castle-guard`   | CASTLE GUARD   | DEFENSE     | emerald | Coloca torres a lo largo del camino para detener oleadas de invasores.                          | Tower defense, estrategia ausente del catálogo; pathfinding simple sobre ruta fija predefinida, sin motor de físicas.                                                  | 2026-07-14 |
| `mole-smash`     | MOLE SMASH     | SHOOT-EM-UP | violet  | Golpea a los topos antes de que vuelvan a esconderse en su madriguera.                          | Reflejos tipo Whack-a-mole, distinto a los shooters de naves ya implementados; grilla fija de agujeros y temporizadores de aparición.                                  | 2026-07-14 |

## 🟢 Aceptados / en desarrollo

| ID  | Título | Spec | Fecha aceptado |
| --- | ------ | ---- | -------------- |

## ✅ Implementados

| ID          | Título    | Categoría | Fecha |
| ----------- | --------- | --------- | ----- |
| `asteroids` | ASTEROIDS | SHOOTER   | —     |
| `tetris`    | TETRIS    | PUZZLE    | —     |
| `arkanoid`  | ARKANOID  | ARCADE    | —     |
| `snake`     | SNAKE     | ARCADE    | —     |

## ❌ Descartados

| ID  | Título | Motivo | Fecha |
| --- | ------ | ------ | ----- |
