/**
 * Generador de tarjeta visual tipo Pasaporte para compartir en WhatsApp y redes sociales
 */

export interface StampShareData {
  nombreEstablecimiento: string;
  categoria?: string;
  sellosObtenidos: number;
  metaSellos: number;
  colorSello?: string;
  nombreSello?: string;
  codigoCliente?: string;
  nombreUsuario?: string;
  nivelUsuario?: string;
}

export async function generatePassportCardBlob(data: StampShareData): Promise<Blob> {
  const canvas = document.createElement("canvas");
  const width = 1080;
  const height = 1350; // Formato vertical óptimo 4:5 para WhatsApp / Instagram
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No se pudo obtener el contexto 2D");

  // 1. Fondo elegante crema pasaporte con textura sutil
  ctx.fillStyle = "#FAF8F5";
  ctx.fillRect(0, 0, width, height);

  // 2. Marco decorativo dorado y burdeos
  ctx.strokeStyle = "#C5A059";
  ctx.lineWidth = 14;
  ctx.strokeRect(36, 36, width - 72, height - 72);

  ctx.strokeStyle = "#7C0A1E";
  ctx.lineWidth = 4;
  ctx.strokeRect(56, 56, width - 112, height - 112);

  // Esquinas ornamentales
  const cornerSize = 40;
  ctx.fillStyle = "#C5A059";
  // Top-left
  ctx.fillRect(56, 56, cornerSize, 6);
  ctx.fillRect(56, 56, 6, cornerSize);
  // Top-right
  ctx.fillRect(width - 56 - cornerSize, 56, cornerSize, 6);
  ctx.fillRect(width - 56 - 6, 56, 6, cornerSize);
  // Bottom-left
  ctx.fillRect(56, height - 56 - 6, cornerSize, 6);
  ctx.fillRect(56, height - 56 - cornerSize, 6, cornerSize);
  // Bottom-right
  ctx.fillRect(width - 56 - cornerSize, height - 56 - 6, cornerSize, 6);
  ctx.fillRect(width - 56 - 6, height - 56 - cornerSize, 6, cornerSize);

  // 3. Encabezado Oficial
  ctx.textAlign = "center";
  ctx.fillStyle = "#7C0A1E";
  ctx.font = "bold 38px 'Cinzel', 'Times New Roman', serif";
  ctx.fillText("REPÚBLICA DEL PASAPORTE DIGITAL", width / 2, 140);

  ctx.fillStyle = "#C5A059";
  ctx.font = "bold 20px 'Inter', sans-serif";
  ctx.letterSpacing = "6px";
  ctx.fillText("★ REGISTRO OFICIAL DE VISITAS Y SELLOS ★", width / 2, 180);

  // Línea separadora
  ctx.strokeStyle = "#E5DACD";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(140, 210);
  ctx.lineTo(width - 140, 210);
  ctx.stroke();

  // 4. Tarjeta del Local / Establecimiento
  ctx.fillStyle = "#FFFFFF";
  ctx.shadowColor = "rgba(124, 10, 30, 0.08)";
  ctx.shadowBlur = 24;
  ctx.shadowOffsetY = 8;
  ctx.beginPath();
  ctx.roundRect(100, 240, width - 200, 160, 24);
  ctx.fill();
  ctx.shadowColor = "transparent";

  ctx.strokeStyle = "#EFE7DE";
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = "#2D1A1E";
  ctx.font = "bold 44px 'Inter', sans-serif";
  ctx.fillText(data.nombreEstablecimiento, width / 2, 310);

  if (data.categoria) {
    ctx.fillStyle = "#8E7D7D";
    ctx.font = "600 22px 'Inter', sans-serif";
    ctx.fillText(`CATEGORÍA: ${data.categoria.toUpperCase()}`, width / 2, 355);
  }

  // 5. SELLO NOTARIAL CENTRAL (Estilo sello postal / tinta de pasaporte)
  const centerX = width / 2;
  const centerY = 620;
  const radius = 170;
  const inkColor = data.colorSello || "#7C0A1E";

  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.rotate(-0.06); // Leve inclinación realista de estampado manual

  // Círculo exterior dentado / doble anillo
  ctx.strokeStyle = inkColor;
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = inkColor;
  ctx.lineWidth = 3;
  ctx.setLineDash([8, 6]);
  ctx.beginPath();
  ctx.arc(0, 0, radius - 14, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  // Círculo interior
  ctx.beginPath();
  ctx.arc(0, 0, radius - 30, 0, Math.PI * 2);
  ctx.stroke();

  // Texto circular superior e inferior
  ctx.fillStyle = inkColor;
  ctx.font = "bold 22px 'Inter', sans-serif";
  ctx.fillText("PASAPORTE DIGITAL OFICIAL", 0, -radius + 60);

  // Centro del sello: Conteo y medalla
  ctx.font = "bold 76px 'Inter', sans-serif";
  ctx.fillText(`${data.sellosObtenidos}`, 0, 15);

  ctx.font = "bold 26px 'Inter', sans-serif";
  ctx.fillText(`DE ${data.metaSellos} SELLOS`, 0, 55);

  ctx.font = "600 18px 'Inter', sans-serif";
  ctx.fillText(data.nombreSello || "SELLO VERIFICADO", 0, 95);

  ctx.restore();

  // 6. Barra de Progreso Visual
  const barX = 140;
  const barY = 880;
  const barWidth = width - 280;
  const barHeight = 24;

  ctx.fillStyle = "#EFE7DE";
  ctx.beginPath();
  ctx.roundRect(barX, barY, barWidth, barHeight, 12);
  ctx.fill();

  const progress = Math.min(1, Math.max(0, data.sellosObtenidos / data.metaSellos));
  ctx.fillStyle = data.sellosObtenidos >= data.metaSellos ? "#059669" : "#7C0A1E";
  ctx.beginPath();
  ctx.roundRect(barX, barY, barWidth * progress, barHeight, 12);
  ctx.fill();

  ctx.fillStyle = "#2D1A1E";
  ctx.font = "bold 24px 'Inter', sans-serif";
  const porcentaje = Math.round(progress * 100);
  ctx.fillText(`${porcentaje}% Completado (${data.sellosObtenidos} de ${data.metaSellos} sellos requeridos)`, width / 2, barY + 60);

  // 7. Datos de Titular / Usuario
  const boxY = 980;
  ctx.fillStyle = "#FFFFFF";
  ctx.beginPath();
  ctx.roundRect(140, boxY, width - 280, 160, 20);
  ctx.fill();
  ctx.strokeStyle = "#EFE7DE";
  ctx.stroke();

  ctx.textAlign = "left";
  ctx.fillStyle = "#8E7D7D";
  ctx.font = "bold 18px 'Inter', sans-serif";
  ctx.fillText("TITULAR DEL PASAPORTE:", 170, boxY + 45);
  ctx.fillText("CÓDIGO DE VALIDACIÓN:", 170, boxY + 110);

  ctx.fillStyle = "#2D1A1E";
  ctx.font = "bold 24px 'Inter', sans-serif";
  ctx.fillText(data.nombreUsuario || "Explorador de Pasaporte", 170, boxY + 75);

  ctx.fillStyle = "#7C0A1E";
  ctx.font = "bold 24px 'Courier New', monospace";
  ctx.fillText(data.codigoCliente || `PD-${Date.now().toString().slice(-6)}`, 170, boxY + 135);

  // 8. Pie de página
  ctx.textAlign = "center";
  const now = new Date().toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  ctx.fillStyle = "#8E7D7D";
  ctx.font = "500 18px 'Inter', sans-serif";
  ctx.fillText(`Estampado y Verificado Digitalmente • ${now.toUpperCase()}`, width / 2, 1220);

  ctx.fillStyle = "#C5A059";
  ctx.font = "bold 16px 'Inter', sans-serif";
  ctx.fillText("www.pasaportedigital.pe", width / 2, 1250);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Error al convertir canvas a blob"));
    }, "image/png");
  });
}

/**
 * Función que ejecuta el flujo de compartir imagen nativa (WhatsApp / Instagram / Redes)
 * o descarga la tarjeta si el navegador no admite Web Share Files
 */
export async function sharePassportCard(data: StampShareData): Promise<{ shared: boolean; blob: Blob; url: string }> {
  const blob = await generatePassportCardBlob(data);
  const file = new File([blob], `pasaporte-${data.nombreEstablecimiento.replace(/\s+/g, "-").toLowerCase()}.png`, {
    type: "image/png",
  });
  const url = URL.createObjectURL(blob);

  const shareText = `¡Mira mi colección de sellos en ${data.nombreEstablecimiento}! Llevo ${data.sellosObtenidos}/${data.metaSellos} sellos en mi Pasaporte Digital.`;

  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({
        title: `Mi Pasaporte Digital - ${data.nombreEstablecimiento}`,
        text: shareText,
        files: [file],
      });
      return { shared: true, blob, url };
    } catch {
      // El usuario canceló el diálogo nativo
      return { shared: false, blob, url };
    }
  }

  // Fallback: Descarga directa de la imagen
  const link = document.createElement("a");
  link.href = url;
  link.download = `pasaporte-${data.nombreEstablecimiento.replace(/\s+/g, "-").toLowerCase()}.png`;
  link.click();
  return { shared: true, blob, url };
}
