
// create a nextjs typescript logger library. The module has a const pino logger object, a children dictionary {} 
// The module has 3 exposed functions: 
// - static getLogger(name: string): logger 
//   this static function returns a child logger from the module level pino logger object's .children method. 

import { testGenerateId } from "@/lib/uid-util";
import { NextResponse } from "next/server";


export async function GET() {
    return NextResponse.json( testGenerateId() );
}
