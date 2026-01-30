import { useContext } from 'react';
import { GraphActionsContext } from './graph-actions-context';
import { EditIcon, TrashIcon } from '../ui/icons';

type Props = {
    nodeId: string;
    canEdit?: boolean;
};

export function NodeActionButtons({ nodeId, canEdit = true }: Props) {
    const { onEditNode, onDeleteNode } = useContext(GraphActionsContext);
    return (
        <div className="absolute -top-[8px] left-6 flex items-center gap-1">
            {canEdit ? (
                <button
                    type="button"
                    onClick={(event) => {
                        event.stopPropagation();
                        onEditNode(nodeId);
                    }}
                    className="nodrag nopan flex h-4 w-4 cursor-pointer items-center justify-center rounded-md bg-blue-500 p-0.5 text-white transition hover:bg-blue-600"
                    aria-label="Изменить"
                >
                    <EditIcon />
                </button>
            ) : null}
            <button
                type="button"
                onClick={(event) => {
                    event.stopPropagation();
                    onDeleteNode(nodeId);
                }}
                className="nodrag nopan flex h-4 w-4 cursor-pointer items-center justify-center rounded-md bg-red-500 p-0.5 text-white transition hover:bg-red-600"
                aria-label="Удалить"
            >
                <TrashIcon />
            </button>
        </div>
    );
}
