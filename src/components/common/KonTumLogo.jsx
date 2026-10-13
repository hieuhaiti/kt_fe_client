/**
 * KonTumLogo Component
 * Vector logo & icon chuẩn nhận diện thương hiệu Kon Tum (núi, sông trắng và mặt trời cam).
 *
 * @param {Object} props
 * @param {"icon" | "squircle" | "horizontal" | "stacked" | "civic"} [props.variant="horizontal"]
 * @param {"xs" | "sm" | "md" | "lg" | "xl" | "2xl" | number} [props.size="md"]
 * @param {string} [props.className=""]
 * @param {boolean} [props.showText=true]
 * @param {boolean} [props.showTagline=true] Hiển thị subtitle khi được truyền vào.
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
      {/* KONTUM artwork from the supplied mountain, river and sun reference. */}
      <circle cx="74" cy="22" r="15" fill="var(--brand-logo-sun)" />
      {/* Mountain silhouette and evergreen ridges. */}
      <path d="M5 89 9 65 29 42 46 19 58 33 65 29 96 89Z" fill="var(--brand-logo-forest)" />
      <path d="M9 65 29 42 46 19 51 47 33 53 20 72 5 89Z" fill="var(--brand-logo-emerald)" />
      <path d="M29 42 46 19 58 33 65 29 78 56 62 48 56 51 45 38 36 50Z" fill="var(--brand-logo-forest)" />
      {/* Snow-capped peaks; outlined by the mountain underneath. */}
      <path d="M32 40 46 25 57 39 64 35 72 50 60 42 57 46 46 33 38 43Z" fill="var(--brand-logo-snow)" />
      <path d="M9 66 24 55 33 58 43 48 55 56 64 51 81 65 74 67 62 60 55 63 44 56 33 66 24 62 13 75 7 77Z" fill="var(--brand-logo-emerald)" />
      <path d="M11 75 20 66 24 71 32 64 41 67 50 60 59 66 66 63 84 75 96 89 5 89Z" fill="var(--brand-logo-shadow)" />
      <path d="M7 82 17 73 21 79 27 71 32 76 39 72 46 79 53 75 61 79 68 73 76 80 82 78 88 89H5Z" fill="var(--brand-logo-forest)" />
      {/* White winding river: narrow at the source, broad in the foreground. */}
      <path d="M47 43C61 46 58 50 47 54C35 58 31 61 37 65C42 68 58 70 66 76C72 81 74 85 75 89H40C50 83 48 79 38 75C21 68 20 61 33 56C44 52 55 50 52 47C51 46 49 45 47 43Z" fill="var(--brand-logo-snow)" />
    </g>
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
        className={`size-auto shrink-0 ${className}`}
        style={{ width: baseSize, height: baseSize }}
        role="img"
        aria-label="Biểu tượng Kon Tum"
        focusable="false"
      >
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
        className={`size-auto shrink-0 ${className}`}
        style={{ width: baseSize, height: baseSize }}
        role="img"
        aria-label="Biểu tượng ứng dụng Kon Tum"
        focusable="false"
      >
        <rect width="128" height="128" rx="28" fill="var(--brand-logo-surface)" />
        <g transform="translate(8, 8) scale(1.12)">{renderEmblem()}</g>
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
          className="size-auto shrink-0"
          style={{ width: baseSize, height: baseSize }}
          aria-hidden={showText}
          role={showText ? undefined : "img"}
          aria-label={showText ? undefined : "Biểu tượng Kon Tum"}
          focusable="false"
        >
          {renderEmblem()}
        </svg>
        {showText && (
          <div className="mt-1 flex flex-col items-center">
            <span className="font-(family-name:--brand-logo-font) font-black tracking-tight text-(--brand-logo-forest) text-lg leading-tight">
              {title || "KONTUM"}
            </span>
            {showTagline && subtitle && (
              <span className="text-[9px] font-bold tracking-[0.2em] text-muted-foreground uppercase mt-0.5">
                {subtitle}
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
          className="size-auto shrink-0"
          style={{ width: baseSize, height: baseSize }}
          aria-hidden={showText}
          role={showText ? undefined : "img"}
          aria-label={showText ? undefined : "Biểu tượng Kon Tum"}
          focusable="false"
        >
          {renderEmblem()}
        </svg>
        {showText && (
          <div className="flex flex-col text-left leading-none">
            <span className="font-extrabold text-foreground tracking-tight text-base sm:text-lg">
              WebGIS <span className="text-(--brand-logo-forest)">Kon Tum</span>
            </span>
            {showTagline && subtitle && (
              <span className="text-[9.5px] font-semibold text-muted-foreground tracking-wider uppercase mt-1 hidden sm:inline">
                {subtitle}
              </span>
            )}
          </div>
        )}
      </div>
    );
  }

  // Default: Horizontal Brand Logo ("KONTUM"; optional custom subtitle)
  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      <svg
        width={baseSize}
        height={baseSize}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="size-auto shrink-0"
          style={{ width: baseSize, height: baseSize }}
          aria-hidden={showText}
          role={showText ? undefined : "img"}
          aria-label={showText ? undefined : "Biểu tượng Kon Tum"}
          focusable="false"
      >
        {renderEmblem()}
      </svg>
      {showText && (
        <div className="flex flex-col text-left leading-none">
          <span className="font-(family-name:--brand-logo-font) font-black tracking-tight text-(--brand-logo-forest) text-xl sm:text-2xl">
            {title || "KONTUM"}
          </span>
          {showTagline && subtitle && (
            <span className="text-[9px] font-bold tracking-[0.22em] text-muted-foreground uppercase mt-1">
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
