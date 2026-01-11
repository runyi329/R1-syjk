interface LogoProps {
  size?: number;
  className?: string;
}

export function Logo({ size = 56, className = "" }: LogoProps) {
  return (
    <img
      src="/logo-icon.png"
      alt="数金研投 Logo"
      style={{
        width: `${size}px`,
        height: `${size}px`,
        objectFit: "contain",
      }}
      className={`flex-shrink-0 bg-transparent ${className}`}
    />
  );
}

export default Logo;
