const { updateAnnouncement } = require('../../controllers/announcements');
const Announcement = require('../../models/Announcement');

jest.mock('../../models/Announcement');

const mockRes = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};

describe('updateAnnouncement', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should update announcement successfully', async () => {
        const req = {
            params: { id: 'ann1' },
            body: { title: 'Updated Title', content: 'Updated content' },
            user: { id: 'owner1', role: 'shopowner' }
        };
        const res = mockRes();

        const mockUpdated = { _id: 'ann1', title: 'Updated Title', content: 'Updated content' };
        Announcement.findByIdAndUpdate.mockResolvedValue(mockUpdated);

        await updateAnnouncement(req, res);

        expect(Announcement.findByIdAndUpdate).toHaveBeenCalledWith(
            'ann1',
            { title: 'Updated Title', content: 'Updated content' },
            { new: true }
        );
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ success: true, data: mockUpdated });
    });

    it('should return 404 if announcement not found', async () => {
        const req = {
            params: { id: 'nonexistent' },
            body: { title: 'Test' },
            user: { id: 'owner1', role: 'shopowner' }
        };
        const res = mockRes();

        Announcement.findByIdAndUpdate.mockResolvedValue(null);

        await updateAnnouncement(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Announcement not found' });
    });

    it('should return 400 if a database error occurs', async () => {
        const req = {
            params: { id: 'ann1' },
            body: {},
            user: { id: 'owner1', role: 'shopowner' }
        };
        const res = mockRes();

        Announcement.findByIdAndUpdate.mockRejectedValue(new Error('DB error'));

        await updateAnnouncement(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
    });
});
