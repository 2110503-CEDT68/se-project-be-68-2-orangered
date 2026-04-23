const { getShopAnnouncements } = require('../../controllers/announcements');
const Announcement = require('../../models/Announcement');

jest.mock('../../models/Announcement');

const mockRes = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};

describe('getShopAnnouncements', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should return announcements for a specific shop', async () => {
        const req = { params: { shopId: 'shop123' } };
        const res = mockRes();

        const mockAnnouncements = [
            { _id: 'ann1', title: 'Sale Event', content: 'Big sale!', shop: 'shop123' },
            { _id: 'ann2', title: 'New Menu', content: 'Check our menu!', shop: 'shop123' }
        ];

        Announcement.find = jest.fn().mockReturnValue({
            sort: jest.fn().mockResolvedValue(mockAnnouncements)
        });

        await getShopAnnouncements(req, res);

        expect(Announcement.find).toHaveBeenCalledWith({ shop: 'shop123' });
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ success: true, data: mockAnnouncements });
    });

    it('should return empty array if shop has no announcements', async () => {
        const req = { params: { shopId: 'shop_no_ann' } };
        const res = mockRes();

        Announcement.find = jest.fn().mockReturnValue({
            sort: jest.fn().mockResolvedValue([])
        });

        await getShopAnnouncements(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ success: true, data: [] });
    });

    it('should return 500 if a database error occurs', async () => {
        const req = { params: { shopId: 'shop123' } };
        const res = mockRes();

        Announcement.find = jest.fn().mockReturnValue({
            sort: jest.fn().mockRejectedValue(new Error('DB error'))
        });

        await getShopAnnouncements(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
    });
});
