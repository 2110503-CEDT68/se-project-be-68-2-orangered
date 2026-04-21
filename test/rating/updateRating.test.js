const { updateRating } = require('../../controllers/ratings');
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

describe('updateRating', () => {

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should update rating successfully (owner)', async () => {
        const req = {
            params: { id: 'rate1' },
            body: { score: 4, review: 'Updated' },
            user: { id: 'user1', role: 'user' }
        };

        const res = mockRes();

        const existingRating = {
            _id: 'rate1',
            user: { toString: () => 'user1' },
            shop: 'shop1'
        };

        const updatedRating = {
            _id: 'rate1',
            score: 4,
            review: 'Updated',
            shop: 'shop1'
        };

        Rating.findById.mockResolvedValue(existingRating);
        Rating.findByIdAndUpdate.mockResolvedValue(updatedRating);

        await updateRating(req, res);

        expect(Rating.findByIdAndUpdate).toHaveBeenCalledWith(
            'rate1',
            { score: 4, review: 'Updated' },
            { new: true, runValidators: true }
        );

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

        await updateRating(req, res);

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

        await updateRating(req, res);

        expect(res.status).toHaveBeenCalledWith(401);
    });

    it('should allow admin to update', async () => {
        const req = {
            params: { id: 'rate1' },
            body: { score: 5, review: 'Admin edit' },
            user: { id: 'admin1', role: 'admin' }
        };

        const res = mockRes();

        Rating.findById.mockResolvedValue({
            _id: 'rate1',
            user: { toString: () => 'user1' },
            shop: 'shop1'
        });

        Rating.findByIdAndUpdate.mockResolvedValue({
            _id: 'rate1',
            score: 5,
            review: 'Admin edit',
            shop: 'shop1'
        });

        await updateRating(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should return 500 on error', async () => {
        const req = {
            params: { id: 'rate1' },
            user: { id: 'user1', role: 'user' }
        };

        const res = mockRes();

        Rating.findById.mockRejectedValue(new Error('DB error'));

        await updateRating(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
    });
});