import React from 'react';
import { buttonStyles } from './Button';

const ButtonLink = ({ children, ...props}: React.AnchorHTMLAttributes<HTMLAnchorElement> ) => {
    return (
        <a
            className={buttonStyles}
            {...props}
        >{children}</a>
    );
};

export default ButtonLink;