import { Skeleton } from "@/components/ui/skeleton"

export default function MenuCardSkeleton() {
    return (
        <div className="rounded-lg shadow-md bg-gray-800/50 backdrop-blur-md 
                      border border-gray-700/50 flex flex-col h-full min-w-[220px] 
                      overflow-hidden">
            <div className="relative w-full aspect-[16/9] overflow-hidden">
                <Skeleton className="w-full h-full bg-gray-700/50" />
            </div>
            <div className="p-2.5 bg-gray-800/30 flex-grow flex flex-col">
                <Skeleton className="h-3.5 w-3/4 mb-1 bg-gray-700/50" />
                <Skeleton className="h-3 w-full bg-gray-700/50" />
                <div className="mt-auto">
                    <Skeleton className="h-3 w-20 my-1 bg-gray-700/50" />
                </div>
            </div>
            <div className="px-2 py-1.5 bg-gray-800/50 flex justify-between items-center border-t border-gray-700/50">
                <Skeleton className="h-7 w-7 rounded-full bg-gray-700/50" />
                <Skeleton className="h-7 w-7 rounded-full bg-gray-700/50" />
            </div>
        </div>
    )
} 