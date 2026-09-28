import {
  Award,
  BookOpen,
  Building2,
  Coffee,
  Dumbbell,
  Gift,
  Landmark,
  Palette,
  Scissors,
  ShoppingBag,
  Star,
  Utensils,
  Wine,
  type LucideIcon,
} from "lucide-react";

export const STAMP_ICONS: { id: string; label: string; Icon: LucideIcon }[] = [
  { id: "icon:coffee", label: "Café", Icon: Coffee },
  { id: "icon:bakery", label: "Panadería", Icon: Gift },
  { id: "icon:restaurant", label: "Restaurante", Icon: Utensils },
  { id: "icon:bar", label: "Bar", Icon: Wine },
  { id: "icon:shop", label: "Tienda", Icon: ShoppingBag },
  { id: "icon:hotel", label: "Hospedaje", Icon: Building2 },
  { id: "icon:gym", label: "Gimnasio", Icon: Dumbbell },
  { id: "icon:barber", label: "Barbería", Icon: Scissors },
  { id: "icon:books", label: "Libros", Icon: BookOpen },
  { id: "icon:landmark", label: "Turismo", Icon: Landmark },
  { id: "icon:art", label: "Arte", Icon: Palette },
  { id: "icon:premium", label: "Premium", Icon: Award },
  { id: "icon:star", label: "Favorito", Icon: Star },
];

const stampIconMap = new Map(STAMP_ICONS.map((item) => [item.id, item.Icon]));

export const getStampIcon = (value?: string) =>
  value ? stampIconMap.get(value) : undefined;
