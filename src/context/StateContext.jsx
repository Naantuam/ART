import { createContext, useContext, useState } from 'react';

const StateContext = createContext();

export const StateProvider = ({ children }) => {
  // Default to 'Wed' for initial testing. This will control the scratch card color.
  // Valid options: 'Wed', 'Thu', 'Fri', 'Sat'
  const [currentDay, setCurrentDay] = useState('Wed'); 

  return (
    <StateContext.Provider value={{ currentDay, setCurrentDay }}>
      {children}
    </StateContext.Provider>
  );
};

export const useStateContext = () => useContext(StateContext);
