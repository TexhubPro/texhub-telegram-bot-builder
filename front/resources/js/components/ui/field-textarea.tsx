type Props = {
    label: string;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
};

export function FieldTextarea({ label, value, onChange, placeholder }: Props) {
    return (
        <div className="flex flex-col gap-2">
            <label className="block text-xs font-semibold text-slate-600">{label}</label>
            <textarea
                aria-label={label}
                value={value}
                onChange={(event) => onChange(event.target.value)}
                placeholder={placeholder}
                rows={6}
                className="w-full resize-y rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-400"
            />
        </div>
    );
}
