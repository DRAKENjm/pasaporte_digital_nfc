import { query } from "../config/database";

export interface ApiServiceConfig {
  id: number;
  servicio: string;
  nombre_visible: string;
  estado: "OPERATIVO" | "DEGRADADO" | "CONTINGENCIA";
  modo_contingencia: boolean;
  cuota_mensual_limite: number;
  consumo_actual: number;
  umbral_preventivo_porcentaje: number;
  umbral_prioritario_porcentaje: number;
  alerta_70_disparada: boolean;
  alerta_90_disparada: boolean;
  ultima_sincronizacion: string;
  notas?: string;
  porcentaje_consumo?: number;
}

export interface ApiIncident {
  id: number;
  servicio: string;
  tipo_evento: string;
  descripcion: string;
  detalles_tecnicos?: any;
  resuelto: boolean;
  fecha_registro: string;
  fecha_resolucion?: string;
}

export class ApiControlService {
  private static tablesInitialized = false;

  /**
   * Garantiza la existencia de las tablas de configuración e incidentes de APIs en PostgreSQL
   */
  public static async initTables(): Promise<void> {
    if (this.tablesInitialized) return;

    try {
      await query(`
        CREATE TABLE IF NOT EXISTS control_apis_config (
          id SERIAL PRIMARY KEY,
          servicio VARCHAR(50) NOT NULL UNIQUE,
          nombre_visible VARCHAR(100) NOT NULL,
          estado VARCHAR(20) DEFAULT 'OPERATIVO',
          modo_contingencia BOOLEAN DEFAULT FALSE,
          cuota_mensual_limite INT DEFAULT 28000,
          consumo_actual INT DEFAULT 0,
          umbral_preventivo_porcentaje INT DEFAULT 70,
          umbral_prioritario_porcentaje INT DEFAULT 90,
          alerta_70_disparada BOOLEAN DEFAULT FALSE,
          alerta_90_disparada BOOLEAN DEFAULT FALSE,
          ultima_sincronizacion TIMESTAMPTZ DEFAULT NOW(),
          notas TEXT
        );

        CREATE TABLE IF NOT EXISTS control_apis_incidentes (
          id SERIAL PRIMARY KEY,
          servicio VARCHAR(50) NOT NULL,
          tipo_evento VARCHAR(50) NOT NULL,
          descripcion TEXT NOT NULL,
          detalles_tecnicos JSONB,
          resuelto BOOLEAN DEFAULT FALSE,
          fecha_registro TIMESTAMPTZ DEFAULT NOW(),
          fecha_resolucion TIMESTAMPTZ
        );
      `);

      // Sembrar datos por defecto si la tabla está vacía
      const checkRes = await query("SELECT COUNT(*) AS total FROM control_apis_config");
      const total = parseInt(checkRes.rows[0]?.total || "0", 10);

      if (total === 0) {
        await query(`
          INSERT INTO control_apis_config (
            servicio, nombre_visible, estado, modo_contingencia, cuota_mensual_limite, consumo_actual,
            umbral_preventivo_porcentaje, umbral_prioritario_porcentaje, notas
          ) VALUES
          (
            'GOOGLE_MAPS',
            'Google Maps Platform (Rutas & Navegación)',
            'OPERATIVO',
            FALSE,
            28000,
            21840,
            70,
            90,
            'Monitoreo de Directions API, Maps JS y Geolocation. Crédito gratuito mensual de $200 USD.'
          ),
          (
            'RENDER',
            'Render Cloud (Servidor API Backend)',
            'OPERATIVO',
            FALSE,
            750,
            435,
            70,
            90,
            'Instancia Node.js / Express en Render. Horas de cómputo del plan gratuito.'
          ),
          (
            'SUPABASE',
            'Supabase (Base de Datos PostgreSQL)',
            'OPERATIVO',
            FALSE,
            500,
            145,
            70,
            90,
            'Almacenamiento de base de datos relacional y pool de conexiones.'
          );

          INSERT INTO control_apis_incidentes (
            servicio, tipo_evento, descripcion, resuelto, fecha_registro
          ) VALUES
          (
            'GOOGLE_MAPS',
            'ALERTA_70',
            'Aviso preventivo: El consumo mensual de Google Maps alcanzó el 78% de la cuota configurada.',
            FALSE,
            NOW() - INTERVAL '2 hours'
          );
        `);
      }

      this.tablesInitialized = true;
    } catch (err: any) {
      console.error("Error inicializando tablas de control_apis:", err.message);
    }
  }

  /**
   * Obtiene el resumen general de servicios, consumo, estado de contingencia e incidentes
   */
  public static async getOverview(): Promise<{
    servicios: ApiServiceConfig[];
    incidentes: ApiIncident[];
    estado_general: "OPERATIVO" | "ATENCION" | "CONTINGENCIA";
    alertas_activas: Array<{ nivel: "PREVENTIVO" | "PRIORITARIO" | "CRITICO"; servicio: string; mensaje: string }>;
    ultima_actualizacion: string;
  }> {
    await this.initTables();

    // Consultar servicios
    const serviciosRes = await query(`
      SELECT * FROM control_apis_config ORDER BY id ASC
    `);

    // Consultar últimos incidentes
    const incidentesRes = await query(`
      SELECT * FROM control_apis_incidentes ORDER BY fecha_registro DESC LIMIT 20
    `);

    const alertasActivas: Array<{ nivel: "PREVENTIVO" | "PRIORITARIO" | "CRITICO"; servicio: string; mensaje: string }> = [];

    const servicios: ApiServiceConfig[] = serviciosRes.rows.map((row) => {
      const cuota = row.cuota_mensual_limite || 1;
      const consumo = row.consumo_actual || 0;
      const pct = Math.min(100, Math.round((consumo / cuota) * 100));

      let estadoCalculado: "OPERATIVO" | "DEGRADADO" | "CONTINGENCIA" = row.modo_contingencia
        ? "CONTINGENCIA"
        : row.estado || "OPERATIVO";

      if (row.modo_contingencia) {
        alertasActivas.push({
          nivel: "CRITICO",
          servicio: row.nombre_visible,
          mensaje: "Modo contingencia activado: la navegación propia redirige amablemente a Google Maps externo.",
        });
      } else if (pct >= row.umbral_prioritario_porcentaje) {
        estadoCalculado = "DEGRADADO";
        alertasActivas.push({
          nivel: "PRIORITARIO",
          servicio: row.nombre_visible,
          mensaje: `Consumo prioritario (${pct}%): Se recomienda revisar facturación en Google Cloud antes de agotar la cuota.`,
        });
      } else if (pct >= row.umbral_preventivo_porcentaje) {
        alertasActivas.push({
          nivel: "PREVENTIVO",
          servicio: row.nombre_visible,
          mensaje: `Aviso preventivo (${pct}%): Consumo dentro del rango de advertencia (umbral ${row.umbral_preventivo_porcentaje}%).`,
        });
      }

      return {
        ...row,
        estado: estadoCalculado,
        porcentaje_consumo: pct,
      };
    });

    let estadoGeneral: "OPERATIVO" | "ATENCION" | "CONTINGENCIA" = "OPERATIVO";
    if (servicios.some((s) => s.modo_contingencia)) {
      estadoGeneral = "CONTINGENCIA";
    } else if (alertasActivas.some((a) => a.nivel === "PRIORITARIO")) {
      estadoGeneral = "ATENCION";
    }

    return {
      servicios,
      incidentes: incidentesRes.rows,
      estado_general: estadoGeneral,
      alertas_activas: alertasActivas,
      ultima_actualizacion: new Date().toISOString(),
    };
  }

  /**
   * Actualiza la configuración de cuota, umbrales o modo de contingencia de un servicio
   */
  public static async updateConfig(
    servicio: string,
    data: {
      cuota_mensual_limite?: number;
      consumo_actual?: number;
      umbral_preventivo_porcentaje?: number;
      umbral_prioritario_porcentaje?: number;
      modo_contingencia?: boolean;
      estado?: string;
      notas?: string;
    }
  ): Promise<ApiServiceConfig> {
    await this.initTables();

    // Obtener estado anterior para registrar cambios en incidentes
    const prevRes = await query("SELECT * FROM control_apis_config WHERE servicio = $1", [servicio]);
    const prev = prevRes.rows[0];

    const res = await query(
      `UPDATE control_apis_config SET
        cuota_mensual_limite = COALESCE($1, cuota_mensual_limite),
        consumo_actual = COALESCE($2, consumo_actual),
        umbral_preventivo_porcentaje = COALESCE($3, umbral_preventivo_porcentaje),
        umbral_prioritario_porcentaje = COALESCE($4, umbral_prioritario_porcentaje),
        modo_contingencia = COALESCE($5, modo_contingencia),
        estado = COALESCE($6, estado),
        notas = COALESCE($7, notas),
        ultima_sincronizacion = NOW()
      WHERE servicio = $8
      RETURNING *`,
      [
        data.cuota_mensual_limite,
        data.consumo_actual,
        data.umbral_preventivo_porcentaje,
        data.umbral_prioritario_porcentaje,
        data.modo_contingencia,
        data.estado,
        data.notas,
        servicio,
      ]
    );

    const updated = res.rows[0];

    // Registrar incidente si se activó o desactivó el modo contingencia
    if (prev && data.modo_contingencia !== undefined && prev.modo_contingencia !== data.modo_contingencia) {
      if (data.modo_contingencia) {
        await this.logIncident(
          servicio,
          "CONTINGENCIA_ACTIVADA",
          `El administrador activó manualmente el modo de contingencia para ${updated.nombre_visible}. Los clientes verán la alternativa para abrir en Google Maps.`
        );
      } else {
        await this.logIncident(
          servicio,
          "RECUPERACION",
          `Servicio restablecido: Se desactivó el modo de contingencia para ${updated.nombre_visible}. La navegación de RutaYa vuelve a estar operativa.`,
          { resuelto: true }
        );
      }
    }

    return updated;
  }

  /**
   * Registra un nuevo evento o incidente en el historial
   */
  public static async logIncident(
    servicio: string,
    tipoEvento: string,
    descripcion: string,
    options?: { detalles?: any; resuelto?: boolean }
  ): Promise<ApiIncident> {
    await this.initTables();

    const res = await query(
      `INSERT INTO control_apis_incidentes (
        servicio, tipo_evento, descripcion, detalles_tecnicos, resuelto, fecha_registro, fecha_resolucion
      ) VALUES ($1, $2, $3, $4, $5, NOW(), $6)
      RETURNING *`,
      [
        servicio,
        tipoEvento,
        descripcion,
        options?.detalles ? JSON.stringify(options.detalles) : null,
        options?.resuelto || false,
        options?.resuelto ? new Date().toISOString() : null,
      ]
    );

    return res.rows[0];
  }

  /**
   * Marca un incidente existente como resuelto
   */
  public static async resolveIncident(id: number): Promise<boolean> {
    await this.initTables();

    const res = await query(
      `UPDATE control_apis_incidentes SET
        resuelto = TRUE,
        fecha_resolucion = NOW()
      WHERE id = $1 RETURNING id`,
      [id]
    );

    return res.rowCount !== null && res.rowCount > 0;
  }

  /**
   * Estado de contingencia para clientes (endpoint público / sin autenticación admin)
   */
  public static async getClientContingencyStatus(): Promise<{
    contingencia_activa: boolean;
    servicio: string;
    mensaje_cliente?: string;
  }> {
    await this.initTables();

    const res = await query(
      "SELECT modo_contingencia, estado FROM control_apis_config WHERE servicio = 'GOOGLE_MAPS' LIMIT 1"
    );

    const isContingency = res.rows[0]?.modo_contingencia === true;

    return {
      contingencia_activa: isContingency,
      servicio: "GOOGLE_MAPS",
      mensaje_cliente: isContingency
        ? "En este momento no podemos ofrecerte la navegación desde RutaYa. Puedes abrir Google Maps para continuar tu viaje hasta el destino."
        : undefined,
    };
  }
}
