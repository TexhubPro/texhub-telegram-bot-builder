import { useContext } from 'react';
import { GraphActionsContext } from './graph-actions-context';
import { CopyIcon, EditIcon, TrashIcon } from '../ui/icons';

type Props = {
    nodeId: string;
    canEdit?: boolean;
    canDuplicate?: boolean;
};

export function NodeActionButtons({ nodeId, canEdit = true, canDuplicate = true }: Props) {
    const { onEditNode, onDeleteNode, onDuplicateNode } = useContext(GraphActionsContext);
    return (
        <div className="pointer-events-none absolute -top-[8px] right-6 z-20 flex items-center gap-1 opacity-0 transition group-hover:opacity-100 group-hover:pointer-events-auto">
            {canEdit ? (
                <button
                    type="button"
                    onClick={(event) => {
                        event.stopPropagation();
                        onEditNode(nodeId);
                    }}
                    className="nodrag nopan flex h-4 w-4 cursor-pointer items-center justify-center rounded-md bg-blue-500 p-0.5 text-white transition hover:bg-blue-600"
                    aria-label="Edit"
                >
                    <EditIcon />
                </button>
            ) : null}
            {canDuplicate ? (
                <button
                    type="button"
                    onClick={(event) => {
                        event.stopPropagation();
                        onDuplicateNode(nodeId);
                    }}
                    className="nodrag nopan flex h-4 w-4 cursor-pointer items-center justify-center rounded-md bg-slate-500 p-0.5 text-white transition hover:bg-slate-600"
                    aria-label="Duplicate"
                >
                    <CopyIcon />
                </button>
            ) : null}
            <button
                type="button"
                onClick={(event) => {
                    event.stopPropagation();
                    onDeleteNode(nodeId);
                }}
                className="nodrag nopan flex h-4 w-4 cursor-pointer items-center justify-center rounded-md bg-red-500 p-0.5 text-white transition hover:bg-red-600"
                aria-label="Delete"
            >
                <TrashIcon />
            </button>
        </div>
    );
}
