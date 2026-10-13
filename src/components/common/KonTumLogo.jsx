import { useId } from "react";

/**
 * KonTumLogo Component
 * Vector logo & icon chuẩn nhận diện thương hiệu Kon Tum (Nature Connects People).
 *
 * @param {Object} props
 * @param {"icon" | "squircle" | "horizontal" | "stacked" | "civic"} [props.variant="horizontal"]
 * @param {"sm" | "md" | "lg" | "xl" | number} [props.size="md"]
 * @param {string} [props.className=""]
 * @param {boolean} [props.showText=true]
 * @param {boolean} [props.showTagline=true]
 * @param {string} [props.title]
 * @param {string} [props.subtitle]
 */
export default function KonTumLogo({
  variant = "horizontal",
  size = "md",
  className = "",
  showText = true,
  showTagline = true,
  title,
  subtitle,
}) {
  const uniqueId = useId().replace(/:/g, "_");
  const riverGradId = `kt-river-grad-${uniqueId}`;
  const deepGradId = `kt-deep-grad-${uniqueId}`;

  // Pixel mappings for size presets
  const sizeMap = {
    xs: 24,
    sm: 32,
    md: 40,
    lg: 48,
    xl: 64,
    "2xl": 80,
  };

  const baseSize = typeof size === "number" ? size : sizeMap[size] || 40;

  // Emblem mark vector
  const renderEmblem = () => (
    <g>
      {/* 1. Sun (Highland Earth) */}
      <circle cx="70.5" cy="21.5" r="8.5" fill="#D4943F" />

      {/* 2. Mountain Peak & Body (Forest Green) */}
      <path
        d="M 36 13 C 38.8 10.2 43 10.5 45.5 13.5 L 75 44 C 77.8 47 77.8 51.5 75.5 54.5 L 68 64 C 66 66.5 63 68 59.5 68 L 47 68 L 32 57 L 15 56 L 9 44 C 7.5 41 8 38 10.5 35.5 L 36 13 Z"
        fill="#0F5132"
      />

      {/* Highland Green Mountain Face */}
      <path
        d="M 42 16 C 44 14 47 14.5 48.5 16.5 L 74.5 43.5 C 77 46.2 77.2 50.2 75 53.2 L 67.5 63.5 C 65.8 66 63 67.5 59.8 67.5 L 46 67.5 L 41 57.5 L 51 45.5 L 42 16 Z"
        fill="#2E7D4B"
      />

      {/* Saddle Shadow */}
      <path
        d="M 42 16 L 51 45.5 L 46 67.5 L 42 67.5 L 38 57.5 Z"
        fill="#1B5E38"
        opacity="0.65"
      />

      {/* 3. Pine Trees (White geometric chevrons) */}
      {/* Large Pine Tree */}
      <g>
        <rect x="25.2" y="47.5" width="2.4" height="7.5" rx="1.2" fill="#FFFFFF" />
        <path d="M 16 48 L 26.4 36.5 L 36.8 48 L 32 48 L 26.4 42.2 L 20.8 48 Z" fill="#FFFFFF" />
        <path d="M 18.5 42 L 26.4 33 L 34.3 42 L 30.5 42 L 26.4 37.5 L 22.3 42 Z" fill="#FFFFFF" />
        <path d="M 21.2 36 L 26.4 29.5 L 31.6 36 L 29 36 L 26.4 33 L 23.8 36 Z" fill="#FFFFFF" />
      </g>

      {/* Small Pine Tree */}
      <g transform="translate(-10.5, 8.5) scale(0.72)">
        <rect x="25.2" y="47" width="2.6" height="7.5" rx="1.3" fill="#FFFFFF" />
        <path d="M 17 46 L 26.4 35.5 L 35.8 46 L 31 46 L 26.4 41 L 21.8 46 Z" fill="#FFFFFF" />
        <path d="M 20.2 38.5 L 26.4 31 L 32.6 38.5 L 29 38.5 L 26.4 35 L 23.8 38.5 Z" fill="#FFFFFF" />
      </g>

      {/* 4. Location Pin */}
      <g transform="translate(67.5, 51)">
        <path
          d="M 0 -10.5 C -5.8 -10.5 -10.5 -5.8 -10.5 0 C -10.5 6.5 0 15.5 0 15.5 C 0 15.5 10.5 6.5 10.5 0 C 10.5 -5.8 5.8 -10.5 0 -10.5 Z"
          fill="#FFFFFF"
        />
        <circle cx="0" cy="-0.5" r="3.6" fill="#2E7D4B" />
      </g>

      {/* 5. River Ribbon */}
      <path
        d="M 46 45 C 55 45 61 50 58.5 56.5 C 55.5 63.5 42 67 31 71 C 19 75 14 80 16 86 C 18.5 91.5 29 93 42 89 C 32 93 21 93 15 88 C 9 83.5 9 76 14.5 70.5 C 21 64 36 61.5 46.5 58 C 54.5 55.5 55 52 53 49.5 C 50.5 46.5 46 46 43 46 Z"
        fill={`url(#${deepGradId})`}
      />
      <path
        d="M 45 44 C 54 44 60 49 57.5 55 C 54.5 61.5 42 65 31.5 68.5 C 20 72 15.5 76.5 17.5 82 C 19.5 87 30 89 42 85.5 C 32.5 89.5 22 89.5 16.5 85.5 C 11 81.5 11 75 16 69.5 C 22.5 63 37.5 60.5 47 57 C 54 54.5 54.5 51.5 52.5 49 C 50 46 46 45.5 43 45.5 Z"
        fill={`url(#${riverGradId})`}
      />
    </g>
  );

  const renderGradients = () => (
    <defs>
      <linearGradient id={riverGradId} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#38BDF8" />
        <stop offset="60%" stopColor="#2D9CDB" />
        <stop offset="100%" stopColor="#0284C7" />
      </linearGradient>
      <linearGradient id={deepGradId} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#0284C7" />
        <stop offset="100%" stopColor="#0B5EA7" />
      </linearGradient>
    </defs>
  );

  // Variant 1: Pure Icon / Emblem (transparent background)
  if (variant === "icon") {
    return (
      <svg
        width={baseSize}
        height={baseSize}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`shrink-0 ${className}`}
        aria-label="Kon Tum Logo"
      >
        {renderGradients()}
        {renderEmblem()}
      </svg>
    );
  }

  // Variant 2: Squircle App Icon (Favicon style with rounded rect)
  if (variant === "squircle") {
    return (
      <svg
        width={baseSize}
        height={baseSize}
        viewBox="0 0 128 128"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`shrink-0 ${className}`}
        aria-label="Kon Tum App Icon"
      >
        {renderGradients()}
        <rect width="128" height="128" rx="28" fill="#F4F7FA" />
        <g transform="translate(14, 14)">{renderEmblem()}</g>
      </svg>
    );
  }

  // Variant 3: Stacked Logo (Emblem top, text bottom)
  if (variant === "stacked") {
    return (
      <div className={`inline-flex flex-col items-center justify-center text-center ${className}`}>
        <svg
          width={baseSize}
          height={baseSize}
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="shrink-0"
        >
          {renderGradients()}
          {renderEmblem()}
        </svg>
        {showText && (
          <div className="mt-1 flex flex-col items-center">
            <span className="font-extrabold tracking-tight text-[#0B5EA7] text-lg leading-tight">
              {title || "KonTum"}
            </span>
            {showTagline && (
              <span className="text-[9px] font-bold tracking-[0.2em] text-[#526071] uppercase mt-0.5">
                {subtitle || "NATURE CONNECTS PEOPLE"}
              </span>
            )}
          </div>
        )}
      </div>
    );
  }

  // Variant 4: Civic Lockup ("WebGIS Kon Tum" + Subtitle)
  if (variant === "civic") {
    return (
      <div className={`inline-flex items-center gap-2.5 ${className}`}>
        <svg
          width={baseSize}
          height={baseSize}
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="shrink-0"
        >
          {renderGradients()}
          {renderEmblem()}
        </svg>
        {showText && (
          <div className="flex flex-col text-left leading-none">
            <span className="font-extrabold text-foreground tracking-tight text-base sm:text-lg">
              WebGIS <span className="text-[#0F5132]">Kon Tum</span>
            </span>
            {showTagline && (
              <span className="text-[9.5px] font-semibold text-muted-foreground tracking-wider uppercase mt-1 hidden sm:inline">
                {subtitle || "HỆ THỐNG GIÁM SÁT RỪNG & MÔI TRƯỜNG"}
              </span>
            )}
          </div>
        )}
      </div>
    );
  }

  // Default: Horizontal Brand Logo ("KonTum" + "NATURE CONNECTS PEOPLE")
  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      <svg
        width={baseSize}
        height={baseSize}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0"
      >
        {renderGradients()}
        {renderEmblem()}
      </svg>
      {showText && (
        <div className="flex flex-col text-left leading-none">
          <span className="font-extrabold tracking-tight text-[#0B5EA7] text-xl sm:text-2xl">
            {title || "KonTum"}
          </span>
          {showTagline && (
            <span className="text-[9px] font-bold tracking-[0.22em] text-[#526071] uppercase mt-1">
              {subtitle || "NATURE CONNECTS PEOPLE"}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
