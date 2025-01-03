import { setCurrentArray, setNavMenuArray, setCustomOptions, setSearchQuery, setOrders, addOrder } from "./gl_Var_Reducers";


const webSocketMiddleware = (url) => {
    let socket = null;

    return(store) => {
        return (next) => (action) => {
            const state = store.getState();
            let selectedCategory = state.gl_variables.selectedCategory;
            
            switch(action.type) {
                case 'websocket/connect':
                    if (socket) {
                        socket.close();
                    }

                    socket = new WebSocket(url);
                    
                    socket.onopen = () => {
                        console.log('Connected successfully');
                        const userInfo = state.gl_variables.userInfo;
                        
                        // Send initialization data with visitor ID
                        const initData = {
                            type: 'initialize',
                            message: {
                                visitor_id: userInfo.userId || null,
                                is_authenticated: userInfo.isLoggedIn || false,
                                name: userInfo.name || null,
                                email: userInfo.email || null
                            }
                            
                        };
                        console.log("I am good to go",initData)
                        socket.send(JSON.stringify(initData));
                    };

                    socket.onmessage = (event) => {
                        const data = JSON.parse(event.data);
                        let returnables = data.message;
                        
                        console.log('WebSocket message received:', data.type, returnables);
                        
                        switch (data.type) {
                            case 'Greeting':
                                console.log('Greeting from server:', returnables);
                                break;
                            
                            case 'sendCategories':
                                console.log('Receiving categories:', returnables);
                                store.dispatch(setNavMenuArray(returnables))
                                break;
                            
                            case 'sendMenuContents':
                                console.log('Receiving menu contents:', returnables);
                                if (Array.isArray(returnables) && selectedCategory === state.gl_variables.selectedCategory) {
                                    store.dispatch(setCurrentArray(returnables));
                                    store.dispatch(setSearchQuery(''));
                                }
                                console.log("Currrent Array", state.gl_variables.currentArray)
                                break;

                            case 'sendCustomOptions':
                                console.log('I am being seenL')
                                console.log("Custom Options", returnables)
                                store.dispatch(setCustomOptions(returnables))
                                break; 
                            
                            case 'sendOrdersMadeToday':
                                console.log('Received orders made today:', returnables);
                                if (Array.isArray(returnables)) {
                                    store.dispatch(setOrders(returnables));
                                }
                                break;
                        }
                    };
                    break;

                case 'websocket/fetchCustomOptions':
                    if (socket && socket.readyState === WebSocket.OPEN) {
                        let data_ = { type: 'fetchCustomOptions', message:action.payload };
                        socket.send(JSON.stringify(data_)); 
                    }   
                    
                    break;

                
                case 'websocket/requestMenuContents':
                    if (socket && socket.readyState === WebSocket.OPEN) {
                        let data_ = { type: 'requestMenuContents', message: selectedCategory };
                        socket.send(JSON.stringify(data_)); 
                        console.log(data_)
                    } else {
                        console.warn('Socket is not open. Unable to send requestMenuContents.');
                    }
                    break;

                case 'websocket/requestOrdersMadeToday':
                    if (socket && socket.readyState === WebSocket.OPEN) {
                        const userInfo = state.gl_variables.userInfo;
                        const identifier = userInfo.isLoggedIn ? userInfo.email : userInfo.userId;
                        
                        let data_ = { 
                            type: 'requestOrdersMadeToday', 
                            message: {
                                identifier: identifier,
                                is_authenticated: userInfo.isLoggedIn
                            }
                        };
                        socket.send(JSON.stringify(data_));
                        console.log("Requesting orders made today for:", identifier);
                    } else {
                        console.warn('Socket is not open. Unable to request orders.');
                    }
                    break;
            }
            return next(action);
        }
    }
}

export default webSocketMiddleware;
