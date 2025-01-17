import { useDroppable } from "@dnd-kit/core";
import { css } from "../../styled-system/css";

const ActivityDropZone = ({ id, bucket, index, text }) => {
    const { isOver, setNodeRef } = useDroppable({
        id,
        data: { bucket, index },
    })

    return <div 
        ref={setNodeRef}
        className={`${isOver ? 'isOver' : ''} ${css({
            transition: 'border 0.2s ease-in-out',
            border: '2px dashed #cdcdcd',
            padding: '8px',
            margin: '8px',
            textAlign: 'center',

            '&.isOver': {
                border: '2px dashed #0537fc',
            }
        })}`}
    >
        <p>{text}</p>
    </div>
}

export default ActivityDropZone;