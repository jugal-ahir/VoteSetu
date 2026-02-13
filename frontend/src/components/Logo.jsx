import React from "react";
import { useThemeStore } from "../store/themeStore.js";

export function Logo({ className = "h-6 w-6" }) {
    const { theme } = useThemeStore();

    const emblemSrc = theme === "dark"
        ? "/emblem_white.svg"
        : "/emblem_black.svg";

    return (
        <img
            src={emblemSrc}
            alt="National Emblem of India"
            className={className}
        />
    );
}
