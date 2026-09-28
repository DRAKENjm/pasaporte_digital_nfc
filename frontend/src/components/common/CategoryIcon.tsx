import React from "react";
import {
  Coffee,
  UtensilsCrossed,
  Wine,
  Croissant,
  Landmark,
  ShoppingBag,
  Scissors,
  Gamepad2,
  Hotel,
  Dumbbell,
  BookOpen,
  Palette,
  Music,
  Ticket,
  Sparkles,
  Compass,
  Camera,
  Tag,
  LucideIcon,
} from "lucide-react";

export interface ModernCategoryPreset {
  id: string;
  name: string;
  icon: LucideIcon;
  emoji: string;
  description: string;
}

export const MODERN_CATEGORY_PRESETS: ModernCategoryPreset[] = [
  {
    id: "coffee",
    name: "Cafeterías & Cafés",
    icon: Coffee,
    emoji: "☕",
    description: "Cafés de especialidad, cafeterías y repostería ligera",
  },
  {
    id: "utensils",
    name: "Restaurantes & Gastronomía",
    icon: UtensilsCrossed,
    emoji: "🍽️",
    description: "Restaurantes, gastronomía criolla, fusión e internacional",
  },
  {
    id: "martini",
    name: "Bares & Coctelería",
    icon: Wine,
    emoji: "🍸",
    description: "Coctelería de autor, gastrobares, cervecerías y pubs",
  },
  {
    id: "croissant",
    name: "Panaderías & Pastelerías",
    icon: Croissant,
    emoji: "🥐",
    description: "Panadería artesanal, dulces tradicionales y pastelería",
  },
  {
    id: "landmark",
    name: "Turismo, Monumentos & Cultura",
    icon: Landmark,
    emoji: "🏛️",
    description: "Catedrales, centros históricos, museos y atractivos turísticos",
  },
  {
    id: "shopping-bag",
    name: "Moda & Boutiques",
    icon: ShoppingBag,
    emoji: "🛍️",
    description: "Tiendas de ropa, accesorios, calzado y diseñadores locales",
  },
  {
    id: "scissors",
    name: "Belleza & Barberías",
    icon: Scissors,
    emoji: "✂️",
    description: "Barberías clásicas, salones de belleza, spas y cuidado personal",
  },
  {
    id: "gamepad",
    name: "Entretenimiento & Ocio",
    icon: Gamepad2,
    emoji: "🎮",
    description: "Arcades, bowling, centros de juegos y experiencias recreativas",
  },
  {
    id: "hotel",
    name: "Hoteles & Hospedaje",
    icon: Hotel,
    emoji: "🏨",
    description: "Hoteles boutique, resorts, hostales y alojamientos",
  },
  {
    id: "dumbbell",
    name: "Fitness & Bienestar",
    icon: Dumbbell,
    emoji: "🏋️",
    description: "Gimnasios, centros de yoga, pilates y entrenamiento",
  },
  {
    id: "book-open",
    name: "Librerías & Educación",
    icon: BookOpen,
    emoji: "📚",
    description: "Librerías, talleres culturales, galerías y bibliotecas",
  },
  {
    id: "palette",
    name: "Arte & Creatividad",
    icon: Palette,
    emoji: "🎨",
    description: "Estudios de arte, diseño, artesanías y talleres creativos",
  },
  {
    id: "music",
    name: "Música & Espectáculos",
    icon: Music,
    emoji: "🎵",
    description: "Locales de música en vivo, peñas y conciertos",
  },
  {
    id: "ticket",
    name: "Eventos & Experiencias",
    icon: Ticket,
    emoji: "🎟️",
    description: "Festivales, ferias, tours y eventos gastronómicos",
  },
  {
    id: "compass",
    name: "Aventura & Naturaleza",
    icon: Compass,
    emoji: "🧭",
    description: "Ecoturismo, playas, excursiones y rutas naturales",
  },
  {
    id: "sparkles",
    name: "Experiencias Exclusivas",
    icon: Sparkles,
    emoji: "✨",
    description: "Servicios VIP, degustaciones exclusivas y membresías",
  },
];

// Mapeo unificado de slugs y emojis comunes hacia componentes Lucide
const ICON_LOOKUP: Record<string, LucideIcon> = {
  // Slugs
  coffee: Coffee,
  cafe: Coffee,
  utensils: UtensilsCrossed,
  restaurant: UtensilsCrossed,
  martini: Wine,
  wine: Wine,
  bar: Wine,
  croissant: Croissant,
  bakery: Croissant,
  pasteleria: Croissant,
  cake: Croissant,
  landmark: Landmark,
  monument: Landmark,
  culture: Landmark,
  turismo: Landmark,
  "shopping-bag": ShoppingBag,
  boutique: ShoppingBag,
  moda: ShoppingBag,
  scissors: Scissors,
  barber: Scissors,
  belleza: Scissors,
  gamepad: Gamepad2,
  entertainment: Gamepad2,
  hotel: Hotel,
  hospedaje: Hotel,
  dumbbell: Dumbbell,
  gym: Dumbbell,
  fitness: Dumbbell,
  "book-open": BookOpen,
  books: BookOpen,
  palette: Palette,
  art: Palette,
  music: Music,
  ticket: Ticket,
  compass: Compass,
  camera: Camera,
  sparkles: Sparkles,

  // Emojis tradicionales mapeados a íconos vectoriales modernos
  "☕": Coffee,
  "🍔": UtensilsCrossed,
  "🍽️": UtensilsCrossed,
  "🍕": UtensilsCrossed,
  "🌮": UtensilsCrossed,
  "🍣": UtensilsCrossed,
  "🍹": Wine,
  "🍷": Wine,
  "🍸": Wine,
  "🍺": Wine,
  "🍰": Croissant,
  "🥐": Croissant,
  "🍞": Croissant,
  "🍦": Croissant,
  "🏛️": Landmark,
  "👗": ShoppingBag,
  "🛍️": ShoppingBag,
  "👟": ShoppingBag,
  "💈": Scissors,
  "✂️": Scissors,
  "💅": Scissors,
  "🎮": Gamepad2,
  "🏨": Hotel,
  "🏋️": Dumbbell,
  "📚": BookOpen,
  "🎨": Palette,
  "🎵": Music,
  "🎟️": Ticket,
  "🧭": Compass,
  "✨": Sparkles,
};

interface CategoryIconProps {
  icon?: string | null;
  className?: string;
  size?: number;
}

export const CategoryIcon: React.FC<CategoryIconProps> = ({
  icon,
  className = "w-4 h-4",
  size,
}) => {
  if (!icon) {
    return <Tag className={className} size={size} />;
  }

  const clean = icon.trim().toLowerCase();

  // 1. Si es un key o emoji con ícono vectorial moderno
  const MatchedIcon = ICON_LOOKUP[clean] || ICON_LOOKUP[icon.trim()];
  if (MatchedIcon) {
    return <MatchedIcon className={className} size={size} />;
  }

    // 2. Si es una URL o ruta de imagen
  if (
    clean.startsWith("http://") ||
    clean.startsWith("https://") ||
    clean.startsWith("/") ||
    clean.startsWith("uploads/") ||
    /.(jpg|jpeg|png|webp|svg|gif|avif)($|\?)/i.test(clean)
  ) {
    const src = clean.startsWith("uploads/") ? `/${clean}` : (clean.startsWith("/") || clean.startsWith("http") ? icon : `/uploads/${icon}`);
    return (
      <img
        src={src}
        alt="icono categoría"
        className={`${className} object-contain rounded-sm`}
      />
    );
  }

  // 3. Si es un emoji o texto corto no mapeado, mostrarlo nítido
  return <span className="inline-block leading-none select-none text-base">{icon}</span>;
};
