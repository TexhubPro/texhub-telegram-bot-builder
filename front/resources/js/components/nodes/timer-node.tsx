import { useContext } from 'react';
import { Handle, Position, type NodeProps } from 'reactflow';
import { AddEdgeMenuContext } from './add-edge-context';
import { NodeActionButtons } from './node-action-buttons';
import type { NodeData } from '../types';
import { PlusIcon } from '../ui/icons';

const resolveSeconds = (value?: number | string) => {
    if (typeof value === 'number' && Number.isFinite(value)) {
        return value;
    }
    if (typeof value === 'string') {
        const parsed = Number(value);
        if (Number.isFinite(parsed)) {
            return parsed;
        }
    }
    return 0;
};

export function TimerNode({ data, id, selected }: NodeProps<NodeData>) {
    const { onOpenAddMenu } = useContext(AddEdgeMenuContext);
    const seconds = resolveSeconds(data.timerSeconds);
    return (
        <div className="group relative rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm text-indigo-900 shadow-[0_10px_24px_rgba(99,102,241,0.18)]">
            <Handle type="target" position={Position.Left} style={{ width: 12, height: 12, borderWidth: 2, background: '#4f46e5' }} />
            <NodeActionButtons nodeId={id} isVisible={selected} canEdit />
            <div className="max-w-96 min-w-fit">
                <div className="text-xs font-semibold tracking-wide text-indigo-600 uppercase">Таймер</div>
                <div className="text-sm font-semibold">{seconds} сек</div>
            </div>
            <Handle type="source" position={Position.Right} style={{ width: 12, height: 12, borderWidth: 2, background: '#4f46e5' }} />
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

