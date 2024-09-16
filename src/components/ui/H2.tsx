import React from 'react';
import { css } from '../../../styled-system/css';

const H2 = ({ children, ...props}: React.HTMLAttributes<HTMLHeadingElement> ) => {
    return (
        <h2
            className={css({ 
                fontSize: '1.25rem',
            })}
            {...props}
        >{children}</h2>
    );
};

export default H2;