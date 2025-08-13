// app/api/visites/route.js

import dbConnect from "@/lib/mongodb";
import Visiteur from "@/models/Visiteur";

export async function POST(req) {
  try {
    await dbConnect();

    const body = await req.json();
    const { os } = body;

    if (os) {
      await Visiteur.create({ os });
    }
    return new Response(null, { status: 200 });
  } catch (error) {
    console.log(error);
  }
}