/**
 * Generador de tarjeta visual tipo Pase de Fidelización para compartir en redes sociales y estados
 */

export type StampCardTheme = "dark" | "blush" | "heritage";

export interface StampShareData {
  nombreEstablecimiento: string;
  categoria?: string;
  sellosObtenidos: number;
  metaSellos: number;
  colorSello?: string;
  nombreSello?: string;
  imagenSello?: string;
  codigoCliente?: string;
  nombreUsuario?: string;
  nivelUsuario?: string;
  puntosDisponibles?: number;
  bonoMetaPuntos?: number;
  qrValue?: string;
  theme?: StampCardTheme;
}

interface ThemeConfig {
  bgOuter: string;
  cardBg: string;
  cardBorder: string;
  textPrimary: string;
  textSecondary: string;
  bannerBg: string;
  bannerBorder: string;
  bannerText: string;
  stampedBg: string;
  stampedBorder: string;
  stampedText: string;
  stampedIconColor: string;
  emptyBg: string;
  emptyBorder: string;
  emptyText: string;
  accent: string;
  stampCardBg: string;
  stampBorder: string;
  footerText: string;
  dotActive: string;
  dotInactive: string;
}

const THEMES: Record<StampCardTheme, ThemeConfig> = {
  // 1. Edición Noche (Carbón y Oro)
  dark: {
    bgOuter: "#09090B",
    cardBg: "#121216",
    cardBorder: "#27272E",
    textPrimary: "#FFFFFF",
    textSecondary: "#A1A1AA",
    bannerBg: "#1E1E26",
    bannerBorder: "#343440",
    bannerText: "#FFFFFF",
    stampedBg: "#F4F4F5",
    stampedBorder: "#FFFFFF",
    stampedText: "#18181B",
    stampedIconColor: "#18181B",
    emptyBg: "#16161D",
    emptyBorder: "#40404F",
    emptyText: "#A1A1AA",
    accent: "#F59E0B",
    stampCardBg: "#181820",
    stampBorder: "#343444",
    footerText: "#71717A",
    dotActive: "#FFFFFF",
    dotInactive: "#3F3F46",
  },

  // 2. Rosa Boutique (Rubí y Oro)
  blush: {
    bgOuter: "#FBF2F4",
    cardBg: "#FFF5F7",
    cardBorder: "#FCE7EC",
    textPrimary: "#4A0E17",
    textSecondary: "#9F1239",
    bannerBg: "#FFE4E8",
    bannerBorder: "#FECDD3",
    bannerText: "#881337",
    stampedBg: "#BE123C",
    stampedBorder: "#9F1239",
    stampedText: "#FFFFFF",
    stampedIconColor: "#FFFFFF",
    emptyBg: "#FFF5F7",
    emptyBorder: "#FDA4AF",
    emptyText: "#BE123C",
    accent: "#D97706",
    stampCardBg: "#FFFFFF",
    stampBorder: "#FECDD3",
    footerText: "#9F1239",
    dotActive: "#BE123C",
    dotInactive: "#FDA4AF",
  },

  // 3. Pasaporte Clásico (Crema y Borgoña Notarial)
  heritage: {
    bgOuter: "#F4EFEA",
    cardBg: "#FAF8F5",
    cardBorder: "#E5DACD",
    textPrimary: "#2D1A1E",
    textSecondary: "#7C0A1E",
    bannerBg: "#F3ECE4",
    bannerBorder: "#E2D7CA",
    bannerText: "#3B1E22",
    stampedBg: "#7C0A1E",
    stampedBorder: "#5B0615",
    stampedText: "#FFFFFF",
    stampedIconColor: "#FFFFFF",
    emptyBg: "#FAF8F5",
    emptyBorder: "#C5A059",
    emptyText: "#7C0A1E",
    accent: "#C5A059",
    stampCardBg: "#FFFFFF",
    stampBorder: "#E5DACD",
    footerText: "#8E7D7D",
    dotActive: "#7C0A1E",
    dotInactive: "#D5C9BD",
  },
};

function drawRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.arcTo(x + width, y, x + width, y + radius, radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.arcTo(x + width, y + height, x + width - radius, y + height, radius);
  ctx.lineTo(x + radius, y + height);
  ctx.arcTo(x, y + height, x, y + height - radius, radius);
  ctx.lineTo(x, y + radius);
  ctx.arcTo(x, y, x + radius, y, radius);
  ctx.closePath();
}

function drawStar(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  spikes: number,
  outerRadius: number,
  innerRadius: number,
  color: string
) {
  let rot = (Math.PI / 2) * 3;
  let x = cx;
  let y = cy;
  const step = Math.PI / spikes;

  ctx.beginPath();
  ctx.moveTo(cx, cy - outerRadius);
  for (let i = 0; i < spikes; i++) {
    x = cx + Math.cos(rot) * outerRadius;
    y = cy + Math.sin(rot) * outerRadius;
    ctx.lineTo(x, y);
    rot += step;

    x = cx + Math.cos(rot) * innerRadius;
    y = cy + Math.sin(rot) * innerRadius;
    ctx.lineTo(x, y);
    rot += step;
  }
  ctx.lineTo(cx, cy - outerRadius);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}

/**
 * Carga una imagen de forma asíncrona
 */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Error cargando imagen: ${src}`));
    img.src = src;
  });
}

/**
 * Genera la tarjeta visual optimizada para compartir en redes sociales y estados
 */
export async function generatePassportCardBlob(
  data: StampShareData,
  themeKey: StampCardTheme = "dark"
): Promise<Blob> {
  const canvas = document.createElement("canvas");
  const width = 1080;
  const height = 1540;
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No se pudo obtener el contexto 2D");

  const theme = THEMES[themeKey] || THEMES.dark;

  // 1. Fondo exterior general
  ctx.fillStyle = theme.bgOuter;
  ctx.fillRect(0, 0, width, height);

  // 2. Tarjeta principal (Mobile Card Container)
  const cardX = 48;
  const cardY = 48;
  const cardW = width - 96;
  const cardH = height - 96;
  const cardR = 48;

  ctx.save();
  ctx.shadowColor = "rgba(0, 0, 0, 0.28)";
  ctx.shadowBlur = 36;
  ctx.shadowOffsetY = 16;
  ctx.fillStyle = theme.cardBg;
  drawRoundRect(ctx, cardX, cardY, cardW, cardH, cardR);
  ctx.fill();
  ctx.restore();

  ctx.strokeStyle = theme.cardBorder;
  ctx.lineWidth = 2.5;
  drawRoundRect(ctx, cardX, cardY, cardW, cardH, cardR);
  ctx.stroke();

  // 3. Encabezado de la Tarjeta (Solo el Nombre del Local centrado, sin monograma roto ni balance de puntos)
  const headY = cardY + 68;

  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillStyle = theme.textPrimary;
  const brandLen = data.nombreEstablecimiento.length;
  if (brandLen > 30) {
    ctx.font = "900 32px 'Inter', sans-serif";
  } else if (brandLen > 22) {
    ctx.font = "900 38px 'Inter', sans-serif";
  } else {
    ctx.font = "900 48px 'Inter', sans-serif";
  }
  ctx.fillText(data.nombreEstablecimiento, cardX + cardW / 2, headY);

  ctx.fillStyle = theme.accent;
  ctx.font = "bold 16px 'Inter', sans-serif";
  ctx.letterSpacing = "4px";
  ctx.fillText("PASAPORTE DIGITAL OFICIAL", cardX + cardW / 2, headY + 56);
  ctx.letterSpacing = "0px";

  // Línea decorativa delgada bajo la cabecera
  const lineW = 320;
  ctx.strokeStyle = theme.bannerBorder;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cardX + (cardW - lineW) / 2, headY + 90);
  ctx.lineTo(cardX + (cardW + lineW) / 2, headY + 90);
  ctx.stroke();

  // 4. Banner contenedor de Sellos (Cartilla Digital más espaciosa y alta)
  const bannerX = cardX + 40;
  const bannerY = cardY + 185;
  const bannerW = cardW - 80;
  const bannerH = 450;
  const bannerR = 32;

  ctx.fillStyle = theme.bannerBg;
  drawRoundRect(ctx, bannerX, bannerY, bannerW, bannerH, bannerR);
  ctx.fill();

  ctx.strokeStyle = theme.bannerBorder;
  ctx.lineWidth = 2.5;
  drawRoundRect(ctx, bannerX, bannerY, bannerW, bannerH, bannerR);
  ctx.stroke();

  const meta = Math.max(1, Math.min(28, data.metaSellos || 5));
  const obtenidos = Math.min(meta, Math.max(0, data.sellosObtenidos || 0));

  // Título y subtítulo del banner en negrita y más grandes
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillStyle = theme.bannerText;
  ctx.font = "900 24px 'Inter', sans-serif";
  const nombreSelloTxt = (data.nombreSello || "CARTILLA DE SELLOS Y VISITAS").toUpperCase();
  ctx.fillText(nombreSelloTxt, bannerX + bannerW / 2, bannerY + 28);

  ctx.fillStyle = theme.textSecondary;
  ctx.font = "bold 15.5px 'Inter', sans-serif";
  if (obtenidos > 0) {
    ctx.fillText(`Llevas ${obtenidos} de ${meta} sellos • Cada visita suma a tu recompensa`, bannerX + bannerW / 2, bannerY + 62);
  } else {
    ctx.fillText("¡Visita el local con tu credencial NFC para conseguir tu primer sello!", bannerX + bannerW / 2, bannerY + 62);
  }

  // 5. Cuadrícula de Sellos Circulares (Círculos más grandes para mayor visibilidad)
  let cols = meta <= 5 ? meta : meta <= 8 ? 4 : meta <= 10 ? 5 : 6;
  if (cols < 3) cols = meta;
  const rows = Math.ceil(meta / cols);

  const gridAreaTop = bannerY + 104;
  const gridAreaHeight = bannerH - 124;
  const slotW = bannerW / (cols + 0.4);

  // Círculos más grandes y destacados
  const slotRadius = Math.min(46, Math.max(34, Math.floor(slotW * 0.43)));

  for (let i = 0; i < meta; i++) {
    const colIdx = i % cols;
    const rowIdx = Math.floor(i / cols);

    const itemsInThisRow = Math.min(cols, meta - rowIdx * cols);
    const rowWidth = itemsInThisRow * slotW;
    const startX = bannerX + (bannerW - rowWidth) / 2 + slotW / 2;
    const cx = startX + colIdx * slotW;

    const rowSpacing = gridAreaHeight / (rows + 1);
    const cy = gridAreaTop + (rowIdx + 1) * rowSpacing;

    const isStamped = i < obtenidos;
    const isGoal = i === meta - 1;

    ctx.beginPath();
    ctx.arc(cx, cy, slotRadius, 0, Math.PI * 2);

    if (isStamped) {
      // Sello Obtenido: Fondo pleno con doble borde y checkmark
      ctx.fillStyle = theme.stampedBg;
      ctx.fill();

      ctx.strokeStyle = theme.stampedBorder;
      ctx.lineWidth = 3.5;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(cx, cy, slotRadius - 7, 0, Math.PI * 2);
      ctx.strokeStyle = theme.stampedIconColor;
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = theme.stampedText;
      ctx.font = "900 28px 'Inter', sans-serif";
      ctx.fillText(`✓`, cx, cy);
    } else {
      // Sello Pendiente: Anillo punteado más visible y número
      ctx.fillStyle = theme.emptyBg;
      ctx.fill();

      ctx.strokeStyle = theme.emptyBorder;
      ctx.lineWidth = 2.5;
      ctx.setLineDash([6, 5]);
      ctx.stroke();
      ctx.setLineDash([]);

      if (isGoal) {
        // Hito final de recompensa con estrella dorada
        drawStar(ctx, cx, cy, 5, slotRadius * 0.46, slotRadius * 0.23, theme.accent);
      } else {
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = theme.emptyText;
        ctx.font = "900 21px 'Inter', sans-serif";
        ctx.fillText(`#${i + 1}`, cx, cy);
      }
    }
  }

  // 6. Barra de Métricas en español
  const metricY = bannerY + bannerH + 28;

  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillStyle = theme.textPrimary;
  ctx.font = "900 25px 'Inter', sans-serif";
  if (obtenidos > 0) {
    ctx.fillText(`${obtenidos} de ${meta} sellos`, bannerX + 16, metricY);
    ctx.fillStyle = theme.textSecondary;
    ctx.font = "bold 13.5px 'Inter', sans-serif";
    ctx.fillText("PROGRESO DE CARTILLA", bannerX + 16, metricY + 34);
  } else {
    ctx.fillText(`Meta: ${meta} sellos`, bannerX + 16, metricY);
    ctx.fillStyle = theme.textSecondary;
    ctx.font = "bold 13.5px 'Inter', sans-serif";
    ctx.fillText("POR DESCUBRIR", bannerX + 16, metricY + 34);
  }

  ctx.textAlign = "right";
  ctx.textBaseline = "top";
  ctx.fillStyle = theme.accent;
  ctx.font = "900 25px 'Inter', sans-serif";
  const bono = data.bonoMetaPuntos || 50;
  ctx.fillText(`+${bono} pts`, bannerX + bannerW - 16, metricY);

  ctx.fillStyle = theme.textSecondary;
  ctx.font = "bold 13.5px 'Inter', sans-serif";
  ctx.fillText("BONIFICACIÓN POR META", bannerX + bannerW - 16, metricY + 34);

  // 7. SELLO OFICIAL DEL LOCAL (Sello Notarial Auténtico con el nombre y diseño del local)
  const stampBoxW = 440;
  const stampBoxH = 390;
  const stampBoxX = cardX + (cardW - stampBoxW) / 2;
  const stampBoxY = metricY + 84;

  ctx.save();
  ctx.shadowColor = "rgba(0, 0, 0, 0.14)";
  ctx.shadowBlur = 24;
  ctx.shadowOffsetY = 8;
  ctx.fillStyle = theme.stampCardBg;
  drawRoundRect(ctx, stampBoxX, stampBoxY, stampBoxW, stampBoxH, 32);
  ctx.fill();
  ctx.restore();

  ctx.strokeStyle = theme.stampBorder;
  ctx.lineWidth = 2.5;
  drawRoundRect(ctx, stampBoxX, stampBoxY, stampBoxW, stampBoxH, 32);
  ctx.stroke();

  // SELLO CIRCULAR NOTARIAL DEL LOCAL
  const stampCenterX = stampBoxX + stampBoxW / 2;
  const stampCenterY = stampBoxY + stampBoxH / 2;
  const stampRadius = 150;
  const stampInk = data.colorSello || (themeKey === "dark" ? "#F59E0B" : themeKey === "blush" ? "#BE123C" : "#7C0A1E");

  ctx.save();
  ctx.translate(stampCenterX, stampCenterY);
  ctx.rotate(-0.04); // Leve inclinación realista de estampado manual

  // 7.1 Anillo exterior grueso
  ctx.strokeStyle = stampInk;
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.arc(0, 0, stampRadius, 0, Math.PI * 2);
  ctx.stroke();

  // 7.2 Anillo punteado de seguridad
  ctx.lineWidth = 2.5;
  ctx.setLineDash([8, 6]);
  ctx.beginPath();
  ctx.arc(0, 0, stampRadius - 12, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  // 7.3 Anillo interior fino
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(0, 0, stampRadius - 25, 0, Math.PI * 2);
  ctx.stroke();

  // 7.4 Inscripción superior
  ctx.textAlign = "center";
  ctx.fillStyle = stampInk;
  ctx.font = "bold 15px 'Inter', sans-serif";
  ctx.letterSpacing = "3px";
  ctx.fillText("★ SELLO OFICIAL DE VISITA ★", 0, -stampRadius + 46);
  ctx.letterSpacing = "0px";

  // 7.5 Centro del Sello: Nombre del Local y Sello
  let imageDrawn = false;
  if (data.imagenSello && (data.imagenSello.startsWith("http") || data.imagenSello.startsWith("/"))) {
    try {
      const img = await loadImage(data.imagenSello);
      const imgSize = 78;
      ctx.save();
      ctx.beginPath();
      ctx.arc(0, -10, imgSize / 2, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(img, -imgSize / 2, -10 - imgSize / 2, imgSize, imgSize);
      ctx.restore();
      imageDrawn = true;
    } catch {
      imageDrawn = false;
    }
  }

  if (!imageDrawn) {
    // Si no hay imagen externa, dibujamos el nombre del local de forma nítida y destacada
    ctx.font = "900 24px 'Inter', sans-serif";
    const localNombreMax = data.nombreEstablecimiento.length > 18
      ? `${data.nombreEstablecimiento.slice(0, 18)}...`
      : data.nombreEstablecimiento;
    ctx.fillText(localNombreMax.toUpperCase(), 0, -8);
  }

  // Nombre del sello o categoría
  ctx.font = "bold 16px 'Inter', sans-serif";
  const selloTexto = (data.nombreSello || data.categoria || "SELLO DE FIDELIZACIÓN").toUpperCase();
  const selloTrunc = selloTexto.length > 20 ? `${selloTexto.slice(0, 20)}...` : selloTexto;
  ctx.fillText(selloTrunc, 0, imageDrawn ? 42 : 26);

  // Estrellas decorativas laterales
  drawStar(ctx, -68, imageDrawn ? 40 : 24, 5, 8, 4, stampInk);
  drawStar(ctx, 68, imageDrawn ? 40 : 24, 5, 8, 4, stampInk);

  // 7.6 Inscripción inferior
  ctx.font = "bold 13.5px 'Inter', sans-serif";
  ctx.letterSpacing = "2px";
  ctx.fillText("REGISTRO CERTIFICADO", 0, stampRadius - 40);
  ctx.letterSpacing = "0px";

  ctx.restore();

  // 8. Pie de la Tarjeta en español (Sin el redundante "Pasaporte Digital Oficial", usando el espacio con elegancia)
  const footerY = stampBoxY + stampBoxH + 28;

  ctx.textAlign = "center";
  ctx.textBaseline = "top";

  const codigo = data.codigoCliente ? `CREDENCIAL: ${data.codigoCliente}` : "CREDENCIAL DIGITAL VERIFICADA";
  ctx.fillStyle = theme.textSecondary;
  ctx.font = "bold 13.5px 'Courier New', monospace";
  ctx.fillText(codigo, width / 2, footerY);

  const fechaHoy = new Date().toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).toUpperCase();
  ctx.fillStyle = theme.footerText;
  ctx.font = "600 12.5px 'Inter', sans-serif";
  ctx.fillText(`EMISIÓN OFICIAL • ${fechaHoy}`, width / 2, footerY + 22);

  // 9. Puntos de paginación del diseño
  const dotsY = cardY + cardH - 34;
  const dotCount = 5;
  const activeDot = themeKey === "dark" ? 0 : themeKey === "blush" ? 1 : 2;
  const dotGap = 16;
  const startDotsX = width / 2 - ((dotCount - 1) * dotGap) / 2;

  for (let d = 0; d < dotCount; d++) {
    const dx = startDotsX + d * dotGap;
    ctx.beginPath();
    ctx.arc(dx, dotsY, d === activeDot ? 4.5 : 3, 0, Math.PI * 2);
    ctx.fillStyle = d === activeDot ? theme.dotActive : theme.dotInactive;
    ctx.fill();
  }

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Error al convertir canvas a blob"));
    }, "image/png");
  });
}

/**
 * Función que ejecuta el diálogo nativo de compartir a cualquier red o aplicación (WhatsApp, Estados, Instagram, etc.)
 */
export async function sharePassportCard(
  data: StampShareData,
  themeKey: StampCardTheme = "dark"
): Promise<{ shared: boolean; blob: Blob; url: string }> {
  const blob = await generatePassportCardBlob(data, themeKey);
  const fileName = `tarjeta-pasaporte-${data.nombreEstablecimiento.replace(/\s+/g, "-").toLowerCase()}.png`;
  const file = new File([blob], fileName, { type: "image/png" });
  const url = URL.createObjectURL(blob);

  const currentOrigin = typeof window !== "undefined" ? window.location.origin : "";
  const shareText = data.sellosObtenidos > 0
    ? `¡Mira mi progreso en ${data.nombreEstablecimiento}! Llevo ${data.sellosObtenidos} de ${data.metaSellos} sellos acumulados en mi Pasaporte Digital.${
        currentOrigin ? `\n\nColecciona tus sellos aquí: ${currentOrigin}` : ""
      }`
    : `¡Descubre ${data.nombreEstablecimiento}! Visita lugares increíbles, acumula sellos oficiales y gana premios con tu Pasaporte Digital.${
        currentOrigin ? `\n\nComienza tu colección aquí: ${currentOrigin}` : ""
      }`;

  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({
        title: `Mi Tarjeta Digital - ${data.nombreEstablecimiento}`,
        text: shareText,
        files: [file],
      });
      return { shared: true, blob, url };
    } catch {
      return { shared: false, blob, url };
    }
  }

  // Fallback: Descarga directa
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  return { shared: true, blob, url };
}
