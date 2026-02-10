import { generateAuthUrl } from "@/lib/googleClient";
import { redirect } from 'next/navigation';

export function GET(req: Request) {
    const url = new URL(req.url);
    const scopeCategory = url.searchParams.get("scope");
    
    const redirectUrl = generateAuthUrl(scopeCategory);
    if (redirectUrl == "") {
        return new Response("An error occured", 500)
    }
    redirect(redirectUrl)
}