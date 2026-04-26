const { getAnnouncements } = require('../../controllers/announcements');
const Announcement = require('../../models/Announcement');
const Shop = require('../../models/Shop');

jest.mock('../../models/Announcement');
jest.mock('../../models/Shop');

describe('getAnnouncements', () => {
    let req, res;

    beforeEach(() => {
        req = {
            user: {
                id: 'owner1',
                role: 'shopowner'
            }
        };

        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        jest.clearAllMocks();
    });

    test('should return all announcements for admin', async () => {
        req.user.role = 'admin';

        const mockAnnouncements = [
            { _id: '1', title: 'A1' },
            { _id: '2', title: 'A2' }
        ];

        Announcement.find.mockReturnValue({
            populate: jest.fn().mockReturnValue({
                sort: jest.fn().mockResolvedValue(mockAnnouncements)
            })
        });

        await getAnnouncements(req, res);

        expect(Announcement.find).toHaveBeenCalledWith({});
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            data: mockAnnouncements
        });
    });

    test('should return only own shop announcements for shopowner', async () => {
        const mockShops = [
            { _id: 'shop1' },
            { _id: 'shop2' }
        ];

        const mockAnnouncements = [
            { _id: '1', title: 'Promo 1' },
            { _id: '2', title: 'Promo 2' }
        ];

        Shop.find.mockResolvedValue(mockShops);

        Announcement.find.mockReturnValue({
            populate: jest.fn().mockReturnValue({
                sort: jest.fn().mockResolvedValue(mockAnnouncements)
            })
        });

        await getAnnouncements(req, res);

        expect(Shop.find).toHaveBeenCalledWith({ owner: 'owner1' });

        expect(Announcement.find).toHaveBeenCalledWith({
            shop: { $in: ['shop1', 'shop2'] }
        });

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            data: mockAnnouncements
        });
    });

    test('should return empty array if shopowner has no shop', async () => {
        Shop.find.mockResolvedValue([]);

        await getAnnouncements(req, res);

        expect(Shop.find).toHaveBeenCalledWith({ owner: 'owner1' });

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            data: []
        });
    });

    test('should return 500 if error occurs', async () => {
        Shop.find.mockRejectedValue(new Error('Database Error'));

        await getAnnouncements(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: 'Database Error'
        });
    });
});