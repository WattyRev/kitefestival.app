import { useDrop } from "react-dnd";
import { css } from "../../styled-system/css";

const ActivityDrop = ({ onDrop, disableIds = [] }) => {
    const [{ canDrop, isOver }, drop] = useDrop(() => ({
        accept: 'activity',
        drop: activity => {
            onDrop(activity.id);
        },
        canDrop: activity => {
            const canDrop = !disableIds.includes(activity.id);
            return canDrop;
        },
        collect: monitor => ({
            isOver: monitor.isOver(),
            canDrop: monitor.canDrop()
        })
    }), [disableIds]);

    return <div 
        ref={drop}
        className={`${canDrop ? 'canDrop' : ''} ${isOver ? 'isOver' : ''} ${css({
            overflow: 'hidden',
            height: 0,
            transition: 'height 0.3s ease-in-out',

            '&.canDrop': {
                margin: '8px',
                padding: '16px',
                border: '2px dashed #c1c1cd',

                '&.isOver': {
                    height: '60px',
                }
            }
        })}`}
    >
        <p 
            className={`${isOver ? 'isOver' : ''} ${css({ 
                textAlign: 'center',
                opacity: '0',
                transition: 'opacity 0.3s ease-in-out',

                '&.isOver': {
                    opacity: '1',
                }
            })}`}
        >Drop Here</p>
    </div>
}

export default ActivityDrop;