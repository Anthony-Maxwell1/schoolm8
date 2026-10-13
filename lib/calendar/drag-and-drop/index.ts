import { createDragAndDropPlugin as createLegacyDragAndDropPlugin } from "./legacy-core";

type LegacyPlugin = {
    name: string;
    createTimeGridDragHandler: (...args: never[]) => unknown;
    createDateGridDragHandler: (...args: never[]) => unknown;
    createMonthGridDragHandler: (...args: never[]) => unknown;
    setInterval: (minutes: number) => void;
};

export type ScheduleXDragAndDropPlugin = LegacyPlugin & {
    startTimeGridDrag: LegacyPlugin["createTimeGridDragHandler"];
    startDateGridDrag: LegacyPlugin["createDateGridDragHandler"];
    startMonthGridDrag: LegacyPlugin["createMonthGridDragHandler"];
};

export function createDragAndDropPlugin(minutesPerInterval = 15): ScheduleXDragAndDropPlugin {
    const legacy = createLegacyDragAndDropPlugin(minutesPerInterval) as LegacyPlugin;
    return Object.assign(legacy, {
        startTimeGridDrag: legacy.createTimeGridDragHandler.bind(legacy),
        startDateGridDrag: legacy.createDateGridDragHandler.bind(legacy),
        startMonthGridDrag: legacy.createMonthGridDragHandler.bind(legacy),
    });
}
