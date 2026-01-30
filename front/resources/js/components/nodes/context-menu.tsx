import type { ContextMenu } from '../types';

type LinkCandidate = {
    id: string;
    title: string;
    subtitle: string;
};

type CreateTemplate = {
    key: string;
    label: string;
    description: string;
};

type Props = {
    menu: ContextMenu | null;
    linkCandidates: LinkCandidate[];
    createTemplates: CreateTemplate[];
    linkSearch: string;
    onLinkSearchChange: (value: string) => void;
    onLinkToNode: (nodeId: string) => void;
    onCreateAndLink: (templateKey: string) => void;
};

export function NodeContextMenu({
    menu,
    linkCandidates,
    createTemplates,
    linkSearch,
    onLinkSearchChange,
    onLinkToNode,
    onCreateAndLink,
}: Props) {
    if (!menu || menu.kind !== 'add-edge') {
        return null;
    }

    return (
        <div
            className="fixed z-50 w-64 rounded-xl border border-slate-200 bg-white p-2 shadow-lg"
            style={{ left: menu.x, top: menu.y }}
        >
            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Связать с нодой</div>
            <input
                value={linkSearch}
                onChange={(event) => onLinkSearchChange(event.target.value)}
                placeholder="Поиск ноды"
                className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm text-slate-800 outline-none transition focus:border-slate-400"
            />
            <div className="mt-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Создать новую</div>
            <div className="mt-1 space-y-1">
                {createTemplates.length ? (
                    createTemplates.map((template) => (
                        <button
                            key={template.key}
                            type="button"
                            onClick={() => onCreateAndLink(template.key)}
                            className="flex w-full items-start justify-between gap-2 rounded-lg px-2 py-2 text-left text-sm text-slate-800 transition hover:bg-slate-100"
                        >
                            <span className="font-medium">{template.label}</span>
                            <span className="text-xs text-slate-500">{template.description}</span>
                        </button>
                    ))
                ) : (
                    <div className="px-2 py-2 text-xs text-slate-500">Нет вариантов</div>
                )}
            </div>
            <div className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Связать с существующей
            </div>
            <div className="mt-1 max-h-56 space-y-1 overflow-auto">
                {linkCandidates.length ? (
                    linkCandidates.map((candidate) => (
                        <button
                            key={candidate.id}
                            type="button"
                            onClick={() => onLinkToNode(candidate.id)}
                            className="flex w-full items-start justify-between gap-2 rounded-lg px-2 py-2 text-left text-sm text-slate-800 transition hover:bg-slate-100"
                        >
                            <span className="font-medium">{candidate.title}</span>
                            <span className="text-xs text-slate-500">{candidate.subtitle}</span>
                        </button>
                    ))
                ) : (
                    <div className="px-2 py-2 text-xs text-slate-500">Ничего не найдено</div>
                )}
            </div>
        </div>
    );
}
