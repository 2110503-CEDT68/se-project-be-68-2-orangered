const { getRatings } = require('../controllers/ratings'); // adjust path
const Rating = require('../models/Rating');

jest.mock('../models/Rating');

describe('getRatings', () => {
    let req, res;

    beforeEach(() => {
        req = {
            params: {},
            user: null
        };

        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        jest.clearAllMocks();
    });

    it('should get ratings by shopId', async () => {
        req.params.shopId = 'shop123';

        const mockRatings = [{ _id: '1' }];

        Rating.find.mockReturnValue({
            populate: jest.fn().mockReturnThis(),
            populate: jest.fn().mockReturnThis(),
            then: jest.fn((cb) => cb(mockRatings))
        });

        await getRatings(req, res);

        expect(Rating.find).toHaveBeenCalledWith({ shop: 'shop123' });
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            count: mockRatings.length,
            data: mockRatings
        });
    });

    it('should return 401 if no user and no shopId', async () => {
        await getRatings(req, res);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: "Not authorized to access this route"
        });
    });

    it('should get ratings for normal user', async () => {
        req.user = { id: 'user123', role: 'user' };

        const mockRatings = [{ _id: '2' }];

        Rating.find.mockReturnValue({
            populate: jest.fn().mockReturnThis(),
            then: jest.fn((cb) => cb(mockRatings))
        });

        await getRatings(req, res);

        expect(Rating.find).toHaveBeenCalledWith({ user: 'user123' });
        expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should get all ratings for admin', async () => {
        req.user = { id: 'admin123', role: 'admin' };

        const mockRatings = [{ _id: '3' }];

        Rating.find.mockReturnValue({
            populate: jest.fn().mockReturnThis(),
            populate: jest.fn().mockReturnThis(),
            then: jest.fn((cb) => cb(mockRatings))
        });

        await getRatings(req, res);

        expect(Rating.find).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should handle errors', async () => {
        req.user = { id: 'admin123', role: 'admin' };

        Rating.find.mockImplementation(() => {
            throw new Error('DB error');
        });

        await getRatings(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: "Cannot find ratings"
        });
    });
});