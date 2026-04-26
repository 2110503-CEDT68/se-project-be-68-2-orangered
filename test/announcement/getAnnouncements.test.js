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

        // admin ไม่ filter shop → Announcement.find({}).populate().sort()
        Announcement.find = jest.fn().mockReturnValue({
            populate: jest.fn().mockReturnValue({
                sort: jest.fn().mockResolvedValue(mockAnnouncements)
            })
        });

        await getAnnouncements(req, res);

        expect(Announcement.find).toHaveBeenCalledWith({});
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ success: true, data: mockAnnouncements });
    });

    it('should return only own shops announcements for shopowner (multiple shops)', async () => {
        const req = { user: { id: 'owner1', role: 'shopowner' } };
        const res = mockRes();

        const mockShops = [{ _id: 'shop1' }, { _id: 'shop2' }];
        const mockAnnouncements = [
            { _id: 'ann1', title: 'Notice A', shop: 'shop1' },
            { _id: 'ann2', title: 'Notice B', shop: 'shop2' }
        ];

        // ตอนนี้ใช้ Shop.find() แทน Shop.findOne()
        Shop.find.mockResolvedValue(mockShops);
        Announcement.find = jest.fn().mockReturnValue({
            populate: jest.fn().mockReturnValue({
                sort: jest.fn().mockResolvedValue(mockAnnouncements)
            })
        });

        await getAnnouncements(req, res);

        expect(Shop.find).toHaveBeenCalledWith({ owner: 'owner1' });
        expect(Announcement.find).toHaveBeenCalledWith({
            shop: { $in: mockShops.map(s => s._id) }
        });
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ success: true, data: mockAnnouncements });
    });

    it('should return empty array if shopowner has no shops', async () => {
        const req = { user: { id: 'owner_no_shop', role: 'shopowner' } };
        const res = mockRes();

        // ไม่มีร้านเลย
        Shop.find.mockResolvedValue([]);

        await getAnnouncements(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ success: true, data: [] });
    });

    it('should return 500 if a database error occurs', async () => {
        const req = { user: { id: 'admin1', role: 'admin' } };
        const res = mockRes();

        Announcement.find = jest.fn().mockReturnValue({
            populate: jest.fn().mockReturnValue({
                sort: jest.fn().mockRejectedValue(new Error('DB error'))
            })
        });

        await getAnnouncements(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
    });
});
