import { useContext } from 'react';
import { Handle, Position, type NodeProps } from 'reactflow';
import { AddEdgeMenuContext } from './add-edge-context';
import { NodeActionButtons } from './node-action-buttons';
import type { NodeData } from '../types';
import { PlusIcon } from '../ui/icons';

export function DeleteMessageNode({ data, id, selected }: NodeProps<NodeData>) {
    const { onOpenAddMenu } = useContext(AddEdgeMenuContext);
    return (
        <div className="group relative rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900 shadow-[0_10px_24px_rgba(244,63,94,0.18)]">
            <Handle
                type="target"
                position={Position.Left}
                style={{ width: 12, height: 12, borderWidth: 2, background: '#e11d48' }}
            />
            <NodeActionButtons nodeId={id} isVisible={selected} canEdit={false} />
            <div className="min-w-[170px]">
                <div className="text-xs font-semibold uppercase tracking-wide text-rose-600">Сообщение</div>
                <div className="text-sm font-semibold">Удалить</div>
            </div>
            <Handle
                type="source"
                position={Position.Right}
                style={{ width: 12, height: 12, borderWidth: 2, background: '#e11d48' }}
            />
            {data.canAddChild ? (
                <button
                    type="button"
                    onClick={(event) => {
                        event.stopPropagation();
                        onOpenAddMenu(id, { x: event.clientX, y: event.clientY });
                    }}
                    className="absolute top-1/2 -right-3 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full border border-rose-200 bg-white text-rose-500 shadow-sm transition hover:text-rose-700"
                    aria-label="Добавить связь"
                >
                    <PlusIcon />
                </button>
            ) : null}
        </div>
    );
}

