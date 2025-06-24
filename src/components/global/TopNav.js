import React from 'react';
import { css } from '../../../styled-system/css';
import AuthSelection from './TopNav/AuthSelection';

const TopNav = ({ ...props }) => {
    return (        <nav 
            data-testid="top-nav"
            className={css({
                boxSizing: 'border-box',
                justifyContent: 'space-between',
                padding: { base: '8px', sm: '12px' },
                background: 'sectionBackground',
                display: 'flex',
                alignItems: 'center',
                minHeight: { base: '44px', sm: '48px' }, // Ensure touch targets are at least 44px on mobile
            })}
            {...props}
        >
            <a 
                href="/" 
                title="Home" 
                className={css({
                    padding: '8px',
                    minWidth: '44px',
                    minHeight: '44px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: { base: '16px', sm: '18px' }
                })}
            >
                <i className="fa-solid fa-house"></i>
            </a>
            <AuthSelection />
        </nav>
    );
};

export default TopNav;