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

        Shop.findById.mockResolvedValue({ _id: 'shop99' });
        Announcement.create.mockResolvedValue(mockAnnouncement);

        await createAnnouncement(req, res);

        expect(Shop.findById).toHaveBeenCalledWith('shop99');
        expect(Announcement.create).toHaveBeenCalledWith(expect.objectContaining({ shop: 'shop99' }));
        expect(res.status).toHaveBeenCalledWith(201);
    });

    it('should create announcement successfully as admin without shop for global announcement', async () => {
        const req = {
            body: { title: 'Global Notice', content: 'Applies to everyone' },
            user: { id: 'admin1', role: 'admin' }
        };
        const res = mockRes();

        const mockAnnouncement = { _id: 'ann-global', title: 'Global Notice', shop: null };

        Announcement.create.mockResolvedValue(mockAnnouncement);

        await createAnnouncement(req, res);

        expect(Shop.findById).not.toHaveBeenCalled();
        expect(Announcement.create).toHaveBeenCalledWith(expect.objectContaining({
            title: 'Global Notice',
            content: 'Applies to everyone',
            shop: null
        }));
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith({ success: true, data: mockAnnouncement });
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

    it('should return 403 if shopowner requests a shop they do not own', async () => {
        const req = {
            body: { title: 'Test', content: 'Test', shop: 'not_my_shop' },
            user: { id: 'owner1', role: 'shopowner' }
        };
        const res = mockRes();

        // Shop.findOne returns null because owner != owner1 for this shop
        Shop.findOne.mockResolvedValue(null);

        await createAnnouncement(req, res);

        expect(Shop.findOne).toHaveBeenCalledWith({ _id: 'not_my_shop', owner: 'owner1' });
        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({ success: false, message: 'You are not the owner of this shop' });
    });

    it('should create announcement with requested shop if shopowner owns it', async () => {
        const req = {
            body: { title: 'My Shop Notice', content: 'Sale!', shop: 'my_shop_1' },
            user: { id: 'owner1', role: 'shopowner' }
        };
        const res = mockRes();

        const mockShop = { _id: 'my_shop_1', owner: 'owner1' };
        const mockAnnouncement = { _id: 'ann3', title: 'My Shop Notice', shop: 'my_shop_1' };

        Shop.findOne.mockResolvedValue(mockShop);
        Announcement.create.mockResolvedValue(mockAnnouncement);

        await createAnnouncement(req, res);

        expect(Shop.findOne).toHaveBeenCalledWith({ _id: 'my_shop_1', owner: 'owner1' });
        expect(Announcement.create).toHaveBeenCalledWith(expect.objectContaining({ shop: 'my_shop_1' }));
        expect(res.status).toHaveBeenCalledWith(201);
    });
});
