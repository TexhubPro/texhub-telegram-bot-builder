import { useContext } from 'react';
import { Handle, Position, type NodeProps } from 'reactflow';
import { AddEdgeMenuContext } from './add-edge-context';
import { NodeActionButtons } from './node-action-buttons';
import type { NodeData } from '../types';
import { PlusIcon } from '../ui/icons';

export function EditMessageNode({ data, id, selected }: NodeProps<NodeData>) {
    const { onOpenAddMenu } = useContext(AddEdgeMenuContext);
    const text = (data.editMessageText || '').trim();
    return (
        <div className="group relative rounded-lg border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900 shadow-[0_10px_24px_rgba(56,189,248,0.18)]">
            <Handle
                type="target"
                position={Position.Left}
                style={{ width: 12, height: 12, borderWidth: 2, background: '#0284c7' }}
            />
            <NodeActionButtons nodeId={id} isVisible={selected} canEdit />
            <div className="min-w-[170px] max-w-64">
                <div className="text-xs font-semibold uppercase tracking-wide text-sky-600">Сообщение</div>
                <div className="text-sm font-semibold">{text || 'Изменить'}</div>
            </div>
            <Handle
                type="source"
                position={Position.Right}
                style={{ width: 12, height: 12, borderWidth: 2, background: '#0284c7' }}
            />
            {data.canAddChild ? (
                <button
                    type="button"
                    onClick={(event) => {
                        event.stopPropagation();
                        onOpenAddMenu(id, { x: event.clientX, y: event.clientY });
                    }}
                    className="absolute top-1/2 -right-3 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full border border-sky-200 bg-white text-sky-500 shadow-sm transition hover:text-sky-700"
                    aria-label="Добавить связь"
                >
                    <PlusIcon />
                </button>
            ) : null}
        </div>
    );
}

