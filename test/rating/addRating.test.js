const { addRating } = require('../../controllers/rating');
const Reservation = require('../../models/Reservation');
const Rating = require('../../models/Rating');
const { updateShopRating } = require('../../utils/updateShopRating');

jest.mock('../../models/Reservation');
jest.mock('../../models/Rating');
jest.mock('../../utils/updateShopRating');

const mockRes = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};

describe('addRating controller', () => {

    afterEach(() => {
        jest.clearAllMocks();
    });

    test('✅ should create rating successfully (normal user with reservation)', async () => {
        const req = {
            params: { reservationId: 'res1' },
            body: { score: 5, review: 'Great!' },
            user: { id: 'user1', role: 'user' }
        };
        const res = mockRes();

        Reservation.findById.mockResolvedValue({
            _id: 'res1',
            shop: 'shop1',
            user: 'user1',
            appDate: new Date(Date.now() - 10000) // past
        });

        Rating.countDocuments.mockResolvedValue(0);
        Rating.create.mockResolvedValue({ _id: 'rating1' });

        await addRating(req, res);

        expect(Rating.create).toHaveBeenCalled();
        expect(updateShopRating).toHaveBeenCalledWith('shop1');
        expect(res.status).toHaveBeenCalledWith(201);
    });

    test('❌ should return 404 if reservation not found', async () => {
        const req = {
            params: { reservationId: 'badId' },
            user: { id: 'user1', role: 'user' }
        };
        const res = mockRes();

        Reservation.findById.mockResolvedValue(null);

        await addRating(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
    });

    test('❌ should block unauthorized user', async () => {
        const req = {
            params: { reservationId: 'res1' },
            user: { id: 'user2', role: 'user' }
        };
        const res = mockRes();

        Reservation.findById.mockResolvedValue({
            _id: 'res1',
            shop: 'shop1',
            user: 'user1',
            appDate: new Date(Date.now() - 10000)
        });

        await addRating(req, res);

        expect(res.status).toHaveBeenCalledWith(401);
    });

    test('❌ should block rating future reservation', async () => {
        const req = {
            params: { reservationId: 'res1' },
            user: { id: 'user1', role: 'user' }
        };
        const res = mockRes();

        Reservation.findById.mockResolvedValue({
            _id: 'res1',
            shop: 'shop1',
            user: 'user1',
            appDate: new Date(Date.now() + 10000) // future
        });

        await addRating(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
    });

    test('❌ should block if user exceeds 5 reviews', async () => {
        const req = {
            params: { reservationId: 'res1' },
            user: { id: 'user1', role: 'user' }
        };
        const res = mockRes();

        Reservation.findById.mockResolvedValue({
            _id: 'res1',
            shop: 'shop1',
            user: 'user1',
            appDate: new Date(Date.now() - 10000)
        });

        Rating.countDocuments.mockResolvedValue(5);

        await addRating(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
    });

    test('❌ should require reservation for non-admin', async () => {
        const req = {
            params: {},
            body: { shop: 'shop1' },
            user: { id: 'user1', role: 'user' }
        };
        const res = mockRes();

        await addRating(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
    });

    test('✅ admin can create rating without reservation', async () => {
        const req = {
            params: {},
            body: { shop: 'shop1', score: 4, review: 'ok' },
            user: { id: 'admin1', role: 'admin' }
        };
        const res = mockRes();

        Rating.create.mockResolvedValue({ _id: 'rating1' });

        await addRating(req, res);

        expect(res.status).toHaveBeenCalledWith(201);
    });

    test('❌ should return 500 on unexpected error', async () => {
        const req = {
            params: { reservationId: 'res1' },
            user: { id: 'user1', role: 'user' }
        };
        const res = mockRes();

        Reservation.findById.mockRejectedValue(new Error('DB error'));

        await addRating(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
    });

});