import type { ReactNode } from "react";

const DEFAULT_CARD_CLASS_NAME = "rounded-lg bg-white p-6 shadow-lg";
const DEFAULT_TITLE_CLASS_NAME = "mb-4 text-2xl font-bold text-gray-900";

interface ContentCardProps {
  children: ReactNode;
  className?: string;
  title: string;
  titleClassName?: string;
}

export default function ContentCard({
  children,
  className,
  title,
  titleClassName,
}: ContentCardProps) {
  const cardClassName = [DEFAULT_CARD_CLASS_NAME, className].filter(Boolean).join(" ");
  const headingClassName = [DEFAULT_TITLE_CLASS_NAME, titleClassName].filter(Boolean).join(" ");

  return (
    <div className={cardClassName}>
      <h2 className={headingClassName}>{title}</h2>
      {children}
    </div>
  );
}
