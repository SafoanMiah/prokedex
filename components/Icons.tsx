interface IconProps {
  className?: string;
}

export function IconDice({ className = "w-5 h-5" }: IconProps) {
  return (
    <svg
      viewBox="0 0 16 16"
      shapeRendering="crispEdges"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <rect x="1" y="1" width="14" height="2" />
      <rect x="1" y="13" width="14" height="2" />
      <rect x="1" y="1" width="2" height="14" />
      <rect x="13" y="1" width="2" height="14" />
      <rect x="4" y="4" width="2" height="2" />
      <rect x="10" y="4" width="2" height="2" />
      <rect x="7" y="7" width="2" height="2" />
      <rect x="4" y="10" width="2" height="2" />
      <rect x="10" y="10" width="2" height="2" />
    </svg>
  );
}

export function IconGear({ className = "w-5 h-5" }: IconProps) {
  return (
    <svg
      viewBox="0 0 16 16"
      shapeRendering="crispEdges"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <rect x="6" y="0" width="4" height="2" />
      <rect x="6" y="14" width="4" height="2" />
      <rect x="0" y="6" width="2" height="4" />
      <rect x="14" y="6" width="2" height="4" />
      <rect x="2" y="2" width="2" height="2" />
      <rect x="12" y="2" width="2" height="2" />
      <rect x="2" y="12" width="2" height="2" />
      <rect x="12" y="12" width="2" height="2" />
      <rect x="4" y="4" width="8" height="2" />
      <rect x="4" y="10" width="8" height="2" />
      <rect x="4" y="4" width="2" height="8" />
      <rect x="10" y="4" width="2" height="8" />
    </svg>
  );
}

export function IconLock({ className = "w-4 h-4" }: IconProps) {
  return (
    <svg
      viewBox="0 0 12 14"
      shapeRendering="crispEdges"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <rect x="3" y="0" width="6" height="2" />
      <rect x="2" y="2" width="2" height="4" />
      <rect x="8" y="2" width="2" height="4" />
      <rect x="0" y="6" width="12" height="8" />
    </svg>
  );
}

export function IconCheck({ className = "w-4 h-4" }: IconProps) {
  return (
    <svg
      viewBox="0 0 14 14"
      shapeRendering="crispEdges"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <rect x="0" y="6" width="2" height="2" />
      <rect x="2" y="8" width="2" height="2" />
      <rect x="4" y="10" width="2" height="2" />
      <rect x="6" y="8" width="2" height="2" />
      <rect x="8" y="6" width="2" height="2" />
      <rect x="10" y="4" width="2" height="2" />
      <rect x="12" y="2" width="2" height="2" />
    </svg>
  );
}

export function IconCopy({ className = "w-4 h-4" }: IconProps) {
  return (
    <svg
      viewBox="0 0 14 14"
      shapeRendering="crispEdges"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <rect x="3" y="0" width="9" height="2" />
      <rect x="10" y="0" width="2" height="9" />
      <rect x="3" y="7" width="9" height="2" />
      <rect x="3" y="0" width="2" height="9" />
      <rect x="0" y="4" width="9" height="2" />
      <rect x="7" y="4" width="2" height="9" />
      <rect x="0" y="11" width="9" height="2" />
      <rect x="0" y="4" width="2" height="9" />
    </svg>
  );
}
