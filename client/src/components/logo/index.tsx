import { Link } from "react-router-dom";

const Logo = (props: { url?: string }) => {
  const { url = "/" } = props;

  const TIcon = () => (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* Horizontal top bar */}
      <line x1="4" y1="5" x2="20" y2="5" />
      {/* Vertical bar */}
      <line x1="12" y1="5" x2="12" y2="19" />
    </svg>
  );

  return (
    <div className="flex items-center justify-center sm:justify-start">
      <Link to={url}>
        <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <TIcon />
        </div>
      </Link>
    </div>
  );
};

export default Logo;
