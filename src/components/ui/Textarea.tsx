import React from 'react';
import { css } from '../../../styled-system/css';

const Textarea = ({ ...props}: React.InputHTMLAttributes<HTMLTextAreaElement> ) => {
    return (
        <textarea 
            className={css({ 
                border: '1px solid black',
                borderRadius: '3px',
                background: 'rgba(255,255,255,.5)',
                width: '100%',
                padding: '2px',
                height: '150px',
            })}
            {...props}
        />
    );
};

export default Textarea;