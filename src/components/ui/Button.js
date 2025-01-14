import React from 'react';
import { css } from '../../../styled-system/css';

export const buttonStyles = css({ 
    background: 'success',
    padding: '8px',
    borderRadius: '4px',
    cursor: 'pointer',
    margin: '4px',
    display: 'inline-block',
    minWidth: '40px',
    _disabled: {
        cursor: 'progress',
        opacity: '0.5',
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