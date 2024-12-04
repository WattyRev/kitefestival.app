import { css } from "../../../styled-system/css";

const Modal = ({ children, isOpen, onClose}) => {
    if (!isOpen) {
        return null;
    }
    return (
        <>
            <div
                data-testid="backdrop"
                className={css({ 
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0, 0, 0, 0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                })}
                onClick={onClose}
            />
            <div
                className={css({ 
                    position: 'fixed',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    background: 'white',
                    padding: '16px',
                    borderRadius: '4px',
                })}
            >
                {children}
            </div>
        </>
    );
}

export default Modal;