// Simulate a database of user profiles for the mock API
const mockUserDatabase: Record<string, any> = {
    'usr-1001': {
        id: 'usr-1001',
        firstName: 'John',
        lastName: 'Doe',
        phone: '+44 7700 900111',
        role: 'driver',
        isVerified: true,
        accountBalance: 150.50
    },
    'usr-1002': {
        id: 'usr-1002',
        firstName: 'Jane',
        lastName: 'Smith',
        phone: '+44 7700 900222',
        role: 'customer',
        isVerified: false,
        accountBalance: 0
    }
};

export class MockApiService {
    /**
     * Updates a user profile. 
     * Addresses SEC-05 (Mass Assignment) and SEC-06 (IDOR).
     * 
     * @param requesterId The ID of the authenticated user making the request
     * @param targetUserId The ID of the user profile being updated
     * @param data The payload containing fields to update
     */
    static updateProfile(requesterId: string, targetUserId: string, data: any) {
        // SEC-06: IDOR (Insecure Direct Object Reference) Protection
        // Ensure the requester can only modify their own profile unless they have special privileges
        if (requesterId !== targetUserId) {
            // In a real app, you might allow 'admin' role to bypass this check. 
            // For this demonstration, we enforce strict ownership matching.
            return { success: false, error: 'Unauthorized: Cannot modify a profile you do not own.' };
        }

        const user = mockUserDatabase[targetUserId];
        if (!user) {
            return { success: false, error: 'User not found.' };
        }

        // SEC-05: Mass Assignment Protection
        // Explicitly whitelist acceptable fields to update
        const allowedFields = ['firstName', 'lastName', 'phone'];
        const sanitizedData: any = {};

        for (const field of allowedFields) {
            if (data[field] !== undefined) {
                sanitizedData[field] = data[field];
            }
        }

        // The result is safely merged without accidentally overriding 'role', 'isVerified', or 'accountBalance'
        mockUserDatabase[targetUserId] = { ...user, ...sanitizedData };

        return { success: true, user: mockUserDatabase[targetUserId] };
    }

    // Helper method to retrieve current state for verification
    static getUser(userId: string) {
        return mockUserDatabase[userId];
    }
}
