export function tintHex(hex: string, alpha = 0.16): string {
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return `rgba(142, 142, 147, ${alpha})`;
  const n = Number.parseInt(clean, 16);
  if (Number.isNaN(n)) return `rgba(142, 142, 147, ${alpha})`;
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

interface CategoryIconProps {
  icon: string;
  color: string;
  size?: number;
  selected?: boolean;
  alpha?: number;
}

export function CategoryIcon({
  icon,
  color,
  size = 36,
  selected = false,
  alpha,
}: CategoryIconProps) {
  const bgAlpha = alpha ?? (selected ? 0.28 : 0.16);
  const radius = Math.round(size * 0.28);
  const fontSize = Math.round(size * 0.52);

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        fontSize,
        backgroundColor: tintHex(color, bgAlpha),
        boxShadow: selected ? `0 0 0 2px ${color}` : undefined,
        display: 'grid',
        placeItems: 'center',
        flexShrink: 0,
      }}
      aria-hidden="true"
    >
      <span>{icon}</span>
    </div>
  );
}
