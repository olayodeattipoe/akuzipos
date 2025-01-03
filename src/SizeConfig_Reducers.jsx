import {createSlice} from "@reduxjs/toolkit";
 

const initialState ={
    OnResize: 5,
    OthersDefaultSize: 88,
}


const SizeConfig_Reducers = createSlice({
    name:'SizeConfig_Reducers',

    initialState,

    reducers:{
        setOnResize: (state, action)=>{state.OnResize = action.payload},
        setOthersDefaultSize: (state, action) => {state.OthersDefaultSize = action.payload},
    }
})

export const {setOnResize,setOthersDefaultSize} = SizeConfig_Reducers.actions
export default SizeConfig_Reducers.reducer;