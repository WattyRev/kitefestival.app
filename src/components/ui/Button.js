import React from 'react';
import { css } from '../../../styled-system/css';

export const buttonStyles = css({ 
    background: 'success',
    padding: '8px',
    borderRadius: '4px',
    cursor: 'pointer',
    margin: '4px',
    display: 'inline-block',
    _disabled: {
        cursor: 'progress',
        opacity: '0.5',
    },
    '&.danger': {
        background: 'danger',
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