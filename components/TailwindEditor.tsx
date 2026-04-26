import { useState, type ComponentType } from "react";
import { Lightbulb } from "lucide-react";
import { embeddedDocs } from "../lib/docs";
export type TailwindParsed = {
    class: string;
    label: string;
    arg: string;
    component?: ComponentType<{ arg: string }>;
};

type TailwindSelectorOption = {
    value: string;
    label: string;
};

const TAILWIND_COLORS = [
    "red",
    "orange",
    "amber",
    "yellow",
    "lime",
    "green",
    "emerald",
    "teal",
    "cyan",
    "sky",
    "blue",
    "indigo",
    "violet",
    "purple",
    "fuchsia",
    "pink",
    "rose",
    "slate",
    "gray",
    "zinc",
    "neutral",
    "stone",
    "taupe",
    "mauve",
    "mist",
    "olive",
];

const TAILWIND_SHADES = [
    "50",
    "100",
    "200",
    "300",
    "400",
    "500",
    "600",
    "700",
    "800",
    "900",
    "950",
];
const TAILWIND_SCALE_VALUES = [
    "0",
    "px",
    "0.5",
    "1",
    "1.5",
    "2",
    "2.5",
    "3",
    "3.5",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    "10",
    "11",
    "12",
    "14",
    "16",
    "20",
    "24",
    "28",
    "32",
    "36",
    "40",
    "44",
    "48",
    "52",
    "56",
    "60",
    "64",
    "72",
    "80",
    "96",
];
const TAILWIND_KEYWORD_SIZES = [
    "2xs",
    "xs",
    "sm",
    "md",
    "lg",
    "xl",
    "2xl",
    "3xl",
    "4xl",
    "5xl",
    "6xl",
    "7xl",
    "8xl",
    "9xl",
];
const TAILWIND_SPECIAL_SIZES = [
    "screen",
    "full",
    "auto",
    "min",
    "max",
    "fit",
    "svw",
    "lvw",
    "dvw",
    "svh",
    "lvh",
    "dvh",
];

function TailwindSelectPicker({
    arg,
    options,
}: {
    arg: string;
    options: TailwindSelectorOption[];
}) {
    const fallback = options[0]?.value ?? "";
    const selected = options.some((opt) => opt.value === arg) ? arg : fallback;
    return (
        <select defaultValue={selected} className="text-black">
            {options.map((option) => (
                <option key={option.value} value={option.value}>
                    {option.label}
                </option>
            ))}
        </select>
    );
}

function makeTailwindSelectComponent(
    options: TailwindSelectorOption[],
): ComponentType<{ arg: string }> {
    return function TailwindRuleSelect({ arg }: { arg: string }) {
        return <TailwindSelectPicker arg={arg} options={options} />;
    };
}

function TailwindColorPicker({ arg }: { arg: string }) {
    const [initialColor, initialShade] = arg.split("-");
    const [color, setColor] = useState(
        TAILWIND_COLORS.includes(initialColor) ? initialColor : "blue",
    );
    const [shade, setShade] = useState(
        TAILWIND_SHADES.includes(initialShade) ? initialShade : "500",
    );

    return (
        <div className="flex flex-row gap-2">
            <select
                name="Color"
                id="color"
                className="text-black"
                value={color}
                onChange={(e) => setColor(e.target.value)}
            >
                {TAILWIND_COLORS.map((value) => (
                    <option key={value} value={value}>
                        {value.charAt(0).toUpperCase() + value.slice(1)}
                    </option>
                ))}
            </select>
            <select
                name="Shade"
                id="shade"
                className="text-black"
                value={shade}
                onChange={(e) => setShade(e.target.value)}
            >
                {TAILWIND_SHADES.map((value) => (
                    <option key={value} value={value}>
                        {value}
                    </option>
                ))}
            </select>
        </div>
    );
}
function TailwindSizePicker({
    arg,
    excludeSpecial,
    keyworded,
    range,
}: {
    arg: string;
    excludeSpecial?: boolean;
    keyworded?: boolean;
    range?: [number, number];
}) {
    const [special, setSpecial] = useState(
        excludeSpecial ? "" : TAILWIND_SPECIAL_SIZES.includes(arg) ? arg : "",
    );
    const keywordOptions = range
        ? TAILWIND_KEYWORD_SIZES.slice(range[0], range[1])
        : TAILWIND_KEYWORD_SIZES;
    const regularOptions = keyworded ? keywordOptions : TAILWIND_SCALE_VALUES;

    const [regular, setRegular] = useState(
        regularOptions.includes(arg) ? arg : (regularOptions[0] ?? "4"),
    );
    return (
        <div>
            {!excludeSpecial && (
                <select
                    name="Special"
                    id="special"
                    value={special}
                    onChange={(e) => setSpecial(e.target.value)}
                    className="text-black"
                >
                    {TAILWIND_SPECIAL_SIZES.map((value) => (
                        <option key={value} value={value}>
                            {value.charAt(0).toUpperCase() + value.slice(1)}
                        </option>
                    ))}
                    <option value="">Regular</option>
                </select>
            )}
            {special == "" && (
                <select
                    className="text-black"
                    value={regular}
                    onChange={(e) => setRegular(e.target.value)}
                >
                    {regularOptions.map((value) => {
                        return (
                            <option key={value} value={value}>
                                {value}
                            </option>
                        );
                    })}
                </select>
            )}
        </div>
    );
}

function TailwindNumberPicker({ arg }: { arg: string }) {
    return <input type="number" defaultValue={arg} className="text-black" />;
}

function TailwindTextInputPicker({ arg }: { arg: string }) {
    return <input type="text" defaultValue={arg} className="text-black" />;
}

const TransitionSelector = makeTailwindSelectComponent([
    { value: "none", label: "None" },
    { value: "all", label: "All" },
    { value: "colors", label: "Colors" },
    { value: "opacity", label: "Opacity" },
    { value: "shadow", label: "Shadow" },
    { value: "transform", label: "Transform" },
]);

const DisplaySelector = makeTailwindSelectComponent([
    { value: "flex", label: "Flex" },
    { value: "grid", label: "Grid" },
    { value: "block", label: "Block" },
    { value: "inline-block", label: "Inline Block" },
    { value: "inline", label: "Inline" },
    { value: "hidden", label: "Hidden" },
    { value: "contents", label: "Contents" },
]);

const PositionSelector = makeTailwindSelectComponent([
    { value: "static", label: "Static" },
    { value: "relative", label: "Relative" },
    { value: "absolute", label: "Absolute" },
    { value: "fixed", label: "Fixed" },
    { value: "sticky", label: "Sticky" },
]);

const FlexDirectionSelector = makeTailwindSelectComponent([
    { value: "row", label: "Row" },
    { value: "row-reverse", label: "Row Reverse" },
    { value: "col", label: "Column" },
    { value: "col-reverse", label: "Column Reverse" },
]);

const FlexWrapSelector = makeTailwindSelectComponent([
    { value: "wrap", label: "Wrap" },
    { value: "nowrap", label: "No Wrap" },
    { value: "wrap-reverse", label: "Wrap Reverse" },
]);

const AlignItemsSelector = makeTailwindSelectComponent([
    { value: "start", label: "Start" },
    { value: "center", label: "Center" },
    { value: "end", label: "End" },
    { value: "stretch", label: "Stretch" },
    { value: "baseline", label: "Baseline" },
]);

const JustifySelector = makeTailwindSelectComponent([
    { value: "start", label: "Start" },
    { value: "center", label: "Center" },
    { value: "end", label: "End" },
    { value: "between", label: "Between" },
    { value: "around", label: "Around" },
    { value: "evenly", label: "Evenly" },
]);

const TextAlignSelector = makeTailwindSelectComponent([
    { value: "left", label: "Left" },
    { value: "center", label: "Center" },
    { value: "right", label: "Right" },
    { value: "justify", label: "Justify" },
    { value: "start", label: "Start" },
    { value: "end", label: "End" },
]);

const GradientDirectionSelector = makeTailwindSelectComponent([
    { value: "t", label: "Top" },
    { value: "tr", label: "Top Right" },
    { value: "r", label: "Right" },
    { value: "br", label: "Bottom Right" },
    { value: "b", label: "Bottom" },
    { value: "bl", label: "Bottom Left" },
    { value: "l", label: "Left" },
    { value: "tl", label: "Top Left" },
]);

const EasingSelector = makeTailwindSelectComponent([
    { value: "linear", label: "Linear" },
    { value: "in", label: "Ease In" },
    { value: "out", label: "Ease Out" },
    { value: "in-out", label: "Ease In Out" },
    { value: "initial", label: "Initial" },
]);

const rules: Array<{
    match: RegExp;
    cls: string;
    label: string;
    extract: (input: string) => string;
    component?: ComponentType<{ arg: string }>;
}> = [
    // Common layout + display
    {
        match: /^flex$/,
        cls: "display-flex",
        label: "Display (Flex)",
        extract: () => "flex",
        component: DisplaySelector,
    },
    {
        match: /^grid$/,
        cls: "display-grid",
        label: "Display (Grid)",
        extract: () => "grid",
        component: DisplaySelector,
    },
    {
        match: /^block$/,
        cls: "display-block",
        label: "Display (Block)",
        extract: () => "block",
        component: DisplaySelector,
    },
    {
        match: /^inline-block$/,
        cls: "display-inline-block",
        label: "Display (Inline Block)",
        extract: () => "inline-block",
        component: DisplaySelector,
    },
    {
        match: /^inline$/,
        cls: "display-inline",
        label: "Display (Inline)",
        extract: () => "inline",
        component: DisplaySelector,
    },
    {
        match: /^hidden$/,
        cls: "display-hidden",
        label: "Display (Hidden)",
        extract: () => "hidden",
        component: DisplaySelector,
    },
    {
        match: /^contents$/,
        cls: "display-contents",
        label: "Display (Contents)",
        extract: () => "contents",
        component: DisplaySelector,
    },
    {
        match: /^container$/,
        cls: "container",
        label: "Container",
        extract: () => "default",
    },

    // Flexbox
    {
        match: /^flex-(row|col)(-reverse)?$/,
        cls: "flex-direction",
        label: "Flex Direction",
        extract: (s) => s.replace(/^flex-/, ""),
        component: FlexDirectionSelector,
    },
    {
        match: /^flex-wrap(-reverse)?$/,
        cls: "flex-wrap",
        label: "Flex Wrap",
        extract: (s) => s.replace(/^flex-/, ""),
        component: FlexWrapSelector,
    },
    {
        match: /^flex-(1|auto|initial|none)$/,
        cls: "flex",
        label: "Flex",
        extract: (s) => s.replace(/^flex-/, ""),
    },
    {
        match: /^grow(-0)?$/,
        cls: "flex-grow",
        label: "Flex Grow",
        extract: (s) => s.replace(/^grow-?/, "") || "1",
    },
    {
        match: /^shrink(-0)?$/,
        cls: "flex-shrink",
        label: "Flex Shrink",
        extract: (s) => s.replace(/^shrink-?/, "") || "1",
    },
    {
        match: /^basis-/,
        cls: "flex-basis",
        label: "Flex Basis",
        extract: (s) => s.replace(/^basis-/, ""),
    },
    {
        match: /^items-/,
        cls: "align-items",
        label: "Align Items",
        extract: (s) => s.replace(/^items-/, ""),
        component: AlignItemsSelector,
    },
    {
        match: /^justify-/,
        cls: "justify-content",
        label: "Justify Content",
        extract: (s) => s.replace(/^justify-/, ""),
        component: JustifySelector,
    },
    {
        match: /^content-/,
        cls: "align-content",
        label: "Align Content",
        extract: (s) => s.replace(/^content-/, ""),
    },
    {
        match: /^self-/,
        cls: "align-self",
        label: "Align Self",
        extract: (s) => s.replace(/^self-/, ""),
    },
    {
        match: /^order-/,
        cls: "order",
        label: "Order",
        extract: (s) => s.replace(/^order-/, ""),
    },

    // Grid
    {
        match: /^grid-cols-/,
        cls: "grid-template-columns",
        label: "Grid Columns",
        extract: (s) => s.replace(/^grid-cols-/, ""),
    },
    {
        match: /^grid-rows-/,
        cls: "grid-template-rows",
        label: "Grid Rows",
        extract: (s) => s.replace(/^grid-rows-/, ""),
    },
    {
        match: /^col-(span|start|end)-/,
        cls: "grid-column",
        label: "Grid Column",
        extract: (s) => s.replace(/^col-/, ""),
    },
    {
        match: /^row-(span|start|end)-/,
        cls: "grid-row",
        label: "Grid Row",
        extract: (s) => s.replace(/^row-/, ""),
    },
    {
        match: /^auto-(cols|rows)-/,
        cls: "grid-auto",
        label: "Grid Auto",
        extract: (s) => s.replace(/^auto-/, ""),
    },
    {
        match: /^place-(items|content|self)-/,
        cls: "place",
        label: "Place",
        extract: (s) => s.replace(/^place-/, ""),
    },

    // Spacing
    {
        match: /^gap-(?![xy]-)/,
        cls: "gap",
        label: "Gap",
        extract: (s) => s.replace(/^gap-/, ""),
        component: TailwindSizePicker,
    },
    {
        match: /^gap-[xy]-/,
        cls: "gap-axis",
        label: "Gap Axis",
        extract: (s) => s.replace(/^gap-/, ""),
        component: TailwindSizePicker,
    },
    {
        match: /^space-[xy]-/,
        cls: "space-between",
        label: "Space Between",
        extract: (s) => s.replace(/^space-/, ""),
    },
    {
        match: /^bg-(?!gradient-to-|clip-|origin-|repeat$|no-repeat$|repeat-x$|repeat-y$|round$|space$|linear-|radial-|conic-|none$|cover$|contain$|auto$|fixed$|local$|scroll$|center$|top$|right$|bottom$|left$|\[).+/,
        cls: "background-color",
        label: "Background Color",
        extract: (s) => s.replace(/^bg-/, ""),
        component: TailwindColorPicker,
    },
    {
        match: /^text-(?!xs$|sm$|base$|lg$|xl$|\d+xl$|left$|center$|right$|justify$|start$|end$).+/,
        cls: "text-color",
        label: "Text Color",
        extract: (s) => s.replace(/^text-/, ""),
        component: TailwindColorPicker,
    },
    {
        match: /^font-/,
        cls: "font-family-or-weight",
        label: "Font",
        extract: (s) => s.replace(/^font-/, ""),
    },
    {
        match: /^text-(xs|sm|base|lg|xl|\d+xl)$/,
        cls: "font-size",
        label: "Font Size",
        extract: (s) => s.replace(/^text-/, ""),
    },
    {
        match: /^leading-/,
        cls: "line-height",
        label: "Line Height",
        extract: (s) => s.replace(/^leading-/, ""),
    },
    {
        match: /^tracking-/,
        cls: "letter-spacing",
        label: "Letter Spacing",
        extract: (s) => s.replace(/^tracking-/, ""),
    },
    {
        match: /^line-clamp-/,
        cls: "line-clamp",
        label: "Line Clamp",
        extract: (s) => s.replace(/^line-clamp-/, ""),
    },
    {
        match: /^text-(left|center|right|justify|start|end)$/,
        cls: "text-align",
        label: "Text Align",
        extract: (s) => s.replace(/^text-/, ""),
        component: TextAlignSelector,
    },
    {
        match: /^(uppercase|lowercase|capitalize|normal-case)$/,
        cls: "text-transform",
        label: "Text Transform",
        extract: (s) => s,
    },
    {
        match: /^(underline|overline|line-through|no-underline)$/,
        cls: "text-decoration-line",
        label: "Text Decoration",
        extract: (s) => s,
    },
    {
        match: /^decoration-/,
        cls: "text-decoration",
        label: "Decoration",
        extract: (s) => s.replace(/^decoration-/, ""),
    },
    {
        match: /^(italic|not-italic)$/,
        cls: "font-style",
        label: "Font Style",
        extract: (s) => s,
    },

    // Sizing
    {
        match: /^w-/,
        cls: "width",
        label: "Width",
        extract: (s) => s.replace(/^w-/, ""),
        component: TailwindSizePicker,
    },
    {
        match: /^h-/,
        cls: "height",
        label: "Height",
        extract: (s) => s.replace(/^h-/, ""),
        component: TailwindSizePicker,
    },
    {
        match: /^min-w-/,
        cls: "min-width",
        label: "Min Width",
        extract: (s) => s.replace(/^min-w-/, ""),
        component: TailwindSizePicker,
    },
    {
        match: /^max-w-/,
        cls: "max-width",
        label: "Max Width",
        extract: (s) => s.replace(/^max-w-/, ""),
        component: TailwindSizePicker,
    },
    {
        match: /^min-h-/,
        cls: "min-height",
        label: "Min Height",
        extract: (s) => s.replace(/^min-h-/, ""),
        component: TailwindSizePicker,
    },
    {
        match: /^max-h-/,
        cls: "max-height",
        label: "Max Height",
        extract: (s) => s.replace(/^max-h-/, ""),
        component: TailwindSizePicker,
    },
    {
        match: /^size-/,
        cls: "size",
        label: "Size",
        extract: (s) => s.replace(/^size-/, ""),
        component: TailwindSizePicker,
    },

    // Positioning
    {
        match: /^(static|fixed|absolute|relative|sticky)$/,
        cls: "position",
        label: "Position",
        extract: (s) => s,
        component: PositionSelector,
    },
    {
        match: /^inset-(?![xy]-)/,
        cls: "inset",
        label: "Inset",
        extract: (s) => s.replace(/^inset-/, ""),
        component: TailwindSizePicker,
    },
    {
        match: /^inset-[xy]-/,
        cls: "inset-axis",
        label: "Inset Axis",
        extract: (s) => s.replace(/^inset-/, ""),
        component: TailwindSizePicker,
    },
    {
        match: /^top-/,
        cls: "top",
        label: "Top",
        extract: (s) => s.replace(/^top-/, ""),
        component: TailwindSizePicker,
    },
    {
        match: /^right-/,
        cls: "right",
        label: "Right",
        extract: (s) => s.replace(/^right-/, ""),
        component: TailwindSizePicker,
    },
    {
        match: /^p-/,
        cls: "padding",
        label: "Padding",
        extract: (s) => s.replace(/^p-/, ""),
        component: TailwindSizePicker,
    },
    {
        match: /^p[xy]-/,
        cls: "padding-axis",
        label: "Padding Axis",
        extract: (s) => s.replace(/^p/, ""),
        component: TailwindSizePicker,
    },
    {
        match: /^p[trbl]-/,
        cls: "padding-side",
        label: "Padding Side",
        extract: (s) => s.replace(/^p/, ""),
        component: TailwindSizePicker,
    },
    {
        match: /^m-/,
        cls: "margin",
        label: "Margin",
        extract: (s) => s.replace(/^m-/, ""),
        component: TailwindSizePicker,
    },
    {
        match: /^m[xy]-/,
        cls: "margin-axis",
        label: "Margin Axis",
        extract: (s) => s.replace(/^m/, ""),
        component: TailwindSizePicker,
    },
    {
        match: /^m[trbl]-/,
        cls: "margin-side",
        label: "Margin Side",
        extract: (s) => s.replace(/^m/, ""),
        component: TailwindSizePicker,
    },
    {
        match: /^z-/,
        cls: "z-index",
        label: "Z Index",
        extract: (s) => s.replace(/^z-/, ""),
        component: TailwindNumberPicker,
    },
    {
        match: /^overflow(-[xy])?-/,
        cls: "overflow",
        label: "Overflow",
        extract: (s) => s.replace(/^overflow-?/, ""),
    },

    // Borders + radius
    {
        match: /^rounded/,
        cls: "border-radius",
        label: "Border Radius",
        extract: (s) => s.replace(/^rounded-?/, ""),
        component: TailwindSizePicker,
    },
    {
        match: /^border(-[trblxyse])?(-\d+)?$/,
        cls: "border-width",
        label: "Border Width",
        extract: (s) => {
            const match = s.match(/^border(?:-([trblxyse]))?(?:-(\d+))?$/);
            if (!match) return "";

            const side = match[1] || "";
            const width = match[2] || "default";

            return side ? `${side}-${width}` : width;
        },
    },
    {
        match: /^border-/,
        cls: "border-color-or-style",
        label: "Border",
        extract: (s) => s.replace(/^border-/, ""),
        component: TailwindColorPicker,
    },
    {
        match: /^divide-[xy]-/,
        cls: "divide-width",
        label: "Divide",
        extract: (s) => s.replace(/^divide-/, ""),
    },
    {
        match: /^divide-(solid|dashed|dotted|double|none)$/,
        cls: "divide-style",
        label: "Divide Style",
        extract: (s) => s.replace(/^divide-/, ""),
    },
    {
        match: /^ring(-\d+)?$/,
        cls: "ring-width",
        label: "Ring Width",
        extract: (s) => s.replace(/^ring-?/, "") || "default",
    },
    {
        match: /^ring-/,
        cls: "ring",
        label: "Ring",
        extract: (s) => s.replace(/^ring-/, ""),
        component: TailwindColorPicker,
    },
    {
        match: /^outline(-\d+)?$/,
        cls: "outline-width",
        label: "Outline Width",
        extract: (s) => s.replace(/^outline-?/, "") || "default",
    },
    {
        match: /^outline-/,
        cls: "outline",
        label: "Outline",
        extract: (s) => s.replace(/^outline-/, ""),
    },

    // Effects
    {
        match: /^shadow/,
        cls: "box-shadow",
        label: "Shadow",
        extract: (s) => s.replace(/^shadow-?/, "") || "default",
        component: ({ arg }: { arg: string }) => {
            console.log(arg);
            if (["2xs", "xs", "sm", "md", "lg", "xl", "2xl"].includes(arg)) {
                return (
                    <TailwindSizePicker
                        arg={arg}
                        excludeSpecial={true}
                        keyworded={true}
                        range={[0, 7]}
                    />
                );
            } else {
                return <TailwindColorPicker arg={arg} />;
            }
        },
    },
    {
        match: /^opacity-/,
        cls: "opacity",
        label: "Opacity",
        extract: (s) => s.replace(/^opacity-/, ""),
        component: TailwindTextInputPicker,
    },
    {
        match: /^mix-blend-/,
        cls: "mix-blend-mode",
        label: "Mix Blend",
        extract: (s) => s.replace(/^mix-blend-/, ""),
    },
    {
        match: /^bg-blend-/,
        cls: "background-blend-mode",
        label: "Background Blend",
        extract: (s) => s.replace(/^bg-blend-/, ""),
    },

    // Transforms
    {
        match: /^transform$/,
        cls: "transform",
        label: "Transform",
        extract: () => "enabled",
    },
    {
        match: /^origin-/,
        cls: "transform-origin",
        label: "Transform Origin",
        extract: (s) => s.replace(/^origin-/, ""),
    },
    {
        match: /^scale(-[xy])?-/,
        cls: "scale",
        label: "Scale",
        extract: (s) => s.replace(/^scale-?/, ""),
    },
    {
        match: /^rotate-/,
        cls: "rotate",
        label: "Rotate",
        extract: (s) => s.replace(/^rotate-/, ""),
        component: TailwindTextInputPicker,
    },
    {
        match: /^translate-[xy]-/,
        cls: "translate",
        label: "Translate",
        extract: (s) => s.replace(/^translate-/, ""),
    },
    {
        match: /^skew-[xy]-/,
        cls: "skew",
        label: "Skew",
        extract: (s) => s.replace(/^skew-/, ""),
    },

    // Transitions + animation
    {
        match: /^transition(-[a-z-]+)?$/,
        cls: "transition",
        label: "Transition",
        extract: (s) => s.replace(/^transition-?/, "") || "default",
        component: TransitionSelector,
    },
    {
        match: /^duration-/,
        cls: "transition-duration",
        label: "Transition Duration",
        extract: (s) => s.replace(/^duration-/, ""),
        component: TailwindNumberPicker,
    },
    {
        match: /^ease-/,
        cls: "transition-timing",
        label: "Easing",
        extract: (s) => s.replace(/^ease-/, ""),
        component: EasingSelector,
    },
    {
        match: /^delay-/,
        cls: "transition-delay",
        label: "Delay",
        extract: (s) => s.replace(/^delay-/, ""),
        component: TailwindTextInputPicker,
    },
    {
        match: /^animate-/,
        cls: "animation",
        label: "Animation",
        extract: (s) => s.replace(/^animate-/, ""),
    },

    // Filters + backdrop
    {
        match: /^(blur|contrast|grayscale|invert|sepia|saturate|hue-rotate|brightness)-/,
        cls: "filter",
        label: "Filter",
        extract: (s) => s,
    },
    {
        match: /^backdrop-(blur|contrast|grayscale|invert|opacity|sepia|saturate|hue-rotate|brightness)-/,
        cls: "backdrop-filter",
        label: "Backdrop Filter",
        extract: (s) => s.replace(/^backdrop-/, ""),
    },

    // Interactivity
    {
        match: /^cursor-/,
        cls: "cursor",
        label: "Cursor",
        extract: (s) => s.replace(/^cursor-/, ""),
    },
    {
        match: /^pointer-events-/,
        cls: "pointer-events",
        label: "Pointer Events",
        extract: (s) => s.replace(/^pointer-events-/, ""),
    },
    {
        match: /^select-/,
        cls: "user-select",
        label: "User Select",
        extract: (s) => s.replace(/^select-/, ""),
    },
    {
        match: /^resize(-[xy])?$/,
        cls: "resize",
        label: "Resize",
        extract: (s) => s.replace(/^resize-?/, "") || "both",
    },
    {
        match: /^scroll-(m|p)([trblxyse])?-/,
        cls: "scroll-spacing",
        label: "Scroll Margin/Padding",
        extract: (s) => s.replace(/^scroll-/, ""),
    },
    {
        match: /^snap-/,
        cls: "scroll-snap",
        label: "Scroll Snap",
        extract: (s) => s.replace(/^snap-/, ""),
    },

    // SVG + accessibility
    {
        match: /^fill-/,
        cls: "svg-fill",
        label: "SVG Fill",
        extract: (s) => s.replace(/^fill-/, ""),
    },
    {
        match: /^stroke(-\d+)?$/,
        cls: "svg-stroke-width",
        label: "SVG Stroke Width",
        extract: (s) => s.replace(/^stroke-?/, "") || "default",
    },
    {
        match: /^stroke-/,
        cls: "svg-stroke",
        label: "SVG Stroke",
        extract: (s) => s.replace(/^stroke-/, ""),
    },
    {
        match: /^sr-only$/,
        cls: "screen-reader-only",
        label: "Screen Reader",
        extract: () => "only",
    },
    {
        match: /^not-sr-only$/,
        cls: "screen-reader-reset",
        label: "Screen Reader",
        extract: () => "reset",
    },

    // Position offsets
    {
        match: /^left-/,
        cls: "left",
        label: "Left",
        extract: (s) => s.replace(/^left-/, ""),
        component: TailwindSizePicker,
    },
    {
        match: /^bottom-/,
        cls: "bottom",
        label: "Bottom",
        extract: (s) => s.replace(/^bottom-/, ""),
        component: TailwindSizePicker,
    },
    // Gradients + advanced backgrounds
    {
        match: /^bg-gradient-to-/,
        cls: "background-gradient-direction",
        label: "Gradient Direction",
        extract: (s) => s.replace(/^bg-gradient-to-/, ""),
        component: GradientDirectionSelector,
    },
    {
        match: /^from-/,
        cls: "gradient-from",
        label: "Gradient From",
        extract: (s) => s.replace(/^from-/, ""),
        component: TailwindColorPicker,
    },
    {
        match: /^via-/,
        cls: "gradient-via",
        label: "Gradient Via",
        extract: (s) => s.replace(/^via-/, ""),
        component: TailwindColorPicker,
    },
    {
        match: /^to-/,
        cls: "gradient-to",
        label: "Gradient To",
        extract: (s) => s.replace(/^to-/, ""),
        component: TailwindColorPicker,
    },
    {
        match: /^bg-(none|cover|contain|auto|fixed|local|scroll|center|top|right|bottom|left)$/,
        cls: "background",
        label: "Background",
        extract: (s) => s.replace(/^bg-/, ""),
    },
    {
        match: /^bg-(clip|origin)-/,
        cls: "background-clip-origin",
        label: "Background Clip/Origin",
        extract: (s) => s.replace(/^bg-/, ""),
    },
    {
        match: /^bg-(repeat|no-repeat|repeat-x|repeat-y|round|space)$/,
        cls: "background-repeat",
        label: "Background Repeat",
        extract: (s) => s.replace(/^bg-/, ""),
    },
    {
        match: /^bg-(linear|radial|conic)-/,
        cls: "background-image-advanced",
        label: "Background Image",
        extract: (s) => s.replace(/^bg-/, ""),
    },
    {
        match: /^bg-\[/,
        cls: "background-arbitrary",
        label: "Background (Arbitrary)",
        extract: (s) => s.replace(/^bg-/, ""),
    },

    // Arbitrary values catch-all
    {
        match: /^[a-z-]+-\[/,
        cls: "arbitrary-utility",
        label: "Arbitrary Utility",
        extract: (s) => s,
    },
    {
        match: /^\[[a-z-]+:.+\]$/,
        cls: "arbitrary-property",
        label: "Arbitrary Property",
        extract: (s) => s,
    },
];

export function parseTailwindClass(input: string): TailwindParsed {
    for (const rule of rules) {
        if (rule.match.test(input)) {
            return {
                class: rule.cls,
                label: rule.label,
                arg: rule.extract(input) || "default",
                component: rule.component,
            };
        }
    }

    return {
        class: "unknown",
        label: "Unknown",
        arg: input,
    };
}

export function TailwindEditor({
    classes,
    updateClasses,
}: {
    classes: string[];
    updateClasses?: (newClasses: string[]) => void;
}) {
    return (
        <div className="flex flex-col gap-3">
            {classes.map((cls) => {
                const parsed = parseTailwindClass(cls);
                if (parsed.class === "unknown") return null;

                const Component = parsed.component;

                return (
                    <div
                        key={cls}
                        className="
                            group flex items-center justify-between
                            bg-white/70 backdrop-blur-md
                            border border-gray-200
                            rounded-xl px-4 py-3
                            shadow-sm
                            hover:shadow-md hover:border-gray-300
                            transition-all duration-200
                        "
                    >
                        {/* LEFT: label */}
                        <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-gray-800">
                                    {parsed.label}
                                </span>

                                <button
                                    className="
            flex items-center justify-center
            w-5 h-5
            rounded-full
            bg-green-100 text-green-600
            cursor-pointer
            hover:bg-green-200
        "
                                    onClick={() => {
                                        if (
                                            embeddedDocs.customization.visualEditor.classes[
                                                parsed.class
                                            ]
                                        ) {
                                            alert(
                                                embeddedDocs.customization.visualEditor.classes[
                                                    parsed.class
                                                ],
                                            );
                                        } else {
                                            alert("No documentation available for this class.");
                                        }
                                    }}
                                >
                                    <Lightbulb size={14} />
                                </button>
                            </div>

                            <span className="text-xs text-gray-500 font-mono">{parsed.class}</span>
                        </div>

                        {/* RIGHT: control */}
                        <div className="flex items-center">
                            <div
                                className="
                                    bg-white border border-gray-300
                                    rounded-md px-2 py-1
                                    shadow-inner
                                    group-hover:border-gray-400
                                    transition
                                "
                            >
                                {Component ? (
                                    <Component arg={parsed.arg} />
                                ) : (
                                    <TailwindTextInputPicker arg={parsed.arg} />
                                )}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
