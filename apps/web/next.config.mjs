import fs from "node:fs";
import path from "node:path";

// Patch Next.js 14's bundled @next/font Google Fonts fetcher before webpack compiles so builds
// succeed on both Vercel and Docker when Google Fonts returns extensionless URLs for old Chrome UAs.
try {
  const googleFontDir = path.join(
    process.cwd(),
    "node_modules/next/dist/compiled/@next/font/dist/google",
  );
  const fetchFile = path.join(googleFontDir, "fetch-css-from-google-fonts.js");
  if (fs.existsSync(fetchFile)) {
    const content = fs.readFileSync(fetchFile, "utf8");
    if (content.includes("Chrome/104.0.0.0")) {
      fs.writeFileSync(fetchFile, content.replaceAll("Chrome/104.0.0.0", "Chrome/130.0.0.0"));
    }
  }
  const loaderFile = path.join(googleFontDir, "loader.js");
  if (fs.existsSync(loaderFile)) {
    const content = fs.readFileSync(loaderFile, "utf8");
    if (content.includes(".exec(googleFontFileUrl)[1]")) {
      fs.writeFileSync(
        loaderFile,
        content.replace(".exec(googleFontFileUrl)[1]", ".exec(googleFontFileUrl)?.[1] ?? 'woff2'"),
      );
    }
  }
} catch {
  // Ignore if node_modules is read-only
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  ...(process.env.VERCEL ? {} : { output: "standalone" }),
  async redirects() {
    // Contact has no page of its own: the menu's Contact scrolls to the footer. Old links to /contact land there.
    return [{ source: "/contact", destination: "/#contact", permanent: false }];
  },
};

export default nextConfig;
