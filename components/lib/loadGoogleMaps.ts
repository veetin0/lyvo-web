let scriptLoadingPromise: Promise<void> | null = null;

const DEFAULT_LIBRARIES: string[] = ["places", "geometry"];

export function loadGoogleMaps(libraries: string[] = DEFAULT_LIBRARIES): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.resolve();
  }

  if (window.google?.maps) {
    return Promise.resolve();
  }

  if (scriptLoadingPromise) {
    return scriptLoadingPromise;
  }

  scriptLoadingPromise = new Promise((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>("script[data-google-maps-loader]");

    if (existingScript) {
      existingScript.addEventListener("load", () => resolve());
      existingScript.addEventListener("error", () => {
        scriptLoadingPromise = null;
        reject(new Error("Failed to load Google Maps API"));
      });
      return;
    }

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
      scriptLoadingPromise = null;
      reject(new Error("Google Maps API key is missing"));
      return;
    }

    const script = document.createElement("script");
    script.setAttribute("data-google-maps-loader", "true");

    const libsParam = libraries.length ? `&libraries=${Array.from(new Set(libraries)).join(",")}` : "";
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}${libsParam}`;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      scriptLoadingPromise = null;
      reject(new Error("Failed to load Google Maps API"));
    };

    document.head.appendChild(script);
  });

  return scriptLoadingPromise;
}
