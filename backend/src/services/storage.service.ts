import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ override: true });

const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || "";
const bucketName = process.env.SUPABASE_BUCKET || "uploads";

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

  const { data, error } = await supabase.storage
    .from(bucketName)
    .upload(filePath, fileBuffer, {
      contentType: mimetype,
      upsert: true,
    });

  if (error) {
    throw new Error(`Error al subir a Supabase Storage: ${error.message}`);
  }

  const { data: publicData } = supabase.storage
    .from(bucketName)
    .getPublicUrl(filePath);

  return {
    url: publicData.publicUrl,
    path: filePath,
  };
};

export const deleteFromSupabase = async (filePath: string): Promise<boolean> => {
  if (!supabase) return false;
  const { error } = await supabase.storage.from(bucketName).remove([filePath]);
  return !error;
};
