import { Response } from 'express';
import { prisma } from '../index';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

export const getProfile = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                status: true,
                phone: true,
                avatar: true,
                createdAt: true
            }
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(user);
    } catch (error) {
        console.error('Get Profile Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const updateProfile = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const targetUserId = req.params.id as string;
        const requesterId = req.user?.userId;
        const requesterRole = req.user?.role;

        // SEC-06: IDOR Protection
        // Ensure the requester is either updating their OWN profile or is an admin.
        if (requesterId !== targetUserId && requesterRole !== 'admin') {
            return res.status(403).json({ error: 'Forbidden: You can only update your own profile' });
        }

        // SEC-05: Mass Assignment Protection
        // Extract only the allowed fields from the request body.
        // Ignored fields: role, id, email, status (Admin only for status/role).
        const { firstName, lastName, phone, avatar } = req.body;

        const dataToUpdate: any = {};
        if (firstName !== undefined) dataToUpdate.firstName = firstName;
        if (lastName !== undefined) dataToUpdate.lastName = lastName;
        if (phone !== undefined) dataToUpdate.phone = phone;
        if (avatar !== undefined) dataToUpdate.avatar = avatar;

        const updatedUser = await prisma.user.update({
            where: { id: targetUserId },
            data: dataToUpdate,
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                status: true,
                phone: true,
                avatar: true
            }
        });

        res.json({ message: 'Profile updated successfully', user: updatedUser });
    } catch (error) {
        console.error('Update Profile Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
