import { useContext } from 'react';
import { Handle, Position, type NodeProps } from 'reactflow';
import { AddEdgeMenuContext } from './add-edge-context';
import { NodeActionButtons } from './node-action-buttons';
import type { NodeData } from '../types';
import { PlusIcon } from '../ui/icons';

export function WebhookNode({ data, id }: NodeProps<NodeData>) {
    const { onOpenAddMenu } = useContext(AddEdgeMenuContext);
    return (
        <div className="group relative rounded-lg border border-cyan-200 bg-cyan-50 px-4 py-3 text-sm text-cyan-900 shadow-[0_10px_24px_rgba(6,182,212,0.18)]">
            <NodeActionButtons nodeId={id} canEdit={false} />
            <div className="min-w-[170px]">
                <div className="text-xs font-semibold uppercase tracking-wide text-cyan-600">Вебхук</div>
                <div className="text-sm font-semibold">Сообщение пользователя</div>
            </div>
            <Handle
                type="source"
                position={Position.Right}
                style={{ width: 12, height: 12, borderWidth: 2, background: '#0891b2' }}
            />
            {data.canAddChild ? (
                <button
                    type="button"
                    onClick={(event) => {
                        event.stopPropagation();
                        onOpenAddMenu(id, { x: event.clientX, y: event.clientY });
                    }}
                    className="absolute -right-3 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full border border-cyan-200 bg-white text-cyan-500 shadow-sm transition hover:text-cyan-700"
                    aria-label="Добавить связь"
                >
                    <PlusIcon />
                </button>
            ) : null}
        </div>
    );
}
