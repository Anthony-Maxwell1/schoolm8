"use client";

/**
 * base-components.tsx
 *
 * All components consume their styles exclusively from useCss().
 * Every style is overridable via the theme system in css.ts.
 *
 * Usage:
 *   import { Button, TextInput, Card, Badge, ... } from "@/components/base-components";
 */

import React, {
    forwardRef,
    useState,
    useRef,
    useEffect,
    useId,
    createContext,
    useContext,
    type ReactNode,
    type ButtonHTMLAttributes,
    type InputHTMLAttributes,
    type TextareaHTMLAttributes,
    type SelectHTMLAttributes,
    type HTMLAttributes,
    type ThHTMLAttributes,
    type TdHTMLAttributes,
    JSX,
} from "react";
import { cn } from "@/lib/utils";
import { useCss } from "@/lib/css";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Pull ROOT-STYLE safely from a css node */
function rs(node: any): string {
    return node?.["ROOT-STYLE"] ?? "";
}

// ─────────────────────────────────────────────────────────────────────────────
// Button
// ─────────────────────────────────────────────────────────────────────────────

export type ButtonVariant =
    | "primary"
    | "secondary"
    | "outline"
    | "ghost"
    | "danger"
    | "success"
    | "link";

export type ButtonSize = "xs" | "sm" | "md" | "lg" | "xl";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    size?: ButtonSize;
    loading?: boolean;
    iconOnly?: boolean;
    leftIcon?: ReactNode;
    rightIcon?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    (
        {
            variant = "primary",
            size = "md",
            loading = false,
            iconOnly = false,
            leftIcon,
            rightIcon,
            className,
            disabled,
            children,
            ...props
        },
        ref,
    ) => {
        const { css } = useCss();
        const b = css.components?.base?.button ?? {};

        const sizeKey = iconOnly
            ? size === "sm"
                ? "iconSm"
                : size === "lg"
                  ? "iconLg"
                  : "iconMd"
            : size;

        return (
            <button
                ref={ref}
                disabled={disabled || loading}
                className={cn(rs(b.root), rs(b[variant]), rs(b[sizeKey]), className)}
                {...props}
            >
                {loading ? (
                    <Spinner size="sm" className="text-current" />
                ) : (
                    leftIcon && <span className="shrink-0">{leftIcon}</span>
                )}
                {!iconOnly && children}
                {rightIcon && !loading && <span className="shrink-0">{rightIcon}</span>}
            </button>
        );
    },
);
Button.displayName = "Button";

// ─────────────────────────────────────────────────────────────────────────────
// TextInput
// ─────────────────────────────────────────────────────────────────────────────

export interface TextInputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    hint?: string;
    error?: string;
    inputSize?: "sm" | "md" | "lg";
}

export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(
    ({ label, hint, error, inputSize = "md", className, id: idProp, ...props }, ref) => {
        const { css } = useCss();
        const inp = css.components?.base?.input ?? {};
        const uid = useId();
        const id = idProp ?? uid;

        const fieldKey = inputSize === "sm" ? "fieldSm" : inputSize === "lg" ? "fieldLg" : "field";

        return (
            <div className={rs(inp.root)}>
                {label && (
                    <label htmlFor={id} className={rs(inp.label)}>
                        {label}
                    </label>
                )}
                <input
                    ref={ref}
                    id={id}
                    className={cn(rs(inp[fieldKey]), error ? rs(inp.errorField) : "", className)}
                    aria-invalid={!!error}
                    aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
                    {...props}
                />
                {hint && !error && (
                    <p id={`${id}-hint`} className={rs(inp.hint)}>
                        {hint}
                    </p>
                )}
                {error && (
                    <p id={`${id}-error`} className={rs(inp.error)} role="alert">
                        {error}
                    </p>
                )}
            </div>
        );
    },
);
TextInput.displayName = "TextInput";

// ─────────────────────────────────────────────────────────────────────────────
// Textarea
// ─────────────────────────────────────────────────────────────────────────────

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
    label?: string;
    hint?: string;
    error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
    ({ label, hint, error, className, id: idProp, ...props }, ref) => {
        const { css } = useCss();
        const ta = css.components?.base?.textarea ?? {};
        const uid = useId();
        const id = idProp ?? uid;

        return (
            <div className={rs(ta.root)}>
                {label && (
                    <label htmlFor={id} className={rs(ta.label)}>
                        {label}
                    </label>
                )}
                <textarea
                    ref={ref}
                    id={id}
                    className={cn(rs(ta.field), className)}
                    aria-invalid={!!error}
                    {...props}
                />
                {hint && !error && <p className={rs(ta.hint)}>{hint}</p>}
                {error && (
                    <p className={rs(ta.error)} role="alert">
                        {error}
                    </p>
                )}
            </div>
        );
    },
);
Textarea.displayName = "Textarea";

// ─────────────────────────────────────────────────────────────────────────────
// Select
// ─────────────────────────────────────────────────────────────────────────────

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
    label?: string;
    hint?: string;
    options?: { value: string; label: string; disabled?: boolean }[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
    ({ label, hint, options, className, id: idProp, children, ...props }, ref) => {
        const { css } = useCss();
        const sel = css.components?.base?.select ?? {};
        const uid = useId();
        const id = idProp ?? uid;

        return (
            <div className={rs(sel.root)}>
                {label && (
                    <label htmlFor={id} className={rs(sel.label)}>
                        {label}
                    </label>
                )}
                <div className={rs(sel.wrapper)}>
                    <select ref={ref} id={id} className={cn(rs(sel.field), className)} {...props}>
                        {options
                            ? options.map((o) => (
                                  <option key={o.value} value={o.value} disabled={o.disabled}>
                                      {o.label}
                                  </option>
                              ))
                            : children}
                    </select>
                    {/* Chevron icon */}
                    <svg
                        className={rs(sel.chevron)}
                        viewBox="0 0 16 16"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={1.5}
                    >
                        <path d="M4 6l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </div>
                {hint && <p className={rs(sel.hint)}>{hint}</p>}
            </div>
        );
    },
);
Select.displayName = "Select";

// ─────────────────────────────────────────────────────────────────────────────
// Checkbox
// ─────────────────────────────────────────────────────────────────────────────

export interface CheckboxProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    hint?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
    ({ label, hint, className, id: idProp, ...props }, ref) => {
        const { css } = useCss();
        const cb = css.components?.base?.checkbox ?? {};
        const uid = useId();
        const id = idProp ?? uid;

        return (
            <div className={rs(cb.root)}>
                <input
                    ref={ref}
                    type="checkbox"
                    id={id}
                    className={cn(rs(cb.box), className)}
                    {...props}
                />
                {(label || hint) && (
                    <div className="flex flex-col">
                        {label && (
                            <label htmlFor={id} className={rs(cb.label)}>
                                {label}
                            </label>
                        )}
                        {hint && <span className={rs(cb.hint)}>{hint}</span>}
                    </div>
                )}
            </div>
        );
    },
);
Checkbox.displayName = "Checkbox";

// ─────────────────────────────────────────────────────────────────────────────
// Radio
// ─────────────────────────────────────────────────────────────────────────────

export interface RadioProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
}

export const Radio = forwardRef<HTMLInputElement, RadioProps>(
    ({ label, className, id: idProp, ...props }, ref) => {
        const { css } = useCss();
        const r = css.components?.base?.radio ?? {};
        const uid = useId();
        const id = idProp ?? uid;

        return (
            <div className={rs(r.root)}>
                <input
                    ref={ref}
                    type="radio"
                    id={id}
                    className={cn(rs(r.button), className)}
                    {...props}
                />
                {label && (
                    <label htmlFor={id} className={rs(r.label)}>
                        {label}
                    </label>
                )}
            </div>
        );
    },
);
Radio.displayName = "Radio";

// ─────────────────────────────────────────────────────────────────────────────
// Toggle (Switch)
// ─────────────────────────────────────────────────────────────────────────────

export interface ToggleProps {
    checked?: boolean;
    defaultChecked?: boolean;
    onChange?: (checked: boolean) => void;
    label?: string;
    disabled?: boolean;
    className?: string;
}

export function Toggle({
    checked: controlledChecked,
    defaultChecked = false,
    onChange,
    label,
    disabled,
    className,
}: ToggleProps) {
    const { css } = useCss();
    const t = css.components?.base?.toggle ?? {};
    const [internalChecked, setInternalChecked] = useState(defaultChecked);
    const isControlled = controlledChecked !== undefined;
    const isChecked = isControlled ? controlledChecked : internalChecked;
    const uid = useId();

    const handleClick = () => {
        if (disabled) return;
        const next = !isChecked;
        if (!isControlled) setInternalChecked(next);
        onChange?.(next);
    };

    return (
        <div className={cn(rs(t.root), className)}>
            <button
                type="button"
                role="switch"
                aria-checked={isChecked}
                aria-labelledby={label ? `${uid}-label` : undefined}
                disabled={disabled}
                onClick={handleClick}
                className={cn(
                    rs(t.track),
                    isChecked ? t.track?.["checked-style"] : t.track?.["unchecked-style"],
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                )}
            >
                <span
                    className={cn(
                        rs(t.thumb),
                        isChecked ? t.thumb?.["checked-style"] : t.thumb?.["unchecked-style"],
                    )}
                />
            </button>
            {label && (
                <span id={`${uid}-label`} className={rs(t.label)}>
                    {label}
                </span>
            )}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// SearchInput
// ─────────────────────────────────────────────────────────────────────────────

export interface SearchInputProps extends InputHTMLAttributes<HTMLInputElement> {
    onClear?: () => void;
}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
    ({ onClear, className, value, onChange, ...props }, ref) => {
        const { css } = useCss();
        const s = css.components?.base?.search ?? {};

        return (
            <div className={rs(s.root)}>
                <svg
                    className={rs(s.icon)}
                    viewBox="0 0 16 16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.5}
                >
                    <circle cx="7" cy="7" r="4.5" />
                    <path d="M10.5 10.5l3 3" strokeLinecap="round" />
                </svg>
                <input
                    ref={ref}
                    type="search"
                    value={value}
                    onChange={onChange}
                    className={cn(rs(s.field), className)}
                    {...props}
                />
                {value && onClear && (
                    <button
                        type="button"
                        onClick={onClear}
                        className={rs(s.clearButton)}
                        aria-label="Clear search"
                    >
                        <svg
                            viewBox="0 0 16 16"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={1.5}
                        >
                            <path d="M4 4l8 8M12 4l-8 8" strokeLinecap="round" />
                        </svg>
                    </button>
                )}
            </div>
        );
    },
);
SearchInput.displayName = "SearchInput";

// ─────────────────────────────────────────────────────────────────────────────
// Card
// ─────────────────────────────────────────────────────────────────────────────

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
    variant?: "default" | "hoverable" | "flat";
    noPadding?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
    ({ variant = "default", noPadding, className, children, ...props }, ref) => {
        const { css } = useCss();
        const c = css.components?.base?.card ?? {};

        const rootKey =
            variant === "hoverable" ? "rootHoverable" : variant === "flat" ? "rootFlat" : "root";

        return (
            <div ref={ref} className={cn(rs(c[rootKey]), className)} {...props}>
                {children}
            </div>
        );
    },
);
Card.displayName = "Card";

export function CardHeader({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
    const { css } = useCss();
    return (
        <div className={cn(rs(css.components?.base?.card?.header), className)} {...props}>
            {children}
        </div>
    );
}

export function CardTitle({ className, children, ...props }: HTMLAttributes<HTMLHeadingElement>) {
    const { css } = useCss();
    return (
        <h3 className={cn(rs(css.components?.base?.card?.title), className)} {...props}>
            {children}
        </h3>
    );
}

export function CardSubtitle({
    className,
    children,
    ...props
}: HTMLAttributes<HTMLParagraphElement>) {
    const { css } = useCss();
    return (
        <p className={cn(rs(css.components?.base?.card?.subtitle), className)} {...props}>
            {children}
        </p>
    );
}

export function CardBody({
    className,
    children,
    paddingless,
    ...props
}: HTMLAttributes<HTMLDivElement> & { paddingless?: boolean }) {
    const { css } = useCss();
    const c = css.components?.base?.card ?? {};
    return (
        <div className={cn(paddingless ? rs(c.bodyPaddingless) : rs(c.body), className)} {...props}>
            {children}
        </div>
    );
}

export function CardFooter({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
    const { css } = useCss();
    return (
        <div className={cn(rs(css.components?.base?.card?.footer), className)} {...props}>
            {children}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Badge
// ─────────────────────────────────────────────────────────────────────────────

export type BadgeVariant =
    | "default"
    | "primary"
    | "success"
    | "warning"
    | "danger"
    | "info"
    | "outline";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
    variant?: BadgeVariant;
    pill?: boolean;
    dot?: boolean;
}

export function Badge({
    variant = "default",
    pill,
    dot,
    className,
    children,
    ...props
}: BadgeProps) {
    const { css } = useCss();
    const b = css.components?.base?.badge ?? {};

    return (
        <span
            className={cn(rs(b.root), rs(b[variant]), pill ? rs(b.pill) : "", className)}
            {...props}
        >
            {dot && <span className={rs(b.dot)} aria-hidden />}
            {children}
        </span>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Avatar
// ─────────────────────────────────────────────────────────────────────────────

export type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl";
export type AvatarStatus = "online" | "offline" | "busy" | "away";

export interface AvatarProps {
    src?: string;
    alt?: string;
    fallback?: string;
    size?: AvatarSize;
    status?: AvatarStatus;
    className?: string;
}

export function Avatar({ src, alt, fallback, size = "md", status, className }: AvatarProps) {
    const { css } = useCss();
    const a = css.components?.base?.avatar ?? {};

    return (
        <span className={cn(rs(a.root), rs(a[size]), className)}>
            {src ? (
                <img src={src} alt={alt ?? ""} className={rs(a.image)} />
            ) : (
                <span className={rs(a.fallback)} aria-label={alt}>
                    {fallback ?? alt?.slice(0, 2).toUpperCase() ?? "?"}
                </span>
            )}
            {status && (
                <span
                    className={cn(rs(a.statusDot), a.statusDot?.[`${status}-style`])}
                    aria-label={status}
                />
            )}
        </span>
    );
}

export function AvatarGroup({ children, className }: { children: ReactNode; className?: string }) {
    const { css } = useCss();
    return <div className={cn(rs(css.components?.base?.avatar?.group), className)}>{children}</div>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Divider
// ─────────────────────────────────────────────────────────────────────────────

export interface DividerProps {
    orientation?: "horizontal" | "vertical";
    label?: string;
    className?: string;
}

export function Divider({ orientation = "horizontal", label, className }: DividerProps) {
    const { css } = useCss();
    const d = css.components?.base?.divider ?? {};

    if (label) {
        return (
            <div className={cn(rs(d.withLabel), className)}>
                <span className={rs(d.withLabel?.line)} />
                <span className={rs(d.withLabel?.label)}>{label}</span>
                <span className={rs(d.withLabel?.line)} />
            </div>
        );
    }

    return (
        <div
            className={cn(
                orientation === "vertical" ? rs(d.vertical) : rs(d.horizontal),
                className,
            )}
            role="separator"
            aria-orientation={orientation}
        />
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Alert
// ─────────────────────────────────────────────────────────────────────────────

export type AlertVariant = "info" | "success" | "warning" | "danger";

const ALERT_ICONS: Record<AlertVariant, ReactNode> = {
    info: (
        <svg viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zm0 3a.75.75 0 1 1 0 1.5A.75.75 0 0 1 8 4zm-.75 3.5h1.5v4h-1.5v-4z" />
        </svg>
    ),
    success: (
        <svg viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zm3.28 5.28-4 4a.75.75 0 0 1-1.06 0l-2-2a.75.75 0 0 1 1.06-1.06L6.75 8.69l3.47-3.47a.75.75 0 0 1 1.06 1.06z" />
        </svg>
    ),
    warning: (
        <svg viewBox="0 0 16 16" fill="currentColor">
            <path d="M8.22 1.754a.25.25 0 0 0-.44 0L1.698 13.132a.25.25 0 0 0 .22.368h12.164a.25.25 0 0 0 .22-.368L8.22 1.754zM8 5.5c.345 0 .625.28.625.625v2.25a.625.625 0 0 1-1.25 0v-2.25C7.375 5.78 7.655 5.5 8 5.5zM8 11a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5z" />
        </svg>
    ),
    danger: (
        <svg viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zm-.75 4.5h1.5v4h-1.5v-4zm.75 7a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5z" />
        </svg>
    ),
};

export interface AlertProps {
    variant?: AlertVariant;
    title?: string;
    description?: string;
    onClose?: () => void;
    className?: string;
    children?: ReactNode;
}

export function Alert({
    variant = "info",
    title,
    description,
    onClose,
    className,
    children,
}: AlertProps) {
    const { css } = useCss();
    const a = css.components?.base?.alert ?? {};

    return (
        <div className={cn(rs(a.root), rs(a[variant]), className)} role="alert">
            <span className={rs(a.icon)}>{ALERT_ICONS[variant]}</span>
            <div className={rs(a.content)}>
                {title && <p className={rs(a.title)}>{title}</p>}
                {description && <p className={rs(a.description)}>{description}</p>}
                {children}
            </div>
            {onClose && (
                <button
                    type="button"
                    onClick={onClose}
                    className={rs(a.closeButton)}
                    aria-label="Dismiss"
                >
                    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5}>
                        <path d="M4 4l8 8M12 4l-8 8" strokeLinecap="round" />
                    </svg>
                </button>
            )}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Spinner
// ─────────────────────────────────────────────────────────────────────────────

export type SpinnerSize = "xs" | "sm" | "md" | "lg" | "xl";

export interface SpinnerProps {
    size?: SpinnerSize;
    className?: string;
    label?: string;
}

export function Spinner({ size = "md", className, label = "Loading…" }: SpinnerProps) {
    const { css } = useCss();
    const s = css.components?.base?.spinner ?? {};

    return (
        <span
            className={cn(rs(s.root), rs(s[size]), "text-[var(--color-primary)]", className)}
            role="status"
            aria-label={label}
        />
    );
}

export function SpinnerOverlay({ children }: { children?: ReactNode }) {
    const { css } = useCss();
    return (
        <div className={rs(css.components?.base?.spinner?.overlay)}>
            <Spinner size="lg" />
            {children}
        </div>
    );
}

export function SpinnerFullPage({ label }: { label?: string }) {
    const { css } = useCss();
    return (
        <div className={rs(css.components?.base?.spinner?.fullPage)}>
            <Spinner size="xl" label={label} />
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Skeleton
// ─────────────────────────────────────────────────────────────────────────────

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
    variant?: "block" | "text" | "avatar" | "button";
    width?: string | number;
    height?: string | number;
    lines?: number; // for text variant
}

export function Skeleton({
    variant = "block",
    width,
    height,
    lines = 1,
    className,
    style,
    ...props
}: SkeletonProps) {
    const { css } = useCss();
    const sk = css.components?.base?.skeleton ?? {};

    const variantKey =
        variant === "text"
            ? "text"
            : variant === "avatar"
              ? "avatar"
              : variant === "button"
                ? "button"
                : "root";

    if (variant === "text" && lines > 1) {
        return (
            <div className="flex flex-col gap-2" {...(props as any)}>
                {Array.from({ length: lines }, (_, i) => (
                    <div
                        key={i}
                        className={cn(rs(sk.text), className)}
                        style={{ width: i === lines - 1 ? "70%" : "100%", ...style }}
                    />
                ))}
            </div>
        );
    }

    return (
        <div
            className={cn(rs(sk[variantKey]), className)}
            style={{ width, height, ...style }}
            {...props}
        />
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Progress
// ─────────────────────────────────────────────────────────────────────────────

export interface ProgressProps {
    value: number; // 0–100
    label?: string;
    showValue?: boolean;
    variant?: "default" | "success" | "danger";
    size?: "sm" | "lg";
    className?: string;
}

export function Progress({
    value,
    label,
    showValue,
    variant = "default",
    size = "sm",
    className,
}: ProgressProps) {
    const { css } = useCss();
    const p = css.components?.base?.progress ?? {};

    const trackKey = size === "lg" ? "trackLg" : "track";
    const fillKey =
        variant === "success" ? "fillSuccess" : variant === "danger" ? "fillDanger" : "fill";
    const clamp = Math.min(100, Math.max(0, value));

    return (
        <div className={cn(rs(p.root), className)}>
            {(label || showValue) && (
                <div className={rs(p.label)}>
                    {label && <span>{label}</span>}
                    {showValue && <span>{clamp}%</span>}
                </div>
            )}
            <div
                className={rs(p[trackKey])}
                role="progressbar"
                aria-valuenow={clamp}
                aria-valuemin={0}
                aria-valuemax={100}
            >
                <div className={rs(p[fillKey])} style={{ width: `${clamp}%` }} />
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Table
// ─────────────────────────────────────────────────────────────────────────────

export interface Column<T> {
    key: keyof T | string;
    header: string;
    render?: (row: T, index: number) => ReactNode;
    className?: string;
}

export interface TableProps<T extends Record<string, any>> {
    columns: Column<T>[];
    data: T[];
    keyExtractor?: (row: T, index: number) => string | number;
    emptyMessage?: string;
    className?: string;
    hoverable?: boolean;
}

export function Table<T extends Record<string, any>>({
    columns,
    data,
    keyExtractor,
    emptyMessage = "No results.",
    className,
    hoverable = true,
}: TableProps<T>) {
    const { css } = useCss();
    const t = css.components?.base?.table ?? {};

    return (
        <div className={cn(rs(t.root), className)}>
            <div className={rs(t.scrollWrapper)}>
                <table className={rs(t.table)}>
                    <thead className={rs(t.thead)}>
                        <tr>
                            {columns.map((col) => (
                                <th key={String(col.key)} className={cn(rs(t.th), col.className)}>
                                    {col.header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className={rs(t.tbody)}>
                        {data.length === 0 ? (
                            <tr>
                                <td colSpan={columns.length} className={cn(rs(t.td), rs(t.empty))}>
                                    {emptyMessage}
                                </td>
                            </tr>
                        ) : (
                            data.map((row, i) => (
                                <tr
                                    key={keyExtractor ? keyExtractor(row, i) : i}
                                    className={cn(rs(t.tr), hoverable ? t.tr?.["hover-style"] : "")}
                                >
                                    {columns.map((col) => (
                                        <td
                                            key={String(col.key)}
                                            className={cn(rs(t.td), col.className)}
                                        >
                                            {col.render
                                                ? col.render(row, i)
                                                : (row[col.key as keyof T] as ReactNode)}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Typography
// ─────────────────────────────────────────────────────────────────────────────

type TypographyVariant =
    | "hero"
    | "h1"
    | "h2"
    | "h3"
    | "h4"
    | "h5"
    | "h6"
    | "bodyLg"
    | "body"
    | "bodySm"
    | "caption"
    | "label"
    | "code"
    | "italic";

const TYPOGRAPHY_TAG: Record<TypographyVariant, keyof JSX.IntrinsicElements> = {
    hero: "h1",
    h1: "h1",
    h2: "h2",
    h3: "h3",
    h4: "h4",
    h5: "h5",
    h6: "h6",
    bodyLg: "p",
    body: "p",
    bodySm: "p",
    caption: "span",
    label: "span",
    code: "code",
    italic: "em",
};

export interface TypographyProps extends HTMLAttributes<HTMLElement> {
    variant?: TypographyVariant;
    as?: keyof JSX.IntrinsicElements;
}

export function Text({ variant = "body", as, className, children, ...props }: TypographyProps) {
    const { css } = useCss();
    const ty = css.components?.base?.typography ?? {};
    const Tag = (as ?? TYPOGRAPHY_TAG[variant] ?? "p") as any;

    return (
        <Tag className={cn(rs(ty[variant]), className)} {...props}>
            {children}
        </Tag>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Tabs
// ─────────────────────────────────────────────────────────────────────────────

interface TabsContextValue {
    active: string;
    setActive: (id: string) => void;
    variant: "pill" | "underline";
}

const TabsContext = createContext<TabsContextValue>({
    active: "",
    setActive: () => {},
    variant: "pill",
});

export interface TabsProps {
    defaultTab?: string;
    value?: string;
    onChange?: (id: string) => void;
    variant?: "pill" | "underline";
    className?: string;
    children: ReactNode;
}

export function Tabs({
    defaultTab,
    value,
    onChange,
    variant = "pill",
    className,
    children,
}: TabsProps) {
    const [internal, setInternal] = useState(defaultTab ?? "");
    const isControlled = value !== undefined;
    const active = isControlled ? value! : internal;

    const setActive = (id: string) => {
        if (!isControlled) setInternal(id);
        onChange?.(id);
    };

    return (
        <TabsContext.Provider value={{ active, setActive, variant }}>
            <div className={cn("w-full", className)}>{children}</div>
        </TabsContext.Provider>
    );
}

export function TabList({ className, children }: { className?: string; children: ReactNode }) {
    const { css } = useCss();
    const t = css.components?.base?.tabs ?? {};
    const { variant } = useContext(TabsContext);

    return (
        <div
            role="tablist"
            className={cn(variant === "underline" ? rs(t.listUnderline) : rs(t.list), className)}
        >
            {children}
        </div>
    );
}

export function Tab({
    id,
    children,
    className,
    disabled,
}: {
    id: string;
    children: ReactNode;
    className?: string;
    disabled?: boolean;
}) {
    const { css } = useCss();
    const t = css.components?.base?.tabs ?? {};
    const { active, setActive, variant } = useContext(TabsContext);
    const isActive = active === id;

    const baseKey = variant === "underline" ? "triggerUnderline" : "trigger";
    const activeStyle = t[baseKey]?.["active-style"] ?? "";

    return (
        <button
            role="tab"
            aria-selected={isActive}
            disabled={disabled}
            onClick={() => setActive(id)}
            className={cn(rs(t[baseKey]), isActive ? activeStyle : "", className)}
        >
            {children}
        </button>
    );
}

export function TabPanel({
    id,
    children,
    className,
}: {
    id: string;
    children: ReactNode;
    className?: string;
}) {
    const { css } = useCss();
    const t = css.components?.base?.tabs ?? {};
    const { active } = useContext(TabsContext);

    if (active !== id) return null;

    return (
        <div role="tabpanel" className={cn(rs(t.content), className)}>
            {children}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Accordion
// ─────────────────────────────────────────────────────────────────────────────

export interface AccordionItem {
    id: string;
    title: string;
    content: ReactNode;
    defaultOpen?: boolean;
}

export interface AccordionProps {
    items: AccordionItem[];
    allowMultiple?: boolean;
    className?: string;
}

export function Accordion({ items, allowMultiple = false, className }: AccordionProps) {
    const { css } = useCss();
    const a = css.components?.base?.accordion ?? {};

    const [openIds, setOpenIds] = useState<Set<string>>(
        () => new Set(items.filter((i) => i.defaultOpen).map((i) => i.id)),
    );

    const toggle = (id: string) => {
        setOpenIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                if (!allowMultiple) next.clear();
                next.add(id);
            }
            return next;
        });
    };

    return (
        <div className={cn(rs(a.root), className)}>
            {items.map((item) => {
                const isOpen = openIds.has(item.id);
                return (
                    <div key={item.id} className={rs(a.item)}>
                        <button
                            type="button"
                            onClick={() => toggle(item.id)}
                            aria-expanded={isOpen}
                            className={rs(a.trigger)}
                        >
                            <span>{item.title}</span>
                            <svg
                                className={cn(rs(a.icon), isOpen ? a.icon?.["open-style"] : "")}
                                viewBox="0 0 16 16"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth={1.5}
                            >
                                <path
                                    d="M4 6l4 4 4-4"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </svg>
                        </button>
                        {isOpen && <div className={rs(a.content)}>{item.content}</div>}
                    </div>
                );
            })}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Tooltip (CSS-only hover, no lib dependency)
// ─────────────────────────────────────────────────────────────────────────────

export interface TooltipProps {
    content: string;
    children: ReactNode;
    side?: "top" | "bottom" | "left" | "right";
    className?: string;
}

export function Tooltip({ content, children, side = "top", className }: TooltipProps) {
    const { css } = useCss();
    const t = css.components?.base?.tooltip ?? {};

    const posClass = {
        top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
        bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
        left: "right-full top-1/2 -translate-y-1/2 mr-2",
        right: "left-full top-1/2 -translate-y-1/2 ml-2",
    }[side];

    return (
        <span className="relative inline-flex group">
            {children}
            <span
                role="tooltip"
                className={cn(
                    rs(t.content),
                    "absolute whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-150",
                    posClass,
                    className,
                )}
            >
                {content}
            </span>
        </span>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Dropdown Menu
// ─────────────────────────────────────────────────────────────────────────────

export interface DropdownItem {
    label: string;
    icon?: ReactNode;
    shortcut?: string;
    onClick?: () => void;
    danger?: boolean;
    disabled?: boolean;
    separator?: false;
}

export interface DropdownSeparator {
    separator: true;
    label?: string;
}

export type DropdownEntry = DropdownItem | DropdownSeparator;

export interface DropdownMenuProps {
    trigger: ReactNode;
    items: DropdownEntry[];
    align?: "left" | "right";
    className?: string;
}

export function DropdownMenu({ trigger, items, align = "left", className }: DropdownMenuProps) {
    const { css } = useCss();
    const d = css.components?.base?.dropdown ?? {};
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handle = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handle);
        return () => document.removeEventListener("mousedown", handle);
    }, []);

    return (
        <div ref={ref} className="relative inline-flex">
            <div onClick={() => setOpen((p) => !p)}>{trigger}</div>
            {open && (
                <div
                    className={cn(
                        rs(d.content),
                        "absolute top-full mt-1",
                        align === "right" ? "right-0" : "left-0",
                        className,
                    )}
                >
                    {items.map((item, i) => {
                        if ("separator" in item && item.separator) {
                            return item.label ? (
                                <p key={i} className={rs(d.label)}>
                                    {item.label}
                                </p>
                            ) : (
                                <div key={i} className={rs(d.separator)} />
                            );
                        }
                        const it = item as DropdownItem;
                        return (
                            <button
                                key={i}
                                type="button"
                                disabled={it.disabled}
                                onClick={() => {
                                    it.onClick?.();
                                    setOpen(false);
                                }}
                                className={cn(
                                    "w-full text-left",
                                    it.danger ? rs(d.itemDanger) : rs(d.item),
                                )}
                            >
                                {it.icon && <span className={rs(d.icon)}>{it.icon}</span>}
                                <span className="flex-1">{it.label}</span>
                                {it.shortcut && (
                                    <span className={rs(d.shortcut)}>{it.shortcut}</span>
                                )}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Modal
// ─────────────────────────────────────────────────────────────────────────────

export interface ModalProps {
    open: boolean;
    onClose: () => void;
    title?: string;
    description?: string;
    size?: "md" | "lg";
    children?: ReactNode;
    footer?: ReactNode;
}

export function Modal({
    open,
    onClose,
    title,
    description,
    size = "md",
    children,
    footer,
}: ModalProps) {
    const { css } = useCss();
    const m = css.components?.base?.modal ?? {};

    useEffect(() => {
        if (!open) return;
        const handler = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        document.addEventListener("keydown", handler);
        return () => document.removeEventListener("keydown", handler);
    }, [open, onClose]);

    if (!open) return null;

    const contentKey = size === "lg" ? "contentLg" : "content";

    return (
        <>
            <div className={rs(m.overlay)} onClick={onClose} aria-hidden />
            <div
                role="dialog"
                aria-modal
                aria-labelledby={title ? "modal-title" : undefined}
                className={rs(m[contentKey])}
            >
                {(title || description) && (
                    <div className={rs(m.header)}>
                        <div>
                            {title && (
                                <h2 id="modal-title" className={rs(m.title)}>
                                    {title}
                                </h2>
                            )}
                            {description && <p className={rs(m.description)}>{description}</p>}
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            className={rs(m.closeButton)}
                            aria-label="Close"
                        >
                            <svg
                                className={rs(m.closeButton?.icon)}
                                viewBox="0 0 16 16"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth={1.5}
                            >
                                <path d="M4 4l8 8M12 4l-8 8" strokeLinecap="round" />
                            </svg>
                        </button>
                    </div>
                )}
                {children && <div className={rs(m.body)}>{children}</div>}
                {footer && <div className={rs(m.footer)}>{footer}</div>}
            </div>
        </>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Drawer
// ─────────────────────────────────────────────────────────────────────────────

export interface DrawerProps {
    open: boolean;
    onClose: () => void;
    side?: "left" | "right";
    title?: string;
    children?: ReactNode;
    footer?: ReactNode;
}

export function Drawer({ open, onClose, side = "right", title, children, footer }: DrawerProps) {
    const { css } = useCss();
    const dr = css.components?.base?.drawer ?? {};

    useEffect(() => {
        if (!open) return;
        const h = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        document.addEventListener("keydown", h);
        return () => document.removeEventListener("keydown", h);
    }, [open, onClose]);

    if (!open) return null;

    return (
        <>
            <div className={rs(dr.overlay)} onClick={onClose} aria-hidden />
            <div role="dialog" aria-modal className={rs(dr[side])}>
                <div className={rs(dr.header)}>
                    {title && <h2 className={rs(dr.title)}>{title}</h2>}
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close"
                        className="ml-auto rounded p-1.5 text-[var(--color-text-tertiary)] hover:bg-[var(--color-muted)] transition-colors"
                    >
                        <svg
                            className="h-4 w-4"
                            viewBox="0 0 16 16"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={1.5}
                        >
                            <path d="M4 4l8 8M12 4l-8 8" strokeLinecap="round" />
                        </svg>
                    </button>
                </div>
                <div className={rs(dr.body)}>{children}</div>
                {footer && <div className={rs(dr.footer)}>{footer}</div>}
            </div>
        </>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// EmptyState
// ─────────────────────────────────────────────────────────────────────────────

export interface EmptyStateProps {
    icon?: ReactNode;
    title: string;
    description?: string;
    actions?: ReactNode;
    className?: string;
}

export function EmptyState({ icon, title, description, actions, className }: EmptyStateProps) {
    const { css } = useCss();
    const e = css.components?.base?.emptyState ?? {};

    return (
        <div className={cn(rs(e.root), className)}>
            {icon && <div className={rs(e.icon)}>{icon}</div>}
            <p className={rs(e.title)}>{title}</p>
            {description && <p className={rs(e.description)}>{description}</p>}
            {actions && <div className={rs(e.actions)}>{actions}</div>}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Stat Card
// ─────────────────────────────────────────────────────────────────────────────

export interface StatProps {
    label: string;
    value: ReactNode;
    delta?: { value: string | number; direction: "up" | "down" | "neutral" };
    icon?: ReactNode;
    className?: string;
}

export function Stat({ label, value, delta, icon, className }: StatProps) {
    const { css } = useCss();
    const s = css.components?.base?.stat ?? {};

    const deltaStyleKey =
        delta?.direction === "up"
            ? "positive-style"
            : delta?.direction === "down"
              ? "negative-style"
              : "neutral-style";

    return (
        <div className={cn(rs(s.root), className)}>
            <div className="flex items-start justify-between">
                <p className={rs(s.label)}>{label}</p>
                {icon && <div className={rs(s.icon)}>{icon}</div>}
            </div>
            <p className={rs(s.value)}>{value}</p>
            {delta && (
                <p className={cn(rs(s.delta), s.delta?.[deltaStyleKey])}>
                    <span aria-hidden>
                        {delta.direction === "up" ? "↑" : delta.direction === "down" ? "↓" : "–"}
                    </span>
                    {delta.value}
                </p>
            )}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Chip
// ─────────────────────────────────────────────────────────────────────────────

export interface ChipProps {
    children: ReactNode;
    selected?: boolean;
    onClick?: () => void;
    onRemove?: () => void;
    className?: string;
    disabled?: boolean;
}

export function Chip({ children, selected, onClick, onRemove, className, disabled }: ChipProps) {
    const { css } = useCss();
    const c = css.components?.base?.chip ?? {};

    return (
        <span
            className={cn(
                rs(c.root),
                onClick ? rs(c.interactive) : "",
                selected ? rs(c.selected) : "",
                disabled ? "opacity-50 pointer-events-none" : "",
                className,
            )}
            onClick={disabled ? undefined : onClick}
            role={onClick ? "button" : undefined}
            tabIndex={onClick && !disabled ? 0 : undefined}
        >
            {children}
            {onRemove && (
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        onRemove();
                    }}
                    className={rs(c.remove)}
                    aria-label="Remove"
                >
                    <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={1.5}>
                        <path d="M3 3l6 6M9 3l-6 6" strokeLinecap="round" />
                    </svg>
                </button>
            )}
        </span>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Breadcrumb
// ─────────────────────────────────────────────────────────────────────────────

export interface BreadcrumbItem {
    label: string;
    href?: string;
    onClick?: () => void;
}

export interface BreadcrumbProps {
    items: BreadcrumbItem[];
    className?: string;
}

export function Breadcrumb({ items, className }: BreadcrumbProps) {
    const { css } = useCss();
    const b = css.components?.base?.breadcrumb ?? {};

    return (
        <nav aria-label="Breadcrumb" className={cn(rs(b.root), className)}>
            {items.map((item, i) => {
                const isLast = i === items.length - 1;
                return (
                    <React.Fragment key={i}>
                        {i > 0 && (
                            <span aria-hidden className={rs(b.separator)}>
                                {b.separator?.CONTENT ?? "/"}
                            </span>
                        )}
                        {isLast ? (
                            <span className={rs(b.current)} aria-current="page">
                                {item.label}
                            </span>
                        ) : (
                            <button type="button" onClick={item.onClick} className={rs(b.item)}>
                                {item.label}
                            </button>
                        )}
                    </React.Fragment>
                );
            })}
        </nav>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// List
// ─────────────────────────────────────────────────────────────────────────────

export interface ListItem {
    id: string | number;
    title: string;
    subtitle?: string;
    leading?: ReactNode;
    trailing?: ReactNode;
    onClick?: () => void;
    selected?: boolean;
}

export interface ListProps {
    items: ListItem[];
    className?: string;
}

export function List({ items, className }: ListProps) {
    const { css } = useCss();
    const l = css.components?.base?.list ?? {};

    return (
        <div className={cn(rs(l.root), className)}>
            {items.map((item) => (
                <div
                    key={item.id}
                    className={cn(
                        rs(l.item),
                        item.onClick ? rs(l.itemInteractive) : "",
                        item.selected ? rs(l.itemSelected) : "",
                    )}
                    onClick={item.onClick}
                    role={item.onClick ? "button" : undefined}
                    tabIndex={item.onClick ? 0 : undefined}
                >
                    {item.leading && <div className={rs(l.itemLeading)}>{item.leading}</div>}
                    <div className="flex-1 min-w-0">
                        <p className={rs(l.itemTitle)}>{item.title}</p>
                        {item.subtitle && <p className={rs(l.itemSubtitle)}>{item.subtitle}</p>}
                    </div>
                    {item.trailing && <div className={rs(l.itemTrailing)}>{item.trailing}</div>}
                </div>
            ))}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Form helpers
// ─────────────────────────────────────────────────────────────────────────────

export function Form({
    onSubmit,
    className,
    children,
}: {
    onSubmit?: (e: React.FormEvent) => void;
    className?: string;
    children: ReactNode;
}) {
    const { css } = useCss();
    const f = css.components?.base?.form ?? {};

    return (
        <form
            onSubmit={(e) => {
                e.preventDefault();
                onSubmit?.(e);
            }}
            className={cn(rs(f.root), className)}
            noValidate
        >
            {children}
        </form>
    );
}

export function FormGroup({ className, children }: { className?: string; children: ReactNode }) {
    const { css } = useCss();
    return <div className={cn(rs(css.components?.base?.form?.group), className)}>{children}</div>;
}

export function FormRow({ className, children }: { className?: string; children: ReactNode }) {
    const { css } = useCss();
    return <div className={cn(rs(css.components?.base?.form?.row), className)}>{children}</div>;
}

export function FormSection({
    title,
    className,
    children,
}: {
    title?: string;
    className?: string;
    children: ReactNode;
}) {
    const { css } = useCss();
    const f = css.components?.base?.form ?? {};

    return (
        <div className={cn(rs(f.section), className)}>
            {title && <p className={rs(f.sectionTitle)}>{title}</p>}
            {children}
        </div>
    );
}

export function FormActions({ className, children }: { className?: string; children: ReactNode }) {
    const { css } = useCss();
    return <div className={cn(rs(css.components?.base?.form?.actions), className)}>{children}</div>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Page Shell
// ─────────────────────────────────────────────────────────────────────────────

export function PageShell({ children, className }: { children: ReactNode; className?: string }) {
    const { css } = useCss();
    return (
        <div className={cn(rs(css.components?.base?.pageShell?.root), className)}>{children}</div>
    );
}

export function PageHeader({ children, className }: { children: ReactNode; className?: string }) {
    const { css } = useCss();
    const p = css.components?.base?.pageShell ?? {};
    return (
        <header className={cn(rs(p.header), className)}>
            <div className={rs(p.headerInner)}>{children}</div>
        </header>
    );
}

export function PageContent({
    children,
    width = "default",
    className,
}: {
    children: ReactNode;
    width?: "default" | "narrow" | "wide";
    className?: string;
}) {
    const { css } = useCss();
    const p = css.components?.base?.pageShell ?? {};
    const key = width === "narrow" ? "contentNarrow" : width === "wide" ? "contentWide" : "content";

    return <main className={cn(rs(p[key]), className)}>{children}</main>;
}

export function PageSection({
    title,
    action,
    children,
    className,
}: {
    title?: string;
    action?: ReactNode;
    children: ReactNode;
    className?: string;
}) {
    const { css } = useCss();
    const p = css.components?.base?.pageShell ?? {};

    return (
        <section className={cn(rs(p.section), className)}>
            {(title || action) && (
                <div className={rs(p.sectionHeader)}>
                    {title && <h2 className={rs(p.sectionTitle)}>{title}</h2>}
                    {action && <div>{action}</div>}
                </div>
            )}
            {children}
        </section>
    );
}
