import React from 'react';
import { css } from '../../../styled-system/css';

const Panel = ({ children, ...props }) => {
    return (
        <div 
            className={css({ 
                background: 'sectionBackground',
                padding: '8px 16px',
                margin: '8px 0',
            })}
            {...props}
        >
            {children}
        </div>
    );
};

export default Panel;