import React from 'react';
import { css } from '../../../styled-system/css';
import AuthSelection from './TopNav/AuthSelection';

const TopNav = ({ ...props }) => {
    return (
        <nav 
            className={css({
                boxSizing: 'border-box',
                justifyContent: 'space-between',
                padding: '8px',
                background: 'sectionBackground',
                display: 'flex',
            })}
            {...props}
        >
            <a href="/">⌂ Home</a>
            <AuthSelection />
        </nav>
    );
};

export default TopNav;