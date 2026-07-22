import React from "react";
// Đã loại bỏ i18n, dùng tiếng Việt trực tiếp
import {
  Cloud,
  CloudRain,
  CloudDrizzle,
  CloudSnow,
  CloudLightning,
  Sun,
  Moon,
  CloudFog,
  CloudSun,
  CloudMoon,
} from "lucide-react";
import * as Tooltip from "@radix-ui/react-tooltip";

import icFaceGreen from "@/assets/aqi-icon/ic-face-green.svg";
import icFaceOrange from "@/assets/aqi-icon/ic-face-orange.svg";
import icFacePurple from "@/assets/aqi-icon/ic-face-purple.svg";
import icFaceRed from "@/assets/aqi-icon/ic-face-red.svg";
import icFaceYellow from "@/assets/aqi-icon/ic-face-yellow.svg";

// 🟩 Component xuất icon + tooltip
export function getIcon(icon, className = "") {
  const iconMap = {
    "01d": {
      el: <Sun className="text-yellow-400" />,
      label: "Trời quang đãng ban ngày",
    },
    "01n": {
      el: <Moon className="text-blue-300" />,
      label: "Trời quang đãng ban đêm",
    },
    "02d": {
      el: <CloudSun className="text-yellow-400" />,
      label: "Ít mây ban ngày",
    },
    "02n": {
      el: <CloudMoon className="text-blue-300" />,
      label: "Ít mây ban đêm",
    },
    "03d": {
      el: <Cloud className="text-slate-400" />,
      label: "Mây rải rác ban ngày",
    },
    "03n": {
      el: <Cloud className="text-slate-400" />,
      label: "Mây rải rác ban đêm",
    },
    "04d": {
      el: <Cloud className="text-slate-500" />,
      label: "Mây vỡ ban ngày",
    },
    "04n": {
      el: <Cloud className="text-slate-500" />,
      label: "Mây vỡ ban đêm",
    },
    "09d": {
      el: <CloudDrizzle className="text-blue-500" />,
      label: "Mưa phùn rải rác ban ngày",
    },
    "09n": {
      el: <CloudDrizzle className="text-blue-500" />,
      label: "Mưa phùn rải rác ban đêm",
    },
    "10d": {
      el: <CloudRain className="text-blue-500" />,
      label: "Mưa ban ngày",
    },
    "10n": {
      el: <CloudRain className="text-blue-700" />,
      label: "Mưa ban đêm",
    },
    "11d": {
      el: <CloudLightning className="text-yellow-500" />,
      label: "Giông ban ngày",
    },
    "11n": {
      el: <CloudLightning className="text-yellow-500" />,
      label: "Giông ban đêm",
    },
    "13d": {
      el: <CloudSnow className="text-sky-300" />,
      label: "Tuyết ban ngày",
    },
    "13n": {
      el: <CloudSnow className="text-sky-300" />,
      label: "Tuyết ban đêm",
    },
    "50d": {
      el: <CloudFog className="text-gray-400" />,
      label: "Sương mù ban ngày",
    },
    "50n": {
      el: <CloudFog className="text-gray-400" />,
      label: "Sương mù ban đêm",
    },
  };

  const fallback = {
    el: <Sun className="text-yellow-400" />,
    label: "Trời quang đãng ban ngày",
  };
  const { el, label } = iconMap[icon] || fallback;

  const mergedClass = `${el.props.className || ""} ${className}`.trim();
  const iconWithSize = React.cloneElement(el, { className: mergedClass });

  return (
    <Tooltip.Root>
      <Tooltip.Trigger asChild>{iconWithSize}</Tooltip.Trigger>
      <Tooltip.Content
        side="top"
        className="rounded bg-black/80 text-white px-2 py-1 text-xs"
      >
        {label}
      </Tooltip.Content>
    </Tooltip.Root>
  );
}

export const AQI_LEVELS = {
  1: {
    label: "Tốt",
    desc: "Không khí tốt",
    color: "text-green-600",
    bg: "bg-green-100",
    icon: icFaceGreen,
  },
  2: {
    label: "Trung bình",
    desc: "Không khí chấp nhận được",
    color: "text-yellow-600",
    bg: "bg-yellow-100",
    icon: icFaceYellow,
  },
  3: {
    label: "Không tốt cho nhạy cảm",
    desc: "Ảnh hưởng nhóm nhạy cảm",
    color: "text-orange-600",
    bg: "bg-orange-100",
    icon: icFaceOrange,
  },
  4: {
    label: "Không tốt",
    desc: "Không khí xấu",
    color: "text-red-600",
    bg: "bg-red-100",
    icon: icFaceRed,
  },
  5: {
    label: "Rất không tốt",
    desc: "Không khí rất xấu",
    color: "text-purple-600",
    bg: "bg-purple-100",
    icon: icFacePurple,
  },
};

// 🧩 Lấy thông tin AQI theo cấp độ
export function useAQILevel(aqi) {
  const level = AQI_LEVELS[aqi] || AQI_LEVELS[3];
  return {
    ...level,
  };
}

// 🧠 Hàm tiện ích format dữ liệu
export function formatTemperature(temp, unit = "°C") {
  return `${Math.round(temp)}${unit}`;
}

export function formatWindSpeed(speed, unit = "m/s") {
  return `${Math.round(speed)} ${unit}`;
}

export function formatHumidity(humidity) {
  return `${Math.round(humidity)}%`;
}
