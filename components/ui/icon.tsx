import { HelpCircle, Layout, Plus, Settings, StickyNote } from "lucide-react";

const icons: Record<string, Record<string, React.ComponentType<any>>> = {
    "main": {
        "dashboard": Layout,
        "settings": Settings,
        "help": HelpCircle,
        "plus": Plus,
        "StickyNote": StickyNote,
    }
}

export default function Icon({ label, size = 24, color = "--color-text-primary", icon, style = "main" }: { label?: string; size?: number; color?: string; icon?: string; style?: string }) {
    const IconComponent = icon ? icons[style][icon] : null;

    if (!IconComponent) return null;

    return <IconComponent size={size} color={color.startsWith("--") ? `var(${color})` : color} aria-label={label} />;
}