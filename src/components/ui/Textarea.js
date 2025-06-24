import React from 'react';
import { css } from '../../../styled-system/css';

const Textarea = ({ ...props}) => {
    return (        <textarea 
            className={css({ 
                border: '1px solid black',
                borderRadius: '3px',
                background: 'rgba(255,255,255,.5)',
                width: '100%',
                padding: { base: '8px', sm: '6px' },
                height: { base: '120px', sm: '150px' },
                fontSize: { base: '16px', sm: '14px' }, // Prevent zoom on iOS
                boxSizing: 'border-box',
                resize: 'vertical',
            })}
            {...props}
        />
    );
};

export default Textarea;