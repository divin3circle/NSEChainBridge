"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";

const features = [
  {
    title: "Secure Trading",
    description:
      "Trade with confidence using Hedera's secure blockchain infrastructure",
    bgColor: "bg-[#F1F1F1FF]",
    image: "/secure.png",
  },
  {
    title: "Decentralized",
    description:
      "Interact with your stocks and tokens on the Hedera blockchain",
    bgColor: "bg-gray-100",
    image: "/decentralized.png",
  },
  {
    title: "Low Fees",
    description:
      "Utilize Hedera's low transaction fees to trade stocks and tokens of any amount.",
    bgColor: "bg-[#111827]",
    textColor: "text-white",
    image: "/fees.png",
  },
  {
    title: "Fast Transactions",
    description:
      "Experience lightning-fast transactions with Hedera's high-speed blockchain.",
    bgColor: "bg-[#E0F6F4FF]",
    image: "/fast.png",
  },
  {
    title: "User Friendly",
    description:
      "NSEChainBridge is designed to be user-friendly, making it easy for traders to navigate and manage their portfolio.",
    bgColor: "bg-[#9BF89C]",
    image: "/user.png",
  },
  {
    title: "AI Rebalancing",
    description:
      "Utilize AI to rebalance your portfolio based on current market status to maximize your returns while minimizing risk.",
    bgColor: "bg-gray-100",
    textColor: "text-black",
    image: "/ai.png",
  },
];

export default function Features() {
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
            <h2 className="text-2xl font-medium">Features</h2>
          </div>
          <p className="text-lg text-gray-600 max-w-3xl">
            With NSEChainBridge, you can be a part of the future of stock &
            securities trading.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className={`relative rounded-2xl p-8 ${feature.bgColor} ${
                feature.textColor || "text-gray-900"
              } min-h-[280px] group`}
            >
              <div className="space-y-4">
                <div className="inline-block">
                  <Image
                    src={feature.image}
                    alt={feature.title}
                    width={48}
                    height={48}
                    className="w-12 h-12"
                  />
                </div>
                <h3 className="text-xl font-medium">{feature.title}</h3>
                <p className={`${feature.textColor || "text-gray-600"}`}>
                  {feature.description}
                </p>
              </div>
              <Link
                href={`/services/${feature.title
                  .toLowerCase()
                  .replace(/\s+/g, "-")}`}
                className={`inline-flex items-center mt-4 text-sm font-medium ${
                  feature.textColor || "text-gray-900"
                }`}
              >
                Learn more
                <svg
                  className="w-4 h-4 ml-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 8l4 4m0 0l-4 4m4-4H3"
                  />
                </svg>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
