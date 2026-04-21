const { sendMessage } = require('../../controllers/messages');
const Message = require('../../models/Message');

// Mock Pusher
jest.mock('pusher', () => {
  return jest.fn().mockImplementation(() => ({
    trigger: jest.fn().mockResolvedValue(true)
  }));
});

jest.mock('../../models/Message');

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('sendMessage', () => {

  it('should send message and trigger pusher events', async () => {
    const req = {
      body: {
        roomId: 'shop1_user1',
        text: 'Hello!'
      },
      user: { id: 'user1' }
    };

    const res = mockRes();

    const mockMessage = {
      _id: 'msg1',
      text: 'Hello!',
      room: 'shop1_user1',
      user: {
        _id: 'user1',
        name: 'John',
        profilePicture: 'pic.jpg'
      },
      createdAt: new Date(),
      populate: jest.fn().mockResolvedValue(true)
    };

    Message.create.mockResolvedValue(mockMessage);

    await sendMessage(req, res);

    expect(Message.create).toHaveBeenCalledWith({
      room: 'shop1_user1',
      user: 'user1',
      text: 'Hello!'
    });

    expect(mockMessage.populate).toHaveBeenCalled();

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: mockMessage
    });
  });

  it('should return 500 if error occurs', async () => {
    const req = {
      body: { roomId: 'shop1_user1', text: 'Hello!' },
      user: { id: 'user1' }
    };

    const res = mockRes();

    Message.create.mockRejectedValue(new Error('DB error'));

    await sendMessage(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Cannot send message"
    });
  });

});