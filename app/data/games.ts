export interface Game {
  id: string;
  title: string;
  short: string; // descripción corta (card)
  long: string; // descripción larga (detalle)
  cat: 'ARCADE' | 'PUZZLE' | 'SHOOTER';
  cover: string; // clase CSS de la portada, e.g. "cover-bricks"
  color: 'cyan' | 'magenta' | 'yellow' | 'green';
  best: number; // mejor puntuación global
  plays: string; // partidas jugadas, e.g. "12.4K"
}

export const GAMES: Game[] = [
  {
    id: 'brick-breaker',
    title: 'BRICK BREAKER',
    short: 'Rompe todos los ladrillos antes de perder tus 3 vidas.',
    long: 'Un clásico arcade de rebote: controla la paleta, desvía la bola y destruye cada fila de ladrillos neón. La velocidad aumenta a cada nivel superado, así que mantén el pulso firme.',
    cat: 'ARCADE',
    cover: 'cover-bricks',
    color: 'cyan',
    best: 48200,
    plays: '12.4K',
  },
  {
    id: 'tetro-blocks',
    title: 'TETRO BLOCKS',
    short: 'Encaja las piezas y despeja líneas antes de que se acumulen.',
    long: 'El puzzle de bloques que cae por excelencia. Gira, desliza y encaja las piezas para completar líneas horizontales. Sin líneas despejadas, la pila crece hasta el game over.',
    cat: 'PUZZLE',
    cover: 'cover-tetro',
    color: 'yellow',
    best: 132500,
    plays: '9.8K',
  },
  {
    id: 'neon-snake',
    title: 'NEON SNAKE',
    short: 'Crece sin chocar contigo mismo en una arena de luz.',
    long: 'Guía a la serpiente de neón a través de una grilla luminosa, recolecta fragmentos de energía y evita chocar contra tu propia cola mientras se alarga sin parar.',
    cat: 'ARCADE',
    cover: 'cover-snake',
    color: 'green',
    best: 8600,
    plays: '15.1K',
  },
  {
    id: 'star-invaders',
    title: 'STAR INVADERS',
    short: 'Repele las oleadas alienígenas antes de que aterricen.',
    long: 'Oleadas de invasores descienden en formación desde el espacio profundo. Muévete lateralmente, dispara con precisión y usa las coberturas antes de que la invasión llegue al suelo.',
    cat: 'SHOOTER',
    cover: 'cover-invaders',
    color: 'magenta',
    best: 67300,
    plays: '18.7K',
  },
  {
    id: 'maze-runner',
    title: 'MAZE RUNNER',
    short: 'Recolecta los tokens del laberinto esquivando a los cazadores.',
    long: 'Recorre un laberinto de corredores estrechos recolectando tokens de energía mientras evitas a los cazadores que patrullan cada esquina. Un power-up temporal invierte los papeles.',
    cat: 'PUZZLE',
    cover: 'cover-glot',
    color: 'cyan',
    best: 27400,
    plays: '11.2K',
  },
  {
    id: 'photon-pong',
    title: 'PHOTON PONG',
    short: 'Duelo de paletas a muerte súbita contra la CPU.',
    long: 'El duelo de paletas definitivo. Devuelve el fotón antes de que cruce tu línea, gana velocidad con cada intercambio y encadena puntos consecutivos para superar tu marca.',
    cat: 'ARCADE',
    cover: 'cover-duelo',
    color: 'magenta',
    best: 21,
    plays: '7.5K',
  },
];
