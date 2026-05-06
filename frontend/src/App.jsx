import React from "react";
import { motion } from "framer-motion";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import CountdownTimer from "./components/CountdownTimer";
import EmailForm from "./components/EmailForm";
import RightVisual from "./components/RightVisual";
import AdminPage from "./pages/AdminPage";

const fadeUp = {
    hidden: { opacity: 0, y: 20 },
    show: (i = 0) => ({
        opacity: 1,
        y: 0,
        transition: {
            delay: 0.1 + i * 0.12,
            duration: 0.8,
            ease: [0.16, 1, 0.3, 1],
        },
    }),
};

function Header() {
    return (
        <header
            data-testid="site-header"
            className="relative z-20 flex items-center justify-between px-6 md:px-12 lg:px-16 py-6"
        >
            <motion.a
                href="/"
                initial="hidden"
                animate="show"
                custom={0}
                variants={fadeUp}
                className="flex items-center gap-2"
                data-testid="brand-logo"
            >
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#2C2421] text-white font-display font-bold text-lg">
                    M
                </span>
                <span className="font-display text-xl md:text-2xl font-semibold tracking-tight text-[#2C2421]">
                    MEALUR
                </span>
            </motion.a>

            <motion.div
                initial="hidden"
                animate="show"
                custom={1}
                variants={fadeUp}
                className="hidden sm:flex items-center gap-2 rounded-full bg-white/75 backdrop-blur-md border border-[#EEDDCA] px-3.5 py-1.5"
            >
                <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-60 animate-ping" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500" />
                </span>
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[#6E5E58]">
                    Pre-launch · Pune
                </span>
            </motion.div>
        </header>
    );
}

function Footer() {
    return (
        <footer
            data-testid="site-footer"
            className="relative z-10 mt-8 md:mt-12 px-6 md:px-12 lg:px-16 py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-[#8a776f]"
        >
            <p>&copy; {new Date().getFullYear()} MEALUR. Cooked in Pune.</p>
            <div className="flex items-center gap-5">
                <a
                    href="mailto:hello@mealur.co"
                    className="hover:text-[#2C2421] transition-colors"
                >
                    hello@mealur.co
                </a>
                <span className="h-1 w-1 rounded-full bg-[#EEDDCA]" />
                <a href="#" className="hover:text-[#2C2421] transition-colors">
                    Instagram
                </a>
                <a href="#" className="hover:text-[#2C2421] transition-colors">
                    Twitter
                </a>
            </div>
        </footer>
    );
}

function Hero() {
    return (
        <section
            data-testid="hero-section"
            className="relative z-10 px-6 md:px-12 lg:px-16 pt-6 md:pt-10 pb-10"
        >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center min-h-[78vh]">
                <div className="col-span-1 lg:col-span-7 flex flex-col">
                    <motion.div
                        initial="hidden"
                        animate="show"
                        custom={0}
                        variants={fadeUp}
                        className="inline-flex self-start items-center gap-2 rounded-full bg-white/70 backdrop-blur border border-[#EEDDCA] px-3 py-1.5 mb-7"
                    >
                        <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#E05A3D]">
                            Coming Soon
                        </span>
                        <span className="h-1 w-1 rounded-full bg-[#EEDDCA]" />
                        <span className="text-[11px] font-medium text-[#6E5E58]">
                            v01 · Menu drop
                        </span>
                    </motion.div>

                    <motion.h1
                        initial="hidden"
                        animate="show"
                        custom={1}
                        variants={fadeUp}
                        className="font-display text-[44px] sm:text-6xl lg:text-[76px] font-semibold text-[#2C2421] tracking-tight leading-[0.94]"
                        data-testid="hero-heading"
                    >
                        Still Cooking
                        <br />
                        Our{" "}
                        <span className="relative inline-block">
                            <span className="relative z-10 italic text-[#E05A3D]">
                                Website
                            </span>
                            <span className="absolute left-0 right-0 bottom-[0.12em] h-[0.28em] bg-[#FFD9C2] -z-0 rounded-sm" />
                        </span>
                        .
                    </motion.h1>

                    <motion.div
                        initial="hidden"
                        animate="show"
                        custom={2}
                        variants={fadeUp}
                        className="mt-8 md:mt-10"
                    >
                        <CountdownTimer />
                    </motion.div>

                    <motion.p
                        initial="hidden"
                        animate="show"
                        custom={3}
                        variants={fadeUp}
                        className="mt-7 md:mt-8 max-w-[520px] text-lg md:text-xl text-[#5a4a44] leading-relaxed"
                        data-testid="hero-subtext"
                    >
                        We&rsquo;re cooking up something{" "}
                        <span className="text-[#2C2421] font-medium">
                            delicious
                        </span>
                        &nbsp;— launching first in Pune.
                    </motion.p>

                    <div className="mt-6 md:mt-7">
                        <EmailForm />
                    </div>
                </div>

                <div className="col-span-1 lg:col-span-5 h-[460px] sm:h-[520px] lg:h-[640px]">
                    <RightVisual />
                </div>
            </div>
        </section>
    );
}

export default function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/admin" element={<AdminPage />} />
            </Routes>
        </BrowserRouter>
    );
}

function LandingPage() {
    return (
        <div
            className="mealur-bg mealur-grain relative min-h-screen flex flex-col"
            data-testid="page-root"
        >
            <div className="relative z-10 flex flex-col min-h-screen">
                <Header />
                <main className="flex-1">
                    <Hero />
                </main>
                <Footer />
            </div>
            <Toaster
                position="bottom-center"
                theme="light"
                toastOptions={{
                    style: {
                        border: "1px solid #EEDDCA",
                        background: "rgba(255,255,255,0.95)",
                        color: "#2C2421",
                        fontFamily: "var(--font-body)",
                    },
                }}
            />
        </div>
    );
}