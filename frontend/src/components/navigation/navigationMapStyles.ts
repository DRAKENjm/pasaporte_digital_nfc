/**
 * Estilos visuales de alto detalle para Google Maps
 * Reproduce fielmente el mapa de navegación Turn-by-Turn de Google Maps:
 * - Trazado nítido de avenidas, calles y autopistas
 * - Huellas y contornos de edificios y centros comerciales (Mall, estadios)
 * - Nombres de calles legibles en alto contraste con contorno oscuro
 * - Iconos visibles de puntos de interés (Grifos, bancos, comercios, paraderos)
 * - Escudos de ruta vial (como el 1N de la Panamericana)
 */
export const navigationNightMapStyles: google.maps.MapTypeStyle[] = [
  // Fondo base del mapa
  { elementType: "geometry", stylers: [{ color: "#192634" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#0f1722", weight: 3 }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#e2e8f0" }] },

  // Huella de manzanas urbanas y edificaciones (Mall Aventura, manzanas)
  {
    featureType: "landscape.man_made",
    elementType: "geometry.fill",
    stylers: [{ color: "#1c2b3a" }],
  },
  {
    featureType: "landscape.man_made",
    elementType: "geometry.stroke",
    stylers: [{ color: "#25384b", weight: 1 }],
  },
  {
    featureType: "landscape.natural",
    elementType: "geometry",
    stylers: [{ color: "#162330" }],
  },

  // Áreas verdes y parques
  {
    featureType: "poi.park",
    elementType: "geometry.fill",
    stylers: [{ color: "#133a3a" }],
  },
  {
    featureType: "poi.park",
    elementType: "labels.text.fill",
    stylers: [{ color: "#5eead4" }],
  },

  // Puntos de interés (Grifos, Malls, Clínicas, etc.) con iconos activos
  {
    featureType: "poi",
    elementType: "geometry",
    stylers: [{ color: "#182633" }],
  },
  {
    featureType: "poi",
    elementType: "labels.icon",
    stylers: [{ visibility: "on" }],
  },
  {
    featureType: "poi",
    elementType: "labels.text.fill",
    stylers: [{ color: "#94a3b8" }],
  },

  // Red de carreteras - Autopistas y vías rápidas (ej. Panamericana Norte 1N)
  {
    featureType: "road.highway",
    elementType: "geometry.fill",
    stylers: [{ color: "#36516b" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry.stroke",
    stylers: [{ color: "#223547", weight: 1.5 }],
  },
  {
    featureType: "road.highway",
    elementType: "labels.icon",
    stylers: [{ visibility: "on" }],
  },
  {
    featureType: "road.highway",
    elementType: "labels.text.fill",
    stylers: [{ color: "#ffffff" }],
  },
  {
    featureType: "road.highway",
    elementType: "labels.text.stroke",
    stylers: [{ color: "#0f1722", weight: 3.5 }],
  },

  // Vías arteriales y avenidas principales (ej. Av. Grau, Av. Balta, Av. Leguía)
  {
    featureType: "road.arterial",
    elementType: "geometry.fill",
    stylers: [{ color: "#2b4055" }],
  },
  {
    featureType: "road.arterial",
    elementType: "geometry.stroke",
    stylers: [{ color: "#1b2938", weight: 1 }],
  },
  {
    featureType: "road.arterial",
    elementType: "labels.text.fill",
    stylers: [{ color: "#f8fafc" }],
  },
  {
    featureType: "road.arterial",
    elementType: "labels.text.stroke",
    stylers: [{ color: "#0f1722", weight: 3 }],
  },

  // Calles locales y pasajes
  {
    featureType: "road.local",
    elementType: "geometry.fill",
    stylers: [{ color: "#223344" }],
  },
  {
    featureType: "road.local",
    elementType: "geometry.stroke",
    stylers: [{ color: "#182431", weight: 0.8 }],
  },
  {
    featureType: "road.local",
    elementType: "labels.text.fill",
    stylers: [{ color: "#cbd5e1" }],
  },

  // Transporte
  {
    featureType: "transit",
    elementType: "geometry",
    stylers: [{ color: "#1a2a3b" }],
  },
  {
    featureType: "transit",
    elementType: "labels.icon",
    stylers: [{ visibility: "on" }],
  },

  // Cuerpos de agua
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#0e1a26" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.fill",
    stylers: [{ color: "#38bdf8" }],
  },
];

/**
 * Filtro de zona muerta (Deadband) y suavizado exponencial de coordenadas
 * Elimina vibraciones de 1 a 3 metros producidas por el ruido natural del sensor GPS
 */
export function filterGpsJitter(
  current: { lat: number; lng: number } | null,
  incoming: { lat: number; lng: number },
  speed: number = 0,
  getDistanceKm: (lat1: number, lng1: number, lat2: number, lng2: number) => number
): { lat: number; lng: number } {
  if (!current) return incoming;

  const distMeters = getDistanceKm(current.lat, current.lng, incoming.lat, incoming.lng) * 1000;

  // Si el desplazamiento es menor a 2.5 metros y no hay velocidad evidente, es ruido de quieto (jitter)
  if (distMeters < 2.5 && speed < 0.8) {
    return current;
  }

  // Factor de suavizado pasa-bajas adaptativo (EMA)
  const factor = Math.min(0.65, Math.max(0.2, distMeters / 12));
  return {
    lat: current.lat + (incoming.lat - current.lat) * factor,
    lng: current.lng + (incoming.lng - current.lng) * factor,
  };
}

/**
 * Filtro de amortiguamiento angular para la brújula y orientación
 * Evita giros erráticos eliminando micro-vibraciones menores a 4 grados
 */
export function filterHeadingJitter(
  currentHeading: number | null,
  targetHeading: number
): number {
  if (currentHeading === null) return Math.round(targetHeading);

  // Distancia angular más corta (-180 a +180)
  const diff = ((targetHeading - currentHeading + 540) % 360) - 180;

  // Zona muerta de 3.5 grados: si el teléfono vibra un poco en la mano, no sacudir la UI
  if (Math.abs(diff) < 3.5) {
    return currentHeading;
  }

  // Interpolación suave del 22% por muestra
  const smoothed = (currentHeading + diff * 0.22 + 360) % 360;
  return Math.round(smoothed);
}
