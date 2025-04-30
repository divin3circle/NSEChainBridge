"use client";

import { useEffect, useState, lazy, Suspense } from "react";

// Dynamically import Lottie with no SSR
const Lottie = lazy(() => import("lottie-react"));

type LottieData = {
  v: string;
  fr: number;
  ip: number;
  op: number;
  assets: unknown[];
  layers: unknown[];
} | null;

export default function HeroAnimation() {
  const [animationData, setAnimationData] = useState<LottieData>(null);

  useEffect(() => {
    // Load animation data
    import("@/assets/welcome.json").then((data) => {
      setAnimationData(data.default);
    });
  }, []);

  if (!animationData) return null;

  return (
    <div className="w-full max-w-[400px] md:max-w-[500px] lg:max-w-[600px]">
      <Suspense fallback={null}>
        <Lottie
          animationData={animationData}
          loop={true}
          className="w-full h-full"
        />
      </Suspense>
    </div>
  );
}
