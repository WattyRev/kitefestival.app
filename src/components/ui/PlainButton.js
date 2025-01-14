import React from 'react';
import { css } from '../../../styled-system/css';

export const buttonStyles = css({
    padding: '8px',
    borderRadius: '4px',
    cursor: 'pointer',
    margin: '-8px',
    display: 'inline-block',
    minWidth: '40px',
    _disabled: {
        cursor: 'progress',
        opacity: '0.5',
    },
})

const PlainButton = ({ className = '', children, ...props}) => {
    return (
        <button
            className={`${className} ${buttonStyles}`}
            {...props}
        >{children}</button>
    );
};

export default PlainButton;