export type BasemapId =
  | "streets"
  | "satellite"
  | "hybrid"
  | "topo"
  | "light";

export type BasemapLayer = {
  url: string;
  attribution: string;
  maxZoom: number;
  subdomains?: string | string[];
};

export type BasemapDefinition = {
  id: BasemapId;
  label: string;
  base: BasemapLayer;
  overlay?: BasemapLayer;
};

export const DEFAULT_BASEMAP: BasemapId = "streets";

const DEFAULT_SUBDOMAINS = "abc";

export const BASEMAPS: Record<BasemapId, BasemapDefinition> = {
  streets: {
    id: "streets",
    label: "Streets",
    base: {
      url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      attribution: "&copy; OpenStreetMap contributors",
      maxZoom: 19,
      subdomains: DEFAULT_SUBDOMAINS,
    },
  },
  satellite: {
    id: "satellite",
    label: "Satellite",
    base: {
      url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      attribution:
        "Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics",
      maxZoom: 19,
      subdomains: DEFAULT_SUBDOMAINS,
    },
  },
  hybrid: {
    id: "hybrid",
    label: "Hybrid",
    base: {
      url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      attribution:
        "Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics",
      maxZoom: 19,
      subdomains: DEFAULT_SUBDOMAINS,
    },
    overlay: {
      url: "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
      attribution: "Labels &copy; Esri",
      maxZoom: 19,
      subdomains: DEFAULT_SUBDOMAINS,
    },
  },
  topo: {
    id: "topo",
    label: "Topo",
    base: {
      url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
      attribution:
        "Map data: &copy; OpenStreetMap contributors, SRTM | Map style: &copy; OpenTopoMap (CC-BY-SA)",
      maxZoom: 17,
      subdomains: DEFAULT_SUBDOMAINS,
    },
  },
  light: {
    id: "light",
    label: "Light",
    base: {
      url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png",
      attribution: "&copy; OpenStreetMap contributors &copy; CARTO",
      maxZoom: 20,
      subdomains: "abcd",
    },
  },
};

export const BASEMAP_OPTIONS = Object.values(BASEMAPS);

export function getBasemap(id: BasemapId): BasemapDefinition {
  return BASEMAPS[id] ?? BASEMAPS[DEFAULT_BASEMAP];
}
