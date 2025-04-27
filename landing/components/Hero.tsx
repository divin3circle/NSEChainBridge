"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Lottie from "lottie-react";
import animationData from "../assets/welcome.json";

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
            <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-5xl">
              Your Gateway to Off-Chain collateralized trading
            </h1>
            <p className="max-w-[600px] text-gray-500 md:text-xl dark:text-gray-400 my-2">
              With NSEChainBride you can use your off-chain stocks as
              collateral, giving you unlimited access to the Web3 world
            </p>
            <div className="flex flex-col gap-2 min-[400px]:flex-row mt-12">
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
            <Lottie
              animationData={animationData}
              loop={true}
              autoplay={true}
              className="w-full max-w-[400px] md:max-w-[500px] lg:max-w-[600px]"
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
