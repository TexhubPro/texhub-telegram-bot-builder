import { useContext } from 'react';
import { Handle, Position, type NodeProps } from 'reactflow';
import { AddEdgeMenuContext } from './add-edge-context';
import type { NodeData } from '../types';
import { PlusIcon } from '../ui/icons';

export function CommandNode({ data, id }: NodeProps<NodeData>) {
    const { onOpenAddMenu } = useContext(AddEdgeMenuContext);
    return (
        <div className="relative rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm text-indigo-900 shadow-[0_12px_30px_rgba(99,102,241,0.18)]">
            <Handle
                type="target"
                position={Position.Left}
                style={{ width: 14, height: 14, borderWidth: 2, background: '#4338ca' }}
            />
            <div className="min-w-[150px]">
                <div className="text-xs font-semibold uppercase tracking-wide text-indigo-600">Команда</div>
                <div className="text-sm font-semibold">{data.commandText ?? '/start'}</div>
            </div>
            <Handle
                type="source"
                position={Position.Right}
                style={{ width: 14, height: 14, borderWidth: 2, background: '#4338ca' }}
            />
            {data.canAddChild ? (
                <button
                    type="button"
                    onClick={(event) => {
                        event.stopPropagation();
                        onOpenAddMenu(id, { x: event.clientX, y: event.clientY });
                    }}
                    className="absolute -right-3 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full border border-indigo-200 bg-white text-indigo-500 shadow-sm transition hover:text-indigo-700"
                    aria-label="Добавить связь"
                >
                    <PlusIcon />
                </button>
            ) : null}
        </div>
    );
}
