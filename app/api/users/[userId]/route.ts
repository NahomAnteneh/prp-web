// get all data for any specific user
import { NextResponse } from "next/server"
export async function GET() {
    const respone = {
        id: "Nahom",
        username: "nah0m",
        name: "Nahom Anteneh",
        role: "STUDENT",
        profileInfo: {
            idNumber: "1404607",
            email: "bdu1404607.bdu.edu.et",
            department: "CS",
            batchYear: "2025",
        }
    }

    return NextResponse.json(respone)
}