"use client";

import dynamic from "next/dynamic";

const Particles = dynamic(() => import("./Particles"), { ssr: false });

export default function ClientParticles() {
  return <Particles />;
}
