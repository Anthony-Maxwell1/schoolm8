import { ComponentType } from "react";

/* =======================
   Registry Types
======================= */

export type RegistryNode = {
    id: string;
    label: string;
    children?: RegistryNode[];
    component?: ComponentType<any>;
    defaultProps?: Record<string, any>;
};

export type RegistryRoot = RegistryNode[];

/* =======================
   Example Components
======================= */

import { ClockTile } from "@/components/tiles/ClockTile";
import { WeatherTile } from "@/components/tiles/WeatherTile";
import { NavPanel } from "@/components/panels/NavPanel";

/* =======================
   Tile Registry
======================= */

export const TileRegistry: RegistryRoot = [
    {
        id: "info",
        label: "Information",
        children: [
            {
                id: "clock",
                label: "Clock",
                component: ClockTile,
                defaultProps: { timezone: "local" },
            },
            {
                id: "weather",
                label: "Weather",
                component: WeatherTile,
                defaultProps: { location: "Sydney" },
            },
        ],
    },
];

/* =======================
   Panel Registry
======================= */

export const PanelRegistry: RegistryRoot = [
    {
        id: "navigation",
        label: "Navigation",
        children: [
            {
                id: "nav-panel",
                label: "Navigation Panel",
                component: NavPanel,
            },
        ],
    },
];
