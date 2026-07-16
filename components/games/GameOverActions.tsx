import Link from 'next/link';

type GameOverActionsProps = {
  gameId: string;
  onRestart: () => void;
};

export default function GameOverActions({
  gameId,
  onRestart,
}: GameOverActionsProps) {
  return (
    <div className="actions">
      <button type="button" className="btn" onClick={onRestart}>
        JUGAR DE NUEVO
      </button>
      <Link href={`/games/${gameId}`} className="btn ghost">
        VER PUNTUACIONES
      </Link>
      <Link href="/games" className="btn magenta">
        VOLVER AL VAULT
      </Link>
    </div>
  );
}
