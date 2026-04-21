const { addRating } = require('../../controllers/ratings');
const Rating = require('../../models/Rating');
const Reservation = require('../../models/Reservation');
const { updateShopRating } = require('../../utils/updateShopRating');

jest.mock('../../models/Rating');
jest.mock('../../models/Reservation');
jest.mock('../../utils/updateShopRating');

const mockRes = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};

describe('addRating', () => {

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should create a rating successfully (valid reservation)', async () => {
        const req = {
            params: { reservationId: 'res123' },
            body: { score: 5, review: 'Nice' },
            user: { id: 'user1', role: 'user' }
        };

        const res = mockRes();

        const mockReservation = {
            _id: 'res123',
            user: 'user1',
            shop: 'shop1',
            appDate: new Date('2020-01-01') // past date
        };

        const mockRating = {
            _id: 'rate1',
            score: 5,
            review: 'Nice'
        };

        Reservation.findById.mockResolvedValue(mockReservation);
        Rating.countDocuments.mockResolvedValue(0);
        Rating.create.mockResolvedValue(mockRating);

        await addRating(req, res);

        expect(Rating.create).toHaveBeenCalledWith({
            user: 'user1',
            shop: 'shop1',
            reservation: 'res123',
            score: 5,
            review: 'Nice'
        });

        expect(updateShopRating).toHaveBeenCalledWith('shop1');

        expect(res.status).toHaveBeenCalledWith(201);
    });

    it('should return 404 if reservation not found', async () => {
        const req = {
            params: { reservationId: 'badId' },
            body: {},
            user: { id: 'user1', role: 'user' }
        };

        const res = mockRes();

        Reservation.findById.mockResolvedValue(null);

        await addRating(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should return 401 if user not owner of reservation', async () => {
        const req = {
            params: { reservationId: 'res123' },
            body: {},
            user: { id: 'user2', role: 'user' }
        };

        const res = mockRes();

        Reservation.findById.mockResolvedValue({
            _id: 'res123',
            user: 'user1',
            shop: 'shop1',
            appDate: new Date('2020-01-01')
        });

        await addRating(req, res);

        expect(res.status).toHaveBeenCalledWith(401);
    });

    it('should return 400 if reservation is in the future', async () => {
        const req = {
            params: { reservationId: 'res123' },
            body: {},
            user: { id: 'user1', role: 'user' }
        };

        const res = mockRes();

        Reservation.findById.mockResolvedValue({
            _id: 'res123',
            user: 'user1',
            shop: 'shop1',
            appDate: new Date('2999-01-01') // future
        });

        await addRating(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 400 if user exceeded rating limit', async () => {
        const req = {
            params: { reservationId: 'res123' },
            body: {},
            user: { id: 'user1', role: 'user' }
        };

        const res = mockRes();

        Reservation.findById.mockResolvedValue({
            _id: 'res123',
            user: 'user1',
            shop: 'shop1',
            appDate: new Date('2020-01-01')
        });

        Rating.countDocuments.mockResolvedValue(5);

        await addRating(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 400 if no reservation and not admin', async () => {
        const req = {
            params: {},
            body: {},
            user: { id: 'user1', role: 'user' }
        };

        const res = mockRes();

        await addRating(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 500 if error occurs', async () => {
        const req = {
            params: { reservationId: 'res123' },
            body: {},
            user: { id: 'user1', role: 'user' }
        };

        const res = mockRes();

        Reservation.findById.mockRejectedValue(new Error('DB error'));

        await addRating(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
    });
});