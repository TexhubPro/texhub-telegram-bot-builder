import { useContext } from 'react';
import { Handle, Position, type NodeProps } from 'reactflow';
import { AddEdgeMenuContext } from './add-edge-context';
import { NodeActionButtons } from './node-action-buttons';
import type { NodeData } from '../types';
import { PlusIcon } from '../ui/icons';

export function MessageNode({ data, id }: NodeProps<NodeData>) {
    const { onOpenAddMenu } = useContext(AddEdgeMenuContext);
    return (
        <div className="relative rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 shadow-[0_12px_30px_rgba(251,191,36,0.18)]">
            <Handle
                type="target"
                position={Position.Left}
                style={{ width: 14, height: 14, borderWidth: 2, background: '#b45309' }}
            />
            <NodeActionButtons nodeId={id} canEdit />
            <div className="min-w-[160px]">
                <div className="text-xs font-semibold uppercase tracking-wide text-amber-700">Сообщение</div>
                <div className="text-sm font-semibold">{data.messageText ?? 'Привет'}</div>
            </div>
            <Handle
                type="source"
                position={Position.Right}
                style={{ width: 14, height: 14, borderWidth: 2, background: '#b45309' }}
            />
            {data.canAddChild ? (
                <button
                    type="button"
                    onClick={(event) => {
                        event.stopPropagation();
                        onOpenAddMenu(id, { x: event.clientX, y: event.clientY });
                    }}
                    className="absolute -right-3 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full border border-amber-200 bg-white text-amber-500 shadow-sm transition hover:text-amber-700"
                    aria-label="Добавить связь"
                >
                    <PlusIcon />
                </button>
            ) : null}
        </div>
    );
}
