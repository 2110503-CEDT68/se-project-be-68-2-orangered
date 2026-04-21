const { deleteRating } = require('../../controllers/ratings');
const Rating = require('../../models/Rating');
const { updateShopRating } = require('../../utils/updateShopRating');

jest.mock('../../models/Rating');
jest.mock('../../utils/updateShopRating');

const mockRes = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};

describe('deleteRating', () => {

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should delete rating successfully (owner)', async () => {
        const req = {
            params: { id: 'rate1' },
            user: { id: 'user1', role: 'user' }
        };

        const res = mockRes();

        const mockRating = {
            _id: 'rate1',
            user: { toString: () => 'user1' },
            shop: 'shop1',
            deleteOne: jest.fn().mockResolvedValue()
        };

        Rating.findById.mockResolvedValue(mockRating);

        await deleteRating(req, res);

        expect(mockRating.deleteOne).toHaveBeenCalled();
        expect(updateShopRating).toHaveBeenCalledWith('shop1');
        expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should return 404 if rating not found', async () => {
        const req = {
            params: { id: 'badId' },
            user: { id: 'user1', role: 'user' }
        };

        const res = mockRes();

        Rating.findById.mockResolvedValue(null);

        await deleteRating(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should return 401 if not owner', async () => {
        const req = {
            params: { id: 'rate1' },
            user: { id: 'user2', role: 'user' }
        };

        const res = mockRes();

        Rating.findById.mockResolvedValue({
            _id: 'rate1',
            user: { toString: () => 'user1' },
            shop: 'shop1'
        });

        await deleteRating(req, res);

        expect(res.status).toHaveBeenCalledWith(401);
    });

    it('should allow admin to delete', async () => {
        const req = {
            params: { id: 'rate1' },
            user: { id: 'admin1', role: 'admin' }
        };

        const res = mockRes();

        const mockRating = {
            _id: 'rate1',
            user: { toString: () => 'user1' },
            shop: 'shop1',
            deleteOne: jest.fn().mockResolvedValue()
        };

        Rating.findById.mockResolvedValue(mockRating);

        await deleteRating(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should return 500 on error', async () => {
        const req = {
            params: { id: 'rate1' },
            user: { id: 'user1', role: 'user' }
        };

        const res = mockRes();

        Rating.findById.mockRejectedValue(new Error('DB error'));

        await deleteRating(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
    });
});