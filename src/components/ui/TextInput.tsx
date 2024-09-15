import React from 'react';
import { css } from '../../../styled-system/css';

const TextInput = ({ className, ...props}: React.InputHTMLAttributes<HTMLInputElement> ) => {
    return (
        <input 
            type="text" 
            className={`${className} ${
                css({ 
                    border: '1px solid black',
                    borderRadius: '3px',
                    background: 'rgba(255,255,255,.5)',
                    width: '100%',
                    padding: '2px',
                })
            }`}
            {...props}
        />
    );
};

export default TextInput;