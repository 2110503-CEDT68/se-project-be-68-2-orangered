const { deleteAnnouncement } = require('../../controllers/announcements');
const Announcement = require('../../models/Announcement');

jest.mock('../../models/Announcement');

const mockRes = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};

describe('deleteAnnouncement', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should delete announcement successfully', async () => {
        const req = {
            params: { id: 'ann1' },
            user: { id: 'owner1', role: 'shopowner' }
        };
        const res = mockRes();

        Announcement.findByIdAndDelete.mockResolvedValue({ _id: 'ann1' });

        await deleteAnnouncement(req, res);

        expect(Announcement.findByIdAndDelete).toHaveBeenCalledWith('ann1');
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ success: true, message: 'ลบสำเร็จ' });
    });

    it('should return 404 if announcement not found', async () => {
        const req = {
            params: { id: 'nonexistent' },
            user: { id: 'owner1', role: 'shopowner' }
        };
        const res = mockRes();

        Announcement.findByIdAndDelete.mockResolvedValue(null);

        await deleteAnnouncement(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Announcement not found' });
    });

    it('should return 400 if a database error occurs', async () => {
        const req = {
            params: { id: 'ann1' },
            user: { id: 'owner1', role: 'shopowner' }
        };
        const res = mockRes();

        Announcement.findByIdAndDelete.mockRejectedValue(new Error('DB error'));

        await deleteAnnouncement(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
    });
});
