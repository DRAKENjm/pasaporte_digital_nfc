import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ override: true });

const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || "";
const defaultBucket = process.env.SUPABASE_BUCKET || "subidas";

export const supabase = (supabaseUrl && supabaseKey)
  ? createClient(supabaseUrl, supabaseKey)
  : null;

export const uploadToSupabase = async (
  fileBuffer: Buffer,
  filename: string,
  mimetype: string,
  folder: string = "fotos"
): Promise<{ url: string; path: string }> => {
  if (!supabase) {
    throw new Error("Supabase Storage no está configurado en .env (SUPABASE_URL / SUPABASE_KEY)");
  }

  const filePath = `${folder}/${filename}`;
  const bucketsToTry = [defaultBucket, "subidas", "uploads"].filter(
    (b, idx, arr) => arr.indexOf(b) === idx
  );

  let lastError: any = null;

  for (const targetBucket of bucketsToTry) {
    const { data, error } = await supabase.storage
      .from(targetBucket)
      .upload(filePath, fileBuffer, {
        contentType: mimetype,
        upsert: true,
      });

    if (!error) {
      const { data: publicData } = supabase.storage
        .from(targetBucket)
        .getPublicUrl(filePath);

      return {
        url: publicData.publicUrl,
        path: filePath,
      };
    }

    lastError = error;
    // Si el error no es de "Bucket not found", no tiene sentido reintentar con otro bucket
    if (!error.message?.toLowerCase().includes("not found")) {
      break;
    }
  }

  throw new Error(`Error al subir a Supabase Storage: ${lastError?.message || "Error desconocido"}`);
};

export const deleteFromSupabase = async (filePath: string): Promise<boolean> => {
  if (!supabase) return false;
  const { error } = await supabase.storage.from(defaultBucket).remove([filePath]);
  return !error;
};
