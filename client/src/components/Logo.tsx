interface LogoProps {
  size?: number;
  className?: string;
  href?: string;
  onClick?: () => void;
}

export function Logo({ size = 56, className = "", href, onClick }: LogoProps) {
  const logoElement = (
    <img
      src="/logo-icon-transparent.png"
      alt="数金研投 Logo"
      style={{
        width: `${size}px`,
        height: `${size}px`,
        objectFit: "contain",
        borderRadius: '10px',
      }}
      className={`flex-shrink-0 ${href || onClick ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''} ${className}`}
    />
  );

  if (href) {
    return (
      <a href={href} className="inline-flex">
        {logoElement}
      </a>
    );
  }

  if (onClick) {
    return (
      <button onClick={onClick} className="inline-flex bg-transparent border-none p-0">
        {logoElement}
      </button>
    );
  }

  return logoElement;
}

export default Logo;
