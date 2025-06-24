import React from 'react';
import { css } from '../../../styled-system/css';

const UndoButton = ({ onUndo, disabled = false, undoCount = 1, ...props }) => {
    return (
        <button
            onClick={onUndo}
            disabled={disabled}
            className={css({
                position: 'fixed',
                bottom: '20px',
                right: '20px',
                background: 'rgba(0, 0, 0, 0.8)',
                color: 'white',
                border: 'none',
                borderRadius: '50px',
                padding: '12px 20px',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                fontSize: '14px',
                fontWeight: 'bold',
                zIndex: '1000',
                transition: 'all 0.2s ease-in-out',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                _hover: {
                    background: 'rgba(0, 0, 0, 0.9)',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 6px 16px rgba(0, 0, 0, 0.4)',
                },
                _active: {
                    transform: 'translateY(0px)',
                },
                _disabled: {
                    cursor: 'not-allowed',
                    opacity: '0.5',
                    transform: 'none',
                }
            })}
            {...props}
        >            <span className={css({
                fontSize: '16px',
                transform: 'rotate(180deg)',
                display: 'inline-block'
            })}>
                ↻
            </span>
            Undo Move {undoCount > 1 && `(${undoCount})`}
        </button>
    );
};

export default UndoButton;
