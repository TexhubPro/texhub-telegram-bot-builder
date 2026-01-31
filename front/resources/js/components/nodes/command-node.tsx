import { useContext } from 'react';
import { Handle, Position, type NodeProps } from 'reactflow';
import { AddEdgeMenuContext } from './add-edge-context';
import { NodeActionButtons } from './node-action-buttons';
import type { NodeData } from '../types';
import { PlusIcon } from '../ui/icons';

export function CommandNode({ data, id, selected }: NodeProps<NodeData>) {
    const { onOpenAddMenu } = useContext(AddEdgeMenuContext);
    return (
        <div className="group relative rounded-lg border-2 border-purple-600 bg-purple-500 text-white">
            <Handle type="target" position={Position.Left} style={{ width: 14, height: 14, borderWidth: 2, background: '#4338ca' }} />
            <NodeActionButtons nodeId={id} isVisible={selected} canEdit />
            <div className="min-w-[150px]">
                <div className="rounded-t-md bg-white px-3 py-0.5 text-xs font-semibold tracking-wide text-purple-500 uppercase">Команда</div>
                <div className="px-3 py-1 text-sm font-semibold">{data.commandText ?? '/start'}</div>
            </div>
            <Handle type="source" position={Position.Right} style={{ width: 14, height: 14, borderWidth: 2, background: '#4338ca' }} />
            {data.canAddChild ? (
                <button
                    type="button"
                    onClick={(event) => {
                        event.stopPropagation();
                        onOpenAddMenu(id, { x: event.clientX, y: event.clientY });
                    }}
                    className="absolute top-1/2 -right-3 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full border border-indigo-200 bg-white text-indigo-500 shadow-sm transition hover:text-indigo-700"
                    aria-label="Добавить связь"
                >
                    <PlusIcon />
                </button>
            ) : null}
        </div>
    );
}

