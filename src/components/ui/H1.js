import React from 'react';
import { css } from '../../../styled-system/css';

const H1 = ({ children, ...props} ) => {
    return (
        <h1
            className={css({ 
                fontSize: '2rem',
            })}
            {...props}
        >{children}</h1>
    );
};

export default H1;