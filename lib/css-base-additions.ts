// ─────────────────────────────────────────────────────────────────────────────
// ADD THIS BLOCK inside defaultCss, at the same level as "tiles", under
// components: { tiles: {...}, base: { ... } }
// ─────────────────────────────────────────────────────────────────────────────

export const baseCss = {
    // ── Buttons ────────────────────────────────────────────────────────────────
    button: {
        // Shared base — applied to every button variant
        root: {
            "ROOT-STYLE":
                "inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-all select-none disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus)] focus-visible:ring-offset-2",
        },

        // ── Variants
        primary: {
            "ROOT-STYLE":
                "bg-[var(--color-primary)] text-[var(--color-on-primary)] hover:bg-[var(--color-primary-hover)] active:bg-[var(--color-primary-active)] shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)]",
        },
        secondary: {
            "ROOT-STYLE":
                "bg-[var(--color-secondary)] text-[var(--color-on-secondary)] hover:bg-[var(--color-secondary-hover)] shadow-[var(--shadow-sm)]",
        },
        outline: {
            "ROOT-STYLE":
                "border border-[var(--color-border)] bg-transparent text-[var(--color-text-primary)] hover:bg-[var(--color-muted)] hover:border-[var(--color-border-strong)]",
        },
        ghost: {
            "ROOT-STYLE":
                "bg-transparent text-[var(--color-text-secondary)] hover:bg-[var(--color-muted)] hover:text-[var(--color-text-primary)]",
        },
        danger: {
            "ROOT-STYLE":
                "bg-[var(--color-danger)] text-white hover:opacity-90 active:opacity-80 shadow-[var(--shadow-sm)]",
        },
        success: {
            "ROOT-STYLE":
                "bg-[var(--color-success)] text-white hover:opacity-90 active:opacity-80 shadow-[var(--shadow-sm)]",
        },
        link: {
            "ROOT-STYLE":
                "bg-transparent text-[var(--color-primary)] underline-offset-4 hover:underline p-0 h-auto",
        },

        // ── Sizes
        xs: {
            "ROOT-STYLE": "h-7 px-2.5 text-xs rounded-[var(--radius-sm)]",
        },
        sm: {
            "ROOT-STYLE": "h-8 px-3 text-sm rounded-[var(--radius-md)]",
        },
        md: {
            "ROOT-STYLE": "h-10 px-4 text-sm rounded-[var(--radius-md)]",
        },
        lg: {
            "ROOT-STYLE": "h-11 px-5 text-base rounded-[var(--radius-md)]",
        },
        xl: {
            "ROOT-STYLE": "h-13 px-7 text-base rounded-[var(--radius-lg)]",
        },

        // ── Icon-only button
        iconSm: {
            "ROOT-STYLE": "h-8 w-8 rounded-[var(--radius-md)] p-0",
        },
        iconMd: {
            "ROOT-STYLE": "h-10 w-10 rounded-[var(--radius-md)] p-0",
        },
        iconLg: {
            "ROOT-STYLE": "h-11 w-11 rounded-[var(--radius-lg)] p-0",
        },
    },

    // ── Inputs ─────────────────────────────────────────────────────────────────
    input: {
        root: {
            "ROOT-STYLE": "flex flex-col gap-1.5",
        },
        label: {
            "ROOT-STYLE":
                "font-[family-name:var(--font-body)] text-[11px] font-medium tracking-[0.1em] uppercase text-[var(--color-text-tertiary)]",
        },
        field: {
            "ROOT-STYLE":
                "flex h-10 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-3 py-2 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-disabled)] transition-[border-color,box-shadow] duration-[var(--duration-fast)] focus:outline-none focus:border-[var(--color-focus)] focus:shadow-[var(--shadow-focus)] disabled:cursor-not-allowed disabled:opacity-50",
        },
        fieldSm: {
            "ROOT-STYLE":
                "flex h-8 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-2.5 py-1.5 text-xs text-[var(--color-text-primary)] placeholder:text-[var(--color-text-disabled)] transition-[border-color,box-shadow] duration-[var(--duration-fast)] focus:outline-none focus:border-[var(--color-focus)] focus:shadow-[var(--shadow-focus)]",
        },
        fieldLg: {
            "ROOT-STYLE":
                "flex h-12 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-4 py-3 text-base text-[var(--color-text-primary)] placeholder:text-[var(--color-text-disabled)] transition-[border-color,box-shadow] duration-[var(--duration-fast)] focus:outline-none focus:border-[var(--color-focus)] focus:shadow-[var(--shadow-focus)]",
        },
        hint: {
            "ROOT-STYLE": "text-xs text-[var(--color-text-tertiary)]",
        },
        error: {
            "ROOT-STYLE": "text-xs text-[var(--color-danger)]",
        },
        errorField: {
            "ROOT-STYLE":
                "border-[var(--color-danger)] focus:border-[var(--color-danger)] focus:shadow-[0_0_0_3px_rgba(192,57,43,0.2)]",
        },
    },

    // ── Textarea ───────────────────────────────────────────────────────────────
    textarea: {
        root: {
            "ROOT-STYLE": "flex flex-col gap-1.5",
        },
        label: {
            "ROOT-STYLE":
                "font-[family-name:var(--font-body)] text-[11px] font-medium tracking-[0.1em] uppercase text-[var(--color-text-tertiary)]",
        },
        field: {
            "ROOT-STYLE":
                "flex min-h-24 w-full resize-y rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-3 py-2 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-disabled)] transition-[border-color,box-shadow] duration-[var(--duration-fast)] focus:outline-none focus:border-[var(--color-focus)] focus:shadow-[var(--shadow-focus)] disabled:opacity-50",
        },
        hint: {
            "ROOT-STYLE": "text-xs text-[var(--color-text-tertiary)]",
        },
        error: {
            "ROOT-STYLE": "text-xs text-[var(--color-danger)]",
        },
    },

    // ── Select ─────────────────────────────────────────────────────────────────
    select: {
        root: {
            "ROOT-STYLE": "flex flex-col gap-1.5",
        },
        label: {
            "ROOT-STYLE":
                "font-[family-name:var(--font-body)] text-[11px] font-medium tracking-[0.1em] uppercase text-[var(--color-text-tertiary)]",
        },
        field: {
            "ROOT-STYLE":
                "flex h-10 w-full appearance-none rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-3 py-2 pr-9 text-sm text-[var(--color-text-primary)] transition-[border-color,box-shadow] duration-[var(--duration-fast)] focus:outline-none focus:border-[var(--color-focus)] focus:shadow-[var(--shadow-focus)] disabled:opacity-50",
        },
        wrapper: {
            "ROOT-STYLE": "relative",
        },
        chevron: {
            "ROOT-STYLE":
                "pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-text-tertiary)]",
        },
        hint: {
            "ROOT-STYLE": "text-xs text-[var(--color-text-tertiary)]",
        },
    },

    // ── Checkbox ───────────────────────────────────────────────────────────────
    checkbox: {
        root: {
            "ROOT-STYLE": "flex items-start gap-2.5",
        },
        box: {
            "ROOT-STYLE":
                "mt-0.5 h-4 w-4 shrink-0 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface-raised)] transition-colors duration-[var(--duration-fast)] checked:bg-[var(--color-primary)] checked:border-[var(--color-primary)] focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)] disabled:opacity-50 cursor-pointer",
        },
        label: {
            "ROOT-STYLE": "text-sm text-[var(--color-text-primary)] leading-snug cursor-pointer",
        },
        hint: {
            "ROOT-STYLE": "text-xs text-[var(--color-text-tertiary)] mt-0.5",
        },
    },

    // ── Radio ──────────────────────────────────────────────────────────────────
    radio: {
        root: {
            "ROOT-STYLE": "flex items-start gap-2.5",
        },
        button: {
            "ROOT-STYLE":
                "mt-0.5 h-4 w-4 shrink-0 rounded-full border border-[var(--color-border)] bg-[var(--color-surface-raised)] transition-colors duration-[var(--duration-fast)] checked:bg-[var(--color-primary)] checked:border-[var(--color-primary)] focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)] disabled:opacity-50 cursor-pointer",
        },
        label: {
            "ROOT-STYLE": "text-sm text-[var(--color-text-primary)] leading-snug cursor-pointer",
        },
    },

    // ── Toggle / Switch ────────────────────────────────────────────────────────
    toggle: {
        root: {
            "ROOT-STYLE": "flex items-center gap-3",
        },
        track: {
            "ROOT-STYLE":
                "relative inline-flex h-5 w-9 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-[var(--duration-base)] focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)]",
            "checked-style": "bg-[var(--color-primary)]",
            "unchecked-style": "bg-[var(--color-muted)]",
        },
        thumb: {
            "ROOT-STYLE":
                "pointer-events-none block h-4 w-4 rounded-full bg-white shadow-[var(--shadow-sm)] transition-transform duration-[var(--duration-base)]",
            "checked-style": "translate-x-4",
            "unchecked-style": "translate-x-0",
        },
        label: {
            "ROOT-STYLE": "text-sm text-[var(--color-text-primary)]",
        },
    },

    // ── Card ───────────────────────────────────────────────────────────────────
    card: {
        root: {
            "ROOT-STYLE":
                "rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface-raised)] shadow-[var(--shadow-md)]",
        },
        rootHoverable: {
            "ROOT-STYLE":
                "rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface-raised)] shadow-[var(--shadow-md)] duration-[var(--duration-base)] ease-[var(--ease-spring)] hover:-translate-y-0.5 hover:shadow-[var(--shadow-lg)] cursor-pointer",
        },
        rootFlat: {
            "ROOT-STYLE":
                "rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-muted)]",
        },
        header: {
            "ROOT-STYLE":
                "px-6 py-4 border-b border-[var(--color-border-subtle)] flex items-center justify-between gap-4",
        },
        title: {
            "ROOT-STYLE":
                "font-[family-name:var(--font-display)] text-xl font-normal text-[var(--color-text-primary)]",
        },
        subtitle: {
            "ROOT-STYLE": "text-sm text-[var(--color-text-secondary)] mt-0.5",
        },
        body: {
            "ROOT-STYLE": "px-6 py-4",
        },
        bodyPaddingless: {
            "ROOT-STYLE": "overflow-hidden",
        },
        footer: {
            "ROOT-STYLE":
                "px-6 py-4 border-t border-[var(--color-border-subtle)] flex items-center justify-end gap-3",
        },
    },

    // ── Badge ──────────────────────────────────────────────────────────────────
    badge: {
        root: {
            "ROOT-STYLE":
                "inline-flex items-center gap-1 rounded-[var(--radius-sm)] px-2 py-0.5 font-[family-name:var(--font-body)] text-[11px] font-medium tracking-[0.06em] uppercase leading-none whitespace-nowrap",
        },
        default: {
            "ROOT-STYLE": "bg-[var(--color-muted)] text-[var(--color-text-secondary)]",
        },
        primary: {
            "ROOT-STYLE": "bg-[var(--color-accent-subtle)] text-[var(--color-primary)]",
        },
        success: {
            "ROOT-STYLE": "bg-[var(--color-success-light)] text-[var(--color-success)]",
        },
        warning: {
            "ROOT-STYLE": "bg-[var(--color-warning-light)] text-[var(--color-warning)]",
        },
        danger: {
            "ROOT-STYLE": "bg-[var(--color-danger-light)] text-[var(--color-danger)]",
        },
        info: {
            "ROOT-STYLE": "bg-[var(--color-info-light)] text-[var(--color-info)]",
        },
        outline: {
            "ROOT-STYLE":
                "border border-[var(--color-border)] bg-transparent text-[var(--color-text-secondary)]",
        },
        pill: {
            "ROOT-STYLE": "rounded-[var(--radius-full)]",
        },
        dot: {
            "ROOT-STYLE": "h-1.5 w-1.5 rounded-full bg-current shrink-0",
        },
    },

    // ── Avatar ─────────────────────────────────────────────────────────────────
    avatar: {
        root: {
            "ROOT-STYLE": "relative inline-flex shrink-0 overflow-hidden rounded-full",
        },
        xs: { "ROOT-STYLE": "h-6 w-6 text-[10px]" },
        sm: { "ROOT-STYLE": "h-8 w-8 text-xs" },
        md: { "ROOT-STYLE": "h-10 w-10 text-sm" },
        lg: { "ROOT-STYLE": "h-12 w-12 text-base" },
        xl: { "ROOT-STYLE": "h-16 w-16 text-lg" },
        image: {
            "ROOT-STYLE": "h-full w-full object-cover",
        },
        fallback: {
            "ROOT-STYLE":
                "flex h-full w-full items-center justify-center bg-[var(--color-accent-subtle)] font-medium text-[var(--color-primary)]",
        },
        statusDot: {
            "ROOT-STYLE":
                "absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-[var(--color-surface-raised)]",
            "online-style": "bg-[var(--color-success)]",
            "offline-style": "bg-[var(--color-text-disabled)]",
            "busy-style": "bg-[var(--color-danger)]",
            "away-style": "bg-[var(--color-warning)]",
        },
        group: {
            "ROOT-STYLE": "flex -space-x-2",
        },
    },

    // ── Divider ────────────────────────────────────────────────────────────────
    divider: {
        horizontal: {
            "ROOT-STYLE": "h-px w-full bg-[var(--color-border-subtle)]",
        },
        vertical: {
            "ROOT-STYLE": "w-px self-stretch bg-[var(--color-border-subtle)]",
        },
        withLabel: {
            "ROOT-STYLE": "flex items-center gap-3",
            line: {
                "ROOT-STYLE": "h-px flex-1 bg-[var(--color-border-subtle)]",
            },
            label: {
                "ROOT-STYLE":
                    "text-[11px] font-medium tracking-[0.1em] uppercase text-[var(--color-text-tertiary)] whitespace-nowrap",
            },
        },
    },

    // ── Alert / Banner ─────────────────────────────────────────────────────────
    alert: {
        root: {
            "ROOT-STYLE": "flex items-start gap-3 rounded-[var(--radius-md)] border p-4 text-sm",
        },
        info: {
            "ROOT-STYLE":
                "bg-[var(--color-info-light)] border-[var(--color-info)] text-[var(--color-info)]",
        },
        success: {
            "ROOT-STYLE":
                "bg-[var(--color-success-light)] border-[var(--color-success)] text-[var(--color-success)]",
        },
        warning: {
            "ROOT-STYLE":
                "bg-[var(--color-warning-light)] border-[var(--color-warning)] text-[var(--color-warning)]",
        },
        danger: {
            "ROOT-STYLE":
                "bg-[var(--color-danger-light)] border-[var(--color-danger)] text-[var(--color-danger)]",
        },
        icon: {
            "ROOT-STYLE": "h-4 w-4 shrink-0 mt-0.5",
        },
        content: {
            "ROOT-STYLE": "flex-1 min-w-0",
        },
        title: {
            "ROOT-STYLE": "font-medium leading-snug",
        },
        description: {
            "ROOT-STYLE": "mt-0.5 opacity-90",
        },
        closeButton: {
            "ROOT-STYLE":
                "ml-auto -mt-0.5 h-5 w-5 shrink-0 rounded opacity-70 hover:opacity-100 transition-opacity cursor-pointer",
        },
    },

    // ── Spinner / Loading ──────────────────────────────────────────────────────
    spinner: {
        root: {
            "ROOT-STYLE":
                "inline-block animate-spin rounded-full border-2 border-current border-t-transparent",
        },
        xs: { "ROOT-STYLE": "h-3 w-3" },
        sm: { "ROOT-STYLE": "h-4 w-4" },
        md: { "ROOT-STYLE": "h-6 w-6" },
        lg: { "ROOT-STYLE": "h-8 w-8" },
        xl: { "ROOT-STYLE": "h-12 w-12" },
        overlay: {
            "ROOT-STYLE": "flex items-center justify-center",
        },
        fullPage: {
            "ROOT-STYLE":
                "fixed inset-0 z-[var(--z-overlay)] flex items-center justify-center bg-[var(--color-surface)]/60 backdrop-blur-sm",
        },
    },

    // ── Skeleton ───────────────────────────────────────────────────────────────
    skeleton: {
        root: {
            "ROOT-STYLE": "animate-pulse rounded-[var(--radius-md)] bg-[var(--color-muted)]",
        },
        text: {
            "ROOT-STYLE": "h-4 animate-pulse rounded bg-[var(--color-muted)]",
        },
        avatar: {
            "ROOT-STYLE": "animate-pulse rounded-full bg-[var(--color-muted)]",
        },
        button: {
            "ROOT-STYLE": "h-10 animate-pulse rounded-[var(--radius-md)] bg-[var(--color-muted)]",
        },
    },

    // ── Tooltip ────────────────────────────────────────────────────────────────
    tooltip: {
        content: {
            "ROOT-STYLE":
                "z-[var(--z-dropdown)] max-w-xs rounded-[var(--radius-md)] bg-[var(--color-neutral-900)] px-2.5 py-1.5 text-xs text-[var(--color-text-inverse)] shadow-[var(--shadow-lg)] pointer-events-none",
        },
        arrow: {
            "ROOT-STYLE": "fill-[var(--color-neutral-900)]",
        },
    },

    // ── Popover ────────────────────────────────────────────────────────────────
    popover: {
        content: {
            "ROOT-STYLE":
                "z-[var(--z-dropdown)] min-w-48 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface-overlay)] p-1 shadow-[var(--shadow-lg)] outline-none",
        },
    },

    // ── Dropdown Menu ──────────────────────────────────────────────────────────
    dropdown: {
        content: {
            "ROOT-STYLE":
                "z-[var(--z-dropdown)] min-w-48 overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface-overlay)] shadow-[var(--shadow-lg)] p-1",
        },
        item: {
            "ROOT-STYLE":
                "relative flex cursor-pointer select-none items-center gap-2 rounded-[var(--radius-md)] px-2.5 py-2 text-sm text-[var(--color-text-primary)] outline-none transition-colors duration-[var(--duration-fast)] hover:bg-[var(--color-muted)] data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        },
        itemDanger: {
            "ROOT-STYLE":
                "relative flex cursor-pointer select-none items-center gap-2 rounded-[var(--radius-md)] px-2.5 py-2 text-sm text-[var(--color-danger)] outline-none transition-colors duration-[var(--duration-fast)] hover:bg-[var(--color-danger-light)]",
        },
        separator: {
            "ROOT-STYLE": "my-1 h-px bg-[var(--color-border-subtle)]",
        },
        label: {
            "ROOT-STYLE":
                "px-2.5 py-1.5 text-[11px] font-medium tracking-[0.1em] uppercase text-[var(--color-text-tertiary)]",
        },
        icon: {
            "ROOT-STYLE": "h-4 w-4 shrink-0 text-[var(--color-text-tertiary)]",
        },
        shortcut: {
            "ROOT-STYLE": "ml-auto text-xs text-[var(--color-text-tertiary)] tracking-wide",
        },
    },

    // ── Modal / Dialog ─────────────────────────────────────────────────────────
    modal: {
        overlay: {
            "ROOT-STYLE": "fixed inset-0 z-[var(--z-overlay)] bg-black/40 backdrop-blur-sm",
        },
        content: {
            "ROOT-STYLE":
                "fixed left-1/2 top-1/2 z-[var(--z-modal)] -translate-x-1/2 -translate-y-1/2 w-full max-w-md rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface-overlay)] shadow-[var(--shadow-xl)] outline-none",
        },
        contentLg: {
            "ROOT-STYLE":
                "fixed left-1/2 top-1/2 z-[var(--z-modal)] -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface-overlay)] shadow-[var(--shadow-xl)] outline-none",
        },
        header: {
            "ROOT-STYLE":
                "flex items-center justify-between border-b border-[var(--color-border-subtle)] px-6 py-4",
        },
        title: {
            "ROOT-STYLE":
                "font-[family-name:var(--font-display)] text-xl font-normal text-[var(--color-text-primary)]",
        },
        description: {
            "ROOT-STYLE": "text-sm text-[var(--color-text-secondary)]",
        },
        body: {
            "ROOT-STYLE": "px-6 py-4",
        },
        footer: {
            "ROOT-STYLE":
                "flex items-center justify-end gap-3 border-t border-[var(--color-border-subtle)] px-6 py-4",
        },
        closeButton: {
            "ROOT-STYLE":
                "rounded-[var(--radius-md)] p-1.5 text-[var(--color-text-tertiary)] hover:bg-[var(--color-muted)] hover:text-[var(--color-text-primary)] transition-colors duration-[var(--duration-fast)] cursor-pointer",
            icon: { "ROOT-STYLE": "h-4 w-4" },
        },
    },

    // ── Drawer ─────────────────────────────────────────────────────────────────
    drawer: {
        overlay: {
            "ROOT-STYLE": "fixed inset-0 z-[var(--z-overlay)] bg-black/40 backdrop-blur-sm",
        },
        right: {
            "ROOT-STYLE":
                "fixed right-0 top-0 z-[var(--z-modal)] h-full w-80 border-l border-[var(--color-border)] bg-[var(--color-surface-overlay)] shadow-[var(--shadow-xl)] flex flex-col",
        },
        left: {
            "ROOT-STYLE":
                "fixed left-0 top-0 z-[var(--z-modal)] h-full w-80 border-r border-[var(--color-border)] bg-[var(--color-surface-overlay)] shadow-[var(--shadow-xl)] flex flex-col",
        },
        header: {
            "ROOT-STYLE":
                "flex items-center justify-between border-b border-[var(--color-border-subtle)] px-5 py-4 shrink-0",
        },
        title: {
            "ROOT-STYLE":
                "font-[family-name:var(--font-display)] text-lg font-normal text-[var(--color-text-primary)]",
        },
        body: {
            "ROOT-STYLE": "flex-1 overflow-y-auto px-5 py-4",
        },
        footer: {
            "ROOT-STYLE":
                "flex items-center justify-end gap-3 border-t border-[var(--color-border-subtle)] px-5 py-4 shrink-0",
        },
    },

    // ── Tabs ───────────────────────────────────────────────────────────────────
    tabs: {
        list: {
            "ROOT-STYLE": "flex gap-0.5 rounded-[var(--radius-md)] bg-[var(--color-muted)] p-0.5",
        },
        listUnderline: {
            "ROOT-STYLE": "flex gap-6 border-b border-[var(--color-border)]",
        },
        trigger: {
            "ROOT-STYLE":
                "inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-[calc(var(--radius-md)-2px)] px-3 py-1.5 text-sm font-medium transition-all duration-[var(--duration-fast)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus)]",
            "active-style":
                "bg-[var(--color-surface-raised)] text-[var(--color-text-primary)] shadow-[var(--shadow-sm)]",
        },
        triggerUnderline: {
            "ROOT-STYLE":
                "inline-flex items-center gap-1.5 whitespace-nowrap pb-2.5 text-sm font-medium transition-colors duration-[var(--duration-fast)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] border-b-2 border-transparent -mb-px",
            "active-style": "text-[var(--color-primary)] border-b-2 border-[var(--color-primary)]",
        },
        content: {
            "ROOT-STYLE": "mt-4",
        },
    },

    // ── Accordion ─────────────────────────────────────────────────────────────
    accordion: {
        root: {
            "ROOT-STYLE": "divide-y divide-[var(--color-border-subtle)]",
        },
        item: {
            "ROOT-STYLE": "py-0",
        },
        trigger: {
            "ROOT-STYLE":
                "flex w-full items-center justify-between py-4 text-sm font-medium text-[var(--color-text-primary)] transition-colors hover:text-[var(--color-primary)] cursor-pointer",
        },
        icon: {
            "ROOT-STYLE":
                "h-4 w-4 shrink-0 text-[var(--color-text-tertiary)] transition-transform duration-[var(--duration-slow)]",
            "open-style": "rotate-180",
        },
        content: {
            "ROOT-STYLE": "pb-4 text-sm text-[var(--color-text-secondary)] leading-relaxed",
        },
    },

    // ── Progress ───────────────────────────────────────────────────────────────
    progress: {
        root: {
            "ROOT-STYLE": "flex flex-col gap-1.5",
        },
        label: {
            "ROOT-STYLE":
                "flex items-center justify-between text-xs text-[var(--color-text-secondary)]",
        },
        track: {
            "ROOT-STYLE":
                "h-2 w-full overflow-hidden rounded-[var(--radius-full)] bg-[var(--color-muted)]",
        },
        trackLg: {
            "ROOT-STYLE":
                "h-3 w-full overflow-hidden rounded-[var(--radius-full)] bg-[var(--color-muted)]",
        },
        fill: {
            "ROOT-STYLE":
                "h-full rounded-[var(--radius-full)] bg-[var(--color-primary)] transition-all duration-[var(--duration-slower)] ease-[var(--ease-out)]",
        },
        fillSuccess: {
            "ROOT-STYLE":
                "h-full rounded-[var(--radius-full)] bg-[var(--color-success)] transition-all duration-[var(--duration-slower)] ease-[var(--ease-out)]",
        },
        fillDanger: {
            "ROOT-STYLE":
                "h-full rounded-[var(--radius-full)] bg-[var(--color-danger)] transition-all duration-[var(--duration-slower)] ease-[var(--ease-out)]",
        },
    },

    // ── Table ──────────────────────────────────────────────────────────────────
    table: {
        root: {
            "ROOT-STYLE":
                "w-full overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)]",
        },
        scrollWrapper: {
            "ROOT-STYLE": "overflow-x-auto",
        },
        table: {
            "ROOT-STYLE": "w-full border-collapse text-sm",
        },
        thead: {
            "ROOT-STYLE": "border-b border-[var(--color-border)] bg-[var(--color-muted)]",
        },
        th: {
            "ROOT-STYLE":
                "px-4 py-3 text-left font-[family-name:var(--font-body)] text-[11px] font-medium tracking-[0.08em] uppercase text-[var(--color-text-tertiary)]",
        },
        tbody: {
            "ROOT-STYLE": "divide-y divide-[var(--color-border-subtle)]",
        },
        tr: {
            "ROOT-STYLE":
                "bg-[var(--color-surface-raised)] transition-colors duration-[var(--duration-fast)]",
            "hover-style": "hover:bg-[var(--color-muted)]",
        },
        td: {
            "ROOT-STYLE": "px-4 py-3 text-[var(--color-text-primary)]",
        },
        tdMuted: {
            "ROOT-STYLE": "px-4 py-3 text-[var(--color-text-secondary)]",
        },
        empty: {
            "ROOT-STYLE": "py-12 text-center text-sm text-[var(--color-text-tertiary)]",
        },
    },

    // ── Typography ─────────────────────────────────────────────────────────────
    typography: {
        hero: {
            "ROOT-STYLE":
                "font-[family-name:var(--font-display)] text-[52px] leading-[1.05] tracking-[-0.02em] font-normal text-[var(--color-text-primary)]",
        },
        h1: {
            "ROOT-STYLE":
                "font-[family-name:var(--font-display)] text-[42px] leading-[1.1] tracking-[-0.01em] font-normal text-[var(--color-text-primary)]",
        },
        h2: {
            "ROOT-STYLE":
                "font-[family-name:var(--font-display)] text-[32px] leading-[1.15] tracking-[-0.01em] font-normal text-[var(--color-text-primary)]",
        },
        h3: {
            "ROOT-STYLE":
                "font-[family-name:var(--font-display)] text-2xl leading-[1.2] font-normal text-[var(--color-text-primary)]",
        },
        h4: {
            "ROOT-STYLE":
                "font-[family-name:var(--font-display)] text-xl leading-[1.3] font-normal text-[var(--color-text-primary)]",
        },
        h5: {
            "ROOT-STYLE":
                "font-[family-name:var(--font-display)] text-[17px] leading-[1.4] font-normal text-[var(--color-text-primary)]",
        },
        h6: {
            "ROOT-STYLE":
                "font-[family-name:var(--font-display)] text-[15px] leading-[1.4] font-normal text-[var(--color-text-primary)]",
        },
        bodyLg: {
            "ROOT-STYLE":
                "font-[family-name:var(--font-body)] text-lg leading-[1.7] text-[var(--color-text-primary)]",
        },
        body: {
            "ROOT-STYLE":
                "font-[family-name:var(--font-body)] text-base leading-[1.7] text-[var(--color-text-primary)]",
        },
        bodySm: {
            "ROOT-STYLE":
                "font-[family-name:var(--font-body)] text-sm leading-[1.6] text-[var(--color-text-secondary)]",
        },
        caption: {
            "ROOT-STYLE":
                "font-[family-name:var(--font-body)] text-xs leading-[1.5] text-[var(--color-text-tertiary)]",
        },
        label: {
            "ROOT-STYLE":
                "font-[family-name:var(--font-body)] text-[11px] font-medium tracking-[0.1em] uppercase text-[var(--color-text-tertiary)]",
        },
        code: {
            "ROOT-STYLE":
                "font-[family-name:var(--font-mono)] text-[0.875em] rounded-[var(--radius-sm)] bg-[var(--color-muted)] px-1.5 py-0.5 text-[var(--color-text-primary)]",
        },
        italic: {
            "ROOT-STYLE": "italic text-[var(--color-text-secondary)]",
        },
    },

    // ── Empty State ────────────────────────────────────────────────────────────
    emptyState: {
        root: {
            "ROOT-STYLE": "flex flex-col items-center justify-center gap-3 py-12 px-6 text-center",
        },
        icon: {
            "ROOT-STYLE":
                "flex h-14 w-14 items-center justify-center rounded-[var(--radius-xl)] bg-[var(--color-muted)] text-[var(--color-text-tertiary)] mb-1",
        },
        title: {
            "ROOT-STYLE":
                "font-[family-name:var(--font-display)] text-xl font-normal text-[var(--color-text-primary)]",
        },
        description: {
            "ROOT-STYLE": "text-sm text-[var(--color-text-secondary)] max-w-sm",
        },
        actions: {
            "ROOT-STYLE": "flex items-center gap-3 mt-2",
        },
    },

    // ── Page Shell ─────────────────────────────────────────────────────────────
    pageShell: {
        root: {
            "ROOT-STYLE":
                "min-h-screen bg-[var(--color-surface)] font-[family-name:var(--font-body)] text-[var(--color-text-primary)]",
        },
        header: {
            "ROOT-STYLE":
                "sticky top-0 z-[var(--z-sticky)] border-b border-[var(--color-border-subtle)] bg-[var(--color-surface)]/90 backdrop-blur-md",
        },
        headerInner: {
            "ROOT-STYLE": "mx-auto flex h-14 max-w-7xl items-center justify-between px-6",
        },
        content: {
            "ROOT-STYLE": "mx-auto max-w-7xl px-6 py-8",
        },
        contentNarrow: {
            "ROOT-STYLE": "mx-auto max-w-3xl px-6 py-8",
        },
        contentWide: {
            "ROOT-STYLE": "mx-auto max-w-screen-xl px-6 py-8",
        },
        section: {
            "ROOT-STYLE": "space-y-6",
        },
        sectionHeader: {
            "ROOT-STYLE": "flex items-center justify-between",
        },
        sectionTitle: {
            "ROOT-STYLE":
                "font-[family-name:var(--font-display)] text-2xl font-normal text-[var(--color-text-primary)]",
        },
    },

    // ── Stat / Metric Card ─────────────────────────────────────────────────────
    stat: {
        root: {
            "ROOT-STYLE":
                "rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-5 shadow-[var(--shadow-sm)]",
        },
        label: {
            "ROOT-STYLE":
                "text-[11px] font-medium tracking-[0.1em] uppercase text-[var(--color-text-tertiary)]",
        },
        value: {
            "ROOT-STYLE":
                "mt-1 font-[family-name:var(--font-display)] text-3xl font-normal text-[var(--color-text-primary)]",
        },
        delta: {
            "ROOT-STYLE": "mt-1 flex items-center gap-1 text-xs",
            "positive-style": "text-[var(--color-success)]",
            "negative-style": "text-[var(--color-danger)]",
            "neutral-style": "text-[var(--color-text-tertiary)]",
        },
        icon: {
            "ROOT-STYLE":
                "flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-accent-subtle)]",
        },
    },

    // ── Chip / Tag ─────────────────────────────────────────────────────────────
    chip: {
        root: {
            "ROOT-STYLE":
                "inline-flex items-center gap-1.5 rounded-[var(--radius-full)] border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-3 py-1 text-xs font-medium text-[var(--color-text-secondary)] transition-colors duration-[var(--duration-fast)]",
        },
        interactive: {
            "ROOT-STYLE":
                "hover:border-[var(--color-border-strong)] hover:bg-[var(--color-muted)] cursor-pointer",
        },
        selected: {
            "ROOT-STYLE":
                "border-[var(--color-primary)] bg-[var(--color-accent-subtle)] text-[var(--color-primary)]",
        },
        remove: {
            "ROOT-STYLE":
                "ml-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full hover:bg-[var(--color-border-strong)] transition-colors cursor-pointer text-current opacity-60 hover:opacity-100",
        },
    },

    // ── Breadcrumb ─────────────────────────────────────────────────────────────
    breadcrumb: {
        root: {
            "ROOT-STYLE": "flex items-center gap-1.5 text-sm",
        },
        item: {
            "ROOT-STYLE":
                "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors duration-[var(--duration-fast)] cursor-pointer",
        },
        current: {
            "ROOT-STYLE": "text-[var(--color-text-primary)] font-medium pointer-events-none",
        },
        separator: {
            "ROOT-STYLE": "text-[var(--color-text-disabled)]",
            CONTENT: "/",
        },
    },

    // ── List ───────────────────────────────────────────────────────────────────
    list: {
        root: {
            "ROOT-STYLE":
                "divide-y divide-[var(--color-border-subtle)] rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface-raised)] overflow-hidden",
        },
        item: {
            "ROOT-STYLE":
                "flex items-center gap-3 px-4 py-3 transition-colors duration-[var(--duration-fast)]",
        },
        itemInteractive: {
            "ROOT-STYLE": "hover:bg-[var(--color-muted)] cursor-pointer",
        },
        itemSelected: {
            "ROOT-STYLE": "bg-[var(--color-accent-subtle)]",
        },
        itemTitle: {
            "ROOT-STYLE": "text-sm font-medium text-[var(--color-text-primary)]",
        },
        itemSubtitle: {
            "ROOT-STYLE": "text-xs text-[var(--color-text-secondary)]",
        },
        itemLeading: {
            "ROOT-STYLE": "shrink-0",
        },
        itemTrailing: {
            "ROOT-STYLE": "ml-auto shrink-0 text-[var(--color-text-tertiary)]",
        },
    },

    // ── Notification / Toast ───────────────────────────────────────────────────
    toast: {
        viewport: {
            "ROOT-STYLE": "fixed bottom-4 right-4 z-[var(--z-toast)] flex flex-col gap-2 w-80",
        },
        root: {
            "ROOT-STYLE":
                "flex items-start gap-3 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface-overlay)] p-4 shadow-[var(--shadow-lg)]",
        },
        icon: {
            "ROOT-STYLE": "h-4 w-4 shrink-0 mt-0.5",
        },
        content: {
            "ROOT-STYLE": "flex-1 min-w-0",
        },
        title: {
            "ROOT-STYLE": "text-sm font-medium text-[var(--color-text-primary)]",
        },
        description: {
            "ROOT-STYLE": "mt-0.5 text-xs text-[var(--color-text-secondary)]",
        },
        close: {
            "ROOT-STYLE":
                "ml-auto h-5 w-5 shrink-0 rounded text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors cursor-pointer",
        },
    },

    // ── Form Group ─────────────────────────────────────────────────────────────
    form: {
        root: {
            "ROOT-STYLE": "space-y-5",
        },
        group: {
            "ROOT-STYLE": "flex flex-col gap-1.5",
        },
        row: {
            "ROOT-STYLE": "grid grid-cols-2 gap-4",
        },
        label: {
            "ROOT-STYLE":
                "text-[11px] font-medium tracking-[0.1em] uppercase text-[var(--color-text-tertiary)] font-[family-name:var(--font-body)]",
        },
        hint: {
            "ROOT-STYLE": "text-xs text-[var(--color-text-tertiary)]",
        },
        error: {
            "ROOT-STYLE": "text-xs text-[var(--color-danger)]",
        },
        section: {
            "ROOT-STYLE":
                "rounded-[var(--radius-lg)] border border-[var(--color-border)] p-5 space-y-4",
        },
        sectionTitle: {
            "ROOT-STYLE":
                "font-[family-name:var(--font-display)] text-base font-normal text-[var(--color-text-primary)] pb-3 border-b border-[var(--color-border-subtle)]",
        },
        actions: {
            "ROOT-STYLE": "flex items-center justify-end gap-3 pt-2",
        },
    },

    // ── Search Input (specialized) ─────────────────────────────────────────────
    search: {
        root: {
            "ROOT-STYLE": "relative",
        },
        icon: {
            "ROOT-STYLE":
                "pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-text-tertiary)]",
        },
        field: {
            "ROOT-STYLE":
                "flex h-10 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-raised)] pl-10 pr-4 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-disabled)] transition-[border-color,box-shadow] duration-[var(--duration-fast)] focus:outline-none focus:border-[var(--color-focus)] focus:shadow-[var(--shadow-focus)]",
        },
        clearButton: {
            "ROOT-STYLE":
                "absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors cursor-pointer",
        },
    },
};
