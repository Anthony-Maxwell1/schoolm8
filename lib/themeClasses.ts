// utils/themeClasses.ts

export type ClassKey = "Tile" | "TileOuter";

export type Theme = {
    classes: Record<ClassKey, string>;
    TopBar?: string;
};

export type ThemeKey = "basic-minimal" | "retro" | "retro-mac" | "os" | "glass" | "blur";

export type ClassMap = Record<ClassKey, string>;
export type ThemeMap = Record<ThemeKey, Theme>;

export const tw = (classes: string) => classes;

export const themes: ThemeMap = {
    "basic-minimal": {
        classes: {
            TileOuter: tw("p-6"),
            Tile: tw(
                "h-full w-full bg-white rounded-2xl border border-neutral-200 shadow-sm flex flex-col overflow-hidden p-5",
            ),
        },
    },

    retro: {
        classes: {
            TileOuter: tw("relative p-5"),
            Tile: tw(
                "h-full w-full bg-yellow-300 border-[3px] border-black shadow-[6px_6px_0px_#000] flex flex-col overflow-hidden p-4 font-mono text-[13px]",
            ),
        },
        TopBar: `
      <div class="absolute top-0 left-0 right-0 h-6 bg-yellow-400 flex items-center px-3 text-xs uppercase tracking-wide">
        Retro Window
      </div>
    `,
    },

    "retro-mac": {
        classes: {
            TileOuter: tw(
                "relative pt-7 rounded-lg overflow-hidden p-2 shadow-[0_0_10px_0_rgba(0,0,0,0.3),0_4px_6px_-1px_rgba(0,0,0,0.5)] bg-gray-300 hover:shadow-[0_0_15px_0_rgba(0,0,0,0.4),0_6px_8px_-1px_rgba(0,0,0,0.6)] transition-shadow duration-200",
            ),
            Tile: tw(
                "relative z-20 h-full w-full bg-white flex flex-col overflow-hidden p-5 shadow-md rounded-sm hover:w-[100.4%] hover:h-[100.4%] hover:-translate-[0.2%] transition-all duration-200",
            ),
        },
        TopBar: `
        <div class="bg-[url('/images/themes/retro-mac/brushedmetal.png')] bg-repeat absolute inset-0 pointer-events-none opacity-40"></div>
      <div class="absolute top-0 left-0 right-0 h-7 flex items-center px-3 gap-2">


  <!-- Close button -->
  <div class="w-3.5 h-3.5 rounded-full
              bg-linear-to-b from-red-300 via-red-500 to-red-700
              border border-red-900/60
              shadow-inner
              relative hover:w-4 hover:h-4 transition-all duration-200 overflow-hidden">
      <div class="absolute top-px left-0.5 w-2 h-1 rounded-full bg-white/60 blur-[1px]"></div>
      <div class="absolute bottom-[0.5px] w-3 h-1 rounded-full bg-red-300/60 blur-[1px]"></div>
  </div>

  <!-- Minimise button -->
  <div class="w-3.5 h-3.5 rounded-full
              bg-linear-to-b from-yellow-200 via-yellow-400 to-yellow-600
              border border-yellow-900/60
              shadow-inner
              relative hover:w-4 hover:h-4 transition-all duration-200 overflow-hidden">
      <div class="absolute top-px left-0.5 w-2 h-1 rounded-full bg-white/60 blur-[1px]"></div>
      <div class="absolute bottom-[0.5px] w-3 h-1 rounded-full bg-yellow-200/60 blur-[1px]"></div>
  </div>

  <!-- Zoom button -->
  <div class="w-3.5 h-3.5 rounded-full
              bg-linear-to-b from-green-300 via-green-500 to-green-700
              border border-green-900/60
              shadow-inner
              relative hover:w-4 hover:h-4 transition-all duration-200 overflow-hidden">
      <div class="absolute top-px left-0.5 w-2 h-1 rounded-full bg-white/60 blur-[1px]"></div>
      <div class="absolute bottom-[0.5px] w-3 h-1 rounded-full bg-green-300/60 blur-[1px]"></div>
  </div>

  <!-- Optional toolbar title/content -->
  <div class="absolute left-1/2 top-1/2 -translate-1/2 flex-1 text-center text-xs font-semibold text-gray-700 select-none pointer-events-none font-mac">
    My Retro-Mac Window
  </div>

</div>

    `,
    },

    os: {
        classes: {
            TileOuter: tw("relative p-6"),
            Tile: tw(
                "h-full w-full rounded-2xl bg-linear-to-b from-white to-blue-50 border border-blue-100 shadow-lg flex flex-col overflow-hidden p-6",
            ),
        },
        TopBar: `
      <div class="absolute top-0 left-0 right-0 h-9 bg-white/70 backdrop-blur border-b border-blue-100 flex items-center px-4 text-sm font-semibold text-blue-700">
        Windows Panel
      </div>
    `,
    },

    glass: {
        classes: {
            TileOuter: tw("relative p-6"),
            Tile: tw(
                "h-full w-full rounded-3xl bg-white/40 backdrop-blur-xl border border-white/60 shadow-xl flex flex-col overflow-hidden p-6",
            ),
        },
        TopBar: `
      <div class="absolute top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-white/30 backdrop-blur-md border border-white/40 rounded-full text-xs font-medium">
        iOS Glass
      </div>
    `,
    },

    blur: {
        classes: {
            TileOuter: tw("relative p-6"),
            Tile: tw(
                "h-full w-full rounded-2xl bg-neutral-900/40 backdrop-blur-lg border border-white/10 shadow-2xl flex flex-col overflow-hidden text-white p-6",
            ),
        },
        TopBar: `
      <div class="absolute bottom-3 right-3 px-3 py-1 bg-black/40 backdrop-blur rounded-lg text-xs">
        Blur Panel
      </div>
    `,
    },
};

const DEFAULT_THEME = "retro-mac";

export const defaultClasses: ClassMap = themes[DEFAULT_THEME].classes;
export const defaultTopBar: string = themes[DEFAULT_THEME].TopBar || "";
