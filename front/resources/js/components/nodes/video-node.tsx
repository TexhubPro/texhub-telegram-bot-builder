import { Handle, Position, type NodeProps } from 'reactflow';
import { NodeActionButtons } from './node-action-buttons';
import type { NodeData } from '../types';

export function VideoNode({ data, id }: NodeProps<NodeData>) {
    const count = data.videoUrls?.length ?? 0;
    const label = count === 1 ? '1 видео' : `${count} видео`;
    return (
        <div className="group relative rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm text-indigo-900 shadow-[0_10px_24px_rgba(99,102,241,0.18)]">
            <Handle
                type="target"
                position={Position.Left}
                style={{ width: 12, height: 12, borderWidth: 2, background: '#4f46e5' }}
            />
            <NodeActionButtons nodeId={id} canEdit />
            <div className="min-w-[170px]">
                <div className="text-xs font-semibold uppercase tracking-wide text-indigo-600">Видео</div>
                <div className="text-sm font-semibold">{count ? label : 'Нет видео'}</div>
            </div>
            <Handle
                type="source"
                position={Position.Right}
                style={{ width: 12, height: 12, borderWidth: 2, background: '#4f46e5' }}
            />
        </div>
    );
}
