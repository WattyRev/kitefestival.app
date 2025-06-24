import React from 'react';
import { css } from '../../../styled-system/css';

export const buttonStyles = css({ 
    background: 'success',
    padding: { base: '12px 16px', sm: '8px 12px' },
    borderRadius: '4px',
    cursor: 'pointer',
    margin: '4px',
    display: 'inline-block',
    minWidth: '40px',
    minHeight: { base: '44px', sm: 'auto' }, // Minimum touch target for mobile
    fontSize: { base: '16px', sm: '14px' },
    border: 'none',
    _disabled: {
        cursor: 'progress',
        opacity: '0.5',
    },
    _hover: {
        opacity: '0.9',
    },
    '&.danger': {
        background: 'danger',
    },
    '&.secondary': {
        background: 'secondary',
        '&.active': {
            background: 'secondaryDarker',
        }
    }
})

const Button = ({ className = '', children, ...props}) => {
    return (
        <button
            className={`${className} ${buttonStyles}`}
            {...props}
        >{children}</button>
    );
};

export default Button;