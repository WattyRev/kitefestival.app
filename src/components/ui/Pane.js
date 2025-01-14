import { createPortal } from 'react-dom';
import { createContext, useState, useContext } from 'react';
import { css } from "../../../styled-system/css";

const PaneContext = createContext({});

const PaneFrame = ({ children, onClose, ...props }) => {
    return (
        <div
            {...props}
            className={css({
                padding: '16px',
                borderLeft: '1px solid var(--colors-secondary)',
                height: '100%',
                overflow: 'auto',
                minWidth: '34vw',
            })}
        >
            <div className={css({ display: 'flex', justifyContent: 'space-between' })}>
                <div />
                <button 
                    data-testid="close-pane"
                    className={css({ cursor: 'pointer' })}
                    onClick={onClose}
                >
                    <i className="fa-solid fa-xmark" />
                </button>
            </div>
            {children}
        </div>
    )
}

export const PaneProvider = ({ children }) => {
    const [ isOpen, setIsOpen ] = useState(false);
    const [ paneContentId, setPaneContentId] = useState(null);

    function openPane(paneContentId) {
        setPaneContentId(paneContentId);
        setIsOpen(true);
    }

    function closePane() {
        setIsOpen(false);
    }

    return <PaneContext.Provider value={{ openPane, closePane, isOpen, paneContentId }}>
        <div 
            className={css({ 
                display: 'flex',
                height: 'calc(100vh - 40px)',
            })}
        >
            <div
                className={`${isOpen ? 'open' : 'closed'} ${css({
                    width: '100%',
                    transition: { sm: 'width 0.2s ease-in-out', base: 'none' },
                    height: '100%',
                    overflow: 'auto',

                    '&.open': {
                        width: { md: '66%', sm: '50%', base: '100%' },
                        display: { sm: 'block', base: 'none'}
                    }
                })}`}
            >
                {children}
            </div> 
            <div
                className={`${isOpen ? 'open' : 'closed'} ${css({
                    width: '0%',
                    transition: { sm: 'width 0.2s ease-in-out', base: 'none' },
                    height: '100%',
                    overflow: 'auto',

                    '&.open': {
                        width: { md: '34%', sm: '50%', base: '100%' }
                    }
                })}`}
            >
                <PaneFrame onClose={closePane} id="pane-overlay" />
            </div>
        </div>
    </PaneContext.Provider>
};

const Pane = ({ children, trigger }) => {
    const [ contentId, setContentId ] = useState(null);
    const { openPane, closePane, paneContentId, isOpen } = useContext(PaneContext);

    function open() {
        const id = `pane-${Date.now()}`;
        setContentId(id);
        openPane(id);
    }
    return (
        <>
            {trigger({ openPane: open, closePane, isOpen: isOpen && paneContentId === contentId })}
            {isOpen && paneContentId === contentId && createPortal(children, document.getElementById('pane-overlay'))}
        </>
    )
}

export default Pane;