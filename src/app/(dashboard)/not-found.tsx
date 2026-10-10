import React from 'react';
import NotFound  from "@/assets/NotFound.png";
import Image from 'next/image';


const NotFoundPage = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <Image
        src={NotFound} // Replace with your "Not Found" image URL
        alt="Not Found"
        className="w-ful h-full" // Adjust size as needed
      />
      <div className="text-xl font-semibold text-gray-700">This is NotFound page</div>
    </div>
  );
}

export default NotFoundPage;
