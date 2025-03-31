"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";

export default function Hero() {
  return (
    <section className="w-full py-12 md:py-24 lg:py-32 bg-white ">
      <div className="container px-4 md:px-6">
        <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 xl:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col justify-center space-y-4"
          >
            <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl">
              Navigating the digital landscape for success
            </h1>
            <p className="max-w-[600px] text-gray-500 md:text-xl dark:text-gray-400">
              NSEChainBridge is a revolutionary platform that bridges the gap
              between traditional stock trading and blockchain technology,
              specifically leveraging the Hedera network. This application
              enables users to trade NSE stocks using blockchain tokens,
              providing a seamless and secure trading experience.
            </p>
            <div className="flex flex-col gap-2 min-[400px]:flex-row">
              <Link
                href="https://github.com/divin3circle/NSEChainBridge"
                className="inline-flex h-10 items-center justify-center rounded-md bg-[#111827] px-8 text-sm font-medium text-white hover:bg-[#111827]/90"
              >
                Download App
              </Link>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex items-center justify-center"
          >
            <Image
              src="/hero.avif"
              alt="Hero illustration"
              width={600}
              height={515}
              className="object-contain"
              priority
            />
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-16"
        >
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
            {["Hedera", "SaucerSwap", "NSE", "HashPack"].map((brand, index) => (
              <div
                key={index}
                className="text-xl md:text-2xl font-medium text-gray-500"
              >
                {brand}
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
