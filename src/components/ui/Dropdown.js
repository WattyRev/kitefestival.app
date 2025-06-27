import { useState, useEffect, useRef, useCallback } from "react";
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

    const autoClose = useCallback(event => {
        if (!isOpen) {
            return;
        }
        if (wrapperRef.current.contains(event.target)) {
            return;
        }
        handleClose();
    }, [isOpen]);

    useEffect(() => {
        document.addEventListener("click", autoClose);

        return () => {
            document.removeEventListener("click", autoClose);
        }
    }, [isOpen, autoClose])

    const renderData = { open: handleOpen, close: handleClose, isOpen};

    return (
        <div {...props} ref={wrapperRef} className={css({ position: 'relative' })}>
            {children(renderData)}            {isOpen && (
                <div className={css({ 
                    position: 'absolute', 
                    top: '100%', 
                    right: { base: '0', sm: '0' }, 
                    left: { base: 'auto', sm: 'auto' },
                    background: 'white', 
                    border: '1px solid var(--colors-secondary)', 
                    borderRadius: '4px',
                    padding: '8px',
                    boxShadow: '0px 2px 2px -1px var(--colors-shadow)',
                    zIndex: '100',
                    minWidth: { base: '200px', sm: 'auto' },
                    maxWidth: { base: '90vw', sm: 'none' },
                    // Prevent dropdown from going off-screen on mobile
                    '@media (max-width: 640px)': {
                        right: 'auto',
                        left: '50%',
                        transform: 'translateX(-50%)',
                    }
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
            padding: { base: '12px 16px', sm: '8px 12px' },
            whiteSpace: 'nowrap',
            width: '100%',
            textAlign: 'left',
            fontSize: { base: '16px', sm: '14px' },
            minHeight: { base: '44px', sm: 'auto' }, // Minimum touch target for mobile
            border: 'none',
            background: 'transparent',
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