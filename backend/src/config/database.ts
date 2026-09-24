import { Pool, QueryResult, QueryResultRow } from "pg";
import dotenv from "dotenv";

dotenv.config();

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// 1. Capturar errores inesperados en conexiones inactivas del pool
pool.on("error", (err) => {
  console.error(
    "❌ Error inesperado en un cliente inactivo de PostgreSQL:",
    err.message,
  );
});

export const query = async <T extends QueryResultRow = any>(
  text: string,
  params?: any[],
): Promise<QueryResult<T>> => {
  const start = Date.now();
  try {
    const res = await pool.query<T>(text, params);
    const duration = Date.now() - start;

    if (process.env.NODE_ENV === "development") {
      console.log("[DB Query]", {
        text: text.slice(0, 80),
        duration: `${duration}ms`,
        rows: res.rowCount ?? 0, // 2. Evitar null si es un comando estructural (ej. BEGIN)
      });
    }
    return res;
  } catch (error) {
    // Es útil registrar qué consulta falló exactamente
    console.error("[DB Query Error]", { text: text.slice(0, 80), error });
    throw error;
  }
};

export const checkDatabaseConnection = async (): Promise<boolean> => {
  try {
    await pool.query("SELECT 1");
    console.log("✅ Base de datos PostgreSQL conectada exitosamente.");
    return true;
  } catch (error) {
    console.error("❌ Error al conectar con PostgreSQL:", error);
    return false;
  }
};

// 3. Cierre limpio del pool cuando la aplicación se apaga (opcional pero recomendado)
const closePool = async () => {
  console.log("Cerrando el pool de conexiones de PostgreSQL...");
  await pool.end();
  console.log("Pool de PostgreSQL cerrado.");
};

process.on("SIGTERM", closePool);
process.on("SIGINT", closePool);
