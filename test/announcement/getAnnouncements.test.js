const { getAnnouncements } = require('../../controllers/announcements');
const Announcement = require('../../models/Announcement');
const Shop = require('../../models/Shop');

jest.mock('../../models/Announcement');
jest.mock('../../models/Shop');

const mockRes = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};

describe('getAnnouncements', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should return all announcements for admin', async () => {
        const req = { user: { id: 'admin1', role: 'admin' } };
        const res = mockRes();

        const mockAnnouncements = [
            { _id: 'ann1', title: 'Notice A', shop: 'shop1' },
            { _id: 'ann2', title: 'Notice B', shop: 'shop2' }
        ];

        Announcement.find = jest.fn().mockReturnValue({
            sort: jest.fn().mockResolvedValue(mockAnnouncements)
        });

        await getAnnouncements(req, res);

        // Admin should get all announcements (no filter)
        expect(Announcement.find).toHaveBeenCalledWith({});
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ success: true, data: mockAnnouncements });
    });

    it('should return only own shop announcements for shopowner', async () => {
        const req = { user: { id: 'owner1', role: 'shopowner' } };
        const res = mockRes();

        const mockShop = { _id: 'shop1' };
        const mockAnnouncements = [{ _id: 'ann1', title: 'My Notice', shop: 'shop1' }];

        Shop.findOne.mockResolvedValue(mockShop);
        Announcement.find = jest.fn().mockReturnValue({
            sort: jest.fn().mockResolvedValue(mockAnnouncements)
        });

        await getAnnouncements(req, res);

        expect(Shop.findOne).toHaveBeenCalledWith({ owner: 'owner1' });
        expect(Announcement.find).toHaveBeenCalledWith({ shop: mockShop._id });
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ success: true, data: mockAnnouncements });
    });

    it('should return empty array if shopowner has no shop', async () => {
        const req = { user: { id: 'owner_no_shop', role: 'shopowner' } };
        const res = mockRes();

        Shop.findOne.mockResolvedValue(null);

        await getAnnouncements(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ success: true, data: [] });
    });

    it('should return 500 if a database error occurs', async () => {
        const req = { user: { id: 'admin1', role: 'admin' } };
        const res = mockRes();

        Announcement.find = jest.fn().mockReturnValue({
            sort: jest.fn().mockRejectedValue(new Error('DB error'))
        });

        await getAnnouncements(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
    });
});
