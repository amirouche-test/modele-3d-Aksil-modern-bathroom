"use client";

import React, { useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { GLTFLoader } from "three-stdlib";

export default function ModelViewer() {
  const [modelData, setModelData] = useState(null);      // JSON avec chemins des modèles
  const [colorsData, setColorsData] = useState(null);    // JSON avec couleurs par variante
  const [baseModel, setBaseModel] = useState(null);      // modèle de base chargé
  const [models, setModels] = useState({});              // variantes chargées (obj motifs -> liste scènes)
  const [activeVariants, setActiveVariants] = useState({}); // variantes actives par motif
  const [openMotifs, setOpenMotifs] = useState({});      // état ouvert/fermé des motifs (accordéon)
  const [loadingModels, setLoadingModels] = useState(true); // loader pour le modèle complet

  useEffect(() => {
    async function loadJSONs() {
      // Charger les fichiers JSON
      const resModels = await fetch("/models.json");
      const modelsJSON = await resModels.json();

      const resColors = await fetch("/couleurs.json");
      const colorsJSON = await resColors.json();

      setModelData(modelsJSON);
      setColorsData(colorsJSON);
    }
    loadJSONs();
  }, []);

  useEffect(() => {
    if (!modelData) return;

    const loader = new GLTFLoader();

    async function loadModels() {
      setLoadingModels(true);

      // Charger modèle de base
      const base = await loader.loadAsync(modelData.base_model);
      setBaseModel(base.scene);

      // Charger variantes de tous les motifs
      const loaded = {};
      const actives = {};

      for (let i = 1; i <= 7; i++) {
        const motifKey = `motif-${i}`;
        loaded[motifKey] = [];

        for (let j = 1; j <= 10; j++) {
          const path = modelData[motifKey][j - 1] + ".glb"; // ajoute .glb à la fin
          const gltf = await loader.loadAsync(path);
          loaded[motifKey].push(gltf.scene);
        }

        // Variante initiale : par exemple, i-1 (motif-1 = variante 0, motif-2 variante 1 ...)
        actives[motifKey] = (i - 1) % 10;
      }

      setModels(loaded);
      setActiveVariants(actives);

      // Par défaut, ouvrir tous les motifs (optionnel)
      const openState = {};
      for (let i = 1; i <= 7; i++) openState[`motif-${i}`] = false; // tous fermés par défaut
      setOpenMotifs(openState);

      setLoadingModels(false); // Chargement complet terminé
    }
    loadModels();
  }, [modelData]);

  function changeVariant(motif, index) {
    setActiveVariants((prev) => ({ ...prev, [motif]: index }));
  }

  // Toggle ouverture/fermeture motif (accordéon)
  function toggleMotif(motif) {
    setOpenMotifs((prev) => ({
      ...prev,
      [motif]: !prev[motif],
    }));
  }

  if (!baseModel || !modelData || !colorsData)
    return (
      null
    );

  return (
    <div style={{ display: "flex", height: "90vh" }}>
      <div
        className="bg-gray-200 w-full"
        style={{ position: "relative" }}
      >
        {/* Loader superposé */}
        {loadingModels && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundColor: "rgba(0,0,0,0.85)",
              zIndex: 10,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              color: "#fff",
              fontSize: 20,
              fontWeight: "bold",
            }}
          >
            Loading 3D Model ...
          </div>
        )}

        <Canvas camera={{ position: [8, 5, 5], fov: 40 }}>
          <ambientLight intensity={4} />
          <directionalLight position={[5, 5, 10]} intensity={6} />
          <OrbitControls />

          {/* Modèle de base */}
          <primitive object={baseModel} />

          {/* Variantes actives */}
          {Object.keys(models).map((motif) => {
            const modelList = models[motif];
            const activeIndex = activeVariants[motif];
            if (!modelList || activeIndex === undefined) return null;

            const sceneClone = modelList[activeIndex]?.clone();
            return sceneClone ? <primitive key={motif} object={sceneClone} /> : null;
          })}
        </Canvas>
      </div>

      {/* Panneau des variantes avec accordéon */}
      <div
        style={{
          width: 250,
          padding: 10,
          overflowY: "auto",
          borderLeft: "1px solid #ddd",
          userSelect: "none",
        }}
      >
        {Object.keys(modelData)
          .filter((key) => key !== "base_model")
          .map((motif) => {
            const activeIndex = activeVariants[motif];
            const activeColor = colorsData ? colorsData[`variante-${activeIndex + 1}`] : "#999";

            return (
              <div key={motif} style={{ marginBottom: 20 }}>
                <h3
                  onClick={() => toggleMotif(motif)}
                  style={{
                    cursor: "pointer",
                    marginBottom: 8,
                    backgroundColor: "#eee",
                    padding: "6px 10px",
                    borderRadius: 4,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  {/* Cercle couleur active */}
                  <div
                    style={{
                      width: 16,
                      height: 16,
                      borderRadius: "50%",
                      backgroundColor: activeColor,
                      marginRight: 8,
                      border: "1px solid #444",
                      flexShrink: 0,
                    }}
                  />
                  {motif.toUpperCase()}
                  <span style={{ fontSize: 14 }}>{openMotifs[motif] ? "▲" : "▼"}</span>
                </h3>

                {/* Variantes - affichées seulement si ouvert */}
                {openMotifs[motif] && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {modelData[motif].map((_, idx) => {
                      const color = colorsData[`variante-${idx + 1}`] || "#999";
                      const isActive = activeVariants[motif] === idx;
                      return (
                        <div
                          key={idx}
                          onClick={() => changeVariant(motif, idx)}
                          title={`Variante ${idx + 1}`}
                          style={{
                            width: 24,
                            height: 24,
                            borderRadius: "50%",
                            backgroundColor: color,
                            border: isActive ? "3px solid #000" : "1px solid #ccc",
                            cursor: "pointer",
                            boxSizing: "border-box",
                            transition: "border-color 0.3s",
                          }}
                        />
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
      </div>
    </div>
  );
}
