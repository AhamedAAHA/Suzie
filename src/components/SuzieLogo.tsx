import Image from "next/image";

interface SuzieLogoProps {
  className?: string;
}

export default function SuzieLogo({ className = "" }: SuzieLogoProps) {
  return (
    <Image
      src="/logo-suzie.svg"
      alt="Suzie AI"
      width={660}
      height={650}
      className={`block h-auto select-none ${className}`}
      draggable={false}
      priority
    />
  );
}
