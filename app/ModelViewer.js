"use client";

import React, { useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { GLTFLoader } from "three-stdlib";

export default function ModelViewer() {
  const [modelData, setModelData] = useState(null);
  const [colorsData, setColorsData] = useState(null);
  const [baseModel, setBaseModel] = useState(null);
  const [models, setModels] = useState({});
  const [activeVariants, setActiveVariants] = useState({});
  const [openMotifs, setOpenMotifs] = useState({});
  const [loadingBase, setLoadingBase] = useState(true);
  const [loadingVariants, setLoadingVariants] = useState(true);
  const loader = new GLTFLoader();

  useEffect(() => {
    async function loadJSONs() {
      const resModels = await fetch("/models.json");
      const modelsJSON = await resModels.json();

      const resColors = await fetch("/couleurs.json");
      const colorsJSON = await resColors.json();

      setModelData(modelsJSON);
      setColorsData(colorsJSON);
    }
    loadJSONs();
  }, []);

  // Charger d'abord le modèle de base
  useEffect(() => {
    if (!modelData) return;
    async function loadBase() {
      const base = await loader.loadAsync(modelData.base_model);
      setBaseModel(base.scene);
      setLoadingBase(false);
    }
    loadBase();
  }, [modelData]);

  // Charger variantes ensuite en arrière-plan
  useEffect(() => {
    if (!modelData) return;

    async function loadVariants() {
      const loaded = {};
      const actives = {};

      for (let i = 1; i <= 7; i++) {
        const motifKey = `motif-${i}`;
        loaded[motifKey] = [];
        for (let j = 1; j <= 10; j++) {
          const path = modelData[motifKey][j - 1] + ".glb";
          const gltf = await loader.loadAsync(path);
          loaded[motifKey].push(gltf.scene);
        }
        actives[motifKey] = (i - 1) % 10;
      }

      setModels(loaded);
      setActiveVariants(actives);

      const openState = {};
      for (let i = 1; i <= 7; i++) openState[`motif-${i}`] = false;
      setOpenMotifs(openState);

      setLoadingVariants(false);
    }

    loadVariants();
  }, [modelData]);

  function changeVariant(motif, index) {
    setActiveVariants((prev) => ({ ...prev, [motif]: index }));
  }

  function toggleMotif(motif) {
    setOpenMotifs((prev) => ({
      ...prev,
      [motif]: !prev[motif],
    }));
  }

  return (
    <div style={{ display: "flex", height: "90vh" }}>
      <div className="bg-neutral-400 w-full" style={{ position: "relative" }}>
        {loadingBase && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 z-10 text-white">
            <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin" />
            <p className="mt-4 text-lg font-semibold">Chargement du modèle...</p>
          </div>
        )}

        <Canvas camera={{ position: [8, 5, 5], fov: 50 }}>
          <ambientLight intensity={4} />
          <directionalLight position={[5, 5, 10]} intensity={6} />
          <OrbitControls />
          {baseModel && <primitive object={baseModel} />}
          {!loadingVariants &&
            Object.keys(models).map((motif) => {
              const modelList = models[motif];
              const activeIndex = activeVariants[motif];
              if (!modelList || activeIndex === undefined) return null;
              const sceneClone = modelList[activeIndex]?.clone();
              return sceneClone ? <primitive key={motif} object={sceneClone} /> : null;
            })}
        </Canvas>
      </div>

      {/* Panneau latéral */}
      <div
        style={{
          width: 250,
          padding: 10,
          overflowY: "auto",
          borderLeft: "1px solid #ddd",
        }}
      >
        {loadingVariants ? (
          <div className="animate-pulse">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="h-6 bg-gray-300 rounded mb-4"></div>
            ))}
          </div>
        ) : (
          Object.keys(modelData)
            .filter((key) => key !== "base_model")
            .map((motif) => {
              const activeIndex = activeVariants[motif];
              const activeColor =
                colorsData[`variante-${activeIndex + 1}`] || "#999";

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
                    <span style={{ fontSize: 14 }}>
                      {openMotifs[motif] ? "▲" : "▼"}
                    </span>
                  </h3>

                  {openMotifs[motif] && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                      {modelData[motif].map((_, idx) => {
                        const color =
                          colorsData[`variante-${idx + 1}`] || "#999";
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
                              border: isActive
                                ? "3px solid #000"
                                : "1px solid #ccc",
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
            })
        )}
      </div>
    </div>
  );
}
