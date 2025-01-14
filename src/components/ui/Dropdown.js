import { useState, useEffect, useRef } from "react";
import { css } from "../../../styled-system/css";

const Dropdown = ({ children, dropdownContent, ...props }) => {
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef(null);

    function handleOpen() {
        setIsOpen(true);
    }
    function handleClose() {
        setIsOpen(false);
    }

    const autoClose = event => {
        if (!isOpen) {
            return;
        }
        if (wrapperRef.current.contains(event.target)) {
            return;
        }
        handleClose();
    };

    useEffect(() => {
        document.addEventListener("click", autoClose);

        return () => {
            document.removeEventListener("click", autoClose);
        }
    }, [isOpen, autoClose])

    const renderData = { open: handleOpen, close: handleClose, isOpen};

    return (
        <div {...props} ref={wrapperRef} className={css({ position: 'relative' })}>
            {children(renderData)}
            {isOpen && (
                <div className={css({ 
                    position: 'absolute', 
                    top: '100%', 
                    right: 0, 
                    background: 'white', 
                    border: '1px solid var(--colors-secondary)', 
                    borderRadius: '4px',
                    padding: '8px',
                    boxShadow: '0px 2px 2px -1px var(--colors-shadow',
                    zIndex: '100',
                })}>
                    {dropdownContent(renderData)}
                </div>
            )}
        </div>
    )
}

export default Dropdown

export const DropdownItem = ({ children, ...props }) => {
    return (
        <button className={css({
            display: 'block',
            cursor: 'pointer',
            padding: '4px 8px',
            whiteSpace: 'nowrap',
            width: '100%',
            textAlign: 'left',
            _disabled: {
                cursor: 'progress',
                opacity: '0.5',
            },
            _hover: {
                background: 'secondary',
            }
        })} {...props}>
            {children}
        </button>
    )
}