'use client'

import { createContext, useContext, useState } from "react";
import { css } from '../../../styled-system/css';

export const AlertContext = createContext({});

export const useAlert = () => {
    return useContext(AlertContext);
}

export const AlertProvider = ({ children }) => {
    const [ alerts, setAlerts ] = useState([]);

    async function openAlert(message, type) {
        const id = new Date().getTime();
        setAlerts(prevAlerts => [...prevAlerts, { id, message, type }]);
        setTimeout(() => {
            setAlerts(prevAlerts => prevAlerts.filter(alert => alert.id !== id));
        }, 5000);
    }
    function closeAlert(id) {
        setAlerts(prevAlerts => prevAlerts.filter(alert => alert.id !== id));
    }
    return (
        <AlertContext.Provider value={{ openAlert }}>
            {children}
            <AlertWrapper alerts={alerts} onClose={closeAlert} />
        </AlertContext.Provider>
    )
};

export const AlertWrapper = ({ alerts, onClose }) => {
    if (!alerts.length) {
        return null;
    }
    return (
        <div className={css({
            position: 'fixed',
            padding: '8px',
            bottom: 0,
            right: 0
        })}>
            {alerts.map(alert => (
                <Alert className={alert.type} key={alert.id} message={alert.message} onClose={() => onClose(alert.id)} />
            ))}
        </div>
    );
};

export const Alert = ({ message, className, onClose }) =>  (
    <div className={`${className} ${css({ 
        padding: '8px',
        marginTop: '8px',
        borderRadius: '4px',
        display: 'flex',
        alignItems: 'center',
        '&.success': {
            background: 'success',
        },
        '&.error': {
            background: 'danger',
        }
    })}`}>
        <p className={css({ marginRight: '8px' })}>{message}</p>
        <button className={css({ cursor: 'pointer', alignSelf: 'flex-start' })} onClick={onClose}>X</button>
    </div>
);