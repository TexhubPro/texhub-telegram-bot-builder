import { Button } from '@heroui/react';
import type { ContextMenu, NodeData } from '../types';

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
    currentNode: import('reactflow').Node<NodeData> | null;
    linkCandidates: LinkCandidate[];
    createTemplates: CreateTemplate[];
    linkSearch: string;
    onLinkSearchChange: (value: string) => void;
    onLinkToNode: (nodeId: string) => void;
    onCreateAndLink: (templateKey: string) => void;
    onEditCommand: () => void;
    onEditMessage: () => void;
    onEditButtonText: () => void;
    onEditBotToken: () => void;
    onDeleteNode: () => void;
    onDeleteEdge: () => void;
};

export function NodeContextMenu({
    menu,
    currentNode,
    linkCandidates,
    createTemplates,
    linkSearch,
    onLinkSearchChange,
    onLinkToNode,
    onCreateAndLink,
    onEditCommand,
    onEditMessage,
    onEditButtonText,
    onEditBotToken,
    onDeleteNode,
    onDeleteEdge,
}: Props) {
    if (!menu) {
        return null;
    }

    const isCommandNode = currentNode?.data.kind === 'command';
    const isMessageNode = currentNode?.data.kind === 'message';
    const isBotNode = currentNode?.data.kind === 'bot';
    const isButtonNode =
        currentNode?.data.kind === 'message_button' || currentNode?.data.kind === 'reply_button';

    return (
        <div
            className="fixed z-50 w-64 rounded-xl border border-slate-200 bg-white p-2 shadow-lg"
            style={{ left: menu.x, top: menu.y }}
        >
            {menu.kind === 'add-edge' ? (
                <>
                    <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Связать с нодой
                    </div>
                    <input
                        value={linkSearch}
                        onChange={(event) => onLinkSearchChange(event.target.value)}
                        placeholder="Поиск ноды"
                        className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm text-slate-800 outline-none transition focus:border-slate-400"
                    />
                    <div className="mt-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Создать новую
                    </div>
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
                </>
            ) : menu.kind === 'node' ? (
                <>
                    {isCommandNode ? (
                        <Button size="sm" variant="flat" onPress={onEditCommand} className="w-full justify-start">
                            Изменить команду
                        </Button>
                    ) : null}
                    {isMessageNode ? (
                        <Button size="sm" variant="flat" onPress={onEditMessage} className="mt-2 w-full justify-start">
                            Изменить сообщение
                        </Button>
                    ) : null}
                    {isButtonNode ? (
                        <Button size="sm" variant="flat" onPress={onEditButtonText} className="mt-2 w-full justify-start">
                            Изменить текст кнопки
                        </Button>
                    ) : null}
                    {isBotNode ? (
                        <Button size="sm" variant="flat" onPress={onEditBotToken} className="mt-2 w-full justify-start">
                            Изменить токен
                        </Button>
                    ) : null}
                    <Button
                        size="sm"
                        color="danger"
                        variant="flat"
                        onPress={onDeleteNode}
                        className="mt-2 w-full justify-start"
                    >
                        Удалить ноду
                    </Button>
                </>
            ) : (
                <Button size="sm" color="danger" variant="flat" onPress={onDeleteEdge} className="w-full">
                    Удалить связь
                </Button>
            )}
        </div>
    );
}
