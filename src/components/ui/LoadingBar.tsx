import React from 'react';
import { css } from '../../../styled-system/css';

interface LoadingBarProps extends React.HTMLAttributes<HTMLDivElement> {
    isLoading: boolean;
}

export const loadingBarStyles = css({ 
    height: '8px',
    width: '100%',
    '&[data-state=loading]': { 
        background: 'linear-gradient(90deg, transparent, #305ce073, transparent)',
        backgroundSize: "200% 200%",
        animation: 'loadingBarKeyframes 1s linear infinite',
    },
})

const LoadingBar = ({ className = '', isLoading, ...props}: LoadingBarProps ) => {
    return <div className={`${className} ${loadingBarStyles}`} data-state={isLoading ? 'loading' : undefined} {...props} />
};

export default LoadingBar;