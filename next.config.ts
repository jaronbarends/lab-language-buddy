import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Testing on a real iPhone needs an HTTPS origin (getUserMedia refuses to run
  // otherwise), which in practice means an ngrok tunnel to the dev server. Next
  // blocks cross-origin dev requests unless the host is listed here.
  //
  // Matching is on hostname only — no scheme, no port, no path — and a single "*"
  // matches exactly one label, so this covers "abc123.ngrok-free.app" but NOT a
  // bare "ngrok-free.app".
  allowedDevOrigins: ["*.ngrok-free.app"],
};

export default nextConfig;
