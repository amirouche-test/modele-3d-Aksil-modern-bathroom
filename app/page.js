"use client";

import { useEffect } from "react";
import ModelViewer from "./ModelViewer";

export default function Page() {

  useEffect(() => {
    function detectOS() {
      const ua = navigator.userAgent || navigator.vendor || window.opera;
    
      if (/windows phone/i.test(ua)) return "Windows Phone";
      if (/windows/i.test(ua)) return "Windows";
      if (/android/i.test(ua)) return "Android";
      if (/iPad|iPhone|iPod/.test(ua) && !window.MSStream) return "iOS";
      if (/Mac/i.test(ua)) return "Mac OS";
      if (/Linux/i.test(ua)) return "Linux";
    
      return navigator.platform || "Unknown";
    }
    
    // Envoi à l'API
    fetch("/api/visites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ os: detectOS() }),
    });

  }, []);

  return (
    <main style={{ padding: "1rem" }}>
      <h1 className="mb-2">Visualiseur du modèle 3d</h1>
      <ModelViewer />
    </main>
  );
}
