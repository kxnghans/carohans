export function getUserFriendlyErrorMessage(error: unknown, context?: string): string {
    if (!error) return "An unexpected error occurred.";

    // 1. Extract the raw message
    let message = "";
    let code: string | undefined;

    if (typeof error === 'string') {
        message = error;
    } else if (error instanceof Error) {
        message = error.message;
        // Check for Supabase/Postgres error code property (often found in 'code' or inside the object)
        // @ts-expect-error - loose typing for error objects
        code = error.code || (error as Record<string, unknown>)?.context?.code; 
    } else if (typeof error === 'object' && error !== null) {
        const errObj = error as Record<string, unknown>;
        message = (errObj.message as string) || (errObj.error_description as string) || JSON.stringify(error);
        code = errObj.code as string;
    }

    // 2. Map Postgres Error Codes
    if (code) {
        switch (code) {
            case '23505': // Unique violation
                return `${context ? context : 'Record'} already exists. Please use different details.`;
            case '42501': // RLS violation
                return "Permission denied. Please use an authorized account.";
            case '23503': // Foreign key violation
                return `Cannot delete: ${context ? context.toLowerCase() : 'record'} is linked to other data.`;
            case '23502': // Not null violation
                return "Please fill in all required fields (*).";
        }
    }

    // 3. Map String Patterns (Fallback if no code or generic error)
    const lowerMsg = message.toLowerCase();

    if (lowerMsg.includes('row-level security policy')) {
        return "Access restricted. Check your permissions.";
    }
    if (lowerMsg.includes('violates unique constraint')) {
        return "Duplicate found. Please use unique details.";
    }
    if (lowerMsg.includes('invalid input syntax')) {
        return "Invalid format. Check your dates and numbers.";
    }
    if (lowerMsg.includes('failed to fetch')) {
        return "Connection failed. Check your internet.";
    }
    if (lowerMsg.includes('auth/invalid-email')) {
        return "Invalid email format (e.g. name@example.com).";
    }
    if (lowerMsg.includes('auth/wrong-password') || lowerMsg.includes('invalid login credentials')) {
        return "Incorrect email or password.";
    }
    if (lowerMsg.includes('user not found')) {
        return "Account not found. Check info or sign up.";
    }
    
    // 4. Return original message if it looks like a clean validation message (short, no tech jargon)
    // Heuristic: If it doesn't contain underscores (db_cols), "error", "failed", or "policy", it might be a manual throw.
    if (!lowerMsg.includes('_') && !lowerMsg.includes('policy') && !lowerMsg.includes('constraint')) {
        return message;
    }

    return "An unexpected error occurred. Please try again.";
}