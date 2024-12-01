import React from 'react';
import { css } from '../../../styled-system/css';

const H1 = ({ children, className, ...props} ) => {
    return (
        <h1
            className={`${className} ${css({ 
                fontSize: '2rem',
            })}`}
            {...props}
        >{children}</h1>
    );
};

export default H1;