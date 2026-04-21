const { getMessages } = require('../../controllers/messages');
const Message = require('../../models/Message');

jest.mock('../../models/Message');

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('getMessages', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should get messages for a room', async () => {
    const req = { params: { roomId: 'room1' } };
    const res = mockRes();

    const mockMessages = [{ text: 'hi' }, { text: 'hello' }];

    const sortMock = jest.fn().mockResolvedValue(mockMessages);
    const populateMock = jest.fn().mockReturnValue({ sort: sortMock });

    Message.find.mockReturnValue({ populate: populateMock });

    await getMessages(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      count: 2,
      data: mockMessages
    });
  });

  it('should return 500 if error occurs', async () => {
    const req = { params: { roomId: 'room1' } };
    const res = mockRes();

    Message.find.mockImplementation(() => {
      throw new Error('DB error');
    });

    await getMessages(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });

});