import React, { useEffect, useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";

const FOOD_IMAGE =
    "https://images.unsplash.com/photo-1767335911106-b96c1cc33099?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1Mjh8MHwxfHNlYXJjaHwxfHxtaW5pbWFsaXN0JTIwZ291cm1ldCUyMHBsYXRlJTIwd2hpdGUlMjBiYWNrZ3JvdW5kfGVufDB8fHx8MTc3ODA1NzI3NHww&ixlib=rb-4.1.0&q=85";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const BASELINE = 408;

function Steam() {
    // Three drifting steam lines rising from the plate
    return (
        <svg
            viewBox="0 0 80 140"
            className="pointer-events-none absolute left-1/2 top-[-70px] -translate-x-1/2 h-36 w-24 opacity-90"
            aria-hidden="true"
        >
            {[10, 40, 70].map((x, i) => (
                <path
                    key={i}
                    className="steam-line"
                    d={`M${x} 120 C ${x + 12} 95, ${x - 10} 80, ${x + 8} 55 S ${x - 6} 20, ${x + 4} 0`}
                    stroke="rgba(224,90,61,0.45)"
                    strokeWidth="2"
                    strokeLinecap="round"
                    fill="none"
                />
            ))}
        </svg>
    );
}

export default function RightVisual() {
    const [count, setCount] = useState(BASELINE);

    useEffect(() => {
        let cancelled = false;
        const fetchStats = async () => {
            try {
                const { data } = await axios.get(`${API}/waitlist/stats`);
                if (!cancelled && typeof data?.count === "number") {
                    setCount(BASELINE + data.count);
                }
            } catch {
                /* keep baseline */
            }
        };
        fetchStats();
        const id = setInterval(fetchStats, 15000);
        return () => {
            cancelled = true;
            clearInterval(id);
        };
    }, []);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 1.1, ease: "easeOut" }}
            className="relative flex h-full w-full items-center justify-center"
            data-testid="right-visual"
        >
            {/* Soft ambient blob behind card */}
            <div
                aria-hidden="true"
                className="absolute h-[360px] w-[360px] md:h-[520px] md:w-[520px] rounded-full blur-[90px] bg-gradient-to-tr from-[#E05A3D]/25 via-amber-300/25 to-rose-200/30 -z-0"
            />

            {/* Floating glass card */}
            <motion.div
                animate={{ y: [-10, 10] }}
                transition={{
                    repeat: Infinity,
                    repeatType: "reverse",
                    duration: 4.5,
                    ease: "easeInOut",
                }}
                className="relative z-10 w-[280px] sm:w-[340px] md:w-[380px] lg:w-[420px] aspect-[4/5] rounded-[2.25rem] bg-white/45 backdrop-blur-2xl border border-white/70 shadow-[0_30px_60px_-20px_rgba(44,36,33,0.18)] overflow-hidden"
            >
                {/* Subtle top highlight */}
                <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/90 to-transparent" />

                {/* Label tag top-left */}
                <div className="absolute left-5 top-5 flex items-center gap-2 rounded-full bg-white/80 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.22em] text-[#6E5E58] border border-white">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#E05A3D]" />
                    Fresh · Pune
                </div>

                {/* Plate illustration */}
                <div className="absolute inset-0 flex items-end justify-center p-6 sm:p-8">
                    <div className="relative w-full">
                        <Steam />
                        <div className="relative mx-auto aspect-square w-[78%] rounded-full overflow-hidden shadow-[0_20px_40px_-18px_rgba(44,36,33,0.35)] ring-1 ring-white/70">
                            <img
                                src={FOOD_IMAGE}
                                alt="A beautifully plated dish — MEALUR is cooking."
                                className="h-full w-full object-cover"
                                loading="eager"
                                decoding="async"
                            />
                        </div>
                    </div>
                </div>

                {/* Bottom glass caption */}
                <div className="absolute inset-x-5 bottom-5 rounded-2xl bg-white/75 backdrop-blur-md border border-white/80 px-4 py-3">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-display text-base font-semibold text-[#2C2421] leading-tight">
                                Today&rsquo;s Craft
                            </p>
                            <p className="text-xs text-[#6E5E58] mt-0.5">
                                Slow-baked, thoughtfully plated.
                            </p>
                        </div>
                        <div className="flex -space-x-2">
                            <span className="h-7 w-7 rounded-full bg-gradient-to-br from-[#E05A3D] to-amber-400 ring-2 ring-white" />
                            <span className="h-7 w-7 rounded-full bg-gradient-to-br from-amber-300 to-rose-200 ring-2 ring-white" />
                            <span className="h-7 w-7 rounded-full bg-gradient-to-br from-rose-200 to-orange-200 ring-2 ring-white" />
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Orbiting accent chip */}
            <motion.div
                animate={{ y: [8, -8], rotate: [-2, 2] }}
                transition={{
                    repeat: Infinity,
                    repeatType: "reverse",
                    duration: 5,
                    ease: "easeInOut",
                }}
                className="absolute -right-2 top-[18%] md:right-4 hidden sm:flex items-center gap-2 rounded-full bg-white/85 backdrop-blur border border-[#EEDDCA] px-3 py-2 shadow-[0_10px_24px_-12px_rgba(44,36,33,0.18)]"
            >
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <span className="text-xs font-medium text-[#2C2421]">
                    Kitchen open
                </span>
            </motion.div>

            {/* Bottom-left chip */}
            <motion.div
                animate={{ y: [-6, 10] }}
                transition={{
                    repeat: Infinity,
                    repeatType: "reverse",
                    duration: 4,
                    ease: "easeInOut",
                }}
                className="absolute left-0 bottom-[14%] hidden md:flex items-center gap-3 rounded-2xl bg-white/85 backdrop-blur border border-[#EEDDCA] px-4 py-3 shadow-[0_10px_24px_-12px_rgba(44,36,33,0.18)]"
            >
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FFEFE3] text-lg">
                    <span className="font-display font-semibold text-[#E05A3D]">
                        M
                    </span>
                </div>
                <div>
                    <p className="font-display text-sm font-semibold leading-none text-[#2C2421]">
                        {count.toLocaleString()} foodies
                    </p>
                    <p className="text-[11px] text-[#6E5E58] mt-1">
                        already on the list
                    </p>
                </div>
            </motion.div>
        </motion.div>
    );
}
