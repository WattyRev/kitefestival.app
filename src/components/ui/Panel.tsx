import React from 'react';
import { css } from '../../../styled-system/css';
import colors from './colors';

const Panel = ({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) => {
    return (
        <div 
            className={`${className} ${css({ 
                background: colors.sectionBackground,
                padding: '8px',
                margin: '8px',
                borderRadius: '4px',
            })}`}
            {...props}
        >
            {children}
        </div>
    );
};

export default Panel;