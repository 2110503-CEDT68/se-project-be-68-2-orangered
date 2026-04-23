const { getAllAnnouncements, getShopAnnouncements } = require('../../controllers/announcements');
const Announcement = require('../../models/Announcement');

jest.mock('../../models/Announcement');

const mockRes = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};

// ========================================================
// TEST SUITE: User can view announcements (Public routes)
// These routes require NO authentication - accessible by all
// ========================================================

describe('User - View All Announcements (GET /all)', () => {
    afterEach(() => jest.clearAllMocks());

    it('should return all announcements from every shop (user role)', async () => {
        // Simulate any user (no auth required for this route)
        const req = {};
        const res = mockRes();

        const mockAnnouncements = [
            { _id: 'ann1', title: 'Sale at Shop A', content: 'Big discount!', shop: { _id: 'shop1', name: 'Shop A', picture: '' } },
            { _id: 'ann2', title: 'New Service at Shop B', content: 'Try our new massage!', shop: { _id: 'shop2', name: 'Shop B', picture: '' } },
        ];

        Announcement.find = jest.fn().mockReturnValue({
            populate: jest.fn().mockReturnValue({
                sort: jest.fn().mockResolvedValue(mockAnnouncements)
            })
        });

        await getAllAnnouncements(req, res);

        expect(Announcement.find).toHaveBeenCalledWith();
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ success: true, data: mockAnnouncements });
    });

    it('should return empty array when no announcements exist', async () => {
        const req = {};
        const res = mockRes();

        Announcement.find = jest.fn().mockReturnValue({
            populate: jest.fn().mockReturnValue({
                sort: jest.fn().mockResolvedValue([])
            })
        });

        await getAllAnnouncements(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ success: true, data: [] });
    });

    it('should return 500 if database error occurs', async () => {
        const req = {};
        const res = mockRes();

        Announcement.find = jest.fn().mockReturnValue({
            populate: jest.fn().mockReturnValue({
                sort: jest.fn().mockRejectedValue(new Error('DB connection failed'))
            })
        });

        await getAllAnnouncements(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
    });
});

describe('User - View Announcements by Shop (GET /shop/:shopId)', () => {
    afterEach(() => jest.clearAllMocks());

    it('should return announcements for a specific shop (user role)', async () => {
        const req = { params: { shopId: 'shop1' } };
        const res = mockRes();

        const mockAnnouncements = [
            { _id: 'ann1', title: 'Sale Event', content: '50% off today!', shop: 'shop1' }
        ];

        Announcement.find = jest.fn().mockReturnValue({
            sort: jest.fn().mockResolvedValue(mockAnnouncements)
        });

        await getShopAnnouncements(req, res);

        expect(Announcement.find).toHaveBeenCalledWith({ shop: 'shop1' });
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ success: true, data: mockAnnouncements });
    });

    it('should return empty array if the shop has no announcements', async () => {
        const req = { params: { shopId: 'shop_empty' } };
        const res = mockRes();

        Announcement.find = jest.fn().mockReturnValue({
            sort: jest.fn().mockResolvedValue([])
        });

        await getShopAnnouncements(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ success: true, data: [] });
    });

    it('should return 500 if database error occurs', async () => {
        const req = { params: { shopId: 'shop1' } };
        const res = mockRes();

        Announcement.find = jest.fn().mockReturnValue({
            sort: jest.fn().mockRejectedValue(new Error('DB error'))
        });

        await getShopAnnouncements(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
    });
});
