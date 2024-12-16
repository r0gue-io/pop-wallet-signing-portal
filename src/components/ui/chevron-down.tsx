export const ChevronDown = ({ isOpen, className}: { isOpen: boolean, className: string}) => (
  <svg
    className={`w-4 h-4 transform transition-transform ${isOpen ? "rotate-180" : ""} ${className}`}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M19 9l-7 7-7-7"
    />
  </svg>
)