"use client";

import { motion } from "framer-motion";
import { DollarSign, Users, BarChart, Clock } from "lucide-react";

const stats = [
  {
    icon: <DollarSign className="h-8 w-8 text-[#111827]" />,
    value: "1M+",
    label: "AI Trading Volume",
    description: "Monthly trading volume in USD by AI agents",
  },
  {
    icon: <Users className="h-8 w-8 text-[#111827]" />,
    value: "10K+",
    label: "Active Traders",
    description: "Growing community of traders",
  },
  {
    icon: <BarChart className="h-8 w-8 text-[#111827]" />,
    value: "50+",
    label: "Listed Stocks",
    description: "Major NSE stocks available",
  },
  {
    icon: <Clock className="h-8 w-8 text-[#111827]" />,
    value: "<2s",
    label: "Settlement Time",
    description: "Near-instant trade settlement",
  },
];

export default function Stats() {
  return (
    <section className="w-full py-24 bg-[#F1F1F1FF] rounded-xl mt-14">
      <div className="container px-4 md:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="flex flex-col items-center justify-center space-y-4 text-center"
        >
          <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl text-black">
            Our Targets
          </h2>
          <p className="mx-auto max-w-[700px] text-black md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
            Transforming off-chain collateralization with blockchain technology
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mt-16">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="flex flex-col items-center justify-center p-8 bg-[#f6f7f9] rounded-lg shadow-lg"
            >
              <div className="p-3 bg-blue-50 rounded-full mb-4">
                {stat.icon}
              </div>
              <div className="text-3xl font-bold text-[#111827]">
                {stat.value}
              </div>
              <div className="text-lg font-semibold text-[#000] mt-2">
                {stat.label}
              </div>
              <p className="text-gray-500 text-center mt-2">
                {stat.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
