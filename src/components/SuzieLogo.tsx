import Image from "next/image";

interface SuzieLogoProps {
  className?: string;
}

export default function SuzieLogo({ className = "" }: SuzieLogoProps) {
  return (
    <Image
      src="/logo-suzie.png"
      alt="Suzie AI"
      width={1536}
      height={1024}
      className={`block h-auto select-none ${className}`}
      draggable={false}
      priority
    />
  );
}
