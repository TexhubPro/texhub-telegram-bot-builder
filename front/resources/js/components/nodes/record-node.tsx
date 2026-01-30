import { Handle, Position, type NodeProps } from 'reactflow';
import { NodeActionButtons } from './node-action-buttons';
import type { NodeData } from '../types';

const recordLabels: Record<string, string> = {
    text: 'Текст сообщения',
    name: 'Имя',
    first_name: 'First name',
    last_name: 'Last name',
    username: 'Username',
    full_name: 'Полное имя',
    chat_id: 'Chat ID',
    photo_id: 'Photo file_id',
    video_id: 'Video file_id',
    audio_id: 'Audio file_id',
    document_id: 'Document file_id',
};

export function RecordNode({ data, id }: NodeProps<NodeData>) {
    const field = data.recordField || 'text';
    const label = recordLabels[field] || 'Запись';

    return (
        <div className="group relative rounded-lg border border-lime-200 bg-lime-50 px-4 py-3 text-sm text-lime-900 shadow-[0_10px_24px_rgba(132,204,22,0.18)]">
            <Handle type="target" position={Position.Left} style={{ width: 12, height: 12, borderWidth: 2, background: '#65a30d' }} />

            <NodeActionButtons nodeId={id} canEdit />

            <div className="min-w-[170px]">
                <div className="text-xs font-semibold tracking-wide text-lime-600 uppercase">Запись</div>
                <div className="text-sm font-semibold">{label}</div>
            </div>

            <Handle type="source" position={Position.Right} style={{ width: 12, height: 12, borderWidth: 2, background: '#65a30d' }} />
        </div>
    );
}
