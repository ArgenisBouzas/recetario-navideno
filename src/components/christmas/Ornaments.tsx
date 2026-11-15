export function SnowflakeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden>
      <path d="M12 2v20M3.3 7l17.4 10M3.3 17L20.7 7M9 4l3 2 3-2M9 20l3-2 3 2" />
    </svg>
  );
}

/** Filete dorado con copo al centro, para separar secciones. */
export function GoldRule({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-3 text-oro ${className}`} aria-hidden>
      <span className="h-px flex-1 bg-gradient-to-r from-transparent to-oro/70" />
      <SnowflakeIcon className="h-4 w-4" />
      <span className="h-px flex-1 bg-gradient-to-l from-transparent to-oro/70" />
    </div>
  );
}
