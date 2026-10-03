/** Re-mounts on every navigation, so each screen slides in on phones. */
export default function ConsoleTemplate({ children }: { children: React.ReactNode }) {
  return <div className="page-enter">{children}</div>;
}
