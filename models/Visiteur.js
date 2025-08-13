// models/Visiteur.js
import mongoose from "mongoose";

const VisiteurSchema = new mongoose.Schema(
  {
    os: {
      type: String,
      required: true,
    },
  },
  { timestamps: true } // ajoute createdAt et updatedAt automatiquement
);

const Visiteur = mongoose.models.Visiteur || mongoose.model("Visiteur", VisiteurSchema);

export default Visiteur;
