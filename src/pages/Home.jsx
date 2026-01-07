import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div style={{ padding: 20 }}>
      <h1>Plasencia Handball 2026</h1>

      <nav style={{ display: "flex", gap: 15, flexDirection: "column" }}>
        <Link to="/partidos">🏐 Partidos</Link>
        <button disabled>Grupos (pronto)</button>
        <button disabled>Clasificación (pronto)</button>
      </nav>
    </div>
  );
}
