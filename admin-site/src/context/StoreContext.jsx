import React, { createContext, useState, useContext } from 'react';

const StoreContext = createContext();

export const StoreProvider = ({ children }) => {
    const getInitialStore = () => {
        if (typeof window !== 'undefined') {
            const path = window.location.pathname;
            if (path.startsWith('/stihl')) return 'Stihl';
        }
        return 'Husqvarna';
    };

    const [activeStore, setActiveStore] = useState(getInitialStore);

    return (
        <StoreContext.Provider value={{ activeStore, setActiveStore }}>
            {children}
        </StoreContext.Provider>
    );
};

export const useStore = () => useContext(StoreContext);
