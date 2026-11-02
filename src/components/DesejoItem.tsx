import type { Desejo } from "../types";

type Props = {
  desejo: Desejo;
  ocupado: boolean;
  aoAlternar: (d: Desejo) => void;
  aoExcluir: (d: Desejo) => void;
};

export default function DesejoItem({ desejo, ocupado, aoAlternar, aoExcluir }: Props) {
  return (
    <li className={desejo.completed ? "desejo-feito" : "desejo"}>
      <label>
        <input
          type="checkbox"
          checked={desejo.completed}
          disabled={ocupado}
          onChange={() => aoAlternar(desejo)}
        />
        <span>{desejo.todo}</span>
      </label>
      <button
        type="button"
        disabled={ocupado}
        onClick={() => aoExcluir(desejo)}
        aria-label={`Excluir ${desejo.todo}`}
      >
        Excluir
      </button>
    </li>
  );
}
