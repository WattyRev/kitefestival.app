'use client'

import Link from "next/link";
import { useAuth } from "../Auth";
import { css } from "../../../../styled-system/css";

const EventNavigation = () => {
    const { isEditor } = useAuth();

    if (!isEditor()) {
        return null;
    }

    return (
        <div className={css({
            display: 'flex',
            gap: '16px',
            alignItems: 'center'
        })}>
            <Link 
                href="/events" 
                className={css({
                    padding: '8px 16px',
                    backgroundColor: '#3a3ada',
                    color: 'white',
                    textDecoration: 'none',
                    borderRadius: '4px',
                    fontSize: '14px',
                    '&:hover': {
                        backgroundColor: '#2d2db3'
                    }
                })}
            >
                <i className="fa-solid fa-calendar"></i> Manage Events
            </Link>
        </div>
    );
};

export default EventNavigation;
