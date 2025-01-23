import { configureStore } from "@reduxjs/toolkit";
import gl_Var_Reducers from './gl_Var_Reducers'
import webSocketMiddleware from "./webSocketMiddleware";
import SizeConfig_Reducers from "./SizeConfig_Reducers"

const store = configureStore({
    reducer:{
        gl_variables: gl_Var_Reducers,
        SizeConfig_Reducers : SizeConfig_Reducers
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().concat(webSocketMiddleware('wss://belsmobileweb-yxzgj.ondigitalocean.app/ws/socket-server/mobileWebcc'))
    
})

export default store;