import React from 'react';
import { Search as SearchIcon, X } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useDispatch, useSelector } from 'react-redux';
import { setSearchQuery, clearSearch } from '@/gl_Var_Reducers';

export default function Search() {
    const dispatch = useDispatch();
    const query = useSelector((state) => state.gl_variables.searchQuery);

    const handleSearch = (e) => {
        e.preventDefault();
    };

    const handleInputChange = (e) => {
        dispatch(setSearchQuery(e.target.value));
    };

    const handleClear = () => {
        dispatch(clearSearch());
    };

    return (
        <form onSubmit={handleSearch} className="relative mt-8 mx-6 mb-6">
            <div className="relative w-full">
                <Input
                    type="text"
                    placeholder="Search for dishes..."
                    value={query}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-24 py-3 border-2 focus:border-yellow-400/50 
                              border-yellow-400/20 bg-gray-900/80 backdrop-blur-md rounded-lg"
                />
                <SearchIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            </div>
            
            {query && (
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-16 top-1/2 transform -translate-y-1/2 hover:bg-gray-800/50"
                    onClick={handleClear}
                >
                    <X className="h-5 w-5" />
                </Button>
            )}
            
            <Button
                type="submit"
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 hover:bg-gray-800/50"
            >
                Search
            </Button>
        </form>
    );
}
