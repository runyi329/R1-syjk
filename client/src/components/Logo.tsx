interface LogoProps {
  size?: number;
  className?: string;
}

export function Logo({ size = 56, className = "" }: LogoProps) {
  return (
    <img
      src="/logo-icon-transparent.png"
      alt="数金研投 Logo"
      style={{
        width: `${size}px`,
        height: `${size}px`,
        objectFit: "contain", borderRadius: '10px',
      }}
      className={`flex-shrink-0 ${className}`}
    />
  );
}

export default Logo;
