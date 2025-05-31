'use client'

import { generateId } from "@/lib/uid-util";


import { useState, useEffect } from 'react';

function IdDisplay() {
  const [id, setId] = useState('');

  useEffect(() => {
    setId(generateId());
  }, []);

  return (
    <>
          <span className="mt-4 text-xl">
            {id}
          </span> &nbsp;&nbsp;
          <span className="mt-2 text-sm italic inline">
            ({id.length} characters)
          </span>
    </>
  );
}


export default function Home() {

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div>
        <h1 className="text-4xl font-bold">
          Here is a random ID:
        </h1>
        <br/>
        <p>
          <IdDisplay />
        </p>
      </div>
    </main>
  );
}