export function parseDeviceName(userAgent) {
  if (!userAgent) return "Unknown Device";

  const ua = userAgent.toLowerCase();

  let browser = "Browser";
  if (ua.includes("edg/")) browser = "Microsoft Edge";
  else if (ua.includes("chrome/")) browser = "Google Chrome";
  else if (ua.includes("firefox/")) browser = "Mozilla Firefox";
  else if (ua.includes("safari/") && !ua.includes("chrome/")) browser = "Safari";

  let os = "Unknown OS";
  if (ua.includes("windows")) os = "Windows";
  else if (ua.includes("android")) os = "Android";
  else if (ua.includes("iphone") || ua.includes("ipad")) os = "iOS";
  else if (ua.includes("mac os")) os = "macOS";
  else if (ua.includes("linux")) os = "Linux";

  return `${browser} • ${os}`;
}

export function timeAgo(dateString) {
  if (!dateString) return "-";
  const date = new Date(dateString);
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

  if (seconds < 10) return "just now";
  if (seconds < 60) return `${seconds}s ago`;

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
