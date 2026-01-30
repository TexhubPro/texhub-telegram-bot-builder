type Props = {
    label: string;
    onChange: (files: File[]) => void;
};

export function ImageFileInput({ label, onChange }: Props) {
    return (
        <div className="flex flex-col gap-2">
            <label className="block text-xs font-semibold text-slate-600">{label}</label>
            <input
                type="file"
                accept="image/*"
                multiple
                className="block w-full text-sm text-slate-700 file:mr-3 file:rounded-md file:border file:border-slate-200 file:bg-white file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-slate-600 hover:file:bg-slate-50"
                onChange={(event) => {
                    onChange(Array.from(event.target.files ?? []));
                    event.target.value = '';
                }}
            />
        </div>
    );
}
