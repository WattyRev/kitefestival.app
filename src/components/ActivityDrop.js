import { useDroppable } from "@dnd-kit/core";
import { css } from "../../styled-system/css";

const ActivityDrop = ({ id, bucket, index }) => {
    const { isOver, setNodeRef } = useDroppable({
        id,
        data: { bucket, index },
    });

    return (
        <div
            ref={setNodeRef}
            className={`${isOver ? "isOver" : ""} ${css({
                transition: "all 0.2s ease-in-out",
                border: "0px dashed #cdcdcd",

                "&.isOver": {
                    border: "2px dashed #0537fc",
                },
            })}`}
        />
    );
};

export default ActivityDrop;
