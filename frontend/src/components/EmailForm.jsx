import React, { useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { ArrowRight, Loader2, Check } from "lucide-react";
import { toast } from "sonner";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function EmailForm() {
    const [email, setEmail] = useState("");
    const [status, setStatus] = useState("idle"); // idle | loading | success
    const [error, setError] = useState("");

    const submit = async (e) => {
        e.preventDefault();
        setError("");
        const value = email.trim();

        if (!value) {
            setError("Please enter your email.");
            return;
        }
        if (!EMAIL_RE.test(value)) {
            setError("That email doesn't look right.");
            return;
        }

        setStatus("loading");
        try {
            const { data } = await axios.post(`${API}/waitlist`, {
                email: value,
            });
            if (data?.already_subscribed) {
                toast("You're already on the list", {
                    description: "We'll ring you the moment we're live in Pune.",
                });
            } else {
                toast.success("You're in!", {
                    description: "We'll send a note the moment MEALUR goes live.",
                });
            }
            setStatus("success");
        } catch (err) {
            const msg =
                err?.response?.data?.detail ||
                "Something went wrong. Please try again.";
            setError(msg);
            toast.error("Couldn't subscribe", { description: msg });
            setStatus("idle");
        }
    };

    const disabled = status === "loading" || status === "success";

    return (
        <motion.form
            onSubmit={submit}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.85, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-[520px]"
            data-testid="email-form"
            noValidate
        >
            <div
                className={`group flex w-full items-stretch rounded-2xl border bg-white/85 backdrop-blur-md shadow-[0_12px_30px_-18px_rgba(44,36,33,0.25)] transition-all duration-300 ${
                    error
                        ? "border-rose-300"
                        : "border-[#EEDDCA] focus-within:border-[#E05A3D] focus-within:shadow-[0_18px_40px_-18px_rgba(224,90,61,0.4)]"
                }`}
            >
                <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                        setEmail(e.target.value);
                        if (error) setError("");
                        if (status === "success") setStatus("idle");
                    }}
                    placeholder="you@hungry.com"
                    disabled={disabled}
                    data-testid="email-input"
                    aria-label="Email address"
                    className="flex-1 bg-transparent px-5 sm:px-6 h-14 sm:h-16 text-base sm:text-lg text-[#2C2421] placeholder:text-[#b8a599] outline-none disabled:opacity-60"
                />
                <button
                    type="submit"
                    disabled={disabled}
                    data-testid="get-access-button"
                    className="cta-glow group/btn relative m-1.5 flex items-center justify-center gap-2 rounded-xl bg-[#E05A3D] px-5 sm:px-7 text-sm sm:text-base font-medium text-white shadow-[0_10px_24px_-10px_rgba(224,90,61,0.7)] transition-all duration-300 hover:bg-[#C94A2F] hover:-translate-y-[1px] hover:shadow-[0_14px_28px_-10px_rgba(224,90,61,0.8)] disabled:opacity-90 disabled:translate-y-0"
                >
                    {status === "loading" && (
                        <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>Sending</span>
                        </>
                    )}
                    {status === "success" && (
                        <>
                            <Check className="h-4 w-4" />
                            <span>You're on the list</span>
                        </>
                    )}
                    {status === "idle" && (
                        <>
                            <span className="hidden sm:inline">
                                Get Early Access
                            </span>
                            <span className="sm:hidden">Notify Me</span>
                            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover/btn:translate-x-0.5" />
                        </>
                    )}
                </button>
            </div>

            <div className="mt-3 flex min-h-[20px] items-center gap-2 px-1 text-sm">
                {error ? (
                    <span
                        data-testid="email-error"
                        className="text-rose-600 font-medium"
                    >
                        {error}
                    </span>
                ) : (
                    <span className="text-[#8a776f]">
                        No spam. Just a single &ldquo;we&rsquo;re live&rdquo;
                        email.
                    </span>
                )}
            </div>
        </motion.form>
    );
}
