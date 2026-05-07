import Image from "next/image";

interface HawwilMarkProps {
  className?: string;
  title?: string;
}

export function HawwilMark({ className, title }: HawwilMarkProps) {
  return (
    <Image
      src="/hawwil-logo.png"
      alt={title ?? "Hawwil"}
      width={100}
      height={100}
      className={className}
      priority
    />
  );
}