import { css } from "../../../styled-system/css";
import Button from "./Button";

const FileInput = ({ label, disabled, ...props }) => {
    return (
        <div className={css({ position: "relative", margin: "4px" })}>
            <Button
                disabled={disabled}
                className={css({ width: "100%", margin: "0" })}
            >
                {label}
            </Button>
            <input
                disabled={disabled}
                className={css({
                    position: "absolute",
                    top: 0,
                    left: 0,
                    opacity: 0,
                    width: "100%",
                    height: "100%",
                    cursor: "pointer",
                })}
                {...props}
                type="file"
            />
        </div>
    );
};

export default FileInput;
