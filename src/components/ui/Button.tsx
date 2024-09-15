import React from 'react';
import { css } from '../../../styled-system/css';
import colors from './colors';

const Button = ({ className, children, ...props}: React.ButtonHTMLAttributes<HTMLButtonElement> ) => {
    return (
        <button
            className={`${className} ${
                css({ 
                    background: colors.success,
                    padding: '8px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    margin: '4px',
                })
            }`}
            {...props}
        >{children}</button>
    );
};

export default Button;