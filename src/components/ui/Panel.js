import React from 'react';
import { css } from '../../../styled-system/css';

const Panel = ({ children, ...props }) => {
    return (
        <div 
            className={css({ 
                background: 'sectionBackground',
                padding: '8px',
                margin: '8px',
                borderRadius: '4px',
            })}
            {...props}
        >
            {children}
        </div>
    );
};

export default Panel;