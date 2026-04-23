const { createAnnouncement } = require('../../controllers/announcements');
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

describe('createAnnouncement', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should create announcement successfully as shopowner', async () => {
        const req = {
            body: { title: 'Grand Opening', content: 'We are open!', imageUrl: 'http://img.com/1.jpg' },
            user: { id: 'owner1', role: 'shopowner' }
        };
        const res = mockRes();

        const mockShop = { _id: 'shop1' };
        const mockAnnouncement = { _id: 'ann1', title: 'Grand Opening', content: 'We are open!', shop: 'shop1' };

        Shop.findOne.mockResolvedValue(mockShop);
        Announcement.create.mockResolvedValue(mockAnnouncement);

        await createAnnouncement(req, res);

        expect(Shop.findOne).toHaveBeenCalledWith({ owner: 'owner1' });
        expect(Announcement.create).toHaveBeenCalledWith({
            title: 'Grand Opening',
            content: 'We are open!',
            imageUrl: 'http://img.com/1.jpg',
            shop: 'shop1'
        });
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith({ success: true, data: mockAnnouncement });
    });

    it('should create announcement successfully as admin (with shop in body)', async () => {
        const req = {
            body: { title: 'System Notice', content: 'Maintenance tonight', shop: 'shop99' },
            user: { id: 'admin1', role: 'admin' }
        };
        const res = mockRes();

        const mockAnnouncement = { _id: 'ann2', title: 'System Notice', shop: 'shop99' };

        Announcement.create.mockResolvedValue(mockAnnouncement);

        await createAnnouncement(req, res);

        expect(Shop.findOne).not.toHaveBeenCalled();
        expect(Announcement.create).toHaveBeenCalledWith(expect.objectContaining({ shop: 'shop99' }));
        expect(res.status).toHaveBeenCalledWith(201);
    });

    it('should return 404 if shopowner has no shop', async () => {
        const req = {
            body: { title: 'Test', content: 'Test' },
            user: { id: 'owner_no_shop', role: 'shopowner' }
        };
        const res = mockRes();

        Shop.findOne.mockResolvedValue(null);

        await createAnnouncement(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Shop not found for this user' });
    });

    it('should return 400 if required fields are missing', async () => {
        const req = {
            body: {},
            user: { id: 'owner1', role: 'shopowner' }
        };
        const res = mockRes();

        Shop.findOne.mockResolvedValue({ _id: 'shop1' });
        Announcement.create.mockRejectedValue(new Error('title is required'));

        await createAnnouncement(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
    });
});
