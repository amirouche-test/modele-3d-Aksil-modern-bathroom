import ModelViewer from "./ModelViewer";

export default function Page() {
  return (
    <main style={{ padding: "1rem" }}>
      <h1 className="mb-2">Visualiseur du modèle 3d</h1>
      <ModelViewer />
    </main>
  );
}
