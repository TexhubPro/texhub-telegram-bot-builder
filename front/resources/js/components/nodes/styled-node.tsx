import { useContext } from 'react';
import { Handle, Position, type NodeProps } from 'reactflow';
import { AddEdgeMenuContext } from './add-edge-context';
import { NodeActionButtons } from './node-action-buttons';
import type { NodeData } from '../types';
import { PlusIcon } from '../ui/icons';

export function StyledNode({ data, id }: NodeProps<NodeData>) {
    const { onOpenAddMenu } = useContext(AddEdgeMenuContext);
    return (
        <div
            className="relative rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 shadow-[0_10px_30px_rgba(15,23,42,0.08)]"
            style={{ backgroundColor: data.color ?? '#FFFFFF' }}
        >
            <Handle
                type="target"
                position={Position.Left}
                style={{ width: 14, height: 14, borderWidth: 2, background: '#0f172a' }}
            />
            <NodeActionButtons nodeId={id} canEdit={false} />
            <div className="min-w-[120px]">{data.label}</div>
            <Handle
                type="source"
                position={Position.Right}
                style={{ width: 14, height: 14, borderWidth: 2, background: '#0f172a' }}
            />
            {data.canAddChild ? (
                <button
                    type="button"
                    onClick={(event) => {
                        event.stopPropagation();
                        onOpenAddMenu(id, { x: event.clientX, y: event.clientY });
                    }}
                    className="absolute -right-3 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:text-slate-800"
                    aria-label="Добавить связь"
                >
                    <PlusIcon />
                </button>
            ) : null}
        </div>
    );
}
