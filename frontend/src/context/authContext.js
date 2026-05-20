import React, { Children, createContext, useContext, useState } from "react";

const userContext = createContext()
const authContext=  (Children) =>{
    const [user, setUser] = userState(null)
    
    const login =() =>{

    }
    const logout =() =>{

    }
    return (
        <userContextProvider value={{user, login, logout}}>
            {Children}
        </userContextProvider>
    )
}

export const useAuth =()=> useContext(userContext)
export default authContext