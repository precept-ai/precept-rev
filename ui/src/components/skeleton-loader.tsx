import React from "react";

export default function SkeletonLoader() {
  return (
    <>
      <div className="flex w-full px-10 py-5 animate-pulse bg-[rgba(0,0,0,0.04)] dark:bg-[rgba(0,0,0,0.8)] rounded-[10px]">
        <div className="flex-shrink-0">
          <span className="w-12 h-12 block bg-[rgba(0,0,0,0.1)] rounded-full dark:bg-gray-700"></span>
        </div>

        <div className="ml-4 mt-2 w-full">
          <div className="h-4 w-[40%] bg-[rgba(0,0,0,0.1)] rounded-md dark:bg-gray-700"></div>
          <ul className="mt-5 space-y-3">
            <li className="w-full h-2 bg-[rgba(0,0,0,0.1)] rounded-md dark:bg-gray-700"></li>
            <li className="w-full h-3 bg-[rgba(0,0,0,0.1)] rounded-md dark:bg-gray-700"></li>
            <li className="w-full h-3 bg-[rgba(0,0,0,0.1)] rounded-md dark:bg-gray-700"></li>
            {/* <li className="w-full h-4 bg-[rgba(0,0,0,0.1)] rounded-md dark:bg-gray-700"></li> */}
          </ul>
        </div>
      </div>
    </>
  );
}
