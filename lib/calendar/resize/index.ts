import { createResizePlugin as createLegacyResizePlugin } from "./legacy-core";

type ResizePlugin = {
    name: string;
    createTimeGridEventResizer: (...args: never[]) => void;
    createDateGridEventResizer: (...args: never[]) => void;
    setInterval: (minutes: number) => void;
};

/** Local adapter for the last MIT-licensed ScheduleX v3.7.3 resize plugin. */
export function createResizePlugin(minutesPerInterval = 15): ResizePlugin {
    return createLegacyResizePlugin(minutesPerInterval) as ResizePlugin;
}
