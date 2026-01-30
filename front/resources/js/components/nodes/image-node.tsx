import { Handle, Position, type NodeProps } from 'reactflow';
import { NodeActionButtons } from './node-action-buttons';
import type { NodeData } from '../types';

export function ImageNode({ data, id }: NodeProps<NodeData>) {
    const count = data.imageUrls?.length ?? 0;
    const label = count === 1 ? '1 изображение' : `${count} изображений`;
    return (
        <div className="group relative rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900 shadow-[0_10px_24px_rgba(244,63,94,0.18)]">
            <Handle
                type="target"
                position={Position.Left}
                style={{ width: 12, height: 12, borderWidth: 2, background: '#e11d48' }}
            />
            <NodeActionButtons nodeId={id} canEdit />
            <div className="min-w-[170px]">
                <div className="text-xs font-semibold uppercase tracking-wide text-rose-600">Изображения</div>
                <div className="text-sm font-semibold">{count ? label : 'Нет изображений'}</div>
                {count ? (
                    <div className="mt-2 flex flex-wrap gap-1">
                        {data.imageUrls?.slice(0, 6).map((url) => (
                            <img
                                key={url}
                                src={url}
                                alt="thumb"
                                className="h-10 w-10 rounded-md object-cover"
                            />
                        ))}
                    </div>
                ) : null}
            </div>
            <Handle
                type="source"
                position={Position.Right}
                style={{ width: 12, height: 12, borderWidth: 2, background: '#e11d48' }}
            />
        </div>
    );
}
