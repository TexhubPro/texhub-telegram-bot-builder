import { useContext } from 'react';
import { Handle, Position, type NodeProps } from 'reactflow';
import { AddEdgeMenuContext } from './add-edge-context';
import { NodeActionButtons } from './node-action-buttons';
import type { NodeData } from '../types';
import { PlusIcon } from '../ui/icons';

export function WebhookNode({ data, id, selected }: NodeProps<NodeData>) {
    const { onOpenAddMenu } = useContext(AddEdgeMenuContext);
    return (
        <div className="group relative rounded-xl border-2 border-blue-500 bg-white py-2 pr-5 pl-3 text-white">
            <NodeActionButtons nodeId={id} isVisible={selected} canEdit={false} canDuplicate={false} />
            <div className="flex items-center justify-center gap-3">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    className="icon icon-tabler icons-tabler-outline icon-tabler-webhook size-10 rounded-lg bg-blue-500 p-1"
                >
                    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                    <path d="M4.876 13.61a4 4 0 1 0 6.124 3.39h6" />
                    <path d="M15.066 20.502a4 4 0 1 0 1.934 -7.502c-.706 0 -1.424 .179 -2 .5l-3 -5.5" />
                    <path d="M16 8a4 4 0 1 0 -8 0c0 1.506 .77 2.818 2 3.5l-3 5.5" />
                </svg>
                <div className="font-sans font-bold text-slate-900 uppercase">WebHook</div>
            </div>
            <Handle type="source" position={Position.Right} style={{ width: 12, height: 12, borderWidth: 2, background: '#0891b2' }} />
        </div>
    );
}

