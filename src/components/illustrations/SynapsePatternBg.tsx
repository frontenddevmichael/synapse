export const SynapsePatternBg = ({ className = '' }: { className?: string }) => (
  <svg viewBox="0 0 600 300" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Circuit-board / neural network pattern — very faded, decorative */}
    {/* Nodes */}
    <circle cx="100" cy="80" r="4" className="fill-primary/8" />
    <circle cx="200" cy="150" r="5" className="fill-primary/6" />
    <circle cx="320" cy="60" r="3" className="fill-primary/7" />
    <circle cx="450" cy="120" r="4" className="fill-primary/5" />
    <circle cx="500" cy="220" r="3" className="fill-primary/6" />
    <circle cx="150" cy="240" r="4" className="fill-primary/5" />
    <circle cx="350" cy="200" r="5" className="fill-primary/7" />
    <circle cx="80" cy="180" r="3" className="fill-primary/4" />
    <circle cx="530" cy="50" r="3" className="fill-primary/5" />
    <circle cx="280" cy="260" r="4" className="fill-primary/6" />
    {/* Connections */}
    <line x1="100" y1="80" x2="200" y2="150" className="stroke-primary/6" strokeWidth="1" />
    <line x1="200" y1="150" x2="320" y2="60" className="stroke-primary/5" strokeWidth="1" />
    <line x1="320" y1="60" x2="450" y2="120" className="stroke-primary/4" strokeWidth="1" />
    <line x1="450" y1="120" x2="500" y2="220" className="stroke-primary/5" strokeWidth="1" />
    <line x1="200" y1="150" x2="350" y2="200" className="stroke-primary/5" strokeWidth="1" />
    <line x1="350" y1="200" x2="500" y2="220" className="stroke-primary/4" strokeWidth="1" />
    <line x1="100" y1="80" x2="80" y2="180" className="stroke-primary/4" strokeWidth="1" />
    <line x1="80" y1="180" x2="150" y2="240" className="stroke-primary/3" strokeWidth="1" />
    <line x1="150" y1="240" x2="280" y2="260" className="stroke-primary/4" strokeWidth="1" />
    <line x1="280" y1="260" x2="350" y2="200" className="stroke-primary/5" strokeWidth="1" />
    <line x1="320" y1="60" x2="530" y2="50" className="stroke-primary/3" strokeWidth="1" />
    <line x1="530" y1="50" x2="450" y2="120" className="stroke-primary/4" strokeWidth="1" />
  </svg>
);
