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

  // Charger fichiers JSON
  useEffect(() => {
    async function loadJSONs() {
      const [modelsRes, colorsRes] = await Promise.all([
        fetch("/models.json"),
        fetch("/couleurs.json"),
      ]);

      const [modelsJSON, colorsJSON] = await Promise.all([
        modelsRes.json(),
        colorsRes.json(),
      ]);

      setModelData(modelsJSON);
      setColorsData(colorsJSON);
    }
    loadJSONs();
  }, []);

  // Charger modèle de base
  useEffect(() => {
    if (!modelData) return;
    async function loadBase() {
      const base = await loader.loadAsync(modelData.base_model);
      setBaseModel(base.scene);
      setLoadingBase(false);
    }
    loadBase();
  }, [modelData]);

  // Charger variantes
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

      // État ouvert/fermé par défaut
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
    <div className="flex flex-col md:flex-row min-h-[90vh]">
      {/* Zone Canvas */}
      <div className="relative flex-1 bg-neutral-400">
        {loadingBase && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 z-10 text-white">
            <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin" />
            <p className="mt-4 text-lg font-semibold">
              Chargement du modèle...
            </p>
          </div>
        )}

        <Canvas camera={{ position: [8, 5, 5], fov: 50 }}>
          <ambientLight intensity={4} />
          <directionalLight position={[5, 5, 10]} intensity={6} />
          <OrbitControls />
          {baseModel && <primitive object={baseModel} />}
          {!loadingVariants &&
            Object.keys(models).map((motif) => {
              const activeIndex = activeVariants[motif];
              if (!models[motif] || activeIndex === undefined) return null;
              const sceneClone = models[motif][activeIndex]?.clone();
              return sceneClone ? (
                <primitive key={motif} object={sceneClone} />
              ) : null;
            })}
        </Canvas>
      </div>

      {/* Panneau latéral */}
      <div className="w-full md:w-64 p-3 overflow-y-auto border-t md:border-t-0 md:border-l border-gray-300 bg-white">
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
                <div key={motif} className="mb-5">
                  {/* Titre */}
                  <h3
                    onClick={() => toggleMotif(motif)}
                    className="cursor-pointer mb-2 bg-gray-200 hover:bg-gray-300 transition rounded px-3 py-1 flex justify-between items-center"
                  >
                    <div
                      className="w-4 h-4 rounded-full border border-gray-800 mr-2 flex-shrink-0"
                      style={{ backgroundColor: activeColor }}
                    />
                    <span className="flex-1">{motif.toUpperCase()}</span>
                    <span className="text-sm">
                      {openMotifs[motif] ? "▲" : "▼"}
                    </span>
                  </h3>

                  {/* Variantes */}
                  {openMotifs[motif] && (
                    <div className="flex flex-wrap gap-2">
                      {modelData[motif].map((_, idx) => {
                        const color =
                          colorsData[`variante-${idx + 1}`] || "#999";
                        const isActive = activeVariants[motif] === idx;
                        return (
                          <div
                            key={idx}
                            onClick={() => changeVariant(motif, idx)}
                            title={`Variante ${idx + 1}`}
                            className={`w-6 h-6 rounded-full border cursor-pointer transition 
                              ${
                                isActive
                                  ? "border-2 border-black"
                                  : "border border-gray-300"
                              }`}
                            style={{ backgroundColor: color }}
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
