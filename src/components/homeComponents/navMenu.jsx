import React, { useRef, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { setSelectedCategory } from '@/gl_Var_Reducers';
import store from '@/gl_Var_Store';

export default function NavMenu() {
  const dispatch = useDispatch();
  const scrollRef = useRef(null);
  
  const selectedCategory = useSelector((state) => state.gl_variables.selectedCategory);
  const categories = useSelector((state) => state.gl_variables.NavMenuArray);

  const handleCategoryClick = (category) => {
    if (selectedCategory !== category.id) {
      dispatch(setSelectedCategory(category.id));
      console.log("category clicked", category);
    } else {
      store.dispatch({type: 'websocket/requestMenuContents'});
    }
  };

  useEffect(() => {
    if (categories.length > 0 && !selectedCategory) {
        dispatch(setSelectedCategory(categories[0].id));
        console.log("Setting default category to", categories[0].id);
    }
  }, [categories, selectedCategory]);

  useEffect(() => {
    if (selectedCategory) {
        store.dispatch({type: 'websocket/requestMenuContents'});
        console.log("requesting contents for", selectedCategory);
    }
  }, [selectedCategory]);

  return (
    <div className="flex flex-col py-2">
        {categories.map((category) => (
            <button
                key={category.id}
                onClick={() => handleCategoryClick(category)}
                className={`flex items-center gap-3 px-4 py-3.5 text-left
                           transition-all duration-200 relative
                           ${selectedCategory === category.id 
                               ? 'bg-yellow-400/10 text-yellow-400' 
                               : 'text-gray-400 hover:bg-gray-800/50 hover:text-gray-200'}`}
            >
                {/* Active Category Indicator */}
                {selectedCategory === category.id && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-yellow-400" />
                )}
                
                <div className="w-10 h-10 rounded-xl bg-gray-800/50 
                              flex items-center justify-center
                              border border-gray-700/50">
                    <span className="text-lg font-medium">{category.name[0]}</span>
                </div>
                <span className="text-sm font-medium">{category.name}</span>
            </button>
        ))}
    </div>
  );
}