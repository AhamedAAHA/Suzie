"use client";

import { useRouter } from "next/navigation";
import BootAnimation from "@/components/BootAnimation";

export default function BootPage() {
  const router = useRouter();

  return (
    <BootAnimation onComplete={() => router.push("/dashboard")} />
  );
}
