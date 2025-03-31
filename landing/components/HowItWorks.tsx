"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import {
  Plus,
  Minus,
  UserPlus,
  Wallet,
  BarChart2,
  LineChart,
  FolderKanban,
  Users,
} from "lucide-react";

const steps = [
  {
    number: "01",
    title: "Create Account",
    description:
      "Sign up and verify your identity to start trading. Our streamlined verification process ensures security while making it easy to get started with NSEChainBridge.",
    icon: <UserPlus className="w-6 h-6" />,
  },
  {
    number: "02",
    title: "Fund Wallet",
    description:
      "Add HBAR to your wallet for trading and fees. You can easily transfer HBAR from your existing wallet or purchase directly through our platform.",
    icon: <Wallet className="w-6 h-6" />,
  },
  {
    number: "03",
    title: "Trade Stocks",
    description:
      "Buy and sell tokenized NSE stocks instantly. Our platform provides real-time market data and seamless trading experience powered by Hedera's blockchain.",
    icon: <BarChart2 className="w-6 h-6" />,
  },
  {
    number: "04",
    title: "Track Performance",
    description:
      "Monitor your portfolio and market insights in real-time. Get detailed analytics and performance metrics to make informed trading decisions.",
    icon: <LineChart className="w-6 h-6" />,
  },
  {
    number: "05",
    title: "Portfolio Management",
    description:
      "Manage your stock holdings efficiently with our comprehensive portfolio management tools. Track gains, set alerts, and optimize your investment strategy.",
    icon: <FolderKanban className="w-6 h-6" />,
  },
  {
    number: "06",
    title: "Community Engagement",
    description:
      "Join our vibrant trading community. Share insights, learn from experienced traders, and stay updated with the latest market trends.",
    icon: <Users className="w-6 h-6" />,
  },
];

export default function HowItWorks() {
  const [openStep, setOpenStep] = useState(0);

  return (
    <section className="w-full py-12">
      <div className="container px-4 md:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="space-y-4"
        >
          <div className="inline-block rounded-lg bg-[#9BF89C] px-4 py-1.5">
            <h2 className="text-2xl font-medium">Our Working Process</h2>
          </div>
          <p className="text-lg text-gray-600 max-w-3xl">
            Step-by-Step Guide to Getting Started with NSEChainBridge
          </p>
        </motion.div>

        <div className="mt-12 space-y-4">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className={`rounded-3xl transition-all duration-500 ${
                openStep === index ? "bg-[#9BF89C]" : "bg-gray-100"
              }`}
            >
              <button
                onClick={() => setOpenStep(openStep === index ? -1 : index)}
                className="w-full px-8 py-6 flex items-center justify-between"
              >
                <div className="flex items-center gap-6">
                  <span className="text-4xl font-bold">{step.number}</span>
                  <div className="flex items-center gap-3">
                    <div
                      className={`transition-colors duration-300 ${
                        openStep === index ? "text-gray-800" : "text-gray-600"
                      }`}
                    >
                      {step.icon}
                    </div>
                    <span className="text-xl font-medium">{step.title}</span>
                  </div>
                </div>
                <div
                  className={`rounded-full border border-current p-2 transition-transform duration-300 ${
                    openStep === index ? "rotate-180" : "rotate-0"
                  }`}
                >
                  {openStep === index ? (
                    <Minus className="w-4 h-4" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                </div>
              </button>
              <AnimatePresence>
                {openStep === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{
                      height: "auto",
                      opacity: 1,
                      transition: {
                        height: {
                          duration: 0.4,
                          ease: [0.04, 0.62, 0.23, 0.98],
                        },
                        opacity: { duration: 0.25, delay: 0.15 },
                      },
                    }}
                    exit={{
                      height: 0,
                      opacity: 0,
                      transition: {
                        height: { duration: 0.3 },
                        opacity: { duration: 0.2 },
                      },
                    }}
                    className="overflow-hidden"
                  >
                    <div className="px-8 pb-6 pt-0">
                      <div className="pl-16">
                        <p className="text-gray-600">{step.description}</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
