import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";

const TARGET_ISO = "2026-07-31T00:00:00Z";

const pad = (n) => String(n).padStart(2, "0");

const getRemaining = () => {
    const diff = new Date(TARGET_ISO).getTime() - Date.now();
    if (diff <= 0) {
        return { days: 0, hours: 0, minutes: 0, seconds: 0, done: true };
    }
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    const seconds = Math.floor((diff / 1000) % 60);
    return { days, hours, minutes, seconds, done: false };
};

const UNITS = [
    { key: "days", label: "Days" },
    { key: "hours", label: "Hours" },
    { key: "minutes", label: "Minutes" },
    { key: "seconds", label: "Seconds" },
];

function Card({ value, label, index }) {
    const display = label === "Days" ? String(value) : pad(value);
    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
                delay: 0.35 + index * 0.08,
                duration: 0.7,
                ease: [0.16, 1, 0.3, 1],
            }}
            className="relative flex flex-col items-center justify-center rounded-2xl border border-[#EEDDCA] bg-white/90 backdrop-blur-sm px-3 py-4 sm:px-5 sm:py-5 min-w-[74px] sm:min-w-[96px] md:min-w-[112px] shadow-[0_10px_30px_-12px_rgba(224,90,61,0.18)]"
            data-testid={`countdown-card-${label.toLowerCase()}`}
        >
            <span className="pointer-events-none absolute inset-x-4 top-1/2 h-px bg-gradient-to-r from-transparent via-[#EEDDCA] to-transparent" />
            <span className="font-mono-timer text-3xl sm:text-4xl md:text-[44px] font-semibold text-[#E05A3D] leading-none">
                {display}
            </span>
            <span className="mt-3 text-[10px] sm:text-xs font-bold uppercase tracking-[0.22em] text-[#6E5E58]">
                {label}
            </span>
        </motion.div>
    );
}

export default function CountdownTimer() {
    const [t, setT] = useState(getRemaining);

    useEffect(() => {
        const id = setInterval(() => setT(getRemaining()), 1000);
        return () => clearInterval(id);
    }, []);

    const targetLabel = useMemo(
        () =>
            new Date(TARGET_ISO).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
            }),
        []
    );

    return (
        <div data-testid="countdown-timer" className="flex flex-col gap-3">
            <div className="flex items-center gap-3 text-[10px] sm:text-xs font-bold uppercase tracking-[0.25em] text-[#6E5E58]">
                <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-[#E05A3D] opacity-60 animate-ping" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-[#E05A3D]" />
                </span>
                <span>Launching {targetLabel}</span>
            </div>
            <div className="flex gap-2 sm:gap-3 md:gap-4">
                {UNITS.map((u, i) => (
                    <Card key={u.key} index={i} value={t[u.key]} label={u.label} />
                ))}
            </div>
        </div>
    );
}
