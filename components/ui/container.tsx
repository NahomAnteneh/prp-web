import { cn } from "@/lib/utils";

interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  as?: React.ElementType;
  size?: "default" | "sm" | "md" | "lg" | "xl" | "full";
}

export function Container({
  children,
  as: Component = "div",
  size = "default",
  className,
  ...props
}: ContainerProps) {
  return (
    <Component
      className={cn(
        "mx-auto px-4 sm:px-6 md:px-8",
        {
          "max-w-5xl": size === "sm",
          "max-w-6xl": size === "md",
          "max-w-7xl": size === "default" || size === "lg", 
          "max-w-[1400px]": size === "xl",
          "max-w-none": size === "full",
        },
        className
      )}
      {...props}
    >
      {children}
    </Component>
  );
} 