import React from 'react';
import { buttonStyles } from './Button';

const ButtonLink = ({ children, ...props }) => {
    return (
        <a
            className={buttonStyles}
            {...props}
        >{children}</a>
    );
};

export default ButtonLink;