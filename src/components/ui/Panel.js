import React from 'react';
import { css } from '../../../styled-system/css';

const styles = css({ 
    background: 'sectionBackground',
    padding: '8px 16px',
    margin: '8px 0',
})

const Panel = ({ children, className = '', ...props }) => {
    return (
        <div 
            className={`${styles} ${className}`}
            {...props}
        >
            {children}
        </div>
    );
};

export default Panel;